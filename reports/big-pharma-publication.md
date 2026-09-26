# Big Pharma research publication

Publication date: 26 September 2026. Research evidence cutoff: 25 September 2026.

Canonical article: <https://1200km.com/articles/read/2026/cyberattacks-on-big-pharma-and-its-ecosystem/>

## Integration

- Canonical archive publication, not a second competing article URL. The archive identifies this as an original 1200km publication.
- Original cover plus both user-supplied infographics. PNG bytes, dimensions, and SHA-256 hashes are recorded in the article's downloadable publication manifest.
- The targeting infographic follows the targeting heading. The attack-surface infographic follows the lifecycle introduction and retains a text equivalent. Captions distinguish conceptual relationships from intrusion evidence and clarify the Lash Group/Pfizer relationship and pseudonymized trial-data boundary.
- WebP display derivatives preserve the supplied artwork, while originals remain available through full-size links. The responsive cover is 74–204 KB, the library card is 34 KB, and the two full-resolution display infographics are 163 KB and 76 KB. Derivative dimensions and hashes are recorded separately from original provenance.
- On this article only, the Home breadcrumb uses its original destination as a native link to avoid eager download of the entire archive catalogue. Other articles retain their existing breadcrumb behavior; no performance thresholds were raised.
- 76 internal links in the integrated Markdown, including 21 distinct technique dossiers and six actor-context dossiers. Existing external citations remain in place.
- Reciprocal, explicitly editorial reading routes from the 21 technique and six actor dossiers. These routes do not modify MITRE relationships or add attribution edges.
- Contextual links from six field guides, homepage Latest, CTI sector research, and the guide library. Governed article metadata supplies search, feed, reference-library, sitemap, and platform navigation during the full deployment build.
- AI-discovery documents identify the article and retain its evidence cutoff.
- The archive total is 281: 194 canonical archive articles plus 87 permitted TrainSec mirrors. This is not a live Medium publication count.

## Local validation before release

- Canonical archive and local-media validation passed; embedded build validated 194 articles and 197 HTML documents.
- Four publication tests passed: original image bytes and placement, delivery-derivative integrity and size limits, evidence-boundary preservation, and rendered headings/fragments/citations.
- Four Chrome checks passed: 390px and 1440px, each in light and dark themes. The article had no tested WCAG violations, missing in-page fragments, distorted/missing images, or document-level horizontal overflow.
- The source release gate and added research-route tests passed. The archive-fragment regression test proves that source validation defers separately built articles while assembled-site validation rejects missing pages or fragments.
- Staged archive whitespace and secret scans passed.

The archive dependency audit met its existing critical-severity gate but reported pre-existing moderate/high transitive development-tool findings. This publication does not claim to remediate those dependencies or to be a security audit of the site build toolchain.

## Release evidence

Archive publication: [pull request 40](https://github.com/anpa1200/medium-blog-navigation/pull/40), merged as `18a0aaf4770ba470dcc57de054ed79d999eda452`.

Delivery optimization: [pull request 41](https://github.com/anpa1200/medium-blog-navigation/pull/41), merged as `9fe2c24b31d606bdc911b25a1eb89ecef86b7dd2`. This is the archive revision pinned for the website release. The final local cold-load check passed all four configurations: article transfers 1.50–2.79 MB, CLS at most 0.0004; library transfers 0.65 MB. These are local regression measurements, not field performance metrics.

This source report records pre-deployment checks. The website's Pages workflow independently checks the assembled catalog, search, links, accessibility, metadata, immutable build identity, and live production after deployment. A pushed commit alone is not deployment evidence.
