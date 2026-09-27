# TTP ecosystem publication

The three public modules preserve their existing routes:

- Attack Tools: `/ttp-simulation/tools/`
- Attack Simulations: `/ttp-simulation/`
- Detection Rules: `/ttp-simulation/detections/`

Telemetry is a shared reference library at `/ttp-simulation/telemetry/`.

## Authoritative inputs and regeneration

The versioned `ttp-simulation/data/` JSON files are the pinned publication inputs. Their manifests retain the ATT&CK, Atomic Red Team, Sigma and existing Atlas provenance. They originated in the separate `ttp-simulation-lab` authoring project. Do not edit generated HTML to change technical mappings.

Run `npm run build-ttp-integration` to produce crawlable HTML, original-rule reference pages, linked facet pages and an explicit relationship manifest. Run `npm run check-ttp-integration` to verify deterministic output and reciprocal relationships. Update application renderers under `ttp-simulation/assets/` when changing the interactive views.

The static content is readable without JavaScript. Interactive filters replace only the reference view; the contextual relationship sections remain visible. Every tag has a stable destination and exact members. Original rule YAML is displayed as escaped text, never executed.

Existing article pages are rebuilt from the pinned archive during deployment. The Pages workflow reapplies reviewed backlinks after staging that archive, so backlinks survive later builds. The Atlas lives in its own repository; its reciprocal links must be released there rather than pretending absent local files were modified.

## Evidence boundaries

Actor links use existing Threat Matrix actor-to-technique relationships only. Tool/telemetry links through common techniques are explicitly two-hop context. A Sigma source tag is not independent semantic validation. Anomaly models remain published concepts. Neither a documented Atomic candidate nor a published page is a live-tested simulation. No command, imported YAML, tool or collector runs during the site build.

Preserve original author attribution, source status, license, source hashes, retired-ID exclusions and explicit coverage gaps when refreshing inputs.
