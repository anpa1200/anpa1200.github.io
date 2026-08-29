# AI in Cyberattacks: public statistical dataset

This directory is the public normalized-data companion to [AI in Cyberattacks: A Statistical CTI Study](/ai-attack-statistics/) and its [interactive dashboard](/ai-attack-statistics/dashboard/).

## Denominator and lineage

The research began with **116 retrieved source records**, collapsed five HTML/PDF companion pairs into **111 deduplicated publications**, retained **108 usable records** in the References library (103 core and five context), and uses **103 core publications** as its primary statistical denominator. Three publications are excluded: two broken retrievals and one non-AI item.

The unit of analysis is a publication, not an attack, incident, campaign, victim, account, prompt, or malware sample. All analytical fields are machine-extracted candidates requiring review against the source evidence. At publication time, all 111 analyst-review rows remained uncompleted.

## Published files

| File | Grain | Purpose |
| --- | --- | --- |
| `publications.csv` | One deduplicated publication | Wide analysis table with pipe-delimited multi-value dimensions |
| `tags_long.csv` | One publication/tag occurrence | Normalized dimensions, source IDs, confidence, extraction method, and offsets; source excerpts are omitted |
| `metrics_long.csv` | One metric candidate | Unvalidated percentage, duration, cost, dwell, and blast-radius strings without copied source excerpts |
| `iocs_long.csv` | One IOC candidate occurrence | Hash, public IPv4, and defanged-domain candidates without copied source excerpts |
| `quality.csv` | One publication | Completeness and inclusion controls |
| `tag_dictionary.csv` | One tag type | Definitions and interpretation caveats |
| `summary.json` | Dataset snapshot | Machine-readable totals |
| `ai_attack_statistics.sqlite` | Relational snapshot | Publication, tag, metric, IOC, and quality tables; no private source-record table or evidence excerpts |
| `ai_attack_statistics.xlsx` | Workbook snapshot | Filterable publication, tag, metric, IOC, quality, and summary sheets without evidence excerpts or archive paths |
| `source-collection-report.md` | Collection audit | Retrieval and archive-quality summary without copied source documents |
| `source-uniqueness-report.tsv` | Uniqueness audit | URL, hash, exact-byte, confirmed companion-format, and near-duplicate evidence without local archive paths |

The downloaded third-party HTML and PDF archive is intentionally not republished. Public tables also omit copied evidence excerpts and local archive paths. Source IDs, canonical publisher URLs, normalized fields, offsets, hashes, and confidence labels remain available for audit and independent retrieval. Follow canonical publisher URLs through the [108-publication References library](/references/). Source publishers retain rights in their original material.

## Interpretation safeguards

- Publication counts measure coverage in this purposive corpus, not global prevalence.
- A publication can cover multiple incidents, while one incident can appear in several publications.
- Multi-label category percentages can sum above 100%.
- Co-mention does not prove relation, causality, attribution, exploitation, provider use, or victim geography.
- The 919 metric candidates include heterogeneous units and extraction false positives; do not pool them as confirmed outcomes.
- The 483 IOC candidates can be stale, benign, malformed, shared, or illustrative; validate before operational use.
- In `source-uniqueness-report.tsv`, `confirmed_companion_group=none` means the source is not part of a confirmed companion-format pair.
- ATT&CK IDs and tactics are candidates until the described behavior and evidence are reviewed.

## Spreadsheet safety

Untrusted retained values beginning with `=`, `+`, `-`, or `@` are prefixed with an ASCII apostrophe in the public CSV and XLSX exports. The prefix prevents spreadsheet formula execution and is not part of the underlying value. The release gate verifies that the workbook contains no formula nodes and that no CSV cell retains a formula-capable prefix.

## Licensing and reuse

No open-data license is granted for this published snapshot. Download availability supports inspection, citation, and analytical reproduction of this study; it does not grant permission to republish third-party source material or relicense content owned by source publishers. Third-party rights and terms remain with their respective owners. For reuse beyond lawful analysis and citation, verify the applicable rights and contact [1200km@gmail.com](mailto:1200km@gmail.com).

## Reproducibility boundary

These normalized exports are sufficient to recalculate the published distributions, heatmaps, and publication-level percentages. The original research environment did not pin every Python dependency, and the third-party evidence archive is not redistributed, so this package does not promise a byte-identical rebuild of the extraction pipeline. The published article records the methodology and limitations; `summary.json` records the snapshot totals.
