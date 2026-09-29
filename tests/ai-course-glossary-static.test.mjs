import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../ai-security-course/glossary.html', import.meta.url), 'utf8');
const terms = JSON.parse(html.match(/const TERMS = (\[[\s\S]*?\]);\s*const /)?.[1] || '[]');
const snapshot = html.match(/<!-- glossary-static:start -->([\s\S]*?)<!-- glossary-static:end -->/)?.[1] || '';
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

test('all AI course glossary definitions are present in static HTML without JavaScript', () => {
  assert.equal(terms.length, 253);
  assert.equal((snapshot.match(/<article class="term">/g) || []).length, terms.length);
  for (const [term, category, definition] of terms) {
    assert.ok(snapshot.includes(`<h3>${escape(term)}</h3><p>${escape(definition)}</p><span class="cat">${escape(category)}</span>`), term);
  }
  assert.match(snapshot, /<div id="glossary" data-glossary-static>/);
  assert.ok(html.indexOf('<!-- glossary-static:start -->') < html.indexOf('const TERMS = '));
  assert.doesNotMatch(html, /This searchable glossary requires JavaScript/);
});
