#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# JachaiX kb-worker loop
#
# Fully automatic KB refresh. Runs the crawlers + chunker on a NIGHTLY schedule
# aligned to local Bangladesh time (Asia/Dhaka, UTC+6) so it never competes with
# daytime user traffic. No manual triggering needed — the container's
# `restart: unless-stopped` keeps this alive across reboots.
#
# Behaviour:
#   • On startup: crawl ONCE only if the KB is empty (fresh setup / new teammate).
#     If the KB already has data, it skips the startup crawl so a simple container
#     restart never kicks off a daytime crawl.
#   • Then every day at CRAWL_HOUR (default 03:00 Asia/Dhaka): crawl + chunk.
# ─────────────────────────────────────────────────────────────────────────────
set -u

QDRANT_URL="${QDRANT_URL:-http://qdrant:6333}"
COLLECTION="${QDRANT_COLLECTION:-knowledge_base}"
CRAWL_HOUR="${CRAWL_HOUR:-3}"          # local hour (Asia/Dhaka) to run the nightly crawl
TZ_OFFSET_HOURS="${TZ_OFFSET_HOURS:-6}" # Bangladesh = UTC+6

echo "[kb-worker] installing python deps..."
pip install requests qdrant-client trafilatura feedparser beautifulsoup4 lxml pymysql -q

run_crawl() {
  local lookback="$1"
  # -u = unbuffered, so progress streams live in `docker logs -f`
  python -u /scripts/crawl_refresh.py --max-per-source 15 --lookback-days "$lookback"
  python -u /scripts/crawl_bangla.py  --max-per-source 15 --lookback-days "$lookback"
  python -u /corpus/chunker/run_chunker.py
}

# ── One-time bootstrap: only when the KB is empty ────────────────────────────
KB_COUNT=$(python -c "import requests,os
try:
    r=requests.get(os.environ.get('QDRANT_URL','http://qdrant:6333')+'/collections/'+os.environ.get('QDRANT_COLLECTION','knowledge_base'),timeout=5)
    print((r.json().get('result') or {}).get('points_count') or 0)
except Exception:
    print(0)
" 2>/dev/null || echo 0)

if [ "$KB_COUNT" = "0" ]; then
  echo "[kb-worker] KB is empty — running one-time bootstrap crawl (lookback 7d)"
  run_crawl 7
else
  echo "[kb-worker] KB has $KB_COUNT points — skipping startup crawl; nightly only"
fi

# ── Nightly loop, aligned to CRAWL_HOUR Asia/Dhaka (no tzdata needed) ─────────
while true; do
  SECS=$(python -c "import datetime as d
off=int(__import__('os').environ.get('TZ_OFFSET_HOURS','6'))
hour=int(__import__('os').environ.get('CRAWL_HOUR','3'))
now=d.datetime.utcnow()+d.timedelta(hours=off)
t=now.replace(hour=hour,minute=0,second=0,microsecond=0)
t=t+d.timedelta(days=1) if t<=now else t
print(int((t-now).total_seconds()))")
  echo "[kb-worker] sleeping ${SECS}s until next ${CRAWL_HOUR}:00 Asia/Dhaka"
  sleep "$SECS"
  echo "[kb-worker] nightly crawl starting at $(date -u '+%Y-%m-%d %H:%M:%S') UTC"
  run_crawl 2
  echo "[kb-worker] nightly crawl complete"
done
