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

    public int $tries   = 3;
    public int $timeout = 120;

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

            // ── STEP 3: Embed + Search Qdrant for top 10 evidence ─────────
            $evidence = $this->searchKnowledgeBase($claimText);

            // ── STEP 4: Rerank → top 5 ───────────────────────────────────
            $reranked = $this->rerankEvidence($claimText, $evidence);

            // ── STEP 5: LLM Verdict ───────────────────────────────────────
            $result = $this->getLlmVerdict($claimText, $reranked);

            // ── STEP 6: Save final result ─────────────────────────────────
            $this->claim->update([
                'status'           => 'completed',
                'verdict'          => $result['verdict'],
                'confidence_score' => $result['confidence'],
                'explanation'      => $result['explanation'],
                'sources'          => $result['sources'] ?? [],
            ]);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'verdict_ready',
                'metadata' => [
                    'verdict'    => $result['verdict'],
                    'confidence' => $result['confidence'],
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

            throw $e;
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

    // ── STEP 3: Embed + Qdrant search ─────────────────────────────────────
    private function searchKnowledgeBase(string $text): array
    {
        $response = Http::timeout(30)
            ->post(config('jachaix.services.embedder_url') . '/search', [
                'query' => $text,
                'top_k' => 10,
            ]);

        if ($response->failed()) {
            Log::warning('Knowledge base search failed');
            return [];
        }

        return $response->json('results', []);
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

        $response = Http::timeout(120)
            ->withToken(config('jachaix.llm.api_key'))
            ->baseUrl(config('jachaix.llm.base_url'))
            ->post('chat/completions', [
                'model'    => config('jachaix.llm.model'),
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
}