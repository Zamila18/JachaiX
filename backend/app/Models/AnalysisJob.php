<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalysisJob extends Model
{
    protected $fillable = [
        'claim_id',
        'job_type',
        'status',
        'payload',
        'result',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'payload'      => 'array',
        'result'       => 'array',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }
}