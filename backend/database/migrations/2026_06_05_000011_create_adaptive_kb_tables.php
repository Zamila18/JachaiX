<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('retrieval_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('claim_id')->index();
            $table->string('query_text', 512);
            $table->string('retrieval_source', 20)->default('dense'); // dense|bm25|hybrid
            $table->unsignedSmallInteger('results_count')->default(0);
            $table->float('top_score')->nullable();
            $table->float('avg_score')->nullable();
            $table->json('result_urls')->nullable();
            $table->json('chunk_ids')->nullable();
            $table->unsignedSmallInteger('latency_ms')->nullable();
            $table->timestamps();

            $table->foreign('claim_id')->references('id')->on('claims')->onDelete('cascade');
            $table->index(['claim_id', 'created_at']);
        });

        Schema::create('feedback_signals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('claim_id')->index();
            // signal_type: user_correct | user_incorrect | auto_high_confidence | auto_low_confidence
            $table->string('signal_type', 40);
            $table->string('original_verdict', 20);
            $table->string('corrected_verdict', 20)->nullable();
            $table->float('confidence')->nullable();
            $table->text('notes')->nullable();
            $table->json('source_names')->nullable();
            $table->json('chunk_ids')->nullable();
            $table->timestamps();

            $table->foreign('claim_id')->references('id')->on('claims')->onDelete('cascade');
            $table->index(['signal_type', 'created_at']);
        });

        Schema::create('source_health', function (Blueprint $table) {
            $table->id();
            $table->string('source_name', 100)->unique();
            $table->unsignedSmallInteger('crawl_attempts')->default(0);
            $table->unsignedSmallInteger('crawl_successes')->default(0);
            $table->float('health_score')->default(1.0); // crawl_successes / crawl_attempts
            $table->timestamp('last_crawl_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('coverage_gaps', function (Blueprint $table) {
            $table->id();
            $table->string('topic_keywords', 300);
            $table->unsignedSmallInteger('claim_count')->default(1);
            $table->float('avg_score')->default(0.0);
            $table->boolean('resolved')->default(false);
            $table->timestamp('flagged_at')->useCurrent();
            $table->timestamps();

            $table->index(['resolved', 'flagged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coverage_gaps');
        Schema::dropIfExists('source_health');
        Schema::dropIfExists('feedback_signals');
        Schema::dropIfExists('retrieval_logs');
    }
};
