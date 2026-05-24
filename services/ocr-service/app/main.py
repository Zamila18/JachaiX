from fastapi import FastAPI
from app.routes import ocr

app = FastAPI(
    title="JachaiX OCR Service",
    description="OCR service for image and PDF text extraction",
    version="1.0.0"
)

app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "ocr-service"}