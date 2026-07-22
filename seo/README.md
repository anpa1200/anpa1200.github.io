# SEO and structured-data release policy

The deployable site is normalized by `scripts/build-site-artifacts.mjs` and
`scripts/release-html-lib.mjs`; checked-in HTML is never assumed to be the final
release representation.

## Date authority

Dates are selected deterministically in this order:

1. explicit `datePublished` / `dateModified` content metadata;
2. the governed archive date encoded in an article route;
3. the latest meaningful Git commit for the source file;
4. the AdversaryGraph release publication date for the release feed item.

Build time is recorded only in `build.json`. It is never used as page
`dateModified`, sitemap `lastmod`, article catalogue metadata, or feed content
date. If no authoritative publication date exists, it is omitted.

## Release invariants

- one self-referential canonical for every indexable local page;
- stable graph IDs for `#person`, `#website`, and `#software`;
- page-specific `#webpage`, `#breadcrumb`, and `#article` IDs;
- no meta-keywords tags;
- visible H1, WebPage name, article headline, and final breadcrumb agreement;
- catalogue, sitemap, feed, and JSON-LD date agreement;
- no repetitive generated title suffixes.

`seo/structured-data-validation.json` lists representative production URLs for
manual Schema.org and Google Rich Results checks after deployment.
