# Okay-Boomer — reviewed investigation summary

**Reference-assisted review, not native model output.**

Candice Tucker’s Windows host (10.11.11.203, TUCKER-WIN7-PC) downloaded a Windows executable from acjabogados[.]com/40group.tiff. The recovered hash matches the publisher’s sample. Subsequent TCP attempts targeted 5.188.108[.]58 and 138.201.6[.]195 without a response. These are attempted connections, not proof of a successful command-and-control session.

Native result: **partial**. Omits the subsequent connection attempts. The exact payload is not included in the short IOC list; the new extension-mismatch rule does not yet cover .tiff.

[Official answers](https://www.malware-traffic-analysis.net/2019/11/12/page2.html) · [Frozen native report](SHORT-REPORT.md) · [Exact comparison](ANSWER-COMPARISON.json)
