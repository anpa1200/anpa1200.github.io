# Research review and anomaly navigation — 2026-09-21

Status: implemented and tested locally in two isolated worktrees. **Not committed, pushed or deployed.** Existing SEO worktrees were not modified. The article's legacy factual/query findings remain open; this work does not certify the research as production-ready.

## Deliverables

- [Full factual, logic and editorial audit](research-fact-audit.md): 36 numbered review findings, section-by-section assessment, unresolved source checks and validation requirements. It distinguishes the corrected taxonomy omission, verified Okta identifiers and open issues.
- [Page dispositions](page-dispositions.json): one disposition for every scanned record.
- [Reviewed assignments](../../data/anomaly-tag-assignments.json): exact URL, review date, source hash and supporting passage for every tag mapping.
- [Taxonomy](../../data/anomaly-taxonomy.json): definitions and exclusion criteria for all 15 navigation tags.
- [Browser evidence](browser-validation.json), [desktop screenshot](anomaly-topics-desktop.png), [mobile screenshot](anomaly-topics-mobile.png).
- [Preservation evidence](preservation.json), [test output](anomaly-tests.log), [main release checks](release-source.log).

The writer skill guided the explicit evidence labels and the separation between documented behavior, inferred detection opportunity and validated implementation. Tags describe topical relevance, not detection effectiveness or factual certification.

## Coverage and honest limits

| Measure | Result |
|---|---:|
| Content records retrieved and scanned | 943 |
| Failed content retrievals | 0 |
| Candidate pages contextually reviewed | 146 |
| Pages selected for tags | 93 |
| Candidate pages rejected | 53 |
| Scanned pages without a candidate match | 797 |
| Reviewed tag-to-page mappings | 202 |
| Original archive articles tagged | 36 |
| Other hosted articles/guides/docs tagged | 57 |
| Existing guide cards with added tags | 11 |
| Navigation tags | 15 |

The inventory combines all 192 local article sources, hosted catalog entries, guide-index targets and discoverable companion sitemaps. It includes permitted mirrors while preserving their attribution and external canonical ownership. It excludes generated reference stubs, tag/pagination routes and non-content assets. Some collection pages were discovered and explicitly rejected when their match was navigation-only.

The AI course sitemap returned 404; its 11 cataloged pages were still scanned. The scan cannot guarantee that uncataloged, unlinked or undiscoverable pages were found. Regexes only proposed candidates; editorial decisions selected tags. No-candidate pages were not individually fact-checked, and no recall percentage is claimed for the tagger.

## Tags applied

| Tag | Pages |
|---|---:|
| Volumetric | 24 |
| Frequency / Rate | 12 |
| Temporal | 30 |
| Peer Group | 12 |
| Sequence | 14 |
| Graph / Relationship | 3 |
| Geographic / ASN | 19 |
| Identity / Access | 33 |
| Rare Process / Service | 5 |
| Parent–Child Execution | 13 |
| Data Movement | 6 |
| Protocol / Application | 15 |
| Negative / Absence | 3 |
| State Change | 7 |
| Multi-Event Correlation | 6 |

These overlap. Multi-event correlation combines feature families rather than adding a new independent statistical class. The research now has 30 case-to-topic mappings across 17 case/campaign records, not 30 independent incidents.

## Implementation

| Area | Files and behavior |
|---|---|
| Reviewed data | `data/anomaly-taxonomy.json`, `data/anomaly-tag-assignments.json`; compact runtime `data/anomaly-tags.json`. |
| Reproducible discovery | `scripts/collect-anomaly-corpus.mjs`, `scripts/propose-anomaly-tags.mjs`; reports retain the inventory, frozen candidate list and review decisions. Text cache stays outside the repository. |
| Review compilation | `scripts/review-anomaly-tags.mjs` checks the candidate snapshot hash before using numerical decisions; rerunning discovery requires a new review, not blind reuse of old indices. |
| Metadata | `scripts/anomaly-tags-lib.mjs` and `scripts/content-catalog-lib.mjs` apply reviewed tags without rewriting evidence levels, ownership, dates or canonicals. Generated catalog and taxonomy audit refreshed. |
| Guide discovery | `scripts/build-anomaly-tags.mjs` adds marked tag spans to 11 existing cards in `guides.html`. Existing guide search and query-string filters work with these labels. |
| Search | `scripts/search-index-lib.mjs` emits Pagefind anomaly facets; `assets/site-search.js` exposes the filter and loads shared topic navigation. |
| Page links | `assets/anomaly-tags.js` and `.css` display a definition link and related-content search link for each reviewed tag. The shared loader handles page replacement and back/forward navigation. |
| Archive | `src/data/article-catalog.json` and `trainsec-catalog.json` receive display tags. The existing research article adds the correlation section, crosslinks and a prominent technical-review warning. Its downloadable audit is copied from this report. |
| Evidence register | Archive `research/anomaly-incidents.json`, renderer, validator and downloadable JSON updated for 15 topics / 30 mappings. Four pre-existing reciprocal article links are retained. |
| Regression checks | `tests/anomaly-tags.test.mjs`, `tests/anomaly-research-logic.test.mjs`, `scripts/check-anomaly-browser.mjs`, `scripts/check-anomaly-preservation.mjs`. The Pages workflow includes `npm run check-anomaly-tags`. |

No tag landing pages or route renames were generated. Guide body copy is byte-identical after removing the explicit added tag markers. All 1,297 main catalog identities and every non-tag field are unchanged. `robots.txt`, `llms.txt`, `sitemap.xml` and `sitemap-all.xml` are unchanged. The archive preserves all 192 routes/canonical identities, 44 research images and 11 original code blocks.

## Verification

- Existing main-site `npm run check-release-source`: passed; see the full log.
- New anomaly tests: 11 passed (five tag/provenance cases and six synthetic logic counterexamples). Counterexamples are not KQL/SPL engine tests.
- Both archive variants, legacy and embedded: passed. The archive verification summary records all seven checks in `anomaly-research-update/reports/anomaly-incidents-20260921/validation-summary.json`.
- Rendered research: one H1, 61 explicit anchors and 455 self-fragment links checked.
- Actual local browser integration: passed for the built article, 15 definition targets, mobile component width, guide filtering and search deep-link restoration. Browser testing found and fixed an initial Docusaurus flex-layout placement bug.
- Real Pagefind test index: 50 locally available reviewed pages, all 15 anomaly facets; the temporal filter returned exactly its 16 expected pages. This is a local subset integration test, not a deployment or full live-index rebuild of all 93 reviewed pages.
- Shared navigation's client-route replacement test is synthetic; it does not claim every companion's live router was individually exercised.
- Fresh production, CI and deployment were **not** tested because no release was requested.

## Maintaining the taxonomy

Do not infer tags from product features or incident names alone. Require a substantive detection/analysis passage and apply the exclusion rules. Preserve unrelated tags. Never convert a tag into an evidence-level upgrade.

After editing reviewed assignments, run from the main worktree:

```sh
node scripts/build-anomaly-tags.mjs --archive ../anomaly-research-update
npm run build-content
npm run check-anomaly-tags
npm run check-release-source
```

Then run the archive's `npm run research:anomalies:verify`. The corpus collection/review scripts are explicit authoring tools, not unattended auto-taggers. Keep the frozen candidate snapshot and review decisions together; cache-independent checks validate the committed registry and its provenance.

## Release boundary

Main worktree: `/home/andrey/wireshark/anomaly-ecosystem-update`, branch `research/anomaly-tags-20260921`.

Archive worktree: `/home/andrey/wireshark/anomaly-research-update`, branch `research/anomaly-incident-evidence-20260921`.

If publication is later requested, release the archive changes and update the main Pages workflow's `ARTICLE_ARCHIVE_COMMIT` pin to that reviewed archive commit before releasing the main site. Do not merely deploy the main registry while its definition targets and audit asset are still pinned to the old archive. Rebuild the full staged catalog/search index, verify remote companion tag links, and check the live article and search after deployment. No commit ID is invented in this handoff.
