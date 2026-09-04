#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPlatformSidebar } from './platform-sidebar-lib.mjs';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIRECTORY = join(ROOT, 'ai-attack-statistics', 'data');
const OUTPUT = join(ROOT, 'ai-attack-statistics', 'dashboard', 'index.html');
const ARTICLE_SOURCE = join(ROOT, 'research', 'ai-attack-statistics', 'article.md');
const check = process.argv.includes('--check');

const INPUT_FILES = ['summary.json', 'publications.csv', 'tags_long.csv', 'metrics_long.csv', 'iocs_long.csv'];
const DOWNLOADS = [
  ['README.md', 'Dataset guide', 'Markdown · schema, field definitions, and cautions'],
  ['publications.csv', 'Publications', 'CSV · normalized publication records'],
  ['tags_long.csv', 'Tags', 'CSV · publication-to-tag assignments'],
  ['metrics_long.csv', 'Metrics', 'CSV · heterogeneous extracted metric mentions'],
  ['iocs_long.csv', 'IOC candidates', 'CSV · analyst-validation queue'],
  ['quality.csv', 'Quality review', 'CSV · eligibility and review state'],
  ['summary.json', 'Summary', 'JSON · corpus-level counts and quality state'],
  ['tag_dictionary.csv', 'Tag dictionary', 'CSV · normalized statistical dimensions'],
  ['ai_attack_statistics.sqlite', 'SQLite database', 'SQLite · queryable relational dataset'],
  ['ai_attack_statistics.xlsx', 'Research workbook', 'XLSX · multi-sheet analysis package'],
  ['source-collection-report.md', 'Collection report', 'Markdown · source acquisition record'],
  ['source-uniqueness-report.tsv', 'Uniqueness audit', 'TSV · duplicate and near-duplicate review'],
];

const TAG_WIDGETS = [
  ['AI use case', 'ai_use_case', 15],
  ['AI technology', 'ai_technology', 6],
  ['Kill Chain', 'kill_chain_phase', 7],
  ['ATT&CK tactic', 'mitre_tactic', 14],
  ['TTP', 'ttp', 15],
  ['Attack vector', 'attack_vector', 8],
  ['Threat group', 'threat_group', 15],
  ['Sector', 'sector', 15],
  ['Country / region', 'country_or_region', 15],
  ['Target persona', 'target', 6],
  ['LLM provider', 'llm_provider', 9],
  ['LLM model', 'llm_model', 9],
  ['Malicious-AI tool', 'malicious_ai_tool', 7],
  ['Malware / tool', 'malware_or_tool', 15],
  ['Infrastructure', 'infrastructure', 8],
  ['Data type', 'data_type', 7],
  ['Impact', 'impact', 6],
  ['Actor motivation', 'actor_motivation', 5],
  ['Evidence landscape', 'evidence_landscape', 8],
  ['CVE', 'cve', 12],
];

const SECTIONS = [
  {
    id: 'behavior',
    title: 'Attacker behavior and technique coverage',
    subtitle: 'How eligible publications describe attacker AI usage, enabling technology, attack stages, tactics, techniques, and delivery paths.',
    widgets: ['AI use case', 'AI technology', 'Kill Chain', 'ATT&CK tactic', 'TTP', 'Attack vector'],
  },
  {
    id: 'entities',
    title: 'Actors, targets, providers, and technical entities',
    subtitle: 'Publication coverage across named groups, sectors, geographies, personas, AI services, malware, infrastructure, and data types.',
    widgets: ['Threat group', 'Sector', 'Country / region', 'Target persona', 'LLM provider', 'LLM model', 'Malicious-AI tool', 'Malware / tool', 'Infrastructure', 'Data type'],
  },
  {
    id: 'evidence',
    title: 'Impact, evidence quality, metrics, and observables',
    subtitle: 'What the corpus says about outcomes and motivation, plus the review queues that must not be mistaken for validated incident prevalence.',
    widgets: ['Impact', 'Actor motivation', 'Evidence landscape', 'Metric coverage', 'Unique IOC candidates', 'CVE'],
  },
];

const HEATMAPS = [
  ['Sector × AI use case', 'sector', 'ai_use_case'],
  ['Threat group × AI use case', 'threat_group', 'ai_use_case'],
  ['Kill Chain × AI use case', 'kill_chain_phase', 'ai_use_case'],
  ['Provider × AI use case', 'llm_provider', 'ai_use_case'],
  ['Sector × country / region', 'sector', 'country_or_region'],
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeHttps(value) {
  const url = String(value || '').trim();
  if (!/^https:\/\//i.test(url)) throw new Error(`Dashboard source URL must use HTTPS: ${url}`);
  return url;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleCase(value) {
  const special = new Map([
    ['operational_cti', 'Operational CTI'],
    ['cve', 'CVE'],
    ['ipv4', 'IPv4'],
    ['md5', 'MD5'],
    ['sha1', 'SHA-1'],
    ['sha256', 'SHA-256'],
    ['llm', 'LLM'],
  ]);
  const text = String(value || 'Unknown');
  if (special.has(text.toLowerCase())) return special.get(text.toLowerCase());
  return text.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
    } else if (character === '"' && cell === '') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      if (row.some((item) => item !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }
  if (quoted) throw new Error('Unclosed CSV field.');
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some((item) => item !== '')) rows.push(row);
  }
  if (rows.length < 2) throw new Error('Dashboard CSV input is empty.');
  const header = rows.shift();
  if (new Set(header).size !== header.length) throw new Error('Dashboard CSV header contains duplicate fields.');
  return rows.map((cells, rowIndex) => {
    if (cells.length !== header.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${cells.length} cells; expected ${header.length}.`);
    }
    return Object.fromEntries(header.map((name, index) => [name, cells[index]]));
  });
}

function readCsv(filename) {
  return parseCsv(readFileSync(join(DATA_DIRECTORY, filename), 'utf8'));
}

function number(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer.`);
  return parsed;
}

function increment(map, key, id) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(id);
}

function sortedSeries(map, labels, limit = Infinity) {
  return [...map.entries()]
    .map(([key, ids]) => ({ key, label: labels?.get(key) || titleCase(key), value: ids instanceof Set ? ids.size : ids }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'en'))
    .slice(0, limit);
}

function pipeValues(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean);
}

function manifestHash() {
  const hash = createHash('sha256');
  for (const filename of INPUT_FILES) {
    hash.update(filename);
    hash.update('\0');
    hash.update(readFileSync(join(DATA_DIRECTORY, filename)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function sourceMetadata() {
  const source = readFileSync(ARTICLE_SOURCE, 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/m)?.[1] || '';
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*["']?(.+?)["']?\\s*$`, 'm'))?.[1]?.replace(/["']$/, '');
  return {
    published: field('published') || field('date') || '2026-08-29',
    modified: field('updated') || field('modified') || null,
  };
}

function loadModel() {
  const summary = JSON.parse(readFileSync(join(DATA_DIRECTORY, 'summary.json'), 'utf8'));
  const publications = readCsv('publications.csv');
  const tags = readCsv('tags_long.csv');
  const metrics = readCsv('metrics_long.csv');
  const iocs = readCsv('iocs_long.csv');
  const publicationIds = new Set(publications.map((row) => row.publication_id));
  if (publicationIds.size !== publications.length) throw new Error('publications.csv contains duplicate publication IDs.');
  if (publications.length !== number(summary.unique_publications, 'summary.unique_publications')) {
    throw new Error('summary.unique_publications does not match publications.csv.');
  }

  const eligible = publications.filter((row) => row.analysis_inclusion === 'include_with_manual_validation');
  const eligibleIds = new Set(eligible.map((row) => row.publication_id));
  if (eligible.length !== number(summary.analysis_eligible_publications, 'summary.analysis_eligible_publications')) {
    throw new Error('summary.analysis_eligible_publications does not match publications.csv.');
  }
  const contextCount = publications.filter((row) => row.analysis_inclusion === 'context_only').length;
  if (contextCount !== number(summary.context_only_publications, 'summary.context_only_publications')) {
    throw new Error('summary.context_only_publications does not match publications.csv.');
  }

  const eligibleTags = tags.filter((row) => eligibleIds.has(row.publication_id));
  const eligibleMetrics = metrics.filter((row) => eligibleIds.has(row.publication_id));
  const eligibleIocs = iocs.filter((row) => eligibleIds.has(row.publication_id));
  for (const [label, actual, expected] of [
    ['eligible tags', eligibleTags.length, summary.eligible_tags],
    ['eligible metrics', eligibleMetrics.length, summary.eligible_metrics],
    ['eligible IOCs', eligibleIocs.length, summary.eligible_iocs],
  ]) {
    if (actual !== number(expected, `summary ${label}`)) throw new Error(`Dashboard ${label} count ${actual} does not match summary ${expected}.`);
  }

  const tagCoverage = new Map();
  const tagLabels = new Map();
  const publicationTags = new Map();
  for (const row of eligibleTags) {
    const type = row.tag_type;
    const key = String(row.normalized_value || row.value).trim();
    if (!type || !key) continue;
    if (!tagCoverage.has(type)) tagCoverage.set(type, new Map());
    if (!tagLabels.has(type)) tagLabels.set(type, new Map());
    increment(tagCoverage.get(type), key, row.publication_id);
    if (!tagLabels.get(type).has(key)) tagLabels.get(type).set(key, row.value || key);
    if (!publicationTags.has(row.publication_id)) publicationTags.set(row.publication_id, new Map());
    const types = publicationTags.get(row.publication_id);
    if (!types.has(type)) types.set(type, new Set());
    types.get(type).add(key);
  }

  const widgetSeries = new Map();
  for (const [name, type, limit] of TAG_WIDGETS) {
    widgetSeries.set(name, sortedSeries(tagCoverage.get(type) || new Map(), tagLabels.get(type), limit));
  }

  const dispositions = new Map();
  const dispositionLabels = new Map([
    ['include_with_manual_validation', 'Eligible for primary analysis'],
    ['context_only', 'Context only'],
    ['exclude', 'Excluded — broken source'],
    ['exclude_non_ai', 'Excluded — non-AI'],
  ]);
  for (const publication of publications) increment(dispositions, publication.analysis_inclusion || 'unknown', publication.publication_id);

  const years = new Map();
  const sourceTypes = new Map();
  const publishers = new Map();
  for (const publication of eligible) {
    increment(years, publication.publication_year || 'Unknown', publication.publication_id);
    increment(sourceTypes, publication.source_type || 'Unknown', publication.publication_id);
    increment(publishers, publication.publisher || 'Unknown', publication.publication_id);
  }

  const metricCoverage = new Map();
  for (const row of eligibleMetrics) increment(metricCoverage, row.metric_type || 'unknown', row.publication_id);
  widgetSeries.set('Metric coverage', sortedSeries(metricCoverage, null, 7));

  const typedIocValues = new Map();
  for (const row of eligibleIocs) {
    const type = row.ioc_type || 'unknown';
    if (!typedIocValues.has(type)) typedIocValues.set(type, new Set());
    typedIocValues.get(type).add(String(row.value).trim().toLocaleLowerCase('en'));
  }
  widgetSeries.set('Unique IOC candidates', sortedSeries(typedIocValues, null, 5));
  const uniqueIocCount = [...typedIocValues.values()].reduce((sum, values) => sum + values.size, 0);

  return {
    summary,
    publications,
    eligible,
    eligibleIds,
    tags: eligibleTags,
    metrics: eligibleMetrics,
    iocs: eligibleIocs,
    tagCoverage,
    tagLabels,
    publicationTags,
    widgetSeries,
    uniqueIocCount,
    overviewSeries: new Map([
      ['Disposition', sortedSeries(dispositions, dispositionLabels)],
      ['Publication year', sortedSeries(years)],
      ['Source type', sortedSeries(sourceTypes)],
      ['Publisher', sortedSeries(publishers, null, 15)],
    ]),
  };
}

function percentage(value, denominator) {
  return denominator ? `${(value / denominator * 100).toFixed(1)}%` : '0.0%';
}

function barWidget(name, series, model) {
  const id = `widget-${slugify(name)}`;
  const isDisposition = name === 'Disposition';
  const isIoc = name === 'Unique IOC candidates';
  const denominator = isDisposition ? model.summary.unique_publications : model.summary.analysis_eligible_publications;
  const max = isIoc ? Math.max(...series.map((item) => item.value), 1) : denominator;
  const subtitle = isDisposition
    ? `Share of the complete ${model.summary.unique_publications}-publication corpus.`
    : isIoc
      ? `${model.uniqueIocCount.toLocaleString('en-US')} unique typed values from ${model.summary.eligible_iocs.toLocaleString('en-US')} eligible IOC mentions; each remains an analyst-validation candidate.`
      : 'Eligible publication coverage; multi-label values can sum above the denominator.';
  const rows = series.map((item) => {
    const aria = isIoc
      ? `${item.label}: ${item.value} unique candidates`
      : `${item.label}: ${item.value} of ${denominator} publications`;
    const display = isIoc ? item.value.toLocaleString('en-US') : `${item.value.toLocaleString('en-US')} · ${percentage(item.value, denominator)}`;
    return `              <div class="bar-row">
                <div class="bar-label" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</div>
                <meter class="bar-meter" min="0" max="${max}" value="${item.value}" aria-label="${escapeHtml(aria)}">${item.value}</meter>
                <div class="bar-value">${display}</div>
              </div>`;
  }).join('\n');
  return `        <article class="panel" data-dashboard-widget="bar" data-widget-name="${escapeHtml(name)}" aria-labelledby="${id}">
          <h3 id="${id}">${escapeHtml(name)}</h3>
          <p class="sub">${escapeHtml(subtitle)}</p>
          <div class="bars">
${rows}
          </div>
        </article>`;
}

function heatmapWidget(name, rowType, columnType, model) {
  const rows = sortedSeries(model.tagCoverage.get(rowType) || new Map(), model.tagLabels.get(rowType), 10);
  const columns = sortedSeries(model.tagCoverage.get(columnType) || new Map(), model.tagLabels.get(columnType), 10);
  const values = rows.map((row) => columns.map((column) => {
    let count = 0;
    for (const publicationId of model.eligibleIds) {
      const tags = model.publicationTags.get(publicationId);
      if (tags?.get(rowType)?.has(row.key) && tags?.get(columnType)?.has(column.key)) count += 1;
    }
    return count;
  }));
  const maximum = Math.max(...values.flat(), 1);
  const id = `widget-${slugify(name)}`;
  const header = columns.map((column) => `<th class="col" scope="col">${escapeHtml(column.label)}</th>`).join('');
  const body = rows.map((row, rowIndex) => {
    const cells = columns.map((column, columnIndex) => {
      const value = values[rowIndex][columnIndex];
      const level = value === 0 ? 0 : Math.max(1, Math.ceil(value / maximum * 9));
      const label = `${row.label} × ${column.label}: ${value} eligible publications`;
      return `<td class="heat-level-${level}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${value}</td>`;
    }).join('');
    return `                <tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
  }).join('\n');

  return `        <article class="panel wide" data-dashboard-widget="heatmap" data-widget-name="${escapeHtml(name)}" aria-labelledby="${id}">
          <h3 id="${id}">${escapeHtml(name)}</h3>
          <p class="sub">Number of eligible publications containing both normalized tags.</p>
          <div class="heat-wrap" tabindex="0" role="region" aria-label="Scrollable ${escapeHtml(name)} heatmap">
            <table class="heat">
              <caption>${escapeHtml(name)} co-mention matrix</caption>
              <thead><tr><th scope="col">Category</th>${header}</tr></thead>
              <tbody>
${body}
              </tbody>
            </table>
          </div>
        </article>`;
}

function renderOptions(values, label, formatter = (value) => value) {
  return `<option value="">All ${escapeHtml(label)}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatter(value))}</option>`).join('')}`;
}

function pills(values, limit = 7) {
  return [...new Set(values)].slice(0, limit).map((value) => `<span class="pill">${escapeHtml(value)}</span>`).join('');
}

function sourceRow(publication) {
  const useCases = pipeValues(publication.ai_use_cases);
  const entities = [
    ...pipeValues(publication.sectors),
    ...pipeValues(publication.threat_groups),
    ...pipeValues(publication.llm_providers),
  ];
  const search = [
    publication.publication_id,
    publication.title,
    publication.publisher,
    publication.publication_date,
    publication.source_type,
    publication.ai_use_cases,
    publication.sectors,
    publication.threat_groups,
    publication.llm_providers,
    publication.malware_or_tools,
    publication.cves,
  ].filter(Boolean).join(' ');
  const year = publication.publication_year || 'Unknown';
  return `              <tr data-dashboard-source data-record-id="${escapeHtml(publication.publication_id)}" data-publisher="${escapeHtml(publication.publisher || 'Unknown')}" data-year="${escapeHtml(year)}" data-source-type="${escapeHtml(publication.source_type || 'Unknown')}" data-search="${escapeHtml(search)}">
                <td>${escapeHtml(publication.publication_date || year)}</td>
                <td>${escapeHtml(publication.publisher || 'Unknown')}</td>
                <td><a href="${escapeHtml(safeHttps(publication.primary_url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(publication.title)}</a></td>
                <td>${pills(useCases)}</td>
                <td>${pills(entities)}</td>
                <td>${escapeHtml(publication.tag_count || '0')}</td>
                <td>${escapeHtml(publication.metric_count || '0')}</td>
                <td>${escapeHtml(publication.ioc_count || '0')}</td>
              </tr>`;
}

function displayDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return String(value);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function structuredData(model, description, published, modified) {
  const canonical = 'https://1200km.com/ai-attack-statistics/dashboard/';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: 'AI in Cyberattacks: Interactive Statistical CTI Dashboard',
        description,
        datePublished: published,
        dateModified: modified,
        author: { '@type': 'Person', name: 'Andrey Pautov', url: 'https://1200km.com/about.html' },
        mainEntity: { '@id': 'https://1200km.com/ai-attack-statistics/data/#dataset' },
        inLanguage: 'en',
      },
      {
        '@type': 'Dataset',
        '@id': 'https://1200km.com/ai-attack-statistics/data/#dataset',
        name: 'AI in Cyberattacks Statistical CTI Dataset',
        description: `${model.summary.unique_publications} deduplicated publication entities with ${model.summary.analysis_eligible_publications} publications in the primary statistical denominator.`,
        url: 'https://1200km.com/ai-attack-statistics/data/',
        datePublished: published,
        dateModified: modified,
        creator: { '@type': 'Person', name: 'Andrey Pautov' },
        distribution: DOWNLOADS.map(([filename]) => ({
          '@type': 'DataDownload',
          contentUrl: `https://1200km.com/ai-attack-statistics/data/${filename}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
          { '@type': 'ListItem', position: 2, name: 'AI in Cyberattacks statistical study', item: 'https://1200km.com/ai-attack-statistics/' },
          { '@type': 'ListItem', position: 3, name: 'Interactive dashboard', item: canonical },
        ],
      },
    ],
  };
}

function dashboardPage(model, dataHash) {
  const eligibleCount = model.summary.analysis_eligible_publications;
  const publicationCount = model.summary.unique_publications;
  const usableCount = eligibleCount + model.summary.context_only_publications;
  const metadata = sourceMetadata();
  const modified = metadata.modified || String(model.summary.generated_at || metadata.published).slice(0, 10);
  const description = `Explore 31 CTI views and ${eligibleCount} eligible publications on attacker AI use across actors, sectors, behaviors, providers, metrics, and IOC candidates.`;
  const knownYears = model.eligible
    .map((publication) => Number(publication.publication_year))
    .filter((year) => Number.isInteger(year) && year >= 2000);
  const yearRange = `${Math.min(...knownYears)}–${Math.max(...knownYears)}`;
  const allSeries = new Map([...model.overviewSeries, ...model.widgetSeries]);
  const overviewWidgets = ['Disposition', 'Publication year', 'Source type', 'Publisher']
    .map((name) => barWidget(name, allSeries.get(name), model)).join('\n');
  const sections = SECTIONS.map((section) => `    <section id="${section.id}" class="dashboard-section" aria-labelledby="${section.id}-title">
      <h2 class="section-title" id="${section.id}-title">${escapeHtml(section.title)}</h2>
      <p class="section-subtitle">${escapeHtml(section.subtitle)}</p>
      <div class="grid">
${section.widgets.map((name) => barWidget(name, allSeries.get(name), model)).join('\n')}
      </div>
    </section>`).join('\n\n');
  const heatmaps = HEATMAPS.map(([name, rowType, columnType]) => heatmapWidget(name, rowType, columnType, model)).join('\n');
  const publishers = [...new Set(model.eligible.map((publication) => publication.publisher || 'Unknown'))].sort((a, b) => a.localeCompare(b, 'en'));
  const years = [...new Set(model.eligible.map((publication) => publication.publication_year || 'Unknown'))].sort((a, b) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a.localeCompare(b, 'en'));
  const sourceTypes = [...new Set(model.eligible.map((publication) => publication.source_type || 'Unknown'))].sort((a, b) => a.localeCompare(b, 'en'));
  const sourceRows = model.eligible.map(sourceRow).join('\n');
  const downloads = DOWNLOADS.map(([filename, label, subtitle]) => {
    const download = /\.(?:csv|json|tsv|sqlite|xlsx)$/.test(filename) ? ' download' : '';
    return `          <a href="/ai-attack-statistics/data/${escapeHtml(filename)}"${download}><strong>${escapeHtml(label)}</strong><span>${escapeHtml(subtitle)}</span></a>`;
  }).join('\n');
  const structured = structuredData(model, description, metadata.published, modified);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://1200km.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <script src="/assets/theme-bootstrap.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI in Cyberattacks — Interactive Statistical CTI Dashboard | 1200km</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="Andrey Pautov" />
    <meta name="ai-dashboard-data-manifest-sha256" content="${dataHash}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <meta name="theme-color" content="#07101f" />
    <meta property="og:title" content="AI in Cyberattacks: Interactive Statistical CTI Dashboard" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://1200km.com/ai-attack-statistics/dashboard/" />
    <meta property="og:site_name" content="1200km — Andrey Pautov Security Research" />
    <meta property="og:image" content="https://1200km.com/assets/cti/ai-in-cyberattacks-statistical-study/cover.png" />
    <meta property="og:image:width" content="1672" />
    <meta property="og:image:height" content="941" />
    <meta property="og:image:alt" content="AI in Cyberattacks: A Statistical CTI Study" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="AI in Cyberattacks: Interactive Statistical CTI Dashboard" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="https://1200km.com/assets/cti/ai-in-cyberattacks-statistical-study/cover.png" />
    <link rel="canonical" href="https://1200km.com/ai-attack-statistics/dashboard/" />
    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />
    <link rel="alternate" type="text/plain" href="/llms.txt" />
    <link rel="icon" href="/assets/ap-logo.png" type="image/png" />
    <link rel="preload" as="image" href="/assets/cti/ai-in-cyberattacks-statistical-study/cover.webp" type="image/webp" fetchpriority="high" />
    <link rel="stylesheet" href="/assets/ai-attack-statistics/dashboard.css" />
    <link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default" />
    <meta property="article:published_time" content="${escapeHtml(metadata.published)}" />
    <meta property="article:modified_time" content="${escapeHtml(modified)}" />
    <script type="application/ld+json" data-site-graph>${JSON.stringify(structured, null, 2).replace(/<\//g, '<\\/')}</script>
  </head>
  <body id="top">
    <header class="site-header"><nav class="nav" aria-label="Primary navigation"><a class="brand" href="/">Andrey Pautov</a></nav></header>
    <main class="dashboard-shell" data-pagefind-body id="main-content">
      <section class="hero" aria-labelledby="dashboard-title">
        <div class="hero-copy">
          <p class="eyebrow">Statistical CTI research · ${yearRange} · Dataset generated ${escapeHtml(displayDate(modified))}</p>
          <h1 id="dashboard-title">AI in Cyberattacks: Interactive Statistical CTI Dashboard</h1>
          <p class="hero-lead">Explore publication-level evidence about how attackers use AI. Every aggregate below is regenerated from the governed public exports and keeps its analytical denominator visible.</p>
          <div class="hero-actions"><a class="button primary" href="#overview">Open the dashboard</a><a class="button" href="#source-explorer">Explore the evidence set</a><a class="button" href="/ai-attack-statistics/">Read the full study</a></div>
          <nav class="section-nav" aria-label="Dashboard sections"><a href="#overview">Overview</a><a href="#behavior">Behaviors</a><a href="#entities">Entities</a><a href="#evidence">Evidence</a><a href="#cross">Cross-analysis</a><a href="#source-explorer">Publications</a><a href="#downloads">Downloads</a></nav>
        </div>
        <picture class="hero-cover"><source srcset="/assets/cti/ai-in-cyberattacks-statistical-study/cover.webp" type="image/webp" /><img src="/assets/cti/ai-in-cyberattacks-statistical-study/cover.png" alt="AI in Cyberattacks: A Statistical CTI Study cover" width="1672" height="941" fetchpriority="high" decoding="async" /></picture>
      </section>

      <aside class="interpretation-notice" aria-label="Interpretation warning"><strong>Read this before interpreting the charts.</strong> A publication can contain many tags; one incident can appear in several publications; and one report can cover several incidents. Publication-coverage percentages use the ${eligibleCount} eligible publications except Disposition, which uses all ${publicationCount} publication entities. Co-mention cells identify research leads—not verified semantic relationships. Explorer filters affect only the publication table; aggregate charts remain the fixed published snapshot.</aside>

      <section class="dashboard-lineage" aria-label="Corpus denominator lineage"><div><strong>${model.summary.source_records}</strong><span>retrieved source records</span></div><span aria-hidden="true">→</span><div><strong>${publicationCount}</strong><span>deduplicated publication entities</span></div><span aria-hidden="true">→</span><div><strong>${usableCount}</strong><span>usable indexed references</span></div><span aria-hidden="true">→</span><div><strong>${eligibleCount}</strong><span>primary analytical denominator</span></div></section>

      <section class="research-paths" aria-labelledby="research-paths-title"><div class="section-heading"><p class="eyebrow">Integrated research workflow</p><h2 id="research-paths-title">Move from statistical signal to evidence and detection</h2></div><div class="path-grid"><a class="path-card" href="/ai-attack-statistics/"><span>01 · Interpret</span><strong>Full statistical study</strong><small>Methods, findings, limitations, and defensible conclusions.</small></a><a class="path-card" href="/references/"><span>02 · Validate</span><strong>Reference intelligence library</strong><small>Search ${usableCount} usable references and their correlation tags.</small></a><a class="path-card" href="/cyber-knowledge/ai-security.html"><span>03 · Contextualize</span><strong>AI security knowledge map</strong><small>Connect adversarial AI usage to controls, models, and security concepts.</small></a><a class="path-card" href="/newest-detection-engineering-techniques/"><span>04 · Operationalize</span><strong>Detection engineering</strong><small>Translate CTI hypotheses into telemetry, validation, and durable detections.</small></a></div></section>

    <section id="overview" class="dashboard-section" aria-labelledby="overview-title">
      <h2 class="section-title" id="overview-title">Executive dashboard</h2>
      <p class="section-subtitle">Corpus composition, publication timing, source classes, and publisher coverage.</p>
      <div class="kpis" aria-label="Research summary metrics"><div class="kpi"><div class="value">${publicationCount.toLocaleString('en-US')}</div><div class="label">publication entities</div></div><div class="kpi"><div class="value">${eligibleCount.toLocaleString('en-US')}</div><div class="label">eligible publications</div></div><div class="kpi"><div class="value">${model.summary.eligible_tags.toLocaleString('en-US')}</div><div class="label">eligible tag mentions</div></div><div class="kpi"><div class="value">${model.summary.eligible_metrics.toLocaleString('en-US')}</div><div class="label">eligible metric mentions</div></div><div class="kpi"><div class="value">${model.summary.eligible_iocs.toLocaleString('en-US')}</div><div class="label">eligible IOC mentions</div></div><div class="kpi"><div class="value">31</div><div class="label">dashboard widgets</div></div></div>
      <div class="grid">
${overviewWidgets}
      </div>
    </section>

${sections}

    <section id="cross" class="dashboard-section" aria-labelledby="cross-title">
      <h2 class="section-title" id="cross-title">Cross-dimensional research leads</h2>
      <p class="section-subtitle">Co-mentions are document-level intersections. They do not establish causality, attribution, targeting, victim location, or confirmed tool use.</p>
      <div class="grid">
${heatmaps}
      </div>
    </section>

    <section id="source-explorer" class="dashboard-section" aria-labelledby="source-explorer-title">
      <h2 class="section-title" id="source-explorer-title">Eligible publication explorer</h2>
      <p class="section-subtitle">All ${eligibleCount} primary-denominator records are server rendered. JavaScript progressively adds local filtering; no data is sent off-site.</p>
      <div class="panel source-panel">
        <div class="controls" role="search" aria-label="Filter eligible publications"><div class="control-field control-search"><label for="source-search">Search evidence</label><input id="source-search" type="search" maxlength="200" autocomplete="off" placeholder="Title, publisher, actor, sector, use case, provider…" /></div><div class="control-field"><label for="source-publisher">Publisher</label><select id="source-publisher">${renderOptions(publishers, 'publishers')}</select></div><div class="control-field"><label for="source-year">Publication year</label><select id="source-year">${renderOptions(years, 'years')}</select></div><div class="control-field"><label for="source-type">Source type</label><select id="source-type">${renderOptions(sourceTypes, 'source types', titleCase)}</select></div><button id="source-reset" type="button">Clear filters</button></div>
        <p id="source-count" class="source-status" role="status" aria-live="polite">${eligibleCount} of ${eligibleCount} eligible publications</p>
        <noscript><p class="no-script-note">Filtering requires JavaScript. The complete ${eligibleCount}-publication table remains available below.</p></noscript>
        <div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable eligible-publication table"><table class="sources"><caption>Evidence-eligible publications about AI usage in cyberattacks</caption><thead><tr><th scope="col">Date</th><th scope="col">Publisher</th><th scope="col">Publication</th><th scope="col">AI use cases</th><th scope="col">Sectors / groups / providers</th><th scope="col">Tags</th><th scope="col">Metrics</th><th scope="col">IOCs</th></tr></thead><tbody id="source-body">
${sourceRows}
              <tr id="source-empty" hidden><td colspan="8">No publications match the current filters.</td></tr>
            </tbody></table></div>
      </div>
    </section>

      <section id="downloads" class="downloads" aria-labelledby="downloads-title"><div class="section-heading"><p class="eyebrow">Reproducible research</p><h2 id="downloads-title">Download the published dataset</h2><p>Use the publication table for analysis-ready records and the long-form tables for reproducible aggregation. Candidate tags, metrics, and IOCs remain analyst-review inputs rather than validated operational intelligence. Review the <a href="/ai-attack-statistics/data/">governed dataset landing page</a> for schemas, provenance, file sizes, spreadsheet safeguards, and interpretation limits.</p></div><div class="download-grid">
${downloads}
        </div></section>

      <section class="related-research" aria-labelledby="related-research-title"><div class="section-heading"><p class="eyebrow">Continue the investigation</p><h2 id="related-research-title">Connected 1200km research</h2></div><div class="related-grid"><a href="/cti.html"><strong>CTI research hub</strong><span>Browse threat intelligence projects and field research.</span></a><a href="/operation-desert-hydra/"><strong>Operation Desert Hydra</strong><span>Apply CTI evidence and ATT&amp;CK mapping to a campaign workflow.</span></a><a href="/adversarygraph/"><strong>AdversaryGraph</strong><span>Turn reports, IOCs, and ATT&amp;CK context into investigations and detection gaps.</span></a><a href="/newest-detection-engineering-techniques/"><strong>Detection engineering techniques</strong><span>Build evidence-backed telemetry and validation loops.</span></a></div></section>
    </main>
    <footer><div><a href="/">1200km.com</a> · <a href="mailto:1200km@gmail.com">1200km@gmail.com</a></div></footer>
    <script src="/assets/ai-attack-statistics/dashboard.js" defer></script>
    <script src="/assets/site-theme.js?v=20260904-light-default" defer></script>
  </body>
</html>`;
}

const model = loadModel();
const dataHash = manifestHash();
const generated = dashboardPage(model, dataHash);
const shell = loadSiteShell(ROOT);
const pageConfig = shell.pages.find((item) => item.path === 'ai-attack-statistics/dashboard/index.html');
if (!pageConfig) throw new Error('data/site-shell.json is missing ai-attack-statistics/dashboard/index.html');
const output = `${applyPlatformSidebar(
  applySiteShell(generated, shell, pageConfig),
  shell,
  { pathname: '/ai-attack-statistics/dashboard/' },
).trim()}\n`;

if (check) {
  const current = readFileSync(OUTPUT, 'utf8');
  if (!current.includes(`<meta name="ai-dashboard-data-manifest-sha256" content="${dataHash}"`)) {
    throw new Error('AI-attack dashboard data manifest is stale; run npm run build-ai-attack-study.');
  }
  const widgetCount = (current.match(/data-dashboard-widget=/g) || []).length;
  const sourceCount = (current.match(/data-dashboard-source(?:\s|>)/g) || []).length;
  if (widgetCount !== 31) throw new Error(`AI-attack dashboard has ${widgetCount} widgets; expected 31.`);
  if (sourceCount !== model.eligible.length) {
    throw new Error(`AI-attack dashboard has ${sourceCount} source rows; expected ${model.eligible.length}.`);
  }
  console.log(`Validated deterministic AI-attack dashboard (${widgetCount} widgets; ${sourceCount} eligible source rows).`);
} else {
  writeFileSync(OUTPUT, output);
  console.log(`Generated deterministic AI-attack dashboard (31 widgets; ${model.eligible.length} eligible source rows).`);
}
