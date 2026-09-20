## Approved external passive enrichment

Completed 5/5 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `141.98.10.79`

Type: ip; request: 5.371 seconds; completed: 2026-09-19T14:11:34.331731+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/e683b009858374f0b009.json).
Platform triage score: 46/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 11 nodes, 11 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 6 engines marked malicious and 1 suspicious; 49 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 5 pulse(s). |
| urlscan | ok | urlscan returned 2 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 66/100. |
| shodan | ok | Shodan returned 2 open port(s). |
| censys | ok | Censys host lookup returned 3 service(s). |

No actor lead returned. This does not establish absence of an actor.

### `github.com`

Type: domain; request: 9.468 seconds; completed: 2026-09-19T14:11:58.429037+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/3aeb002460381c6f258e.json).
Platform triage score: 73/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 75 nodes, 76 edges; local deeper-tier matches: 2/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 59 harmless, 30 undetected. |
| threatfox | ok | ThreatFox returned 17 record(s). Query status: ok |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 6 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for github.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

Shared-service caution: this is a broadly used legitimate service. A feed/search hit may concern a specific hosted path or unrelated customer; do not classify or block the whole service based on this lookup.

### `objects.githubusercontent.com`

Type: domain; request: 8.155 seconds; completed: 2026-09-19T14:12:17.114432+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/4c04af505bfda2f0c687.json).
Platform triage score: 32/100 (needs review); a heuristic priority, not calibrated probability. Graph: 24 nodes, 32 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 55 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 2 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for objects.githubusercontent.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

Shared-service caution: this is a broadly used legitimate service. A feed/search hit may concern a specific hosted path or unrelated customer; do not classify or block the whole service based on this lookup.

### `47729774d301b648e888dee3b5e215d63adabb069700e1d81671fcbdfb80e4bb`

Type: hash; request: 3.388 seconds; completed: 2026-09-19T14:12:32.347099+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/eae9a0dbe12874362437.json).
Platform triage score: 0/100 (low signal); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 62 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | json |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 0 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.

### `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`

Type: hash; request: 7.910 seconds; completed: 2026-09-19T14:12:56.863653+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/4de09a89d2184127f0ed.json).
Platform triage score: 6/100 (low signal); a heuristic priority, not calibrated probability. Graph: 19 nodes, 21 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | connecttest.txt |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | not_found | MalwareBazaar returned 0 sample record(s). Query status: hash_not_found |
| otx | ok | OTX returned 1 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found no obvious suspicious pattern. |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | skipped | Censys host and search pivots support IP, domain, and URL inputs. |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 5 explicitly linked, exact-type/value PCAP observables. 3 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2024-07-30-updated.json).
