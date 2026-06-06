import os
import requests

JINA_API_KEY = os.getenv("JINA_API_KEY", "")
JINA_MODEL   = os.getenv("JINA_MODEL", "jina-embeddings-v3")
JINA_DIMS    = int(os.getenv("JINA_DIMS", "1024"))
JINA_URL     = "https://api.jina.ai/v1/embeddings"

def _call_jina(texts: list[str], input_type: str = "passage") -> list[list[float]]:
    resp = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {JINA_API_KEY}", "Content-Type": "application/json"},
        json={
            "model":       JINA_MODEL,
            "input":       texts,
            "input_type":  input_type,
            "dimensions":  JINA_DIMS,
            "encoding_type": "float",
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data["data"]]


def embed_text(text: str, input_type: str = "passage") -> dict:
    vectors = _call_jina([text], input_type=input_type)
    vector  = vectors[0]
    return {
        "text":       text,
        "embedding":  vector,
        "dimensions": len(vector),
        "model":      JINA_MODEL,
    }


def get_embedding(text: str) -> list:
    vectors = _call_jina([text], input_type="query")
    return vectors[0]
