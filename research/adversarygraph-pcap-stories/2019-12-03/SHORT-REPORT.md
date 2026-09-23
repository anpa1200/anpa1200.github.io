# PCAP investigation summary

## What happened

The host 10.18.20.97, identified as Juanita-Work-PC, engaged in normal directory service protocol activity using LDAP and DRSUAPI with another internal address \(10.18.20.8\); these operations are consistent with standard Windows logon processes and no evidence in the capture supports credential theft, discovery, or DCSync attacks.

## Who was involved

- 10.18.20.97 is the primary observed host in domain directory protocol traffic, associated with accounts JUANITA-WORK-PC$ and momia.juanita, and hostname Juanita-Work-PC.
- JUANITA-WORK-PC$ is an account used by 10.18.20.97 as a Kerberos client principal.
- momia.juanita is an account used by 10.18.20.97 as a Kerberos client principal.

## What remains uncertain

- No exfiltration, malware delivery, or evidence of compromise was observed, but coverage is limited to network activity and encrypted payloads were not decrypted.

## Next check

- Review endpoints for execution, persistence, or suspicious process activity not visible in the capture to confirm absence of malicious behavior.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.