from sentence_transformers import SentenceTransformer

# Multilingual — strong Bangla + English support
_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')

def embed_text(text: str) -> dict:
    vector = _model.encode(text, normalize_embeddings=True).tolist()
    return {
        "text":       text,
        "embedding":  vector,
        "dimensions": len(vector),
        "model":      "paraphrase-multilingual-mpnet-base-v2",
    }

def get_embedding(text: str) -> list:
    return _model.encode(text, normalize_embeddings=True).tolist()