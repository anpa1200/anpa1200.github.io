# Platform SEO, AI discovery, taxonomy, and UX audit

Audit date: 4 August 2026
Scope: the production-equivalent `1200km.com` artifact, the pinned local article
archive, locally staged framework snapshots, and remote field-guide sitemap
members used by the release pipeline.

## Outcome

The platform now has one governed navigation rail, one controlled content
catalogue, one domain-wide search index, and one release audit for conventional
search, AI-oriented discovery surfaces, metadata, structured data, taxonomy,
accessibility, and responsive behavior.

Measured on the production-equivalent artifact:

| Control | Result |
| --- | ---: |
| HTML documents inspected | 1,483 |
| Local indexable pages | 1,408 |
| Eligible pages with static governed sidebar | 1,414 / 1,414 |
| Redirect or non-document aliases intentionally excluded | 69 |
| Canonical, description, social metadata, and JSON-LD coverage | 1,408 / 1,408 |
| Domain-wide catalogue identities | 1,823 |
| Domain-wide indexable catalogue identities | 1,809 |
| Domain-wide Pagefind documents | 1,809 |
| Controlled discovery tags | 977 |
| Indexable catalogue items with fewer than two tags | 0 |
| Items using the rejected generic `security-research` tag | 0 |
| Browser responsive matrix | 25 page families × 10 viewport/zoom configurations |
| Browser quality matrix | 29 page families × 4 theme/viewport scenarios |
| Unallowlisted moderate-or-higher axe violations | 0 |
| Maximum measured local LCP / CLS | 772 ms / 0.0556 |
| Maximum same-origin transfer | 3,104,187 bytes (within class budget) |

The 69 excluded documents are redirects or redirect-title aliases. They remain
available for URL continuity but do not receive a second content identity or a
navigation rail.

## Information architecture and navigation

The earlier platform exposed several independent shells: standalone pages,
Docusaurus documentation, the article archive, Cyber Knowledge, ITDR, and the
Threat Matrix application. Only the homepage had the complete ecosystem rail.

The release pipeline now injects a static, crawlable `<aside>` into every
eligible local document. It contains descriptive `<a href>` links to the main
platform areas and up to seven page-local H2 anchors. Static links are retained
for no-JavaScript users and crawlers; JavaScript only adds active-section state.
Separately deployed Docusaurus guides load the same governed rail through the
existing ecosystem bridge, including SPA route updates.

The rail is fixed at 240 px on sufficiently wide screens and intentionally
hidden on smaller screens, where the canonical header navigation remains the
primary control. This avoids covering content or shrinking technical
workspaces. Navigation landmarks use distinct accessible names, keyboard focus
styles are visible, and the rail is excluded from Pagefind so navigation labels
do not dilute result relevance.

This follows Google's guidance that discoverable internal links should be real
anchors with resolvable `href` values and useful anchor text:
[Google Search Central: crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
It also follows W3C guidance to distinguish multiple navigation landmarks with
labels: [WAI navigation landmark pattern](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html).

## SEO and structured data

Every indexable local page is release-normalized to have:

- a self-consistent canonical URL;
- a non-empty meta description;
- Open Graph and Twitter title, description, image, and image alternative text;
- one connected Schema.org graph containing stable Person, WebSite, WebPage,
  and BreadcrumbList identities plus applicable article or software entities;
- deterministic heading anchors, RSS discovery, and image dimensions where the
  source asset can be inspected safely.

Older ITDR pages that lacked `twitter:title` are repaired centrally during the
release transform. Social titles use the visible page heading where available,
while the HTML title keeps the concise product suffix needed for browser and
search context.

The strict release gate has zero missing or duplicate descriptions. It records
273 titles over 60 characters and 82 descriptions under 70 characters as an
editorial review queue, not automatic failures: many are exact technical,
article, ATT&CK, or entity names, and blind truncation or filler would reduce
meaning. No description exceeds 160 characters.

Structured topic data is emitted as `WebPage.about` Thing objects and
`WebPage.keywords` from reviewed topic rules. No HTML `meta keywords` field is
published because it is not used as a modern ranking control. Structured data
is generated from visible page content and governed facts, consistent with
[Google's structured-data quality guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## AI discovery and searchability

AI discoverability is implemented as an auditable set of complementary
surfaces rather than a claim that one file guarantees inclusion:

- `robots.txt` states conventional-search, AI-search, user-requested retrieval,
  and model-training crawler policy;
- `llms.txt`, `llms-full.txt`, and `agent-index.md` provide human-readable
  collection and route maps;
- `sitemap.xml` and `sitemap-all.xml` enumerate canonical local and approved
  remote content;
- `data/content-catalog.json` provides machine-readable identity, collection,
  lifecycle, author, domain, source, evidence, audience, and tag fields;
- connected JSON-LD provides page/entity relationships;
- Pagefind provides deterministic local retrieval across all 1,809 canonical
  indexable URLs.

The release gate verifies the presence of every discovery surface and rejects
stale, redirected, `noindex`, broken, off-origin-canonical, or duplicate search
documents. Exact ATT&CK IDs, actor IDs, aliases, long historical titles, and
cross-domain security concepts are covered by ranking tests.

## Taxonomy and tagging

The former generic `security-research` fallback was removed. Tags now combine
content type, author facet, security subject, product or collection, and
specific entity identifiers where applicable. One article can have several
subject tags. Reviewed rules cover, among other areas:

- CTI, ATT&CK, threat hunting, and detection engineering;
- AI, LLM, RAG, MCP, and agent security;
- Windows internals, Windows kernel, C++, and Rust;
- malware behavior, reverse engineering, and DFIR;
- identity, access, cloud, containers, and application security;
- hardware security, vulnerability research, governance, and career content.

TrainSec content is no longer assigned one broad domain. Its primary domain is
inferred from the article subject—for example application security, malware
analysis, incident response, vulnerability research, or professional profile—
while secondary tags preserve overlapping topics and named authors. The audit
fails if an indexable identity has fewer than two tags or reintroduces the
generic rejected tag.

## UX, responsive behavior, and accessibility

The browser regression matrix covers phones from 320 px, common mobile widths,
tablet, 1440 px desktop, 1920 px wide desktop, 2560 px ultrawide, and a 200%
zoom simulation. It exercises standalone pages, Cyber Knowledge, Docusaurus,
the article archive, article lifecycle notices, AdversaryGraph, and interactive
Threat Matrix views.

During the audit, two legacy headers were found to collapse their desktop
navigation list to zero width and paint children beyond the viewport after the
rail was introduced. The shared shell now establishes a full-width desktop
navigation box and constrains sticky headers to the remaining viewport. The
Threat Matrix skip link was moved into a labelled navigation landmark after axe
identified it as content outside landmarks.

The final gates check horizontal overflow, card and prose containment, search
interaction, keyboard movement, theme variants, sidebar geometry, heading and
main-landmark counts, moderate-or-higher axe violations, layout shift, local
LCP, and transferred resource budgets.

## Release controls and residual manual work

The deployment workflow now runs sidebar integration after metadata
normalization, then rejects incomplete navigation, metadata, taxonomy, search,
or AI-discovery coverage before building the final Pagefind index. The
discoverability report and browser evidence are retained as Actions artifacts.

The automated work does not guarantee ranking or citation by an external
engine. After deployment, the following remain external/manual controls:

1. submit or refresh both sitemaps in Google Search Console and Bing Webmaster
   Tools;
2. inspect representative standalone, article, Docusaurus, ITDR, and Threat
   Matrix URLs with each engine's URL inspection tool;
3. review field Core Web Vitals once sufficient real-user data exists;
4. monitor crawl, canonical, structured-data, and soft-404 reports;
5. review taxonomy rules when a genuinely new security subject enters the
   catalogue.

Search engines choose sitelinks algorithmically, so the platform can improve
site structure and anchor quality but cannot force a particular presentation:
[Google Search Central: sitelinks](https://developers.google.com/search/docs/appearance/sitelinks).
