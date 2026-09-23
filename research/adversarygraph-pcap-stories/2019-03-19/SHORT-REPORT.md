# PCAP investigation summary

## What happened

The host 10.0.90.215 \(Bobby-Tiger-PC\) downloaded two executable files via HTTP from external servers 209.141.34.8 and 217.23.14.81, with SHA-256 hashes 2a9b0ed40f1f0bc0c13ff35d304689e9cadd633781cbcad1c2d2b92ced3f1c85 and 5865e801e6324166d6d05b39a14f2a8a798c6eb652831f78c2634f2b7a400eaf respectively.

These downloads correspond to transfers of potential PE \(Portable Executable\) files named test1.exe and f4.exe, suggesting a candidate for ingress tool transfer \(ATT&CK T1105\), but there is no evidence establishing whether the files were executed, nor proof of malicious purpose or system compromise during the capture.

## Who was involved

- The main device involved is Bobby-Tiger-PC \(10.0.90.215\), with observed Windows accounts bobby-tiger-pc$ and bobby.tiger.

## Supported technique candidates

- Ingress Tool Transfer is a candidate technique due to observed executable downloads \(ATT&CK T1105\), but adversary presence is not confirmed.

## What remains uncertain

- It remains unknown whether either of the downloaded executables were launched or if any further action was taken on the host.

## Next check

- Check endpoint telemetry on 10.0.90.215 to determine if the files 2a9b0ed40f1f0bc0c13ff35d304689e9cadd633781cbcad1c2d2b92ced3f1c85 and 5865e801e6324166d6d05b39a14f2a8a798c6eb652831f78c2634f2b7a400eaf were executed or triggered further activity.

Analyst-review draft. Exact evidence references and provider provenance are retained in the structured record.