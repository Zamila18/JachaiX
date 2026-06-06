from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.forensics import analyze_image

router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, WebP)")

    img_bytes = await file.read()
    if len(img_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image file is too small or empty")

    return analyze_image(img_bytes)
