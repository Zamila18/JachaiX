import re as _re
import torch
import numpy as _np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ms-marco-MiniLM-L-6-v2: 22M params, English-optimized cross-encoder, ~0.3s on CPU
_MODEL_ID  = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
_tokenizer = AutoTokenizer.from_pretrained(_MODEL_ID)
_model     = AutoModelForSequenceClassification.from_pretrained(_MODEL_ID)
_model.eval()

_SENTENCE_SPLIT = _re.compile(r'(?<=[।.!?])\s+')


def _sigmoid(arr):
    return (1.0 / (1.0 + _np.exp(-_np.asarray(arr, dtype=_np.float32)))).tolist()


def _score_pairs(pairs: list) -> list:
    with torch.no_grad():
        enc    = _tokenizer(pairs, padding=True, truncation=True,
                            return_tensors='pt', max_length=512)
        logits = torch.atleast_1d(_model(**enc).logits.squeeze(-1))
    return _sigmoid(logits.numpy())


def rerank_documents(query: str, documents: list, top_k: int = 5) -> dict:
    try:
        pairs  = [[query, doc.get("text", "")] for doc in documents]
        scores = _score_pairs(pairs)

        scored  = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
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
    compressed = []
    for doc in documents:
        text      = doc.get("text", "")
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]

        if len(sentences) <= max_sentences:
            compressed.append(doc)
            continue

        try:
            pairs  = [[query, s] for s in sentences]
            scores = _score_pairs(pairs)
            ranked = sorted(zip(scores, sentences), reverse=True)
            top    = [s for _, s in ranked[:max_sentences]]
            doc    = dict(doc)
            doc["text"]       = " ".join(top)
            doc["compressed"] = True
        except Exception:
            pass

        compressed.append(doc)

    return compressed
