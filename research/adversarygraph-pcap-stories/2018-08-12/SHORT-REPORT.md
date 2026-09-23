# PCAP investigation summary

## What happened

The internal host 192.168.1.95 \(Petrov2018-PC\) downloaded an HTTP file with SHA-256 b908d9b1001d0a39ba92501c086b1c25b05b171eeda035ae9f3e129d2776a314, which static review flagged as suspicious, but no execution is proven.

Following these downloads, the same host established repeated HTTP POST connections to http://185.68.93.18/dot.php, consistent with automated beacon or callback patterns, but this activity alone does not prove compromise.

## Who was involved

- 192.168.1.95 observed as the source of downloads and callbacks.
- Petrov2018-PC is the hostname of the involved device.
- mikhail.petrov account associated to 192.168.1.95 by Kerberos principal.

## Key indicators

- SHA-256 b908d9b1001d0a39ba92501c086b1c25b05b171eeda035ae9f3e129d2776a314 is the downloaded suspicious file for review, flagged by static features.
- IP 185.68.93.18 is the external host receiving repeated HTTP POST callbacks from the involved host.
- http://185.68.93.18/dot.php is the suspicious callback URL for POST activity from the internal host.

## Supported technique candidates

- T1071.001 — Suspected use of application layer web protocols for command-and-control based on repeated HTTP POSTs to dot.php.
- T1105 — Possible ingress tool transfer via HTTP download, including suspicious script-like file, but adversary presence is not established by this alone.

## What remains uncertain

- It is not established whether the suspicious downloaded file was executed or resulted in system compromise.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.