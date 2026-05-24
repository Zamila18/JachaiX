import numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from app.utils.text_cleaning import clean_ocr_text
import io

ocr_model = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)

def extract_text_from_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    image_np = np.array(image)

    result = ocr_model.ocr(image_np, cls=True)

    extracted_lines = []
    full_text = ""
    total_confidence = 0
    count = 0

    for line in result:
        for word_info in line:
            text = word_info[1][0]
            confidence = word_info[1][1]
            extracted_lines.append({
                "text": text,
                "confidence": round(confidence, 4)
            })
            full_text += text + " "
            total_confidence += confidence
            count += 1

    avg_confidence = round(total_confidence / count, 4) if count > 0 else 0
    cleaned = clean_ocr_text(full_text.strip())

    return {
        "full_text": cleaned["text"],
        "language": cleaned["language"],
        "word_count": cleaned["word_count"],
        "avg_confidence": avg_confidence,
        "needs_human_review": avg_confidence < 0.6,
        "lines": extracted_lines
    }