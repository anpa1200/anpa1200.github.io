# PCAP investigation summary

## What happened

Host 172.17.8.109 \(Dunn-Windows-PC\) downloaded an executable file identified as Portable Executable \(PE\) format from http://91.121.30.169:8000/91msE95B/actiV.bin during the capture period.

## Who was involved

- 172.17.8.109 is the primary internal IP performing network and file download activity in the capture.
- The host name Dunn-Windows-PC is associated with IP 172.17.8.109.
- Account margaret.dunn initiated Kerberos authentication using 172.17.8.109.

## What remains uncertain

- It is not established by packet data whether the downloaded file 9f6e3e65aedca997c6445329663bd1d279392a34cfda7d1b56461eb41641fa08 executed or resulted in compromise on 172.17.8.109.

## Next check

- Review endpoint telemetry or host process logs from 172.17.8.109 to determine if the downloaded PE file was launched.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.