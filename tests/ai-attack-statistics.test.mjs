import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { transformHtmlElements } from '../scripts/html-token-utils.mjs';
import { decodeEntities, tagAttributes } from '../scripts/release-html-lib.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = readFileSync(join(ROOT, 'ai-attack-statistics', 'dashboard', 'index.html'), 'utf8');
const articleHtml = readFileSync(join(ROOT, 'ai-attack-statistics', 'index.html'), 'utf8');
const dataHtml = readFileSync(join(ROOT, 'ai-attack-statistics', 'data', 'index.html'), 'utf8');
const articleSource = readFileSync(join(ROOT, 'research', 'ai-attack-statistics', 'article.md'), 'utf8');
const referencesHtml = readFileSync(join(ROOT, 'references', 'index.html'), 'utf8');
const client = readFileSync(join(ROOT, 'assets', 'ai-attack-statistics', 'dashboard.js'), 'utf8');
const styles = readFileSync(join(ROOT, 'assets', 'ai-attack-statistics', 'dashboard.css'), 'utf8');
const articleStyles = readFileSync(join(ROOT, 'assets', 'ai-attack-statistics-article.css'), 'utf8');
const mediumEditionUrl = 'https://medium.com/@1200km/ai-in-cyberattacks-a-statistical-cti-study-of-114-publications-b8416d856b94';
const dataStyles = readFileSync(join(ROOT, 'assets', 'ai-attack-statistics-data.css'), 'utf8');
const dataDirectory = join(ROOT, 'ai-attack-statistics', 'data');
const studyAssetDirectory = join(ROOT, 'assets', 'cti', 'ai-in-cyberattacks-statistical-study');

const count = (pattern, value = html) => (value.match(pattern) || []).length;

const parseCsvRecords = (text) => {
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
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value !== '')) rows.push(row);
  }

  const header = rows.shift();
  return rows.map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index]])));
};

const summary = JSON.parse(readFileSync(join(dataDirectory, 'summary.json'), 'utf8'));
const publicationRecords = parseCsvRecords(readFileSync(join(dataDirectory, 'publications.csv'), 'utf8'));
const eligibleRecords = publicationRecords.filter((record) => record.analysis_inclusion === 'include_with_manual_validation');
const eligibleIds = new Set(eligibleRecords.map((record) => record.publication_id));
const publicationCount = summary.unique_publications;
const eligibleCount = summary.analysis_eligible_publications;
const usableReferenceCount = eligibleCount + summary.context_only_publications;
const articleDescription = articleSource.match(/^description:\s*["'](.+)["']\s*$/m)?.[1];

test('dashboard publishes professional metadata at the canonical nested route', () => {
  assert.match(html, /<title>AI in Cyberattacks — Interactive Statistical CTI Dashboard \| 1200km<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/1200km\.com\/ai-attack-statistics\/dashboard\/" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/1200km\.com\/ai-attack-statistics\/dashboard\/" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/1200km\.com\/assets\/cti\/ai-in-cyberattacks-statistical-study\/cover\.png" \/>/);
  assert.match(html, /<meta property="og:image:width" content="1672" \/>/);
  assert.match(html, /<meta property="og:image:height" content="941" \/>/);
  assert.ok(html.includes(`${eligibleCount} eligible publications`));
  assert.match(html, /data-pagefind-body/);
  assert.equal(count(/<h1\b/g), 1);
  assert.match(html, /Statistical CTI research · 2022–2026 · Dataset generated/);
  assert.match(html, /<nav class="section-nav" aria-label="Dashboard sections">/);
  assert.doesNotMatch(html, /Statistical CTI research · 0–/);
  assert.match(html, /<script type="application\/ld\+json" data-site-graph>/);
  assert.match(html, /"@type": "Dataset"/);
  assert.match(html, /"@type": "CollectionPage"/);

  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/s)?.[1];
  assert.equal(description, `Explore 31 CTI views and ${eligibleCount} eligible publications on attacker AI use across actors, sectors, behaviors, providers, metrics, and IOC candidates.`);
  assert.ok(description.length <= 155, `dashboard description length: ${description.length}`);
  assert.doesNotMatch(description, /…/);
  assert.match(html, /rel="preload" as="image" href="\/assets\/cti\/ai-in-cyberattacks-statistical-study\/cover\.webp" type="image\/webp"/);
  assert.doesNotMatch(html, /rel="preload" as="image" href="[^"]*cover\.png"/);
  assert.match(html, /<aside class="page-sidenav platform-sidenav" id="platform-sidenav"/);
  assert.match(html, /href="\/assets\/platform-sidebar\.css\?v=20260830-1"/);
  assert.match(html, /src="\/assets\/platform-sidebar\.js\?v=20260830-1"/);
});

test('dataset landing page governs all public downloads at a canonical route', () => {
  assert.match(dataHtml, /<title>AI in Cyberattacks Dataset &amp; Downloads \| 1200km<\/title>/);
  assert.match(dataHtml, /<link rel="canonical" href="https:\/\/1200km\.com\/ai-attack-statistics\/data\/" \/>/);
  assert.match(dataHtml, /data-pagefind-body/);
  assert.equal(count(/<h1\b/g, dataHtml), 1);
  assert.match(dataHtml, /<meta name="ai-study-data-manifest-sha256" content="[a-f0-9]{64}"/);
  assert.match(dataHtml, /href="\/ai-attack-statistics\/"/);
  assert.match(dataHtml, /href="\/ai-attack-statistics\/dashboard\/"/);
  assert.match(dataHtml, /href="\/references\/"/);

  const structuredDocuments = [...dataHtml.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const nodes = structuredDocuments.flatMap((document) => document['@graph'] || [document]);
  const dataset = nodes.find((node) => node['@type'] === 'Dataset');
  assert.ok(dataset, 'dataset landing schema');
  assert.equal(dataset['@id'], 'https://1200km.com/ai-attack-statistics/data/#dataset');
  assert.equal(dataset.url, 'https://1200km.com/ai-attack-statistics/data/');
  assert.equal(dataset.distribution.length, 12);

  for (const filename of [
    'README.md', 'publications.csv', 'tags_long.csv', 'metrics_long.csv', 'iocs_long.csv', 'quality.csv',
    'summary.json', 'tag_dictionary.csv', 'ai_attack_statistics.sqlite', 'ai_attack_statistics.xlsx',
    'source-collection-report.md', 'source-uniqueness-report.tsv',
  ]) {
    assert.match(dataHtml, new RegExp(`href="/ai-attack-statistics/data/${filename.replaceAll('.', '\\.') }"`), filename);
  }
  assert.match(dataStyles, /\.ai-data-table:focus-visible/);
  assert.match(dataStyles, /body\s*\{\s*margin:\s*0;/s);
  assert.match(dataStyles, /@media \(max-width: 620px\)/);
  assert.match(dataHtml, /<aside class="page-sidenav platform-sidenav" id="platform-sidenav"/);
});

test('all 31 widgets and every eligible publication are server rendered from the current snapshot', () => {
  assert.equal(count(/data-dashboard-widget="bar"/g), 26);
  assert.equal(count(/data-dashboard-widget="heatmap"/g), 5);
  assert.equal(count(/data-dashboard-widget=/g), 31);
  assert.equal(count(/data-dashboard-source(?:\s|>)/g), eligibleCount);
  assert.equal(new Set([...html.matchAll(/data-record-id="([^"]+)"/g)].map((match) => match[1])).size, eligibleCount);
  assert.equal(count(/<table class="heat">/g), 5);
  assert.equal(count(/<meter class="bar-meter"/g) > 150, true);
  assert.doesNotMatch(html, /generation-placeholder/);

  for (const required of [
    publicationCount.toLocaleString('en-US'),
    eligibleCount.toLocaleString('en-US'),
    summary.eligible_tags.toLocaleString('en-US'),
    summary.eligible_metrics.toLocaleString('en-US'),
    summary.eligible_iocs.toLocaleString('en-US'),
    'Identity fraud and impersonation',
    'Initial Access',
    'APT28 / Fancy Bear',
    'Government',
    'OpenAI',
    'In-the-wild observed',
    'CVE-2024-3400',
  ]) {
    assert.ok(html.includes(required), required);
  }

  assert.ok(html.includes(`<p id="source-count" class="source-status" role="status" aria-live="polite">${eligibleCount} of ${eligibleCount} eligible publications</p>`));
  assert.ok(html.includes(`Filtering requires JavaScript. The complete ${eligibleCount}-publication table remains available below.`));
  assert.ok(html.includes(`<strong>${summary.source_records}</strong><span>retrieved source records</span>`));
  assert.ok(html.includes(`<strong>${publicationCount}</strong><span>deduplicated publication entities</span>`));
  assert.ok(html.includes(`<strong>${usableReferenceCount}</strong><span>usable indexed references</span>`));
});

test('dashboard meters encode the stated publication denominators', () => {
  const panels = [...html.matchAll(/<article class="panel(?: wide)?" data-dashboard-widget="bar" data-widget-name="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.equal(panels.length, 26);

  for (const [panel, widgetName] of panels) {
    const meters = [...panel.matchAll(/<meter class="bar-meter"[^>]*>/g)].map((match) => match[0]);
    if (widgetName === 'Unique IOC candidates') continue;
    const expectedDenominator = widgetName === 'Disposition' ? publicationCount : eligibleCount;
    for (const meter of meters) {
      assert.match(meter, new RegExp(`of ${expectedDenominator} publications`), meter);
      assert.match(meter, new RegExp(`\\bmax="${expectedDenominator}"`), meter);
    }
  }

  const eligibleIocs = parseCsvRecords(readFileSync(join(dataDirectory, 'iocs_long.csv'), 'utf8'))
    .filter((record) => eligibleIds.has(record.publication_id));
  const iocValues = new Map();
  for (const record of eligibleIocs) {
    if (!iocValues.has(record.ioc_type)) iocValues.set(record.ioc_type, new Set());
    iocValues.get(record.ioc_type).add(record.value.toLocaleLowerCase('en'));
  }
  const uniqueIocCount = [...iocValues.values()].reduce((total, values) => total + values.size, 0);
  const maximum = Math.max(...[...iocValues.values()].map((values) => values.size));
  const iocPanel = panels.find(([, widgetName]) => widgetName === 'Unique IOC candidates')?.[0];
  assert.ok(iocPanel, 'unique IOC widget');
  assert.equal(count(/unique candidates/g, iocPanel), iocValues.size);
  assert.match(iocPanel, new RegExp(`${uniqueIocCount} unique typed values from ${summary.eligible_iocs} eligible IOC mentions`));
  for (const meter of iocPanel.matchAll(/<meter class="bar-meter"[^>]*>/g)) {
    assert.match(meter[0], new RegExp(`\\bmax="${maximum}"`), meter[0]);
  }
});

test('every rendered bar and heatmap value is recalculated from the sanitized long-form exports', () => {
  const eligibleTags = parseCsvRecords(readFileSync(join(dataDirectory, 'tags_long.csv'), 'utf8'))
    .filter((record) => eligibleIds.has(record.publication_id));
  const eligibleMetrics = parseCsvRecords(readFileSync(join(dataDirectory, 'metrics_long.csv'), 'utf8'))
    .filter((record) => eligibleIds.has(record.publication_id));
  const eligibleIocs = parseCsvRecords(readFileSync(join(dataDirectory, 'iocs_long.csv'), 'utf8'))
    .filter((record) => eligibleIds.has(record.publication_id));
  const decodeHtml = (value) => decodeEntities(value);
  const titleCase = (value) => {
    const special = new Map([
      ['operational_cti', 'Operational CTI'], ['ipv4', 'IPv4'], ['md5', 'MD5'],
      ['sha1', 'SHA-1'], ['sha256', 'SHA-256'],
    ]);
    return special.get(value.toLocaleLowerCase('en'))
      || value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  };
  const add = (map, key, publicationId) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(publicationId);
  };
  const ranked = (map, labels = new Map(), limit = Infinity) => [...map]
    .map(([key, values]) => ({ key, label: labels.get(key) || titleCase(key), value: values instanceof Set ? values.size : values }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, 'en'))
    .slice(0, limit);

  const coverage = new Map();
  const labels = new Map();
  const publicationTags = new Map();
  for (const record of eligibleTags) {
    const key = record.normalized_value || record.value;
    if (!coverage.has(record.tag_type)) coverage.set(record.tag_type, new Map());
    if (!labels.has(record.tag_type)) labels.set(record.tag_type, new Map());
    add(coverage.get(record.tag_type), key, record.publication_id);
    if (!labels.get(record.tag_type).has(key)) labels.get(record.tag_type).set(key, record.value || key);
    if (!publicationTags.has(record.publication_id)) publicationTags.set(record.publication_id, new Map());
    if (!publicationTags.get(record.publication_id).has(record.tag_type)) publicationTags.get(record.publication_id).set(record.tag_type, new Set());
    publicationTags.get(record.publication_id).get(record.tag_type).add(key);
  }

  const expected = new Map();
  const dispositions = new Map();
  for (const record of publicationRecords) add(dispositions, record.analysis_inclusion, record.publication_id);
  expected.set('Disposition', ranked(dispositions, new Map([
    ['include_with_manual_validation', 'Eligible for primary analysis'],
    ['context_only', 'Context only'],
    ['exclude', 'Excluded — broken source'],
    ['exclude_non_ai', 'Excluded — non-AI'],
  ])));
  for (const [name, field, limit] of [
    ['Publication year', 'publication_year', Infinity],
    ['Source type', 'source_type', Infinity],
    ['Publisher', 'publisher', 15],
  ]) {
    const values = new Map();
    for (const record of eligibleRecords) add(values, record[field] || 'Unknown', record.publication_id);
    expected.set(name, ranked(values, new Map([...values.keys()].map((key) => [key, name === 'Publisher' ? key : titleCase(key)])), limit));
  }
  for (const [name, type, limit] of [
    ['AI use case', 'ai_use_case', 15], ['AI technology', 'ai_technology', 6],
    ['Kill Chain', 'kill_chain_phase', 7], ['ATT&CK tactic', 'mitre_tactic', 14],
    ['TTP', 'ttp', 15], ['Attack vector', 'attack_vector', 8], ['Threat group', 'threat_group', 15],
    ['Sector', 'sector', 15], ['Country / region', 'country_or_region', 15], ['Target persona', 'target', 6],
    ['LLM provider', 'llm_provider', 9], ['LLM model', 'llm_model', 9],
    ['Malicious-AI tool', 'malicious_ai_tool', 7], ['Malware / tool', 'malware_or_tool', 15],
    ['Infrastructure', 'infrastructure', 8], ['Data type', 'data_type', 7], ['Impact', 'impact', 6],
    ['Actor motivation', 'actor_motivation', 5], ['Evidence landscape', 'evidence_landscape', 8], ['CVE', 'cve', 12],
  ]) expected.set(name, ranked(coverage.get(type) || new Map(), labels.get(type), limit));

  const metricCoverage = new Map();
  for (const record of eligibleMetrics) add(metricCoverage, record.metric_type, record.publication_id);
  expected.set('Metric coverage', ranked(metricCoverage, new Map(), 7));
  const iocValues = new Map();
  for (const record of eligibleIocs) {
    if (!iocValues.has(record.ioc_type)) iocValues.set(record.ioc_type, new Set());
    iocValues.get(record.ioc_type).add(record.value.toLocaleLowerCase('en'));
  }
  expected.set('Unique IOC candidates', ranked(iocValues, new Map(), 5));

  const barPanels = new Map([...html.matchAll(/<article class="panel" data-dashboard-widget="bar" data-widget-name="([^"]+)"[\s\S]*?<\/article>/g)]
    .map((match) => [decodeHtml(match[1]), match[0]]));
  assert.equal(barPanels.size, expected.size);
  for (const [name, series] of expected) {
    const panel = barPanels.get(name);
    assert.ok(panel, `bar widget: ${name}`);
    const actual = [...panel.matchAll(/<div class="bar-label" title="([^"]+)">[\s\S]*?<meter class="bar-meter"[^>]*\bvalue="(\d+)"/g)]
      .map((match) => ({ label: decodeHtml(match[1]), value: Number(match[2]) }));
    assert.deepEqual(actual, series.map(({ label, value }) => ({ label, value })), name);
  }

  for (const [name, rowType, columnType] of [
    ['Sector × AI use case', 'sector', 'ai_use_case'],
    ['Threat group × AI use case', 'threat_group', 'ai_use_case'],
    ['Kill Chain × AI use case', 'kill_chain_phase', 'ai_use_case'],
    ['Provider × AI use case', 'llm_provider', 'ai_use_case'],
    ['Sector × country / region', 'sector', 'country_or_region'],
  ]) {
    const panel = [...html.matchAll(/<article class="panel wide" data-dashboard-widget="heatmap" data-widget-name="([^"]+)"[\s\S]*?<\/article>/g)]
      .find((match) => decodeHtml(match[1]) === name)?.[0];
    assert.ok(panel, `heatmap widget: ${name}`);
    const rendered = new Map([...panel.matchAll(/<td class="heat-level-\d" title="([^"]+)"[^>]*>(\d+)<\/td>/g)]
      .map((match) => [decodeHtml(match[1]), Number(match[2])]));
    const rows = ranked(coverage.get(rowType) || new Map(), labels.get(rowType), 10);
    const columns = ranked(coverage.get(columnType) || new Map(), labels.get(columnType), 10);
    assert.equal(rendered.size, rows.length * columns.length, name);
    for (const row of rows) {
      for (const column of columns) {
        const value = eligibleRecords.reduce((total, publication) => {
          const tags = publicationTags.get(publication.publication_id);
          return total + Number(Boolean(tags?.get(rowType)?.has(row.key) && tags?.get(columnType)?.has(column.key)));
        }, 0);
        const key = `${row.label} × ${column.label}: ${value} eligible publications`;
        assert.equal(rendered.get(key), value, `${name}: ${key}`);
      }
    }
  }
});

test('publication records are escaped and outbound source links are hardened', () => {
  assert.match(html, /Prompts as Code &amp; Embedded Keys \| The Hunt for LLM-Enabled Malware/);
  assert.match(html, /2024 Threat Analysis and 2025 Predictions │ Recorded Future Annual Threat Report/);

  const rows = [...html.matchAll(/<tr data-dashboard-source[\s\S]*?<\/tr>/g)].map((match) => match[0]);
  assert.equal(rows.length, eligibleCount);
  for (const row of rows) {
    assert.match(row, /<a href="https:\/\//);
    assert.match(row, /target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(row, /javascript:/i);
    assert.doesNotMatch(row, /<script/i);
  }
});

test('CSP uses same-origin external assets and allows no inline executable code', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
  assert.ok(csp, 'CSP meta tag');
  assert.match(csp, /script-src[^;]*'self'/);
  assert.match(csp, /script-src[^;]*'wasm-unsafe-eval'/);
  assert.match(csp, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.match(csp, /style-src 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(html, /href="\/assets\/ai-attack-statistics\/dashboard\.css"/);
  assert.match(html, /src="\/assets\/ai-attack-statistics\/dashboard\.js" defer/);
  assert.doesNotMatch(html, /<style\b/i);
  assert.doesNotMatch(html, /\sstyle="/i);
  assert.doesNotMatch(html, /\son[a-z]+="/i);
  assert.doesNotMatch(html, /javascript:/i);

  const scripts = [];
  transformHtmlElements(html, 'script', (element) => {
    scripts.push(element);
    return element.full;
  });
  assert.ok(scripts.length >= 4);
  for (const script of scripts) {
    const attributes = tagAttributes(script.openTag);
    if ((attributes.type || '').toLowerCase() === 'application/ld+json') continue;
    assert.ok((attributes.src || '').startsWith('/'), script.openTag);
    assert.equal(script.content.trim(), '', script.openTag);
  }
});

test('dashboard is fully crosslinked into the research and defensive ecosystem', () => {
  for (const href of [
    '/ai-attack-statistics/',
    '/references/',
    '/cyber-knowledge/ai-security.html',
    '/cti.html',
    '/newest-detection-engineering-techniques/',
    '/operation-desert-hydra/',
    '/adversarygraph/',
  ]) {
    assert.match(html, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), href);
  }

  for (const filename of [
    'README.md',
    'publications.csv',
    'tags_long.csv',
    'metrics_long.csv',
    'iocs_long.csv',
    'quality.csv',
    'summary.json',
    'tag_dictionary.csv',
    'ai_attack_statistics.sqlite',
    'ai_attack_statistics.xlsx',
    'source-collection-report.md',
    'source-uniqueness-report.tsv',
  ]) {
    assert.match(html, new RegExp(`href="/ai-attack-statistics/data/${filename.replaceAll('.', '\\.')}"`), filename);
  }
});

test('controls progressively enhance the complete static evidence table without HTML injection sinks', () => {
  for (const control of ['source-search', 'source-publisher', 'source-year', 'source-type', 'source-reset']) {
    assert.match(html, new RegExp(`id="${control}"`), control);
  }

  for (const token of [
    'data-dashboard-source',
    'dataset.search',
    'dataset.publisher',
    'dataset.year',
    'dataset.sourceType',
    'URLSearchParams',
    'history.replaceState',
    'addEventListener',
    'textContent',
    'row.hidden',
    'aria-live',
  ]) {
    const target = token === 'aria-live' ? html : client;
    assert.ok(target.includes(token), token);
  }

  assert.doesNotMatch(client, /\.innerHTML\b/);
  assert.doesNotMatch(client, /insertAdjacentHTML/);
  assert.doesNotMatch(client, /document\.write/);
  assert.doesNotMatch(client, /\beval\s*\(/);
  assert.match(styles, /\.heat-level-9/);
  assert.match(styles, /\.bar-meter::-(?:webkit-meter-optimum-value|moz-meter-bar)/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /@media print/);
  assert.match(styles, /\.heat-level-9 \{ background: #66102f; color: #fff; \}/);
  assert.match(styles, /\.heat td\.heat-level-9[\s\S]*?color: #fff !important;/);
});

test('long-form article publishes the exact cover and complete 31-figure visual study', () => {
  const sourceHash = createHash('sha256').update(articleSource).digest('hex');
  assert.match(articleHtml, new RegExp(`<meta name="ai-study-source-sha256" content="${sourceHash}"`));
  const expectedDescription = articleDescription;
  assert.ok(expectedDescription, 'article source description');
  const description = articleHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/s)?.[1];
  assert.equal(description, expectedDescription);
  assert.ok(articleSource.includes(`description: "${expectedDescription}"`));
  assert.ok(description.length <= 155, `article description length: ${description.length}`);
  assert.doesNotMatch(description, /…|\.\.\.$/);
  assert.equal(count(/<h1\b/g, articleHtml), 1);
  const tableRegions = [...articleHtml.matchAll(/<div class="ai-study-table-wrap"[^>]*>/g)].map((match) => match[0]);
  assert.ok(tableRegions.length >= 5);
  for (const region of tableRegions) {
    assert.match(region, /tabindex="0"/);
    assert.match(region, /role="region"/);
    assert.match(region, /aria-label="[^"]+"/);
  }
  assert.match(articleStyles, /\.ai-study-table-wrap:focus-visible/);
  assert.match(articleHtml, /<aside class="page-sidenav platform-sidenav" id="platform-sidenav"/);
  assert.match(articleHtml, /<source srcset="\/assets\/cti\/ai-in-cyberattacks-statistical-study\/cover\.webp" type="image\/webp" \/>/);
  assert.match(articleHtml, /<img class="ai-study-cover" src="\/assets\/cti\/ai-in-cyberattacks-statistical-study\/cover\.png"/);

  const coverPng = readFileSync(join(studyAssetDirectory, 'cover.png'));
  const coverHash = createHash('sha256').update(coverPng).digest('hex');
  assert.equal(coverHash, '885ff7fda038a823b7a5072452123150a07a17c0208fdd8d85e2e01c73f5eb1e');
  assert.ok(existsSync(join(studyAssetDirectory, 'cover.webp')));

  const figureSources = [...articleHtml.matchAll(/<figure class="ai-study-figure">\s*<img src="(\/assets\/cti\/ai-in-cyberattacks-statistical-study\/visualizations\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(figureSources.length, 31);
  assert.equal(new Set(figureSources).size, 31);
  for (const source of figureSources) {
    assert.ok(existsSync(join(ROOT, source.slice(1))), source);
  }
});

test('article narrative counts remain bound to the eligible publication snapshot', () => {
  const tags = parseCsvRecords(readFileSync(join(dataDirectory, 'tags_long.csv'), 'utf8'))
    .filter((record) => eligibleIds.has(record.publication_id));
  const publicationCountFor = (tagType, normalizedValue) => new Set(
    tags
      .filter((record) => record.tag_type === tagType && record.normalized_value === normalizedValue)
      .map((record) => record.publication_id),
  ).size;
  const undated = eligibleRecords.filter((record) => !record.publication_year).length;

  const wordOrNumber = (value) => new Map([
    [1, 'one'], [2, 'two'], [3, 'three'], [4, 'four'], [5, 'five'], [6, 'six'], [7, 'seven'], [8, 'eight'], [9, 'nine'],
  ]).get(value) || String(value);
  const undatedLabel = wordOrNumber(undated);
  assert.match(articleSource, new RegExp(`${undatedLabel} eligible publications have no resolved year`));
  assert.match(articleSource, new RegExp(`agentic AI appears in ${publicationCountFor('ai_technology', 'Agentic AI')} publications`));
  assert.match(articleSource, new RegExp(`deepfake/synthetic media in ${publicationCountFor('ai_technology', 'Deepfake / synthetic media')}`));
  assert.match(articleSource, new RegExp(`Akira in ${wordOrNumber(publicationCountFor('threat_group', 'Akira'))}`));
  assert.match(articleSource, /\/references\/\?q=core_ai_attack&facet=MITRE\+tactic&tag=mitre-tactic%3Ainitial-access/);
  assert.match(articleSource, /\/references\/\?q=core_ai_attack&facet=LLM\+provider&tag=llm-provider%3Aopenai/);
});

test('article makes the denominator lineage explicit and its authored source ends with Follow My Work', () => {
  const lineage = [...articleHtml.matchAll(/ai-study-lineage__value">(\d+)<\/span>/g)].map((match) => match[1]);
  assert.deepEqual(lineage, [summary.source_records, publicationCount, usableReferenceCount, eligibleCount].map(String));
  assert.ok(articleHtml.includes(`${summary.source_records} retrieved records, ${publicationCount} deduplicated publications, ${usableReferenceCount} usable references, and ${eligibleCount} eligible publications`));

  const articleBody = articleHtml.match(/<article class="ai-study-article">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(articleBody, 'article source body');
  assert.match(articleBody, /<h2 id="follow-my-work">Follow My Work<\/h2>/);
  const sourceLevelTwoHeadings = [...articleSource.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  assert.equal(sourceLevelTwoHeadings.at(-1), 'Follow My Work');
  assert.match(articleSource, /private working records retain evidence spans and excerpts/);
  assert.match(articleSource, /public exports retain source IDs[\s\S]*intentionally omit copied excerpts and local archive paths/);
  assert.doesNotMatch(articleSource, /Each tag occurrence keeps an evidence span and quote/);
});

test('article structured data exposes both the TechArticle and reproducible Dataset', () => {
  const structuredDocuments = [...articleHtml.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const nodes = structuredDocuments.flatMap((document) => document['@graph'] || [document]);
  const nodeTypes = new Set(nodes.flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']]));
  assert.ok(nodeTypes.has('TechArticle'));
  assert.ok(nodeTypes.has('Dataset'));
  const article = nodes.find((node) => node['@type'] === 'TechArticle');
  assert.equal(article.description, articleDescription);
  assert.equal(article.sameAs, mediumEditionUrl);
  const dataset = nodes.find((node) => node['@type'] === 'Dataset');
  assert.equal(dataset['@id'], 'https://1200km.com/ai-attack-statistics/data/#dataset');
  assert.equal(dataset.url, 'https://1200km.com/ai-attack-statistics/data/');
  assert.ok(dataset.description.includes('116 retrieved records'));
  assert.equal(dataset.distribution.length >= 3, true);
});

test('article records the Medium snapshot without replacing the governed canonical edition', () => {
  assert.match(articleHtml, /<link rel="canonical" href="https:\/\/1200km\.com\/ai-attack-statistics\/" \/>/);
  assert.match(articleHtml, new RegExp(`href="${mediumEditionUrl}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`));
  assert.match(articleHtml, /Medium snapshot \(114\/106\)/);
  assert.match(articleHtml, /aria-label="Read the Medium snapshot edition with 114 publications and a 106-publication denominator"/);
});

test('article, dashboard, dataset, and reference library form a reciprocal research path', () => {
  assert.ok(articleHtml.includes('href="/ai-attack-statistics/dashboard/"'), 'article → dashboard');
  assert.ok(articleHtml.includes('href="/references/"'), 'article → references');
  assert.ok(articleHtml.includes('href="/ai-attack-statistics/data/"'), 'article → dataset');
  assert.ok(html.includes('href="/ai-attack-statistics/"'), 'dashboard → article');
  assert.ok(html.includes('href="/references/"'), 'dashboard → references');
  assert.ok(html.includes('href="/ai-attack-statistics/data/"'), 'dashboard → dataset');
  assert.ok(dataHtml.includes('href="/ai-attack-statistics/"'), 'dataset → article');
  assert.ok(dataHtml.includes('href="/ai-attack-statistics/dashboard/"'), 'dataset → dashboard');
  assert.ok(dataHtml.includes('href="/references/"'), 'dataset → references');
  assert.ok(referencesHtml.includes('href="/ai-attack-statistics/"'), 'references → article');
  assert.ok(referencesHtml.includes('href="/ai-attack-statistics/dashboard/"'), 'references → dashboard');
});

const parseCsvCells = (text) => {
  const cells = [];
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
    } else if (character === ',' || character === '\n') {
      cells.push(cell);
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  cells.push(cell);
  return cells;
};

const readZipEntries = (archive, predicate) => {
  const minimumEocdSize = 22;
  const maximumCommentSize = 65_535;
  let eocdOffset = -1;
  const searchFloor = Math.max(0, archive.length - minimumEocdSize - maximumCommentSize);

  for (let offset = archive.length - minimumEocdSize; offset >= searchFloor; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  assert.notEqual(eocdOffset, -1, 'XLSX ZIP end-of-central-directory record');
  const entryCount = archive.readUInt16LE(eocdOffset + 10);
  let centralOffset = archive.readUInt32LE(eocdOffset + 16);
  const entries = [];

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    assert.equal(archive.readUInt32LE(centralOffset), 0x02014b50, `central ZIP entry ${entryIndex}`);
    const compressionMethod = archive.readUInt16LE(centralOffset + 10);
    const compressedSize = archive.readUInt32LE(centralOffset + 20);
    const uncompressedSize = archive.readUInt32LE(centralOffset + 24);
    const filenameLength = archive.readUInt16LE(centralOffset + 28);
    const extraLength = archive.readUInt16LE(centralOffset + 30);
    const commentLength = archive.readUInt16LE(centralOffset + 32);
    const localOffset = archive.readUInt32LE(centralOffset + 42);
    const filename = archive.subarray(centralOffset + 46, centralOffset + 46 + filenameLength).toString('utf8');

    if (predicate(filename)) {
      assert.equal(archive.readUInt32LE(localOffset), 0x04034b50, `local ZIP entry ${filename}`);
      const localFilenameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localFilenameLength + localExtraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
      const content = compressionMethod === 0
        ? compressed
        : compressionMethod === 8
          ? inflateRawSync(compressed)
          : assert.fail(`Unsupported ZIP compression method ${compressionMethod} for ${filename}`);
      assert.equal(content.length, uncompressedSize, `${filename} uncompressed size`);
      entries.push({ filename, content });
    }

    centralOffset += 46 + filenameLength + extraLength + commentLength;
  }

  return entries;
};

test('public CSV and XLSX exports contain no spreadsheet-formula payloads', () => {
  const csvFiles = readdirSync(dataDirectory).filter((filename) => filename.endsWith('.csv')).sort();
  assert.deepEqual(csvFiles, [
    'iocs_long.csv',
    'metrics_long.csv',
    'publications.csv',
    'quality.csv',
    'tag_dictionary.csv',
    'tags_long.csv',
  ]);

  for (const filename of csvFiles) {
    const cells = parseCsvCells(readFileSync(join(dataDirectory, filename), 'utf8'));
    cells.forEach((cell, index) => {
      assert.doesNotMatch(cell, /^\s*[=+\-@]/, `${filename} cell ${index}: ${cell.slice(0, 80)}`);
    });
  }

  const workbook = readFileSync(join(dataDirectory, 'ai_attack_statistics.xlsx'));
  const worksheets = readZipEntries(workbook, (filename) => /^xl\/worksheets\/[^/]+\.xml$/.test(filename));
  assert.ok(worksheets.length > 0, 'XLSX worksheet XML entries');
  for (const { filename, content } of worksheets) {
    const worksheet = content.toString('utf8');
    assert.doesNotMatch(worksheet, /<f(?:[\s/>])/i, filename);
    const dimension = worksheet.match(/<dimension ref="([^"]+)"/i)?.[1];
    const autoFilter = worksheet.match(/<autoFilter ref="([^"]+)"/i)?.[1];
    if (autoFilter) assert.equal(autoFilter, dimension, `${filename} auto-filter range`);
  }
});

test('public downloads omit copied evidence excerpts and private archive paths', () => {
  const forbiddenColumns = /(?:^|,)(?:evidence_quote|local_files)(?:,|$)/;
  for (const filename of ['publications.csv', 'tags_long.csv', 'metrics_long.csv', 'iocs_long.csv']) {
    const text = readFileSync(join(dataDirectory, filename), 'utf8');
    const header = text.split(/\r?\n/, 1)[0];
    assert.doesNotMatch(header, forbiddenColumns, filename);
    assert.doesNotMatch(text, /(?:^|[,"|])sources\//m, `${filename} private archive path`);
  }

  const uniqueness = readFileSync(join(dataDirectory, 'source-uniqueness-report.tsv'), 'utf8');
  const uniquenessHeader = uniqueness.split(/\r?\n/, 1)[0];
  assert.doesNotMatch(uniquenessHeader, /(?:^|\t)file(?:\t|$)/);
  assert.match(uniquenessHeader, /(?:^|\t)confirmed_companion_group(?:\t|$)/);
  assert.doesNotMatch(uniqueness, /(?:^|\t)sources\//m);
  assert.doesNotMatch(uniqueness, /[ \t]+$/m);
  assert.match(uniqueness, /\tnone$/m);
  for (const [sourceId, group] of [
    ['src-004', 'dup-001'],
    ['src-099', 'dup-001'],
    ['src-019', 'dup-002'],
    ['src-039', 'dup-002'],
    ['src-023', 'dup-003'],
    ['src-080', 'dup-003'],
    ['src-049', 'dup-004'],
    ['src-053', 'dup-004'],
    ['src-094', 'dup-005'],
    ['src-093', 'dup-005'],
  ]) {
    assert.match(uniqueness, new RegExp(`^${sourceId}\\t[^\\n]*\\t${group}$`, 'm'));
  }

  const workbook = readFileSync(join(dataDirectory, 'ai_attack_statistics.xlsx'));
  const workbookXml = readZipEntries(workbook, (filename) => /^xl\/.*\.xml$/.test(filename))
    .map(({ content }) => content.toString('utf8'))
    .join('\n');
  assert.doesNotMatch(workbookXml, /evidence_quote|local_files|<t>sources\//);

  const sqlite = readFileSync(join(dataDirectory, 'ai_attack_statistics.sqlite')).toString('utf8');
  assert.doesNotMatch(sqlite, /evidence_quote|local_files|source_records/);

  const publicReadme = readFileSync(join(dataDirectory, 'README.md'), 'utf8');
  assert.match(publicReadme, /omit copied evidence excerpts and local archive paths/i);
  assert.match(publicReadme, /No open-data license is granted for this published snapshot\./);

  const referenceModel = JSON.parse(readFileSync(join(ROOT, 'data', 'ai-attack-reference-library.json'), 'utf8'));
  assert.equal(referenceModel.source_dataset, '/ai-attack-statistics/data/publications.csv');
});

test('public domain IOC candidates are consistently and safely defanged', () => {
  const iocs = parseCsvRecords(readFileSync(join(dataDirectory, 'iocs_long.csv'), 'utf8'));
  const domains = iocs.filter((record) => record.ioc_type === 'defanged_domain');
  assert.equal(domains.length, 184);
  for (const record of domains) {
    assert.match(record.value, /\[\.\]/, `${record.publication_id}: ${record.value}`);
    assert.equal(record.value.replaceAll('[.]', '').includes('.'), false, record.value);
  }

  const workbook = readFileSync(join(dataDirectory, 'ai_attack_statistics.xlsx'));
  const workbookXml = readZipEntries(workbook, (filename) => /^xl\/.*\.xml$/.test(filename))
    .map(({ content }) => content.toString('utf8'))
    .join('\n');
  assert.match(workbookXml, /tubely\[\.\]com/);
  assert.doesNotMatch(workbookXml, />tubely\.com</);

  const sqlite = readFileSync(join(dataDirectory, 'ai_attack_statistics.sqlite')).toString('utf8');
  assert.match(sqlite, /tubely\[\.\]com/);
  assert.doesNotMatch(sqlite, /tubely\.com/);

  const referenceModel = JSON.parse(readFileSync(join(ROOT, 'data', 'reference-library.json'), 'utf8'));
  const referenceDomains = referenceModel.records.flatMap((record) => record.tags)
    .filter((tag) => tag.facet === 'IOC · Defanged Domain');
  assert.ok(referenceDomains.length > 0);
  for (const tag of referenceDomains) {
    assert.match(tag.value, /\[\.\]/, tag.value);
    assert.equal(tag.value.replaceAll('[.]', '').includes('.'), false, tag.value);
  }
});

test('machine-readable summary separates whole-corpus and eligible totals', () => {
  const tags = parseCsvRecords(readFileSync(join(dataDirectory, 'tags_long.csv'), 'utf8'));
  const metrics = parseCsvRecords(readFileSync(join(dataDirectory, 'metrics_long.csv'), 'utf8'));
  const iocs = parseCsvRecords(readFileSync(join(dataDirectory, 'iocs_long.csv'), 'utf8'));
  const eligibleTags = tags.filter((record) => eligibleIds.has(record.publication_id));
  const eligibleMetrics = metrics.filter((record) => eligibleIds.has(record.publication_id));
  const eligibleIocs = iocs.filter((record) => eligibleIds.has(record.publication_id));

  assert.equal(summary.unique_publications, publicationRecords.length);
  assert.equal(summary.analysis_eligible_publications, eligibleRecords.length);
  assert.equal(
    summary.context_only_publications,
    publicationRecords.filter((record) => record.analysis_inclusion === 'context_only').length,
  );
  assert.equal(summary.tags, tags.length);
  assert.equal(summary.metrics, metrics.length);
  assert.equal(summary.iocs, iocs.length);
  assert.equal(summary.eligible_tags, eligibleTags.length);
  assert.equal(summary.eligible_metrics, eligibleMetrics.length);
  assert.equal(summary.eligible_iocs, eligibleIocs.length);
  assert.equal(summary.eligible_tag_types, new Set(eligibleTags.map((record) => record.tag_type)).size);
  assert.equal(
    summary.eligible_unique_tag_values,
    new Set(eligibleTags.map((record) => `${record.tag_type}\u0000${record.normalized_value || record.value}`)).size,
  );
  assert.equal(
    summary.eligible_publications_with_metrics,
    new Set(eligibleMetrics.map((record) => record.publication_id)).size,
  );
  assert.equal(
    summary.eligible_publications_with_iocs,
    new Set(eligibleIocs.map((record) => record.publication_id)).size,
  );
});

test('dashboard source manifest binds the generated HTML to every statistical input', () => {
  const hash = createHash('sha256');
  for (const filename of ['summary.json', 'publications.csv', 'tags_long.csv', 'metrics_long.csv', 'iocs_long.csv']) {
    hash.update(filename);
    hash.update('\0');
    hash.update(readFileSync(join(dataDirectory, filename)));
    hash.update('\0');
  }
  const expected = hash.digest('hex');
  assert.match(html, new RegExp(`<meta name="ai-dashboard-data-manifest-sha256" content="${expected}"`));

  const packageModel = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.match(packageModel.scripts['build-ai-attack-study'], /build-ai-attack-statistics-dashboard\.mjs/);
  assert.match(packageModel.scripts['check-ai-attack-study'], /build-ai-attack-statistics-dashboard\.mjs --check/);
});
