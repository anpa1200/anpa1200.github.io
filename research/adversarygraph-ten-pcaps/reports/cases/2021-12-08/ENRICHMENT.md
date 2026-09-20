## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `gamaes.shop`

Type: domain; request: 7.763 seconds; completed: 2026-09-19T14:05:56.714469+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/8822145d553d29c5dfbb.json).
Platform triage score: 95/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 21 nodes, 26 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 4 engines marked malicious and 1 suspicious; 49 harmless, 35 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 2 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 4 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for gamaes.shop. Broader Censys search requires an organization-enabled account and API role. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1137 | Office Application Startup | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `newsaarctech.com`

Type: domain; request: 18.240 seconds; completed: 2026-09-19T13:57:40.593205+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/750b2f09792b80c68445.json).
Platform triage score: 83/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 23 nodes, 29 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 2 engines marked malicious and 3 suspicious; 52 harmless, 32 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 3 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for newsaarctech.com. Broader Censys search requires an organization-enabled account and API role. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1583 | Acquire Infrastructure | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1584 | Compromise Infrastructure | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1608 | Stage Capabilities | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1190 | Exploit Public-Facing Application | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1078 | Valid Accounts | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1090 | Proxy | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1505.003 | Web Shell | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1573 | Encrypted Channel | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1539 | Steal Web Session Cookie | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.001 | Web Protocols | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1567 | Exfiltration Over Web Service | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1137 | Office Application Startup | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `172.104.227.98`

Type: ip; request: 6.358 seconds; completed: 2026-09-19T13:57:48.536759+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/6e04b9c0fff0c3c39468.json).
Platform triage score: 49/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 11 nodes, 14 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 5 engines marked malicious and 0 suspicious; 51 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 50 pulse(s). |
| urlscan | ok | urlscan returned 6 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `163.172.50.82`

Type: ip; request: 8.869 seconds; completed: 2026-09-19T13:58:11.047188+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/bb24fd2f9b346f309af9.json).
Platform triage score: 75/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 13 nodes, 17 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 11 engines marked malicious and 0 suspicious; 46 harmless, 32 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 50 pulse(s). |
| urlscan | ok | urlscan returned 9 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 98 open port(s). |
| censys | ok | Censys host lookup returned 48 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1045 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1143 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1105 | Ingress Tool Transfer | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.001 | Web Protocols | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071.004 | DNS | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1491 | Defacement | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1491.001 | Internal Defacement | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1156 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1399 |  | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1053 | Scheduled Task/Job | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1080 | Taint Shared Content | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1102 | Web Service | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1210 | Exploitation of Remote Services | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1486 | Data Encrypted for Impact | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1490 | Inhibit System Recovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1566 | Phishing | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `0a85cba8c2e6aa44684f15047dcaa4c4d7f86ec356891bc8e0b8ee36bb151f7a`

Type: hash; request: 3.095 seconds; completed: 2026-09-19T13:58:25.265449+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/24b33f055a98b846c0da.json).
Platform triage score: 20/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | sSTToaEwCG5VASw |
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
| T1046 | Network Service Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055.011 | Extra Window Memory Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1189 | Drive-by Compromise | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1573 | Encrypted Channel | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `2c80de6ffeb0759cb01dd7ad50437ea8dfcb7e4b8582a0129e7e7f700b593e38`

Type: hash; request: 2.919 seconds; completed: 2026-09-19T14:06:11.868303+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/604bbbfd66ef0118feb5.json).
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
[Verified graph links](../../packet-enrichment-links/2021-12-08-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1045 | False | None returned |
| T1046 | True | Behavioral Detection Strategy for Network Service Discovery Across Platforms (x-mitre-detection-strategy--82e20b1f-300e-43cc-9259-1d506ef5d1f8) |
| T1053 | True | Cross-Platform Behavioral Detection of Scheduled Task/Job Abuse (x-mitre-detection-strategy--df11466a-27a2-4cb1-bf73-2a3a4aaee0d9) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1055.011 | True | Detection Strategy for Extra Window Memory (EWM) Injection on Windows (x-mitre-detection-strategy--1a8d87f1-48ca-4929-a5cc-2b2a03983f12) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1071.001 | True | Detection of Web Protocol-Based C2 Over HTTP, HTTPS, or WebSockets (x-mitre-detection-strategy--e6496b9b-2458-4616-9712-a7c0da7fd3bc) |
| T1071.004 | True | Behavioral Detection of DNS Tunneling and Application Layer Abuse (x-mitre-detection-strategy--c2721658-fa76-4b6f-9f84-50618de81ae0) |
| T1078 | True | Detection of Valid Account Abuse Across Platforms (x-mitre-detection-strategy--a6245075-b59f-46cf-8b76-e8d95c378a22) |
| T1080 | True | Detection of Tainted Content Written to Shared Storage (x-mitre-detection-strategy--cdfe6166-43e9-434a-a961-139edd58ca0c) |
| T1090 | True | Detection of Proxy Infrastructure Setup and Traffic Bridging (x-mitre-detection-strategy--5c44619a-da36-4bbd-9730-efceacf2409f) |
| T1095 | True | Detection of Non-Application Layer Protocols for C2 (x-mitre-detection-strategy--2cb544af-ef54-4376-9608-b399ad67d3d6) |
| T1102 | True | Suspicious Use of Web Services for C2 (x-mitre-detection-strategy--769615c5-08d5-4f51-8f3b-7ac2f1febce8) |
| T1105 | True | Detect Ingress Tool Transfers via Behavioral Chain (x-mitre-detection-strategy--67677c4c-5778-49eb-ae74-1920645b8554) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1137 | True | Detect Office Startup-Based Persistence via Macros, Forms, and Registry Hooks (x-mitre-detection-strategy--71a8576b-c9ef-4485-b461-d706fd757a67) |
| T1143 | False | None returned |
| T1156 | False | None returned |
| T1189 | True | Drive-by Compromise — Behavior-based, Multi-platform Detection Strategy (T1189) (x-mitre-detection-strategy--a070f9d2-3480-4362-99b3-8b36f5be0189) |
| T1190 | True | Exploit Public-Facing Application – multi-signal correlation (request → error → post-exploit process/egress) (x-mitre-detection-strategy--dd8477c8-2aad-4db3-b810-fe0d2f605fa8) |
| T1210 | True | Exploitation of Remote Services – multi-platform lateral movement detection (x-mitre-detection-strategy--ee73dd97-cf1a-4220-a7cf-52d864811bb4) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1399 | False | None returned |
| T1486 | True | Detection of Multi-Platform File Encryption for Impact (x-mitre-detection-strategy--d080a1b1-5ad1-45a1-8f7b-b736986c20d9) |
| T1490 | True | Behavioral Detection for T1490 - Inhibit System Recovery (x-mitre-detection-strategy--b13116ed-e9c0-4cd5-81f6-676074078477) |
| T1491 | True | Defacement via File and Web Content Modification Across Platforms (x-mitre-detection-strategy--2d5f2445-a395-4012-b378-c953f2df7353) |
| T1491.001 | True | Internal Website and System Content Defacement via UI or Messaging Modifications (x-mitre-detection-strategy--c8b4a2e4-386f-45b3-b32a-8ca4113e5592) |
| T1505.003 | True | Web Shell Detection via Server Behavior and File Execution Chains (x-mitre-detection-strategy--abb052c6-4edd-4592-9b9b-e53a55ac53b8) |
| T1539 | True | Detection of Web Session Cookie Theft via File, Memory, and Network Artifacts (x-mitre-detection-strategy--26fdbcb2-abc1-4844-8e5d-2c6039336cb7) |
| T1566 | True | Detection Strategy for Phishing across platforms. (x-mitre-detection-strategy--7ee73f2e-76b2-4f00-bcc0-7fb79d31d344) |
| T1567 | True | Detection Strategy for Exfiltration Over Web Service (x-mitre-detection-strategy--1753ab98-4530-4284-9bc3-5d4813abfb9e) |
| T1573 | True | Detection Strategy for Encrypted Channel across OS Platforms (x-mitre-detection-strategy--08861418-398c-4972-8850-5e11f2d32944) |
| T1583 | True | Detection of Acquire Infrastructure (x-mitre-detection-strategy--56752265-8647-4ce2-bc6c-c38c2e14685c) |
| T1584 | True | Detection of Compromise Infrastructure (x-mitre-detection-strategy--7f3e2c35-7394-4cc6-baef-73a830930953) |
| T1608 | True | Detection of Stage Capabilities (x-mitre-detection-strategy--5a1ada5b-5729-45d5-8b3d-f6fa7d2a3352) |