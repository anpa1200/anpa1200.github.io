// Rendering only: no collector installation, command execution or network targets.
export function renderTelemetryLibrary(library, { app, escape, url }) {
  const state = Object.fromEntries(new URLSearchParams(location.search));
  const categories = [...new Set(library.records.map((r) => r.category))].sort();
  app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url('')}">TTP Simulation</a><span>Telemetry Library</span></nav>
    <section class="hero"><div><p class="eyebrow">COLLECTION / CONTEXT / VALIDATION</p><h1>Telemetry Library</h1><p class="lead">Know what the signal means—and how to collect it.</p><p>A dedicated reference for every telemetry tag in the technique catalog. Each page explains the signal, provider options, configuration, synthetic examples and visibility limits.</p></div><div class="version">${library.counts.total} references<small>${library.counts.attack_component} ATT&CK components · ${library.counts.proposed_input} proposed inputs</small></div></section>
    <div class="notice" role="note"><strong>Reference guidance, not verified collection.</strong> Examples are project-normalized synthetic JSON, not native provider captures. Proposed inputs are never promoted to official ATT&CK mappings. Provider availability, schemas and licensing must be checked in your lab. Reviewed ${escape(library.reviewed_on)}.</div>
    <form id="telemetry-filters" class="library-filters"><label>Search telemetry<input name="q" type="search" placeholder="Type, provider, description, ID…" autocomplete="off"></label><label>Category<select name="category"><option value="">All categories</option>${categories.map((c) => `<option>${escape(c)}</option>`).join('')}</select></label><label>Evidence tier<select name="kind"><option value="">Both tiers</option value="attack_component">ATT&CK component</option><option value="proposed_input">Proposed input</option></select></label><button type="reset" class="secondary">Reset</button></form>
    <p id="telemetry-count" role="status" aria-live="polite"></p><div id="telemetry-cards" class="library-cards"></div>
    <nav class="pager" aria-label="Telemetry results pages"><button id="telemetry-previous" class="secondary">Previous</button><span id="telemetry-page"></span><button id="telemetry-next" class="secondary">Next</button></nav>
    <p class="muted">Categories and provider guides are editorial, not new ATT&CK assertions. Technique associations come only from the existing catalog mappings. <a href="${url('data/telemetry.json')}">Download the library index</a>.</p>`;
  const form = document.querySelector('#telemetry-filters');
  for (const element of form.elements) if (element.name && state[element.name]) element.value = state[element.name];
  let page = Math.max(1, Number(state.page) || 1);
  function update() {
    const filters = Object.fromEntries(new FormData(form));
    const words = (filters.q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const results = library.records.filter((r) => (!filters.category || filters.category === r.category) && (!filters.kind || filters.kind === r.kind) && words.every((w) => [r.id, r.name, r.description, r.category, ...r.providers.map((p) => p.name)].join(' ').toLowerCase().includes(w)));
    const pages = Math.max(1, Math.ceil(results.length / 24));
    page = Math.min(pages, Math.max(1, Math.floor(page)));
    const params = new URLSearchParams(Object.entries({ ...filters, page: page > 1 ? page : '' }).filter(([, v]) => v));
    history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}`);
    document.querySelector('#telemetry-count').textContent = `${results.length} of ${library.counts.total} telemetry types`;
    document.querySelector('#telemetry-cards').innerHTML = results.slice((page - 1) * 24, page * 24).map((r) => `<article class="telemetry-card"><p class="eyebrow">${escape(r.category)}</p><h2><a href="${url(r.page)}">${escape(r.name)}</a></h2><p>${escape(r.description)}</p><p class="muted">${r.kind === 'attack_component' ? escape(r.id) + ' · ATT&CK component' : 'Analyst-proposed input'} · ${r.technique_count} linked techniques</p><p class="provider-preview">${r.providers.map((p) => escape(p.name)).join(' · ')}</p></article>`).join('') || '<p class="empty">No matching telemetry types. Change the filters or reset the search.</p>';
    document.querySelector('#telemetry-page').textContent = `Page ${page} of ${pages}`;
    document.querySelector('#telemetry-previous').disabled = page === 1;
    document.querySelector('#telemetry-next').disabled = page === pages;
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => { page = 1; update(); });
  form.addEventListener('reset', () => { page = 1; setTimeout(update); });
  document.querySelector('#telemetry-previous').addEventListener('click', () => { page--; update(); });
  document.querySelector('#telemetry-next').addEventListener('click', () => { page++; update(); });
  update();
}

export function renderTelemetryReference(row, { app, escape, url, sourceLink }) {
  const sources = Object.fromEntries(row.sources.map((s) => [s.id, s]));
  const cite = (id) => sourceLink(sources[id]?.url, sources[id]?.title || id);
  const list = (items, ordered = false) => `<${ordered ? 'ol' : 'ul'}>${items.map((s) => `<li>${escape(s)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
  const example = row.configuration_example;
  app.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url('')}">TTP Simulation</a><a href="${url('telemetry/')}">Telemetry Library</a></nav>
    <section class="hero detail-hero"><div><p class="eyebrow">TELEMETRY REFERENCE / ${escape(row.category)}</p><h1>${escape(row.name)}</h1><p class="lead compact">${escape(row.description)}</p><div class="tags"><span class="chip">${row.kind === 'attack_component' ? escape(row.id) + ' · ATT&CK component' : 'Proposed input · not an ATT&CK component mapping'}</span><span class="chip">${row.technique_count} linked techniques</span><span class="chip">Collection not live-validated</span></div></div></section>
    <nav class="section-nav" aria-label="Telemetry sections"><a href="#providers">Providers</a><a href="#configuration">Configuration</a><a href="#example">Event example</a><a href="#validation">Validation & limits</a><a href="#techniques">Related TTPs</a><a href="#sources">Sources</a></nav>
    <section id="providers" class="panel"><h2>Common providers and collection options</h2><p>Choose the collector for the actual platform and signal. These are alternatives with different visibility—not interchangeable implementations.</p><div class="provider-grid">${row.providers.map((p) => `<article class="log-card"><h3>${escape(p.name)}</h3><p>${escape(p.scope)}</p><p>${cite(p.source_id)}</p></article>`).join('')}</div></section>
    <section id="configuration" class="panel"><h2>Collection configuration</h2><p class="notice"><strong>For this telemetry type:</strong> ${escape(row.collection_focus)}</p><h3>Setup checklist</h3>${list(row.configuration, true)}<p class="muted">Apply only to an authorized lab after reviewing the installed version. This website does not install sensors or change any configuration.</p><p>Collection documentation: ${row.sources.map((s) => sourceLink(s.url, s.title)).join(' · ')}</p>
    ${example ? `<h3>${escape(example.label)}</h3><pre class="code-sample" tabindex="0" aria-label="${escape(example.language)} collection example"><code>${escape(example.content)}</code></pre><p>${escape(example.note)}</p><p>${cite(example.source_id)}</p>` : ''}</section>
    <section id="example" class="panel"><div class="panel-title"><h2>Event example</h2><a href="${url(`data/telemetry-examples/${row.id}.json`)}" download>Download synthetic JSON</a></div><p class="notice"><strong>Synthetic · normalized · not captured.</strong> ${escape(row.example_note)}</p><pre class="code-sample" tabindex="0" aria-label="Synthetic telemetry JSON example"><code>${escape(JSON.stringify(row.example, null, 2))}</code></pre><h3>Fields to preserve for this example</h3><div class="tags">${row.required_fields.map((f) => `<span class="chip mono">${escape(f)}</span>`).join('')}</div><p class="muted">These project field names illustrate the signal. Map and test native provider fields explicitly; they are not an ECS, OCSF or vendor schema claim.</p></section>
    <section id="validation" class="panel"><h2>Validation and visibility limits</h2><p>${escape(row.limitations)}</p>${row.caveat ? `<p class="notice">${escape(row.caveat)}</p>` : ''}${row.kind === 'proposed_input' ? '<p class="notice">This is an analyst-proposed planning input. It may show a consequence or external context without directly observing the technique or establishing malicious intent.</p>' : ''}${list(row.validation, true)}<p><strong>Current status:</strong> reference content and synthetic examples authored; no native capture, collector integration, detection result or live simulation claimed.</p></section>
    <section id="techniques" class="panel"><div class="panel-title"><h2>Related TTP workspaces</h2><a href="${url('')}?telemetry=${encodeURIComponent(row.filter_query)}">Filter the full catalog</a></div><p>${row.kind === 'attack_component' ? 'These links follow the existing ATT&CK detection-strategy → analytic → data-component relationships.' : 'These links follow the explicitly labeled analyst planning inputs in the existing catalog, not an official ATT&CK component relationship.'} Each technique page retains its evidence and platform-specific log-source guidance.</p><label class="related-search">Find a related technique<input id="related-search" type="search" placeholder="Technique ID, name or domain…"></label><p id="related-count" role="status" aria-live="polite"></p><ul id="related-techniques" class="related-techniques"></ul><nav class="pager" aria-label="Related techniques pages"><button id="related-previous" class="secondary">Previous</button><span id="related-page"></span><button id="related-next" class="secondary">Next</button></nav></section>
    <section id="sources" class="panel"><h2>Sources and evidence boundary</h2><p>Editorial collection guidance reviewed ${escape(row.reviewed_on)}. Provider documentation is linked for verification; configurations and examples still require testing against your environment.</p><ul>${row.url ? `<li>${sourceLink(row.url, `${row.id} · official ATT&CK data component`)} · source object modified ${escape(row.modified)}</li>` : '<li>Project-defined planning input; no official data-component ID asserted.</li>'}${row.sources.map((s) => `<li>${sourceLink(s.url, s.title)}</li>`).join('')}<li><a href="${url(`data/telemetry/${row.id}.json`)}">Complete reference and technique associations (JSON)</a></li><li><a href="${url('data/catalog.json')}">Pinned ATT&CK source manifest</a></li></ul><p>Provider choices, categories, setup guidance and examples are editorial additions. An ATT&CK association identifies relevant information; it does not certify a provider, configuration, detection or simulation.</p></section>`;
  let page = 1;
  function updateRelated() {
    const q = document.querySelector('#related-search').value.toLowerCase().trim();
    const rows = row.techniques.filter((r) => `${r.id} ${r.name} ${r.domain}`.toLowerCase().includes(q));
    const pages = Math.max(1, Math.ceil(rows.length / 20));
    page = Math.min(page, pages);
    document.querySelector('#related-count').textContent = `${rows.length} of ${row.technique_count} linked techniques`;
    document.querySelector('#related-techniques').innerHTML = rows.slice((page - 1) * 20, page * 20).map((r) => `<li><a href="${url(r.page)}#telemetry"><span class="mono">${escape(r.id)}</span> ${escape(r.name)}</a><span class="muted">${escape(r.domain)}</span> <a class="telemetry-detection-link" href="${url(`detections/${r.key}/`)}">Detection rules →</a></li>`).join('') || '<li>No matching techniques.</li>';
    document.querySelector('#related-page').textContent = `Page ${page} of ${pages}`;
    document.querySelector('#related-previous').disabled = page === 1;
    document.querySelector('#related-next').disabled = page === pages;
  }
  document.querySelector('#related-search').addEventListener('input', () => { page = 1; updateRelated(); });
  document.querySelector('#related-previous').addEventListener('click', () => { page--; updateRelated(); });
  document.querySelector('#related-next').addEventListener('click', () => { page++; updateRelated(); });
  updateRelated();
}
