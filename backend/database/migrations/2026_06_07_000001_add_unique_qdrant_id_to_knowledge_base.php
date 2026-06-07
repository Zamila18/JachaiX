<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('knowledge_base', 'qdrant_id')) {
            return;
        }

        // Remove any duplicate qdrant_id rows before enforcing uniqueness.
        DB::statement(
            'DELETE k1 FROM knowledge_base k1 '
            . 'INNER JOIN knowledge_base k2 '
            . 'ON k1.qdrant_id = k2.qdrant_id AND k1.id > k2.id '
            . 'WHERE k1.qdrant_id IS NOT NULL'
        );

        $exists = collect(DB::select("SHOW INDEX FROM knowledge_base WHERE Key_name = 'uq_kb_qdrant_id'"))
            ->isNotEmpty();
        if (!$exists) {
            // qdrant_id is a UUID string; index it at 191 chars to stay within utf8mb4 limits.
            DB::statement('ALTER TABLE knowledge_base ADD UNIQUE INDEX uq_kb_qdrant_id (qdrant_id)');
        }
    }

    public function down(): void
    {
        $exists = collect(DB::select("SHOW INDEX FROM knowledge_base WHERE Key_name = 'uq_kb_qdrant_id'"))
            ->isNotEmpty();
        if ($exists) {
            DB::statement('ALTER TABLE knowledge_base DROP INDEX uq_kb_qdrant_id');
        }
    }
};
