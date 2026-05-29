<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE claims MODIFY language VARCHAR(32) NOT NULL DEFAULT 'bn'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE claims MODIFY language VARCHAR(10) NOT NULL DEFAULT 'bn'");
    }
};
