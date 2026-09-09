# Useful-outcome measurement specification

No GA4 or Search Console account access was available for this implementation. Traffic, successful search, return rate, field CWV and indexing baselines are **unavailable**, not zero. No new telemetry events, tracking provider, account flow or identifiers were installed.

Current source has lazy GA loading in `assets/site-performance.js` and an existing `affiliate_click` event. Lazy loading is not evidence of a consent choice. Review the existing privacy/consent behavior and applicable account requirements before enabling this specification; do not silently send raw site queries.

| Proposed event | Trigger / allowed data | Interpretation and denominator |
| --- | --- | --- |
| `search_result_open` | A visitor activates a rendered Pagefind result. Store canonical local result path without query/hash, coarse content type, result rank and surface (header/home/search). Never the raw query. | Completed result navigation / eligible search interactions. Result clicks alone do not prove that the answer was useful. |
| `entity_open` | A known public entity finishes rendering. Store supported domain and public entity ID, entry surface and dataset release. | Successful entity render / entity-open attempts. Distinguish invalid-ID and data-load failures locally; do not capture arbitrary route text. |
| `entity_link_copy` | Clipboard write succeeds; fallback display is a separate outcome. Only public ID/domain. | Copy success / copy attempts, not a claim that the destination was shared or used. |
| `research_download` | Activation of an allowlisted dataset/fixture download; coarse asset ID/format and page path. | Download intent / dataset-page visits. A click is not completed transfer or actual reuse. Prefer aggregate server counters if already available and privacy reviewed. |
| `path_step_open` | Click into a named, versioned step from an implemented learning path. Path ID, step ID and content path. | Step navigation / path starts. Do not label this completion, competence or a certificate. |
| Return visits | Use the existing provider's consented aggregate reporting, if authorized. Do not add fingerprinting or persistent cross-site identifiers. | Report the provider's stated cohort/window and consent limitations. Missing observations are not non-returning visitors. |

Use a fixed allowlist for paths, event names and identifiers. Exclude query strings, fragment queries, free text, emails, copied text, uploaded content, logs, cookies and arbitrary referrers from event parameters. Do not send an event before an applicable positive privacy choice. Local validation must intercept network requests and verify that denied/unset states send none of the proposed events. Review GA enhanced measurement and page-location settings too; adding a custom allowlist alone does not prevent other configured features from recording search parameters.

With authorized product access: verify the exact GA4 property/data stream and Search Console domain property in their UIs; verify ownership and the deployed sitemap, then inspect representative article/technique/directory URLs. DNS/robots/GA snippets do not prove account access or product linkage. Record a 28-day baseline, source/consent coverage and bot exclusions, then compare matched 28-day windows after release. Use p75 LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 only where real-user data exists. Keep these separate from the local lab report.

A modest review dashboard needs five rows: result-navigation rate, entity render/copy outcomes, dataset-download intent, path-step progression and returning readership. Until access and consent review are complete, use reproducible browser journeys and explicit issue reports to choose improvements; do not invent a conversion rate or keyword-volume estimate.
