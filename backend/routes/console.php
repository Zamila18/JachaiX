<?php

use App\Jobs\KbQualityUpdateJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── KB auto-refresh ───────────────────────────────────────────────────────────
// NOTE: Crawling runs fully automatically in the dedicated `kb-worker` container
// (docker-compose.yml), which has Python + crawler deps and refreshes every 24h.
// We do NOT schedule kb:crawl-refresh here because the app (php-fpm) container has
// no Python — running it here would only log failures. The `kb:crawl-refresh`
// Artisan command remains available for manual/optional use where Python exists.

// ── KB quality scoring: nightly at 04:00 (pure PHP, runs in-app) ──────────────
Schedule::job(new KbQualityUpdateJob())
    ->dailyAt('04:00')
    ->withoutOverlapping();
