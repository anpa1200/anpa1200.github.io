import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sameOriginPlatformAssets, validateCompanions } from '../scripts/companion-sites-lib.mjs';

test('all independently hosted companion roots are pinned', () => {
  const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
  const entries = validateCompanions(read('cloudflare/companion-sites.json'));
  const mounts = new Set(entries.map((entry) => entry.mount));
  for (const source of [...read('seo/remote-sitemaps.json'), ...read('seo/remote-pages.json')]) {
    assert.ok(mounts.has(new URL(source.url).pathname.split('/')[1]), source.url);
  }
  assert.throws(() => validateCompanions([{ ...entries[0], commit: 'main' }]));
  assert.throws(() => validateCompanions([{ ...entries[0], mount: '../bad' }]));
});

test('CSP overlay rewrites platform assets only and survives serialized configuration', () => {
  const source = '<link rel="canonical" href="https://1200km.com/about.html"><link href="https://1200km.com/assets/site-theme.css?v=1"><script src="https://1200km.com/assets/docusaurus-ecosystem.js"></script>';
  const transformed = sameOriginPlatformAssets(source);
  assert.match(transformed, /href="https:\/\/1200km.com\/about.html"/);
  assert.match(transformed, /href="\/assets\/site-theme.css\?v=1"/);
  assert.match(transformed, /src="\/assets\/docusaurus-ecosystem.js"/);
  assert.equal(sameOriginPlatformAssets(transformed), transformed);
  assert.equal(sameOriginPlatformAssets('https://1200km.com/assets/unrelated.js'), 'https://1200km.com/assets/unrelated.js');
  assert.equal(sameOriginPlatformAssets(JSON.stringify({ asset: 'https://1200km.com/assets/site-theme.css?v=1' })), '{"asset":"/assets/site-theme.css?v=1"}');
});
