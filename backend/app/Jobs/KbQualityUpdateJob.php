<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class KbQualityUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 600; // 10 min

    public function handle(): void
    {
        if (!Schema::hasTable('feedback_signals') || !Schema::hasTable('source_health')) {
            Log::info('[KbQuality] Adaptive KB tables not yet migrated — skipping.');
            return;
        }

        $this->updateSourceHealthScores();
        $this->updateChunkQualityScores();
        $this->flagCoverageGaps();
    }

    private function updateSourceHealthScores(): void
    {
        $cutoff = now()->subDays(30);

        $signals = DB::table('feedback_signals')
            ->where('created_at', '>=', $cutoff)
            ->select('source_names', 'signal_type')
            ->get();

        $sourceTotals   = [];
        $sourcePositive = [];

        foreach ($signals as $sig) {
            $names = json_decode($sig->source_names ?? '[]', true);
            if (!is_array($names)) {
                continue;
            }
            $isPositive = in_array($sig->signal_type, ['auto_high_confidence', 'user_correct'], true);
            foreach ($names as $name) {
                $name = (string) $name;
                $sourceTotals[$name]   = ($sourceTotals[$name]   ?? 0) + 1;
                $sourcePositive[$name] = ($sourcePositive[$name] ?? 0) + ($isPositive ? 1 : 0);
            }
        }

        foreach ($sourceTotals as $name => $total) {
            $score = round($sourcePositive[$name] / max($total, 1), 4);
            DB::table('source_health')
                ->where('source_name', $name)
                ->update(['health_score' => $score, 'updated_at' => now()]);

            // Push updated source health to all Qdrant chunks from this source
            $this->pushSourceHealthToQdrant($name, $score);
        }

        Log::info('[KbQuality] Source health scores updated', ['sources' => count($sourceTotals)]);
    }

    private function updateChunkQualityScores(): void
    {
        $cutoff = now()->subDays(30);

        $signals = DB::table('feedback_signals')
            ->where('created_at', '>=', $cutoff)
            ->select('chunk_ids', 'signal_type')
            ->get();

        $chunkAppearances = [];
        $chunkPositive    = [];
        $chunkNegative    = [];

        foreach ($signals as $sig) {
            $ids = json_decode($sig->chunk_ids ?? '[]', true);
            if (!is_array($ids)) {
                continue;
            }
            $isPositive = in_array($sig->signal_type, ['auto_high_confidence', 'user_correct'], true);
            $isNegative = in_array($sig->signal_type, ['user_incorrect'], true);

            foreach ($ids as $id) {
                $id = (string) $id;
                $chunkAppearances[$id] = ($chunkAppearances[$id] ?? 0) + 1;
                if ($isPositive) {
                    $chunkPositive[$id] = ($chunkPositive[$id] ?? 0) + 1;
                }
                if ($isNegative) {
                    $chunkNegative[$id] = ($chunkNegative[$id] ?? 0) + 1;
                }
            }
        }

        $updated = 0;
        foreach ($chunkAppearances as $chunkId => $total) {
            $pos   = $chunkPositive[$chunkId] ?? 0;
            $neg   = $chunkNegative[$chunkId] ?? 0;
            $score = ($pos * 2.0 + $total * 0.5 - $neg * 3.0) / max($total, 1);
            $score = round(max(0.10, min(1.50, $score)), 4);

            $this->pushChunkQualityToQdrant($chunkId, $score);
            $updated++;
        }

        Log::info('[KbQuality] Chunk quality scores updated', ['chunks' => $updated]);
    }

    private function pushSourceHealthToQdrant(string $sourceName, float $health): void
    {
        try {
            $embedderUrl = config('jachaix.services.embedder_url', 'http://embedder-service:5002');
            Http::timeout(10)->post($embedderUrl . '/admin/update-source-health', [
                'source_name'   => $sourceName,
                'health_score'  => $health,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[KbQuality] Qdrant source health push failed', [
                'source' => $sourceName,
                'error'  => $e->getMessage(),
            ]);
        }
    }

    private function pushChunkQualityToQdrant(string $chunkId, float $quality): void
    {
        try {
            $embedderUrl = config('jachaix.services.embedder_url', 'http://embedder-service:5002');
            Http::timeout(10)->post($embedderUrl . '/admin/update-chunk-quality', [
                'point_id'      => $chunkId,
                'quality_score' => $quality,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[KbQuality] Qdrant chunk quality push failed', [
                'chunk_id' => $chunkId,
                'error'    => $e->getMessage(),
            ]);
        }
    }

    private function flagCoverageGaps(): void
    {
        if (!Schema::hasTable('retrieval_logs') || !Schema::hasTable('coverage_gaps')) {
            return;
        }
        try {
            $cutoff = now()->subDays(7);
            // Find queries with low avg_score across >= 5 recent claims
            $gaps = DB::table('retrieval_logs')
                ->where('created_at', '>=', $cutoff)
                ->select('query_text', DB::raw('COUNT(*) as cnt'), DB::raw('AVG(avg_score) as avg_s'))
                ->groupBy('query_text')
                ->having('cnt', '>=', 5)
                ->having('avg_s', '<', 0.40)
                ->orderByDesc('cnt')
                ->take(10)
                ->get();

            foreach ($gaps as $gap) {
                DB::table('coverage_gaps')->upsert(
                    [
                        'topic_keywords' => mb_substr($gap->query_text, 0, 300),
                        'claim_count'    => $gap->cnt,
                        'avg_score'      => round($gap->avg_s, 4),
                        'resolved'       => false,
                        'flagged_at'     => now(),
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ],
                    ['topic_keywords'],
                    ['claim_count' => $gap->cnt, 'avg_score' => round($gap->avg_s, 4),
                     'resolved' => false, 'updated_at' => now()]
                );
            }

            Log::info('[KbQuality] Coverage gaps flagged', ['count' => $gaps->count()]);
        } catch (\Throwable $e) {
            Log::warning('[KbQuality] Coverage gap detection failed', ['error' => $e->getMessage()]);
        }
    }
}