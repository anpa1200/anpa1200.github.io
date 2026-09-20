# 2024-11-26: AdversaryGraph live-instance PCAP report

Actual deployment: `[local-workspace]`, HTTP `[local-instance]`. This is a regression validation, not an independent blind trial. No malware was executed and no malicious endpoint was contacted.

## Executive assessment

Decoded 26922 packets across 61 IP endpoints and 276 transport flows. Observed 343 DNS events, 74 HTTP requests, 109 TLS ClientHello events, and 11 exported HTTP object(s). Deterministic rules produced 12 finding(s): 2 high, 2 medium, and 8 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

These findings identify observations and review priorities, not a proven malware family, actor, or causal infection chain. Source-frame evidence takes precedence over exercise answer typos.

## Capture and execution evidence

Capture window: 2024-11-26T04:49:38.458138+00:00 to 2024-11-26T05:43:58.109487+00:00 UTC.
Capture SHA-256: `a38267943a7bf3b0e445d7e51cb0a68b3dee797d67081bc9a033f73d079c0f50`.
Analysis ID: `08324647-35af-4af2-8d82-4387eec03918`; review session: `426471ed-5e63-4b7e-ac6c-d36e060a4739`.
First real HTTP upload/analysis: **9.812 seconds**. Fresh uncached decoder repeat: **13.871 seconds**. Prior isolated upload: 10.383 seconds.
The fresh repeat ran while builds/tests were active; these timings are not a controlled performance comparison. Native packet analysis used **zero LLM calls and zero LLM tokens**. Coding-agent token usage was not instrumented.

Packet result equals prior isolated result: True; fresh repeat exact: True; retained capture checksum valid: True; API retrieval identical: True; idempotent upload: True.

## Internal host identities

| Address | MAC addresses | Frame-backed identities |
|---|---|---|
| 10.11.26.183 | d0:57:7b:ce:fc:8b | account: oboomwald; full-name: Oliver Q. Boomwald; hostname: DESKTOP-B8TQK49 |
| 10.11.26.255 | ff:ff:ff:ff:ff:ff |  |
| 10.11.26.3 | 00:24:e8:7f:09:5d |  |

## Evidence timeline

| UTC | Frame | Candidate observation |
|---|---:|---|
| 2024-11-26T04:49:38.919159+00:00 | 19 | low: Repeated unsuccessful DNS resolution |
| 2024-11-26T04:49:38.919448+00:00 | 23 | low: Repeated unsuccessful DNS resolution |
| 2024-11-26T04:49:39.029388+00:00 | 36 | low: Directory-service protocol activity |
| 2024-11-26T04:49:39.030853+00:00 | 40 | low: Directory-service protocol activity |
| 2024-11-26T04:49:55.586808+00:00 | 304 | low: Directory-service protocol activity |
| 2024-11-26T04:49:55.587007+00:00 | 305 | low: Directory-service protocol activity |
| 2024-11-26T04:49:55.590229+00:00 | 330 | low: Directory-service protocol activity |
| 2024-11-26T04:49:55.590598+00:00 | 333 | low: Directory-service protocol activity |
| 2024-11-26T04:50:45.849438+00:00 | 20340 | medium: Cleartext HTTP observed on TCP/443 |
| 2024-11-26T04:50:45.849438+00:00 | 20340 | high: Periodic HTTP callback pattern |
| 2024-11-26T04:50:45.849438+00:00 | 20340 | high: Remote-access software network signature |
| 2024-11-26T04:50:45.849438+00:00 | 20340 | medium: Repeated outbound HTTP POST activity |

## Highest-volume conversations

Wire volume includes overhead/retransmissions. A large or periodic flow is not automatically exfiltration or C2.

| Initiator | Responder | Stream | Wire bytes | First frame |
|---|---|---|---:|---:|
| 10.11.26.183:53360 | 193.42.38.139:443 | tcp 75 | 5,718,632 | 12768 |
| 10.11.26.183:53322 | 213.246.109.5:443 | tcp 41 | 3,269,072 | 1184 |
| 10.11.26.183:53337 | 193.42.38.139:443 | tcp 54 | 2,844,417 | 2517 |
| 10.11.26.183:53348 | 193.42.38.139:443 | tcp 65 | 2,149,301 | 3937 |
| 10.11.26.183:53440 | 173.222.49.101:443 | tcp 124 | 1,326,163 | 24033 |
| 10.11.26.183:53438 | 173.222.49.101:443 | tcp 122 | 823,777 | 23575 |
| 10.11.26.183:53437 | 173.222.49.101:443 | tcp 120 | 719,436 | 22388 |
| 10.11.26.183:53436 | 173.222.49.101:443 | tcp 121 | 415,744 | 22389 |
| 10.11.26.183:53349 | 193.42.38.139:443 | tcp 66 | 397,787 | 3938 |
| 10.11.26.183:53335 | 142.250.115.95:443 | tcp 52 | 322,365 | 2115 |
| 10.11.26.183:53356 | 213.246.109.5:443 | tcp 71 | 281,283 | 12372 |
| 10.11.26.183:53344 | 142.250.113.94:443 | tcp 61 | 249,952 | 3791 |
| 10.11.26.183:63303 | 104.117.244.105:443 | udp 95 | 119,785 | 20701 |
| 10.11.26.183:53414 | 52.165.164.15:443 | tcp 103 | 108,271 | 21476 |
| 10.11.26.183:53429 | 52.113.194.132:443 | tcp 114 | 107,603 | 21856 |
| 10.11.26.183:53340 | 18.160.156.61:443 | tcp 57 | 88,947 | 3603 |
| 10.11.26.183:53345 | 142.250.138.94:443 | tcp 62 | 88,233 | 3854 |
| 10.11.26.183:53310 | 23.221.22.46:443 | tcp 30 | 81,810 | 754 |
| 10.11.26.183:53334 | 142.250.113.120:443 | tcp 51 | 80,197 | 2111 |
| 10.11.26.183:53430 | 52.113.194.132:443 | tcp 115 | 68,815 | 21957 |

## Native packet findings, artifacts and limitations

# AdversaryGraph Deterministic PCAP Analysis

Source: 2024-11-26-traffic-analysis-exercise.pcap
Capture SHA-256: `a38267943a7bf3b0e445d7e51cb0a68b3dee797d67081bc9a033f73d079c0f50`
Semantic result SHA-256: `4fa4f2aabaa7bcc51a396dcd62fc65dbd2ee862d01d0ba16095da5915212d518`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 26922 packets across 61 IP endpoints and 276 transport flows. Observed 343 DNS events, 74 HTTP requests, 109 TLS ClientHello events, and 11 exported HTTP object(s). Deterministic rules produced 12 finding(s): 2 high, 2 medium, and 8 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 26922
- Duration: 3259.651349 seconds
- Captured bytes: 20851149
- Endpoints: 61
- Flows: 276

## Deterministic findings

### MEDIUM — Cleartext HTTP observed on TCP/443

The decoded application protocol is HTTP despite use of the conventional TLS port.

Rule: `http-on-tls-port@pcap-rules-v3`; confidence: 0.98; evidence: frame 20340 / TCP stream 77, frame 20342 / TCP stream 77, frame 20348 / TCP stream 77, frame 20350 / TCP stream 77, frame 20572 / TCP stream 77.

Metrics: `{"destination":"194.180.191.64","host":"194.180.191.64","request_count":58,"source":"10.11.26.183","uri":"http://194.180.191.64/fakeurl.htm"}`

### HIGH — Periodic HTTP callback pattern

Repeated requests have a stable cadence consistent with automated callback or beacon behavior.

Rule: `periodic-http-callbacks@pcap-rules-v3`; confidence: 0.88; evidence: frame 20340 / TCP stream 77, frame 20342 / TCP stream 77, frame 20348 / TCP stream 77, frame 20350 / TCP stream 77, frame 20572 / TCP stream 77.

Metrics: `{"destination":"194.180.191.64","host":"194.180.191.64","median_absolute_deviation":0.091,"median_interval_seconds":60.154,"method":"POST","port":443,"request_count":58,"source":"10.11.26.183","uri":"http://194.180.191.64/fakeurl.htm"}`

### HIGH — Remote-access software network signature

An HTTP User-Agent explicitly identifies remote-access software. Validate authorization and endpoint ownership.

Rule: `remote-access-user-agent@pcap-rules-v3`; confidence: 0.95; evidence: frame 20340 / TCP stream 77, frame 20342 / TCP stream 77, frame 20348 / TCP stream 77, frame 20350 / TCP stream 77, frame 20572 / TCP stream 77.

Metrics: `{"destination":"194.180.191.64","request_count":58,"source":"10.11.26.183","user_agent":"NetSupport Manager/1.3"}`

### MEDIUM — Repeated outbound HTTP POST activity

The same endpoint pair and HTTP target produced repeated POST requests suitable for beaconing or data transfer review.

Rule: `repeated-http-posts@pcap-rules-v3`; confidence: 0.72; evidence: frame 20340 / TCP stream 77, frame 20342 / TCP stream 77, frame 20348 / TCP stream 77, frame 20350 / TCP stream 77, frame 20572 / TCP stream 77.

Metrics: `{"declared_body_bytes":2624,"destination":"194.180.191.64","host":"194.180.191.64","port":443,"request_count":58,"source":"10.11.26.183","uri":"http://194.180.191.64/fakeurl.htm"}`

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 23, frame 25, frame 189, frame 190, frame 902.

Metrics: `{"domain":"wpad.mshome.net","response_count":24,"source":"10.11.26.183"}`

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 19, frame 20, frame 185, frame 186, frame 898.

Metrics: `{"domain":"wpad.nemotoads.health","response_count":24,"source":"10.11.26.183"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 304 / TCP stream 11, frame 309 / TCP stream 11, frame 312 / TCP stream 11, frame 315 / TCP stream 11, frame 486 / TCP stream 24.

Metrics: `{"destination":"10.11.26.3","event_count":25,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.11.26.183"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 36 / TCP stream 1, frame 43 / TCP stream 1, frame 46 / TCP stream 1, frame 359 / TCP stream 16, frame 371 / TCP stream 16.

Metrics: `{"destination":"10.11.26.3","event_count":64,"operation_numbers":["","0","2","3"],"protocol":"ldap","source":"10.11.26.183"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 330 / TCP stream 10, frame 334 / TCP stream 10, frame 340 / TCP stream 10, frame 344 / TCP stream 10, frame 346 / TCP stream 10.

Metrics: `{"destination":"10.11.26.3","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.11.26.183"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 305 / TCP stream 11, frame 311 / TCP stream 11, frame 313 / TCP stream 11, frame 316 / TCP stream 11, frame 487 / TCP stream 24.

Metrics: `{"destination":"10.11.26.183","event_count":25,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.11.26.3"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 40 / TCP stream 1, frame 45 / TCP stream 1, frame 363 / TCP stream 16, frame 379 / TCP stream 16, frame 383 / TCP stream 16.

Metrics: `{"destination":"10.11.26.183","event_count":49,"operation_numbers":["","1","4,19,19,19,5","4,5","5"],"protocol":"ldap","source":"10.11.26.3"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 333 / TCP stream 10, frame 337 / TCP stream 10, frame 342 / TCP stream 10, frame 345 / TCP stream 10, frame 348 / TCP stream 10.

Metrics: `{"destination":"10.11.26.183","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.11.26.3"}`

## ATT&CK candidates

- T1071.001 Application Layer Protocol: Web Protocols (command-and-control), confidence=0.85, status=suggested; basis=versioned-deterministic-rule.
- T1219 Remote Access Software (command-and-control), confidence=0.9, status=suggested; basis=versioned-deterministic-rule.

## Identities

- account: `oboomwald`; client IPs: 10.11.26.183; frames: 213, 221, 223, 235, 275
- full-name: `Oliver Q. Boomwald`; client IPs: 10.11.26.183; frames: 355
- hostname: `DESKTOP-B8TQK49`; client IPs: 10.11.26.183; frames: 69, 70, 145, 146, 174
- netbios-group: `NEMOTODES`; client IPs: unbound subject; frames: 71, 144, 176, 180, 191

## IOC and artifact candidates

- domain: `a1834.dscg2.akamai.net`; roles: dns-cname
- domain: `acroipm2.adobe.com`; roles: dns-query, http-host
- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `armmf.adobe.com`; roles: dns-query, tls-sni
- domain: `assets.msn.com`; roles: dns-query, tls-sni
- domain: `checkappexec.microsoft.com`; roles: dns-query, tls-sni
- domain: `classicgrand.com`; roles: dns-query, tls-sni
- domain: `client.wns.windows.com`; roles: dns-query, tls-sni
- domain: `code.jquery.com`; roles: dns-query, tls-sni
- domain: `confirmsubscription.com`; roles: dns-query, tls-sni
- domain: `css.createsend1.com`; roles: dns-query, tls-sni
- domain: `ctldl.windowsupdate.com`; roles: dns-query, http-host
- domain: `d33w6v2v5ta015.cloudfront.net`; roles: dns-cname
- domain: `data-edge.smartscreen.microsoft.com`; roles: dns-query, tls-sni
- domain: `default.exp-tas.com`; roles: dns-query, tls-sni
- domain: `displaycatalog.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `dns.msftncsi.com`; roles: dns-query
- domain: `ecs.office.com`; roles: dns-query, tls-sni
- domain: `edge-microsoft-com.dual-a-0036.a-msedge.net`; roles: dns-cname
- domain: `edge.microsoft.com`; roles: dns-query, tls-sni
- domain: `fa000000002.resources.office.net`; roles: dns-query, tls-sni
- domain: `fa000000005.resources.office.net`; roles: dns-query, tls-sni
- domain: `fa000000116.resources.office.net`; roles: dns-query, tls-sni
- domain: `fa000000128.resources.office.net`; roles: dns-query, tls-sni
- domain: `fa000000163.resources.office.net`; roles: dns-query, tls-sni
- domain: `fd.api.iris.microsoft.com`; roles: dns-query, tls-sni
- domain: `fe3cr.delivery.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `fonts.googleapis.com`; roles: dns-query, tls-sni
- domain: `fonts.gstatic.com`; roles: dns-query, tls-sni
- domain: `geo.netsupportsoftware.com`; roles: dns-query, http-host
- domain: `img-s-msn-com.akamaized.net`; roles: dns-query, tls-sni
- domain: `inputsuggestions.msdxcdn.microsoft.com`; roles: dns-query, tls-sni
- domain: `js.createsend1.com`; roles: dns-query, tls-sni
- domain: `licensing.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `login.live.com`; roles: dns-query, tls-sni
- domain: `login.microsoftonline.com`; roles: tls-sni
- domain: `maps.googleapis.com`; roles: dns-query, tls-sni
- domain: `maps.gstatic.com`; roles: dns-query, tls-sni
- domain: `mobile.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `modandcrackedapk.com`; roles: dns-query, tls-sni
- domain: `mrodevicemgr.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `nav.smartscreen.microsoft.com`; roles: dns-query, tls-sni
- domain: `nemotodes-dc.nemotoads.health`; roles: dns-query
- domain: `odc.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `officeclient.microsoft.com`; roles: dns-query, tls-sni
- domain: `prod.mrodevicemgr.live.com.akadns.net`; roles: dns-cname
- domain: `r10.o.lencr.org`; roles: dns-query, http-host
- domain: `srtb.msn.com`; roles: dns-query, tls-sni
- domain: `storecatalogrevocation.storequality.microsoft.com`; roles: dns-query, tls-sni
- domain: `th.bing.com`; roles: dns-query, tls-sni
- domain: `v10.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `windows.msn.com`; roles: dns-query, tls-sni
- domain: `wns.notify.trafficmanager.net`; roles: dns-cname
- domain: `wpad.mshome.net`; roles: dns-query
- domain: `wpad.nemotoads.health`; roles: dns-query
- domain: `www.bing.com`; roles: dns-query, tls-sni
- domain: `www.google.com`; roles: dns-query, tls-sni
- domain: `www.gstatic.com`; roles: dns-query, tls-sni
- domain: `www.msftconnecttest.com`; roles: dns-query, http-host
- domain: `www.msn.com`; roles: dns-query, tls-sni
- ipv4: `10.11.26.183`; roles: network-endpoint
- ipv4: `10.11.26.255`; roles: network-endpoint
- ipv4: `10.11.26.3`; roles: dns-answer, network-endpoint
- ipv4: `104.117.244.104`; roles: dns-answer
- ipv4: `104.117.244.105`; roles: dns-answer, network-endpoint
- ipv4: `104.117.244.106`; roles: dns-answer, network-endpoint
- ipv4: `104.117.244.107`; roles: dns-answer
- ipv4: `104.117.244.112`; roles: dns-answer, network-endpoint
- ipv4: `104.117.244.114`; roles: dns-answer
- ipv4: `104.117.244.72`; roles: dns-answer
- ipv4: `104.117.244.74`; roles: dns-answer
- ipv4: `104.117.244.81`; roles: dns-answer
- ipv4: `104.117.244.82`; roles: dns-answer
- ipv4: `104.117.244.88`; roles: dns-answer
- ipv4: `104.117.244.89`; roles: dns-answer
- ipv4: `104.117.244.91`; roles: dns-answer
- ipv4: `104.117.244.96`; roles: dns-answer, network-endpoint
- ipv4: `104.117.244.97`; roles: dns-answer
- ipv4: `104.117.244.99`; roles: dns-answer
- ipv4: `104.117.247.139`; roles: dns-answer
- ipv4: `104.117.247.144`; roles: dns-answer
- ipv4: `104.117.247.162`; roles: dns-answer, network-endpoint
- ipv4: `104.117.247.184`; roles: dns-answer, network-endpoint
- ipv4: `104.117.247.186`; roles: dns-answer
- ipv4: `104.117.247.67`; roles: dns-answer
- ipv4: `104.117.247.99`; roles: dns-answer, network-endpoint
- ipv4: `104.26.0.231`; roles: dns-answer
- ipv4: `104.26.1.231`; roles: dns-answer, network-endpoint
- ipv4: `13.107.21.239`; roles: dns-answer, network-endpoint
- ipv4: `13.107.246.57`; roles: dns-answer, network-endpoint
- ipv4: `13.107.5.93`; roles: dns-answer, network-endpoint
- ipv4: `13.56.30.207`; roles: dns-answer, network-endpoint
- ipv4: `131.107.255.255`; roles: dns-answer
- ipv4: `142.250.113.120`; roles: dns-answer, network-endpoint
- ipv4: `142.250.113.94`; roles: dns-answer, network-endpoint
- ipv4: `142.250.113.95`; roles: dns-answer
- ipv4: `142.250.114.95`; roles: dns-answer
- ipv4: `142.250.115.95`; roles: dns-answer, network-endpoint
- ipv4: `142.250.138.94`; roles: dns-answer, network-endpoint
- ipv4: `142.251.116.95`; roles: dns-answer
- ipv4: `142.251.186.103`; roles: dns-answer
- ipv4: `142.251.186.104`; roles: dns-answer
- ipv4: `142.251.186.105`; roles: dns-answer
- ipv4: `142.251.186.106`; roles: dns-answer
- ipv4: `142.251.186.147`; roles: dns-answer, network-endpoint
- ipv4: `142.251.186.95`; roles: dns-answer, network-endpoint
- ipv4: `142.251.186.99`; roles: dns-answer
- ipv4: `151.101.130.137`; roles: dns-answer
- ipv4: `151.101.194.137`; roles: dns-answer
- ipv4: `151.101.2.137`; roles: dns-answer
- ipv4: `151.101.66.137`; roles: dns-answer, network-endpoint
- ipv4: `172.67.68.212`; roles: dns-answer
- ipv4: `173.222.49.101`; roles: dns-answer, network-endpoint
- ipv4: `18.160.156.103`; roles: dns-answer, network-endpoint
- ipv4: `18.160.156.61`; roles: dns-answer, network-endpoint
- ipv4: `18.160.156.77`; roles: dns-answer
- ipv4: `18.160.156.92`; roles: dns-answer
- ipv4: `193.42.38.139`; roles: dns-answer, network-endpoint
- ipv4: `194.180.191.64`; roles: http-host, network-endpoint
- ipv4: `20.189.173.16`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.23`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.26`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.6`; roles: dns-answer, network-endpoint
- ipv4: `20.190.135.2`; roles: dns-answer
- ipv4: `20.190.135.3`; roles: dns-answer
- ipv4: `20.190.135.6`; roles: dns-answer
- ipv4: `20.190.135.7`; roles: dns-answer
- ipv4: `20.42.73.25`; roles: dns-answer, network-endpoint
- ipv4: `20.42.73.28`; roles: dns-answer, network-endpoint
- ipv4: `20.7.1.246`; roles: dns-answer, network-endpoint
- ipv4: `20.7.2.167`; roles: dns-answer, network-endpoint
- ipv4: `20.96.153.111`; roles: dns-answer, network-endpoint
- ipv4: `20.99.184.37`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.203`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.239`; roles: dns-answer, network-endpoint
- ipv4: `213.246.109.5`; roles: dns-answer, network-endpoint
- ipv4: `224.0.0.251`; roles: network-endpoint
- ipv4: `224.0.0.252`; roles: network-endpoint
- ipv4: `23.201.68.167`; roles: dns-answer, network-endpoint
- ipv4: `23.204.171.61`; roles: dns-answer, network-endpoint
- ipv4: `23.219.87.81`; roles: dns-answer
- ipv4: `23.221.22.196`; roles: dns-answer
- ipv4: `23.221.22.205`; roles: dns-answer
- ipv4: `23.221.22.206`; roles: dns-answer
- ipv4: `23.221.22.207`; roles: dns-answer
- ipv4: `23.221.22.208`; roles: dns-answer
- ipv4: `23.221.22.209`; roles: dns-answer, network-endpoint
- ipv4: `23.221.22.217`; roles: dns-answer
- ipv4: `23.221.22.218`; roles: dns-answer
- ipv4: `23.221.22.219`; roles: dns-answer
- ipv4: `23.221.22.46`; roles: dns-answer, network-endpoint
- ipv4: `23.221.22.57`; roles: dns-answer
- ipv4: `23.53.127.105`; roles: dns-answer, network-endpoint
- ipv4: `23.53.127.114`; roles: dns-answer
- ipv4: `23.53.127.200`; roles: dns-answer, network-endpoint
- ipv4: `239.255.255.250`; roles: http-host, network-endpoint
- ipv4: `4.149.227.78`; roles: dns-answer, network-endpoint
- ipv4: `4.150.155.223`; roles: dns-answer, network-endpoint
- ipv4: `40.118.171.167`; roles: dns-answer, network-endpoint
- ipv4: `40.126.28.11`; roles: dns-answer, network-endpoint
- ipv4: `40.126.28.14`; roles: dns-answer
- ipv4: `40.126.28.22`; roles: dns-answer
- ipv4: `40.126.29.9`; roles: network-endpoint
- ipv4: `40.126.7.32`; roles: dns-answer
- ipv4: `52.109.0.136`; roles: dns-answer, network-endpoint
- ipv4: `52.109.20.47`; roles: dns-answer, network-endpoint
- ipv4: `52.109.8.89`; roles: dns-answer, network-endpoint
- ipv4: `52.113.194.132`; roles: dns-answer, network-endpoint
- ipv4: `52.165.164.15`; roles: dns-answer, network-endpoint
- ipv4: `52.168.112.67`; roles: dns-answer, network-endpoint
- ipv4: `52.8.34.0`; roles: dns-answer, network-endpoint
- ja3: `0652c09be13a164e73c3c66e2d5cd600`; roles: tls-client-fingerprint
- ja3: `089117d8abb9d0685ac2756412f44d8c`; roles: tls-client-fingerprint
- ja3: `091f51a7a1c3a4504a224cc081ce9cee`; roles: tls-client-fingerprint
- ja3: `0d7e324cc471d537395a5a84963ff4c0`; roles: tls-client-fingerprint
- ja3: `10b3abe91219287930575e96187aab46`; roles: tls-client-fingerprint
- ja3: `129a4a4460936a7d35cf0b4a876c02c5`; roles: tls-client-fingerprint
- ja3: `1a41c18f74e0a1125e7eb86dc20da423`; roles: tls-client-fingerprint
- ja3: `1aef2a0442d1535b67c961be49fbd9b0`; roles: tls-client-fingerprint
- ja3: `1d2c110dc93a519d4c14a15898f20f6c`; roles: tls-client-fingerprint
- ja3: `258a5a1e95b8a911872bae9081526644`; roles: tls-client-fingerprint
- ja3: `2800f914a7a4ba98aa9df62d316a460c`; roles: tls-client-fingerprint
- ja3: `2dd32544ddd46095f157e79a028dcda9`; roles: tls-client-fingerprint
- ja3: `2ef63960b5419ce0be770acb72a1e6d5`; roles: tls-client-fingerprint
- ja3: `34578b889dbdfd86b5a0639eb869f9c5`; roles: tls-client-fingerprint
- ja3: `39a2db8b2473a3d4cfe7cb23a26e03d6`; roles: tls-client-fingerprint
- ja3: `46181092bc7467ccd870ec99523f7113`; roles: tls-client-fingerprint
- ja3: `488f29e13a0873e296eb2dcca6ec38d0`; roles: tls-client-fingerprint
- ja3: `4c24b4903c9a3c9b3c46306472bda896`; roles: tls-client-fingerprint
- ja3: `53e42f80bc48a39739f5221b803b1f70`; roles: tls-client-fingerprint
- ja3: `5c0851e1f7c97a5fdf8ee34bd73a8ff4`; roles: tls-client-fingerprint
- ja3: `6634ba84945fce7cc2d7864edc49b103`; roles: tls-client-fingerprint
- ja3: `68b3ecfaf0034bb9fcbecd518b5ab8d4`; roles: tls-client-fingerprint
- ja3: `6a5d235ee78c6aede6a61448b4e9ff1e`; roles: tls-client-fingerprint
- ja3: `7117eb033929b913d5dbbef620c9ca24`; roles: tls-client-fingerprint
- ja3: `7230db75fbd5472f76d02c10787af505`; roles: tls-client-fingerprint
- ja3: `82fc3feb7b73141563a581cb3a02b9e2`; roles: tls-client-fingerprint
- ja3: `893fda16143345fbd7d6384fd5f69a44`; roles: tls-client-fingerprint
- ja3: `8f08a45cb17ce5d331bb4a861f26181f`; roles: tls-client-fingerprint
- ja3: `910d5ef16eeb9c556a6f011876c16d38`; roles: tls-client-fingerprint
- ja3: `9763df22d3de0549862e28d0f1103365`; roles: tls-client-fingerprint
- ja3: `97cdfdfb6ce55b090e5070647c73305e`; roles: tls-client-fingerprint
- ja3: `996d810fbaded0fd221205ee7a391364`; roles: tls-client-fingerprint
- ja3: `9c5ffd0e64cc58a2ad1806964fe2da4e`; roles: tls-client-fingerprint
- ja3: `a702db92a1dad8b0a7ddf9ef0fcf3d68`; roles: tls-client-fingerprint
- ja3: `ab617a1bfb55ac132b8893703d7cfec3`; roles: tls-client-fingerprint
- ja3: `af5ca235cbec16c4b5ad43da2bd9b40a`; roles: tls-client-fingerprint
- ja3: `b13922eb23a33bd76cd8442814f25cb5`; roles: tls-client-fingerprint
- ja3: `b6b910fa2621ea444621910f5e10aa4a`; roles: tls-client-fingerprint
- ja3: `b8f7a95293e0d02d297ecef1efcc79d5`; roles: tls-client-fingerprint
- ja3: `c73376907efd66947a8978eacfd15135`; roles: tls-client-fingerprint
- ja3: `c806504b9d641f3b26d1af269ed474ab`; roles: tls-client-fingerprint
- ja3: `c86423ffed1add9d50dccf646bd7fdbd`; roles: tls-client-fingerprint
- ja3: `cbcf96af03d431db8e0fd90215b03309`; roles: tls-client-fingerprint
- ja3: `d7268fba5c8ebdc86121861931c04402`; roles: tls-client-fingerprint
- ja3: `e544273138fcf6e7dc137dd4f74d6fd0`; roles: tls-client-fingerprint
- ja3: `e71e6cff682837413473fd63dc10f5d4`; roles: tls-client-fingerprint
- ja3: `f24a7ea8a60779966dc83806405c4091`; roles: tls-client-fingerprint
- ja3: `f82158b828f02d82f1f70fbb0f1d6145`; roles: tls-client-fingerprint
- ja3: `fae0e5d973c96ae1888b99538efa0363`; roles: tls-client-fingerprint
- sha256: `2b69346572041eefe558a82b58d654237e087ce9ab4e0876254a40a8954279a9`; roles: exported-object
- sha256: `59dc18363d5d0313ae94aa0ecad2d06dc77144758eeae2cc5ed8b4eee3923752`; roles: exported-object
- sha256: `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; roles: exported-object
- sha256: `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; roles: exported-object
- sha256: `79653567106d923034d36a9025d2d37955ff55dae5d77c1a79a321d850235d00`; roles: exported-object
- sha256: `839e234a3a10b60d559ee5679d2019ad4e58d9cd66e6cfd971207c3c6ef8ea4d`; roles: exported-object
- sha256: `975b5678560775735da4a9e8b805dce370329179b8e17ebc1c289aaeb293f7ff`; roles: exported-object
- sha256: `a5a0a597e4b76ebec517a83126dbce37625a763b57307afe7064d9eb0a523956`; roles: exported-object
- sha256: `af0c1c32558e6dc1e4e8f3e1d151268b8f6eb7cd844c9ac6dfc4b862decc7983`; roles: exported-object
- sha256: `cd6f72bd96cbbad446325f8c2d087283f051ccaf77523dc436eec2d98be29bf7`; roles: exported-object
- sha256: `f0e200cacd273e3dd257057f27aeda839a1f2f31482e0bb01ea8b1363a7af245`; roles: exported-object
- url: `http://194.180.191.64/fakeurl.htm`; roles: http-request
- url: `http://239.255.255.250:1900*`; roles: http-request
- url: `http://acroipm2.adobe.com/assets/Owner/arm/ProcessMAU.txt`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?778a0928305752e9`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?ce02e9976e1239e1`; roles: http-request
- url: `http://geo.netsupportsoftware.com/location/loca.asp`; roles: http-request
- url: `http://r10.o.lencr.org/MFMwUTBPME0wSzAJBgUrDgMCGgUABBRpD%2BQVZ%2B1vf7U0RGQGBm8JZwdxcgQUdKR2KRcYVIUxN75n5gZYwLzFBXICEgRSsdGCXQJklJZNbHi669GH4A%3D%3D`; roles: http-request
- url: `http://www.msftconnecttest.com/connecttest.txt`; roles: http-request
- user_agent: `Microsoft NCSI`; roles: http-client
- user_agent: `Microsoft-CryptoAPI/10.0`; roles: http-client
- user_agent: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; Tablet PC 2.0)`; roles: http-client
- user_agent: `NetSupport Manager/1.3`; roles: http-client
- exported object `MFMwUTBPME0wSzAJBgUrDgMCGgUABBRpD%2BQVZ%2B1vf7U0RGQGBm8JZwdxcgQUdKR2KRcYVIUxN75n5gZYwLzFBXICEgRSsdGCXQJklJZNbHi669GH4A%3D%3D`; SHA-256 `cd6f72bd96cbbad446325f8c2d087283f051ccaf77523dc436eec2d98be29bf7`; size 504 bytes
- exported object `fakeurl(2).htm`; SHA-256 `839e234a3a10b60d559ee5679d2019ad4e58d9cd66e6cfd971207c3c6ef8ea4d`; size 250 bytes
- exported object `fakeurl(3).htm`; SHA-256 `a5a0a597e4b76ebec517a83126dbce37625a763b57307afe7064d9eb0a523956`; size 152 bytes
- exported object `fakeurl(5).htm`; SHA-256 `59dc18363d5d0313ae94aa0ecad2d06dc77144758eeae2cc5ed8b4eee3923752`; size 84 bytes
- exported object `fakeurl(4).htm`; SHA-256 `f0e200cacd273e3dd257057f27aeda839a1f2f31482e0bb01ea8b1363a7af245`; size 76 bytes
- exported object `fakeurl(1).htm`; SHA-256 `79653567106d923034d36a9025d2d37955ff55dae5d77c1a79a321d850235d00`; size 61 bytes
- exported object `fakeurl(10).htm`; SHA-256 `975b5678560775735da4a9e8b805dce370329179b8e17ebc1c289aaeb293f7ff`; size 36 bytes
- exported object `fakeurl(54).htm`; SHA-256 `2b69346572041eefe558a82b58d654237e087ce9ab4e0876254a40a8954279a9`; size 22 bytes
- exported object `connecttest.txt`; SHA-256 `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; size 22 bytes
- exported object `loca.asp`; SHA-256 `af0c1c32558e6dc1e4e8f3e1d151268b8f6eb7cd844c9ac6dfc4b862decc7983`; size 16 bytes
- exported object `ProcessMAU.txt`; SHA-256 `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; size 4 bytes

## Actor similarity leads

- Orangeworm (G0071): 33% TTP overlap. This is an investigation lead, not attribution.
- SilverTerrier (G0083): 20% TTP overlap. This is an investigation lead, not attribution.
- RedEcho (G1042): 17% TTP overlap. This is an investigation lead, not attribution.
- Carbanak (G0008): 10% TTP overlap. This is an investigation lead, not attribution.
- Metador (G1013): 10% TTP overlap. This is an investigation lead, not attribution.
- GOLD SOUTHFIELD (G0115): 10% TTP overlap. This is an investigation lead, not attribution.
- Rancor (G0075): 10% TTP overlap. This is an investigation lead, not attribution.
- DarkVishnya (G0105): 9% TTP overlap. This is an investigation lead, not attribution.
- APT18 (G0026): 8% TTP overlap. This is an investigation lead, not attribution.
- FIN4 (G0085): 8% TTP overlap. This is an investigation lead, not attribution.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `82f0a542eadbd91c1d0554cf45b8bd4f69607e372cf96649bcd6ec9cab5fafb8`; recorded 2026-09-19T12:08:41.573203+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":243,"observable_limit":5000,"observables_checked":243,"observables_total":243,"prior_case_limit_reached":false,"prior_cases_checked":6,"truncated":false}`

- Catalog T1071.001: https://attack.mitre.org/techniques/T1071/001; detection strategies: [{"attack_id":"DET0027","name":"Detection of Web Protocol-Based C2 Over HTTP, HTTPS, or WebSockets","stix_id":"x-mitre-detection-strategy--e6496b9b-2458-4616-9712-a7c0da7fd3bc"}]
- Catalog T1219: https://attack.mitre.org/techniques/T1219; detection strategies: [{"attack_id":"DET0496","name":"Behavior-Chain Detection for Remote Access Tools (Tool-Agnostic)","stix_id":"x-mitre-detection-strategy--ec412019-109f-4f84-aa2f-d623f40254e0"}]
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 10 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 30 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 46 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 37 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 37 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 54 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":0,"complete":true,"detailed_objects":11,"exported_objects":66,"hashed_bytes":3596,"hashed_objects":66,"omitted_unique_hashes":0,"returned_unique_hashes":11,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":11}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 12/12, identities 4/4, observables 243/243, artifacts 11/11. Full returned inventory is in the JSON result.


## Live enrichment and correlation validation

The actual IOC library contained 156,125 records. Exact typed matches: **0**; source actor assertions: **0**. Independent SQL agrees: IOC=True, actors=True.
A miss is unknown in this corpus, not evidence of benignness. The earlier isolated corpus included publisher-reference records; its positive matches were not live-provider detections and are not comparable to natural coverage here.
ATT&CK catalog candidates: 2; current-version catalog checks passed: True. Detection-strategy joins were checked independently.
Cross-case links: 6; independently verified: True. These are shared observations, predominantly common service infrastructure, not common-campaign assertions.

| Passive local lookup target | Type | Local matches |
|---|---|---:|
| `194.180.191.64` | ipv4 | 0 |
| `modandcrackedapk.com` | domain | 0 |
| `classicgrand.com` | domain | 0 |
| `cd6f72bd96cbbad446325f8c2d087283f051ccaf77523dc436eec2d98be29bf7` | sha256 | 0 |
| `839e234a3a10b60d559ee5679d2019ad4e58d9cd66e6cfd971207c3c6ef8ea4d` | sha256 | 0 |

## Approved external passive enrichment

Completed 5/5 planned case indicators. Shared indicators reuse one saved lookup rather than consume provider quota repeatedly.

These lookups used the actual local application and were explicitly authorized. No PCAP or payload was uploaded, no private address was disclosed, no target was scanned, and no AI provider was invoked. Tier-two/three pivots query the local corpus only.

Provider intelligence was retrieved after the captures: current reputation, hosting and service observations do not establish historical causality. `not_found` means absent from that provider, not benign. Family labels and ATT&CK/actor leads remain source assertions awaiting review.

Historical coverage caveat: ThreatFox documents a six-month IOC expiration policy for its API since May 2025. That can limit these older exercises; it does not prove why any particular lookup missed. [ThreatFox API policy](https://threatfox.abuse.ch/api/).

### `194.180.191.64`

Type: ip; request: 6.078 seconds; completed: 2026-09-19T14:16:15.053804+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/78dc073b6a55699b75cd.json).
Platform triage score: 70/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 14 nodes, 17 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 3 engines marked malicious and 1 suspicious; 52 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 7 pulse(s). |
| urlscan | ok | urlscan returned 2 scan result(s). urlscan activity analysis found 1 suspicious pattern(s). |
| greynoise | not_found | GreyNoise classification: unknown. Query status: not_found |
| abuseipdb | ok | AbuseIPDB confidence score: 0/100. |
| shodan | ok | Shodan returned 1 open port(s). |
| censys | ok | Censys host lookup returned 5 service(s). |

Provider ATT&CK leads (not packet-observed execution):

| ID | Name | Source / scope |
|---|---|---|
| T1059.001 | PowerShell | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055 | Process Injection | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1074.001 | Local Data Staging | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1057 | Process Discovery | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1547.001 | Registry Run Keys / Startup Folder | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1204.002 | Malicious File | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1027 | Obfuscated Files or Information | otx (submitted indicator; provider-reported lead, not packet execution proof) |
| T1041 | Exfiltration Over C2 Channel | otx (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `modandcrackedapk.com`

Type: domain; request: 7.576 seconds; completed: 2026-09-19T14:16:36.542993+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/e8b6be26b88f5b7f799d.json).
Platform triage score: 100/100 (highly suspicious); a heuristic priority, not calibrated probability. Graph: 21 nodes, 24 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 7 engines marked malicious and 1 suspicious; 48 harmless, 33 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 4 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 7 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for modandcrackedapk.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `classicgrand.com`

Type: domain; request: 6.760 seconds; completed: 2026-09-19T14:16:55.719775+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/17434908a24430d728e7.json).
Platform triage score: 67/100 (suspicious); a heuristic priority, not calibrated probability. Graph: 16 nodes, 20 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | 1 engines marked malicious and 0 suspicious; 54 harmless, 34 undetected. |
| threatfox | not_found | ThreatFox returned 0 record(s). Query status: no_result |
| malwarebazaar | skipped | MalwareBazaar is hash-focused; input is not a hash. |
| otx | ok | OTX returned 0 pulse(s). |
| urlscan | ok | urlscan returned 10 scan result(s). urlscan activity analysis found 6 suspicious pattern(s). |
| greynoise | skipped | GreyNoise is IP-focused; input is not an IP. |
| abuseipdb | skipped | AbuseIPDB is IP-focused; input is not an IP. |
| shodan | skipped | Shodan host lookup is IP-focused; input is not an IP. |
| censys | ok | Censys web property lookup returned 2 record(s) for classicgrand.com. Broader Censys search requires an organization-enabled account and API role. |

No actor lead returned. This does not establish absence of an actor.

### `cd6f72bd96cbbad446325f8c2d087283f051ccaf77523dc436eec2d98be29bf7`

Type: hash; request: 3.972 seconds; completed: 2026-09-19T14:17:12.930273+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/d74fc53a2c47a37933bd.json).
Platform triage score: 20/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | MFMwUTBPME0wSzAJBgUrDgMCGgUABBRpD%2BQVZ%2B1vf7U0RGQGBm8JZwdxcgQUdKR2KRcYVIUxN75n5gZYwLzFBXICEgRSsdGCXQJklJZNbHi669GH4A%3D%3D.java |
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
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.

### `839e234a3a10b60d559ee5679d2019ad4e58d9cd66e6cfd971207c3c6ef8ea4d`

Type: hash; request: 4.625 seconds; completed: 2026-09-19T14:17:33.579014+00:00. Persistence reread identical: True.
[Public provider summary](../../enrichment/7fd5e33afe3cbed87b40.json).
Platform triage score: 20/100 (needs review); a heuristic priority, not calibrated probability. Graph: 1 nodes, 0 edges; local deeper-tier matches: 0/0.

| Provider | Outcome | Returned context / limitation |
|---|---|---|
| local-db | ok | Found 0 local IOC record(s). |
| virustotal | ok | No malicious detections in last analysis; 0 harmless, 61 undetected. |
| VirusTotal classification/name hints | unreviewed; may include benign filenames | fakeurl2.exe |
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
| T1055 | Process Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1055.011 | Extra Window Memory Injection | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1059 | Command and Scripting Interpreter | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1071 | Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1082 | System Information Discovery | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1095 | Non-Application Layer Protocol | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574 | Hijack Execution Flow | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |
| T1574.002 |  | virustotal (submitted indicator; provider-reported lead, not packet execution proof) |

No actor lead returned. This does not establish absence of an actor.


### Packet-to-provider evidence links

The live case contains 5 explicitly linked, exact-type/value PCAP observables. 3 retain frame references; remaining exported-object hashes retain native object IDs and capture-export provenance, **not an exact packet-frame map**. Every link retains the capture checksum, points to a saved provider investigation, and was reread from the real API. Case actor associations remain empty.
[Verified graph links](../../packet-enrichment-links/2024-11-26-updated.json).


### Current ATT&CK catalog and detection-strategy joins

These are read-only joins against the actual database, not generated detections or proof that the victim executed the technique. A valid catalog join cannot validate the original provider assertion.

| Technique | Current catalog match | Available detection strategies |
|---|---|---|
| T1027 | True | Behavioral Detection of Obfuscated Files or Information (x-mitre-detection-strategy--e3758cbb-5dd9-4aad-b848-0539a8c56307) |
| T1036 | True | Behavioral Detection of Masquerading Across Platforms via Metadata and Execution Discrepancy (x-mitre-detection-strategy--408aedab-4a23-41ad-809d-fe9c3805b7f6) |
| T1041 | True | Detection Strategy for Exfiltration Over C2 Channel (x-mitre-detection-strategy--beb3a98c-f1a4-434a-81e7-29d178b14db2) |
| T1055 | True | Behavioral Detection of Process Injection Across Platforms (x-mitre-detection-strategy--9833b57b-4c83-4f58-b4cf-76f041b29273) |
| T1055.011 | True | Detection Strategy for Extra Window Memory (EWM) Injection on Windows (x-mitre-detection-strategy--1a8d87f1-48ca-4929-a5cc-2b2a03983f12) |
| T1057 | True | Detection of Adversarial Process Discovery Behavior (x-mitre-detection-strategy--309ca3cd-d3f0-4aea-8932-558550aa89f4) |
| T1059 | True | Behavioral Detection of Command and Scripting Interpreter Abuse (x-mitre-detection-strategy--8582f5e6-44a5-4950-b7e8-a3e1b6d58d63) |
| T1059.001 | True | Abuse of PowerShell for Arbitrary Execution (x-mitre-detection-strategy--72b209e2-8c65-4217-8532-fabd0cb54ae5) |
| T1071 | True | Detection of Command and Control Over Application Layer Protocols (x-mitre-detection-strategy--155cab5b-c70b-4cfb-ba52-f62a21836b19) |
| T1074.001 | True | Detection of Local Data Staging Prior to Exfiltration (x-mitre-detection-strategy--e91165c5-e850-465e-9042-6ba82478b522) |
| T1082 | True | System Discovery via Native and Remote Utilities (x-mitre-detection-strategy--75161d5e-2b6d-4112-ab4d-338f70ea97f0) |
| T1095 | True | Detection of Non-Application Layer Protocols for C2 (x-mitre-detection-strategy--2cb544af-ef54-4376-9608-b399ad67d3d6) |
| T1204.002 | True | User Execution – Malicious File via download/open → spawn chain (T1204.002) (x-mitre-detection-strategy--e2023eb5-d813-4a08-985e-e8c998672037) |
| T1547.001 | True | Detect Registry and Startup Folder Persistence (Windows) (x-mitre-detection-strategy--8febbfe8-91ae-4625-8fc7-656639b90a11) |
| T1574 | True | Detection Strategy for Hijack Execution Flow across OS platforms. (x-mitre-detection-strategy--07669925-383b-455b-a3e2-3a79e18eed27) |
| T1574.002 | False | None returned |

| Prior analysis | Shared count | Example observations |
|---|---:|---|
| 616a90fa-f15e-4fcb-8d56-7b8e0eff5785 | 10 | code.jquery.com, edge.microsoft.com, fd.api.iris.microsoft.com, login.live.com, login.microsoftonline.com |
| 459e119d-191f-49e8-85ea-c78f9de41826 | 30 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, ctldl.windowsupdate.com |
| 7a2cfe72-f48d-4894-8a2d-8889cb3b11b2 | 46 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, armmf.adobe.com, assets.msn.com |
| 81373b30-6a59-49d1-89b0-bad73ed19eaa | 37 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, dns.msftncsi.com |
| 38851ad7-b3a0-423d-ae89-3b7be4e4b908 | 37 | acroipm2.adobe.com, api.msn.com, assets.msn.com, client.wns.windows.com, ctldl.windowsupdate.com |
| bfccc426-aa9b-4007-8558-a66d37ecb90c | 54 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, checkappexec.microsoft.com, client.wns.windows.com |

## Comparison with publisher answers and earlier runs

The following comparison is separate from native inference. It measures availability of selected facts, not 100% incident-diagnosis accuracy.

[Publisher answer](https://www.malware-traffic-analysis.net/2024/11/26/page2.html).

Native NetSupport User-Agent, cleartext port 443 and periodic callbacks support the tool identification. The delivery-chain explanation and malicious authorization context require the publisher or endpoint evidence. Shared site visits alone do not prove causation.

| Client | Field | Packet-verified expected value | Live |
|---|---|---|---|
| 10.11.26.183 | ip | 10.11.26.183 | True |
| 10.11.26.183 | mac | d0:57:7b:ce:fc:8b | True |
| 10.11.26.183 | hostname | DESKTOP-B8TQK49 | True |
| 10.11.26.183 | account | oboomwald | True |

Declared IOC subset available: 3/3. Not exhaustive recall.

- `194.180.191.64`: present
- `modandcrackedapk.com`: present
- `classicgrand.com`: present
- Reference conflict: published `194.180.191.164`, packet-supported `194.180.191.64`. Summary IOC conflicts with its own walkthrough and the packet destinations.

## Complete-flow checks and evidence links

Browser history/open, Markdown export and investigation transfer: True. Investigation ID: `19851c85-b03b-4655-bc64-64c6f1520100`.
Investigation transfers preserve a bounded preview, total count, source-analysis URL and hashes. Complete evidence remains server-side. TTP-overlap leads are not inserted into actor associations.
PDF export: HTTP 200, including an explicitly non-authoritative packet-evidence appendix. STIX export remains HTTP 409 until a human completes review/promotion; this is a successful safety check.
- [Full native JSON](api-upload.json), [independent database audit](database-audit.json), [native Markdown](NATIVE-REPORT.md), [PDF](pdf-export-fixed.pdf).
- [Browser screenshot](../../browser/2024-11-26.png), [investigation evidence](../../browser/2024-11-26-investigation.json).

## Follow-up priorities

Validate high/medium findings using frame/stream evidence; obtain process and endpoint telemetry for execution, persistence and credential-theft hypotheses. Provider data above is current-time external context, not historical execution evidence. Review shared-CDN matches for specificity. Do not execute exported objects or treat encrypted payload metadata as decrypted evidence.
