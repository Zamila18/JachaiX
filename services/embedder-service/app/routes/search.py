from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.qdrant_search import search_qdrant

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10

@router.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    return search_qdrant(req.query, req.top_k)