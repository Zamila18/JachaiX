<?php

namespace Tests\Feature;

use App\Jobs\ProcessAnalysisJob;
use App\Models\Claim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProcessAnalysisNormalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_process_job_persists_canonical_normalization_and_trust_breakdown(): void
    {
        Http::fake([
            'http://host.docker.internal:11434/v1/chat/completions' => Http::sequence()
                ->push([
                    'choices' => [
                        ['message' => ['content' => '["moon water claim", "nasa moon water"]']],
                    ],
                ], 200)
                ->push([
                    'choices' => [
                        ['message' => ['content' => '{"verdict":"true","confidence":0.82,"explanation":"Multiple sources support the claim.","sources":["https://example.org/source-1"]}']],
                    ],
                ], 200),
            'http://embedder-service:5002/search' => Http::response([
                'results' => [
                    [
                        'score' => 0.91,
                        'text' => 'NASA confirmed water signatures on sunlit lunar regions.',
                        'url' => 'https://example.org/source-1',
                        'title' => 'NASA moon update',
                        'source' => 'Example Source',
                        'reliability_score' => 0.92,
                    ],
                ],
            ], 200),
            'http://reranker-service:5003/rerank' => Http::response([
                'results' => [
                    [
                        'rerank_score' => 0.97,
                        'score' => 0.91,
                        'text' => 'NASA confirmed water signatures on sunlit lunar regions.',
                        'url' => 'https://example.org/source-1',
                        'title' => 'NASA moon update',
                        'source' => 'Example Source',
                        'reliability_score' => 0.92,
                    ],
                ],
            ], 200),
        ]);

        $claim = Claim::create([
            'input_type' => 'text',
            'raw_input' => "NASA confirmed water on the Moon!!!!!",
            'language' => 'auto',
            'status' => 'pending',
        ]);

        (new ProcessAnalysisJob($claim))->handle();

        $claim->refresh();

        $this->assertSame('completed', $claim->status);
        $this->assertNotNull($claim->normalization_data);
        $this->assertSame('text', $claim->normalization_data['modality']);
        $this->assertArrayHasKey('normalized_text', $claim->normalization_data);
        $this->assertArrayHasKey('extraction_confidence', $claim->normalization_data);

        $this->assertNotNull($claim->trust_breakdown);
        $this->assertNotNull($claim->trust_label);
        $this->assertArrayHasKey('evidence_strength', $claim->trust_breakdown);
    }
}
