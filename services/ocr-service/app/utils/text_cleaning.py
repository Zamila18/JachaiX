import re
import unicodedata
from langdetect import detect

def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    return text

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return lang
    except:
        return "unknown"

def clean_ocr_text(text: str) -> dict:
    normalized = normalize_text(text)
    language = detect_language(normalized)
    return {
        "text": normalized,
        "language": language,
        "char_count": len(normalized),
        "word_count": len(normalized.split())
    }