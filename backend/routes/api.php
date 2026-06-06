<?php

use App\Http\Controllers\ClaimController;
use App\Http\Controllers\DocsController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\PublicFactCheckController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status'  => 'ok',
            'service' => 'JachaiX API',
            'version' => '1.0.0',
        ]);
    });

    // Modality-specific endpoints (preferred)
    Route::post('/analyze/text', [ClaimController::class, 'analyzeText']);
    Route::post('/analyze/image', [ClaimController::class, 'analyzeImage']);
    Route::post('/analyze/pdf', [ClaimController::class, 'analyzePdf']);
    Route::post('/analyze/url', [ClaimController::class, 'analyzeUrl']);

    // Claims
    Route::post('/claims', [ClaimController::class, 'submit']);
    Route::get('/claims/{id}/status', [ClaimController::class, 'status']);
    Route::get('/claims/{id}/result', [ClaimController::class, 'result']);
    Route::post('/claims/{id}/review-request', [ClaimController::class, 'submitReviewRequest']);
    Route::post('/claims/{id}/feedback', [ClaimController::class, 'submitFeedback']);

    // Public Fact-Check Hub (MVP)
    Route::get('/public/fact-checks', [PublicFactCheckController::class, 'index']);
    Route::get('/public/fact-checks/featured', [PublicFactCheckController::class, 'featured']);
    Route::get('/public/fact-checks/{slug}', [PublicFactCheckController::class, 'show']);

    // Editorial/Admin (MVP no-auth routes; secure before production)
    Route::get('/admin/fact-checks/completed-claims', [PublicFactCheckController::class, 'completedClaimsQueue']);
    Route::post('/admin/fact-checks/from-claim/{claimId}', [PublicFactCheckController::class, 'publishFromClaim']);
    Route::patch('/admin/fact-checks/{id}', [PublicFactCheckController::class, 'update']);
    Route::post('/admin/fact-checks/{id}/publish', [PublicFactCheckController::class, 'setPublished']);
    Route::post('/admin/fact-checks/{id}/unpublish', [PublicFactCheckController::class, 'setUnpublished']);
    Route::post('/admin/fact-checks/import/external', [PublicFactCheckController::class, 'importExternal']);

    // Live docs module (public + admin)
    Route::get('/docs', [DocsController::class, 'showPublic']);
    Route::get('/admin/docs', [DocsController::class, 'showAdmin']);
    Route::patch('/admin/docs', [DocsController::class, 'update']);
    Route::post('/admin/docs/visibility', [DocsController::class, 'updateVisibility']);
    Route::post('/admin/docs/schedule', [DocsController::class, 'updateSchedule']);

    // Evaluation metrics (latest benchmark reports)
    Route::get('/admin/evaluation/latest', [EvaluationController::class, 'latest']);

    Route::get('/knowledge-base/status', function () {
        $statusPath = storage_path('app/knowledge_base_refresh.json');

        if (!file_exists($statusPath)) {
            return response()->json([
                'success' => true,
                'knowledge_base' => [
                    'status' => 'never_refreshed',
                    'refreshed_at_utc' => null,
                    'raw_article_files' => 0,
                    'chunker_pattern' => '*.json',
                ],
            ]);
        }

        $contents = (string) file_get_contents($statusPath);
        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents) ?? $contents;
        $payload = json_decode($contents, true) ?: [];

        return response()->json([
            'success' => true,
            'knowledge_base' => array_merge([
                'status' => 'fresh',
            ], $payload),
        ]);
    });
});