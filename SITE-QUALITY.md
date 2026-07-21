# Site quality gate

The GitHub Pages workflow validates pull requests without deploying them and
deploys only the exact artifact produced by the successful quality job on
`main`, scheduled, manual, or repository-dispatch runs.

The gate covers authoritative facts, adoption evidence, catalogue schema and
taxonomy, canonical shell generation, static search behavior, internal links,
SEO and JSON-LD, deployable-file hygiene, remote Pagefind coverage and ranking,
real-browser search, mobile layout, serious or critical axe accessibility
violations, layout shift, local page-load timing, and transferred page weight.

Browser quality reports, mobile screenshots, layout measurements, search build
diagnostics, and the generated content catalogue are retained as the
`site-quality-<run id>` Actions artifact. The browser budgets are deliberately
conservative release regressions, not claims about real-user field data:

- cumulative layout shift: at most `0.1`;
- local headless-browser LCP: at most `4000 ms`;
- same-origin transferred resources per page: at most `6 MiB`.

External link health, Search Console, legal review, real-user performance,
third-party availability, and framework source builds remain manual or
repository-specific checks. Checked-in Docusaurus snapshots are inspected and
tested here; their upstream source repositories must also run their own native
builds when source code changes.
