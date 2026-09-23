# PCAP investigation summary

## What happened

Host 172.16.3.133 downloaded a Portable Executable \(PE\) file from 93.90.146.108 via http://www.prolightphotovideo.net/dVk\_hwBIaehh/, indicating potential delivery of an executable payload.

Host 172.16.3.133 also downloaded an OLE document from 82.80.25.215 at http://entisrael.com/wp-content/uploads/2018/jemHu-SahjLpTw\_r-7Kd/PaymentStatus/default/US\_us/Companies-Invoice-0970945/, which may contain a malicious macro or embedded exploit.

No evidence confirms execution of the downloaded files or subsequent compromise within the available capture.

## Who was involved

- 172.16.3.133 appears as the client for both high-risk file downloads and is associated with the account conception.varner.
- Account conception.varner is bound to 172.16.3.133 via Kerberos principal activity.

## What remains uncertain

- It remains unknown if the downloaded PE or OLE files were executed or if any further post-compromise activity occurred in this session.

## Next check

- Review endpoint logs on 172.16.3.133 for signs of execution or process launch correlated with the SHA-256 values of the downloaded PE and OLE files.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.