<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public_fact_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->nullable()->constrained('claims')->nullOnDelete();
            $table->string('origin', 20)->default('internal');
            $table->string('external_id')->nullable()->index();
            $table->string('source_name')->nullable();
            $table->string('source_url')->nullable();
            $table->string('title', 300);
            $table->string('slug')->unique();
            $table->text('summary')->nullable();
            $table->longText('claim_text')->nullable();
            $table->longText('explanation')->nullable();
            $table->string('verdict', 30)->nullable();
            $table->float('confidence_score')->nullable();
            $table->string('language', 20)->default('bn');
            $table->string('coverage_scope', 30)->default('bangladesh');
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->string('cover_image')->nullable();
            $table->json('tags')->nullable();
            $table->json('sources')->nullable();
            $table->string('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['coverage_scope', 'status']);
            $table->index(['verdict', 'status']);
            $table->index(['is_featured', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_fact_checks');
    }
};
