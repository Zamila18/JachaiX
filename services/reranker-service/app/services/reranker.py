import re as _re
from FlagEmbedding import FlagReranker

# bge-reranker-base: 180M params — 5x faster + 3x less RAM than v2-m3, multilingual (Bengali+English)
_model = FlagReranker('BAAI/bge-reranker-base', use_fp16=True)

_SENTENCE_SPLIT = _re.compile(r'(?<=[।.!?])\s+')


def rerank_documents(query: str, documents: list, top_k: int = 5) -> dict:
    try:
        pairs  = [[query, doc.get("text", "")] for doc in documents]
        scores = _model.compute_score(pairs, normalize=True)

        scored = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
        results = []
        for score, doc in scored[:top_k]:
            doc = dict(doc)
            doc["rerank_score"] = round(float(score), 4)
            results.append(doc)

        return {"query": query, "results": results, "total": len(results)}

    except Exception as e:
        return {"query": query, "results": documents[:top_k],
                "total": len(documents[:top_k]), "error": str(e)}


def compress_context(query: str, documents: list, max_sentences: int = 3) -> list:
    """
    Trims each document to its most relevant sentences using the reranker.
    Falls back to original text on any error.
    """
    compressed = []
    for doc in documents:
        text = doc.get("text", "")
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]

        if len(sentences) <= max_sentences:
            compressed.append(doc)
            continue

        try:
            pairs  = [[query, s] for s in sentences]
            scores = _model.compute_score(pairs, normalize=True)
            ranked = sorted(zip(scores, sentences), reverse=True)
            top    = [s for _, s in ranked[:max_sentences]]
            doc    = dict(doc)
            doc["text"]       = " ".join(top)
            doc["compressed"] = True
        except Exception:
            pass  # keep original on failure

        compressed.append(doc)

    return compressed
