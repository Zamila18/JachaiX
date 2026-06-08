<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bookmark extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'fact_check_id'];

    protected $casts = ['created_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function factCheck(): BelongsTo
    {
        return $this->belongsTo(PublicFactCheck::class, 'fact_check_id');
    }
}
