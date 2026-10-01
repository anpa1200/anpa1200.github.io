# Local research-extension validation

Date: 2026-10-01. The reviewed changes were applied to public `main` at `33e562657c7e53d6c432c26921c646a0b4dffe96` in an isolated clone. Checks below distinguish local editorial evidence from broader application and release validation.

- `node scripts/build-anomaly-tags.mjs --check`: passed.
- `node scripts/build-anomaly-atlas-integration.mjs --check`: passed.
- `node --check assets/anomaly-tags.js`: passed.
- `node tests/anomaly-atlas.test.mjs`: 4 passed, including preservation of a source-rendered hydrated notice.
- `node tests/anomaly-research-logic.test.mjs`: 6 passed (synthetic mathematical counterexamples).
- `node tests/anomaly-tags.test.mjs`: 7 passed, including all three new paths and their existing topic IDs. A sandbox child-spawn refusal was resolved with an approved scoped offline retry. The expected registry size was updated from 108 to 111 for the three added paths.
- Integration manifest equals the Atlas generated source. Publication pins reference the real merged Atlas (`cc656d48603b6cc1f2ac6683162d527ba54a0ab9`), CTI (`089c917a8c69fe58c365cdc4d5fd69e2649e813c`) and archive (`2f004168dd9dc98ffc2a1e8a5cb0ed5046ccc6d5`) commits. The imported research provenance remains unchanged.

All supplemental diffs pass `git diff --check`. The initial editorial checks did not run public external URLs, browser hydration on a live site, full site release/search/deployment gates, fresh dependency installation, query-engine execution or public recording replay. Publication CI and deployment checks are recorded separately in the pull request. Eight KQL examples and 34 engine fixtures remain historical reported research results; neither is independently replicated by this editorial pass. The 2688-entity-day study remains synthetic, with FP 85→8 and TP 18→11 preserved.
