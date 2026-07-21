# 1200km.com

Source and production pipeline for [1200km Security Research](https://1200km.com),
Andrey Pautov's CTI, detection-engineering, threat-hunting, security-lab, and
open-source project site.

The repository publishes plain static HTML plus generated documentation
snapshots. GitHub Pages builds a canonical domain-wide search index and applies
release-only metadata normalization without modifying framework-hydrated page
trees.

## Search

The site uses self-hosted Pagefind 1.5.2. The deployment discovers pages from
the generated sitemap, rejects redirects, `noindex` pages, broken responses,
off-origin canonicals, and legacy aliases, and fails if any advertised URL is
stale. Search supports:

- exact ATT&CK technique and group identifiers;
- actor aliases, titles, and descriptions;
- typo-tolerant autocomplete;
- heading-level deep links;
- controlled content-type, domain, audience, status, evidence-level, version,
  source, updated-year, topic, and collection facets;
- visible removable filters, exact result totals, and twenty-result Load More batches;
- keyboard and screen-reader navigation;
- a crawlable `/search.html` and no-JavaScript fallback.

Search is deliberately activated by click, tap, or normal Tab navigation. The
site does not register or advertise a Ctrl/Cmd-K shortcut. Threat Matrix keeps
its own workspace-only shortcut and native entity search; its separate static
form is labelled “Search all 1200km research” and opens the domain-wide search.

## SEO and AI discovery

The release pipeline generates:

- one self-canonical URL per indexable local page;
- flat, deduplicated `sitemap.xml` and `sitemap-all.xml` files;
- an RSS 2.0 article feed with canonical item URLs;
- one connected Schema.org `@graph` per page with stable Person, WebSite,
  WebPage, and BreadcrumbList identifiers;
- stable heading anchors and explicit local-image dimensions where it is safe
  to add them;
- Pagefind metadata and filters derived deterministically from visible content;
- `llms.txt` and `llms-full.txt` discovery maps.

The crawler policy allows conventional search, AI search indexing, and
user-requested retrieval while disallowing recognized model-training crawlers.
The exact policy and its unavoidable provider limitations are documented in
[SEO-NOTES.md](SEO-NOTES.md).

## Authoritative facts

Release, contribution, content-count, product-name, lifecycle, and public-contact
claims are governed by [`data/site-facts.json`](data/site-facts.json), validated
against [`data/site-facts.schema.json`](data/site-facts.schema.json), and checked
by `npm run check-facts`. Source precedence, definitions, and the documentation
deployment-drift investigation are recorded in [SITE-FACTS.md](SITE-FACTS.md).

Human-facing pages are outputs, not sources of truth. Accepted contributions
must have an upstream merge record, open submissions remain separate, and work
under the AdversaryGraph `Unreleased` changelog section must not be attributed
to the stable release.

## Controlled content catalogue

Research, case studies, guides, labs, tools, platforms, documentation,
articles, mirrors, contributions, indexes, profiles, policy, and archived
material have one canonical identity in
[`data/content-catalog.json`](data/content-catalog.json). Its controlled
vocabularies and canonical policy are generated from reviewed configuration,
validated against a Draft 2020-12 JSON Schema, and checked against the sitemap,
RSS, major content indexes, redirect aliases, and lifecycle notices.

The complete policy and update workflow are documented in
[CONTENT-CATALOG.md](CONTENT-CATALOG.md). Run `npm run build-content` after
changing public metadata and `npm run check-content` before release.

## Adoption evidence

Verified adoption and outcome records are controlled by
[`data/adoption-evidence.json`](data/adoption-evidence.json). Public records are
rendered only when verification and publication requirements pass
`npm run check-adoption`; accepted upstream work is never described as a
deployment or active-user claim. See [ADOPTION-EVIDENCE.md](ADOPTION-EVIDENCE.md)
and the non-confidential [case-study template](CASE-STUDY-TEMPLATE.md).

## Local validation

Node.js 22 or newer and a local Chrome/Chromium binary are required.

```bash
npm ci
npm run check-facts
npm run check-shell
npm run check-content
npm run check-adoption
npm run check-release-source
npm run check-layout
```

For a production-equivalent local artifact:

```bash
site_dir="$(mktemp -d)/site"
mkdir -p "$site_dir"
git archive HEAD | tar -x -C "$site_dir"
npm run build-shell -- --site "$site_dir"
node scripts/inject-search-loader.mjs --site "$site_dir"
npm run build-metadata:remote -- --site "$site_dir" --source "$PWD"
npm run check-facts -- --site "$site_dir"
npm run check-seo -- --site "$site_dir" --require-release-transform
npm run build-content:remote -- --site "$site_dir" --source "$PWD" --sitemap "$site_dir/sitemap.xml"
npm run build-search:remote -- \
  --site "$site_dir" \
  --sitemap "$site_dir/sitemap.xml" \
  --output "$site_dir/pagefind" \
  --canonical-sitemap-output "$site_dir/sitemap.xml" \
  --max-stale-pages 0
npm run check-search:index -- --bundle "$site_dir/pagefind" --remote
node scripts/check-content-schema.mjs --site "$site_dir"
node scripts/check-content-catalog.mjs --site "$site_dir"
npm run check-search:browser -- --site "$site_dir" --bundle "$site_dir/pagefind"
npm run check-layout:browser -- --site "$site_dir" --screenshots /tmp/1200km-mobile-layout
npm run check-quality:browser -- --site "$site_dir" --report /tmp/1200km-browser-quality.json
npm run check-hygiene -- --site "$site_dir"
npm run check-facts -- --site "$site_dir"
npm run check-seo -- --site "$site_dir" --require-release-transform
```

`build-metadata:remote` fetches only the sitemap sources listed in
`seo/remote-sitemaps.json`. Root-only remote pages that have no valid child
sitemap are listed explicitly in `seo/remote-pages.json`.

## Deployment gate

`.github/workflows/pages.yml` validates pull requests and runs the same quality
job on `main`, manual dispatch, scheduled daily rebuilds, and repository rebuild
events. Only non-PR runs deploy the already-tested artifact. It:

1. validates the authoritative fact model, code, search behavior, SEO,
   agent-readiness, and internal links;
2. stages only publishable files;
3. generates the canonical metadata and release HTML;
4. validates every local canonical page;
5. builds Pagefind across local and approved remote pages with zero stale-URL
   tolerance;
6. tests ranking, facets, deep links, responsive UI, and accessibility behavior
   in a real browser;
7. revalidates facts and the final sitemap before publishing to GitHub Pages.

It also retains accessibility, performance, layout, search, and catalogue
evidence as an Actions artifact. Thresholds and residual manual checks are in
[SITE-QUALITY.md](SITE-QUALITY.md).

Public CV artifacts can be rebuilt from their phone-free public HTML sources:

```bash
npm run build-public-pdfs
```

The generator refuses HTML containing an Israeli mobile-number pattern or a
`tel:` link and checks PDF text when `pdftotext` is installed.

The detailed editorial and technical maintenance contract is in
[SEO-NOTES.md](SEO-NOTES.md). The pre-implementation evidence and decisions are
preserved in [AUDIT.md](AUDIT.md). Mobile typography, targeted wrapping, and
viewport coverage are documented in [MOBILE-LAYOUT.md](MOBILE-LAYOUT.md). The
static standalone header/footer architecture and product-native navigation
boundaries are documented in [SITE-SHELL.md](SITE-SHELL.md).
