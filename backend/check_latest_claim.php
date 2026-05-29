<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$claim = App\Models\Claim::query()->latest('id')->first();
if (!$claim) {
    echo "No claims found\n";
    exit(1);
}

$sourcesCount = is_array($claim->sources) ? count($claim->sources) : 0;

echo json_encode([
    'id' => $claim->id,
    'status' => $claim->status,
    'verdict' => $claim->verdict,
    'confidence_score' => $claim->confidence_score,
    'explanation' => $claim->explanation,
    'sources_count' => $sourcesCount,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
