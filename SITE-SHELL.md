# 1200km Site Shell Contract

Standalone pages use one statically generated header and footer. Their content
is maintained in `data/site-shell.json`; `scripts/build-site-shell.mjs`
materializes the fragments into the HTML files between `site-shell` comments.
The checked-in HTML is deployable without JavaScript or another template
runtime.

## Canonical information architecture

The primary navigation contains, in order: Research, AdversaryGraph, Labs,
Library, Projects, and About. Internal destinations are root-relative. Site
search has a static link fallback, and the theme control follows it.

The compact footer repeats the global destinations and adds Privacy / Data
Handling, Contact, GitHub, copyright, and a native fragment link back to the top
on pages where it is useful.

## Build and validation

Run:

```bash
npm run build-shell
npm run check-shell
```

`build-shell` is deterministic and idempotent. `check-shell` fails if any
configured page has a hand-edited or obsolete header/footer, a missing shell
dependency, a wrong active state, or a noncanonical primary link. The Pages
workflow regenerates the shell in its staging directory and validates the
checked-in source before staging.

JavaScript does not add, remove, reorder, or rename primary links. It only
enhances the native `details` mobile disclosure, closes it after selection or
outside click, handles Escape with focus restoration, applies the selected
theme, and upgrades the static search link to the search dialog when Pagefind is
available.

## Product-native navigation

- AdversaryGraph Hub is a standalone page and therefore uses the global shell.
  Product-specific Trust, Architecture, documentation, proof, and feedback
  links remain in its page content.
- AdversaryGraph Documentation and ITDR remain Docusaurus-native. Their
  Docusaurus configuration owns the only header, includes a stable route to the
  1200km research site, and keeps project navigation separate from the global
  standalone shell. The shared Docusaurus enhancement does not inject navbar
  links.
- Threat Matrix is the public ATT&CK workspace associated with AdversaryGraph.
  Its application header remains task-oriented and is not wrapped in a second
  global header. Its static introduction, no-JavaScript fallback, and
  application footer link back to the AdversaryGraph Hub, documentation, and
  1200km ecosystem.
