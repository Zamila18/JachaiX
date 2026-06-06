"""
JachaiX Knowledge Base Crawler — international + South Asian English sources.
Fetches RSS feeds, writes JSON articles to corpus/raw/.
Run: python crawl_refresh.py --max-per-source 15 --lookback-days 3
"""
import argparse
import hashlib
import json
import os
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import requests

_REPO_ROOT  = Path(os.getenv("REPO_ROOT", "e:/jachaix"))
RAW_DIR     = Path(os.getenv("RAW_DIR",     str(_REPO_ROOT / "corpus" / "raw")))
STATUS_PATH = Path(os.getenv("STATUS_PATH", str(_REPO_ROOT / "backend" / "storage" / "app" / "crawler_refresh.json")))

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    'health':        ['health', 'hospital', 'medicine', 'disease', 'vaccine', 'covid', 'স্বাস্থ্য', 'হাসপাতাল', 'রোগ'],
    'economics':     ['economy', 'gdp', 'inflation', 'budget', 'trade', 'bank', 'অর্থনীতি', 'বাজেট', 'ব্যবসা'],
    'politics':      ['election', 'government', 'minister', 'parliament', 'নির্বাচন', 'সরকার', 'মন্ত্রী'],
    'sports':        ['cricket', 'football', 'match', 'tournament', 'ক্রিকেট', 'খেলা', 'ফুটবল'],
    'international': ['united nations', 'usa', 'china', 'india', 'global', 'world', 'আন্তর্জাতিক', 'বিশ্ব'],
    'technology':    ['ai', 'tech', 'software', 'internet', 'digital', 'প্রযুক্তি', 'ইন্টারনেট'],
    'environment':   ['climate', 'flood', 'environment', 'disaster', 'pollution', 'জলবায়ু', 'বন্যা', 'পরিবেশ'],
    'fact-check':    ['fact check', 'rumor', 'misinformation', 'false', 'misleading', 'ভুয়া', 'গুজব', 'মিথ্যা'],
    'social':        ['community', 'religion', 'society', 'protest', 'culture', 'সমাজ', 'ধর্ম', 'সংস্কৃতি'],
}


def normalize_text(text: str) -> str:
    text = unicodedata.normalize('NFC', text)
    return re.sub(r'\s+', ' ', text).strip()


def detect_category(title: str, content: str) -> str:
    combined = (title + ' ' + content).lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return cat
    return 'general'


def fetch_full_article(url: str, timeout: int = 12) -> str:
    try:
        import trafilatura
        html = trafilatura.fetch_url(url)
        if html:
            text = trafilatura.extract(html, include_comments=False, include_tables=False, no_fallback=False)
            if text and len(text) > 300:
                return text.strip()[:3000]
    except Exception:
        pass
    return ""

SOURCES: list[dict[str, Any]] = [
    # ── INTERNATIONAL WIRE (tier-1, 0.95–0.99) ──────────────────────────────
    {
        "name": "reuters",
        "url":  "https://news.google.com/rss/search?q=site:reuters.com+world+news&hl=en-US&gl=US&ceid=US:en",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en"],
        "language": "en", "reliability_score": 0.97,
    },
    {
        "name": "ap_news",
        "url":  "https://news.google.com/rss/search?q=site:apnews.com+top+news&hl=en-US&gl=US&ceid=US:en",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en"],
        "language": "en", "reliability_score": 0.96,
    },
    {
        "name": "un_news",
        "url":  "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
        "language": "en", "reliability_score": 0.98,
    },
    {
        "name": "who_news",
        "url":  "https://www.who.int/rss-feeds/news-english.xml",
        "language": "en", "reliability_score": 0.99,
    },
    {
        "name": "bbc_world",
        "url":  "http://feeds.bbci.co.uk/news/world/rss.xml",
        "language": "en", "reliability_score": 0.93,
    },
    {
        "name": "aljazeera",
        "url":  "https://www.aljazeera.com/xml/rss/all.xml",
        "language": "en", "reliability_score": 0.90,
    },
    {
        "name": "dw_english",
        "url":  "https://rss.dw.com/xml/rss-en-all",
        "language": "en", "reliability_score": 0.90,
    },
    {
        "name": "france24",
        "url":  "https://www.france24.com/en/rss",
        "language": "en", "reliability_score": 0.90,
    },
    {
        "name": "voa_news",
        "url":  "https://www.voanews.com/api/epiqgepi-tq-mxiepkq",
        "language": "en", "reliability_score": 0.88,
    },
    {
        "name": "afp_english",
        "url":  "https://news.google.com/rss/search?q=site:afp.com+news&hl=en-US&gl=US&ceid=US:en",
        "language": "en", "reliability_score": 0.95,
    },

    # ── GLOBAL FACT-CHECKERS (0.90–0.97) ─────────────────────────────────────
    {
        "name": "fullfact",
        "url":  "https://fullfact.org/feed/",
        "language": "en", "reliability_score": 0.95,
    },
    {
        "name": "politifact",
        "url":  "https://www.politifact.com/rss/all.rss",
        "language": "en", "reliability_score": 0.93,
    },
    {
        "name": "boomlive",
        "url":  "https://www.boomlive.in/feed",
        "language": "en", "reliability_score": 0.92,
    },
    {
        "name": "altnews_india",
        "url":  "https://www.altnews.in/feed/",
        "language": "en", "reliability_score": 0.93,
    },
    {
        "name": "afp_factcheck",
        "url":  "https://news.google.com/rss/search?q=site:factcheck.afp.com&hl=en-US&gl=US&ceid=US:en",
        "language": "en", "reliability_score": 0.96,
    },

    # ── SOUTH ASIA / BANGLADESH ENGLISH (0.80–0.88) ──────────────────────────
    {
        "name": "daily_star_bd",
        "url":  "https://www.thedailystar.net/rss.xml",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:thedailystar.net&hl=en&gl=BD&ceid=BD:en"],
        "language": "en", "reliability_score": 0.82,
    },
    {
        "name": "dhaka_tribune",
        "url":  "https://news.google.com/rss/search?q=site:dhakatribune.com&hl=en&gl=BD&ceid=BD:en",
        "language": "en", "reliability_score": 0.80,
    },
    {
        "name": "bdnews24_en",
        "url":  "https://bdnews24.com/?widgetName=rssfeed&widgetId=1150&getXmlFeed=true",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:bdnews24.com&hl=en&gl=BD&ceid=BD:en"],
        "language": "en", "reliability_score": 0.85,
    },
    {
        "name": "dawn_pakistan",
        "url":  "https://www.dawn.com/feeds/home",
        "language": "en", "reliability_score": 0.82,
    },
    {
        "name": "hindu_india",
        "url":  "https://www.thehindu.com/news/national/?service=rss",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en"],
        "language": "en", "reliability_score": 0.83,
    },

    # ── BANGLADESH FACT-CHECK + LATEST NEWS (0.75–0.82) ─────────────────────
    {
        "name": "bd_factcheck_en",
        "url":  "https://news.google.com/rss/search?q=Bangladesh+fact+check+misinformation&hl=en&gl=BD&ceid=BD:en",
        "language": "en", "reliability_score": 0.82,
    },
    {
        "name": "bd_news_latest",
        "url":  "https://news.google.com/rss/search?q=Bangladesh+latest+news+2025&hl=en&gl=BD&ceid=BD:en",
        "language": "en", "reliability_score": 0.75,
    },

    # ── AUTHORITATIVE REFERENCE (0.97–0.98) ─────────────────────────────────
    {
        "name": "worldbank_bd",
        "url":  "https://news.google.com/rss/search?q=site:worldbank.org+Bangladesh&hl=en-US&gl=US&ceid=US:en",
        "language": "en", "reliability_score": 0.97,
    },
    {
        "name": "un_bangladesh",
        "url":  "https://news.google.com/rss/search?q=site:un.org+Bangladesh&hl=en-US&gl=US&ceid=US:en",
        "language": "en", "reliability_score": 0.98,
    },
]


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return re.sub(r"_+", "_", value).strip("_") or "item"


def parse_pub_date(raw: str) -> str:
    if not raw:
        return now_utc_iso()
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    return now_utc_iso()


def fetch_feed(source: dict, timeout: int) -> tuple[list[dict], str | None]:
    candidates = [source["url"]] + source.get("fallback_urls", [])
    last_error = None
    root = None

    for url in candidates:
        try:
            r = requests.get(url, timeout=timeout,
                             headers={"User-Agent": "Mozilla/5.0 JachaiX-KB-Crawler/2.0"})
            r.raise_for_status()
            root = ET.fromstring(r.content)
            source["last_success_url"] = url
            break
        except Exception as exc:
            last_error = f"{url} -> {exc}"

    if root is None:
        return [], last_error

    items: list[dict] = []
    for item in root.findall(".//item"):
        title   = (item.findtext("title")       or "").strip()
        link    = (item.findtext("link")        or "").strip()
        desc    = (item.findtext("description") or "").strip()
        pub_raw = (item.findtext("pubDate") or item.findtext("published") or "").strip()
        if not title or not link:
            continue
        content = re.sub(r"<[^>]+>", "", desc).strip()
        if len(content) < 400 and link:
            full = fetch_full_article(link, timeout=timeout)
            if len(full) > len(content):
                content = full
        items.append({
            "title":          title,
            "url":            link,
            "content":        content,
            "published_date": parse_pub_date(pub_raw),
        })

    return items, None


def write_raw_item(source: dict, item: dict) -> tuple[bool, str]:
    key     = f"{source['name']}||{item['url']}||{item['title']}"
    digest  = hashlib.sha1(key.encode()).hexdigest()[:10]
    fname   = f"crawl_{slugify(source['name'])}_{digest}.json"
    fpath   = RAW_DIR / fname
    title_n   = normalize_text(item["title"])
    content_n = normalize_text(item["content"])
    payload = {
        "source":            source["name"],
        "url":               item["url"],
        "title":             title_n,
        "content":           content_n,
        "language":          source["language"],
        "published_date":    item["published_date"],
        "reliability_score": source["reliability_score"],
        "scraped_at":        now_utc_iso(),
        "category":          detect_category(title_n, content_n),
    }
    is_new = not fpath.exists()
    fpath.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return is_new, fname


def fetch_gnews(query: str, api_key: str, max_results: int = 10) -> list[dict]:
    try:
        url = (
            f"https://gnews.io/api/v4/search"
            f"?q={requests.utils.quote(query)}"
            f"&lang=en&max={max_results}&apikey={api_key}"
        )
        r = requests.get(url, timeout=15)
        if r.status_code != 200:
            return []
        return [
            {
                "title":         a.get("title", ""),
                "url":           a.get("url", ""),
                "content":       (a.get("description", "") + " " + a.get("content", "")).strip(),
                "published_date": parse_pub_date(a.get("publishedAt", "")),
            }
            for a in r.json().get("articles", [])
            if a.get("title") and a.get("url")
        ]
    except Exception:
        return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl international + BD English RSS sources")
    parser.add_argument("--max-per-source", type=int, default=15)
    parser.add_argument("--lookback-days",  type=int, default=3)
    parser.add_argument("--timeout",        type=int, default=15)
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)

    started_at  = now_utc_iso()
    cutoff      = datetime.now(timezone.utc) - timedelta(days=max(1, args.lookback_days))
    gnews_key   = os.getenv("GNEWS_API_KEY", "")

    status: dict[str, Any] = {
        "status":          "running",
        "started_at_utc":  started_at,
        "finished_at_utc": None,
        "sources_total":   len(SOURCES),
        "sources_ok":      0,
        "sources_failed":  0,
        "items_written":   0,
        "items_new":       0,
        "details":         [],
    }

    for source in SOURCES:
        items, error = fetch_feed(source, timeout=args.timeout)
        info: dict[str, Any] = {
            "source":        source["name"],
            "url":           source["url"],
            "error":         error,
            "fetched_items": len(items),
            "written_items": 0,
            "new_items":     0,
        }

        if error and not items:
            status["sources_failed"] += 1
            status["details"].append(info)
            continue

        status["sources_ok"] += 1
        items_sorted = sorted(items, key=lambda x: x.get("published_date", ""), reverse=True)
        kept = 0

        for item in items_sorted:
            if kept >= args.max_per_source:
                break
            try:
                item_dt = datetime.fromisoformat(item["published_date"])
            except Exception:
                item_dt = datetime.now(timezone.utc)
            if item_dt < cutoff:
                continue

            is_new, fname = write_raw_item(source, item)
            kept += 1
            info["written_items"] += 1
            if is_new:
                info["new_items"] += 1

        status["items_written"] += info["written_items"]
        status["items_new"]     += info["new_items"]
        status["details"].append(info)

    # Optional GNews enrichment
    if gnews_key:
        gnews_queries = [
            "Bangladesh misinformation", "Bangladesh fact check",
            "fake news South Asia", "Bangladesh health WHO",
        ]
        gnews_source = {"name": "gnews_bd", "language": "en", "reliability_score": 0.78}
        gnews_total  = 0
        for q in gnews_queries:
            gnews_items = fetch_gnews(q, gnews_key, max_results=8)
            for item in gnews_items:
                is_new, _ = write_raw_item(gnews_source, item)
                if is_new:
                    gnews_total += 1
        if gnews_total:
            status["items_new"]     += gnews_total
            status["items_written"] += gnews_total

    status["status"]          = "ok" if status["sources_ok"] > 0 else "failed"
    status["finished_at_utc"] = now_utc_iso()

    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(status, ensure_ascii=False, indent=2))

    return 0 if status["sources_ok"] > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
