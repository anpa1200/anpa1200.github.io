# 1200km production remediation status

Last updated: 2026-07-22

## Audited baseline

- Main-site baseline commit: `723770f8b4d3fca8e3547eb38c272205108849cf`
- Production-identity deployment commit: `74c6eeec8dbe545bebf0475e0adf633ed649019d`
- Governed article-archive commit: `c57eeaf021b15980ade6be72aeb96ce206489f09`
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
| 1 — production identity | Complete | [PR #9](https://github.com/anpa1200/anpa1200.github.io/pull/9), [run 29893391422](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29893391422), and live `/build.json` verify commit `74c6eee` and artifact digest `sha256:7de25197d5574bf0b0ae00bc4939c347f45e0e274901bfe90922d08b68e8eea5`. |
| 2 — article canonical migration | Complete | Archive [PR #5](https://github.com/anpa1200/medium-blog-navigation/pull/5), link-policy fix [PR #6](https://github.com/anpa1200/medium-blog-navigation/pull/6), main-site integration [PR #10](https://github.com/anpa1200/anpa1200.github.io/pull/10), and [production run 29894779988](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29894779988) are merged and verified. All 177 items have governed local canonicals, original-publication provenance, intrinsic image dimensions, valid same-origin URLs, and an explicit migration state. External publication settings still require manual verification. |
| 3 — accessibility semantics | Complete | Archive contrast [PR #7](https://github.com/anpa1200/medium-blog-navigation/pull/7), touch-target [PR #8](https://github.com/anpa1200/medium-blog-navigation/pull/8), legacy direct-link [PR #9](https://github.com/anpa1200/medium-blog-navigation/pull/9), and main-site [PR #11](https://github.com/anpa1200/anpa1200.github.io/pull/11) are merged. [Production run 29897208389](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29897208389) passed source, article, mobile/zoom, accessibility, search, hygiene, deployment, and custom-domain identity checks for commit `8d650441` and artifact `sha256:b353b0c14ed7995bc53182361b1f82eb8c0e3c7a74f31ea67b7de50121062fac`. |
| 4 — search governance | Complete | [PR #12](https://github.com/anpa1200/anpa1200.github.io/pull/12) is merged. [Production run 29898947495](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29898947495) passed the complete quality and custom-domain verification gates for commit `633b9ff`, article source `c57eeaf`, and artifact `sha256:fecd351dfb1e60bd6d3ec1f03bd2119a2d845756d4f52f8df67f14332f5c3c36`. |
| 5 — structured data and SEO | Complete | [PR #13](https://github.com/anpa1200/anpa1200.github.io/pull/13) is merged. [Production run 29901072593](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29901072593) passed the complete quality, deployment, and custom-domain verification gates for commit `6ed3f5c`, article source `c57eeaf`, and artifact `sha256:a9328360e7ca7fd175aa140062a06fd89a21c068af5cdca62ee66ded314e6cfb`. |
| 6 — taxonomy and lifecycle | In progress | Publication status and editorial lifecycle are being separated; generated ATT&CK references and the 177-article archive are receiving explicit governed classifications and an auditable distribution report. |
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

- Production identity: main-site [PR #9](https://github.com/anpa1200/anpa1200.github.io/pull/9), merged and verified in production.
- Article governance: archive [PR #5](https://github.com/anpa1200/medium-blog-navigation/pull/5), link fix [PR #6](https://github.com/anpa1200/medium-blog-navigation/pull/6), accessibility fixes [PR #7](https://github.com/anpa1200/medium-blog-navigation/pull/7), [PR #8](https://github.com/anpa1200/medium-blog-navigation/pull/8), and [PR #9](https://github.com/anpa1200/medium-blog-navigation/pull/9), current source `c57eeaf021b15980ade6be72aeb96ce206489f09`.
- Main-site article pin and governance-data deployment: [PR #10](https://github.com/anpa1200/anpa1200.github.io/pull/10), merged and verified in production by [run 29894779988](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29894779988).
- Accessibility semantics and browser gate: main-site [PR #11](https://github.com/anpa1200/anpa1200.github.io/pull/11), merged and production-verified by [run 29897208389](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29897208389).
- Search governance: main-site [PR #12](https://github.com/anpa1200/anpa1200.github.io/pull/12), merged and production-verified by [run 29898947495](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29898947495).
- Structured data and SEO governance: main-site [PR #13](https://github.com/anpa1200/anpa1200.github.io/pull/13), merged and production-verified by [run 29901072593](https://github.com/anpa1200/anpa1200.github.io/actions/runs/29901072593).
