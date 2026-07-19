import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalFromHtml,
  classifyUrl,
  normalizeCanonical,
  parseSitemap,
  prepareHtmlForSearch,
  validatePage,
} from '../scripts/search-index-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('canonical URLs are normalized and constrained to 1200km.com', () => {
  assert.equal(normalizeCanonical('https://1200km.com/docs/index.html#part'), 'https://1200km.com/docs/');
  assert.equal(normalizeCanonical('/ITDR/docs/intro'), 'https://1200km.com/ITDR/docs/intro/');
  assert.equal(normalizeCanonical('https://example.com/escape'), null);
});

test('sitemap parser distinguishes indexes and deduplicates URLs', () => {
  const parsed = parseSitemap(`<?xml version="1.0"?><sitemapindex><sitemap><loc>https://1200km.com/a/sitemap.xml</loc></sitemap><sitemap><loc>https://1200km.com/a/sitemap.xml</loc></sitemap></sitemapindex>`);
  assert.equal(parsed.isIndex, true);
  assert.deepEqual(parsed.locations, ['https://1200km.com/a/sitemap.xml']);
});

test('canonical extraction supports attribute order', () => {
  assert.equal(canonicalFromHtml('<link href="https://1200km.com/a/" rel="canonical">'), 'https://1200km.com/a/');
});

test('validation rejects redirects, noindex pages, aliases, and external canonicals', () => {
  const base = '<html><head><title>Page</title></head><body>Main</body></html>';
  assert.equal(validatePage('https://1200km.com/a/', base).indexable, true);
  assert.equal(validatePage('https://1200km.com/a/', base.replace('<head>', '<head><meta name="robots" content="noindex">')).reason, 'noindex');
  assert.equal(validatePage('https://1200km.com/a/', base.replace('<head>', '<head><meta content="nofollow, noindex" name="robots">')).reason, 'noindex');
  assert.equal(validatePage('https://1200km.com/a/', base.replace('<head>', '<head><meta http-equiv="refresh" content="0; /b/">')).reason, 'redirect');
  assert.equal(validatePage('https://1200km.com/a/', base.replace('<head>', '<head><link rel="canonical" href="https://1200km.com/b/">')).reason, 'canonical-alias');
  assert.equal(validatePage('https://1200km.com/a/', base.replace('<head>', '<head><link rel="canonical" href="https://example.com/a/">')).reason, 'off-origin-canonical');
});

test('search preprocessing marks canonical bodies and boosts entity identity', () => {
  const html = '<html><head><title>Windows Command Shell | AdversaryGraph</title><meta name="description" content="Technique details"></head><body><main><h1>Windows Command Shell</h1></main></body></html>';
  const prepared = prepareHtmlForSearch('https://1200km.com/threat-matrix/techniques/T1059.003/', html);
  assert.match(prepared, /<body data-pagefind-body>/);
  assert.match(prepared, /content="T1059\.003 — Windows Command Shell" data-pagefind-meta="title\[content\]"/);
  assert.match(prepared, /content="T1059\.003" data-pagefind-meta="identifier\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="section\[content\]"/);
});

test('search sections classify entities and documentation', () => {
  assert.equal(classifyUrl('https://1200km.com/threat-matrix/actors/G0069/'), 'Threat actors');
  assert.equal(classifyUrl('https://1200km.com/threat-matrix/techniques/T1059/'), 'ATT&CK techniques');
  assert.equal(classifyUrl('https://1200km.com/adversarygraph-docs/api/rag-mcp/'), 'AdversaryGraph docs');
});

test('search loader versions stay synchronized and the live index is not pinned to stale metadata', () => {
  const search = readFileSync(join(ROOT, 'assets', 'site-search.js'), 'utf8');
  const version = search.match(/const ASSET_VERSION = '([^']+)'/)?.[1];
  assert.ok(version, 'site-search.js must declare ASSET_VERSION');
  for (const file of [
    join('assets', 'site-theme.js'),
    join('assets', 'docusaurus-ecosystem.js'),
    join('scripts', 'inject-search-loader.mjs'),
  ]) {
    assert.match(readFileSync(join(ROOT, file), 'utf8'), new RegExp(`site-search\\.js\\?v=${version}`), `${file} must load the current search asset`);
  }
  assert.doesNotMatch(search, /meta-cache-tag|metaCacheTag/, 'daily index rebuilds must not reuse a static Pagefind metadata cache tag');
  assert.doesNotMatch(search, /no-worker|noWorker/, 'production search should use Pagefind worker mode with its built-in fallback');
});
