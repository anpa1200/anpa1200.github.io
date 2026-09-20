## Approved external passive enrichment

Completed 5/5 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `194.180.191.64`

Type: ip; request: 6.078 seconds; completed: 2026-09-19T14:16:15.053804+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/78dc073b6a55699b75cd.json).
Platform triage score: 70/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 14 nodes, 17 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 3 engines marked malicious and 1 suspicious; 52 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 7 pulse(s). |
| urlscan | ok | urlscan returned 2 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 1 open port(s). |
| censys | ok | Censys host lookup returned 5 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1059.001 | PowerShell | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1074.001 | Local Data Staging | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547.001 | Registry Run Keys / Startup Folder | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204.002 | Malicious File | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1041 | Exfiltration Over C2 Channel | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `modandcrackedapk.com`

Type: domain; request: 7.576 seconds; completed: 2026-09-19T14:16:36.542993+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/e8b6be26b88f5b7f799d.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 21 nodes, 24 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 7 engines marked malicious and 1 suspicious; 48 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 4 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 7 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for modandcrackedapk.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `classicgrand.com`

Type: domain; request: 6.760 seconds; completed: 2026-09-19T14:16:55.719775+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/17434908a24430d728e7.json).
Platform triage score: 67/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 16 nodes, 20 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 0 suspicious; 54 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 6 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for classicgrand.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `cd6f72bd96cbbad446325f8c2d087283f051ccaf77523dc436eec2d98be29bf7`

Type: hash; request: 3.972 seconds; completed: 2026-09-19T14:17:12.930273+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/d74fc53a2c47a37933bd.json).
Platform triage score: 20/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | MFMwUTBPME0wSzAJBgUrDgMCGgUABBRpD%2BQVZ%2B1vf7U0RGQGBm8JZwdxcgQUdKR2KRcYVIUxN75n5gZYwLzFBXICEgRSsdGCXQJklJZNbHi669GH4A%3D%3D.java |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `839e234a3a10b60d559ee5679d2019ad4e58d9cd66e6cfd971207c3c6ef8ea4d`

Type: hash; request: 4.625 seconds; completed: 2026-09-19T14:17:33.579014+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/7fd5e33afe3cbed87b40.json).
Platform triage score: 20/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | fakeurl2.exe |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055.011 | Extra Window Memory Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 5 explicitly linked, exact-type/value PCAP observables. 3 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2024-11-26-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1041 | True | Detection Strategy for Exfiltration Over C2 Channel (x-mitre-detection-strategy--beb3a98c-f1a4-434a-81e7-29d178b14db2) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1055.011 | True | Detection Strategy for Extra Window Memory (EWM) Injection on Windows (x-mitre-detection-strategy--1a8d87f1-48ca-4929-a5cc-2b2a03983f12) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1059.001 | True | Abuse of PowerShell for Arbitrary Execution (x-mitre-detection-strategy--72b209e2-8c65-4217-8532-fabd0cb54ae5) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1074.001 | True | Detection of Local Data Staging Prior to Exfiltration (x-mitre-detection-strategy--e91165c5-e850-465e-9042-6ba82478b522) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1095 | True | Detection of Non-Application Layer Protocols for C2 (x-mitre-detection-strategy--2cb544af-ef54-4376-9608-b399ad67d3d6) |
| T1204.002 | True | User Execution – Malicious File via download/open → spawn chain (T1204.002) (x-mitre-detection-strategy--e2023eb5-d813-4a08-985e-e8c998672037) |
| T1547.001 | True | Detect Registry and Startup Folder Persistence (Windows) (x-mitre-detection-strategy--8febbfe8-91ae-4625-8fc7-656639b90a11) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |