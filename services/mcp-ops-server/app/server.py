"""
JachaiX Ops MCP Server

Tools:
  health_check
  knowledge_base_status
  claim_status
  claim_result

Transport defaults to streamable-http (/mcp), with optional stdio mode via MCP_TRANSPORT.
"""
import os

import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = os.getenv("JACHAIX_API_URL", "http://nginx/api/v1")
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.getenv("MCP_PORT", "5005"))
MCP_TRANSPORT = os.getenv("MCP_TRANSPORT", "streamable-http")

mcp = FastMCP(
    "JachaiX Ops",
    instructions=(
        "Operational MCP surface for JachaiX health, claim state, and knowledge-base freshness checks."
    ),
    host=MCP_HOST,
    port=MCP_PORT,
    streamable_http_path="/mcp",
)


@mcp.tool()
def health_check() -> dict:
    """Return API health status."""
    with httpx.Client(timeout=10) as client:
        r = client.get(f"{API_BASE}/health")
        r.raise_for_status()
    return r.json()


@mcp.tool()
def knowledge_base_status() -> dict:
    """Return knowledge base freshness/status metadata."""
    with httpx.Client(timeout=15) as client:
        r = client.get(f"{API_BASE}/knowledge-base/status")
        r.raise_for_status()
    return r.json()


@mcp.tool()
def claim_status(claim_id: int) -> dict:
    """Get the current processing status for a claim id."""
    with httpx.Client(timeout=15) as client:
        r = client.get(f"{API_BASE}/claims/{claim_id}/status")
        r.raise_for_status()
    return r.json()


@mcp.tool()
def claim_result(claim_id: int) -> dict:
    """Get final claim result payload (verdict, confidence, explanation, sources)."""
    with httpx.Client(timeout=20) as client:
        r = client.get(f"{API_BASE}/claims/{claim_id}/result")
        r.raise_for_status()
    return r.json()


if __name__ == "__main__":
    mcp.run(transport=MCP_TRANSPORT)
