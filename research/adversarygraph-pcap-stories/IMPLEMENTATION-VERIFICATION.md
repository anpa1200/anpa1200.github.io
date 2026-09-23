# PCAP reporting revision: verification record

## Implemented and running locally

The new PCAP report-writing stage is available after packet analysis and approved
enrichment. It produces a concise, cited analyst-review report and a focused
`/pcap/:analysisId/report` view. The packet evidence and original reports remain
intact. All case data is from public training captures; no malware was executed.

Implementation is in the isolated `adversarygraph-pcap-quality` worktree on branch
`feat/pcap-readable-summary-20260922`, based on
`817f74b13d9c4155db6c161e260747df0b0d1abe`. Current-turn changes are **not committed
or pushed**, and no website publication was performed. Unrelated changes in the
canonical checkout were preserved.

## Changed components

| Component | Change |
|---|---|
| `backend/app/services/pcap_story.py` | Bounded short-report evidence selection, prompt, validation, conservative optional-claim filtering, rendering and provenance |
| `backend/app/api/routes/pcap.py` | Read-only preflight, saved summary access and explicit report-writing endpoint; permissions, TLP, consent and concurrent-source checks |
| `backend/app/services/investigation_story.py` | Reusable citation-bound generation, bounded repair diagnostics and actual model/usage metadata |
| `backend/app/services/ai/openai.py` | Strict server-issued citation/indicator enums and returned model metadata |
| `backend/app/services/ai/claude.py` | Returned model, stop reason and usage accounting including cache input tokens |
| `backend/app/services/pcap_assessment.py` | Hash-qualified PE-under-image-path file-review candidates; no automatic host-IP promotion |
| `frontend/src/components/PcapSummaryPanel.tsx` | Explicit final reporting stage, readable report card, exports and separate evidence details |
| `frontend/src/pages/PcapReport.tsx`, `frontend/src/App.tsx` | Focused live report route |
| `frontend/src/api/client.ts` | Typed PCAP summary API contract |
| `frontend/src/pages/Analyze.tsx` | Integrate the final stage and bound oversized investigation handoffs |
| Backend unit/integration and frontend PCAP browser tests | Evidence limits, provenance, authorization, source changes, readability and handoff regressions |
| `docs/PCAP-SHORT-REPORTS.md` | Report contract, governance and review checklist |

## Validation

- Final backend regression output: **1,624 passed, 180 skipped, 46 warnings** in
  64.44 seconds. Skips are not counted as passed integration coverage.
  [Full backend test output](backend-tests-final.log).
- Frontend lint passed; TypeScript/Vite production build passed. Vite retains an
  existing large-code-chunk warning; this is not reported as a clean warning-free build.
- All four targeted PCAP browser tests passed: report writing/consent/readability,
  reputation selection, report quality, and large-investigation handoff.
  [Browser test output](frontend-tests-final.log).
- The two previously rejected oversized handoffs returned HTTP 200 through the
  real local UI. Original texts were 297,320 and 502,983 characters; bounded
  handoff descriptions were 537 and 541 characters. Full reports remain stored.
  [Okay-Boomer handoff proof](2019-11-12/handoff-retest.json),
  [Eggnog Soup handoff proof](2018-12-18/handoff-retest.json).
- Selected deployed backend source hashes are checked against the worktree, and
  exact service image IDs are retained in [runtime provenance](runtime-provenance.json).
- Original packet results and internal-context snapshots are checked against the
  490-file baseline freeze. Final native reports have a separate pre-answer freeze.
- Every published case screenshot must have a matching validation JSON recording
  live IDs, hash, model, DOM checks, image hash and completed visual inspection.
  Image presentation success does **not** mean investigation correctness.

All 20 final report-card images now have matching checksums and individual visual
inspection records: 16 show saved reports and four show an explicit withheld state.
No screenshots were fabricated or substituted with answer-assisted report images.

The final optional-citation reliability fixes were deployed in backend image
`summary-20260922-v11`; the frontend is `summary-20260922-v6`. Their unit and
browser regressions passed. The four intended live Claude retries were blocked
by the execution approval mechanism, pending explicit consent to send the exact
bounded public-training metadata to Anthropic. They are **not** reported as
successfully retested. Subsequent reference-answer review did not alter any
frozen native report or submit any answer text to a model.

## Known boundaries

Strict JSON, exact quotations and literal-identifier checks do not establish
semantic correctness. Current reputation is not capture-time reputation. A
download is not execution, and missing telemetry is not a clean verdict. Global
negative claims, weak POST-based leads and incomplete attack chains are assessed
explicitly in the per-case answer comparison instead of being hidden by a passing
software test result.
