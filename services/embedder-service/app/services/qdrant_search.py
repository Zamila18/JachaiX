import os
from qdrant_client import QdrantClient
from app.services.embedder import get_embedding

QDRANT_HOST       = os.getenv("QDRANT_HOST",       "qdrant")
QDRANT_PORT       = int(os.getenv("QDRANT_PORT",   "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "jachaix_knowledge")

_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def search_qdrant(query: str, top_k: int = 10) -> dict:
    try:
        vector = get_embedding(query)
        hits = _client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=vector,
            limit=top_k,
            with_payload=True,
        )
        results = [
            {
                "score":  hit.score,
                "text":   hit.payload.get("text", ""),
                "url":    hit.payload.get("url", ""),
                "title":  hit.payload.get("title", ""),
                "source": hit.payload.get("source", ""),
            }
            for hit in hits
        ]
        return {"query": query, "results": results, "total": len(results)}
    except Exception as e:
        return {"query": query, "results": [], "total": 0, "error": str(e)}