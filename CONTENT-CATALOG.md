# 1200km Content Catalogue

`data/content-catalog.json` is the authoritative identity and classification
model for public 1200km content. It prevents one artefact from being counted or
presented simultaneously as unrelated research, a guide, a project, a product,
and a CTI item.

## What the inventory found

The source catalogue generated on 2026-07-22 contains:

- 1,055 governed identities, including 1,043 canonical pages in the local deployment sitemap;
- one intentionally noindex post-v6 AdversaryGraph development guide;
- 12 declared external repository or package identities;
- four GitHub repositories explicitly marked archived;
- ten separately deployed documentation, guide, case-study, lab, research, or article collections.

The large local page count is not an article count. It includes 816 generated
ATT&CK actor and technique pages, 124 ITDR pages, and the checked-in
AdversaryGraph documentation output. ATT&CK actors are `reference-entity`
records and technique pages are `generated-reference` records backed by the
corresponding MITRE ATT&CK URL. They are neither mirrors nor authored CTI
articles.

The production build adds the pinned 177-article archive and regenerates the
full-domain catalogue and taxonomy report from the deployable output. Article
publication status and editorial lifecycle are separate: an article remains a
released publication even when its currentness is unknown or it is preserved
as historical material.

The inventory also found and corrected three package rows whose advertised
PyPI URLs returned 404 on 2026-07-21. Unpacker, PE Import Analyzer, and FileInfo
are now labelled source/current-development entries rather than installable
PyPI releases. AIDebug 1.1.0, AuditAI 1.0.0, and String Analyzer 2.0.0 were
verified against the PyPI JSON API.

## Files and responsibilities

- `data/content-catalog.config.json` contains reviewed collection policy,
  lifecycle overrides, aliases, additional noindex pages, and externally hosted
  product records.
- `data/content-catalog.json` is deterministic generated output.
- `data/content-catalog.schema.json` is the Draft 2020-12 schema for the output.
- `data/content-catalog.config.schema.json` validates generation policy.
- `data/content-taxonomy-audit.schema.json` validates the distribution report.
- `reports/content-taxonomy-audit.json` records raw and authored-only
  distributions plus explicit editorial review queues.
- `scripts/content-catalog-lib.mjs` owns inference and controlled vocabularies.
- `scripts/build-content-catalog.mjs` builds local or full deployable catalogues.
- `scripts/check-content-schema.mjs` performs formal JSON Schema validation.
- `scripts/check-content-catalog.mjs` performs semantic, coverage, canonical,
  lifecycle, index, feed, sitemap, and redirect checks.

Do not hand-edit `data/content-catalog.json`. Change source metadata or the
reviewed config, then run:

```bash
npm run build-content
npm run check-content
```

## Identity rules

Every item has one stable ID, one canonical URL, one `primary_type`, and one
`primary_domain`. Audience and tags may be plural. Display pages may group an
item in several reading paths, but those placements do not create new
identities or change its primary classification.

Required item fields are:

```text
id, title, primary_type, primary_domain, audience, status, lifecycle, maturity,
evidence_level, version/applies_to, canonical_url, published_at, updated_at,
summary, tags, featured, indexable
```

`source_url` is required by policy for mirrors and is used for other items when
the source or authoritative registry differs from the preferred public URL.
Archived and superseded records require `archive_reason`.

## Controlled vocabularies

Primary type:

```text
research, case-study, guide, lab, tool, platform, documentation, article,
reference-entity, generated-reference, redirect, mirror, contribution, index,
profile, policy
```

Primary domain:

```text
threat-intelligence, detection-engineering, threat-hunting, malware-analysis,
identity-security, offensive-research, cloud-security, ai-security,
application-security, network-security, platform-documentation,
professional-profile, site-governance
```

Publication status:

```text
released, maintained, current-development, experimental, superseded, archived,
submitted, accepted
```

Editorial lifecycle:

```text
maintained, stable-reference, current-development, preserved, historical,
currentness-unknown, superseded, archived
```

- `maintained`: current work with dated update evidence.
- `stable-reference`: reference material whose identity remains useful without
  claiming continuous revision.
- `current-development`: work that is explicitly unreleased or experimental.
- `preserved`: an older publication retained without asserting current
  technical applicability.
- `historical`: version-specific or time-bound evidence kept for context.
- `currentness-unknown`: published material not yet reverified for current use.
- `superseded`: replaced by a named current identity or release.
- `archived`: intentionally retired material retained for provenance.

Evidence level:

```text
source-backed, lab-validated, release-evidence, externally-accepted,
illustrative, unverified
```

- `externally-accepted`: acceptance is recorded by the authoritative external
  contribution system.
- `release-evidence`: tied to a tagged release or its reproducible release gate.
- `lab-validated`: exercised in the documented controlled lab and bounded by
  that environment.
- `source-backed`: supported by cited primary or authoritative sources.
- `illustrative`: synthetic or demonstrative material that is not production
  telemetry.
- `unverified`: evidence quality has not yet been reviewed; no stronger claim
  is implied.

Maturity and audience values are also closed vocabularies in the generated
catalogue and schema.

## Canonical and mirror policy

- A local authored page with durable context or locally maintained evidence uses
  its 1200km URL as canonical and records the external publication, if any, as
  `source_url`.
- The 1200km Article Archive is a canonical local collection. Each preserved article is an
  `article`, and the original Medium or InfoSec Write-ups URL is recorded as its
  source when it can be extracted from the page.
- External articles without a local edition keep their publication URL as
  canonical and are not added to the 1200km sitemap.
- Legacy ThreatMapper and old article slugs are aliases, not catalogue items.
  They remain noindex redirects to the maintained identity.
- Historical AdversaryGraph content remains public only with an explicit
  version boundary, `superseded` status, archive reason, and visible notice.
- Post-v6 material is `current-development` and must explicitly say that it is
  not part of the immutable v6.0.0 release.

## Catalogue coverage in deployment

The checked-in catalogue covers all local sitemap pages plus reviewed external
identities. During the GitHub Pages build, `build-content:remote` reads the
complete domain sitemap after remote documentation sitemaps have been merged.
It builds a deployable catalogue for every URL that Pagefind can index. Search
metadata then derives controlled `primary_type`, `primary_domain`, `audience`,
`status`, `lifecycle`, `evidence_level`, and `version` facets from that catalogue. It also
derives source and updated-year discovery facets without changing catalogue
identity. The search build refuses a sitemap URL whose catalogue record is
marked non-indexable.

The release gate fails for:

- duplicate IDs or canonical URLs;
- missing fields or unknown vocabulary values;
- malformed URLs or dates;
- sitemap, RSS, or major-index links without a catalogue identity;
- released local content without a deployable URL;
- mirrors without a source URL;
- maintained lifecycle records without dated update evidence;
- historical, preserved, superseded, or archived material in the core tier;
- ATT&CK actors or techniques misclassified as mirrors or authored articles;
- archive article IDs not assigned by the reviewed lifecycle policy;
- version-specific AdversaryGraph content without a version;
- superseded or archived records without an archive reason or visible notice;
- legacy aliases that are not noindex redirects;
- offensive-research indexes classified as catch-all CTI;
- a stale generated catalogue;
- any JSON Schema violation.

## Adding or changing content

1. Choose one primary artefact identity and preferred URL.
2. Add accurate HTML metadata, including canonical URL and publication dates when known.
3. Add a config override only when URL-family inference cannot express the intended type, domain, lifecycle, evidence, or version boundary.
4. Add an alias instead of duplicating an item when preserving an old URL.
5. Add a visible archive/version notice before retaining superseded content.
6. Regenerate and run `npm run check-content`.
7. Inspect the staged deployable catalogue and Pagefind facets before release.

Unknown publication dates remain `null`; the generator does not invent them.
External article evidence defaults to `unverified` until the article is
reviewed against its cited sources or lab evidence.
