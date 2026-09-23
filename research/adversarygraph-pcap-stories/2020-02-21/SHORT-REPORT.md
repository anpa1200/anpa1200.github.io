# PCAP investigation summary

## What happened

The host at 172.17.8.174, associated with user gabriella.ventura, downloaded a Windows executable file via HTTP from blueflag.xyz \(49.51.172.56\); the file content was confirmed as a Portable Executable by exact SHA-256 match.

The same host also downloaded a ZIP archive via HTTP from a Microsoft-associated delivery domain \(205.185.216.42\), with file content matching exactly by SHA-256; there is no direct evidence either downloaded file was executed.

Directory-service \(LDAP, SAMR, DRSUAPI\) protocol traffic between 172.17.8.174 and 172.17.8.8 was present but matches normal Windows authentication and management patterns; this alone does not establish compromise or lateral movement.

## Who was involved

- 172.17.8.174 — Source host for both file downloads and directory authentication traffic.
- gabriella.ventura — Windows user conducting network activity.

## What remains uncertain

- It is not known if either downloaded file was executed on 172.17.8.174 after download, and there is no packet evidence of post-download malicious behavior.

## Next check

- Verify whether the executable downloaded from blueflag.xyz was launched or present on 172.17.8.174, and investigate the provenance and intent of both downloaded files using endpoint telemetry.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.