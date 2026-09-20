## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `156.96.154.210`

Type: ip; request: 6.574 seconds; completed: 2026-09-19T14:07:35.528619+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/91c6b075ecb7a96913f1.json).
Platform triage score: 22/100 (needs review); a heuristic priority, not calibrated probability. Graph: 2 nodes, 1 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 3 engines marked malicious and 1 suspicious; 51 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `www.katchybugonsale.com`

Type: domain; request: 2.250 seconds; completed: 2026-09-19T14:07:51.198863+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/fafbec913ed453cd2655.json).
Platform triage score: 6/100 (low signal); a heuristic priority, not calibrated probability. Graph: 2 nodes, 2 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 0 suspicious; 52 harmless, 36 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for www.katchybugonsale.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `www.privilegetroissecurity.com`

Type: domain; request: 6.268 seconds; completed: 2026-09-19T14:08:15.218784+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/9271191e02d437b1e9c7.json).
Platform triage score: 21/100 (needs review); a heuristic priority, not calibrated probability. Graph: 15 nodes, 18 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 56 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 3 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for www.privilegetroissecurity.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `135.148.121.246`

Type: ip; request: 11.964 seconds; completed: 2026-09-19T14:08:40.923184+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/6a6dec0298e05021dd13.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 29 nodes, 34 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 2 engines marked malicious and 1 suspicious; 53 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 50 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 3 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 3 open port(s). |
| censys | ok | Censys host lookup returned 3 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1036 | Masquerading | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1090 | Proxy | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204 | User Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1216 | System Script Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1566 | Phishing | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `14b57211308ac8ad2a63c965783d9ba1c2d1930d0cafd884374d143a481f9bf3`

Type: hash; request: 7.589 seconds; completed: 2026-09-19T14:08:56.555583+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/48f30d932b1380a46f0c.json).
Platform triage score: 89/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 6 nodes, 6 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 57 engines marked malicious and 0 suspicious; 0 harmless, 11 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.emotet/cryp, emotet, cryp, yxcbxz, trojan, banker, spyware, MJAntiVirus.EXE |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| MalwareBazaar family labels | unreviewed source assertion | Heodo |
| otx | ok | OTX returned 3 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1012 | Query Registry | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1016 | System Network Configuration Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027.005 | Indicator Removal from Tools | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1056 | Input Capture | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1056.001 | Keylogging | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1070 | Indicator Removal | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1070.004 | File Deletion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1112 | Modify Registry | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1134 | Access Token Manipulation | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.010 | Regsvr32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1529 | System Shutdown/Reboot | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547 | Boot or Logon Autostart Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547.001 | Registry Run Keys / Startup Folder | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1564 | Hide Artifacts | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1564.001 | Hidden Files and Directories | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1564.003 | Hidden Window | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1571 | Non-Standard Port | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1573 | Encrypted Channel | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1614 | System Location Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `abca26cf70ef57ef879c81a3b45d9fc5ce4437f54bda65d0170f3f5bae8a54f5`

Type: hash; request: 2.882 seconds; completed: 2026-09-19T14:09:11.835314+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/824c08b73476800f3d1b.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | not_found | virustotal has no record for this lookup. Query status: not_found |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 6 explicitly linked, exact-type/value PCAP observables. 4 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2022-02-23-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1012 | True | Detection of Registry Query for Environmental Discovery (x-mitre-detection-strategy--106e32a9-29b7-4ec7-80cf-768662706490) |
| T1016 | True | Behavioral Detection of System Network Configuration Discovery (x-mitre-detection-strategy--172cff54-a89b-4207-abc2-8d0c9601025e) |
| T1018 | True | Detection Strategy for Remote System Enumeration Behavior (x-mitre-detection-strategy--9ec6dafe-3e93-4ebb-943e-26b84136f6a9) |
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1027.005 | True | Detection Strategy for Indicator Removal from Tools - Post-AV Evasion Modification (x-mitre-detection-strategy--6ab338c4-9ed3-4f63-9462-b13cea5a68b0) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1056 | True | Behavioral Detection of Input Capture Across Platforms (x-mitre-detection-strategy--c922d994-74bd-4847-a870-c0ae216318c9) |
| T1056.001 | True | Behavioral Detection of Keylogging Activity Across Platforms (x-mitre-detection-strategy--fe0d7d82-1575-4685-9a4f-4bf83e0227a0) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1070 | True | Behavioral Detection of Indicator Removal Across Platforms (x-mitre-detection-strategy--7225a3bd-f235-4c13-a236-3c6b9a3d445c) |
| T1070.004 | True | Behavioral Detection of Malicious File Deletion (x-mitre-detection-strategy--b96fce76-6b29-4e1c-b8b1-741f45a89fdc) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1083 | True | Recursive Enumeration of Files and Directories Across Privilege Contexts (x-mitre-detection-strategy--33ab9d0c-5671-48e6-8465-f80560909c65) |
| T1090 | True | Detection of Proxy Infrastructure Setup and Traffic Bridging (x-mitre-detection-strategy--5c44619a-da36-4bbd-9730-efceacf2409f) |
| T1112 | True | Behavior-Based Registry Modification Detection on Windows (x-mitre-detection-strategy--cf6a38ec-4c16-4c7f-8730-6e04f6dd6e67) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1134 | True | Behavior-chain detection for T1134 Access Token Manipulation on Windows (x-mitre-detection-strategy--774bbba8-45c2-403d-a445-3a64b3679faf) |
| T1204 | True | User Execution – multi-surface behavior chain (documents/links → helper/unpacker → LOLBIN/child → egress) (x-mitre-detection-strategy--70c9f174-2e96-4086-b59c-d2358e434f8e) |
| T1216 | True | Detection of Script-Based Proxy Execution via Signed Microsoft Utilities (x-mitre-detection-strategy--8ac2b0d0-a589-4c72-9287-a7d9e47065a9) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1218.010 | True | Detection Strategy for System Binary Proxy Execution: Regsvr32 (x-mitre-detection-strategy--0a931f22-4820-48aa-8051-056da15a6183) |
| T1218.011 | True | Detection Strategy for T1218.011 Rundll32 Abuse (x-mitre-detection-strategy--a51d4d34-78fc-49b7-9071-348905dd33c2) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1518.001 | True | Security Software Discovery Across Platforms (x-mitre-detection-strategy--e2409f82-e24c-4bb9-ad44-b20d97fb7a5a) |
| T1529 | True | Multi-Platform Shutdown or Reboot Detection via Execution and Host Status Events (x-mitre-detection-strategy--2a464ecb-46ef-41f0-8ab6-a97a99ad0559) |
| T1547 | True | Boot or Logon Autostart Execution Detection Strategy (x-mitre-detection-strategy--a9796458-df5d-467f-b037-acad6c261f25) |
| T1547.001 | True | Detect Registry and Startup Folder Persistence (Windows) (x-mitre-detection-strategy--8febbfe8-91ae-4625-8fc7-656639b90a11) |
| T1564 | True | Detection Strategy for Hidden Artifacts Across Platforms (x-mitre-detection-strategy--bd2348f8-acef-4310-bd03-cf7b866d2592) |
| T1564.001 | True | Detection Strategy for Hidden Files and Directories (x-mitre-detection-strategy--3f59957a-2e55-4378-bbe7-090fb1e4f067) |
| T1564.003 | True | Detection Strategy for Hidden Windows (x-mitre-detection-strategy--1167a6c8-d735-4d5d-81f5-d81c6eafe239) |
| T1566 | True | Detection Strategy for Phishing across platforms. (x-mitre-detection-strategy--7ee73f2e-76b2-4f00-bcc0-7fb79d31d344) |
| T1571 | True | Detection Strategy for Non-Standard Ports (x-mitre-detection-strategy--cc8324a7-03d0-47d1-8e2b-3caec44fc129) |
| T1573 | True | Detection Strategy for Encrypted Channel across OS Platforms (x-mitre-detection-strategy--08861418-398c-4972-8850-5e11f2d32944) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |
| T1614 | True | Detection Strategy for System Location Discovery (x-mitre-detection-strategy--9daf5067-79c3-477c-bf41-813aada4770d) |