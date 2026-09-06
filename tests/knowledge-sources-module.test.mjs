import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataset = JSON.parse(readFileSync(join(ROOT, 'data', 'knowledge-sources.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'cyber-knowledge', 'knowledge-sources', 'index.html'), 'utf8');
const client = readFileSync(join(ROOT, 'assets', 'knowledge-sources.js'), 'utf8');
const styles = readFileSync(join(ROOT, 'assets', 'knowledge-sources.css'), 'utf8');
const builder = readFileSync(join(ROOT, 'scripts', 'build-knowledge-sources-page.mjs'), 'utf8');
const shell = JSON.parse(readFileSync(join(ROOT, 'data', 'site-shell.json'), 'utf8'));
const catalogConfig = JSON.parse(readFileSync(join(ROOT, 'data', 'content-catalog.config.json'), 'utf8'));

function count(value, pattern) {
  return (value.match(pattern) || []).length;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cssHexVariable(block, name) {
  const match = block.match(new RegExp(`--${escapeRegex(name)}:\\s*(#[\\da-f]{6})`, 'i'));
  assert.ok(match, `missing CSS variable --${name}`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function sourceCard(id) {
  const start = html.indexOf(`<article class="ks-source-card" id="source-${id}"`);
  assert.notEqual(start, -1, `missing source card ${id}`);
  const end = html.indexOf('</article>', start);
  assert.notEqual(end, -1, `unterminated source card ${id}`);
  return html.slice(start, end + '</article>'.length);
}

test('module statically renders every source at its stable anchor', () => {
  assert.equal(count(html, /data-ks-source-card\b/g), dataset.sources.length);
  assert.equal(count(html, /<h1\b/g), 1);
  assert.equal(count(html, /<main\b/g), 1);
  assert.match(html, /<html lang="en" data-theme="light">/);
  assert.match(html, /<main id="main-content" data-pagefind-body>/);
  assert.match(html, /data-pagefind-filter="section\[content\]"/);
  assert.match(html, /data-pagefind-filter="content_type\[content\]"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/1200km\.com\/cyber-knowledge\/knowledge-sources\/"/);
  assert.match(html, new RegExp(`Search and compare ${dataset.sources.length} assessed cybersecurity knowledge sources`));
  assert.doesNotMatch(html, /<article class="ks-source-card"[^>]*\shidden(?:\s|=|>)/);

  for (const source of dataset.sources) {
    const idPattern = new RegExp(`id="source-${escapeRegex(source.id)}"`, 'g');
    assert.equal(count(html, idPattern), 1, `anchor count for ${source.id}`);
    const card = sourceCard(source.id);
    assert.ok(card.includes(escapeHtml(source.name)), `name missing for ${source.id}`);
    assert.ok(card.includes(escapeHtml(source.summary)), `summary missing for ${source.id}`);
    assert.ok(card.includes(escapeHtml(source.description)), `description missing for ${source.id}`);
    assert.ok(card.includes(`href="${escapeHtml(new URL(source.url).href)}"`), `external URL missing for ${source.id}`);
    assert.doesNotMatch(card.match(/^<article[^>]*>/)?.[0] || '', /\shidden(?:\s|=|>)/);
  }
});

test('module has unique ids and resolved local accessibility references', () => {
  const ids = new Map();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    ids.set(match[1], (ids.get(match[1]) || 0) + 1);
  }
  for (const [id, occurrences] of ids) assert.equal(occurrences, 1, `duplicate id: ${id}`);

  for (const match of html.matchAll(/\b(?:aria-labelledby|aria-describedby)="([^"]+)"/g)) {
    for (const reference of match[1].split(/\s+/).filter(Boolean)) {
      assert.ok(ids.has(reference), `unresolved accessibility reference: ${reference}`);
    }
  }
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `unresolved local fragment: ${match[1]}`);
  }
});

test('category, tag, and A-Z indexes cover the complete controlled taxonomy', () => {
  const categories = new Set(dataset.sources.map((source) => source.category));
  for (const category of categories) {
    assert.match(html, new RegExp(`id="category-${escapeRegex(category)}"`), category);
    assert.match(html, new RegExp(`href="#category-${escapeRegex(category)}"`), category);
  }

  for (const tag of dataset.controlled_tag_vocabulary) {
    assert.match(html, new RegExp(`id="tag-${escapeRegex(tag)}"`), tag);
    assert.match(html, new RegExp(`data-ks-tag-link="${escapeRegex(tag)}"`), tag);
  }

  const quickIndex = html.match(/<ol class="ks-quick-index">([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(quickIndex, 'missing A-Z index');
  assert.equal(count(quickIndex, /href="#source-/g), dataset.sources.length);
});

test('every related-source relationship resolves to an internal source anchor', () => {
  const ids = new Set(dataset.sources.map((source) => source.id));
  let expectedRelationships = 0;
  for (const source of dataset.sources) {
    const card = sourceCard(source.id);
    for (const relatedId of source.related_source_ids) {
      expectedRelationships += 1;
      assert.ok(ids.has(relatedId), `${source.id} relates to missing ${relatedId}`);
      assert.match(card, new RegExp(`href="#source-${escapeRegex(relatedId)}"`), `${source.id} → ${relatedId}`);
    }
  }
  assert.equal(count(html, /data-ks-related-link\b/g), expectedRelationships);
});

test('structured data describes the complete collection and stable local identities', () => {
  const source = html.match(/<script type="application\/ld\+json" id="knowledge-sources-structured-data">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'missing Knowledge Sources structured data');
  const graph = JSON.parse(source)['@graph'];
  assert.deepEqual(graph.map((entry) => entry['@type']), ['CollectionPage', 'BreadcrumbList', 'ItemList']);
  const collection = graph.find((entry) => entry['@type'] === 'ItemList');
  assert.equal(collection.numberOfItems, dataset.sources.length);
  assert.equal(collection.itemListElement.length, dataset.sources.length);
  const expected = new Set(dataset.sources.map((source) => `https://1200km.com/cyber-knowledge/knowledge-sources/#source-${source.id}`));
  assert.deepEqual(new Set(collection.itemListElement.map((entry) => entry.url)), expected);
  for (const item of collection.itemListElement) {
    assert.equal(item.item['@type'], 'CreativeWork');
    assert.match(item.item.sameAs, /^https?:\/\//);
  }
});

test('filters are shareable, accessible, progressive, and deep-link aware', () => {
  assert.match(html, /<form data-ks-filters role="search" aria-label="Filter knowledge sources">/);
  assert.match(html, /id="knowledge-source-status" role="status" aria-live="polite"/);
  assert.match(html, /<noscript><p class="ks-noscript">/);
  for (const id of [
    'knowledge-source-query',
    'knowledge-source-category',
    'knowledge-source-tag',
    'knowledge-source-access',
    'knowledge-source-level',
    'knowledge-source-tier',
    'knowledge-source-evidence',
    'knowledge-source-maintenance',
    'knowledge-source-kind',
  ]) assert.match(html, new RegExp(`id="${id}"`), id);

  for (const token of [
    'URLSearchParams',
    'window.history.replaceState',
    'readUrlState',
    'writeUrlState',
    'aria-live',
    'card.hidden',
    'section.hidden',
    'sourceTargetFromHash',
    'assessment.open = true',
    'hashchange',
    'popstate',
    'replaceChildren',
  ]) assert.match(`${html}\n${client}`, new RegExp(escapeRegex(token)), token);
});

test('client behavior never creates markup from dataset or query strings', () => {
  assert.doesNotMatch(client, /\.innerHTML\b/);
  assert.doesNotMatch(client, /\.outerHTML\b/);
  assert.doesNotMatch(client, /insertAdjacentHTML/);
  assert.doesNotMatch(client, /document\.write/);
  assert.doesNotMatch(client, /\beval\s*\(/);
  assert.doesNotMatch(client, /new\s+Function\b/);
  assert.match(client, /document\.createElement\('strong'\)/);
  assert.match(client, /document\.createTextNode/);
  assert.match(builder, /function escapeHtml\(value\)/);
  assert.match(builder, /function safeExternalUrl\(value, context\)/);
  assert.match(builder, /replace\(\/<\/g, '\\\\u003c'\)/);
});

test('module distinguishes the curated catalog from both citation inventories', () => {
  assert.match(html, /href="\/references\/">site-wide citation inventory<\/a>/);
  assert.match(html, /href="\/cyber-knowledge\/sources\/">Cyber Knowledge source index<\/a>/);
  assert.match(html, /This curated catalog assesses reusable knowledge providers\./);
});

test('module is registered and crosslinked across the maintained site indexes', () => {
  const path = 'cyber-knowledge/knowledge-sources/index.html';
  const canonical = 'https://1200km.com/cyber-knowledge/knowledge-sources/';
  assert.equal(shell.pages.filter((page) => page.path === path).length, 1);
  assert.equal(catalogConfig.core_urls.filter((url) => url === canonical).length, 1);
  assert.equal(catalogConfig.overrides[canonical]?.primary_type, 'index');
  assert.match(html, /rel="alternate" type="application\/json"[^>]+knowledge-sources\.json/);
  assert.match(html, /rel="alternate" type="text\/markdown"[^>]+knowledge-sources\.md/);

  for (const relative of [
    'index.html',
    'guides.html',
    'search.html',
    'cyber-knowledge/index.html',
    'cyber-knowledge/sources/index.html',
    'references/index.html',
    'agent-index.md',
    'llms.txt',
    'sitemap.xml',
  ]) {
    const document = readFileSync(join(ROOT, relative), 'utf8');
    assert.match(document, /cyber-knowledge\/knowledge-sources\//, `${relative} must crosslink the module`);
  }
});

test('visual layer preserves bright gray-red light mode and neutral dark mode', () => {
  assert.match(styles, /--ks-bg:\s*#f6f6f5/);
  assert.match(styles, /--ks-surface:\s*#ffffff/);
  assert.match(styles, /--ks-accent:\s*#8d1828/);
  const dark = styles.match(/html\[data-theme="dark"\] body\.knowledge-sources-page \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(dark, 'missing module dark theme');
  assert.match(dark, /--ks-bg:\s*#111214/);
  assert.match(dark, /--ks-surface:\s*#1a1b1e/);
  assert.match(dark, /--ks-accent:\s*#e2e2e4/);
  assert.doesNotMatch(dark, /#(?:8d1828|68111e|a72a3b|f3e7e9)/i);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('focus indicators remain solid and meet non-text contrast in both themes', () => {
  const light = styles.match(/body\.knowledge-sources-page \{([\s\S]*?)\n\}/)?.[1];
  const dark = styles.match(/html\[data-theme="dark"\] body\.knowledge-sources-page \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(light, 'missing module light theme');
  assert.ok(dark, 'missing module dark theme');

  for (const [theme, block] of [['light', light], ['dark', dark]]) {
    const focus = cssHexVariable(block, 'ks-focus');
    for (const surfaceName of ['ks-bg', 'ks-surface', 'ks-surface-soft']) {
      const surface = cssHexVariable(block, surfaceName);
      const ratio = contrastRatio(focus, surface);
      assert.ok(ratio >= 3, `${theme} focus against --${surfaceName} is ${ratio.toFixed(2)}:1`);
    }
  }

  const interactiveRule = styles.match(/\.knowledge-sources-page main a:focus-visible,[\s\S]*?\.knowledge-sources-page main summary:focus-visible \{([\s\S]*?)\n\}/)?.[1];
  const targetRule = [...styles.matchAll(/\.ks-source-card:target \{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((rule) => /\boutline:/.test(rule));
  assert.ok(interactiveRule, 'missing interactive focus-visible rule');
  assert.ok(targetRule, 'missing source-card target rule');
  assert.match(interactiveRule, /outline:\s*3px solid var\(--ks-focus\)/);
  assert.match(targetRule, /outline:\s*3px solid var\(--ks-focus\)/);
});
