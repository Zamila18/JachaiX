<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class EvaluationController extends Controller
{
    public function latest(): JsonResponse
    {
        $humanPath = $this->resolveReportPath(
            $this->reportDirectories(),
            [
                'eval_human_latest.json',
                'eval_human_quick_results.json',
                'eval_results_human_latest.json',
                'eval_results_latest.json',
                'eval_v2_quick_results.json',
                'eval_must_pass_quick_results.json',
            ],
            ['human'],
            ['multilingual']
        );

        $multilingualPath = $this->resolveReportPath(
            $this->reportDirectories(),
            [
                'eval_multilingual_slice_results.json',
                'eval_results_multilingual_latest.json',
            ],
            ['multilingual'],
            []
        );

        $human = $this->readReport($humanPath);
        $multilingual = $this->readReport($multilingualPath);

        $humanSummary = $this->summarize($human, $humanPath);
        $multilingualSummary = $this->summarize($multilingual, $multilingualPath);

        $latest = $this->pickLatest($humanSummary, $multilingualSummary);

        return response()->json([
            'success' => true,
            'available' => (bool) ($humanSummary || $multilingualSummary),
            'latest' => $latest,
            'reports' => [
                'human' => $humanSummary,
                'multilingual' => $multilingualSummary,
            ],
            'paths' => [
                'human' => $humanPath,
                'multilingual' => $multilingualPath,
            ],
        ]);
    }

    private function reportDirectories(): array
    {
        $configuredDir = env('JX_EVAL_REPORTS_DIR');

        $candidates = array_filter([
            $configuredDir ? (string) $configuredDir : null,
            storage_path('app/evaluation'),
            storage_path('app'),
            realpath(base_path('../scripts')) ?: base_path('../scripts'),
            '/var/www/scripts',
        ]);

        $existing = array_values(array_filter($candidates, fn (string $dir): bool => is_dir($dir)));

        return array_values(array_unique($existing));
    }

    private function resolveReportPath(
        array $reportDirectories,
        array $preferredFileNames,
        array $includeTokens,
        array $excludeTokens
    ): ?string {
        foreach ($reportDirectories as $dir) {
            foreach ($preferredFileNames as $fileName) {
                $path = $dir . DIRECTORY_SEPARATOR . $fileName;
                if (is_file($path)) {
                    return $path;
                }
            }
        }

        $allReports = [];
        foreach ($reportDirectories as $dir) {
            $matches = glob($dir . DIRECTORY_SEPARATOR . 'eval*.json') ?: [];
            if ($matches) {
                $allReports = array_merge($allReports, $matches);
            }
        }

        $filtered = array_filter($allReports, function (string $path) use ($includeTokens, $excludeTokens): bool {
            $name = strtolower((string) basename($path));

            foreach ($includeTokens as $token) {
                if (!str_contains($name, strtolower($token))) {
                    return false;
                }
            }

            foreach ($excludeTokens as $token) {
                if (str_contains($name, strtolower($token))) {
                    return false;
                }
            }

            return true;
        });

        if (empty($filtered)) {
            return null;
        }

        usort($filtered, function (string $a, string $b): int {
            $aTime = filemtime($a) ?: 0;
            $bTime = filemtime($b) ?: 0;
            return $bTime <=> $aTime;
        });

        return $filtered[0] ?? null;
    }

    private function readReport(?string $path): ?array
    {
        if (!$path || !is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return null;
        }

        $decoded = json_decode($contents, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function summarize(?array $report, ?string $path): ?array
    {
        if (!$report) {
            return null;
        }

        $metrics = $report['metrics'] ?? [];
        $generatedAtUnix = (int) ($report['generated_at_unix'] ?? 0);
        if ($generatedAtUnix <= 0 && $path && is_file($path)) {
            $generatedAtUnix = (int) (filemtime($path) ?: 0);
        }

        return [
            'generated_at_unix' => $generatedAtUnix,
            'input' => (string) ($report['input'] ?? ''),
            'samples_total' => (int) ($metrics['samples_total'] ?? 0),
            'samples_scored' => (int) ($metrics['samples_scored'] ?? 0),
            'accuracy' => (float) ($metrics['accuracy'] ?? 0),
            'macro_precision' => (float) ($metrics['macro_precision'] ?? 0),
            'macro_recall' => (float) ($metrics['macro_recall'] ?? 0),
            'macro_f1' => (float) ($metrics['macro_f1'] ?? 0),
        ];
    }

    private function pickLatest(?array $human, ?array $multilingual): ?array
    {
        if (!$human && !$multilingual) {
            return null;
        }

        if (!$human) {
            return ['name' => 'multilingual', 'summary' => $multilingual];
        }

        if (!$multilingual) {
            return ['name' => 'human', 'summary' => $human];
        }

        if (($human['generated_at_unix'] ?? 0) >= ($multilingual['generated_at_unix'] ?? 0)) {
            return ['name' => 'human', 'summary' => $human];
        }

        return ['name' => 'multilingual', 'summary' => $multilingual];
    }
}
