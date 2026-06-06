from fastapi import FastAPI
from pydantic import BaseModel
from app.routes.embed import router as embed_router
from app.routes.search import router as search_router
from app.routes.fetch import router as fetch_router
from app.services.qdrant_search import update_chunk_quality, QDRANT_COLLECTION
from qdrant_client import QdrantClient
import os

app = FastAPI(title="JachaiX Embedder Service", version="2.0.0")

app.include_router(embed_router, prefix="/embed", tags=["Embed"])
app.include_router(search_router, prefix="", tags=["Search"])
app.include_router(fetch_router, prefix="", tags=["Fetch"])

_admin_client = QdrantClient(
    host=os.getenv("QDRANT_HOST", "qdrant"),
    port=int(os.getenv("QDRANT_PORT", "6333")),
)


class ChunkQualityUpdate(BaseModel):
    point_id: str
    quality_score: float
    source_health: float = 1.0


class SourceHealthUpdate(BaseModel):
    source_name: str
    health_score: float


@app.get("/health")
def health():
    import os
    return {"status": "ok", "service": "embedder-service", "model": os.getenv("JINA_MODEL", "jina-embeddings-v3")}


@app.post("/admin/update-chunk-quality")
def admin_update_chunk_quality(req: ChunkQualityUpdate):
    update_chunk_quality(req.point_id, req.quality_score, req.source_health)
    return {"status": "ok", "point_id": req.point_id, "quality_score": req.quality_score}


@app.post("/admin/update-source-health")
def admin_update_source_health(req: SourceHealthUpdate):
    try:
        # Scroll through all points from this source and update source_health_score
        offset = None
        updated = 0
        while True:
            results, next_offset = _admin_client.scroll(
                collection_name=QDRANT_COLLECTION,
                scroll_filter={"must": [{"key": "source_name", "match": {"value": req.source_name}}]},
                limit=100,
                offset=offset,
                with_payload=False,
            )
            if not results:
                break
            ids = [str(r.id) for r in results]
            _admin_client.set_payload(
                collection_name=QDRANT_COLLECTION,
                payload={"source_health_score": round(req.health_score, 4)},
                points=ids,
            )
            updated += len(ids)
            if next_offset is None:
                break
            offset = next_offset
        return {"status": "ok", "source_name": req.source_name, "chunks_updated": updated}
    except Exception as e:
        return {"status": "error", "error": str(e)}