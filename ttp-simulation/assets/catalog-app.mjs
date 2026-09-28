import { classificationLabels, filterRecords, exportCsv, pageSlice } from './catalog-logic.mjs';
import { tagLinks } from './tag-links.mjs';
import { renderTelemetryLibrary, renderTelemetryReference } from './telemetry-pages.mjs';
import { renderToolLibrary, renderToolReference, toolChips, techniqueToolsHtml } from './tool-pages.mjs';
import { renderDetectionLibrary, renderDetectionPage, detectionSummary, detectionLabels } from './detection-pages.mjs';
import { renderWorkbook } from './workbook-render.mjs';

const root = new URL(document.body.dataset.root, location.href);
const key = document.body.dataset.technique;
const telemetryKey = document.body.dataset.telemetry;
const toolKey = document.body.dataset.tool;
const detectionKey = document.body.dataset.detection;
const app = document.querySelector('#app');
const loading = document.querySelector('#loading');
const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const url = (path) => new URL(path, root).href;
const chips = (values, facet = 'platform') => tagLinks(values, facet, { escape, url });
const telemetryChips = (references) => references.map((ref) => `<a class="chip telemetry telemetry-link" href="${url(ref.page)}">${escape(ref.tag)}</a>`).join('');
const sourceLink = (href, label) => /^https:\/\//.test(href || '') ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>` : escape(label);
const fetchJson = async (path) => {
  const response = await fetch(url(path));
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
};

function download(name, text, type) {
  const objectUrl = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function renderInventory(catalog) {
  const state = Object.fromEntries(new URLSearchParams(location.search));
  const facets = (field) => [...new Set(catalog.records.flatMap((row) => row[field]))].sort();
  const select = (name, label, values) => `<label>${label}<select name="${name}"><option value="">All ${label.toLowerCase()}</option>${values.map((value) => `<option value="${escape(value)}">${escape(value)}</option>`).join('')}</select></label>`;
  app.innerHTML = `<section class="hero"><div><p class="eyebrow">DETECTION ENGINEERING / SIMULATION CATALOG</p><h1>Attack Simulations</h1><p class="lead">Find the behavior. Check the telemetry. Build the right lab.</p><p>Every active Enterprise, Mobile, and ICS technique has its own workspace. Start by filtering the inventory—not by running an unreviewed command.</p></div><div class="version">ATT&CK ${escape(catalog.attack_version)}<small>Pinned source snapshot</small></div></section>
    <p><a href="/attack-matrix/">Explore the interactive ATT&amp;CK &amp; ATLAS matrix →</a></p>
    <section class="metrics" aria-label="Inventory totals">
      <div><strong>${catalog.counts.total}</strong><span>Techniques + sub-techniques</span></div>
      <div><strong>${catalog.counts.by_classification.can_simulate || 0}</strong><span>Documented simulation candidates</span></div>
      <div><strong>${catalog.counts.by_classification.cannot_simulate_yet || 0}</strong><span>Unsupported in current evidence set</span></div>
      <div><strong>${catalog.counts.telemetry_mapped}</strong><span>With upstream telemetry mappings</span></div>
    </section>
    <aside class="notice"><strong>Procedure availability is not feasibility or validation.</strong> The filter below describes the pinned Atomic index only. A missing Atomic candidate does not mean a technique cannot be simulated. Each page includes a full definition, detection guidance, collection contracts, anomaly-design worksheet and explicit gaps. <a href="/ttp-simulation/data/workbooks.json">All-page evidence inventory</a>. Imported procedures are not live-validated.</aside>
    <div class="workspace"><aside class="filters"><form id="filters"><h2>Filter inventory</h2><label>Search<input name="q" type="search" placeholder="ID, behavior, platform, telemetry…" autocomplete="off"></label>
      <label>Atomic procedure evidence<select name="classification"><option value="">Both groups</option><option value="can_simulate">Compatible Atomic candidate</option><option value="cannot_simulate_yet">No Atomic candidate in snapshot</option></select></label>
      ${select('domain', 'Domain', ['enterprise', 'mobile', 'ics'])}
      ${select('environment', 'Environment', facets('environments'))}
      ${select('platform', 'Platform', facets('platforms'))}
      ${select('telemetry', 'Telemetry', facets('telemetry_tags'))}
      <p id="selected-telemetry" class="muted"></p>
      ${select('tool', 'Attack tool', facets('tool_tags'))}
      <p id="selected-tool" class="muted"></p>
      <label>Detection evidence<select name="detection"><option value="">All evidence statuses</option>${Object.entries(detectionLabels).map(([k, v]) => `<option value="${k}">${escape(v)}</option>`).join('')}</select></label>
      ${select('anomaly', 'Atlas anomaly type', facets('anomaly_tags'))}
      ${select('visibility', 'Detection visibility', [...new Set(catalog.records.map((row) => row.visibility))].sort())}
      ${select('tactic', 'Tactic', facets('tactics'))}
      ${select('level', 'Level', ['technique', 'subtechnique'])}
      <label>Sort<select name="sort"><option value="feasibility">Feasibility group</option><option value="id">ATT&CK ID</option><option value="name">Name</option><option value="candidates">Procedure count</option></select></label>
      <button type="reset" class="secondary">Reset filters</button></form></aside>
    <section class="results" aria-label="Techniques"><div class="result-toolbar"><p id="result-count" role="status" aria-live="polite"></p><button id="export">Export filtered CSV</button></div><div id="cards" class="cards"></div><nav class="pager" aria-label="Results pages"><button id="previous" class="secondary">Previous</button><span id="page-number"></span><button id="next" class="secondary">Next</button></nav></section></div>
    <details class="methodology"><summary>Classification rules, environment tags, and source provenance</summary><ul>${catalog.methodology.map((note) => `<li>${escape(note)}</li>`).join('')}</ul><p>Telemetry follows explicit ATT&CK detection relationships; exact events remain upstream recommendations, not locally proven collection. No parent/sub-technique coverage inheritance. Retired objects are excluded from active totals.</p><p>${sourceLink('https://attack.mitre.org/resources/attack-data-and-tools/', 'MITRE ATT&CK data')} · <a href="${url('data/retired.json')}">Retired entries</a> · <a href="${url('data/catalog.json')}">Full catalog + source hashes</a> · <a href="${url('data/catalog.csv')}">Full CSV</a></p></details>`;
  const form = document.querySelector('#filters');
  for (const element of form.elements) if (element.name && state[element.name]) element.value = state[element.name];
  let current = [];
  function update() {
    const filters = Object.fromEntries(new FormData(form));
    current = filterRecords(catalog.records, filters);
    const page = pageSlice(current, Number(state.page || 1));
    state.page = page.page;
    const params = new URLSearchParams(Object.entries({ ...filters, page: page.page > 1 ? page.page : '' }).filter(([, value]) => value));
    history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}`);
    document.querySelector('#result-count').textContent = `${current.length} of ${catalog.counts.total} techniques · ${current.filter((r) => r.classification === 'can_simulate').length} with documented procedures`;
    const selectedReference = catalog.records.flatMap((r) => r.telemetry_references).find((r) => r.tag === filters.telemetry);
    document.querySelector('#selected-telemetry').innerHTML = selectedReference ? `<a href="${url(selectedReference.page)}">Open ${escape(selectedReference.name)} reference →</a>` : `<a href="${url('telemetry/')}">Browse all telemetry references →</a>`;
    const selectedTool = catalog.records.flatMap((r) => r.tool_references).find((r) => r.name === filters.tool);
    document.querySelector('#selected-tool').innerHTML = selectedTool ? `<a href="${url(selectedTool.page)}">Open ${escape(selectedTool.name)} tool page →</a>` : `<a href="${url('tools/')}">Browse all attack tools →</a>`;
    const previewTools = (row) => [...row.tool_references].sort((a, b) => Number(b.name === filters.tool) - Number(a.name === filters.tool));
    document.querySelector('#cards').innerHTML = page.records.length ? page.records.map((row) => `<article class="technique-card">
      <div class="card-heading"><span class="mono">${escape(row.id)}</span><span class="domain">${escape(row.domain)} · ${escape(row.level)}</span></div>
      <h3><a data-technique-link href="${escape(url(row.page))}">${escape(row.name)}</a></h3><p class="status ${row.classification === 'can_simulate' ? 'available' : 'gap'}">${escape(classificationLabels[row.classification])}</p><div class="tags">${chips(row.environments, 'environment')}</div>
      <p class="caption">DETECTION TELEMETRY</p><div class="tags">${telemetryChips(row.telemetry_references.slice(0, 4))}${row.telemetry_references.length > 4 ? `<a class="chip" href="${url(row.page)}#telemetry">+${row.telemetry_references.length - 4} more</a>` : ''}</div>
      <p class="caption">ATTACK TOOL ASSOCIATIONS</p><div class="tags">${toolChips(previewTools(row).slice(0, 3), { escape, url })}${row.tool_references.length > 3 ? `<a class="chip" href="${url(row.page)}#attack-tools">+${row.tool_references.length - 3} more</a>` : ''}</div>${row.tool_references.length ? '' : '<p class="muted">No reviewed tool association yet.</p>'}
      <p class="caption">DETECTION RULES &amp; ANOMALIES</p><p><a class="detection-link" href="${url(row.detections.page)}">${row.detections.counts.sigma} Sigma rules · ${row.detections.counts.atlas_anomaly} Atlas models →</a></p>
      <div class="card-footer"><span>${row.candidate_count} procedure candidates</span><span>Not live-validated</span></div></article>`).join('') : '<div class="empty"><h3>No matching techniques</h3><p>Remove a filter or change your search. No technique has been deleted from the catalog.</p></div>';
    // URL query text belongs in a DOM URL property, never in an HTML template.
    for (const link of document.querySelectorAll('[data-technique-link]')) link.search = location.search;
    document.querySelector('#page-number').textContent = `Page ${page.page} of ${page.pages}`;
    document.querySelector('#previous').disabled = page.page === 1;
    document.querySelector('#next').disabled = page.page === page.pages;
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => { state.page = 1; update(); });
  form.addEventListener('reset', () => { state.page = 1; setTimeout(update); });
  document.querySelector('#previous').addEventListener('click', () => { state.page--; update(); });
  document.querySelector('#next').addEventListener('click', () => { state.page++; update(); });
  document.querySelector('#export').addEventListener('click', () => download('ttp-simulation-filtered.csv', exportCsv(current), 'text/csv;charset=utf-8'));
  update();
}

function renderTechnique(row, workbook) {
  if (workbook) {
    app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a data-return-to-catalog href="${escape(root.href)}">← All techniques</a><span>${escape(row.domain)}</span><span>${escape(row.id)}</span></nav>
      <section class="hero detail-hero"><div><p class="eyebrow">TECHNIQUE ENGINEERING WORKBOOK</p><h1><span class="mono">${escape(row.id)}</span> ${escape(row.name)}</h1><p class="lead compact">${escape(row.summary)}</p><p>Detection guidance, anomaly design, collection contracts and simulation evidence—each with its own validation status.</p></div></section>
      <div class="detail-metadata"><div><h2>Environment</h2><div class="tags">${chips(row.environments, 'environment')}</div></div><div><h2>Platforms</h2><div class="tags">${chips(row.platforms)}</div></div><div><h2>Tactics</h2><div class="tags">${chips(row.tactics, 'tactic')}</div></div></div>${renderWorkbook(workbook)}`;
    document.querySelector('[data-return-to-catalog]').search = location.search;
    return;
  }
  const telemetry = row.telemetry;
  const simulation = row.simulation;
  const sameDomain = (id) => url(`techniques/${row.domain}/${id}/`);
  app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a data-return-to-catalog href="${escape(root.href)}">← All techniques</a><span>${escape(row.domain)}</span><span>${escape(row.id)}</span></nav>
    <section class="hero detail-hero"><div><p class="eyebrow">TECHNIQUE WORKSPACE / ${escape(row.level)}</p><h1><span class="mono">${escape(row.id)}</span> ${escape(row.name)}</h1><p class="lead compact">${escape(row.summary)}</p><p class="status ${simulation.classification === 'can_simulate' ? 'available' : 'gap'}">${escape(simulation.label)}</p></div></section>
    <div class="detail-metadata"><div><h2>Environment</h2><div class="tags">${chips(row.environments, 'environment')}</div><p class="muted">Derived lab-compatibility tags, not exclusive hosting locations.</p></div><div><h2>Platforms</h2><div class="tags">${chips(row.platforms)}</div></div><div><h2>Tactics</h2><div class="tags">${chips(row.tactics, 'tactic')}</div></div></div>
    ${row.parent_id ? `<p class="parent">Sub-technique of <a href="${sameDomain(row.parent_id)}">${escape(row.parent_id)}</a>. Simulation support is assessed separately; parent coverage is not inherited.</p>` : ''}
    <nav class="section-nav" aria-label="Technique sections"><a href="#telemetry">Detection telemetry</a><a href="#detection-rules">Detection rules</a><a href="#attack-tools">Attack tools</a><a href="#simulation">Simulation readiness</a><a href="#constraints">Lab requirements</a><a href="#sources">Evidence</a></nav>
    ${detectionSummary(row, { escape, url, sourceLink })}
    ${techniqueToolsHtml(row, { escape, url, sourceLink })}
    <section id="telemetry" class="panel"><div class="panel-title"><h2>Detection telemetry</h2><span class="chip">${telemetry.status === 'mapped' ? 'ATT&CK relationship mapped' : 'Mapping gap'}</span></div><p>These are relevant upstream detection inputs—not proof that your sensors emit them. Platform-specific sources are kept separate; configure and validate them in the selected lab.</p>
    <div class="tags">${telemetryChips(telemetry.references.filter((r) => r.kind === 'attack_component')) || '<p class="notice">The upstream strategy provides no structured data-component mapping. This is a visibility or instrumentation gap—not proof that detection is impossible.</p>'}</div>
    ${telemetry.planning_inputs.length ? `<section class="planning"><h3>Proposed planning inputs · not validated</h3><div class="tags">${telemetryChips(telemetry.planning_references)}</div><p>${escape(telemetry.planning_note)}</p><details><summary>Read the upstream visibility guidance</summary>${telemetry.analytics.map((a) => `<p>${escape(a.guidance)} ${sourceLink(a.url, a.id)}</p>`).join('')}</details></section>` : ''}
    <div class="telemetry-list">${telemetry.log_sources.map((log) => `<article class="log-card"><div><h3>${escape(log.name || 'Unspecified log source')}</h3><p><a class="telemetry-link" href="${url(log.component_page)}">${escape(log.component)}</a></p></div><p><strong>Channel / signal:</strong> ${escape(log.channel === 'None' ? 'Not specified upstream' : log.channel)}</p><div class="tags">${chips(log.platforms.filter((p) => p !== 'None'))}</div><p class="source">${sourceLink(log.source_url, log.analytic_id)} · Upstream definition, not locally validated</p></article>`).join('')}</div></section>
    <section id="simulation" class="panel"><div class="panel-title"><h2>Simulation readiness</h2><span class="chip">Live validation: not run</span></div><p>${escape(simulation.reason)}</p><div class="readiness"><div><strong>${simulation.candidate_count}</strong><span>Documented procedures</span></div><div><strong>0</strong><span>Integrated browser runners</span></div><div><strong>0</strong><span>Live-validated procedures</span></div></div>
    ${simulation.prototype_note ? `<p class="notice">${escape(simulation.prototype_note)}</p>` : ''}
    <p class="muted">This stage maps availability and prerequisites. It does not execute commands, call a lab host, install tools, or forward logs. A technique page is not an enabled simulation.</p>
    ${simulation.candidates.length ? `<details open><summary>Review documented procedure candidates (${simulation.candidate_count})</summary><div class="candidate-list">${simulation.candidates.map((test) => `<article class="candidate"><h3>${escape(test.name)}</h3><div class="tags">${chips(test.platforms)}${chips([test.method], 'method')}${chips([test.executor], 'executor')}</div><dl><dt>Test GUID</dt><dd class="mono">${escape(test.id)}</dd><dt>Elevation</dt><dd>${test.elevation_required ? 'Required by this definition' : 'Not declared required'}</dd><dt>Dependencies</dt><dd>${test.dependency_count} prerequisite definitions</dd><dt>Cleanup</dt><dd>${test.cleanup_defined ? 'Command present; not reviewed' : 'No cleanup command declared'}</dd></dl><p>${sourceLink(test.source_url, 'Review pinned source')} · Not individually reviewed or executed</p></article>`).join('')}</div></details>` : '<p class="empty">Procedure selection and lab design are required before adding synthetic or real execution controls.</p>'}</section>
    <section id="constraints" class="panel"><h2>Lab requirements and review tags</h2><div class="tags">${chips(row.constraints, 'constraint')}</div><p>These are planning constraints, not a completed safety assessment. An available test can still alter accounts, disrupt a service, or require specialized equipment. No candidate is automatically approved.</p></section>
    <section id="sources" class="panel"><h2>Evidence and ecosystem</h2><ul><li>${sourceLink(row.source_url, 'Official ATT&CK technique')} · object version ${escape(row.source_object_version)} · modified ${escape(row.source_modified)}</li><li>${sourceLink(row.ecosystem_url, '1200km Threat Matrix')}</li><li>${sourceLink('https://1200km.com/anomaly-detection-atlas/', 'Anomaly Detection Atlas')}</li><li><a href="${url(`data/techniques/${row.key}.json`)}">Download this technique’s complete mapping (JSON)</a></li><li><a href="${url('data/catalog.json')}">Source snapshot hashes and classification rules</a></li></ul><p>${escape(telemetry.basis)}</p><ul>${telemetry.strategies.map((strategy) => `<li>${sourceLink(strategy.url, `${strategy.id} · ${strategy.name}`)}</li>`).join('')}</ul></section>`;
  document.querySelector('[data-return-to-catalog]').search = location.search;
}

try {
  const context = { app, escape, url, sourceLink, fetchJson };
  if (detectionKey === 'index') renderDetectionLibrary(await fetchJson('data/detections.json'), context);
  else if (detectionKey) renderDetectionPage(await fetchJson(`data/detections/${detectionKey}.json`), context);
  else if (toolKey === 'index') renderToolLibrary(await fetchJson('data/tools.json'), context);
  else if (toolKey) renderToolReference(await fetchJson(`data/tools/${toolKey}.json`), context);
  else if (telemetryKey === 'index') renderTelemetryLibrary(await fetchJson('data/telemetry.json'), context);
  else if (telemetryKey) renderTelemetryReference(await fetchJson(`data/telemetry/${telemetryKey}.json`), context);
  else if (key) renderTechnique(...await Promise.all([fetchJson(`data/techniques/${key}.json`), fetchJson(`data/workbooks/${key}.json`)]));
  else renderInventory(await fetchJson('data/catalog.json'));
  loading.hidden = true;
  app.hidden = false;
  const reference = document.querySelector('#reference-copy');
  if (reference) reference.remove();
} catch (error) {
  loading.setAttribute('role', 'alert');
  loading.textContent = `${error.message}. Serve this module over HTTP; use the data exports if interactive loading is unavailable.`;
}
