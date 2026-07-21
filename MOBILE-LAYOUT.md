# Mobile Typography and Overflow Contract

The established 1200km visual identity is unchanged. This contract defines how
the site contains technical content without narrowing or damaging ordinary
prose.

## Root cause

The standalone-page mobile rules introduced while normalizing navigation used
fixed `max-content` navigation and CTA grids. Long labels, contact values, and
technical identifiers could exceed the viewport. A broad fallback then applied
`max-width: 30ch` and `overflow-wrap: anywhere` to every paragraph and list item,
while `body { overflow-x: hidden; }` concealed the remaining component overflow.

The AdversaryGraph Docusaurus override repeated the emergency wrapping for all
document paragraphs, list items, and headings. The public Threat Matrix shell
also kept its complete desktop navigation in one horizontally scrolling row.

## Layout rules

- Paragraphs and list items use normal wrapping and the available mobile width.
- Headings use `overflow-wrap: break-word` only as a last resort for a genuinely
  unbroken technical term.
- URLs, hashes, identifiers, filenames, and inline code may use
  `overflow-wrap: anywhere`.
- Code blocks and tables own their horizontal scrolling region.
- Mobile navigation and CTA groups wrap or reflow; page-level overflow is not
  hidden to mask a component defect.
- Desktop prose may retain a readable measure such as 72–78 characters.

## Regression coverage

Run:

```bash
npm run check-layout
npm run check-layout:browser -- --site /path/to/site --screenshots /tmp/1200km-mobile-layout
```

The browser regression checks the homepage, About, CV, Projects, Library, Labs,
External Validation, AdversaryGraph, Search, a long Docusaurus deployment guide,
and the Threat Matrix shell at 320, 360, 375, 390, 430, 768, and 1440 CSS pixels.
It also uses a 640 CSS-pixel viewport to represent a 1280-pixel browser reflowed
at 200% zoom.

The test injects a temporary stress fixture containing a long repository URL,
SHA-256 value, ATT&CK identifier, command, table, CTA group, and long technical
heading. It records measurements in `layout-results.json` and captures the 390px
layouts plus representative 200% zoom views. GitHub Actions uploads these
artifacts for every validated deployment run and retains them for 14 days.
