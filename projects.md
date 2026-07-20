# 1200km Projects

1200km.com publishes cybersecurity projects, research tools, documentation, and technical articles by Andrey Pautov.

## Main Project

AdversaryGraph is the flagship project: a self-hosted CTI-to-detection workbench for ATT&CK mapping, IOC investigation, malware-analysis evidence, attack-surface review, detection-gap analysis, attack simulation documentation, SIEM validation documentation, and analyst reporting.

The current development branch, after the immutable v6.0.0 release, adds a
governed Unified RAG layer across 12 platform source types and a local stdio MCP
server. Exact matching and PostgreSQL full-text search work without a model;
private pgvector embeddings are optional. Business profiles constrain retrieval,
answers cite indexed evidence, and Navigator output remains a checksum-bound,
analyst-confirmed advisory proposal. Its audit state is persisted, but no named
layer is saved or applied automatically. MCP exposes only
four fixed read/propose tools and cannot reindex, confirm, or mutate platform
state. This work is Unreleased and must not be attributed to v6.0.0.

Project hub: https://1200km.com/adversarygraph/

Current-development RAG/MCP guide: https://1200km.com/adversarygraph-docs/unified-rag-mcp/

Detection engineering article hub: https://1200km.com/newest-detection-engineering-techniques/

## Ecosystem Themes

- CTI-to-detection workflows
- Threat actor and campaign analysis
- Detection engineering education
- Validated telemetry and detection-as-code workflows
- Malware-analysis workflow support
- Vulnerable lab environments for controlled learning
- Open-source security tooling

## Public vs Restricted

Public pages describe tools, workflows, documentation, and research. Private
platform operations such as malware uploads, SIEM forwarding, private IOC
enrichment, authenticated investigations, and RAG/MCP access are not exposed as
public APIs.
