## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `188.166.154.118`

Type: ip; request: 15.066 seconds; completed: 2026-09-19T14:09:44.025007+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/ec1e60c256252b902627.json).
Platform triage score: 58/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 11 nodes, 12 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 6 engines marked malicious and 1 suspicious; 48 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 50 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 2 open port(s). |
| censys | ok | Censys host lookup returned 2 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1547 | Boot or Logon Autostart Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1016 | System Network Configuration Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1049 | System Network Connections Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1003 | OS Credential Dumping | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1021 | Remote Services | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1047 | Windows Management Instrumentation | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1087 | Account Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204 | User Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1482 | Domain Trust Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1486 | Data Encrypted for Impact | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1614 | System Location Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `157.245.142.66`

Type: ip; request: 10.081 seconds; completed: 2026-09-19T14:09:59.041704+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/9e7197265a82bccf386a.json).
Platform triage score: 70/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 23 nodes, 25 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 9 engines marked malicious and 1 suspicious; 45 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 19 pulse(s). |
| urlscan | ok | urlscan returned 3 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 3 open port(s). |
| censys | ok | Censys host lookup returned 4 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1140 | Deobfuscate/Decode Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1471 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1119 | Automated Collection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547 | Boot or Logon Autostart Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1016 | System Network Configuration Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1049 | System Network Connections Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1003 | OS Credential Dumping | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1021 | Remote Services | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1047 | Windows Management Instrumentation | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1087 | Account Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204 | User Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1482 | Domain Trust Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1486 | Data Encrypted for Impact | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1614 | System Location Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `oceriesfornot.top`

Type: domain; request: 11.664 seconds; completed: 2026-09-19T14:10:20.616489+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/23272dd57472a168a1bf.json).
Platform triage score: 94/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 22 nodes, 25 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 18 engines marked malicious and 0 suspicious; 40 harmless, 31 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 31 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for oceriesfornot.top. Broader Censys search requires an organization-enabled account and API role. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1140 | Deobfuscate/Decode Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1471 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1119 | Automated Collection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547 | Boot or Logon Autostart Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1016 | System Network Configuration Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1049 | System Network Connections Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1003 | OS Credential Dumping | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1021 | Remote Services | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1047 | Windows Management Instrumentation | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1087 | Account Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204 | User Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1482 | Domain Trust Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1486 | Data Encrypted for Impact | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1614 | System Location Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1193 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1056 | Input Capture | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1546 | Event Triggered Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `antnosience.com`

Type: domain; request: 9.571 seconds; completed: 2026-09-19T14:10:38.528933+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/f6d5b58389bd0d1067e2.json).
Platform triage score: 98/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 33 nodes, 38 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 11 engines marked malicious and 1 suspicious; 44 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 17 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 3 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for antnosience.com. Broader Censys search requires an organization-enabled account and API role. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1140 | Deobfuscate/Decode Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1471 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1119 | Automated Collection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1036 | Masquerading | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547 | Boot or Logon Autostart Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1016 | System Network Configuration Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1049 | System Network Connections Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1003 | OS Credential Dumping | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1018 | Remote System Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1021 | Remote Services | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1047 | Windows Management Instrumentation | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1087 | Account Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204 | User Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1482 | Domain Trust Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1486 | Data Encrypted for Impact | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1614 | System Location Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `ac64292e91738bf97842e7e5d28373a3a52bdb0aa2bc48a0df512e34d1b41501`

Type: hash; request: 3.319 seconds; completed: 2026-09-19T14:10:52.269820+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/751bdc6d2be11ed07670.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 59 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | malware.gz |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.

### `67add1166b020ae61b8f5fc96813c04c2aa589960796865572a3c7e737613dfd`

Type: hash; request: 4.969 seconds; completed: 2026-09-19T14:11:13.925266+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/1a5a431e2e44f3193d20.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 2 nodes, 1 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 60 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | oDD.der |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 6 explicitly linked, exact-type/value PCAP observables. 4 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2022-03-21-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1003 | True | Credential Dumping via Sensitive Memory and Registry Access Correlation (x-mitre-detection-strategy--8b8cfd0f-bbe2-417b-b1d2-eebf84d3f008) |
| T1016 | True | Behavioral Detection of System Network Configuration Discovery (x-mitre-detection-strategy--172cff54-a89b-4207-abc2-8d0c9601025e) |
| T1018 | True | Detection Strategy for Remote System Enumeration Behavior (x-mitre-detection-strategy--9ec6dafe-3e93-4ebb-943e-26b84136f6a9) |
| T1021 | True | Behavioral Detection Strategy for Remote Service Logins and Post-Access Activity (x-mitre-detection-strategy--d33ffd4e-6328-4b10-84c0-7ad4a241b02d) |
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1047 | True | Behavioral Detection Strategy for WMI Execution Abuse on Windows (x-mitre-detection-strategy--8374a5e5-6d9f-4896-9546-a4d998188ac5) |
| T1049 | True | Detection of System Network Connections Discovery Across Platforms (x-mitre-detection-strategy--7c45d09a-030e-4b30-b2d9-41fee3daa293) |
| T1053 | True | Cross-Platform Behavioral Detection of Scheduled Task/Job Abuse (x-mitre-detection-strategy--df11466a-27a2-4cb1-bf73-2a3a4aaee0d9) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1056 | True | Behavioral Detection of Input Capture Across Platforms (x-mitre-detection-strategy--c922d994-74bd-4847-a870-c0ae216318c9) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1083 | True | Recursive Enumeration of Files and Directories Across Privilege Contexts (x-mitre-detection-strategy--33ab9d0c-5671-48e6-8465-f80560909c65) |
| T1087 | True | Enumeration of User or Account Information Across Platforms (x-mitre-detection-strategy--fdda430c-e4f6-43ce-95d6-0f97253ff6a2) |
| T1119 | True | Automated File and API Collection Detection Across Platforms (x-mitre-detection-strategy--5e9a51b5-7e4a-4e78-a1ba-215ce937c877) |
| T1140 | True | Detect Adversary Deobfuscation or Decoding of Files and Payloads (x-mitre-detection-strategy--5b3bf2de-d91e-4272-97a8-5df6f4071e45) |
| T1193 | False | None returned |
| T1204 | True | User Execution – multi-surface behavior chain (documents/links → helper/unpacker → LOLBIN/child → egress) (x-mitre-detection-strategy--70c9f174-2e96-4086-b59c-d2358e434f8e) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1471 | False | None returned |
| T1482 | True | Detection of Domain Trust Discovery via API, Script, and CLI Enumeration (x-mitre-detection-strategy--3414f3b8-17a2-438c-8bbc-a261a04da8bc) |
| T1486 | True | Detection of Multi-Platform File Encryption for Impact (x-mitre-detection-strategy--d080a1b1-5ad1-45a1-8f7b-b736986c20d9) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1546 | True | Behavioral Detection of Event Triggered Execution Across Platforms (x-mitre-detection-strategy--c5e3823f-5ee0-43db-b6fa-b63d6587b24c) |
| T1547 | True | Boot or Logon Autostart Execution Detection Strategy (x-mitre-detection-strategy--a9796458-df5d-467f-b037-acad6c261f25) |
| T1614 | True | Detection Strategy for System Location Discovery (x-mitre-detection-strategy--9daf5067-79c3-477c-bf41-813aada4770d) |