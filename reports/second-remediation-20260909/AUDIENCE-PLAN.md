# Practical return-use and measurement plan

The existing analytics infrastructure has not been given new events or account settings. No GA4/Search Console dashboard access was established in this implementation. Traffic, field CWV, conversion and return-use baselines are unavailable, not zero. Search query URLs are excluded from automatic analytics and from outgoing document referrers.

## Event definitions for the existing provider, if account access is supplied

| Event | Allowlisted properties | Interpretation |
| --- | --- | --- |
| `search_result_open` | Canonical result path with no query/hash, coarse type, rank, surface | Navigation intent / eligible search interactions; not answer quality |
| `entity_open` | Public framework/domain, validated entity ID, pinned release, outcome | Successful render / attempts; distinguish invalid ID and load failure |
| `entity_link_copy` | Public ID/domain and success/fallback outcome | Clipboard success / attempts; not proof of sharing |
| `research_download` | Allowlisted fixture/dataset ID, format, page path | Download intent / example visits; not completed transfer or learning |
| `path_step_open` | Named path/step ID and canonical destination | Step navigation / starts; not course completion or competence |
| Returning readership | Existing provider's consented aggregate cohort/window only | Include consent and observation gaps; add no fingerprinting or cross-site ID |

Never include raw queries, free text, URLs supplied by visitors, secrets, uploaded content, clipboard contents, full referrers, or unsanitized errors. Use local schema validation and inspect the outgoing requests with test values before enabling any event. Review the provider's consent behavior and reporting access; delayed loading alone is not consent. Use the same reporting definitions over time and disclose missing observations. Field p75 LCP <=2.5s, INP <=200ms and CLS <=0.1 require real-user data; local lab results cannot substitute.

## Sustainable 30–90 days

- **Days 1–30:** maintain the three runnable exercises. Once a week, review broken-download reports, search failure examples supplied voluntarily, and one unresolved reference title. Prepare one short task-focused explanation per exercise: inputs, exact result and what the result does not prove. Link to the canonical guide and RSS. Record feedback as issues; do not claim adoption from page counts.
- **Days 31–60:** add one approved alternate telemetry fixture to the permission or process exercise, with a negative control and versioned expected output. Recover one consequential actor claim from an original source and update its explicit boundary. Share the reproducible task and the correction, rather than generic project totals.
- **Days 61–90:** review the first two months of comparable, consented aggregates if available. Otherwise use reproducible user journeys and concrete feedback. Refresh one worked example, retire or relabel unsupported claims transparently, and publish a compact substantive changelog entry. Prefer one maintained example over several incomplete course shells.

These are preparation/distribution recommendations, not posts sent or a growth forecast. The learning-page changelog distinguishes authored example changes from mechanical regeneration; generated pagination is not marketed as original research. No newsletter form, subscription account, social post or outbound message was created.
