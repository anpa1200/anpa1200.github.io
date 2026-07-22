# 1200km production remediation status

Last updated: 2026-07-22

## Audited baseline

- Main-site commit: `723770f8b4d3fca8e3547eb38c272205108849cf`
- Pinned article-archive commit: `ae0b2cd0060df643b48876466b64a1199e2e44c5`
- Latest stable AdversaryGraph release: `v6.0.0`, published 2026-07-17 ([release](https://github.com/anpa1200/adversarygraph/releases/tag/v6.0.0))
- Latest successful Pages run before remediation: [29869441714](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29869441714)
- Pages artifact digest before remediation: `sha256:dce8e2d59f906d43f6e07956c783d2c0b483383ee3c5e42876550aab7edf671b`
- Production build ID before remediation: unavailable; `/build.json` returned HTTP 404 on both the custom domain and GitHub Pages origin.

## Root cause established

The Pages workflow built and deployed one uploaded artifact, but it did not emit a
machine-readable build identity and had no custom-domain verification job. Actions
success therefore proved artifact deployment, not that the custom domain served the
expected commit. Representative production pages matched the latest deployment time,
but there was no deterministic origin-to-artifact proof.

## Phase status

| Phase | Status | Evidence |
|---|---|---|
| 0 — fresh baseline | Complete | Production responses, headers, hashes, release and workflow records captured on 2026-07-22. |
| 1 — production identity | In progress | Build identity generator, staged validator, and post-deploy custom-origin verifier implemented locally. |
| 2 — article canonical migration | Pending | External Medium canonical changes require explicit per-article verification and will not be assumed. |
| 3 — accessibility semantics | Pending | Existing browser gate covers serious/critical axe findings; moderate, ARIA-reference, duplicate-ID, and article matrices require expansion. |
| 4 — search governance | Pending | Existing Pagefind facets and regression checks require collection-tier governance. |
| 5 — structured data and SEO | Pending | Meta-keywords and semantic graph gaps remain verified. |
| 6 — taxonomy and lifecycle | Pending | Generated ATT&CK pages are currently classified as mirrors and archive lifecycle is too broad. |
| 7 — editorial UX | Pending | Requires generated-output and viewport review. |
| 8 — AdversaryGraph presentation | Pending | Stable/released ordering requires review against the v6.0.0 tag. |
| 9 — validation and adoption | Pending | Permission-backed adoption inventory remains authoritative. |
| 10 — CSS maintainability | Pending | Requires source-family inventory before extraction. |
| 11 — complete quality gates | Pending | Will consolidate phase-specific enforcement. |

## Production baseline fingerprints

All required URLs returned HTTP 200 on 2026-07-22 except `/build.json`, which
returned 404. The homepage, About, Projects, Articles, Search, Privacy,
AdversaryGraph, Threat Matrix, site-facts, and content-catalog responses were hashed
with cache-busting requests. Their `Last-Modified` values were 2026-07-21 21:23:44–45
GMT. The next production-verification artifact will retain the complete response
headers, final URLs, hashes, and fingerprint results rather than maintaining them by
hand in this file.

## Manual or external work

- Search Console URL inspection and recrawl requests after a verified deployment.
- Per-article Medium/InfoSec Write-ups canonical changes and rendered-source verification.
- Publication permission for any external production-use case study.

## Pull requests and production verification

- Pull request: pending.
- Production verification: pending deployment of the build-identity gate.
