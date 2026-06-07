"""
Resolve Google News RSS article redirect URLs to the real publisher URL.

Google News RSS feeds (including site:-filtered search) return encoded redirect
links of the form  https://news.google.com/rss/articles/CBMi...?oc=5 . These are
NOT the real article — fetching them with trafilatura/requests returns Google's
JavaScript interstitial page, so article bodies come back empty and the article
gets skipped by the chunker ("content too short").

This module performs Google's `batchexecute` decode handshake to recover the
real publisher URL so the full article body can then be fetched normally.

Pure stdlib + requests — no heavy dependencies, no headless browser.

A per-process circuit breaker protects the crawl: when Google starts throttling
the handshake, repeated calls just burn the full timeout and return nothing.
After a streak of consecutive failures the breaker opens and decode is skipped
for the rest of the run (callers fall back to the RSS snippet), so the crawl
stays fast and bounded instead of grinding for hours. The breaker resets on the
next process invocation, so the next scheduled crawl retries fresh.
"""
from __future__ import annotations

import json
import os
import re

import requests

_GNEWS_RE = re.compile(r"https?://news\.google\.com/rss/articles/([^?/&]+)")
_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# Cache resolved URLs in-process so the same Google News link is decoded once.
_CACHE: dict[str, str] = {}

# ── Circuit breaker (per-process; resets each fresh crawl invocation) ─────────
_FAILURE_THRESHOLD = int(os.getenv("GNEWS_DECODE_FAILURE_THRESHOLD", "6"))
_consecutive_failures = 0
_circuit_open = False


def is_google_news_url(url: str) -> bool:
    return bool(_GNEWS_RE.search(url or ""))


def _attempt_decode(art_id: str, timeout: int) -> str | None:
    """Perform the batchexecute handshake. Returns the real URL or None."""
    session = requests.Session()
    headers = {"User-Agent": _UA}

    # Step 1 — fetch the article shell to obtain the per-article signature + timestamp
    resp = session.get(
        f"https://news.google.com/rss/articles/{art_id}",
        headers=headers,
        timeout=timeout,
    )
    sig = re.search(r'data-n-a-sg="([^"]+)"', resp.text)
    ts = re.search(r'data-n-a-ts="([^"]+)"', resp.text)
    if not sig or not ts:
        return None

    # Step 2 — ask the batchexecute endpoint to resolve the real URL
    inner = (
        '["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,'
        'null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],'
        f'"{art_id}",{ts.group(1)},"{sig.group(1)}"]'
    )
    f_req = json.dumps([[["Fbv4je", inner, None, "generic"]]])
    batch = session.post(
        "https://news.google.com/_/DotsSplashUi/data/batchexecute",
        headers={
            "User-Agent": _UA,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        data={"f.req": f_req},
        timeout=timeout,
    )
    candidates = re.findall(r'https?://(?!news\.google|www\.google)[^\\"]+', batch.text)
    if candidates:
        return candidates[0].split("\\")[0]  # trim trailing JSON-escape artifacts
    return None


def decode_google_news_url(url: str, timeout: int = 8) -> str:
    """Return the real publisher URL behind a Google News article redirect.

    Returns the input URL unchanged if it is not a Google News redirect, if the
    circuit breaker is open (Google throttling), or if decoding fails — callers
    can always safely use the return value.
    """
    global _consecutive_failures, _circuit_open

    match = _GNEWS_RE.search(url or "")
    if not match:
        return url

    if url in _CACHE:
        return _CACHE[url]

    # Breaker tripped earlier this run — skip the handshake, use snippet fallback.
    if _circuit_open:
        return url

    try:
        real = _attempt_decode(match.group(1), timeout)
    except Exception:
        real = None

    if real:
        _consecutive_failures = 0      # success — reset the streak
        _CACHE[url] = real
        return real

    # Failure: count it and trip the breaker on a sustained streak.
    _consecutive_failures += 1
    if _consecutive_failures >= _FAILURE_THRESHOLD and not _circuit_open:
        _circuit_open = True
        print(
            f"[gnews_decoder] circuit breaker OPEN after {_consecutive_failures} "
            "consecutive decode failures — falling back to RSS snippets for the "
            "rest of this run (will retry next crawl).",
            flush=True,
        )
    return url
