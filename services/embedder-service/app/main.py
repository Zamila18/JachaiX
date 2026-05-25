from fastapi import FastAPI
from app.routes.embed import router as embed_router
from app.routes.search import router as search_router

app = FastAPI(title="JachaiX Embedder Service", version="1.0.0")

app.include_router(embed_router, prefix="/embed", tags=["Embed"])
app.include_router(search_router, prefix="", tags=["Search"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "embedder-service"}