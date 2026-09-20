## Approved external passive enrichment

Completed 4/4 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `2.56.57.108`

Type: ip; request: 19.366 seconds; completed: 2026-09-19T14:06:48.322970+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/cb431580f8cdc2e0a834.json).
Platform triage score: 79/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 10 nodes, 14 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 2 engines marked malicious and 1 suspicious; 53 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 5 pulse(s). |
| urlscan | ok | urlscan returned 5 scan result(s). urlscan activity analysis found 3 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1102 | Web Service | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1560 | Archive Collected Data | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `16574f51785b0e2fc29c2c61477eb47bb39f714829999511dc8952b43ab17660`

Type: hash; request: 5.362 seconds; completed: 2026-09-19T14:06:54.317227+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/9321f63d9cf6c05cddde.json).
Platform triage score: 53/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 15 nodes, 15 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 45 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | is-E9LE7.tmp |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| otx | ok | OTX returned 17 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1012 | Query Registry | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.001 | Web Protocols | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1213 | Data from Information Repositories | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1102 | Web Service | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1104 | Multi-Stage Channels | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1553 | Subvert Trust Controls | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1105 | Ingress Tool Transfer | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1146 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1114 | Email Collection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.004 | DNS | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059.007 | JavaScript | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `a770ecba3b08bbabd0a567fc978e50615f8b346709f8eb3cfacf3faab24090ba`

Type: hash; request: 7.535 seconds; completed: 2026-09-19T14:07:16.488607+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/30e6a0bbd5e0996d9b3f.json).
Platform triage score: 53/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 16 nodes, 16 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 43 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | freebl3.dll |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| otx | ok | OTX returned 18 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1018 | Remote System Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1056 | Input Capture | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof); otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1140 | Deobfuscate/Decode Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1543 | Create or Modify System Process | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1543.003 | Windows Service | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1562 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1562.001 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1102 | Web Service | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1104 | Multi-Stage Channels | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1553 | Subvert Trust Controls | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1105 | Ingress Tool Transfer | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1146 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1114 | Email Collection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.004 | DNS | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059.007 | JavaScript | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.001 | Web Protocols | otx (submitted indicator; provider-reported lead, not packet execution proof) |

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

The live case contains 4 explicitly linked, exact-type/value PCAP observables. 2 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2022-01-07-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1012 | True | Detection of Registry Query for Environmental Discovery (x-mitre-detection-strategy--106e32a9-29b7-4ec7-80cf-768662706490) |
| T1018 | True | Detection Strategy for Remote System Enumeration Behavior (x-mitre-detection-strategy--9ec6dafe-3e93-4ebb-943e-26b84136f6a9) |
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1053 | True | Cross-Platform Behavioral Detection of Scheduled Task/Job Abuse (x-mitre-detection-strategy--df11466a-27a2-4cb1-bf73-2a3a4aaee0d9) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1056 | True | Behavioral Detection of Input Capture Across Platforms (x-mitre-detection-strategy--c922d994-74bd-4847-a870-c0ae216318c9) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1059.007 | True | Cross-Platform Detection of JavaScript Execution Abuse (x-mitre-detection-strategy--6dd441e4-d264-4f7f-b145-9c122955c532) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1071.001 | True | Detection of Web Protocol-Based C2 Over HTTP, HTTPS, or WebSockets (x-mitre-detection-strategy--e6496b9b-2458-4616-9712-a7c0da7fd3bc) |
| T1071.004 | True | Behavioral Detection of DNS Tunneling and Application Layer Abuse (x-mitre-detection-strategy--c2721658-fa76-4b6f-9f84-50618de81ae0) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1095 | True | Detection of Non-Application Layer Protocols for C2 (x-mitre-detection-strategy--2cb544af-ef54-4376-9608-b399ad67d3d6) |
| T1102 | True | Suspicious Use of Web Services for C2 (x-mitre-detection-strategy--769615c5-08d5-4f51-8f3b-7ac2f1febce8) |
| T1104 | True | Detect Multi-Stage Command and Control Channels (x-mitre-detection-strategy--6368178a-04c5-490b-96d5-f12dcccd0497) |
| T1105 | True | Detect Ingress Tool Transfers via Behavioral Chain (x-mitre-detection-strategy--67677c4c-5778-49eb-ae74-1920645b8554) |
| T1114 | True | Email Collection via Local Email Access and Auto-Forwarding Behavior (x-mitre-detection-strategy--2470975e-6748-42a5-9a48-74dc7b687fe9) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1140 | True | Detect Adversary Deobfuscation or Decoding of Files and Payloads (x-mitre-detection-strategy--5b3bf2de-d91e-4272-97a8-5df6f4071e45) |
| T1146 | False | None returned |
| T1213 | True | Abuse of Information Repositories for Data Collection (x-mitre-detection-strategy--48e8d8b1-0117-48bd-a32d-f4e43b665bf3) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1218.011 | True | Detection Strategy for T1218.011 Rundll32 Abuse (x-mitre-detection-strategy--a51d4d34-78fc-49b7-9071-348905dd33c2) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1518.001 | True | Security Software Discovery Across Platforms (x-mitre-detection-strategy--e2409f82-e24c-4bb9-ad44-b20d97fb7a5a) |
| T1543 | True | Detection of System Process Creation or Modification Across Platforms (x-mitre-detection-strategy--dab6c58b-2f44-4539-93e1-b03990fc1649) |
| T1543.003 | True | Detection of Windows Service Creation or Modification (x-mitre-detection-strategy--c7d19c6f-a7f8-4323-af57-c626ccb74d88) |
| T1553 | True | Detect Subversion of Trust Controls via Certificate, Registry, and Attribute Manipulation (x-mitre-detection-strategy--73cde34a-247f-4ebc-87a5-ab6a9c400f40) |
| T1560 | True | Detect Archiving and Encryption of Collected Data (T1560) (x-mitre-detection-strategy--043bc738-1f07-4d28-9f5c-1b1f81525e7c) |
| T1562 | False | None returned |
| T1562.001 | False | None returned |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |