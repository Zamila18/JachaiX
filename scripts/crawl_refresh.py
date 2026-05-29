import argparse
import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import requests


REPO_ROOT = Path("e:/jachaix")
RAW_DIR = REPO_ROOT / "corpus" / "raw"
STATUS_PATH = REPO_ROOT / "backend" / "storage" / "app" / "crawler_refresh.json"

SOURCES = [
    {
        "name": "reuters_world",
        "url": "https://news.google.com/rss/search?q=site:reuters.com%20world&hl=en-US&gl=US&ceid=US:en",
        "fallback_urls": [
            "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
            "https://www.reuters.com/world/rss",
            "https://www.reuters.com/rssFeed/worldNews",
        ],
        "language": "en",
        "reliability_score": 0.97,
    },
    {
        "name": "ap_top",
        "url": "https://news.google.com/rss/search?q=site:apnews.com%20top%20news&hl=en-US&gl=US&ceid=US:en",
        "fallback_urls": [
            "https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en",
            "https://apnews.com/hub/ap-top-news?output=amp",
            "https://apnews.com/hub/apf-topnews",
            "https://apnews.com/rss",
        ],
        "language": "en",
        "reliability_score": 0.96,
    },
    {
        "name": "un_news",
        "url": "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
        "language": "en",
        "reliability_score": 0.98,
    },
    {
        "name": "who_news",
        "url": "https://www.who.int/rss-feeds/news-english.xml",
        "language": "en",
        "reliability_score": 0.99,
    },
]


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value or "item"


def parse_pub_date(raw_value: str) -> str:
    if not raw_value:
        return now_utc_iso()

    # Try a few common RSS date formats with stdlib only.
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw_value, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue

    return now_utc_iso()


def fetch_feed(source: dict[str, Any], timeout: int) -> tuple[list[dict[str, Any]], str | None]:
    candidates = [source["url"], *source.get("fallback_urls", [])]
    last_error: str | None = None
    root = None

    for url in candidates:
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            source["last_success_url"] = url
            break
        except Exception as exc:  # noqa: BLE001
            last_error = f"{url} -> {exc}"

    if root is None:
        return [], last_error

    items: list[dict[str, Any]] = []
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        description = (item.findtext("description") or "").strip()
        pub_date = (item.findtext("pubDate") or item.findtext("published") or "").strip()

        if not title or not link:
            continue

        items.append(
            {
                "title": title,
                "url": link,
                "content": re.sub(r"<[^>]+>", "", description).strip(),
                "published_date": parse_pub_date(pub_date),
            }
        )

    return items, None


def write_raw_item(source: dict[str, Any], item: dict[str, Any]) -> tuple[bool, str]:
    key = f"{source['name']}||{item['url']}||{item['title']}"
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
    file_name = f"crawl_{slugify(source['name'])}_{digest}.json"
    file_path = RAW_DIR / file_name

    payload = {
        "source": source["name"],
        "url": item["url"],
        "title": item["title"],
        "content": item["content"],
        "language": source["language"],
        "published_date": item["published_date"],
        "reliability_score": source["reliability_score"],
        "scraped_at": now_utc_iso(),
    }

    is_new = not file_path.exists()
    file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return is_new, file_name


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch RSS sources and write corpus/raw items")
    parser.add_argument("--max-per-source", type=int, default=5)
    parser.add_argument("--lookback-days", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=15)
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)

    started_at = now_utc_iso()
    cutoff = datetime.now(timezone.utc) - timedelta(days=max(1, args.lookback_days))

    status: dict[str, Any] = {
        "status": "running",
        "started_at_utc": started_at,
        "finished_at_utc": None,
        "sources_total": len(SOURCES),
        "sources_ok": 0,
        "sources_failed": 0,
        "items_written": 0,
        "items_new": 0,
        "details": [],
    }

    for source in SOURCES:
        items, error = fetch_feed(source, timeout=args.timeout)
        source_info: dict[str, Any] = {
            "source": source["name"],
            "url": source["url"],
            "attempted_urls": [source["url"], *source.get("fallback_urls", [])],
            "resolved_url": source.get("last_success_url"),
            "error": error,
            "fetched_items": len(items),
            "written_items": 0,
            "new_items": 0,
            "sample_files": [],
        }

        if error:
            status["sources_failed"] += 1
            status["details"].append(source_info)
            continue

        status["sources_ok"] += 1

        # keep latest first-ish by published_date descending string (ISO)
        items_sorted = sorted(items, key=lambda x: x.get("published_date", ""), reverse=True)
        kept = 0
        for item in items_sorted:
            if kept >= max(1, args.max_per_source):
                break

            try:
                item_dt = datetime.fromisoformat(item["published_date"])
            except Exception:  # noqa: BLE001
                item_dt = datetime.now(timezone.utc)

            if item_dt < cutoff:
                continue

            is_new, file_name = write_raw_item(source, item)
            kept += 1
            source_info["written_items"] += 1
            source_info["new_items"] += 1 if is_new else 0
            if len(source_info["sample_files"]) < 3:
                source_info["sample_files"].append(file_name)

        status["items_written"] += source_info["written_items"]
        status["items_new"] += source_info["new_items"]
        status["details"].append(source_info)

    status["status"] = "ok" if status["sources_ok"] > 0 else "failed"
    status["finished_at_utc"] = now_utc_iso()

    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(status, ensure_ascii=False, indent=2))

    return 0 if status["sources_ok"] > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
