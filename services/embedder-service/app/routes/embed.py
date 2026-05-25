from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embedder import embed_text

router = APIRouter()

class EmbedRequest(BaseModel):
    text: str

@router.post("/text")
def embed(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    return embed_text(req.text)