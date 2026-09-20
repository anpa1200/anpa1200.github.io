## Approved external passive enrichment

Completed 3/3 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `79.124.78.197`

Type: ip; request: 6.462 seconds; completed: 2026-09-19T14:15:15.423320+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/c766aaa0d0a7a96c87db.json).
Platform triage score: 78/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 13 nodes, 17 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 0 suspicious; 53 harmless, 35 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1005 | Data from Local System | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1041 | Exfiltration Over C2 Channel | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053.005 | Scheduled Task | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1105 | Ingress Tool Transfer | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1106 | Native API | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204.002 | Malicious File | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1543.001 | Launch Agent | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547 | Boot or Logon Autostart Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `ed0855c1637e5f93be7d54acb2cb8872683a0e5eb670258abb1ebc41bfbf4591`

Type: hash; request: 3.578 seconds; completed: 2026-09-19T14:15:32.530883+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/4ce13ece49891ecac557.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 60 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | index.php |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.

### `736f0cb5cc23435dad920dbe447efcf102e61c8691fa8528f5f39f386537f43e`

Type: hash; request: 4.736 seconds; completed: 2026-09-19T14:15:53.691324+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/8f4155d67bffde8c0ce4.json).
Platform triage score: 21/100 (needs review); a heuristic priority, not calibrated probability. Graph: 4 nodes, 4 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | index.php%3fid=&subid=qIOuKk7U |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 2 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1033 | System Owner/User Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1064 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 3 explicitly linked, exact-type/value PCAP observables. 1 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2024-09-04-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1005 | True | Detection of Local Data Collection Prior to Exfiltration (x-mitre-detection-strategy--36bb5edf-e7b6-4d36-8ccc-1a18ddc573da) |
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1033 | True | Behavioral Detection of User Discovery via Local and Remote Enumeration (x-mitre-detection-strategy--050d236f-745a-4801-add6-50cb58248615) |
| T1041 | True | Detection Strategy for Exfiltration Over C2 Channel (x-mitre-detection-strategy--beb3a98c-f1a4-434a-81e7-29d178b14db2) |
| T1053.005 | True | Detection of Suspicious Scheduled Task Creation and Execution on Windows (x-mitre-detection-strategy--c7bdd7d7-19dc-4042-8565-5e0cf4656102) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1064 | False | None returned |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1105 | True | Detect Ingress Tool Transfers via Behavioral Chain (x-mitre-detection-strategy--67677c4c-5778-49eb-ae74-1920645b8554) |
| T1106 | True | Behavioral Detection of Native API Invocation via Unusual DLL Loads and Direct Syscalls (x-mitre-detection-strategy--36654ec6-5019-4e79-b299-1fbf3a03e064) |
| T1204.002 | True | User Execution – Malicious File via download/open → spawn chain (T1204.002) (x-mitre-detection-strategy--e2023eb5-d813-4a08-985e-e8c998672037) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1543.001 | True | Detection of Launch Agent Creation or Modification on macOS (x-mitre-detection-strategy--4dbd7441-627f-4d5a-a060-28fe6a8cbb9e) |
| T1547 | True | Boot or Logon Autostart Execution Detection Strategy (x-mitre-detection-strategy--a9796458-df5d-467f-b037-acad6c261f25) |