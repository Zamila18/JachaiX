<?php

$payload = [
    'model' => 'qwen2:0.5b',
    'stream' => false,
    'messages' => [
        ['role' => 'user', 'content' => 'Return ONLY JSON: {"ok":true}'],
    ],
];

$ch = curl_init('http://host.docker.internal:11434/v1/chat/completions');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ollama',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 45);

$response = curl_exec($ch);
$errno = curl_errno($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno !== 0) {
    echo "CURL_ERR: {$error}\n";
    exit(1);
}

echo "HTTP: {$httpCode}\n";
echo substr((string)$response, 0, 700) . "\n";
