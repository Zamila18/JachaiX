<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->string('input_type');              // text, image, pdf
            $table->longText('raw_input')->nullable(); // text input or file path
            $table->string('file_path')->nullable();   // stored file path for image/pdf
            $table->text('extracted_text')->nullable(); // OCR output
            $table->text('claim_text')->nullable();    // clean extracted claim
            $table->string('language', 10)->default('bn');
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->string('verdict')->nullable();     // true, false, misleading, unverified
            $table->float('confidence_score')->nullable();
            $table->json('evidence')->nullable();
            $table->json('sources')->nullable();
            $table->text('explanation')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};