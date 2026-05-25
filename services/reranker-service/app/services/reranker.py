from sentence_transformers import CrossEncoder

# Multilingual cross-encoder
_model = CrossEncoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1')

def rerank_documents(query: str, documents: list, top_k: int = 5) -> dict:
    try:
        pairs = [(query, doc.get("text", "")) for doc in documents]
        scores = _model.predict(pairs)

        scored = sorted(
            zip(scores, documents),
            key=lambda x: x[0],
            reverse=True
        )

        results = []
        for score, doc in scored[:top_k]:
            doc["rerank_score"] = round(float(score), 4)
            results.append(doc)

        return {"query": query, "results": results, "total": len(results)}

    except Exception as e:
        # Fallback: return original order
        return {
            "query":   query,
            "results": documents[:top_k],
            "total":   len(documents[:top_k]),
            "error":   str(e)
        }