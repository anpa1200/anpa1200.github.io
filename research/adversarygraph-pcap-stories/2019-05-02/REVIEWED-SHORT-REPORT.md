# BeguileSoft — reviewed investigation summary

**Reference-assisted review, not native model output.**

The published case identifies Hawkeye stealing information from Adriana Breaux’s workstation (10.0.0.227, BREAUX-WIN7-PC). FTP uploads carry credential data, keystrokes and screenshots to files.000webhost[.]com. The native report identifies the host and port-21 sessions but fails to interpret the FTP transfer behavior that explains the incident.

Native result: **missed**. Misses FTP-based theft and Hawkeye. “Decrypted stream coverage” is misleading: this workflow did not decrypt TLS payloads.

[Official answers](https://www.malware-traffic-analysis.net/2019/05/02/page2.html) · [Frozen native report](SHORT-REPORT.md) · [Exact comparison](ANSWER-COMPARISON.json)
