# AdversaryGraph Startup Pitch Deck

Working title: AdversaryGraph - The CTI-to-Detection Workbench for Security Teams

Audience: investors, design partners, security leaders, CTI teams, detection engineering leaders, MSSPs, and enterprise SOC operators.

Fact boundary: AdversaryGraph v6.0.0 is the current stable release. Unified RAG, MCP, governed Threat Hunting, and the Threat Hunting Query Library are post-v6 current-development capabilities and should be presented as roadmap or active development unless released separately.

Published Medium source for the infographic set: https://medium.com/@1200km/adversarygraph-40df3439b90c

---

## Slide 1 - Title

AdversaryGraph

The self-hosted analyst workbench that turns threat intelligence, IOCs, malware findings, reports, and ATT&CK knowledge into investigation context, detection gaps, validation scenarios, and report-ready outputs.

Speaker note:
Security teams do not need another dashboard that stores indicators. They need a repeatable way to move from intelligence to action. AdversaryGraph is built for that workflow.

Visual:
Full-screen product screenshot of the Discover dashboard or Navigator matrix.

Infographic:
![AdversaryGraph product introduction infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*ML9xzyAJOr2u6l1Dy4RpdA.png)

---

## Slide 2 - Short Introduction

AdversaryGraph is a self-hosted security intelligence workbench for moving from reports, IOCs, malware findings, logs, and ATT&CK knowledge to reviewed detection work.

It gives CTI analysts, SOC teams, detection engineers, threat hunters, and security researchers one workflow for enrichment, mapping, attack simulation, rule validation, investigation context, and report-ready outputs.

Speaker note:
Use this as the 20-second explanation before going into the problem. The product is not only a CTI database and not only an AI assistant. It is a workbench for turning intelligence into operational security work.

Visual:
One product screenshot with a simple caption: "From intelligence to validated detection work."

Infographic:
![Practical AdversaryGraph workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*epIzRt0e6jkfDa6pyUn_kg.png)

---

## Slide 3 - The Problem

Security teams collect more intelligence than they can operationalize.

- CTI reports arrive as PDFs, blogs, vendor notes, malware writeups, and raw observables.
- SOC teams need queries, detections, enrichment, prioritization, and investigation context.
- Detection engineers need ATT&CK mapping, coverage gaps, validation paths, and evidence.
- Existing tools often split intelligence, IOC enrichment, malware analysis, detection backlog, and reporting into separate workflows.

Speaker note:
The gap is not only data volume. The gap is the handoff from knowledge to investigation, from investigation to detection, and from detection to validated operational coverage.

Visual:
Flow diagram: Reports and IOCs -> analyst bottleneck -> SIEM/EDR backlog.

Infographic:
![Disconnected security-team workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*wQ9kKSGnVT_yA-66vLFWiw.png)

---

## Slide 4 - Why Now

The pressure on security teams is changing.

- AI increases the speed of both attacker experimentation and defender tooling.
- CTI teams are expected to produce operational outcomes, not only intelligence summaries.
- SOCs need faster triage without losing analyst review and evidence discipline.
- Security leaders need proof that detections map to real adversary behavior.
- Self-hosted and private AI workflows matter because security data is sensitive.

Speaker note:
AI does not remove the analyst. It changes what the analyst should spend time on. AdversaryGraph is designed around AI-assisted workflows with explicit human review.

Visual:
Timeline: intelligence collection -> AI-assisted analysis -> human review -> detection validation.

---

## Slide 5 - Product Thesis

AdversaryGraph is an analyst workbench, not only a feed aggregator.

It connects:

- CTI extraction
- IOC enrichment
- ATT&CK and ATLAS mapping
- actor and campaign context
- malware analysis workflows
- attack simulation and SIEM validation evidence
- investigation workspaces
- exportable reports and layers

Speaker note:
The product thesis is simple: every intelligence object should become investigation context, every investigation should create detection work, and every detection claim should be reviewable against evidence.

Visual:
Product system map with modules as nodes around an investigation workspace.

Infographic:
![AdversaryGraph connected workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*TC8YVMbtvvyvhSdP-TR3RQ.png)

---

## Slide 6 - Product Demo Flow

A repeatable analyst path:

1. Upload or paste a CTI report, log sample, IOC list, or malware finding.
2. Extract entities, IOCs, behaviors, and ATT&CK candidates.
3. Enrich observables with configured internal and external sources.
4. Review graph relationships, actor leads, technique leads, and evidence conflicts.
5. Add reviewed items into an investigation workspace.
6. Send TTPs to Navigator or detection coverage views.
7. Generate report-ready outputs with human validation.

Speaker note:
This is the story for the first product video and live demo. Start with raw material, end with reviewed operational output.

Visual:
Seven-step horizontal product walkthrough with screenshots.

---

## Slide 7 - Core Platform Modules

Stable v6.0.0 product surface:

- Discover and module launcher
- ATT&CK Navigator and public Threat Matrix relationship
- AI-assisted report analysis
- IOC library and IOC investigation
- actor, sector, campaign, and TTP context
- malware analysis workbench
- attack simulation and validation workflows
- release readiness, self-test, and operator evidence

Speaker note:
The strongest product story is breadth with governance. AdversaryGraph covers the CTI-to-detection path, while v6 adds stronger readiness and validation evidence.

Visual:
Grid of module screenshots, one line of value under each.

---

## Slide 8 - The AI Position

AI assists. Analysts decide.

AdversaryGraph should be positioned around governed AI:

- AI output is a lead, not evidence.
- Every mapping requires analyst review.
- Provider configuration is explicit.
- Private or local OpenAI-compatible endpoints are supported.
- Sensitive security workflows can stay self-hosted.
- Post-v6 RAG and MCP work expands retrieval and workflow assistance, but remains current development until released.

Speaker note:
The market is crowded with AI claims. The differentiator is disciplined AI: useful suggestions, clear boundaries, and human review at decision points.

Visual:
AI assistant panel with "Human review required" callout.

Infographic:
![Governed AI assistant principle infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*DNi_29Yj-AYZW9TnUuptxA.png)

---

## Slide 9 - Differentiation

AdversaryGraph combines areas that are usually separate.

| Common Need | Typical Tool Split | AdversaryGraph Direction |
| --- | --- | --- |
| CTI extraction | document parser or manual notes | report-to-entities-to-TTP workflow |
| IOC enrichment | reputation portals | investigation-centered enrichment |
| ATT&CK mapping | spreadsheet or Navigator only | matrix plus investigation context |
| malware analysis | separate sandbox or static tool | malware findings connected to CTI and TTPs |
| detection validation | SIEM-only workflow | attack simulation and evidence-backed validation |
| reporting | manual writeup | reviewed structured outputs |

Speaker note:
The business value is not one feature. It is reducing context switching across the analyst workflow.

Visual:
Split-screen "before" tool sprawl vs "after" connected workbench.

Infographic:
![Practical failures in CTI-to-detection work infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*XtHJ_LaywigO5ppn4ezwAw.png)

---

## Slide 10 - Target Users

Initial customer profiles:

- CTI teams that need to operationalize reports and observables.
- Detection engineering teams that need ATT&CK-linked backlog and coverage validation.
- SOC teams that need triage context and investigation handoff.
- MSSPs that need repeatable customer-facing reporting workflows.
- Security research teams that need local, self-hosted intelligence workflows.
- Enterprises that cannot send sensitive telemetry to fully hosted AI services.

Speaker note:
The first design partners should have a real CTI-to-detection pain: too many reports, too many observables, and not enough structured operational output.

Visual:
Persona cards with job-to-be-done.

---

## Slide 11 - Beachhead Use Case

Beachhead: CTI-to-detection workflow for enterprise security teams.

Example:

An analyst receives a report about infrastructure and behaviors relevant to their sector. AdversaryGraph helps them:

- extract IOCs and TTP candidates;
- enrich observables;
- compare with actor and campaign context;
- build an investigation graph;
- identify detection coverage gaps;
- export report-ready findings and detection backlog material.

Speaker note:
This is the cleanest commercial wedge because it touches CTI, SOC, and detection engineering at the same time.

Visual:
One real-looking customer workflow, no unsupported customer logo.

---

## Slide 12 - Attack Simulation For Rule Validation

Detection rules need evidence, not only syntax.

AdversaryGraph can connect attack simulation to rule validation:

- select an ATT&CK technique or behavior from an investigation;
- define the expected telemetry sources and event fields;
- generate or review a controlled simulation scenario;
- test the rule, query, or correlation logic against the scenario;
- record fired, missed, partial, and false-positive outcomes;
- preserve evidence for detection backlog and leadership reporting.

Speaker note:
This is a strong buyer-facing story. It moves AdversaryGraph from "CTI analysis tool" to "evidence-backed detection engineering workbench." The value is not just creating rules. The value is proving what those rules actually detect.

Visual:
Rule validation loop: TTP -> simulation -> telemetry -> SIEM/EDR rule -> result -> evidence/gap.

---

## Slide 13 - Product Readiness

AdversaryGraph v6.0.0 focuses on production readiness evidence.

The release package includes:

- stable release metadata;
- repeatable release-readiness checks;
- Docker Compose and deployment validation;
- frontend and backend checks;
- dependency audit and static analysis gates;
- secret scanning;
- self-test and operator troubleshooting;
- documentation and case-study evidence.

Speaker note:
For a startup, credibility matters. v6.0.0 is important because it moves the platform from "interesting project" toward a product with repeatable validation.

Visual:
Release gate checklist with green checks.

---

## Slide 14 - Deployment Model

Self-hosted first.

Why this matters:

- CTI, IOCs, telemetry, and reports can be sensitive.
- Many teams need local data boundaries.
- Private LLM gateways and local model endpoints are important for regulated environments.
- Docker-based deployment lowers trial friction.
- Future commercial packaging can add managed updates, enterprise support, and team controls.

Speaker note:
Do not position self-hosted as a limitation. For security teams, it is often the buying reason.

Visual:
Architecture: browser, API, worker, database, Redis, local/remote AI providers, feeds.

---

## Slide 15 - Roadmap Narrative

Roadmap themes:

- governed Threat Hunting workspace;
- dynamic hunt query library with Sigma, YARA-L, community and internal examples;
- unified RAG across IOC, CVE, TTP, actor, malware, and report databases;
- MCP-assisted workflows for analyst actions;
- enterprise RBAC, audit trails, and deployment hardening;
- stronger integrations with SIEM, EDR, OpenCTI, MISP, and internal data lakes.

Speaker note:
Present this as current development and roadmap, not as part of v6.0.0 unless a later release makes it stable.

Visual:
Now, Next, Later roadmap.

---

## Slide 16 - Business Model Options

Possible commercial paths:

- open-core self-hosted platform;
- paid enterprise edition with RBAC, audit, SSO, multi-user workflows, and support;
- managed private deployment for teams that want hosted operations but controlled data boundaries;
- premium feed connectors and detection-content packs;
- design-partner programme for CTI and detection engineering teams.

Speaker note:
The likely first monetization path is not a broad public SaaS. It is a trusted self-hosted security product with paid support and enterprise-grade packaging.

Visual:
Packaging ladder: Community -> Pro -> Enterprise -> Managed Private.

---

## Slide 17 - Competitive Frame

AdversaryGraph sits between CTI platforms, ATT&CK tools, IOC enrichment, detection engineering workflows, and AI analyst assistants.

It should not claim to replace everything.

It should claim to connect the operational workflow:

- from intelligence to investigation;
- from investigation to TTP mapping;
- from TTP mapping to detection gaps;
- from detection gaps to validation evidence;
- from validation evidence to report-ready outputs.

Speaker note:
Avoid "we replace MISP/OpenCTI/SIEM." The stronger message is "we operationalize and connect the work around them."

Visual:
Market map with AdversaryGraph in the workflow layer.

---

## Slide 18 - Evidence And Trust

Trust signals to show:

- GitHub release v6.0.0 and source visibility.
- Public documentation and screenshot-backed guides.
- Release readiness evidence.
- Case studies and validation examples.
- Explicit current-development labels for unreleased features.
- Human-review boundaries for AI output.

Speaker note:
For security buyers, trust comes from evidence, not adjectives. Show how the platform is built, tested, deployed, and bounded.

Visual:
Evidence links and screenshots from docs.

---

## Slide 19 - Design Partner Ask

Looking for design partners who can validate:

- CTI report ingestion and enrichment workflows;
- IOC-to-TTP and actor-context workflows;
- detection coverage and ATT&CK mapping workflows;
- threat hunting query generation and review;
- self-hosted deployment requirements;
- enterprise controls needed for procurement.

Speaker note:
The goal of design partners is not vanity feedback. It is to find the narrow paid workflow that has budget and urgency.

Visual:
Design partner programme card with expected inputs and outputs.

---

## Slide 20 - The Startup Opportunity

The opportunity:

Security teams have intelligence, telemetry, tools, and models. They lack a governed workbench that turns all of it into repeatable analyst action.

AdversaryGraph can become the product layer for:

- CTI operationalization;
- AI-assisted analyst workflows;
- evidence-backed detection engineering;
- self-hosted security intelligence automation.

Speaker note:
The startup story is not "another AI security tool." It is "the analyst workbench for operationalizing intelligence into detection and response."

Visual:
One-sentence product vision over product UI.

---

## Slide 21 - Demo Script

Five-minute demo:

1. Open Discover dashboard.
2. Show a CTI report or suspicious log input.
3. Extract IOCs and ATT&CK candidates.
4. Open IOC investigation and enrichment.
5. Send TTPs to Navigator or coverage view.
6. Show investigation/report output.
7. Mention v6 release-readiness evidence.
8. Close with roadmap: governed Threat Hunting, RAG, MCP.

Speaker note:
Keep the demo operational. Do not spend the first minutes explaining architecture. Show the workflow first.

Visual:
Demo storyboard with screenshots.

---

## Slide 22 - Closing

AdversaryGraph turns threat intelligence into operational security work.

Stable today:

- self-hosted CTI-to-detection platform;
- v6.0.0 release-readiness evidence;
- ATT&CK mapping, IOC investigation, malware analysis, attack simulation, validation, and reporting workflows.

Building next:

- governed Threat Hunting;
- dynamic query library;
- unified RAG;
- MCP-assisted analyst actions;
- enterprise-grade packaging.

Ask:
Design partners, early enterprise users, and security teams willing to validate the CTI-to-detection workflow in real environments.

---

## Slide 23 - Get Started

Open the product and evidence trail:

- Main product page: https://1200km.com/adversarygraph/
- Documentation: https://1200km.com/adversarygraph-docs/
- GitHub repository: https://github.com/anpa1200/adversarygraph
- Stable v6.0.0 release: https://github.com/anpa1200/adversarygraph/releases/tag/v6.0.0
- v6 release-readiness evidence: https://1200km.com/adversarygraph-docs/release-readiness-v6/
- Case studies and validation: https://1200km.com/adversarygraph-docs/case-studies-validation/

Speaker note:
End with concrete links. The goal is to move an interested buyer, design partner, or investor from the pitch into the actual product page, documentation, release evidence, and source repository.

Visual:
QR codes or link cards for product page, docs, and GitHub.
