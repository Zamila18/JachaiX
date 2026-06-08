<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('bookmarks')) {
            Schema::create('bookmarks', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('fact_check_id');
                $table->timestamp('created_at')->useCurrent();

                $table->unique(['user_id', 'fact_check_id'], 'uniq_user_factcheck');
                $table->index('user_id', 'idx_bm_user');
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('fact_check_id')->references('id')->on('public_fact_checks')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->string('type', 100);
                $table->string('title', 255);
                $table->text('message')->nullable();
                $table->string('entity_type', 100)->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['user_id', 'read_at'], 'idx_notif_user_read');
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('saved_searches')) {
            Schema::create('saved_searches', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->string('query', 255);
                $table->json('filters')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index('user_id', 'idx_ss_user');
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('saved_searches');
    }
};
