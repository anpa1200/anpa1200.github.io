# Archive theme-control follow-up

The Big Pharma publication is live from PR #173. Its live integrity check passed 101 checks, including both deployment identities, originals and display-image hashes, 49 distinct inline destinations, 27 reciprocal dossier links, social metadata, and discovery files. Search finds the article on the first page for both “Big Pharma” and “pharmaceutical”; Pagefind initially renders only three result bodies, so verification must load the remaining visible-page results.

A subsequent actual-button test found that Docusaurus hydration could replace the server-rendered header after `site-theme.js` attached its click listener. The replacement button retained its generic markup, but clicking it changed neither the theme nor the stored preference. Fresh-page light/dark rendering alone did not detect this behavior.

The fix delegates the theme click handler to the document, with a one-time registration guard. Release transformation also makes the theme and bootstrap scripts same-origin, so staged browser tests exercise the staged code rather than an older production script. No article content, artwork, attribution, URL, or performance budget changes.

Validation before this follow-up deployment:

- A header-replacement regression failed before the fix and passes afterward.
- A delivery regression verifies same-origin script references without altering the React application tree.
- The complete source-release gate passed.
- Four staged article browser configurations passed (390px/1440px, light/dark), including eight actual theme-button clicks and accessibility checks after each settled transition.

The release pipeline repeats full-site checks, deploys, and validates production. Final live reports are retained in the research project's publication directory; this file is a pre-deployment source record.
