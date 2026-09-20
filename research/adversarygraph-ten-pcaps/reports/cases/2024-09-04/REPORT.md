# 2024-09-04: AdversaryGraph live-instance PCAP report

Actual deployment: `[local-workspace]`, HTTP `[local-instance]`. This is a regression validation, not an independent blind trial. No malware was executed and no malicious endpoint was contacted.

## Executive assessment

Decoded 5091 packets across 42 IP endpoints and 221 transport flows. Observed 173 DNS events, 57 HTTP requests, 72 TLS ClientHello events, and 6 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 1 medium, and 7 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

These findings identify observations and review priorities, not a proven malware family, actor, or causal infection chain. Source-frame evidence takes precedence over exercise answer typos.

## Capture and execution evidence

Capture window: 2024-09-04T17:32:31.318609+00:00 to 2024-09-04T18:32:07.478593+00:00 UTC.
Capture SHA-256: `8fee06d0b1686faab4364f5b7a741e736ad7e713d5ca9299ff9161a4b4d4862e`.
Analysis ID: `faf041c3-70e0-4a01-8780-10917e5e187c`; review session: `df6c55a2-3630-4e95-82d0-0eebb41c3b51`.
First real HTTP upload/analysis: **3.557 seconds**. Fresh uncached decoder repeat: **4.924 seconds**. Prior isolated upload: 3.919 seconds.
The fresh repeat ran while builds/tests were active; these timings are not a controlled performance comparison. Native packet analysis used **zero LLM calls and zero LLM tokens**. Coding-agent token usage was not instrumented.

Packet result equals prior isolated result: True; fresh repeat exact: True; retained capture checksum valid: True; API retrieval identical: True; idempotent upload: True.

## Internal host identities

| Address | MAC addresses | Frame-backed identities |
|---|---|---|
| 172.17.0.17 | 00:23:ae:50:ba:fd |  |
| 172.17.0.255 | ff:ff:ff:ff:ff:ff |  |
| 172.17.0.99 | 18:3d:a2:b6:8d:c4 | account: afletcher; full-name: Andrew Fletcher; hostname: DESKTOP-RNVO9AT |

## Evidence timeline

| UTC | Frame | Candidate observation |
|---|---:|---|
| 2024-09-04T17:32:31.433000+00:00 | 31 | low: Directory-service protocol activity |
| 2024-09-04T17:32:31.433776+00:00 | 33 | low: Directory-service protocol activity |
| 2024-09-04T17:32:31.819563+00:00 | 41 | low: Repeated unsuccessful DNS resolution |
| 2024-09-04T17:34:35.487359+00:00 | 382 | low: Directory-service protocol activity |
| 2024-09-04T17:34:35.487796+00:00 | 384 | low: Directory-service protocol activity |
| 2024-09-04T17:34:35.491823+00:00 | 409 | low: Directory-service protocol activity |
| 2024-09-04T17:34:35.492327+00:00 | 410 | low: Directory-service protocol activity |
| 2024-09-04T17:35:07.211814+00:00 | 1668 | medium: Repeated outbound HTTP POST activity |

## Highest-volume conversations

Wire volume includes overhead/retransmissions. A large or periodic flow is not automatically exfiltration or C2.

| Initiator | Responder | Stream | Wire bytes | First frame |
|---|---|---|---:|---:|
| 172.17.0.99:49815 | 46.254.34.201:443 | tcp 50 | 491,261 | 1699 |
| 172.17.0.99:49806 | 46.254.34.201:443 | tcp 41 | 228,410 | 1276 |
| 172.17.0.99:64936 | 23.221.24.69:443 | udp 40 | 170,909 | 2593 |
| 172.17.0.99:49792 | 23.221.24.58:443 | tcp 27 | 93,715 | 620 |
| 172.17.0.99:49793 | 23.45.119.144:443 | tcp 28 | 79,806 | 804 |
| 172.17.0.99:54541 | 23.45.119.144:443 | udp 32 | 47,749 | 2493 |
| 172.17.0.99:49824 | 204.79.197.203:443 | tcp 59 | 25,967 | 2441 |
| 172.17.0.99:49785 | 172.17.0.17:445 | tcp 20 | 22,539 | 471 |
| 172.17.0.99:49791 | 204.79.197.203:443 | tcp 26 | 19,999 | 603 |
| 172.17.0.99:49778 | 172.17.0.17:445 | tcp 13 | 16,831 | 329 |
| 172.17.0.99:49773 | 20.42.73.28:443 | tcp 8 | 15,792 | 245 |
| 172.17.0.99:49872 | 23.45.119.144:443 | tcp 105 | 15,076 | 3919 |
| 172.17.0.99:49825 | 204.79.197.203:443 | tcp 60 | 14,416 | 2492 |
| 172.17.0.99:49851 | 20.60.228.1:443 | tcp 84 | 14,115 | 3391 |
| 172.17.0.99:49827 | 23.220.251.153:443 | tcp 62 | 13,960 | 2626 |
| 172.17.0.99:49812 | 23.195.212.189:443 | tcp 47 | 12,590 | 1631 |
| 172.17.0.99:49862 | 23.195.212.189:443 | tcp 95 | 12,529 | 3648 |
| 172.17.0.99:49804 | 23.195.212.189:443 | tcp 39 | 12,469 | 1200 |
| 172.17.0.99:49878 | 52.113.194.132:443 | tcp 111 | 12,075 | 4079 |
| 172.17.0.99:55398 | 23.45.119.144:443 | udp 35 | 11,629 | 2556 |

## Native packet findings, artifacts and limitations

# AdversaryGraph Deterministic PCAP Analysis

Source: 2024-09-04-traffic-analysis-exercise.pcap
Capture SHA-256: `8fee06d0b1686faab4364f5b7a741e736ad7e713d5ca9299ff9161a4b4d4862e`
Semantic result SHA-256: `4897ba23edbbda370beb304db04a336b3872d332b86d9834b16bb29e87c6d8b5`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 5091 packets across 42 IP endpoints and 221 transport flows. Observed 173 DNS events, 57 HTTP requests, 72 TLS ClientHello events, and 6 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 1 medium, and 7 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 5091
- Duration: 3576.159984 seconds
- Captured bytes: 2048179
- Endpoints: 42
- Flows: 221

## Deterministic findings

### MEDIUM — Repeated outbound HTTP POST activity

The same endpoint pair and HTTP target produced repeated POST requests suitable for beaconing or data transfer review.

Rule: `repeated-http-posts@pcap-rules-v3`; confidence: 0.72; evidence: frame 1668 / TCP stream 48, frame 1672 / TCP stream 48, frame 1697 / TCP stream 48, frame 2347 / TCP stream 56, frame 2985 / TCP stream 63.

Metrics: `{"declared_body_bytes":2046,"destination":"79.124.78.197","host":"79.124.78.197","port":80,"request_count":48,"source":"172.17.0.99","uri":"/foots.php"}`

### LOW — Repeated unsuccessful DNS resolution

Repeated NXDOMAIN responses may indicate a dead domain, misconfiguration, retrying software, or malicious fallback. They do not establish a domain-generation algorithm.

Rule: `repeated-nxdomain@pcap-rules-v3`; confidence: 0.5; evidence: frame 41, frame 42, frame 111, frame 112, frame 215.

Metrics: `{"domain":"wpad.bepositive.com","response_count":20,"source":"172.17.0.99"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 384 / TCP stream 14, frame 386 / TCP stream 14, frame 388 / TCP stream 14, frame 391 / TCP stream 14, frame 1074 / TCP stream 34.

Metrics: `{"destination":"172.17.0.99","event_count":39,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"172.17.0.17"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 33 / TCP stream 0, frame 419 / TCP stream 18, frame 431 / TCP stream 18, frame 452 / TCP stream 19, frame 455 / TCP stream 19.

Metrics: `{"destination":"172.17.0.99","event_count":66,"operation_numbers":["","1","4,19,19,19,5","4,5","5"],"protocol":"ldap","source":"172.17.0.17"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 410 / TCP stream 13, frame 415 / TCP stream 13, frame 417 / TCP stream 13, frame 420 / TCP stream 13, frame 422 / TCP stream 13.

Metrics: `{"destination":"172.17.0.99","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"172.17.0.17"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 382 / TCP stream 14, frame 385 / TCP stream 14, frame 387 / TCP stream 14, frame 389 / TCP stream 14, frame 1073 / TCP stream 34.

Metrics: `{"destination":"172.17.0.17","event_count":39,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"172.17.0.99"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 31 / TCP stream 0, frame 34 / TCP stream 0, frame 412 / TCP stream 18, frame 430 / TCP stream 18, frame 443 / TCP stream 19.

Metrics: `{"destination":"172.17.0.17","event_count":84,"operation_numbers":["","0","2","3"],"protocol":"ldap","source":"172.17.0.99"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 409 / TCP stream 13, frame 413 / TCP stream 13, frame 416 / TCP stream 13, frame 418 / TCP stream 13, frame 421 / TCP stream 13.

Metrics: `{"destination":"172.17.0.17","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"172.17.0.99"}`

## ATT&CK candidates

- No deterministic ATT&CK candidates.

## Identities

- account: `afletcher`; client IPs: 172.17.0.99; frames: 293, 301, 303, 317, 350
- full-name: `Andrew Fletcher`; client IPs: 172.17.0.99; frames: 428
- hostname: `DESKTOP-RNVO9AT`; client IPs: 172.17.0.99; frames: 1, 3, 20, 22, 60
- netbios-group: `BEPOSITIVE`; client IPs: unbound subject; frames: 21, 61, 65, 82, 85

## IOC and artifact candidates

- domain: `a1834.dscg2.akamai.net`; roles: dns-cname
- domain: `acroipm2.adobe.com`; roles: dns-query, http-host
- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `arc.msn.com`; roles: dns-query, tls-sni
- domain: `assets.msn.com`; roles: dns-query, tls-sni
- domain: `bepositive.com`; roles: dns-query
- domain: `blob.mwh03prdstf02a.store.core.windows.net`; roles: dns-cname
- domain: `client.wns.windows.com`; roles: tls-sni
- domain: `ctldl.windowsupdate.com`; roles: dns-query, http-host
- domain: `desktop-rnvo9at.bepositive.com`; roles: dns-query
- domain: `dns.msftncsi.com`; roles: dns-query
- domain: `download.windowsupdate.com`; roles: dns-query
- domain: `ecs.office.com`; roles: dns-query, tls-sni
- domain: `fd.api.iris.microsoft.com`; roles: dns-query, tls-sni
- domain: `g.live.com`; roles: dns-query, tls-sni
- domain: `img-s-msn-com.akamaized.net`; roles: dns-query, tls-sni
- domain: `inputsuggestions.msdxcdn.microsoft.com`; roles: dns-query, tls-sni
- domain: `login.microsoftonline.com`; roles: dns-query, tls-sni
- domain: `mobile.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `odc.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `officeclient.microsoft.com`; roles: dns-query, tls-sni
- domain: `oneclient.sfx.ms`; roles: dns-query, tls-sni
- domain: `pti.store.microsoft.com`; roles: dns-query
- domain: `settings-win.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `srtb.msn.com`; roles: dns-query, tls-sni
- domain: `sso.godaddy.com`; roles: dns-query, tls-sni
- domain: `storecatalogrevocation.storequality.microsoft.com`; roles: dns-query, tls-sni
- domain: `th.bing.com`; roles: dns-query, tls-sni
- domain: `v10.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `weathermapdata.blob.core.windows.net`; roles: dns-query, tls-sni
- domain: `win-ctl9xbq9y19.bepositive.com`; roles: dns-query
- domain: `windows.msn.com`; roles: dns-query, tls-sni
- domain: `wpad.bepositive.com`; roles: dns-query
- domain: `www.bellantonicioccolato.it`; roles: tls-sni
- domain: `www.bing.com`; roles: dns-query, tls-sni
- domain: `www.msftconnecttest.com`; roles: dns-query, http-host
- domain: `www.msn.com`; roles: dns-query, tls-sni
- domain: `x1.c.lencr.org`; roles: dns-query, http-host
- ipv4: `0.0.0.0`; roles: network-endpoint
- ipv4: `13.107.246.57`; roles: dns-answer, network-endpoint
- ipv4: `13.70.79.200`; roles: dns-answer, network-endpoint
- ipv4: `13.89.179.9`; roles: dns-answer, network-endpoint
- ipv4: `131.107.255.255`; roles: dns-answer
- ipv4: `172.17.0.17`; roles: dns-answer, network-endpoint
- ipv4: `172.17.0.255`; roles: network-endpoint
- ipv4: `172.17.0.99`; roles: dns-answer, network-endpoint
- ipv4: `184.29.137.96`; roles: dns-answer, network-endpoint
- ipv4: `199.232.210.172`; roles: dns-answer, network-endpoint
- ipv4: `199.232.214.172`; roles: dns-answer, network-endpoint
- ipv4: `20.10.31.115`; roles: network-endpoint
- ipv4: `20.189.173.1`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.18`; roles: dns-answer, network-endpoint
- ipv4: `20.189.173.26`; roles: dns-answer, network-endpoint
- ipv4: `20.190.135.2`; roles: dns-answer
- ipv4: `20.241.44.114`; roles: dns-answer, network-endpoint
- ipv4: `20.42.73.28`; roles: dns-answer, network-endpoint
- ipv4: `20.60.228.1`; roles: dns-answer, network-endpoint
- ipv4: `20.96.153.111`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.203`; roles: dns-answer, network-endpoint
- ipv4: `224.0.0.251`; roles: network-endpoint
- ipv4: `224.0.0.252`; roles: network-endpoint
- ipv4: `23.194.68.140`; roles: dns-answer, network-endpoint
- ipv4: `23.195.212.189`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.149`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.153`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.158`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.160`; roles: dns-answer
- ipv4: `23.220.251.47`; roles: dns-answer, network-endpoint
- ipv4: `23.220.251.48`; roles: dns-answer
- ipv4: `23.221.24.49`; roles: dns-answer
- ipv4: `23.221.24.50`; roles: dns-answer
- ipv4: `23.221.24.51`; roles: dns-answer
- ipv4: `23.221.24.52`; roles: dns-answer
- ipv4: `23.221.24.53`; roles: dns-answer
- ipv4: `23.221.24.55`; roles: dns-answer
- ipv4: `23.221.24.56`; roles: dns-answer
- ipv4: `23.221.24.57`; roles: dns-answer
- ipv4: `23.221.24.58`; roles: dns-answer, network-endpoint
- ipv4: `23.221.24.62`; roles: dns-answer
- ipv4: `23.221.24.63`; roles: dns-answer
- ipv4: `23.221.24.64`; roles: dns-answer
- ipv4: `23.221.24.68`; roles: dns-answer
- ipv4: `23.221.24.69`; roles: dns-answer, network-endpoint
- ipv4: `23.221.24.70`; roles: dns-answer
- ipv4: `23.221.24.73`; roles: dns-answer
- ipv4: `23.40.145.142`; roles: dns-answer, network-endpoint
- ipv4: `23.45.119.134`; roles: dns-answer
- ipv4: `23.45.119.140`; roles: dns-answer
- ipv4: `23.45.119.142`; roles: dns-answer
- ipv4: `23.45.119.143`; roles: dns-answer, network-endpoint
- ipv4: `23.45.119.144`; roles: dns-answer, network-endpoint
- ipv4: `23.45.119.146`; roles: dns-answer
- ipv4: `23.45.119.147`; roles: dns-answer, network-endpoint
- ipv4: `23.45.119.166`; roles: dns-answer
- ipv4: `23.45.119.174`; roles: dns-answer
- ipv4: `255.255.255.255`; roles: network-endpoint
- ipv4: `40.119.249.228`; roles: dns-answer, network-endpoint
- ipv4: `40.126.28.11`; roles: dns-answer
- ipv4: `40.126.28.12`; roles: dns-answer, network-endpoint
- ipv4: `40.126.28.13`; roles: dns-answer
- ipv4: `40.126.28.18`; roles: dns-answer
- ipv4: `40.126.28.19`; roles: dns-answer
- ipv4: `40.126.28.20`; roles: dns-answer
- ipv4: `40.126.28.21`; roles: dns-answer
- ipv4: `40.126.28.22`; roles: dns-answer, network-endpoint
- ipv4: `40.126.28.23`; roles: dns-answer
- ipv4: `40.126.7.32`; roles: dns-answer
- ipv4: `40.126.7.35`; roles: dns-answer
- ipv4: `46.254.34.201`; roles: network-endpoint
- ipv4: `52.109.0.142`; roles: dns-answer, network-endpoint
- ipv4: `52.109.0.91`; roles: dns-answer, network-endpoint
- ipv4: `52.113.194.132`; roles: dns-answer, network-endpoint
- ipv4: `79.124.78.197`; roles: http-host, network-endpoint
- ja3: `091f51a7a1c3a4504a224cc081ce9cee`; roles: tls-client-fingerprint
- ja3: `1a0fcf72de58b80a8499dea99e961714`; roles: tls-client-fingerprint
- ja3: `350c9b4a3f847974933dd25e9f9dc620`; roles: tls-client-fingerprint
- ja3: `3c293bdf2a25c07559b560ba86debc77`; roles: tls-client-fingerprint
- ja3: `3c4eb72b882d4d1442c67ce73f1292a9`; roles: tls-client-fingerprint
- ja3: `4c6de70d03b552090a8d77fcb0e10629`; roles: tls-client-fingerprint
- ja3: `5291cc6eebf72ef2ca72d48a1dd0d72f`; roles: tls-client-fingerprint
- ja3: `5919f6108f098e14c2f37619021ebd4d`; roles: tls-client-fingerprint
- ja3: `65005c9d9ae0f0ebeaf22c210571d482`; roles: tls-client-fingerprint
- ja3: `6a5d235ee78c6aede6a61448b4e9ff1e`; roles: tls-client-fingerprint
- ja3: `81e0f23545c783a55096f99f7c4755d7`; roles: tls-client-fingerprint
- ja3: `a25c14084d58bfea7bb5de112124edb3`; roles: tls-client-fingerprint
- ja3: `a35e0e26a8a46900d0f8297769d1112c`; roles: tls-client-fingerprint
- ja3: `cad306d4b414c5fcf993c03e0d596109`; roles: tls-client-fingerprint
- ja3: `f06a64ec6ecba24167cfe2612badcd91`; roles: tls-client-fingerprint
- sha256: `3f39d5c348e5b79d06e842c114e6cc571583bbf44e4b0ebfda1a01ec05745d43`; roles: exported-object
- sha256: `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; roles: exported-object
- sha256: `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; roles: exported-object
- sha256: `736f0cb5cc23435dad920dbe447efcf102e61c8691fa8528f5f39f386537f43e`; roles: exported-object
- sha256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; roles: exported-object
- sha256: `ed0855c1637e5f93be7d54acb2cb8872683a0e5eb670258abb1ebc41bfbf4591`; roles: exported-object
- url: `http://79.124.78.197/foots.php`; roles: http-request
- url: `http://79.124.78.197/index.php`; roles: http-request
- url: `http://79.124.78.197/index.php?id=&subid=qIOuKk7U`; roles: http-request
- url: `http://acroipm2.adobe.com/assets/Owner/arm/ProcessMAU.txt`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab?d7a8a57aa5acd39b`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?91717f420e6dda94`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/pinrulesstl.cab?a5fef2ac8502b132`; roles: http-request
- url: `http://www.msftconnecttest.com/connecttest.txt`; roles: http-request
- url: `http://x1.c.lencr.org/`; roles: http-request
- user_agent: `Microsoft NCSI`; roles: http-client
- user_agent: `Microsoft-CryptoAPI/10.0`; roles: http-client
- user_agent: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)`; roles: http-client
- user_agent: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)`; roles: http-client
- exported object `index.php`; SHA-256 `ed0855c1637e5f93be7d54acb2cb8872683a0e5eb670258abb1ebc41bfbf4591`; size 105 bytes
- exported object `index.php%3fid=&subid=qIOuKk7U`; SHA-256 `736f0cb5cc23435dad920dbe447efcf102e61c8691fa8528f5f39f386537f43e`; size 61 bytes
- exported object `connecttest(1).txt`; SHA-256 `5e9a7996fe94d7be10595d7133748760bf8348198b71b7a50fd8affaa980ac61`; size 22 bytes
- exported object `ProcessMAU.txt`; SHA-256 `69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820`; size 4 bytes
- exported object `index(1).php`; SHA-256 `3f39d5c348e5b79d06e842c114e6cc571583bbf44e4b0ebfda1a01ec05745d43`; size 1 bytes
- exported object `foots(1).php`; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; size 0 bytes

## Actor similarity leads

- No actor lead was calculated.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `99bf9b0d5c90e5eb36c1f5a055241fc0beb1b677bd448cb59545c1ac1d629049`; recorded 2026-09-19T12:08:45.501397+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":147,"observable_limit":5000,"observables_checked":147,"observables_total":147,"prior_case_limit_reached":false,"prior_cases_checked":7,"truncated":false}`

- Prior analysis `08324647-35af-4af2-8d82-4387eec03918` shares 38 observations. This does not establish a common campaign.
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 12 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 31 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 47 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 26 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 26 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 56 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":0,"complete":true,"detailed_objects":6,"exported_objects":54,"hashed_bytes":215,"hashed_objects":54,"omitted_unique_hashes":0,"returned_unique_hashes":6,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":6}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 8/8, identities 4/4, observables 147/147, artifacts 6/6. Full returned inventory is in the JSON result.


## Live enrichment and correlation validation

The actual IOC library contained 156,125 records. Exact typed matches: **0**; source actor assertions: **0**. Independent SQL agrees: IOC=True, actors=True.
A miss is unknown in this corpus, not evidence of benignness. The earlier isolated corpus included publisher-reference records; its positive matches were not live-provider detections and are not comparable to natural coverage here.
ATT&CK catalog candidates: 0; current-version catalog checks passed: True. Detection-strategy joins were checked independently.
Cross-case links: 7; independently verified: True. These are shared observations, predominantly common service infrastructure, not common-campaign assertions.

| Passive local lookup target | Type | Local matches |
|---|---|---:|
| `79.124.78.197` | ipv4 | 0 |
| `ed0855c1637e5f93be7d54acb2cb8872683a0e5eb670258abb1ebc41bfbf4591` | sha256 | 0 |
| `736f0cb5cc23435dad920dbe447efcf102e61c8691fa8528f5f39f386537f43e` | sha256 | 0 |

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

| Prior analysis | Shared count | Example observations |
|---|---:|---|
| 08324647-35af-4af2-8d82-4387eec03918 | 38 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, assets.msn.com, client.wns.windows.com |
| 616a90fa-f15e-4fcb-8d56-7b8e0eff5785 | 12 | fd.api.iris.microsoft.com, login.microsoftonline.com, mobile.events.data.microsoft.com, odc.officeapps.live.com, settings-win.data.microsoft.com |
| 459e119d-191f-49e8-85ea-c78f9de41826 | 31 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, ctldl.windowsupdate.com |
| 7a2cfe72-f48d-4894-8a2d-8889cb3b11b2 | 47 | a1834.dscg2.akamai.net, acroipm2.adobe.com, api.msn.com, assets.msn.com, client.wns.windows.com |
| 81373b30-6a59-49d1-89b0-bad73ed19eaa | 26 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, dns.msftncsi.com |
| 38851ad7-b3a0-423d-ae89-3b7be4e4b908 | 26 | acroipm2.adobe.com, api.msn.com, assets.msn.com, client.wns.windows.com, ctldl.windowsupdate.com |
| bfccc426-aa9b-4007-8558-a66d37ecb90c | 56 | a1834.dscg2.akamai.net, api.msn.com, assets.msn.com, client.wns.windows.com, ctldl.windowsupdate.com |

## Comparison with publisher answers and earlier runs

The following comparison is separate from native inference. It measures availability of selected facts, not 100% incident-diagnosis accuracy.

[Publisher answer](https://www.malware-traffic-analysis.net/2024/09/04/page2.html).

The engine retains the three PHP request paths and repeated POST activity, but does not independently identify Koi Stealer. The publisher bases that label on supplied ETPRO alerts, which were not fed to this PCAP-only run.

| Client | Field | Packet-verified expected value | Live |
|---|---|---|---|
| 172.17.0.99 | ip | 172.17.0.99 | True |
| 172.17.0.99 | mac | 18:3d:a2:b6:8d:c4 | True |
| 172.17.0.99 | hostname | DESKTOP-RNVO9AT | True |
| 172.17.0.99 | account | afletcher | True |

Declared IOC subset available: 1/1. Not exhaustive recall.

- `79.124.78.197`: present

## Complete-flow checks and evidence links

Browser history/open, Markdown export and investigation transfer: True. Investigation ID: `51b8fd21-ce38-44fb-9a74-86602c0275db`.
Investigation transfers preserve a bounded preview, total count, source-analysis URL and hashes. Complete evidence remains server-side. TTP-overlap leads are not inserted into actor associations.
PDF export: HTTP 200, including an explicitly non-authoritative packet-evidence appendix. STIX export remains HTTP 409 until a human completes review/promotion; this is a successful safety check.
- [Full native JSON](api-upload.json), [independent database audit](database-audit.json), [native Markdown](NATIVE-REPORT.md), [PDF](pdf-export-fixed.pdf).
- [Browser screenshot](../../browser/2024-09-04.png), [investigation evidence](../../browser/2024-09-04-investigation.json).

## Follow-up priorities

Validate high/medium findings using frame/stream evidence; obtain process and endpoint telemetry for execution, persistence and credential-theft hypotheses. Provider data above is current-time external context, not historical execution evidence. Review shared-CDN matches for specificity. Do not execute exported objects or treat encrypted payload metadata as decrypted evidence.
