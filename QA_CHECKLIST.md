# QA Checklist — 1200km.com

Run through this list before pushing changes to the main portfolio site
(`https://1200km.com`). Tick items per release.

## Automated

- [ ] `npm run check-links` passes (0 broken internal links, 0 missing anchors, 0 `anpa1200.github.io` refs).
- [ ] `npm run check-links:external` reviewed — only expected warnings remain
      (Google Fonts origins 404 on HEAD; Medium/LinkedIn/GitHub may show 403/405/429 bot-blocks, which are ignored).

## Pages load

- [ ] Homepage (`index.html`) loads.
- [ ] Main navigation links work (About, CV, CTI, Labs, Guides, HexStrike, AI Offensive, PT Tools).
- [ ] Sidebar / scrollspy nav jumps to the correct sections (Latest, Reviewer Path, Flagship, About, Contact).
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
- [ ] Nav wraps cleanly.

## SEO / metadata

- [ ] Each indexed page has a meaningful `<title>` and `meta description`.
- [ ] `rel="canonical"` points to the `1200km.com` URL.
- [ ] Open Graph + Twitter card tags present (except intentionally `noindex` pages like the cover letter).

## Regenerating the PDFs

If `cv.html` or `cover-letter.html` content changes, regenerate the downloadable PDFs:

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=cv.pdf "file://$PWD/cv.html"
google-chrome --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=cover-letter.pdf "file://$PWD/cover-letter.html"
```
