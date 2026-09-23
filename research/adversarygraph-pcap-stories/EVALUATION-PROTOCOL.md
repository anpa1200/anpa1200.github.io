# Evaluation protocol recorded before answer retrieval

The final prompt is `pcap-investigation-summary-v5`. All final native summaries,
their packet/enrichment snapshots and readable exports are frozen before fetching
publisher answers. Answer text is never supplied to AdversaryGraph or its models.
The first six captures were used for pre-answer engineering pilots; this is not
a 20-case untouched holdout. Public examples may be present in model training.

Each case will receive a human-readable comparison in four separate dimensions:

1. **Affected system:** does the concise report identify the answer's affected
   host(s), without treating every local identity as a victim?
2. **Incident explanation:** does it describe the answer's main activity or chain,
   describe only a correct fragment, or fail to explain the incident?
3. **Malware family / attack label:** is the answer's label correctly supported,
   correctly left unresolved, or incorrectly asserted? An unresolved family is a
   coverage gap, not a fabricated family or a complete success.
4. **Indicator selection:** which final action-list indicators are corroborated by
   the answer, which are not addressed there, and which contradict the answer?
   Being absent from a non-exhaustive answer is NOT a demonstrated false positive.

Review also checks semantic overclaims, traffic direction, attribution, downloaded
versus executed files, and the distinction between current reputation and the
historical event. Source-bound citations and schema validation are not semantic
proof. Any residual error is reported, not edited out of the frozen native result.

There will be no single invented "accuracy" percentage. Report completion,
readability, answer agreement, external-provider coverage and IOC qualification
are different measurements. Partial answers or screenshot-only answers are
explicitly labelled; unverified details are not counted as matches.

Screenshots must come from the running platform, match the saved analysis and
summary IDs, contain all rendered claims, have no horizontal clipping or browser
errors, and be visually inspected individually after capture. A technically valid
screenshot of a flawed investigation is visual proof of that flaw, not proof of
correct analysis.

Model tokens come from provider usage/audit records. Final accepted calls and
engineering/failed attempts are counted separately. Unreported usage is unknown,
not zero. Local decoding latency, model generation latency and total engineering
elapsed time are not interchangeable. No controlled human experiment was run.
