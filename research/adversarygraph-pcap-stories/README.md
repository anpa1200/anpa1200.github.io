# Twenty malware PCAPs: reports and evidence

Published by Andrey Pautov on 23 September 2026. Tests recorded 22 September 2026.

[Read the article](https://1200km.com/articles/read/2026/adversarygraph-pcap-investigation-stories/) · [20 concise reviewed explanations](20-REVIEWED-SHORT-REPORTS.html) · [Download all public evidence](adversarygraph-pcap-stories-public.zip) · [Bundle SHA-256](DOWNLOAD.sha256)

The native result is **12 partial stories, four missed or misinterpreted scenarios, and four withheld reports**. Sixteen summaries were saved; four screenshots explicitly show no validated saved summary. This is not 80% detection accuracy. The official references sometimes include IDS alerts, emails and host artifacts that were absent from the PCAP-only model input.

## What can be inspected

- [Case-by-case official-answer comparison](answer-comparisons.json) and [CSV](answer-comparisons.csv).
- [Operational measurements](operational-metrics.json), [case-level time/model/word counts](operational-cases.csv), [usage accounting](usage-accounting.json), and [runtime/source provenance](runtime-provenance.json).
- [Capture acquisition URLs and hashes](capture-acquisition.json), [reference-answer discrepancies checked against packets](reference-discrepancies.json), and [pre-answer evaluation protocol](EVALUATION-PROTOCOL.html).
- [Software implementation/test record](IMPLEMENTATION-VERIFICATION.html), [remaining accuracy gaps](REMAINING-QUALITY-GAPS.html), [public transformation provenance](PUBLIC-PROVENANCE.json) and [public payload checksums](SHA256SUMS).

The full article embeds every case screenshot beside the unchanged native narrative (or explicit withheld status), the reference-assisted explanation and links to the detailed record. Screenshots are not composites or generated mock-ups. Each has its analysis ID, original image hash and individual visual-inspection record. The cover supplied by the author is a conceptual illustration, not investigation evidence.

## Public evidence boundaries

This is an explicitly labelled public derivative of the preserved experiment. Original local files were not overwritten. Native screenshot PNGs and the supplied cover are byte-identical; text and JSON remove workstation paths and loopback URLs. Lab hostnames, accounts and historical indicators from the public exercises remain evidence. Session UUIDs are correlation identifiers, not credentials or working public sessions.

Complete packet extraction records, short-report citations, qualification reasons, provider statuses, test logs and exact selected payload hashes are retained. Provider evidence is bounded to concise assertions and hash/signature metadata; unrelated prior-session details are replaced by overlap counts. Proprietary bulk responses, duplicated private audit payloads, implementation source snapshots, PCAP binaries, recovered malware, credentials and publisher answer PDFs are not redistributed. Follow the original publisher links for their materials. Current reputation is not incident-time reputation; not-found or rate-limited does not mean benign.

The recorded original snapshot and pre-answer hashes describe the retained source files, not the formatted public derivatives. [PUBLIC-PROVENANCE.json](PUBLIC-PROVENANCE.json) maps original to public file hashes. Those original hashes cannot reconstruct or independently validate omitted data. Use SHA256SUMS for public payload integrity; rendered HTML is excluded because the site release process adds shared navigation and metadata. DOWNLOAD.sha256 covers the downloadable archive.

## Verify the public download

```bash
unzip adversarygraph-pcap-stories-public.zip -d pcap-study
cd pcap-study
sha256sum -c SHA256SUMS
```

Read the supplied scripts and records as evidence, not instructions to run recovered content. Do not visit captured malicious URLs or execute payloads. These historical indicators are not a current blocklist. No human-equivalent accuracy, calibrated confidence or measured analyst speedup is claimed.

## Related research

[Six-case AI-agent experiment](https://1200km.com/articles/read/2026/2026-09-18-ai-agent-vs-human-with-wireshark-six-malware-pcaps-put-to-the-test-63ffeaed97de/) · [Ten-case deterministic experiment](https://1200km.com/articles/read/2026/2026-09-20-adversarygraph-vs-ten-malware-pcaps-evidence-7dfd6a0917cf/) · [AdversaryGraph](https://1200km.com/adversarygraph/) · [Malware analysis](https://1200km.com/cyber-knowledge/malware-analysis.html)
