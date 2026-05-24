<?php

use App\Http\Controllers\ClaimController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status'  => 'ok',
            'service' => 'JachaiX API',
            'version' => '1.0.0',
        ]);
    });

    // Claims
    Route::post('/claims', [ClaimController::class, 'submit']);
    Route::get('/claims/{id}/status', [ClaimController::class, 'status']);
    Route::get('/claims/{id}/result', [ClaimController::class, 'result']);
});