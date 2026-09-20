# Ten malware PCAPs: public evidence supplement

Published 20 September 2026 by Andrey Pautov. Tests were recorded on 19 September 2026.

[Read the full article](https://1200km.com/articles/read/2026/2026-09-20-adversarygraph-vs-ten-malware-pcaps-evidence-7dfd6a0917cf/) · [Ten full case reports](REPORTS.md) · [20 original screenshots](SCREENSHOTS.md) · [Download the public evidence bundle](adversarygraph-ten-pcaps-public.tar.gz) · [Bundle SHA-256](DOWNLOAD.sha256)

This supplement covers only the ten additional cases: 263,116 packets, 52/52 selected identity facts, 87/88 selected indicators, 52 unique enrichment lookups and 53 case-indicator joins. These are extraction and integration measurements, not detection accuracy or proof of human replacement.

## Start with the evidence

- [Machine-readable measurements](evidence/summary.json), [evaluation rubric and results](evidence/live-evaluation.json), and [first-pass comparison](evidence/first-pass-comparison.json).
- [Publisher answer discrepancies and packet filters](evidence/publisher-conflicts.json), [capture acquisition and checksums](evidence/capture-acquisition.json).
- [Enrichment outcomes](evidence/enrichment-metrics.json), [database and correlation audit](evidence/enrichment-database-audit.json), [typed packet-to-provider joins](evidence/packet-enrichment-links.json).
- [Screenshot verification](evidence/screenshot-verification.json), [public transformation manifest](evidence/source-provenance.json), [all public file checksums](SHA256SUMS).

## Publication boundaries

The original local experiment is unchanged. This is an explicitly labeled public derivative, not a byte-identical release of the complete private evidence package.

Workstation paths, local-only HTTP links, access-key identifiers and credential-like URL parameters are removed from text/JSON. Session UUIDs remain correlation identifiers, not working public sessions or credentials. Hostnames, accounts, private LAN addresses and historical indicators from the public training captures remain as evidence. No raw capture, executable, exported payload, credential, database backup or publisher answer archive is included. Historical indicators are not a current blocklist; do not browse suspicious URLs.

Twenty article screenshots and ten native draft PDFs are byte-identical to the verified originals. Screenshots show actual saved results, including unfavorable outcomes; surrounding UI history is not part of the ten-case totals. The public reports retain the complete authored case analysis, extraction details and limitations. Duplicate database payloads are omitted while their audit outcomes and the native API payloads remain available.

The 52 provider JSON files contain derived platform summaries: query identity, source status, reported counts, heuristic score, ATT&CK leads and original response hashes. Bulk proprietary responses, unrelated infrastructure pivots and duplicated AI-input context are not redistributed. Public audit records support inspection of the author's checks; they do not let a reader independently replay every private provider-response comparison. A source hash is a provenance anchor, not proof of correctness or a recoverable copy of omitted data.

Native result checksums refer to the original semantic result, not to the formatted/redacted public JSON file. Use SHA256SUMS for public file integrity. Read transformation entries before comparing original and public hashes. Provider results are time-bound, techniques remain leads, and no actor attribution or automatic intelligence promotion was established.

## Verify without contacting suspicious infrastructure

```bash
tar -xzf adversarygraph-ten-pcaps-public.tar.gz
cd adversarygraph-ten-pcaps-public
sha256sum -c SHA256SUMS
jq '.totals' evidence/summary.json
jq '.lookups | all(.stored_exact and .ai_disabled)' evidence/enrichment-database-audit.json
```

Checksums establish integrity against this release, not independent analytical correctness. SHA256SUMS covers evidence payloads, images, PDFs and Markdown; rendered HTML is excluded because the website adds deployment navigation and metadata. The separate bundle hash covers the entire downloadable archive. For packet-level reproduction, obtain the exact captures from the linked publisher, match acquisition hashes, and use the documented offline Wireshark/TShark filters in a patched analysis environment. Do not execute extracted content. Raw provider data and a timed human comparison are not supplied.

## Related research

[Original six-case AI-agent experiment](https://1200km.com/articles/read/2026/2026-09-18-ai-agent-vs-human-with-wireshark-six-malware-pcaps-put-to-the-test-63ffeaed97de/) · [AdversaryGraph](https://1200km.com/adversarygraph/) · [Malware analysis](https://1200km.com/cyber-knowledge/malware-analysis.html) · [DFIR](https://1200km.com/cyber-knowledge/dfir.html)
