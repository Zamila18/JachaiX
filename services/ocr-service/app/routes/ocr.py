from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr_service import extract_text_from_image
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter()

@router.post("/image")
async def ocr_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    result = extract_text_from_image(contents)
    return {"filename": file.filename, "result": result}

@router.post("/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    contents = await file.read()
    result = extract_text_from_pdf(contents)
    return {"filename": file.filename, "result": result}