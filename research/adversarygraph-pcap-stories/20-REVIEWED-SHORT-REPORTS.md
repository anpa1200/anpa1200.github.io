# Twenty PCAP cases: concise reviewed explanations

These paragraphs were written after opening the official answers. They are **reference-assisted reviews**, not platform scores or substituted model results. Native summaries and screenshots remain unchanged.

## 1. Steelcoffee — 2020-04-24

Elmer Obrien’s workstation (10.0.0.167, DESKTOP-GRIONXA) received a Windows executable disguised as a PNG from alphapioneer[.]com. Its recovered SHA-256 matches the publisher’s Qakbot sample. The packet transfer and identity are established; the family identification comes from the published investigation, not a successful live reputation lookup in this run.

Native result: **partial**. [Comparison and evidence](2020-04-24/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2020/04/24/page2.html)

## 2. Mondogreek — 2020-03-14

On March 11, Otis Witherspoon’s laptop (10.3.11.194, LAPTOP-7XMV2SN) received Trickbot and made follow-on encrypted and HTTP communications. The published chain starts with YAS20.exe from bolton-tech[.]com; later executable modules were served as cursor.png and imgpaper.png from 64.44.133[.]131. The native summary covers those later downloads, not the complete chain.

Native result: **partial**. [Comparison and evidence](2020-03-14/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2020/03/14/page2.html)

## 3. One-Hot-Mess — 2020-02-21

Gabriella Ventura’s workstation (172.17.8.174, DESKTOP-TZMKHKC) downloaded the Dridex payload from blueflag[.]xyz and subsequently communicated over TLS with 91.211.88[.]122. The native report finds the initial transfer but misses that follow-on context. The publisher’s persistence details came from additional host artifacts, which were not supplied to this PCAP-only run.

Native result: **partial**. [Comparison and evidence](2020-02-21/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2020/02/21/page2.html)

## 4. Sol-Lightnet — 2020-01-30

Alejandrina Hogue’s workstation (10.20.30.227, DESKTOP-4C02EMG) received sv.exe from gengrasjeepram[.]com, then posted to twereptale[.]com. The publisher identifies Hancitor and additional encrypted payload transfers from xolightfinance[.]com. The Claude summary correctly connects the first download and POST activity, while leaving execution and attribution unconfirmed.

Native result: **partial**. [Comparison and evidence](2020-01-30/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2020/01/30/page2.html)

## 5. It happened on Christmas day — 2019-12-25

This capture shows web-server reconnaissance, not an established malware callback. The scanner 139.199.184[.]166 probed the server exposed as 128.199.64[.]235, with internal address 10.12.25.101, including activity against ports 80, 8080 and 8983. The native summary reverses the investigative emphasis by describing possible beaconing or data transfer.

Native result: **missed**. [Comparison and evidence](2019-12-25/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/12/25/page2.html)

## 6. Icemaiden — 2019-12-03

The publisher identifies Ursnif activity on JUANITA-WORK-PC (10.18.20.97), used by momia.juanita. Webmail activity precedes the infection, but email delivery is a hypothesis rather than proof. AdversaryGraph finds the correct identity yet summarises routine directory traffic, failing to explain the suspicious part of the capture.

Native result: **missed**. [Comparison and evidence](2019-12-03/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/12/03/page2.html)

## 7. Okay-Boomer — 2019-11-12

Candice Tucker’s Windows host (10.11.11.203, TUCKER-WIN7-PC) downloaded a Windows executable from acjabogados[.]com/40group.tiff. The recovered hash matches the publisher’s sample. Subsequent TCP attempts targeted 5.188.108[.]58 and 138.201.6[.]195 without a response. These are attempted connections, not proof of a successful command-and-control session.

Native result: **partial**. [Comparison and evidence](2019-11-12/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/11/12/page2.html)

## 8. Badbundt — 2019-08-20

The published investigation identifies Ursnif followed by Trickbot on Reginald Chandler’s TAMPA-OFFICE-PC (10.8.20.101). Initial delivery, encrypted follow-up transfers and later executable modules form a multi-stage infection. Some .rar-looking responses contain encrypted data, not recoverable plaintext executables. The platform has packet evidence, but no validated native short summary was saved.

Native result: **withheld**. [Comparison and evidence](2019-08-20/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/08/20/page2.html)

## 9. So hot right now — 2019-07-19

The publisher describes a fake-browser-update infection on ROTTERDAM-PC (172.16.4.205), used by matthijs.devries, followed by NetSupport remote-access traffic and uploaded desktop screenshots. The native summary recognises NetSupport and large POST transfers but does not recover the full fake-update-to-screenshot-theft story. The packet destination is 31.7.62[.]214, despite the answer listing .213.

Native result: **partial**. [Comparison and evidence](2019-07-19/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/07/19/page2.html)

## 10. Phenomenoc — 2019-06-22

The reference identifies Rig exploit-kit delivery of KPOT Stealer to BANGKOK-8AC2-PC (10.0.76.109), used by edris.haight. Delivery involves 37.46.135[.]170; follow-on traffic uses 8.209.83[.]76 and fghjkmgru34[.]site. The native report notices the executable-declared transfer but misses the delivery mechanism, stealer and later communications.

Native result: **partial**. [Comparison and evidence](2019-06-22/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/06/22/page2.html)

## 11. BeguileSoft — 2019-05-02

The published case identifies Hawkeye stealing information from Adriana Breaux’s workstation (10.0.0.227, BREAUX-WIN7-PC). FTP uploads carry credential data, keystrokes and screenshots to files.000webhost[.]com. The native report identifies the host and port-21 sessions but fails to interpret the FTP transfer behavior that explains the incident.

Native result: **missed**. [Comparison and evidence](2019-05-02/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/05/02/page2.html)

## 12. StingrayAhoy — 2019-04-15

The reference describes Ursnif followed by AZORult on Kim Jooyoung’s SEOUL-4A67-PC (10.0.90.175). The recoverable Ursnif executable has SHA-256 50007a82…09e3a2. That exact hash also received the run’s only direct malicious-file reputation match, labelled Gozi by MalwareBazaar. Nevertheless, no validated native short report was saved.

Native result: **withheld**. [Comparison and evidence](2019-04-15/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/04/15/page2.html)

## 13. LittleTigers — 2019-03-19

Bobby Tiger’s workstation (10.0.90.215, BOBBY-TIGER-PC) downloaded test1.exe and f4.exe. The recovered hashes exactly match the publisher’s Remcos and Dridex payloads. The reference also describes distinct follow-on communications. The native summary accurately records the two transfers but stops before explaining the two-malware incident.

Native result: **partial**. [Comparison and evidence](2019-03-19/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/03/19/page2.html)

## 14. StormTheory — 2019-02-23

The published investigation identifies IcedID and Trickbot on Ruby Ferguson’s FERGUSON-WIN-PC (10.2.23.231). Six executable downloads include files masquerading as images. The native summary finds suspicious downloads but describes only four files, then ambiguously says troll1.jpg was “also” downloaded. It does not explain the multi-stage infection.

Native result: **partial**. [Comparison and evidence](2019-02-23/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/02/23/page2.html)

## 15. TimberShade — 2019-01-28

Margaret Dunn’s DUNN-WINDOWS-PC (172.17.8.109) downloaded actiV.bin from 91.121.30[.]169:8000. The recovered executable hash matches the publisher’s sample; the reference’s associated IDS alerts support Dridex. The native report correctly explains the download and identity but leaves the malware family and subsequent incident unresolved.

Native result: **partial**. [Comparison and evidence](2019-01-28/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2019/01/28/page2.html)

## 16. Eggnog Soup — 2018-12-18

Among several devices, the publisher identifies 172.16.3.133 as the workstation showing Emotet and IcedID activity. The native report selects the same host and connects it with executable and document downloads. It does not identify the malware chain; its wording about possible macros is a hypothesis, not extracted macro evidence.

Native result: **partial**. [Comparison and evidence](2018-12-18/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2018/12/18/page2.html)

## 17. Turkey and Defence — 2018-11-07

The published case identifies Ursnif/Gozi delivery to Carlos Danger’s DANGER-WIN-PC (10.22.15.119). An executable served through shumbildac[.]com is 439,808 bytes and has an answer-listed SHA-256. Ordinary university browsing in the same capture is unrelated. The native platform has retained packet evidence but no validated short narrative.

Native result: **withheld**. [Comparison and evidence](2018-11-07/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2018/11/07/page2.html)

## 18. Happy Halloween — 2018-10-31

The reference identifies Trickbot on Ichabod Crane’s HEADLESS-PC (10.100.9.107). The relevant executable transfer is 46.173.214[.]185/startr.ack around 15:34 UTC, after ordinary startup traffic. Its recoverable hash is listed in the answer. The platform’s final report-writing state is withheld; this explanation is reference-assisted, not native output.

Native result: **withheld**. [Comparison and evidence](2018-10-31/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2018/10/31/page2.html)

## 19. Blank Clipboard — 2018-09-27

The publisher links this infection to the first supplied email, a WhatsApp-themed lure. Its URL leads through lealcontabil[.]com and 54.38.137[.]127 to a Dropbox-hosted ZIP; another response contains encoded data rather than a normal ZIP. The native summary instead describes routine directory traffic and incorrectly implies no suspicious transfers occurred.

Native result: **missed**. [Comparison and evidence](2018-09-27/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2018/09/27/page2.html)

## 20. Sputnik House — 2018-08-12

Mikhail Petrov’s PETROV2018-PC (192.168.1.95) followed a download chain and repeatedly posted to 185.68.93[.]18/dot.php. The publisher links the chain to an IQY email attachment and notes a Marap-associated alert, while retaining family uncertainty. The native summary captures the host and callbacks but does not identify the initiating attachment or clearly explain the executable stage.

Native result: **partial**. [Comparison and evidence](2018-08-12/ANSWER-COMPARISON.json) · [Official answers](https://www.malware-traffic-analysis.net/2018/08/12/page2.html)
