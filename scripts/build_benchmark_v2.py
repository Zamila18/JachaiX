import argparse
import hashlib
import json
from pathlib import Path

NEGATIVE_KEYWORDS = [
    "মিথ্যা",
    "ভুয়া",
    "বানোয়াট",
    "গুজব",
    "ভুল",
    "এআই নির্মিত",
    "fabricated",
    "fake",
    "rumor",
    "false",
]

MISLEADING_KEYWORDS = [
    "দাবিতে",
    "প্রচার",
    "misleading",
    "out of context",
    "প্রসঙ্গহীন",
]

POSITIVE_KEYWORDS = [
    "সত্য",
    "সঠিক",
    "true",
    "confirmed",
    "প্রমাণিত",
]


def infer_label(title: str) -> str:
    t = (title or "").strip().lower()

    for kw in NEGATIVE_KEYWORDS:
        if kw in t:
            return "false"

    for kw in MISLEADING_KEYWORDS:
        if kw in t:
            return "misleading"

    for kw in POSITIVE_KEYWORDS:
        if kw in t:
            return "true"

    return "unverified"


def infer_category(source: str, title: str) -> str:
    t = (title or "").lower()
    s = (source or "").lower()

    if "covid" in t or "vaccine" in t or "স্বাস্থ্য" in t:
        return "health"
    if "নির্বাচন" in t or "মন্ত্রী" in t or "রাজনীতি" in t:
        return "politics"
    if "ক্রিকেট" in t or "match" in t or "খেলা" in t:
        return "sports"
    if "ai" in t or "এআই" in t or "deepfake" in t:
        return "ai_generated_content"
    if "bbc" in s or "daily_star" in s or "google" in s:
        return "news"
    return "fact_check"


def normalize_claim_from_title(title: str) -> str:
    claim = (title or "").strip().replace("\n", " ")
    # Remove trailing punctuation duplicates
    while claim.endswith(".."):
        claim = claim[:-1]
    return claim


def stable_id(text: str) -> str:
    h = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
    return f"v2_{h}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build benchmark v2 from corpus/raw JSON files")
    parser.add_argument("--raw-dir", default="corpus/raw")
    parser.add_argument("--output", default="scripts/benchmark_claims_v2.json")
    parser.add_argument("--max-samples", type=int, default=100)
    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    out_path = Path(args.output)

    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw directory not found: {raw_dir}")

    files = sorted(raw_dir.glob("*.json"))
    items = []
    seen_claims = set()

    # First pass: interleave sources to improve benchmark coverage.
    source_buckets = {}
    for fp in files:
        prefix = fp.name.split("_")[0]
        source_buckets.setdefault(prefix, []).append(fp)

    ordered_files = []
    max_bucket_len = max((len(v) for v in source_buckets.values()), default=0)
    for idx in range(max_bucket_len):
        for prefix in sorted(source_buckets):
            bucket = source_buckets[prefix]
            if idx < len(bucket):
                ordered_files.append(bucket[idx])

    for fp in ordered_files:
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
        except Exception:
            continue

        title = (data.get("title") or "").strip()
        if not title:
            continue

        claim_text = normalize_claim_from_title(title)
        if len(claim_text) < 12:
            continue

        if claim_text in seen_claims:
            continue
        seen_claims.add(claim_text)

        language = (data.get("language") or "bn").lower()
        source = data.get("source") or "unknown"

        expected = infer_label(title)
        category = infer_category(source, title)

        items.append(
            {
                "id": stable_id(claim_text),
                "text": claim_text,
                "language": language if language in {"bn", "en"} else "bn",
                "expected_verdict": expected,
                "category": category,
                "source": source,
                "source_file": fp.name,
            }
        )

        if len(items) >= args.max_samples:
            break

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")

    counts = {}
    for x in items:
        counts[x["expected_verdict"]] = counts.get(x["expected_verdict"], 0) + 1

    print(f"Generated {len(items)} samples -> {out_path}")
    print("Label distribution:")
    for k in sorted(counts):
        print(f"  {k}: {counts[k]}")


if __name__ == "__main__":
    main()
