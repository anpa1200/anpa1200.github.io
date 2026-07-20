# 1200km.com

Main GitHub Pages landing page for Andrey Pautov's cybersecurity research,
Docusaurus documentation sites, security tooling, Medium articles, and contact
links.

Published target:

https://1200km.com

Canonical project inventory:

https://1200km.com/projects.html

## Site-wide search

The site uses a self-hosted Pagefind index and accessible ARIA combobox UI. The
production build discovers canonical pages from the full `1200km.com` sitemap
federation, rejects redirects, `noindex` pages, 404s, legacy aliases, and
off-origin canonicals, then boosts exact ATT&CK/group identifiers, actor aliases,
titles, and descriptions. Searches are worker-backed, typo tolerant, keyboard
navigable, and available from the primary header by click, tap, or normal Tab
navigation. The dedicated `/search.html` workspace remains available as a
progressive fallback when the enhanced component cannot load.

Local validation:

```bash
npm ci
npm run check-search
npm run build-search -- --output /tmp/1200km-pagefind
npm run check-search:index -- --bundle /tmp/1200km-pagefind
npm run check-search:browser -- --bundle /tmp/1200km-pagefind
```

The tooling and browser gate require Node.js 22 or newer plus a local Chrome or
Chromium binary.

The Pages workflow rebuilds the live sitemap union on each deployment and on a
daily schedule. Search assets stay on the same origin, and the browser loads
only the Pagefind shards needed for the current query.
