# Big Pharma research publication

Publication date: 26 September 2026. Research evidence cutoff: 25 September 2026.

Canonical article: <https://1200km.com/articles/read/2026/cyberattacks-on-big-pharma-and-its-ecosystem/>

## Integration

- Canonical archive publication, not a second competing article URL. The archive identifies this as an original 1200km publication.
- Original cover plus both user-supplied infographics. PNG bytes, dimensions, and SHA-256 hashes are recorded in the article's downloadable publication manifest.
- The targeting infographic follows the targeting heading. The attack-surface infographic follows the lifecycle introduction and retains a text equivalent. Captions distinguish conceptual relationships from intrusion evidence and clarify the Lash Group/Pfizer relationship and pseudonymized trial-data boundary.
- 76 internal links in the integrated Markdown, including 21 distinct technique dossiers and six actor-context dossiers. Existing external citations remain in place.
- Reciprocal, explicitly editorial reading routes from the 21 technique and six actor dossiers. These routes do not modify MITRE relationships or add attribution edges.
- Contextual links from six field guides, homepage Latest, CTI sector research, and the guide library. Governed article metadata supplies search, feed, reference-library, sitemap, and platform navigation during the full deployment build.
- AI-discovery documents identify the article and retain its evidence cutoff.
- The archive total is 281: 194 canonical archive articles plus 87 permitted TrainSec mirrors. This is not a live Medium publication count.

## Local validation before release

- Canonical archive and local-media validation passed; embedded build validated 194 articles and 197 HTML documents.
- Three publication tests passed: original image bytes and placement, evidence-boundary preservation, and rendered headings/fragments/citations.
- Four Chrome checks passed: 390px and 1440px, each in light and dark themes. The article had no tested WCAG violations, missing in-page fragments, distorted/missing images, or document-level horizontal overflow.
- The source release gate and added research-route tests passed. The archive-fragment regression test proves that source validation defers separately built articles while assembled-site validation rejects missing pages or fragments.
- Staged archive whitespace and secret scans passed.

The archive dependency audit met its existing critical-severity gate but reported pre-existing moderate/high transitive development-tool findings. This publication does not claim to remediate those dependencies or to be a security audit of the site build toolchain.

## Release evidence

Archive publication: [pull request 40](https://github.com/anpa1200/medium-blog-navigation/pull/40), merged as `18a0aaf4770ba470dcc57de054ed79d999eda452`.

This source report records pre-deployment checks. The website's Pages workflow independently checks the assembled catalog, search, links, accessibility, metadata, immutable build identity, and live production after deployment. A pushed commit alone is not deployment evidence.
