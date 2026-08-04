# Site quality gate

The GitHub Pages workflow validates pull requests without deploying them and
deploys only the exact artifact produced by the successful quality job on
`main`, scheduled, manual, or repository-dispatch runs.

The gate covers authoritative facts, adoption evidence, catalogue schema and
taxonomy, canonical shell generation, governed sidebar coverage, static search
behavior, internal links, SEO and connected JSON-LD, conventional and AI
discovery files, deployable-file hygiene, remote Pagefind coverage and ranking,
real-browser search, mobile layout, moderate-or-higher axe accessibility
violations, layout shift, local page-load timing, and transferred page weight.
The representative browser matrix runs both light and dark themes at mobile
and desktop widths so operating-system color preference cannot hide a cascade
regression.

Browser quality reports, mobile screenshots, layout measurements, search build
diagnostics, the platform discoverability audit, and the generated content
catalogue are retained as the
`site-quality-<run id>` Actions artifact. The browser budgets are deliberately
conservative release regressions, not claims about real-user field data:

- cumulative layout shift: at most `0.1`;
- local headless-browser LCP: at most `4000 ms`;
- same-origin transferred resources per page: `2 MiB` by default, with explicit
  class ceilings of `3.25 MiB` for documentation, `3 MiB` for articles, and
  `3.5 MiB` for image-heavy articles.

External link health, Search Console, legal review, real-user performance,
third-party availability, and framework source builds remain manual or
repository-specific checks. Checked-in Docusaurus snapshots are inspected and
tested here; their upstream source repositories must also run their own native
builds when source code changes.
