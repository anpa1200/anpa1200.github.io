# AdversaryGraph Deterministic PCAP Analysis

Source: 2021-12-08-ISC-Forensic-Challenge.pcap
Capture SHA-256: `91e547acc39e8ef27d7ec549404157fe527e090bd5caf6fe189c2bae6d4a57ef`
Semantic result SHA-256: `3343d2811e62c53a10dfd853861eeb3e3316a3080f654a63017c370f005b6af8`
Analyzer manifest SHA-256: `ee952aeb7cdc6958f4ae5178c54c274a1e4f0aec4d42f3bdb95baaff063b3dde`

## Executive summary

Decoded 55390 packets across 756 IP endpoints and 2044 transport flows. Observed 1726 DNS events, 17 HTTP requests, 191 TLS ClientHello events, and 500 exported HTTP object(s). Deterministic rules produced 18 finding(s): 0 high, 12 medium, and 6 low. Findings are evidence-bound candidates and require analyst review; encrypted payload contents remain unavailable.

## Capture facts

- Packets: 55390
- Duration: 2036.038412 seconds
- Captured bytes: 32089556
- Endpoints: 756
- Flows: 2044

## Deterministic findings

### MEDIUM — HTTP client claiming a PowerShell User-Agent

The HTTP User-Agent claims Windows PowerShell. User-Agent strings can be spoofed; this alone does not prove interpreter execution or malicious intent.

Rule: `powershell-http-client@pcap-rules-v3`; confidence: 0.94; evidence: frame 1743 / TCP stream 27.

Metrics: `{"destination":"104.21.29.80","request_count":1,"source":"10.12.3.66","user_agent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.1320"}`

### MEDIUM — HTTP client claiming a PowerShell User-Agent

The HTTP User-Agent claims Windows PowerShell. User-Agent strings can be spoofed; this alone does not prove interpreter execution or malicious intent.

Rule: `powershell-http-client@pcap-rules-v3`; confidence: 0.94; evidence: frame 1771 / TCP stream 29.

Metrics: `{"destination":"139.59.6.175","request_count":1,"source":"10.12.3.66","user_agent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.1320"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 353 / TCP stream 11, frame 355 / TCP stream 11, frame 357 / TCP stream 11, frame 359 / TCP stream 11, frame 3126 / TCP stream 32.

Metrics: `{"destination":"10.12.3.66","event_count":16,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.12.3.3"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 46 / TCP stream 0, frame 52 / TCP stream 0, frame 428 / TCP stream 17, frame 433 / TCP stream 17, frame 435 / TCP stream 17.

Metrics: `{"destination":"10.12.3.66","event_count":25,"operation_numbers":["1","4,19,19,19,5","4,5","5"],"protocol":"ldap","source":"10.12.3.3"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 291 / TCP stream 8, frame 293 / TCP stream 8, frame 295 / TCP stream 8, frame 297 / TCP stream 8, frame 299 / TCP stream 8.

Metrics: `{"destination":"10.12.3.66","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.12.3.3"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 352 / TCP stream 11, frame 354 / TCP stream 11, frame 356 / TCP stream 11, frame 358 / TCP stream 11, frame 3125 / TCP stream 32.

Metrics: `{"destination":"10.12.3.3","event_count":16,"operation_numbers":["0","1","12"],"protocol":"drsuapi","source":"10.12.3.66"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 43 / TCP stream 0, frame 50 / TCP stream 0, frame 53 / TCP stream 0, frame 426 / TCP stream 17, frame 431 / TCP stream 17.

Metrics: `{"destination":"10.12.3.3","event_count":32,"operation_numbers":["0","2","3"],"protocol":"ldap","source":"10.12.3.66"}`

### LOW — Directory-service protocol activity

Directory protocol operations were decoded. Normal Windows logon uses these protocols; activity alone does not establish discovery, credential theft, or DCSync.

Rule: `directory-service-activity@pcap-rules-v3`; confidence: 0.95; evidence: frame 290 / TCP stream 8, frame 292 / TCP stream 8, frame 294 / TCP stream 8, frame 296 / TCP stream 8, frame 298 / TCP stream 8.

Metrics: `{"destination":"10.12.3.3","event_count":15,"operation_numbers":["1","16","17","3","34","36","39","5","6","64","7"],"protocol":"samr","source":"10.12.3.66"}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 11092 / TCP stream 92.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":30.685,"packets":107,"source":"10.12.3.66","wire_bytes":73616}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 11301 / TCP stream 113.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":57.532,"packets":147,"source":"10.12.3.66","wire_bytes":105748}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 13057 / TCP stream 241.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":42.498,"packets":168,"source":"10.12.3.66","wire_bytes":125939}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 18188 / TCP stream 443.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":33.66,"packets":583,"source":"10.12.3.66","wire_bytes":454912}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 21451 / TCP stream 597.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":36.785,"packets":1049,"source":"10.12.3.66","wire_bytes":805994}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 23295 / TCP stream 598.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":59.968,"packets":108,"source":"10.12.3.66","wire_bytes":73622}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 28378 / TCP stream 748.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":34.519,"packets":3721,"source":"10.12.3.66","wire_bytes":2960550}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 43910 / TCP stream 895.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":49.751,"packets":111,"source":"10.12.3.66","wire_bytes":74055}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 46108 / TCP stream 1057.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":54.922,"packets":353,"source":"10.12.3.66","wire_bytes":265548}`

### MEDIUM — Sustained external TCP conversation outside decoded application coverage

The flow exchanges traffic with a public endpoint but has no HTTP/TLS/identity event in this profile. Inspect the stream for a custom protocol or a missing handshake. This is a coverage/investigation lead, not a malware verdict.

Rule: `unclassified-external-tcp@pcap-rules-v3`; confidence: 0.7; evidence: frame 47842 / TCP stream 1128.

Metrics: `{"destination":"91.207.181.106","destination_port":8080,"duration_seconds":40.215,"packets":331,"source":"10.12.3.66","wire_bytes":262342}`

## ATT&CK candidates

- T1059.001 Command and Scripting Interpreter: PowerShell (execution), confidence=0.5, status=suggested; basis=versioned-deterministic-rule.

## Identities

- account: `darin.figueroa`; client IPs: 10.12.3.66; frames: 224, 232, 234, 246, 274
- domain: `FARGREENTECH`; client IPs: 10.12.3.66; frames: 274
- full-name: `Darin Figueroa`; client IPs: 10.12.3.66; frames: 305
- hostname: `DESKTOP-LUOABV1`; client IPs: 10.12.3.66; frames: 1, 3, 23, 59, 72
- hostname: `FARGREENTECH`; client IPs: 10.12.3.66; frames: 132, 136, 137, 172
- netbios-group: `FARGREENTECH`; client IPs: unbound subject; frames: 60, 80, 113, 118, 120

## IOC and artifact candidates

- domain: `a.temp.pl`; roles: dns-query
- domain: `acerodelcibao.com`; roles: dns-query
- domain: `actsb.com.my`; roles: dns-cname
- domain: `adomengineering.com`; roles: dns-cname
- domain: `amaralcoleta.com.br`; roles: dns-cname
- domain: `api.msn.com`; roles: dns-query, tls-sni
- domain: `arketipo.com.mx`; roles: dns-cname
- domain: `atmail15.worldsoft-mail.net`; roles: dns-query
- domain: `auth.smtp.1and1.co.uk`; roles: dns-query
- domain: `auth.smtp.configtools.de`; roles: dns-query
- domain: `auth.smtp.kundenserver.de`; roles: dns-cname, dns-query
- domain: `baidyanath.info`; roles: dns-query
- domain: `bh.frameworks-studios.com`; roles: dns-query
- domain: `box5718.bluehost.com`; roles: dns-query
- domain: `broker.zgora.pl`; roles: dns-query
- domain: `bsmtp.telekom.at`; roles: dns-query
- domain: `c1.icoremail.net`; roles: dns-query
- domain: `capchile.cl`; roles: dns-cname
- domain: `chaudharygroup.com`; roles: dns-query
- domain: `checkappexec.microsoft.com`; roles: dns-query, tls-sni
- domain: `ci-aduanas.com`; roles: dns-query
- domain: `cityangkorhotel.com`; roles: dns-cname
- domain: `client.wns.windows.com`; roles: dns-query, tls-sni
- domain: `cmusoft.webhost4life.com`; roles: dns-query
- domain: `cpmail.contactplus.com.pk`; roles: dns-query
- domain: `dmfseguros.com.br`; roles: dns-cname
- domain: `dns.msftncsi.com`; roles: dns-query
- domain: `dunyakalip.com`; roles: dns-cname
- domain: `egyptetouring.com`; roles: dns-query
- domain: `ekopraxis.com.ec`; roles: dns-cname
- domain: `email-proxy.imaginet.co.za`; roles: dns-cname
- domain: `email-ssl.com.br`; roles: dns-query
- domain: `email.aon.at`; roles: dns-query
- domain: `email.srb.gos.pk`; roles: dns-query
- domain: `emko.com.pl`; roles: dns-query
- domain: `enseigneslandreville.com`; roles: dns-cname
- domain: `eurocertindia.com`; roles: dns-cname
- domain: `eurodesigngroup.net`; roles: dns-cname
- domain: `fargreentech-dc.fargreentech.com`; roles: dns-query
- domain: `fargreentech.com`; roles: dns-query
- domain: `ff.zydusphils.com`; roles: dns-query
- domain: `fibre.gondrandvalence.com`; roles: dns-cname
- domain: `fileserver-int.net`; roles: dns-cname
- domain: `frameworks-studios.com`; roles: dns-cname
- domain: `gamaes.shop`; roles: dns-query, http-host
- domain: `gameplayapi.intel.com`; roles: dns-query, tls-sni
- domain: `gator4266.hostgator.com`; roles: dns-query
- domain: `ghs.google.com`; roles: dns-cname
- domain: `global.sky1technologies.com`; roles: dns-query
- domain: `globalfreight.pk`; roles: dns-cname
- domain: `gm-pool.centrum.cz`; roles: dns-cname
- domain: `gottharthotel.com`; roles: dns-query
- domain: `gruporadialcristocentrica.com`; roles: dns-cname
- domain: `gs862.ggsv.jp`; roles: dns-query
- domain: `hades.dewebworks.net`; roles: dns-cname
- domain: `hdredirect-lb5-1afb6e2973825a56.elb.us-east-1.amazonaws.com`; roles: dns-cname
- domain: `hmapumps.com`; roles: dns-cname
- domain: `hortim.cz`; roles: dns-cname
- domain: `hosting.netclick.cz`; roles: dns-query
- domain: `hosting.pronto.hn`; roles: dns-query
- domain: `hotelandros.com`; roles: dns-cname
- domain: `hsgroupcal.com`; roles: dns-cname
- domain: `hueber.pl`; roles: dns-query
- domain: `hv31svg105.neubox.net`; roles: dns-query
- domain: `imap.1and1.com`; roles: dns-query
- domain: `imap.1and1.es`; roles: dns-query
- domain: `imap.1and1.fr`; roles: dns-query
- domain: `imap.1und1.de`; roles: dns-query
- domain: `imap.aol.com`; roles: dns-query
- domain: `imap.comcast.net`; roles: dns-query
- domain: `imap.conzulere-nextwealth.in`; roles: dns-query
- domain: `imap.ge.xfinity.com`; roles: dns-cname
- domain: `imap.iomartmail.com`; roles: dns-query
- domain: `imap.ionos.com`; roles: dns-query
- domain: `imap.mail.com`; roles: dns-query
- domain: `imap.mail.yahoo.com`; roles: dns-query
- domain: `imap.mi.com.co`; roles: dns-query
- domain: `imap.nerim.fr`; roles: dns-query
- domain: `imap.nerim.net`; roles: dns-cname
- domain: `imap.otenet.gr`; roles: dns-query
- domain: `imap.prmail.vn`; roles: dns-query
- domain: `imap.secureserver.net`; roles: dns-query
- domain: `imap.strato.de`; roles: dns-query
- domain: `imap.theblossomvn.com`; roles: dns-query
- domain: `inbound.att.net`; roles: dns-query
- domain: `inbound.electric.net`; roles: dns-query
- domain: `inside.evoc.cn`; roles: dns-query
- domain: `interline.mx`; roles: dns-cname
- domain: `internal-aol.imap.mail.g03.yahoodns.net`; roles: dns-cname
- domain: `jsamerica.net`; roles: dns-cname
- domain: `jumbosprepackers.co.za`; roles: dns-cname
- domain: `kdn3.futureweb.at`; roles: dns-query
- domain: `kitchencuisine.com.pk`; roles: dns-query
- domain: `kopt-eonet-pop.xspmail.jp`; roles: dns-cname
- domain: `lagranciudad.mx`; roles: dns-cname
- domain: `loki.aserv.co.za`; roles: dns-query
- domain: `macquarieoms-syd.chsecure.zone`; roles: dns-query
- domain: `mail-out.cytanet.com.cy`; roles: dns-query
- domain: `mail-out.telenet.be`; roles: dns-query
- domain: `mail.1and1.mx`; roles: dns-query
- domain: `mail.1und1.de`; roles: dns-query
- domain: `mail.abdullahbrothers.com.pk`; roles: dns-query
- domain: `mail.acmeroof.com`; roles: dns-query
- domain: `mail.acoop-ks.co.jp`; roles: dns-query
- domain: `mail.actsb.com.my`; roles: dns-query
- domain: `mail.adomengineering.com`; roles: dns-query
- domain: `mail.africaonline.co.zw`; roles: dns-query
- domain: `mail.aguilarenterprisesfl.com`; roles: dns-query
- domain: `mail.aisairlines.com`; roles: dns-query
- domain: `mail.alestraune.net.mx`; roles: dns-query
- domain: `mail.alfredoparedesyasociados.com`; roles: dns-query
- domain: `mail.alramooz.net`; roles: dns-cname, dns-query
- domain: `mail.amarujala.com`; roles: dns-query
- domain: `mail.apotheke-am-roeterberg.de`; roles: dns-query
- domain: `mail.arcor.de`; roles: dns-query
- domain: `mail.arcparc.ro`; roles: dns-query
- domain: `mail.argo.ge`; roles: dns-query
- domain: `mail.arketipo.com.mx`; roles: dns-query
- domain: `mail.arnes.si`; roles: dns-query
- domain: `mail.arptradingbd.com`; roles: dns-query
- domain: `mail.aseanbalihotel.com`; roles: dns-query
- domain: `mail.ava.cl`; roles: dns-query
- domain: `mail.belzonaquebec.com`; roles: dns-query
- domain: `mail.bfx.vn`; roles: dns-query
- domain: `mail.bggreenwood.com`; roles: dns-query
- domain: `mail.blancolaer.co.za`; roles: dns-query
- domain: `mail.bnf.hu`; roles: dns-query
- domain: `mail.bopumu.co.za`; roles: dns-query
- domain: `mail.borsodweb.hu`; roles: dns-query
- domain: `mail.bssb.de`; roles: dns-query
- domain: `mail.cable-connection.com`; roles: dns-query
- domain: `mail.cable-connection.com.netsolmail.net`; roles: dns-cname
- domain: `mail.cachetbeachcabo.com`; roles: dns-query
- domain: `mail.calustro.com`; roles: dns-query
- domain: `mail.cantv.net`; roles: dns-query
- domain: `mail.capchile.cl`; roles: dns-query
- domain: `mail.casaflorencio.com.br`; roles: dns-query
- domain: `mail.casarramona.com`; roles: dns-query
- domain: `mail.casi.com.ar`; roles: dns-query
- domain: `mail.centrum.cz`; roles: dns-query
- domain: `mail.cesky-hosting.cz`; roles: dns-query
- domain: `mail.chac.vn`; roles: dns-query
- domain: `mail.chenabgrw.edu.pk`; roles: dns-query
- domain: `mail.chot.cz`; roles: dns-query
- domain: `mail.cine-equipment.com`; roles: dns-query
- domain: `mail.circlekindonesia.com`; roles: dns-query
- domain: `mail.cityangkorhotel.com`; roles: dns-query
- domain: `mail.cn.yusen-logistics.com`; roles: dns-query
- domain: `mail.comcast.net`; roles: dns-query
- domain: `mail.copeval.cl`; roles: dns-query
- domain: `mail.countyofindiana.org`; roles: dns-query
- domain: `mail.cubimsa.com.mx`; roles: dns-query
- domain: `mail.degollado.gob.mx`; roles: dns-query
- domain: `mail.demisport.sk`; roles: dns-query
- domain: `mail.dmfseguros.com.br`; roles: dns-query
- domain: `mail.dunyakalip.com`; roles: dns-query
- domain: `mail.dwidayakarya.com`; roles: dns-query
- domain: `mail.dywit.it`; roles: dns-query
- domain: `mail.easy-trade.com.ar`; roles: dns-query
- domain: `mail.easyname.com`; roles: dns-cname
- domain: `mail.ecovidatrc.cl`; roles: dns-query
- domain: `mail.eim.ae`; roles: dns-query
- domain: `mail.ekopraxis.com.ec`; roles: dns-query
- domain: `mail.emailsrvr.com`; roles: dns-cname
- domain: `mail.emepamendoza.com`; roles: dns-query
- domain: `mail.emirates.net.ae`; roles: dns-query
- domain: `mail.enseigneslandreville.com`; roles: dns-query
- domain: `mail.esabrasil.com`; roles: dns-query
- domain: `mail.essve.ee`; roles: dns-query
- domain: `mail.estelec.es`; roles: dns-query
- domain: `mail.ethiopiaetravelling.com`; roles: dns-query
- domain: `mail.eurocertindia.com`; roles: dns-query
- domain: `mail.eurodesigngroup.net`; roles: dns-query
- domain: `mail.eurokel.com`; roles: dns-query
- domain: `mail.exclusivehosting.net`; roles: dns-query
- domain: `mail.f2slovakia.sk`; roles: dns-query
- domain: `mail.fedearroz.com.co`; roles: dns-query
- domain: `mail.feposa.com`; roles: dns-query
- domain: `mail.ferreteriacalzada.com`; roles: dns-query
- domain: `mail.fileserver-int.net`; roles: dns-query
- domain: `mail.finesseincasso.nl`; roles: dns-query
- domain: `mail.firma.hortim.cz`; roles: dns-query
- domain: `mail.flowlinevalves.com`; roles: dns-query
- domain: `mail.fournarakis.gr`; roles: dns-query
- domain: `mail.galaxysivtek.com`; roles: dns-query
- domain: `mail.geoecuatoriana.com`; roles: dns-query
- domain: `mail.glas-weiss.de`; roles: dns-query
- domain: `mail.glasofenbau-leipzig.de`; roles: dns-query
- domain: `mail.globalfreight.pk`; roles: dns-query
- domain: `mail.globetrotter.net`; roles: dns-query
- domain: `mail.gmail.com`; roles: dns-query
- domain: `mail.gmx.net`; roles: dns-query
- domain: `mail.grimescountyso.org`; roles: dns-query
- domain: `mail.gruporadialcristocentrica.com`; roles: dns-query
- domain: `mail.hacioglumetalyapi.com`; roles: dns-query
- domain: `mail.hielooriental.com`; roles: dns-query
- domain: `mail.hikam.com.mx`; roles: dns-query
- domain: `mail.hilliarddental.com`; roles: dns-query
- domain: `mail.hmapumps.com`; roles: dns-query
- domain: `mail.hosting.gob.do`; roles: dns-query
- domain: `mail.hotelandros.com`; roles: dns-query
- domain: `mail.hoteliers.guru`; roles: dns-query
- domain: `mail.hotelmoskva.rs`; roles: dns-query
- domain: `mail.hsgroupcal.com`; roles: dns-query
- domain: `mail.i-miyazawa.com`; roles: dns-query
- domain: `mail.icd.co.kr`; roles: dns-query
- domain: `mail.imaginet.co.za`; roles: dns-query
- domain: `mail.imexpharm.com`; roles: dns-query
- domain: `mail.infomaniak.ch`; roles: dns-cname
- domain: `mail.inkote.co.id`; roles: dns-query
- domain: `mail.interline.mx`; roles: dns-query
- domain: `mail.ionos.de`; roles: dns-query
- domain: `mail.ionos.mx`; roles: dns-query
- domain: `mail.ita.locamail.com.br`; roles: dns-cname
- domain: `mail.itep.com.ar`; roles: dns-query
- domain: `mail.itsolutions-asia.com`; roles: dns-cname
- domain: `mail.ivermedi.com`; roles: dns-query
- domain: `mail.jsamerica.net`; roles: dns-query
- domain: `mail.jumbosprepackers.co.za`; roles: dns-query
- domain: `mail.jurton.sk`; roles: dns-query
- domain: `mail.kantoushokuken.co.jp`; roles: dns-query
- domain: `mail.kvadra.hr`; roles: dns-query
- domain: `mail.lagranciudad.mx`; roles: dns-query
- domain: `mail.leiyueh.com`; roles: dns-query
- domain: `mail.lemex-feinkost.com`; roles: dns-query
- domain: `mail.lentaba.co.za`; roles: dns-query
- domain: `mail.lestarijayaraya.com`; roles: dns-query
- domain: `mail.libero.it`; roles: dns-query
- domain: `mail.lietkabelis.lt`; roles: dns-query
- domain: `mail.live.com`; roles: dns-query
- domain: `mail.lojack.com.ar`; roles: dns-query
- domain: `mail.mail.com`; roles: dns-query
- domain: `mail.mail.com.np`; roles: dns-query
- domain: `mail.mail.yahoo.com`; roles: dns-query
- domain: `mail.maisondelegance.com.py`; roles: dns-query
- domain: `mail.mangalamyatra.com`; roles: dns-query
- domain: `mail.masilagroup.com`; roles: dns-query
- domain: `mail.mawo-elektro.de`; roles: dns-query
- domain: `mail.messagingengine.com`; roles: dns-query
- domain: `mail.mgmltda.cl`; roles: dns-query
- domain: `mail.mi.com.co`; roles: dns-query
- domain: `mail.michal-plumbohm.de`; roles: dns-query
- domain: `mail.mtsbiz.net`; roles: dns-query
- domain: `mail.myaccess.ca`; roles: dns-query
- domain: `mail.myoffice.lu`; roles: dns-query
- domain: `mail.nkol.net`; roles: dns-query
- domain: `mail.nobleconcierge.pl`; roles: dns-query
- domain: `mail.nominalia.com`; roles: dns-cname
- domain: `mail.northernnamthaison.com.vn`; roles: dns-query
- domain: `mail.notariacarreno.com`; roles: dns-query
- domain: `mail.notariacuadragazmuri.cl`; roles: dns-query
- domain: `mail.npo-forum.ch`; roles: dns-query
- domain: `mail.ocn.ne.jp`; roles: dns-query
- domain: `mail.omkarcomputers.in`; roles: dns-query
- domain: `mail.one.com`; roles: dns-query
- domain: `mail.oneeach.com`; roles: dns-query
- domain: `mail.orcaseed.com`; roles: dns-query
- domain: `mail.otenet.gr`; roles: dns-query
- domain: `mail.outlook.com`; roles: dns-query
- domain: `mail.oxinsanat.com`; roles: dns-query
- domain: `mail.parcospa.eu`; roles: dns-query
- domain: `mail.paul-transporte.de`; roles: dns-query
- domain: `mail.pec.aruba.it`; roles: dns-query
- domain: `mail.pecc2.com`; roles: dns-query
- domain: `mail.pella.mx`; roles: dns-query
- domain: `mail.phhca.com`; roles: dns-query
- domain: `mail.phhca.com.netsolmail.net`; roles: dns-cname
- domain: `mail.pizzahut.com.do`; roles: dns-query
- domain: `mail.plustarget.com.co`; roles: dns-query
- domain: `mail.pondokindahmall.co.id`; roles: dns-query
- domain: `mail.porta.net`; roles: dns-query
- domain: `mail.powerexpress.com.ph`; roles: dns-query
- domain: `mail.q.com`; roles: dns-query
- domain: `mail.q.syn-alias.com`; roles: dns-cname
- domain: `mail.qlc.co.in`; roles: dns-query
- domain: `mail.quicknet.ch`; roles: dns-query
- domain: `mail.rakitsolutions.com`; roles: dns-query
- domain: `mail.rcilogistics.co.in`; roles: dns-query
- domain: `mail.readyhosting.com`; roles: dns-query
- domain: `mail.riungmitra.co.id`; roles: dns-query
- domain: `mail.ronbermudez.com`; roles: dns-query
- domain: `mail.santurcexray.com`; roles: dns-query
- domain: `mail.sasktel.net`; roles: dns-query
- domain: `mail.sbctransportation.com`; roles: dns-query
- domain: `mail.scaf.cl`; roles: dns-query
- domain: `mail.scienceworldpublish.com`; roles: dns-query
- domain: `mail.secureserver.net`; roles: dns-query
- domain: `mail.securitycontroldesign.com`; roles: dns-query
- domain: `mail.seek4.dk`; roles: dns-query
- domain: `mail.sepauc.cl`; roles: dns-query
- domain: `mail.server301.com`; roles: dns-query
- domain: `mail.servitarsa.com.gt`; roles: dns-query
- domain: `mail.sheratonparco.com`; roles: dns-query
- domain: `mail.shinseng.co.kr`; roles: dns-query
- domain: `mail.sigis.com.ve`; roles: dns-query
- domain: `mail.siol.net`; roles: dns-query
- domain: `mail.siprocimeca.com`; roles: dns-query
- domain: `mail.sisacsa.com`; roles: dns-query
- domain: `mail.skywaygrainsystems.com`; roles: dns-query
- domain: `mail.smartcloudpt.pt`; roles: dns-query
- domain: `mail.sng.com.ec`; roles: dns-query
- domain: `mail.soal.com.mx`; roles: dns-query
- domain: `mail.stackmail.com`; roles: dns-cname
- domain: `mail.stoneworx.com`; roles: dns-query
- domain: `mail.strato.de`; roles: dns-query
- domain: `mail.stsmail.ro`; roles: dns-query
- domain: `mail.stylecraftltd.com`; roles: dns-query
- domain: `mail.t-com.sk`; roles: dns-query
- domain: `mail.t-email.hu`; roles: dns-query
- domain: `mail.t-online.hu`; roles: dns-cname, dns-query
- domain: `mail.tctwest.net`; roles: dns-query
- domain: `mail.tds.net`; roles: dns-query
- domain: `mail.techosindustriales.com.mx`; roles: dns-query
- domain: `mail.tele2.ee`; roles: dns-query
- domain: `mail.telekom.sk`; roles: dns-query
- domain: `mail.telstra.com`; roles: dns-query
- domain: `mail.terraplan.si`; roles: dns-query
- domain: `mail.texasfirecraft.com`; roles: dns-query
- domain: `mail.texasfirecraft.com.netsolmail.net`; roles: dns-cname
- domain: `mail.thiemer.at`; roles: dns-query
- domain: `mail.tlcmedicalsas.com`; roles: dns-query
- domain: `mail.topsoiledmonton.com`; roles: dns-query
- domain: `mail.toyotatownship.com`; roles: dns-query
- domain: `mail.tremcar.com`; roles: dns-query
- domain: `mail.triplestarpackaging.com`; roles: dns-query
- domain: `mail.tudogar.com.mx`; roles: dns-query
- domain: `mail.twc.com`; roles: dns-query
- domain: `mail.ucil.com.pk`; roles: dns-query
- domain: `mail.unidentas.lt`; roles: dns-query
- domain: `mail.upcbusiness.at`; roles: dns-cname
- domain: `mail.verizon.net`; roles: dns-query
- domain: `mail.vietsuncorp.com.vn`; roles: dns-query
- domain: `mail.vnptmail.vn`; roles: dns-query
- domain: `mail.washingtonandwells.net`; roles: dns-query
- domain: `mail.webmail.co.za`; roles: dns-query
- domain: `mail.wildrepublic.com`; roles: dns-query
- domain: `mail.xpertcomex.cl`; roles: dns-query
- domain: `mail.yandex.com`; roles: dns-query
- domain: `mail.yandex.com.tr`; roles: dns-query
- domain: `mail.yemen.net.ye`; roles: dns-query
- domain: `mail.yorkdaledufferinmazda.ca`; roles: dns-query
- domain: `mail.zahnandmore.ch`; roles: dns-query
- domain: `mail.zwirgi.ch`; roles: dns-query
- domain: `mail1.circlekindo.com`; roles: dns-cname
- domain: `mail1.jramoncorp.com`; roles: dns-query
- domain: `mail1.qlc.co.in`; roles: dns-cname
- domain: `mail11.hostmaster.sk`; roles: dns-cname
- domain: `mail2.medigroup.rs`; roles: dns-query
- domain: `mail3.armstrong.syn-alias.com`; roles: dns-cname
- domain: `mail3.bigcommerce.com`; roles: dns-query
- domain: `mail7.hostmaster.sk`; roles: dns-cname
- domain: `mailbox.ischl.net`; roles: dns-cname
- domain: `mailgate.kkp.gr`; roles: dns-query
- domain: `mailgate.otenet.gr`; roles: dns-query
- domain: `mailgate.shopkeeper.de`; roles: dns-query
- domain: `mailhost.hetnet.nl`; roles: dns-query
- domain: `mailout.hl-c.eu`; roles: dns-query
- domain: `mailout.sssnet.com`; roles: dns-query
- domain: `mailserver.naic.edu`; roles: dns-query
- domain: `mailv.emirates.net.ae`; roles: dns-query
- domain: `maisondelegance.com.py`; roles: dns-cname
- domain: `masilagroup.com`; roles: dns-cname
- domain: `max-schoen.home.pl`; roles: dns-query
- domain: `mbox.cert.legalmail.it`; roles: dns-query
- domain: `mgmltda.cl`; roles: dns-cname
- domain: `mongo.planethoster.net`; roles: dns-query
- domain: `ms1.isat.co.za`; roles: dns-cname
- domain: `msa.m.dion.ne.jp`; roles: dns-query
- domain: `mx.em-it.at`; roles: dns-query
- domain: `mx.freenet.de`; roles: dns-query
- domain: `mx.sharpness.info`; roles: dns-query
- domain: `mx1.domainadmin.eu`; roles: dns-query
- domain: `mx1.trustlab.cz`; roles: dns-query
- domain: `newsaarctech.com`; roles: dns-query, http-host
- domain: `nexus.officeapps.live.com`; roles: dns-query, tls-sni
- domain: `nexusrules.officeapps.live.com`; roles: tls-sni
- domain: `notaria9acapulco.com`; roles: dns-query
- domain: `notariacuadragazmuri.cl`; roles: dns-cname
- domain: `notes.damc.or.kr`; roles: dns-query
- domain: `ns0.ovh.net`; roles: dns-cname
- domain: `office15client.microsoft.com`; roles: dns-query
- domain: `omkarcomputers.in`; roles: dns-cname
- domain: `out.alice.it`; roles: dns-query
- domain: `out.aliceposta.it`; roles: dns-cname
- domain: `out.smtp.cz`; roles: dns-query
- domain: `outmail.is.lt`; roles: dns-query
- domain: `p04-imap.mail.me.com`; roles: dns-query
- domain: `p16-smtp.mail.me.com`; roles: dns-query
- domain: `p22-imap.mail.me.com`; roles: dns-query
- domain: `p3plcpnl0106.prod.phx3.secureserver.net`; roles: dns-query
- domain: `p3plcpnl021.prod.phx3.secureserver.net`; roles: dns-query
- domain: `p47-imap.mail.me.com`; roles: dns-query
- domain: `paragonknits.com`; roles: dns-query
- domain: `pasts.ts.gov.lv`; roles: dns-query
- domain: `peach.mail.plala.or.jp`; roles: dns-query
- domain: `pl-07.webmail.emailsrvr.com`; roles: dns-cname
- domain: `plustarget.com.co`; roles: dns-cname
- domain: `pmaila.emirates.net.ae`; roles: dns-cname
- domain: `poczta.maxtel.com.pl`; roles: dns-query
- domain: `poczta.tech-media.pl`; roles: dns-query
- domain: `poczta.webio.pl`; roles: dns-query
- domain: `pondokindahmall.co.id`; roles: dns-cname
- domain: `pop-aliant.owm.bell.net`; roles: dns-cname
- domain: `pop-ha.skymail.net.br`; roles: dns-cname
- domain: `pop-verizonmail.egslb.aol.com`; roles: dns-cname
- domain: `pop.1and1.co.uk`; roles: dns-query
- domain: `pop.1and1.com`; roles: dns-query
- domain: `pop.1und1.de`; roles: dns-query
- domain: `pop.africaonline.com.na`; roles: dns-query
- domain: `pop.alestra.pangia.biz`; roles: dns-cname
- domain: `pop.alestraune.net.mx`; roles: dns-query
- domain: `pop.alpha-prm.jp`; roles: dns-query
- domain: `pop.alramooz.net`; roles: dns-query
- domain: `pop.altajuris.com`; roles: dns-query
- domain: `pop.asia.secureserver.net`; roles: dns-query
- domain: `pop.att.yahoo.com`; roles: dns-query
- domain: `pop.bellaliant.net`; roles: dns-query
- domain: `pop.bellnet.ca`; roles: dns-cname, dns-query
- domain: `pop.biz.rr.com`; roles: dns-query
- domain: `pop.broserimmo.com`; roles: dns-query
- domain: `pop.crcollision.com`; roles: dns-query
- domain: `pop.earthlink.net`; roles: dns-query
- domain: `pop.earthlinkbusiness.com`; roles: dns-cname
- domain: `pop.eastav.com`; roles: dns-query
- domain: `pop.easyname.com`; roles: dns-query
- domain: `pop.emailsrvr.com`; roles: dns-query
- domain: `pop.eonet.ne.jp`; roles: dns-query
- domain: `pop.exchangeadministrado.com`; roles: dns-query
- domain: `pop.fecamsc.org.br`; roles: dns-query
- domain: `pop.fibertel.com.ar`; roles: dns-cname
- domain: `pop.gmail.com`; roles: dns-query
- domain: `pop.infinitummail.com`; roles: dns-query
- domain: `pop.infinitummail.mail2world.com`; roles: dns-cname
- domain: `pop.infovia.com.ar`; roles: dns-query
- domain: `pop.itsolutions-asia.com`; roles: dns-query
- domain: `pop.mail.g.yahoo.co.jp`; roles: dns-cname
- domain: `pop.mail.yahoo.co.jp`; roles: dns-query
- domain: `pop.nbflogistica.com.br`; roles: dns-query
- domain: `pop.net4india.com`; roles: dns-query
- domain: `pop.one.com`; roles: dns-query
- domain: `pop.oxfordal.us`; roles: dns-query
- domain: `pop.poncacityhousingauthority.com`; roles: dns-query
- domain: `pop.prodigy.net.mx`; roles: dns-query
- domain: `pop.prosites.com`; roles: dns-query
- domain: `pop.rediffmailpro.com`; roles: dns-query
- domain: `pop.sbcglobal.yahoo.com`; roles: dns-query
- domain: `pop.securemail.pro`; roles: dns-query
- domain: `pop.secureserver.net`; roles: dns-query
- domain: `pop.serviciodecorreo.es`; roles: dns-query
- domain: `pop.sofimex.com.mx`; roles: dns-query
- domain: `pop.sonic.net`; roles: dns-query
- domain: `pop.speedy.com.ar`; roles: dns-query
- domain: `pop.sunbeltcustommineral.com`; roles: dns-query
- domain: `pop.super.net.pk`; roles: dns-query
- domain: `pop.yandex.com.tr`; roles: dns-query
- domain: `pop.zoho.com`; roles: dns-query
- domain: `pop3.anticorrosiva.com.ar`; roles: dns-query
- domain: `pop3.arnet.com.ar`; roles: dns-query
- domain: `pop3.ciudad.com.ar`; roles: dns-query
- domain: `pop3.dimarasalud.com`; roles: dns-query
- domain: `pop3.enet.cu`; roles: dns-query
- domain: `pop3.fibertel.com.ar`; roles: dns-query
- domain: `pop3.forpsi.com`; roles: dns-query
- domain: `pop3.frontier.com`; roles: dns-query
- domain: `pop3.guidoguidi.com.ar`; roles: dns-query
- domain: `pop3.iq.pl`; roles: dns-query
- domain: `pop3.isat.co.za`; roles: dns-query
- domain: `pop3.iso3.it`; roles: dns-query
- domain: `pop3.mailprotect.be`; roles: dns-query
- domain: `pop3.massalud.com.ar`; roles: dns-query
- domain: `pop3.mweb.co.za`; roles: dns-query
- domain: `pop3.netcologne.de`; roles: dns-query
- domain: `pop3.pldauto.fr`; roles: dns-query
- domain: `pop3.siasaweb.com.ar`; roles: dns-query
- domain: `pop3.smartcloudpt.pt`; roles: dns-query
- domain: `pop3.telkomsa.net`; roles: dns-query
- domain: `pop3.tintasultramix.com.br`; roles: dns-query
- domain: `pop3.utande.co.zw`; roles: dns-cname
- domain: `pop3.webmail.mw`; roles: dns-query
- domain: `pop3.world4you.com`; roles: dns-query
- domain: `pop3.yoafrica.com`; roles: dns-query
- domain: `pop3.zoominternet.net`; roles: dns-query
- domain: `pop51.on.aibn.com`; roles: dns-query
- domain: `poplar.ocn.ne.jp`; roles: dns-query
- domain: `poppro.zoho.com`; roles: dns-query
- domain: `post.strato.de`; roles: dns-query
- domain: `prod-w.nexus.live.com.akadns.net`; roles: dns-cname
- domain: `q1.epropiadns.com`; roles: dns-query
- domain: `radiadoreslider.com`; roles: dns-cname
- domain: `rakitsolutions.com`; roles: dns-cname
- domain: `relais.videotron.ca`; roles: dns-query
- domain: `relay.edpnet.be`; roles: dns-query
- domain: `relay.glb.proximus.be`; roles: dns-cname
- domain: `riungmitra.co.id`; roles: dns-cname
- domain: `rkrisltx.bpiwd.com`; roles: dns-query
- domain: `roaming.iskon.hr`; roles: dns-query
- domain: `schindler-kg.at`; roles: dns-query
- domain: `secure.bst-system.com`; roles: dns-cname
- domain: `secure.emailsrvr.com`; roles: dns-query
- domain: `securepop.t-online.de`; roles: dns-query
- exported object `sSTToaEwCG5VASw`; SHA-256 `0a85cba8c2e6aa44684f15047dcaa4c4d7f86ec356891bc8e0b8ee36bb151f7a`; size 4334 bytes
- exported object `object52357`; SHA-256 `2c80de6ffeb0759cb01dd7ad50437ea8dfcb7e4b8582a0129e7e7f700b593e38`; size 1523 bytes
- exported object `object15143`; SHA-256 `43a258e943f8cd5728ccf1018a03865b61c37dfed7f48995afe4ffd47b6cb8b7`; size 1523 bytes
- exported object `object30893`; SHA-256 `0b2e930d209670f78f6aaa3f2d19fd749c38c7bc223d2f6325df6b9f7614b5ff`; size 1442 bytes
- exported object `object53515`; SHA-256 `0cf2273cfb4ed1bc7051f653b37843c2fb2209d2bc95d5a38e4c8b76a97e3dac`; size 1442 bytes
- exported object `object46438`; SHA-256 `245afb556ba5bd1d4eff3e45c51f83f18ebdedefe744a7cd668a720ac0be841e`; size 1442 bytes
- exported object `object15275`; SHA-256 `250d82db6d12fbc6a4f93c9be1cfc6d819cb4f6d6e0d66648b2c66286d1e0c5f`; size 1442 bytes
- exported object `object32536`; SHA-256 `26ec6c18d689cdab1e882b3e5c40454fdde105b4dad784fc0b70ec34f33a685d`; size 1442 bytes
- exported object `object22887`; SHA-256 `2b5cd53248ff8bc195e931ea07c8ec7a6a6d4c9c3b3e326b3af21ca6d2e396a3`; size 1442 bytes
- exported object `object31033`; SHA-256 `32f3a788a007aded055b0c3f1596e75876843afc5f7e2562ffb2a981954bc5b9`; size 1442 bytes
- exported object `object53575`; SHA-256 `33bf9ccf421e4074ef459928e02242cc1e678da63061f3c4fdbd77aaa5a5c899`; size 1442 bytes
- exported object `object52709`; SHA-256 `34efa567764f17e790931c8a0bd8c00126acab0e76f53a9847f674c0c4eaad95`; size 1442 bytes
- exported object `object49925`; SHA-256 `367912ca5e87e14e40985a68eab3831fcc2cf94405a80442f4d2440ade4e434d`; size 1442 bytes
- exported object `object54034`; SHA-256 `38cbe5f6f1edafbf65fcb5fbe27f69c8d2de10fa41e05f8162bc0091bdd0082c`; size 1442 bytes
- exported object `object54392`; SHA-256 `398d8ab91648e39ce8559875ceffc4a8724e4259089bbe99a8ab871bd8cd510a`; size 1442 bytes
- exported object `object29937`; SHA-256 `465a2843237e39fd98af179ad65eb4f108513067d1c969bbeaa1c2cfccb26e5c`; size 1442 bytes
- exported object `object52814`; SHA-256 `4724352878e31617bd51e7499dd320a9f3d0c759ae4768ae31acd2612ece99b2`; size 1442 bytes
- exported object `object51834`; SHA-256 `473e9d4a177530efe3f1ed28ec3fdfe042a999f93ee3ea6cfb5f0fbf1509eb3d`; size 1442 bytes
- exported object `object53351`; SHA-256 `4db16bca2fd7324cdc66d241e0b3e950e153bb9534e60c1160d1ba0e9c18d083`; size 1442 bytes
- exported object `object32196`; SHA-256 `4ed21b81e706b20773e4f3c10dbe7fb015dbce15aa429db06f93d804a4e0ff62`; size 1442 bytes
- exported object `object31009`; SHA-256 `4f56fad91f1644a4257195137fcf8f6e821e3ea3ea96e165daf57e529fe521ff`; size 1442 bytes
- exported object `object52046`; SHA-256 `4fa3add17dca31bdfb61917c627b2ec9fff3716ed0eee78d31ca10bce3b5ad7b`; size 1442 bytes
- exported object `object54214`; SHA-256 `51ada0d3e87516cded91d77b86d32a08bfedd96cf5b5e3fddd084fe61d5d7a21`; size 1442 bytes
- exported object `object32123`; SHA-256 `526ba4dd3baed534f591d3b8f53cc2268d8e11d3ac3961fdeec21e8bb6078063`; size 1442 bytes
- exported object `object52334`; SHA-256 `53bbc8b15e8f03691544144a2b45d417d5c5d840b1f779624afcc479d8fa8813`; size 1442 bytes
- exported object `object32989`; SHA-256 `56d9a87699b652053de95016b18a677a850b948d1f0061aeef3951f9cbecd2ac`; size 1442 bytes
- exported object `object30399`; SHA-256 `57865023300c0ed7bcc2e312f58b481635f5efa0ee8750a39da4838b25dbed10`; size 1442 bytes
- exported object `object22862`; SHA-256 `5b43f9a38fc4125cd084c915a715fd8080bd829e34406729e73ac02b6d80b288`; size 1442 bytes
- exported object `object33448`; SHA-256 `5f3061cb3b17856f18adaefd99f3960482f2474c1f0191de970a7cac0444260d`; size 1442 bytes
- exported object `object30376`; SHA-256 `61fb009bf5c563ebd3f2334446057d1013f68f052fb08f48a297bb2edb57f71b`; size 1442 bytes
- exported object `object52180`; SHA-256 `63137c9e2fdc28ddaec8c99e9df36eab9d63a2129438ae0921f9827defc3806d`; size 1442 bytes
- exported object `object18811`; SHA-256 `6956751df0c5ab706d011b2746a3709835f56e2d620a8775133f79362c4e1bda`; size 1442 bytes
- exported object `object30761`; SHA-256 `6b659e04d03b4c6abeb9fc4d31d4d4442801e0a6c5e06d56f62fe49d915e8a0e`; size 1442 bytes
- exported object `object18745`; SHA-256 `7038bd0d004e61fbdd451623d51c217ffda4fb2723975dbc02a1b10fa121ff26`; size 1442 bytes
- exported object `object31121`; SHA-256 `7e08110ab733043f314cb23d05ca5fc0bd4beb2de9c33e6ab35836a6eb0a00a5`; size 1442 bytes
- exported object `object18619`; SHA-256 `82391338f3ede30f52a646fc558a4c20beba5db70ef26d1e7f1c63b11970ab67`; size 1442 bytes
- exported object `object29113`; SHA-256 `88f42f2c65bfe60c6395328f200ed242f0cf3dded1c22a3cd07204d56525bf28`; size 1442 bytes
- exported object `object54190`; SHA-256 `8ff8d44a63e43c9aea1d597f0a101445df8d6679df657c92c0d6faeb07245422`; size 1442 bytes
- exported object `object33388`; SHA-256 `93e83129d829e059611c03fb9536529c7581e94017a8a247d0764df0c0889791`; size 1442 bytes
- exported object `object53376`; SHA-256 `93e914a6facbc2481df7473c52459dbb24ca163e4510445893fd03ebc444480b`; size 1442 bytes
- exported object `object32566`; SHA-256 `971fa77239886aaf06e6f65eca0a607cc8ada189aaca1f69eb9f894c0deb4a96`; size 1442 bytes
- exported object `object53160`; SHA-256 `9f6d91ccc16d4a26cf0fe623bc1ef1a597d983f166826ba47e6434910d1c3336`; size 1442 bytes
- exported object `object53916`; SHA-256 `9ff868e0d2918a01a1f6c8a72cbed18403b8f66d25ccf0d19acad8ca7bb6986d`; size 1442 bytes
- exported object `object53672`; SHA-256 `a6f76feb3a4d155ed886c5dbc9980941ec147872aa7a8b89abea415216fb972f`; size 1442 bytes
- exported object `object31505`; SHA-256 `a7ea74281391750b02cfcb614469e8f355443ee33290f512b27b6a6c50f84622`; size 1442 bytes
- exported object `object23504`; SHA-256 `b947d88ec74e3504f3b45342741c224d51d504af8368c7fae4841310def2bfe1`; size 1442 bytes
- exported object `object51765`; SHA-256 `b982edb41289eb8e2a0be5c14616d9522142daa952415f0d0c96deef2eefeda5`; size 1442 bytes
- exported object `object31261`; SHA-256 `bb8d070ab43578233d89a2400c7c434f3ee15dc8c76ce5456e265cd68613a7f9`; size 1442 bytes
- exported object `object52500`; SHA-256 `cc2d680db9b64012df081755faba4281f0a482b1efe5c0d45cccbf44e1146cf2`; size 1442 bytes
- exported object `object23724`; SHA-256 `ce7336e46e69697b00c496073012548a733921e8b584e241053b38a086040f6a`; size 1442 bytes
- exported object `object44224`; SHA-256 `cf9b3de8917fbd7b627d4f0a32f4ab067c0d4a047ca87bf2dd7c1c0fa5977c53`; size 1442 bytes
- exported object `object33492`; SHA-256 `d1e9ccf86eb1e1e97645ea5bd8b2fe203903501273bdafe211aaaf43a050e42f`; size 1442 bytes
- exported object `object22839`; SHA-256 `d4109a6ae38b5f386c33b725308bc7b9ba01c0f7fb177b3edbbee1d5d5c203b9`; size 1442 bytes
- exported object `object53810`; SHA-256 `d4d48dea91cd0ebb930092dfd4d693f5eac915fdab0c53040ed9277d30aff980`; size 1442 bytes
- exported object `object51812`; SHA-256 `ea356b9fe5e4cd10ff16783e8f0d9a36054b1e8650e02253d7fd5d05b71a5146`; size 1442 bytes
- exported object `object30029`; SHA-256 `ef772f43958315122fc750cb52a6c8f60362283e68c2a1ac449ec41cf1b0f561`; size 1442 bytes
- exported object `object52203`; SHA-256 `effad7b3021800a4d426f10291186b533f0a6434fc1bfc91be07361faa78b663`; size 1442 bytes
- exported object `object52909`; SHA-256 `f3f4bd16d2dccbdcb3c378e8cbcf5fc3fdbe1750da5c411c408d6c695f3c2374`; size 1442 bytes
- exported object `object29136`; SHA-256 `f938fc5c9098e2f06b104998f23d8c691e23465d50b7bd7549112751e9c75e6f`; size 1442 bytes
- exported object `object53486`; SHA-256 `fe07c43edc7a3842e06bfd354f506e86a7dcb13689a4be3b94843d6fe655fa28`; size 1442 bytes
- exported object `object33144`; SHA-256 `fe6e39f569582b37f300c2d258a4440dd6473e89e44e2f1c05219020e56d7c6f`; size 1442 bytes
- exported object `object54319`; SHA-256 `fe796664efee221a3b7427e112e3e816629ddfc20433bb3fc032f31a7652bec7`; size 1442 bytes
- exported object `object30496`; SHA-256 `0012aa801678ae49c2d6e962920c3f912672e7deabd1338b08f786e71f91e911`; size 1361 bytes
- exported object `object49973`; SHA-256 `00572b8a56fba936d13eb443442624bbd01a0f8c9c676a8428f5c14c78b3dee9`; size 1361 bytes
- exported object `object15513`; SHA-256 `006623b67391b15bdc7f15ea38951f72b3f0bc2aef1279f5e2ef4c49fdceb61f`; size 1361 bytes
- exported object `object32910`; SHA-256 `0072d405aa5414a5aa300a5dbc908c12b181988c74010c4fb5f12c19b55b075e`; size 1361 bytes
- exported object `object34020`; SHA-256 `00a17cac5a3fd69a5b23dc5387136fe283d71d9c9088288ab31370542c493c5c`; size 1361 bytes
- exported object `object31492`; SHA-256 `00dc31d414c0738b0d71cdbfca06346612a337a8bb93f48191e7743acfadfc23`; size 1361 bytes
- exported object `object15587`; SHA-256 `00dd56a10881d0d22c2c6d6666f7227317cbd5c53342ef99cb4ccbde46d1513f`; size 1361 bytes
- exported object `object51603`; SHA-256 `00f88c0a50b5db8457f302b996f10e6e213aa415bd35764e878af92d1d98dbeb`; size 1361 bytes
- exported object `object33178`; SHA-256 `0104013328f4d3f2b6f57f798cb6a327940aaef2f390131951ad1159de6bc6bd`; size 1361 bytes
- exported object `object49985`; SHA-256 `012ef80f044aeac2bb3b458fd60b94c7cf05aa792a99b3ed90874652418d3c2b`; size 1361 bytes
- exported object `object46287`; SHA-256 `013362d5b3634cb0e8991a6b1516aeb4da26196fb07776f2de19aed375f506f0`; size 1361 bytes
- exported object `object30974`; SHA-256 `0157f5d604041e48cd6e91b973c8b610189a7b5c180845a55413c8663235af64`; size 1361 bytes
- exported object `object16659`; SHA-256 `01883ea44373de2ba27f0b322e6ee9e150f51a1a1f9ebb1c8990c55fb5ffb500`; size 1361 bytes
- exported object `object53163`; SHA-256 `01a99e3f02848b519b3c3a036af0d26363b9c38ef8bb162144100367c3ef68ea`; size 1361 bytes
- exported object `object13108`; SHA-256 `01ab3d222b25628cb40111921527735ae76c39fa4cec77784dc7a21da51f7fde`; size 1361 bytes
- exported object `object30260`; SHA-256 `01c6989be26c5296352274615da5427b35ebeb8fab60e3677716ba8ddde9f580`; size 1361 bytes
- exported object `object15539`; SHA-256 `025a33285a9207330b494981bdf5276647b94d41e022225c8ae671f1ae60567e`; size 1361 bytes
- exported object `object51887`; SHA-256 `029046b4eb0c08411ed9b3201220c86a89b6fc2e776711595914c4b8414c6694`; size 1361 bytes
- exported object `object32028`; SHA-256 `02b9310a633169e1e199f3129745cedef8be1886bbd63ef55a95f2419b4e810e`; size 1361 bytes
- exported object `object33440`; SHA-256 `0332d0cbae4950c24bc6619fbbe1465c57e6c8e12040586494a35619b28fd122`; size 1361 bytes
- exported object `object29431`; SHA-256 `03a354f9de7d86876f7d23695b1a1d7f3466b0982462e542e80bd53a41e6850c`; size 1361 bytes
- exported object `object52325`; SHA-256 `03b590abb054b607f92d48b851f88ccf57fd51bf17becbf5fcdec2926388df8d`; size 1361 bytes
- exported object `object49964`; SHA-256 `03b6d46d7cceeed3b05bd04e02f2794a603fafccad5eeb88e2dc7bcaf8ff91a8`; size 1361 bytes
- exported object `object15112`; SHA-256 `03c8e8681de20f44fca121de3691c487d7d6fef3fadfc37e5cfb9f11907beb0f`; size 1361 bytes
- exported object `object54199`; SHA-256 `03d054646bce2a15c17a2b9f1e6abcff498d5b4dbd8555396e5a11584358431c`; size 1361 bytes
- exported object `object48073`; SHA-256 `03d8eade1fbf830407059b3531802fd500b60ae267cd77612ef2ef1bf5370c75`; size 1361 bytes
- exported object `object23580`; SHA-256 `03da014864a4f3e63c1840a57a7a41d260779e9e4783b7439a2ffe91d0564f6d`; size 1361 bytes
- exported object `object23495`; SHA-256 `0405bac83ab8c5f11913dbb716075cae23e482c66d88a28c099dcdbd145b6dcb`; size 1361 bytes
- exported object `object32055`; SHA-256 `041467a3bee037373a1c5a5c745e243c91b3e23b85e96ea6c92c14402cd6003f`; size 1361 bytes
- exported object `object54018`; SHA-256 `04156590b6fd4be0762d5f6b5b3ad92b3bcd2981945ee402948dc837e7e5e979`; size 1361 bytes
- exported object `object33152`; SHA-256 `041952257a132d2b4338692650357096c8f6bf6d1300a37429d7d532da0941b1`; size 1361 bytes
- exported object `object33684`; SHA-256 `045281fc55e6d6578fac3b7cd59d914d0c004dee44a5747807687b02f2c6bf95`; size 1361 bytes
- exported object `object13177`; SHA-256 `0483ba73e19d23352009800bc48ad89b9366572500a60a67019383755995017a`; size 1361 bytes
- exported object `object53140`; SHA-256 `04c196337ac9e4ea59491ebe0161ba1fea2df8cf008da680d61f91b44381735d`; size 1361 bytes
- exported object `object32627`; SHA-256 `04f84c9cb8a90f08af403970bc08bc44833a198ede19dae2337fbcccfd173796`; size 1361 bytes
- exported object `object52923`; SHA-256 `04ff3f7973ed0862d3a40581b6f2f57ecf11b2443ff09ddc4d8d472d1b6ece4b`; size 1361 bytes
- exported object `object30319`; SHA-256 `053e49637cadeb1904e14922390d3973ee989c9e6b4e923d0fda878343c3bf3e`; size 1361 bytes
- exported object `object28909`; SHA-256 `054a254feaca85b72805a88f8a8aa75ce34a8f3ad73c8319bc636a2cf4341761`; size 1361 bytes
- exported object `object32769`; SHA-256 `05611c6f6bfec60af30c517f092b00a88c284a90a26948d1ee7d620b2ddce5f1`; size 1361 bytes
- exported object `object30947`; SHA-256 `05a65a61ec1885e2778d455dcda107c65247dabfa4ec60bbc75191d8b2e0b4c3`; size 1361 bytes
- exported object `object52062`; SHA-256 `05be44dc237edf7e9d54e1865748bd2cc593134f43aecb64d5eb28bfed0fa01a`; size 1361 bytes
- exported object `object29597`; SHA-256 `05c3667639fd25b51fff051b8d6ede5c730d927a542feb13135a04e4b3a8f265`; size 1361 bytes
- exported object `object52912`; SHA-256 `05fc4007dd365609c4dd7b73cd625397355e410662f0622ba7e60301585739a2`; size 1361 bytes
- exported object `object43929`; SHA-256 `0608f7fa7485e032a5a0fe8848bd690875aedda49ce9d6c1188aad65dc642680`; size 1361 bytes
- exported object `object29573`; SHA-256 `0629069e5ebb927dd394772027e3e9cbd1532733afff3ea7273985ce231de7c5`; size 1361 bytes
- exported object `object50037`; SHA-256 `0662465237674f31f5d26e21fe3123bedd4d01c4f1caa2591fb30d595a4b8b2a`; size 1361 bytes
- exported object `object33317`; SHA-256 `067c37a96ba039a4de134e74e71d06b952812e176303689238ac013788cbc1ae`; size 1361 bytes
- exported object `object34457`; SHA-256 `067fb5afeff836328b32d1f4210a6fa495554fd83df4b9501698cfef030fffae`; size 1361 bytes
- exported object `object33502`; SHA-256 `06a3a1aab53a94e085ada9bcd92958b43b1c8e8572ee1480ee37df584f81dca7`; size 1361 bytes
- exported object `object44077`; SHA-256 `0711a06d485902ad60e6a04a1893529e2b9865d44e91fde009e4457ca61825b5`; size 1361 bytes
- exported object `object48012`; SHA-256 `071a5da339b1d1596cb8481499412c20de3114d5600398be06f5a2b1cd43d778`; size 1361 bytes
- exported object `object23516`; SHA-256 `071d2002e64f4e65d93a52b1697093392b76ab11cf2a753867370d454da56a29`; size 1361 bytes
- exported object `object31703`; SHA-256 `0747ae71c073eb86e0e5afc4b6f7b3785624b4139c0f1e08402142c4c1e458c3`; size 1361 bytes
- exported object `object29413`; SHA-256 `0776e5afb1e90077bf644e994228c9cf06699d7e3cf71e68d67f08a79bd4b27c`; size 1361 bytes
- exported object `object13209`; SHA-256 `0796454cd492f8133c920ae565d235b5cd34b21a4e05dca423a21e104d6f812e`; size 1361 bytes
- exported object `object52387`; SHA-256 `07dd2f025b05a1339e661fa39a58aa6e2237ae30462e2a67e3dbf579979be568`; size 1361 bytes
- exported object `object22661`; SHA-256 `07f256bae45201651cdd122f4d3f656e63069206e59f22d609f3a5e60ae9c232`; size 1361 bytes
- exported object `object22815`; SHA-256 `083d2a4e9eca6ceddf634735ff1702e41018e1e0e177715ab03b00885999aede`; size 1361 bytes
- exported object `object29955`; SHA-256 `08abe123c978232970cc565c513c9f8215d99d322cd2085a7e149a22f34c2d23`; size 1361 bytes
- exported object `object29631`; SHA-256 `0903b6b8edc761ef3ba9d7ccc93e479e7c84fd5942bc46ab77a135c175aad715`; size 1361 bytes
- exported object `object33393`; SHA-256 `092105ddf74cbb404dc763472e8e336980a75b3266fc71ab6cd5872590933024`; size 1361 bytes
- exported object `object46400`; SHA-256 `094bba08127b66e3097bcbcf2e119a0b31624c578a51b392649ab146419274e8`; size 1361 bytes
- exported object `object15603`; SHA-256 `097b0737527b8d5a604fd600b050827353ca1fd75de5aad95c0108da1ade342d`; size 1361 bytes
- exported object `object15086`; SHA-256 `09e40529169ae90908609819469ea3ac9c086a9434a10c65ef753cdf99e29b74`; size 1361 bytes
- exported object `object54462`; SHA-256 `0a0886e7aa6ff36d13816a445a02e5b3882f91105a7efd72fc1058b03e63d800`; size 1361 bytes
- exported object `object29728`; SHA-256 `0a6d89fa6a8ed133ab9f9aec883513e25118c9715c1dadb77b5ed2dd39987988`; size 1361 bytes
- exported object `object21825`; SHA-256 `0acc8bad510081dc93c8ac019cc283594256dafd20553eea64d0fff666ee630a`; size 1361 bytes
- exported object `object30860`; SHA-256 `0ade63619d6d528e5ab89494f642cbf1c0148623e3dfeaf77e9a0fbb440299b2`; size 1361 bytes
- exported object `object21909`; SHA-256 `0ae794ee1d89e5b3cce28e650cfc3c3e24acdd8e4d95e2f9da1607b8de4e97f7`; size 1361 bytes
- exported object `object47902`; SHA-256 `0b0e34b03f2958d9714ae2b515f2b3bae39c102e255e2c793ffe5037388409bc`; size 1361 bytes
- exported object `object11543`; SHA-256 `0b2631d837c93672d27c18cba5275de75364c435ff4916da5dd46946db61a1dc`; size 1361 bytes
- exported object `object47906`; SHA-256 `0b30ef8d01ba40ab5b8586ef39476b1c4db51d8a95f4d2b56dbdd6b5d6d74475`; size 1361 bytes
- exported object `object52344`; SHA-256 `0b43402fb6e8725c7f8dcd581cd653543fb04c4e87a69c533c7cf39adec6f9a2`; size 1361 bytes
- exported object `object31012`; SHA-256 `0b4e47d118b34afd6fb3b14b0af17ed2c7abf41835d2ed2715df684ea8d6ffd8`; size 1361 bytes
- exported object `object31520`; SHA-256 `0b8db45a74f8225b297dba01ffbfe9223cfe5ff96717b33cdee3c7d7952d0c0b`; size 1361 bytes
- exported object `object15133`; SHA-256 `0bb0f8bb74e2ed6b391ac01b767211179370df14e7a3cd9b6a3c734e10abaa7d`; size 1361 bytes
- exported object `object33736`; SHA-256 `0be2658fdf946e5f974ca5bd4d3aadbf0417c4a67f31634f9e438291f157307f`; size 1361 bytes
- exported object `object52341`; SHA-256 `0be3de6cbe02649cac51b45bd94ff6d19a983412ba64b0e8d09bf001d670f936`; size 1361 bytes
- exported object `object52540`; SHA-256 `0c1699035ad33d5a5bbb3a1757c1403a6dd6e6701c0b44c440475272da405c92`; size 1361 bytes
- exported object `object53277`; SHA-256 `0c371ce96d766cf8f8b5a3e9f5fb6455f6357e8ae9f1df6f9cc5e9d570c47786`; size 1361 bytes
- exported object `object22855`; SHA-256 `0c7235740ffbcef98e3563dec0a7f00e0c540477142df44f30c786a5b802c7dd`; size 1361 bytes
- exported object `object18748`; SHA-256 `0c92140f9b3f7aeeaec909bf9c931e8470956ac8ff4b3fc00989a30742126d7f`; size 1361 bytes
- exported object `object33806`; SHA-256 `0ca5ce010722d08937143314f81e2a841c0ed3d6dcd196b1beb8b5f838e989bb`; size 1361 bytes
- exported object `object54410`; SHA-256 `0cac5dce45567504fec6f2175c02e8a9a2a1a291c65f341adb699ca5698da188`; size 1361 bytes
- exported object `object32737`; SHA-256 `0ce846a948032ea005cf44971ba98a1274be595acec2e801988f2e6d7b4d2144`; size 1361 bytes
- exported object `object33682`; SHA-256 `0cf01d966db97935bd75cf1e21aac60ea9971b148a6582fc76c8735ef4d2e9e9`; size 1361 bytes
- exported object `object15272`; SHA-256 `0d28d6f7d557164abfeded843a250023793d3a0354d6a7d8146edabef20b7dd9`; size 1361 bytes
- exported object `object48159`; SHA-256 `0d44094ee78b64cb11f220bfbd6a351569cc9cbe56192cf869815338779417d6`; size 1361 bytes
- exported object `object31373`; SHA-256 `0d5268d8703a78be118b790b6f318c29468e10d93d904e3f8a2d89e748dcc04c`; size 1361 bytes
- exported object `object31010`; SHA-256 `0d65f283876d720094daa97b3279e684c74128cecbb7cceb3181286e2fbbbc20`; size 1361 bytes
- exported object `object22523`; SHA-256 `0d794efd08478c1b15832783b865b8f123a8f225bf2c806b0f9ab5e1e3bb1b52`; size 1361 bytes
- exported object `object53034`; SHA-256 `0d9fddc732c93bb2d938e458c82784703edde666fe2efebda3ce00cb0349899d`; size 1361 bytes
- exported object `object32731`; SHA-256 `0daaa88b20226ae1f4c42c17c4c6cbbfa11dedfd9703cb779ebfd44b76ad82b1`; size 1361 bytes
- exported object `object23591`; SHA-256 `0de0c8f286db181c37bdc2195928e89de5197597e75ad4cad75ff5d4288937f5`; size 1361 bytes
- exported object `object33780`; SHA-256 `0de95a6dd74bfe274dbbd7c0ceb5f141adcdf595ce11730e42de61877c464fc4`; size 1361 bytes
- exported object `object48036`; SHA-256 `0e1caceac5a7205259b6f6bcf942a11ff76fe5545d648927d016773497c719d3`; size 1361 bytes
- exported object `object51997`; SHA-256 `0e25b544fbab68265ea690a46f017495adea916e109b1182928e9465ecaa94f2`; size 1361 bytes
- exported object `object31683`; SHA-256 `0e5b4a758abe3ab92146ccf55b4d2c3bf8cbc21668bd0bb56ea5d3640d513d85`; size 1361 bytes
- exported object `object44004`; SHA-256 `0e6fa606a24e4e6078c8bf8ac0cbb36c2bed47e9be2f287272c8ba792c14c014`; size 1361 bytes
- exported object `object32921`; SHA-256 `0e82c907c8cd9aa157c7c761e99cac8f45006fc84bdbbb05ec75fcded4238253`; size 1361 bytes
- exported object `object22857`; SHA-256 `0e9ea89f80df75091a4cc812e5dbd17cc224ec6bd8ea00f4ff4ea63445ffb325`; size 1361 bytes
- exported object `object53715`; SHA-256 `0eac0fa0f97d8bab85621c5fbfb4fa060ecc5ba7352ff2be940e58c9d7c12760`; size 1361 bytes
- exported object `object53125`; SHA-256 `0ee52f2355c117842f2f19d3f0c879d314ffbc5baa5e519c64f215be721476ee`; size 1361 bytes
- exported object `object49929`; SHA-256 `0f260101f477681eecd0d3f1a9d7ac49b4e0455a82cc9fbdcf5f0e7cde9fc361`; size 1361 bytes
- exported object `object33055`; SHA-256 `0f4364784a913740609a3600f0cfff9aaf587e0211b7f02c929f8bd0b36a816b`; size 1361 bytes
- exported object `object18560`; SHA-256 `0f47ad71c32b5bd256982e0e91759df7f55ca94082303c0663d94acaa93ca02c`; size 1361 bytes
- exported object `object44430`; SHA-256 `0fab4f6ca7bd6b8bb0e7bc56221b5171100fe3bc932100aa8ea788881c83e103`; size 1361 bytes
- exported object `object22373`; SHA-256 `0fb3e36e6534b2319c9aa3ef11bdc5e63f4936f0dd7602f1dd4d635e5896a5a4`; size 1361 bytes
- exported object `object23499`; SHA-256 `0fb4e4a743f5c30d4b05958d27a67e73f8bbc36ac2f65d04762a8c4d68023255`; size 1361 bytes
- exported object `object46266`; SHA-256 `0fbaacfe6e94b7f83a1c39b7c780ca0d2f0678560015cc2c771e778a3f473001`; size 1361 bytes
- exported object `object23298`; SHA-256 `0ff9fac2113e3888b5d144463c5c6945c11564c980a6089b7f7dfe1b9d614a80`; size 1361 bytes
- exported object `object13298`; SHA-256 `100ddabc33cdc6fe76fa4b540256bd06d6b5accb0002b2f7d4369d38a4351cc7`; size 1361 bytes
- exported object `object32582`; SHA-256 `103bf4c5c14533e16574153b81b6f1734b23fe110be50fb68ff18fac125477bf`; size 1361 bytes
- exported object `object30325`; SHA-256 `105cc58ea985855602cd233b66281c8e2de8832dc2ca6003253b78e875fb4b16`; size 1361 bytes
- exported object `object31586`; SHA-256 `10732599c70bbacdef1b5bfc15f5edba67539976fd97e48a51b1667cd29a5083`; size 1361 bytes
- exported object `object22158`; SHA-256 `10960552d889333d5bf995aa02e95d0261a39679a06beeac34c37f654bbda708`; size 1361 bytes
- exported object `object33404`; SHA-256 `109baac39f865d43b65478d15e0b6f7f3929f58dd9c2ec72cc6ed8c46cb66261`; size 1361 bytes
- exported object `object52754`; SHA-256 `10b860c3f90e1d7185a94151c42cc1404908d4d4af02fcdfa3e2f2e9c85f0513`; size 1361 bytes
- exported object `object51868`; SHA-256 `1111281d22bf620459aca772ceb3f5dc821c3f978939b3ac5cca81b709b4e2ba`; size 1361 bytes
- exported object `object44376`; SHA-256 `1115a41f4fd7b629b5f8b70dceaef84f4fc8b6cb82f05962a22cc97379583757`; size 1361 bytes
- exported object `object30132`; SHA-256 `111f968c11e5c908654bc87bbb11a8cd66d1859c003021dcf76371b61562e48d`; size 1361 bytes
- exported object `object53581`; SHA-256 `1181373ff5e53f848c7ef0692b70725ca8dbd7e1cf1b2354bfb0d40233621624`; size 1361 bytes
- exported object `object44444`; SHA-256 `1187b0e0bc25bb9cad44ea2f15eaa0553feaca599b6319004fc33177bddb512d`; size 1361 bytes
- exported object `object18307`; SHA-256 `11d95a0597638c7ebfd636d7fa665d7b96ba1d6a938a0a7f7eeceada33c477aa`; size 1361 bytes
- exported object `object49965`; SHA-256 `11e9f276cfe626be7ee28f5768bb67c94bd5036f1d1b27baeb3259655814306a`; size 1361 bytes
- exported object `object33015`; SHA-256 `1223006aefd1f01c7303af2a2b63b5d6140b2add24f00a843ca8f3e0beca7ce0`; size 1361 bytes
- exported object `object33442`; SHA-256 `124564c8d2a52347de7eb3af2b2c43b99f35dbb3b41f35eede3db7d027541f00`; size 1361 bytes
- exported object `object52320`; SHA-256 `124ab8ab6d95f1864ccb201bb3af9518629a54cb206ab971736846650e252c76`; size 1361 bytes
- exported object `object53098`; SHA-256 `12574189186de0aba6103d97667532aba80d8e2f39b5d5c6c0ac834ce07e2fd9`; size 1361 bytes
- exported object `object22453`; SHA-256 `126e38fa9c87810aaf9e9828daaf5b29ff4d2a1564f7edda27105a9bc7ea4763`; size 1361 bytes
- exported object `object30483`; SHA-256 `12eb91f6db9ec98c6507086c04ce36593b26a442e7fc346ff6c653dd3356eca7`; size 1361 bytes
- exported object `object32640`; SHA-256 `12f98788142404142f0ebcfc2e1b26fb68fbff42256f02178f681a5e01082075`; size 1361 bytes
- exported object `object22682`; SHA-256 `12fda192ab97a921a90112e345bc008e67f44337a36e29e4eaafa76c9bd109d3`; size 1361 bytes
- exported object `object53104`; SHA-256 `1313f26f132af560385da3614ebb327c0d7ee4c40771a23da6b87c505c22e6c3`; size 1361 bytes
- exported object `object29295`; SHA-256 `13444fc6df6157e6bb1510f5a024f22986ae6fac7e212edfe092f9c854141f3f`; size 1361 bytes
- exported object `object31545`; SHA-256 `13549461fdd383ce263d5645d080a25de84be85daacf70d9ff015e60ca315832`; size 1361 bytes
- exported object `object22956`; SHA-256 `13728223b67c5f320b624d7f199d8308e036e4a5fa0c585255acfc11b500f660`; size 1361 bytes
- exported object `object30393`; SHA-256 `137b6f81c662562efddf079930b84f11f4b57a8bbcc21e454c6b0a61878a6540`; size 1361 bytes

## Actor similarity leads

- Thrip (G0076): 25% TTP overlap. This is an investigation lead, not attribution.
- TA459 (G0062): 20% TTP overlap. This is an investigation lead, not attribution.
- Gallmaker (G0084): 17% TTP overlap. This is an investigation lead, not attribution.
- DarkHydrus (G0079): 14% TTP overlap. This is an investigation lead, not attribution.
- Nomadic Octopus (G0133): 14% TTP overlap. This is an investigation lead, not attribution.
- Poseidon Group (G0033): 12% TTP overlap. This is an investigation lead, not attribution.
- CopyKittens (G0052): 12% TTP overlap. This is an investigation lead, not attribution.
- MoustachedBouncer (G1019): 12% TTP overlap. This is an investigation lead, not attribution.
- GOLD SOUTHFIELD (G0115): 11% TTP overlap. This is an investigation lead, not attribution.
- DarkVishnya (G0105): 10% TTP overlap. This is an investigation lead, not attribution.

## Local enrichment and correlations

No match means unknown in this corpus. Local CTI may postdate the capture. Matches and shared infrastructure require review; no automatic promotion or attribution.
Snapshot: `37c4030f9b25335ca7a7a8cd23b5f050fab86309243d1fc8d5d3462e90e2a5a9`; recorded 2026-09-19T12:09:53.287759+00:00; mode: local-only.
Coverage: `{"matched_observables":0,"no_exact_match":3662,"observable_limit":5000,"observables_checked":3662,"observables_total":3662,"prior_case_limit_reached":false,"prior_cases_checked":13,"truncated":false}`

- Catalog T1059.001: https://attack.mitre.org/techniques/T1059/001; detection strategies: [{"attack_id":"DET0455","name":"Abuse of PowerShell for Arbitrary Execution","stix_id":"x-mitre-detection-strategy--72b209e2-8c65-4217-8532-fabd0cb54ae5"}]
- Prior analysis `6e50c68f-5552-400c-9835-15867ddb022d` shares 17 observations. This does not establish a common campaign.
- Prior analysis `43bc93eb-d6db-4400-b983-b0dd404c8ca4` shares 41 observations. This does not establish a common campaign.
- Prior analysis `6df36b51-4b44-4660-b534-2fa89705e807` shares 20 observations. This does not establish a common campaign.
- Prior analysis `29aa3ef8-47c9-4c47-b4cc-1ff3e0708142` shares 11 observations. This does not establish a common campaign.
- Prior analysis `b79032a8-d69e-4ac1-bdd4-542473fa8e3b` shares 11 observations. This does not establish a common campaign.
- Prior analysis `faf041c3-70e0-4a01-8780-10917e5e187c` shares 10 observations. This does not establish a common campaign.
- Prior analysis `08324647-35af-4af2-8d82-4387eec03918` shares 13 observations. This does not establish a common campaign.
- Prior analysis `616a90fa-f15e-4fcb-8d56-7b8e0eff5785` shares 3 observations. This does not establish a common campaign.
- Prior analysis `459e119d-191f-49e8-85ea-c78f9de41826` shares 10 observations. This does not establish a common campaign.
- Prior analysis `7a2cfe72-f48d-4894-8a2d-8889cb3b11b2` shares 12 observations. This does not establish a common campaign.
- Prior analysis `81373b30-6a59-49d1-89b0-bad73ed19eaa` shares 12 observations. This does not establish a common campaign.
- Prior analysis `38851ad7-b3a0-423d-ae89-3b7be4e4b908` shares 12 observations. This does not establish a common campaign.
- Prior analysis `bfccc426-aa9b-4007-8558-a66d37ecb90c` shares 14 observations. This does not establish a common campaign.
- External provider queries: 0. Not requested; no unknown indicator is classified as benign.

## Coverage and limitations

- Packet and protocol facts are deterministic for the recorded analyzer manifest.
- Encrypted application payloads are not decrypted; only available metadata is reported.
- ATT&CK mappings and actor overlaps are candidates until analyst review and promotion.
- HTTP object inventory: `{"compact_objects":1555,"complete":true,"detailed_objects":500,"exported_objects":2055,"hashed_bytes":2729292,"hashed_objects":2055,"omitted_unique_hashes":0,"returned_unique_hashes":2055,"selection":"content-classified first, then size descending, SHA256 tie-break; deduplicated by full hash; overflow retains a compact hash index","unhashed_objects":0,"unique_hashes":2055}`. Compact overflow hashes are retained in JSON coverage and observables.
- A directory subject is not necessarily a logged-in user; consult identity bindings in the JSON evidence.
- Rendered / available: findings 18/18, identities 6/6, observables 500/3662, artifacts 200/500. Full returned inventory is in the JSON result.
