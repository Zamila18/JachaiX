from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()


class FetchRequest(BaseModel):
    url: str


@router.post("/fetch-article")
def fetch_article(req: FetchRequest):
    text = _fetch_with_trafilatura(req.url)
    if not text or len(text) < 100:
        text = _fetch_with_requests(req.url)
    return {"url": req.url, "text": text or "", "length": len(text or "")}


def _fetch_with_trafilatura(url: str) -> str:
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return ""
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            no_fallback=False,
        )
        return text.strip() if text and len(text) > 100 else ""
    except Exception:
        return ""


def _fetch_with_requests(url: str) -> str:
    try:
        import requests
        r = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0 JachaiX/1.0 (fact-checking research)"},
        )
        r.raise_for_status()
        text = re.sub(r"<[^>]+>", " ", r.text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:3000]
    except Exception:
        return ""
