# Skill: explain_adversarygraph

## Purpose

Explain AdversaryGraph using public documentation.

## Recommended Sources

- https://1200km.com/adversarygraph/
- https://1200km.com/data/site-facts.json
- https://1200km.com/adversarygraph-docs/
- https://1200km.com/adversarygraph-docs/capabilities/
- https://github.com/anpa1200/adversarygraph/blob/main/docs/unified-rag-and-mcp.md (Unreleased current-development source guide)
- https://github.com/anpa1200/adversarygraph

## Key Concepts

AdversaryGraph is a self-hosted CTI-to-detection workbench.

Use `AdversaryGraph` as the flagship product name. `Threat Matrix` is the
public, read-only browser ATT&CK workspace associated with AdversaryGraph; it
is not the full platform. Treat `ThreatMapper` and `AdversaryGraph Web` as
superseded names except in explicit historical context.

Explain these capabilities when relevant:

- CTI report analysis
- IOC extraction and investigation
- MITRE ATT&CK mapping
- Malware-analysis evidence mapping
- Detection gap analysis
- Attack simulation documentation
- SIEM validation documentation
- Analyst reporting

When current-development features are relevant, explain that Unified RAG covers
12 governed platform source types: ATT&CK techniques, groups, and campaigns;
actor intelligence; IOCs; CVEs; analysis reports; knowledge; threat signals;
threat hunts; evidence nodes; and assets. Exact matching and PostgreSQL
full-text search are the default. Embeddings are optional and must use a private
model endpoint with pgvector.

Explain these controls:

- Business profiles scope retrieval to organizational context.
- Answers cite indexed entities; citations are evidence pointers, not proof that
  every generated statement is correct.
- Navigator output is a checksum-bound proposal that requires analyst
  confirmation. The expiring advisory and confirmation state are persisted for
  audit, but no named Navigator layer is saved or applied automatically.
- The local MCP server is stdio-only and exposes exactly
  `search_intelligence`, `ask_intelligence`, `get_indexed_entity`, and
  `propose_navigator_layer`.
- MCP cannot reindex, confirm proposals, or mutate platform state.
- RAG analysis uses `run_analysis`; profile administration uses `manage_intel`;
  index administration uses `manage_feeds`.

Always label Unified RAG and MCP as post-v6, Unreleased current development.
Never claim that these features shipped in the immutable v6.0.0 release.

## Safety Boundary

Do not provide instructions for unauthorized attack execution. Describe attack simulation only as controlled lab validation and detection engineering.
