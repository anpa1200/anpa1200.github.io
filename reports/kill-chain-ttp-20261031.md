# Kill Chain ATT&CK technique lists — review and validation

Prepared on `feat/kill-chain-ttp-examples`, based on public website main `446d5a39d7268590c4a397602ded4cef10aa6925`. The October 30 importer repair and archive pin `0c1c598ab54707726d4927b8e25b458c68c9ce3b` are preserved. Article inventory records, descriptions, guide placements, canonical URLs, and existing resource links were not changed.

Each of the seven stage pages now has a clearly labelled **Relevant ATT&CK techniques** section, linked near the page introduction. Cards show the official ID and name, an official MITRE technique URL, parent context for sub-techniques, and a stage-specific relevance note. The lists are curated Enterprise ATT&CK examples, not exhaustive coverage or an official one-to-one Kill Chain mapping. ATT&CK tactics are explicitly distinguished from techniques.

| Stage | Examples |
| --- | ---: |
| Reconnaissance | 9 |
| Weaponization | 7 |
| Delivery | 7 |
| Exploitation | 6 |
| Installation | 7 |
| Command and Control | 8 |
| Actions on Objectives | 10 |

There are 54 placements across 52 unique technique/sub-technique identities. T1608.001 appears in Weaponization and Delivery with preparation/delivery boundaries; T1041 appears in Command and Control and Actions on Objectives with communication/exfiltration context. User execution is distinguished from software exploitation. Installation examples do not imply that every foothold persists. Collection and recovery inhibition are not presented as proof of completed exfiltration or encryption.

## Official source and maintenance

The authoritative data is MITRE's Enterprise ATT&CK v20.0 STIX 2.1 bundle, retrieved October 31, 2026:

- Repository commit: `c2494b29dd268c46a5d0ea0990553e4327cd2253`.
- Source: <https://raw.githubusercontent.com/mitre-attack/attack-stix-data/c2494b29dd268c46a5d0ea0990553e4327cd2253/enterprise-attack/enterprise-attack.json>.
- SHA-256: `81113ba98afa2928f3dcff62022539f7ce30c315c32e14422f11ff95ce534352`.
- Official data documentation: <https://attack.mitre.org/resources/attack-data-and-tools/>.

`data/kill-chain-attack.json` stores the reviewed associations, pinned source provenance, object IDs/versions/modification dates, official names/URLs, parent relationships, and active-status fields. Revoked and deprecated objects are excluded. Tests also compare the selected records and sub-technique relationships directly with the official bundle when `ATTACK_ENTERPRISE_SOURCE` points to the downloaded snapshot. Future ATT&CK updates require renewed editorial review rather than assuming that these associations are official MITRE mappings.

Regenerate with `npm run build-kill-chain`; verify with `npm run check-kill-chain`. The existing site catalogue overrides and both sitemaps record October 31 as the update date for the seven affected pages. The landing page and unrelated feed/sitemap entries remain unchanged.

## Verification evidence

- Five Kill Chain tests pass, including comparison of all 52 selected identities and parent relationships against the pinned official source.
- All 74 unique official technique and parent links returned HTTP 200.
- Browser QA on the user's computer: all seven pages at 320px, 390px, and 1440px; no horizontal overflow; one-column mobile and two-column desktop TTP cards; expected TTP and unchanged guide counts.
- Keyboard Tab navigation reaches the official links with a visible 3px outline. Light and dark themes were visually inspected. Temporary viewport overrides were reset.
- `npm run check-release-source` passed in full, including the new ATT&CK mapping test. Internal link scan: 7,387 HTML files, 383,970 valid links, zero broken links or missing anchors.
- Content catalogue freshness and generated-page consistency checks pass. Detailed logs and the official-source snapshot are retained in the task’s QA directory.

## Publication state

Local review only. No push, PR, merge, or deployment is authorized for this addition yet. Preview: <http://127.0.0.1:8769/kill-chain/reconnaissance/#ttp-examples>. The preview server is bound to loopback and serves this isolated checkout.
