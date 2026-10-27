# Cyber Kill Chain reading paths — implementation and validation

The new `/kill-chain/` landing page opens seven dedicated stage pages through responsive, keyboard-operable banners. The main Library links to the section. Pages reuse the governed site header, footer, theme, and static navigation; they work without client-side application JavaScript.

## Coverage

The reviewed register is `data/kill-chain.json`. It records 361 canonical identities and explicit inclusion or exclusion decisions, including all 194 authored articles from `anpa1200/medium-blog-navigation` at the website workflow's pinned commit `0e086667d49ecd1c820236b710eaa616f647bd20`, all local catalogue guide/lab/research/case-study identities, and the 87 attributed public TrainSec readings. Generated reference entities and product documentation are not counted as authored articles.

169 original guides, articles, and exercises and 15 attributed TrainSec readings have stage placements. One resource can occur in several stages; 177 reviewed identities have explicit exclusions. Source paths, SHA-256 hashes for authored source files, section evidence, and per-placement relevance notes make the selection reviewable. The three existing bounded learning-path exercises and relevant public TrainSec companion articles are included. No separate express-guide collection was found in this inventory; no private course lessons were used.

| Stage | Readings |
| --- | ---: |
| Reconnaissance | 53 |
| Weaponization | 37 |
| Delivery | 27 |
| Exploitation | 90 |
| Installation | 51 |
| Command and Control | 38 |
| Actions on Objectives | 64 |

The section explicitly describes the Kill Chain as a useful organizing model with overlapping, repeated, skipped, or unobserved stages. It distinguishes ATT&CK tactics from Kill Chain stages, credential abuse from software exploits, installation from persistence, and candidate network strings from confirmed C2. Password recovery exercises are identified as learning analogues. Existing lifecycle, attribution, lab, and course disclosures remain applicable.

## Verification

- `npm run build-kill-chain`: eight deterministic static pages generated.
- `npm run check-release-source`: passed the full repository source gate, including the new Kill Chain gate.
- Final targeted rerun: `check-kill-chain`, `check-shell`, `check-semantics`, `check-seo`, and `check-links` passed after the browser-driven focus and contrast fixes.
- `KILL_CHAIN_ARCHIVE=../article-source node tests/kill-chain.test.mjs`: passed. It verifies exact canonical-set equality against the pinned archive catalogue, source hashes, inventory coverage, stage counts, metadata, current-stage navigation, and the workflow archive pin.
- Internal link checker: 7,387 HTML files, 383,942 valid internal links, zero broken links, zero missing anchors, zero old-domain references.
- All 32 newly linked external resources returned HTTP 200 on 2026-10-27, including the Lockheed Martin overview/PDF, 14 MITRE technique references, CISA guide, and 15 TrainSec originals. This is a point-in-time availability check.
- Browser QA was performed on the user's computer in their connected Chrome, using a new tab and the task-owned loopback preview. All eight pages fit 320px and 390px widths; all seven stage pages fit 1440px. Rendered counts matched the manifest. Enter activated a banner, Tab advanced to the next banner with a visible 3px focus outline, and the skip link moved focus to `main-content`. Light/dark rendering and current-stage contrast were visually checked. Temporary viewport overrides were reset.
- Shared source metadata and the content taxonomy were regenerated. Each new page has a self-canonical, matching Open Graph URL, description, social image, CollectionPage/ItemList structured data, and sitemap entry dated 2026-10-27. Existing companion sitemap entries and unrelated feed data were preserved.

## Maintenance

Edit the reviewed placements in `data/kill-chain.json`, then run `npm run build-kill-chain` and `npm run check-kill-chain`. Register new page metadata through the existing catalogue configuration and regenerate metadata/catalogues with the repository's normal build order. Do not hand-edit generated HTML. Changing the workflow archive pin requires a fresh inventory review; the pin test deliberately fails until the coverage register is updated. To verify source hashes and canonical completeness, set `KILL_CHAIN_ARCHIVE` to a checkout of that exact pinned archive source.

The source base was current public `main` at `13b8a784838801e25fe98a54e98a47817fe9b2a7`. Implementation is isolated on `feat/cyber-kill-chain`; original checkouts and unrelated projects were not modified.

## Publication status

This report records the initial local implementation and verification. Publication follows the authorized repository workflow: push/open a PR, pass current CI and hosting dependency audits, merge, and verify the actual Cloudflare deployment and production build identity. A successful source check alone is not a production deployment.

During the authorized publication pass, the Cloudflare build dependency `undici` was patched from 7.29.1 to 7.30.1 through a narrowly scoped override. This fixes GHSA-xjj6-f33q-929c and clears the existing hosting audit gate without changing Wrangler, routing, credentials, or security policies. The Cloudflare dependency audit reports zero vulnerabilities; 51 Worker tests and 33 real workerd/ASSETS HTTP cases pass. Consult the publication PR and its deployment run for the final live release status.
