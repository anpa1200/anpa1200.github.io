import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'reference-library.json'), 'utf8'));
const knowledgeSources = JSON.parse(readFileSync(join(ROOT, 'data', 'knowledge-sources.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'references', 'index.html'), 'utf8');
const client = readFileSync(join(ROOT, 'assets', 'directory-browser.js'), 'utf8');

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString().replace(/\/$/, '');
}

test('reference library contains the complete deduplicated site citation corpus', () => {
  assert.ok(model.record_count > 108);
  assert.equal(model.core_count, 103);
  assert.equal(model.context_count, 5);
  assert.equal(model.records.length, model.record_count);
  assert.equal(new Set(model.records.map((record) => record.id)).size, model.record_count);
  assert.equal(new Set(model.records.map((record) => record.url.replace(/\/$/, ''))).size, model.record_count);
  assert.equal(model.records.filter((record) => record.inclusion === 'core').length, 103);
  assert.equal(model.records.filter((record) => record.inclusion === 'context').length, 5);
  assert.equal(model.records.filter((record) => record.inclusion === 'site').length, model.site_count);
  assert.equal(model.records.reduce((sum, record) => sum + record.used_in.length, 0), model.usage_link_count);
  const reviewed = model.records.filter(r => r.metadata_status !== 'review-needed');
  const unresolved = model.records.filter(r => r.metadata_status === 'review-needed');
  if (reviewed.length && unresolved.length) assert.ok(model.records.indexOf(reviewed.at(-1)) < model.records.indexOf(unresolved[0]));
  assert.equal(model.bibliographic_count, model.records.filter(r => ['bibliographic', 'tool', 'dataset'].includes(r.kind)).length);
});

test('every record is limited to title, description, correct resource metadata, and tags', () => {
  const allowed = ['description', 'id', 'inclusion', 'kind', 'metadata_status', 'provenance', 'published_at', 'publisher', 'tags', 'title', 'url', 'used_in'];
  for (const record of model.records) {
    assert.deepEqual(Object.keys(record).sort(), allowed, record.id);
    assert.match(record.url, /^https:\/\//, record.id);
    assert.ok(record.title.trim().length, record.id);
    assert.ok(record.description.length >= 20 && record.description.length <= 300, record.id);
    assert.doesNotMatch(record.description, /[\r\n]/, record.id);
    assert.ok(record.tags.length >= 1, record.id);
    assert.equal(new Set(record.tags.map((tag) => tag.key)).size, record.tags.length, record.id);
  }
});

test('all normalized tag facets are retained for search and correlation', () => {
  const assignments = model.records.flatMap((record) => record.tags);
  const keys = new Set(assignments.map((tag) => tag.key));
  const types = new Set(assignments.map((tag) => tag.type));
  assert.equal(assignments.length, model.tag_assignment_count);
  assert.equal(keys.size, model.unique_tag_count);
  assert.ok(model.tag_assignment_count > 7574);
  assert.ok(model.unique_tag_count > 1520);
  for (const required of [
    'actor_motivation', 'ai_technology', 'ai_use_case', 'attack_vector', 'campaign',
    'country_or_region', 'cve', 'data_type', 'evidence_landscape', 'impact',
    'infrastructure', 'kill_chain_phase', 'llm_model', 'llm_provider',
    'malicious_ai_tool', 'malware_or_tool', 'mitre_attack_id', 'mitre_tactic',
    'sector', 'target', 'threat_group', 'threat_group_identifier', 'ttp',
    'content_quality', 'duplicate_group', 'evidence_inventory', 'ioc', 'metric',
    'publication_date_method', 'publication_date_precision', 'relevance_basis',
    'retrieval_method', 'review_requirement', 'source_lineage',
  ]) assert.ok(types.has(required), required);
});

const projection = JSON.parse(readFileSync(join(ROOT, 'data/reference-browser-index.json'), 'utf8'));
const allHtml = [...new Set(projection.records.map(r => r.page))].map(p => readFileSync(join(ROOT,p,'index.html'),'utf8')).join('\n');
test('static pagination preserves every reference and complete tag metadata', () => {
  assert.equal((allHtml.match(/data-reference-card\b/g) || []).length, model.record_count);
  assert.equal(projection.records.reduce((n,r)=>n+r.tags.length,0),model.tag_assignment_count);
  for(const record of model.records) assert.equal((allHtml.match(new RegExp(`data-reference-id="${record.id}"`,'g')) || []).length,1);
  assert.match(html,/directory-browser\.js/);
  assert.ok(Buffer.byteLength(html)<250000);
  assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")[^>]*>[^<]/);
});

test('references link every overlapping source to exactly one assessed knowledge profile', () => {
  const knowledgeByUrl = new Map(knowledgeSources.sources.map((source) => [normalizeUrl(source.url), source]));
  const expected = model.records
    .map((record) => knowledgeByUrl.get(normalizeUrl(record.url)))
    .filter(Boolean)
    .map((source) => source.id)
    .sort();
  const rendered = [...allHtml.matchAll(/<a\b[^>]*\bdata-knowledge-source-id="([^"]+)"[^>]*>/g)]
    .map((match) => match[1])
    .sort();

  assert.ok(expected.length > 0, 'reference and knowledge-source datasets must overlap');
  assert.deepEqual(rendered, expected);
  assert.equal(new Set(rendered).size, rendered.length, 'each assessed-profile backlink must be unique');
  for (const id of expected) {
    assert.match(
      allHtml,
      new RegExp(`href="/cyber-knowledge/knowledge-sources/#source-${id}"[^>]*>Read assessed profile`),
      id,
    );
  }
});

test('directory enhancement retains correlation and related-source controls', () => {
  for (const token of ['URLSearchParams','data-reference-correlations','data-find-related','data-reference-related-list','history.replaceState']) assert.ok(client.includes(token),token);
});
