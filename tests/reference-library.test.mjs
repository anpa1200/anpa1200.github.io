import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'reference-library.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'references', 'index.html'), 'utf8');
const client = readFileSync(join(ROOT, 'assets', 'reference-library.js'), 'utf8');

test('reference library contains the complete deduplicated usable corpus', () => {
  assert.equal(model.record_count, 108);
  assert.equal(model.core_count, 103);
  assert.equal(model.context_count, 5);
  assert.equal(model.records.length, 108);
  assert.equal(new Set(model.records.map((record) => record.id)).size, 108);
  assert.equal(new Set(model.records.map((record) => record.url.replace(/\/$/, ''))).size, 108);
  assert.equal(model.records.filter((record) => record.inclusion === 'core').length, 103);
  assert.equal(model.records.filter((record) => record.inclusion === 'context').length, 5);
});

test('every record is limited to title, description, correct resource metadata, and tags', () => {
  const allowed = ['description', 'id', 'inclusion', 'published_at', 'publisher', 'tags', 'title', 'url'];
  for (const record of model.records) {
    assert.deepEqual(Object.keys(record).sort(), allowed, record.id);
    assert.match(record.url, /^https:\/\//, record.id);
    assert.ok(record.title.trim().length, record.id);
    assert.ok(record.description.length >= 20 && record.description.length <= 300, record.id);
    assert.doesNotMatch(record.description, /[\r\n]/, record.id);
    assert.ok(record.tags.length >= 7, record.id);
    assert.equal(new Set(record.tags.map((tag) => tag.key)).size, record.tags.length, record.id);
  }
});

test('all normalized tag facets are retained for search and correlation', () => {
  const assignments = model.records.flatMap((record) => record.tags);
  const keys = new Set(assignments.map((tag) => tag.key));
  const types = new Set(assignments.map((tag) => tag.type));
  assert.equal(assignments.length, model.tag_assignment_count);
  assert.equal(keys.size, model.unique_tag_count);
  assert.equal(model.tag_assignment_count, 7574);
  assert.equal(model.unique_tag_count, 1520);
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

test('generated module exposes every reference and every tag without inline executable code', () => {
  assert.equal((html.match(/data-reference-card\b/g) || []).length, 108);
  assert.equal((html.match(/data-reference-tag(?:\s|>)/g) || []).length, 7574);
  assert.match(html, /<link rel="canonical" href="https:\/\/1200km\.com\/references\/"/);
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /reference-library\.css\?v=20260829-1/);
  assert.match(html, /reference-library\.js\?v=20260829-1/);
  assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")[^>]*>[^<]/);
  for (const record of model.records) {
    assert.equal((html.match(new RegExp(`data-reference-id="${record.id}"`, 'g')) || []).length, 1, record.id);
    assert.match(html, new RegExp(`href="${record.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), record.id);
  }
});

test('client supports query state, facets, tag pivots, co-occurrences, and related references', () => {
  for (const token of [
    'URLSearchParams', 'data-reference-facet', 'data-reference-tag-value',
    'data-reference-correlations', 'data-find-related', 'data-reference-related-list',
    'history.replaceState', 'shared.length', 'aria-pressed',
  ]) assert.match(client, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), token);
});
