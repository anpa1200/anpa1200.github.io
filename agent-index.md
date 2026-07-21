# 1200km Agent Index

## Identity

Andrey Pautov is a cybersecurity practitioner focused on CTI-to-detection engineering, threat research, detection validation, MITRE ATT&CK mapping, malware-analysis workflows, SIEM validation, and AI-assisted analyst tooling.

## Main Site Purpose

1200km.com is a public cybersecurity research and portfolio hub. It contains projects, articles, documentation, technical research, and platform documentation.

## Flagship Platform

### AdversaryGraph

AdversaryGraph is a self-hosted CTI-to-detection workbench.

Core capabilities:

- CTI report analysis
- IOC extraction and investigation
- MITRE ATT&CK mapping
- Actor and campaign comparison
- Malware-analysis evidence mapping
- Detection gap analysis
- Attack simulation documentation
- SIEM validation documentation
- Investigation reporting
- Analyst review workflow

Current development after v6.0.0:

- Unified RAG over 12 governed source types: ATT&CK techniques, groups, and
  campaigns; actor intelligence; IOCs; CVEs; analysis reports; knowledge;
  threat signals; threat hunts; evidence nodes; and assets
- Exact matching and PostgreSQL full-text search by default, with optional
  private-endpoint embeddings stored through pgvector
- Business-profile scoping and citation-grounded answers
- Persisted, expiring checksum-bound Navigator advisory proposals that require
  analyst confirmation but do not save or apply a named layer automatically
- A stdio-only local MCP server with exactly four tools:
  `search_intelligence`, `ask_intelligence`, `get_indexed_entity`, and
  `propose_navigator_layer`

These RAG/MCP capabilities are post-v6 and Unreleased. Do not describe them as
part of the immutable v6.0.0 tag. RAG analysis requires `run_analysis`, profile
administration requires `manage_intel`, and index administration requires
`manage_feeds`. MCP cannot reindex, confirm proposals, or mutate platform state.

## Best Pages for Agents

- `/` - Human-facing homepage
- `/projects.html` - Project overview
- `/adversarygraph/` - Flagship platform page
- `/adversarygraph-docs/` - Documentation root
- `/adversarygraph-docs/capabilities/` - Capability overview
- `https://github.com/anpa1200/adversarygraph/blob/main/docs/unified-rag-and-mcp.md` - Unreleased current-development RAG/MCP source guide
- `/threat-matrix/` - Threat Matrix, the public read-only ATT&CK workspace associated with AdversaryGraph
- `/newest-detection-engineering-techniques/` - Validated detection engineering article archive
- `/guides.html#detection` - Detection and SOC guide cluster
- `/articles/` - Local article archive
- `/cti-analyst-field-manual/` - CTI methodology
- `/israel-government-threat-actors-cti/` - CTI research example

## External Proof

- GitHub: https://github.com/anpa1200
- Medium: https://medium.com/@1200km
- Authoritative fact model: https://1200km.com/data/site-facts.json
- Controlled content identities and taxonomy: https://1200km.com/data/content-catalog.json

## Public vs Restricted Capabilities

Public capabilities:

- Read documentation
- Summarize project pages
- Locate public research
- Explain AdversaryGraph modules
- Retrieve public capability descriptions
- Retrieve public methodology pages

Restricted capabilities:

- Uploading CTI reports
- Uploading malware samples
- Running attack simulations
- Forwarding telemetry to SIEM
- Querying private IOC data
- Accessing private AdversaryGraph workflows
- Accessing private RAG results or the local MCP server
- Executing offensive techniques

## Safety Boundary

All offensive-security, malware-analysis, adversary-simulation, and detection-validation material is intended for authorized research, defensive security, lab environments, and professional security education.
