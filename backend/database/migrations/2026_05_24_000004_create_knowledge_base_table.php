<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('knowledge_base', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('content');
            $table->string('source_url')->nullable();
            $table->string('source_name')->nullable();
            $table->string('language', 10)->default('bn');
            $table->string('credibility_tier')->default('medium'); // high, medium, low
            $table->string('qdrant_id')->nullable(); // vector ID in Qdrant
            $table->json('tags')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_base');
    }
};