import { pageSlice } from './catalog-logic.mjs';
import { tagPath } from './tag-links.mjs';

export const basisLabels = {
  attack_uses: 'ATT&CK documented use',
  atomic_test: 'Exact Atomic test reference',
  editorial_capability: 'Editorial capability / guide association',
};
const shortBasis = { attack_uses: 'ATT&CK use', atomic_test: 'Atomic reference', editorial_capability: 'Editorial' };
const kindLabels = { attack_tool: 'ATT&CK tool', selected_framework: 'Selected framework · ATT&CK malware type', curated_tool: 'Editorial ecosystem tool' };

export function toolChips(refs, { escape, url }) {
  return refs.map((r) => `<a class="chip tool-link" href="${url(r.page)}">${escape(r.name)} <span class="tool-basis">${r.bases.map((b) => escape(shortBasis[b])).join(' + ')}</span></a>`).join('');
}

function evidenceHtml(evidence, { escape, sourceLink }) {
  return evidence.map((e) => `<div class="tool-evidence"><p><strong>${escape(basisLabels[e.basis])}</strong> — ${escape(e.description)}</p>
    <p>${sourceLink(e.source_url, e.basis === 'attack_uses' ? 'ATT&CK software / procedures' : e.basis === 'atomic_test' ? 'Pinned Atomic definition' : 'Tool documentation')}${e.guide_url ? ` · ${sourceLink(e.guide_url, 'Author’s supporting guide')} · ${sourceLink(e.technique_url, 'Technique definition')}` : ''}</p>
    ${e.relationship_id ? `<p class="muted mono">${escape(e.relationship_id)}</p>` : ''}
    ${e.test_guid ? `<p class="muted">${escape(e.test_name)} · <span class="mono">${escape(e.test_guid)}</span><br>Tool identity reviewed; procedure safety and execution not validated.</p>` : ''}
    ${e.citations?.length ? `<details><summary>Underlying ATT&CK citations (${e.citations.length})</summary><ul>${e.citations.map((c) => `<li>${sourceLink(c.url, c.title)}</li>`).join('')}</ul></details>` : ''}</div>`).join('');
}

export function techniqueToolsHtml(row, context) {
  const { escape, url } = context;
  const refs = row.attack_tools.references;
  return `<section id="attack-tools" class="panel"><div class="panel-title"><h2>Attack tools and procedure references</h2><a href="${url('tools/')}">Browse tool library →</a></div>
    <p>${escape(row.attack_tools.note)} ATT&CK use describes documented behavior; Atomic references identify a particular test; editorial links describe a limited capability or guide workflow.</p>
    ${refs.length ? `<div class="tags">${toolChips(refs, context)}</div><details class="tool-associations"><summary>Review evidence for ${refs.length} tool associations</summary><div class="candidate-list">${refs.map((r) => `<article class="log-card"><h3><a class="tool-link" href="${url(r.page)}">${escape(r.name)}</a></h3>${evidenceHtml(r.evidence, context)}</article>`).join('')}</div></details>` : '<p class="empty">No reviewed tool association in this evidence set. This does not mean that no tool can implement the behavior.</p>'}</section>`;
}

export function renderToolLibrary(library, context) {
  const { app, escape, url } = context;
  const state = Object.fromEntries(new URLSearchParams(location.search));
  app.innerHTML = `<section class="hero"><div><p class="eyebrow">TTP SIMULATION / TOOL REFERENCE LIBRARY</p><h1>Attack Tools</h1><p class="lead">From a tool to its behavior, evidence, telemetry and your next lab.</p><p>${escape(library.scope)}</p></div></section>
    <section class="metrics" aria-label="Tool library totals"><div><strong>${library.counts.total}</strong><span>Dedicated tool pages</span></div><div><strong>${library.counts.unique_guides}</strong><span>Author’s existing guides</span></div><div><strong>${library.counts.tagged_techniques}</strong><span>TTPs with sourced tool tags</span></div><div><strong>0</strong><span>Tools run or live-validated here</span></div></section>
    <aside class="notice"><strong>Three evidence types, not one coverage claim.</strong> ATT&CK documented use, exact Atomic test references and editorial capability links remain separate. Tool use alone is not malicious intent. This module does not download or execute tools.</aside>
    <form id="tool-filters" class="library-filters"><label>Search tools<input name="q" type="search" placeholder="Name, software ID, capability…"></label>
      <label>Entry type<select name="kind"><option value="">All types</option>${Object.entries(kindLabels).map(([k, v]) => `<option value="${k}">${escape(v)}</option>`).join('')}</select></label>
      <label>Author’s guides<select name="guides"><option value="">All tools</option><option value="yes">Has a matching guide</option><option value="no">No matched guide</option></select></label>
      <label>Association evidence<select name="basis"><option value="">All evidence types</option>${Object.entries(basisLabels).map(([k, v]) => `<option value="${k}">${escape(v)}</option>`).join('')}<option value="none">No reviewed association yet</option></select></label><button type="reset" class="secondary">Reset filters</button></form>
    <div class="result-toolbar"><p id="tool-count" role="status" aria-live="polite"></p><a href="${url('data/tools.json')}">Library JSON</a></div><div id="tool-cards" class="library-cards"></div>
    <nav class="pager" aria-label="Tool pages"><button id="tool-previous" class="secondary">Previous</button><span id="tool-page"></span><button id="tool-next" class="secondary">Next</button></nav>
    <section class="panel"><h2>How the links were selected</h2><p>Official tags use active software → technique relationships from ATT&CK ${escape(library.attack_version)}. Atomic links use an explicit reviewed test GUID that also exists as a compatible candidate on the technique page. Editorial links identify a narrow mode with tool documentation, a technique definition and a supporting guide.</p><p>Guide matching uses reviewed article IDs from ${library.guide_provenance.articles_scanned} archive entries, not fuzzy title matches. Publication dates are preserved; finding a guide is not a revalidation of its commands. “No matched guide” means none selected in this reviewed archive snapshot, not that none exists anywhere.</p><p>No inherited sub-technique coverage, no automatic malware-to-tool reclassification, and no automatic framework-wide mapping.</p></section>`;
  const form = document.querySelector('#tool-filters');
  for (const el of form.elements) if (el.name && state[el.name]) el.value = state[el.name];
  function update() {
    const filters = Object.fromEntries(new FormData(form));
    const terms = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const rows = library.records.filter((r) => (!filters.kind || r.kind === filters.kind)
      && (!filters.guides || (filters.guides === 'yes' ? r.guide_count > 0 : r.guide_count === 0))
      && (!filters.basis || (filters.basis === 'none' ? !r.bases.length : r.bases.includes(filters.basis)))
      && terms.every((t) => [r.id, r.name, r.description, ...r.aliases].join(' ').toLowerCase().includes(t)));
    const page = pageSlice(rows, Number(state.page || 1), 24);
    state.page = page.page;
    const params = new URLSearchParams(Object.entries({ ...filters, page: page.page > 1 ? page.page : '' }).filter(([, v]) => v));
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''));
    document.querySelector('#tool-count').textContent = `${rows.length} of ${library.counts.total} tools`;
    document.querySelector('#tool-cards').innerHTML = page.records.length ? page.records.map((r) => `<article class="telemetry-card tool-card"><p class="eyebrow">${escape(kindLabels[r.kind])}</p><h2><a href="${url(r.page)}">${escape(r.name)}</a></h2><p>${escape(r.description)}</p><div class="tags">${r.bases.map((b) => `<a class="chip" href="${url(tagPath('evidence', b))}">${escape(shortBasis[b])}</a>`).join('')}</div><p class="provider-preview">${r.technique_count} linked TTPs · ${r.guide_count} author guides${r.technique_count === 0 ? ' · No reviewed TTP association yet' : ''}</p></article>`).join('') : '<p class="empty">No tools match these filters. Reset a filter or change the search.</p>';
    document.querySelector('#tool-page').textContent = `Page ${page.page} of ${page.pages}`;
    document.querySelector('#tool-previous').disabled = page.page === 1;
    document.querySelector('#tool-next').disabled = page.page === page.pages;
  }
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', () => { state.page = 1; update(); });
  form.addEventListener('reset', () => { state.page = 1; setTimeout(update); });
  document.querySelector('#tool-previous').addEventListener('click', () => { state.page--; update(); });
  document.querySelector('#tool-next').addEventListener('click', () => { state.page++; update(); });
  update();
}

export function renderToolReference(tool, context) {
  const { app, escape, url, sourceLink } = context;
  app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url('tools/')}">← Attack tools</a><a href="${url('')}">TTP inventory</a></nav>
    <section class="hero detail-hero"><div><p class="eyebrow">${escape(kindLabels[tool.kind])}</p><h1>${escape(tool.name)}</h1><p class="lead compact">${escape(tool.description)}</p><p>${sourceLink(tool.source_url, tool.kind === 'curated_tool' ? 'Tool documentation / project' : `${tool.id} · Official ATT&CK software record`)}</p></div></section>
    <aside class="notice">${escape(tool.classification_note)} <strong>No tool is installed, executed or live-validated by this page.</strong></aside>
    ${tool.project_documentation.length ? `<p>${tool.project_documentation.map((d) => sourceLink(d.url, d.title)).join(' · ')}</p>` : ''}
    <div class="detail-metadata"><div><h2>Identity</h2><p>${escape(tool.id)}${tool.upstream_type ? ` · upstream type: ${escape(tool.upstream_type)}` : ' · curated local ID'}</p><p class="muted">${tool.aliases.length ? escape(tool.aliases.join(' · ')) : 'No additional aliases in this entry.'}</p></div><div><h2>Evidence and scope</h2><p>${tool.technique_count} distinct TTPs · ${tool.guide_count} guides</p><p class="muted">${tool.bases.map((b) => escape(basisLabels[b])).join(' / ') || 'No reviewed TTP association yet.'}</p></div><div><h2>Reference snapshot</h2><p>Prepared ${escape(tool.reviewed_on)}</p><p class="muted">${tool.source_modified ? `ATT&CK object modified ${escape(tool.source_modified)}` : 'Editorial ecosystem entry; not an official ATT&CK software mapping.'}</p></div></div>
    <nav class="section-nav" aria-label="Tool sections"><a href="#guides">Author’s guides</a><a href="#tool-techniques">Linked TTPs</a><a href="#tool-telemetry">Telemetry context</a><a href="#tool-lab">Lab review</a><a href="#tool-sources">Sources</a></nav>
    <section id="guides" class="panel"><h2>Andrey Pautov’s guides</h2><p class="muted">${escape(tool.guide_currentness)} These can include multi-tool labs, not just standalone manuals.</p>
      ${tool.guides.length ? `<div class="provider-grid">${tool.guides.map((g) => `<article class="log-card guide-card"><h3>${sourceLink(g.url, g.title)}</h3><p>Published <time datetime="${escape(g.published_at)}">${escape(g.published_at)}</time> · 1200km archive</p><p>${sourceLink(g.original_url, 'Original publication')}</p></article>`).join('')}</div>` : '<p class="empty">No matching author guide was selected from the reviewed archive snapshot. Use the primary documentation and evidence links below.</p>'}</section>
    <section id="tool-techniques" class="panel"><h2>Linked techniques and evidence</h2><p>These links explain behavior, not execution readiness or tool-specific detection coverage. Software use, test identity and editorial capability are different assertions.</p>
      ${tool.technique_count ? `<p><a href="${url('')}?tool=${encodeURIComponent(tool.name)}">Filter the TTP inventory by ${escape(tool.name)} →</a></p><label class="related-search">Search linked TTPs<input id="tool-related-search" type="search" placeholder="Technique ID, name or evidence type"></label><p id="tool-related-count" role="status" aria-live="polite"></p><div id="tool-related-list" class="candidate-list"></div><nav class="pager" aria-label="Linked technique pages"><button id="tool-related-previous" class="secondary">Previous</button><span id="tool-related-page"></span><button id="tool-related-next" class="secondary">Next</button></nav>` : '<p class="empty">No reviewed TTP association yet. Preparation utilities and orchestration services do not inherit the behavior of every tool they can support.</p>'}</section>
    <section id="tool-telemetry" class="panel"><h2>Telemetry context from linked TTPs</h2><p>These are the linked techniques’ telemetry references, <strong>not validated signatures for this tool</strong>. Use each technique’s platform, procedure and visibility limits to select collectors. Tool presence or a log event alone does not prove malicious activity.</p>
      ${tool.telemetry_context.length ? `<details><summary>Explore ${tool.telemetry_context.length} telemetry references</summary><div class="tags">${tool.telemetry_context.map((r) => `<a class="chip telemetry telemetry-link" href="${url(r.page)}">${escape(r.tag)}</a>`).join('')}</div></details>` : `<p>No technique-derived telemetry mapped here. <a href="${url('telemetry/')}">Browse the telemetry library</a> after selecting a specific behavior.</p>`}</section>
    <section id="tool-lab" class="panel"><h2>Before selecting a lab procedure</h2><ul><li>Select a specific behavior, tool/module version and isolated authorized target; a framework name is not a procedure.</li><li>Review source integrity, licensing, privileges, credentials, service disruption, cleanup and rollback before installation.</li><li>Collect a baseline, native telemetry and collector-health evidence. Confirm the observed behavior independently of the tool’s success message.</li><li>Keep synthetic fixtures, documented procedures and captured lab results separate. No live result is asserted by this library.</li></ul></section>
    <section id="tool-sources" class="panel"><h2>Sources and machine-readable evidence</h2><ul><li>${sourceLink(tool.source_url, 'Primary software reference')}</li><li><a href="${url(`data/tools/${tool.id}.json`)}">This tool’s guides, relationship IDs, citations and telemetry paths (JSON)</a></li><li><a href="${url('data/tools.json')}">Pinned source manifest, guide snapshot provenance and library scope</a></li><li><a href="${url('telemetry/')}">Telemetry reference library</a> · ${sourceLink('https://1200km.com/guides.html', '1200km Guides')}</li></ul></section>`;
  if (!tool.technique_count) return;
  let currentPage = 1;
  function update() {
    const terms = document.querySelector('#tool-related-search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const rows = tool.techniques.filter((r) => terms.every((t) => [r.id, r.name, r.domain, ...r.bases.map((b) => basisLabels[b])].join(' ').toLowerCase().includes(t)));
    const page = pageSlice(rows, currentPage, 12);
    currentPage = page.page;
    document.querySelector('#tool-related-count').textContent = `${rows.length} of ${tool.technique_count} linked TTPs`;
    document.querySelector('#tool-related-list').innerHTML = page.records.length ? page.records.map((r) => `<article class="log-card tool-relationship"><h3><a class="tool-technique-link" href="${url(r.page)}#attack-tools">${escape(r.id)} · ${escape(r.name)}</a></h3><p><a class="tool-detection-link" href="${url(`detections/${r.key}/`)}">Detection rules and anomalies →</a></p><p class="muted">${escape(r.domain)} · ${escape(r.platforms.join(', '))}</p>${evidenceHtml(r.evidence, context)}</article>`).join('') : '<p class="empty">No matching linked techniques.</p>';
    document.querySelector('#tool-related-page').textContent = `Page ${page.page} of ${page.pages}`;
    document.querySelector('#tool-related-previous').disabled = page.page === 1;
    document.querySelector('#tool-related-next').disabled = page.page === page.pages;
  }
  document.querySelector('#tool-related-search').addEventListener('input', () => { currentPage = 1; update(); });
  document.querySelector('#tool-related-previous').addEventListener('click', () => { currentPage--; update(); });
  document.querySelector('#tool-related-next').addEventListener('click', () => { currentPage++; update(); });
  update();
}
