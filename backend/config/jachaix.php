<?php

$envBool = static function (string $key, bool $default): bool {
    $value = env($key, $default);
    if (is_bool($value)) {
        return $value;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
    return $parsed ?? $default;
};

return [
    'helpers' => [
        'csv_array' => static function (?string $value): array {
            if ($value === null || trim($value) === '') {
                return [];
            }

            return array_values(array_filter(array_map(
                static fn ($item) => trim((string) $item),
                explode(',', $value)
            ), static fn ($item) => $item !== ''));
        },
    ],

    'qdrant' => [
        'host'       => env('QDRANT_HOST', 'qdrant'),
        'port'       => env('QDRANT_PORT', 6333),
        'collection' => env('QDRANT_COLLECTION', 'knowledge_base'),
    ],

    'services' => [
        'ocr_url'      => env('OCR_SERVICE_URL', 'http://ocr-service:5001'),
        'ocr_timeout_seconds' => (int) env('OCR_TIMEOUT_SECONDS', 60),
        'ocr_connect_timeout_seconds' => (int) env('OCR_CONNECT_TIMEOUT_SECONDS', 8),
        'ocr_retry_attempts' => (int) env('OCR_RETRY_ATTEMPTS', 2),
        'ocr_retry_sleep_ms' => (int) env('OCR_RETRY_SLEEP_MS', 800),
        'embedder_url' => env('EMBEDDER_SERVICE_URL', 'http://embedder-service:5002'),
        'reranker_url' => env('RERANKER_SERVICE_URL', 'http://reranker-service:5003'),
    ],

    'llm' => [
        'api_key'  => env('OPENAI_API_KEY'),
        'model'    => env('OPENAI_MODEL', 'qwen2:0.5b'),
        'claim_model'   => env('OPENAI_CLAIM_MODEL', env('OPENAI_MODEL', 'qwen2:0.5b')),
        'query_model'   => env('OPENAI_QUERY_MODEL', env('OPENAI_MODEL', 'qwen2:0.5b')),
        'verdict_model' => env('OPENAI_VERDICT_MODEL', env('OPENAI_MODEL', 'qwen2:0.5b')),
        'verdict_fast_model'   => env('OPENAI_VERDICT_FAST_MODEL', env('OPENAI_MODEL', 'qwen2:0.5b')),
        'verdict_strong_model' => env('OPENAI_VERDICT_STRONG_MODEL', env('OPENAI_VERDICT_MODEL', env('OPENAI_MODEL', 'qwen2:0.5b'))),
        'base_url' => env('OPENAI_BASE_URL', 'http://host.docker.internal:11434/v1'),
    ],

    'retrieval' => [
        'top_k_per_query' => (int) env('RETRIEVAL_TOP_K_PER_QUERY', 6),
        'max_candidates' => (int) env('RETRIEVAL_MAX_CANDIDATES', 8),
        'similarity_threshold' => (float) env('RETRIEVAL_SIMILARITY_THRESHOLD', 0.30),
        'max_queries' => (int) env('RETRIEVAL_MAX_QUERIES', 4),
        'enable_rerank' => $envBool('RETRIEVAL_ENABLE_RERANK', true),
        'rerank_top_k' => (int) env('RETRIEVAL_RERANK_TOP_K', 5),
        'enable_metadata_prefilter' => $envBool('RETRIEVAL_ENABLE_METADATA_PREFILTER', true),
        'prefilter_min_reliability' => (float) env('RETRIEVAL_PREFILTER_MIN_RELIABILITY', 0.80),
        'prefilter_recent_days' => (int) env('RETRIEVAL_PREFILTER_RECENT_DAYS', 0),
        'prefilter_trusted_sources' => (static function () {
            $raw = env('RETRIEVAL_PREFILTER_TRUSTED_SOURCES', '');
            if (!is_string($raw) || trim($raw) === '') {
                return [];
            }

            return array_values(array_filter(array_map(
                static fn ($item) => trim((string) $item),
                explode(',', $raw)
            ), static fn ($item) => $item !== ''));
        })(),
        'enable_query_rewrite' => $envBool('RETRIEVAL_ENABLE_QUERY_REWRITE', false),
        'decisive_relevance_min' => (float) env('RETRIEVAL_DECISIVE_RELEVANCE_MIN', 0.62),
        'search_timeout' => (int) env('RETRIEVAL_SEARCH_TIMEOUT', 8),
        'rerank_timeout' => (int) env('RETRIEVAL_RERANK_TIMEOUT', 8),
        'enable_cache' => $envBool('RETRIEVAL_ENABLE_CACHE', true),
        'search_cache_ttl_seconds' => (int) env('RETRIEVAL_SEARCH_CACHE_TTL_SECONDS', 900),
        'rerank_cache_ttl_seconds' => (int) env('RETRIEVAL_RERANK_CACHE_TTL_SECONDS', 900),
        'query_rewrite_timeout' => (int) env('RETRIEVAL_QUERY_REWRITE_TIMEOUT', 7),
        'banglish_paraphrase_timeout' => (int) env('RETRIEVAL_BANGLISH_PARAPHRASE_TIMEOUT', 6),
        'enable_banglish_paraphrases' => $envBool('RETRIEVAL_ENABLE_BANGLISH_PARAPHRASES', false),
    ],

    'verdict' => [
        'fast_confidence_threshold' => (float) env('VERDICT_FAST_CONFIDENCE_THRESHOLD', 0.55),
        'strong_model_timeout' => (int) env('VERDICT_STRONG_MODEL_TIMEOUT', 18),
        'fast_model_timeout' => (int) env('VERDICT_FAST_MODEL_TIMEOUT', 10),
        'enable_strong_model' => $envBool('VERDICT_ENABLE_STRONG_MODEL', true),
        'enable_canonical_shortcuts' => $envBool('VERDICT_ENABLE_CANONICAL_SHORTCUTS', false),
    ],

    'sla' => [
        'max_seconds' => (int) env('SLA_MAX_SECONDS', 30),
        'strong_min_remaining_seconds' => (int) env('SLA_STRONG_MIN_REMAINING_SECONDS', 12),
    ],

    'trust' => [
        'label_trustworthy_min' => (float) env('TRUST_LABEL_TRUSTWORTHY_MIN', 0.75),
        'label_uncertain_min' => (float) env('TRUST_LABEL_UNCERTAIN_MIN', 0.45),
        'label_suspicious_min' => (float) env('TRUST_LABEL_SUSPICIOUS_MIN', 0.20),
    ],
];