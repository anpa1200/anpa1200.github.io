# Verification report

Local implementation on 2026-09-09. Main baseline `4921750c`; actor baseline `2af236f`; pinned article archive `a9128dbdcd37593225bcdcaf401d868130efc1d1`. Source/build boundaries and exact preview commands are in [README](README.md). No production release was performed. URL-set comparison preserves all 1,558 baseline sitemap URLs (40 additions, zero removals) and all 1,157 baseline local sitemap URLs (40 additions, zero removals).

## Completed checks

| Check | Result / evidence |
| --- | --- |
| Baseline and final main source release gates | Both pass. `baseline-gate.log`, `implementation-gate.log`; `npm run check-release-source`. Covers source syntax, generators, shell, links/anchors, data/model, fixtures, SEO, structured data, facts, security-supply-chain, discovery, editorial and audit checks. Final punctuation-only workspace citation rendering additionally passed `node --check` and the selected-entity browser journey. |
| Pinned archive | Normal `build:embedded` passes for 190 articles; `archive-build.log`. Source slash-policy overlay is applied before build. |
| Actor source | Configured Python unit/repository/freshness/benign detection-fixture workflow passes; guarded Docusaurus build and native SEO pass for 194 routes/194 unique descriptions, complete lastmod coverage. `actor-validation.log`, `actor-build.log`, `actor-seo.log`. Synthetic fixture results are not operational detection performance. |
| Main+archive staged SEO/semantics | 1,438 canonical pages pass SEO; 1,601 HTML documents pass semantic checks. `release-seo.log`, `release-semantics.log`. Advisory counts: 301 titles over 60 characters and 19 descriptions under 70; no new blanket title truncation was imposed. |
| Main+archive catalogue/links | Schema and identity checks pass for 1,536 identities / 1,438 indexed URLs; no broken internal links or anchors. `release-catalog.log`, `release-links.log`. External access-denied responses are not claimed as confirmed dead links; this is not a complete external-link health audit. |
| Search | Pagefind 1.5.2, 1,438 pages plus 165 assessed-source projections. Index benchmarks and browser smoke pass: exact T1059.003/T1059.001, actor IDs/aliases, YARA, Kerberoasting/typo, RAG/MCP, practical topics, three initial facets, advanced filtering, resets, counts, Load More, no-results recovery, keyboard and shell integrations. `search-index.log`, `search-browser.log`. |
| New navigation/workspace/directory journeys | 32 checks, zero failures; Chrome 150.0.7871.46 and Firefox 144.0.2. Every requested breakpoint plus 320px, Escape/focus return, direct/refresh/history/actor/copy, unknown/retired entity, failed defensive chunk, global filtering, related records, pagination and no-JS later-record path. `journeys.json`; reproducible harness `check-navigation-directory-workspace.cjs`. |
| Practitioner journeys | All five pass: homepage → runnable fixture; static technique destination → selected workspace/copy/query/refresh; directory filter → full later assessment → Back/export; narrow guide TOC/code focus/next step via keyboard; research → provenance/download/feed. `practitioner-journeys.json`, `check-practitioner-journeys.cjs`. The static workspace link is an existing absolute production URL; the harness verifies its target and opens that same path/hash on the local origin. |
| Broad browser quality | 39 representative pages × four theme/viewport combinations (156 cases). Original run found two desktop overflows on the new example and one total-transfer budget failure. Scoped reruns for learning example and illustrated archive pass all four modes after fixes; final homepage rerun also passes. `browser-quality.json`, `browser-quality-*-final.json`. No unallowlisted moderate/serious/critical axe failures. One unchanged redundant-alt advisory on an existing docs image occurs in four modes. |
| Changed-component axe review | Homepage, both directories, worked example and selected workspace at 390px, light/dark: final ten JSON files have zero reported WCAG-tag violations. This automated sample is not a WCAG certification or a manual screen-reader test. |
| Full directory reachability | All 1,678 staged reference records across 70 pages and all 165 assessments across 21 pages have their stable IDs on ordinary linked HTML pages. Largest pages: 182,242 and 175,959 decoded bytes. `staged-directory-reachability.json`. |
| Whitespace and secret scanning | Staged whitespace checks and `gitleaks protect --staged --redact --no-banner` pass for both isolated branches. Only requested edits, generated outputs and review evidence are staged; no commits or remote writes. |

Source gates and Docusaurus Git-date lookup needed subprocess access outside the filesystem/network sandbox. Initial failures caused by that environment were rerun with Git/subprocess access; no generated review dates were fabricated. The actor validation's existing crosslink generator moved headings and removed unrelated navigation prose in 16 files; those tool-produced side effects were reverted, the scoped build was revalidated, and existing links were preserved.

## Comparable cold-load lab measurements

`performance.json` contains 24 samples: before/after × two directories × mobile/desktop × three runs. Chrome 150.0.7871.46; local HTTP without compression; cache disabled; 40 ms configured latency, 1.6 MB/s download, 750 KB/s upload. Mobile: 390×844, 4× CPU throttling. Desktop: 1366×900, 1× CPU. Third-party requests blocked; final run had no other browser checks running. Host scheduling is still uncontrolled.

The paired baseline is the current main **source** collection (441 references), not the historical 9.73 MB live audit snapshot. The edited source collection has 444 references; staged archive integration expands it to 1,678. Do not treat source-only filter timings as field or full-deployment timings. The complete staged reference projection is 1,466,021 bytes, compared with the source projection's 516,208 bytes; Knowledge Sources uses 441,244 bytes. Those projections load on first interaction and are separate from the initial document.

| Directory | Decoded initial HTML before → after | Initial DOM elements before → after | Total local transferred bytes before → after |
| --- | ---: | ---: | ---: |
| References | 5,122,109 → 192,431 (**−96.2%**) | 27,585 → 1,355 | 5,380,336 → 457,023 |
| Knowledge Sources | 1,926,544 → 160,509 (**−91.7%**) | 24,709 → 2,214 | 2,204,160 → 442,335 |

Medians, milliseconds:

| Directory / viewport | LCP before → after | Initial long-task duration before → after | First filter ready before → after |
| --- | ---: | ---: | ---: |
| References / mobile | 764 → 484 | 2,077 → 210 | 691 → 817 |
| References / desktop | 740 → 432 | 584 → 156 | 211 → 720 |
| Knowledge Sources / mobile | 464 → 564 | 1,354 → 285 | 378 → 699 |
| Knowledge Sources / desktop | 424 → 440 | 210 → 145 | 110 → 621 |

This is a payload/DOM/main-thread improvement with a deferred-filter tradeoff, not a claim that every timing improved. Knowledge Sources LCP increased in this sample. CLS medians were approximately 0–0.002. Long tasks cover initial navigation and the fixed 800 ms observation window after load; first-filter readiness includes automation/fill, debounce, projection fetch and result-DOM update. It is not field INP or proof of first painted result. The older screenshot JSON `transfer` field counts subresources only; use `performance.json` for totals including HTML.

Directory engineering ceilings are 250,000 decoded HTML bytes, 3,200 DOM elements and 1 MiB initial local transfer. The broad quality gate now includes navigation HTML in total transfer. The image-heavy archive ceiling changed from 3.5 MiB of the old incomplete metric to 4 MiB total after observing 3,921,468 bytes including 677,964 bytes of HTML; this is an accounting correction, not an optimization claim. Field p75 LCP/INP/CLS are unavailable.

## Visual review and reproducibility

Compare `before---1366.png` with `after---1366.png` for primary navigation and task hierarchy; `before--threat-matrix--390.png` with `after--threat-matrix--390.png` for restored entity context; directory before/after pairs at 390/1366px for the smaller initial presentation. `review-*-light.png` and `review-*-dark.png` cover changed mobile components. The selected technique is now above the matrix on mobile. Homepage deferred-layout containment was removed after it obscured a below-fold link during scroll/target checks; explicit link spacing remains.

From the main checkout:

```sh
node scripts/check-search-index.mjs --bundle /tmp/1200km-audit-release-preview/pagefind
node scripts/check-search-browser.mjs --site /tmp/1200km-audit-release-preview --bundle /tmp/1200km-audit-release-preview/pagefind
node scripts/check-quality-browser.mjs --site /tmp/1200km-audit-release-preview --report /tmp/quality.json
node reports/site-audit-20260909/check-navigation-directory-workspace.cjs
node reports/site-audit-20260909/check-practitioner-journeys.cjs /tmp/1200km-audit-release-preview
node reports/site-audit-20260909/measure-directories.cjs
```

Evidence harnesses use the already installed Playwright under `medium-scripts/node_modules/playwright`; set `PLAYWRIGHT_MODULE` for a different local installation. Chrome is `/usr/bin/google-chrome`; the available Firefox binary is recorded in the navigation harness. Performance baseline checkout is `/tmp/1200km-baseline-source` at `4921750c`; set `BASELINE_ROOT` if moved. No new browser dependency was added to the site.

## Limits

F03's remaining semantic source review is blocked by missing provenance; other legacy citation imports remain explicitly inventoried. Every technique in this Enterprise defensive export has a strategy, so no genuine unmapped Enterprise test example is claimed. Mobile/ICS defensive relationships are labeled not imported; ATLAS uses its own semantics. The broader experimental actor integration initially failed the main site's stricter multi-H1/title checks on other existing pages; actor-native SEO and the repaired report are verified separately. No all-content factual review, all-site security assessment, manual Safari/WebKit/screen-reader verification, native 200%/400% zoom test, field-CWV result, Search Console inspection or production deployment is claimed. See [remaining dependencies](REMAINING-WORK.md).
