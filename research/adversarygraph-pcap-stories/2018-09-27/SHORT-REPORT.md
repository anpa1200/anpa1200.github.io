# PCAP investigation summary

## What happened

The host Escritorio-PC \(172.16.5.203\) participated in standard Kerberos authentication and directory protocol activity within a local network, involving accounts such as thiago.almeida and escritorio-pc$.

Directory protocol operations \(LDAP, SAMR, DRSUAPI\) were observed between Escritorio-PC and a domain controller \(172.16.5.5\), but this traffic matches normal Windows logon and user activity, with no evidence for credential theft, discovery, or DCSync.

## Who was involved

- The host Escritorio-PC \(172.16.5.203\) is associated with the accounts thiago.almeida and escritorio-pc$.
- The account thiago.almeida is present as a Kerberos client principal.
- The hostname Escritorio-PC is used by the device at 172.16.5.203.

## What remains uncertain

- There is no evidence of suspicious payload transfers, malware execution, or data exfiltration in this capture.

## Next check

- If investigation is warranted, review endpoint logs on Escritorio-PC for anomalies not detectable in network traffic alone.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.