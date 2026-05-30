"""
JachaiX Docs MCP Server

Tools:
  get_public_docs
  get_admin_docs
  set_docs_visibility
  set_docs_schedule

Transport defaults to streamable-http (/mcp), with optional stdio mode via MCP_TRANSPORT.
"""
import os
from typing import Optional

import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = os.getenv("JACHAIX_API_URL", "http://nginx/api/v1")
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.getenv("MCP_PORT", "5006"))
MCP_TRANSPORT = os.getenv("MCP_TRANSPORT", "streamable-http")

mcp = FastMCP(
    "JachaiX Docs",
    instructions=(
        "MCP surface for JachaiX live docs module operations and admin visibility/schedule controls."
    ),
    host=MCP_HOST,
    port=MCP_PORT,
    streamable_http_path="/mcp",
)


@mcp.tool()
def get_public_docs() -> dict:
    """Fetch the public docs response (gated by visibility/schedule controls)."""
    with httpx.Client(timeout=15) as client:
        r = client.get(f"{API_BASE}/docs")
    return {"status": r.status_code, "data": r.json()}


@mcp.tool()
def get_admin_docs() -> dict:
    """Fetch admin docs payload containing editable docs content and visibility metadata."""
    with httpx.Client(timeout=15) as client:
        r = client.get(f"{API_BASE}/admin/docs")
        r.raise_for_status()
    return r.json()


@mcp.tool()
def set_docs_visibility(is_enabled: bool, updated_by: str = "mcp_docs") -> dict:
    """Toggle docs visibility override (true=ON, false=OFF)."""
    payload = {
        "is_enabled": bool(is_enabled),
        "updated_by": updated_by,
    }
    with httpx.Client(timeout=15) as client:
        r = client.post(f"{API_BASE}/admin/docs/visibility", json=payload)
        r.raise_for_status()
    return r.json()


@mcp.tool()
def set_docs_schedule(
    available_from: Optional[str] = None,
    available_until: Optional[str] = None,
    updated_by: str = "mcp_docs",
) -> dict:
    """
    Update docs availability schedule.

    Args:
      available_from: ISO datetime string or None
      available_until: ISO datetime string or None
    """
    payload = {
        "available_from": available_from,
        "available_until": available_until,
        "updated_by": updated_by,
    }
    with httpx.Client(timeout=15) as client:
        r = client.post(f"{API_BASE}/admin/docs/schedule", json=payload)
        r.raise_for_status()
    return r.json()


if __name__ == "__main__":
    mcp.run(transport=MCP_TRANSPORT)
