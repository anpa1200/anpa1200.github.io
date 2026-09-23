# PCAP investigation summary

## What happened

The host at 10.3.11.194 downloaded three files with PE \(Windows executable\) content from http://64.44.133.131/images/cursor.png and http://64.44.133.131/images/imgpaper.png during the capture window; these files were served with non-executable URL extensions, which is suspicious but does not prove execution or compromise.

## Who was involved

- The device 10.3.11.194 is observed as an active host in these transfers.

## Key indicators

- The file with SHA-256 68798ccf8e2a5f9682a4e011bec288ad9b3f900244f82c6ae5e8ca538725f92e was downloaded by 10.3.11.194 from 64.44.133.131, matching a PE file signature.
- The file with SHA-256 8aa9c596dd3eb7560bc7416ba181e858f1174fcbcb5432050f3f9a663ed1ffa2 was downloaded by 10.3.11.194 from 64.44.133.131, matching a PE file signature.
- The file with SHA-256 fef9b646dba5c7372fe92b6a9d227833c1d15d8cc3a73fd22be9d1869b21cd67 was downloaded by 10.3.11.194 from 64.44.133.131, matching a PE file signature.

## What remains uncertain

- It is not established whether any of the suspicious PE files downloaded by 10.3.11.194 were executed or led to compromise.

## Next check

- Review endpoint logs or behavioral telemetry for 10.3.11.194 to determine if any of the downloaded executables were run.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.