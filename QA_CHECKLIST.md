# QA Checklist — 1200km.com

Run through this list before pushing changes to the main portfolio site
(`https://1200km.com`). Tick items per release.

## Automated

- [ ] `npm run check-release-source` passes (code, search unit tests, all-page SEO, agent-readiness, and internal links).
- [ ] `npm run check-adoption` passes; only verified, publication-approved evidence appears publicly.
- [ ] Staged `npm run check-seo -- --site <site> --require-release-transform` passes before and after Pagefind rewrites the canonical sitemap.
- [ ] A local Pagefind build passes `npm run check-search:index` and `npm run check-search:browser`.
- [ ] The staged site passes `npm run check-quality:browser` and `npm run check-hygiene`; review the retained JSON report and mobile screenshots.
- [ ] Pagefind reports zero skipped/stale/failed advertised URLs and the final `sitemap.xml` count matches the indexed-document count.
- [ ] `npm run check-links:external` reviewed — only expected warnings remain
      (Medium/LinkedIn/GitHub may show 403/405/429 bot-blocks, which are reviewed rather than treated as content proof).

## Pages load

- [ ] Homepage (`index.html`) loads.
- [ ] Primary navigation links work (Research, AdversaryGraph, Labs, Library, Projects, About).
- [ ] Header search opens by click, tap, Enter, and Space; Escape closes it and restores focus.
- [ ] Header search does not expose or intercept Ctrl/Cmd+K.
- [ ] Sidebar / scrollspy nav jumps to the correct sections and exposes the active section with `aria-current`.
- [ ] `about.html`, `cti.html`, `labs.html`, `guides.html`, `hexstrike.html`, `ai-offensive.html`, `pt-tools.html` all load.

## CV & Cover Letter

- [ ] `cv.html` loads; on-screen CV is readable and NOT visually duplicated.
- [ ] CV **Download PDF** button downloads `cv.pdf` and the file opens (2 pages, current content).
- [ ] CV **Print** button opens the print dialog with the clean print layout.
- [ ] `cover-letter.html` loads.
- [ ] Cover letter **Download PDF** downloads `cover-letter.pdf` and opens.
- [ ] PDFs reflect the latest HTML content (regenerate with the command below if CV/cover-letter HTML changed).

## Content & links

- [ ] All project cards link to a live page or repo.
- [ ] Flagship maturity badges are present and read correctly (Flagship grid = 10 cards).
- [ ] Article links open (Medium / InfoSec Write-ups) — spot-check manually in a browser (curl is bot-blocked).
- [ ] GitHub links open the correct repos.
- [ ] LinkedIn link opens the correct profile (manual browser check).
- [ ] No `anpa1200.github.io` internal branding remains (use search; GitHub source links are fine).

## Docusaurus / sub-sites (separate repos, deployed independently)

- [ ] Each linked sub-site under `1200km.com/<project>/` loads.
- [ ] "Main Portfolio" link in each sub-site navbar points to `https://1200km.com/` or `/`.
- [ ] Sub-site navbar/footer brand links point to `1200km.com` (not `anpa1200.github.io`).
- [ ] `npm run build` succeeds for any sub-site that was edited, then redeploy that repo.

## Responsive / mobile

- [ ] Mobile (≈390px): no horizontal scrolling.
- [ ] Reviewer-path and project cards stack to a single column.
- [ ] CTA buttons (Download PDF, etc.) are tappable (min 44px height).
- [ ] Brand, menu, search, and theme controls remain on one header row without overlap.
- [ ] The mobile Menu disclosure opens a single-column destination list and closes with Escape.
- [ ] Desktop (≈1280px): header stays at or below 72px with all primary links on one line.
- [ ] Wide desktop (≈1880px): the 240px side rail is visible and does not duplicate the header brand.

## SEO / metadata

- [ ] Every indexed page has one meaningful H1, a gap-free heading hierarchy, a main landmark, a meaningful title/description, and a self-canonical `1200km.com` URL.
- [ ] `sitemap.xml`, `sitemap-all.xml`, `feed.xml`, `robots.txt`, `llms.txt`, and `llms-full.txt` load with HTTP 200 after deploy.
- [ ] One consolidated JSON-LD graph is present on representative homepage, article, project, Threat Matrix, and Docusaurus pages; every internal `@id` resolves within its graph.
- [ ] Homepage FAQ structured data matches the visible direct-answer section.
- [ ] Exact identifiers, actor aliases, misspellings, and natural-language queries return useful results; sub-results point to real heading IDs.
- [ ] Content type, topic, and section facets narrow results correctly on `/search.html`.
- [ ] `robots.txt` allows search/retrieval agents, blocks named training crawlers, and publishes exactly one root sitemap directive.
- [ ] Search Console and Bing Webmaster Tools show no new sitemap or canonical errors (external/manual; not implied by local tests).
- [ ] Representative pages have been checked in Schema.org Validator and Google Rich Results Test where the page type is eligible.
- [ ] Mobile Lighthouse runs for homepage and search page are recorded; Performance, Accessibility, Best Practices, and SEO regressions are investigated before release.
- [ ] Docusaurus pages show no React hydration errors or relevant browser console errors.

## Regenerating the PDFs

If `cv.html` or `cover-letter.html` content changes, regenerate the downloadable PDFs:

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=cv.pdf "file://$PWD/cv.html"
google-chrome --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=cover-letter.pdf "file://$PWD/cover-letter.html"
```
