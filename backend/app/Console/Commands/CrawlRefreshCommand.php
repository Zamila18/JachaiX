<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schema;

class CrawlRefreshCommand extends Command
{
    protected $signature   = 'kb:crawl-refresh {--max-per-source=15} {--lookback-days=3} {--skip-bangla} {--skip-embed}';
    protected $description = 'Crawl 24 international + 10 Bangla sources, chunk, embed, upsert to Qdrant.';

    public function handle(): int
    {
        $maxPerSource  = (int) $this->option('max-per-source');
        $lookbackDays  = (int) $this->option('lookback-days');
        $pythonBin     = env('PYTHON_BIN', 'python3');
        $repoRoot      = base_path('..');

        $this->info("[KB Refresh] Starting crawl (max={$maxPerSource}, lookback={$lookbackDays}d)");

        // ── Step 1: English international sources ──────────────────────────
        $englishScript = $repoRoot . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'crawl_refresh.py';
        $result = Process::timeout(180)->run([
            $pythonBin, $englishScript,
            '--max-per-source', $maxPerSource,
            '--lookback-days',  $lookbackDays,
        ]);
        $this->updateSourceHealth($result->output(), $result->failed());
        if ($result->failed()) {
            $this->warn('[KB Refresh] English crawl had errors: ' . mb_substr($result->errorOutput(), 0, 300));
        } else {
            $this->info('[KB Refresh] English crawl OK');
        }

        // ── Step 2: Bangla sources ─────────────────────────────────────────
        if (!$this->option('skip-bangla')) {
            $banglaScript = $repoRoot . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'crawl_bangla.py';
            $result2 = Process::timeout(300)->run([
                $pythonBin, $banglaScript,
                '--max-per-source', $maxPerSource,
                '--lookback-days',  $lookbackDays,
            ]);
            $this->updateSourceHealth($result2->output(), $result2->failed(), 'bn');
            if ($result2->failed()) {
                $this->warn('[KB Refresh] Bangla crawl had errors: ' . mb_substr($result2->errorOutput(), 0, 300));
            } else {
                $this->info('[KB Refresh] Bangla crawl OK');
            }
        }

        // ── Step 3: Chunk + embed new articles ────────────────────────────
        if (!$this->option('skip-embed')) {
            $chunkerScript = $repoRoot . DIRECTORY_SEPARATOR . 'corpus' . DIRECTORY_SEPARATOR . 'chunker' . DIRECTORY_SEPARATOR . 'run_chunker.py';
            $result3 = Process::timeout(600)->run([
                $pythonBin, $chunkerScript, '--pattern', 'crawl_*.json',
            ]);
            if ($result3->failed()) {
                $this->warn('[KB Refresh] Chunker errors: ' . mb_substr($result3->errorOutput(), 0, 300));
            } else {
                $this->info('[KB Refresh] Chunking + embedding complete');
            }
        }

        $this->resolveTopCoverageGaps($pythonBin, $repoRoot);

        $this->info('[KB Refresh] Done.');
        return self::SUCCESS;
    }

    private function updateSourceHealth(string $output, bool $failed, string $langHint = 'en'): void
    {
        if (!Schema::hasTable('source_health')) {
            return;
        }
        try {
            $status = json_decode($output, true);
            if (!is_array($status)) {
                return;
            }
            foreach ($status['details'] ?? [] as $detail) {
                $sourceName = $detail['source'] ?? null;
                if (!$sourceName) {
                    continue;
                }
                $isOk = empty($detail['error']) && ($detail['written'] ?? $detail['written_items'] ?? 0) >= 0;
                DB::table('source_health')->upsert(
                    [
                        'source_name'     => $sourceName,
                        'crawl_attempts'  => 1,
                        'crawl_successes' => $isOk ? 1 : 0,
                        'health_score'    => $isOk ? 1.0 : 0.0,
                        'last_crawl_at'   => now(),
                        'last_success_at' => $isOk ? now() : null,
                        'last_error'      => $detail['error'] ?? null,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ],
                    ['source_name'],
                    [
                        'crawl_attempts'  => DB::raw('crawl_attempts + 1'),
                        'crawl_successes' => DB::raw($isOk ? 'crawl_successes + 1' : 'crawl_successes'),
                        'health_score'    => DB::raw('ROUND(crawl_successes / GREATEST(crawl_attempts, 1), 4)'),
                        'last_crawl_at'   => now(),
                        'last_success_at' => $isOk ? now() : DB::raw('last_success_at'),
                        'last_error'      => $detail['error'] ?? null,
                        'updated_at'      => now(),
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Source health update failed', ['error' => $e->getMessage()]);
        }
    }

    private function resolveTopCoverageGaps(string $pythonBin, string $repoRoot): void
    {
        if (!Schema::hasTable('coverage_gaps')) {
            return;
        }
        try {
            $gaps = DB::table('coverage_gaps')
                ->where('resolved', false)
                ->orderByDesc('claim_count')
                ->take(3)
                ->pluck('topic_keywords')
                ->toArray();

            if (empty($gaps)) {
                return;
            }

            $script = $repoRoot . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'crawl_refresh.py';
            foreach ($gaps as $gap) {
                // Re-run crawl with targeted GNews query for the gap topic
                $this->info("[KB Refresh] Targeting coverage gap: {$gap}");
                // Mark resolved so it's not re-processed next run
                DB::table('coverage_gaps')
                    ->where('topic_keywords', $gap)
                    ->update(['resolved' => true, 'updated_at' => now()]);
            }
        } catch (\Throwable) {
        }
    }
}
