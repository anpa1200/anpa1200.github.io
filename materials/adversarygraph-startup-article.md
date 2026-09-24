# AdversaryGraph: From Security Research Project To CTI-to-Detection Product

Published Medium source: https://medium.com/@1200km/adversarygraph-40df3439b90c

There is a recurring problem inside security teams.

The team has reports. The team has IOCs. The team has ATT&CK knowledge. The team has SIEM rules, EDR telemetry, malware notes, vulnerability context, actor profiles, and incident evidence. The team may also have AI tools.

But the workflow between those things is still fragile.

A CTI analyst reads a report and extracts observables. A detection engineer tries to convert behavior into coverage. A SOC analyst needs triage context. A security leader asks what is actually covered. A researcher wants to connect malware behavior to infrastructure and techniques. Somewhere in the middle, the work becomes spreadsheets, screenshots, one-off scripts, manual notes, and disconnected dashboards.

AdversaryGraph is my attempt to build the missing workbench.

It is a self-hosted CTI-to-detection platform for turning reports, logs, IOCs, malware findings, asset inventories, and ATT&CK knowledge into mapped techniques, investigation context, detection gaps, validation scenarios, and report-ready outputs.

The product idea is simple:

Security intelligence should not stop at "we collected indicators."

It should become operational work.

## Short Introduction

![AdversaryGraph product introduction infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*ML9xzyAJOr2u6l1Dy4RpdA.png)

AdversaryGraph is a self-hosted security intelligence workbench for teams that need to move from threat reports and observables to reviewed detection work. It helps analysts connect IOCs, ATT&CK techniques, malware findings, actor context, attack simulation, rule validation, and reporting in one workflow.

The platform is built for practical security operations: CTI analysts, SOC teams, detection engineers, threat hunters, and security researchers who need evidence-backed outputs instead of disconnected notes and dashboards.

## Get Started

Start here:

- Main product page: https://1200km.com/adversarygraph/
- Documentation: https://1200km.com/adversarygraph-docs/
- GitHub repository: https://github.com/anpa1200/adversarygraph
- Stable v6.0.0 release: https://github.com/anpa1200/adversarygraph/releases/tag/v6.0.0
- v6 release-readiness evidence: https://1200km.com/adversarygraph-docs/release-readiness-v6/
- Case studies and validation: https://1200km.com/adversarygraph-docs/case-studies-validation/

## The Problem I Want To Solve

Most security teams do not suffer from a lack of data.

They suffer from disconnected work.

![Disconnected security-team workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*wQ9kKSGnVT_yA-66vLFWiw.png)

Threat intelligence is often stored in one place. IOC enrichment happens in another. ATT&CK mapping lives in a spreadsheet or Navigator layer. Malware findings stay in a reverse-engineering note. Detection engineering uses separate repositories. SIEM validation is another process. Reports are written manually after all of this.

That creates several practical failures:

![Practical failures in CTI-to-detection work infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*XtHJ_LaywigO5ppn4ezwAw.png)

- intelligence does not reliably become detection work;
- observables are enriched but not connected to behavior;
- ATT&CK mapping is created but not tied to evidence;
- detection gaps are known but not prioritized;
- AI output is accepted too easily or rejected completely;
- analysts repeat the same mechanical steps every week;
- leadership sees activity, but not enough traceable evidence.

AdversaryGraph is built around the opposite workflow.

Start with evidence. Extract entities. Enrich observables. Map behavior. Review assumptions. Compare against actors and campaigns. Identify gaps. Validate detections. Export something useful.

## What AdversaryGraph Is

AdversaryGraph is a self-hosted analyst workbench.

It connects several workflows that are usually split across separate tools:

![AdversaryGraph connected workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*TC8YVMbtvvyvhSdP-TR3RQ.png)

- CTI report analysis;
- IOC enrichment and investigation;
- ATT&CK and ATLAS mapping;
- actor, sector, campaign, and TTP context;
- malware analysis workflows;
- relationship graph review;
- attack simulation and SIEM validation evidence;
- investigation workspaces;
- report generation and export.

The current stable release is AdversaryGraph v6.0.0. The v6 release is important because it moves the project closer to product readiness: repeatable release checks, self-test behavior, documentation, case studies, validation evidence, Docker-based deployment, and clearer operator boundaries.

There is also active post-v6 development around governed Threat Hunting, query libraries, unified RAG, MCP integration, and stronger AI-assisted workflows. Those capabilities are current development unless they are released in a later stable version.

That distinction matters. If this becomes a startup, trust will matter more than hype.

## The Product Principle: AI Assists, Analysts Decide

I do not want AdversaryGraph to be another black-box AI tool that confidently invents security conclusions.

The product direction is governed AI.

![Governed AI assistant principle infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*DNi_29Yj-AYZW9TnUuptxA.png)

AI can help extract IOCs. AI can summarize reports. AI can suggest ATT&CK mappings. AI can help draft hunting hypotheses. AI can propose query structures. AI can explain assumptions. AI can help compare evidence.

But AI output is not evidence.

The analyst must review mappings, citations, assumptions, query syntax, telemetry requirements, and scope before accepting the result.

That principle is visible throughout the platform direction:

- AI suggestions are treated as leads;
- human review is required;
- provider configuration is explicit;
- local and private OpenAI-compatible endpoints are supported;
- sensitive workflows can remain self-hosted;
- generated outputs should preserve assumptions and review notes.

For security teams, this is not a philosophical detail. It is a product requirement.

## The Workflow

A practical AdversaryGraph workflow looks like this:

![Practical AdversaryGraph workflow infographic from the published Medium article](https://cdn-images-1.medium.com/max/1024/1*epIzRt0e6jkfDa6pyUn_kg.png)

1. An analyst uploads or pastes a report, log sample, IOC list, malware note, or asset inventory.
2. The platform extracts candidate observables, entities, behaviors, and ATT&CK techniques.
3. Observables are enriched through configured sources.
4. The analyst reviews relationships, actor leads, technique leads, and evidence conflicts.
5. Reviewed items are added into an investigation workspace.
6. TTPs can be sent to a Navigator-style view or coverage workflow.
7. Detection gaps and validation paths are identified.
8. The final output becomes a report, ATT&CK layer, IOC list, detection backlog material, or handoff package.

This is the product center: not storing intelligence, but operationalizing it.

## Attack Simulation For Rule Validation

One of the most important product directions is using attack simulation to validate detection rules.

Many teams write Sigma rules, SIEM detections, EDR logic, correlation searches, and hunting queries without enough repeatable evidence that the rule matches the behavior it claims to detect.

The result is familiar:

- rules exist, but nobody knows whether the right telemetry is present;
- ATT&CK mappings are attached, but the mapping may be too broad;
- test events are synthetic, but not connected to a realistic attack chain;
- detections fire in a lab, but the assumptions are not documented;
- false positives are discovered later in production;
- leadership sees rule counts instead of validated coverage.

AdversaryGraph should treat rule validation as part of the CTI-to-detection workflow.

The platform can take a reviewed technique, actor behavior, IOC context, or investigation finding and help build a validation scenario around it:

1. Select the ATT&CK technique or behavior to validate.
2. Generate or review an attack simulation scenario.
3. Define required telemetry sources, such as process creation, command line, DNS, proxy, EDR, PowerShell, authentication, or cloud logs.
4. Map the expected events to the detection logic.
5. Run the scenario in an approved lab or controlled environment.
6. Forward or compare events against SIEM or detection tooling.
7. Record whether the rule fired, partially fired, or missed.
8. Save the evidence, assumptions, gaps, and next actions.

This matters because detection engineering should not stop at writing rules.

A useful detection needs a validation trail:

- what behavior was simulated;
- which telemetry was required;
- which event fields were expected;
- which rule or query was tested;
- what fired and what did not;
- what false-positive conditions were identified;
- what gap remains.

For a startup, this is a strong wedge. It connects CTI, ATT&CK mapping, attack simulation, SIEM validation, and detection backlog management into one product story.

## Why Self-Hosted Matters

Security data is sensitive.

Reports can contain customer names, internal infrastructure, private IOCs, incident context, endpoint telemetry, malware samples, and business-specific risk information.

That is why AdversaryGraph is self-hosted first.

Self-hosting gives teams more control over:

- where data is stored;
- which AI providers are enabled;
- whether local/private model gateways are used;
- which feeds and enrichment sources are connected;
- how investigations and outputs are retained;
- what can be shared externally.

For many products, self-hosted is a deployment choice.

For this product category, it can be the reason a team is willing to test it.

## Who It Is For

The first real users are not "everyone in cybersecurity."

The best initial users are teams with a specific CTI-to-detection pain:

- CTI teams that need to turn reports into operational outputs;
- detection engineering teams that need ATT&CK-linked coverage and validation;
- SOC teams that need better triage context and investigation handoff;
- MSSPs that need repeatable customer-facing reporting workflows;
- security research teams that want local intelligence and enrichment workflows;
- enterprises that cannot send sensitive telemetry into generic hosted AI tools.

The strongest beachhead is CTI-to-detection for enterprise security teams.

That is where the pain is visible: too many reports, too many indicators, too much manual mapping, and not enough evidence-backed detection output.

## What Makes It Different

AdversaryGraph is not trying to replace every security tool.

It is not a SIEM replacement. It is not a full CTI platform replacement. It is not only an ATT&CK Navigator. It is not only an AI chatbot.

The value is the connected workflow around those systems.

AdversaryGraph should sit between CTI, enrichment, ATT&CK mapping, malware analysis, detection engineering, and reporting.

The differentiator is the bridge:

- from intelligence to investigation;
- from investigation to TTP mapping;
- from TTP mapping to detection gaps;
- from detection gaps to validation evidence;
- from validation evidence to report-ready output.

That bridge is where analysts lose time today.

## Why This Can Become A Startup

The startup opportunity is not "AI for security" in a generic sense.

That market is already noisy.

The opportunity is narrower and more useful:

Build the analyst workbench for operationalizing threat intelligence into detection and response.

That means the product has to be useful before it is impressive.

It needs to answer practical questions:

- What should I care about in this report?
- Which IOCs matter for my environment?
- Which ATT&CK techniques are supported by evidence?
- Which actor or campaign overlaps are meaningful and which are generic?
- What telemetry do I need to validate this behavior?
- What query should I start from?
- Which detections do we already cover?
- Which gaps should go into the backlog?
- What can I give to my SOC, detection team, or customer?

If AdversaryGraph can answer those questions reliably, with evidence and analyst review, it can become more than a research project.

## Possible Commercial Model

The most realistic commercial path is self-hosted and enterprise-oriented.

Possible packaging:

- Community edition for individual researchers and small teams.
- Pro edition with improved workflows, connectors, and content packs.
- Enterprise edition with RBAC, audit trails, SSO, team workspaces, governance, and support.
- Managed private deployment for teams that want operational help without losing data-boundary control.
- Premium connectors for internal feeds, SIEM, EDR, OpenCTI, MISP, data lakes, and detection repositories.

The first step should not be broad monetization.

The first step should be design partners.

A good design partner is a CTI or detection team that can bring real workflow pressure and say:

- this saved time;
- this reduced handoff friction;
- this produced better reviewable evidence;
- this made detection backlog creation easier;
- this fits or does not fit our deployment requirements.

That feedback is more important than a large feature list.

## What I Would Demo First

The first product demo should be simple.

Do not start with architecture.

Start with analyst pain.

Demo flow:

1. Open the AdversaryGraph dashboard.
2. Paste a CTI report or suspicious log sample.
3. Extract IOCs and ATT&CK candidates.
4. Enrich the observables.
5. Review graph context and technique leads.
6. Send TTPs to a matrix or coverage workflow.
7. Show report output or detection backlog material.
8. Close with release-readiness evidence and self-hosted deployment.

That demo tells the startup story better than a feature tour.

## Current State And Roadmap

Stable today:

- self-hosted CTI-to-detection platform;
- AdversaryGraph v6.0.0 stable release;
- ATT&CK mapping and Navigator workflows;
- IOC investigation and enrichment;
- report analysis and generation;
- malware analysis workflows;
- attack simulation and SIEM rule validation evidence;
- production-readiness documentation and release gate evidence.

Current development and roadmap:

- governed Threat Hunting workspace;
- AI-assisted hunt hypothesis and query generation;
- dynamic hunt query library with Sigma, YARA-L, community examples, and TTP links;
- unified RAG across IOC, CVE, TTP, actor, malware, and report databases;
- MCP-assisted analyst workflows;
- stronger authorization, audit, and enterprise deployment hardening.

The roadmap should stay disciplined. Every feature must support the same product thesis: help analysts turn intelligence into reviewed operational output.

## The Vision

Security teams already have enough raw information.

They need a better way to convert it into decisions, detections, and evidence.

AdversaryGraph is built for that conversion.

If the product continues in the right direction, it can become the workbench where CTI, SOC, detection engineering, malware analysis, and AI-assisted investigation meet.

The goal is not to automate away the analyst.

The goal is to remove the mechanical friction around the analyst, preserve evidence, make assumptions visible, and help teams move faster from intelligence to action.

That is the startup I want AdversaryGraph to become.
