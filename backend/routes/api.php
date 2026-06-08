<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SavedSearchController;
use App\Http\Controllers\DocsController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\PublicFactCheckController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);
        Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth.jwt');
        Route::get('/me',        [AuthController::class, 'me'])->middleware('auth.jwt');
    });

    // ── Protected user area (authenticated users) ─────────────────────────────
    Route::middleware(['auth.jwt', 'role.user'])->prefix('user')->group(function () {
        Route::get('/profile', fn(\Illuminate\Http\Request $r) => response()->json([
            'user' => $r->attributes->get('auth_user'),
        ]));

        // Profile management
        Route::put('/profile',     [ProfileController::class, 'update']);
        Route::post('/password',   [ProfileController::class, 'changePassword']);
        Route::post('/avatar',     [ProfileController::class, 'setAvatar']);
        Route::delete('/avatar',   [ProfileController::class, 'deleteAvatar']);

        // My Claims (reuses history with verdict/status/q filters)
        Route::get('/claims',      [ActivityController::class, 'history']);

        // Bookmarks
        Route::get('/bookmarks',              [BookmarkController::class, 'index']);
        Route::get('/bookmarks/ids',          [BookmarkController::class, 'ids']);
        Route::post('/bookmarks',             [BookmarkController::class, 'store']);
        Route::delete('/bookmarks/{factCheckId}', [BookmarkController::class, 'destroy']);

        // Notifications
        Route::get('/notifications',              [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/read',   [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);

        // Saved searches
        Route::get('/saved-searches',         [SavedSearchController::class, 'index']);
        Route::post('/saved-searches',        [SavedSearchController::class, 'store']);
        Route::delete('/saved-searches/{id}', [SavedSearchController::class, 'destroy']);
    });

    // ── Activity & analytics (authenticated users) ────────────────────────────
    Route::middleware(['auth.jwt', 'role.user'])->prefix('activity')->group(function () {
        Route::get('/',           [ActivityController::class, 'index']);
        Route::get('/recent',     [ActivityController::class, 'recent']);
        Route::get('/statistics', [ActivityController::class, 'statistics']);
        Route::get('/history',    [ActivityController::class, 'history']);
    });

    Route::middleware(['auth.jwt', 'role.admin'])->prefix('admin-secure')->group(function () {
        Route::get('/dashboard', fn() => response()->json(['message' => 'Admin area']));
    });

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