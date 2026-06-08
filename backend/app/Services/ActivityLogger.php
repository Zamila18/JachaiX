<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\UserStatistic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for user activity. Every user-facing action funnels
 * through here, which (1) writes an immutable activity_logs row and (2) keeps
 * the denormalized user_statistics counters in sync so dashboards never have to
 * COUNT() the full log on every request.
 */
class ActivityLogger
{
    // ── Activity type constants ──────────────────────────────────────────────
    // Authentication
    public const USER_REGISTERED        = 'USER_REGISTERED';
    public const USER_LOGGED_IN         = 'USER_LOGGED_IN';
    public const USER_LOGGED_OUT        = 'USER_LOGGED_OUT';
    public const PASSWORD_CHANGED       = 'PASSWORD_CHANGED';
    // Profile
    public const PROFILE_UPDATED        = 'PROFILE_UPDATED';
    public const PROFILE_IMAGE_UPLOADED = 'PROFILE_IMAGE_UPLOADED';
    public const PROFILE_IMAGE_DELETED  = 'PROFILE_IMAGE_DELETED';
    // Fact checking
    public const FACT_VIEWED            = 'FACT_VIEWED';
    public const FACT_SHARED            = 'FACT_SHARED';
    public const BOOKMARK_CREATED       = 'BOOKMARK_CREATED';
    public const BOOKMARK_REMOVED       = 'BOOKMARK_REMOVED';
    // Claims
    public const CLAIM_SUBMITTED        = 'CLAIM_SUBMITTED';
    public const CLAIM_UPDATED          = 'CLAIM_UPDATED';
    public const CLAIM_APPROVED         = 'CLAIM_APPROVED';
    public const CLAIM_REJECTED         = 'CLAIM_REJECTED';
    // Human review
    public const HUMAN_REVIEW_REQUESTED = 'HUMAN_REVIEW_REQUESTED';
    public const REVIEW_COMPLETED       = 'REVIEW_COMPLETED';
    // Settings
    public const LANGUAGE_CHANGED       = 'LANGUAGE_CHANGED';
    public const COUNTRY_UPDATED        = 'COUNTRY_UPDATED';
    public const PHONE_UPDATED          = 'PHONE_UPDATED';
    // Security
    public const FAILED_LOGIN           = 'FAILED_LOGIN_ATTEMPT';
    public const UNAUTHORIZED_ACCESS    = 'UNAUTHORIZED_ACCESS_ATTEMPT';

    /**
     * Record an activity for a user and update their rolling statistics.
     *
     * @param  array{description?:string,entity_type?:string,entity_id?:int|null,metadata?:array} $opts
     */
    public function log(
        int $userId,
        string $type,
        string $title,
        array $opts = [],
        ?Request $request = null
    ): ?ActivityLog {
        $request ??= request();

        try {
            $activity = ActivityLog::create([
                'user_id'              => $userId,
                'activity_type'        => $type,
                'activity_title'       => $title,
                'activity_description' => $opts['description']  ?? null,
                'entity_type'          => $opts['entity_type']  ?? null,
                'entity_id'            => $opts['entity_id']     ?? null,
                'ip_address'           => $request?->ip(),
                'user_agent'           => $request?->userAgent(),
                'metadata'             => $opts['metadata']      ?? null,
            ]);

            $this->bumpStatistics($userId, $type);

            return $activity;
        } catch (\Throwable $e) {
            // Logging must never break the primary action it accompanies.
            report($e);
            return null;
        }
    }

    /** Keep the per-user fast counters in step with the logged activity. */
    private function bumpStatistics(int $userId, string $type): void
    {
        // Ensure a row exists first (so increment() has a target).
        UserStatistic::firstOrCreate(['user_id' => $userId]);

        $column = match ($type) {
            self::CLAIM_SUBMITTED        => 'total_claims',
            self::BOOKMARK_CREATED       => 'total_bookmarks',
            self::FACT_VIEWED            => 'total_fact_views',
            self::HUMAN_REVIEW_REQUESTED => 'total_review_requests',
            default                      => null,
        };

        $query = UserStatistic::where('user_id', $userId);

        if ($type === self::USER_LOGGED_IN) {
            $query->update(['last_login' => now()]);
            return;
        }

        if ($type === self::BOOKMARK_REMOVED) {
            // Never let a counter go negative.
            $query->where('total_bookmarks', '>', 0)->update([
                'total_bookmarks' => DB::raw('total_bookmarks - 1'),
            ]);
            return;
        }

        if ($column !== null) {
            $query->increment($column);
        }
    }
}
