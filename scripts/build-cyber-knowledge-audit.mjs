#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge.json'), 'utf8'));
const remoteCollections = JSON.parse(readFileSync(join(ROOT, 'seo', 'remote-sitemaps.json'), 'utf8'))
  .map((entry) => new URL(entry.url).pathname.replace(/sitemap\.xml$/, ''));
const outputJson = join(ROOT, 'reports', 'cyber-knowledge-inventory.json');
const outputMarkdown = join(ROOT, 'reports', 'cyber-knowledge-audit.md');
const pages = [
  { path: 'cyber-knowledge/index.html', type: 'collection page' },
  ...model.domains.map((domain) => ({ path: domain.path, type: 'field guide', domain })),
  { path: 'cyber-knowledge/glossary/index.html', type: 'glossary' },
  { path: 'cyber-knowledge/sources/index.html', type: 'source index' },
  { path: 'cyber-knowledge/editorial-policy/index.html', type: 'supporting page' },
];

function decode(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function text(value = '') {
  return decode(value.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function meta(html, attribute, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return decode(html.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escaped}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i'))?.[1] || '');
}

function link(html, relation) {
  const tag = html.match(new RegExp(`<link\\b(?=[^>]*\\brel=["']${relation}["'])[^>]*>`, 'i'))?.[0] || '';
  return decode(tag.match(/\bhref=["']([^"']+)["']/i)?.[1] || '');
}

function duplicateIds(html) {
  const seen = new Set();
  const duplicate = new Set();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    if (seen.has(match[1])) duplicate.add(match[1]);
    seen.add(match[1]);
  }
  return [...duplicate].sort();
}

function structuredTypes(html) {
  const types = new Set();
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = JSON.parse(match[1]);
    const entries = parsed['@graph'] || [parsed];
    for (const entry of entries) {
      for (const typeName of Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']]) {
        if (typeName) types.add(typeName);
      }
    }
  }
  return [...types].sort();
}

function localTarget(href, sourcePath) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  const [withQuery, fragment = ''] = href.split('#');
  const pathPart = withQuery.split('?')[0];
  let target = pathPart.replace(/^\//, '');
  if (!target) target = 'index.html';
  else if (target.endsWith('/')) target += 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(target)) target += '.html';
  return { path: target, fragment, sourcePath };
}

function deploymentManaged(href) {
  const path = new URL(href, 'https://1200km.com/').pathname;
  return path.startsWith('/articles/read/')
    || remoteCollections.some((prefix) => path.startsWith(prefix));
}

const inventory = [];
for (const page of pages) {
  const absolute = join(ROOT, page.path);
  const html = readFileSync(absolute, 'utf8');
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((match) => decode(match[1]));
  const internal = hrefs.filter((href) => href.startsWith('/') || href.startsWith('#'));
  const external = hrefs.filter((href) => /^https?:\/\//i.test(href));
  const broken = [];
  const missingAnchors = [];
  for (const href of internal) {
    if (href.startsWith('#')) {
      if (href.length > 1 && !new RegExp(`\\bid=["']${href.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
        missingAnchors.push(href);
      }
      continue;
    }
    const target = localTarget(href, page.path);
    if (!target) continue;
    if (deploymentManaged(href)) continue;
    const targetPath = join(ROOT, target.path);
    if (!existsSync(targetPath)) {
      broken.push(href);
      continue;
    }
    if (target.fragment) {
      const targetHtml = readFileSync(targetPath, 'utf8');
      const escaped = target.fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\bid=["']${escaped}["']`).test(targetHtml)) missingAnchors.push(href);
    }
  }
  const title = text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => text(match[1]));
  const body = text(html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html);
  inventory.push({
    url: page.path === 'cyber-knowledge/index.html'
      ? 'https://1200km.com/cyber-knowledge/'
      : `https://1200km.com/${page.path}`,
    file_path: page.path,
    page_type: page.type,
    title,
    h1: h1s[0] || '',
    h1_count: h1s.length,
    canonical_url: link(html, 'canonical'),
    meta_description: meta(html, 'name', 'description'),
    robots: meta(html, 'name', 'robots'),
    structured_data_types: structuredTypes(html),
    word_count: body ? body.split(/\s+/).length : 0,
    heading_count: [...html.matchAll(/<h[1-6]\b/gi)].length,
    internal_link_count: internal.length,
    external_link_count: external.length,
    broken_internal_links: [...new Set(broken)],
    missing_anchors: [...new Set(missingAnchors)],
    duplicate_ids: duplicateIds(html),
    last_reviewed: meta(html, 'property', 'article:modified_time'),
    version: page.domain?.guide_version || model.version,
    author: 'Andrey Pautov',
    source_count: external.length,
    indexability_status: /noindex/i.test(meta(html, 'name', 'robots')) ? 'not indexable' : 'indexable',
    content_duplication_risk: link(html, 'canonical') ? 'canonical declared' : 'canonical missing',
  });
}

const summary = {
  generated_at: model.collection.reviewed_at,
  scope: '1200km Cyber Knowledge hub, eleven maintained field guides, and three reference/governance pages',
  page_count: inventory.length,
  total_words: inventory.reduce((sum, page) => sum + page.word_count, 0),
  total_internal_links: inventory.reduce((sum, page) => sum + page.internal_link_count, 0),
  total_external_links: inventory.reduce((sum, page) => sum + page.external_link_count, 0),
  broken_internal_links: inventory.reduce((sum, page) => sum + page.broken_internal_links.length, 0),
  missing_anchors: inventory.reduce((sum, page) => sum + page.missing_anchors.length, 0),
  duplicate_ids: inventory.reduce((sum, page) => sum + page.duplicate_ids.length, 0),
};
const report = { summary, pages: inventory };
const json = `${JSON.stringify(report, null, 2)}\n`;
const markdown = `# Cyber Knowledge source audit

Reviewed: ${model.collection.reviewed_at}

This report is generated from deployable source HTML. External URLs are inventoried but are not represented as live-checked unless the separate external-link workflow is run.

## Summary

| Measure | Result |
|---|---:|
| Pages | ${summary.page_count} |
| Words | ${summary.total_words.toLocaleString('en-US')} |
| Internal links | ${summary.total_internal_links.toLocaleString('en-US')} |
| External links | ${summary.total_external_links.toLocaleString('en-US')} |
| Broken internal links | ${summary.broken_internal_links} |
| Missing anchors | ${summary.missing_anchors} |
| Duplicate IDs | ${summary.duplicate_ids} |

## Page inventory

| Page | Type | Words | Headings | Internal | External | Indexability |
|---|---|---:|---:|---:|---:|---|
${inventory.map((page) => `| [${page.h1}](${page.url}) | ${page.page_type} | ${page.word_count} | ${page.heading_count} | ${page.internal_link_count} | ${page.external_link_count} | ${page.indexability_status} |`).join('\n')}

## Validation interpretation

- Canonical, title, H1, robots, structured-data type, and link inventories are recorded in \`reports/cyber-knowledge-inventory.json\`.
- Internal file and fragment failures are release-blocking.
- External status, redirect, and timeout results are owned by the scheduled external-link report because network conditions are time-dependent.
- Indexability status means technically eligible; it does not claim that a search engine has indexed the URL.
`;

if (check) {
  const stale = [];
  if (!existsSync(outputJson) || readFileSync(outputJson, 'utf8') !== json) stale.push(outputJson);
  if (!existsSync(outputMarkdown) || readFileSync(outputMarkdown, 'utf8') !== markdown) stale.push(outputMarkdown);
  if (stale.length) throw new Error(`Cyber Knowledge audit output is stale:\n- ${stale.join('\n- ')}`);
} else {
  writeFileSync(outputJson, json);
  writeFileSync(outputMarkdown, markdown);
}
console.log(`${check ? 'Validated' : 'Wrote'} Cyber Knowledge audit for ${inventory.length} pages.`);
