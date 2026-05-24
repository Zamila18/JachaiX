<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBase extends Model
{
    protected $table = 'knowledge_base';

    protected $fillable = [
        'title',
        'content',
        'source_url',
        'source_name',
        'language',
        'credibility_tier',
        'qdrant_id',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];
}