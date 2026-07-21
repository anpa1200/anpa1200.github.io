import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { VOCABULARIES } from '../scripts/content-catalog-lib.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const catalog = JSON.parse(readFileSync(join(ROOT, 'data', 'content-catalog.json'), 'utf8'));

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
  }
});

test('mirrors identify a distinct source and archived records explain lifecycle', () => {
  for (const item of catalog.items.filter((entry) => entry.primary_type === 'mirror')) {
    assert.ok(item.source_url, item.id);
    assert.notEqual(item.source_url, item.canonical_url, item.id);
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
    assert.equal(catalog.items.find((item) => item.canonical_url === url)?.primary_domain, 'offensive-security');
  }
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
