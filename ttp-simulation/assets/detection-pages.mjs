import { pageSlice } from './catalog-logic.mjs';
import { tagPath } from './tag-links.mjs';
import { toolChips } from './tool-pages.mjs';

export const detectionLabels = {
  rule_source_available: 'Rule source available · not validated',
  guidance_only: 'Detection guidance / concepts only',
  evidence_gap: 'Detection evidence gap',
};

function references(items, context) {
  return items.map((r) => context.sourceLink(r.url, r.title)).join(' · ');
}

export function detectionSummary(row, { escape, url, sourceLink }) {
  const d = row.detections;
  return `<section id="detection-rules" class="panel"><div class="panel-title"><h2>Detection rules and anomaly models</h2><a class="detection-link" href="${url(d.page)}">Open detection workspace →</a></div><p>${escape(detectionLabels[d.status])}</p>
    <p>${d.counts.sigma} Sigma rule sources · ${d.counts.atlas_basic} Atlas deterministic concepts · ${d.counts.atlas_anomaly} Atlas anomaly models · ${d.counts.analytics} ATT&CK analytics.</p>
    <p class="muted">Exact technique IDs only. A rule tag, published hypothesis or upstream analytic is not validated coverage. Models are not inherited from parents.</p>
    <div class="tags">${d.anomaly_types.map((a) => `<span class="chip">${sourceLink(a.url, a.title)}</span>`).join('')}</div></section>`;
}

export function renderDetectionLibrary(library, context) {
  const { app, escape, url, sourceLink } = context;
  const state = Object.fromEntries(new URLSearchParams(location.search));
  const types = [...new Set(library.records.flatMap((r) => r.anomaly_types.map((a) => a.title)))].sort();
  app.innerHTML = `<section class="hero"><div><p class="eyebrow">TTP SIMULATION / DETECTION ENGINEERING</p><h1>Detection Rules &amp; Anomalies</h1><p class="lead">A detection workspace for every TTP. Evidence before coverage claims.</p><p>Inspect rule logic, source status, telemetry and statistical assumptions. Follow your existing Anomaly Detection Atlas directly from the relevant behavior.</p></div></section>
    <section class="metrics" aria-label="Detection inventory"><div><strong>${library.counts.pages}</strong><span>TTP detection pages</span></div><div><strong>${library.counts.sigma_rules}</strong><span>Exact-tagged Sigma rules</span></div><div><strong>${library.counts.atlas_anomaly_models}</strong><span>Existing Atlas anomaly models</span></div><div><strong>0</strong><span>Live-validated detections here</span></div></section>
    <div class="notice" role="note"><strong>Different artifacts, different readiness.</strong> Sigma YAML is a source rule requiring backend conversion and field mapping. Atlas deterministic logic is pseudocode; anomaly mappings are model hypotheses. ATT&CK analytics are detection guidance. None is presented as a deployed or validated SIEM rule.</div>
    <form id="detection-filters" class="library-filters"><label>Search TTPs<input name="q" type="search" placeholder="Technique ID, name, platform…"></label>
    <label>Domain<select name="domain"><option value="">All domains</option><option value="enterprise">Enterprise</option><option value="mobile">Mobile</option><option value="ics">ICS</option></select></label>
    <label>Evidence status<select name="status"><option value="">All statuses</option>${Object.entries(detectionLabels).map(([k, v]) => `<option value="${k}">${escape(v)}</option>`).join('')}</select></label>
    <label>Atlas anomaly model<select name="anomaly"><option value="">All pages</option><option value="yes">Exact model available</option><option value="no">No exact Atlas model</option></select></label>
    <label>Anomaly type<select name="type"><option value="">All anomaly types</option>${types.map((t) => `<option>${escape(t)}</option>`).join('')}</select></label><button type="reset" class="secondary">Reset filters</button></form>
    <div class="result-toolbar"><p id="detection-count" role="status" aria-live="polite"></p><a href="${url('data/detections.json')}">Manifest and coverage JSON</a></div><div id="detection-cards" class="library-cards"></div>
    <nav class="pager" aria-label="Detection pages"><button id="detection-previous" class="secondary">Previous</button><span id="detection-page"></span><button id="detection-next" class="secondary">Next</button></nav>
    <section class="panel"><h2>Your existing research, connected</h2><p>${sourceLink('https://1200km.com/anomaly-detection-atlas/', 'Anomaly Detection Atlas')} · ${sourceLink(library.article_url, 'Malicious Activity as a Statistical Signal')}</p><p>Rules come from your ${sourceLink(library.sigma_provenance.repository + '/tree/' + library.sigma_provenance.commit, 'pinned Sigma fork')}, retaining original authors, status, YAML and ${sourceLink(library.sigma_provenance.license_url, 'DRL 1.1 attribution')}. This snapshot is not claimed to be the latest SigmaHQ revision.</p>
    <p>${library.counts.techniques_with_sigma} techniques have exact-tagged Sigma rule sources; ${library.counts.techniques_with_anomaly_models} have exact Atlas anomaly mappings. Missing entries stay explicit; broad parent mappings are not inherited.</p>
    <details><summary>Excluded source mappings (${library.excluded_source_mappings.length})</summary><p>These source IDs are not active in the pinned Enterprise catalog. The source Atlas is preserved; no automatic migration to another behavior is made.</p><ul>${library.excluded_source_mappings.map((e) => `<li>${escape(e.kind)} · ${escape(e.technique_ids.join(', '))} · ${e.source_url ? sourceLink(e.source_url, 'Original context') : escape(e.id)}</li>`).join('')}</ul></details></section>`;
  const form = document.querySelector('#detection-filters');
  for (const el of form.elements) if (el.name && state[el.name]) el.value = state[el.name];
  function update() {
    const f = Object.fromEntries(new FormData(form));
    const terms = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const rows = library.records.filter((r) => (!f.domain || r.domain === f.domain) && (!f.status || r.status === f.status)
      && (!f.anomaly || (f.anomaly === 'yes' ? r.counts.atlas_anomaly > 0 : r.counts.atlas_anomaly === 0))
      && (!f.type || r.anomaly_types.some((a) => a.title === f.type))
      && terms.every((t) => [r.id, r.name, r.domain, ...r.platforms].join(' ').toLowerCase().includes(t)));
    const page = pageSlice(rows, Number(state.page || 1), 24);
    state.page = page.page;
    const params = new URLSearchParams(Object.entries({ ...f, page: page.page > 1 ? page.page : '' }).filter(([, v]) => v));
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''));
    document.querySelector('#detection-count').textContent = `${rows.length} of ${library.counts.pages} detection pages`;
    document.querySelector('#detection-cards').innerHTML = page.records.length ? page.records.map((r) => `<article class="telemetry-card detection-card"><p class="eyebrow">${escape(r.domain)} · ${escape(r.id)}</p><h2><a href="${url(r.page)}">${escape(r.name)}</a></h2><p>${escape(detectionLabels[r.status])}</p><p>${r.counts.sigma} Sigma rules · ${r.counts.atlas_basic} deterministic concepts · ${r.counts.atlas_anomaly} anomaly models</p><p class="muted">${r.anomaly_types.map((a) => escape(a.title)).join(' · ') || 'No exact Atlas anomaly model in this snapshot.'}</p><a href="${url(r.technique_page)}">TTP workspace →</a></article>`).join('') : '<p class="empty">No detection pages match. Remove a filter or change the search.</p>';
    document.querySelector('#detection-page').textContent = `Page ${page.page} of ${page.pages}`;
    document.querySelector('#detection-previous').disabled = page.page === 1;
    document.querySelector('#detection-next').disabled = page.page === page.pages;
  }
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', () => { state.page = 1; update(); });
  form.addEventListener('reset', () => { state.page = 1; setTimeout(update); });
  document.querySelector('#detection-previous').addEventListener('click', () => { state.page--; update(); });
  document.querySelector('#detection-next').addEventListener('click', () => { state.page++; update(); });
  update();
}

export function renderDetectionPage(row, context) {
  const { app, escape, url, sourceLink, fetchJson } = context;
  const telemetry = row.telemetry_references.map((r) => `<a class="chip telemetry telemetry-link" href="${url(r.page)}">${escape(r.tag)}</a>`).join('');
  const products = [...new Set(row.sigma_rules.map((r) => r.logsource.product || 'unspecified'))].sort();
  app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url('detections/')}">← Detection library</a><a class="detection-ttp-link" href="${url(row.technique_page)}#detection-rules">${escape(row.id)} workspace</a></nav>
    <section class="hero detail-hero"><div><p class="eyebrow">DETECTION WORKSPACE / ${escape(row.domain)}</p><h1><span class="mono">${escape(row.id)}</span>${escape(row.name)}: detection rules</h1><p class="lead compact">${escape(detectionLabels[row.status])}</p><p>${sourceLink(row.source_url, 'ATT&CK behavior definition')}</p></div></section>
    <section class="metrics" aria-label="Technique detection evidence"><div><strong>${row.counts.sigma}</strong><span>Sigma source rules</span></div><div><strong>${row.counts.atlas_basic}</strong><span>Atlas deterministic concepts</span></div><div><strong>${row.counts.atlas_anomaly}</strong><span>Atlas anomaly models</span></div><div><strong>${row.counts.analytics}</strong><span>ATT&CK analytics / guidance</span></div></section>
    <div class="notice" role="note">Source association is not full-technique coverage. Rules are not backend-compiled, deployed or live-validated here. Exact tags do not establish semantic relevance: review the actual condition, platform, observation point, native sensor fields and exclusions.</div>
    <section class="panel"><h2>Complete technique engineering workbook</h2><p><a href="${url(row.technique_page)}#telemetry">Collection configuration and event examples</a> · <a href="${url(row.technique_page)}#anomalies">Anomaly models and design worksheet</a> · <a href="${url(row.technique_page)}#attack-tools">Tools and source-documented software</a> · <a href="${url(row.technique_page)}#simulation">Simulation procedures</a> · <a href="${url(row.technique_page)}#synthetic-logs">Offline synthetic collection check</a></p></section>
    ${row.visibility_note ? `<p class="notice">Visibility limit: ${escape(row.visibility_note)}</p>` : ''}
    <nav class="section-nav" aria-label="Detection sections"><a href="#sigma-rules">Sigma rules</a><a href="#basic-rules">Deterministic concepts</a><a href="#anomalies">Anomaly models</a><a href="#mitre-analytics">ATT&CK guidance</a><a href="#detection-telemetry">Telemetry &amp; tools</a><a href="#validation">Validation plan</a></nav>
    <section id="sigma-rules" class="panel"><h2>Sigma detection rule sources</h2><p>Exact <span class="mono">attack.${escape(row.id.toLowerCase())}</span> tags from the pinned author-owned Sigma fork. Upstream status is retained; “stable” or “test” does not mean locally validated. YAML downloads preserve the original rule and author.</p>
    ${row.sigma_rules.length ? `<form id="rule-filters" class="library-filters"><label>Search this TTP’s rules<input name="q" type="search" placeholder="Rule title or UUID"></label><label>Log product<select name="product"><option value="">All products</option>${products.map((p) => `<option>${escape(p)}</option>`).join('')}</select></label><label>Source status<select name="status"><option value="">All statuses</option><option value="stable">stable</option><option value="test">test</option><option value="experimental">experimental</option></select></label><button type="reset" class="secondary">Reset</button></form><p id="rule-count" role="status" aria-live="polite"></p><div id="rule-list" class="candidate-list"></div><nav class="pager" aria-label="Rule result pages"><button id="rule-previous" class="secondary">Previous</button><span id="rule-page"></span><button id="rule-next" class="secondary">Next</button></nav>` : '<p class="empty">No exact-tagged Sigma source rule in this selected snapshot. This is a source gap, not proof the behavior cannot be detected. Review the guidance and visibility limits below.</p>'}</section>
    <section id="basic-rules" class="panel"><h2>Your Atlas: deterministic rule concepts</h2><p>Published vendor-neutral pseudocode, not executable Sigma, KQL or SPL. Symbolic thresholds, approved lists, fields and windows need an explicit environment-specific implementation.</p>
    ${row.atlas_basic.length ? row.atlas_basic.map((r) => `<article class="log-card atlas-basic"><h3>${escape(r.title)}</h3><pre class="code-sample" tabindex="0" aria-label="Deterministic pseudocode, scroll horizontally if needed"><code>${escape(r.logic)}</code></pre><p><strong>Suggested log sources:</strong> ${references(r.log_sources, context)}</p><p>${sourceLink(r.source_url, 'Atlas source section')} · ${sourceLink(r.pinned_source_url, 'Pinned source row')}</p></article>`).join('') : '<p class="empty">No exact deterministic Atlas concept for this active technique.</p>'}</section>
    <section id="anomalies" class="panel"><h2>Your Atlas: anomaly-based detection</h2><p>An anomaly is a deviation from an explicit expectation, not a maliciousness verdict. The following models reuse your published exact-ID mappings; no statistical model is invented from a technique name.</p>
    ${row.atlas_anomaly.length ? row.atlas_anomaly.map((r) => `<article class="log-card anomaly-model"><h3>${escape(r.title)}</h3><dl class="anomaly-model-fields"><dt>Comparison unit</dt><dd>${escape(r.comparison_unit)}</dd><dt>Expected behavior</dt><dd>${escape(r.expected_behavior)}</dd><dt>Measurable deviation</dt><dd>${escape(r.deviation)}</dd></dl><p><strong>Statistical types:</strong> ${references(r.anomaly_types, context)}</p><p><strong>Required evidence sources:</strong> ${references(r.log_sources, context)}</p><p>${sourceLink(r.source_url, 'Exact Atlas activity')} · ${sourceLink(r.pinned_source_url, 'Pinned source row')}</p><details><summary>Original investigation context · not model validation</summary><p>The Atlas associates these reports with the behavior. This integration has not independently re-audited every report or established that its authors used this statistical model.</p><p>${references(r.context_references, context)}</p></details></article>`).join('') : '<p class="empty">No exact Atlas anomaly model for this active TTP in the reviewed snapshot. This does not exclude behavioral approaches in ATT&CK guidance or future research.</p>'}
    ${row.related_parent ? `<div class="notice" role="note">${escape(row.related_parent.note)} <a href="${url(row.related_parent.page)}#anomalies">Review ${escape(row.related_parent.id)} · ${escape(row.related_parent.name)}</a>.</div>` : ''}
    <details ${row.atlas_anomaly.length ? 'open' : ''}><summary>Required model design and validation inputs</summary><ol><li><strong>Entity and feature:</strong> define join keys, time zone, event-time window, units, denominator and sensor completeness. First-seen can also mean missing history or changed instrumentation.</li><li><strong>Baseline:</strong> use earlier, sufficiently populated observations for a relevant host role, identity or peer cohort. Specify training length, seasonality, minimum samples and cold-start behavior; exclude known incidents and prevent future-data leakage.</li><li><strong>Decision:</strong> choose a method appropriate to counts, rates, categories, sequences or graph edges. Calibrate thresholds on a separate benign holdout; there is no universal three-sigma threshold.</li><li><strong>False positives:</strong> check approved deployments, new users, maintenance, travel, inventory scans and role changes. Record scoped, expiring exceptions rather than permanent broad allowlists.</li><li><strong>Evaluation:</strong> test benign changes, known behaviors and sensor-loss cases. Record false positives, recall on labeled cases, detection delay and drift. Pause or mark unevaluable when baseline or telemetry quality is insufficient.</li></ol><p>${sourceLink(row.article_url, 'Your statistical-signal research')} · ${sourceLink('https://1200km.com/anomaly-detection-atlas/statistical-anomaly-taxonomy/', 'Full statistical taxonomy')}</p></details></section>
    <section id="mitre-analytics" class="panel"><h2>ATT&CK detection strategies and analytics</h2><p>Unabridged analytic guidance from the pinned ATT&CK snapshot, joined through explicit detection relationships. Guidance is not an executable rule or a validated sensor configuration.</p>
    ${row.strategies.map((s) => `<details class="analytic-strategy"><summary>${escape(s.id)} · ${escape(s.name)} (${s.analytics.length} analytics)</summary><p class="guidance-text">${escape(s.description)}</p><p>${sourceLink(s.url, 'Official strategy')}</p>${s.analytics.map((a) => `<article class="log-card mitre-analytic"><h3>${sourceLink(a.url, a.id + ' · ' + a.name)}</h3><p>${escape(a.platforms.join(', '))}</p><p class="guidance-text">${escape(a.guidance)}</p>${a.tuning.length ? `<h4>Upstream tuning parameters</h4><ul>${a.tuning.map((t) => `<li><strong>${escape(t.field)}</strong>: ${escape(t.description)}</li>`).join('')}</ul>` : ''}<ul>${a.log_sources.map((l) => `<li><a class="telemetry-link" href="${url(l.component_page)}">${escape(l.component)}</a> · ${escape(l.name)} · ${escape(l.channel)}</li>`).join('')}</ul></article>`).join('')}</details>`).join('') || '<p class="empty">No active structured ATT&CK detection strategy in this snapshot.</p>'}</section>
    <section id="detection-telemetry" class="panel"><h2>Telemetry and attack-tool context</h2><div class="tags">${telemetry}</div><p class="muted">Technique-level inputs are not an assertion that every rule uses every listed sensor. Each Sigma rule retains its own logsource; field mapping must be verified separately.</p><div class="tags">${toolChips(row.tool_references, context)}</div><p><a href="${url(row.technique_page)}#simulation">Review this TTP’s simulation candidates and constraints →</a></p></section>
    <section id="validation" class="panel"><h2>Detection validation checklist</h2><ol><li>Choose one rule or model and document the exact behavior it can and cannot observe.</li><li>Confirm native event collection, time alignment, required fields and collector health. Synthetic examples validate a parser, not sensor coverage.</li><li>For Sigma, use the correct backend and processing pipeline, inspect the generated query, and preserve field semantics and exclusions. ${sourceLink('https://sigmahq.io/docs/digging-deeper/pipelines.html', 'Sigma processing pipelines')}</li><li>Test positive fixtures, benign lookalikes, malformed/missing fields and nulls. Then separately test controlled lab telemetry and alert delivery; record rule/backend versions and query outputs.</li><li>Measure noise, detection delay and missed cases. Promote only with observed evidence, rollback and ownership.</li></ol><p><strong>Current module validation:</strong> source relationships checked; YAML parsed; backend compilation, live collection and live detection execution not run.</p><p><a href="${url(`data/detections/${row.key}.json`)}">Download this detection workspace JSON</a> · <a href="${url('data/detections.json')}">Source commits, hashes and exclusions</a></p></section>`;
  if (!row.sigma_rules.length) return;
  const form = document.querySelector('#rule-filters');
  let currentPage = 1;
  const initial = new URLSearchParams(location.search);
  for (const el of form.elements) if (el.name && initial.get('rule_' + el.name)) el.value = initial.get('rule_' + el.name);
  currentPage = Number(initial.get('rule_page') || 1);
  function update() {
    const f = Object.fromEntries(new FormData(form));
    const terms = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const rows = row.sigma_rules.filter((r) => (!f.product || (r.logsource.product || 'unspecified') === f.product)
      && (!f.status || r.status === f.status) && terms.every((t) => [r.title, r.id].join(' ').toLowerCase().includes(t)));
    const page = pageSlice(rows, currentPage, 12);
    currentPage = page.page;
    const params = new URLSearchParams(Object.entries({ rule_q: f.q, rule_product: f.product, rule_status: f.status, rule_page: page.page > 1 ? page.page : '' }).filter(([, v]) => v));
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
    document.querySelector('#rule-count').textContent = `${rows.length} of ${row.counts.sigma} rule sources`;
    document.querySelector('#rule-list').innerHTML = page.records.length ? page.records.map((r) => `<article class="log-card sigma-rule"><h3><a href="${url(`detections/rules/${r.id}/`)}">${escape(r.title)}</a></h3><p><a class="chip" href="${url(tagPath('rule-status', r.status))}">${escape(r.status)} · source status</a> <a class="chip" href="${url(tagPath('severity', r.level))}">${escape(r.level)} · source severity</a></p><p><strong>Logsource:</strong> ${escape(Object.entries(r.logsource).map(([k, v]) => k + ': ' + v).join(' · '))}</p><p>Author: ${escape(r.author)}</p><p class="mono">${escape(r.id)}</p><p>${sourceLink(r.source_url, 'Pinned original rule')}</p><details class="sigma-source" data-rule="${escape(r.id)}"><summary>Read rule logic, limitations and YAML</summary><div class="rule-content" role="status">Open to load this rule.</div></details></article>`).join('') : '<p class="empty">No rules match these filters.</p>';
    document.querySelector('#rule-page').textContent = `Page ${page.page} of ${page.pages}`;
    document.querySelector('#rule-previous').disabled = page.page === 1;
    document.querySelector('#rule-next').disabled = page.page === page.pages;
    for (const details of document.querySelectorAll('.sigma-source')) {
      details.addEventListener('toggle', async () => {
        if (!details.open || details.dataset.loaded) return;
        details.dataset.loaded = 'loading';
        const target = details.querySelector('.rule-content');
        target.textContent = 'Loading pinned rule source…';
        try {
          const rule = await fetchJson(`data/detection-rules/${details.dataset.rule}.json`);
          target.innerHTML = `<p>${escape(rule.description)}</p><p><strong>False positives (source):</strong> ${escape((rule.falsepositives || []).join('; ') || 'Not specified')}</p><p>Source dates: ${escape(rule.date)}${rule.modified ? ' · modified ' + escape(rule.modified) : ''}</p><p>${sourceLink(rule.license_url, rule.license)} · ${sourceLink(rule.source_url, 'Original source / attribution')}</p><p class="muted">SHA-256: <span class="mono">${escape(rule.source_sha256)}</span>. YAML syntax parsed; no backend or live execution validation.</p><button class="secondary rule-download">Download original YAML</button><pre class="code-sample" tabindex="0" aria-label="Original Sigma YAML, scroll horizontally if needed"><code>${escape(rule.yaml)}</code></pre><p>Original references: ${(rule.references || []).map((r) => sourceLink(r, r)).join(' · ') || 'None supplied'}</p>`;
          target.removeAttribute('role');
          target.querySelector('.rule-download').addEventListener('click', () => {
            const blob = URL.createObjectURL(new Blob([rule.yaml], { type: 'text/yaml;charset=utf-8' }));
            const a = document.createElement('a'); a.href = blob; a.download = rule.id + '.yml'; a.click();
            setTimeout(() => URL.revokeObjectURL(blob), 1000);
          });
          details.dataset.loaded = 'yes';
        } catch (error) {
          target.setAttribute('role', 'alert');
          target.textContent = `Could not load rule: ${error.message}. Close and reopen to retry, or follow the pinned original link.`;
          delete details.dataset.loaded;
        }
      });
    }
  }
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', () => { currentPage = 1; update(); });
  form.addEventListener('reset', () => { currentPage = 1; setTimeout(update); });
  document.querySelector('#rule-previous').addEventListener('click', () => { currentPage--; update(); });
  document.querySelector('#rule-next').addEventListener('click', () => { currentPage++; update(); });
  update();
}
