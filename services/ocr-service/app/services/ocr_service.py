import numpy as np
from PIL import Image
import easyocr
from app.utils.text_cleaning import clean_ocr_text
import io

# EasyOCR supports Bangla ('bn') and English ('en') — models cached at container path
ocr_reader = easyocr.Reader(['bn', 'en'], gpu=False, model_storage_directory='/root/.EasyOCR/model')

def extract_text_from_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    image_np = np.array(image)

    result = ocr_reader.readtext(image_np)

    extracted_lines = []
    full_text = ""
    total_confidence = 0
    count = 0

    for (bbox, text, confidence) in result:
        confidence_value = float(confidence)
        extracted_lines.append({
            "text": text,
            "confidence": round(confidence_value, 4)
        })
        full_text += text + " "
        total_confidence += confidence_value
        count += 1

    avg_confidence = float(round(total_confidence / count, 4)) if count > 0 else 0.0
    cleaned = clean_ocr_text(full_text.strip())
    needs_human_review = bool(avg_confidence < 0.6)

    return {
        "full_text": cleaned["text"],
        "language": cleaned["language"],
        "word_count": cleaned["word_count"],
        "avg_confidence": avg_confidence,
        "needs_human_review": needs_human_review,
        "lines": extracted_lines
    }