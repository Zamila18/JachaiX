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

class ProcessAnalysisJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public Claim $claim) {}

    public function handle(): void
    {
        try {
            // Update claim status to processing
            $this->claim->update(['status' => 'processing']);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'analysis_started',
                'metadata' => ['job_id' => $this->job->getJobId()],
            ]);

            // STEP 1: OCR (if needed)
            $text = $this->claim->extracted_text ?? $this->claim->raw_input;

            if (in_array($this->claim->input_type, ['image', 'video'])) {
                $text = $this->runOcr($this->claim->raw_input);
                $this->claim->update(['extracted_text' => $text]);
            }

            // STEP 2: Embed + Search Qdrant
            $evidence = $this->searchKnowledgeBase($text);

            // STEP 3: LLM Verdict
            $result = $this->getLlmVerdict($text, $evidence);

            // STEP 4: Save verdict
            $this->claim->update([
                'status'           => 'completed',
                'verdict'          => $result['verdict'],
                'confidence_score' => $result['confidence'],
                'explanation'      => $result['explanation'],
                'sources'          => $result['sources'],
            ]);

            AuditLog::create([
                'claim_id' => $this->claim->id,
                'event'    => 'verdict_ready',
                'metadata' => $result,
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

    private function runOcr(string $input): string
    {
        $response = Http::post(config('jachaix.services.ocr_url') . '/extract', [
            'input' => $input,
        ]);
        return $response->json('text', $input);
    }

    private function searchKnowledgeBase(string $text): array
    {
        $response = Http::post(config('jachaix.services.embedder_url') . '/search', [
            'query'      => $text,
            'collection' => config('jachaix.qdrant.collection'),
            'top_k'      => 5,
        ]);
        return $response->json('results', []);
    }

    private function getLlmVerdict(string $claim, array $evidence): array
    {
        $evidenceText = collect($evidence)->pluck('snippet')->join("\n\n");

        $response = Http::withToken(config('jachaix.llm.api_key'))
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('jachaix.llm.model'),
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a Bangla fact-checking AI. Analyze the claim and evidence. Return JSON with keys: verdict (true/false/misleading/unverified), confidence (0-1), explanation (in Bangla), sources (array of URLs).',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Claim: {$claim}\n\nEvidence:\n{$evidenceText}",
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

        return $response->json('choices.0.message.content')
            ? json_decode($response->json('choices.0.message.content'), true)
            : ['verdict' => 'unverified', 'confidence' => 0, 'explanation' => 'Analysis failed.', 'sources' => []];
    }
}