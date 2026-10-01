# Publishing without breaking search history

Existing URLs are permanent. Never rename a published path for appearance, remove its hash, change its case, or replace an underscore. GitHub Pages does not provide application-controlled HTTP 301 redirects.

## New URLs

For new content, use a lowercase, hyphen-separated slug of at most five words, with no underscores, duplicated date or trailing hash. Preserve the existing section prefix and its framework's routing convention. Example new slug: `validate-sigma-rules`. These conventions are not a migration instruction for existing articles.

## Titles and descriptions

Use a natural practitioner query followed by a specific differentiator: `<primary query> — <differentiator> | 1200km`. Keep the complete title within 30–60 characters and the description within 120–155 characters. Use the primary phrase once in the title, once in the H1 and once within the first 100 words. Preserve the homepage H1 as an explicit exception.

Titles and descriptions must be unique across indexable pages, grounded in what the page actually contains, and readable without a keyword list. Length limits are editorial targets, not a promise about Google's display or ranking. Never truncate a sentence to make a checker pass.

Maintain `data/seo-policy.json` when adding or substantially changing a page. Priority pages are substantial practitioner resources and entry points. Supporting pages provide useful references. Thin scaffolding and navigation-only pagination remain accessible with `noindex,follow`, but stay out of the search sitemap. Do not block their crawling in robots.txt.

## Canonical-safe cross-posting

Publish the complete article on 1200km.com first, verify its self-canonical and sitemap inclusion, and confirm indexing in Search Console. Then use **Medium → Stories → Import a story** with the original 1200km URL. Medium's import flow sets the canonical to that original; verify the published HTML afterward, including when submitting to InfoSec Write-ups.

A manual copy-and-paste does not automatically establish that canonical relationship. It can leave competing copies; it does not deterministically hand rankings to either site. For an existing duplicate, use Medium's canonical-link setting and verify the result rather than changing the 1200km URL.

Respect source ownership: permitted TrainSec mirrors retain their real external canonicals. Do not change them to self-canonicals merely to increase the local sitemap count.

## Release checks

Preserve article body prose. Maintain shared templates and metadata inputs; do not patch only a rendered Docusaurus build. Validate both server-rendered metadata and client navigation. Run source checks, every affected framework build, the staged crawl, schema validation, and URL/robots preservation checks before publishing. Verify fresh production responses afterward.

Sources: [Medium import documentation](https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
