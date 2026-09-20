# 2024-08-15: AdversaryGraph live-instance PCAP report

Actual deployment: `[local-workspace]`, HTTP `[local-instance]`. This is a regression validation, not an independent blind trial. No malware was executed and no malicious endpoint was contacted.

## Executive assessment

Decoded 18189 packets across 75 IP endpoints and 698 transport flows. Observed 430 DNS events, 404 HTTP requests, 174 TLS ClientHello events, and 18 exported HTTP object(s). Deterministic rules produced 8 finding(s): 1 high, 0 medium, and 7 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

These findings identify observations and review priorities, not a proven malware family, actor, or causal infection chain. Source-frame evidence takes precedence over exercise answer typos.

## Capture and execution evidence

Capture window: 2024-08-15T00:09:43.804291+00:00 to 2024-08-15T00:42:26.009239+00:00 UTC.
Capture SHA-256: `e154de6895c5f0a9edd07b1279b33014507236dbb44a449790c255b87a327a3c`.
Analysis ID: `b79032a8-d69e-4ac1-bdd4-542473fa8e3b`; review session: `a894fbbc-d0d5-4309-bd04-2eda8773adfa`.
First real HTTP upload/analysis: **11.404 seconds**. Fresh uncached decoder repeat: **15.497 seconds**. Prior isolated upload: 11.553 seconds.
The fresh repeat ran while builds/tests were active; these timings are not a controlled performance comparison. Native packet analysis used **zero LLM calls and zero LLM tokens**. Coding-agent token usage was not instrumented.

Packet result equals prior isolated result: True; fresh repeat exact: True; retained capture checksum valid: True; API retrieval identical: True; idempotent upload: True.

## Internal host identities

| Address | MAC addresses | Frame-backed identities |
|---|---|---|
| 10.8.15.133 | 00:1c:bf:03:54:82 | account: desktop-h8alzbv$; account: plucero; full-name: Pierce Lucero; hostname: DESKTOP-H8ALZBV |
| 10.8.15.255 | ff:ff:ff:ff:ff:ff |  |
| 10.8.15.4 | 64:00:6a:8c:9c:40 |  |

## Evidence timeline

| UTC | Frame | Candidate observation |
|---|---:|---|
| 2024-08-15T00:09:44.316304+00:00 | 37 | low: Directory-service protocol activity |
| 2024-08-15T00:09:44.316590+00:00 | 39 | low: Directory-service protocol activity |
| 2024-08-15T00:09:44.978533+00:00 | 56 | low: Repeated unsuccessful DNS resolution |
| 2024-08-15T00:09:46.162496+00:00 | 281 | low: Directory-service protocol activity |
| 2024-08-15T00:09:46.162688+00:00 | 282 | low: Directory-service protocol activity |
| 2024-08-15T00:10:08.292494+00:00 | 1096 | low: Directory-service protocol activity |
| 2024-08-15T00:10:08.292835+00:00 | 1097 | low: Directory-service protocol activity |
| 2024-08-15T00:13:00.664378+00:00 | 11028 | high: Periodic HTTP callback pattern |

## Highest-volume conversations

Wire volume includes overhead/retransmissions. A large or periodic flow is not automatically exfiltration or C2.

| Initiator | Responder | Stream | Wire bytes | First frame |
|---|---|---|---:|---:|
| 10.8.15.133:49785 | 104.21.55.70:80 | tcp 112 | 2,892,579 | 6410 |
| 10.8.15.133:49800 | 172.67.170.159:443 | tcp 124 | 1,479,592 | 9028 |
| 10.8.15.133:63563 | 23.220.103.8:443 | udp 65 | 952,730 | 3860 |
| 10.8.15.133:49754 | 23.220.103.18:443 | tcp 81 | 701,923 | 2336 |
| 10.8.15.133:61658 | 23.220.103.72:443 | udp 118 | 578,979 | 12764 |
| 10.8.15.133:59301 | 23.220.103.18:443 | udp 41 | 347,296 | 3150 |
| 10.8.15.133:49819 | 72.5.43.29:80 | tcp 143 | 330,323 | 11038 |
| 10.8.15.133:49760 | 204.79.197.203:443 | tcp 87 | 257,540 | 3660 |
| 10.8.15.133:49803 | 199.232.210.172:80 | tcp 127 | 208,191 | 10195 |
| 10.8.15.133:49738 | 23.220.103.8:443 | tcp 65 | 175,864 | 1593 |
| 10.8.15.133:49810 | 72.5.43.29:80 | tcp 134 | 168,498 | 10598 |
| 10.8.15.133:49733 | 23.220.103.18:443 | tcp 60 | 163,401 | 1330 |
| 10.8.15.133:49768 | 23.53.13.203:443 | tcp 95 | 160,522 | 3859 |
| 10.8.15.133:49778 | 23.43.244.167:443 | tcp 105 | 152,645 | 5451 |
| 10.8.15.133:49763 | 20.42.72.131:443 | tcp 90 | 135,640 | 3830 |
| 10.8.15.133:49875 | 23.223.31.34:443 | tcp 199 | 111,676 | 12578 |
| 10.8.15.133:49781 | 20.42.72.131:443 | tcp 108 | 100,628 | 6207 |
| 10.8.15.133:49900 | 13.85.23.206:443 | tcp 224 | 99,351 | 13895 |
| 10.8.15.133:49939 | 23.56.233.15:443 | tcp 260 | 97,101 | 14528 |
| 10.8.15.133:49948 | 52.152.180.153:443 | tcp 269 | 80,446 | 14768 |

## Native packet findings, artifacts and limitations

# AdversaryGraph Deterministic PCAP Analysis

Source: 2024-08-15-traffic-analysis-exercise.pcap
Capture SHA-256: `e154de6895c5f0a9edd07b1279b33014507236dbb44a449790c255b87a327a3c`
Semantic result SHA-256: `f1e40c750b6946d0db5734f3fb390579d65b42e1dbb9cdd67b0a5c6d2f3174ab`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 18189 packets across 75 IP endpoints and 698 transport flows. Observed 430 DNS events, 404 HTTP requests, 174 TLS ClientHello events, and 18 exported HTTP object(s). Deterministic rules produced 8 finding(s): 1 high, 0 medium, and 7 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 18189
- Duration: 1962.204948 seconds
- Captured bytes: 11674125
- Endpoints: 75
- Flows: 698

## Deterministic findings

### HIGH — Periodic HTTP callback pattern

Repeated requests have a stable cadence consistent with automated callback or beacon behavior.

Rule: `periodic-http-callbacks@pcap-rules-v3`; confidence: 0.88; evidence: frame 11028 / TCP stream 142, frame 11505 / TCP stream 145, frame 11619 / TCP stream 151, frame 11688 / TCP stream 155, frame 11962 / TCP stream 164.

Metrics: `{"destination":"72.5.43.29","host":"72.5.43.29","median_absolute_deviation":1.037,"median_interval_seconds":5.685,"method":"GET","port":80,"request_count":303,"source":"10.8.15.133","uri":"/"}`

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 56, frame 60, frame 962, frame 964, frame 2106.

Metrics: `{"domain":"wpad.lafontainebleu.org","response_count":20,"source":"10.8.15.133"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 281 / TCP stream 11, frame 285 / TCP stream 11, frame 292 / TCP stream 11, frame 297 / TCP stream 11, frame 312 / TCP stream 11.

Metrics: `{"destination":"10.8.15.4","event_count":69,"operation_numbers":["0","1","12","13","30"],"protocol":"drsuapi","source":"10.8.15.133"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 37 / TCP stream 0, frame 288 / TCP stream 19, frame 295 / TCP stream 19, frame 300 / TCP stream 19, frame 304 / TCP stream 19.

Metrics: `{"destination":"10.8.15.4","event_count":143,"operation_numbers":["","0","2","3"],"protocol":"ldap","source":"10.8.15.133"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 1096 / TCP stream 1, frame 1098 / TCP stream 1, frame 1100 / TCP stream 1, frame 1102 / TCP stream 1, frame 1104 / TCP stream 1.

Metrics: `{"destination":"10.8.15.4","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.8.15.133"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 282 / TCP stream 11, frame 287 / TCP stream 11, frame 293 / TCP stream 11, frame 298 / TCP stream 11, frame 313 / TCP stream 11.

Metrics: `{"destination":"10.8.15.133","event_count":69,"operation_numbers":["0","1","12","13","30"],"protocol":"drsuapi","source":"10.8.15.4"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 39 / TCP stream 0, frame 290 / TCP stream 19, frame 299 / TCP stream 19, frame 302 / TCP stream 19, frame 305 / TCP stream 19.

Metrics: `{"destination":"10.8.15.133","event_count":113,"operation_numbers":["","1","4,19,19,19,5","4,5","5"],"protocol":"ldap","source":"10.8.15.4"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 1097 / TCP stream 1, frame 1099 / TCP stream 1, frame 1101 / TCP stream 1, frame 1103 / TCP stream 1, frame 1105 / TCP stream 1.

Metrics: `{"destination":"10.8.15.133","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.8.15.4"}`

## ATT&CK candidates

- T1071.001 Application Layer Protocol: Web Protocols (command-and-control), confidence=0.85, status=suggested; basis=versioned-deterministic-rule.

## Identities

- account: `desktop-h8alzbv$`; client IPs: 10.8.15.133; frames: 151, 166, 169, 173, 187
- account: `plucero`; client IPs: 10.8.15.133; frames: 975, 983, 985, 997, 1011
- full-name: `Pierce Lucero`; client IPs: 10.8.15.133; frames: 1111
- hostname: `DESKTOP-H8ALZBV`; client IPs: 10.8.15.133; frames: 1, 3, 5, 30, 58
- netbios-group: `LAFONTAINEBLEU`; client IPs: unbound subject; frames: 31, 57, 103, 447

## IOC and artifact candidates

- domain: `a1834.dscg2.akamai.net`; roles: dns-cname
- domain: `acroipm2.adobe.com`; roles: dns-query, http-host
- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `app-edge.smartscreen.microsoft.com`; roles: dns-query, tls-sni
- domain: `armmf.adobe.com`; roles: dns-query, tls-sni
- domain: `assets.msn.com`; roles: dns-query, tls-sni
- domain: `blob.mwh03prdstf02a.store.core.windows.net`; roles: dns-cname
- domain: `browser.events.data.msn.com`; roles: dns-query, tls-sni
- domain: `business.bing.com`; roles: dns-query, tls-sni
- domain: `business.checkfedexexp.com`; roles: dns-query, tls-sni
- domain: `bzib.nelreports.net`; roles: dns-query, tls-sni
- domain: `c-msn-com-nsatc.trafficmanager.net`; roles: dns-cname
- domain: `c-ring.msedge.net`; roles: dns-query, tls-sni
- domain: `c.bing.com`; roles: dns-query, tls-sni
- domain: `c.msn.com`; roles: dns-query, tls-sni
- domain: `client.wns.windows.com`; roles: dns-query, tls-sni
- domain: `cxcs.microsoft.net`; roles: dns-query, tls-sni
- domain: `default.exp-tas.com`; roles: dns-query, tls-sni
- domain: `displaycatalog.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `dl-edge.smartscreen.microsoft.com`; roles: dns-query
- domain: `dual-s-ring.msedge.net`; roles: dns-query, tls-sni
- domain: `ecn-us.dev.virtualearth.net`; roles: dns-query, tls-sni
- domain: `ecs.office.com`; roles: dns-query, tls-sni
- domain: `edge-consumer-static.azureedge.net`; roles: dns-query, tls-sni
- domain: `edge-microsoft-com.dual-a-0036.a-msedge.net`; roles: dns-cname
- domain: `edge.microsoft.com`; roles: dns-query, tls-sni
- domain: `edgeservices.bing.com`; roles: dns-query, tls-sni
- domain: `fd.api.iris.microsoft.com`; roles: dns-query, tls-sni
- domain: `fe2cr.update.microsoft.com`; roles: dns-query, tls-sni
- domain: `fe2cr.update.msft.com.trafficmanager.net`; roles: dns-cname
- domain: `fe3cr.delivery.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `fp.msedge.net`; roles: dns-query, tls-sni
- domain: `g.live.com`; roles: dns-query, tls-sni
- domain: `go.microsoft.com`; roles: dns-query, tls-sni
- domain: `img-s-msn-com.akamaized.net`; roles: dns-query, tls-sni
- domain: `img.s-msn.com`; roles: dns-query, tls-sni
- domain: `licensing.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `login.microsoftonline.com`; roles: dns-query, tls-sni
- domain: `mobile.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `mrodevicemgr.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `msedge.b.tlu.dl.delivery.mp.microsoft.com`; roles: dns-query, http-host
- domain: `nav-edge.smartscreen.microsoft.com`; roles: dns-query, tls-sni
- domain: `nav.smartscreen.microsoft.com`; roles: dns-query, tls-sni
- domain: `ntp.msn.com`; roles: dns-query, tls-sni
- domain: `odc.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `officeclient.microsoft.com`; roles: dns-query, tls-sni
- domain: `oneclient.sfx.ms`; roles: dns-query, tls-sni
- domain: `oneocsp.microsoft.com`; roles: dns-query, http-host
- domain: `ow1.res.office365.com`; roles: dns-query, tls-sni
- domain: `prod.mrodevicemgr.live.com.akadns.net`; roles: dns-cname
- domain: `pti.store.microsoft.com`; roles: dns-query
- domain: `quote.checkfedexexp.com`; roles: dns-query, http-host
- domain: `r-msftstatic-com.a-0016.a-msedge.net`; roles: dns-cname
- domain: `r.bing.com`; roles: dns-query, tls-sni
- domain: `r.msftstatic.com`; roles: dns-query, tls-sni
- domain: `sb.scorecardresearch.com`; roles: dns-query, tls-sni
- domain: `settings-win.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `srtb.msn.com`; roles: dns-query, tls-sni
- domain: `storecatalogrevocation.storequality.microsoft.com`; roles: dns-query, tls-sni
- domain: `th.bing.com`; roles: dns-query, tls-sni
- domain: `v10.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `v20.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `weathermapdata.blob.core.windows.net`; roles: dns-query, tls-sni
- domain: `win-jegjix7q9rs.lafontainebleu.org`; roles: dns-query
- domain: `windows.msn.com`; roles: dns-query, tls-sni
- domain: `wns.notify.trafficmanager.net`; roles: dns-cname
- domain: `wpad.lafontainebleu.org`; roles: dns-query
- domain: `www.bing.com`; roles: dns-query, tls-sni
- domain: `www.msftconnecttest.com`; roles: dns-query, http-host
- domain: `www.msn.com`; roles: dns-query, tls-sni
- ipv4: `0.0.0.0`; roles: network-endpoint
- ipv4: `10.8.15.133`; roles: network-endpoint
- ipv4: `10.8.15.255`; roles: network-endpoint
- ipv4: `10.8.15.4`; roles: dns-answer, network-endpoint
- ipv4: `104.21.55.70`; roles: dns-answer, network-endpoint
- ipv4: `104.40.82.182`; roles: dns-answer, network-endpoint
- ipv4: `13.107.21.237`; roles: dns-answer, network-endpoint
- ipv4: `13.107.21.239`; roles: dns-answer, network-endpoint
- ipv4: `13.107.246.57`; roles: dns-answer, network-endpoint
- ipv4: `13.107.4.254`; roles: dns-answer, network-endpoint
- ipv4: `13.107.5.93`; roles: dns-answer, network-endpoint
- ipv4: `13.107.6.158`; roles: dns-answer, network-endpoint
- ipv4: `13.70.79.200`; roles: dns-answer, network-endpoint
- ipv4: `13.85.23.206`; roles: dns-answer, network-endpoint
- ipv4: `13.89.179.13`; roles: dns-answer, network-endpoint
- ipv4: `172.67.170.159`; roles: dns-answer, network-endpoint
- ipv4: `18.160.156.115`; roles: dns-answer, network-endpoint
- ipv4: `18.160.156.14`; roles: dns-answer
- ipv4: `18.160.156.41`; roles: dns-answer
- ipv4: `18.160.156.89`; roles: dns-answer
- ipv4: `199.232.210.172`; roles: dns-answer, network-endpoint
- ipv4: `199.232.214.172`; roles: dns-answer
- ipv4: `20.10.31.115`; roles: dns-answer, network-endpoint
- ipv4: `20.125.209.212`; roles: dns-answer, network-endpoint
- ipv4: `20.163.45.186`; roles: dns-answer
- ipv4: `20.189.173.9`; roles: dns-answer, network-endpoint
- ipv4: `20.190.157.9`; roles: dns-answer
- ipv4: `20.241.44.114`; roles: dns-answer, network-endpoint
- ipv4: `20.25.227.174`; roles: dns-answer, network-endpoint
- ipv4: `20.3.0.251`; roles: dns-answer, network-endpoint
- ipv4: `20.42.65.88`; roles: dns-answer, network-endpoint
- ipv4: `20.42.65.94`; roles: dns-answer, network-endpoint
- ipv4: `20.42.72.131`; roles: dns-answer, network-endpoint
- ipv4: `20.44.10.122`; roles: dns-answer, network-endpoint
- ipv4: `20.60.228.1`; roles: dns-answer, network-endpoint
- ipv4: `20.96.153.111`; roles: dns-answer, network-endpoint
- ipv4: `20.99.184.37`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.203`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.219`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.222`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.237`; roles: dns-answer
- ipv4: `204.79.197.239`; roles: dns-answer, network-endpoint
- ipv4: `224.0.0.22`; roles: network-endpoint
- ipv4: `224.0.0.251`; roles: network-endpoint
- ipv4: `224.0.0.252`; roles: network-endpoint
- ipv4: `23.194.68.140`; roles: dns-answer, network-endpoint
- ipv4: `23.195.200.230`; roles: dns-answer, network-endpoint
- ipv4: `23.205.110.12`; roles: dns-answer, network-endpoint
- ipv4: `23.205.110.48`; roles: dns-answer, network-endpoint
- ipv4: `23.205.110.59`; roles: dns-answer
- ipv4: `23.205.110.62`; roles: dns-answer
- ipv4: `23.215.55.139`; roles: dns-answer, network-endpoint
- ipv4: `23.215.55.144`; roles: dns-answer
- ipv4: `23.220.103.18`; roles: dns-answer, network-endpoint
- ipv4: `23.220.103.72`; roles: dns-answer, network-endpoint
- ipv4: `23.220.103.78`; roles: dns-answer
- ipv4: `23.220.103.8`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.196`; roles: dns-answer
- ipv4: `23.220.251.208`; roles: dns-answer, network-endpoint
- ipv4: `23.221.36.164`; roles: dns-answer, network-endpoint
- ipv4: `23.223.31.29`; roles: dns-answer
- ipv4: `23.223.31.31`; roles: dns-answer
- ipv4: `23.223.31.32`; roles: dns-answer
- ipv4: `23.223.31.33`; roles: dns-answer
- ipv4: `23.223.31.34`; roles: dns-answer, network-endpoint
- ipv4: `23.223.31.36`; roles: dns-answer
- ipv4: `23.223.31.37`; roles: dns-answer
- ipv4: `23.223.31.39`; roles: dns-answer
- ipv4: `23.223.31.40`; roles: dns-answer
- ipv4: `23.33.138.184`; roles: dns-answer, network-endpoint
- ipv4: `23.43.244.167`; roles: dns-answer, network-endpoint
- ipv4: `23.53.13.196`; roles: dns-answer, network-endpoint
- ipv4: `23.53.13.197`; roles: dns-answer, network-endpoint
- ipv4: `23.53.13.198`; roles: dns-answer
- ipv4: `23.53.13.199`; roles: dns-answer
- ipv4: `23.53.13.200`; roles: dns-answer
- ipv4: `23.53.13.202`; roles: dns-answer
- ipv4: `23.53.13.203`; roles: dns-answer, network-endpoint
- ipv4: `23.53.13.204`; roles: dns-answer
- ipv4: `23.53.13.205`; roles: dns-answer, network-endpoint
- ipv4: `23.53.13.206`; roles: dns-answer
- ipv4: `23.53.13.207`; roles: dns-answer
- ipv4: `23.53.13.208`; roles: dns-answer
- ipv4: `23.56.233.15`; roles: dns-answer, network-endpoint
- ipv4: `23.60.57.94`; roles: dns-answer, network-endpoint
- ipv4: `23.63.205.134`; roles: dns-answer, network-endpoint
- ipv4: `23.96.180.189`; roles: dns-answer, network-endpoint
- ipv4: `239.255.255.250`; roles: http-host, network-endpoint
- ipv4: `255.255.255.255`; roles: network-endpoint
- ipv4: `40.126.29.10`; roles: dns-answer, network-endpoint
- ipv4: `40.126.29.11`; roles: dns-answer
- ipv4: `40.126.29.12`; roles: dns-answer
- ipv4: `40.126.29.13`; roles: dns-answer, network-endpoint
- ipv4: `40.126.29.15`; roles: dns-answer
- ipv4: `40.126.29.5`; roles: dns-answer, network-endpoint
- ipv4: `40.126.29.6`; roles: dns-answer
- ipv4: `40.126.29.7`; roles: dns-answer
- ipv4: `40.126.29.8`; roles: dns-answer
- ipv4: `40.126.29.9`; roles: dns-answer
- ipv4: `51.116.253.170`; roles: dns-answer, network-endpoint
- ipv4: `52.109.0.136`; roles: dns-answer, network-endpoint
- ipv4: `52.109.0.142`; roles: dns-answer, network-endpoint
- ipv4: `52.109.20.38`; roles: dns-answer, network-endpoint
- ipv4: `52.113.194.132`; roles: dns-answer, network-endpoint
- ipv4: `52.123.128.254`; roles: dns-answer, network-endpoint
- ipv4: `52.123.129.254`; roles: dns-answer
- ipv4: `52.137.106.217`; roles: dns-answer, network-endpoint
- ipv4: `52.152.180.153`; roles: dns-answer, network-endpoint
- ipv4: `52.168.117.170`; roles: dns-answer, network-endpoint
- ipv4: `52.182.143.215`; roles: dns-answer, network-endpoint
- ipv4: `72.5.43.29`; roles: http-host, network-endpoint
- ja3: `08c552d3bb717cfa625b1c2e6293fbc3`; roles: tls-client-fingerprint
- ja3: `091f51a7a1c3a4504a224cc081ce9cee`; roles: tls-client-fingerprint
- ja3: `09218b185cadc5bc9ac32dd4af1d80ba`; roles: tls-client-fingerprint
- ja3: `0940eef199c4e4a2d7fff1702ca8e267`; roles: tls-client-fingerprint
- ja3: `09d2a38ae19e8be7fa018ad87e43b2ff`; roles: tls-client-fingerprint
- ja3: `11156bf1dc969c54ae91bbfe52874a88`; roles: tls-client-fingerprint
- ja3: `11702f6f4b7b9c9b2999ebcf2c354984`; roles: tls-client-fingerprint
- ja3: `173448d57b47fba3f0be89e6bd4599af`; roles: tls-client-fingerprint
- ja3: `218b9f26907447fdbf2c8a52418444b7`; roles: tls-client-fingerprint
- ja3: `22833c8ba3c4d8d22ef4b3ff2fdd992e`; roles: tls-client-fingerprint
- ja3: `258a5a1e95b8a911872bae9081526644`; roles: tls-client-fingerprint
- ja3: `25e0b3677a2832677e0c136c73a02311`; roles: tls-client-fingerprint
- ja3: `26abc27bb714c3e30049154ed7f03422`; roles: tls-client-fingerprint
- ja3: `2f7a1c53b0a1abfffcdeff101f69baf4`; roles: tls-client-fingerprint
- ja3: `33717d60eef91a9c824c343c9b904387`; roles: tls-client-fingerprint
- ja3: `34f7d1c3fe8b7bb4b8cee1ceefa986a5`; roles: tls-client-fingerprint
- ja3: `38ff17125ac547fdaf43cbc78d13056e`; roles: tls-client-fingerprint
- ja3: `3c293bdf2a25c07559b560ba86debc77`; roles: tls-client-fingerprint
- ja3: `3c4eb72b882d4d1442c67ce73f1292a9`; roles: tls-client-fingerprint
- ja3: `3ec074ef84f1118c439e56727227cea3`; roles: tls-client-fingerprint
- ja3: `46a78af27de56cd4c85b04f57deb3f79`; roles: tls-client-fingerprint
- ja3: `46f5131e766d248db0248a86c494b71c`; roles: tls-client-fingerprint
- ja3: `48ae6b908317f4f14e23cfd06798d78a`; roles: tls-client-fingerprint
- ja3: `49122e3f86717743d247b0e57255881e`; roles: tls-client-fingerprint
- ja3: `49a844a20d27ed5590377789c1ff9a1c`; roles: tls-client-fingerprint
- ja3: `4d09d5e0a7539f71bfd5ab61fc77938e`; roles: tls-client-fingerprint
- ja3: `4e00cf4e4608830803d4914864014e8c`; roles: tls-client-fingerprint
- ja3: `4e96df7dcbca32c279f0af5a0930aa87`; roles: tls-client-fingerprint
- ja3: `589c33f5c966de68b38bf824fc667e6b`; roles: tls-client-fingerprint
- ja3: `5919f6108f098e14c2f37619021ebd4d`; roles: tls-client-fingerprint
- ja3: `5c263245de4d50106d8e0d6087b0fcc5`; roles: tls-client-fingerprint
- ja3: `5c576ee905a82c07ad7987fce4f39cfe`; roles: tls-client-fingerprint
- ja3: `65005c9d9ae0f0ebeaf22c210571d482`; roles: tls-client-fingerprint
- ja3: `68b1b54a6edfe7729708738380263a3a`; roles: tls-client-fingerprint
- ja3: `6925f81e11a98d706da3f0cd0f7bc648`; roles: tls-client-fingerprint
- ja3: `6a5d235ee78c6aede6a61448b4e9ff1e`; roles: tls-client-fingerprint
- ja3: `736a3b58b94abd6c394392ae94f501c3`; roles: tls-client-fingerprint
- ja3: `775ceba0b13f74a42447a14045d31fcc`; roles: tls-client-fingerprint
- ja3: `973e5ee0c53bfc4aaff964c70002dcc3`; roles: tls-client-fingerprint
- ja3: `a2fa4f21077551ea651d383707835d7b`; roles: tls-client-fingerprint
- ja3: `ab9d07f6268ed23da4f708263cc7ed49`; roles: tls-client-fingerprint
- ja3: `af8bdb53babadf751a582d1ed25c0eda`; roles: tls-client-fingerprint
- ja3: `b1e1912cc21fd3c163c8ddf91f56123a`; roles: tls-client-fingerprint
- ja3: `b4162be74fb260b4576b62481ee819de`; roles: tls-client-fingerprint
- ja3: `b74979b1b06e1413e302d2c817ca33db`; roles: tls-client-fingerprint
- ja3: `b7e6d0a42505ebdcb4ca793e16825d04`; roles: tls-client-fingerprint
- ja3: `c44656a187a470fa1e85dfc1707da993`; roles: tls-client-fingerprint
- ja3: `c6e2484ca73f97e2cbb72bacc9c9916b`; roles: tls-client-fingerprint
- ja3: `cd51c3a587eeacaf4f714e3920764550`; roles: tls-client-fingerprint
- ja3: `d108c2f321a2af5781ed4b63b5b28472`; roles: tls-client-fingerprint
- ja3: `e978fa4306e6fe19e2d404321d215b00`; roles: tls-client-fingerprint
- ja3: `eb6eb038162eb12fda714a4a5860dc83`; roles: tls-client-fingerprint
- ja3: `ec93fbad48fbc839a6e52e85c3f5af8d`; roles: tls-client-fingerprint
- ja3: `f0a0d117d2207afbb65df9114a8c6321`; roles: tls-client-fingerprint
- ja3: `f957ed04f16c95c78f474482505d5e89`; roles: tls-client-fingerprint
- ja3: `fc2ac8b293f08f588c5b93dd8b87eef6`; roles: tls-client-fingerprint
- ja3: `fe624dd6795521519b6fbbd082375f4f`; roles: tls-client-fingerprint
- sha256: `0078330840159b7adc1ec144a36905642a0469d68c4879febf76dbda26ffd5b2`; roles: exported-object
- sha256: `261daf6d8ef4a2ea145dbcd589a3808af3d734af40319248dbf81746bab0f594`; roles: exported-object
- sha256: `2ba81673f8cd827df283ad30f52bcaa0514fc065fef4398dafed3a0f612517f6`; roles: exported-object
- sha256: `41e87d5cfc89b6168dd794c2b32cdf83bff7fe164a603416d5d7d7e399109c9b`; roles: exported-object
- sha256: `5e4b21db2742377a82d65f7553eb8d183f781a561ff60f9421baee33b743fac4`; roles: exported-object
- sha256: `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; roles: exported-object
- sha256: `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; roles: exported-object
- sha256: `6a42906135e357167d748aee9f36cb40bf5ba4584e85e7e1df4433ee8f38680c`; roles: exported-object
- sha256: `798563fcf7600f7ef1a35996291a9dfb5f9902733404dd499e2e736ea1dc6fc5`; roles: exported-object
- sha256: `8fcd6135214262cc9ef17efb67055b2a1baa9036a22325d8679192683c025e47`; roles: exported-object
- sha256: `9579dca191a7420bab906998ffd624709de7deda27481b53f6da693765f03499`; roles: exported-object
- sha256: `b7aec5f73d2a6bbd8cd920edb4760e2edadc98c3a45bf4fa994d47ca9cbd02f6`; roles: exported-object
- sha256: `be2882b8c36a2a65594e72f3cedb87b34523d2a8b13e23e902c4cd952a0a4252`; roles: exported-object
- sha256: `c54e6bd06d5c09a075e274a55c6d3ce31a2fabebbea38ce7083a9ebb7034a110`; roles: exported-object
- sha256: `dff7255b90139fbc8d3e76f31b480e65fc3eb7f49f70e7876cfb3f1cb56e5123`; roles: exported-object
- sha256: `f300d3238190768cae396cbc02636955abc1d8d2a1d9cf2b27bbd1a4d691ea64`; roles: exported-object
- sha256: `f394b14f8fb0b1d746f13e2acb5921e4c5962984836c1187147e341fcb693b0e`; roles: exported-object
- sha256: `f8313d5ec5090e37e52eef9455de8085810a8362db2e1226f3dc42f747651332`; roles: exported-object
- url: `http://239.255.255.250:1900*`; roles: http-request
- url: `http://72.5.43.29/`; roles: http-request
- url: `http://72.5.43.29/data/0f60a3e7baecf2748b1c8183ed37d1e4`; roles: http-request
- url: `http://acroipm2.adobe.com/assets/Owner/arm/ProcessMAU.txt`; roles: http-request
- url: `http://msedge.b.tlu.dl.delivery.mp.microsoft.com/filestreamingservice/files/8f2381c2-652d-48a2-86f6-19cb7757f5dc?P1=1724113284&P2=404&P3=2&P4=QwGPFdJVa%2bBw71q1beBnqYWdAtr86AnZ79l2%2fNOX9l1PkiMLSVObKUK4QmaPqxVAgCpCljWyTVtZO9mpmuJNlQ%3d%3d`; roles: http-request
- url: `http://msedge.b.tlu.dl.delivery.mp.microsoft.com/filestreamingservice/files/f37dd878-a1b9-4f21-a8c9-65c3dd00f7a6?P1=1724225867&P2=404&P3=2&P4=IaxXE3ikzdIKvQz1E1qPcLRRfyHtwqWgjE0YDO8CsvKt6Jcq94KnSHhjEOc1Vkk62%2budS1LrVl%2btTvm0Hctz%2bA%3d%3d`; roles: http-request
- url: `http://oneocsp.microsoft.com/ocsp/MFQwUjBQME4wTDAJBgUrDgMCGgUABBR2JNtr0JxEvYySpbyBWaqBmealCgQUzhUWO%2BoCo6Zr2tkr%2FeWMUr56UKgCEzMAPnPpacmgFoSqVQMAAAA%2Bc%2Bk%3D`; roles: http-request
- url: `http://quote.checkfedexexp.com/managements?16553a25e45250a41fd5&endeds=MIGpq&JStx=59bf050d37df88a9-ade43358-eaa1220b-0571422b-0f33e6aa150e86bafd0ed4&Ld=9d7502d88d752a27b1d00587309184b5a215`; roles: http-request
- url: `http://www.msftconnecttest.com/connecttest.txt`; roles: http-request
- user_agent: `Microsoft BITS/7.8`; roles: http-client
- user_agent: `Microsoft Edge/127.0.2651.98 Windows`; roles: http-client
- user_agent: `Microsoft NCSI`; roles: http-client
- user_agent: `Microsoft-CryptoAPI/10.0`; roles: http-client
- user_agent: `Mozilla / 5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705)`; roles: http-client
- user_agent: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E)`; roles: http-client
- user_agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0`; roles: http-client
- exported object `managements%3f16553a25e45250a41fd5&endeds=MIGpq&JStx=59bf050d37df88a9-ade43358-eaa1220b-0571422b-0f33e6aa150e86bafd0ed4&Ld=9d7502d88d752a27b1d00587309184b5a215`; SHA-256 `798563fcf7600f7ef1a35996291a9dfb5f9902733404dd499e2e736ea1dc6fc5`; size 2767804 bytes
  Static content: `{"content_kind":"zip","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `0f60a3e7baecf2748b1c8183ed37d1e4`; SHA-256 `b7aec5f73d2a6bbd8cd920edb4760e2edadc98c3a45bf4fa994d47ca9cbd02f6`; size 159232 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":159232,"inspection_truncated":false,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `%2f(3)`; SHA-256 `261daf6d8ef4a2ea145dbcd589a3808af3d734af40319248dbf81746bab0f594`; size 305148 bytes
- exported object `f37dd878-a1b9-4f21-a8c9-65c3dd00f7a6%3fP1=1724225867&P2=404&P3=2&P4=IaxXE3ikzdIKvQz1E1qPcLRRfyHtwqWgjE0YDO8CsvKt6Jcq94KnSHhjEOc1Vkk62%2budS1LrVl%2btTvm0Hctz%2bA%3d%3d(3)`; SHA-256 `8fcd6135214262cc9ef17efb67055b2a1baa9036a22325d8679192683c025e47`; size 108543 bytes
- exported object `f37dd878-a1b9-4f21-a8c9-65c3dd00f7a6%3fP1=1724225867&P2=404&P3=2&P4=IaxXE3ikzdIKvQz1E1qPcLRRfyHtwqWgjE0YDO8CsvKt6Jcq94KnSHhjEOc1Vkk62%2budS1LrVl%2btTvm0Hctz%2bA%3d%3d(2)`; SHA-256 `6a42906135e357167d748aee9f36cb40bf5ba4584e85e7e1df4433ee8f38680c`; size 29990 bytes
- exported object `f37dd878-a1b9-4f21-a8c9-65c3dd00f7a6%3fP1=1724225867&P2=404&P3=2&P4=IaxXE3ikzdIKvQz1E1qPcLRRfyHtwqWgjE0YDO8CsvKt6Jcq94KnSHhjEOc1Vkk62%2budS1LrVl%2btTvm0Hctz%2bA%3d%3d`; SHA-256 `f8313d5ec5090e37e52eef9455de8085810a8362db2e1226f3dc42f747651332`; size 18882 bytes
- exported object `f37dd878-a1b9-4f21-a8c9-65c3dd00f7a6%3fP1=1724225867&P2=404&P3=2&P4=IaxXE3ikzdIKvQz1E1qPcLRRfyHtwqWgjE0YDO8CsvKt6Jcq94KnSHhjEOc1Vkk62%2budS1LrVl%2btTvm0Hctz%2bA%3d%3d(1)`; SHA-256 `be2882b8c36a2a65594e72f3cedb87b34523d2a8b13e23e902c4cd952a0a4252`; size 13809 bytes
- exported object `8f2381c2-652d-48a2-86f6-19cb7757f5dc%3fP1=1724113284&P2=404&P3=2&P4=QwGPFdJVa%2bBw71q1beBnqYWdAtr86AnZ79l2%2fNOX9l1PkiMLSVObKUK4QmaPqxVAgCpCljWyTVtZO9mpmuJNlQ%3d%3d(3)`; SHA-256 `9579dca191a7420bab906998ffd624709de7deda27481b53f6da693765f03499`; size 7930 bytes
- exported object `8f2381c2-652d-48a2-86f6-19cb7757f5dc%3fP1=1724113284&P2=404&P3=2&P4=QwGPFdJVa%2bBw71q1beBnqYWdAtr86AnZ79l2%2fNOX9l1PkiMLSVObKUK4QmaPqxVAgCpCljWyTVtZO9mpmuJNlQ%3d%3d(2)`; SHA-256 `41e87d5cfc89b6168dd794c2b32cdf83bff7fe164a603416d5d7d7e399109c9b`; size 4630 bytes
- exported object `MFQwUjBQME4wTDAJBgUrDgMCGgUABBR2JNtr0JxEvYySpbyBWaqBmealCgQUzhUWO%2BoCo6Zr2tkr%2FeWMUr56UKgCEzMAPnPpacmgFoSqVQMAAAA%2Bc%2Bk%3D`; SHA-256 `2ba81673f8cd827df283ad30f52bcaa0514fc065fef4398dafed3a0f612517f6`; size 1782 bytes
- exported object `8f2381c2-652d-48a2-86f6-19cb7757f5dc%3fP1=1724113284&P2=404&P3=2&P4=QwGPFdJVa%2bBw71q1beBnqYWdAtr86AnZ79l2%2fNOX9l1PkiMLSVObKUK4QmaPqxVAgCpCljWyTVtZO9mpmuJNlQ%3d%3d(1)`; SHA-256 `0078330840159b7adc1ec144a36905642a0469d68c4879febf76dbda26ffd5b2`; size 1340 bytes
- exported object `8f2381c2-652d-48a2-86f6-19cb7757f5dc%3fP1=1724113284&P2=404&P3=2&P4=QwGPFdJVa%2bBw71q1beBnqYWdAtr86AnZ79l2%2fNOX9l1PkiMLSVObKUK4QmaPqxVAgCpCljWyTVtZO9mpmuJNlQ%3d%3d`; SHA-256 `c54e6bd06d5c09a075e274a55c6d3ce31a2fabebbea38ce7083a9ebb7034a110`; size 1120 bytes
- exported object `%2f(5)`; SHA-256 `f300d3238190768cae396cbc02636955abc1d8d2a1d9cf2b27bbd1a4d691ea64`; size 732 bytes
- exported object `%2f(1)`; SHA-256 `5e4b21db2742377a82d65f7553eb8d183f781a561ff60f9421baee33b743fac4`; size 124 bytes
- exported object `%2f(10)`; SHA-256 `f394b14f8fb0b1d746f13e2acb5921e4c5962984836c1187147e341fcb693b0e`; size 94 bytes
- exported object `%2f`; SHA-256 `dff7255b90139fbc8d3e76f31b480e65fc3eb7f49f70e7876cfb3f1cb56e5123`; size 32 bytes
- exported object `connecttest.txt`; SHA-256 `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; size 22 bytes
- exported object `ProcessMAU.txt`; SHA-256 `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; size 4 bytes

## Actor similarity leads

- Orangeworm (G0071): 50% TTP overlap. This is an investigation lead, not attribution.
- SilverTerrier (G0083): 25% TTP overlap. This is an investigation lead, not attribution.
- RedEcho (G1042): 20% TTP overlap. This is an investigation lead, not attribution.
- Metador (G1013): 11% TTP overlap. This is an investigation lead, not attribution.
- Rancor (G0075): 11% TTP overlap. This is an investigation lead, not attribution.
- APT18 (G0026): 8% TTP overlap. This is an investigation lead, not attribution.
- FIN4 (G0085): 8% TTP overlap. This is an investigation lead, not attribution.
- Dark Caracal (G0070): 8% TTP overlap. This is an investigation lead, not attribution.
- TA551 (G0127): 7% TTP overlap. This is an investigation lead, not attribution.
- BITTER (G1002): 6% TTP overlap. This is an investigation lead, not attribution.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `d16753b47de8ecdb023abba50189bbcdbc68cf5a1d4b318a005b594ca7c48206`; recorded 2026-09-19T12:08:57.190731+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":272,"observable_limit":5000,"observables_checked":272,"observables_total":272,"prior_case_limit_reached":false,"prior_cases_checked":8,"truncated":false}`

- Catalog T1071.001: https://attack.mitre.org/techniques/T1071/001; detection strategies: [{"attack_id":"DET0027","name":"Detection of Web Protocol-Based C2 Over HTTP, HTTPS, or WebSockets","stix_id":"x-mitre-detection-strategy--e6496b9b-2458-4616-9712-a7c0da7fd3bc"}]
- Prior analysis `faf041c3-70e0-4a01-8780-10917e5e187c` shares 42 observations. This does not establish a common campaign.
- Prior analysis `08324647-35af-4af2-8d82-4387eec03918` shares 46 observations. This does not establish a common campaign.
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 12 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 33 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 53 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 37 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 36 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 69 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":0,"complete":true,"detailed_objects":18,"exported_objects":322,"hashed_bytes":3449794,"hashed_objects":322,"omitted_unique_hashes":0,"returned_unique_hashes":18,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":18}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 8/8, identities 5/5, observables 272/272, artifacts 18/18. Full returned inventory is in the JSON result.


## Live enrichment and correlation validation

The actual IOC library contained 156,125 records. Exact typed matches: **0**; source actor assertions: **0**. Independent SQL agrees: IOC=True, actors=True.
A miss is unknown in this corpus, not evidence of benignness. The earlier isolated corpus included publisher-reference records; its positive matches were not live-provider detections and are not comparable to natural coverage here.
ATT&CK catalog candidates: 1; current-version catalog checks passed: True. Detection-strategy joins were checked independently.
Cross-case links: 8; independently verified: True. These are shared observations, predominantly common service infrastructure, not common-campaign assertions.

| Passive local lookup target | Type | Local matches |
|---|---|---:|
| `104.21.55.70` | ipv4 | 0 |
| `172.67.170.159` | ipv4 | 0 |
| `quote.checkfedexexp.com` | domain | 0 |
| `business.checkfedexexp.com` | domain | 0 |
| `798563fcf7600f7ef1a35996291a9dfb5f9902733404dd499e2e736ea1dc6fc5` | sha256 | 0 |
| `b7aec5f73d2a6bbd8cd920edb4760e2edadc98c3a45bf4fa994d47ca9cbd02f6` | sha256 | 0 |

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

| Prior analysis | Shared count | Example observations |
|---|---:|---|
| faf041c3-70e0-4a01-8780-10917e5e187c | 42 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, assets.msn.com, blob.mwh03prdstf02a.store.core.windows.net |
| 08324647-35af-4af2-8d82-4387eec03918 | 46 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, armmf.adobe.com, assets.msn.com |
| 616a90fa-f15e-4fcb-8d56-7b8e0eff5785 | 12 | browser.events.data.msn.com, edge.microsoft.com, fd.api.iris.microsoft.com, login.microsoftonline.com, mobile.events.data.microsoft.com |
| 459e119d-191f-49e8-85ea-c78f9de41826 | 33 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, ecs.office.com |
| 7a2cfe72-f48d-4894-8a2d-8889cb3b11b2 | 53 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, armmf.adobe.com, assets.msn.com |
| 81373b30-6a59-49d1-89b0-bad73ed19eaa | 37 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, ecs.office.com |
| 38851ad7-b3a0-423d-ae89-3b7be4e4b908 | 36 | acroipm2.adobe.com, api.msn.com, assets.msn.com, client.wns.windows.com, ecs.office.com |
| bfccc426-aa9b-4007-8558-a66d37ecb90c | 69 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, browser.events.data.msn.com, c.bing.com |

## Comparison with publisher answers and earlier runs

The following comparison is separate from native inference. It measures availability of selected facts, not 100% incident-diagnosis accuracy.

[Publisher answer](https://www.malware-traffic-analysis.net/2024/08/15/page2.html).

The downloaded ZIP/DLL hashes and callback evidence are available, but the JavaScript child hash requires safe archive extraction outside this decoder's no-unpacking profile. The encrypted follow-up URL path and WarmCookie classification are publisher context, not independent packet conclusions.

| Client | Field | Packet-verified expected value | Live |
|---|---|---|---|
| 10.8.15.133 | ip | 10.8.15.133 | True |
| 10.8.15.133 | mac | 00:1c:bf:03:54:82 | True |
| 10.8.15.133 | hostname | DESKTOP-H8ALZBV | True |
| 10.8.15.133 | account | plucero | True |

Declared IOC subset available: 7/8. Not exhaustive recall.

- `104.21.55.70`: present
- `172.67.170.159`: present
- `72.5.43.29`: present
- `quote.checkfedexexp.com`: present
- `business.checkfedexexp.com`: present
- `798563fcf7600f7ef1a35996291a9dfb5f9902733404dd499e2e736ea1dc6fc5`: present
- `dab98819d1d7677a60f5d06be210d45b74ae5fd8cf0c24ec1b3766e25ce6dc2c`: not recovered
- `b7aec5f73d2a6bbd8cd920edb4760e2edadc98c3a45bf4fa994d47ca9cbd02f6`: present
- Reference conflict: published `172.67.170.169`, packet-supported `172.67.170.159`. Packet TLS/flow evidence uses .159. The published full HTTPS path is not visible from encrypted PCAP metadata.

## Complete-flow checks and evidence links

Browser history/open, Markdown export and investigation transfer: True. Investigation ID: `0d46927d-003d-4d7f-bc0d-3e85ca1411b9`.
Investigation transfers preserve a bounded preview, total count, source-analysis URL and hashes. Complete evidence remains server-side. TTP-overlap leads are not inserted into actor associations.
PDF export: HTTP 200, including an explicitly non-authoritative packet-evidence appendix. STIX export remains HTTP 409 until a human completes review/promotion; this is a successful safety check.
- [Full native JSON](api-upload.json), [independent database audit](database-audit.json), [native Markdown](NATIVE-REPORT.md), [PDF](pdf-export-fixed.pdf).
- [Browser screenshot](../../browser/2024-08-15.png), [investigation evidence](../../browser/2024-08-15-investigation.json).

## Follow-up priorities

Validate high/medium findings using frame/stream evidence; obtain process and endpoint telemetry for execution, persistence and credential-theft hypotheses. Provider data above is current-time external context, not historical execution evidence. Review shared-CDN matches for specificity. Do not execute exported objects or treat encrypted payload metadata as decrypted evidence.
