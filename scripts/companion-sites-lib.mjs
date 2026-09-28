import assert from 'node:assert/strict';

// Only platform assets follow the current host, including after hydration.
// Canonical URLs, navigation, citations, and other origins are not rewritten.
export function sameOriginPlatformAssets(source) {
  return source.replace(/https:\/\/1200km\.com(?=\/assets\/(?:docusaurus-ecosystem|site-theme|theme-bootstrap|platform-sidebar|site-search|site-performance)\.(?:css|js)(?:[?"'`\\\s<]|$))/g, '');
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
