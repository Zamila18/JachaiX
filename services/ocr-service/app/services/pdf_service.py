import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from app.services.ocr_service import extract_text_from_image
from app.utils.text_cleaning import clean_ocr_text
import io


def _normalize_line_for_freq(line: str) -> str:
    return " ".join(line.strip().lower().split())


def _remove_repeated_headers_footers(page_entries: list[dict]) -> tuple[list[dict], int]:
    top_counts: dict[str, int] = {}
    bottom_counts: dict[str, int] = {}

    for entry in page_entries:
        lines = [ln.strip() for ln in entry.get("full_text", "").splitlines() if ln.strip()]
        if not lines:
            continue
        top = _normalize_line_for_freq(lines[0])
        bottom = _normalize_line_for_freq(lines[-1])
        top_counts[top] = top_counts.get(top, 0) + 1
        bottom_counts[bottom] = bottom_counts.get(bottom, 0) + 1

    repeated_top = {ln for ln, cnt in top_counts.items() if cnt >= 2 and len(ln) > 3}
    repeated_bottom = {ln for ln, cnt in bottom_counts.items() if cnt >= 2 and len(ln) > 3}

    cleaned_entries: list[dict] = []
    removed = 0

    for entry in page_entries:
        lines = [ln.strip() for ln in entry.get("full_text", "").splitlines() if ln.strip()]
        if not lines:
            cleaned_entries.append(entry)
            continue

        if _normalize_line_for_freq(lines[0]) in repeated_top:
            lines = lines[1:]
            removed += 1
        if lines and _normalize_line_for_freq(lines[-1]) in repeated_bottom:
            lines = lines[:-1]
            removed += 1

        updated = dict(entry)
        updated["full_text"] = "\n".join(lines).strip()
        cleaned_entries.append(updated)

    return cleaned_entries, removed

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    pdf = fitz.open(stream=file_bytes, filetype="pdf")

    all_pages = []
    direct_pages = 0
    ocr_pages = 0

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
            direct_pages += 1
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
            ocr_pages += 1

    cleaned_pages, removed_lines = _remove_repeated_headers_footers(all_pages)
    merged_text = "\n".join(p.get("full_text", "") for p in cleaned_pages).strip()
    cleaned = clean_ocr_text(merged_text)

    return {
        "total_pages": len(pdf),
        "direct_pages": direct_pages,
        "ocr_pages": ocr_pages,
        "removed_repeated_lines": removed_lines,
        "language": cleaned["language"],
        "word_count": cleaned["word_count"],
        "avg_confidence": 0.95 if ocr_pages == 0 else 0.7,
        "full_text": cleaned["text"],
        "pages": cleaned_pages
    }