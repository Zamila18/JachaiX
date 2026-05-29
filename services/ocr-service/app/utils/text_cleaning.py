import re
import unicodedata
from langdetect import detect


def _collapse_repeated_characters(text: str) -> str:
    # Keep at most 2 consecutive repeats to reduce OCR/spam noise.
    return re.sub(r'(.)\1{3,}', r'\1\1', text)


def _normalize_punctuation(text: str) -> str:
    text = re.sub(r'([!?.,])\1{2,}', r'\1\1', text)
    text = re.sub(r'[\u200b\u200c\u200d\ufeff]+', '', text)
    return text


def _dedupe_repeated_lines(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    seen = set()
    deduped = []
    for line in lines:
        key = re.sub(r'\s+', ' ', line.lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(line)
    return "\n".join(deduped)


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = _normalize_punctuation(text)
    text = _collapse_repeated_characters(text)
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
    normalized = _dedupe_repeated_lines(normalize_text(text))
    language = detect_language(normalized)
    return {
        "text": normalized,
        "language": language,
        "char_count": len(normalized),
        "word_count": len(normalized.split())
    }