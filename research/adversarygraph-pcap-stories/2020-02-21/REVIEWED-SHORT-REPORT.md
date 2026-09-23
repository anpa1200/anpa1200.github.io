# One-Hot-Mess — reviewed investigation summary

**Reference-assisted review, not native model output.**

Gabriella Ventura’s workstation (172.17.8.174, DESKTOP-TZMKHKC) downloaded the Dridex payload from blueflag[.]xyz and subsequently communicated over TLS with 91.211.88[.]122. The native report finds the initial transfer but misses that follow-on context. The publisher’s persistence details came from additional host artifacts, which were not supplied to this PCAP-only run.

Native result: **partial**. Misses Dridex and the later suspicious TLS activity. The claim that no post-download malicious behavior is supported is broader than the selected evidence justifies.

[Official answers](https://www.malware-traffic-analysis.net/2020/02/21/page2.html) · [Frozen native report](SHORT-REPORT.md) · [Exact comparison](ANSWER-COMPARISON.json)
