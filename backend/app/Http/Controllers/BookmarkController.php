<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\PublicFactCheck;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function __construct(private ActivityLogger $activity) {}

    public function index(Request $request): JsonResponse
    {
        $userId  = (int) $request->attributes->get('jwt_sub');
        $perPage = min((int) $request->query('per_page', 15), 100);

        $page = Bookmark::where('user_id', $userId)
            ->with('factCheck:id,slug,title,summary,verdict,coverage_scope,language,cover_image,published_at')
            ->latest('created_at')
            ->paginate($perPage);

        $items = array_map(function (Bookmark $b) {
            $f = $b->factCheck;
            return [
                'bookmark_id'  => $b->id,
                'bookmarked_at'=> $b->created_at?->toIso8601String(),
                'fact_check'   => $f ? [
                    'id'             => $f->id,
                    'slug'           => $f->slug,
                    'title'          => $f->title,
                    'summary'        => $f->summary,
                    'verdict'        => $f->verdict,
                    'coverage_scope' => $f->coverage_scope,
                    'language'       => $f->language,
                    'cover_image'    => $f->cover_image,
                    'published_at'   => $f->published_at?->toIso8601String(),
                ] : null,
            ];
        }, $page->items());

        return response()->json([
            'success' => true,
            'items'   => $items,
            'pagination' => [
                'current_page' => $page->currentPage(),
                'per_page'     => $page->perPage(),
                'total'        => $page->total(),
                'last_page'    => $page->lastPage(),
            ],
        ]);
    }

    public function ids(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        $ids = Bookmark::where('user_id', $userId)->pluck('fact_check_id');
        return response()->json(['success' => true, 'ids' => $ids]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        $validated = $request->validate([
            'fact_check_id' => ['required', 'integer', 'exists:public_fact_checks,id'],
        ]);

        $bookmark = Bookmark::firstOrCreate([
            'user_id'       => $userId,
            'fact_check_id' => $validated['fact_check_id'],
        ]);

        if ($bookmark->wasRecentlyCreated) {
            $fact = PublicFactCheck::find($validated['fact_check_id']);
            $this->activity->log($userId, ActivityLogger::BOOKMARK_CREATED, 'Bookmarked a fact-check', [
                'description' => $fact?->title,
                'entity_type' => 'fact_check',
                'entity_id'   => $validated['fact_check_id'],
            ], $request);
        }

        return response()->json(['success' => true, 'bookmarked' => true], 201);
    }

    public function destroy(Request $request, int $factCheckId): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');

        $deleted = Bookmark::where('user_id', $userId)
            ->where('fact_check_id', $factCheckId)
            ->delete();

        if ($deleted) {
            $this->activity->log($userId, ActivityLogger::BOOKMARK_REMOVED, 'Removed a bookmark', [
                'entity_type' => 'fact_check',
                'entity_id'   => $factCheckId,
            ], $request);
        }

        return response()->json(['success' => true, 'bookmarked' => false]);
    }
}
