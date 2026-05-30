# JachaiX MCP Servers

This repository implements three MCP servers under `services/`:

1. `mcp-server` (port `5004`)
- Name: JachaiX Fact Checker
- Transport: `streamable-http` at `/mcp` (supports `stdio` via `MCP_TRANSPORT`)
- Tools:
  - `check_claim(claim_text, language)`
  - `search_evidence(query, top_k)`

2. `mcp-ops-server` (port `5005`)
- Name: JachaiX Ops
- Transport: `streamable-http` at `/mcp` (supports `stdio` via `MCP_TRANSPORT`)
- Tools:
  - `health_check()`
  - `knowledge_base_status()`
  - `claim_status(claim_id)`
  - `claim_result(claim_id)`

3. `mcp-docs-server` (port `5006`)
- Name: JachaiX Docs
- Transport: `streamable-http` at `/mcp` (supports `stdio` via `MCP_TRANSPORT`)
- Tools:
  - `get_public_docs()`
  - `get_admin_docs()`
  - `set_docs_visibility(is_enabled, updated_by)`
  - `set_docs_schedule(available_from, available_until, updated_by)`

## Run via Docker Compose

```powershell
docker compose up -d --build mcp-server mcp-ops-server mcp-docs-server
```

## Basic health check

```powershell
curl http://127.0.0.1:5004/mcp
curl http://127.0.0.1:5005/mcp
curl http://127.0.0.1:5006/mcp
```

## Notes

- These MCP servers are service-specific wrappers around existing JachaiX APIs.
- They are designed for host clients like Claude Desktop, Cursor, and custom MCP hosts.
- For local host-based clients that need `stdio`, set `MCP_TRANSPORT=stdio` and run the Python entrypoint directly.
