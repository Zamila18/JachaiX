<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Claim;
use App\Models\PublicFactCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicFactCheckController extends Controller
{
    public function completedClaimsQueue(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'sometimes|string|max:200',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = Claim::query()
            ->where('status', 'completed')
            ->orderByDesc('id');

        if (!empty($validated['q'])) {
            $search = trim((string) $validated['q']);
            $query->where(function ($inner) use ($search) {
                $inner->where('claim_text', 'like', '%' . $search . '%')
                    ->orWhere('raw_input', 'like', '%' . $search . '%')
                    ->orWhere('explanation', 'like', '%' . $search . '%');
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 20);
        $paginator = $query->paginate($perPage);
        $claims = $paginator->getCollection();

        $claimIds = $claims->pluck('id')->all();

        $factChecksByClaim = PublicFactCheck::query()
            ->whereIn('claim_id', $claimIds)
            ->get()
            ->keyBy('claim_id');

        // Latest human-review request (the user's question) per claim, if any.
        $reviewRequestsByClaim = AuditLog::query()
            ->where('event', 'human_review_requested')
            ->whereIn('claim_id', $claimIds)
            ->orderByDesc('id')
            ->get()
            ->groupBy('claim_id');

        return response()->json([
            'success' => true,
            'items' => $claims->map(function (Claim $claim) use ($factChecksByClaim, $reviewRequestsByClaim) {
                /** @var PublicFactCheck|null $fact */
                $fact = $factChecksByClaim->get($claim->id);
                /** @var AuditLog|null $req */
                $req = optional($reviewRequestsByClaim->get($claim->id))->first();

                return [
                    'claim_id' => $claim->id,
                    'status' => $claim->status,
                    'claim_text' => $claim->claim_text,
                    'raw_input' => $claim->raw_input,
                    'language' => $claim->language,
                    'verdict' => $claim->verdict,
                    'confidence_score' => $claim->confidence_score,
                    'explanation' => $claim->explanation,
                    'created_at' => optional($claim->created_at)?->toIso8601String(),
                    'is_published' => (bool) ($fact && $fact->status === 'published' && $fact->published_at),
                    'review_request' => $this->reviewRequestPayload($req),
                    'fact_check' => $fact ? [
                        'id' => $fact->id,
                        'title' => $fact->title,
                        'slug' => $fact->slug,
                        'coverage_scope' => $fact->coverage_scope,
                        'is_featured' => $fact->is_featured,
                        'tags' => $fact->tags ?? [],
                        'status' => $fact->status,
                        'published_at' => optional($fact->published_at)?->toIso8601String(),
                    ] : null,
                ];
            })->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Shape a human-review request AuditLog into the {reason, notes, ...} payload
     * consumed by the admin queue, the claim result page and the public fact page.
     */
    private function reviewRequestPayload(?AuditLog $req): ?array
    {
        if (!$req) {
            return null;
        }

        $meta = is_array($req->metadata) ? $req->metadata : [];
        $reason = trim((string) ($meta['reason'] ?? ''));
        $notes = trim((string) ($meta['notes'] ?? ''));

        if ($reason === '' && $notes === '') {
            return null;
        }

        return [
            'reason' => $reason !== '' ? $reason : null,
            'notes' => $notes !== '' ? $notes : null,
            'reporter_name' => ($meta['reporter_name'] ?? null) ?: null,
            'requested_at' => $meta['requested_at'] ?? optional($req->created_at)?->toIso8601String(),
        ];
    }

    private function latestReviewRequest(?int $claimId): ?AuditLog
    {
        if (!$claimId) {
            return null;
        }

        return AuditLog::query()
            ->where('event', 'human_review_requested')
            ->where('claim_id', $claimId)
            ->orderByDesc('id')
            ->first();
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scope' => 'sometimes|string|in:bangladesh,international',
            'verdict' => 'sometimes|string|max:30',
            'language' => 'sometimes|string|max:20',
            'q' => 'sometimes|string|max:200',
            'origin' => 'sometimes|string|in:internal,external',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        $query = PublicFactCheck::query()->published()->orderByDesc('published_at')->orderByDesc('id');

        if (!empty($validated['scope'])) {
            $query->where('coverage_scope', $validated['scope']);
        }

        if (!empty($validated['verdict'])) {
            $query->where('verdict', Str::lower($validated['verdict']));
        }

        if (!empty($validated['language'])) {
            $query->where('language', Str::lower($validated['language']));
        }

        if (!empty($validated['origin'])) {
            $query->where('origin', Str::lower($validated['origin']));
        }

        if (!empty($validated['q'])) {
            $search = trim((string) $validated['q']);
            $query->where(function ($inner) use ($search) {
                $inner->where('title', 'like', '%' . $search . '%')
                    ->orWhere('summary', 'like', '%' . $search . '%')
                    ->orWhere('claim_text', 'like', '%' . $search . '%');
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 12);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'items' => $paginator->getCollection()->map(fn (PublicFactCheck $item) => $this->toListPayload($item))->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function featured(): JsonResponse
    {
        $items = PublicFactCheck::query()
            ->published()
            ->where('is_featured', true)
            ->orderByDesc('published_at')
            ->limit(8)
            ->get()
            ->map(fn (PublicFactCheck $item) => $this->toListPayload($item))
            ->values();

        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $item = PublicFactCheck::query()->published()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'success' => true,
            'item' => [
                'id' => $item->id,
                'slug' => $item->slug,
                'title' => $item->title,
                'summary' => $item->summary,
                'claim_text' => $item->claim_text,
                'explanation' => $item->explanation,
                'verdict' => $item->verdict,
                'confidence_score' => $item->confidence_score,
                'language' => $item->language,
                'coverage_scope' => $item->coverage_scope,
                'origin' => $item->origin,
                'source_name' => $item->source_name,
                'source_url' => $item->source_url,
                'is_featured' => $item->is_featured,
                'cover_image' => $item->cover_image,
                'tags' => $item->tags ?? [],
                'sources' => $item->sources ?? [],
                'published_at' => optional($item->published_at)?->toIso8601String(),
                'review_request' => $this->reviewRequestPayload($this->latestReviewRequest($item->claim_id)),
            ],
        ]);
    }

    public function publishFromClaim(Request $request, int $claimId): JsonResponse
    {
        $claim = Claim::findOrFail($claimId);
        if ($claim->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Only completed claims can be published.',
            ], 422);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:300',
            'summary' => 'sometimes|string|max:2000',
            'coverage_scope' => 'sometimes|string|in:bangladesh,international',
            'language' => 'sometimes|string|max:20',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:60',
            'is_featured' => 'sometimes|boolean',
            'published_by' => 'sometimes|string|max:100',
            'status' => 'sometimes|string|in:draft,review,published',
        ]);

        $title = trim((string) ($validated['title'] ?? $claim->claim_text ?? $claim->raw_input ?? ('Claim ' . $claim->id)));
        $slug = $this->uniqueSlug($title, PublicFactCheck::query()->where('claim_id', '!=', $claim->id)->pluck('slug')->all());
        $status = (string) ($validated['status'] ?? 'published');

        $fact = PublicFactCheck::query()->updateOrCreate(
            ['claim_id' => $claim->id],
            [
                'origin' => 'internal',
                'title' => $title,
                'slug' => $slug,
                'summary' => $validated['summary'] ?? $claim->explanation,
                'claim_text' => $claim->claim_text,
                'explanation' => $claim->explanation,
                'verdict' => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'language' => Str::lower((string) ($validated['language'] ?? $claim->language ?? 'bn')),
                'coverage_scope' => Str::lower((string) ($validated['coverage_scope'] ?? 'bangladesh')),
                'status' => $status,
                'is_featured' => (bool) ($validated['is_featured'] ?? false),
                'tags' => $validated['tags'] ?? [],
                'sources' => is_array($claim->sources) ? $claim->sources : [],
                'published_by' => $validated['published_by'] ?? 'system',
                'published_at' => $status === 'published' ? now() : null,
            ]
        );

        return response()->json([
            'success' => true,
            'item' => $this->toListPayload($fact),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $fact = PublicFactCheck::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:300',
            'summary' => 'sometimes|string|max:2000',
            'claim_text' => 'sometimes|string',
            'explanation' => 'sometimes|string',
            'verdict' => 'sometimes|string|max:30',
            'confidence_score' => 'sometimes|numeric|min:0|max:1',
            'language' => 'sometimes|string|max:20',
            'coverage_scope' => 'sometimes|string|in:bangladesh,international',
            'status' => 'sometimes|string|in:draft,review,published',
            'is_featured' => 'sometimes|boolean',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:60',
            'source_name' => 'sometimes|string|max:120',
            'source_url' => 'sometimes|string|max:500',
            'published_by' => 'sometimes|string|max:100',
        ]);

        if (isset($validated['title'])) {
            $fact->title = trim((string) $validated['title']);
            $fact->slug = $this->uniqueSlug($fact->title, PublicFactCheck::query()->where('id', '!=', $fact->id)->pluck('slug')->all());
        }

        foreach (['summary', 'claim_text', 'explanation', 'verdict', 'confidence_score', 'source_name', 'source_url', 'published_by'] as $field) {
            if (array_key_exists($field, $validated)) {
                $fact->{$field} = $validated[$field];
            }
        }

        if (isset($validated['language'])) {
            $fact->language = Str::lower((string) $validated['language']);
        }

        if (isset($validated['coverage_scope'])) {
            $fact->coverage_scope = Str::lower((string) $validated['coverage_scope']);
        }

        if (array_key_exists('is_featured', $validated)) {
            $fact->is_featured = (bool) $validated['is_featured'];
        }

        if (array_key_exists('tags', $validated)) {
            $fact->tags = $validated['tags'] ?? [];
        }

        if (isset($validated['status'])) {
            $fact->status = $validated['status'];
            $fact->published_at = $validated['status'] === 'published' ? ($fact->published_at ?? now()) : null;
        }

        $fact->save();

        return response()->json([
            'success' => true,
            'item' => $this->toListPayload($fact),
        ]);
    }

    public function setPublished(Request $request, int $id): JsonResponse
    {
        $fact = PublicFactCheck::findOrFail($id);
        $validated = $request->validate([
            'published_by' => 'sometimes|string|max:100',
        ]);

        $fact->status = 'published';
        $fact->published_at = now();
        $fact->published_by = $validated['published_by'] ?? $fact->published_by ?? 'system';
        $fact->save();

        return response()->json(['success' => true, 'item' => $this->toListPayload($fact)]);
    }

    public function setUnpublished(int $id): JsonResponse
    {
        $fact = PublicFactCheck::findOrFail($id);
        $fact->status = 'draft';
        $fact->published_at = null;
        $fact->save();

        return response()->json(['success' => true, 'item' => $this->toListPayload($fact)]);
    }

    public function importExternal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1|max:30',
            'items.*.title' => 'required|string|max:300',
            'items.*.summary' => 'sometimes|string|max:2000',
            'items.*.claim_text' => 'sometimes|string',
            'items.*.explanation' => 'sometimes|string',
            'items.*.verdict' => 'sometimes|string|max:30',
            'items.*.confidence_score' => 'sometimes|numeric|min:0|max:1',
            'items.*.language' => 'sometimes|string|max:20',
            'items.*.coverage_scope' => 'sometimes|string|in:bangladesh,international',
            'items.*.source_name' => 'sometimes|string|max:120',
            'items.*.source_url' => 'sometimes|string|max:500',
            'items.*.external_id' => 'sometimes|string|max:120',
            'items.*.published_at' => 'sometimes|date',
            'items.*.tags' => 'sometimes|array',
            'items.*.tags.*' => 'string|max:60',
            'items.*.is_featured' => 'sometimes|boolean',
        ]);

        $created = [];
        foreach ((array) $validated['items'] as $item) {
            $title = trim((string) $item['title']);
            $sourceUrl = isset($item['source_url']) ? trim((string) $item['source_url']) : null;
            $externalId = isset($item['external_id']) ? trim((string) $item['external_id']) : null;

            $existing = null;
            if (!empty($externalId)) {
                $existing = PublicFactCheck::query()->where('origin', 'external')->where('external_id', $externalId)->first();
            }
            if (!$existing && !empty($sourceUrl)) {
                $existing = PublicFactCheck::query()->where('origin', 'external')->where('source_url', $sourceUrl)->first();
            }

            $slug = $this->uniqueSlug($title, PublicFactCheck::query()
                ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
                ->pluck('slug')
                ->all());

            $fact = $existing ?? new PublicFactCheck();
            $fact->fill([
                'origin' => 'external',
                'external_id' => $externalId,
                'source_name' => $item['source_name'] ?? 'external_source',
                'source_url' => $sourceUrl,
                'title' => $title,
                'slug' => $slug,
                'summary' => $item['summary'] ?? null,
                'claim_text' => $item['claim_text'] ?? null,
                'explanation' => $item['explanation'] ?? null,
                'verdict' => isset($item['verdict']) ? Str::lower((string) $item['verdict']) : null,
                'confidence_score' => $item['confidence_score'] ?? null,
                'language' => Str::lower((string) ($item['language'] ?? 'bn')),
                'coverage_scope' => Str::lower((string) ($item['coverage_scope'] ?? 'bangladesh')),
                'status' => 'published',
                'is_featured' => (bool) ($item['is_featured'] ?? false),
                'tags' => $item['tags'] ?? [],
                'sources' => [],
                'published_by' => 'external_importer',
                'published_at' => !empty($item['published_at']) ? $item['published_at'] : now(),
            ]);
            $fact->save();
            $created[] = $this->toListPayload($fact);
        }

        return response()->json([
            'success' => true,
            'items' => $created,
        ]);
    }

    private function uniqueSlug(string $title, array $existingSlugs): string
    {
        $base = Str::slug($title);
        if ($base === '') {
            $base = 'fact-check';
        }

        $slug = $base;
        $suffix = 2;
        while (in_array($slug, $existingSlugs, true)) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    private function toListPayload(PublicFactCheck $item): array
    {
        return [
            'id' => $item->id,
            'slug' => $item->slug,
            'title' => $item->title,
            'summary' => $item->summary,
            'verdict' => $item->verdict,
            'confidence_score' => $item->confidence_score,
            'language' => $item->language,
            'coverage_scope' => $item->coverage_scope,
            'origin' => $item->origin,
            'source_name' => $item->source_name,
            'source_url' => $item->source_url,
            'is_featured' => $item->is_featured,
            'published_at' => optional($item->published_at)?->toIso8601String(),
            'tags' => $item->tags ?? [],
        ];
    }
}
