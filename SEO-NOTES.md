# SEO, Search, and AI Discovery Notes

Last reviewed: 2026-07-21
Canonical origin: `https://1200km.com`

This document is the maintenance contract for public search, internal search,
structured data, and AI-assisted retrieval. It describes verifiable technical
behavior; it does not promise rankings, rich results, or inclusion by any
provider.

## Canonical authority model

- `1200km.com` is the canonical origin for portfolio pages, local articles, and
  hosted project documentation.
- `https://1200km.com/#person` is the stable Person identifier for Andrey
  Pautov.
- `https://1200km.com/#website` is the stable WebSite identifier.
- Every public HTML page has one self-canonical URL and one page identifier:
  `<canonical>#webpage`.
- Page-specific entities use stable canonical fragments and reference their
  WebPage and author by `@id`.
- Breadcrumbs are generated only from canonical parent pages that actually
  exist. No synthetic hierarchy is emitted.
- GitHub, Medium, LinkedIn, and the canonical site are connected through the
  Person entity's `sameAs` links.

Do not add a standalone personal Organization merely to expand schema. Employer
references remain factual, page-supported Organization values. Add a stable
Organization entity only if an author-controlled organization page and facts
exist.

## Content rules

1. Lead important pages and sections with a direct answer in two or three
   sentences.
2. Use question headings only where they improve human navigation. Entity and
   reference pages should keep precise entity names.
3. Make FAQ structured data match visible questions and answers on the page.
4. Do not invent publication counts, test totals, customer outcomes, dates, or
   product capabilities for SEO.
5. Keep immutable AdversaryGraph release claims separate from post-release or
   unreleased development.
6. Treat AI output as analyst assistance, not evidence or an autonomous verdict.
7. Prefer primary evidence: canonical project docs, reproducible tests, source
   repositories, release records, and cited first-party research.

When a role, employer, release state, feature, external validation, or project
metric changes, update the visible page first, then JSON-LD, `llms.txt`,
`llms-full.txt`, and cross-links in the same change.

## Dates and sitemaps

- Prefer an explicit structured `dateModified` or `datePublished` already owned
  by the page.
- Otherwise use the last committed Git change for the source file.
- Never use deployment time or copied filesystem modification time as a content
  date.
- `sitemap-all.xml` contains every indexable local canonical URL.
- `sitemap.xml` is the flat local-plus-approved-remote union and is rewritten
  after search indexing so it advertises only successfully indexed URLs.
- Deployment fails on duplicates, missing local canonicals, missing local
  `lastmod` values, or any stale advertised remote page.
- Remote sources are allowlisted in `seo/remote-sitemaps.json`; do not add a
  sitemap until its production URLs and canonicals have been verified.

## Internal search

Search metadata is derived during the build, not hand-maintained:

- `section` identifies the site family;
- `content_type` distinguishes articles, documentation, tools, profiles, and
  other stable page types;
- `topic` uses the controlled taxonomy in `scripts/search-index-lib.mjs`;
- `identifier` and `aliases` boost exact ATT&CK IDs and actor names;
- Pagefind sub-results expose verified heading fragments.

Any taxonomy change must include tests. Avoid broad keyword rules that classify
boilerplate rather than the page's primary subject. Search remains click/tap/Tab
activated and must not intercept Ctrl/Cmd-K.

## Crawler and AI policy

Policy: public content may be indexed for ordinary search, AI search, and
user-triggered retrieval; recognized model-training crawlers are disallowed.

- Allow: Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
  Claude-User, PerplexityBot, and Perplexity-User.
- Disallow: GPTBot, ClaudeBot, Google-Extended, and the other named
  training/general-purpose collection agents in `robots.txt`.
- `cover-letter.html` remains excluded for public search crawlers.

The split follows the providers' documented agent roles:

- [OpenAI crawlers](https://developers.openai.com/api/docs/bots) separate
  OAI-SearchBot, GPTBot, and user-triggered ChatGPT-User.
- [Anthropic crawler controls](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
  separate Claude-SearchBot, ClaudeBot, and Claude-User.
- [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
  distinguish search indexing from user-requested retrieval.
- [Google crawler documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
  states that Google-Extended controls both Gemini training and some grounding.

Google does not currently offer separate Google-Extended switches for training
and grounding. Blocking it honors the no-training policy but can reduce Gemini
grounding visibility; ordinary Google Search remains allowed. `robots.txt` is
advisory and cannot control non-compliant scrapers or agentic browsers using an
ordinary browser signature. CDN/WAF rules must verify published IP ranges before
granting crawler-specific bypasses.

## Performance and rendering

- Keep primary text, navigation, and the search fallback in server-rendered
  HTML.
- Load Pagefind UI assets only after a visitor approaches a search control; load
  them immediately on `/search.html`.
- Defer analytics until user interaction or a conservative timeout.
- Do not add render-blocking third-party fonts; use the tested system stack.
- Add intrinsic image dimensions mechanically only outside hydrated framework
  trees. For Docusaurus, fix image dimensions in its source/template rather than
  mutating rendered markup and causing React hydration errors.
- Above-the-fold images must not be mechanically lazy-loaded.
- Below-fold gateway/footer enhancement must not delay the initial content
  render.

## Release validation

Required before deployment:

```bash
npm run check-release-source
```

The production workflow additionally validates the fully transformed artifact,
zero-stale remote indexing, Pagefind ranking/facets/fragments, and browser
behavior. Review `QA_CHECKLIST.md` for the human checks.

After production deploy:

1. verify `robots.txt`, `sitemap.xml`, `sitemap-all.xml`, `feed.xml`, `llms.txt`,
   and `llms-full.txt` return 200;
2. submit or re-check `sitemap.xml` in Google Search Console and Bing Webmaster
   Tools;
3. inspect the homepage, one article, one project page, and one Docusaurus page
   with URL inspection;
4. validate representative JSON-LD in Schema.org Validator and applicable page
   types in Google Rich Results Test;
5. run Lighthouse against the deployed homepage and search page and record the
   report date, device profile, and scores;
6. search exact identifiers, aliases, a misspelling, and a natural-language
   query; verify every returned fragment exists;
7. monitor 404s, sitemap drift, crawler traffic, and Pagefind build diagnostics.

Search Console, Bing, rich-result tools, and third-party AI search inclusion are
external systems. Local green checks do not prove that those systems have
recrawled or selected a page.

## Revalidation cadence

- Every content change: source gate and generated metadata checks.
- Every deployment: full staged-artifact and browser gates.
- Daily: scheduled sitemap/search rebuild.
- Monthly: crawler-policy source review, representative structured-data test,
  Lighthouse sample, and external-link review.
- After any framework upgrade: hydration console test on Docusaurus and other
  client-rendered page families.
