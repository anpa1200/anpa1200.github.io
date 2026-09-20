## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `194.62.42.206`

Type: ip; request: 8.845 seconds; completed: 2026-09-19T13:49:26.451953+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/04b10e10b1759b2fa0dd.json).
Platform triage score: 15/100 (low signal); a heuristic priority, not calibrated probability. Graph: 16 nodes, 20 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 1 suspicious; 53 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 2 pulse(s). |
| urlscan | ok | urlscan returned 7 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `simpsonsavingss.com`

Type: domain; request: 4.236 seconds; completed: 2026-09-19T13:49:41.831883+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/dbfb5d7db47a984d3bea.json).
Platform triage score: 38/100 (needs review); a heuristic priority, not calibrated probability. Graph: 9 nodes, 12 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 9 engines marked malicious and 0 suspicious; 46 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for simpsonsavingss.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `167.172.37.9`

Type: ip; request: 5.964 seconds; completed: 2026-09-19T13:50:03.549432+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/4be1253e1f36cc61e4c0.json).
Platform triage score: 47/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 9 nodes, 10 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 4 engines marked malicious and 1 suspicious; 51 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 1 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 3 open port(s). |
| censys | ok | Censys host lookup returned 4 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `eed363fc4af7a9070d69340592dcab7c78db4f90710357de29e3b624aa957cf8`

Type: hash; request: 4.655 seconds; completed: 2026-09-19T13:50:22.243466+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/e3c52520cada5c2072a0.json).
Platform triage score: 80/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 4 nodes, 4 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 59 engines marked malicious and 0 suspicious; 0 harmless, 12 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.kryplod/quantum, kryplod, quantum, bazar, trojan, ransomware, date1%3fBNLv65=pAAS |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| otx | ok | OTX returned 2 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1018 | Remote System Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.010 | Regsvr32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1573 | Encrypted Channel | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `1d48d9166408d8b8bf39f9557e4f8a57133c353567c55966ec2831a7bc230431`

Type: hash; request: 5.143 seconds; completed: 2026-09-19T13:50:42.724713+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/eea445d93b325993f3d8.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 69 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | am_delta_patch_1.349.439.0_dcf977cccce1b58289d270f71f8151b3acc1566b(3).exe |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.

### `au.download.windowsupdate.com`

Type: domain; request: 8.634 seconds; completed: 2026-09-19T13:51:06.220131+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/b5fc5c7e3c7ff1a09943.json).
Platform triage score: 34/100 (needs review); a heuristic priority, not calibrated probability. Graph: 32 nodes, 36 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 60 harmless, 29 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for au.download.windowsupdate.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

Shared-service caution: this is a broadly used legitimate service. A feed/search hit may concern a specific hosted path or unrelated customer; do not classify or block the whole service based on this lookup.


### Packet-to-provider evidence links

The live case contains 6 explicitly linked, exact-type/value PCAP observables. 4 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2021-09-10-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1018 | True | Detection Strategy for Remote System Enumeration Behavior (x-mitre-detection-strategy--9ec6dafe-3e93-4ebb-943e-26b84136f6a9) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1083 | True | Recursive Enumeration of Files and Directories Across Privilege Contexts (x-mitre-detection-strategy--33ab9d0c-5671-48e6-8465-f80560909c65) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1218.010 | True | Detection Strategy for System Binary Proxy Execution: Regsvr32 (x-mitre-detection-strategy--0a931f22-4820-48aa-8051-056da15a6183) |
| T1218.011 | True | Detection Strategy for T1218.011 Rundll32 Abuse (x-mitre-detection-strategy--a51d4d34-78fc-49b7-9071-348905dd33c2) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1518.001 | True | Security Software Discovery Across Platforms (x-mitre-detection-strategy--e2409f82-e24c-4bb9-ad44-b20d97fb7a5a) |
| T1573 | True | Detection Strategy for Encrypted Channel across OS Platforms (x-mitre-detection-strategy--08861418-398c-4972-8850-5e11f2d32944) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |