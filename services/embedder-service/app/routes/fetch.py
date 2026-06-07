from fastapi import APIRouter
from pydantic import BaseModel
import json
import re

router = APIRouter()

_GNEWS_RE = re.compile(r"https?://news\.google\.com/rss/articles/([^?/&]+)")
_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


class FetchRequest(BaseModel):
    url: str


def _decode_google_news_url(url: str, timeout: int = 8) -> str:
    """Resolve a Google News RSS redirect link to the real publisher URL.

    Returns the input unchanged if it is not a Google News link or decoding
    fails. Live web fallback (Auto-RAG) and URL-input both pass through here,
    so without this they would only ever see Google's JS interstitial page.
    """
    match = _GNEWS_RE.search(url or "")
    if not match:
        return url
    art_id = match.group(1)
    try:
        import requests
        session = requests.Session()
        headers = {"User-Agent": _UA}
        resp = session.get(
            f"https://news.google.com/rss/articles/{art_id}", headers=headers, timeout=timeout
        )
        sig = re.search(r'data-n-a-sg="([^"]+)"', resp.text)
        ts = re.search(r'data-n-a-ts="([^"]+)"', resp.text)
        if not sig or not ts:
            return url
        inner = (
            '["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,'
            'null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],'
            f'"{art_id}",{ts.group(1)},"{sig.group(1)}"]'
        )
        f_req = json.dumps([[["Fbv4je", inner, None, "generic"]]])
        batch = session.post(
            "https://news.google.com/_/DotsSplashUi/data/batchexecute",
            headers={
                "User-Agent": _UA,
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            data={"f.req": f_req},
            timeout=timeout,
        )
        candidates = re.findall(r'https?://(?!news\.google|www\.google)[^\\"]+', batch.text)
        if candidates:
            return candidates[0].split("\\")[0]
    except Exception:
        pass
    return url


@router.post("/fetch-article")
def fetch_article(req: FetchRequest):
    real_url = _decode_google_news_url(req.url)
    text = _fetch_with_trafilatura(real_url)
    if not text or len(text) < 100:
        text = _fetch_with_requests(real_url)
    return {"url": real_url, "text": text or "", "length": len(text or "")}


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
