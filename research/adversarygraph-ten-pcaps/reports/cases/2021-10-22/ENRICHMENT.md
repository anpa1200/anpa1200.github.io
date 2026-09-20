## Approved external passive enrichment

Completed 6/6 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `kamuchehddhgfgf.ddns.net`

Type: domain; request: 14.252 seconds; completed: 2026-09-19T13:51:31.836485+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/0d947081bb1630d0e643.json).
Platform triage score: 22/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 1 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 3 engines marked malicious and 1 suspicious; 52 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for kamuchehddhgfgf.ddns.net. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `37.0.10.22`

Type: ip; request: 4.998 seconds; completed: 2026-09-19T14:04:33.954740+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/3a1606a9b74d89b84bfd.json).
Platform triage score: 19/100 (low signal); a heuristic priority, not calibrated probability. Graph: 3 nodes, 2 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 1 suspicious; 53 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 0 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `sobolpand.top`

Type: domain; request: 6.616 seconds; completed: 2026-09-19T14:04:55.580841+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/0e1d891ab9314a35104c.json).
Platform triage score: 68/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 15 nodes, 17 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 10 engines marked malicious and 1 suspicious; 46 harmless, 32 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 3 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for sobolpand.top. Broader Censys search requires an organization-enabled account and API role. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1566 | Phishing | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204.002 | Malicious File | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1219 | Remote Access Tools | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `23.111.114.52`

Type: ip; request: 36.362 seconds; completed: 2026-09-19T13:53:55.297156+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/f564f2283e9186760c54.json).
Platform triage score: 77/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 8 nodes, 9 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 13 engines marked malicious and 0 suspicious; 45 harmless, 31 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 50 pulse(s). |
| urlscan | ok | urlscan returned 6 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | not_found | Shodan returned 0 open port(s). Query status: not_found |
| censys | ok | Censys host lookup returned 1 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `95928b331e9942e4709b41ec8b59eb6f9e068f53ef2eeb15009feafd4ff5138d`

Type: hash; request: 5.537 seconds; completed: 2026-09-19T14:05:14.486271+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/0a32a969d9315de92091.json).
Platform triage score: 97/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 6 nodes, 6 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 60 engines marked malicious and 0 suspicious; 0 harmless, 11 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.qakbot/cerbu, qakbot, cerbu, qbot, trojan, banker, virus, face.dll |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | ok | MalwareBazaar returned 1 sample record(s). Query status: ok |
| MalwareBazaar family labels | unreviewed source assertion | Quakbot |
| otx | ok | OTX returned 4 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1083 | File and Directory Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `11f3d84aad7131fe124155c9edfceb594649e87de1ee03383f470442d6ed69a1`

Type: hash; request: 4.744 seconds; completed: 2026-09-19T14:05:33.692072+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/f87c7566e8a0d4b29f0b.json).
Platform triage score: 63/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 55 engines marked malicious and 0 suspicious; 0 harmless, 17 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | trojan.bazarloader/razy, bazarloader, razy, bazar, trojan, main.php |
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
| T1027 | Obfuscated Files or Information | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1106 | Native API | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1129 | Shared Modules | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218 | System Binary Proxy Execution | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.010 | Regsvr32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1218.011 | Rundll32 | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1497 | Virtualization/Sandbox Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518 | Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1518.001 | Security Software Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1622 | Debugger Evasion | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 6 explicitly linked, exact-type/value PCAP observables. 4 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2021-10-22-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1083 | True | Recursive Enumeration of Files and Directories Across Privilege Contexts (x-mitre-detection-strategy--33ab9d0c-5671-48e6-8465-f80560909c65) |
| T1106 | True | Behavioral Detection of Native API Invocation via Unusual DLL Loads and Direct Syscalls (x-mitre-detection-strategy--36654ec6-5019-4e79-b299-1fbf3a03e064) |
| T1129 | True | Behavior-chain, platform-aware detection strategy for T1129 Shared Modules (x-mitre-detection-strategy--928a6ce6-fca0-4d66-aba3-1121431b953e) |
| T1204.002 | True | User Execution – Malicious File via download/open → spawn chain (T1204.002) (x-mitre-detection-strategy--e2023eb5-d813-4a08-985e-e8c998672037) |
| T1218 | True | Detection of Proxy Execution via Trusted Signed Binaries Across Platforms (x-mitre-detection-strategy--ce0b969a-1411-4b6f-a6aa-c31ef6fe6727) |
| T1218.010 | True | Detection Strategy for System Binary Proxy Execution: Regsvr32 (x-mitre-detection-strategy--0a931f22-4820-48aa-8051-056da15a6183) |
| T1218.011 | True | Detection Strategy for T1218.011 Rundll32 Abuse (x-mitre-detection-strategy--a51d4d34-78fc-49b7-9071-348905dd33c2) |
| T1219 | True | Behavior-Chain Detection for Remote Access Tools (Tool-Agnostic) (x-mitre-detection-strategy--ec412019-109f-4f84-aa2f-d623f40254e0) |
| T1497 | True | Detection Strategy for T1497 Virtualization/Sandbox Evasion (x-mitre-detection-strategy--7f5dde79-7872-48dd-8718-cd2e10d7cbfc) |
| T1518 | True | Multi-Platform Software Discovery Behavior Chain (x-mitre-detection-strategy--f18dee58-43be-41e4-85a3-c6820033ac0d) |
| T1518.001 | True | Security Software Discovery Across Platforms (x-mitre-detection-strategy--e2409f82-e24c-4bb9-ad44-b20d97fb7a5a) |
| T1566 | True | Detection Strategy for Phishing across platforms. (x-mitre-detection-strategy--7ee73f2e-76b2-4f00-bcc0-7fb79d31d344) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |
| T1622 | True | Detection Strategy for Debugger Evasion (T1622) (x-mitre-detection-strategy--22f3a380-389d-44f7-a846-c6223fc06ddd) |