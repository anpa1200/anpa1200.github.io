# Cyber Knowledge remediation record

Date: 2026-07-28
Scope: `/cyber-knowledge/` hub and ten practitioner field guides
Status: implementation and author-review record

## Phase 0 — reproduced state

The source pages are hand-authored HTML. The canonical standalone header and footer are generated from `data/site-shell.json` by `scripts/build-site-shell.mjs`. Release transforms and sitemap/feed output are produced by `scripts/build-site-artifacts.mjs`; `scripts/build-identity.mjs` writes the deployable build identity.

The original audit mixed two deployed build generations. The repository source at the start of this work already contained the current shell, metadata, structured data, and complete guide bodies. The stale hub/CTI build was therefore a deployment-history problem, not a source-template exclusion still present in the repository. All eleven pages were present and current in source.

| Surface | Source state before remediation | Result |
|---|---|---|
| Hub | Hand-authored cards; current shell; no central domain model | governed by `data/cyber-knowledge.json` |
| CTI | Current shell; missing wraparound sequence links; terminology drift | generated metadata/navigation; surgical link fixes |
| Red Team | Current shell; sequence metadata incomplete | generated metadata/navigation |
| Blue Team | Current shell | generated metadata/navigation |
| Vulnerability Research | Current shell, metadata and maintained status present | verified and generated |
| Malware Analysis | Current shell, metadata and maintained status present | verified and generated |
| Application Security | Current shell, metadata and maintained status present | verified and generated |
| DFIR | Complete maintained guide; stale audit badge no longer reproduced | verified and generated |
| Cloud Security | Complete maintained guide; stale audit badge no longer reproduced | verified and generated |
| GRC | Complete maintained guide; stale audit badge no longer reproduced | verified and generated |
| OSINT | Complete maintained guide; wraparound metadata incomplete | generated metadata/navigation |

`sitemap.xml`, `robots.txt`, `llms.txt`, and `llms-full.txt` exist. Sitemap and feed output are generated; robots and LLM-facing files are governed by repository scripts. JSON-LD, internal/fragment link checks, structured-data tests, browser layout checks, axe-core checks, and release CI existed before this remediation.

## Implemented plumbing

- One machine-readable collection/domain model and JSON Schema.
- Deterministic metadata, dates, canonical display names, breadcrumbs, wraparound `prev`/`next`, hub status, cards, computed counts, reading times, and structured data.
- Per-domain 1200×630 Open Graph cards.
- Generated `ItemList`, `Course`/`LearningResource`, and CTI `DefinedTermSet` data.
- Cross-domain edge extraction and an accessible hub relationship map with text equivalent.
- Role-based entry points and an ecosystem block.
- Browser-local module progress, hub progress indicators, and scroll-spy enhancement.
- CI validation for the model, generated output, JavaScript, schema, and guide invariants.

## Surgical findings

- CK-10: corrected the CTI recommended-order links from Module 1 to Modules 2 and 3. The separate contradiction between “in order” and the selective recommended path remains an author decision.
- CK-11: corrected VERIS “evidence labeling” to the actual `#data-information-intelligence` target, changed “earlier in this module” to “Modules 1–2,” and routed the named Threat Matrix profiles to their actor pages. The reported “attribution methodology” mismatch was not reproduced.
- CK-12: the CTI tool count and ToC now account for both Shodan and Censys.
- CK-13: not reproduced. The DFIR link already reads as an evidence-preserving ransomware workflow.
- CK-14: the existing checker reports zero missing internal files and zero missing fragments. The two OSINT reconnaissance links intentionally target two different resource indexes with distinct labels.

## Time-sensitive claims verified against primary sources

These were verified, not rewritten:

1. MITRE ATT&CK states that data sources were deprecated in v18 and remain available for reference.
   Source: https://attack.mitre.org/datasources/
   Release notes: https://attack.mitre.org/resources/updates/updates-october-2025/
2. CSA lists Cloud Controls Matrix v4.1 as released on 27 January 2026 and identifies it as the latest CCM version.
   Source: https://cloudsecurityalliance.org/artifacts/cloud-controls-matrix-v4-1
3. NIST describes AI RMF 1.0 as voluntary and explicitly states that it is being revised.
   Source: https://www.nist.gov/itl/ai-risk-management-framework

## Author decisions — not changed

### CK-16 — intelligence-cycle caveat

Draft for review:

> This guide uses a seven-stage operating variant that separates feedback from refinement; other intelligence-cycle models combine these activities and use five or six stages.

### CK-17 — scope and audience claims

Recommended replacements, pending author approval:

- “across every major cybersecurity domain” → “across ten core cybersecurity domains”
- “zero-to-hero” → “practitioner field guides from foundations through advanced application”

### CK-20 — duplicate article namespace

Confirmed high-priority duplicate families:

- Newest Detection Engineering Techniques:
  - `/newest-detection-engineering-techniques/`
  - generated `/articles/read/2026/...a5ccb46d5556/`
  - Medium original
- From Log to Report:
  - `/articles/adversarygraph-from-log-to-report-ioc-investigation.html`
  - generated `/articles/read/2026/...eff2e1d8f2cd/`
  - Medium original

Recommendation: approve short companion pages as canonical only after the article-archive generator and redirects are updated together. No canonical namespace or redirect was changed in this pass.

### CK-21 — article trailing slashes

GitHub Pages returns `301` for a generated article path without a trailing slash and `200` for the slash form. The Cyber Knowledge generator now normalizes its 124 article-archive links to the slash form and the guide test rejects regressions.

### CK-25 — hub title

Current branding remains unchanged. Proposed author decision:

- `<title>`: `Cybersecurity Field Guides — 10 Practitioner Domains | 1200km`
- H1: `Cybersecurity Field Guides`
- retain `Cyber Knowledge` as the collection label

### CK-41 — numbering

Recommendation: keep 01–10 as stable identifiers and publish role-based paths separately. Renumbering would create avoidable URL, citation, and learning-progress migration risk.

## CTI source gaps for author review

No glossary prose was generated.

### Stub-term source candidates

- HUMINT / SIGINT / GEOINT / TECHINT:
  - https://www.cia.gov/resources/spy-glossary/
  - https://www.cia.gov/static/9d89dd9a4fe41b63cfab00c5191a8803/IC-OSINT-Strategy.pdf
- Ransomware-as-a-Service:
  - https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-165a
  - https://www.cisa.gov/stopransomware/ransomware-guide
  - https://www.europol.europa.eu/publication-events/main-reports/cyber-attacks-apex-of-crime-service-iocta-2023
- ISAC / ISAO:
  - https://www.cisa.gov/isao-faq
  - https://www.cisa.gov/topic/cybersecurity-information-sharing
  - https://www.nationalisacs.org/
- Relevant certifications:
  - use each certification owner’s current program page; avoid comparative or outcome claims without evidence
- Recommended learning order:
  - internal curriculum decision; no external authority should be presented as prescribing the order

### Proposed primary-reference foundation

- Sherman Kent, “Words of Estimative Probability”:
  https://www.cia.gov/resources/csi/studies-in-intelligence/archives/vol-8-no-4/words-of-estimative-probability/
- ODNI ICD 203, Analytic Standards:
  https://www.odni.gov/files/documents/ICD/ICD-203.pdf
- ODNI objectivity and analytic-tradecraft overview:
  https://www.odni.gov/index.php/how-we-work/objectivity
- CIA, *A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis*:
  https://www.cia.gov/resources/csi/books-monographs/a-tradecraft-primer/

The audit’s suggested STANAG 2511 citation was not added: a stable, public, authoritative NATO text was not verified during this pass. Confidence and probability should not be described as universally separate axes without a source tied to the exact model the author intends to teach.

## Author-only content work not published

- CK-18/19 source-gap prose and references require expert review.
- CK-24 descriptions were normalized from existing expert-authored descriptions; no new technical claims were introduced.
- CK-33 HowTo rollout and CK-34 FAQ prose were not published because extraction changes emphasis and requires approval.
- CK-39 no filler or TODO scaffold was published. The hub gained computed cards, role paths, a relationship map, and ecosystem navigation instead.
- CK-42 CTI source-link consolidation was not performed because regrouping 30+ source blocks can change the evidentiary association between claims and sources.
