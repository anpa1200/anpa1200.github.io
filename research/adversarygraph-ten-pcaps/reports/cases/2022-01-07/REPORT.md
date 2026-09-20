# 2022-01-07: AdversaryGraph live-instance PCAP report

Actual deployment: `[local-workspace]`, HTTP `[local-instance]`. This is a regression validation, not an independent blind trial. No malware was executed and no malicious endpoint was contacted.

## Executive assessment

Decoded 5880 packets across 27 IP endpoints and 157 transport flows. Observed 88 DNS events, 24 HTTP requests, 24 TLS ClientHello events, and 14 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 2 medium, and 6 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

These findings identify observations and review priorities, not a proven malware family, actor, or causal infection chain. Source-frame evidence takes precedence over exercise answer typos.

## Capture and execution evidence

Capture window: 1984-11-11T08:05:38.376658+00:00 to 2022-01-07T16:16:40.035978+00:00 UTC.
Capture SHA-256: `a86b11ee443ee59d95e4590bdf761235c5d240128d6d195233d065ab57777e8b`.
Analysis ID: `6e50c68f-5552-400c-9835-15867ddb022d`; review session: `91100160-1a16-4165-bf1d-6b5876fb4e11`.
First real HTTP upload/analysis: **4.289 seconds**. Fresh uncached decoder repeat: **4.764 seconds**. Prior isolated upload: 4.349 seconds.
The fresh repeat ran while builds/tests were active; these timings are not a controlled performance comparison. Native packet analysis used **zero LLM calls and zero LLM tokens**. Coding-agent token usage was not instrumented.

Packet result equals prior isolated result: True; fresh repeat exact: True; retained capture checksum valid: True; API retrieval identical: True; idempotent upload: True.

## Internal host identities

| Address | MAC addresses | Frame-backed identities |
|---|---|---|
| 192.168.1.1 | 1c:17:d3:f6:df:0a |  |
| 192.168.1.2 | 20:47:47:62:ae:26 |  |
| 192.168.1.216 | 9c:5c:8e:32:58:f9 | account: desktop-gxmyno2$; account: steve.smith; domain: SPOONWATCH; full-name: Steve Smith; hostname: DESKTOP-GXMYNO2; hostname: DESKTOP-GXNYNO2 |
| 192.168.1.255 | ff:ff:ff:ff:ff:ff |  |

## Evidence timeline

| UTC | Frame | Candidate observation |
|---|---:|---|
| 2022-01-07T16:04:09.760632+00:00 | 27 | low: Directory-service protocol activity |
| 2022-01-07T16:04:09.760917+00:00 | 29 | low: Directory-service protocol activity |
| 2022-01-07T16:04:11.003468+00:00 | 241 | low: Directory-service protocol activity |
| 2022-01-07T16:04:11.003845+00:00 | 246 | low: Directory-service protocol activity |
| 2022-01-07T16:04:51.762466+00:00 | 930 | low: Directory-service protocol activity |
| 2022-01-07T16:04:51.762873+00:00 | 931 | low: Directory-service protocol activity |
| 2022-01-07T16:14:22.462443+00:00 | 5309 | medium: Script, archive, or executable transfer candidate |
| 2022-01-07T16:14:22.465939+00:00 | 5313 | medium: Script, archive, or executable transfer candidate |

## Highest-volume conversations

Wire volume includes overhead/retransmissions. A large or periodic flow is not automatically exfiltration or C2.

| Initiator | Responder | Stream | Wire bytes | First frame |
|---|---|---|---:|---:|
| 192.168.1.216:49738 | 2.56.57.108:80 | tcp 65 | 3,598,989 | 1498 |
| 192.168.1.216:49749 | 23.38.189.225:80 | tcp 76 | 326,933 | 5304 |
| 192.168.1.216:49741 | 52.249.36.204:443 | tcp 68 | 92,612 | 4938 |
| 192.168.1.216:49670 | 192.168.1.2:445 | tcp 1 | 46,243 | 40 |
| 192.168.1.216:49742 | 23.38.189.225:80 | tcp 69 | 29,664 | 5044 |
| 192.168.1.216:49735 | 20.189.173.1:443 | tcp 62 | 27,190 | 1353 |
| 192.168.1.216:49744 | 20.54.89.15:443 | tcp 71 | 23,105 | 5150 |
| 192.168.1.216:49711 | 52.168.112.67:443 | tcp 38 | 18,659 | 762 |
| 192.168.1.216:49739 | 52.168.112.67:443 | tcp 66 | 15,638 | 4848 |
| 192.168.1.216:49716 | 192.168.1.2:445 | tcp 43 | 14,609 | 865 |
| 192.168.1.216:49726 | 204.79.197.200:443 | tcp 53 | 12,737 | 1087 |
| 192.168.1.216:49677 | 192.168.1.2:49667 | tcp 6 | 12,554 | 98 |
| 192.168.1.216:49745 | 52.178.17.2:443 | tcp 72 | 12,237 | 5179 |
| 192.168.1.216:49730 | 204.79.197.200:443 | tcp 57 | 11,342 | 1228 |
| 192.168.1.216:49762 | 204.79.197.200:443 | tcp 85 | 11,088 | 5822 |
| 192.168.1.216:49725 | 204.79.197.203:443 | tcp 52 | 10,825 | 1063 |
| 192.168.1.216:49737 | 104.212.67.47:443 | tcp 64 | 10,638 | 1438 |
| 192.168.1.216:49681 | 192.168.1.2:49667 | tcp 10 | 10,562 | 142 |
| 192.168.1.216:49719 | 192.168.1.2:445 | tcp 46 | 10,157 | 964 |
| 192.168.1.216:49686 | 192.168.1.2:389 | tcp 15 | 9,877 | 186 |

## Native packet findings, artifacts and limitations

# AdversaryGraph Deterministic PCAP Analysis

Source: 2022-01-07-traffic-analysis-exercise.pcap
Capture SHA-256: `a86b11ee443ee59d95e4590bdf761235c5d240128d6d195233d065ab57777e8b`
Semantic result SHA-256: `d99f9f0718d2f13b17822949ddc765679358c5ce545ed0bc49ba70534ed25482`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 5880 packets across 27 IP endpoints and 157 transport flows. Observed 88 DNS events, 24 HTTP requests, 24 TLS ClientHello events, and 14 exported HTTP object(s). Deterministic rules produced 8 finding(s): 0 high, 2 medium, and 6 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 5880
- Duration: 1172563861.65932 seconds
- Captured bytes: 4628888
- Endpoints: 27
- Flows: 157

## Deterministic findings

### MEDIUM — Script, archive, or executable transfer candidate

HTTP metadata names a script, archive, or executable. This is a transfer candidate, not proof of file type, execution, or malicious intent; legitimate updates use the same formats.

Rule: `script-or-executable-transfer@pcap-rules-v3`; confidence: 0.86; evidence: frame 5309 / TCP stream 76, frame 5315 / TCP stream 76, frame 5317 / TCP stream 76, frame 5636 / TCP stream 76.

Metrics: `{"content_type":"application/octet-stream","declared_body_bytes":307634,"destination":"192.168.1.216","response_count":2,"source":"23.38.189.225","uri":"/c/msdownload/update/software/defu/2022/01/am_delta_patch_1.355.1569.0_f5fe52e10a18f6ce4bc39541e4aae4a97c270c81.exe"}`

### MEDIUM — Script, archive, or executable transfer candidate

HTTP metadata names a script, archive, or executable. This is a transfer candidate, not proof of file type, execution, or malicious intent; legitimate updates use the same formats.

Rule: `script-or-executable-transfer@pcap-rules-v3`; confidence: 0.86; evidence: frame 5313 / TCP stream 77, frame 5316 / TCP stream 77.

Metrics: `{"content_type":"application/octet-stream","declared_body_bytes":2,"destination":"192.168.1.216","response_count":1,"source":"23.38.189.201","uri":"/c/msdownload/update/software/defu/2022/01/am_delta_patch_1.355.1569.0_f5fe52e10a18f6ce4bc39541e4aae4a97c270c81.exe"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 246 / TCP stream 6, frame 253 / TCP stream 6, frame 254 / TCP stream 10, frame 257 / TCP stream 6, frame 262 / TCP stream 6.

Metrics: `{"destination":"192.168.1.216","event_count":30,"operation_numbers":["0","1","12","13","30"],"protocol":"drsuapi","source":"192.168.1.2"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 29 / TCP stream 0, frame 191 / TCP stream 15, frame 213 / TCP stream 15, frame 219 / TCP stream 15, frame 221 / TCP stream 15.

Metrics: `{"destination":"192.168.1.216","event_count":47,"operation_numbers":["","1","4,19,19,19,5","4,5","5"],"protocol":"ldap","source":"192.168.1.2"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 931 / TCP stream 43, frame 933 / TCP stream 43, frame 935 / TCP stream 43, frame 937 / TCP stream 43, frame 939 / TCP stream 43.

Metrics: `{"destination":"192.168.1.216","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"192.168.1.2"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 241 / TCP stream 6, frame 251 / TCP stream 6, frame 252 / TCP stream 10, frame 255 / TCP stream 6, frame 256 / TCP stream 10.

Metrics: `{"destination":"192.168.1.2","event_count":30,"operation_numbers":["0","1","12","13","30"],"protocol":"drsuapi","source":"192.168.1.216"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 27 / TCP stream 0, frame 189 / TCP stream 15, frame 210 / TCP stream 15, frame 218 / TCP stream 15, frame 220 / TCP stream 15.

Metrics: `{"destination":"192.168.1.2","event_count":58,"operation_numbers":["","0","2","3"],"protocol":"ldap","source":"192.168.1.216"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 930 / TCP stream 43, frame 932 / TCP stream 43, frame 934 / TCP stream 43, frame 936 / TCP stream 43, frame 938 / TCP stream 43.

Metrics: `{"destination":"192.168.1.2","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"192.168.1.216"}`

## ATT&CK candidates

- T1105 Ingress Tool Transfer (command-and-control), confidence=0.8, status=suggested; basis=versioned-deterministic-rule.

## Identities

- account: `desktop-gxmyno2$`; client IPs: 192.168.1.216; frames: 75, 108, 126, 127, 129
- account: `steve.smith`; client IPs: 192.168.1.216; frames: 829, 837, 839, 851, 891
- domain: `SPOONWATCH`; client IPs: 192.168.1.216; frames: 914
- full-name: `Steve Smith`; client IPs: 192.168.1.216; frames: 945
- hostname: `DESKTOP-GXMYNO2`; client IPs: 192.168.1.216; frames: 1, 694, 756, 757, 914
- hostname: `DESKTOP-GXNYNO2`; client IPs: 192.168.1.216; frames: 35, 51, 367, 395, 595
- netbios-group: `SPOONWATCH`; client IPs: unbound subject; frames: 34, 366, 581, 596, 598

## IOC and artifact candidates

- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `au.download.windowsupdate.com`; roles: dns-query, http-host
- domain: `client.wns.windows.com`; roles: dns-query, tls-sni
- domain: `cp801.prod.do.dsp.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `ctldl.windowsupdate.com`; roles: dns-query, http-host
- domain: `dns.msftncsi.com`; roles: dns-query
- domain: `download.windowsupdate.com`; roles: dns-query, http-host
- domain: `fe2cr.update.microsoft.com`; roles: dns-query, tls-sni
- domain: `fe3cr.delivery.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `geo.prod.do.dsp.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `kv801.prod.do.dsp.mp.microsoft.com`; roles: dns-query, tls-sni
- domain: `pti.store.microsoft.com`; roles: dns-query, tls-sni
- domain: `self.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `settings-win.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `settingsfd-geo.trafficmanager.net`; roles: dns-cname
- domain: `spoonwatch-dc.spoonwatch.net`; roles: dns-query
- domain: `spoonwatch.net`; roles: dns-query
- domain: `v10.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `v20.events.data.microsoft.com`; roles: dns-query, tls-sni
- domain: `wns.notify.trafficmanager.net`; roles: dns-cname
- domain: `wpad.localdomain`; roles: dns-query
- domain: `wpad.spoonwatch.net`; roles: dns-query
- domain: `www.bing.com`; roles: dns-query, tls-sni
- ipv4: `0.0.0.0`; roles: network-endpoint
- ipv4: `104.212.67.47`; roles: dns-answer, network-endpoint
- ipv4: `13.107.21.200`; roles: dns-answer
- ipv4: `131.107.255.255`; roles: dns-answer
- ipv4: `184.50.62.43`; roles: dns-answer, network-endpoint
- ipv4: `192.168.1.1`; roles: network-endpoint
- ipv4: `192.168.1.2`; roles: dns-answer, network-endpoint
- ipv4: `192.168.1.216`; roles: network-endpoint
- ipv4: `192.168.1.255`; roles: network-endpoint
- ipv4: `2.56.57.108`; roles: http-host, network-endpoint
- ipv4: `20.189.173.1`; roles: dns-answer, network-endpoint
- ipv4: `20.50.80.210`; roles: dns-answer, network-endpoint
- ipv4: `20.54.89.15`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.200`; roles: dns-answer, network-endpoint
- ipv4: `204.79.197.203`; roles: dns-answer, network-endpoint
- ipv4: `224.0.0.22`; roles: network-endpoint
- ipv4: `224.0.0.251`; roles: network-endpoint
- ipv4: `224.0.0.252`; roles: network-endpoint
- ipv4: `23.38.189.201`; roles: dns-answer, network-endpoint
- ipv4: `23.38.189.225`; roles: dns-answer, network-endpoint
- ipv4: `239.255.255.250`; roles: http-host, network-endpoint
- ipv4: `255.255.255.255`; roles: network-endpoint
- ipv4: `40.83.240.146`; roles: dns-answer, network-endpoint
- ipv4: `52.168.112.67`; roles: dns-answer, network-endpoint
- ipv4: `52.178.17.2`; roles: dns-answer, network-endpoint
- ipv4: `52.179.216.235`; roles: dns-answer, network-endpoint
- ipv4: `52.183.220.149`; roles: dns-answer, network-endpoint
- ipv4: `52.238.248.1`; roles: dns-answer
- ipv4: `52.249.36.204`; roles: dns-answer, network-endpoint
- ipv4: `67.27.123.126`; roles: dns-answer
- ipv4: `8.240.136.254`; roles: dns-answer
- ipv4: `8.249.3.254`; roles: dns-answer
- ipv4: `8.249.7.254`; roles: dns-answer
- ipv4: `8.253.189.126`; roles: dns-answer, network-endpoint
- ja3: `28a2c9bd18a11de089ef85a160da29e4`; roles: tls-client-fingerprint
- ja3: `37f463bf4616ecd445d4a1937da06e19`; roles: tls-client-fingerprint
- ja3: `3b5074b1b5d032e5620f69f9f700ff0e`; roles: tls-client-fingerprint
- ja3: `6271f898ce5be7dd52b0fc260d0662b3`; roles: tls-client-fingerprint
- ja3: `a0e9f5d64349fb13191bc781f81f42e1`; roles: tls-client-fingerprint
- sha256: `0cb0222fbde977f15ebc3a7d555ed658763d9a3f507b3f7869416e1b2885adf2`; roles: exported-object
- sha256: `16574f51785b0e2fc29c2c61477eb47bb39f714829999511dc8952b43ab17660`; roles: exported-object
- sha256: `18180895844cba1cd9d310f04e0cfa26cff43b84eebacdc74809edf0e165d082`; roles: exported-object
- sha256: `1ecee6ff37e03c1160b8bf66d5ca8dc784e0b35fb9fd105f0964b314d310c07f`; roles: exported-object
- sha256: `334e69ac9367f708ce601a6f490ff227d6c20636da5222f148b25831d22e13d4`; roles: exported-object
- sha256: `3fe6b1c54b8cf28f571e0c5d6636b4069a8ab00b4f11dd842cfec00691d0c9cd`; roles: exported-object
- sha256: `43536adef2ddcc811c28d35fa6ce3031029a2424ad393989db36169ff2995083`; roles: exported-object
- sha256: `6482cf553a8dd0d2b4812ed1e4916423e9b233e77b3f73e8dcf1e1afdef0d1e9`; roles: exported-object
- sha256: `7b8ab07521c24e8ec610611e7e15d2fd39336166db6509885b8500d2a2bbfb14`; roles: exported-object
- sha256: `835eb064fabd072bd2aa6079f0b0949fbaf6fb677369c1a0cadcec666dbfffc7`; roles: exported-object
- sha256: `9b8db510ef42b8ed54a3712636fda55a4f8cfcd5493e20b74ab00cd4f3979f2d`; roles: exported-object
- sha256: `a770ecba3b08bbabd0a567fc978e50615f8b346709f8eb3cfacf3faab24090ba`; roles: exported-object
- sha256: `c40bb03199a2054dabfc7a8e01d6098e91de7193619effbd0f142a7bf031c14d`; roles: exported-object
- sha256: `e2935b5b28550d47dc971f456d6961f20d1633b4892998750140e0eaa9ae9d78`; roles: exported-object
- url: `http://2.56.57.108/osk/`; roles: http-request
- url: `http://2.56.57.108/osk//1.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//2.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//3.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//4.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//5.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//6.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//7.jpg`; roles: http-request
- url: `http://2.56.57.108/osk//main.php`; roles: http-request
- url: `http://239.255.255.250:1900*`; roles: http-request
- url: `http://au.download.windowsupdate.com/c/msdownload/update/software/defu/2022/01/am_delta_patch_1.355.1569.0_f5fe52e10a18f6ce4bc39541e4aae4a97c270c81.exe`; roles: http-request
- url: `http://ctldl.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab?f622d06ddf57408d`; roles: http-request
- url: `http://download.windowsupdate.com/c/msdownload/update/others/2022/01/35969515_2975e5b79f9857b7a2d7aa07e0d43359735c8e80.cab`; roles: http-request
- url: `http://download.windowsupdate.com/c/msdownload/update/others/2022/01/35969516_5bcaf676a3e98426394e538836033ea5ce2bb8c3.cab`; roles: http-request
- url: `http://download.windowsupdate.com/c/msdownload/update/others/2022/01/35969632_c422aaaf8becdd90e50fb6936708c77c7f97631f.cab`; roles: http-request
- user_agent: `Microsoft-CryptoAPI/10.0`; roles: http-client
- user_agent: `Microsoft-Delivery-Optimization/10.0`; roles: http-client
- user_agent: `Windows-Update-Agent/10.0.10011.16384 Client-Protocol/2.32`; roles: http-client
- exported object `5(1).jpg`; SHA-256 `e2935b5b28550d47dc971f456d6961f20d1633b4892998750140e0eaa9ae9d78`; size 1246160 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `1(1).jpg`; SHA-256 `16574f51785b0e2fc29c2c61477eb47bb39f714829999511dc8952b43ab17660`; size 645592 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `4(1).jpg`; SHA-256 `334e69ac9367f708ce601a6f490ff227d6c20636da5222f148b25831d22e13d4`; size 440120 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `2(1).jpg`; SHA-256 `a770ecba3b08bbabd0a567fc978e50615f8b346709f8eb3cfacf3faab24090ba`; size 334288 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `am_delta_patch_1.355.1569.0_f5fe52e10a18f6ce4bc39541e4aae4a97c270c81(2).exe`; SHA-256 `6482cf553a8dd0d2b4812ed1e4916423e9b233e77b3f73e8dcf1e1afdef0d1e9`; size 307632 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":262144,"inspection_truncated":true,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `6(1).jpg`; SHA-256 `43536adef2ddcc811c28d35fa6ce3031029a2424ad393989db36169ff2995083`; size 144848 bytes
  Static content: `{"content_kind":"pe","features":[{"excerpt":"IEX","feature":"dynamic-evaluation","offset":135147}],"inspected_bytes":144848,"inspection_truncated":false,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `3(1).jpg`; SHA-256 `3fe6b1c54b8cf28f571e0c5d6636b4069a8ab00b4f11dd842cfec00691d0c9cd`; size 137168 bytes
  Static content: `{"content_kind":"pe","features":[{"excerpt":"IEX","feature":"dynamic-evaluation","offset":126724}],"inspected_bytes":137168,"inspection_truncated":false,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `7(1).jpg`; SHA-256 `c40bb03199a2054dabfc7a8e01d6098e91de7193619effbd0f142a7bf031c14d`; size 83784 bytes
  Static content: `{"content_kind":"pe","features":[],"inspected_bytes":83784,"inspection_truncated":false,"interpretation":"Static content only; not proof of execution, intent, or malware family"}`. Not execution proof.
- exported object `osk`; SHA-256 `1ecee6ff37e03c1160b8bf66d5ca8dc784e0b35fb9fd105f0964b314d310c07f`; size 379629 bytes
- exported object `35969632_c422aaaf8becdd90e50fb6936708c77c7f97631f.cab`; SHA-256 `18180895844cba1cd9d310f04e0cfa26cff43b84eebacdc74809edf0e165d082`; size 10885 bytes
- exported object `35969516_5bcaf676a3e98426394e538836033ea5ce2bb8c3.cab`; SHA-256 `0cb0222fbde977f15ebc3a7d555ed658763d9a3f507b3f7869416e1b2885adf2`; size 7317 bytes
- exported object `35969515_2975e5b79f9857b7a2d7aa07e0d43359735c8e80.cab`; SHA-256 `835eb064fabd072bd2aa6079f0b0949fbaf6fb677369c1a0cadcec666dbfffc7`; size 7313 bytes
- exported object `1.jpg`; SHA-256 `7b8ab07521c24e8ec610611e7e15d2fd39336166db6509885b8500d2a2bbfb14`; size 25 bytes
- exported object `am_delta_patch_1.355.1569.0_f5fe52e10a18f6ce4bc39541e4aae4a97c270c81(1).exe`; SHA-256 `9b8db510ef42b8ed54a3712636fda55a4f8cfcd5493e20b74ab00cd4f3979f2d`; size 2 bytes

## Actor similarity leads

- Volatile Cedar (G0123): 20% TTP overlap. This is an investigation lead, not attribution.
- Winnti Group (G0044): 17% TTP overlap. This is an investigation lead, not attribution.
- Ajax Security Team (G0130): 17% TTP overlap. This is an investigation lead, not attribution.
- IndigoZebra (G0136): 14% TTP overlap. This is an investigation lead, not attribution.
- Nomadic Octopus (G0133): 14% TTP overlap. This is an investigation lead, not attribution.
- Whitefly (G0107): 11% TTP overlap. This is an investigation lead, not attribution.
- Metador (G1013): 11% TTP overlap. This is an investigation lead, not attribution.
- Elderwood (G0066): 11% TTP overlap. This is an investigation lead, not attribution.
- Rancor (G0075): 11% TTP overlap. This is an investigation lead, not attribution.
- Evilnum (G0120): 9% TTP overlap. This is an investigation lead, not attribution.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `4775c16cd4ef1258e6af0730109f96f3ed0ac43a533ee465dd460c85c852613e`; recorded 2026-09-19T12:09:31.260950+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":94,"observable_limit":5000,"observables_checked":94,"observables_total":94,"prior_case_limit_reached":false,"prior_cases_checked":12,"truncated":false}`

- Catalog T1105: https://attack.mitre.org/techniques/T1105; detection strategies: [{"attack_id":"DET0060","name":"Detect Ingress Tool Transfers via Behavioral Chain","stix_id":"x-mitre-detection-strategy--67677c4c-5778-49eb-ae74-1920645b8554"}]
- Prior analysis `43bc93eb-d6db-4400-b983-b0dd404c8ca4` shares 27 observations. This does not establish a common campaign.
- Prior analysis `6df36b51-4b44-4660-b534-2fa89705e807` shares 18 observations. This does not establish a common campaign.
- Prior analysis `29aa3ef8-47c9-4c47-b4cc-1ff3e0708142` shares 13 observations. This does not establish a common campaign.
- Prior analysis `b79032a8-d69e-4ac1-bdd4-542473fa8e3b` shares 15 observations. This does not establish a common campaign.
- Prior analysis `faf041c3-70e0-4a01-8780-10917e5e187c` shares 14 observations. This does not establish a common campaign.
- Prior analysis `08324647-35af-4af2-8d82-4387eec03918` shares 14 observations. This does not establish a common campaign.
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 5 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 18 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 15 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 12 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 14 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 21 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":0,"complete":true,"detailed_objects":14,"exported_objects":22,"hashed_bytes":3744940,"hashed_objects":22,"omitted_unique_hashes":0,"returned_unique_hashes":14,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":14}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 8/8, identities 7/7, observables 94/94, artifacts 14/14. Full returned inventory is in the JSON result.


## Live enrichment and correlation validation

The actual IOC library contained 156,125 records. Exact typed matches: **0**; source actor assertions: **0**. Independent SQL agrees: IOC=True, actors=True.
A miss is unknown in this corpus, not evidence of benignness. The earlier isolated corpus included publisher-reference records; its positive matches were not live-provider detections and are not comparable to natural coverage here.
ATT&CK catalog candidates: 1; current-version catalog checks passed: True. Detection-strategy joins were checked independently.
Cross-case links: 12; independently verified: True. These are shared observations, predominantly common service infrastructure, not common-campaign assertions.

| Passive local lookup target | Type | Local matches |
|---|---|---:|
| `2.56.57.108` | ipv4 | 0 |
| `16574f51785b0e2fc29c2c61477eb47bb39f714829999511dc8952b43ab17660` | sha256 | 0 |
| `a770ecba3b08bbabd0a567fc978e50615f8b346709f8eb3cfacf3faab24090ba` | sha256 | 0 |
| `au.download.windowsupdate.com` | domain | 0 |

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

| Prior analysis | Shared count | Example observations |
|---|---:|---|
| 43bc93eb-d6db-4400-b983-b0dd404c8ca4 | 27 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com, fe2cr.update.microsoft.com |
| 6df36b51-4b44-4660-b534-2fa89705e807 | 18 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com, settings-win.data.microsoft.com |
| 29aa3ef8-47c9-4c47-b4cc-1ff3e0708142 | 13 | api.msn.com, client.wns.windows.com, pti.store.microsoft.com, settings-win.data.microsoft.com, v10.events.data.microsoft.com |
| b79032a8-d69e-4ac1-bdd4-542473fa8e3b | 15 | api.msn.com, client.wns.windows.com, fe2cr.update.microsoft.com, fe3cr.delivery.mp.microsoft.com, pti.store.microsoft.com |
| faf041c3-70e0-4a01-8780-10917e5e187c | 14 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com, download.windowsupdate.com |
| 08324647-35af-4af2-8d82-4387eec03918 | 14 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com, fe3cr.delivery.mp.microsoft.com |
| 616a90fa-f15e-4fcb-8d56-7b8e0eff5785 | 5 | settings-win.data.microsoft.com, v10.events.data.microsoft.com, v20.events.data.microsoft.com, www.bing.com, 52.168.112.67 |
| 459e119d-191f-49e8-85ea-c78f9de41826 | 18 | api.msn.com, au.download.windowsupdate.com, client.wns.windows.com, ctldl.windowsupdate.com, download.windowsupdate.com |
| 7a2cfe72-f48d-4894-8a2d-8889cb3b11b2 | 15 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, self.events.data.microsoft.com, settings-win.data.microsoft.com |
| 81373b30-6a59-49d1-89b0-bad73ed19eaa | 12 | api.msn.com, client.wns.windows.com, dns.msftncsi.com, settings-win.data.microsoft.com, v10.events.data.microsoft.com |
| 38851ad7-b3a0-423d-ae89-3b7be4e4b908 | 14 | api.msn.com, client.wns.windows.com, ctldl.windowsupdate.com, dns.msftncsi.com, geo.prod.do.dsp.mp.microsoft.com |
| bfccc426-aa9b-4007-8558-a66d37ecb90c | 21 | api.msn.com, au.download.windowsupdate.com, client.wns.windows.com, cp801.prod.do.dsp.mp.microsoft.com, ctldl.windowsupdate.com |

## Comparison with publisher answers and earlier runs

The following comparison is separate from native inference. It measures availability of selected facts, not 100% incident-diagnosis accuracy.

[Publisher answer](https://www.malware-traffic-analysis.net/2022/01/07/page2.html).

Library downloads and the external endpoint are retained, but legitimate DLLs are not malware simply because a stealer retrieves them. The engine does not independently label OskiStealer or inspect the uploaded archive contents. Both conflicting observed hostname spellings remain evidence, not silently corrected. Hash list is a declared subset.

| Client | Field | Packet-verified expected value | Live |
|---|---|---|---|
| 192.168.1.216 | ip | 192.168.1.216 | True |
| 192.168.1.216 | mac | 9c:5c:8e:32:58:f9 | True |
| 192.168.1.216 | hostname | DESKTOP-GXMYNO2 | True |
| 192.168.1.216 | account | steve.smith | True |

Declared IOC subset available: 6/6. Not exhaustive recall.

- `2.56.57.108`: present
- `16574f51785b0e2fc29c2c61477eb47bb39f714829999511dc8952b43ab17660`: present
- `a770ecba3b08bbabd0a567fc978e50615f8b346709f8eb3cfacf3faab24090ba`: present
- `3fe6b1c54b8cf28f571e0c5d6636b4069a8ab00b4f11dd842cfec00691d0c9cd`: present
- `334e69ac9367f708ce601a6f490ff227d6c20636da5222f148b25831d22e13d4`: present
- `e2935b5b28550d47dc971f456d6961f20d1633b4892998750140e0eaa9ae9d78`: present
- Reference conflict: published `95:5c:8e:32:58:f9`, packet-supported `9c:5c:8e:32:58:f9`. Ethernet source evidence is 9c, not 95.

## Complete-flow checks and evidence links

Browser history/open, Markdown export and investigation transfer: True. Investigation ID: `46cea0b8-e35e-48de-862a-1dd27b46759d`.
Investigation transfers preserve a bounded preview, total count, source-analysis URL and hashes. Complete evidence remains server-side. TTP-overlap leads are not inserted into actor associations.
PDF export: HTTP 200, including an explicitly non-authoritative packet-evidence appendix. STIX export remains HTTP 409 until a human completes review/promotion; this is a successful safety check.
- [Full native JSON](api-upload.json), [independent database audit](database-audit.json), [native Markdown](NATIVE-REPORT.md), [PDF](pdf-export-fixed.pdf).
- [Browser screenshot](../../browser/2022-01-07.png), [investigation evidence](../../browser/2022-01-07-investigation.json).

## Follow-up priorities

Validate high/medium findings using frame/stream evidence; obtain process and endpoint telemetry for execution, persistence and credential-theft hypotheses. Provider data above is current-time external context, not historical execution evidence. Review shared-CDN matches for specificity. Do not execute exported objects or treat encrypted payload metadata as decrypted evidence.
