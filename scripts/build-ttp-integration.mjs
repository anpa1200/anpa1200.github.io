#!/usr/bin/env node
// Deterministic publication layer over pinned, evidence-labelled module JSON.
// Never runs imported commands, Sigma YAML, tools, collectors or lab procedures.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { tagPath } from '../ttp-simulation/assets/tag-links.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const site = resolve(args.includes('--site') ? args[args.indexOf('--site') + 1] : ROOT);
const check = args.includes('--check');
const BASE = '/ttp-simulation/';
const ORIGIN = 'https://1200km.com';
const moduleRoot = join(site, BASE);
const read = (path) => JSON.parse(readFileSync(join(moduleRoot, path), 'utf8'));
const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replace(/[ \t]+(?=\r?$)/gm, (s) => s.replaceAll(' ', '&#32;').replaceAll('\t', '&#9;'));
const href = (v) => v.startsWith('/anomaly-detection-atlas/') ? ORIGIN + v : /^(?:https?:|\/)/.test(v) ? v : BASE + v;
const a = (url, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${esc(href(url))}">${esc(label)}</a>`;
const p = (text) => `<p>${esc(text)}</p>`;
const list = (items) => items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p>No reviewed association in this snapshot.</p>';
const section = (title, content, id = '') => `<section class="panel"${id ? ` id="${esc(id)}"` : ''}><h2>${esc(title)}</h2>${content}</section>`;
const code = (text, label) => `<pre class="code-sample" tabindex="0" aria-label="${esc(label)}"><code>${esc(text)}</code></pre>`;
const unique = (items, key = (r) => r.page) => [...new Map(items.map((r) => [key(r), r])).values()];
const changed = [];
function output(path, content) {
  const dest = join(site, path);
  if (existsSync(dest) && readFileSync(dest, 'utf8') === content) return;
  if (check) { changed.push(path); return; }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
}
const inventory = read('data/catalog.json');
output('ttp-simulation/data/catalog.csv', readFileSync(join(moduleRoot, 'data/catalog.csv'), 'utf8').replaceAll('\r\n', '\n'));
const techniques = inventory.records.map((r) => read(`data/techniques/${r.key}.json`));
const byKey = new Map(techniques.map((r) => [r.key, r]));
const tools = read('data/tools.json').records.map((r) => read(`data/tools/${r.id}.json`));
const telemetry = read('data/telemetry.json').records.map((r) => read(`data/telemetry/${r.id}.json`));
const detections = inventory.records.map((r) => read(`data/detections/${r.key}.json`));
const rules = read('data/detection-rules.json').records.map((r) => read(r.data_path));
const actorTools = read('data/actor-tool-links.json');
const matrix = JSON.parse(readFileSync(join(site, 'threat-matrix/mitre-data.json'), 'utf8'));
const matrixIds = new Set(matrix.techniques.map((r) => r.id));
const actors = new Map(techniques.map((r) => [r.key, r.domain === 'enterprise' ? matrix.groups.filter((g) => g.technique_ids.includes(r.id)) : []]));
const rulePage = (id) => `detections/rules/${id}/`;
const tags = new Map();
const pages = [];
const pageTags = new Map();
function tag(facet, value, owner, title = value) {
  if (!value || value === 'None') return '';
  const path = tagPath(facet, value);
  const record = tags.get(path) || { facet, value, page: path, members: new Map() };
  if (record.value.toLowerCase() !== value.toLowerCase()) throw Error(`Tag collision: ${record.value} and ${value}`);
  if (owner) {
    record.members.set(owner.page, { page: owner.page, title: owner.title || owner.name, kind: owner.kind });
    const ownTags = pageTags.get(owner.page) || new Set(); ownTags.add(`${facet}:${value}`); pageTags.set(owner.page, ownTags);
  }
  tags.set(path, record);
  return a(path, title, 'chip');
}
function entityTags(row, owner) {
  return '<div class="tags">' + [
    tag('domain', row.domain, owner),
    ...(row.environments || row.mapped_environments || []).map((v) => tag('environment', v, owner)),
    ...(row.platforms || row.mapped_platforms || []).map((v) => tag('platform', v, owner)),
    ...(row.tactics || []).map((v) => tag('tactic', v, owner)),
    ...(row.constraints || []).map((v) => tag('constraint', v, owner)),
  ].join('') + '</div>';
}
const references = (rows) => list(unique(rows.filter((r) => r.url), (r) => r.url).map((r) => /^https?:\/\//.test(r.url) ? a(r.url, r.title || r.name || r.url) : esc(r.title || r.url) + ' (source note; no public URL supplied)'));
const ttpLink = (r) => `${a(r.page, `${r.id} · ${r.name}`)} · ${a(`detections/${r.key}/`, 'Detection rules & anomalies')}`;
const toolLinks = (rows) => list(rows.map((r) => a(r.page, `${r.name} · ${r.id}`)));
const telemLinks = (rows) => list(rows.map((r) => a(r.page, `${r.name} · ${r.id}`)));
const groupsHtml = (rows) => rows.length ? section('Threat actor context', '<p>These are explicit actor-to-technique associations in the existing Threat Matrix snapshot, not attribution of an event or proof that a detector identifies the actor. No tool-to-actor relationship is inferred.</p>' + list(rows.map((g) => a(`/threat-matrix/actors/${g.id}/`, `${g.name} · ${g.id}`)))) : '';
const NAV = [['tools/', 'Attack Tools'], ['', 'Attack Simulations'], ['detections/', 'Detection Rules'], ['telemetry/', 'Telemetry'], ['tags/', 'Tags'], ['/threat-matrix/', 'Threat Matrix'], ['/anomaly-detection-atlas/', 'Anomaly Atlas'], ['/guides.html', 'Guides'], ['/search.html', 'Search']];
function toolActors(id) {
  const rows = actorTools.records.filter(r => r.tool_id === id);
  return rows.length ? section('Documented actor use', '<p>Explicit actor-to-software uses relationships in the pinned ATT&CK source. These links are historical behavior context, not attribution of current events.</p>' + list(rows.map(r => `${a(`/threat-matrix/actors/${r.actor_id}/`, `${r.actor_name} · ${r.actor_id}`)} · ${a(r.source_url, 'Pinned relationship source')} (${esc(r.relationship_id)})`))) : '';
}
function renderPage({ page, title, description, core, connections = '', interactive = {}, kind = 'reference', keywords = [] }) {
  // Rule descriptions repeat across upstream variants; keep the source text unchanged in YAML.
  // Prefix the page identity before SEO shortening so each result remains distinguishable.
  if (kind === 'sigma-rule') description = `Sigma rule ${page.split('/')[2]}. ${title}. ${description}`;
  const seoTitle = title.length > 103 ? title.slice(0, 100).trimEnd() + '…' : title;
  const seoDescription = kind === 'sigma-rule' ? description : `${title}. ${description}`;
  const canonical = ORIGIN + BASE + page;
  const active = Object.keys(interactive).length > 0;
  const bodyData = Object.entries(interactive).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description, datePublished: '2026-09-27', dateModified: '2026-09-27', author: { '@type': 'Person', name: 'Andrey Pautov', url: ORIGIN + '/about.html' }, isPartOf: { '@type': 'WebSite', '@id': ORIGIN + '/#website', name: '1200km', url: ORIGIN + '/' } };
  const ownTags = [...(pageTags.get(page) || [])];
  pages.push({ page, title, kind, tags: ownTags });
  output(BASE.slice(1) + page + 'index.html', `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(seoTitle)} | 1200km</title><meta name="description" content="${esc(seoDescription)}">
<meta name="author" content="Andrey Pautov"><meta name="robots" content="index,follow">
<meta name="keywords" content="${esc([...new Set([...keywords, ...ownTags])].join(', '))}">
<meta name="ttp-module-tags" content="${esc(ownTags.join(', '))}">
<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${ORIGIN}/assets/ap-logo.png">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${ORIGIN}/assets/ap-logo.png">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
<link rel="stylesheet" href="${BASE}assets/catalog.css"><link rel="stylesheet" href="${BASE}assets/integration.css">
${active ? `<script type="module" src="${BASE}assets/catalog-app.mjs"></script>` : ''}
</head><body data-root="${BASE}"${bodyData} id="top">
<a class="skip" href="#main">Skip to module</a>
<header class="topbar" data-pagefind-ignore><a class="brand" href="/">1200<span>km</span><small>SECURITY RESEARCH</small></a><nav aria-label="Ecosystem">${NAV.map(([url, label]) => a(url, label)).join('')}</nav></header>
<main id="main" tabindex="-1" data-pagefind-body>
${active ? '<div id="loading" role="status">Loading interactive filters…</div><div id="app" hidden data-pagefind-ignore></div>' : ''}
<div id="reference-copy"><section class="hero"><div><p class="eyebrow">1200KM / ${esc(kind)}</p><h1>${esc(title)}</h1><p class="lead">${esc(description)}</p></div></section>${core}</div>
${connections ? `<section id="ecosystem-connections"><h2>Connected ecosystem references</h2>${connections}</section>` : ''}
<p class="muted">Pinned research references. No browser attack runner, live simulation result or validated detector is asserted. Source mappings and validation limits are preserved. ${a('data/catalog.json', 'ATT&CK / Atomic provenance')} · ${a('data/detections.json', 'Detection provenance')}.</p>
</main><footer data-pagefind-ignore><span>1200km · Andrey Pautov</span>${a('detection-rules-notice.txt', 'Sigma attribution & license')}${a('/privacy.html', 'Privacy')}${a('/search.html', 'Search the ecosystem')}</footer></body></html>
`);
}

// The complete content is available without JavaScript; filters progressively enhance it.
for (const row of techniques) {
  const owner = { page: row.page, name: `${row.id} ${row.name}`, kind: 'simulation' };
  const taxonomy = entityTags(row, owner) + '<div class="tags">' + tag('simulation', row.simulation.classification, owner) + tag('level', row.level, owner) + tag('visibility', inventory.records.find((r) => r.key === row.key).visibility, owner) + '</div>';
  const candidates = row.simulation.candidates.map((c) => `<li>${a(c.source_url, c.name)} <div class="tags">${c.platforms.map((v) => tag('platform', v, owner)).join('')}${tag('method', c.method, owner)}${tag('executor', c.executor, owner)}</div>${p(`Procedure ${c.id}; elevation ${c.elevation_required ? 'required' : 'not declared required'}; cleanup ${c.cleanup_defined ? 'present, not reviewed' : 'not declared'}. Not executed or individually validated.`)}</li>`);
  renderPage({ page: row.page, title: `${row.id} ${row.name} — Attack Simulation`, description: row.summary, kind: 'simulation', interactive: { technique: row.key }, core: section('Technique description', p(row.summary) + p(row.simulation.reason) + `<p>${a(row.source_url, 'Official ATT&CK definition')} · ${a(`detections/${row.key}/`, 'Detection rules and anomaly models')}</p>`) + section('Documented simulation candidates', candidates.length ? `<ul>${candidates.join('')}</ul>` : '<p>No compatible documented candidate in the pinned snapshot. This is a support gap, not technical impossibility.</p>'), connections: section('Linked tags', taxonomy) + section('Detection and collection', `<p>${a(`detections/${row.key}/`, `${row.id} detection workspace`)}</p>` + telemLinks(row.telemetry.references)) + section('Attack tools', toolLinks(row.attack_tools.references)) + groupsHtml(actors.get(row.key)) + (row.domain === 'enterprise' && matrixIds.has(row.id) ? section('Existing research', `<p>${a(`/threat-matrix/techniques/${row.id}/`, 'Threat Matrix: knowledge routes, evidence and actor context')}</p>`) : ''), keywords: [row.id, row.name, 'ATT&CK', 'simulation', ...row.platforms] });
}

for (const row of tools) {
  const owner = { page: row.page, name: row.name, kind: 'tool' };
  const taxonomy = entityTags(row, owner) + '<div class="tags">' + tag('tool-kind', row.kind, owner) + row.bases.map((b) => tag('evidence', b, owner)).join('') + '</div>';
  renderPage({ page: row.page, title: row.name + ' — Attack Tool', description: row.description, kind: 'tool', interactive: { tool: row.id }, core: section('Tool identity and evidence', p(row.classification_note) + p('Aliases: ' + (row.aliases.join(', ') || 'none recorded')) + `<p>${a(row.source_url, 'Primary tool reference')}</p>`) + section('Existing author guides', list(row.guides.map((g) => `${a(g.url, g.title)} · ${esc(g.published_at)}`))) + section('Primary documentation', references(row.project_documentation)), connections: section('Linked tags', taxonomy) + toolActors(row.id) + section('Technique-specific simulations and detections', '<p>Detection links describe the associated behavior, not independently verified tool-specific signatures.</p>' + list(row.techniques.map(ttpLink))) + section('Telemetry context', '<p>Derived from the explicitly linked TTPs; not proof of sensor coverage for this tool.</p>' + telemLinks(row.telemetry_context)), keywords: [row.id, ...row.aliases] });
}

for (const row of telemetry) {
  const owner = { page: row.page, name: row.name, kind: 'telemetry' };
  const relatedTools = tools.filter((t) => t.telemetry_context.some((r) => r.id === row.id));
  const taxonomy = entityTags(row, owner) + '<div class="tags">' + tag('telemetry-category', row.category, owner) + tag('telemetry-kind', row.kind, owner) + row.providers.map((r) => tag('provider', r.name, owner)).join('') + '</div>';
  renderPage({ page: row.page, title: row.name + ' — Detection Telemetry', description: row.description, kind: 'telemetry', interactive: { telemetry: row.id }, core: section('Collection and providers', p(row.collection_focus) + list(row.providers.map((r) => `${esc(r.name)}: ${esc(r.scope)}`))) + section('Configuration', list(row.configuration.map(esc)) + (row.configuration_example ? code(row.configuration_example.content, 'Configuration example, not a production policy') + p(row.configuration_example.note) : '')) + section('Synthetic event example', p(row.example_note) + code(JSON.stringify(row.example, null, 2), 'Synthetic normalized event')) + section('Visibility and validation', p(row.limitations) + list(row.validation.map(esc))) + section('Primary sources', references(row.sources)), connections: section('Linked tags', taxonomy) + section('Related simulations and detection workspaces', '<p>Each workspace retains its own logsource and platform requirements. A technique-level association is not a per-rule sensor mapping.</p>' + list(row.techniques.map(ttpLink))) + section('Attack tools through shared TTPs', '<p>These are two-hop navigation links through explicitly associated techniques, not independent tool-to-sensor assertions.</p>' + toolLinks(relatedTools)), keywords: [row.id, row.tag, ...row.required_fields] });
}

for (const row of detections) {
  const owner = { page: row.page, name: `${row.id} ${row.name} detections`, kind: 'detection' };
  const taxonomy = entityTags(row, owner) + '<div class="tags">' + tag('detection-evidence', row.status, owner) + row.anomaly_types.map((r) => tag('anomaly', r.title, owner)).join('') + '</div>';
  const models = row.atlas_anomaly.map((m) => `<article><h3>${esc(m.title)}</h3>${p(`Comparison unit: ${m.comparison_unit}`)}${p(`Expected behavior: ${m.expected_behavior}`)}${p(`Deviation: ${m.deviation}`)}${references([...m.anomaly_types, ...m.log_sources, { url: m.source_url, title: 'Exact Atlas activity' }])}</article>`).join('');
  renderPage({ page: row.page, title: `${row.id} ${row.name} — Detection Rules`, description: `Detection workspace for ${row.id} ${row.name}: ${row.counts.sigma} Sigma sources, ${row.counts.atlas_basic} Atlas concepts and ${row.counts.atlas_anomaly} anomaly models. No live detection validation.`, kind: 'detection', interactive: { detection: row.key }, core: section('Source-backed rule directory', list(row.sigma_rules.map((r) => `${a(rulePage(r.id), r.title)} · ${esc(r.status)} · ${esc(r.level)} · ${esc(JSON.stringify(r.logsource))}`))) + section('Atlas deterministic concepts', row.atlas_basic.map((r) => `<h3>${esc(r.title)}</h3>${code(r.logic, 'Published pseudocode, not an executable rule')}${references([...r.log_sources, { url: r.source_url, title: 'Atlas source section' }])}`).join('') || '<p>No exact concept selected.</p>') + section('Anomaly models', models || '<p>No exact Atlas model in this snapshot.</p>') + section('ATT&CK analytic guidance', row.strategies.map((s) => `<h3>${a(s.url, `${s.id} ${s.name}`)}</h3>${p(s.description)}${s.analytics.map((n) => `<h4>${a(n.url, `${n.id} ${n.name}`)}</h4>${p(n.guidance)}`).join('')}`).join('')), connections: section('Linked tags', taxonomy) + section('Simulation, tools and telemetry', `<p>${a(row.technique_page, `${row.id} simulation workspace`)}</p>` + telemLinks(row.telemetry_references) + toolLinks(row.tool_references)) + groupsHtml(actors.get(row.key)) + section('Existing anomaly research', `<p>${a(row.article_url, 'Malicious Activity as a Statistical Signal')} · ${a('/anomaly-detection-atlas/', 'Anomaly Detection Atlas')}</p>`), keywords: [row.id, 'Sigma', 'detection engineering', 'anomaly'] });
}

for (const row of rules) {
  const page = rulePage(row.id);
  const owner = { page, title: row.title, kind: 'sigma-rule' };
  const taxonomy = '<div class="tags">' + tag('rule-status', row.status, owner) + tag('severity', row.level, owner) + Object.entries(row.logsource).filter(([k]) => ['product', 'service', 'category'].includes(k)).map(([k, v]) => tag('logsource-' + k, v, owner)).join('') + row.tags.map((v) => tag('sigma-tag', v, owner)).join('') + '</div>';
  renderPage({ page, title: row.title + ' — Sigma Rule', description: row.description, kind: 'sigma-rule', core: section('Rule metadata and linked tags', taxonomy + p(`Author: ${row.author}. Source status: ${row.status}; severity: ${row.level}. Source dates: ${row.date || 'not supplied'} / ${row.modified || 'not supplied'}.`) + code(JSON.stringify(row.logsource, null, 2), 'Original logsource') + `<p>${a(row.source_url, 'Pinned original Sigma rule')} · ${a(row.license_url, row.license)}</p>${p(`Source SHA-256: ${row.source_sha256}`)}`) + section('Detection logic', '<p>Original source YAML. Source-tag agreement is not proof of complete semantic coverage. This rule has not been compiled for a SIEM backend or validated against live telemetry here.</p>' + code(row.yaml, 'Original Sigma rule YAML, scroll horizontally if needed') + `<p>${a(row.data_path, 'Original YAML and metadata in JSON')}</p>`) + section('False positives', list((row.falsepositives || []).map(esc))) + section('Source references', references((row.references || []).map((url) => ({ url, title: url })))), connections: section('Exact source-tagged techniques', list(row.techniques.map(ttpLink))) + section('Telemetry review', '<p>Read the original logsource above, then inspect the linked detection workspaces for technique-level sensor context. No per-rule telemetry equivalence is inferred.</p>'), keywords: [row.id, ...row.tags, ...Object.values(row.logsource)] });
}

const libraryPages = [
  ['', 'Attack Simulations', 'Explore all active ATT&CK techniques by simulation feasibility, platforms, environments, tools, telemetry and detection evidence. Documented candidates are not live-validated simulations.', techniques.map((r) => ({ ...r, title: `${r.id} ${r.name}` })), { technique: '' }],
  ['tools/', 'Attack Tools', 'Evidence-linked tool pages with documented behaviors, existing author guides, detection workspaces and telemetry context. No tools execute in your browser.', tools, { tool: 'index' }],
  ['detections/', 'Detection Rules', 'Exact ATT&CK technique workspaces, original Sigma rules and the existing Anomaly Detection Atlas. Source-backed references, not production-validated detectors.', detections.map((r) => ({ ...r, title: `${r.id} ${r.name} detections` })), { detection: 'index' }],
  ['telemetry/', 'Telemetry Library', 'Detection inputs, common providers, configuration guidance, synthetic event examples and links to relevant simulations, tools and detection workspaces.', telemetry, { telemetry: 'index' }],
];
for (const [page, title, description, rows, interactive] of libraryPages) {
  renderPage({ page, title, description, kind: 'index', interactive, core: section('Complete reference directory', list(rows.map((r) => a(r.page, r.title || r.name)))), connections: section('Explore the three modules', `<p>${NAV.slice(0, 5).map(([u, l]) => a(u, l)).join(' · ')}</p>`) + (page === 'detections/' ? section('Individual rule sources', `<p>${a('detections/rules/', `Browse all ${rules.length} original Sigma rules`)}</p>`) : '') });
}
renderPage({ page: 'detections/rules/', title: 'Sigma Rule Source Index', description: `${rules.length} original source rules with stable pages, exact TTP links, logsource tags and source attribution.`, kind: 'index', core: section('Complete Sigma rule directory', list(rules.map((r) => a(rulePage(r.id), r.title)))) });

// Every rendered facet is a stable page with exact members, never a dead hashtag.
for (const r of tags.values()) {
  let explanation = 'Navigation membership is based on explicit metadata in this pinned module, not a claim of detection effectiveness or live validation.';
  if (r.facet === 'anomaly') explanation += ' Statistical concepts are hypotheses until implemented and evaluated on suitable telemetry.';
  const members = [...r.members.values()].sort((a, b) => a.title.localeCompare(b.title));
  renderPage({ page: r.page, title: `${r.value} — ${r.facet} tag`, description: `${members.length} related reference pages for ${r.facet}: ${r.value}.`, kind: 'tag', core: section('Meaning and evidence boundary', p(explanation)) + section('Related pages', list(members.map((m) => `${a(m.page, m.title)} · ${esc(m.kind)}`))), connections: `<p>${a('tags/', 'All linked tags')}</p>` });
}
renderPage({ page: 'tags/', title: 'Simulation and Detection Tag Index', description: 'Linked facets for environments, platforms, tactics, providers, source evidence, anomaly types and original Sigma metadata.', kind: 'index', core: [...new Set([...tags.values()].map((r) => r.facet))].sort().map((facet) => section(facet, list([...tags.values()].filter((r) => r.facet === facet).sort((a, b) => a.value.localeCompare(b.value)).map((r) => `${a(r.page, r.value)} · ${r.members.size} pages`)))).join('') });

// Reciprocal backlinks on existing pages, with exact evidence-based membership.
const backlinks = new Map();
function back(url, target, title, basis) {
  const parsed = new URL(url, ORIGIN);
  if (parsed.origin !== ORIGIN) return;
  const path = parsed.pathname.endsWith('/') ? parsed.pathname + 'index.html' : parsed.pathname;
  const links = backlinks.get(path) || new Map();
  links.set(target, { target, title, basis }); backlinks.set(path, links);
}
for (const edge of actorTools.records) { const tool = tools.find(t => t.id === edge.tool_id); back(`/threat-matrix/actors/${edge.actor_id}/`, tool.page, tool.name + ' tool reference', 'Explicit actor uses software relationship in pinned ATT&CK'); }
for (const row of tools) for (const g of row.guides) back(g.url, row.page, row.name + ' tool reference', 'Reviewed guide-to-tool association');
for (const row of detections) for (const model of [...row.atlas_basic, ...row.atlas_anomaly]) {
  back(model.source_url, row.page, `${row.id} ${row.name} detections`, 'Exact published Atlas technique ID');
  for (const ref of [...(model.anomaly_types || []), ...model.log_sources]) back(ref.url, row.page, `${row.id} ${row.name} detections`, 'Model references this taxonomy entry; not a sensor-equivalence assertion');
}
for (const row of techniques.filter((r) => r.domain === 'enterprise' && matrixIds.has(r.id))) {
  for (const base of [`/threat-matrix/techniques/${row.id}/`, ...actors.get(row.key).map((g) => `/threat-matrix/actors/${g.id}/`)]) {
    back(base, row.page, `${row.id} ${row.name} simulation`, 'Exact active technique ID');
    back(base, `detections/${row.key}/`, `${row.id} detection rules`, 'Exact active technique ID; not actor-specific detector coverage');
  }
}
for (const hub of ['/index.html', '/labs.html', '/guides.html', '/projects.html', '/pt-tools.html', '/cti.html', '/threat-matrix/', '/anomaly-detection-atlas/', '/cyber-knowledge/red-team.html', '/cyber-knowledge/blue-team.html']) for (const [page, title] of libraryPages.slice(0, 3)) back(hub, page, title, 'Dedicated ecosystem module');
const start = '<!-- ttp-ecosystem:start -->', end = '<!-- ttp-ecosystem:end -->';
const guideRoutes = {};
for (const [path, links] of backlinks) {
  if (!path.startsWith('/articles/read/')) continue;
  const route = path.replace(/index\.html$/, '');
  const key = createHash('sha256').update(route).digest('hex').slice(0, 16);
  guideRoutes[route] = key;
  output(`ttp-simulation/data/guide-backlinks/${key}.json`, JSON.stringify({ route, links: [...links.values()] }, null, 2) + '\n');
}
output('ttp-simulation/data/guide-backlinks.json', JSON.stringify({ routes: guideRoutes }, null, 2) + '\n');
let inserted = 0; const pending = [];
for (const [path, links] of backlinks) {
  const file = join(site, path);
  if (!existsSync(file)) { pending.push(path); continue; } // Article archive may be staged later in CI.
  const original = readFileSync(file, 'utf8');
  const block = `${start}<section id="ttp-ecosystem" class="ttp-ecosystem-links"><h2>Attack tools, simulations and detection rules</h2><p>Follow explicit source relationships into the reference modules. Linked procedures and detectors are not claims of live validation or actor attribution.</p>${list([...links.values()].map((r) => `${a(r.target, r.title)} <small>— ${esc(r.basis)}</small>`))}</section>${end}`;
  let html = original.includes(start) ? original.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block) : original.replace(/<\/main>/i, block + '\n</main>');
  if (path.startsWith('/articles/read/')) {
    // Keep static and hydrated backlinks inside the article column, not as a flex sibling.
    html = html.replace(new RegExp(`${start}[\\s\\S]*?${end}\\n?`), '').replace(/<\/article>/i, block + '\n</article>');
  }
  if (!html.includes('/ttp-simulation/assets/guide-links.css')) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/ttp-simulation/assets/guide-links.css"></head>');
  }
  if (path.startsWith('/articles/read/') && !html.includes('/ttp-simulation/assets/guide-links.js')) {
    html = html.replace(/<\/head>/i, '<script src="/ttp-simulation/assets/guide-links.js" defer></script></head>');
  }
  // Inline links only in plain text nodes on reviewed guide/Atlas pages. Never modify code, existing links, scripts or navigation.
  if (/^\/(?:anomaly-detection-atlas|articles\/read)\//.test(path)) {
    const inline = new Map();
    for (const r of links.values()) {
      const tid = r.title.match(/^T\d{4}(?:\.\d{3})?/);
      if (tid) inline.set(tid[0], r.target);
      else if (r.title.endsWith(' tool reference')) inline.set(r.title.replace(/ tool reference$/, ''), r.target);
    }
    if (inline.size) {
      const rx = new RegExp(`(?<![\\w.])(${[...inline.keys()].sort((a, b) => b.length - a.length).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w.]|\\.\\d)`, 'g');
      const stack = [];
      html = html.split(/(<[^>]+>)/g).map((part) => {
        if (part.startsWith('<')) {
          const close = part.match(/^<\/(a|script|style|pre|code|nav|header|footer|title)\b/i);
          const open = part.match(/^<(a|script|style|pre|code|nav|header|footer|title)\b/i);
          if (close) stack.pop(); else if (open && !part.endsWith('/>')) stack.push(open[1]);
          return part;
        }
        return stack.length ? part : part.replace(rx, (name) => a(inline.get(name), name));
      }).join('');
    }
  }
  output(path.slice(1), html); inserted++;
}
output('ttp-simulation/data/integration.json', JSON.stringify({ schema_version: 1, published_on: '2026-09-27', policy: 'Exact ID and reviewed guide joins; two-hop links labelled as context; no implicit per-rule telemetry or actor attribution.', counts: { simulations: techniques.length, tools: tools.length, telemetry: telemetry.length, detection_workspaces: detections.length, sigma_rules: rules.length, actor_tool_edges: actorTools.records.length, tag_pages: tags.size, pages: pages.length, reciprocal_source_pages: backlinks.size }, pages, tags: [...tags.values()].map(({ members, ...r }) => ({ ...r, members: [...members.values()] })), backlinks: [...backlinks].map(([path, links]) => ({ path, links: [...links.values()] })) }, null, 2) + '\n');
if (args.includes('--require-archive') && pending.some(p => p.startsWith('/articles/read/'))) throw Error('Reviewed guide backlinks missing from staged article archive');
if (changed.length) throw Error(`TTP integration is stale: ${changed.length} file(s)\n${changed.slice(0, 20).join('\n')}`);
console.log(JSON.stringify({ pages: pages.length, tags: tags.size, backlinks_written_or_checked: inserted, awaiting_external_or_archive_pages: pending.length, mode: check ? 'check' : 'build' }, null, 2));
