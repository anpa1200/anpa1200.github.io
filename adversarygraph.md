# AdversaryGraph

AdversaryGraph is a self-hosted CTI-to-detection workbench created by Andrey Pautov.

It helps analysts connect:

- CTI reports
- IOCs
- Malware-analysis findings
- Operational telemetry
- MITRE ATT&CK techniques
- Detection gaps
- Attack simulation evidence
- SIEM validation results
- Analyst decisions

## Current Release Package

AdversaryGraph v6.0.0 adds a reproducible release gate, rollback guidance,
sanitized screenshot evidence, and documented case studies. The published
GitHub tag and release are the authoritative v6 source.

## Current Development After v6.0.0

Unified RAG and MCP are post-v6, Unreleased capabilities in the current
development branch. They are not part of the immutable v6.0.0 tag.

The governed retrieval layer indexes 12 AdversaryGraph source types:
ATT&CK techniques, ATT&CK groups, ATT&CK campaigns, actor intelligence, IOCs,
CVEs, analysis reports, knowledge records, threat signals, threat hunts,
evidence nodes, and assets. Exact matching and PostgreSQL full-text search are
the default retrieval path. Operators can optionally enable embeddings through
a private model endpoint and pgvector.

Business profiles scope retrieval to an organization's region, sector,
representative technologies, and crown-jewel categories. Profile notes are
stored for operator reference but are not sent as retrieval or generation
context. Grounded answers return
citations to indexed entities. Navigator output is a checksum-bound proposal:
the expiring advisory record and confirmation state are persisted for audit,
but confirmation does not save or apply a named layer automatically.

The local MCP server is stdio-only and exposes exactly four read/propose tools:
`search_intelligence`, `ask_intelligence`, `get_indexed_entity`, and
`propose_navigator_layer`. It cannot reindex data, confirm proposals, or mutate
platform state. RAG status requires `read`; profile listing, search, entity and
provider reads, assistance, and proposal confirmation require `run_analysis`;
profile management requires `manage_intel`; indexing and index-run review
require `manage_feeds`.

## Public Documentation

- Docs: https://1200km.com/adversarygraph-docs/
- Capabilities: https://1200km.com/adversarygraph-docs/capabilities/
- Unified RAG and MCP (current development): https://1200km.com/adversarygraph-docs/unified-rag-mcp/
- v6 release readiness: https://1200km.com/adversarygraph-docs/release-readiness-v6/
- v6 case studies: https://1200km.com/adversarygraph-docs/case-studies-v6/
- Detection engineering techniques: https://1200km.com/newest-detection-engineering-techniques/
- Log-to-report workflow: https://1200km.com/articles/adversarygraph-from-log-to-report-ioc-investigation.html
- GitHub: https://github.com/anpa1200/adversarygraph

## Public Capabilities Described

- CTI mapping
- IOC investigation
- ATT&CK mapping
- Malware-analysis evidence mapping
- Detection-gap analysis
- Controlled attack-simulation documentation
- SIEM validation documentation
- Investigation reporting
- Governed hybrid retrieval and citation-grounded assistance (current development)
- Persisted, expiring Navigator advisory proposals with analyst confirmation
  and no automatic layer save/application (current development)
- Local stdio MCP access with a fixed four-tool surface (current development)

## Restricted Capabilities

The public website does not expose authenticated AdversaryGraph workflows,
malware upload, attack execution, private IOC queries, RAG/MCP access, or SIEM
forwarding. Those capabilities belong inside an operator-controlled deployment.

## Safety Boundary

All security material is intended for authorized defensive research, lab validation, detection engineering, and professional education.
