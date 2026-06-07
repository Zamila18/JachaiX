"""
JachaiX Chunker — reads corpus/raw/, chunks articles with semantic overlap,
embeds via BGE-M3 (1024d), and upserts into Qdrant.

Run: python run_chunker.py --pattern "*.json" [--reset]
"""
import argparse
import hashlib
import json
import os
import re
import time
import unicodedata
import uuid
from pathlib import Path
import requests

RAW_DIR      = Path(os.getenv("RAW_DIR",      "/corpus/raw"))
EMBEDDER_URL = os.getenv("EMBEDDER_URL",      "http://embedder-service:5002/embed/text")
QDRANT_URL   = os.getenv("QDRANT_URL",        "http://qdrant:6333")
COLLECTION   = os.getenv("QDRANT_COLLECTION", "knowledge_base")
VECTOR_SIZE  = 1024   # Jina AI jina-embeddings-v3 dense vectors

# MySQL mirror — populates the `knowledge_base` table that powers BM25 hybrid
# retrieval in the backend. Optional: if the driver/connection is unavailable
# the chunker still writes to Qdrant (dense search) without failing.
MYSQL_HOST     = os.getenv("MYSQL_HOST",     "mysql")
MYSQL_PORT     = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jachaix")
MYSQL_USER     = os.getenv("MYSQL_USER",     "jachaix")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")

# Semantic chunking parameters
TARGET_CHARS  = 2048  # ~512 tokens at ~4 chars/token
OVERLAP_CHARS = 256   # ~64 tokens of carry-over between chunks
CHUNK_MIN_CHARS = 200

_SENTENCE_SPLIT = re.compile(r'(?<=[।.!?])\s+')


# ── Step 1: Qdrant collection management ─────────────────────────────────────

def ensure_collection(reset: bool = False):
    r = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=5)
    if r.status_code == 200:
        info = r.json().get("result", {})
        count = info.get("points_count", info.get("vectors_count", 0))
        # Read the existing collection's vector size (handles named/unnamed vector configs).
        vec_cfg = ((info.get("config") or {}).get("params") or {}).get("vectors") or {}
        existing_dim = vec_cfg.get("size")
        if existing_dim is None and isinstance(vec_cfg, dict):
            for v in vec_cfg.values():
                if isinstance(v, dict) and "size" in v:
                    existing_dim = v["size"]
                    break
        print(f"Collection '{COLLECTION}' exists — {count} points, dim={existing_dim}.")
        # Auto-heal: a stale collection with the wrong dimension (e.g. an old 768-dim
        # collection left in the qdrant volume) rejects every 1024-dim vector. Recreate it.
        if existing_dim is not None and existing_dim != VECTOR_SIZE:
            print(f"  [FIX] Vector dim mismatch (have {existing_dim}, need {VECTOR_SIZE}) — recreating collection.")
            requests.delete(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=10)
        elif reset:
            requests.delete(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=10)
            print("Deleted. Recreating...")
        else:
            print("Appending to existing collection.")
            return
    payload = {"vectors": {"size": VECTOR_SIZE, "distance": "Cosine"}}
    r = requests.put(f"{QDRANT_URL}/collections/{COLLECTION}", json=payload, timeout=10)
    if r.status_code in (200, 201):
        print(f"Collection '{COLLECTION}' created (size={VECTOR_SIZE}, Cosine)")
    else:
        raise RuntimeError(f"Failed to create collection: {r.status_code} {r.text}")


# ── Step 2: Semantic chunking with overlap ────────────────────────────────────

def _sentences(text: str) -> list[str]:
    parts = _SENTENCE_SPLIT.split(text.strip())
    return [p.strip() for p in parts if p.strip()]


def _build_overlap(sentences: list[str], max_chars: int) -> list[str]:
    overlap: list[str] = []
    total = 0
    for s in reversed(sentences):
        if total + len(s) > max_chars:
            break
        overlap.insert(0, s)
        total += len(s) + 1
    return overlap


def split_into_chunks(text: str, title: str) -> list[dict]:
    """
    Returns list of dicts: {text, chunk_type ('coarse'|'fine'), chunk_index}.
    Produces one coarse summary chunk + N fine chunks with sentence-level overlap.
    """
    header = f"শিরোনাম: {title}\n\n" if title else ""
    body   = re.sub(r'\n{3,}', '\n\n', text.strip())
    sentences = _sentences(body)

    fine_chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sent in sentences:
        slen = len(sent)
        if current_len + slen + 1 > TARGET_CHARS and current:
            chunk_text = header + ' '.join(current)
            if len(chunk_text.strip()) >= CHUNK_MIN_CHARS:
                fine_chunks.append(chunk_text)
            overlap = _build_overlap(current, OVERLAP_CHARS)
            current = overlap + [sent]
            current_len = sum(len(s) + 1 for s in current)
        else:
            current.append(sent)
            current_len += slen + 1

    if current:
        chunk_text = header + ' '.join(current)
        if len(chunk_text.strip()) >= CHUNK_MIN_CHARS:
            fine_chunks.append(chunk_text)

    # One coarse chunk = title + first 512 chars (article-level summary for broad retrieval)
    coarse_text = header + body[:512]
    coarse = [coarse_text] if len(coarse_text.strip()) >= 100 else []

    result = []
    for i, ct in enumerate(coarse):
        result.append({'text': ct, 'chunk_type': 'coarse', 'chunk_index': i})
    offset = len(coarse)
    for i, ft in enumerate(fine_chunks):
        result.append({'text': ft, 'chunk_type': 'fine', 'chunk_index': offset + i})

    return result


# ── Step 3: Embed ─────────────────────────────────────────────────────────────

def embed_text(text: str):
    try:
        r = requests.post(EMBEDDER_URL, json={"text": text}, timeout=30)
        r.raise_for_status()
        data = r.json()
        if "embedding" in data:
            return data["embedding"]
        elif "embeddings" in data:
            return data["embeddings"][0]
        return list(data.values())[0]
    except Exception as e:
        print(f"    [EMBED ERROR] {e}")
        return None


# ── Step 4: Upload to Qdrant ──────────────────────────────────────────────────

def upload_to_qdrant(chunk_id: str, vector: list, payload: dict) -> bool:
    body = {"points": [{"id": chunk_id, "vector": vector, "payload": payload}]}
    try:
        r = requests.put(
            f"{QDRANT_URL}/collections/{COLLECTION}/points",
            json=body, timeout=15
        )
        if r.status_code not in (200, 201):
            print(f"    [QDRANT ERROR] {r.status_code} {r.text[:200]}")
            return False
        return True
    except Exception as e:
        print(f"    [QDRANT ERROR] {e}")
        return False


# ── Step 4b: MySQL mirror for BM25 hybrid retrieval ──────────────────────────

def mysql_connect():
    """Return a MySQL connection, or None if unavailable (chunker still runs)."""
    if not MYSQL_PASSWORD:
        return None
    try:
        import pymysql
        conn = pymysql.connect(
            host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER,
            password=MYSQL_PASSWORD, database=MYSQL_DATABASE,
            charset="utf8mb4", autocommit=True, connect_timeout=8,
        )
        return conn
    except Exception as e:
        print(f"    [MYSQL] connection unavailable ({e}) — BM25 mirror skipped")
        return None


def mysql_upsert_chunk(conn, qdrant_id: str, title: str, content: str, source_url: str,
                       source_name: str, language: str, reliability: float,
                       pub_date: str, category: str) -> bool:
    if conn is None:
        return False
    tier = "high" if reliability >= 0.85 else ("medium" if reliability >= 0.7 else "low")
    sql = (
        "INSERT INTO knowledge_base "
        "(title, content, source_url, source_name, language, credibility_tier, "
        " qdrant_id, reliability_score, published_date, tags, created_at, updated_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW()) "
        "ON DUPLICATE KEY UPDATE "
        " title=VALUES(title), content=VALUES(content), source_url=VALUES(source_url), "
        " source_name=VALUES(source_name), language=VALUES(language), "
        " credibility_tier=VALUES(credibility_tier), reliability_score=VALUES(reliability_score), "
        " published_date=VALUES(published_date), tags=VALUES(tags), updated_at=NOW()"
    )
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (
                title[:255], content, (source_url or "")[:255], (source_name or "")[:255],
                (language or "bn")[:10], tier, qdrant_id, reliability,
                (pub_date or "")[:50], json.dumps([category], ensure_ascii=False),
            ))
        return True
    except Exception as e:
        print(f"    [MYSQL ERROR] {e}")
        return False


def build_chunk_id(source: str, url: str, title: str, chunk_index: int, chunk_text: str) -> str:
    stable_key = "||".join([
        source.strip().lower(),
        url.strip().lower(),
        title.strip().lower(),
        str(chunk_index),
        chunk_text.strip().lower(),
    ])
    hashed = hashlib.sha1(stable_key.encode("utf-8")).hexdigest()
    return str(uuid.uuid5(uuid.NAMESPACE_URL, hashed))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Chunk articles and upsert into Qdrant")
    parser.add_argument("--pattern", default="*.json", help="Glob pattern under corpus/raw")
    parser.add_argument("--reset",   action="store_true", help="Delete and recreate Qdrant collection")
    args = parser.parse_args()

    ensure_collection(reset=args.reset)

    mysql_conn = mysql_connect()
    mysql_written = 0
    if mysql_conn:
        print("MySQL BM25 mirror: connected.")

    all_files = sorted(RAW_DIR.glob(args.pattern))
    if not all_files:
        print(f"No files matched pattern: {args.pattern}")
        return

    print(f"\nProcessing {len(all_files)} articles...\n")

    total_uploaded = 0
    total_failed   = 0
    skipped        = 0

    for file_idx, filepath in enumerate(all_files):
        with open(filepath, encoding="utf-8") as f:
            article = json.load(f)

        content     = unicodedata.normalize('NFC', article.get("content", "").strip())
        title       = unicodedata.normalize('NFC', article.get("title",   ""))
        url         = article.get("url",     "")
        source      = article.get("source",  "unknown")
        language    = article.get("language", "bn")
        pub_date    = article.get("published_date", "")
        reliability = float(article.get("reliability_score", 0.75))
        category    = article.get("category", "general")

        if len(content) < CHUNK_MIN_CHARS:
            skipped += 1
            continue

        chunks = split_into_chunks(content, title)
        if not chunks:
            skipped += 1
            continue

        print(f"[{file_idx+1:3d}/{len(all_files)}] {source:20s} | {len(chunks):2d} chunks | {title[:40]}")

        for chunk in chunks:
            chunk_text  = unicodedata.normalize('NFC', chunk['text'])
            chunk_type  = chunk['chunk_type']
            chunk_index = chunk['chunk_index']

            vector = embed_text(chunk_text)
            if vector is None:
                total_failed += 1
                continue

            payload = {
                "chunk_text":           chunk_text,
                "source_article_title": title,
                "source_url":           url,
                "published_date":       pub_date,
                "chunk_index":          chunk_index,
                "chunk_type":           chunk_type,
                "language":             language,
                "source_name":          source,
                "reliability_score":    reliability,
                "category":             category,
                # Self-learning fields — defaults; updated nightly by KbQualityUpdateJob
                "quality_score":        1.0,
                "source_health_score":  1.0,
                "freshness_weight":     1.0,
            }

            chunk_id = build_chunk_id(source, url, title, chunk_index, chunk_text)
            ok = upload_to_qdrant(chunk_id, vector, payload)
            if ok:
                total_uploaded += 1
                # Mirror into MySQL so BM25 keyword retrieval has the same chunk
                if mysql_upsert_chunk(mysql_conn, chunk_id, title, chunk_text, url,
                                      source, language, reliability, pub_date, category):
                    mysql_written += 1
            else:
                total_failed += 1

            time.sleep(0.05)

    print(f"\n{'='*55}")
    print("DONE")
    print(f"Articles processed : {len(all_files) - skipped}")
    print(f"Articles skipped   : {skipped} (content too short)")
    print(f"Chunks uploaded    : {total_uploaded}")
    print(f"Chunks failed      : {total_failed}")
    print(f"MySQL BM25 mirror  : {mysql_written} rows" + ("" if mysql_conn else " (skipped — no DB)"))

    r = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=5)
    info = r.json().get("result", {})
    print(f"\nQdrant vectors_count : {info.get('vectors_count', '?')}")
    print(f"Qdrant points_count  : {info.get('points_count', '?')}")

    vec = embed_text("বাংলাদেশে ভুয়া খবর")
    if vec:
        sr = requests.post(
            f"{QDRANT_URL}/collections/{COLLECTION}/points/search",
            json={"vector": vec, "limit": 3, "with_payload": True}, timeout=15
        )
        results = sr.json().get("result", [])
        print("\nTest search: 'বাংলাদেশে ভুয়া খবর'")
        for i, hit in enumerate(results):
            p = hit.get("payload", {})
            print(f"  [{i+1}] score={hit['score']:.3f} | {p.get('source_name')} | {p.get('source_article_title','')[:50]}")

    print("\nQdrant knowledge base ready!")


if __name__ == "__main__":
    main()
