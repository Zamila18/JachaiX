from fastapi import FastAPI
from app.routes.rerank import router

app = FastAPI(title="JachaiX Reranker Service", version="1.0.0")
app.include_router(router, tags=["Rerank"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "reranker-service"}