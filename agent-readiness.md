# AI Agent Readiness Implementation Notes

This site exposes safe, read-only public metadata for AI agent discovery.

## Implemented

- `/llms.txt`
- `/agent-index.md`
- `/auth.md`
- `/.well-known/api-catalog`
- `/.well-known/openapi.json`
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-skills/index.json`
- `/.well-known/skills/index.json`
- Markdown mirrors for key public pages
- Cloudflare Pages-compatible `_headers`
- `Content-Signal` in `/robots.txt`

## Intentionally Deferred

OAuth/OIDC discovery is not published because 1200km.com does not expose a public authenticated agent API.

Web Bot Auth is not published because no public HTTP message signing key directory is currently operated.

Executable MCP or WebMCP tools are not published because public agents must not run attack simulations, upload malware, query private IOCs, or forward telemetry.

Commerce discovery is not implemented because the site is not an e-commerce property.

## DNS-AID Records To Add In Cloudflare DNS

Add these TXT records if SVCB/HTTPS DNS-AID records are not available:

```text
_index._agents.1200km.com TXT "v=aid1; index=https://1200km.com/agent-index.md; llms=https://1200km.com/llms.txt"
_mcp._agents.1200km.com TXT "v=aid1; mcp=https://1200km.com/.well-known/mcp/server-card.json"
_a2a._agents.1200km.com TXT "v=aid1; skills=https://1200km.com/.well-known/agent-skills/index.json"
```

## Markdown Negotiation

The repository is static GitHub Pages content. True `Accept: text/markdown` negotiation requires Cloudflare Worker, Cloudflare Pages Functions, or another edge/server layer. This repo provides Markdown mirrors and `_headers`; if deployed on Cloudflare Pages, use `_headers` for content types and Link response headers.

## Verification

Run:

```bash
npm run check-agent-readiness
```
