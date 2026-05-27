"""
JachaiX Chunker — reads corpus/raw/, chunks articles, embeds, stores in Qdrant.
Run: E:\Python310\python.exe run_chunker.py
"""
import json, uuid, time, re
from pathlib import Path
import requests

RAW_DIR      = Path("E:/jachaix/corpus/raw")
EMBEDDER_URL = "http://localhost:5002/embed/text"
QDRANT_URL   = "http://localhost:6333"
COLLECTION   = "knowledge_base"
VECTOR_SIZE  = 768

CHUNK_MAX_CHARS = 2800   # ~700 tokens
CHUNK_MIN_CHARS = 200


# ── Step 1: Create Qdrant collection ─────────────────────────────────────────

def ensure_collection():
    r = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=5)
    if r.status_code == 200:
        count = r.json().get("result", {}).get("vectors_count", 0)
        print(f"Collection '{COLLECTION}' exists — {count} vectors already stored.")
        ans = input("Delete and re-index from scratch? [y/N]: ").strip().lower()
        if ans == "y":
            requests.delete(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=10)
            print("Deleted.")
        else:
            print("Keeping existing collection. Will append new chunks.")
            return
    # Create
    payload = {"vectors": {"size": VECTOR_SIZE, "distance": "Cosine"}}
    r = requests.put(f"{QDRANT_URL}/collections/{COLLECTION}", json=payload, timeout=10)
    if r.status_code in (200, 201):
        print(f"✅ Collection '{COLLECTION}' created (size={VECTOR_SIZE}, Cosine)")
    else:
        raise RuntimeError(f"Failed to create collection: {r.status_code} {r.text}")


# ── Step 2: Chunking ──────────────────────────────────────────────────────────

def split_into_chunks(text: str, title: str) -> list:
    text = re.sub(r'\n{3,}', '\n\n', text.strip())
    paragraphs = re.split(r'\n\n+', text)
    if len(paragraphs) <= 1:
        paragraphs = re.split(r'(?<=[।.!?])\s+', text)

    chunks = []
    current = f"শিরোনাম: {title}\n\n" if title else ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) + 2 <= CHUNK_MAX_CHARS:
            current += para + " "
        else:
            if len(current.strip()) >= CHUNK_MIN_CHARS:
                chunks.append(current.strip())
            if len(para) > CHUNK_MAX_CHARS:
                sentences = re.split(r'(?<=[।.!?])\s+', para)
                current = ""
                for sent in sentences:
                    if len(current) + len(sent) + 1 <= CHUNK_MAX_CHARS:
                        current += sent + " "
                    else:
                        if len(current.strip()) >= CHUNK_MIN_CHARS:
                            chunks.append(current.strip())
                        current = sent + " "
            else:
                current = para + " "

    if len(current.strip()) >= CHUNK_MIN_CHARS:
        chunks.append(current.strip())

    return chunks


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
        return r.status_code in (200, 201)
    except Exception as e:
        print(f"    [QDRANT ERROR] {e}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ensure_collection()

    all_files = sorted(RAW_DIR.glob("*.json"))
    print(f"\nProcessing {len(all_files)} articles...\n")

    total_uploaded = 0
    total_failed   = 0
    skipped        = 0

    for file_idx, filepath in enumerate(all_files):
        with open(filepath, encoding="utf-8") as f:
            article = json.load(f)

        content     = article.get("content", "").strip()
        title       = article.get("title", "")
        url         = article.get("url", "")
        source      = article.get("source", "unknown")
        language    = article.get("language", "bn")
        pub_date    = article.get("published_date", "")
        reliability = article.get("reliability_score", 0.75)

        if len(content) < CHUNK_MIN_CHARS:
            skipped += 1
            continue

        chunks = split_into_chunks(content, title)
        if not chunks:
            skipped += 1
            continue

        print(f"[{file_idx+1:3d}/{len(all_files)}] {source:15s} | {len(chunks)} chunks | {title[:45]}")

        for chunk_idx, chunk_text in enumerate(chunks):
            vector = embed_text(chunk_text)
            if vector is None:
                total_failed += 1
                continue

            payload = {
                "chunk_text":           chunk_text,
                "source_article_title": title,
                "source_url":           url,
                "published_date":       pub_date,
                "chunk_index":          chunk_idx,
                "language":             language,
                "source_name":          source,
                "reliability_score":    reliability,
            }

            ok = upload_to_qdrant(str(uuid.uuid4()), vector, payload)
            if ok:
                total_uploaded += 1
            else:
                total_failed += 1

            time.sleep(0.05)

    print(f"\n{'='*55}")
    print("DONE")
    print(f"Articles processed : {len(all_files) - skipped}")
    print(f"Articles skipped   : {skipped} (content too short)")
    print(f"Chunks uploaded    : {total_uploaded}")
    print(f"Chunks failed      : {total_failed}")

    # Verify
    r = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}", timeout=5)
    info = r.json().get("result", {})
    print(f"\nQdrant vectors_count : {info.get('vectors_count', '?')}")
    print(f"Qdrant points_count  : {info.get('points_count', '?')}")

    # Quick test search
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

    print("\n✅ Qdrant knowledge base ready!")


if __name__ == "__main__":
    main()
