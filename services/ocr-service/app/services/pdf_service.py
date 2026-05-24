import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from app.services.ocr_service import extract_text_from_image
import io

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    pdf = fitz.open(stream=file_bytes, filetype="pdf")
    
    all_pages = []
    full_text = ""
    
    for page_num in range(len(pdf)):
        page = pdf[page_num]
        
        # Try to extract text directly first
        text = page.get_text()
        
        if text.strip():
            all_pages.append({
                "page": page_num + 1,
                "full_text": text.strip(),
                "method": "direct"
            })
            full_text += text.strip() + "\n"
        else:
            # If no text, use OCR on the page image
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            ocr_result = extract_text_from_image(img_bytes)
            
            all_pages.append({
                "page": page_num + 1,
                "full_text": ocr_result["full_text"],
                "method": "ocr"
            })
            full_text += ocr_result["full_text"] + "\n"
    
    return {
        "total_pages": len(pdf),
        "full_text": full_text.strip(),
        "pages": all_pages
    }