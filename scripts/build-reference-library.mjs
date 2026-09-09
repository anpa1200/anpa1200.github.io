#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { inertReferenceKinds } from './reference-metadata-lib.mjs';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformHtmlElements } from './html-token-utils.mjs';
import { tagAttributes } from './release-html-lib.mjs';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function option(name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? resolve(args[index + 1]) : fallback; }
const SITE_ROOT = option('--site', ROOT);
const check = process.argv.slice(2).includes('--check');
const modelPath = join(SITE_ROOT, 'data', 'reference-library.json');
const knowledgeSourcesPath = join(SITE_ROOT, 'data', 'knowledge-sources.json');
const outputPath = join(SITE_ROOT, 'references', 'index.html');
const model = JSON.parse(await readFile(modelPath, 'utf8'));
const knowledgeSources = JSON.parse(await readFile(knowledgeSourcesPath, 'utf8'));
const base = await readFile(
  existsSync(outputPath) ? outputPath : join(SITE_ROOT, 'cyber-knowledge', 'index.html'),
  'utf8',
);
const baseCanonical = 'https://1200km.com/references/';
const shell = loadSiteShell(SITE_ROOT);
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

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

const knowledgeSourceByUrl = new Map();
for (const source of knowledgeSources.sources || []) {
  const url = normalizeUrl(source.url);
  if (!url) throw new Error(`Knowledge source ${source.id || '(unknown)'} has an invalid canonical URL.`);
  if (knowledgeSourceByUrl.has(url)) throw new Error(`Duplicate normalized knowledge-source URL: ${url}`);
  knowledgeSourceByUrl.set(url, source);
}

function tagButton(tag) {
  return `<button class="reference-tag" type="button" data-reference-tag data-tag-key="${escapeHtml(tag.key)}" data-tag-type="${escapeHtml(tag.type)}" data-tag-facet="${escapeHtml(tag.facet)}" data-tag-value="${escapeHtml(tag.value)}" title="Filter by ${escapeHtml(tag.facet)}: ${escapeHtml(tag.value)}"><span>${escapeHtml(tag.facet)}</span>${escapeHtml(tag.value)}</button>`;
}

function referenceCard(record) {
  const inert = inertReferenceKinds.has(record.kind);
  const visible = record.tags.slice(0, 12);
  const remaining = record.tags.slice(12);
  const tagKeys = record.tags.map((tag) => tag.key).join('|');
  const search = [record.title, record.description, record.publisher, ...record.tags.flatMap((tag) => [tag.facet, tag.value, tag.key])].join(' ').toLowerCase();
  const usedIn = record.used_in.slice(0, 8);
  const assessedSource = knowledgeSourceByUrl.get(normalizeUrl(record.url));
  return `          <article class="reference-card" id="reference-${escapeHtml(record.id)}" data-reference-card data-reference-id="${escapeHtml(record.id)}" data-reference-title="${escapeHtml(record.title.toLowerCase())}" data-reference-publisher="${escapeHtml(record.publisher)}" data-reference-year="${escapeHtml(record.published_at?.slice(0, 4) || 'Unknown')}" data-reference-inclusion="${escapeHtml(record.inclusion)}">
            <div class="reference-card-heading">
              <span class="reference-context">${escapeHtml(record.inclusion === 'core' ? 'Core research' : 'Context')}</span>
              <button type="button" class="reference-related" data-find-related>Find related</button>
            </div>
            <h3>${inert ? escapeHtml(record.title) : `<a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(record.title)}<span class="visually-hidden"> (opens the source resource in a new tab)</span><span aria-hidden="true"> ↗</span></a>`}</h3>
            <p class="reference-context">${escapeHtml(record.kind || 'bibliographic')} · ${escapeHtml(record.metadata_status || 'authored-metadata')}${inert ? ` · <code>${escapeHtml(record.url.replace(/^https/, 'hxxps').replaceAll('.', '[.]'))}</code>` : ''}</p>
            <p>${escapeHtml(record.description)}</p>${assessedSource ? `
            <p class="reference-assessed-source"><a data-knowledge-source-id="${escapeHtml(assessedSource.id)}" href="/cyber-knowledge/knowledge-sources/#source-${escapeHtml(assessedSource.id)}">Read assessed profile<span class="visually-hidden"> for ${escapeHtml(assessedSource.name)}</span> →</a></p>` : ''}
            <div class="reference-tags" aria-label="Reference tags">${visible.map(tagButton).join('')}</div>
${remaining.length ? `            <details class="reference-more-tags"><summary>Show ${remaining.length} more tags</summary><div class="reference-tags"><p><a href="/data/reference-library.json">Complete tag metadata in JSON export</a></p><button type="button" class="button" data-load-reference-tags>Show all tags here</button></div></details>` : ''}
${usedIn.length ? `            <details class="reference-used-in"><summary>Used in ${record.used_in.length} ${record.used_in.length === 1 ? 'page' : 'pages'}</summary><ul>${usedIn.map((source) => `<li><a href="${escapeHtml(new URL(source.url).pathname)}">${escapeHtml(source.title)}</a> <span>${escapeHtml(source.type)}</span></li>`).join('')}</ul>${record.used_in.length > usedIn.length ? `<p>Showing 8 of ${record.used_in.length} internal crosslinks.</p>` : ''}</details>` : ''}
          </article>`;
}

const facets = [...new Set(model.records.flatMap((record) => record.tags.map((tag) => tag.facet)))].sort();
const publishers = [...new Set(model.records.map((record) => record.publisher))].sort();
const years = [...new Set(model.records.map((record) => record.published_at?.slice(0, 4) || 'Unknown'))]
  .sort((left, right) => right.localeCompare(left));
const pageSize = 24;
const pageCount = Math.ceil(model.records.length / pageSize);
const pagesRoot = join(SITE_ROOT, 'references/page');
if (!check && existsSync(pagesRoot)) for (const name of await readdir(pagesRoot)) {
  const stale = join(pagesRoot, name, 'index.html');
  if (/^\d+$/.test(name) && Number(name) > pageCount && existsSync(stale) && (await readFile(stale,'utf8')).includes('data-reference-grid')) await unlink(stale);
}
for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
const canonical = baseCanonical + (pageNumber === 1 ? '' : `page/${pageNumber}/`);
const currentOutput = pageNumber === 1 ? outputPath : join(SITE_ROOT, 'references', 'page', String(pageNumber), 'index.html');
const pageRecords = model.records.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
const pagination = `<nav class="directory-pagination" aria-label="Reference pages">${Array.from({length: pageCount}, (_, i) => `<a href="/references/${i ? `page/${i + 1}/` : ''}" ${i + 1 === pageNumber ? 'aria-current="page"' : ''}>Page ${i + 1}</a>`).join(' ')}</nav>`;
const cards = pageRecords.map(referenceCard).join('\n');

const body = `<section class="reference-intro" aria-labelledby="reference-library-title">
        <div>
          <p class="page-eyebrow">Sources cited across 1200km · Directory updated 2026-09-09</p>
          <h1 id="reference-library-title">Articles and Guides — References</h1>
          <p class="page-lead">${escapeHtml(model.description)} Search direct titles, descriptions and tags (shared relationships are explored with Find related), filter every normalized tag, pivot across facets, and find references connected by shared evidence metadata.</p>
          <div class="page-hero-links"><a class="button primary" href="/articles/">Browse articles</a><a class="button" href="/guides.html">Browse guides</a><a class="button" href="/cyber-knowledge/knowledge-sources/">Curated Knowledge Sources</a><a class="button" href="/cyber-knowledge/sources/">Cyber Knowledge citations</a><a class="button" href="/ai-attack-statistics/">AI cyberattack study</a><a class="button" href="/ai-attack-statistics/dashboard/">AI study dashboard</a></div>
        </div>
        <aside class="reference-boundary" aria-label="Evidence boundary"><strong>Evidence boundary</strong><p>${escapeHtml(model.evidence_boundary)}</p></aside>
      </section>
      <section class="reference-metrics" aria-label="Reference library summary">
        <article><strong>${model.record_count}</strong><span>preserved records (all classifications)</span></article>
        <article><strong>${model.bibliographic_count ?? model.record_count}</strong><span>bibliographic, tool and dataset references</span></article>
        <article><strong>${model.core_count}</strong><span>core research</span></article>
        <article><strong>${model.context_count}</strong><span>context references</span></article>
        <article><strong>${model.site_count}</strong><span>site-wide citations</span></article>
        <article><strong>${model.usage_link_count.toLocaleString('en-US')}</strong><span>internal usage links</span></article>
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
          <label><span>Sort</span><select data-reference-sort><option value="title">Title A–Z</option><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="publisher">Publisher A–Z</option><option value="tags">Most tagged</option></select></label>
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
        <div class="reference-grid" data-reference-grid data-pagefind-ignore>
${cards}
        </div>
        ${pagination}
        <p><a href="/data/reference-library.json">Download complete JSON export</a></p>
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
      dateModified: '2026-09-09',
      author: { '@id': 'https://1200km.com/#person' },
      mainEntity: { '@id': `${canonical}#references` },
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#references`,
      name: model.title,
      numberOfItems: pageRecords.filter(r => !inertReferenceKinds.has(r.kind)).length,
      itemListElement: pageRecords.filter(record => !inertReferenceKinds.has(record.kind)).map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: record.title,
          description: record.description,
          url: record.url,
          publisher: { '@type': 'Organization', name: record.publisher },
          keywords: record.tags.slice(0, 12).map((tag) => `${tag.facet}: ${tag.value}`),
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

const title = `Article and Guide References${pageNumber > 1 ? ' — Page ' + pageNumber : ''} — Searchable Source Index | 1200km`;
const description = `${pageNumber > 1 ? `Page ${pageNumber} of ${pageCount}: ` : ''}Search ${model.record_count} deduplicated external sources cited across maintained 1200km articles, guides, research, case studies, documentation, and labs.`;
const keywords = 'AI cyberattacks, CTI references, incident response reports, threat research, artificial intelligence, threat actors, MITRE ATT&CK, TTPs, LLM abuse, deepfakes, malware, phishing, vulnerability research';
const removedScriptMarker = '__REFERENCE_BASE_SCRIPT_REMOVED__';

let html = transformHtmlElements(base, 'script', (element) => {
  const attributes = tagAttributes(element.openTag);
  const type = (attributes.type || '').toLowerCase();
  const source = attributes.src || '';
  return type === 'application/ld+json' || source === '/assets/cyber-knowledge.js' || source === '/assets/directory-browser.js' || source.startsWith('/assets/reference-library.js')
    ? removedScriptMarker
    : element.full;
})
  .replace(/\s*__REFERENCE_BASE_SCRIPT_REMOVED__/g, '')
  .replace(/\s*<link rel="stylesheet" href="\/assets\/reference-library\.css[^"]*"\s*\/?>/g, '')
  .replace(/\s*<meta name="keywords" content="[^"]*"\s*\/?>/g, '')
  .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="author" content="[^"]*"\s*\/?>/i, '<meta name="author" content="Andrey Pautov" />\n    <meta name="keywords" content="' + escapeHtml(keywords) + '" />')
  .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`)
  .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, '<meta property="og:image" content="https://1200km.com/assets/site-og-v2.png" />')
  .replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/i, '<meta property="og:image:alt" content="AI usage in cyberattacks reference library at 1200km" />')
  .replace(/<meta property="article:published_time" content="[^"]*"\s*\/?>/i, '<meta property="article:published_time" content="2026-08-29" />')
  .replace(/<meta property="article:modified_time" content="[^"]*"\s*\/?>/i, '<meta property="article:modified_time" content="2026-09-09" />')
  .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
  .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/i, '<meta name="twitter:image" content="https://1200km.com/assets/site-og-v2.png" />')
  .replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/i, '<meta name="twitter:image:alt" content="AI usage in cyberattacks reference library at 1200km" />')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
  .replace('<link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default" />', '<link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default" />\n    <link rel="stylesheet" href="/assets/reference-library.css?v=20260904-sitewide" />')
  .replace(/<main\b[\s\S]*?<\/main>/i, `<main data-pagefind-body id="main-content">\n${body}\n    </main>`)
  .replace('</body>', '    <script src="/assets/reference-library.js?v=20260904-sitewide" defer></script>\n  </body>')
  .replace('</head>', `    <script type="application/ld+json" id="reference-library-structured-data">\n${safeJson(itemList).split('\n').map((line) => `      ${line}`).join('\n')}\n    </script>\n  </head>`)
  .replace(/^[ \t]+$/gm, '');
html = applySiteShell(html, shell, page).replace('</body>', '<script src="/assets/directory-browser.js" data-directory="references" defer></script></body>');
html = html.replace(/<script src="\/assets\/reference-library.js[^"]*" defer><\/script>/, '');

html = html.replace(/[ \t]+$/gm, '');
if (check) {
  if (!existsSync(currentOutput) || await readFile(currentOutput, 'utf8') !== html) {
    throw new Error('Reference module is stale. Run npm run build-references.');
  }
  console.log(`Reference module is current: ${model.record_count} records and ${model.tag_assignment_count} tag assignments.`);
} else {
  await mkdir(dirname(currentOutput), { recursive: true });
  await writeFile(currentOutput, html);
  console.log(`Wrote ${model.record_count} references to ${outputPath}.`);
}

}
const projection = model.records.map((record, i) => ({
  id: 'reference-' + record.id, name: record.title, url: record.url, kind: record.kind, metadata_status: record.metadata_status,
  page: '/references/' + (i < 24 ? '' : `page/${Math.floor(i / 24) + 1}/`),
  description: record.description, inclusion: record.inclusion, used_in: record.used_in.slice(0,8),
  assessed_source_id: knowledgeSourceByUrl.get(normalizeUrl(record.url))?.id || '',
  publisher: record.publisher, year: record.published_at?.slice(0,4) || 'Unknown', tags: record.tags,
}));
const projectionPath = join(SITE_ROOT, 'data', 'reference-browser-index.json');
const tagDictionary = [...new Map(model.records.flatMap(r => r.tags).map(t => [t.key, t])).values()];
const tagIds = new Map(tagDictionary.map((t,i) => [t.key,i]));
const projectionJson = JSON.stringify({tags: tagDictionary, records: projection.map(r => ({...r, tags:r.tags.map(t=>tagIds.get(t.key))}))}) + '\n';
if (check) { if (await readFile(projectionPath, 'utf8') !== projectionJson) throw new Error('Reference browser index stale'); }
else await writeFile(projectionPath, projectionJson);
