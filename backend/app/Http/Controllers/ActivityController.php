<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\UserStatistic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /** GET /activity — full paginated activity feed (with search + type filter). */
    public function index(Request $request): JsonResponse
    {
        $userId = $this->userId($request);

        $perPage = min((int) $request->query('per_page', 20), 100);
        $type    = $request->query('type');
        $search  = trim((string) $request->query('q', ''));

        $query = ActivityLog::where('user_id', $userId)->latest('created_at');

        if ($type) {
            $query->where('activity_type', $type);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('activity_title', 'like', "%{$search}%")
                  ->orWhere('activity_description', 'like', "%{$search}%");
            });
        }

        $page = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'items'   => array_map([$this, 'present'], $page->items()),
            'pagination' => [
                'current_page' => $page->currentPage(),
                'per_page'     => $page->perPage(),
                'total'        => $page->total(),
                'last_page'    => $page->lastPage(),
            ],
        ]);
    }

    /** GET /activity/recent — small fixed list for the dashboard "Your Activity" card. */
    public function recent(Request $request): JsonResponse
    {
        $userId = $this->userId($request);
        $limit  = min((int) $request->query('limit', 6), 25);

        $items = ActivityLog::where('user_id', $userId)
            ->latest('created_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'items'   => $items->map(fn ($a) => $this->present($a))->all(),
        ]);
    }

    /** GET /activity/statistics — dashboard counters + verdict mix + usage this month. */
    public function statistics(Request $request): JsonResponse
    {
        $userId = $this->userId($request);

        $stats = UserStatistic::firstOrCreate(['user_id' => $userId]);

        // Verdict breakdown comes from the claims table (verdict lives on the claim).
        $verdictRows = Claim::where('user_id', $userId)
            ->selectRaw('verdict, COUNT(*) as c')
            ->groupBy('verdict')
            ->pluck('c', 'verdict');

        $verdicts = [
            'true'       => (int) ($verdictRows['true'] ?? 0),
            'false'      => (int) ($verdictRows['false'] ?? 0),
            'misleading' => (int) ($verdictRows['misleading'] ?? 0),
            'unverified' => (int) ($verdictRows['unverified'] ?? 0),
        ];

        $totalClaims    = Claim::where('user_id', $userId)->count();
        $claimsVerified = Claim::where('user_id', $userId)->where('status', 'completed')->count();

        // Month-over-month claim trend (powers the "↑/↓ X% vs last month" label).
        $monthStart     = now()->startOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $claimsThisMonth = Claim::where('user_id', $userId)->where('created_at', '>=', $monthStart)->count();
        $claimsLastMonth = Claim::where('user_id', $userId)
            ->whereBetween('created_at', [$lastMonthStart, $monthStart])->count();
        $changePct = $claimsLastMonth > 0
            ? (int) round((($claimsThisMonth - $claimsLastMonth) / $claimsLastMonth) * 100)
            : ($claimsThisMonth > 0 ? 100 : 0);

        // "Usage this month" — derived live from activity_logs for the current month.
        $monthCounts = ActivityLog::where('user_id', $userId)
            ->where('created_at', '>=', $monthStart)
            ->selectRaw('activity_type, COUNT(*) as c')
            ->groupBy('activity_type')
            ->pluck('c', 'activity_type');

        return response()->json([
            'success' => true,
            'statistics' => [
                'totals' => [
                    'claims'            => $totalClaims,
                    'claims_verified'   => $claimsVerified,
                    'claims_this_month' => $claimsThisMonth,
                    'claims_last_month' => $claimsLastMonth,
                    'claims_change_pct' => $changePct,
                    'bookmarks'         => (int) $stats->total_bookmarks,
                    'fact_views'        => (int) $stats->total_fact_views,
                    'review_requests'   => (int) $stats->total_review_requests,
                    'last_login'        => optional($stats->last_login)->toIso8601String(),
                ],
                'verdicts' => $verdicts,
                'usage_this_month' => [
                    'claims_submitted' => (int) ($monthCounts['CLAIM_SUBMITTED'] ?? 0),
                    'reviews_requested'=> (int) ($monthCounts['HUMAN_REVIEW_REQUESTED'] ?? 0),
                    'fact_views'       => (int) ($monthCounts['FACT_VIEWED'] ?? 0),
                    'bookmarks_added'  => (int) ($monthCounts['BOOKMARK_CREATED'] ?? 0),
                    'profile_updates'  => (int) ($monthCounts['PROFILE_UPDATED'] ?? 0),
                    'logins'           => (int) ($monthCounts['USER_LOGGED_IN'] ?? 0),
                ],
                'month_label' => $monthStart->format('F Y'),
            ],
        ]);
    }

    /** GET /activity/history — the user's claim/fact history, paginated. */
    public function history(Request $request): JsonResponse
    {
        $userId  = $this->userId($request);
        $perPage = min((int) $request->query('per_page', 15), 100);
        $verdict = $request->query('verdict');
        $status  = $request->query('status');
        $search  = trim((string) $request->query('q', ''));

        $query = Claim::where('user_id', $userId)->latest('created_at');

        if ($verdict) {
            $query->where('verdict', $verdict);
        }
        if ($status) {
            $query->where('status', $status);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('claim_text', 'like', "%{$search}%")
                  ->orWhere('raw_input', 'like', "%{$search}%");
            });
        }

        $page = $query->paginate($perPage);

        $items = array_map(function (Claim $claim) {
            return [
                'id'               => $claim->id,
                'claim_text'       => $claim->claim_text ?? $claim->raw_input,
                'input_type'       => $claim->input_type,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'trust_label'      => $claim->trust_label,
                'status'           => $claim->status,
                'language'         => $claim->language,
                'created_at'       => optional($claim->created_at)->toIso8601String(),
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

    // ── helpers ──────────────────────────────────────────────────────────────

    private function userId(Request $request): int
    {
        return (int) $request->attributes->get('jwt_sub');
    }

    private function present(ActivityLog $a): array
    {
        return [
            'id'          => $a->id,
            'type'        => $a->activity_type,
            'title'       => $a->activity_title,
            'description' => $a->activity_description,
            'entity_type' => $a->entity_type,
            'entity_id'   => $a->entity_id,
            'metadata'    => $a->metadata,
            'created_at'  => optional($a->created_at)->toIso8601String(),
        ];
    }
}
