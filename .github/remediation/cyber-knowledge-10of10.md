# Cyber Knowledge 10/10 remediation record

Verified: 2026-07-28

This non-deployed review record separates implemented engineering changes from
editorial work that requires the author. It is the evidence log for CK-01–CK-44.

## Phase 0 — discovery

- `data/cyber-knowledge.json` is the canonical domain model. The JSON Schema is
  `data/cyber-knowledge.schema.json`; `scripts/build-cyber-knowledge.mjs`
  generates metadata, headings, breadcrumbs, sequence links, hub cards,
  relationship map, ecosystem links, and structured data. Existing body prose is
  preserved.
- `scripts/build-cyber-knowledge-og.mjs` renders the 1200 × 630 social cards.
- `scripts/build-site-shell.mjs` owns the shared header and footer.
- `scripts/build-identity.mjs` injects one `1200km-build` source commit into all
  staged HTML. `.github/workflows/pages.yml` rebuilds the complete Pages artifact;
  it has no domain filter.
- The reported three-generation production split did not reproduce on
  2026-07-28. The hub and ten domain routes all returned build
  `024a0d03c5ff2d93f0ed50836838a5cbf26ecbdb`, which also matched the then-current
  source. Because one valid artifact receives one identity after all HTML is
  staged, the historic mixed hashes were a stale/cross-deployment observation,
  not a current per-page migration flag.
- The hub cards, descriptions, dates, names, status, module counts, topics, and
  baselines are model-driven. The OG generator is in the repository.
- `sitemap.xml`, `robots.txt`, `llms.txt`, and `llms-full.txt` exist. The hub and
  all ten guides are included in the sitemap and both LLM indexes.
- JSON-LD exists across the site. Cyber Knowledge includes `ItemList`, `Course`,
  `LearningResource`, `TechArticle`, `BreadcrumbList`, `Person`, and generated
  term markup.
- CI already runs schema, content, SEO, internal-link, search, layout,
  accessibility, performance, hygiene, and build-identity checks.

### Current feature inventory

| Surface | Per-page OG | approved title shape | full breadcrumb | distinct dates | sequence navigation | locale/robots | structured data |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hub | yes | n/a | n/a | yes | n/a | yes | yes |
| CTI | yes | yes | yes | yes | yes | yes | yes |
| Red Team | yes | yes | yes | yes | yes | yes | yes |
| Blue Team | yes | yes | yes | yes | yes | yes | yes |
| Vulnerability Research | yes | yes | yes | yes | yes | yes | yes |
| Malware Analysis | yes | yes | yes | yes | yes | yes | yes |
| Secure Code | yes | yes | yes | yes | yes | yes | yes |
| DFIR | yes | yes | yes | yes | yes | yes | yes |
| Cloud Security | yes | yes | yes | yes | yes | yes | yes |
| GRC | yes | yes | yes | yes | yes | yes | yes |
| OSINT | yes | yes | yes | yes | yes | yes | yes |

## Tier 1 — implemented or verified

- **CK-01:** reduced name drift to one canonical `name` and one `short` label.
  Domain 06 is “Secure Code & Application Security”; its slug and OG asset are
  `secure-code`. Countable fields remain model-driven.
- **CK-02–CK-10:** already implemented in the generator/current output. The
  reported stale pages and false construction statuses are not present.
- **CK-11:** the recommended CTI path already identifies Modules 2 and 3.
  Whether the numbered domain/module order is pedagogical or merely a stable ID
  remains an author decision.
- **CK-12–CK-14:** repaired the attribution target, clarified “Modules 1–2,”
  retained direct Threat Matrix actor routes, corrected the Module 9 count, and
  aligned the DFIR ransomware workflow label with its destination.
- **CK-16:** “every major cybersecurity domain” and “zero-to-hero” do not occur
  in current Cyber Knowledge output.
- **CK-17:** official-source verification is recorded below. The obsolete MBC
  location was replaced with the maintained MBCProject repository.
- **CK-19:** generated archive links use trailing slashes; the Cyber Knowledge
  test suite rejects noncanonical archive links.
- **CK-20–CK-21:** fixed six real cross-document fragment defects and upgraded
  the blocking internal-link checker to resolve target files and validate their
  fragment IDs. SPA hash routes are excluded deliberately.
- **CK-22:** the detection-engineering companion already uses the canonical
  shared shell and includes a skip link, Search, About, and Cyber Knowledge.
  The reported dead-end template does not reproduce.
- **CK-23:** sitemap, robots, concise LLM index, and full LLM corpus index cover
  the hub and ten guides.
- **CK-24–CK-27:** term sets, hub item list, domain learning resources, article,
  breadcrumb, and author entities are generated. Blue Team, Vulnerability
  Research, and Malware Analysis glossary terms now have stable independent IDs.
- **CK-30–CK-32:** structured-data checks, axe/browser checks, sticky navigation,
  scroll-spy, progress UI, responsive table wrappers, and mobile layouts are in
  the test/build system.

## Official-source verification (CK-17)

| Claim | Result | Primary source |
|---|---|---|
| ATT&CK data sources deprecated in v18 | confirmed | MITRE ATT&CK data-source page and October 2025 v18 update |
| OWASP Top 10:2025 | confirmed | OWASP Top 10 project |
| OWASP ASVS 5.0.0 | confirmed; released 2025-05-30 | OWASP ASVS project |
| SLSA 1.2 | confirmed; approved | SLSA v1.2 specification |
| CSA CCM 4.1 | confirmed; released 2026-01-27 | Cloud Security Alliance CCM v4.1 |
| NIST AI RMF 1.0 is being revised | confirmed | NIST AI RMF |
| YARA 4.5 documentation | confirmed | official YARA 4.5.0 documentation |
| MBC canonical source | old MAEC-hosted URL superseded | MBCProject `mbc-markdown` |

## Canonical-content audit (CK-18)

Author approval is required before redirecting or consolidating published pages.

| Identity | Current local representations | Recommended canonical |
|---|---|---|
| Newest Detection Engineering Techniques | long `/articles/read/2026/.../`; `/newest-detection-engineering-techniques/`; Medium | short companion page |
| From Log to Report | long `/articles/read/2026/.../`; `/articles/adversarygraph-from-log-to-report-ioc-investigation.html`; Medium | reviewed local companion article |

The preferred policy is: short/rich local companion page is canonical, article
archive is a noindex mirror with `rel=canonical`, internal links use the
canonical, and Medium points back when publication controls permit. Do not
execute until the author confirms that archive history and analytics may be
consolidated.

## Tier 2 — current implementation

- **CK-36–CK-40:** the hub already contains substantive orientation, an
  accessible relationship map with text equivalent, ecosystem routes, enriched
  model-driven cards, and role-based entry paths.
- **CK-43:** contextual inbound links already exist from the homepage, Guides,
  CTI landing page, PT Tools, Labs, HexStrike, AI Offensive, Projects, embedded
  systems, and the shared global shell. `ITDR/` has only the global route and is
  the strongest candidate for an additional contextual link during its next
  editorial revision.
- **CK-44:** module completion uses local storage, shows per-domain progress on
  the hub, creates no account/server/analytics state, and degrades to an ordinary
  usable document without JavaScript.

## Author-owned work — deliberately not fabricated

### CK-15 intelligence-cycle caveat draft

> This guide uses a seven-stage operating model that separates feedback from
> refinement; published intelligence-cycle models vary, so teams should map
> these stages to their governing doctrine rather than treat the sequence as a
> universal standard.

### CK-28 HowTo pilot

Choose one already numbered applied exercise and approve its exact step
boundaries before emitting `HowTo` markup. Recommendation: pilot the Blue Team
source-onboarding exercise because its inputs, actions, evidence, and acceptance
gate are already explicit. Do not mark narrative guidance as machine-executable
steps.

### CK-29 FAQ extraction

The proposed ten questions are suitable headings, but answer boundaries require
author approval. Structured markup must quote the approved visible answer
exactly; it must not create hidden FAQ content.

### CK-33 CTI practitioner-template scaffold

1. Orientation and prerequisites — retain existing Modules 1–3.
2. Tool matrix — map the nine existing Module 9 tools; add columns for role,
   input, output, evidence retained, and principal limitation.
3. Lab curriculum — `TODO(author): define authorized input, task, artifact,
   acceptance criterion, and stopping condition for each lab`.
4. Case studies — `TODO(author): select sanitized, source-backed cases and write
   decision points; do not infer operational outcomes`.
5. Failure atlas — `TODO(author): approve failure modes, observable symptom,
   correction, and boundary`.
6. Readiness gate — `TODO(author): define evidence, reviewer, acceptance,
   exception, and expiry`.
7. Review questions — `TODO(author): provide answer key and source mapping`.
8. Primary references — add approved CK-34/CK-35 sources.

Candidate material already present: intelligence requirements and cycle;
ATT&CK/entity distinctions; collection/indicator pivots; source grading;
analytic confidence; actor research; sharing; hunting/detection handoff; and the
nine-tool Module 9 catalogue. No new labs, cases, or security verdicts were
invented.

### CK-34 primary-source candidates

- Sherman Kent, “Words of Estimative Probability,” CIA Center for the Study of
  Intelligence.
- ODNI ICD 203, *Analytic Standards* — source quality, uncertainty, likelihood,
  confidence, assumptions, judgments, and alternatives.
- CIA, *A Tradecraft Primer: Structured Analytic Techniques for Improving
  Intelligence Analysis*.
- CIA, *Psychology of Intelligence Analysis*.
- STANAG 2511 document identity is confirmed in the U.S. Defense Logistics
  Agency ASSIST catalogue. Access/licensing and the exact edition must be
  confirmed by the author before citing normative Admiralty grading language.

### CK-35 source gaps

| Existing CTI topic | Candidate primary sources for author review |
|---|---|
| HUMINT / SIGINT / GEOINT / TECHINT | ODNI intelligence disciplines pages; U.S. Code/agency doctrine appropriate to the intended jurisdiction |
| Ransomware as a Service | CISA StopRansomware guidance; Europol Internet Organised Crime Threat Assessment |
| ISAC / ISAO | CISA Information Sharing Organizations; Executive Order 13691 and applicable DHS guidance |
| Certifications | issuing bodies’ current certification pages only; avoid ranking or equivalence claims |
| Learning order | approved course prerequisites in this site model; do not present one institutional cycle as universal |

### CK-41 numbering

Recommendation: keep 01–10 as stable domain IDs and publish role/prerequisite
paths separately. Renumbering would require redirects, citation migration,
search-index changes, and durable alias handling.

### CK-42 CTI source repetition

Consolidating repeated “Further reading on 1200km” blocks is an editorial
restructure, not a mechanical deletion. Preserve a destination inventory first,
then move every unique link to one module-level Sources block. Author approval is
required because proximity currently conveys which statement each source is
intended to support.

## Release checks

The implementation is releasable only when the repository’s release-source,
browser layout, browser accessibility/quality, link, schema, metadata parity,
name consistency, and body-diff checks all pass. Exact command results belong in
the final execution report, not this maintained decision record.
