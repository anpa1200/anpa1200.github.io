import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalFromHtml,
  classifyContentType,
  classifyTopics,
  classifyUrl,
  discoveryWeight,
  normalizeCanonical,
  parseSitemap,
  prepareHtmlForSearch,
  validatePage,
} from '../scripts/search-index-lib.mjs';
import {
  governanceBoost,
  rerankSearchResults,
  shouldApplyDiscoveryGovernance,
} from '../scripts/search-governance-lib.mjs';

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
  const html = '<html><head><title>Windows Command Shell | AdversaryGraph</title><meta name="description" content="MITRE ATT&CK technique details"></head><body><main><h1>Windows Command Shell</h1><h2>Detection logic</h2></main></body></html>';
  const prepared = prepareHtmlForSearch('https://1200km.com/threat-matrix/techniques/T1059.003/', html);
  assert.match(prepared, /<main data-pagefind-body>/);
  assert.match(prepared, /<h2 id="detection-logic">Detection logic<\/h2>/);
  assert.match(prepared, /content="T1059\.003 — Windows Command Shell" data-pagefind-meta="title\[content\]"/);
  assert.match(prepared, /content="T1059\.003" data-pagefind-meta="identifier\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="section\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="content_type\[content\]"/);
  assert.match(prepared, /content="MITRE ATT&amp;CK" data-pagefind-filter="topic\[content\]"/);
});

test('search preprocessing accepts controlled catalogue facets', () => {
  const html = '<html><head><title>Example</title></head><body><main><h1>Example</h1></main></body></html>';
  const prepared = prepareHtmlForSearch('https://1200km.com/example/', html, {
    primary_type: 'guide',
    primary_domain: 'detection-engineering',
    audience: ['detection-engineer', 'threat-hunter'],
    status: 'maintained',
    evidence_level: 'source-backed',
    collection_tier: 'core',
    source_platform: 'GitHub',
    source_repository: 'https://github.com/anpa1200/adversarygraph',
    original_publication: 'https://1200km.com/example/',
    canonical_owner: '1200km / Andrey Pautov',
    version: '6.0.0',
    source_url: 'https://github.com/anpa1200/adversarygraph',
    updated_at: '2026-07-21',
  });
  assert.match(prepared, /data-pagefind-filter="primary_type\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="primary_domain\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="lifecycle\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="status\[content\]"/);
  assert.match(prepared, /data-pagefind-filter="evidence_level\[content\]"/);
  assert.match(prepared, /content="core" data-pagefind-filter="collection_tier\[content\]"/);
  assert.match(prepared, /content="detection-engineer" data-pagefind-filter="audience\[content\]"/);
  assert.match(prepared, /content="threat-hunter" data-pagefind-filter="audience\[content\]"/);
  assert.match(prepared, /content="6\.0\.0" data-pagefind-filter="version\[content\]"/);
  assert.match(prepared, /content="GitHub" data-pagefind-filter="source\[content\]"/);
  assert.match(prepared, /content="https:\/\/github\.com\/anpa1200\/adversarygraph" data-pagefind-meta="source_repository\[content\]"/);
  assert.match(prepared, /content="https:\/\/1200km\.com\/example\/" data-pagefind-meta="original_publication\[content\]"/);
  assert.match(prepared, /content="1200km \/ Andrey Pautov" data-pagefind-meta="canonical_owner\[content\]"/);
  assert.match(prepared, /data-pagefind-weight="6\.00"/);
  assert.match(prepared, /content="2026" data-pagefind-filter="updated_year\[content\]"/);
});

test('search sections classify entities and documentation', () => {
  assert.equal(classifyUrl('https://1200km.com/threat-matrix/actors/G0069/'), 'Threat actors');
  assert.equal(classifyUrl('https://1200km.com/threat-matrix/techniques/T1059/'), 'ATT&CK techniques');
  assert.equal(classifyUrl('https://1200km.com/adversarygraph-docs/api/rag-mcp/'), 'AdversaryGraph docs');
});

test('search facets use deterministic content types and controlled topics', () => {
  assert.equal(classifyContentType('https://1200km.com/threat-matrix/actors/G0069/'), 'Threat actor profile');
  assert.equal(classifyContentType('https://1200km.com/articles/example.html'), 'Article');
  assert.deepEqual(
    classifyTopics('https://1200km.com/guide/', '<title>Threat hunting with Sigma</title><meta name="description" content="Detection engineering">'),
    ['Threat hunting', 'Detection engineering'],
  );
});

test('broad-discovery weights prioritize tier, then evidence, without hiding archives', () => {
  const weight = (collection_tier, evidence_level) => discoveryWeight({ collection_tier, evidence_level });
  assert.ok(weight('core', 'source-backed') > weight('reference', 'externally-accepted'));
  assert.ok(weight('reference', 'externally-accepted') > weight('reference', 'release-evidence'));
  assert.ok(weight('reference', 'release-evidence') > weight('reference', 'lab-validated'));
  assert.ok(weight('reference', 'lab-validated') > weight('reference', 'source-backed'));
  assert.ok(weight('reference', 'source-backed') > weight('reference', 'illustrative'));
  assert.ok(weight('reference', 'illustrative') > weight('reference', 'unverified'));
  assert.ok(weight('archive', 'unverified') > 0);
});

test('post-ranking governance applies only to broad discovery phrases', () => {
  assert.equal(shouldApplyDiscoveryGovernance('threat intelligence'), true);
  assert.equal(shouldApplyDiscoveryGovernance('Operation Desert Hydra'), true);
  assert.equal(shouldApplyDiscoveryGovernance('T1059.003'), false);
  assert.equal(shouldApplyDiscoveryGovernance('MuddyWater'), false);
  assert.equal(shouldApplyDiscoveryGovernance('Historical AdversaryGraph v4 Capability Map'), false);
  assert.ok(governanceBoost({ collection_tier: 'core', evidence_level: 'source-backed' })
    > governanceBoost({ collection_tier: 'reference', evidence_level: 'externally-accepted' }));
  const results = [
    { id: 'archive', score: 10 },
    { id: 'reference', score: 3 },
    { id: 'core', score: 1 },
  ];
  const records = {
    archive: { boost: 0.2 },
    reference: { boost: 1 },
    core: { boost: 12 },
  };
  assert.deepEqual(rerankSearchResults(results, 'cloud security', records).map((item) => item.id), ['core', 'reference', 'archive']);
  assert.deepEqual(rerankSearchResults(results, 'T1059.003', records).map((item) => item.id), ['archive', 'reference', 'core']);
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
  assert.match(readFileSync(join(ROOT, 'assets', 'site-theme.js'), 'utf8'), new RegExp(`searchAssetVersion = '${version}'`));
  assert.doesNotMatch(search, /meta-cache-tag|metaCacheTag/, 'daily index rebuilds must not reuse a static Pagefind metadata cache tag');
  assert.doesNotMatch(search, /no-worker|noWorker/, 'production search should use Pagefind worker mode with its built-in fallback');
});

test('homepage ships a visible progressive search fallback and hero search before JavaScript', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const search = readFileSync(join(ROOT, 'assets', 'site-search.js'), 'utf8');
  const version = search.match(/const ASSET_VERSION = '([^']+)'/)?.[1];
  assert.match(html, new RegExp(`id="site-search-styles"[^>]+site-search\\.css\\?v=${version}`));
  assert.match(html, new RegExp(`site-search\\.js\\?v=${version}`));
  assert.match(html, /class="site-search-host site-search-host--standalone"[\s\S]*?href="\/search\.html"[\s\S]*?id="theme-btn"/);
  assert.match(html, /aria-label="Search all 1200km research"/);
  assert.match(html, /data-site-search-hero[\s\S]*?<form[^>]+action="\/search\.html"[\s\S]*?<input[^>]+name="q"/);
});

test('portfolio navigation is compact and search is click-only', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const search = readFileSync(join(ROOT, 'assets', 'site-search.js'), 'utf8');
  const theme = readFileSync(join(ROOT, 'assets', 'site-theme.js'), 'utf8');
  const styles = readFileSync(join(ROOT, 'assets', 'site-search.css'), 'utf8');
  const shellSources = `${html}\n${search}\n${theme}\n${styles}`;

  assert.doesNotMatch(shellSources, /Ctrl\s*\+?\s*K|mod\+k|site-search-fallback-shortcut/i);
  assert.doesNotMatch(search, /pagefind-modal-trigger/i);
  assert.match(html, /<details class="nav-links"[^>]*>[\s\S]*?<div class="nav-list" id="primary-nav-list">/);
  assert.match(html, /class="has-page-sidenav"/);
  assert.match(html, /class="skip-link"[^>]+href="#main-content"/);

  const primary = html.match(/<div class="nav-list" id="primary-nav-list">([\s\S]*?)<\/div>/)?.[1] || '';
  assert.equal((primary.match(/<a\b/g) || []).length, 6);
  for (const label of ['Research', 'AdversaryGraph', 'Labs', 'Library', 'Projects', 'About']) {
    assert.match(primary, new RegExp(`>${label}<`));
  }
  assert.match(search, /setAttribute\('show-sub-results', 'true'\)/);
  assert.match(search, /pagefind-filter-dropdown/);
  assert.match(search, /pagefind-results/);
  assert.match(search, /SEARCH_PAGE_BATCH_SIZE = 20/);
  assert.match(search, /window\.setTimeout\(handleComponentError, 6_000\)/);
});

test('Threat Matrix exposes distinct workspace and domain-wide search controls', () => {
  const html = readFileSync(join(ROOT, 'threat-matrix', 'index.html'), 'utf8');
  const scopeScript = readFileSync(join(ROOT, 'threat-matrix', 'assets', 'search-scope.js'), 'utf8');
  assert.match(html, />Search this workspace</);
  assert.match(html, /<form[^>]+action="\/search\.html"[\s\S]*?<label[^>]*>Search all 1200km research<\/label>/);
  assert.match(scopeScript, /setAttribute\('aria-label', 'Search this workspace'\)/);
  assert.doesNotMatch(html, /site-search\.js/);
});

test('remote index builds prefer release files and require stable ranking fixtures', () => {
  const builder = readFileSync(join(ROOT, 'scripts', 'build-search-index.mjs'), 'utf8');
  assert.match(builder, /pageSource\(url, !remote, remote\)/);
  assert.match(builder, /requiredIndexUrls/);
  assert.match(builder, /missing required release fixtures/);
  assert.match(builder, /maxStalePages/);
  assert.match(builder, /canonicalSitemapOutput/);
  assert.match(builder, /skippedDetails/);
});
