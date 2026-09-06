# Cybersecurity “Knowledge Sources” Research Dataset and Evidence Report

## Research method and inclusion rules

Research was completed and verified on **6 September 2026**. The resulting inventory contains **130 recommended cybersecurity knowledge sources** across all **23 requested categories**. Discovery used web search, but inclusion decisions were based on opening and reviewing the canonical source itself rather than relying on search snippets or model memory. Primary material was deliberately preferred: NIST for the Cybersecurity Framework and incident-response guidance, MITRE for ATT&CK and D3FEND, OASIS for STIX/TAXII, OWASP for application and mobile security projects, upstream Kubernetes documentation for Kubernetes security, and official project repositories for open-source tools and detection content. citeturn11view0turn11view8turn11view9turn11view11

Every retained record captures the requested fields: canonical URL, owner or author, source type, primary and secondary categories, a **60–120-word factual description**, researcher assessment of value, use cases, audience, skill levels, access model, registration status, formats, original-versus-aggregated status, maintenance status, geographic/language focus, controlled tags, relationships, limitations, verification date and evidence URLs. The generated descriptions range from **88 to 119 words**.

The final verification pass reopened every recommended canonical URL. Sources that could not be reopened reliably were removed rather than being treated as available on reputation alone. This was important because some otherwise excellent resources failed that strict test during this research session. Where maintenance could be established from current documentation, releases or current-year publications, the record is marked `active`; durable but slower-moving resources are marked `infrequent` rather than being misrepresented as continuously updated.

The selection also distinguishes current official material from historical or transitional states. For example, MITRE’s Caldera page now records that the project was contributed to the Apache Software Foundation’s incubator in May 2026, so the dataset identifies it as **Apache Caldera (Incubating), formerly MITRE Caldera** rather than presenting the old governance model as current. citeturn13view0

Commercial organisations were included only when the source itself supplies meaningful technical research, documentation, rules, tooling, datasets or practical education. This is why research operations such as Google Threat Intelligence, Cisco Talos and Unit 42 are included, while marketing-led vendor pages without substantial technical content are not. citeturn11view21turn11view23turn11view24

## Executive findings

The final dataset has **130 unique sources, 130 unique canonical URLs and no duplicate source names**. All controlled enum values and tags validate against the requested schema. All `related_source_ids` resolve to real source records. Every source has an evidence URL and the verification date `2026-09-06`. The JSON was serialised, reopened and parsed successfully after export.

Coverage exceeds the target of five sources per major technical category. Counting a source when a category is either primary or secondary, the least-populated categories still have **six matching sources**. Particularly deep areas include cybersecurity fundamentals, CTI, threat research, vulnerability research, detection/SOC material, cloud security, application security, defensive architecture, training and tool/data repositories.

The inventory’s strongest conceptual backbone is:

| Area | Core sources in the researched set |
|---|---|
| Fundamentals and architecture | NIST CSF, NIST SP 800-53, NIST SP 800-207, CIS Controls, NCSC Guidance, ASD Essential Eight |
| Threat-informed defence | MITRE ATT&CK, MITRE D3FEND, Center for Threat-Informed Defense, Atomic Red Team, Apache Caldera |
| CTI | OASIS STIX/TAXII, MISP, OpenCTI, ThreatFox, original vendor intelligence |
| Vulnerability research | CVE, NVD, EPSS, OSV, GitHub Advisory Database, CERT/CC Vulnerability Notes, ZDI |
| Detection engineering | Sigma, Elastic Detection Rules, Splunk Security Content, Microsoft Sentinel content, Google SecOps rules |
| DFIR | NIST SP 800-61 Rev. 3, Volatility, Velociraptor, Plaso, Timesketch, Autopsy, The Sleuth Kit |
| Malware and reversing | REMnux, YARA, MalwareBazaar, Malpedia, VirusTotal, Ghidra, FLARE-VM |
| Web and application security | OWASP Top 10, ASVS, WSTG, API Security, Cheat Sheets, PortSwigger Academy and Research |
| Cloud and Kubernetes | CSA Cloud Controls Matrix, AWS/Microsoft/Google guidance, Kubernetes upstream docs, CIS Benchmark, Trivy, Kubescape |
| Mobile | OWASP MASVS and MASTG, Android Security, Apple Platform Security, MobSF, Frida |
| Identity and Active Directory | BloodHound, SpecterOps research, ADSecurity.org, PingCastle, Purple Knight, Microsoft Entra documentation |
| AI and LLM security | OWASP GenAI, MITRE ATLAS, NIST AI RMF, Google SAIF, NCSC guidance, PyRIT, garak, Promptfoo, CSA AI Controls Matrix |

That structure reflects how the sources themselves are intended to be used. ATT&CK supplies a structured adversary-behaviour knowledge base, while D3FEND supplies a defensive-technique knowledge graph; OASIS provides the primary STIX/TAXII standards documentation; Sigma provides a vendor-agnostic detection format. citeturn11view8turn11view9turn11view11turn12view14

DFIR is similarly anchored in primary standards and tooling rather than generic tutorials. NIST SP 800-61 Rev. 3 provides the current NIST incident-response recommendations, while Volatility, Velociraptor, Plaso and Timesketch cover complementary forensic and investigation workflows. citeturn13view12turn13view5turn13view6turn13view8turn13view7

Application security has an unusually strong chain from requirements through testing and practice: OWASP ASVS defines verification requirements; WSTG supplies testing methodology; PortSwigger Web Security Academy supplies interactive web-security labs; PortSwigger Research supplies advanced original web-security research. citeturn14view9turn14view8turn14view6turn14view7

For cloud-native security, the inventory intentionally combines vendor-neutral controls with first-party implementation guidance. CSA’s Cloud Controls Matrix supplies a cloud-specific control framework; upstream Kubernetes documentation explains the platform’s security mechanisms; the CIS Kubernetes Benchmark adds prescriptive configuration checks; Trivy and Kubescape supply operational assessment tooling. citeturn15view5turn15view13turn15view15turn15view16turn15view18

AI security is treated as both governance and technical security rather than only “prompt injection”. The researched set combines NIST AI RMF for risk governance, OWASP GenAI for LLM/application risks, MITRE ATLAS for adversarial behaviours, NCSC lifecycle guidance and practical testing frameworks such as PyRIT, garak and Promptfoo. citeturn16view10turn16view8turn16view9turn16view15turn16view12turn16view13turn16view14

## Master inventory and category coverage

The complete master inventory is in the Markdown report and JSON dataset linked below. The Markdown version contains a compact 130-row index followed by a **full detailed record for every source**. The JSON contains the same 130 records in the requested machine-readable schema.

The collection deliberately gives one source multiple category associations where that reflects real use. For example, YARA is primarily classified under malware analysis but is also linked to detection engineering and repositories/tools; BloodHound is primarily identity security but is relevant to penetration testing, blue teaming and security data; PortSwigger Research spans web security, application security, vulnerability research and exploit-development research. YARA’s official documentation describes the language and its matching capabilities, while BloodHound’s official documentation covers graph-oriented identity attack-path analysis. citeturn12view19turn16view2

Current threat reporting was not reduced to a single vendor’s telemetry. The dataset includes commercial reports such as CrowdStrike’s current threat report and Verizon’s DBIR alongside ENISA, CERT-EU, JPCERT/CC and Singapore CSA material. CrowdStrike’s 2026 report is explicitly based on its Counter Adversary Operations research, while Verizon’s DBIR is an annual breach/incident analysis; ENISA provides an EU institutional threat-landscape perspective. citeturn12view0turn12view3turn11view7turn12view5turn12view6turn17view3

The dataset also contains operational evidence sources rather than only prose. ThreatFox and URLhaus provide machine-readable malicious-infrastructure/IOC material; Stratosphere Laboratory and UNB CIC supply security datasets for research and training; MalwareBazaar supplies malware samples and metadata that require controlled handling. citeturn16view24turn17view0turn16view21turn16view22turn13view17

Academic material is represented separately from operational reporting. The inventory includes the 2026 USENIX Security Symposium proceedings and the arXiv `cs.CR` preprint stream, with arXiv explicitly classified as an aggregator/preprint archive rather than peer-reviewed evidence by default. citeturn12view10turn12view11

## Recommended Start Here collection

The final **Start Here** set contains 22 sources. It is deliberately broader than a beginner reading list: the objective is to provide a compact foundation from which a reader can branch into operations, research or specialist practice.

| Source | Foundation role |
|---|---|
| **NIST Cybersecurity Framework** | Overall cybersecurity risk-management vocabulary and programme structure |
| **CIS Critical Security Controls** | Prioritised defensive safeguards |
| **MITRE ATT&CK** | Adversary-behaviour vocabulary |
| **MITRE D3FEND** | Structured defensive-technique vocabulary |
| **OASIS CTI Documentation** | STIX/TAXII standards and interoperable CTI |
| **FIRST EPSS** | Exploitation-likelihood-informed vulnerability prioritisation |
| **National Vulnerability Database** | Structured vulnerability metadata |
| **Sigma** | Portable detection-rule representation |
| **Zeek** | Network-security telemetry and analysis |
| **Security Onion** | Integrated SOC/network-monitoring environment |
| **NIST SP 800-61 Rev. 3** | Incident-response programme guidance |
| **REMnux** | Malware-analysis workstation and tool ecosystem |
| **Ghidra** | Free general-purpose reverse engineering |
| **PortSwigger Web Security Academy** | Interactive web-security learning |
| **OWASP ASVS** | Application-security verification requirements |
| **CSA Cloud Controls Matrix** | Vendor-neutral cloud controls |
| **Kubernetes Security Documentation** | Upstream Kubernetes security mechanisms |
| **OWASP MASVS** | Mobile application security requirements |
| **BloodHound** | Identity and Active Directory attack-path analysis |
| **OWASP GenAI Security Project** | GenAI/LLM application-security risks |
| **NIST AI Risk Management Framework** | AI risk and governance structure |
| **USENIX Security Symposium** | Peer-reviewed advanced security research |

NIST’s CSF site identifies CSF 2.0 and its implementation resources, making it a stronger starting point than a secondary framework summary. citeturn11view0 The same primary-source principle applies to ATT&CK and D3FEND for threat-informed defence, EPSS for exploitation probability, and upstream Kubernetes documentation for platform-specific security behaviour. citeturn11view8turn11view9turn11view14turn15view13

For mobile security, MASVS is paired with MASTG rather than treating either as complete by itself: MASVS supplies security requirements, while MASTG supplies practical mobile testing material. citeturn15view21turn15view22

## Learning paths and cross-linking

All **11 requested learning paths** are fully specified in the Markdown report. Their ordering follows a common pattern: establish the mental model, learn the primary technical reference, work with operational tooling or evidence, then move to specialised practice and validation.

The paths are:

| Role | Core progression |
|---|---|
| Cybersecurity beginner | NIST CSF → CIS Controls → *Security Engineering* → TryHackMe → OverTheWire → OWASP Top 10 → ATT&CK → Wireshark |
| SOC analyst | CIS Controls → ATT&CK → Security Onion → Zeek → Suricata → Sigma → LetsDefend → CyberDefenders → DFIR Report |
| Detection engineer | ATT&CK → D3FEND → Sigma → Elastic rules → Splunk Security Content → Sentinel content → Atomic Red Team → DFIR Report |
| Threat-intelligence analyst | ATT&CK → STIX/TAXII → MISP → OpenCTI → Google Threat Intelligence → Talos → ENISA → ThreatFox |
| Incident responder | NIST SP 800-61 → Security Onion → Velociraptor → Volatility → Plaso → Timesketch → DFIR Report → malware PCAP practice |
| Malware analyst | REMnux → YARA → MalwareBazaar → VirusTotal → Ghidra → FLARE-VM → Malpedia → malware-traffic exercises |
| Reverse engineer | OpenSecurityTraining2 → Ghidra → IDA Free → Binary Ninja → Cutter → FLARE-VM → LiveOverflow → ROP Emporium |
| Penetration tester | Nmap → OWASP WSTG → Web Security Academy → PentesterLab → Metasploit → HTB Academy → Atomic Red Team → Stratus Red Team |
| Cloud security practitioner | CSA CCM → AWS/Microsoft/Google guidance → Prowler → Kubernetes security → Trivy → Stratus Red Team |
| Application security practitioner | OWASP Top 10 → ASVS → Cheat Sheets → API Security → WSTG → PortSwigger → Semgrep → CodeQL → OSS-Fuzz |
| AI security practitioner | NIST AI RMF → NCSC secure-AI guidance → OWASP GenAI → MITRE ATLAS → SAIF → CSA AI Controls Matrix → garak → PyRIT → Promptfoo |

The research identified **36 explicit high-value cross-link relationships** for later internal linking. Among the most useful are:

**ATT&CK → Atomic Red Team** moves from a documented behaviour to a controlled, repeatable ATT&CK-mapped validation test; Atomic Red Team’s official project presents its tests as small ATT&CK-mapped security tests. citeturn11view8turn12view24

**ATT&CK → Sigma → platform-specific detection repositories** moves from behavioural intelligence into portable detection logic and then into implementation examples for Elastic, Splunk, Microsoft Sentinel or Google Security Operations. citeturn12view14turn12view15turn12view16turn12view17turn12view18

**CVE/NVD → EPSS → Exploit Database** separates three different questions: what vulnerability is being discussed, what structured metadata is known, how likely exploitation is according to EPSS, and whether public proof-of-concept material exists. citeturn11view16turn11view15turn11view14turn14view2

**Plaso → Timesketch** links event extraction and timeline generation to collaborative timeline investigation. citeturn13view8turn13view7

**OWASP Top 10 → ASVS/WSTG → PortSwigger Academy** leads a learner from risk awareness to requirements, testing methodology and hands-on web labs rather than treating the Top 10 as a complete AppSec standard. citeturn11view4turn14view9turn14view8turn14view6

**Kubernetes upstream documentation → CIS Kubernetes Benchmark → Kubescape/Trivy** connects platform semantics to an auditable configuration baseline and then to assessment tooling. citeturn15view13turn15view15turn15view18turn15view16

**MASVS → MASTG → Frida/MobSF** connects mobile requirements to verification procedures and then to practical dynamic or automated analysis tools. citeturn15view21turn15view22turn16view1turn17view7

**OWASP GenAI → MITRE ATLAS → PyRIT/garak/Promptfoo** links application-risk awareness with adversarial-behaviour modelling and repeatable technical testing. citeturn16view8turn16view9turn16view12turn16view13turn16view14

## Gaps, exclusions and remaining uncertainty

The largest structural gap is **language and regional balance** rather than lack of technical material. The inventory contains primary government or institutional sources from the US, UK, Australia, EU, Japan, Singapore and Canada, but the highest-quality successfully verified material remains predominantly English-language. JPCERT/CC and Singapore CSA were retained specifically to reduce a US/EU-only bias. citeturn12view6turn17view3

**Mobile security** has a smaller independent primary-source ecosystem than web and cloud security. The six-source verified core therefore relies heavily on OWASP MASVS/MASTG, Android and Apple first-party architecture material, MobSF and Frida rather than padding the category with generic mobile-security blogs. Android’s source documentation and Apple’s platform-security guide provide the platform-side context that application testing guides cannot replace. citeturn15view23turn15view24turn17view7turn16view1

**Exploit development** likewise has fewer maintained, structured primary curricula than web security. The dataset uses a combination of ROP Emporium, pwntools, OpenSecurityTraining2, Exploit Database, Metasploit documentation, vulnerability research and reverse-engineering material rather than adding weak “learn exploitation” listicles. ROP Emporium is deliberately narrow and challenge-oriented, while pwntools is a tooling reference rather than a methodology. citeturn14view0turn14view1turn14view2turn14view3

Nine notable candidates were excluded because they could not satisfy the final URL-reopen rule in this research environment: **CISA Cybersecurity Performance Goals 2.0, CISA Known Exploited Vulnerabilities Catalog, Google Project Zero Blog, BSI IT-Grundschutz, IACR Cryptology ePrint Archive, pwn.college, Sophos X-Ops Threat Research, CAPE Sandbox and the targeted English CERT Polska portal**. Their exclusion is **not** a finding that they are low quality or permanently offline. In particular, no substitute aggregator was used to “rescue” a failed primary URL.

The report also records access nuances. MalwareBazaar, for example, is technically valuable but distributes live malware samples and therefore carries explicit legal, isolation and safe-handling cautions. citeturn13view17 VirusTotal is classified separately as a mixed/freemium analysis and enrichment service rather than being presented as a definitive malware-verdict authority. citeturn13view18

## Deliverables and validation

**Readable Markdown evidence report — 380 KB, containing all 130 detailed records, category groupings, the 22-source Start Here collection, all 11 learning paths, 36 explicit cross-link opportunities, gaps, rejected candidates and the complete reference list:**

[Download the Markdown research report](sandbox:/mnt/data/cybersecurity_knowledge_sources_research.md)

**Machine-readable JSON dataset — 341 KB, containing all 130 records in the requested schema:**

[Download the JSON dataset](sandbox:/mnt/data/cybersecurity_knowledge_sources.json)

The export passed the following final checks: **130 sources; 130 unique IDs; no duplicate canonical URLs or names; 88–119 words per source description; valid access, origin and maintenance enums; controlled tags only; all related IDs resolve; all evidence URL fields populated; every record dated `2026-09-06`; minimum category coverage of six sources; and successful JSON parse after writing and reopening the file.**

As a final evidence-quality check, the source mix includes first-party standards and frameworks, operational research, practical tools, current institutional material, academic research and hands-on training rather than relying on popularity rankings. Security Onion’s current project page, for example, describes an integrated defensive platform incorporating Zeek and Suricata; PortSwigger provides both distinct training and original-research streams; USENIX provides peer-reviewed proceedings; and the Stratosphere datasets portal provides documented network-security datasets. citeturn13view1turn14view6turn14view7turn12view10turn16view21
