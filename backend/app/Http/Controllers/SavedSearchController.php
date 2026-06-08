<?php

namespace App\Http\Controllers;

use App\Models\SavedSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');

        $items = SavedSearch::where('user_id', $userId)
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(fn (SavedSearch $s) => [
                'id'         => $s->id,
                'query'      => $s->query,
                'filters'    => $s->filters,
                'created_at' => $s->created_at?->toIso8601String(),
            ]);

        return response()->json(['success' => true, 'items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');

        $validated = $request->validate([
            'query'   => ['required', 'string', 'max:255'],
            'filters' => ['nullable', 'array'],
        ]);

        // De-dupe identical queries for the same user.
        $existing = SavedSearch::where('user_id', $userId)
            ->where('query', $validated['query'])
            ->first();
        if ($existing) {
            return response()->json(['success' => true, 'item' => $existing, 'duplicate' => true]);
        }

        $search = SavedSearch::create([
            'user_id' => $userId,
            'query'   => $validated['query'],
            'filters' => $validated['filters'] ?? null,
        ]);

        return response()->json(['success' => true, 'item' => $search], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        SavedSearch::where('user_id', $userId)->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
