import assert from 'node:assert/strict';

// Only platform assets follow the current host, including after hydration.
// Canonical URLs, navigation, citations, and other origins are not rewritten.
export function sameOriginPlatformAssets(source) {
  return source.replace(/https:\/\/1200km\.com(?=\/assets\/(?:docusaurus-ecosystem|site-theme|theme-bootstrap|platform-sidebar|site-search|site-performance)\.(?:css|js)(?:[?"'`\\\s<]|$))/g, '')
    // Archive CSS and the knowledge-mesh CSS import the same stylesheet with
    // different historical cache keys. Use the current authored key so the
    // browser downloads those identical bytes once. Other origins are untouched.
    .replace(/(?<![\w/.:])\/assets\/site-theme\.css\?v=20260721-shell\b/g, '/assets/site-theme.css?v=20260904-light-default');
}

export function validateCompanions(entries) {
  assert.ok(Array.isArray(entries) && entries.length > 0);
  const seen = new Set();
  for (const entry of entries) {
    assert.match(entry.repository, /^anpa1200\/[A-Za-z0-9_-]+$/);
    assert.match(entry.commit, /^[a-f0-9]{40}$/);
    assert.match(entry.mount, /^[A-Za-z0-9_-]+$/);
    assert.ok(['docusaurus', 'published'].includes(entry.kind));
    assert.ok(['.', 'docs-site'].includes(entry.directory));
    assert.ok(!seen.has(entry.mount), `Duplicate mount ${entry.mount}`);
    seen.add(entry.mount);
  }
  return entries;
}

// The governed shell renders this decorative logo at 32 or 36 CSS pixels.
// Reuse its existing 72px rendition (2x), without touching research imagery.
export function rightSizeShellLogos(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/\bsrc=["']\/assets\/ap-logo\.png["']/.test(tag)
      || !/\balt=["']["']/.test(tag)
      || !/\bwidth=["'](?:32|36)["']/.test(tag)
      || !/\bheight=["'](?:32|36)["']/.test(tag)) return tag;
    return tag.replace(/(\bsrc=["'])\/assets\/ap-logo\.png(["'])/, '$1/assets/ap-logo-72.png$2');
  });
}
