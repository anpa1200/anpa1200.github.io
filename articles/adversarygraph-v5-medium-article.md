# AdversaryGraph v5.0: From CTI Mapping to Attack Simulation and SIEM Validation

*A self-hosted CTI-to-detection workbench for ATT&CK mapping, IOC investigation, malware analysis, asset attack-surface mapping, attack simulation, and detection engineering validation.*

![AdversaryGraph Discover dashboard](https://1200km.com/adversarygraph-docs/img/adversarygraph-v4-platform/01-discover-dashboard.png)

## Introduction

AdversaryGraph started as a practical question:

How can a security team move from threat intelligence to detection engineering without losing the evidence trail?

Most CTI workflows produce useful text, but the next steps are often manual. An analyst reads a report, extracts behaviors, maps them to MITRE ATT&CK, compares them with known actors, enriches IOCs, writes detection ideas, and then asks a detection engineer to validate whether telemetry actually exists in the SIEM.

That gap is where a lot of defensive work slows down.

AdversaryGraph v5.0 is my attempt to make that workflow more operational. It is not only a CTI visualization project. It is a self-hosted analyst workbench that connects:

- Report and telemetry analysis.
- ATT&CK technique mapping.
- Group, campaign, and report similarity.
- IOC enrichment and investigation.
- Malware analysis workflows.
- Asset attack-surface mapping.
- Attack simulation.
- SIEM forwarding and validation.
- Analyst-ready documentation and reports.

The main addition in release 5.0 is **Attack Simulation**: a controlled ATT&CK validation workspace where an analyst can select a technique, run approved lab scenarios, inspect target-side telemetry, forward logs to a SIEM collector, and use an AI assistant to generate coherent multi-phase attack-chain drills.

This article explains what is new in v5.0, how the architecture works, what the platform can do today, and how I expect analysts and detection engineers to use it.

Project links:

- Live workspace: https://1200km.com/threat-matrix/
- Project landing page: https://1200km.com/adversarygraph/
- Documentation: https://1200km.com/adversarygraph-docs/
- GitHub: https://github.com/anpa1200/adversarygraph
- Release v5.0.0: https://github.com/anpa1200/adversarygraph/releases/tag/v5.0.0

## Table of Contents

- [The Problem: CTI Often Stops Before Validation](#the-problem-cti-often-stops-before-validation)
- [What AdversaryGraph Is](#what-adversarygraph-is)
- [Core Capabilities Before v5.0](#core-capabilities-before-v50)
- [What Is New in v5.0](#what-is-new-in-v50)
- [TTP-First Simulation Workflow](#ttp-first-simulation-workflow)
- [Real Lab Telemetry for Web Scenarios](#real-lab-telemetry-for-web-scenarios)
- [SIEM Forwarding](#siem-forwarding)
- [AI Attack Assistant](#ai-attack-assistant)
- [Coherent Kill Chains, Not Random Events](#coherent-kill-chains-not-random-events)
- [Explain Attack](#explain-attack)
- [Named Scenario Library](#named-scenario-library)
- [Safety Boundaries](#safety-boundaries)
- [How This Fits Detection Engineering](#how-this-fits-detection-engineering)
- [Architecture Overview](#architecture-overview)
- [Example Use Case: Password Spray Detection](#example-use-case-password-spray-detection)
- [Example Use Case: Web Recon to Exploit-Shaped Telemetry](#example-use-case-web-recon-to-exploit-shaped-telemetry)
- [Example Use Case: Malware Findings to Detection Validation](#example-use-case-malware-findings-to-detection-validation)
- [Example Use Case: Asset Inventory to Attack Surface](#example-use-case-asset-inventory-to-attack-surface)
- [What This Release Is Not](#what-this-release-is-not)
- [What Makes v5.0 Different](#what-makes-v50-different)
- [Getting Started](#getting-started)
- [Final Thoughts](#final-thoughts)

## The Problem: CTI Often Stops Before Validation

A typical CTI-to-detection workflow looks like this:

1. Read an external report, internal incident report, malware note, or intelligence summary.
2. Extract behaviors: PowerShell, scheduled tasks, credential dumping, public-facing application exploitation, exfiltration, persistence, discovery, and so on.
3. Map those behaviors to MITRE ATT&CK.
4. Compare them with known actor and campaign profiles.
5. Identify relevant IOCs.
6. Write hunting hypotheses and detection logic.
7. Ask whether the SIEM actually receives the required telemetry.
8. Test rules with sample logs, lab traffic, or purple-team activity.

The hard part is not just mapping. The hard part is preserving the chain from **evidence** to **technique** to **telemetry** to **detection validation**.

If the SIEM parser is broken, the detection will not fire.

If the event structure is wrong, the rule will not match.

If the test event is too synthetic, the validation result is misleading.

If the ATT&CK mapping is not tied back to evidence, the report becomes hard to defend.

AdversaryGraph v5.0 focuses on this full chain.

## What AdversaryGraph Is

AdversaryGraph is a self-hosted CTI-to-detection platform. It combines a public research interface with a Docker-based private platform.

The public site is useful for exploration: ATT&CK matrix navigation, group research, public technique context, and project documentation.

The self-hosted platform is where private work belongs: AI-assisted report analysis, stored investigations, IOC enrichment, malware-analysis workflows, asset inventories, attack simulation, SIEM validation, and API-driven workflows.

The high-level workflow is:

1. **Ingest** reports, logs, IOCs, malware findings, asset inventory, or feed data.
2. **Map** behaviors to ATT&CK with evidence and confidence.
3. **Enrich** IOCs, actors, campaigns, malware families, and references.
4. **Validate** coverage using lab telemetry and SIEM forwarding.
5. **Report** findings in analyst-ready form.

![ATT&CK Navigator matrix](https://1200km.com/adversarygraph-docs/img/adversarygraph-v4-platform/02-navigator-matrix.png)

## Core Capabilities Before v5.0

Release 5.0 builds on a broader platform. The major existing modules are still part of the release and matter because Attack Simulation is designed to connect to them.

### AI-Assisted ATT&CK Mapping

Analysts can paste text or upload reports and ask the configured LLM provider to extract ATT&CK candidates. The platform supports multiple provider options, including Claude, OpenAI, Gemini, MiniMax, and local OpenAI-compatible gateways.

The important part is not simply “ask AI for TTPs.” The useful part is that mappings are treated as analyst-assistance data:

- Techniques are shown with evidence.
- Confidence is visible.
- Output can be reviewed before operational use.
- Extracted TTPs can be pushed into the Navigator.
- Results can be compared with groups, campaigns, and stored reports.

![AI-assisted report analysis](https://1200km.com/adversarygraph-docs/img/adversarygraph-v4-platform/04-ai-analysis.png)

### ATT&CK Navigator and Group Context

The Navigator is the central workspace for technique review. It supports Enterprise, Mobile, ICS, and ATLAS-style workflows. Analysts can search techniques, build layers, overlay group context, import/export layers, and move selected TTPs into comparison and reporting workflows.

This matters because many teams already think in ATT&CK, but their toolchain is split between reports, spreadsheets, diagrams, SIEM rules, and ticketing systems. AdversaryGraph tries to keep the matrix connected to the rest of the investigation.

### Group, Campaign, and Report Similarity

AdversaryGraph uses TTP overlap as a way to generate hypotheses. It compares selected behavior against ingested group profiles, campaigns, and stored report libraries.

This is intentionally framed as similarity, not attribution.

TTP overlap can help prioritize research. It can suggest which actor profiles or campaigns deserve review. It is not proof that a specific actor is responsible for an intrusion.

### IOC Investigation

The IOC workflow lets analysts pivot from observable data into reputation and relationship context. IPs, domains, URLs, hashes, and other observables can be investigated with feed context and ATT&CK leads.

![IOC Investigation](https://1200km.com/adversarygraph-docs/img/adversarygraph-v4-platform/11-ioc-investigation.png)

### Malware Analysis

The Malware Analysis module connects static triage, hash checks, unpacking, strings, decompilation/debug views, runtime-gated analysis, and AI summaries back to the CTI workflow.

The point is not to replace a reverse engineer. The point is to help analysts preserve malware-derived evidence and map it into ATT&CK, IOCs, and investigation outputs.

![Malware Analysis dashboard](https://1200km.com/adversarygraph-docs/img/malware-analysis-v4/01-malware-analysis-dashboard.png)

### Asset Attack-Surface Mapping

AdversaryGraph can ingest asset inventory input, normalize assets, score exposure, propose likely entry points, and map asset-driven ATT&CK candidates.

This is useful when the question is not “what did the attacker do?” but “what could an attacker realistically try against my exposed environment?”

Examples:

- Public web applications.
- VPN and identity services.
- Exposed admin panels.
- Cloud assets.
- Remote management services.
- High-value internal systems.
- Scanner and CMDB exports.

## What Is New in v5.0

The headline feature is **Attack Simulation**.

Attack Simulation is designed for defensive validation and detection engineering. It lets analysts work from a TTP-first interface, run safe simulations, inspect telemetry, and forward events to a SIEM.

This is not an exploitation framework. It does not run malware. It does not execute arbitrary commands against arbitrary user targets. It is a controlled validation workspace for authorized lab scenarios and source-shaped telemetry drills.

The v5.0 release adds:

- A new Attack Simulation workspace.
- ATT&CK-style matrix selection for runnable simulations.
- Dedicated configuration pages per selected TTP.
- Built-in lab web target for web-focused scenarios.
- Target-side real-time log viewing.
- SIEM forwarding to HTTP(S) collectors.
- Saved recent SIEM destinations.
- AI Attack Assistant.
- “Challenge Me” mode.
- Complicated multi-source attack-chain scenarios.
- 25 named coherent scenario templates.
- Attack-chain graph.
- Explain Attack panel.
- Source-shaped Windows, Sysmon, EDR, DNS, proxy, firewall, web, and WAF event generation for SIEM parser and rule validation.

![Attack Simulation matrix](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/01-attack-simulation-matrix.png)

## TTP-First Simulation Workflow

The workflow starts with the ATT&CK matrix.

Runnable simulation cells are visible directly in the matrix, and related TTP pages can link back into the simulation workflow. This keeps the analyst oriented around ATT&CK instead of hiding simulations behind unrelated forms.

The basic flow is:

1. Open Attack Simulation.
2. Choose a TTP from the matrix.
3. Open the dedicated simulation page.
4. Review what the scenario does.
5. Review telemetry source and event structure.
6. Run the lab scenario or AI-assisted telemetry drill.
7. Inspect logs in real time.
8. Forward selected logs to the SIEM.
9. Confirm whether detections fired.
10. Record validation gaps.

![Selected TTP configuration page](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/02-ttp-configuration-page.png)

Each scenario explains:

- What happens.
- What adversary behavior is represented.
- Which system emits telemetry.
- Which event structures are expected.
- What the detection should focus on.
- Which telemetry is production-like and which is a lab canary.
- What the validation gaps are.

That explanation is important. A simulation without context is just noise. A simulation with context becomes a detection-engineering exercise.

## Real Lab Telemetry for Web Scenarios

One major design goal was to avoid fake “log generation” for web scenarios where a real lab target can safely produce logs.

For web-focused simulations, the Docker deployment includes an `attack-lab-web` target. The AdversaryGraph API sends real HTTP requests to that lab web server over the Docker network. The target server writes its own logs.

The analyst can then inspect real target-side telemetry such as:

- NGINX access logs.
- NGINX error logs.
- Application authentication logs.
- WAF/security-style logs.
- Structured web JSONL telemetry.
- Run-specific JSONL logs.
- Merged attacked-server events.

![Real-time attack logs](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/07-real-time-attack-logs.png)

This is different from simply printing a row that looks like an access log. The request is sent to the lab server, and the server emits the log.

Supported web-focused scenarios include:

- HTTP and TLS service fingerprinting.
- Public application probing.
- Path discovery.
- Sensitive file and configuration path access.
- Directory traversal canaries.
- SQL injection-shaped requests.
- XSS-shaped requests.
- SSRF-shaped requests.
- Command-injection-shaped requests.
- Web-shell access canaries.
- Upload and download scenarios.
- Failed-login flows.
- Brute-force patterns.
- Password spray.
- User enumeration.
- Beacon-like web traffic.
- Exfiltration-shaped traffic.

The key phrase is “attack-shaped canary.” The goal is to generate realistic defensive telemetry without exploiting a real target or executing harmful payloads.

## SIEM Forwarding

Validation is incomplete if the event never reaches the SIEM.

The v5.0 SIEM forwarding panel sends selected Attack Simulation telemetry to HTTP(S) collectors. This can be used with Logstash HTTP input, Splunk HEC-style collectors, XpoLog/Logeye listeners, or custom webhook receivers.

Supported controls include:

- Full URL or raw `host:port/path` destination.
- Direct destination mode.
- Docker host gateway routing.
- Automatic route selection.
- Raw original line per request.
- JSON event per request.
- JSON Lines.
- Batch envelope.
- No auth.
- Bearer token auth.
- Token auth.
- Basic auth.
- Custom token header.
- Source selection: access, auth, endpoint, WAF/security, error, structured JSONL, run JSONL, or all attacked-server events.

![SIEM forwarding configuration](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/03-siem-forwarding-configuration.png)

The platform also keeps the last 10 non-secret SIEM destinations for reuse. This is useful during repeated parser testing, rule tuning, and dashboard validation.

![SIEM history and delivery](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/08-siem-history-and-delivery.png)

Credentials are not stored as part of the saved destination history. The saved address is intended to reduce typing friction, not to become a secret store.

## AI Attack Assistant

The AI Attack Assistant is one of the main additions in v5.0.

It helps generate detection-engineering drills by building correlated telemetry stories around selected behavior.

The assistant supports three modes:

1. **Selected TTP**: generate a focused validation flow around the technique currently selected in the Attack Simulation page.
2. **Threat actor**: generate a scenario inspired by a threat actor’s known behavior and ATT&CK profile.
3. **Challenge Me**: generate a blind multi-phase detection challenge for the analyst.

There is also a **Complicated attack** option. When enabled, the assistant builds longer multi-source flows across telemetry types such as:

- Windows Security Event Log.
- Sysmon.
- EDR process and file telemetry.
- DNS logs.
- Proxy logs.
- Firewall traffic logs.
- Web access logs.
- WAF/security logs.
- Authentication logs.

The goal is not to normalize everything into one generic schema. For complicated scenarios, the assistant should preserve source/vendor-shaped event patterns so the SIEM parser and rule logic are tested more realistically.

![AI scenario library](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/04-ai-scenario-library.png)

## Coherent Kill Chains, Not Random Events

A detection drill should not be a random list of suspicious events.

In v5.0, complicated scenarios are built as coherent attack chains. The chain has ordered phases, each phase has a reason, and each phase emits events that should correlate with the surrounding activity.

For example, a password-spray-to-foothold scenario may include:

1. Username enumeration.
2. Multiple failed authentication attempts.
3. One successful logon after failures.
4. Endpoint discovery from the authenticated host.
5. Suspicious tool transfer.
6. Persistence or lateral discovery.

That is much more useful than a single failed-login event.

The Attack Chain Graph makes this visible.

![AI-generated attack chain graph](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/05-ai-generated-attack-chain-graph.png)

Each phase can show:

- Phase number.
- ATT&CK technique.
- Telemetry source.
- Event format.
- Event count.
- Detection goal.
- Supporting tags.

This helps the analyst understand whether the generated activity is a plausible kill chain or just a bag of indicators.

## Explain Attack

When “Challenge Me” or a complex AI-generated scenario is used, the platform includes an **Explain Attack** action.

This panel explains:

- What the scenario is trying to simulate.
- Why each phase appears in the chain.
- Which telemetry sources matter.
- What the analyst should search for.
- What detections should fire.
- Which false positives or tuning points should be considered.
- What success criteria should be used.

![Explain Attack panel](https://1200km.com/adversarygraph-docs/img/attack-simulation-v5/06-explain-attack-panel.png)

This is useful for training and validation. It turns generated events into an exercise that a SOC analyst, detection engineer, or CTI analyst can actually follow.

## Named Scenario Library

Release 5.0 includes a library of named coherent scenarios.

Examples include:

- Web App to Endpoint Compromise.
- Password Spray to Valid Account Foothold.
- SQL Injection to Data Theft.
- Recon to Web Shell Persistence.
- Valid Account to LSASS Access.
- Password Spray to Exfiltration.
- XSS Canary to Session Abuse.
- SSRF Metadata Probe to C2.
- Ransomware Precursor Chain.
- Living-off-the-Land Transfer and Execution.
- Internal Discovery After Foothold.
- Web Enumeration to Password Spray.
- Public App Exploit to Persistence.
- Credential Dump to Cloud Upload.
- Signed Binary Proxy to C2.
- FIN7-style web, identity, and persistence flow.
- APT29-style identity and PowerShell flow.
- Lazarus-style delivery and exfiltration flow.
- Noisy red-team drill.
- Stealthy low-volume intrusion chain.
- WAF bypass retry chain.
- Service account abuse.
- External recon to credential access.
- C2 telemetry validation.
- Persistence control validation.

These are not meant to prove that a real actor attacked you. They are templates for detection validation and training. They help answer questions like:

- Does my SIEM parse this source?
- Does my correlation rule see the sequence?
- Does the detection alert only on one event or on the chain?
- Can analysts reconstruct the story from logs?
- Which telemetry source is missing?
- Where do false positives appear?

## Safety Boundaries

Attack Simulation must be safe by design.

The v5.0 module follows several boundaries:

- It does not execute malware.
- It does not run arbitrary commands.
- It does not exploit arbitrary external targets.
- Web simulation traffic is limited to predefined benign canaries against the local lab target.
- SIEM forwarding sends generated Attack Simulation telemetry.
- Unsafe URL schemes and metadata/link-local destinations are blocked.
- Credentials used for forwarding are used only for the current request and are not stored.

This matters because the target user is a defender. The feature is built for detection engineering, parser validation, SOC drills, and authorized lab workflows.

## How This Fits Detection Engineering

Detection engineering is not only writing rules. It is a lifecycle:

1. Understand the adversary behavior.
2. Map it to ATT&CK or another behavior model.
3. Identify required telemetry.
4. Confirm that telemetry exists.
5. Confirm that parsing works.
6. Write detection logic.
7. Test the logic with realistic events.
8. Tune false positives.
9. Document assumptions and gaps.
10. Re-test when infrastructure or parsers change.

AdversaryGraph v5.0 tries to support this lifecycle directly.

The CTI modules help with steps 1 and 2.

IOC and malware modules help enrich the investigation context.

Asset attack-surface mapping helps identify relevant entry points.

Attack Simulation helps with steps 3 through 8.

Reports and docs help with steps 9 and 10.

## Architecture Overview

The self-hosted platform is built around a browser frontend and API backend.

At a high level:

- Frontend: React/Vite user interface.
- Backend: FastAPI service.
- Database: PostgreSQL for stored investigations and platform data.
- Background jobs: Redis/Celery where needed.
- ATT&CK data: synchronized from MITRE sources.
- AI providers: operator-configured providers such as Claude, OpenAI, Gemini, MiniMax, or local OpenAI-compatible services.
- Malware workflow: MalwareGraph-backed analysis components.
- Attack lab: Docker-based target services for controlled telemetry generation.
- SIEM forwarding: HTTP(S) delivery to configured collectors.

For the v5.0 web simulation flow, the important architectural distinction is:

AdversaryGraph does not simply invent an access log line for the UI. It sends real HTTP requests to the lab web target, and the lab web target emits server-side logs.

For AI-generated complicated scenarios, the goal is different. The assistant generates source-shaped telemetry for SIEM parser and detection validation. This is not proof of compromise, and it is not a replacement for live lab execution. It is a defensive validation tool for testing ingestion, parsers, correlation, dashboards, and analyst workflows.

## Example Use Case: Password Spray Detection

A common detection engineering task is password spray validation.

The analyst wants to know:

- Do we ingest authentication failures?
- Are usernames parsed correctly?
- Can we count failures across many users?
- Can we detect one source trying one password against many accounts?
- Can we correlate a later successful login?
- Can we connect the successful login to endpoint activity?

With AdversaryGraph v5.0, the workflow becomes:

1. Select a credential-access or brute-force related TTP.
2. Choose the password spray scenario.
3. Run the lab or AI-assisted flow.
4. Observe authentication-related events.
5. Forward the events to the SIEM.
6. Confirm the parser.
7. Confirm the rule.
8. Review the chain graph.
9. Use Explain Attack to document what should have happened.
10. Record gaps.

The important part is the chain. A single 4625-like event is not enough. A realistic validation should include many failures, many users, timing, source consistency, and possibly one later success.

## Example Use Case: Web Recon to Exploit-Shaped Telemetry

For a web application detection scenario, the analyst may want to test:

- Path discovery.
- Sensitive file probing.
- SQL injection-shaped requests.
- XSS-shaped requests.
- SSRF-shaped requests.
- WAF canary classification.
- Access-log parser behavior.
- SIEM dashboards for web attacks.

AdversaryGraph can run approved web canaries against the lab web target, then show the real target-side logs in the UI.

This lets the detection engineer validate more than a rule. It validates whether the web tier emits usable logs and whether the SIEM receives enough context to detect the behavior.

## Example Use Case: Malware Findings to Detection Validation

The malware module can produce findings such as:

- Suspicious imports.
- Strings.
- Packed sample indicators.
- Function-level behavior.
- Potential IOCs.
- ATT&CK candidates.
- AI-assisted summaries.

Those findings can feed detection engineering:

- Which API calls should we monitor?
- Which command lines or process patterns matter?
- Which persistence mechanisms appear?
- Which network indicators are useful?
- Which behaviors should become validation scenarios?

AdversaryGraph’s value is that malware findings do not stay isolated in a reverse-engineering note. They can be connected back to ATT&CK and validation planning.

## Example Use Case: Asset Inventory to Attack Surface

Asset inventories often live in spreadsheets, CMDB exports, or scanner output. The security team may know what exists, but not how to translate that into likely ATT&CK entry points.

The Asset Attack Surface module helps with:

- Normalizing assets.
- Identifying exposed services.
- Scoring exposure.
- Mapping likely entry points.
- Proposing ATT&CK candidates.
- Creating saved cases.

This connects directly to Attack Simulation because a high-risk public web application or VPN service should map to validation scenarios around external discovery, exploitation attempts, credential attacks, and logging coverage.

## What This Release Is Not

It is important to define what v5.0 is not.

It is not an autonomous attack platform.

It is not a malware execution system.

It is not a replacement for a full cyber range.

It is not attribution proof.

It is not a guarantee that a detection works in production.

It is an analyst-assistance and validation platform. Its output should be reviewed by qualified analysts and detection engineers before operational use.

## What Makes v5.0 Different

The main difference is the connection between CTI and validation.

Many tools stop at one of these points:

- Visualize ATT&CK.
- Extract TTPs.
- Store IOCs.
- Generate sample logs.
- Run a lab attack.
- Forward events.

AdversaryGraph tries to connect these into one workflow:

1. Understand the behavior.
2. Map it.
3. Enrich it.
4. Simulate it safely.
5. Observe telemetry.
6. Send it to the SIEM.
7. Explain what happened.
8. Document what passed and what failed.

That is the direction I want the platform to continue moving.

## Getting Started

If you want to explore the public interface:

https://1200km.com/threat-matrix/

If you want the full private platform:

```bash
git clone https://github.com/anpa1200/adversarygraph.git
cd adversarygraph
cp .env.example .env
docker compose up
```

Then open:

```text
http://localhost:3000
```

Read the full documentation here:

https://1200km.com/adversarygraph-docs/

Attack Simulation guide:

https://1200km.com/adversarygraph-docs/attack-simulation/

Project page:

https://1200km.com/adversarygraph/

GitHub release:

https://github.com/anpa1200/adversarygraph/releases/tag/v5.0.0

## Final Thoughts

AdversaryGraph v5.0 is a step toward a more complete CTI-to-detection workflow.

The platform is still built around a simple idea: intelligence should not end as a static report. It should become a mapped, enriched, validated, and explainable defensive workflow.

With Attack Simulation, SIEM forwarding, real lab telemetry, AI-assisted scenario generation, and attack-chain explanation, v5.0 moves AdversaryGraph closer to that goal.

The next challenge is to continue improving realism: more telemetry sources, more lab targets, better parser validation, stronger scenario libraries, and deeper connections between malware analysis, asset exposure, and detection engineering.

If you work in CTI, SOC operations, detection engineering, malware analysis, or purple-team validation, I would be glad to hear feedback.

Project:

https://github.com/anpa1200/adversarygraph

Documentation:

https://1200km.com/adversarygraph-docs/

Live workspace:

https://1200km.com/threat-matrix/
