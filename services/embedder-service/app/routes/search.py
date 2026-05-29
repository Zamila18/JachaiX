from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.qdrant_search import search_qdrant
from typing import Optional, List

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    language_filter: Optional[str] = None
    min_reliability: Optional[float] = None
    sources_filter: Optional[List[str]] = None
    published_after: Optional[str] = None

@router.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    return search_qdrant(
        req.query,
        req.top_k,
        language_filter=req.language_filter,
        min_reliability=req.min_reliability,
        sources_filter=req.sources_filter,
        published_after=req.published_after,
    )