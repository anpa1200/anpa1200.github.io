# Knowledge Sources Dataset Validation Report

Validated on: 2026-09-07

## Result

- 165 unique knowledge sources
- 165 unique canonical URLs
- 165 unique stable IDs
- 165 detailed descriptions (145–193 words)
- 165 compact summaries (66–93 words)
- 160 reachable URLs
- 5 URLs protected against automated access
- 0 failed URLs

The dataset consolidates all usable structured records from the supplied Gemini and OpenAI research plus 40 validated expansion records. One current-state correction replaces the retired standalone AttackerKB entry with Rapid7's maintained Vulnerability & Exploit Database successor. Shodan is included with a current freemium caveat, while the separately assessed AI Incident Database remains outside this staged expansion.

## Quality method

The quality score combines five separately recorded dimensions: authority, originality, maintenance, practical value, and transparency. Tier A covers scores of 90–100, Tier B covers 80–89, and Tier C covers 70–79. A high score applies only within the source’s stated scope; it does not make every item published by that source correct. Automated HTTP validation confirms availability and redirects, not factual truth. Dual-use, sensitive-data, and live-malware resources carry explicit safety cautions in the JSON.

## Category coverage

- academic: 3
- adversary-emulation: 2
- ai-security: 9
- api-security: 1
- application-security: 6
- cloud-security: 6
- container-security: 2
- cti: 7
- datasets: 2
- detection-engineering: 6
- dfir: 8
- exploit-development: 3
- framework: 6
- government: 8
- identity-security: 6
- incident-response: 3
- kubernetes: 3
- malware-analysis: 10
- mobile-security: 6
- network-security: 8
- osint: 6
- ot-ics-security: 2
- penetration-testing: 3
- reverse-engineering: 5
- soc: 2
- supply-chain-security: 3
- threat-informed-defense: 3
- threat-reports: 6
- threat-research: 5
- training: 10
- vulnerability: 12
- web-security: 3

## Automated-access exceptions

- Israel National Cyber Directorate: 403 (access-restricted) — https://www.gov.il/en/departments/israel_national_cyber_directorate
- Ghidra: 403 (access-restricted) — https://ghidra-sre.org/
- CyberDefenders: 403 (access-restricted) — https://cyberdefenders.org/
- VX-Underground: 403 (access-restricted) — https://vx-underground.org/
- Trace Labs: 403 (access-restricted) — https://tracelabs.org/

These exceptions are retained only when the URL is canonical and the source is independently recognizable as authoritative or useful; an automated-access restriction is not treated as a dead link.
