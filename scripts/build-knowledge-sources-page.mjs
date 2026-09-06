#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteShell, renderFooter, renderHeader } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = join(ROOT, 'data', 'knowledge-sources.json');
const OUTPUT_PATH = join(ROOT, 'cyber-knowledge', 'knowledge-sources', 'index.html');
const CHECK = process.argv.includes('--check');
const CANONICAL = 'https://1200km.com/cyber-knowledge/knowledge-sources/';
const PAGE_PATH = 'cyber-knowledge/knowledge-sources/index.html';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const ACRONYMS = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['csirt', 'CSIRT'],
  ['cti', 'CTI'],
  ['dfir', 'DFIR'],
  ['llm', 'LLM'],
  ['mitre', 'MITRE'],
  ['soc', 'SOC'],
]);

function label(value) {
  return String(value)
    .split('-')
    .map((word) => ACRONYMS.get(word) || `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function plural(count, one, many = `${one}s`) {
  return count === 1 ? one : many;
}

function assertToken(value, context) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${context} must be a lowercase kebab-case token: ${value}`);
  }
}

function safeExternalUrl(value, context) {
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`${context} must use HTTP or HTTPS: ${value}`);
  }
  return parsed.href;
}

function validateDataset(dataset) {
  if (!Array.isArray(dataset.sources) || !dataset.sources.length) {
    throw new Error('data/knowledge-sources.json does not contain any sources');
  }
  if (!Array.isArray(dataset.controlled_tag_vocabulary) || !dataset.controlled_tag_vocabulary.length) {
    throw new Error('Knowledge Sources requires a controlled tag vocabulary');
  }

  const ids = new Set();
  const controlledTags = new Set(dataset.controlled_tag_vocabulary);
  for (const tag of controlledTags) assertToken(tag, 'Controlled tag');

  for (const source of dataset.sources) {
    assertToken(source.id, 'Source id');
    if (ids.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
    ids.add(source.id);
    safeExternalUrl(source.url, `Source ${source.id}`);

    for (const field of ['name', 'category', 'organization', 'summary', 'description']) {
      if (!source[field]) throw new Error(`Source ${source.id} is missing ${field}`);
    }
    for (const tag of source.tags || []) {
      if (!controlledTags.has(tag)) throw new Error(`Source ${source.id} uses uncontrolled tag ${tag}`);
    }
    for (const relatedId of source.related_source_ids || []) {
      assertToken(relatedId, `Related source id for ${source.id}`);
    }
  }

  for (const source of dataset.sources) {
    for (const relatedId of source.related_source_ids || []) {
      if (!ids.has(relatedId)) throw new Error(`Source ${source.id} relates to missing source ${relatedId}`);
    }
  }
}

function countValues(sources, readValues) {
  const counts = new Map();
  for (const source of sources) {
    for (const value of readValues(source)) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

function option(value, count) {
  return `              <option value="${escapeHtml(value)}">${escapeHtml(label(value))} (${count})</option>`;
}

function renderList(items, className = '') {
  return `<ul${className ? ` class="${className}"` : ''}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderQuality(source) {
  const dimensions = source.quality.dimensions;
  return Object.entries(dimensions).map(([name, score]) => {
    const numericScore = Number(score);
    const percent = Math.max(0, Math.min(100, numericScore / 5 * 100));
    return `                    <li>
                      <span>${escapeHtml(label(name))}</span>
                      <span class="ks-score-track" aria-hidden="true"><span style="width:${percent}%"></span></span>
                      <strong>${escapeHtml(numericScore.toFixed(numericScore % 1 === 0 ? 0 : 1))}/5</strong>
                    </li>`;
  }).join('\n');
}

function renderTags(source) {
  return source.tags.map((tag) => `              <li><a href="?tag=${encodeURIComponent(tag)}#source-results" data-ks-tag-link="${escapeHtml(tag)}">${escapeHtml(label(tag))}</a></li>`).join('\n');
}

function renderRelatedSources(source, sourceById) {
  return source.related_source_ids.map((relatedId) => {
    const related = sourceById.get(relatedId);
    return `                      <li><a href="#source-${escapeHtml(relatedId)}" data-ks-related-link>${escapeHtml(related.name)}</a></li>`;
  }).join('\n');
}

function renderSourceCard(source, sourceById) {
  const validationLabel = source.validation.status === 'reachable'
    ? 'Reachable'
    : source.validation.status === 'access-restricted'
      ? 'Automated access restricted'
      : label(source.validation.status);
  const externalUrl = safeExternalUrl(source.url, `Source ${source.id}`);
  const tags = source.tags.join(' ');
  const skills = source.skill_levels.join(' ');
  const keywords = source.keywords || [];
  const formats = source.content_formats || [];
  const audiences = source.audience || [];
  const bestFor = source.assessment.best_for || [];
  const related = source.related_source_ids || [];

  return `          <article class="ks-source-card" id="source-${escapeHtml(source.id)}" data-ks-source-card data-category="${escapeHtml(source.category)}" data-tags="${escapeHtml(tags)}" data-access="${escapeHtml(source.access)}" data-skills="${escapeHtml(skills)}" data-tier="${escapeHtml(source.quality.tier)}" data-evidence="${escapeHtml(source.assessment.evidence_use)}" data-maintenance="${escapeHtml(source.assessment.maintenance)}" data-source-kind="${escapeHtml(source.source_kind)}" data-index-terms="${escapeHtml([...keywords, ...formats, ...audiences, ...bestFor].join(' '))}">
            <header class="ks-card-header">
              <div>
                <p class="ks-card-kicker"><span>${escapeHtml(label(source.category))}</span><span>${escapeHtml(source.quality.score)}/100 · Tier ${escapeHtml(source.quality.tier)}</span></p>
                <h3 data-pagefind-weight="8"><a class="ks-heading-anchor" href="#source-${escapeHtml(source.id)}">${escapeHtml(source.name)}</a></h3>
                <p class="ks-organization">${escapeHtml(source.organization)}</p>
              </div>
              <a class="ks-external-link" href="${escapeHtml(externalUrl)}" rel="noopener noreferrer">Visit source <span class="visually-hidden">: ${escapeHtml(source.name)}</span><span aria-hidden="true"> ↗</span></a>
            </header>
            <p class="ks-summary">${escapeHtml(source.summary)}</p>
            <ul class="ks-card-tags" aria-label="Tags for ${escapeHtml(source.name)}">
${renderTags(source)}
            </ul>
            <dl class="ks-card-meta">
              <div><dt>Source type</dt><dd>${escapeHtml(label(source.source_kind))}</dd></div>
              <div><dt>Access</dt><dd>${escapeHtml(label(source.access))}</dd></div>
              <div><dt>Evidence use</dt><dd>${escapeHtml(label(source.assessment.evidence_use))}</dd></div>
              <div><dt>Maintenance</dt><dd>${escapeHtml(label(source.assessment.maintenance))}</dd></div>
              <div><dt>Skill level</dt><dd>${escapeHtml(source.skill_levels.map(label).join(', '))}</dd></div>
            </dl>
            <details class="ks-assessment">
              <summary>Detailed assessment</summary>
              <div class="ks-assessment-body">
                <section aria-labelledby="source-${escapeHtml(source.id)}-description">
                  <h4 id="source-${escapeHtml(source.id)}-description">Description</h4>
                  <p>${escapeHtml(source.description)}</p>
                </section>
${source.caution ? `                <aside class="ks-caution" aria-label="Safety or interpretation caution"><strong>Caution</strong><p>${escapeHtml(source.caution)}</p></aside>\n` : ''}                <div class="ks-assessment-grid">
                  <section>
                    <h4>Strengths</h4>
                    ${renderList(source.assessment.strengths)}
                  </section>
                  <section>
                    <h4>Limitations</h4>
                    ${renderList(source.assessment.limitations)}
                  </section>
                  <section>
                    <h4>Best for</h4>
                    ${renderList(bestFor)}
                  </section>
                  <section>
                    <h4>Quality dimensions</h4>
                    <ul class="ks-quality-list">
${renderQuality(source)}
                    </ul>
                    <p class="ks-rationale">${escapeHtml(source.quality.rationale)}</p>
                  </section>
                </div>
                <div class="ks-context-grid">
                  <section><h4>Audience</h4>${renderList(audiences, 'ks-inline-list')}</section>
                  <section><h4>Formats</h4>${renderList(formats, 'ks-inline-list')}</section>
                  <section><h4>Keywords</h4>${renderList(keywords, 'ks-inline-list')}</section>
                </div>
${related.length ? `                <section class="ks-related" aria-labelledby="source-${escapeHtml(source.id)}-related">
                  <h4 id="source-${escapeHtml(source.id)}-related">Related sources</h4>
                  <ul>
${renderRelatedSources(source, sourceById)}
                  </ul>
                </section>\n` : ''}                <p class="ks-validation"><strong>Link validation:</strong> ${escapeHtml(validationLabel)} · checked ${escapeHtml(source.validation.checked_on)}${source.validation.http_status ? ` · HTTP ${escapeHtml(source.validation.http_status)}` : ''}</p>
              </div>
            </details>
          </article>`;
}

function renderIndexLink(source) {
  return `              <li><a href="#source-${escapeHtml(source.id)}">${escapeHtml(source.name)}</a><span>${escapeHtml(label(source.category))}</span></li>`;
}

function renderPage(dataset) {
  validateDataset(dataset);
  const shell = loadSiteShell(ROOT);
  const page = shell.pages.find((candidate) => candidate.path === PAGE_PATH);
  if (!page) throw new Error(`Knowledge Sources module is not registered in data/site-shell.json: ${PAGE_PATH}`);
  const sources = dataset.sources.slice();
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const categories = countValues(sources, (source) => [source.category]);
  const tags = countValues(sources, (source) => source.tags);
  const access = countValues(sources, (source) => [source.access]);
  const skills = countValues(sources, (source) => source.skill_levels);
  const tiers = countValues(sources, (source) => [source.quality.tier]);
  const evidenceUse = countValues(sources, (source) => [source.assessment.evidence_use]);
  const maintenance = countValues(sources, (source) => [source.assessment.maintenance]);
  const sourceKinds = countValues(sources, (source) => [source.source_kind]);
  const sortedCategories = [...categories.keys()].sort();
  const sortedTags = [...dataset.controlled_tag_vocabulary].sort();
  const alphabeticSources = sources.slice().sort((left, right) => left.name.localeCompare(right.name));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${CANONICAL}#webpage`,
        name: 'Cybersecurity Knowledge Sources',
        description: 'A searchable, assessed directory of authoritative cybersecurity knowledge sources, tools, frameworks, training, research, and operational references.',
        url: CANONICAL,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://1200km.com/#website' },
        breadcrumb: { '@id': `${CANONICAL}#breadcrumb` },
        mainEntity: { '@id': `${CANONICAL}#collection` },
        dateModified: dataset.generated_on,
        author: { '@id': 'https://1200km.com/#person' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${CANONICAL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
          { '@type': 'ListItem', position: 2, name: 'Cyber Knowledge', item: 'https://1200km.com/cyber-knowledge/' },
          { '@type': 'ListItem', position: 3, name: 'Knowledge Sources', item: CANONICAL },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${CANONICAL}#collection`,
        name: 'Cybersecurity Knowledge Sources',
        numberOfItems: sources.length,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        itemListElement: alphabeticSources.map((source, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${CANONICAL}#source-${source.id}`,
          item: {
            '@type': 'CreativeWork',
            name: source.name,
            url: `${CANONICAL}#source-${source.id}`,
            sameAs: safeExternalUrl(source.url, `Source ${source.id}`),
            abstract: source.summary,
            about: source.tags.map(label),
          },
        })),
      },
    ],
  };

  const categorySections = sortedCategories.map((category) => {
    const categorySources = sources
      .filter((source) => source.category === category)
      .sort((left, right) => right.quality.score - left.quality.score || left.name.localeCompare(right.name));
    return `        <section class="ks-category-section" id="category-${escapeHtml(category)}" data-ks-category-section data-category="${escapeHtml(category)}" aria-labelledby="category-${escapeHtml(category)}-title">
          <header class="ks-category-header">
            <div><p>Category</p><h2 id="category-${escapeHtml(category)}-title">${escapeHtml(label(category))}</h2></div>
            <span data-ks-category-count>${categorySources.length} ${plural(categorySources.length, 'source')}</span>
          </header>
          <div class="ks-source-grid">
${categorySources.map((source) => renderSourceCard(source, sourceById)).join('\n')}
          </div>
        </section>`;
  }).join('\n');

  const categoryIndex = sortedCategories.map((category) => `            <li><a href="#category-${escapeHtml(category)}"><span>${escapeHtml(label(category))}</span><strong>${categories.get(category)}</strong></a></li>`).join('\n');
  const tagIndex = sortedTags.map((tag) => `            <li id="tag-${escapeHtml(tag)}"><a href="?tag=${encodeURIComponent(tag)}#source-results" data-ks-tag-link="${escapeHtml(tag)}"><span>${escapeHtml(label(tag))}</span><strong>${tags.get(tag) || 0}</strong></a></li>`).join('\n');
  const quickIndex = alphabeticSources.map(renderIndexLink).join('\n');

  return `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://cdn-images-1.medium.com https://1200km.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <script src="/assets/theme-bootstrap.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cybersecurity Knowledge Sources — Assessed Directory | 1200km</title>
    <meta name="description" content="Search and compare ${sources.length} assessed cybersecurity knowledge sources across government guidance, frameworks, threat research, DFIR, cloud, application security, training, and more." />
    <meta name="author" content="Andrey Pautov" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="theme-color" content="#f5f5f4" />
    <meta content="Cyber Knowledge" data-pagefind-filter="section[content]" data-pagefind-meta="collection[content]" />
    <meta content="Knowledge Sources" data-pagefind-filter="content_type[content]" data-pagefind-meta="content_type[content]" />
    <meta property="og:title" content="Cybersecurity Knowledge Sources — Assessed Directory | 1200km" />
    <meta property="og:description" content="A searchable, assessed directory of cybersecurity frameworks, government guidance, tools, research, training, and operational references." />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content="${CANONICAL}" />
    <meta property="og:site_name" content="1200km — Andrey Pautov Security Research" />
    <meta property="og:image" content="https://1200km.com/assets/cyber-knowledge-og/hub.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Cyber Knowledge — eleven practitioner domains at 1200km" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Cybersecurity Knowledge Sources — Assessed Directory | 1200km" />
    <meta name="twitter:description" content="Search and compare ${sources.length} assessed cybersecurity knowledge sources with quality, access, audience, and evidence-use context." />
    <meta name="twitter:image" content="https://1200km.com/assets/cyber-knowledge-og/hub.png" />
    <meta name="twitter:image:alt" content="Cyber Knowledge — eleven practitioner domains at 1200km" />
    <link rel="canonical" href="${CANONICAL}" />
    <link rel="alternate" type="application/json" title="Knowledge Sources dataset" href="/data/knowledge-sources.json" />
    <link rel="alternate" type="text/markdown" title="Knowledge Sources Markdown edition" href="/data/knowledge-sources.md" />
    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />
    <link rel="icon" href="/assets/ap-logo.png" type="image/png" />
    <link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default" />
    <link rel="stylesheet" href="/assets/knowledge-sources.css?v=20260906-1" />
    <script src="/assets/site-theme.js?v=20260904-light-default" defer></script>
    <script src="/assets/knowledge-sources.js?v=20260906-1" defer></script>
    <script src="/assets/site-performance.js" data-google-analytics-id="G-TMTG21RVHM" defer></script>
    <script type="application/ld+json" id="knowledge-sources-structured-data">
${escapeJsonForHtml(structuredData).split('\n').map((line) => `      ${line}`).join('\n')}
    </script>
  </head>
  <body class="knowledge-sources-page" id="top">
    ${renderHeader(shell, page)}

    <main id="main-content" data-pagefind-body>
      <header class="ks-hero">
        <div class="ks-shell ks-hero-grid">
          <div>
            <p class="ks-eyebrow"><a href="/cyber-knowledge/">Cyber Knowledge</a> · Curated source ecosystem</p>
            <h1 data-pagefind-meta="title">Cybersecurity Knowledge Sources</h1>
            <p class="ks-lead">A practical directory of authoritative guidance, original research, frameworks, tools, datasets, and hands-on learning. Every source includes an independent scope assessment, evidence-use guidance, limitations, tags, and related reading.</p>
            <div class="ks-hero-actions">
              <a class="ks-button ks-button-primary" href="#source-results">Explore the directory</a>
              <a class="ks-button" href="/data/knowledge-sources.json">Download JSON</a>
              <a class="ks-button" href="/data/knowledge-sources.md">Read the Markdown edition</a>
            </div>
          </div>
          <dl class="ks-stats" aria-label="Directory statistics">
            <div><dt>${sources.length}</dt><dd>assessed sources</dd></div>
            <div><dt>${categories.size}</dt><dd>categories</dd></div>
            <div><dt>${tags.size}</dt><dd>controlled tags</dd></div>
            <div><dt>${sources.reduce((total, source) => total + source.related_source_ids.length, 0)}</dt><dd>source crosslinks</dd></div>
          </dl>
        </div>
      </header>

      <div class="ks-shell ks-page-layout">
        <aside class="ks-side-index" aria-label="On this page">
          <p>On this page</p>
          <nav>
            <a href="#find-sources">Find sources</a>
            <a href="#category-index">Category index</a>
            <a href="#tag-index">Tag index</a>
            <a href="#quick-source-index">Source index</a>
            <a href="#source-results">Detailed assessments</a>
            <a href="#methodology">Methodology</a>
          </nav>
          <div class="ks-side-links">
            <a href="/references/">Site-wide citation inventory</a>
            <a href="/cyber-knowledge/sources/">Sources cited by the guides</a>
            <a href="/cyber-knowledge/editorial-policy/">Editorial and source policy</a>
            <a href="/search.html?q=cybersecurity%20knowledge%20sources">Search the full site</a>
          </div>
        </aside>

        <div class="ks-content">
          <section class="ks-intro" aria-labelledby="how-to-use-title">
            <p class="ks-section-label">Purpose</p>
            <h2 id="how-to-use-title">Choose sources for the claim or task</h2>
            <p>Quality scores describe usefulness within a source’s stated scope; they do not make every page equally authoritative. Prefer primary standards, first-party documentation, original research, or operational evidence for the claim at hand. Use practitioner and vendor material for implementation detail, then corroborate attribution, prevalence, performance, and risk conclusions when the decision requires it.</p>
          </section>

          <section class="ks-filter-panel" id="find-sources" aria-labelledby="find-sources-title">
            <div class="ks-section-heading">
              <div><p class="ks-section-label">Local directory search</p><h2 id="find-sources-title">Find a knowledge source</h2></div>
              <p>Search names, organizations, descriptions, audiences, use cases, tags, formats, and keywords.</p>
            </div>
            <form data-ks-filters role="search" aria-label="Filter knowledge sources">
              <div class="ks-filter-primary">
                <label class="ks-search-field" for="knowledge-source-query"><span>Search the directory</span><input id="knowledge-source-query" name="q" type="search" maxlength="200" autocomplete="off" spellcheck="false" placeholder="Example: incident response, YARA, Kubernetes…" /></label>
                <label for="knowledge-source-category"><span>Category</span><select id="knowledge-source-category" name="category"><option value="">All categories (${sources.length})</option>
${[...categories.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([value, count]) => option(value, count)).join('\n')}
                </select></label>
                <label for="knowledge-source-tag"><span>Tag</span><select id="knowledge-source-tag" name="tag"><option value="">All tags (${sources.length})</option>
${sortedTags.map((value) => option(value, tags.get(value) || 0)).join('\n')}
                </select></label>
              </div>
              <details class="ks-advanced-filters">
                <summary>More filters</summary>
                <div class="ks-filter-secondary">
                  <label for="knowledge-source-access"><span>Access</span><select id="knowledge-source-access" name="access"><option value="">Any access model</option>${[...access.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                  <label for="knowledge-source-level"><span>Skill level</span><select id="knowledge-source-level" name="level"><option value="">Any skill level</option>${[...skills.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                  <label for="knowledge-source-tier"><span>Quality tier</span><select id="knowledge-source-tier" name="tier"><option value="">Any quality tier</option>${[...tiers.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                  <label for="knowledge-source-evidence"><span>Evidence use</span><select id="knowledge-source-evidence" name="evidence"><option value="">Any evidence use</option>${[...evidenceUse.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                  <label for="knowledge-source-maintenance"><span>Maintenance</span><select id="knowledge-source-maintenance" name="maintenance"><option value="">Any maintenance model</option>${[...maintenance.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                  <label for="knowledge-source-kind"><span>Source type</span><select id="knowledge-source-kind" name="kind"><option value="">Any source type</option>${[...sourceKinds.entries()].sort().map(([value, count]) => option(value, count)).join('')}</select></label>
                </div>
              </details>
              <div class="ks-filter-footer">
                <p id="knowledge-source-status" role="status" aria-live="polite"><strong>${sources.length}</strong> sources shown</p>
                <button class="ks-button" type="reset">Clear filters</button>
              </div>
            </form>
            <noscript><p class="ks-noscript">Filtering needs JavaScript. All source assessments remain available below and can be reached from the indexes.</p></noscript>
          </section>

          <section class="ks-index-section" id="category-index" aria-labelledby="category-index-title">
            <div class="ks-section-heading"><div><p class="ks-section-label">Browse by domain</p><h2 id="category-index-title">Category index</h2></div><p>${categories.size} categories organize sources by their primary use.</p></div>
            <ul class="ks-category-index">
${categoryIndex}
            </ul>
          </section>

          <details class="ks-index-section ks-collapsible-index" id="tag-index">
            <summary><span><span class="ks-section-label">Controlled vocabulary</span><strong>Tag index</strong></span><span>${tags.size} tags</span></summary>
            <p>Choose a tag to filter the directory. Each source uses only terms from this controlled vocabulary.</p>
            <ul class="ks-tag-index">
${tagIndex}
            </ul>
          </details>

          <details class="ks-index-section ks-collapsible-index" id="quick-source-index">
            <summary><span><span class="ks-section-label">A–Z</span><strong>Quick source index</strong></span><span>${sources.length} sources</span></summary>
            <p>Every entry links to a stable assessment anchor that can be shared directly.</p>
            <ol class="ks-quick-index">
${quickIndex}
            </ol>
          </details>

          <section class="ks-results" id="source-results" aria-labelledby="source-results-title">
            <div class="ks-section-heading ks-results-heading"><div><p class="ks-section-label">Source assessments</p><h2 id="source-results-title">Detailed directory</h2></div><p>Open an assessment for detailed use guidance, quality dimensions, limitations, audiences, formats, keywords, and related sources.</p></div>
            <div class="ks-active-filter" data-ks-active-filter hidden><span>Active filter</span><strong data-ks-active-filter-label></strong></div>
            <p class="ks-empty-state" data-ks-empty hidden><strong>No sources match these filters.</strong><span>Try fewer terms, another category, or clear the filters.</span></p>
${categorySections}
          </section>

          <section class="ks-methodology" id="methodology" aria-labelledby="methodology-title">
            <p class="ks-section-label">Assessment boundary</p>
            <h2 id="methodology-title">How to interpret this directory</h2>
            <div class="ks-method-grid">
              <article><h3>Five quality dimensions</h3><p>Authority, originality, maintenance, practical value, and transparency are each scored from 1 to 5. The 100-point score and A–C tier summarize those dimensions; the source-specific rationale and limitations explain what the number cannot.</p></article>
              <article><h3>Evidence before reputation</h3><p>A well-known source can still be secondary evidence for a particular claim. “Primary authoritative,” “primary operational,” “mixed,” and related labels describe how a source can support analysis—not a guarantee that every publication is correct.</p></article>
              <article><h3>Links are not endorsements</h3><p>Tool, training, malware, and offensive-security resources may require authorization, isolation, licensing review, or extra safety controls. Read each caution and the destination’s current terms before use.</p></article>
              <article><h3>Validation is time-bounded</h3><p>URLs were checked on ${escapeHtml(dataset.generated_on)}. A reachable page can change, and an automated-access restriction is not the same as a broken link. Check current versions, supersession notices, and publication dates before a consequential decision.</p></article>
            </div>
            <p class="ks-method-links">This curated catalog assesses reusable knowledge providers. For references cited across all 1200km articles and guides, use the <a href="/references/">site-wide citation inventory</a>; for the narrower set cited inside Cyber Knowledge practitioner guides, use the <a href="/cyber-knowledge/sources/">Cyber Knowledge source index</a>. For correction and evidence rules, read the <a href="/cyber-knowledge/editorial-policy/">editorial and source policy</a>.</p>
          </section>
        </div>
      </div>
    </main>

    ${renderFooter(shell, page)}
  </body>
</html>
`;
}

const dataset = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const generated = renderPage(dataset);

if (CHECK) {
  if (!existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, 'utf8') !== generated) {
    throw new Error(`Knowledge Sources module is stale: ${OUTPUT_PATH}`);
  }
  console.log(`Validated Knowledge Sources module with ${dataset.sources.length} source anchors.`);
} else {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, generated);
  console.log(`Generated Knowledge Sources module with ${dataset.sources.length} source anchors.`);
}
