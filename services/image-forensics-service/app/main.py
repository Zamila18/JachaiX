from fastapi import FastAPI
from app.routes.forensics import router

app = FastAPI(title="JachaiX Image Forensics Service", version="1.0.0")
app.include_router(router, tags=["Forensics"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "image-forensics-service"}
