<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStatistic extends Model
{
    public const CREATED_AT = null; // table only has updated_at

    protected $fillable = [
        'user_id',
        'total_claims',
        'total_bookmarks',
        'total_fact_views',
        'total_review_requests',
        'last_login',
    ];

    protected $casts = [
        'last_login' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
