# Workers Static Assets migration: phase one only

No custom-domain cutover is authorized by this change. `wrangler.toml`,
`cloudflare/agent-readiness-worker.js`, `CNAME`, the existing edge deployment
workflow, and both GitHub Pages deployment/production-verification jobs remain
unchanged. Phase-one tests lock these files/jobs to their pre-migration hashes.
Do not merge this branch during the preview exercise: a merge runs the existing
Pages deployment. Use a same-repository pull request for the quality/preview run.

## Architecture and artifact identity

The existing `quality` job still builds and validates `${RUNNER_TEMP}/site`.
It uploads that directory to both the existing Pages artifact and a generic
Actions artifact, with hidden files included. The separate `cloudflare-preview`
job downloads the generic artifact **by immutable artifact ID from this run**
into `./dist`. It verifies every file against the existing `build.json` digest,
checks asset limits, installs the separately locked Wrangler tooling, and deploys
only `1200km-site` via `cloudflare/wrangler.site.json`.

There is no Cloudflare build, content rewrite, artifact regeneration, origin
proxy, custom domain, or production route in this configuration. Wrangler bundles
the small Worker; this is not a second site build. `workers_dev` stays enabled.
`ASSETS`, `run_worker_first: true`, `html_handling: none`, and
`not_found_handling: none` are explicit. CLI tooling is pinned to Wrangler
4.142.0 with a separate lockfile; Actions use full commit pins.

The deploy job uses repository Actions secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. It never exposes credentials to fork pull requests and
does not use `pull_request_target`. A missing secret fails visibly before deploy.
Do not put credentials in source, artifacts, reports, or chat. The token needs
permission to deploy Workers with assets in the selected account; phase one
does not need DNS edits or a zone route. Existing local Wrangler OAuth can be
used for an operator deployment of **the same downloaded and verified artifact**,
but that does not prove the secret-backed Actions deploy path works.

## Routing and response contract

- `/` and slash-terminated directory paths internally fetch `index.html`.
- Existing files, including `/about.html` and `/projects.html`, stay at their
  requested URLs. Extensionless Pages aliases such as `/about` internally fetch
  `/about.html`; they do not redirect explicit HTML files.
- A valid directory without its slash receives a 301 on the incoming origin,
  retaining its query. Redirects do not introduce a fragment, so browsers inherit
  the original fragment; a real-browser test checks this behavior.
- Unknown paths return the existing root `404.html` bytes with status 404.
  A direct `/404.html` request remains 200, matching Pages. HEAD has no body.
- Read-only methods are GET/HEAD; other methods receive 405. Ordinary range and
  conditional asset requests are forwarded. Internal probes, Markdown alternates,
  and the custom 404 strip range/conditional headers to avoid partial documents.
  Static Assets may answer Range with a complete 200 body instead of Pages' 206;
  both the local runtime suite and the live parity report explicitly check this.
- Every alternate Markdown request uses `env.ASSETS.fetch`. The existing GET-only
  `Accept: text/markdown` selection and token estimate are retained, with query
  preservation, `Vary: Accept`, and fallback to HTML if an alternate is absent.
- `_headers` is embedded into the Worker as a text module and explicitly applied
  to responses. Unsupported future rule syntax fails validation. Headers are
  idempotent so binding-level policy cannot duplicate CORS or discovery values.
- Discovery Link headers, well-known JSON/linkset types, Markdown MIME, all
  security headers, and the existing Pages wildcard CORS are retained. The RSS
  Link in `_headers` also applies. JS retains the Pages MIME spelling.
- Only workers.dev responses receive the extra `X-Robots-Tag: noindex` to keep
  the preview out of search indexes. Content canonicals stay at their original
  production URLs; neither HTML nor `robots.txt` is rewritten.

## Validation and commands

Run from the repository root:

```sh
npm ci
npm ci --prefix cloudflare
npm run check-site-worker
npm run check-site-worker:runtime
npm run check-release-source

# dist must be the downloaded quality artifact, not a source checkout.
node scripts/check-static-artifact.mjs --site ./dist --site-commit EXPECTED_40_CHARACTER_SHA
cloudflare/node_modules/.bin/wrangler deploy --dry-run --config cloudflare/wrangler.site.json
```

Local workerd preview, without any Cloudflare deployment:

```sh
cloudflare/node_modules/.bin/wrangler dev --local --config cloudflare/wrangler.site.json --port 8787
node scripts/verify-hosting-parity.mjs --site ./dist --preview-origin http://127.0.0.1:8787 --report /tmp/local-hosting-parity.json
node scripts/check-search-browser.mjs --site ./dist --bundle ./dist/pagefind --origin http://127.0.0.1:8787
```

After the CI deploy, use the **actual URL returned by Wrangler**, never a guessed
account subdomain:

```sh
node scripts/verify-hosting-parity.mjs --site ./dist --preview-origin https://1200km-site.ACCOUNT_SUBDOMAIN.workers.dev --report /tmp/hosting-parity.json
node scripts/check-search-browser.mjs --site ./dist --bundle ./dist/pagefind --origin https://1200km-site.ACCOUNT_SUBDOMAIN.workers.dev
```

The independent `--hosting-search-only` mode checks the complete search-page
flow and browser fragment inheritance without the unrelated embedded-theme
integration cases. It captures Pagefind Web Worker traffic before execution,
including same-origin WASM/index/fragment responses. CI runs this focused
check **and** the full browser suite; the focused pass cannot hide a full-suite
CSP or integration failure.

The parity report separates exact-artifact failures from live-production
differences. It checks status, body SHA-256, identity, canonical URLs, redirects,
query handling, MIME, security/CORS/Link headers, Markdown, sitemap/robots/llms,
all staged well-known endpoints, representative module/content/static/Pagefind
assets, and 404 behavior. It inventories **every same-origin sitemap URL** against
the artifact and probes companion roots. Browser validation exercises real
Pagefind WASM/index loading, ranking, filters, autocomplete, keyboard/pointer
interaction, mobile layout, section links, and fragment inheritance.

Only the documented HTML build meta/visible build ID is normalized when comparing
different releases. Exact preview-to-artifact comparisons never normalize bytes.
Unknown differences/missing companion content fail CI. For exploratory reporting,
`--report-only-differences` leaves production differences in the report but does
not fail on those differences; artifact/header/URL failures still fail. This flag
does **not** approve a cutover. The default CI command does not use it.

## Baseline findings that must not be hidden

Initial read-only inspection on 2026-09-28 found production at site commit
`7bdd8a073812e675b7f75acb0779bf55c45db46a`, archive commit
`a94750828ed75dbce4c1e9a9f4ea1994fa785943`. Sampled responses identified the server
as GitHub.com and did not expose the configured edge security/discovery headers;
the homepage returned HTML even for `Accept: text/markdown`. The extensionless
API catalog had an octet-stream MIME type. These are observed differences from
the configured policy, not permission to change production.

The main artifact does not contain all GitHub project-site content under the
domain. The historical Anomaly Atlas mapping URL and CTI field manual homepage
are examples. Other companion roots may resolve to different local stubs. An
ASSETS-only origin cannot reproduce missing external project content. The report
must remain explicit about missing pages and body/canonical differences. Do not
hide these by proxying requests back to the old origin or relaxing the checks.

The exact production artifact inventory found **430 missing same-origin sitemap
URLs across 11 path roots**. The local full-artifact run, after MIME corrections,
passed all 100 Worker-contract cases but retained production-parity blockers.
Some hydrated Docusaurus themes request absolute `https://1200km.com` stylesheets;
the preserved `style-src 'self'` blocks these on a workers.dev or localhost
hostname. This is a preview-origin integration difference, not a reason to weaken
CSP or modify the downloaded artifact. It remains visible in the full browser
check. Focused Pagefind search passed with 674 same-origin resources observed.

At initial inspection, GitHub reported no repository Actions secrets and no
`github-pages` environment secrets. Local Wrangler OAuth was present. Recheck
the repository secrets before considering automated deployment validated.
The local Cloudflare account also reported both Worker names absent before this
change; public A records pointed directly to GitHub Pages. Do not assume that
the root Wrangler route configuration describes deployed zone state.

## Final cutover runbook — future, separately authorized change

1. Resolve every missing companion route. Bring each companion's pinned, validated
   artifact into the existing GitHub quality job (including its assets), or design
   and approve explicit per-path routing. Inventory all current Worker routes,
   project Pages origins, DNS records, redirects, and hostnames using read-only
   dashboard/API checks. Do not infer routing from response headers alone.
2. Obtain review of the observed security/discovery/MIME changes and preview-only
   noindex header. Keep canonical URLs and indexes on `https://1200km.com`.
   Preserve the old Pages artifact, DNS record values/proxy state, and old Worker
   version/route for rollback. Record the exact new Worker version and digest.
3. Fix/verify repository Actions credentials. Merge the migration workflow only
   after approval; allow the unchanged Pages deploy to publish normally. Ensure
   both hosts now serve the **same quality artifact/build identity**. Rerun strict
   parity and all browser checks. Require a zero-blocker report and explicit
   approval of every intentional difference. Do not cut over with a red report.
4. Prepare a separate reviewed production configuration for `1200km-site`. If the
   current zone has the stated proxied `1200km.com/*` route, reassign that exact
   route from `1200km-agent-readiness` to `1200km-site` in one reviewed route update;
   leave the GitHub Pages origin/DNS in place for fast rollback. Do not simply add
   a conflicting overlapping route. If read-only inventory instead confirms DNS
   is unproxied/no route exists, choose and approve the Cloudflare proxy/custom-
   domain setup first; its exact API change depends on that live inventory.
5. Immediately verify `https://1200km.com/build.json`, deep URLs, `.html`, redirects,
   all headers, Markdown, discovery, search, static assets, and custom 404s against
   the approved artifact. Monitor Worker errors/latency, 404s, asset requests, and
   search failures. Worker-first handling invokes a Worker for asset requests and
   therefore consumes paid Worker request/CPU allowance; set budget/error alerts.
6. Roll back on any critical regression: restore the saved production route to
   the existing edge Worker (or restore the exact prior DNS/proxy state if that
   was the approved switch). Keep Pages publishing and its custom-domain setup
   throughout the observation window. Do not delete its deployment or the old
   Worker. Retire old infrastructure only in a later explicitly approved change.

Phase one performs none of steps 3–6. Zero-downtime readiness requires closing
the content/routing gaps; creating a working preview alone is not proof of it.

## Platform references

- [Static Assets configuration and bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Disable automatic HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Response header policy](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Static Assets limits](https://developers.cloudflare.com/workers/platform/limits/#static-assets)
- [Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
