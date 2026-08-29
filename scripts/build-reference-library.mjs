#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.slice(2).includes('--check');
const modelPath = join(ROOT, 'data', 'reference-library.json');
const outputPath = join(ROOT, 'references', 'index.html');
const model = JSON.parse(await readFile(modelPath, 'utf8'));
const base = await readFile(join(ROOT, 'cyber-knowledge', 'index.html'), 'utf8');
const canonical = 'https://1200km.com/references/';
const shell = loadSiteShell(ROOT);
const page = shell.pages.find((item) => item.path === 'references/index.html');
if (!page) throw new Error('references/index.html is missing from data/site-shell.json.');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function tagButton(tag) {
  return `<button class="reference-tag" type="button" data-reference-tag data-tag-key="${escapeHtml(tag.key)}" data-tag-type="${escapeHtml(tag.type)}" data-tag-facet="${escapeHtml(tag.facet)}" data-tag-value="${escapeHtml(tag.value)}" title="Filter by ${escapeHtml(tag.facet)}: ${escapeHtml(tag.value)}"><span>${escapeHtml(tag.facet)}</span>${escapeHtml(tag.value)}</button>`;
}

function referenceCard(record) {
  const visible = record.tags.slice(0, 12);
  const remaining = record.tags.slice(12);
  const tagKeys = record.tags.map((tag) => tag.key).join('|');
  const search = [record.title, record.description, record.publisher, ...record.tags.flatMap((tag) => [tag.facet, tag.value, tag.key])].join(' ').toLowerCase();
  return `          <article class="reference-card" data-reference-card data-reference-id="${escapeHtml(record.id)}" data-reference-title="${escapeHtml(record.title.toLowerCase())}" data-reference-publisher="${escapeHtml(record.publisher)}" data-reference-year="${escapeHtml(record.published_at?.slice(0, 4) || 'Unknown')}" data-reference-inclusion="${escapeHtml(record.inclusion)}" data-tag-keys="${escapeHtml(tagKeys)}" data-search="${escapeHtml(search)}">
            <div class="reference-card-heading">
              <span class="reference-context">${escapeHtml(record.inclusion === 'core' ? 'Core research' : 'Context')}</span>
              <button type="button" class="reference-related" data-find-related>Find related</button>
            </div>
            <h3><a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(record.title)}<span class="visually-hidden"> (opens the publisher resource in a new tab)</span><span aria-hidden="true"> ↗</span></a></h3>
            <p>${escapeHtml(record.description)}</p>
            <div class="reference-tags" aria-label="Reference tags">${visible.map(tagButton).join('')}</div>
${remaining.length ? `            <details class="reference-more-tags"><summary>Show ${remaining.length} more tags</summary><div class="reference-tags">${remaining.map(tagButton).join('')}</div></details>` : ''}
          </article>`;
}

const facets = [...new Set(model.records.flatMap((record) => record.tags.map((tag) => tag.facet)))].sort();
const publishers = [...new Set(model.records.map((record) => record.publisher))].sort();
const years = [...new Set(model.records.map((record) => record.published_at?.slice(0, 4) || 'Unknown'))]
  .sort((left, right) => right.localeCompare(left));
const cards = model.records.map(referenceCard).join('\n');

const body = `<section class="reference-intro" aria-labelledby="reference-library-title">
        <div>
          <p class="page-eyebrow">1200km research ecosystem · Source reference module</p>
          <h1 id="reference-library-title">AI Usage in Cyberattacks — References</h1>
          <p class="page-lead">${escapeHtml(model.description)} Search titles and descriptions, filter every normalized tag, pivot across facets, and find references connected by shared evidence metadata.</p>
        </div>
        <aside class="reference-boundary" aria-label="Evidence boundary"><strong>Evidence boundary</strong><p>${escapeHtml(model.evidence_boundary)}</p></aside>
      </section>
      <section class="reference-metrics" aria-label="Reference library summary">
        <article><strong>${model.record_count}</strong><span>unique references</span></article>
        <article><strong>${model.core_count}</strong><span>core research</span></article>
        <article><strong>${model.context_count}</strong><span>context references</span></article>
        <article><strong>${model.unique_tag_count.toLocaleString('en-US')}</strong><span>unique tags</span></article>
        <article><strong>${model.tag_assignment_count.toLocaleString('en-US')}</strong><span>tag assignments</span></article>
        <article><strong>${facets.length}</strong><span>search facets</span></article>
      </section>
      <section class="reference-workspace" aria-labelledby="reference-workspace-title">
        <h2 id="reference-workspace-title">Search and correlate references</h2>
        <div class="reference-controls" data-reference-controls>
          <label><span>Search everything</span><input type="search" data-reference-search placeholder="Title, description, actor, TTP, sector, provider, CVE…" autocomplete="off"></label>
          <label><span>Tag facet</span><select data-reference-facet><option value="">All facets</option>${facets.map((facet) => `<option value="${escapeHtml(facet)}">${escapeHtml(facet)}</option>`).join('')}</select></label>
          <label><span>Tag value</span><select data-reference-tag-value disabled><option value="">All tag values</option></select></label>
          <label><span>Publisher</span><select data-reference-publisher><option value="">All publishers</option>${publishers.map((publisher) => `<option value="${escapeHtml(publisher)}">${escapeHtml(publisher)}</option>`).join('')}</select></label>
          <label><span>Year</span><select data-reference-year><option value="">All years</option>${years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join('')}</select></label>
          <label><span>Sort</span><select data-reference-sort><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="title">Title A–Z</option><option value="publisher">Publisher A–Z</option><option value="tags">Most tagged</option></select></label>
          <button type="button" class="button" data-reference-reset>Reset filters</button>
        </div>
        <div class="reference-status" aria-live="polite"><strong data-reference-count>${model.record_count}</strong> references shown <span data-reference-active></span></div>
        <div class="reference-analysis-grid">
          <aside class="reference-correlation" aria-labelledby="reference-correlation-title">
            <h3 id="reference-correlation-title">Tag correlations</h3>
            <p>Top co-occurring tags among the current results. Select a tag to pivot the library.</p>
            <div class="reference-correlation-list" data-reference-correlations></div>
          </aside>
          <aside class="reference-correlation" aria-labelledby="reference-related-title">
            <h3 id="reference-related-title">Related references</h3>
            <p data-reference-related-help>Select <strong>Find related</strong> on a reference to rank other sources by shared normalized tags.</p>
            <ol class="reference-related-list" data-reference-related-list></ol>
          </aside>
        </div>
      </section>
      <section aria-labelledby="reference-results-title">
        <h2 id="reference-results-title">Reference index</h2>
        <p class="section-intro">Cards intentionally contain only a title, short description, canonical resource link, and discovery tags. Every tag remains visible and clickable; expand a card to inspect the complete tag set.</p>
        <div class="reference-grid" data-reference-grid>
${cards}
        </div>
        <p class="reference-empty" data-reference-empty hidden>No references match the current filters.</p>
      </section>`;

const itemList = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${canonical}#webpage`,
      name: model.title,
      description: model.description,
      url: canonical,
      inLanguage: 'en',
      dateModified: model.generated_at,
      author: { '@id': 'https://1200km.com/#person' },
      mainEntity: { '@id': `${canonical}#references` },
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#references`,
      name: model.title,
      numberOfItems: model.record_count,
      itemListElement: model.records.map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: record.title,
          description: record.description,
          url: record.url,
          publisher: { '@type': 'Organization', name: record.publisher },
          keywords: record.tags.map((tag) => `${tag.facet}: ${tag.value}`),
        },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
        { '@type': 'ListItem', position: 2, name: 'References', item: canonical },
      ],
    },
  ],
};

const title = 'AI Cyberattack Research References — Searchable CTI Index | 1200km';
const description = `Search ${model.record_count} deduplicated CTI, IR, government, provider, academic, and threat-research references about AI usage in cyberattacks across ${model.unique_tag_count.toLocaleString('en-US')} normalized tags.`;
const keywords = 'AI cyberattacks, CTI references, incident response reports, threat research, artificial intelligence, threat actors, MITRE ATT&CK, TTPs, LLM abuse, deepfakes, malware, phishing, vulnerability research';

let html = base
  .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="author" content="[^"]*"\s*\/?>/i, '<meta name="author" content="Andrey Pautov" />\n    <meta name="keywords" content="' + escapeHtml(keywords) + '" />')
  .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`)
  .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, '<meta property="og:image" content="https://1200km.com/assets/site-og-v2.png" />')
  .replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/i, '<meta property="og:image:alt" content="AI usage in cyberattacks reference library at 1200km" />')
  .replace(/<meta property="article:published_time" content="[^"]*"\s*\/?>/i, '<meta property="article:published_time" content="2026-08-29" />')
  .replace(/<meta property="article:modified_time" content="[^"]*"\s*\/?>/i, '<meta property="article:modified_time" content="2026-08-29" />')
  .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/i, '<meta name="twitter:image" content="https://1200km.com/assets/site-og-v2.png" />')
  .replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/i, '<meta name="twitter:image:alt" content="AI usage in cyberattacks reference library at 1200km" />')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
  .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
  .replace('<link rel="stylesheet" href="/assets/site-theme.css?v=20260721-shell" />', '<link rel="stylesheet" href="/assets/site-theme.css?v=20260721-shell" />\n    <link rel="stylesheet" href="/assets/reference-library.css?v=20260829-1" />')
  .replace(/<main\b[\s\S]*?<\/main>/i, `<main data-pagefind-body id="main-content">\n${body}\n    </main>`)
  .replace(/\s*<script src="\/assets\/cyber-knowledge\.js" defer><\/script>/i, '')
  .replace('</body>', '    <script src="/assets/reference-library.js?v=20260829-1" defer></script>\n  </body>')
  .replace('</head>', `    <script type="application/ld+json" id="reference-library-structured-data">\n${safeJson(itemList).split('\n').map((line) => `      ${line}`).join('\n')}\n    </script>\n  </head>`)
  .replace(/^[ \t]+$/gm, '');
html = applySiteShell(html, shell, page);

if (check) {
  if (!existsSync(outputPath) || await readFile(outputPath, 'utf8') !== html) {
    throw new Error('Reference module is stale. Run npm run build-references.');
  }
  console.log(`Reference module is current: ${model.record_count} records and ${model.tag_assignment_count} tag assignments.`);
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
  console.log(`Wrote ${model.record_count} references to ${outputPath}.`);
}
