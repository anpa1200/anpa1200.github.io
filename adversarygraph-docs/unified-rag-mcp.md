# AdversaryGraph Unified Intelligence RAG and MCP

Status: included in the merged, CI-validated AdversaryGraph v6.5.0 source
release. This capability is not part of the older immutable v6.0.0 release.

Canonical, authoritative source:
https://github.com/anpa1200/adversarygraph/blob/aeee13dcaec1e2993b9f0969290c9ee414bb4cf6/docs/unified-rag-and-mcp.md

Publication note: the v6.5.0 source release is merged and CI-validated, while
the latest published immutable GitHub release remains v6.0.0 until the
protected tag workflow completes.

## Direct answer

AdversaryGraph builds a provenance-preserving retrieval corpus over selected
ATT&CK, actor, campaign, actor-intelligence, IOC, CVE, report, knowledge, Threat
Radar, Threat Hunting, Evidence Graph, and sanitized asset records. Retrieval
combines exact matching, PostgreSQL full-text search, optional pgvector search,
business-context reranking, and bounded relationship expansion.

Answers retain citations, routes, TLP, freshness, scores, and warnings. The
assistant can propose ATT&CK Navigator techniques for explicit analyst review;
it does not automatically apply or save a layer.

## Indexed source types

- `attack_technique`
- `attack_group`
- `attack_campaign`
- `actor_intel`
- `ioc`
- `cve`
- `analysis_report`
- `knowledge`
- `threat_signal`
- `threat_hunt`
- `evidence_node`
- `asset`

Only field-allowlisted data is indexed. Raw provider payloads, credentials,
feed configuration, authentication/audit tables, arbitrary metadata, raw model
prompts/responses, and arbitrary filesystem data are excluded.

## Governance

- Client profiles are private ranking/generation context, not global corpus
  documents.
- TLP:AMBER+STRICT, TLP:RED, and legally sensitive results cannot be sent to a
  cloud provider.
- Retrieved content is treated as untrusted data, not as instructions.
- Generated citations and ATT&CK identifiers are verified locally.
- Content-hash changes reject stale generated answers.
- AI output is a lead for analyst review, not evidence or an autonomous verdict.

## MCP boundary

The local stdio MCP server exposes four advisory tools:

- `search_intelligence`
- `ask_intelligence`
- `get_indexed_entity`
- `propose_navigator_layer`

It cannot run arbitrary SQL, fetch arbitrary URLs, configure feeds, access
secrets or raw provider JSON, execute simulations, forward SIEM data, confirm
proposals, or mutate Navigator state.

## Known limits

Retrieval coverage is limited to indexed, implemented collectors. Semantic
similarity is not proof of operational relevance. Relationship expansion is
bounded and non-recursive. Source claims inherit the limitations of their
underlying records. The current single-workspace data model is not a hard
tenant-isolation boundary.
