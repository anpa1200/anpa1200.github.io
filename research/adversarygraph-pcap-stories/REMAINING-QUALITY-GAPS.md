# Remaining PCAP investigation gaps

The report-writing stage and readable UI are implemented and locally deployed.
The independent comparison does **not** establish complete investigation accuracy.

| Gap | Measured example | Required next validation |
|---|---|---|
| Actor/victim and traffic-direction reasoning | Christmas probes described as potential beaconing | Distinguish inbound scanning, victim response and genuine callback sequences on new captures |
| Evidence selection loses attack stages | StormTheory: six reference payloads recovered but only four described | Preserve chronological attack-stage coverage before allocating summary space |
| Protocol-specific interpretation | BeguileSoft port 21 not developed into FTP upload findings | Extract FTP command/data relationships and typed transfer features without leaking credentials |
| Unsupported global negative claims | Icemaiden and Blank Clipboard focus on normal directory traffic | Limit negative conclusions to explicitly covered signals; abstain when capture selection is incomplete |
| IOC under-selection | 19/19 selected reference hashes recovered; only three in short IOC lists | Explain why each qualified payload is retained or omitted; preserve relevant file candidates despite unknown reputation |
| Extension-based policy gap | Okay-Boomer PE under `.tiff` not shortlisted | Generalise content/path mismatch policy with benign controls, rather than patching only these answer cases |
| Report-generation reliability | Four cases have no saved summary | Live-test final citation fixes after exact-provider-transfer consent; keep pre-answer outcomes immutable |
| External reputation unavailable/incomplete | VirusTotal 429; historical ThreatFox misses | Respect cooldown and validate quota/access; do not relabel unknown as clean |
| Family inference unsupported by available context | Labels absent from most native short reports | Use corroborated signatures/intelligence with provenance; do not manufacture a label to match an answer |

No answer-derived changes should be presented as blind benchmark results. A new
accuracy trial needs held-out captures, fixed code, frozen prompts, explicit
provider configuration, and the same declared input evidence for each comparison.
