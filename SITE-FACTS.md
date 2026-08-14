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

AdversaryGraph has two explicit release facts, tracked separately even when
their values are equal. The current merged and CI-validated source release is
`v7.0.0` at commit `2a9a7bedf6115dbcfbf1e90a70e08f50d76e8c73`. The latest
non-draft, non-prerelease immutable GitHub release is also `v7.0.0`: the
protected v6.5.0 tag workflow was superseded and the project published v7.0.0
directly, closing the source-ahead-of-tag gap that existed while `v6.5.0` was
merged but unreleased. `adversarygraph.current_source_release` and
`adversarygraph.development_status` keep `status: "current-development"` by
convention even when the value matches the latest tag — that status labels the
fact type (tracks whatever is merged on `main`), not a claim that the value
itself is unpublished.

### 2026-08-14 reassessment

The AdversaryGraph release boundary closed when `v7.0.0` published on
2026-08-12 (commit `2a9a7bedf6115dbcfbf1e90a70e08f50d76e8c73`, tag object
`b19f7a869cefe4fbc88802ea432e3cec80b27a05`). A full site reassessment updated
`data/site-facts.json`, ~13 dependent HTML/JSON-LD/Markdown surfaces, and
regenerated `feed.xml`/`sitemap.xml` accordingly; `npm run check-facts` passes
against the reconciled state. Note: the AdversaryGraph repo's general `CI`
workflow failed on this commit due to a transient upstream 503 fetching
`nuclei-templates` during the scanner-mcp image build (run `31626631081`); the
`Release` workflow that gates and publishes the tag completed successfully
(run `31626704258`), which is the run cited by
`adversarygraph.current_source_ci`.

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
