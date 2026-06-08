<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── activity_logs — single source of truth for every user action ──────
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->string('activity_type', 100);
                $table->string('activity_title', 255);
                $table->text('activity_description')->nullable();
                $table->string('entity_type', 100)->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->string('ip_address', 100)->nullable();
                $table->text('user_agent')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index('user_id', 'idx_user_id');
                $table->index('activity_type', 'idx_activity_type');
                $table->index('created_at', 'idx_created_at');
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        // ── user_statistics — denormalized fast counters per user ─────────────
        if (!Schema::hasTable('user_statistics')) {
            Schema::create('user_statistics', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->integer('total_claims')->default(0);
                $table->integer('total_bookmarks')->default(0);
                $table->integer('total_fact_views')->default(0);
                $table->integer('total_review_requests')->default(0);
                $table->timestamp('last_login')->nullable();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        // ── attribute claims to a user when one is logged in (nullable: public
        //    anonymous submission still works) ─────────────────────────────────
        if (Schema::hasTable('claims') && !Schema::hasColumn('claims', 'user_id')) {
            Schema::table('claims', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
                $table->index('user_id', 'idx_claims_user_id');
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('claims') && Schema::hasColumn('claims', 'user_id')) {
            Schema::table('claims', function (Blueprint $table) {
                try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                try { $table->dropIndex('idx_claims_user_id'); } catch (\Throwable $e) {}
                $table->dropColumn('user_id');
            });
        }
        Schema::dropIfExists('user_statistics');
        Schema::dropIfExists('activity_logs');
    }
};
