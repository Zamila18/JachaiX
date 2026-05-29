# JachaiX Backend

Laravel backend for JachaiX claim analysis.

## Responsibilities

- Accept claim submissions (text/image/pdf)
- Dispatch queued analysis jobs
- Orchestrate OCR, retrieval, reranking, and verdicting
- Persist verdict, explanation, and source evidence

## Key Commands

Run inside app container:

```bash
php artisan migrate --force
php artisan queue:work --tries=3 --timeout=900
php artisan route:list
```

## API Prefix

All backend APIs are under:

```text
/api/v1
```

## Core Files

- `app/Http/Controllers/ClaimController.php`
- `app/Jobs/ProcessAnalysisJob.php`
- `routes/api.php`
- `config/jachaix.php`
