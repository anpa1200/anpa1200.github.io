# AdversaryGraph

AdversaryGraph is a self-hosted CTI-to-detection workbench created by Andrey Pautov.

Authoritative release and lifecycle facts: https://1200km.com/data/site-facts.json

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

## Current Source Release

AdversaryGraph v7.0.0 is merged and CI-validated on `main`. It includes the
reproducible release gate, rollback guidance, governed Threat Hunting, Query
Library, Unified RAG/MCP, asset exposure assessment, SOC access groups, sanitized
screenshot evidence, and documented case studies.

The latest published immutable GitHub release is v7.0.0, matching the current
source release.

## Unified RAG and MCP in v7.0 Source

Unified RAG and MCP are included in the immutable v7.0.0 release. They are not
part of the older v6.0.0 tag.

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
- Unified RAG and MCP v7.0 source guide: https://github.com/anpa1200/adversarygraph/blob/2a9a7bedf6115dbcfbf1e90a70e08f50d76e8c73/docs/unified-rag-and-mcp.md
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
- Governed hybrid retrieval and citation-grounded assistance
- Persisted, expiring Navigator advisory proposals with analyst confirmation
  and no automatic layer save/application
- Local stdio MCP access with a fixed four-tool surface

## Restricted Capabilities

The public website does not expose authenticated AdversaryGraph workflows,
malware upload, attack execution, private IOC queries, RAG/MCP access, or SIEM
forwarding. Those capabilities belong inside an operator-controlled deployment.

## Safety Boundary

All security material is intended for authorized defensive research, lab validation, detection engineering, and professional education.
