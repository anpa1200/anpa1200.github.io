# Search Console and Bing indexing checklist

Use this checklist only after the production verification workflow confirms that
`https://1200km.com/build.json` reports the intended site commit.

- [ ] Open the Google Search Console domain property `sc-domain:1200km.com` and confirm ownership under **Settings → Ownership verification**.
- [ ] Submit or re-submit `https://1200km.com/sitemap.xml` under **Sitemaps** and record the submission status and discovered-page count.
- [ ] Check **Pages** for server errors, redirect errors, blocked URLs, duplicate canonicals, and crawled-but-not-indexed priority pages.
- [ ] Inspect and request indexing for `https://1200km.com/`
- [ ] Inspect and request indexing for `https://1200km.com/about.html`
- [ ] Inspect and request indexing for `https://1200km.com/projects.html`
- [ ] Inspect and request indexing for `https://1200km.com/articles/`
- [ ] Inspect and request indexing for `https://1200km.com/external-validation.html`
- [ ] Inspect and request indexing for `https://1200km.com/adversarygraph/`
- [ ] Inspect and request indexing for `https://1200km.com/adversarygraph-docs/`
- [ ] Inspect and request indexing for `https://1200km.com/ai-attack-statistics/`
- [ ] Inspect and request indexing for `https://1200km.com/cyber-knowledge/knowledge-sources/`
- [ ] Inspect and request indexing for `https://1200km.com/threat-matrix/`
- [ ] Inspect and request indexing for `https://1200km.com/privacy.html`
- [ ] Confirm GA4 association under **GA4 → Admin → Product links → Search Console Links**; public GA markup does not prove this link exists.
- [ ] Open Bing Webmaster Tools, add or verify `1200km.com`, submit the same sitemap, and inspect Site Explorer plus URL Inspection for the priority URLs above.
- [ ] Record the verified build commit, request date, sitemap result, discovered-page count, and URL Inspection outcome in the release evidence.

Google and Bing requests are manual external actions. A successful site build,
DNS ownership record, analytics tag, or deployment does not prove that account
access, sitemap acceptance, recrawling, or analytics association is complete.
