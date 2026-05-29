<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Claim extends Model
{
    protected $fillable = [
        'input_type',
        'raw_input',
        'file_path',
        'extracted_text',
        'normalization_data',
        'claim_text',
        'language',
        'status',
        'verdict',
        'confidence_score',
        'trust_label',
        'trust_breakdown',
        'evidence',
        'sources',
        'explanation',
        'ip_address',
    ];

    protected $casts = [
        'normalization_data' => 'array',
        'trust_breakdown' => 'array',
        'evidence' => 'array',
        'sources'  => 'array',
    ];

    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class);
    }

    public function analysisJobs(): HasMany
    {
        return $this->hasMany(AnalysisJob::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}