# Second remediation pass — 2026-09-09

Search now retains edited queries, filters and result limits across reload and history. Reference titles have evidence-backed metadata or explicit limitations; investigation addresses are inert. A small sourced actor core accompanies the preserved intake. Guide panels have coherent theme surfaces. Two new local exercises include executable controls and observed outputs.

This package records R01–R08 against the September 9 baseline. It does not certify the entire site, prove production detection effectiveness, or report traffic/ranking gains. Deployment evidence is recorded separately after the release completes.

## Sources and build boundaries

- Main: `anpa1200/anpa1200.github.io`, base `c5c50471c62234e0a43563645c5873a2affa4595`.
- Actor report: `anpa1200/israel-government-threat-actors-cti`, base `462a6bda9d3019cb39bf38a3c0b520d69361a5d1`.
- Canonicals: `anpa1200/customer-driven-ai-cti-project` and `anpa1200/opencti-intelligent-shield`.
- Article archive remains pinned to `a9128dbdcd37593225bcdcaf401d868130efc1d1`. Its source/build is a prerequisite of the preview; no archive URL migration was introduced.
- The main preview uses the same main/archive extraction boundary as production. Actor documentation is served as a separate overlay; it is not folded into main reference extraction.

## Reproduce

Use Node 22, the lockfile dependencies, Python 3, and the pinned archive build. Commands run from the main worktree:

```sh
npm ci
npm run check-release-source
node scripts/build-audit-preview.mjs --site /tmp/1200km-second-release-preview --archive /tmp/1200km-archive-source
python3 reports/site-audit-20260909/serve-preview.py --site /tmp/1200km-second-release-preview --actors /home/andrey/git-projects/1200km-actor-second-pass/build --port 4188
```

The preview command performs staging-only HTML normalization. Do not run that normalization over untouched authored HTML in the source checkout. For source sitemap/feed refreshes, use `node scripts/build-site-artifacts.mjs --metadata-only`. Rebuild dependent catalogue/reference generators to stability after changing authored metadata; preserve the existing source gates.

Browser harnesses accept `PREVIEW_URL`; use `PLAYWRIGHT_MODULE` for a local Playwright installation. `check-search.cjs`, `check-accessibility.cjs`, and `check-directories-workspace.cjs` persist their results here. The canonical harness identifies its separate build directories explicitly. The matched performance harness documents baseline/after roots and its local gzip server. Reports and harnesses are excluded from the deployed site.

See `RESOLUTION-LEDGER.md`, `VERIFICATION.md`, `reference-cleanup.json`, `MAINTENANCE.md`, and `AUDIENCE-PLAN.md`. The actor repository's `data/editorial-core-claims.json` is the claim-level recovery record.
