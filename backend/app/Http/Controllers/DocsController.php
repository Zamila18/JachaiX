<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\DocsPage;
use App\Models\PublicFactCheck;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocsController extends Controller
{
    public function showPublic(): JsonResponse
    {
        $page = $this->resolvePage();

        if (!$this->isVisibleNow($page)) {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Documentation page is not currently available.',
                'visibility' => $this->visibilityPayload($page),
            ], 403);
        }

        return response()->json([
            'success' => true,
            'available' => true,
            'page' => $this->pagePayload($page),
            'live_data' => $this->liveDataPayload(),
        ]);
    }

    public function showAdmin(): JsonResponse
    {
        $page = $this->resolvePage();

        return response()->json([
            'success' => true,
            'page' => $this->pagePayload($page),
            'visibility' => $this->visibilityPayload($page),
            'live_data' => $this->liveDataPayload(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_name' => 'sometimes|nullable|string|max:120',
            'pitch_sections' => 'sometimes|array',
            'pitch_sections.*.id' => 'required_with:pitch_sections|string|max:60',
            'pitch_sections.*.title' => 'required_with:pitch_sections|string|max:200',
            'pitch_sections.*.content' => 'required_with:pitch_sections|string',
            'technical_sections' => 'sometimes|array',
            'team_members' => 'sometimes|array',
            'team_members.*.name' => 'required_with:team_members|string|max:120',
            'team_members.*.role' => 'required_with:team_members|string|max:120',
            'team_members.*.email' => 'required_with:team_members|email|max:180',
            'team_members.*.image_url' => 'nullable|string|max:500',
            'updated_by' => 'sometimes|string|max:100',
        ]);

        $page = $this->resolvePage();

        foreach (['team_name', 'pitch_sections', 'technical_sections', 'team_members', 'updated_by'] as $field) {
            if (array_key_exists($field, $validated)) {
                $page->{$field} = $validated[$field];
            }
        }

        $page->version = (int) $page->version + 1;
        $page->save();

        return response()->json([
            'success' => true,
            'page' => $this->pagePayload($page),
            'visibility' => $this->visibilityPayload($page),
        ]);
    }

    public function updateVisibility(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'updated_by' => 'sometimes|string|max:100',
        ]);

        $page = $this->resolvePage();
        $page->is_enabled = (bool) $validated['is_enabled'];
        if (isset($validated['updated_by'])) {
            $page->updated_by = $validated['updated_by'];
        }
        $page->version = (int) $page->version + 1;
        $page->save();

        return response()->json([
            'success' => true,
            'visibility' => $this->visibilityPayload($page),
            'page' => $this->pagePayload($page),
        ]);
    }

    public function updateSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'duration_hours' => 'nullable|integer|min:1|max:720',
            'updated_by' => 'sometimes|string|max:100',
        ]);

        $page = $this->resolvePage();

        if (array_key_exists('available_from', $validated)) {
            $page->available_from = $validated['available_from'];
        }

        if (!empty($validated['duration_hours'])) {
            $base = $page->available_from ?? now();
            $page->available_until = $base->copy()->addHours((int) $validated['duration_hours']);
        } elseif (array_key_exists('available_until', $validated)) {
            $page->available_until = $validated['available_until'];
        }

        if (isset($validated['updated_by'])) {
            $page->updated_by = $validated['updated_by'];
        }

        $page->version = (int) $page->version + 1;
        $page->save();

        return response()->json([
            'success' => true,
            'visibility' => $this->visibilityPayload($page),
            'page' => $this->pagePayload($page),
        ]);
    }

    private function resolvePage(): DocsPage
    {
        return DocsPage::firstOrCreate(
            ['page_key' => 'main'],
            [
                'is_enabled' => true,
                'available_from' => '2026-06-10 00:00:00',
                'available_until' => '2026-06-14 23:59:00',
                'team_name' => 'JachaiX Core Team',
                'pitch_sections' => [],
                'technical_sections' => [],
                'team_members' => [],
                'updated_by' => 'system',
                'version' => 1,
            ]
        );
    }

    private function isVisibleNow(DocsPage $page): bool
    {
        if (!$page->is_enabled) {
            return false;
        }

        $now = now();
        if ($page->available_from && $now->lt($page->available_from)) {
            return false;
        }

        if ($page->available_until && $now->gt($page->available_until)) {
            return false;
        }

        return true;
    }

    private function visibilityPayload(DocsPage $page): array
    {
        return [
            'is_enabled' => (bool) $page->is_enabled,
            'available_from' => optional($page->available_from)?->toIso8601String(),
            'available_until' => optional($page->available_until)?->toIso8601String(),
            'is_visible_now' => $this->isVisibleNow($page),
        ];
    }

    private function pagePayload(DocsPage $page): array
    {
        return [
            'team_name' => $page->team_name,
            'pitch_sections' => $page->pitch_sections ?? [],
            'technical_sections' => $page->technical_sections ?? [],
            'team_members' => $page->team_members ?? [],
            'updated_by' => $page->updated_by,
            'version' => (int) $page->version,
            'updated_at' => optional($page->updated_at)?->toIso8601String(),
        ];
    }

    private function liveDataPayload(): array
    {
        $claimQuery = Claim::query();
        $totalClaims = (clone $claimQuery)->count();
        $completedClaims = (clone $claimQuery)->where('status', 'completed')->count();
        $processingClaims = (clone $claimQuery)->where('status', 'processing')->count();

        return [
            'metrics' => [
                'users' => User::query()->count(),
                'claims_total' => $totalClaims,
                'claims_completed' => $completedClaims,
                'claims_processing' => $processingClaims,
                'public_fact_checks' => PublicFactCheck::query()->count(),
                'published_fact_checks' => PublicFactCheck::query()->where('status', 'published')->count(),
                'featured_fact_checks' => PublicFactCheck::query()->where('is_featured', true)->count(),
            ],
            'features' => [
                ['name' => 'Text Verification', 'status' => 'live'],
                ['name' => 'Image OCR Verification', 'status' => 'live'],
                ['name' => 'PDF OCR Verification', 'status' => 'live'],
                ['name' => 'Public Fact Hub', 'status' => 'live'],
                ['name' => 'Admin Publish Queue', 'status' => 'live'],
                ['name' => 'Audio/Video Verification', 'status' => 'planned'],
            ],
            'apis' => [
                ['method' => 'POST', 'path' => '/api/v1/analyze/text'],
                ['method' => 'POST', 'path' => '/api/v1/analyze/image'],
                ['method' => 'POST', 'path' => '/api/v1/analyze/pdf'],
                ['method' => 'GET', 'path' => '/api/v1/claims/{id}/status'],
                ['method' => 'GET', 'path' => '/api/v1/claims/{id}/result'],
                ['method' => 'GET', 'path' => '/api/v1/public/fact-checks'],
                ['method' => 'GET', 'path' => '/api/v1/docs'],
            ],
            'events' => Claim::query()
                ->orderByDesc('id')
                ->limit(12)
                ->get(['id', 'status', 'verdict', 'language', 'created_at'])
                ->map(fn (Claim $claim) => [
                    'id' => $claim->id,
                    'status' => $claim->status,
                    'verdict' => $claim->verdict,
                    'language' => $claim->language,
                    'created_at' => optional($claim->created_at)?->toIso8601String(),
                ])
                ->values(),
        ];
    }
}
