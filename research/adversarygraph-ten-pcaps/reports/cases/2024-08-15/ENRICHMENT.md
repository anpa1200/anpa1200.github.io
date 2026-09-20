## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `104.21.55.70`

Type: ip; request: 10.272 seconds; completed: 2026-09-19T14:13:19.243413+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/5227c07b63528de74033.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 132 nodes, 137 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 0 engines marked malicious and 1 suspicious; 53 harmless, 35 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 29 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 8 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 13 open port(s). |
| censys | ok | Censys host lookup returned 13 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `172.67.170.159`

Type: ip; request: 11.296 seconds; completed: 2026-09-19T14:13:40.299122+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/bf84a190a14c96c52f1b.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 141 nodes, 144 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 0 engines marked malicious and 1 suspicious; 54 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 29 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 8 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 13 open port(s). |
| censys | ok | Censys host lookup returned 13 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `quote.checkfedexexp.com`

Type: domain; request: 5.158 seconds; completed: 2026-09-19T14:13:54.113200+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/045e25d381427d1041fb.json).
Platform triage score: 39/100 (needs review); a heuristic priority, not calibrated probability. Graph: 13 nodes, 19 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 14 engines marked malicious and 1 suspicious; 43 harmless, 31 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 7 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for quote.checkfedexexp.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `business.checkfedexexp.com`

Type: domain; request: 5.152 seconds; completed: 2026-09-19T14:14:14.114140+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/4afcc24b48252bd2d7c8.json).
Platform triage score: 53/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 8 nodes, 12 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 13 engines marked malicious and 1 suspicious; 43 harmless, 32 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 2 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for business.checkfedexexp.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `798563fcf7600f7ef1a35996291a9dfb5f9902733404dd499e2e736ea1dc6fc5`

Type: hash; request: 4.828 seconds; completed: 2026-09-19T14:14:33.782587+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/5d23a00aca8f1f7b4896.json).
Platform triage score: 72/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 3 nodes, 3 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 27 engines marked malicious and 0 suspicious; 0 harmless, 37 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.abdownloader/abkz, abdownloader, abkz, pwgkxjxc10z1, trojan, downloader, managements%3f16553a25e45250a41fd5&endeds=MIGpq&JStx=59bf050d37df88a9-ade43358-eaa1220b-0571422b-0f33e6aa150e86bafd0ed4&Ld=9d7502d88d752a27b1d00587309184b5a215 |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| MalwareBazaar family labels | unreviewed source assertion | WarmCookie |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1014 | Rootkit | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1064 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1496 | Resource Hijacking | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1542 | Pre-OS Boot | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1542.003 | Bootkit | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1564 | Hide Artifacts | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1564.001 | Hidden Files and Directories | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `b7aec5f73d2a6bbd8cd920edb4760e2edadc98c3a45bf4fa994d47ca9cbd02f6`

Type: hash; request: 6.140 seconds; completed: 2026-09-19T14:14:55.095856+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/299bfd6efad2929b4756.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 12 nodes, 12 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 58 engines marked malicious and 0 suspicious; 0 harmless, 12 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.badspace/agentb, badspace, agentb, warmcookie, trojan, pua, lab17a |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| MalwareBazaar family labels | unreviewed source assertion | WarmCookie |
| otx | ok | OTX returned 9 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1010 | Application Window Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1012 | Query Registry | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1033 | System Owner/User Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1050 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1060 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1063 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1070 | Indicator Removal | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1070.004 | File Deletion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1087 | Account Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1105 | Ingress Tool Transfer | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1112 | Modify Registry | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.010 | Regsvr32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1113 | Screen Capture | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059.001 | PowerShell | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1566 | Phishing | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059.003 | Windows Command Shell | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204.001 | Malicious Link | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1553 | Subvert Trust Controls | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 6 explicitly linked, exact-type/value PCAP observables. 4 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2024-08-15-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1010 | True | Detection of Application Window Enumeration via API or Scripting (x-mitre-detection-strategy--d2daf569-4fc9-46a3-97b7-4d3d76c04a64) |
| T1012 | True | Detection of Registry Query for Environmental Discovery (x-mitre-detection-strategy--106e32a9-29b7-4ec7-80cf-768662706490) |
| T1014 | True | Detection of Kernel/User-Level Rootkit Behavior Across Platforms (x-mitre-detection-strategy--00a4e92b-8164-4342-a71c-013ecc777ad0) |
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1033 | True | Behavioral Detection of User Discovery via Local and Remote Enumeration (x-mitre-detection-strategy--050d236f-745a-4801-add6-50cb58248615) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1050 | False | None returned |
| T1053 | True | Cross-Platform Behavioral Detection of Scheduled Task/Job Abuse (x-mitre-detection-strategy--df11466a-27a2-4cb1-bf73-2a3a4aaee0d9) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1059.001 | True | Abuse of PowerShell for Arbitrary Execution (x-mitre-detection-strategy--72b209e2-8c65-4217-8532-fabd0cb54ae5) |
| T1059.003 | True | Behavioral Detection of Windows Command Shell Execution (x-mitre-detection-strategy--1806ad13-6fa8-4cb0-9d91-c8a989a1d9fe) |
| T1060 | False | None returned |
| T1063 | False | None returned |
| T1064 | False | None returned |
| T1070 | True | Behavioral Detection of Indicator Removal Across Platforms (x-mitre-detection-strategy--7225a3bd-f235-4c13-a236-3c6b9a3d445c) |
| T1070.004 | True | Behavioral Detection of Malicious File Deletion (x-mitre-detection-strategy--b96fce76-6b29-4e1c-b8b1-741f45a89fdc) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1083 | True | Recursive Enumeration of Files and Directories Across Privilege Contexts (x-mitre-detection-strategy--33ab9d0c-5671-48e6-8465-f80560909c65) |
| T1087 | True | Enumeration of User or Account Information Across Platforms (x-mitre-detection-strategy--fdda430c-e4f6-43ce-95d6-0f97253ff6a2) |
| T1095 | True | Detection of Non-Application Layer Protocols for C2 (x-mitre-detection-strategy--2cb544af-ef54-4376-9608-b399ad67d3d6) |
| T1105 | True | Detect Ingress Tool Transfers via Behavioral Chain (x-mitre-detection-strategy--67677c4c-5778-49eb-ae74-1920645b8554) |
| T1112 | True | Behavior-Based Registry Modification Detection on Windows (x-mitre-detection-strategy--cf6a38ec-4c16-4c7f-8730-6e04f6dd6e67) |
| T1113 | True | Detect Screen Capture via Commands and API Calls (x-mitre-detection-strategy--a9de0990-69e9-4b1a-9754-1c7fb4102ac9) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1204.001 | True | User Execution – Malicious Link (click → suspicious egress → download/write → follow-on activity) (x-mitre-detection-strategy--b977bf63-8fe2-4538-b4f2-0098fe26d67b) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1218.010 | True | Detection Strategy for System Binary Proxy Execution: Regsvr32 (x-mitre-detection-strategy--0a931f22-4820-48aa-8051-056da15a6183) |
| T1218.011 | True | Detection Strategy for T1218.011 Rundll32 Abuse (x-mitre-detection-strategy--a51d4d34-78fc-49b7-9071-348905dd33c2) |
| T1496 | True | Resource Hijacking Detection Strategy (x-mitre-detection-strategy--440ddaf2-4e80-4699-90d7-0bdccdfeece6) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1518.001 | True | Security Software Discovery Across Platforms (x-mitre-detection-strategy--e2409f82-e24c-4bb9-ad44-b20d97fb7a5a) |
| T1542 | True | Detection Strategy for T1542 Pre-OS Boot (x-mitre-detection-strategy--abf6c96c-09f3-4bea-a5b7-1177f99881bc) |
| T1542.003 | True | Detection Strategy for File Creation or Modification of Boot Files (x-mitre-detection-strategy--74252ca3-585e-466f-8020-ed77ebda3369) |
| T1553 | True | Detect Subversion of Trust Controls via Certificate, Registry, and Attribute Manipulation (x-mitre-detection-strategy--73cde34a-247f-4ebc-87a5-ab6a9c400f40) |
| T1564 | True | Detection Strategy for Hidden Artifacts Across Platforms (x-mitre-detection-strategy--bd2348f8-acef-4310-bd03-cf7b866d2592) |
| T1564.001 | True | Detection Strategy for Hidden Files and Directories (x-mitre-detection-strategy--3f59957a-2e55-4378-bbe7-090fb1e4f067) |
| T1566 | True | Detection Strategy for Phishing across platforms. (x-mitre-detection-strategy--7ee73f2e-76b2-4f00-bcc0-7fb79d31d344) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |