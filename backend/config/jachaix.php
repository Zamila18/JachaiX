<?php

return [
    'qdrant' => [
        'host'       => env('QDRANT_HOST', 'qdrant'),
        'port'       => env('QDRANT_PORT', 6333),
        'collection' => env('QDRANT_COLLECTION', 'jachaix_knowledge'),
    ],

    'services' => [
        'ocr_url'      => env('OCR_SERVICE_URL', 'http://ocr-service:5001'),
        'embedder_url' => env('EMBEDDER_SERVICE_URL', 'http://embedder-service:5002'),
        'reranker_url' => env('RERANKER_SERVICE_URL', 'http://reranker-service:5003'),
    ],

    'llm' => [
        'api_key'  => env('OPENAI_API_KEY'),
        'model'    => env('OPENAI_MODEL', 'llama3.2'),
        'base_url' => env('OPENAI_BASE_URL', 'http://host.docker.internal:11434/v1'),
    ],
];