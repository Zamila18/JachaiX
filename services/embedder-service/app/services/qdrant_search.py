import os
from qdrant_client import QdrantClient
from app.services.embedder import get_embedding
from typing import Optional, List

QDRANT_HOST       = os.getenv("QDRANT_HOST",       "qdrant")
QDRANT_PORT       = int(os.getenv("QDRANT_PORT",   "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "jachaix_knowledge")

_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

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
                "score":            hit.score,
                "text":             hit.payload.get("chunk_text", ""),
                "url":              hit.payload.get("source_url", ""),
                "title":            hit.payload.get("source_article_title", ""),
                "source":           hit.payload.get("source_name", ""),
                "reliability_score": hit.payload.get("reliability_score", 0.5),
                "published_date":   hit.payload.get("published_date", ""),
            }
            for hit in hits
        ]
        return {
            "query": query,
            "results": results,
            "total": len(results),
            "filter_applied": query_filter,
        }
    except Exception as e:
        return {"query": query, "results": [], "total": 0, "error": str(e)}