# Release record

## Companion repositories deployed

| Repository / PR | Merge commit | Successful deployment run |
| --- | --- | --- |
| [Actor research #3](https://github.com/anpa1200/israel-government-threat-actors-cti/pull/3) | `705cfb6fc46892182c9c4507e13bf6c386f3b6ef` | [34350402169](https://github.com/anpa1200/israel-government-threat-actors-cti/actions/runs/34350402169) |
| [Customer-driven CTI #2](https://github.com/anpa1200/customer-driven-ai-cti-project/pull/2) | `93bf68ec25401dc3f06cba95c34e52c3e4b5322e` | [34350487691](https://github.com/anpa1200/customer-driven-ai-cti-project/actions/runs/34350487691) |
| [Shield #2](https://github.com/anpa1200/opencti-intelligent-shield/pull/2) | `6c9e017f251f7754c15c664fd864c03afaac96f4` | [34350496876](https://github.com/anpa1200/opencti-intelligent-shield/actions/runs/34350496876) |

Actor and CTI post-merge validation passed. Shield has no PR validation workflow; its local checks and deployment build passed. `production-sections.json` verifies all four requested raw canonicals, their no-slash aliases, and the live sourced actor core with 171 preserved occurrences.

## Main release candidate

`npm run check-release-source` passed, including all existing regression gates and the new fixtures. The clean staged preview passed the existing search browser/index checks (1,441 local pages plus 165 knowledge projections), internal links, SEO, record reachability, and scoped browser acceptance. Staged References is 183,713 decoded bytes; Knowledge Sources is 168,326. The exact staged payload passed a redacted gitleaks scan.

This checked-in record describes the validated candidate. Main PR/CI/deployment and final production results are appended to the local release record after they complete; production completion is not inferred from local success.
