import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anomalyTaxonomy, anomalyAssignments, anomalyTagsForUrl, withAnomalyTags, anomalySearchHref} from '../scripts/anomaly-tags-lib.mjs';
import {prepareHtmlForSearch} from '../scripts/search-index-lib.mjs';
const json = path => JSON.parse(readFileSync(new URL('../'+path, import.meta.url)));
test('all fifteen operational headings have unique, defined tags and evidence', () => {
  assert.equal(anomalyTaxonomy.tags.length, 15);
  const ids = anomalyTaxonomy.tags.map(tag => tag.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const tag of anomalyTaxonomy.tags) {
    assert.match(tag.id, /^anomaly-[a-z-]+$/);
    assert.ok(tag.definition && tag.exclude);
    assert.ok(anomalyAssignments.some(row => row.evidence.some(e => e.tag === tag.id)));
  }
  assert.deepEqual([...anomalyTagsForUrl(anomalyTaxonomy.article_url)].sort(), [...ids].sort());
});
test('every assignment has reviewed provenance; every scanned page has an honest disposition', () => {
  const inventory = json('reports/anomaly-review-20260921/corpus-inventory.json');
  const {reviews} = json('reports/anomaly-review-20260921/page-dispositions.json');
  assert.equal(reviews.length, inventory.total);
  assert.equal(new Set(reviews.map(row => row.url)).size, reviews.length);
  assert.equal(anomalyAssignments.length, 93);
  let mappings = 0;
  for (const row of anomalyAssignments) {
    assert.match(row.source_sha256, /^[a-f0-9]{64}$/);
    assert.ok(inventory.records.some(item => item.url === row.url && item.sha256 === row.source_sha256));
    assert.equal(new Set(row.evidence.map(e => e.tag)).size, row.evidence.length);
    for (const e of row.evidence) {
      assert.ok(e.excerpt.length > 25 && anomalyTaxonomy.tags.some(t => t.id === e.tag));
      mappings++;
    }
  }
  assert.equal(mappings, 202);
});
test('normalization preserves exact case, aliases and external canonical ownership', () => {
  const item = anomalyAssignments.find(row => row.url.includes('/CTI_as_a_Code/'));
  assert.ok(item);
  assert.deepEqual(anomalyTagsForUrl(item.url+'/'), anomalyTagsForUrl(item.url));
  assert.deepEqual(anomalyTagsForUrl(item.url+'/index.html'), anomalyTagsForUrl(item.url));
  assert.deepEqual(anomalyTagsForUrl(item.url.toLowerCase()), []);
  const external = {canonical_url:'https://trainsec.net/test/', alternate_urls:[anomalyTaxonomy.article_url], tags:['original','anomaly-stale']};
  const applied = withAnomalyTags(external);
  assert.equal(applied.canonical_url, external.canonical_url);
  assert.ok(applied.tags.includes('original') && !applied.tags.includes('anomaly-stale'));
  assert.equal(applied.tags.filter(tag=>tag.startsWith('anomaly-')).length, 15);
});
test('negative controls: learning rate, training cohorts, generic product diagrams stay untagged', () => {
  for (const path of ['/ai-security-course/module-00/chapter-03.html','/adversarygraph-docs/architecture','/adversarygraph-docs/tips']) assert.deepEqual(anomalyTagsForUrl(path), []);
  const candidates = json('reports/anomaly-review-20260921/tag-candidates.json').candidates;
  assert.deepEqual(anomalyTagsForUrl(candidates[16].url), []);
  assert.deepEqual(anomalyTagsForUrl('https://unrelated.example'+new URL(anomalyTaxonomy.article_url).pathname), []);
});
test('public registry, search facet and definition links use the same reviewed IDs', () => {
  const registry = json('data/anomaly-tags.json');
  assert.equal(Object.keys(registry.pages).length, anomalyAssignments.length);
  const html = prepareHtmlForSearch(anomalyTaxonomy.article_url, '<html lang="en"><head><title>Research</title></head><body><main><h1>Research</h1><p>Anomaly research</p></main></body></html>');
  assert.equal([...html.matchAll(/data-pagefind-filter="anomaly\[content\]"/g)].length, 15);
  for (const tag of anomalyTaxonomy.tags) assert.ok(html.includes(`content="${tag.id}"`));
  assert.equal(anomalySearchHref('anomaly-temporal'), '/search.html?f.anomaly=anomaly-temporal');
  assert.throws(()=>anomalySearchHref('invalid'));
});
