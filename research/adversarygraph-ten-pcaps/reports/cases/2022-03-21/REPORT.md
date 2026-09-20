# 2022-03-21: AdversaryGraph live-instance PCAP report

Actual deployment: `[local-workspace]`, HTTP `[local-instance]`. This is a regression validation, not an independent blind trial. No malware was executed and no malicious endpoint was contacted.

## Executive assessment

Decoded 16296 packets across 63 IP endpoints and 837 transport flows. Observed 640 DNS events, 38 HTTP requests, 313 TLS ClientHello events, and 2 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 0 medium, and 8 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

These findings identify observations and review priorities, not a proven malware family, actor, or causal infection chain. Source-frame evidence takes precedence over exercise answer typos.

## Capture and execution evidence

Capture window: 2022-03-21T20:58:11.116658+00:00 to 2022-03-22T03:17:17.589407+00:00 UTC.
Capture SHA-256: `d9b67e18bca13cf6135874fd81d167403c7cb6b8a422679948db914e9959b90d`.
Analysis ID: `6df36b51-4b44-4660-b534-2fa89705e807`; review session: `2571013a-e926-41d7-b13c-b180a0720a96`.
First real HTTP upload/analysis: **7.666 seconds**. Fresh uncached decoder repeat: **10.796 seconds**. Prior isolated upload: 8.421 seconds.
The fresh repeat ran while builds/tests were active; these timings are not a controlled performance comparison. Native packet analysis used **zero LLM calls and zero LLM tokens**. Coding-agent token usage was not instrumented.

Packet result equals prior isolated result: True; fresh repeat exact: True; retained capture checksum valid: True; API retrieval identical: True; idempotent upload: True.

## Internal host identities

| Address | MAC addresses | Frame-backed identities |
|---|---|---|
| 10.0.19.1 | 2c:54:2d:2f:13:5c |  |
| 10.0.19.14 | 00:60:52:b7:33:0f | account: DESKTOP-5QS3D5D$; account: patrick.zimmerman; full-name: Patrick Zimmerman; hostname: BURNINCANDLE; hostname: DESKTOP-5QS3D5D |
| 10.0.19.255 | ff:ff:ff:ff:ff:ff |  |
| 10.0.19.9 | 00:c0:4f:f8:48:19, 2c:54:2d:2f:13:5c | hostname: BURNINCANDLE-DC |

## Evidence timeline

| UTC | Frame | Candidate observation |
|---|---:|---|
| 2022-03-21T20:59:41.095711+00:00 | 816 | low: Directory-service protocol activity |
| 2022-03-21T20:59:41.096044+00:00 | 817 | low: Directory-service protocol activity |
| 2022-03-21T21:06:43.730603+00:00 | 3298 | low: Repeated unsuccessful DNS resolution |
| 2022-03-21T21:06:43.732244+00:00 | 3300 | low: Repeated unsuccessful DNS resolution |
| 2022-03-21T21:12:10.329916+00:00 | 3450 | low: Directory-service protocol activity |
| 2022-03-21T21:12:10.330464+00:00 | 3451 | low: Directory-service protocol activity |
| 2022-03-21T21:12:10.443849+00:00 | 3473 | low: Directory-service protocol activity |
| 2022-03-21T21:12:10.444539+00:00 | 3475 | low: Directory-service protocol activity |

## Highest-volume conversations

Wire volume includes overhead/retransmissions. A large or periodic flow is not automatically exfiltration or C2.

| Initiator | Responder | Stream | Wire bytes | First frame |
|---|---|---|---:|---:|
| 10.0.19.14:62183 | 157.245.142.66:443 | tcp 7 | 2,036,297 | 609 |
| 10.0.19.14:62257 | 87.238.33.8:443 | tcp 79 | 525,427 | 5101 |
| 10.0.19.14:62281 | 23.227.198.203:757 | tcp 103 | 442,387 | 6379 |
| 10.0.19.14:62179 | 188.166.154.118:80 | tcp 0 | 422,673 | 1 |
| 10.0.19.14:62285 | 10.0.19.9:389 | tcp 106 | 345,567 | 7023 |
| 10.0.19.14:62231 | 10.0.19.9:445 | tcp 53 | 67,207 | 4347 |
| 10.0.19.14:62236 | 157.245.142.66:443 | tcp 58 | 51,132 | 4439 |
| 10.0.19.14:62313 | 10.0.19.9:445 | tcp 133 | 46,621 | 8138 |
| 10.0.19.14:62371 | 10.0.19.9:445 | tcp 191 | 41,563 | 10504 |
| 10.0.19.14:62515 | 10.0.19.9:445 | tcp 335 | 40,675 | 13617 |
| 10.0.19.14:62624 | 52.113.194.132:443 | tcp 444 | 34,950 | 15825 |
| 10.0.19.14:62533 | 52.113.194.132:443 | tcp 353 | 33,807 | 14080 |
| 10.0.19.14:62534 | 52.113.194.132:443 | tcp 354 | 33,694 | 14081 |
| 10.0.19.14:62185 | 160.153.32.99:443 | tcp 5 | 31,150 | 567 |
| 10.0.19.14:62286 | 10.0.19.9:445 | tcp 107 | 24,361 | 7379 |
| 10.0.19.14:62465 | 52.137.108.250:443 | tcp 285 | 22,551 | 12672 |
| 10.0.19.14:62191 | 10.0.19.9:445 | tcp 12 | 22,043 | 791 |
| 10.0.19.14:62588 | 52.109.8.21:443 | tcp 408 | 20,625 | 15157 |
| 10.0.19.14:62195 | 160.153.32.99:443 | tcp 16 | 19,668 | 2433 |
| 10.0.19.14:62194 | 160.153.32.99:443 | tcp 15 | 18,458 | 2232 |

## Native packet findings, artifacts and limitations

# AdversaryGraph Deterministic PCAP Analysis

Source: 2022-03-21-traffic-analysis-exercise.pcap
Capture SHA-256: `d9b67e18bca13cf6135874fd81d167403c7cb6b8a422679948db914e9959b90d`
Semantic result SHA-256: `f38dc6eb2db7e16e10a92b68527beec8e2509ef67cf4ab5380a35fc1909d09af`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 16296 packets across 63 IP endpoints and 837 transport flows. Observed 640 DNS events, 38 HTTP requests, 313 TLS ClientHello events, and 2 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 0 medium, and 8 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 16296
- Duration: 22746.472749 seconds
- Captured bytes: 6591621
- Endpoints: 63
- Flows: 837

## Deterministic findings

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 3298, frame 3584, frame 3845, frame 3916, frame 4014.

Metrics: `{"domain":"wpad.burnincandle.com","response_count":42,"source":"10.0.19.14"}`

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 3300, frame 3586, frame 3851, frame 3918, frame 4016.

Metrics: `{"domain":"wpad.mshome.net","response_count":41,"source":"10.0.19.14"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 3450 / TCP stream 23, frame 3452 / TCP stream 23, frame 3454 / TCP stream 23, frame 3458 / TCP stream 23, frame 3460 / TCP stream 23.

Metrics: `{"destination":"10.0.19.9","event_count":82,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.0.19.14"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 3473 / TCP stream 24, frame 3478 / TCP stream 24, frame 3481 / TCP stream 24, frame 3483 / TCP stream 24, frame 3485 / TCP stream 24.

Metrics: `{"destination":"10.0.19.9","event_count":182,"operation_numbers":["0","2","3"],"protocol":"ldap","source":"10.0.19.14"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 816 / TCP stream 12, frame 818 / TCP stream 12, frame 820 / TCP stream 12, frame 822 / TCP stream 12, frame 824 / TCP stream 12.

Metrics: `{"destination":"10.0.19.9","event_count":51,"operation_numbers":["1","16","17","18","19","20","25","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.0.19.14"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 3451 / TCP stream 23, frame 3453 / TCP stream 23, frame 3455 / TCP stream 23, frame 3459 / TCP stream 23, frame 3461 / TCP stream 23.

Metrics: `{"destination":"10.0.19.14","event_count":82,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.0.19.9"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 3475 / TCP stream 24, frame 3480 / TCP stream 24, frame 3482 / TCP stream 24, frame 3484 / TCP stream 24, frame 3486 / TCP stream 24.

Metrics: `{"destination":"10.0.19.14","event_count":146,"operation_numbers":["1","4,19,19,19,5","4,4,4,5","4,5","5"],"protocol":"ldap","source":"10.0.19.9"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 817 / TCP stream 12, frame 819 / TCP stream 12, frame 821 / TCP stream 12, frame 823 / TCP stream 12, frame 825 / TCP stream 12.

Metrics: `{"destination":"10.0.19.14","event_count":51,"operation_numbers":["1","16","17","18","19","20","25","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.0.19.9"}`

## ATT&CK candidates

- No deterministic ATT&CK candidates.

## Identities

- account: `DESKTOP-5QS3D5D$`; client IPs: 10.0.19.14; frames: 12633, 12641, 12643, 12655, 15402
- account: `patrick.zimmerman`; client IPs: 10.0.19.14; frames: 3696, 4150, 4162, 4171, 4173
- full-name: `Patrick Zimmerman`; client IPs: 10.0.19.14; frames: 3696, 4317
- hostname: `BURNINCANDLE`; client IPs: 10.0.19.14, 169.254.179.89; frames: 3763, 3764, 3765, 3766, 3933
- hostname: `BURNINCANDLE-DC`; client IPs: 10.0.19.9; frames: 3980
- hostname: `DESKTOP-5QS3D5D`; client IPs: 10.0.19.14, 169.254.179.89; frames: 3771, 3773, 744, 3241, 3513
- netbios-group: `BURNINCANDLE`; client IPs: unbound subject; frames: 3724, 3728, 3732, 3735, 3737

## IOC and artifact candidates

- domain: `antnosience.com`; roles: dns-query, tls-sni
- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `arc.msn.com`; roles: dns-query, tls-sni
- domain: `bupdater.com`; roles: dns-query, tls-sni
- domain: `burnincandle-dc.burnincandle.com`; roles: dns-query
- domain: `checkappexec.microsoft.com`; roles: dns-query, tls-sni
- domain: `client.wns.windows.com`; roles: dns-query, tls-sni
- domain: `config.edge.skype.com`; roles: dns-query, tls-sni
- domain: `ctldl.windowsupdate.com`; roles: dns-query, http-host
- domain: `desktop-lr77s6e.burnincandle.com`; roles: dns-query
- domain: `dilimoretast.com`; roles: dns-query, tls-sni
- domain: `dns.msftncsi.com`; roles: dns-query
- domain: `ecs.office.com`; roles: dns-query, tls-sni
- domain: `filebin.net`; roles: dns-query, tls-sni
- domain: `fp-vp-nocache.azureedge.net`; roles: dns-query, tls-sni
- domain: `fp-vp.azureedge.net`; roles: dns-query, tls-sni
- domain: `fp-vs-nocache.azureedge.net`; roles: dns-query, tls-sni
- domain: `licensing.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `login.microsoftonline.com`; roles: dns-query, tls-sni
- domain: `msedge.api.cdp.microsoft.com`; roles: dns-query, tls-sni
- domain: `nexusrules.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `oceriesfornot.top`; roles: http-host
- domain: `otectagain.top`; roles: dns-query, tls-sni
- domain: `prod.nexusrules.live.com.akadns.net`; roles: dns-cname
- domain: `r3.i.lencr.org`; roles: dns-query, http-host
- domain: `seaskysafe.com`; roles: dns-query, tls-sni
- domain: `settings-win.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `situla.bitbit.net`; roles: dns-query, tls-sni
- domain: `spo-ring.msedge.net`; roles: dns-query, tls-sni
- domain: `storecatalogrevocation.storequality.microsoft.com`; roles: dns-query, tls-sni
- domain: `suncoastpinball.com`; roles: dns-query, tls-sni
- domain: `t-ring.msedge.net`; roles: dns-query, tls-sni
- domain: `teams-ring.msedge.net`; roles: dns-query, tls-sni
- domain: `v10.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `wns.notify.trafficmanager.net`; roles: dns-cname
- domain: `wpad.burnincandle.com`; roles: dns-query
- domain: `wpad.mshome.net`; roles: dns-query
- domain: `www.bing.com`; roles: dns-query, tls-sni
- domain: `x1.c.lencr.org`; roles: dns-query, http-host
- ipv4: `0.0.0.0`; roles: network-endpoint
- ipv4: `10.0.19.1`; roles: network-endpoint
- ipv4: `10.0.19.14`; roles: network-endpoint
- ipv4: `10.0.19.255`; roles: network-endpoint
- ipv4: `10.0.19.9`; roles: dns-answer, network-endpoint
- ipv4: `104.80.96.219`; roles: dns-answer, network-endpoint
- ipv4: `13.107.136.254`; roles: dns-answer, network-endpoint
- ipv4: `13.107.21.200`; roles: dns-answer
- ipv4: `13.107.246.254`; roles: dns-answer, network-endpoint
- ipv4: `13.107.42.16`; roles: dns-answer, network-endpoint
- ipv4: `13.69.116.104`; roles: dns-answer, network-endpoint
- ipv4: `13.69.239.74`; roles: dns-answer, network-endpoint
- ipv4: `13.87.188.105`; roles: dns-answer, network-endpoint
- ipv4: `13.89.179.10`; roles: dns-answer, network-endpoint
- ipv4: `13.89.179.9`; roles: dns-answer, network-endpoint
- ipv4: `131.107.255.255`; roles: dns-answer
- ipv4: `157.245.142.66`; roles: dns-answer, network-endpoint
- ipv4: `160.153.32.99`; roles: dns-answer, network-endpoint
- ipv4: `169.254.179.89`; roles: network-endpoint
- ipv4: `169.254.255.255`; roles: network-endpoint
- ipv4: `184.85.64.91`; roles: dns-answer, network-endpoint
- ipv4: `185.47.40.36`; roles: dns-answer, network-endpoint
- ipv4: `188.166.154.118`; roles: network-endpoint
- ipv4: `20.189.173.15`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.2`; roles: dns-answer, network-endpoint
- ipv4: `20.190.154.137`; roles: dns-answer
- ipv4: `20.190.154.139`; roles: dns-answer
- ipv4: `20.190.154.16`; roles: dns-answer
- ipv4: `20.190.154.17`; roles: dns-answer
- ipv4: `20.190.154.18`; roles: dns-answer
- ipv4: `20.190.154.19`; roles: dns-answer
- ipv4: `20.42.65.89`; roles: dns-answer, network-endpoint
- ipv4: `20.44.10.123`; roles: dns-answer, network-endpoint
- ipv4: `20.69.130.185`; roles: dns-answer, network-endpoint
- ipv4: `20.72.205.209`; roles: dns-answer, network-endpoint
- ipv4: `20.81.51.95`; roles: dns-answer, network-endpoint
- ipv4: `20.81.52.156`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.200`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.203`; roles: dns-answer, network-endpoint
- ipv4: `209.197.3.8`; roles: dns-answer, network-endpoint
- ipv4: `224.0.0.22`; roles: network-endpoint
- ipv4: `224.0.0.251`; roles: network-endpoint
- ipv4: `224.0.0.252`; roles: network-endpoint
- ipv4: `23.219.38.10`; roles: dns-answer, network-endpoint
- ipv4: `23.219.38.40`; roles: dns-answer
- ipv4: `23.227.198.203`; roles: dns-answer, network-endpoint
- ipv4: `239.255.255.250`; roles: http-host, network-endpoint
- ipv4: `255.255.255.255`; roles: network-endpoint
- ipv4: `40.124.168.44`; roles: dns-answer, network-endpoint
- ipv4: `40.126.26.134`; roles: dns-answer, network-endpoint
- ipv4: `40.126.26.135`; roles: dns-answer
- ipv4: `40.74.98.194`; roles: dns-answer, network-endpoint
- ipv4: `40.83.240.146`; roles: dns-answer, network-endpoint
- ipv4: `51.105.71.137`; roles: dns-answer, network-endpoint
- ipv4: `52.109.8.19`; roles: dns-answer, network-endpoint
- ipv4: `52.109.8.20`; roles: dns-answer, network-endpoint
- ipv4: `52.109.8.21`; roles: dns-answer, network-endpoint
- ipv4: `52.113.194.132`; roles: dns-answer, network-endpoint
- ipv4: `52.113.196.254`; roles: dns-answer, network-endpoint
- ipv4: `52.137.108.250`; roles: dns-answer, network-endpoint
- ipv4: `52.168.117.170`; roles: dns-answer, network-endpoint
- ipv4: `52.182.143.208`; roles: dns-answer, network-endpoint
- ipv4: `52.182.143.210`; roles: dns-answer, network-endpoint
- ipv4: `52.183.220.149`; roles: dns-answer, network-endpoint
- ipv4: `52.185.211.133`; roles: dns-answer, network-endpoint
- ipv4: `68.142.107.1`; roles: dns-answer, network-endpoint
- ipv4: `68.142.107.129`; roles: dns-answer, network-endpoint
- ipv4: `69.28.162.0`; roles: dns-answer, network-endpoint
- ipv4: `69.28.162.128`; roles: dns-answer, network-endpoint
- ipv4: `72.21.81.200`; roles: dns-answer, network-endpoint
- ipv4: `72.21.81.240`; roles: dns-answer, network-endpoint
- ipv4: `87.238.33.7`; roles: dns-answer
- ipv4: `87.238.33.8`; roles: dns-answer, network-endpoint
- ipv4: `91.193.16.181`; roles: dns-answer, network-endpoint
- ja3: `28a2c9bd18a11de089ef85a160da29e4`; roles: tls-client-fingerprint
- ja3: `37f463bf4616ecd445d4a1937da06e19`; roles: tls-client-fingerprint
- ja3: `3b5074b1b5d032e5620f69f9f700ff0e`; roles: tls-client-fingerprint
- ja3: `6271f898ce5be7dd52b0fc260d0662b3`; roles: tls-client-fingerprint
- ja3: `a0e9f5d64349fb13191bc781f81f42e1`; roles: tls-client-fingerprint
- sha256: `67add1166b020ae61b8f5fc96813c04c2aa589960796865572a3c7e737613dfd`; roles: exported-object
- sha256: `ac64292e91738bf97842e7e5d28373a3a52bdb0aa2bc48a0df512e34d1b41501`; roles: exported-object
- url: `http://239.255.255.250:1900*`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?161b4282e13b6962`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?48e7354130cbe0e4`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?c66ea67221454a2e`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?c6c9c220471a286c`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?0356947035b28e34`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?1131f2daab4034ba`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?8fd0590036de0ddd`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?36a063424dfa7851`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?416ee1a6826abea5`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?9770388e0c613755`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?d1adc478adff0d72`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?fcfd7669d19bb421`; roles: http-request
- url: `http://oceriesfornot.top/`; roles: http-request
- url: `http://r3.i.lencr.org/`; roles: http-request
- url: `http://x1.c.lencr.org/`; roles: http-request
- user_agent: `Microsoft-CryptoAPI/10.0`; roles: http-client
- exported object `%2f`; SHA-256 `ac64292e91738bf97842e7e5d28373a3a52bdb0aa2bc48a0df512e34d1b41501`; size 393277 bytes
- exported object `%2f(1)`; SHA-256 `67add1166b020ae61b8f5fc96813c04c2aa589960796865572a3c7e737613dfd`; size 1306 bytes

## Actor similarity leads

- No actor lead was calculated.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `6a2316caee77621222da55a0117f143ac0b4ad630ec057912dd940e824fe529d`; recorded 2026-09-19T12:09:11.063080+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":137,"observable_limit":5000,"observables_checked":137,"observables_total":137,"prior_case_limit_reached":false,"prior_cases_checked":10,"truncated":false}`

- Prior analysis `29aa3ef8-47c9-4c47-b4cc-1ff3e0708142` shares 18 observations. This does not establish a common campaign.
- Prior analysis `b79032a8-d69e-4ac1-bdd4-542473fa8e3b` shares 17 observations. This does not establish a common campaign.
- Prior analysis `faf041c3-70e0-4a01-8780-10917e5e187c` shares 18 observations. This does not establish a common campaign.
- Prior analysis `08324647-35af-4af2-8d82-4387eec03918` shares 19 observations. This does not establish a common campaign.
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 4 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 14 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 22 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 16 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 19 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 19 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":0,"complete":true,"detailed_objects":2,"exported_objects":2,"hashed_bytes":394583,"hashed_objects":2,"omitted_unique_hashes":0,"returned_unique_hashes":2,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":2}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 8/8, identities 7/7, observables 137/137, artifacts 2/2. Full returned inventory is in the JSON result.


## Live enrichment and correlation validation

The actual IOC library contained 156,125 records. Exact typed matches: **0**; source actor assertions: **0**. Independent SQL agrees: IOC=True, actors=True.
A miss is unknown in this corpus, not evidence of benignness. The earlier isolated corpus included publisher-reference records; its positive matches were not live-provider detections and are not comparable to natural coverage here.
ATT&CK catalog candidates: 0; current-version catalog checks passed: True. Detection-strategy joins were checked independently.
Cross-case links: 10; independently verified: True. These are shared observations, predominantly common service infrastructure, not common-campaign assertions.

| Passive local lookup target | Type | Local matches |
|---|---|---:|
| `188.166.154.118` | ipv4 | 0 |
| `157.245.142.66` | ipv4 | 0 |
| `oceriesfornot.top` | domain | 0 |
| `antnosience.com` | domain | 0 |
| `ac64292e91738bf97842e7e5d28373a3a52bdb0aa2bc48a0df512e34d1b41501` | sha256 | 0 |
| `67add1166b020ae61b8f5fc96813c04c2aa589960796865572a3c7e737613dfd` | sha256 | 0 |

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

| Prior analysis | Shared count | Example observations |
|---|---:|---|
| 29aa3ef8-47c9-4c47-b4cc-1ff3e0708142 | 18 | api.msn.com, arc.msn.com, client.wns.windows.com, config.edge.skype.com, ecs.office.com |
| b79032a8-d69e-4ac1-bdd4-542473fa8e3b | 17 | api.msn.com, client.wns.windows.com, ecs.office.com, licensing.mp.microsoft.com, login.microsoftonline.com |
| faf041c3-70e0-4a01-8780-10917e5e187c | 18 | api.msn.com, arc.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com |
| 08324647-35af-4af2-8d82-4387eec03918 | 19 | api.msn.com, checkappexec.microsoft.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com |
| 616a90fa-f15e-4fcb-8d56-7b8e0eff5785 | 4 | login.microsoftonline.com, settings-win.data.microsoft.com, v10.events.data.microsoft.com, www.bing.com |
| 459e119d-191f-49e8-85ea-c78f9de41826 | 14 | api.msn.com, client.wns.windows.com, config.edge.skype.com, ctldl.windowsupdate.com, ecs.office.com |
| 7a2cfe72-f48d-4894-8a2d-8889cb3b11b2 | 22 | api.msn.com, client.wns.windows.com, config.edge.skype.com, ctldl.windowsupdate.com, ecs.office.com |
| 81373b30-6a59-49d1-89b0-bad73ed19eaa | 16 | api.msn.com, client.wns.windows.com, config.edge.skype.com, dns.msftncsi.com, ecs.office.com |
| 38851ad7-b3a0-423d-ae89-3b7be4e4b908 | 19 | api.msn.com, client.wns.windows.com, config.edge.skype.com, ctldl.windowsupdate.com, dns.msftncsi.com |
| bfccc426-aa9b-4007-8558-a66d37ecb90c | 19 | api.msn.com, checkappexec.microsoft.com, client.wns.windows.com, config.edge.skype.com, ctldl.windowsupdate.com |

## Comparison with publisher answers and earlier runs

The following comparison is separate from native inference. It measures availability of selected facts, not 100% incident-diagnosis accuracy.

[Publisher answer](https://www.malware-traffic-analysis.net/2022/03/21/page2.html).

The engine retains identity and infrastructure observations, but does not independently classify IcedID or Cobalt Strike. Encrypted sessions and a nonstandard TLS port are insufficient for a definitive malware-family label without dated signature or intelligence support.

| Client | Field | Packet-verified expected value | Live |
|---|---|---|---|
| 10.0.19.14 | ip | 10.0.19.14 | True |
| 10.0.19.14 | mac | 00:60:52:b7:33:0f | True |
| 10.0.19.14 | hostname | DESKTOP-5QS3D5D | True |
| 10.0.19.14 | account | patrick.zimmerman | True |

Declared IOC subset available: 14/14. Not exhaustive recall.

- `188.166.154.118`: present
- `157.245.142.66`: present
- `160.153.32.99`: present
- `91.193.16.181`: present
- `23.227.198.203`: present
- `oceriesfornot.top`: present
- `antnosience.com`: present
- `suncoastpinball.com`: present
- `otectagain.top`: present
- `seaskysafe.com`: present
- `dilimoretast.com`: present
- `filebin.net`: present
- `situla.bitbit.net`: present
- `bupdater.com`: present
- Reference conflict: published `10.0.18.14`, packet-supported `10.0.19.14`. The capture and stated 10.0.19.0/24 LAN identify .19.14.

## Complete-flow checks and evidence links

Browser history/open, Markdown export and investigation transfer: True. Investigation ID: `abad4a24-6a07-41cb-abc4-9bc1b8fb2303`.
Investigation transfers preserve a bounded preview, total count, source-analysis URL and hashes. Complete evidence remains server-side. TTP-overlap leads are not inserted into actor associations.
PDF export: HTTP 200, including an explicitly non-authoritative packet-evidence appendix. STIX export remains HTTP 409 until a human completes review/promotion; this is a successful safety check.
- [Full native JSON](api-upload.json), [independent database audit](database-audit.json), [native Markdown](NATIVE-REPORT.md), [PDF](pdf-export-fixed.pdf).
- [Browser screenshot](../../browser/2022-03-21.png), [investigation evidence](../../browser/2022-03-21-investigation.json).

## Follow-up priorities

Validate high/medium findings using frame/stream evidence; obtain process and endpoint telemetry for execution, persistence and credential-theft hypotheses. Provider data above is current-time external context, not historical execution evidence. Review shared-CDN matches for specificity. Do not execute exported objects or treat encrypted payload metadata as decrypted evidence.
