# Editorial and maintenance guidance

## Sources and claims

A valid ATT&CK identifier proves taxonomy, not a procedure mapping. Record the exact source passage, source URL/date, release/domain and whether the mapping is explicit or inferred. Check actor aliases, attribution, telemetry requirements and claimed detection outcomes separately. Do not upgrade the repaired actor intake from unverified until its numbered research provenance is recovered and the corresponding assertions are reviewed.

`npm run check-editorial` scans authored Markdown/HTML for accidental raw citation artifacts. The checked-in baseline is an explicit legacy exception, not a moving comparison with HEAD. Reduce it as evidence is repaired; do not grow it to silence new failures. Fenced/inline code examples are excluded. Main currently retains 29 unrelated legacy occurrences; actor source retains 724 in four other files. The affected OilRig/Magic Hound report has no unexplained raw markers. Readable unverified-source labels retain the 180 unresolved references.

Actor `npm run check-mappings` validates the scoped review manifest and mapping rows against a pinned official extract. Keep `evidence_url` and `review_boundary` on every reviewed row. Human semantic review remains required. The scoped official extract is not a full-site certification.

## ATT&CK updates

Enterprise is pinned to 19.1. Official STIX source: `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.1.json`; SHA-256 `bdf1ce86a4e604214c5076d37ae4dcb322678afc528df8492e6fdc1b554f5da3` in the actor manifest. The importer documents provenance/version and produces the existing full defense model, core summary and 32 delivery chunks from the same input.

```sh
node scripts/build-threat-matrix-public-data.mjs --attack-only --domain enterprise --version 19.1 --offline-cache /tmp/1200km-attack-cache
node scripts/build-attack-knowledge-mesh.mjs
npm run check-threat-matrix
npm run check-attack-mesh
npm run check-audit
```

Before changing the pin, compare official schemas and retirement/replacement relationships, update the review manifest and importer together, and inspect technique → strategy → analytic → log-source data-component links. Preserve the difference between absent, legacy, not imported, loading and failed data. Do not apply Enterprise relationships to Mobile, ICS or ATLAS by assumption. Check T1059.003/DET0202, an empty relationship set, a retired entity, a mismatched release and a failed chunk request.

## Generation and dates

Authored learning fragments are in `content/learning-paths/*.html.inc`; regenerate with `npm run build-learning-paths`. Source fragments and this review package are excluded from publication. Do not edit only generated learning pages, directory pages, catalogue, sitemap, mesh or feed files.

After substantive changes, regenerate in dependency order: learning/shell and ATT&CK mesh; catalogue and Cyber Knowledge audit; reference data and pages; metadata; catalogue; AI discovery. Recheck generators after dependency changes. Use `node scripts/build-site-artifacts.mjs --metadata-only --remote` for the checked-in cross-repository sitemap union. Without `--remote`, metadata intentionally describes only locally staged material and will not preserve remote-only URLs. The preview builder documents the main+archive staging order; the production workflow adds remote sources.

Do not refresh publication dates during routine generation. Homepage/editorial presentation dates identify substantive changes; a dataset snapshot, individual assessment, link check and third-party evidence snapshot retain their own dates. RSS GUIDs remain canonical URLs. Preserve the distinction between published immutable AdversaryGraph releases and validated source releases.

## URLs and archive boundary

The archive remains pinned. `prepare-article-archive.mjs` changes its editable Docusaurus configuration before build; it rejects an unknown or conflicting configuration. The release transformer aligns canonical/OG/schema signals. Do not replace this with a compiled-HTML-only patch or redirect every entity into Discover. Preserve old document anchors when changing headings; retained labels keep the actor section IDs stable.

Use actual Git access for Docusaurus builds: the sandbox's blocked subprocess lookup produced missing modification dates, whereas the build with Git access passed all 194 actor SEO routes. Never substitute today's date for missing source history.

## Regression and release routine

Run `npm run check-release-source`, then the staged SEO, semantics, catalogue, links, search index/browser and browser-quality checks listed in VERIFICATION.md. Check both directories in cold mobile/desktop conditions after data-volume changes. Initial directory ceilings: 250,000 decoded HTML bytes, 3,200 DOM nodes and 1 MiB total local transfer. Preserve the full export and no-JS static paths. First global filtering loads a compact index; measure that wait separately from initial rendering.

Check 900/901 and 1379/1380 navigation transitions, 320px reflow, both themes, keyboard, visible focus, reduced motion, and selected-entity placement. Review screenshots as well as axe results. Do not hide real overflow or disable accessibility rules to pass a gate. Performance totals include navigation HTML; lab LCP ceilings are not field Core Web Vitals.

Before an authorized release, review and stage the isolated diffs, run whitespace/secret checks, then CI/CodeQL, deployment and live verification for both affected source boundaries. Confirm actual CDN headers/aliases; repository `_headers` alone is not deployment evidence.
