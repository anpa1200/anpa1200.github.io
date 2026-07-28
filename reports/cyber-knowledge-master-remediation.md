# Cyber Knowledge master remediation

Reviewed: 2026-07-27

Implementation date: 2026-07-28

Scope: `/cyber-knowledge/`, ten field guides, generated reference pages, shared discovery data, and release validation

## Executive summary

Cyber Knowledge already had a strong static-document foundation: ten substantial guides, canonical metadata, Pagefind integration, source HTML navigation, local progress, cross-domain handoffs, per-guide social cards, structured data, and browser/link gates. This pass addressed the remaining product-level gaps without replacing the static architecture or rewriting specialist content.

Implemented:

- clearer knowledge-base positioning and primary search route;
- eight task-based, cross-domain entry paths;
- richer guide-card audience, difficulty, version, review, module, and reading-time metadata;
- visible author, publication, version, review, status, policy, and correction information in every guide;
- generated glossary, source index, and editorial/source policy;
- sitemap and content-catalog coverage for all new routes;
- a machine-readable 14-page inventory and a human-readable audit;
- build-time validation for entry-path anchors and generated reference pages.

No external-indexing claim is made. “Indexable” means technically eligible based on source metadata and sitemap coverage.

## Remediation register

| Issue | Category | Severity | Affected URL | Evidence | Implemented fix | Validation |
|---|---|---|---|---|---|---|
| Hub identity did not fully express the knowledge-system purpose | IA / SEO | High | `/cyber-knowledge/` | Generic H1 and role shortcuts | Added explicit knowledge-base H1, practitioner positioning, guide/workflow/search CTAs | Content and SEO checks |
| Required workflow entry points were incomplete | IA / UX | High | `/cyber-knowledge/` | Five role shortcuts, not eight task routes | Added eight model-driven, multi-guide pathways with valid chapter anchors | Generator assertions and tests |
| Card metadata lacked audience, difficulty, and document version | UX / governance | Medium | `/cyber-knowledge/` | Cards exposed modules, time, review only | Added governed audience, difficulty, version, review, topics, and status | JSON Schema and generated-output checks |
| No consolidated glossary route | Researchability | High | `/cyber-knowledge/glossary/` | Definitions existed only inside guides | Generated alphabetical, source-linked `DefinedTermSet` from maintained guide data | Structured-data and internal-link tests |
| No transparent source index | Provenance | High | `/cyber-knowledge/sources/` | Sources were distributed across long guides | Generated a deduplicated source inventory grouped by descriptive source class and guide usage | Generator and sitemap/catalog checks |
| Editorial, correction, and AI-use rules were distributed or implicit | Trust / governance | High | `/cyber-knowledge/editorial-policy/` | No Cyber Knowledge-specific policy route | Added source hierarchy, review, corrections, AI, uncertainty, ownership, and privacy boundaries | Static content and structured-data checks |
| Guide version and author-review identity were not consistently visible | E-E-A-T | High | Ten field guides | Metadata existed but visible fields varied | Standardized visible version, publication, review, status, maintainer, policy, and correction links | Generated-output tests |
| Audit evidence was primarily narrative | Maintainability | Medium | Project-wide | No complete current page inventory | Added generated JSON inventory and Markdown audit with SEO, links, headings, schema, words, dates, and indexability | `--check` drift gate |
| New routes could drift out of sitemap/catalog | Discovery | High | Three new routes | New pages did not previously exist | Added routes to generated sitemap, content catalogue, core URLs, and taxonomy overrides | Catalogue and sitemap checks |

## Link report

The generated inventory records per-page internal/external counts, unresolved internal files, missing fragments, and duplicate IDs. The repository-wide link checker remains authoritative because it understands deploy-time article archives and remotely staged documentation collections.

- Internal links in Cyber Knowledge inventory: 2,043
- External references inventoried: 565
- Broken internal links: 0
- Missing fragment anchors: 0
- Duplicate IDs: 0
- External status and redirects: owned by the scheduled external-link workflow; not represented as live-checked in this source report

Machine-readable detail: `reports/cyber-knowledge-inventory.json`.

## SEO and indexability

- 14 Cyber Knowledge pages now have self-referencing canonical URLs.
- The hub, ten guides, glossary, source index, and editorial policy are included in `sitemap.xml`.
- Titles, descriptions, H1s, robots directives, structured-data types, and link counts are captured per page.
- Reference pages expose static primary content and remain usable without JavaScript.
- The glossary uses `DefinedTermSet`; the source index uses `ItemList`; reference pages include `CollectionPage` and `BreadcrumbList`.
- Search discovery remains Pagefind-backed and self-hosted. The hub exposes a direct search route.

Search-engine indexing must be verified through Search Console or equivalent external tools after deployment.

## Content consistency and source policy

- One domain model owns names, descriptions, audience, difficulty, version, topics, and dates.
- One cross-link model owns 136 chapter-level handoffs.
- The source index deduplicates destinations without changing claim-level citations inside guides.
- Source-class labels are descriptive. They do not assert that every page on a host is normative.
- Internal research, labs, tools, and platform workflows remain distinguishable from external standards.
- AI-assisted output is explicitly advisory and subject to human review.

## Accessibility

The additions use semantic sections, headings, lists, forms, native links, visible labels, static content, and responsive single-column fallbacks. Existing shared controls retain keyboard and no-JavaScript behavior. The relationship graph retains its text equivalent.

The repository browser quality gate remains authoritative for axe-core and layout checks. No WCAG conformance certification is claimed.

## Performance

The remediation adds no framework, tracker, account state, or external search service. Entry paths and resource indexes are static HTML. Existing Cyber Knowledge JavaScript remains optional progress and navigation enhancement.

The source index is intentionally comprehensive and therefore large; Pagefind handles discovery without requiring runtime download of a separate client-side source dataset.

## Security review

- No credentials, private contact data, or tokens were added.
- Search remains routed through the existing escaped/static Pagefind integration.
- New correction handling links to GitHub rather than adding a dynamic form processor.
- Existing CSP, referrer policy, no-object/frame controls, and shared security checks remain in place.
- Hosting-layer response headers remain subject to GitHub Pages/Fastly capabilities.

## Changelog

- Added model-driven audience, difficulty, guide version, and eight task entry paths.
- Repositioned the hub as a practitioner cybersecurity knowledge base.
- Added glossary, source index, and editorial/source policy.
- Added visible guide governance and author metadata.
- Added sitemap/catalog taxonomy for reference routes.
- Added generated source audit and drift check.
- Expanded Cyber Knowledge regression coverage.

## Remaining limitations

- External links are time-dependent; scheduled live checks, allowlists, and manual review remain necessary.
- A term appears in the consolidated glossary only when the originating guide exposes a structured definition. The glossary does not invent missing definitions.
- Source records do not invent document versions or publication dates when those values are not encoded near the original citation.
- Search-engine indexing and social-cache refresh require post-deployment external verification.
- Dedicated thin topic pages were not mass-generated; new canonical topic URLs should be created only after independent search intent and sufficient authored depth are established.
