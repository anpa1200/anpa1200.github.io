# Cloudflare Workers Static Assets migration

The user authorized the production migration after the phase-one preview.
GitHub remains source of truth; GitHub Actions builds the site. Cloudflare does
not rebuild it or proxy missing content to GitHub at request time.

## Release architecture

`quality` builds and validates `${RUNNER_TEMP}/site`, including the pinned article
archive and all 11 companion publications in `cloudflare/companion-sites.json`.
Ten companions build with their committed npm lockfiles; the consolidated Atlas
uses its pinned published Git revision. Only published output is staged. Existing
main-owned Atlas content and Markdown alternates take precedence over imported
historical files. `data/companion-builds.json` records provenance and source dates.

The exact artifact, including `.well-known`, is uploaded to GitHub Pages and to
generic Actions storage. Deployment jobs download it by immutable artifact ID
and verify its full digest before deploying. No post-download rewrite occurs.

- `1200km-site-preview`: route-free workers.dev Worker for PRs and main builds.
- `1200km-site`: main-only production Worker, behind the explicit repository
  variable `CLOUDFLARE_SITE_DEPLOY_ENABLED=true` and successful preview validation.
- GitHub Pages: kept publishing the same artifact as the rollback origin.
- The historical edge Worker files are retained, but its deployment workflow
  must not be run after cutover: it would compete for the same production route.

Wrangler 4.142.0 is lockfile-pinned; deployment actions use full commit pins.
Repository secrets contain the scoped Cloudflare token and account ID. Tokens
are never included in source, artifacts, or diagnostics.

## Response and URL contract

Both Workers use `ASSETS`, `run_worker_first: true`, `html_handling: none`, and
`not_found_handling: none`. All content fetches use the binding, never `fetch()`
to the old origin. `/` and directory URLs serve `index.html` internally. Existing
`.html` URLs remain valid. Pages-style extensionless file aliases remain valid.
Directory redirects retain queries and browser fragment inheritance. Unknown
paths return the root `404.html` with HTTP 404. GET and HEAD are supported;
other methods return 405. Production HTTP redirects to HTTPS with path/query
intact. `www` retains its existing GitHub redirect to the canonical apex.

The Worker embeds `_headers` and applies its security, CORS, MIME and discovery
policy explicitly, with drift tests. Markdown negotiation, Link headers,
`llms.txt`, and well-known endpoints are preserved. workers.dev alone gets the
preview noindex header. Static Assets may return a complete HTTP 200 response to
a Range request; verification records this provider difference explicitly.

Six exact-byte-pinned third-party source captures in the Atlas are downloads,
not site pages. Their URLs and original bytes are preserved; they are excluded
from the site/search metadata, served as attachments, noindexed, and sandboxed.
Their external website scripts and navigation are not part of the site's
application. One captured Google/Mandiant public browser-key pattern is allowed
only for the exact original file hash; changed captures and all other secret
patterns still fail validation. No key is printed in diagnostics.

## Reviewed build-time corrections

Platform JS/CSS URLs follow the current origin, including serialized hydration
configuration. CSP is not relaxed. The CTI field manual uses its authored system
font fallback instead of a CSP-blocked Google Fonts import. Source overlays fix
body H1s, missing main landmarks, and narrow-screen intake controls before both
server and client bundles are built. HTML serialization handles valid unquoted
attributes without changing the DOM. Exact metadata overrides disambiguate
companion titles/descriptions. Source commit dates provide a documented fallback
for companion pages that have no authored/git-derived modification date.

## Validation

```sh
npm ci
npm ci --prefix cloudflare
npm run check-release-source
npm run check-site-worker
npm run check-site-worker:runtime
node scripts/check-companion-coverage.mjs --site ./dist
node scripts/check-static-artifact.mjs --site ./dist --site-commit EXPECTED_SHA
node scripts/verify-hosting-parity.mjs --site ./dist --preview-origin WORKERS_DEV_URL
node scripts/check-search-browser.mjs --site ./dist --bundle ./dist/pagefind --origin WORKERS_DEV_URL
node scripts/check-companion-browser.mjs --site ./dist --origin WORKERS_DEV_URL
```

The preview reports differences from the older production release, but does not
claim those releases are byte-identical. Its artifact/header/routing and complete
companion coverage checks remain mandatory. Main-release production Worker
verification uses strict parity after Pages publishes the same artifact.
Unknown differences block cutover. Known policy additions absent from current
GitHub responses are classified explicitly, not silently discarded.

## Initial cutover

1. Require all PR source, full-artifact, hosted-browser, and CodeQL checks green.
2. Merge reviewed main and enable `CLOUDFLARE_SITE_DEPLOY_ENABLED`. The release
   publishes the same artifact to Pages and the main-only Worker. Its exact apex
   route is staged while the DNS record is still unproxied.
3. Require the complete main release and strict production Worker parity green.
4. Run `cloudflare-cutover.yml` from main with `mode=cutover` and that main
   `release_run_id`. It checks successful run provenance, exact artifact identity,
   parity evidence less than an hour old, active apex TLS, SSL mode, account,
   zone, the exact CNAME record ID/value, and the single expected Worker route.
5. The only traffic switch is `proxied: false -> true` on the existing
   `1200km.com -> anpa1200.github.io` CNAME. Target, TTL, www, TXT records,
   nameservers, and GitHub Pages remain unchanged. Both origins serve the same
   build during DNS propagation. Snapshot and checks are retained as artifacts.
6. The workflow verifies the live Cloudflare build, complete HTTP contract and
   browser search. It automatically restores `proxied:false` on verification
   failure. Follow with real-browser companion checks and observation.

## Rollback

Run `cloudflare-cutover.yml` from main with `mode=rollback`. This restores the
exact apex CNAME to unproxied GitHub Pages. The Worker route may remain staged:
unproxied requests do not reach it. Do not delete Pages or change the CNAME target.
If a run is forcibly cancelled during the DNS switch, run rollback explicitly;
never infer the current proxy state from a cancelled job's status. `mode=status`
performs only read-only inventory. Keep snapshots and both origins until a later
explicitly approved retirement of the old hosting.

## References

- [Static Assets bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Header policy](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Static Assets limits](https://developers.cloudflare.com/workers/platform/limits/#static-assets)
