#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPlatformSidebar } from './platform-sidebar-lib.mjs';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'research', 'ai-attack-statistics', 'article.md');
const OUTPUT = join(ROOT, 'ai-attack-statistics', 'index.html');
const DATA_DIRECTORY = join(ROOT, 'ai-attack-statistics', 'data');
const DATA_OUTPUT = join(DATA_DIRECTORY, 'index.html');
const check = process.argv.includes('--check');
const MEDIUM_EDITION_URL = 'https://medium.com/@1200km/ai-in-cyberattacks-a-statistical-cti-study-of-114-publications-b8416d856b94';

const DATA_DOWNLOADS = [
  { filename: 'README.md', label: 'Dataset guide', encodingFormat: 'text/markdown', grain: 'Documentation', purpose: 'Schema, field definitions, interpretation cautions, and reproducibility boundary.' },
  { filename: 'publications.csv', label: 'Publications', encodingFormat: 'text/csv', grain: 'One publication', purpose: 'Wide analysis table with eligibility, provenance, tags, metrics, and IOC counts.' },
  { filename: 'tags_long.csv', label: 'Source-linked normalized tags', encodingFormat: 'text/csv', grain: 'One tag occurrence', purpose: 'Normalized dimensions, confidence, extraction method, source IDs, and source-text offsets.' },
  { filename: 'metrics_long.csv', label: 'Metric candidates', encodingFormat: 'text/csv', grain: 'One candidate metric', purpose: 'Unvalidated percentages, durations, costs, dwell, and blast-radius strings linked by source ID.' },
  { filename: 'iocs_long.csv', label: 'IOC candidates', encodingFormat: 'text/csv', grain: 'One candidate observable', purpose: 'Hashes, public IPv4 addresses, and defanged-domain candidates linked by source ID for analyst review.' },
  { filename: 'quality.csv', label: 'Quality and inclusion', encodingFormat: 'text/csv', grain: 'One publication', purpose: 'Completeness, statistical inclusion, AI relevance, and review-state controls.' },
  { filename: 'tag_dictionary.csv', label: 'Tag dictionary', encodingFormat: 'text/csv', grain: 'One tag type', purpose: 'Definitions and interpretation safeguards for normalized statistical dimensions.' },
  { filename: 'summary.json', label: 'Snapshot summary', encodingFormat: 'application/json', grain: 'One dataset snapshot', purpose: 'Machine-readable corpus, quality, and all-record extraction totals.' },
  { filename: 'ai_attack_statistics.sqlite', label: 'SQLite database', encodingFormat: 'application/vnd.sqlite3', grain: 'Relational snapshot', purpose: 'Queryable publication, tag, metric, IOC, and quality tables; private source records are excluded.' },
  { filename: 'ai_attack_statistics.xlsx', label: 'Research workbook', encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', grain: 'Multi-sheet workbook', purpose: 'Sanitized, filterable analysis package for spreadsheet workflows.' },
  { filename: 'source-collection-report.md', label: 'Collection report', encodingFormat: 'text/markdown', grain: 'Collection audit', purpose: 'Retrieval and archive-quality summary without copied third-party source documents.' },
  { filename: 'source-uniqueness-report.tsv', label: 'Uniqueness audit', encodingFormat: 'text/tab-separated-values', grain: 'One source comparison', purpose: 'Duplicate and near-duplicate evidence for the publication entities.' },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeHref(value) {
  const href = String(value).trim();
  if (/^(?:https:\/\/|mailto:|\/|#)/.test(href)) return href;
  throw new Error(`Unsupported article link: ${href}`);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function inline(value) {
  const tokens = [];
  const keep = (html) => {
    const token = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return token;
  };
  let text = String(value);
  text = text.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_, label, rawHref) => {
    const href = safeHref(rawHref);
    const external = /^https:\/\//.test(href);
    return keep(`<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`);
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, (_, strong) => keep(`<strong>${escapeHtml(strong)}</strong>`));
  text = text.replace(/\*([^*]+)\*/g, (_, emphasis) => keep(`<em>${escapeHtml(emphasis)}</em>`));
  text = escapeHtml(text);
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

function isTableDivider(line) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
}

function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((item) => item.trim());
}

function isBlockStart(lines, index) {
  const line = lines[index] || '';
  return /^#{1,6}\s/.test(line)
    || /^```/.test(line)
    || /^>\s?/.test(line)
    || /^(?:-\s+|\d+\.\s+)/.test(line)
    || /^!\[[^\]]+\]\([^)]+\)\s*$/.test(line)
    || (line.includes('|') && isTableDivider(lines[index + 1] || ''));
}

function imageDimensions(src) {
  const path = join(ROOT, src.replace(/^\//, ''));
  const bytes = readFileSync(path);
  if (bytes.toString('ascii', 1, 4) !== 'PNG') return {};
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function markdownBody(source) {
  let lines = source.replace(/\r\n/g, '\n').split('\n');
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end < 0) throw new Error('Article frontmatter is not closed.');
    lines = lines.slice(end + 1);
  }
  while (!lines[0]?.trim()) lines.shift();
  if (!/^#\s/.test(lines[0])) throw new Error('Article source must start with one H1.');
  lines.shift();
  while (!lines[0]?.trim()) lines.shift();
  if (/^\*\*.*\*\*$/.test(lines[0] || '')) lines.shift();

  const output = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = line.match(/^```([^\s]*)/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
      if (index >= lines.length) throw new Error('Article code fence is not closed.');
      index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
      output.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level} id="${slugify(heading[2])}">${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    const image = line.match(/^!\[([^\]]+)]\(([^)]+)\)\s*$/);
    if (image) {
      const src = safeHref(image[2]);
      const size = imageDimensions(src);
      output.push(`<figure class="ai-study-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}"${size.width ? ` width="${size.width}" height="${size.height}"` : ''} loading="lazy" decoding="async" /><figcaption>${escapeHtml(image[1])} · publication coverage, not incident prevalence</figcaption></figure>`);
      index += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      output.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }
    if (line.includes('|') && isTableDivider(lines[index + 1] || '')) {
      const header = cells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) rows.push(cells(lines[index++]));
      const tableLabel = `${header[0] || 'Research'} data table; scroll horizontally when needed`;
      output.push(`<div class="ai-study-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(tableLabel)}"><table><thead><tr>${header.map((item) => `<th scope="col">${inline(item)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, cellIndex) => `<td>${inline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const list = line.match(/^(-|\d+\.)\s+(.+)$/);
    if (list) {
      const ordered = list[1] !== '-';
      const items = [];
      const matcher = ordered ? /^\d+\.\s+(.+)$/ : /^-\s+(.+)$/;
      while (index < lines.length) {
        const item = lines[index].match(matcher);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      output.push(`<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) paragraph.push(lines[index++].trim());
    output.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return output.join('\n');
}

function page(articleBody, sourceHash) {
  const summary = JSON.parse(readFileSync(join(DATA_DIRECTORY, 'summary.json'), 'utf8'));
  const usableReferences = summary.analysis_eligible_publications + summary.context_only_publications;
  const canonical = 'https://1200km.com/ai-attack-statistics/';
  const datasetCanonical = 'https://1200km.com/ai-attack-statistics/data/';
  const title = 'AI in Cyberattacks: Statistical CTI Study | 1200km';
  const headline = `AI in Cyberattacks: A Statistical CTI Study of ${summary.unique_publications} Publications`;
  const description = `Evidence-bounded analysis of ${summary.unique_publications} publications uses ${summary.analysis_eligible_publications} eligible CTI records to map attacker AI use, evidence strength, and limitations.`;
  const cover = 'https://1200km.com/assets/cti/ai-in-cyberattacks-statistical-study/cover.png';
  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        headline,
        description,
        url: canonical,
        datePublished: '2026-08-29',
        dateModified: '2026-08-29',
        inLanguage: 'en',
        author: { '@type': 'Person', name: 'Andrey Pautov', url: 'https://1200km.com/about.html' },
        publisher: { '@type': 'Person', name: 'Andrey Pautov', url: 'https://1200km.com/' },
        image: { '@type': 'ImageObject', url: cover, width: 1672, height: 941 },
        about: ['Artificial intelligence in cyberattacks', 'Cyber threat intelligence', 'Incident response', 'MITRE ATT&CK', 'Detection engineering'],
        isBasedOn: { '@id': `${datasetCanonical}#dataset` },
        sameAs: MEDIUM_EDITION_URL,
        citation: 'https://1200km.com/references/',
      },
      {
        '@type': 'Dataset',
        '@id': `${datasetCanonical}#dataset`,
        name: 'AI in Cyberattacks normalized statistical dataset',
        description: `Publication-level normalized research snapshot: ${summary.source_records} retrieved records, ${summary.unique_publications} deduplicated publications, ${usableReferences} usable references, and ${summary.analysis_eligible_publications} eligible publications in the primary denominator.`,
        url: datasetCanonical,
        datePublished: '2026-08-29',
        creator: { '@type': 'Person', name: 'Andrey Pautov' },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://1200km.com/ai-attack-statistics/data/publications.csv' },
          { '@type': 'DataDownload', encodingFormat: 'application/vnd.sqlite3', contentUrl: 'https://1200km.com/ai-attack-statistics/data/ai_attack_statistics.sqlite' },
          { '@type': 'DataDownload', encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', contentUrl: 'https://1200km.com/ai-attack-statistics/data/ai_attack_statistics.xlsx' },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
          { '@type': 'ListItem', position: 2, name: 'Threat intelligence', item: 'https://1200km.com/cti.html' },
          { '@type': 'ListItem', position: 3, name: 'AI in Cyberattacks statistical study', item: canonical },
        ],
      },
    ],
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://cdn-images-1.medium.com https://1200km.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <script src="/assets/theme-bootstrap.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="Andrey Pautov" />
    <meta name="ai-study-source-sha256" content="${sourceHash}" />
    <meta name="keywords" content="AI cyberattacks, cyber threat intelligence, incident response, LLM abuse, deepfakes, malware, phishing, MITRE ATT&amp;CK, AI statistics" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta property="og:title" content="${escapeHtml(headline)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="1200km — Andrey Pautov Security Research" />
    <meta property="og:image" content="${cover}" />
    <meta property="og:image:width" content="1672" />
    <meta property="og:image:height" content="941" />
    <meta property="og:image:alt" content="AI in Cyberattacks: A Statistical CTI Study cover" />
    <meta property="article:published_time" content="2026-08-29" />
    <meta property="article:modified_time" content="2026-08-29" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(headline)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${cover}" />
    <meta name="twitter:image:alt" content="AI in Cyberattacks: A Statistical CTI Study cover" />
    <meta name="theme-color" content="#07101f" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />
    <link rel="preload" as="image" href="/assets/cti/ai-in-cyberattacks-statistical-study/cover.webp" type="image/webp" fetchpriority="high" />
    <link rel="icon" href="/assets/ap-logo.png" type="image/png" />
    <link rel="stylesheet" href="/assets/ai-attack-statistics-article.css?v=20260829-1" />
    <link rel="stylesheet" href="/assets/site-theme.css?v=20260721-shell" />
    <script type="application/ld+json">${JSON.stringify(structured).replace(/<\//g, '<\\/')}</script>
    <script src="/assets/site-performance.js" data-google-analytics-id="G-TMTG21RVHM" defer></script>
    <script src="/assets/site-theme.js?v=20260721-shell" defer></script>
  </head>
  <body id="top">
    <header class="site-header"><nav class="nav" aria-label="Primary navigation"><a class="brand" href="/">Andrey Pautov</a><div class="nav-links"><a href="/cti.html">Research</a><a href="/guides.html">Library</a><a href="/projects.html">Products &amp; Labs</a><a href="/adversarygraph/">AdversaryGraph</a></div></nav></header>
    <section class="ai-study-hero" aria-labelledby="study-title">
      <div class="ai-study-hero__inner">
        <p class="ai-study-eyebrow">Original research · Statistical CTI · Published 29 August 2026</p>
        <h1 class="ai-study-title" id="study-title">${headline}</h1>
        <p class="ai-study-deck">A visualization-rich analysis of ${summary.analysis_eligible_publications} eligible publications shows where AI appears in attacker workflows, which evidence is strongest, and which conclusions remain unsafe to make.</p>
        <div class="ai-study-meta"><span class="ai-study-chip">${summary.unique_publications} deduplicated publications</span><span class="ai-study-chip">${summary.analysis_eligible_publications}-publication denominator</span><span class="ai-study-chip">31 visualizations</span><span class="ai-study-chip">Evidence-bounded</span></div>
        <div class="ai-study-actions"><a class="ai-study-button ai-study-button--primary" href="/ai-attack-statistics/dashboard/">Open interactive dashboard</a><a class="ai-study-button" href="/references/">Search all references</a><a class="ai-study-button" href="/ai-attack-statistics/data/">Explore the dataset</a><a class="ai-study-button" href="${MEDIUM_EDITION_URL}" target="_blank" rel="noopener noreferrer" aria-label="Read the Medium snapshot edition with 114 publications and a 106-publication denominator">Medium snapshot (114/106) ↗</a></div>
        <picture><source srcset="/assets/cti/ai-in-cyberattacks-statistical-study/cover.webp" type="image/webp" /><img class="ai-study-cover" src="/assets/cti/ai-in-cyberattacks-statistical-study/cover.png" alt="AI in Cyberattacks: A Statistical CTI Study cover showing a red and blue data stream forming a digital brain above research documents" width="1672" height="941" loading="eager" decoding="async" fetchpriority="high" /></picture>
      </div>
    </section>
    <section class="ai-study-lineage" aria-label="Corpus denominator lineage"><div class="ai-study-lineage__inner"><div class="ai-study-lineage__step"><span class="ai-study-lineage__value">${summary.source_records}</span><span class="ai-study-lineage__label">retrieved source records</span></div><div class="ai-study-lineage__step"><span class="ai-study-lineage__value">${summary.unique_publications}</span><span class="ai-study-lineage__label">deduplicated publications</span></div><div class="ai-study-lineage__step"><span class="ai-study-lineage__value">${usableReferences}</span><span class="ai-study-lineage__label">usable indexed references</span></div><div class="ai-study-lineage__step"><span class="ai-study-lineage__value">${summary.analysis_eligible_publications}</span><span class="ai-study-lineage__label">primary analytical denominator</span></div></div></section>
    <main class="ai-study-layout" id="main-content" data-pagefind-body>
      <article class="ai-study-article">${articleBody}</article>
      <aside class="ai-study-aside" aria-label="Research navigation">
        <section class="ai-study-aside__card ai-study-warning"><h2>Evidence boundary</h2><p>Counts describe publications and extracted candidates—not attacks, victims, prevalence, attribution, or provider abuse rates.</p><a href="#limitations-and-reproducibility">Read limitations</a></section>
        <section class="ai-study-aside__card"><h2>Research workspace</h2><ul><li><a href="/ai-attack-statistics/dashboard/">Interactive dashboard</a></li><li><a href="/references/">${usableReferences}-publication References library</a></li><li><a href="/ai-attack-statistics/data/">Dataset and downloads</a></li><li><a href="/cyber-knowledge/ai-security.html">AI Security knowledge path</a></li><li><a href="/cyber-knowledge/cti.html">CTI knowledge path</a></li></ul></section>
        <section class="ai-study-aside__card"><h2>Download snapshot</h2><ul><li><a href="/ai-attack-statistics/data/publications.csv">Publications CSV</a></li><li><a href="/ai-attack-statistics/data/tags_long.csv">Source-linked normalized tags</a></li><li><a href="/ai-attack-statistics/data/ai_attack_statistics.sqlite">SQLite</a></li><li><a href="/ai-attack-statistics/data/ai_attack_statistics.xlsx">Sanitized workbook</a></li></ul></section>
      </aside>
    </main>
    <footer><div><a href="/">1200km.com</a> · <a href="mailto:1200km@gmail.com">1200km@gmail.com</a></div></footer>
  </body>
</html>`;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

function dataManifestHash() {
  const manifest = DATA_DOWNLOADS.map(({ filename }) => {
    const stat = statSync(join(DATA_DIRECTORY, filename));
    return `${filename}:${stat.size}`;
  }).join('\n');
  return createHash('sha256').update(manifest).digest('hex');
}

function dataPage(manifestHash) {
  const canonical = 'https://1200km.com/ai-attack-statistics/data/';
  const articleCanonical = 'https://1200km.com/ai-attack-statistics/';
  const cover = 'https://1200km.com/assets/cti/ai-in-cyberattacks-statistical-study/cover.png';
  const title = 'AI in Cyberattacks Dataset & Downloads | 1200km';
  const heading = 'AI in Cyberattacks: Dataset and Downloads';
  const description = 'Download the governed publication, tag, metric, IOC, quality, SQLite, and workbook snapshots behind the 1200km AI in Cyberattacks statistical CTI study.';
  const summary = JSON.parse(readFileSync(join(DATA_DIRECTORY, 'summary.json'), 'utf8'));
  const usableReferences = summary.analysis_eligible_publications + summary.context_only_publications;
  const distributions = DATA_DOWNLOADS.map(({ filename, encodingFormat }) => ({
    '@type': 'DataDownload',
    encodingFormat,
    contentUrl: `${canonical}${filename}`,
  }));
  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: heading,
        description,
        datePublished: '2026-08-29',
        dateModified: '2026-08-29',
        inLanguage: 'en',
        mainEntity: { '@id': `${canonical}#dataset` },
        isPartOf: { '@id': 'https://1200km.com/#website' },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
      },
      {
        '@type': 'Dataset',
        '@id': `${canonical}#dataset`,
        name: 'AI in Cyberattacks normalized statistical dataset',
        description: `Publication-level normalized research snapshot: ${summary.source_records} retrieved records, ${summary.unique_publications} deduplicated publications, ${usableReferences} usable references, and ${summary.analysis_eligible_publications} eligible publications in the primary denominator.`,
        url: canonical,
        datePublished: '2026-08-29',
        dateModified: '2026-08-29',
        creator: { '@type': 'Person', name: 'Andrey Pautov', url: 'https://1200km.com/about.html' },
        isBasedOn: articleCanonical,
        mainEntityOfPage: { '@id': `${canonical}#webpage` },
        distribution: distributions,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
          { '@type': 'ListItem', position: 2, name: 'AI in Cyberattacks statistical study', item: articleCanonical },
          { '@type': 'ListItem', position: 3, name: 'Dataset and downloads', item: canonical },
        ],
      },
    ],
  };
  const downloadRows = DATA_DOWNLOADS.map((file) => {
    const bytes = statSync(join(DATA_DIRECTORY, file.filename)).size;
    const href = `/ai-attack-statistics/data/${file.filename}`;
    return `<tr><th scope="row"><a href="${escapeHtml(href)}">${escapeHtml(file.label)}</a><code>${escapeHtml(file.filename)}</code></th><td>${escapeHtml(file.grain)}</td><td>${escapeHtml(file.purpose)}</td><td>${escapeHtml(humanSize(bytes))}</td></tr>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://1200km.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <script src="/assets/theme-bootstrap.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="Andrey Pautov" />
    <meta name="ai-study-data-manifest-sha256" content="${manifestHash}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <meta property="og:title" content="${escapeHtml(heading)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="1200km — Andrey Pautov Security Research" />
    <meta property="og:image" content="${cover}" />
    <meta property="og:image:width" content="1672" />
    <meta property="og:image:height" content="941" />
    <meta property="og:image:alt" content="AI in Cyberattacks: A Statistical CTI Study cover" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(heading)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${cover}" />
    <meta name="theme-color" content="#07101f" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />
    <link rel="icon" href="/assets/ap-logo.png" type="image/png" />
    <link rel="stylesheet" href="/assets/ai-attack-statistics-data.css?v=20260829-1" />
    <link rel="stylesheet" href="/assets/site-theme.css?v=20260721-shell" />
    <script type="application/ld+json">${JSON.stringify(structured).replace(/<\//g, '<\\/')}</script>
    <script src="/assets/site-performance.js" data-google-analytics-id="G-TMTG21RVHM" defer></script>
    <script src="/assets/site-theme.js?v=20260721-shell" defer></script>
  </head>
  <body id="top">
    <header class="site-header"><nav class="nav" aria-label="Primary navigation"><a class="brand" href="/">Andrey Pautov</a></nav></header>
    <main class="ai-data-page" id="main-content" data-pagefind-body>
      <section class="ai-data-hero" aria-labelledby="dataset-title">
        <div>
          <p class="ai-data-eyebrow">Governed research artifact · Published 29 August 2026</p>
          <h1 id="dataset-title">${escapeHtml(heading)}</h1>
          <p class="ai-data-lead">Analysis-ready exports behind the statistical study and interactive dashboard, with publication-level provenance, source-linked candidate tags, review controls, and explicit interpretation limits.</p>
          <div class="ai-data-actions"><a class="ai-data-button ai-data-button--primary" href="/ai-attack-statistics/">Read the study</a><a class="ai-data-button" href="/ai-attack-statistics/dashboard/">Explore the dashboard</a><a class="ai-data-button" href="/references/">Search ${usableReferences} references</a></div>
        </div>
        <aside class="ai-data-boundary" aria-labelledby="dataset-boundary-title"><h2 id="dataset-boundary-title">Evidence boundary</h2><p>The unit of analysis is a publication—not an incident, victim, attack, account, prompt, campaign, or malware sample. Extracted tags, metrics, IOCs, actors, ATT&amp;CK candidates, countries, sectors, providers, and models still require source-level analyst validation.</p></aside>
      </section>
      <section class="ai-data-lineage" aria-label="Dataset denominator lineage"><div><strong>${summary.source_records}</strong><span>retrieved records</span></div><div><strong>${summary.unique_publications}</strong><span>deduplicated publications</span></div><div><strong>${usableReferences}</strong><span>usable references</span></div><div><strong>${summary.analysis_eligible_publications}</strong><span>primary denominator</span></div></section>
      <section class="ai-data-section" aria-labelledby="download-title"><div class="ai-data-heading"><p class="ai-data-eyebrow">Twelve governed artifacts</p><h2 id="download-title">Choose the right export</h2><p>The public package supports recalculating the published distributions and inspecting source IDs, offsets, and provenance fields. The downloaded third-party HTML and PDF archive is intentionally not redistributed.</p></div><div class="ai-data-table" tabindex="0" role="region" aria-label="Dataset download table; scroll horizontally when needed"><table><thead><tr><th scope="col">Artifact</th><th scope="col">Grain</th><th scope="col">Purpose</th><th scope="col">Size</th></tr></thead><tbody>${downloadRows}</tbody></table></div></section>
      <section class="ai-data-grid" aria-label="Dataset use and safeguards"><article><p class="ai-data-eyebrow">Start here</p><h2>Analysis workflow</h2><ol><li>Use <a href="/ai-attack-statistics/data/publications.csv">publications.csv</a> for the ${summary.unique_publications}-row publication inventory and inclusion controls.</li><li>Filter to the ${summary.analysis_eligible_publications} <code>include_with_manual_validation</code> rows before reproducing primary percentages.</li><li>Join the long-form tag, metric, and IOC tables on <code>publication_id</code>.</li><li>Use source IDs and source-text offsets to locate the original passage, then review the canonical publisher source before operational use.</li></ol></article><article><p class="ai-data-eyebrow">Spreadsheet safety</p><h2>Formula-neutral exports</h2><p>Text beginning with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code> is prefixed with an ASCII apostrophe in public CSV and XLSX files. Release tests verify that CSV cells retain no formula-capable prefix and the workbook contains no formula nodes.</p><p><a href="/ai-attack-statistics/data/README.md">Read the full dataset guide →</a></p></article><article><p class="ai-data-eyebrow">Interpret carefully</p><h2>Counts are not prevalence</h2><p>Publication coverage, multi-label co-mentions, extracted metrics, and candidate observables do not establish unique incidents, causal relations, attribution, provider use, victim geography, or attack rates.</p><p><a href="/ai-attack-statistics/#limitations-and-reproducibility">Review all study limitations →</a></p></article></section>
      <section class="ai-data-section ai-data-provenance" aria-labelledby="provenance-title"><div class="ai-data-heading"><p class="ai-data-eyebrow">Provenance and uniqueness</p><h2 id="provenance-title">Audit the collection boundary</h2></div><div class="ai-data-audit-links"><a href="/ai-attack-statistics/data/source-collection-report.md"><strong>Source collection report</strong><span>Retrieval methods, archive quality, and excluded records.</span></a><a href="/ai-attack-statistics/data/source-uniqueness-report.tsv"><strong>Source uniqueness audit</strong><span>Duplicate groups and publication-entity comparisons.</span></a><a href="/references/"><strong>Canonical source library</strong><span>Publisher links and all searchable correlation tags for ${usableReferences} usable references.</span></a></div></section>
    </main>
    <footer><div><a href="/">1200km.com</a> · <a href="mailto:1200km@gmail.com">1200km@gmail.com</a></div></footer>
  </body>
</html>`;
}

const source = readFileSync(SOURCE, 'utf8');
const sourceHash = createHash('sha256').update(source).digest('hex');
const generated = page(markdownBody(source), sourceHash);
const manifestHash = dataManifestHash();
const generatedData = dataPage(manifestHash);
const shell = loadSiteShell(ROOT);
const pageConfig = shell.pages.find((item) => item.path === 'ai-attack-statistics/index.html');
if (!pageConfig) throw new Error('data/site-shell.json is missing ai-attack-statistics/index.html');
const output = `${applyPlatformSidebar(
  applySiteShell(generated, shell, pageConfig),
  shell,
  { pathname: '/ai-attack-statistics/' },
).trim()}\n`;
const dataPageConfig = shell.pages.find((item) => item.path === 'ai-attack-statistics/data/index.html');
if (!dataPageConfig) throw new Error('data/site-shell.json is missing ai-attack-statistics/data/index.html');
const dataOutput = `${applyPlatformSidebar(
  applySiteShell(generatedData, shell, dataPageConfig),
  shell,
  { pathname: '/ai-attack-statistics/data/' },
).trim()}\n`;

if (check) {
  const current = readFileSync(OUTPUT, 'utf8');
  const currentData = readFileSync(DATA_OUTPUT, 'utf8');
  if (current !== output) {
    throw new Error('AI-attack statistical study output is stale; run npm run build-ai-attack-study.');
  }
  if (currentData !== dataOutput) {
    throw new Error('AI-attack dataset landing page output is stale; run npm run build-ai-attack-study.');
  }
  if (!current.includes(`<meta name="ai-study-source-sha256" content="${sourceHash}"`)) {
    throw new Error('AI-attack statistical study source hash is stale; run npm run build-ai-attack-study.');
  }
  if ((current.match(/<figure\b/g) || []).length !== 31) {
    throw new Error('AI-attack statistical study must publish all 31 governed figures.');
  }
  if (!currentData.includes(`<meta name="ai-study-data-manifest-sha256" content="${manifestHash}"`)) {
    throw new Error('AI-attack dataset landing page manifest is stale; run npm run build-ai-attack-study.');
  }
  for (const { filename } of DATA_DOWNLOADS) {
    if (!currentData.includes(`href="/ai-attack-statistics/data/${filename}"`)) {
      throw new Error(`AI-attack dataset landing page is missing ${filename}.`);
    }
  }
  console.log('Validated AI-attack statistical study and dataset landing page.');
} else {
  writeFileSync(OUTPUT, output);
  writeFileSync(DATA_OUTPUT, dataOutput);
  console.log('Generated AI-attack statistical study and dataset landing page.');
}
