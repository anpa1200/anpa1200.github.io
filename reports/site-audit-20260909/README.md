# 1200km audit implementation — 9 September 2026

Visitors can use primary navigation throughout the desktop/mobile breakpoint range, open and share selected ATT&CK entities, inspect imported defensive relationships, and browse complete directories without loading their entire HTML collections. The homepage now leads into three practitioner tasks, including a runnable benign detection example.

This is a local implementation and review package. No commit, push, PR, merge, account change, outreach, or production deployment was performed.

## Review artifacts

- [F01–F15 issue register](ISSUE-REGISTER.md)
- [Verification and measured limitations](VERIFICATION.md)
- [Maintenance and editorial instructions](MAINTENANCE.md)
- [90-day editorial/distribution plan](90-DAY-PLAN.md)
- [Privacy-aware measurement specification](MEASUREMENT.md)
- [Access-dependent remaining work](REMAINING-WORK.md)
- Before/after PNGs, JSON results, and gate logs in this directory. Screenshots are local implementation evidence, not production captures.

## Source and build boundaries

| Component | Review checkout / branch | Verified starting revision |
| --- | --- | --- |
| Main site, workspace, directories, learning paths, release pipeline | `/home/andrey/git-projects/1200km-audit-implementation`, `fix/site-audit-20260909` | `4921750c` |
| Actor report and its editorial/build checks | `/home/andrey/git-projects/1200km-actor-audit`, `fix/editorial-audit-20260909` | `2af236f` |
| Canonical article archive | temporary source `/tmp/1200km-archive-source`; main workflow applies an idempotent source overlay | pinned `a9128dbdcd37593225bcdcaf401d868130efc1d1` |

Original working directories and unrelated edits were preserved. The main source references the separately deployed actor site; publishing only one repository will not publish both repairs.

## Reproduce the local release preview

Use Node 22 and locked dependencies (`npm ci`) in the main and archive checkouts. Local dependency symlinks were used during this review; they are ignored and are not a new dependency.

From the main checkout, with an isolated archive checkout at the pinned revision:

```sh
node scripts/prepare-article-archive.mjs --archive /tmp/1200km-archive-source
npm --prefix /tmp/1200km-archive-source run build:embedded
npm run check-release-source
node scripts/build-audit-preview.mjs --site /tmp/1200km-audit-release-preview --archive /tmp/1200km-archive-source
python3 reports/site-audit-20260909/serve-preview.py --site /tmp/1200km-audit-release-preview --actors /home/andrey/git-projects/1200km-actor-audit/build --port 4183
```

The local URL is `http://127.0.0.1:4183/`. The server maps the separately built actor site under its existing prefix alongside the validated main-site and pinned-archive routes. Build the actor source first as described below. Use a fresh separate output directory; source/output nesting is rejected.

Build the actor checkout with `npm ci && npm run build && npm run check:seo`. Its own preview is served at `/israel-government-threat-actors-cti/` by copying its built directory under that prefix, or by using the main preview builder's optional `--actor-build /path/to/actor/build`. The combined experimental preview is `/tmp/1200km-audit-preview`; its cross-repository findings are recorded separately from the normal main release gate.

Publication, if subsequently requested, must run both repositories' CI, publish the actor correction, regenerate the main remote catalogue/search, verify Pages and CodeQL where configured, and check live routes/aliases, response status, metadata and the changed journeys. Local tests do not prove deployment.
