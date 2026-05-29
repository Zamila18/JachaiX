<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAnalysisJob;
use App\Models\AuditLog;
use App\Models\Claim;
use App\Support\ClaimLanguage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClaimController extends Controller
{
    public function analyzeText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'     => 'required|string|max:10000',
            'language' => 'sometimes|string|max:20',
        ]);

        $profile = ClaimLanguage::profile($validated['text'], $validated['language'] ?? null);

        return $this->createClaimAndDispatch(
            inputType: 'text',
            rawInput: $validated['text'],
            filePath: null,
            language: $profile['language'],
            ipAddress: $request->ip()
        );
    }

    public function analyzeImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file'     => 'required|file|mimes:jpg,jpeg,png,webp|max:10240',
            'language' => 'sometimes|string|max:20',
        ]);

        $filePath = $request->file('file')->store('uploads', 'local');

        return $this->createClaimAndDispatch(
            inputType: 'image',
            rawInput: $filePath,
            filePath: $filePath,
            language: ClaimLanguage::normalizeLanguage($validated['language'] ?? null),
            ipAddress: $request->ip()
        );
    }

    public function analyzePdf(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file'     => 'required|file|mimes:pdf|max:20480',
            'language' => 'sometimes|string|max:20',
        ]);

        $filePath = $request->file('file')->store('uploads', 'local');

        return $this->createClaimAndDispatch(
            inputType: 'pdf',
            rawInput: $filePath,
            filePath: $filePath,
            language: ClaimLanguage::normalizeLanguage($validated['language'] ?? null),
            ipAddress: $request->ip()
        );
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'input_type' => 'required|in:text,image,pdf',
            'raw_input'  => 'required_if:input_type,text|nullable|string|max:10000',
            'file'       => 'required_if:input_type,image,pdf|nullable|file|max:10240',
            'language'   => 'sometimes|string|max:20',
        ]);

        $filePath = null;
        $rawInput = $validated['raw_input'] ?? null;

        // Handle file upload for image or pdf
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('uploads', 'local');
            $rawInput = $filePath;
        }

        return $this->createClaimAndDispatch(
            inputType: $validated['input_type'],
            rawInput: $rawInput,
            filePath: $filePath,
            language: $validated['input_type'] === 'text'
                ? ClaimLanguage::profile((string) $rawInput, $validated['language'] ?? null)['language']
                : ClaimLanguage::normalizeLanguage($validated['language'] ?? null),
            ipAddress: $request->ip()
        );
    }

    private function createClaimAndDispatch(
        string $inputType,
        ?string $rawInput,
        ?string $filePath,
        string $language,
        ?string $ipAddress
    ): JsonResponse {

        $claim = Claim::create([
            'input_type' => $inputType,
            'raw_input'  => $rawInput,
            'file_path'  => $filePath,
            'language'   => $language,
            'status'     => 'pending',
            'ip_address' => $ipAddress,
        ]);

        AuditLog::create([
            'claim_id'   => $claim->id,
            'event'      => 'claim_submitted',
            'metadata'   => ['input_type' => $claim->input_type],
            'ip_address' => $ipAddress,
        ]);

        ProcessAnalysisJob::dispatch($claim);

        return response()->json([
            'success'  => true,
            'claim_id' => $claim->id,
            'status'   => $claim->status,
            'job' => [
                'id'           => $claim->id,
                'status'       => $claim->status,
                'input_type'   => $claim->input_type,
                'language'     => $claim->language,
                'status_url'   => url('/api/v1/claims/' . $claim->id . '/status'),
                'result_url'   => url('/api/v1/claims/' . $claim->id . '/result'),
            ],
            'message'  => 'Analysis job created and queued.',
        ], 201);
    }

    public function status(int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);
        $failureReason = null;

        if ($claim->status === 'failed') {
            $failureReason = AuditLog::query()
                ->where('claim_id', $claim->id)
                ->where('event', 'error')
                ->latest('id')
                ->value('metadata->error');

            if (!$failureReason && !empty($claim->explanation)) {
                $failureReason = $claim->explanation;
            }
        }

        return response()->json([
            'success' => true,
            'claim'   => [
                'id'               => $claim->id,
                'status'           => $claim->status,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'failure_reason'   => $failureReason,
            ],
        ]);
    }

    public function result(int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);
        $crossVerification = $this->buildCrossVerificationSuggestions($claim);
        $humanVerification = $this->buildHumanVerificationSection($claim, $crossVerification['links']);

        return response()->json([
            'success' => true,
            'claim'   => [
                'id'               => $claim->id,
                'status'           => $claim->status,
                'input_type'       => $claim->input_type,
                'extracted_text'   => $claim->extracted_text,
                'claim_text'       => $claim->claim_text,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'trust_label'      => $claim->trust_label,
                'trust_breakdown'  => $claim->trust_breakdown,
                'explanation'      => $claim->explanation,
                'sources'          => $claim->sources,
                'language'         => $claim->language,
                'normalization'    => $claim->normalization_data,
                'cross_verification' => $crossVerification,
                'human_verification' => $humanVerification,
                'created_at'       => $claim->created_at,
            ],
        ]);
    }

    public function submitReviewRequest(Request $request, int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'sometimes|string|max:1000',
            'notes' => 'sometimes|string|max:2000',
            'reporter_name' => 'sometimes|string|max:100',
        ]);

        $reason = trim((string) ($validated['reason'] ?? 'Needs human verification'));
        $notes = trim((string) ($validated['notes'] ?? ''));
        $reporterName = trim((string) ($validated['reporter_name'] ?? 'anonymous_user'));

        AuditLog::create([
            'claim_id' => $claim->id,
            'event' => 'human_review_requested',
            'metadata' => [
                'reason' => $reason,
                'notes' => $notes,
                'reporter_name' => $reporterName,
                'claim_status' => $claim->status,
                'verdict' => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'trust_label' => $claim->trust_label,
                'requested_at' => now()->toIso8601String(),
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Human verification request has been submitted to admin queue.',
            'review_request' => [
                'claim_id' => $claim->id,
                'event' => 'human_review_requested',
                'reason' => $reason,
                'requested_at' => now()->toIso8601String(),
            ],
        ], 202);
    }

    private function buildCrossVerificationSuggestions(Claim $claim): array
    {
        $sources = is_array($claim->sources) ? $claim->sources : [];
        $evidence = is_array($claim->evidence) ? $claim->evidence : [];
        $links = [];
        $seenUrls = [];

        foreach ($sources as $item) {
            if (!is_array($item)) {
                continue;
            }

            $url = $this->normalizeCrossVerificationUrl(trim((string) ($item['url'] ?? $item['source_url'] ?? '')));
            if ($url === '' || (!filter_var($url, FILTER_VALIDATE_URL) && !str_starts_with($url, '/facts/'))) {
                continue;
            }

            if (isset($seenUrls[$url])) {
                continue;
            }
            $seenUrls[$url] = true;

            $title = trim((string) ($item['title'] ?? ''));
            $source = trim((string) ($item['source'] ?? ''));

            $links[] = [
                'title' => $title !== '' ? $title : 'Related evidence source',
                'source' => $source !== '' ? $source : parse_url($url, PHP_URL_HOST),
                'url' => $url,
            ];

            if (count($links) >= 5) {
                break;
            }
        }

        if (count($links) < 5) {
            foreach ($evidence as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $url = $this->normalizeCrossVerificationUrl(trim((string) ($item['url'] ?? $item['source_url'] ?? '')));
                if ($url === '' || (!filter_var($url, FILTER_VALIDATE_URL) && !str_starts_with($url, '/facts/'))) {
                    continue;
                }
                if (isset($seenUrls[$url])) {
                    continue;
                }
                $seenUrls[$url] = true;

                $title = trim((string) ($item['title'] ?? $item['source_article_title'] ?? ''));
                $source = trim((string) ($item['source'] ?? $item['source_name'] ?? ''));

                $links[] = [
                    'title' => $title !== '' ? $title : 'Related evidence source',
                    'source' => $source !== '' ? $source : parse_url($url, PHP_URL_HOST),
                    'url' => $url,
                ];

                if (count($links) >= 5) {
                    break;
                }
            }
        }

        if (empty($links) && $claim->status === 'completed') {
            $query = trim((string) ($claim->claim_text ?? $claim->raw_input ?? ''));
            if ($query !== '') {
                $encoded = rawurlencode($query);
                $links[] = [
                    'title' => 'Search related coverage on Google News',
                    'source' => 'google_news',
                    'url' => 'https://news.google.com/search?q=' . $encoded,
                ];
                $links[] = [
                    'title' => 'Search related coverage on Bing News',
                    'source' => 'bing_news',
                    'url' => 'https://www.bing.com/news/search?q=' . $encoded,
                ];
            }
        }

        $hasKnowledge = !empty($links);
        $suggestionText = $hasKnowledge
            ? 'Cross-check these related news/evidence links before final trust decision.'
            : 'No direct source links were found. Try another phrasing or request human verification.';

        return [
            'has_knowledge' => $hasKnowledge,
            'suggestion' => $suggestionText,
            'links' => $links,
        ];
    }

    private function normalizeCrossVerificationUrl(string $url): string
    {
        if ($url === '') {
            return $url;
        }

        $parsed = parse_url($url);
        $host = strtolower((string) ($parsed['host'] ?? ''));
        $path = trim((string) ($parsed['path'] ?? ''), '/');

        if ($host === 'jachaix.local' && str_starts_with($path, 'facts/')) {
            return '/' . $path;
        }

        return $url;
    }

    private function buildHumanVerificationSection(Claim $claim, array $crossVerificationLinks): array
    {
        $confidence = (float) ($claim->confidence_score ?? 0.0);
        $trustLabel = Str::lower((string) ($claim->trust_label ?? ''));
        $sourcesCount = is_array($claim->sources) ? count($claim->sources) : 0;

        $recommended = $claim->status !== 'completed'
            || in_array($trustLabel, ['suspicious', 'very suspicious', 'uncertain'], true)
            || $confidence < 0.55
            || $sourcesCount < 2
            || count($crossVerificationLinks) < 2;

        $reason = $recommended
            ? 'Evidence is weak or limited. Send this claim to human reviewer for final verification.'
            : 'Evidence is reasonably strong. Human review is optional.';

        return [
            'recommended' => $recommended,
            'reason' => $reason,
            'action' => [
                'method' => 'POST',
                'endpoint' => url('/api/v1/claims/' . $claim->id . '/review-request'),
                'payload_template' => [
                    'reason' => 'Possible mismatch or weak evidence, please review manually.',
                    'notes' => '',
                    'reporter_name' => 'frontend_user',
                ],
            ],
        ];
    }
}