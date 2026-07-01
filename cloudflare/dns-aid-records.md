# DNS-AID Records For 1200km.com

Cloudflare Agent Readiness checks for DNS-based agent discovery records under `_agents.1200km.com`.

Add these records in Cloudflare DNS. Enable DNSSEC for the zone after records are published.

## TXT Fallback Records

Use these when the dashboard does not yet expose first-class DNS-AID/SVCB parameters:

```text
_index._agents.1200km.com TXT "v=aid1; index=https://1200km.com/agent-index.md; llms=https://1200km.com/llms.txt"
_mcp._agents.1200km.com TXT "v=aid1; mcp=https://1200km.com/.well-known/mcp/server-card.json"
_a2a._agents.1200km.com TXT "v=aid1; skills=https://1200km.com/.well-known/agent-skills/index.json"
```

## ServiceMode SVCB/HTTPS Intent

If Cloudflare supports arbitrary SVCB/HTTPS parameters for the DNS-AID draft, publish ServiceMode records equivalent to:

```text
_index._agents.1200km.com. HTTPS 1 . alpn="h2,h3" endpoint="https://1200km.com/agent-index.md"
_mcp._agents.1200km.com. HTTPS 1 . alpn="h2,h3" endpoint="https://1200km.com/.well-known/mcp/server-card.json"
_a2a._agents.1200km.com. HTTPS 1 . alpn="h2,h3" endpoint="https://1200km.com/.well-known/agent-skills/index.json"
```

The public site does not expose executable agent tools, malware upload, attack execution, SIEM forwarding, or private IOC APIs. These records advertise read-only public discovery endpoints only.
