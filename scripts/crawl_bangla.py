"""
JachaiX Bangla KB Crawler — Bangla-language sources (RSS + light scraping).
Writes corpus/raw/crawl_bn_<source>_<hash>.json
Run: python crawl_bangla.py --max-per-source 15 --lookback-days 3
"""
import argparse
import hashlib
import json
import os
import re
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

_REPO_ROOT  = Path(os.getenv("REPO_ROOT", "e:/jachaix"))
RAW_DIR     = Path(os.getenv("RAW_DIR",     str(_REPO_ROOT / "corpus" / "raw")))
STATUS_PATH = Path(os.getenv("STATUS_PATH", str(_REPO_ROOT / "backend" / "storage" / "app" / "crawler_bangla_refresh.json")))

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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 JachaiX-Crawler/2.0",
    "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8",
}

# ── RSS-based Bangla sources ──────────────────────────────────────────────────
RSS_SOURCES: list[dict[str, Any]] = [
    {
        "name": "bbc_bangla",
        "url":  "https://feeds.bbci.co.uk/bengali/rss.xml",
        "language": "bn", "reliability_score": 0.90,
    },
    {
        "name": "banglatribune",
        "url":  "https://www.banglatribune.com/rss/",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:banglatribune.com&hl=bn&gl=BD&ceid=BD:bn"],
        "language": "bn", "reliability_score": 0.80,
    },
    {
        "name": "bdnews24_bn",
        "url":  "https://bdnews24.com/bangla/?widgetName=rssfeed&widgetId=1150&getXmlFeed=true",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:bdnews24.com&hl=bn&gl=BD&ceid=BD:bn"],
        "language": "bn", "reliability_score": 0.85,
    },
    {
        "name": "banglacheck",
        "url":  "https://banglacheck.org/feed/",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:banglacheck.org&hl=bn&gl=BD&ceid=BD:bn"],
        "language": "bn", "reliability_score": 0.90,
    },
    {
        "name": "voa_bangla",
        "url":  "https://www.voabangla.com/api/zmoqivq-pm",
        "fallback_urls": ["https://news.google.com/rss/search?q=site:voabangla.com&hl=bn&gl=BD&ceid=BD:bn"],
        "language": "bn", "reliability_score": 0.87,
    },
    {
        "name": "prothomalo_bn",
        "url":  "https://news.google.com/rss/search?q=site:prothomalo.com&hl=bn&gl=BD&ceid=BD:bn",
        "language": "bn", "reliability_score": 0.82,
    },
    {
        "name": "somoy_news",
        "url":  "https://news.google.com/rss/search?q=site:somoynews.tv&hl=bn&gl=BD&ceid=BD:bn",
        "language": "bn", "reliability_score": 0.78,
    },
    {
        "name": "channel_i",
        "url":  "https://news.google.com/rss/search?q=site:channelionline.com&hl=bn&gl=BD&ceid=BD:bn",
        "language": "bn", "reliability_score": 0.78,
    },
    {
        "name": "google_news_bd_bn",
        "url":  "https://news.google.com/rss/search?q=%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B6+%E0%A6%96%E0%A6%AC%E0%A6%B0&hl=bn&gl=BD&ceid=BD:bn",
        "language": "bn", "reliability_score": 0.75,
    },
    {
        "name": "google_news_bd_factcheck_bn",
        "url":  "https://news.google.com/rss/search?q=%E0%A6%97%E0%A7%81%E0%A6%9C%E0%A6%AC+%E0%A6%AF%E0%A6%BE%E0%A6%9A%E0%A6%BE%E0%A6%87+%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B6&hl=bn&gl=BD&ceid=BD:bn",
        "language": "bn", "reliability_score": 0.80,
    },
]

# ── Scraping-based Bangla sources ─────────────────────────────────────────────
SCRAPE_SOURCES: list[dict[str, Any]] = [
    {
        "name": "rumorscanner",
        "category_pages": [
            f"https://www.rumorscanner.com/category/fact-check/page/{n}/"
            for n in range(1, 16)
        ],
        "article_link_selectors": ["h2.entry-title a", "h3.entry-title a", ".post-title a"],
        "title_selectors":  ["h1.entry-title", "h1.post-title", "h1"],
        "body_selector":    "div.entry-content",
        "date_selector":    "time[datetime], .entry-date",
        "language": "bn",
        "reliability_score": 0.95,
        "max_pages": 5,
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
    formats = ["%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S GMT",
               "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S%z"]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    return now_utc_iso()


def write_raw_item(source_name: str, language: str, reliability: float, item: dict) -> tuple[bool, str]:
    key    = f"{source_name}||{item['url']}||{item['title']}"
    digest = hashlib.sha1(key.encode()).hexdigest()[:10]
    fname  = f"crawl_bn_{slugify(source_name)}_{digest}.json"
    fpath  = RAW_DIR / fname
    title_n   = normalize_text(item["title"])
    content_n = normalize_text(item.get("content", ""))
    payload = {
        "source":            source_name,
        "url":               item["url"],
        "title":             title_n,
        "content":           content_n,
        "language":          language,
        "published_date":    item.get("published_date", now_utc_iso()),
        "reliability_score": reliability,
        "scraped_at":        now_utc_iso(),
        "category":          detect_category(title_n, content_n),
    }
    is_new = not fpath.exists()
    fpath.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return is_new, fname


def fetch_rss_source(source: dict, max_items: int, cutoff: datetime, timeout: int) -> dict:
    candidates = [source["url"]] + source.get("fallback_urls", [])
    items: list[dict] = []
    error = None

    for url in candidates:
        try:
            r = requests.get(url, timeout=timeout, headers=HEADERS)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            for item in root.findall(".//item"):
                title   = (item.findtext("title") or "").strip()
                link    = (item.findtext("link")   or "").strip()
                desc    = (item.findtext("description") or "").strip()
                pub_raw = (item.findtext("pubDate") or "").strip()
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
            break
        except Exception as exc:
            error = str(exc)

    written = new = 0
    items_sorted = sorted(items, key=lambda x: x.get("published_date", ""), reverse=True)
    for item in items_sorted:
        if written >= max_items:
            break
        try:
            item_dt = datetime.fromisoformat(item["published_date"])
        except Exception:
            item_dt = datetime.now(timezone.utc)
        if item_dt < cutoff:
            continue
        is_new, _ = write_raw_item(source["name"], source["language"], source["reliability_score"], item)
        written += 1
        if is_new:
            new += 1

    return {"source": source["name"], "fetched": len(items), "written": written, "new": new, "error": error}


def fetch_scrape_source(source: dict, max_articles: int, cutoff: datetime, timeout: int) -> dict:
    name        = source["name"]
    reliability = source["reliability_score"]
    language    = source["language"]

    all_links: list[str] = []
    for page_url in source["category_pages"][:source.get("max_pages", 5)]:
        try:
            r = requests.get(page_url, headers=HEADERS, timeout=timeout)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "lxml")
            for sel in source["article_link_selectors"]:
                for a in soup.select(sel):
                    href = a.get("href", "")
                    if href.startswith("http"):
                        all_links.append(href)
            time.sleep(0.8)
        except Exception:
            pass

    all_links = list(dict.fromkeys(all_links))  # dedup, preserve order
    written = new = failed = 0

    for url in all_links[:max_articles]:
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "lxml")

            title = ""
            for sel in source["title_selectors"]:
                t = soup.select_one(sel)
                if t and len(t.get_text(strip=True)) > 5:
                    title = t.get_text(strip=True)
                    break

            content = ""
            body = soup.select_one(source["body_selector"])
            if body:
                paras = [p.get_text(strip=True) for p in body.find_all("p") if len(p.get_text(strip=True)) > 20]
                content = " ".join(paras)

            date = ""
            d = soup.select_one(source["date_selector"])
            if d:
                date = d.get("datetime") or d.get_text(strip=True)

            if not title or len(content) < 80:
                failed += 1
                continue

            item = {
                "title":          title,
                "url":            url,
                "content":        content[:3000],
                "published_date": parse_pub_date(date),
            }
            is_new, _ = write_raw_item(name, language, reliability, item)
            written += 1
            if is_new:
                new += 1
            time.sleep(1.2)
        except Exception:
            failed += 1

    return {"source": name, "fetched": len(all_links), "written": written, "new": new, "failed": failed}


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl Bangla news and fact-check sources")
    parser.add_argument("--max-per-source", type=int, default=15)
    parser.add_argument("--lookback-days",  type=int, default=3)
    parser.add_argument("--timeout",        type=int, default=15)
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)

    cutoff = datetime.now(timezone.utc) - timedelta(days=max(1, args.lookback_days))

    status: dict[str, Any] = {
        "status":          "running",
        "started_at_utc":  now_utc_iso(),
        "finished_at_utc": None,
        "details":         [],
        "total_new":       0,
        "total_written":   0,
    }

    for source in RSS_SOURCES:
        info = fetch_rss_source(source, args.max_per_source, cutoff, args.timeout)
        status["details"].append(info)
        status["total_new"]     += info["new"]
        status["total_written"] += info["written"]
        print(f"  [{source['name']}] fetched={info['fetched']} written={info['written']} new={info['new']}")

    for source in SCRAPE_SOURCES:
        info = fetch_scrape_source(source, args.max_per_source * 3, cutoff, args.timeout)
        status["details"].append(info)
        status["total_new"]     += info["new"]
        status["total_written"] += info["written"]
        print(f"  [{source['name']}] fetched={info['fetched']} written={info['written']} new={info['new']}")

    status["status"]          = "ok"
    status["finished_at_utc"] = now_utc_iso()
    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total_new": status["total_new"], "total_written": status["total_written"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
