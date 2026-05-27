<?php

namespace App\Jobs;

use App\Models\Claim;
use App\Models\AuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessAnalysisJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;   // no retries – fail fast to avoid cascade
    public int $timeout = 600;  // 10 min: rewriteQueries(15) + search(5) + rerank(30) + verdict(120)

    public function __construct(public Claim $claim) {}

    public function handle(): void
    {
        try {
            $this->claim->update(['status' => 'processing']);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'analysis_started',
                'metadata' => ['input_type' => $this->claim->input_type],
            ]);

            // ── STEP 1: Extract text based on input type ──────────────────
            $text = match ($this->claim->input_type) {
                'text'  => $this->claim->raw_input,
                'image' => $this->runOcrImage($this->claim->file_path),
                'pdf'   => $this->runOcrPdf($this->claim->file_path),
                default => $this->claim->raw_input,
            };

            $this->claim->update(['extracted_text' => $text]);

            // ── STEP 2: Extract clean verifiable claim ────────────────────
            // For text input the user already typed the claim — skip LLM extraction.
            // Only run extractClaim on image/pdf to clean up noisy OCR output.
            $claimText = ($this->claim->input_type === 'text')
                ? $text
                : $this->extractClaim($text);
            $this->claim->update(['claim_text' => $claimText]);

            // ── STEP 2.5: Query rewriting — generate search variants ─────
            $searchQueries = $this->rewriteQueries($claimText);

            // ── STEP 3: Embed + Search Qdrant (multi-query) ───────────────
            $evidence = $this->searchKnowledgeBase($claimText, $searchQueries);

            // ── STEP 4: Rerank → top 5 ───────────────────────────────────
            $reranked = $this->rerankEvidence($claimText, $evidence);

            // ── STEP 5: LLM Verdict ───────────────────────────────────────
            $result = $this->getLlmVerdict($claimText, $reranked);

            // ── STEP 5.5: Compute weighted trust score ───────────────────────
            $trustScore = $this->computeTrustScore($result, $reranked, $this->claim);

            // ── STEP 6: Save final result ───────────────────────────────────
            $this->claim->update([
                'status'           => 'completed',
                'verdict'          => $result['verdict'],
                'confidence_score' => $trustScore['score'],
                'explanation'      => $result['explanation'],
                'sources'          => $result['sources'] ?? [],
            ]);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'verdict_ready',
                'metadata' => [
                    'verdict'      => $result['verdict'],
                    'confidence'   => $result['confidence'],
                    'trust_score'  => $trustScore['score'],
                    'trust_label'  => $trustScore['label'],
                    'trust_detail' => $trustScore['detail'],
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('ProcessAnalysisJob failed', [
                'claim_id' => $this->claim->id,
                'error'    => $e->getMessage(),
            ]);

            $this->claim->update(['status' => 'failed']);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'error',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            // Do NOT re-throw — marking the claim as failed is sufficient.
            // Re-throwing would crash the worker when failed_jobs has a duplicate UUID.
        }
    }

    // ── STEP 1a: OCR Image ────────────────────────────────────────────────
    private function runOcrImage(string $filePath): string
    {
        $fileContents = Storage::get($filePath);
        $response = Http::attach('file', $fileContents, basename($filePath))
            ->post(config('jachaix.services.ocr_url') . '/ocr/image');

        if ($response->failed()) {
            Log::warning('OCR image failed', ['path' => $filePath]);
            return '';
        }

        return $response->json('result.full_text', '');
    }

    // ── STEP 1b: OCR PDF ──────────────────────────────────────────────────
    private function runOcrPdf(string $filePath): string
    {
        $fileContents = Storage::get($filePath);
        $response = Http::attach('file', $fileContents, basename($filePath))
            ->post(config('jachaix.services.ocr_url') . '/ocr/pdf');

        if ($response->failed()) {
            Log::warning('OCR pdf failed', ['path' => $filePath]);
            return '';
        }

        return $response->json('result.full_text', '');
    }

    // ── STEP 2: Extract clean claim via LLM ─────────────────────────────
    private function extractClaim(string $rawText): string
    {
        $response = Http::timeout(90)
            ->withToken(config('jachaix.llm.api_key'))
            ->baseUrl(config('jachaix.llm.base_url'))
            ->post('chat/completions', [
                'model'      => config('jachaix.llm.model'),
                'stream'     => false,
                'messages'   => [
                    [
                        'role'    => 'system',
                        'content' => 'Your task is text extraction only. Read the user text and output the single main factual claim as one sentence. Output ONLY the claim sentence — no explanation, no verdict, no commentary. Keep the original language (Bangla or English). If the text is already a clear claim, output it as-is.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Text: {$rawText}\n\nOutput the main factual claim sentence:",
                    ],
                ],
                'max_tokens' => 150,
            ]);

        if ($response->failed()) {
            return $rawText;
        }

        $extracted = trim($response->json('choices.0.message.content') ?? $rawText);
        // Fall back to raw input if LLM returned garbage or meta-commentary
        if (empty($extracted) || str_word_count($extracted) < 3) {
            return $rawText;
        }
        $metaPatterns = ["couldn't", "cannot", "can't", "unable to", "no clear", "i don't", "i cannot", "no factual", "not a factual"];
        foreach ($metaPatterns as $pattern) {
            if (stripos($extracted, $pattern) !== false) {
                return $rawText;
            }
        }
        return $extracted;
    }

    // ── STEP 2.5: Query rewriting for better recall ────────────────────────
    private function rewriteQueries(string $claimText): array
    {
        try {
            $response = Http::timeout(15)
                ->withToken(config('jachaix.llm.api_key'))
                ->baseUrl(config('jachaix.llm.base_url'))
                ->post('chat/completions', [
                    'model'    => config('jachaix.llm.model'),
                    'stream'   => false,
                    'messages' => [
                        [
                            'role'    => 'system',
                            'content' => 'Generate 2 short search queries to retrieve evidence for the given claim. Output ONLY a JSON array of 2 strings. Keep the same language as the claim.',
                        ],
                        [
                            'role'    => 'user',
                            'content' => "Claim: {$claimText}\n\nOutput exactly 2 search queries as a JSON array:",
                        ],
                    ],
                    'max_tokens' => 100,
                ]);

            if ($response->failed()) {
                return [];
            }

            $content = trim($response->json('choices.0.message.content', ''));
            $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
            $content = preg_replace('/\s*```$/', '', $content);

            if (preg_match('/\[.*\]/s', $content, $m)) {
                $queries = json_decode($m[0], true);
                if (is_array($queries) && count($queries) > 0) {
                    return array_slice(array_filter($queries, fn($q) => is_string($q) && strlen($q) > 3), 0, 2);
                }
            }

            return [];
        } catch (\Throwable $e) {
            // Timeout or error on query rewriting — fall back to empty (search with raw claim)
            Log::warning('rewriteQueries failed, using raw claim text for search: ' . $e->getMessage());
            return [];
        }
    }

    // ── STEP 3: Embed + Qdrant search (multi-query) ───────────────────────────
    private function searchKnowledgeBase(string $text, array $extraQueries = []): array
    {
        $allResults = [];
        $seen       = [];
        $queries    = array_unique(array_merge([$text], $extraQueries));

        foreach ($queries as $query) {
            $response = Http::timeout(30)
                ->post(config('jachaix.services.embedder_url') . '/search', [
                    'query' => $query,
                    'top_k' => 10,
                ]);

            if ($response->failed()) {
                Log::warning('Knowledge base search failed', ['query' => $query]);
                continue;
            }

            foreach ($response->json('results', []) as $result) {
                // Discard results below similarity threshold — avoids passing
                // unrelated chunks to the LLM when the claim is unknown.
                if (($result['score'] ?? 0.0) < 0.45) {
                    continue;
                }
                $dedupeKey = $result['url'] ?? $result['text'] ?? json_encode($result);
                if (!isset($seen[$dedupeKey])) {
                    $seen[$dedupeKey] = true;
                    $allResults[]     = $result;
                }
            }
        }

        if (empty($allResults)) {
            Log::info('No evidence above similarity threshold', ['claim' => mb_substr($text, 0, 80)]);
        }

        // Return up to 15 for reranker to pick from
        return array_slice($allResults, 0, 15);
    }

    // ── STEP 4: Rerank evidence ───────────────────────────────────────────
    private function rerankEvidence(string $claim, array $evidence): array
    {
        if (empty($evidence)) return [];

        $response = Http::timeout(30)
            ->post(config('jachaix.services.reranker_url') . '/rerank', [
                'query'     => $claim,
                'documents' => $evidence,
                'top_k'     => 5,
            ]);

        if ($response->failed()) {
            Log::warning('Reranker failed, using original order');
            return array_slice($evidence, 0, 5);
        }

        return $response->json('results', array_slice($evidence, 0, 5));
    }

    // ── STEP 5: LLM Verdict ───────────────────────────────────────────────
    private function getLlmVerdict(string $claim, array $evidence): array
    {
        $evidenceText = collect($evidence)
            ->map(fn($e) => "Source: " . ($e['url'] ?? 'unknown') . "\n" . ($e['text'] ?? $e['snippet'] ?? ''))
            ->join("\n\n---\n\n");

        $hasEvidence = !empty($evidence);

        $userPrompt = $hasEvidence
            ? "Claim: {$claim}\n\nEvidence:\n{$evidenceText}\n\nReturn ONLY valid JSON with keys: verdict, confidence, explanation, sources."
            : "Claim: {$claim}\n\nEvidence: No relevant evidence found in knowledge base.\n\nReturn ONLY valid JSON with keys: verdict, confidence, explanation, sources.";

        try {
            $response = Http::timeout(120)
                ->withToken(config('jachaix.llm.api_key'))
                ->baseUrl(config('jachaix.llm.base_url'))
                ->post('chat/completions', [
                'model'    => config('jachaix.llm.model'),
                'stream'   => false,
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a Bangla and English fact-checking AI. Analyze the claim against the provided evidence. You MUST respond with ONLY a valid JSON object — no markdown, no explanation outside the JSON. The JSON must have exactly these keys: "verdict" (one of: "true", "false", "misleading", "unverified"), "confidence" (float 0.0-1.0), "explanation" (2-3 sentences), "sources" (array of URLs). Be conservative — if evidence is weak or missing, use "unverified" with low confidence.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $userPrompt,
                    ],
                ],
                'max_tokens' => 500,
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::warning('getLlmVerdict: LLM connection failed: ' . $e->getMessage());
            return [
                'verdict'     => 'unverified',
                'confidence'  => 0.0,
                'explanation' => 'Analysis service temporarily unavailable.',
                'sources'     => [],
            ];
        }

        if ($response->failed()) {
            return [
                'verdict'     => 'unverified',
                'confidence'  => 0.0,
                'explanation' => 'Analysis service unavailable.',
                'sources'     => [],
            ];
        }

        $content = $response->json('choices.0.message.content', '');
        // Strip markdown code fences if present
        $content = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
        $content = preg_replace('/\s*```$/', '', $content);
        // Extract first JSON object from content
        if (preg_match('/\{.*\}/s', $content, $matches)) {
            $decoded = json_decode($matches[0], true);
        } else {
            $decoded = json_decode($content, true);
        }

        if (!is_array($decoded) || !isset($decoded['verdict'])) {
            return [
                'verdict'     => 'unverified',
                'confidence'  => 0.0,
                'explanation' => 'Analysis could not be completed.',
                'sources'     => [],
            ];
        }

        return [
            'verdict'     => $decoded['verdict'] ?? 'unverified',
            'confidence'  => (float)($decoded['confidence'] ?? 0.0),
            'explanation' => $decoded['explanation'] ?? '',
            'sources'     => $decoded['sources'] ?? [],
        ];
    }

    // ── STEP 5.5: Weighted trust score ─────────────────────────────────────
    /**
     * Weighted trust score formula (senior's design):
     *   evidence strength  35%  — how many strong evidence pieces were found
     *   source reliability 20%  — average reliability of matched sources
     *   claim confidence   15%  — LLM confidence from verdict step
     *   language clarity   10%  — is claim language clear / non-noisy
     *   evidence coverage  10%  — how many of top_k were actually relevant
     *   verdict alignment  10%  — penalty for "unverified" verdict
     *
     * Labels:
     *   >= 0.75 → Trustworthy
     *   0.45-0.74 → Uncertain
     *   0.20-0.44 → Suspicious
     *   < 0.20 → Needs Review
     */
    private function computeTrustScore(array $result, array $evidence, Claim $claim): array
    {
        $llmConfidence = (float)($result['confidence'] ?? 0.0);
        $verdict       = $result['verdict'] ?? 'unverified';

        // Evidence strength: score based on count (up to 5 pieces = full score)
        $evidenceCount    = count($evidence);
        $evidenceStrength = min($evidenceCount / 5.0, 1.0);

        // Source reliability: average of reliability_score from payloads
        $reliabilities = array_filter(array_map(
            fn($e) => $e['reliability_score'] ?? $e['score'] ?? null,
            $evidence
        ), fn($v) => $v !== null && $v <= 1.0);
        $avgReliability = count($reliabilities) > 0
            ? array_sum($reliabilities) / count($reliabilities)
            : 0.5; // neutral default if no metadata

        // Language clarity: penalise very short or very long claim texts
        $claimLen      = mb_strlen($claim->claim_text ?? '');
        $langClarity   = match(true) {
            $claimLen < 10  => 0.2,
            $claimLen < 20  => 0.6,
            $claimLen > 500 => 0.7,
            default         => 1.0,
        };

        // Evidence coverage: fraction of returned chunks that have high reranker score
        // (We use evidence count as proxy — reranker already filtered best ones)
        $coverage = min($evidenceCount / 3.0, 1.0);

        // Verdict alignment: "true"/"false" carry full weight; "misleading" partial; "unverified" penalised
        $verdictWeight = match($verdict) {
            'true'        => 1.0,
            'false'       => 0.9,   // false is a strong verdict too
            'misleading'  => 0.75,
            'unverified'  => 0.3,
            default       => 0.5,
        };

        // Weighted sum
        $score = (
            $evidenceStrength * 0.35 +
            $avgReliability   * 0.20 +
            $llmConfidence    * 0.15 +
            $langClarity      * 0.10 +
            $coverage         * 0.10 +
            $verdictWeight    * 0.10
        );

        $score = round(min(max($score, 0.0), 1.0), 4);

        $label = match(true) {
            $score >= 0.75 => 'Trustworthy',
            $score >= 0.45 => 'Uncertain',
            $score >= 0.20 => 'Suspicious',
            default        => 'Needs Review',
        };

        return [
            'score'  => $score,
            'label'  => $label,
            'detail' => [
                'evidence_strength' => round($evidenceStrength, 3),
                'avg_reliability'   => round($avgReliability, 3),
                'llm_confidence'    => round($llmConfidence, 3),
                'lang_clarity'      => round($langClarity, 3),
                'coverage'          => round($coverage, 3),
                'verdict_weight'    => round($verdictWeight, 3),
            ],
        ];
    }
}