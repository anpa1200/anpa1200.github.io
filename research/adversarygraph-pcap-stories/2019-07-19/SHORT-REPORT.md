# PCAP investigation summary

## What happened

The device with IP 172.16.4.205 made repeated outbound HTTP POST requests to 31.7.62.214 using a User-Agent string identifying NetSupport Manager remote-access software, over cleartext HTTP on TCP port 443.

Around the same period, the same internal device sent large HTTP POST requests exceeding one megabyte each to 185.243.115.84 at b5689023.green.mattingsolutions.co, with POST traffic involving suspicious URL parameters.

## Who was involved

- Internal workstation Rotterdam-PC \(IP 172.16.4.205\) is associated with user matthijs.devries.

## Key indicators

- The IP 31.7.62.214 received repeated POST requests with a remote-access tool signature from 172.16.4.205.
- The domain b5689023.green.mattingsolutions.co hosted large HTTP POST traffic, which may indicate suspicious outbound data transfer.

## Supported technique candidates

- Outbound HTTP POST requests to suspicious infrastructure are candidate Web Protocol C2 activity \(T1071.001\), not proven adversary command and control.

## What remains uncertain

- No endpoint context or execution evidence confirms whether unauthorized remote access or exfiltration occurred; observable user behavior is unknown.

## Next check

- Review the endpoint Rotterdam-PC for remote-access software presence, user activity, and corroborating evidence of C2 or data exfiltration, as network traffic alone is insufficient for a full compromise assessment.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.