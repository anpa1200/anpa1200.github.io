# 1200km Fact Governance

`data/site-facts.json` is the source of truth for release, contribution,
content-count, product-name, and public-contact claims made by this repository.
Every fact records its definition, verification date, authoritative source, and
lifecycle status. `data/site-facts.schema.json` defines the required shape.

## Source precedence

Use sources in this order when a claim conflicts:

1. An immutable GitHub release or tag for released software.
2. The current repository `VERSION`, release notes, `CHANGELOG.md`, and
   `README.md` for a merged source release that is not yet an immutable tag.
3. A merged upstream pull/merge request for an accepted contribution.
4. An open upstream pull/merge request for a submitted contribution.
5. An explicitly maintained data file or a reproducible local file count.
6. Human-facing pages, which are outputs and never authoritative inputs.

Presentation pages, screenshots, search snippets, generated mirrors, and old
articles must not be used to establish a current version or metric.

## Product terminology

- **AdversaryGraph** is the flagship self-hosted CTI-to-detection platform.
- **Threat Matrix** is the approved name of the public AdversaryGraph Light
  web workspace at `/threat-matrix/`. It provides browser-only ATT&CK
  exploration and product-shaped module gates for full self-hosted
  AdversaryGraph capabilities; it is not the complete self-hosted platform.
- **AdversaryGraph Web** is a superseded alias for Threat Matrix. Redirect and
  historical references may preserve it only when the context is explicit.
- **ThreatMapper** is a superseded historical product name. Compatibility URLs
  redirect to AdversaryGraph, while version-specific historical articles may
  retain the name.

## Release boundary

AdversaryGraph has two explicit release facts. The current merged and
CI-validated source release is `v6.5.0` at commit
`aeee13dcaec1e2993b9f0969290c9ee414bb4cf6`. The latest non-draft,
non-prerelease immutable GitHub release is still `v6.0.0`. Until the protected
v6.5.0 tag workflow publishes successfully, pages must state both facts and
must not link to or imply the existence of a v6.5.0 GitHub release tag.

## Count definitions

- Accepted contributions require an upstream merge record.
- Open submissions remain pending and never contribute to the accepted total.
- The local article archive is reported as the number of preserved article
  pages, not as a live Medium publication or authorship claim.
- Field guides exclude AdversaryGraph product documentation and the Medium
  export archive.
- Listed labs count the distinct rows maintained on `/labs.html`; Docusaurus
  lab documents and unlisted repository experiments are outside that scope.
- Threat Matrix entity pages are the sum of generated actor and technique /
  sub-technique pages.

## Deployment drift found during the 2026-07-21 audit

The checked-in `adversarygraph-docs/` mirror in this repository was generated
from an older documentation state and still identified v5.9.1 as current. The
separate `anpa1200/adversarygraph-docs` GitHub Pages project had already
deployed v6.0.0 documentation from commit
`42a093a41d19ae2a74f89a8108d17946aad9de93` in successful Actions run
`29574898051`. The project Pages route and the root-site mirror therefore came
from different build inputs and disagreed.

Unified RAG/MCP is part of the v6.5.0 source release. A static documentation
route is included in this root-site deployable output; links to the
authoritative source guide are pinned to the reviewed v6.5.0 source commit.

GitHub's Pages API reports the main 1200km site as a workflow build sourced
from `main` at repository root; the last inspected successful deployment was
run `29817785510` for commit
`965c95a9d0ea3c9141617a33dc0ff7163df19995`. The workflow now runs the fact
consistency check before staging and again against the exact deployable
directory. This prevents another successful deployment from publishing
internally inconsistent source or generated output.

## Maintenance

Run:

```bash
npm run check-facts
npm run check-release-source
```

Refresh external contribution/repository statistics with
`npm run update-validation`; that command also updates the contribution and
release facts. Review the diff before committing. The separate
`scripts/update-validation-and-push.sh` wrapper publishes changes and must only
be used when a push is explicitly authorized.
