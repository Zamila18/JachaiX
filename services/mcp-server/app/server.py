"""
JachaiX MCP Server — exposes fact-checking tools via the Model Context Protocol.

Tools:
  check_claim      — submit a claim for fact-checking, poll until done, return result
  search_evidence  — search the knowledge base for evidence on a query

Transport: Streamable HTTP on port 5004 at /mcp
"""
import os
import time

import httpx
from mcp.server.fastmcp import FastMCP

# ── Config ────────────────────────────────────────────────────────────────────
API_BASE     = os.getenv("JACHAIX_API_URL",  "http://nginx/api/v1")
EMBEDDER_URL = os.getenv("EMBEDDER_URL",     "http://embedder-service:5002")
MCP_HOST     = os.getenv("MCP_HOST",         "0.0.0.0")
MCP_PORT     = int(os.getenv("MCP_PORT",     "5004"))

# ── MCP Server ────────────────────────────────────────────────────────────────
mcp = FastMCP(
    "JachaiX Fact Checker",
    instructions=(
        "JachaiX is a Bangla and English fake-news detection system. "
        "Use check_claim to verify whether a claim is true, false, misleading, or unverified. "
        "Use search_evidence to retrieve relevant articles from the knowledge base."
    ),
    host=MCP_HOST,
    port=MCP_PORT,
    streamable_http_path="/mcp",
)


# ── Tools ─────────────────────────────────────────────────────────────────────

@mcp.tool()
def check_claim(claim_text: str, language: str = "bn") -> dict:
    """
    Submit a text claim to JachaiX for AI-powered fact-checking.

    Args:
        claim_text: The claim to verify (Bangla or English).
        language:   Language code — "bn" for Bangla, "en" for English. Default "bn".

    Returns:
        A dict with: id, status, verdict ("true"|"false"|"misleading"|"unverified"),
        confidence_score (0.0–1.0), explanation, sources (list of URLs/titles).
    """
    with httpx.Client(timeout=15) as client:
        r = client.post(f"{API_BASE}/claims", json={
            "input_type": "text",
            "raw_input":  claim_text,
            "language":   language,
        })
        r.raise_for_status()
        claim_id = r.json()["claim_id"]

    # Poll until completed or failed (max 5 min)
    for _ in range(37):
        time.sleep(8)
        with httpx.Client(timeout=10) as client:
            s = client.get(f"{API_BASE}/claims/{claim_id}/status")
        status = s.json().get("claim", {}).get("status", "")
        if status in ("completed", "failed"):
            break

    with httpx.Client(timeout=10) as client:
        res = client.get(f"{API_BASE}/claims/{claim_id}/result")
    return res.json().get("claim", {})


@mcp.tool()
def search_evidence(query: str, top_k: int = 5) -> dict:
    """
    Search the JachaiX knowledge base for evidence related to a query.

    Args:
        query: A claim or topic to search for (Bangla or English).
        top_k: Number of results to return (1–20). Default 5.

    Returns:
        A dict with: query, total (int), results (list of chunks with
        text, url, title, source, reliability_score, score).
    """
    top_k = max(1, min(20, top_k))
    with httpx.Client(timeout=30) as client:
        r = client.post(f"{EMBEDDER_URL}/search", json={
            "query": query,
            "top_k": top_k,
        })
        r.raise_for_status()
    return r.json()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="streamable-http")
