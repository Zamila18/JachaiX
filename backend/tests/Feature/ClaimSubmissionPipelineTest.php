<?php

namespace Tests\Feature;

use App\Jobs\ProcessAnalysisJob;
use App\Models\Claim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClaimSubmissionPipelineTest extends TestCase
{
    use RefreshDatabase;

    public function test_text_submission_creates_claim_and_dispatches_job(): void
    {
        Queue::fake();

        $response = $this->postJson('/api/v1/analyze/text', [
            'text' => 'NASA confirmed the presence of water on the Moon.',
            'language' => 'auto',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('job.input_type', 'text');

        $claimId = (int) $response->json('claim_id');

        $this->assertDatabaseHas('claims', [
            'id' => $claimId,
            'input_type' => 'text',
            'status' => 'pending',
        ]);

        Queue::assertPushed(ProcessAnalysisJob::class, function (ProcessAnalysisJob $job) use ($claimId) {
            return $job->claim->id === $claimId;
        });
    }

    public function test_image_submission_creates_claim_and_dispatches_job(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->image('post.png');

        $response = $this->post('/api/v1/analyze/image', [
            'file' => $file,
            'language' => 'auto',
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('job.input_type', 'image');

        $claimId = (int) $response->json('claim_id');
        $claim = Claim::findOrFail($claimId);

        $this->assertNotNull($claim->file_path);

        Queue::assertPushed(ProcessAnalysisJob::class, function (ProcessAnalysisJob $job) use ($claimId) {
            return $job->claim->id === $claimId;
        });
    }

    public function test_pdf_submission_creates_claim_and_dispatches_job(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('doc.pdf', 200, 'application/pdf');

        $response = $this->post('/api/v1/analyze/pdf', [
            'file' => $file,
            'language' => 'auto',
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('job.input_type', 'pdf');

        $claimId = (int) $response->json('claim_id');
        $claim = Claim::findOrFail($claimId);

        $this->assertNotNull($claim->file_path);

        Queue::assertPushed(ProcessAnalysisJob::class, function (ProcessAnalysisJob $job) use ($claimId) {
            return $job->claim->id === $claimId;
        });
    }
}
