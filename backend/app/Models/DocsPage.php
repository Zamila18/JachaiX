<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocsPage extends Model
{
    protected $fillable = [
        'page_key',
        'is_enabled',
        'available_from',
        'available_until',
        'pitch_sections',
        'technical_sections',
        'team_members',
        'team_name',
        'updated_by',
        'version',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'pitch_sections' => 'array',
        'technical_sections' => 'array',
        'team_members' => 'array',
    ];
}
