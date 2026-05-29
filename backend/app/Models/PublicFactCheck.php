<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicFactCheck extends Model
{
    protected $fillable = [
        'claim_id',
        'origin',
        'external_id',
        'source_name',
        'source_url',
        'title',
        'slug',
        'summary',
        'claim_text',
        'explanation',
        'verdict',
        'confidence_score',
        'language',
        'coverage_scope',
        'status',
        'is_featured',
        'cover_image',
        'tags',
        'sources',
        'published_by',
        'published_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'tags' => 'array',
        'sources' => 'array',
        'published_at' => 'datetime',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }
}
