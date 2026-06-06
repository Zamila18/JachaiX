from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.reranker import rerank_documents, compress_context

router = APIRouter()


class RerankRequest(BaseModel):
    query: str
    documents: list
    top_k: int = 5


class CompressRequest(BaseModel):
    query: str
    documents: list
    max_sentences_per_doc: int = 3


@router.post("/rerank")
def rerank(req: RerankRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    if not req.documents:
        return {"query": req.query, "results": [], "total": 0}
    return rerank_documents(req.query, req.documents, req.top_k)


@router.post("/compress")
def compress(req: CompressRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    if not req.documents:
        return {"query": req.query, "results": [], "total": 0}
    compressed = compress_context(req.query, req.documents, req.max_sentences_per_doc)
    return {"query": req.query, "results": compressed, "total": len(compressed)}
