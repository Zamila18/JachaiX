import os
from datetime import datetime, timezone, timedelta
from qdrant_client import QdrantClient
from app.services.embedder import get_embedding
from typing import Optional, List

QDRANT_HOST       = os.getenv("QDRANT_HOST",       "qdrant")
QDRANT_PORT       = int(os.getenv("QDRANT_PORT",   "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "knowledge_base")

_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

_STALE_DAYS = 30
_STALE_WEIGHT = 0.70
_AUTHORITATIVE_SOURCES = {'un_news', 'who_news', 'worldbank_bd', 'un_bangladesh'}

def _apply_freshness_decay(results: list) -> list:
    cutoff = datetime.now(timezone.utc) - timedelta(days=_STALE_DAYS)
    for r in results:
        pub = r.get('published_date', '')
        if not pub:
            continue
        source = r.get('source', '').lower()
        if source in _AUTHORITATIVE_SOURCES:
            continue
        try:
            dt = datetime.fromisoformat(pub.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if dt < cutoff:
                r['score'] = round(r['score'] * _STALE_WEIGHT, 4)
        except Exception:
            pass
    return results

def _apply_quality_weights(results: list) -> list:
    for r in results:
        quality    = float(r.get('quality_score', 1.0))
        src_health = float(r.get('source_health_score', 1.0))
        r['score'] = min(1.0, r['score'] * (quality * 0.70 + src_health * 0.30))
    return results

def update_chunk_quality(point_id: str, quality_score: float, source_health: float) -> None:
    try:
        _client.set_payload(
            collection_name=QDRANT_COLLECTION,
            payload={
                "quality_score":        round(quality_score, 4),
                "source_health_score":  round(source_health, 4),
            },
            points=[point_id],
        )
    except Exception:
        pass

def search_qdrant(
    query: str,
    top_k: int = 10,
    language_filter: Optional[str] = None,
    min_reliability: Optional[float] = None,
    sources_filter: Optional[List[str]] = None,
    published_after: Optional[str] = None,
) -> dict:
    try:
        vector = get_embedding(query)

        must_filters = []
        should_filters = []

        if language_filter:
            must_filters.append({"key": "language", "match": {"value": language_filter}})

        if min_reliability is not None:
            must_filters.append({"key": "reliability_score", "range": {"gte": float(min_reliability)}})

        if published_after:
            must_filters.append({"key": "published_date", "range": {"gte": published_after}})

        if sources_filter:
            for source in [s for s in sources_filter if isinstance(s, str) and s.strip()]:
                should_filters.append({"key": "source_name", "match": {"value": source.strip()}})

        query_filter = None
        if must_filters or should_filters:
            query_filter = {}
            if must_filters:
                query_filter["must"] = must_filters
            if should_filters:
                query_filter["should"] = should_filters

        hits = _client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=vector,
            limit=top_k,
            with_payload=True,
            query_filter=query_filter,
        )
        results = [
            {
                "score":               hit.score,
                "text":                hit.payload.get("chunk_text", ""),
                "url":                 hit.payload.get("source_url", ""),
                "title":               hit.payload.get("source_article_title", ""),
                "source":              hit.payload.get("source_name", ""),
                "reliability_score":   hit.payload.get("reliability_score", 0.5),
                "published_date":      hit.payload.get("published_date", ""),
                "quality_score":       hit.payload.get("quality_score", 1.0),
                "source_health_score": hit.payload.get("source_health_score", 1.0),
                "qdrant_id":           str(hit.id),
                "retrieval_source":    "dense",
            }
            for hit in hits
        ]
        results = _apply_freshness_decay(results)
        results = _apply_quality_weights(results)
        results.sort(key=lambda x: x['score'], reverse=True)
        return {
            "query": query,
            "results": results,
            "total": len(results),
            "filter_applied": query_filter,
        }
    except Exception as e:
        return {"query": query, "results": [], "total": 0, "error": str(e)}