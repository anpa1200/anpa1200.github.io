import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContentItem, VOCABULARIES } from '../scripts/content-catalog-lib.mjs';
import { trainsecCanonicalEntries } from '../scripts/trainsec-canonical-lib.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'content-catalog.json'), 'utf8'));
const taxonomyAudit = JSON.parse(readFileSync(join(ROOT, 'reports', 'content-taxonomy-audit.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(ROOT, 'data', 'content-catalog.config.json'), 'utf8'));
const trainsecCanonicalSet = new Set(trainsecCanonicalEntries.map((entry) => entry.canonical_url));

test('catalogue has one stable ID and canonical URL per item', () => {
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, catalog.items.length);
  assert.equal(new Set(catalog.items.map((item) => item.canonical_url)).size, catalog.items.length);
});

test('catalogue uses scalar controlled primary classifications', () => {
  for (const item of catalog.items) {
    assert.equal(typeof item.primary_type, 'string', item.id);
    assert.equal(typeof item.primary_domain, 'string', item.id);
    assert.ok(VOCABULARIES.primary_types.includes(item.primary_type), item.id);
    assert.ok(VOCABULARIES.primary_domains.includes(item.primary_domain), item.id);
    assert.ok(VOCABULARIES.lifecycles.includes(item.lifecycle), item.id);
    assert.ok(VOCABULARIES.collection_tiers.includes(item.collection_tier), item.id);
  }
});

test('every item carries governed provenance independent of build origin', () => {
  for (const item of catalog.items) {
    assert.ok(item.source_platform, item.id);
    assert.doesNotThrow(() => new URL(item.source_repository), item.id);
    assert.doesNotThrow(() => new URL(item.original_publication), item.id);
    assert.ok(item.canonical_owner, item.id);
  }
  const technique = catalog.items.find((item) => item.canonical_url === 'https://1200km.com/threat-matrix/techniques/T1059.003/');
  assert.equal(technique?.source_platform, 'MITRE ATT&CK');
  assert.equal(technique?.primary_type, 'generated-reference');
  assert.equal(technique?.lifecycle, 'stable-reference');
  assert.equal(technique?.collection_tier, 'reference');
});

test('core, reference, and archive are distinct governed discovery tiers', () => {
  assert.equal(catalog.items.find((item) => item.canonical_url === 'https://1200km.com/adversarygraph/')?.collection_tier, 'core');
  for (const item of catalog.items.filter((entry) =>
    /^https:\/\/1200km\.com\/cyber-knowledge\/(?:|[^/]+\.html)$/.test(entry.canonical_url)
  )) {
    assert.equal(item.collection_tier, 'core', item.canonical_url);
  }
  assert.equal(catalog.items.find((item) => item.canonical_url === 'https://1200km.com/threat-matrix/techniques/T1059.003/')?.collection_tier, 'reference');
  for (const item of catalog.items.filter((entry) => ['archived', 'superseded'].includes(entry.status))) {
    assert.equal(item.collection_tier, 'archive', item.id);
  }
});

test('mirrors identify a distinct source and archived records explain lifecycle', () => {
  for (const item of catalog.items.filter((entry) => entry.primary_type === 'mirror')) {
    assert.ok(item.source_url, item.id);
    if (trainsecCanonicalSet.has(item.canonical_url)) {
      assert.equal(item.source_url, item.canonical_url, item.id);
      assert.equal(item.indexable, false, item.id);
      assert.equal(item.alternate_urls?.length, 1, item.id);
      assert.match(item.alternate_urls[0], /^https:\/\/1200km\.com\/articles\/trainsec\/.+\.html$/, item.id);
    } else assert.notEqual(item.source_url, item.canonical_url, item.id);
  }
  for (const item of catalog.items.filter((entry) => ['archived', 'superseded'].includes(entry.status))) {
    assert.ok(item.archive_reason, item.id);
  }
});

test('offensive indexes are not assigned catch-all CTI taxonomy', () => {
  for (const url of [
    'https://1200km.com/hexstrike.html',
    'https://1200km.com/ai-offensive.html',
    'https://1200km.com/pt-tools.html',
  ]) {
    assert.equal(catalog.items.find((item) => item.canonical_url === url)?.primary_domain, 'offensive-research');
  }
});

test('discovery tags are specific and support multi-facet retrieval', () => {
  assert.equal(catalog.items.filter((item) => item.tags.includes('security-research')).length, 0);
  const windows = catalog.items.find((item) => item.alternate_urls?.some((url) => url.includes('/articles/trainsec/windows-internals-vmmap-basics')));
  assert.equal(windows?.primary_domain, 'application-security');
  assert.ok(windows?.tags.includes('windows-internals'));
  const malware = catalog.items.find((item) => item.alternate_urls?.some((url) => url.includes('/articles/trainsec/malware-analysis-wannacry-dropper')));
  assert.equal(malware?.primary_domain, 'malware-analysis');
  assert.ok(malware?.tags.includes('reverse-engineering'));
  assert.ok(taxonomyAudit.tagging.unique_tag_count > 20);
  assert.equal(taxonomyAudit.tagging.generic_security_research_count, 0);
});

test('TrainSec mirrors retain exact external canonical identities and local alternates', () => {
  const trainsecItems = catalog.items.filter((item) => item.canonical_url.startsWith('https://trainsec.net/'));
  assert.equal(trainsecItems.length, trainsecCanonicalEntries.length);
  for (const entry of trainsecCanonicalEntries) {
    const item = trainsecItems.find((candidate) => candidate.canonical_url === entry.canonical_url);
    assert.ok(item, entry.canonical_url);
    assert.equal(item.primary_type, 'mirror');
    assert.equal(item.collection_id, 'collection:trainsec-library');
    assert.equal(item.source_url, entry.canonical_url);
    assert.equal(item.source_platform, 'TrainSec');
    assert.equal(item.canonical_owner, 'TrainSec.net');
    assert.deepEqual(item.alternate_urls, [entry.local_url]);
    assert.equal(item.indexable, false);
  }
  for (const url of [
    'https://1200km.com/articles/trainsec-library.html',
    'https://1200km.com/articles/trainsec/authors.html',
    'https://1200km.com/articles/trainsec/domains.html',
  ]) {
    const item = catalog.items.find((candidate) => candidate.canonical_url === url);
    assert.equal(item?.primary_type, 'index', url);
    assert.equal(item?.indexable, true, url);
  }
});

test('catalogue creation fails closed around TrainSec mirror metadata', () => {
  const entry = trainsecCanonicalEntries[0];
  const html = `<html><head><title>VMMap Basics</title>
    <meta name="description" content="A sufficiently detailed TrainSec mirror description for catalogue generation.">
    <meta name="author" content="Pavel Yosifovich">
    <meta name="trainsec-source" content="${entry.canonical_url}">
    <meta name="trainsec-mirror" content="${entry.local_url}">
    <meta property="article:published_time" content="2026-08-02">
    <link rel="canonical" href="${entry.canonical_url}">
    </head><body><main><h1>VMMap Basics</h1></main></body></html>`;
  const item = createContentItem({
    url: entry.local_url,
    html,
    updatedAt: '2026-08-18',
    source: 'external-canonical-mirror',
  }, config);
  assert.equal(item.canonical_url, entry.canonical_url);
  assert.deepEqual(item.alternate_urls, [entry.local_url]);
  assert.equal(item.indexable, false);
  assert.throws(() => createContentItem({
    url: entry.local_url,
    html: html.replace(`<meta name="trainsec-mirror" content="${entry.local_url}">`, ''),
    updatedAt: '2026-08-18',
    source: 'external-canonical-mirror',
  }, config), /metadata or canonical mapping is invalid/);
});

test('current, superseded, archived, and externally sourced entities remain distinct', () => {
  assert.ok(catalog.items.some((item) => item.status === 'current-development'));
  assert.ok(catalog.items.some((item) => item.status === 'superseded'));
  assert.ok(catalog.items.some((item) => item.status === 'archived'));
  assert.ok(catalog.items.some((item) =>
    item.canonical_url.startsWith('https://1200km.com/')
    && /^https:\/\/(?:medium\.com|infosecwriteups\.com)\//.test(item.source_url || '')
    && item.source_url !== item.canonical_url
  ));
});

test('AI cyberattack study keeps 1200km canonical and records the Medium snapshot source', () => {
  const mediumUrl = 'https://medium.com/@1200km/ai-in-cyberattacks-a-statistical-cti-study-of-114-publications-b8416d856b94';
  const item = catalog.items.find((entry) => entry.canonical_url === 'https://1200km.com/ai-attack-statistics/');
  assert.ok(item);
  assert.equal(item.source_url, mediumUrl);
  assert.equal(item.source_platform, '1200km');
  assert.equal(item.original_publication, 'https://1200km.com/ai-attack-statistics/');
  assert.equal(catalog.items.some((entry) => entry.canonical_url === mediumUrl), false);
});

test('taxonomy audit separates generated references from authored distribution', () => {
  assert.equal(taxonomyAudit.item_count, catalog.items.length);
  assert.equal(
    taxonomyAudit.distributions.by_primary_type['generated-reference'],
    catalog.items.filter((item) => item.primary_type === 'generated-reference').length,
  );
  assert.ok(taxonomyAudit.distributions.by_primary_type['generated-reference'] >= 697);
  assert.equal(
    taxonomyAudit.distributions.by_primary_type['reference-entity'],
    catalog.items.filter((item) => item.primary_type === 'reference-entity').length,
  );
  assert.ok(taxonomyAudit.distributions.by_primary_type['reference-entity'] >= 174);
  assert.equal(taxonomyAudit.authored_only.by_primary_type['generated-reference'], undefined);
  assert.ok(taxonomyAudit.warnings.some((warning) => warning.code === 'GENERATED_REFERENCE_DISTRIBUTION'));
  assert.ok(taxonomyAudit.warnings.every((warning) => warning.severity !== 'error'));
});
