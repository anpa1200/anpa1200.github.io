# ITDR snapshot source contract

`docusaurus.config.js` is the maintained public configuration for the
prebuilt `/ITDR/` snapshot. The documentation source is kept outside this
GitHub Pages repository; the built snapshot is committed here so the Pages
release remains deterministic.

Rebuild from a checked-out ITDR source tree:

```sh
npm run build-itdr -- --source /path/to/ITDR
```

The rebuild command copies this configuration into the source tree, runs the
Docusaurus production build, applies the same release-HTML transformer used by
GitHub Pages, and replaces only the tracked `/ITDR/` snapshot.

The public snapshot intentionally has no “Edit this page” control. Its source
link targets the published snapshot in `anpa1200/anpa1200.github.io`, rather
than the nonexistent historical `anpa1200/ITDR` repository.
