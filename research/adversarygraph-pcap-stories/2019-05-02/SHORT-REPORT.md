# PCAP investigation summary

## What happened

The workstation Breaux-Win7-PC \(10.0.0.227\) participated in standard directory service protocol communication with 10.0.0.10, consistent with normal Windows logon activity and not by itself indicative of compromise.

Breaux-Win7-PC \(10.0.0.227\) established sustained external TCP connections on port 21 to several public IPs, including 145.14.144.10, using protocols that could not be fully decoded; this is an investigation lead but does not alone establish malicious activity or compromise.

## Who was involved

- Breaux-Win7-PC was the primary host participating in the observed external and directory service network activity, bound to IP 10.0.0.227.
- Account adriana.breaux was active on 10.0.0.227 during the capture window.
- IP address 10.0.0.227 is the source of the relevant connections and protocol activity.

## What remains uncertain

- It remains unknown whether any malicious payload was downloaded or executed, as no file transfers or application-layer protocol payloads were observed or recoverable in the decrypted stream coverage.

## Next check

- Review the unidentified external TCP conversations to determine whether they correspond to legitimate FTP usage or potentially malicious activity by inspecting deeper payloads if available.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.