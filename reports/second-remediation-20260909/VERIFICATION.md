# Verification scope and evidence

## Functional checks

- Search: exact T1059.003 first result, MCP relevance, edited/copy/reload URLs, Back/Forward, filters, 40-result limit, Unicode/reserved characters, clearing, early typing and rapid queries passed in Chrome 150. Quoted unknown terms use the existing exact empty-state fixture; Pagefind prefix/token matching can legitimately match a long unquoted token. Focus remains in the query input during updates. Underlying filter values remain stable behind readable labels.
- Reference data: all 1,678 baseline record IDs remain in the full model; 45 weak titles reviewed (23 recovered, 22 review-needed). Indicators and fixtures remain in export/provenance, with inert directory headings and defanged addresses. Duplicate/document query identities remain separate. Generator fixtures cover the requested role and metadata boundaries.
- Directories and workspace: filters, result-page restoration, clearing, exports, Find related, old ID/anchor routing, no-JavaScript later pages, T1059.003 SSH source, DET0202/AN0578, reload/history, actor pivot, actual clipboard success, loading and failed defensive states passed. JSON reports distinguish tested outcomes.
- Canonicals: raw initial HTML, og:url and sitemap agree for all 27 CTI and 2 Shield routes. All 8 existing rendered actor IDs and all 171 original unverified-source occurrences are preserved. Production section checks are in `production-sections.json`.
- Examples: existing six-event result is unchanged. Agent simulator: one allowed, five denied, six observable events, two deliberately rejected observation controls. Benign ZIP: 245 bytes, one 129-byte text entry; digest independently corroborated with sha256sum and entry listing with unzip. Three malformed/traversal/tampering controls rejected. Python 3.13.12 on Linux; no malware execution or remote upload.

## Accessibility and visual review

The existing mobile typography/overflow gate also passed 35 pages across 10 viewport/zoom configurations after replacing a broad wrapping rule with explicit break opportunities in one compound phrase.

36 scoped browser checks passed: Chrome 150.0.7871.46 and Firefox 144.0.2. Navigation tested at 320, 360, 390, 430, 640, 768, 900, 901, 1024, 1280, 1366, 1379, 1380 and 1440 CSS pixels. The 640/320 widths represent 200%/400% layout reflow from 1280 pixels; native browser zoom and physical mobile devices were unavailable. Essential navigation, More/Escape, skip-link followed by Tab, focus return, and example axe checks passed.

Both-theme measurements cover actual engagement-map/lab-group instances in eight Cyber Knowledge guides. The measurement handles sRGB color() serialization and alpha compositing; opaque surfaces stop background traversal. The minimum measured ratio was 7.83:1 across 154 panel/theme instances; per-page results are in `accessibility.json`. The HTML analysis-loop diagram retains text reading order. Visually reviewed its light/dark presentation, 390px navigation/focus, and mobile example layout. The logo's empty alt accompanies the visible author name. This is representative meaning/reflow review, not an audit of every historical graphic or a WCAG certification.

## Matched directory lab measurements

Chrome 150, fresh contexts, cache disabled, local gzip server, 40ms latency, 1.6MB/s download, 750KB/s upload; mobile 390x844 at 4x CPU, desktop 1366x900 at 1x. Three runs per route/profile/variant (24 total), third-party requests blocked. Transfer includes the navigation document. Main-thread work is CDP TaskDuration; first interaction includes fetching/parsing the compact index. CLS and LCP are lab observations, not field p75. Timing variability is not a growth or speed claim.

| Mobile median | Before | After |
| --- | ---: | ---: |
| References decoded HTML | 145,796 B | 183,713 B |
| References initial gzip transfer | 199,756 B | 205,962 B |
| References initial DOM nodes | 1,417 | 1,616 |
| References first filter ready | 656 ms | 735 ms |
| References warm filter response | 263 ms | 296 ms |
| Knowledge decoded HTML | 168,338 B | 168,332 B |
| Knowledge first filter ready | 493 ms | 486 ms |

The reference increase carries descriptive metadata and explicit classification; it remains below the 200KB guard. Knowledge remains below 250KB. No index compaction or recall reduction was justified by these runs. Full desktop, task-duration, LCP and layout-shift values are in `performance.json`; the lab is not a substitute for field LCP/INP/CLS. Dataset counts and final payload sizes are separately checked on the clean release preview.

Cold global search was measured separately in 12 matched runs (`search-performance.json`). Median first exact result: mobile 5,529ms before / 5,424ms after; desktop 5,381ms before / 5,330ms after. Cold initialization remains about 5.4 seconds in this profile; no material speed improvement is claimed.

## Release boundaries

Source checks, clean preview checks, CI and production are recorded separately. Source-only checks retain authored HTML; deployment normalization runs only in the staged tree. The original number-to-source mapping, 22 unrecovered publication titles, account-level analytics/field data and physical-device/native-zoom coverage remain explicit limitations. Automatic approval review initially required public-destination and outgoing-payload evidence for pushing; public ADMIN ownership and exact-commit secret scans established that evidence before release.
