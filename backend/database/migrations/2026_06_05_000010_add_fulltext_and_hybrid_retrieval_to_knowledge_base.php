<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('knowledge_base', function (Blueprint $table) {
            if (!Schema::hasColumn('knowledge_base', 'reliability_score')) {
                $table->float('reliability_score')->default(0.75)->after('credibility_tier');
            }
            if (!Schema::hasColumn('knowledge_base', 'published_date')) {
                $table->string('published_date', 50)->nullable()->after('reliability_score');
            }
        });

        // FULLTEXT indexes for BM25-style keyword search (MySQL 5.7.6+ required)
        DB::statement('ALTER TABLE knowledge_base ADD FULLTEXT INDEX ft_kb_content (content)');
        DB::statement('ALTER TABLE knowledge_base ADD FULLTEXT INDEX ft_kb_title_content (title, content)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE knowledge_base DROP INDEX ft_kb_content');
        DB::statement('ALTER TABLE knowledge_base DROP INDEX ft_kb_title_content');

        Schema::table('knowledge_base', function (Blueprint $table) {
            $table->dropColumn(['reliability_score', 'published_date']);
        });
    }
};
