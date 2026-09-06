import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalFromHtml,
  buildKnowledgeSourceSearchRecords,
  classifyContentType,
  classifyTopics,
  classifyUrl,
  discoveryWeight,
  LOCAL_SEARCH_MINIMUM_PAGES,
  normalizeCanonical,
  KNOWLEDGE_SOURCES_URL,
  parseSitemap,
  prepareHtmlForSearch,
  REMOTE_SEARCH_MINIMUM_PAGES,
  validatePage,
} from '../scripts/search-index-lib.mjs';
import {
  governanceBoost,
  rerankSearchResults,
  shouldApplyDiscoveryGovernance,
} from '../scripts/search-governance-lib.mjs';
import { trainsecCanonicalEntries } from '../scripts/trainsec-canonical-lib.mjs';

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

test('canonical sitemap union preserves remote pages and excludes syndicated TrainSec mirrors', () => {
  const local = new Set(parseSitemap(readFileSync(join(ROOT, 'sitemap-all.xml'), 'utf8')).locations);
  const complete = new Set(parseSitemap(readFileSync(join(ROOT, 'sitemap.xml'), 'utf8')).locations);
  assert.ok(complete.size > local.size, 'complete sitemap must retain canonical remote collection pages');
  for (const url of local) assert.ok(complete.has(url), `complete sitemap is missing local canonical ${url}`);
  for (const entry of trainsecCanonicalEntries) {
    assert.equal(local.has(entry.local_url), false, entry.local_url);
    assert.equal(complete.has(entry.local_url), false, entry.local_url);
    assert.equal(local.has(entry.canonical_url), false, entry.canonical_url);
    assert.equal(complete.has(entry.canonical_url), false, entry.canonical_url);
  }
  for (const url of [
    'https://1200km.com/articles/trainsec-library.html',
    'https://1200km.com/articles/trainsec/authors.html',
    'https://1200km.com/articles/trainsec/domains.html',
  ]) {
    assert.ok(local.has(url), url);
    assert.ok(complete.has(url), url);
  }
  const feed = readFileSync(join(ROOT, 'feed.xml'), 'utf8');
  for (const entry of trainsecCanonicalEntries) {
    assert.equal(feed.includes(entry.local_url), false, entry.local_url);
    assert.equal(feed.includes(entry.canonical_url), false, entry.canonical_url);
  }
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

test('validation recognizes only exact allowlisted TrainSec external canonicals', () => {
  const entry = trainsecCanonicalEntries[0];
  const mirror = `<html><head><title>TrainSec mirror</title>
    <meta name="trainsec-source" content="${entry.canonical_url}">
    <meta name="trainsec-mirror" content="${entry.local_url}">
    <link rel="canonical" href="${entry.canonical_url}">
    </head><body>Main</body></html>`;
  assert.deepEqual(validatePage(entry.local_url, mirror), {
    indexable: false,
    reason: 'external-canonical',
    canonicalUrl: entry.canonical_url,
  });
  assert.equal(
    validatePage(entry.local_url, mirror.replace(
      `<link rel="canonical" href="${entry.canonical_url}">`,
      `<link rel="canonical" href="${entry.canonical_url}?copy=1">`,
    )).reason,
    'off-origin-canonical',
  );
  assert.equal(
    validatePage(entry.local_url, mirror.replace(
      `<meta name="trainsec-source" content="${entry.canonical_url}">`,
      '<meta name="trainsec-source" content="https://trainsec.net/library/wrong/">',
    )).reason,
    'off-origin-canonical',
  );
  assert.equal(
    validatePage('https://1200km.com/articles/trainsec/not-in-manifest.html', mirror).reason,
    'off-origin-canonical',
  );
  assert.equal(
    validatePage(entry.local_url, mirror.replace(`<meta name="trainsec-mirror" content="${entry.local_url}">`, '')).reason,
    'off-origin-canonical',
  );
  assert.equal(
    validatePage(entry.local_url, mirror.replace(
      '</head>',
      '<link rel="canonical" href="https://example.com/escape"></head>',
    )).reason,
    'multiple-canonicals',
  );
  assert.equal(
    validatePage(entry.local_url, mirror.replace(
      '</head>',
      `<meta name="trainsec-source" content="${entry.canonical_url}"></head>`,
    )).reason,
    'off-origin-canonical',
  );
  assert.equal(
    validatePage(entry.local_url, mirror.replace(
      '</head>',
      `<meta name="trainsec-mirror" content="${entry.local_url}"></head>`,
    )).reason,
    'off-origin-canonical',
  );
  const other = trainsecCanonicalEntries[1];
  assert.equal(
    validatePage(other.local_url, mirror.replace(
      `<meta name="trainsec-mirror" content="${entry.local_url}">`,
      `<meta name="trainsec-mirror" content="${other.local_url}">`,
    )).reason,
    'off-origin-canonical',
  );
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
    lifecycle: 'stable-reference',
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
  assert.match(prepared, /content="stable-reference" data-pagefind-filter="lifecycle\[content\]"/);
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
  assert.equal(classifyUrl('https://1200km.com/courses/'), 'Courses & learning');
  assert.equal(classifyUrl('https://1200km.com/ai-security-course.html'), 'Courses & learning');
  assert.equal(classifyUrl('https://1200km.com/ai-security-course/module-00/chapter-03.html'), 'Courses & learning');
  assert.equal(classifyUrl('https://1200km.com/ai-security-course/module-00/chapter-04.html'), 'Courses & learning');
  assert.equal(classifyUrl(KNOWLEDGE_SOURCES_URL), 'Cyber Knowledge');
  assert.equal(classifyContentType(KNOWLEDGE_SOURCES_URL), 'Knowledge source collection');
});

test('knowledge sources become independently searchable records with controlled and rich facets', () => {
  const dataset = {
    schema_version: 1,
    generated_on: '2026-09-06',
    controlled_tag_vocabulary: ['cloud-security', 'free', 'intermediate'],
    sources: [{
      id: 'cloud-native-security-reference',
      name: 'Cloud Native Security Reference',
      url: 'https://example.org/cloud-security',
      category: 'cloud-security',
      provenance: ['openai'],
      source_kind: 'open-source-project',
      access: 'free',
      organization: 'Example Foundation',
      summary: 'A source-backed cloud and Kubernetes security reference.',
      description: 'Operational guidance for cloud defenders and platform teams working with Kubernetes.',
      quality: { tier: 'A', rationale: 'Primary guidance with a documented maintenance process.' },
      validation: { status: 'reachable' },
      assessment: {
        strengths: ['Primary technical guidance'],
        limitations: ['Scope is limited to cloud-native systems'],
        best_for: ['Cloud architecture reviews'],
        evidence_use: 'primary-authoritative',
        maintenance: 'active',
      },
      audience: ['cloud security engineers', 'platform operators'],
      skill_levels: ['intermediate'],
      content_formats: ['technical documentation'],
      tags: ['cloud-security', 'free', 'intermediate'],
      keywords: ['kubernetes', 'cloud-native'],
      related_source_ids: [],
    }],
  };
  const html = '<html><head><title>Knowledge Sources</title></head><body><article id="source-cloud-native-security-reference"></article></body></html>';
  const [record] = buildKnowledgeSourceSearchRecords(dataset, html, {
    primary_domain: 'site-governance',
    audience: ['general'],
  });

  assert.equal(record.url, '/cyber-knowledge/knowledge-sources/#source-cloud-native-security-reference');
  assert.equal(record.meta.title, 'Cloud Native Security Reference');
  assert.equal(record.meta.content_type, 'Knowledge source');
  assert.equal(record.meta.primary_type, 'reference-entity');
  assert.equal(record.meta.primary_domain, 'cloud-security');
  assert.deepEqual(record.filters.section, ['Cyber Knowledge']);
  assert.deepEqual(record.filters.content_type, ['Knowledge source']);
  assert.deepEqual(record.filters.collection_tier, ['reference']);
  assert.deepEqual(record.filters.knowledge_tag, ['cloud-security', 'free', 'intermediate']);
  assert.deepEqual(record.filters.knowledge_access, ['free']);
  assert.deepEqual(record.filters.knowledge_quality_tier, ['A']);
  assert.deepEqual(record.filters.knowledge_source_kind, ['open-source-project']);
  assert.deepEqual(record.filters.knowledge_evidence_use, ['primary-authoritative']);
  assert.deepEqual(record.filters.knowledge_maintenance, ['active']);
  assert.deepEqual(record.filters.knowledge_skill_level, ['intermediate']);
  assert.ok(record.filters.topic.includes('Cloud security'));
  assert.match(record.content, /Cloud architecture reviews/);
  assert.match(record.content, /kubernetes/);
});

test('all knowledge-source categories map to stable, semantically consistent primary domains', () => {
  const dataset = JSON.parse(readFileSync(join(ROOT, 'data', 'knowledge-sources.json'), 'utf8'));
  const html = readFileSync(join(ROOT, 'cyber-knowledge', 'knowledge-sources', 'index.html'), 'utf8');
  const records = buildKnowledgeSourceSearchRecords(dataset, html, {
    primary_domain: 'site-governance',
    audience: ['general'],
  });
  const expectedDomains = {
    academic: 'threat-intelligence',
    'adversary-emulation': 'offensive-research',
    'ai-security': 'ai-security',
    'api-security': 'application-security',
    'application-security': 'application-security',
    'cloud-security': 'cloud-security',
    'container-security': 'cloud-security',
    cti: 'threat-intelligence',
    datasets: 'threat-intelligence',
    'detection-engineering': 'detection-engineering',
    dfir: 'incident-response',
    'exploit-development': 'vulnerability-research',
    framework: 'security-governance',
    government: 'security-governance',
    'identity-security': 'identity-security',
    'incident-response': 'incident-response',
    kubernetes: 'cloud-security',
    'malware-analysis': 'malware-analysis',
    'mobile-security': 'application-security',
    'network-security': 'network-security',
    'penetration-testing': 'offensive-research',
    'reverse-engineering': 'malware-analysis',
    soc: 'detection-engineering',
    'threat-informed-defense': 'detection-engineering',
    'threat-reports': 'threat-intelligence',
    'threat-research': 'threat-intelligence',
    training: 'platform-documentation',
    vulnerability: 'vulnerability-research',
    'web-security': 'application-security',
  };
  const categoryDomains = new Map();

  for (const [index, source] of dataset.sources.entries()) {
    const domain = records[index].meta.primary_domain;
    assert.equal(records[index].filters.primary_domain[0], domain, source.id);
    assert.equal(domain, expectedDomains[source.category], source.id);
    assert.equal(categoryDomains.get(source.category) ?? domain, domain, source.category);
    categoryDomains.set(source.category, domain);
  }

  assert.deepEqual([...categoryDomains.keys()].sort(), Object.keys(expectedDomains).sort());
  for (const id of [
    'nist-cybersecurity-framework',
    'nist-sp-800-53',
    'nist-sp-800-207-zero-trust-architecture',
    'cis-critical-security-controls',
    'ncsc-cyber-assessment-framework',
    'asd-essential-eight',
  ]) {
    assert.equal(records.find((record) => record.meta.identifier === id)?.meta.primary_domain, 'security-governance', id);
  }
  assert.equal(
    records.find((record) => record.meta.identifier === 'oasis-open-cti-documentation')?.meta.primary_domain,
    'threat-intelligence',
  );
});

test('knowledge-source search records require rendered anchors and controlled tags', () => {
  const dataset = {
    schema_version: 1,
    controlled_tag_vocabulary: ['free'],
    sources: [{
      id: 'example-source', name: 'Example', url: 'https://example.org/', category: 'training',
      source_kind: 'open-source', access: 'free', organization: 'Example', summary: 'Summary', description: 'Description',
      tags: ['free'], related_source_ids: [],
    }],
  };
  assert.throws(
    () => buildKnowledgeSourceSearchRecords(dataset, '<html><body></body></html>'),
    /anchor is missing/,
  );
  const invalid = structuredClone(dataset);
  invalid.sources[0].tags.push('uncontrolled');
  assert.throws(
    () => buildKnowledgeSourceSearchRecords(invalid, '<html><body><div id="source-example-source"></div></body></html>'),
    /uncontrolled tag/,
  );
});

test('search facets use deterministic content types and controlled topics', () => {
  assert.equal(classifyContentType('https://1200km.com/threat-matrix/actors/G0069/'), 'Threat actor profile');
  assert.equal(classifyContentType('https://1200km.com/articles/example.html'), 'Article');
  assert.equal(classifyContentType('https://1200km.com/courses/'), 'Collection');
  assert.equal(classifyContentType('https://1200km.com/courses/trainsec-malware-analyst-professional-level-1/'), 'Course learning record');
  assert.equal(classifyContentType('https://1200km.com/ai-security-course.html'), 'Course');
  assert.equal(classifyContentType('https://1200km.com/ai-security-course/module-00/chapter-03.html'), 'Course');
  assert.equal(classifyContentType('https://1200km.com/ai-security-course/module-00/chapter-04.html'), 'Course');
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
  assert.equal(shouldApplyDiscoveryGovernance('AdversaryGraph'), true);
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
  const exactTitleRecords = {
    ...records,
    archive: { ...records.archive, boost: 0.1, custom_record: true, title: 'Cloud Security' },
  };
  assert.equal(rerankSearchResults(results, 'cloud security', exactTitleRecords)[0].id, 'archive');
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

  const primary = html.match(/<!-- site-shell:primary-navigation:start -->([\s\S]*?)<!-- site-shell:primary-navigation:end -->/)?.[1] || '';
  assert.equal((primary.match(/<a\b/g) || []).length, 10);
  assert.equal((primary.match(/<details class="nav-more"/g) || []).length, 1);
  for (const label of ['Research', 'Library', 'Products & Labs', 'AdversaryGraph', 'Cyber Knowledge', 'Courses', 'References', 'About', 'CV', 'External validation']) {
    assert.match(primary.replace(/&amp;/g, '&'), new RegExp(`>${label}<`));
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
  assert.equal(LOCAL_SEARCH_MINIMUM_PAGES, 1000);
  assert.equal(REMOTE_SEARCH_MINIMUM_PAGES, 1500);
  assert.match(builder, /REMOTE_SEARCH_MINIMUM_PAGES/);
  assert.match(readFileSync(join(ROOT, 'scripts', 'check-search-index.mjs'), 'utf8'), /REMOTE_SEARCH_MINIMUM_PAGES/);
});
