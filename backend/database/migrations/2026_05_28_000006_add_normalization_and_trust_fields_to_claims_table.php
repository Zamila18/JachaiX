<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->json('normalization_data')->nullable()->after('extracted_text');
            $table->string('trust_label', 32)->nullable()->after('confidence_score');
            $table->json('trust_breakdown')->nullable()->after('trust_label');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn(['normalization_data', 'trust_label', 'trust_breakdown']);
        });
    }
};