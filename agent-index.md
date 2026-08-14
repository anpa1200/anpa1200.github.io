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

Current v7.0.0 source-release capabilities:

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

These RAG/MCP capabilities are merged, CI-validated, and part of the immutable
v7.0.0 tag; they are not part of the older v6.0.0 tag. RAG analysis requires `run_analysis`, profile
administration requires `manage_intel`, and index administration requires
`manage_feeds`. MCP cannot reindex, confirm proposals, or mutate platform state.

## Best Pages for Agents

- `/` - Human-facing homepage
- `/projects.html` - Project overview
- `/adversarygraph/` - Flagship platform page
- `/adversarygraph-docs/` - Documentation root
- `/adversarygraph-docs/capabilities/` - Capability overview
- `https://github.com/anpa1200/adversarygraph/blob/2a9a7bedf6115dbcfbf1e90a70e08f50d76e8c73/docs/unified-rag-and-mcp.md` - v7.0 RAG/MCP source guide
- `/threat-matrix/` - Threat Matrix, the public read-only ATT&CK workspace associated with AdversaryGraph
- `/cyber-knowledge/` - Cybersecurity Knowledge Base: ten source-reviewed, maintained practitioner field guides with explicit scope and learning pathways
- `/cyber-knowledge/cti.html` - Cyber Threat Intelligence field guide: requirements, collection, analysis, ATT&CK, actor research, sharing, hunting, and detection
- `/cyber-knowledge/red-team.html` - Red Team and Offensive Security field guide
- `/cyber-knowledge/blue-team.html` - Blue Team and Defensive Security field guide
- `/cyber-knowledge/vulnerability-research.html` - Vulnerability Research field guide
- `/cyber-knowledge/malware-analysis.html` - Malware Analysis and Reverse Engineering field guide
- `/cyber-knowledge/secure-code.html` - Application Security and Secure Code guide
- `/cyber-knowledge/dfir.html` - Digital Forensics and Incident Response guide
- `/cyber-knowledge/cloud-security.html` - Cloud Security field guide
- `/cyber-knowledge/grc.html` - Cybersecurity Governance, Risk, and Compliance field guide
- `/cyber-knowledge/osint.html` - OSINT and Reconnaissance field guide
- `/cyber-knowledge/ai-security.html` - AI Security field guide
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
