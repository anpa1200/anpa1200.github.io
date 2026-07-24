const FULL_VERSION_URL = 'https://1200km.com/adversarygraph/';
const DOCS_URL = 'https://1200km.com/adversarygraph-docs/';
const GITHUB_URL = 'https://github.com/anpa1200/adversarygraph';
const FEATURE_GUIDES_URL = `${FULL_VERSION_URL}full-version-feature-guides.html`;

const modules = [
  { group: 'Public workspace', id: 'discover', icon: '◆', name: 'Discover', meta: 'public intelligence overview', live: true },
  { group: 'Public workspace', id: 'navigator', icon: '▦', name: 'Navigator', meta: 'ATT&CK matrix and layers', live: true },
  { group: 'Public workspace', id: 'apt', icon: '◎', name: 'APT Library', meta: 'groups, aliases, TTPs', live: true },
  { group: 'Public workspace', id: 'compare', icon: '⇄', name: 'Compare', meta: 'group overlap analysis', live: true },
  { group: 'Public workspace', id: 'coverage', icon: '◫', name: 'Coverage Leads', meta: 'static detection gaps', live: true },
  { group: 'Public workspace', id: 'export', icon: '⇩', name: 'Layer Export', meta: 'Navigator JSON export', live: true },
  { group: 'Analysis', id: 'analyze', icon: '✦', name: 'AI Analyze', meta: 'reports, logs, PDFs', docsPath: '#analyze' },
  { group: 'Analysis', id: 'reports-research', icon: '▤', name: 'Reports Research', meta: 'stored report sessions', docsPath: '#reports-research' },
  { group: 'Analysis', id: 'evidence-graph', icon: '⟠', name: 'Evidence Graph', meta: 'persistent evidence links', docsPath: '#evidence-graph' },
  { group: 'Operations', id: 'operations', icon: '☷', name: 'Operations', meta: 'cases and tasks', docsPath: '#operations' },
  { group: 'Operations', id: 'pipeline', icon: '↯', name: 'Pipeline', meta: 'workflow automation', docsPath: '#pipeline' },
  { group: 'Operations', id: 'observability', icon: '◌', name: 'Observability', meta: 'self-test and audit', docsPath: '#observability' },
  { group: 'Threat programs', id: 'threat-radar', icon: '◉', name: 'Threat Radar', meta: 'business relevance monitor', docsPath: '#threat-radar' },
  { group: 'Threat programs', id: 'asset-surface', icon: '▧', name: 'Asset Surface', meta: 'asset/CVE/IOC matching', docsPath: '#asset-surface' },
  { group: 'Threat programs', id: 'threat-hunting', icon: '⌕', name: 'Threat Hunting', meta: 'AI-assisted hunts', docsPath: '#threat-hunting' },
  { group: 'Threat programs', id: 'query-library', icon: '⌘', name: 'Query Library', meta: 'Sigma, SPL, KQL, YARA-L', docsPath: '#query-library' },
  { group: 'Intelligence feeds', id: 'ioc-library', icon: '●', name: 'IOC Library', meta: 'static URLhaus demo store', live: true, docsPath: '#ioc-library' },
  { group: 'Intelligence feeds', id: 'ioc-investigation', icon: '◍', name: 'IOC Investigation', meta: 'VT, OTX, urlscan, Shodan', docsPath: '#ioc-investigation' },
  { group: 'Intelligence feeds', id: 'cve', icon: '◇', name: 'CVE Intelligence', meta: 'static CISA KEV demo', live: true, docsPath: '#cve' },
  { group: 'Intelligence feeds', id: 'feeds', icon: '↻', name: 'Feeds Management', meta: 'keys and source sync', docsPath: '#feeds' },
  { group: 'Validation lab', id: 'attack-simulation', icon: '▶', name: 'Attack Simulation', meta: 'rule validation traffic', docsPath: '#attack-simulation' },
  { group: 'Validation lab', id: 'retrohunt', icon: '↺', name: 'RetroHunt', meta: 'historical validation jobs', docsPath: '#retrohunt' },
  { group: 'MalwareGraph', id: 'malware-analysis', icon: '☣', name: 'Malware Analysis', meta: 'static/dynamic workbench', docsPath: '#malware-analysis' },
  { group: 'MalwareGraph', id: 'malware-unpacker', icon: '▣', name: 'Malware Unpacker', meta: 'packing and strings', docsPath: '#malware-unpacker' },
  { group: 'MalwareGraph', id: 'dynamic-analysis', icon: '▸', name: 'Dynamic Analysis', meta: 'sandbox-backed execution', docsPath: '#dynamic-analysis' },
  { group: 'Admin', id: 'knowledge', icon: '▥', name: 'Knowledge Library', meta: 'public source map and RAG guide', live: true, docsPath: '#knowledge' },
  { group: 'Admin', id: 'statistics', icon: '▰', name: 'Statistics', meta: 'database analytics', docsPath: '#statistics' },
  { group: 'Admin', id: 'troubleshooting', icon: '?', name: 'Troubleshooting', meta: 'operator diagnostics', docsPath: '#troubleshooting' },
];

const state = {
  active: 'discover',
  data: null,
  query: '',
  selectedTechniqueId: '',
  selectedGroupId: '',
  compareA: '',
  compareB: '',
  domainFile: 'mitre-data.json',
  expandedTechniqueIds: new Set(),
  matrixScale: 0.82,
  matrixScroll: { left: 0, top: 0 },
  aptListScrollTop: 0,
  iocLibrary: { items: [], source: {}, count: 0 },
  cveLibrary: { items: [], source: {}, count: 0 },
};

const root = document.querySelector('#root');

init().catch(error => {
  root.innerHTML = `<main class="noscript"><h1>Threat Matrix failed to load</h1><p>${escapeHtml(error.message || String(error))}</p></main>`;
});

async function init() {
  renderShell();
  await Promise.all([loadDomain('mitre-data.json'), loadDemoLibraries()]);
  bindGlobalEvents();
  render();
}

function renderShell() {
  root.innerHTML = `
    <div class="ag-app">
      <aside class="sidebar" id="sidebar" aria-label="AdversaryGraph Light modules">
        <div class="brand">
          <div class="brand-mark">AG</div>
          <div>
            <div class="brand-title">Threat Matrix</div>
            <div class="brand-subtitle">AdversaryGraph Light · public web</div>
          </div>
        </div>
        <nav class="sidebar-scroll" id="module-nav"></nav>
        <div class="sidebar-footer">
          <div>Full platform: <a href="${FULL_VERSION_URL}">AdversaryGraph</a></div>
          <div><a href="${DOCS_URL}">Docs</a> · <a href="${GITHUB_URL}">GitHub</a></div>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="topbar-title">
            <button class="mobile-menu" id="mobile-menu" type="button" aria-controls="sidebar" aria-expanded="false">Modules</button>
            <strong id="page-title">Threat Matrix</strong>
            <span id="page-subtitle">Light web version of AdversaryGraph</span>
          </div>
          <div class="topbar-actions">
            <label class="searchbox" aria-label="Search actors, aliases, techniques, IDs, and descriptions">
              <span aria-hidden="true">⌕</span>
              <input id="global-search" type="search" placeholder="Search T1059, MuddyWater, PowerShell…" autocomplete="off" spellcheck="false" />
              <button class="searchbox-button" type="button" aria-label="Search this workspace">Search</button>
            </label>
            <span class="pill">browser-only</span>
            <form class="tm-search-scopes__global" action="/search.html" method="get" role="search">
              <label for="tm-global-search">Search all 1200km research</label>
              <input id="tm-global-search" name="q" type="search" value="AdversaryGraph" autocomplete="off" />
              <button class="button" type="submit">Search all</button>
            </form>
          </div>
        </header>
        <main class="main" id="workspace" tabindex="-1"></main>
      </div>
    </div>
    <div class="modal-backdrop" id="full-modal" role="dialog" aria-modal="true" aria-labelledby="full-modal-title">
      <section class="modal">
        <div class="modal-head">
          <div>
            <h2 id="full-modal-title">Available in full AdversaryGraph</h2>
            <p id="full-modal-subtitle"></p>
          </div>
          <button class="close-button" type="button" data-close-modal>Close</button>
        </div>
        <div class="modal-body" id="full-modal-body"></div>
        <div class="modal-actions">
          <a class="button primary" href="${FULL_VERSION_URL}">Open product page</a>
          <a class="button" href="${DOCS_URL}">Read docs</a>
          <a class="button" href="${GITHUB_URL}">Deploy from GitHub</a>
          <button class="button ghost" type="button" data-close-modal>Continue in Light</button>
        </div>
      </section>
    </div>
    <div class="modal-backdrop" id="workspace-search-modal" role="dialog" aria-modal="true" aria-label="Search this workspace">
      <section class="modal workspace-search-dialog">
        <div class="modal-head">
          <div>
            <h2>Search this workspace</h2>
            <p>Search actors, aliases, ATT&amp;CK techniques, IDs, and descriptions in the public light matrix.</p>
          </div>
          <button class="close-button" type="button" data-close-workspace-search>Close</button>
        </div>
        <div class="modal-body">
          <label class="searchbox workspace-dialog-search" aria-label="Search this workspace">
            <span aria-hidden="true">⌕</span>
            <input id="workspace-dialog-input" type="search" placeholder="T1059, MuddyWater, PowerShell…" autocomplete="off" spellcheck="false" />
          </label>
          <p class="small-note">Results update the local matrix only. Use the separate global research search control to search all 1200km content.</p>
        </div>
      </section>
    </div>
    <div class="toast hidden" id="toast" role="status"></div>
  `;
  renderModuleNav();
}

function renderModuleNav() {
  const nav = document.querySelector('#module-nav');
  const groups = groupBy(modules, item => item.group);
  nav.innerHTML = Object.entries(groups).map(([group, items]) => `
    <div class="module-group-title">${escapeHtml(group)}</div>
    ${items.map(module => `
      <button class="module-button ${state.active === module.id ? 'is-active' : ''}" type="button" data-module="${module.id}" aria-current="${state.active === module.id ? 'page' : 'false'}">
        <span class="module-icon">${module.icon}</span>
        <span>
          <span class="module-name">${escapeHtml(module.name)}</span>
          <span class="module-meta">${escapeHtml(module.meta)}</span>
        </span>
        <span class="module-badge ${module.live ? 'live' : 'full'}">${module.live ? 'live' : 'full'}</span>
      </button>
    `).join('')}
  `).join('');
}

async function loadDomain(file) {
  const response = await fetch(`./${file}`, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Cannot load ${file}: HTTP ${response.status}`);
  state.data = await response.json();
  state.domainFile = file;
  if (!state.data.techniques.some(t => t.id === state.selectedTechniqueId)) state.selectedTechniqueId = '';
  if (!state.data.groups.some(g => g.id === state.selectedGroupId)) state.selectedGroupId = state.data.groups[0]?.id || '';
  if (!state.data.groups.some(g => g.id === state.compareA)) state.compareA = state.data.groups[0]?.id || '';
  if (!state.data.groups.some(g => g.id === state.compareB)) state.compareB = state.data.groups[1]?.id || state.data.groups[0]?.id || '';
  state.expandedTechniqueIds.clear();
  state.matrixScroll = { left: 0, top: 0 };
}

async function loadDemoLibraries() {
  const [iocLibrary, cveLibrary] = await Promise.all([
    fetch('./demo-data/iocs.json', { cache: 'force-cache' }).then(response => response.ok ? response.json() : null).catch(() => null),
    fetch('./demo-data/cves.json', { cache: 'force-cache' }).then(response => response.ok ? response.json() : null).catch(() => null),
  ]);
  if (iocLibrary) state.iocLibrary = iocLibrary;
  if (cveLibrary) state.cveLibrary = cveLibrary;
}

function bindGlobalEvents() {
  document.addEventListener('click', async event => {
    const moduleButton = event.target.closest('[data-module]');
    if (moduleButton) {
      const id = moduleButton.dataset.module;
      const module = modules.find(item => item.id === id);
      if (!module.live) {
        openFullVersionModal(module);
        return;
      }
      captureActiveView();
      state.active = id;
      closeSidebar();
      render();
      return;
    }
    const matrixAction = event.target.closest('[data-matrix-action]');
    if (matrixAction) {
      handleMatrixAction(matrixAction.dataset.matrixAction);
      return;
    }
    const tacticToggle = event.target.closest('[data-tactic-toggle]');
    if (tacticToggle) {
      captureActiveView();
      setTacticExpansion(tacticToggle.dataset.tacticToggle, tacticToggle.dataset.expand === 'true');
      render();
      return;
    }
    const subtechniqueToggle = event.target.closest('[data-toggle-subtechnique]');
    if (subtechniqueToggle) {
      captureActiveView();
      const id = subtechniqueToggle.dataset.toggleSubtechnique;
      if (state.expandedTechniqueIds.has(id)) state.expandedTechniqueIds.delete(id);
      else state.expandedTechniqueIds.add(id);
      render();
      return;
    }
    const closeTechniqueDetail = event.target.closest('[data-close-technique-detail]');
    if (closeTechniqueDetail) {
      captureActiveView();
      state.selectedTechniqueId = '';
      render();
      return;
    }
    const techniqueButton = event.target.closest('[data-technique-id]');
    if (techniqueButton) {
      captureActiveView();
      state.selectedTechniqueId = techniqueButton.dataset.techniqueId;
      if (state.active !== 'navigator') state.active = 'navigator';
      render();
      return;
    }
    const groupButton = event.target.closest('[data-group-id]');
    if (groupButton) {
      captureActiveView();
      state.selectedGroupId = groupButton.dataset.groupId;
      if (state.active !== 'apt') state.active = 'apt';
      render();
      return;
    }
    const exportButton = event.target.closest('[data-export-layer]');
    if (exportButton) exportNavigatorLayer();
    const workspaceSearch = event.target.closest('.searchbox-button');
    if (workspaceSearch) {
      document.querySelector('#global-search')?.focus();
      document.querySelector('#workspace')?.scrollIntoView({ block: 'start' });
    }
    const close = event.target.closest('[data-close-modal]');
    if (close || event.target.id === 'full-modal') closeModal();
    const closeWorkspace = event.target.closest('[data-close-workspace-search]');
    if (closeWorkspace || event.target.id === 'workspace-search-modal') closeWorkspaceSearch();
  });
  document.addEventListener('change', async event => {
    if (event.target.id === 'domain-select') {
      await loadDomain(event.target.value);
      render();
    }
    if (event.target.id === 'compare-a') {
      state.compareA = event.target.value;
      render();
    }
    if (event.target.id === 'compare-b') {
      state.compareB = event.target.value;
      render();
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'global-search') {
      state.query = event.target.value.trim();
      render();
    }
    if (event.target.id === 'workspace-dialog-input') {
      state.query = event.target.value.trim();
      const headerInput = document.querySelector('#global-search');
      if (headerInput) headerInput.value = event.target.value;
      render();
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openWorkspaceSearch();
      return;
    }
    if (event.key === 'Escape') {
      closeModal();
      closeWorkspaceSearch();
      closeSidebar();
    }
  });
  document.querySelector('#mobile-menu').addEventListener('click', () => {
    const sidebar = document.querySelector('#sidebar');
    const open = !sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open', open);
    document.querySelector('#mobile-menu').setAttribute('aria-expanded', String(open));
  });
}

function render() {
  renderModuleNav();
  const active = modules.find(item => item.id === state.active);
  document.querySelector('#page-title').textContent = active?.name || 'Threat Matrix';
  document.querySelector('#page-subtitle').textContent = active?.meta || 'AdversaryGraph Light';
  const main = document.querySelector('#workspace');
  const html = {
    discover: renderDiscover,
    navigator: renderNavigator,
    apt: renderAptLibrary,
    compare: renderCompare,
    coverage: renderCoverage,
    export: renderExport,
    'ioc-library': renderIocLibrary,
    cve: renderCveLibrary,
    knowledge: renderKnowledgeLibrary,
  }[state.active]?.() || renderDiscover();
  main.innerHTML = html;
  requestAnimationFrame(restoreActiveView);
}

function renderDiscover() {
  const data = state.data;
  const filteredTechniques = filterTechniques().slice(0, 6);
  const filteredGroups = filterGroups().slice(0, 5);
  return `
    <section class="hero">
      <div class="panel hero-copy">
        <div class="eyebrow">AdversaryGraph Light · public browser workspace</div>
        <h1>ATT&amp;CK exploration with the Adversary<wbr>Graph product shape.</h1>
        <p>Threat Matrix is the public light web version of AdversaryGraph. It uses the same dark analyst workbench layout and exposes real browser-only functions: matrix navigation, actor pivots, TTP search, overlap comparison, coverage leads, and Navigator-style layer export.</p>
        <p>Backend modules are shown as product-real buttons. When a feature requires local storage, API keys, AI providers, enrichment workers, MalwareGraph, attack-lab containers, or SIEM forwarding, the button opens a clear full-version disclaimer.</p>
        <div class="cta-row">
          <button class="button primary" type="button" data-module="navigator">Open Navigator</button>
          <button class="button" type="button" data-module="apt">Browse APT Library</button>
          <a class="button" href="${FULL_VERSION_URL}">Full AdversaryGraph</a>
          <a class="button" href="${GITHUB_URL}">GitHub</a>
        </div>
        <div class="metrics">
          <div class="metric"><strong>${data.groups.length}</strong><span>ATT&amp;CK groups</span></div>
          <div class="metric"><strong>${data.techniques.length}</strong><span>techniques and sub-techniques</span></div>
          <div class="metric"><strong>${data.version}</strong><span>${escapeHtml(data.domain)} data version</span></div>
        </div>
      </div>
      <div class="notice">
        <strong>Light-version boundary</strong>
        <p>This page does not run AI analysis, query telemetry, sync private feeds, store investigations, execute malware, simulate attacks, or forward SIEM events. Those operations require the self-hosted AdversaryGraph deployment.</p>
      </div>
    </section>
    <section class="grid">
      <div class="panel card span-7">
        <div class="card-head"><div><h2>Fast matches</h2><p>Search results from local ATT&amp;CK JSON.</p></div>${domainPicker()}</div>
        <div class="list">${filteredTechniques.map(techniqueCard).join('') || emptyState('No technique matches.')}</div>
      </div>
      <div class="panel card span-5">
        <div class="card-head"><div><h2>Actor pivots</h2><p>Groups with matching names, aliases, descriptions, or TTPs.</p></div></div>
        <div class="list">${filteredGroups.map(groupCard).join('') || emptyState('No group matches.')}</div>
      </div>
      <div class="panel card span-12">
        <div class="card-head"><div><h2>Full platform modules</h2><p>Buttons mirror AdversaryGraph modules; backend-required modules open an availability disclaimer.</p></div></div>
        <div class="module-grid">${modules.filter(item => !item.live).map(moduleCard).join('')}</div>
      </div>
    </section>
  `;
}

function renderNavigator() {
  const selected = techniqueById(state.selectedTechniqueId);
  return `
    <section class="navigator-workspace ${selected ? 'has-detail' : ''}">
      <div class="panel card matrix-panel">
        <div class="card-head">
          <div><h2>Navigator</h2><p>Compact ATT&amp;CK matrix. Scroll or drag the canvas, zoom to fit, and expand sub-techniques when needed.</p></div>
          <div class="toolbar">${domainPicker()}<button class="button" type="button" data-export-layer>Export layer</button></div>
        </div>
        <div class="matrix-controls" role="toolbar" aria-label="Matrix view controls">
          <div class="matrix-control-group">
            <button class="matrix-control" type="button" data-matrix-action="zoom-out" aria-label="Zoom matrix out">−</button>
            <output class="matrix-scale" aria-live="polite">${Math.round(state.matrixScale * 100)}%</output>
            <button class="matrix-control" type="button" data-matrix-action="zoom-in" aria-label="Zoom matrix in">+</button>
            <button class="matrix-control" type="button" data-matrix-action="fit">Fit matrix</button>
            <button class="matrix-control" type="button" data-matrix-action="reset">100%</button>
          </div>
          <div class="matrix-control-group">
            <button class="matrix-control" type="button" data-matrix-action="expand-all">Expand sub-techniques</button>
            <button class="matrix-control" type="button" data-matrix-action="collapse-all">Collapse all</button>
          </div>
          <span class="matrix-help">ATT&amp;CK ${escapeHtml(state.data.version)} · ${state.data.tactics.length} tactics</span>
        </div>
        <div class="matrix-viewport" tabindex="0" aria-label="ATT&CK matrix. Scroll horizontally and vertically to explore tactics.">
          <div class="matrix-track">${renderMatrix()}</div>
        </div>
      </div>
      ${selected ? `
        <aside class="panel card navigator-detail" aria-label="Selected technique detail">
          <div class="card-head">
            <div><h2>Technique detail</h2><p>Static ATT&amp;CK context from bundled public data.</p></div>
            <button class="close-button" type="button" data-close-technique-detail aria-label="Close technique detail">Close</button>
          </div>
          ${techniqueDetail(selected)}
        </aside>
      ` : ''}
    </section>
  `;
}

function renderAptLibrary() {
  const selected = groupById(state.selectedGroupId) || filterGroups()[0] || state.data.groups[0];
  if (selected) state.selectedGroupId = selected.id;
  return `
    <section class="split-workspace apt-workspace">
      <div class="panel card split-list-panel">
        <div class="card-head"><div><h2>APT Library</h2><p>Public ATT&amp;CK groups, aliases, and mapped techniques.</p></div>${domainPicker()}</div>
        <div class="list workspace-list apt-group-list">${filterGroups().map(groupCard).join('') || emptyState('No groups found.')}</div>
      </div>
      <div class="panel split-detail-panel">
        ${selected ? groupDetail(selected) : emptyState('Select a group.')}
      </div>
    </section>
  `;
}

function renderCompare() {
  const a = groupById(state.compareA);
  const b = groupById(state.compareB);
  const overlap = a && b ? intersection(a.technique_ids || [], b.technique_ids || []) : [];
  const onlyA = a && b ? difference(a.technique_ids || [], b.technique_ids || []) : [];
  const onlyB = a && b ? difference(b.technique_ids || [], a.technique_ids || []) : [];
  return `
    <section class="grid">
      <div class="panel card span-12">
        <div class="card-head"><div><h2>Group comparison</h2><p>Static TTP overlap scoring. Attribution still requires evidence review.</p></div>${domainPicker()}</div>
        <div class="toolbar">
          ${groupSelect('compare-a', state.compareA)}
          ${groupSelect('compare-b', state.compareB)}
        </div>
      </div>
      <div class="panel card span-4"><h2>${overlap.length}</h2><p>Overlapping techniques</p><div class="tag-list">${overlap.slice(0, 24).map(idTag).join('')}</div></div>
      <div class="panel card span-4"><h2>${onlyA.length}</h2><p>${escapeHtml(a?.name || 'Group A')} only</p><div class="tag-list">${onlyA.slice(0, 24).map(idTag).join('')}</div></div>
      <div class="panel card span-4"><h2>${onlyB.length}</h2><p>${escapeHtml(b?.name || 'Group B')} only</p><div class="tag-list">${onlyB.slice(0, 24).map(idTag).join('')}</div></div>
      <div class="panel card span-12">
        <h2>Overlap detail</h2>
        <div class="list">${overlap.map(id => techniqueCard(techniqueById(id))).join('') || emptyState('No overlap for selected groups.')}</div>
      </div>
    </section>
  `;
}

function renderCoverage() {
  const counts = state.data.tactics.map(tactic => {
    const total = state.data.techniques.filter(t => techniqueInTactic(t, tactic)).length;
    const withDetection = state.data.techniques.filter(t => techniqueInTactic(t, tactic) && String(t.detection || '').trim()).length;
    return { tactic, total, withDetection, percent: total ? Math.round((withDetection / total) * 100) : 0 };
  });
  return `
    <section class="grid">
      <div class="panel card span-7">
        <div class="card-head"><div><h2>Coverage leads</h2><p>Static ATT&amp;CK detection-text coverage. Use as triage, not validation proof.</p></div>${domainPicker()}</div>
        <div class="coverage-bars">${counts.map(row => `
          <div class="bar-row">
            <span>${escapeHtml(row.tactic.name)}</span>
            <span class="bar"><span style="width:${row.percent}%"></span></span>
            <strong>${row.percent}%</strong>
          </div>
        `).join('')}</div>
      </div>
      <div class="notice span-5">
        <strong>Detection validation boundary</strong>
        <p>Full AdversaryGraph adds attack simulation, generated validation events, lab targets, endpoint telemetry, rule-test evidence, and SIEM handoff. This light page can identify candidates but does not prove a detection works.</p>
        <div class="button-row"><button class="button primary" data-module="attack-simulation" type="button">Open Attack Simulation</button><a class="button" href="/adversarygraph-docs/attack-simulation/">Read guide</a></div>
      </div>
    </section>
  `;
}

function renderExport() {
  const selected = selectedTechniqueIds();
  return `
    <section class="grid">
      <div class="panel card span-7">
        <div class="card-head"><div><h2>Navigator-style layer export</h2><p>Export current search/highlight context as ATT&amp;CK Navigator-compatible JSON.</p></div>${domainPicker()}</div>
        <p>Current layer contains <strong>${selected.length}</strong> technique(s). Search first to narrow the layer, or export a small starter layer from selected public context.</p>
        <div class="button-row">
          <button class="button primary" type="button" data-export-layer>Download layer JSON</button>
          <button class="button" type="button" data-module="analyze">AI build layer from report</button>
          <button class="button" type="button" data-module="attack-simulation">Validate with simulation</button>
        </div>
      </div>
      <div class="panel card span-5">
        <h2>Layer preview</h2>
        <div class="tag-list">${selected.slice(0, 80).map(idTag).join('') || '<span class="tag">No search filter; top selected technique will be used.</span>'}</div>
      </div>
    </section>
  `;
}

function renderIocLibrary() {
  const items = filterIocs().slice(0, 120);
  const source = state.iocLibrary.source || {};
  return `
    <section class="grid">
      <div class="panel card span-12">
        <div class="card-head">
          <div>
            <h2>IOC Library demo</h2>
            <p>Read-only static IOC library for the public demo. Full AdversaryGraph adds feed scheduling, deduplication, enrichment, scoring, investigation history, and export.</p>
          </div>
          <a class="button" href="${FEATURE_GUIDES_URL}#ioc-library">Full guide</a>
        </div>
        <div class="metrics">
          <div class="metric"><strong>${state.iocLibrary.items.length.toLocaleString('en-US')}</strong><span>URLhaus recent indicators bundled</span></div>
          <div class="metric"><strong>${items.length}</strong><span>shown after current workspace search</span></div>
          <div class="metric"><strong>${formatDate(source.released || state.iocLibrary.generated)}</strong><span>static demo build</span></div>
        </div>
        <p class="small-note">Source: <a href="${escapeHtml(source.url || 'https://urlhaus.abuse.ch/')}" rel="noopener">abuse.ch URLhaus recent URL feed</a>. The light page never syncs private feeds or sends indicators to enrichment APIs.</p>
      </div>
      <div class="panel card span-12">
        <div class="list library-list">${items.map(iocCard).join('') || emptyState('No IOC matches. Use the top search box for URL, tag, reporter, status, or threat searches.')}</div>
      </div>
    </section>
  `;
}

function renderCveLibrary() {
  const items = filterCves().slice(0, 120);
  const source = state.cveLibrary.source || {};
  return `
    <section class="grid">
      <div class="panel card span-12">
        <div class="card-head">
          <div>
            <h2>CVE Intelligence demo</h2>
            <p>Read-only CISA KEV demo set. Full AdversaryGraph adds asset matching, CVSS/EPSS enrichment, references, remediation tracking, and report handoff.</p>
          </div>
          <a class="button" href="${FEATURE_GUIDES_URL}#cve">Full guide</a>
        </div>
        <div class="metrics">
          <div class="metric"><strong>${state.cveLibrary.items.length.toLocaleString('en-US')}</strong><span>known-exploited CVEs bundled</span></div>
          <div class="metric"><strong>${items.length}</strong><span>shown after current workspace search</span></div>
          <div class="metric"><strong>${escapeHtml(source.catalog_version || 'KEV')}</strong><span>CISA catalog version</span></div>
        </div>
        <p class="small-note">Source: <a href="${escapeHtml(source.url || 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog')}" rel="noopener">CISA Known Exploited Vulnerabilities catalog</a>. The public page does not inspect your assets.</p>
      </div>
      <div class="panel card span-12">
        <div class="list library-list">${items.map(cveCard).join('') || emptyState('No CVE matches. Use the top search box for CVE ID, vendor, product, CWE, ransomware, or description searches.')}</div>
      </div>
    </section>
  `;
}

function renderKnowledgeLibrary() {
  return `
    <section class="grid">
      <div class="panel card span-7">
        <div class="card-head">
          <div><h2>Knowledge Library</h2><p>Public source map for the AdversaryGraph RAG corpus and analyst context sources.</p></div>
          <a class="button" href="${FEATURE_GUIDES_URL}#knowledge">Full guide</a>
        </div>
        <p>The public light page links to source material only. Full AdversaryGraph indexes reports, ATT&amp;CK, IOCs, CVEs, hunts, evidence, assets, and operator notes into a controlled local knowledge library for RAG-assisted analysis.</p>
        <div class="source-grid">
          <a class="source-card" href="https://1200km.com/"><strong>1200km main research site</strong><span>Research, articles, labs, project evidence, and public context.</span></a>
          <a class="source-card" href="${DOCS_URL}"><strong>AdversaryGraph docs</strong><span>Setup, feature guides, use cases, validation examples, and architecture.</span></a>
          <a class="source-card" href="/articles/"><strong>Article archive</strong><span>Local article pages and Medium mirrors where available.</span></a>
          <a class="source-card" href="/search.html?q=AdversaryGraph"><strong>Search all 1200km research</strong><span>Domain-wide search across indexed public content.</span></a>
        </div>
      </div>
      <div class="notice span-5">
        <strong>Full-version boundary</strong>
        <p>Vector search, RAG answers, private uploads, and provider-backed AI assistance require the self-hosted AdversaryGraph deployment. This browser page does not upload documents or run retrieval.</p>
        <div class="button-row"><button class="button primary" type="button" data-module="analyze">Open AI Analyze</button><a class="button" href="${FEATURE_GUIDES_URL}#knowledge">RAG/MCP guide</a></div>
      </div>
    </section>
  `;
}

function renderMatrix() {
  const hits = new Set(filterTechniques().map(t => t.id));
  return state.data.tactics.map(tactic => {
    const techniques = state.data.techniques.filter(t => !isSubTechnique(t) && techniqueInTactic(t, tactic));
    const expandable = techniques.filter(parent => state.data.techniques.some(child => child.parent_id === parent.id && techniqueInTactic(child, tactic)));
    const allExpanded = expandable.length > 0 && expandable.every(parent => state.expandedTechniqueIds.has(parent.id));
    return `<section class="tactic-column" data-tactic-column="${escapeHtml(tactic.shortname || tactic.id)}">
      <header class="tactic-title">
        <span class="tactic-name">${escapeHtml(tactic.name)}</span>
        <span class="tactic-meta">${escapeHtml(tactic.id)} · ${techniques.length}</span>
        ${expandable.length ? `
          <button class="tactic-expand" type="button" data-tactic-toggle="${escapeHtml(tactic.shortname || tactic.id)}" data-expand="${allExpanded ? 'false' : 'true'}" aria-label="${allExpanded ? 'Collapse' : 'Expand'} sub-techniques in ${escapeHtml(tactic.name)}">
            ${allExpanded ? '− subs' : '+ subs'}
          </button>
        ` : ''}
      </header>
      <div class="tactic-techniques">${techniques.map(t => {
      const children = state.data.techniques.filter(child => child.parent_id === t.id && techniqueInTactic(child, tactic));
      const matchingChildren = state.query ? children.filter(child => hits.has(child.id)) : [];
      const expanded = state.expandedTechniqueIds.has(t.id) || matchingChildren.length > 0;
      return `
        <div class="technique-group">
          <div class="technique-row">
            <button class="technique ${children.length ? 'has-subtechniques' : ''} ${hits.has(t.id) && state.query ? 'is-hit' : ''} ${state.selectedTechniqueId === t.id ? 'is-selected' : ''}" type="button" data-technique-id="${t.id}">
              <span class="tech-id">${escapeHtml(t.id)}</span><span class="tech-name">${escapeHtml(t.name)}</span>
            </button>
            ${children.length ? `
              <button class="subtechnique-toggle" type="button" data-toggle-subtechnique="${escapeHtml(t.id)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${children.length} sub-techniques for ${escapeHtml(t.name)}">
                <span aria-hidden="true">${expanded ? '−' : '+'}</span><span class="subtechnique-count">${children.length}</span>
              </button>
            ` : ''}
          </div>
          ${children.length && expanded ? `<div class="subtechnique-list">${children.map(child => `
            <button class="technique technique-sub ${hits.has(child.id) && state.query ? 'is-hit' : ''} ${state.selectedTechniqueId === child.id ? 'is-selected' : ''}" type="button" data-technique-id="${child.id}">
              <span class="tech-id">${escapeHtml(child.id)}</span><span class="tech-name">${escapeHtml(child.name)}</span>
            </button>
          `).join('')}</div>` : ''}
        </div>
    `;
    }).join('') || `<p class="empty-column">No public techniques mapped.</p>`}</div>
    </section>`;
  }).join('');
}

function techniqueDetail(technique) {
  const actors = state.data.groups.filter(group => (group.technique_ids || []).includes(technique.id)).slice(0, 12);
  const mitreReference = (technique.references || []).find(reference => reference.source === 'mitre-attack' || /attack\.mitre\.org/.test(reference.url || ''));
  return `<article class="detail">
    <div>
      <div class="eyebrow">${escapeHtml(technique.id)}</div>
      <h2>${escapeHtml(technique.name)}</h2>
      ${mitreReference ? `<a class="detail-source-link" href="${escapeHtml(mitreReference.url)}" rel="noopener">Open MITRE ATT&amp;CK reference ↗</a>` : ''}
    </div>
    <div class="detail-section"><h3>Description</h3><p>${escapeHtml(shortText(technique.description, 900))}</p></div>
    <div class="detail-section"><h3>Detection guidance</h3><p>${escapeHtml(shortText(technique.detection || 'No public detection text in this bundled ATT&CK record.', 700))}</p></div>
    <div class="detail-section"><h3>Data sources</h3><div class="tag-list">${(technique.data_sources || []).slice(0, 16).map(tag).join('') || tag('Not specified')}</div></div>
    <div class="detail-section"><h3>Mapped groups</h3><div class="tag-list">${actors.map(g => `<button class="tag" type="button" data-group-id="${g.id}">${escapeHtml(g.name)}</button>`).join('') || tag('No local group mappings')}</div></div>
  </article>`;
}

function groupDetail(group) {
  const techniques = (group.technique_ids || []).map(techniqueById).filter(Boolean);
  const mitreReference = (group.references || []).find(reference => reference.source === 'mitre-attack' || /attack\.mitre\.org/.test(reference.url || ''));
  return `<article class="card">
    <div class="eyebrow">${escapeHtml(group.id)}</div>
    <h2>${escapeHtml(group.name)}</h2>
    ${mitreReference ? `<a class="detail-source-link" href="${escapeHtml(mitreReference.url)}" rel="noopener">Open MITRE ATT&amp;CK group reference ↗</a>` : ''}
    <p>${escapeHtml(shortText(group.description, 850))}</p>
    <div class="detail-section"><h3>Aliases</h3><div class="tag-list">${(group.aliases || []).slice(0, 24).map(tag).join('') || tag('No aliases')}</div></div>
    <div class="detail-section"><h3>Mapped techniques (${techniques.length})</h3><div class="list">${techniques.slice(0, 80).map(techniqueCard).join('')}</div></div>
  </article>`;
}

function techniqueCard(technique) {
  if (!technique) return '';
  return `<button class="list-item" type="button" data-technique-id="${technique.id}">
    <span class="item-title"><span>${escapeHtml(technique.name)}</span><span>${escapeHtml(technique.id)}</span></span>
    <span class="item-meta">${escapeHtml((technique.tactic_ids || []).join(', ') || 'No tactic')} · ${(technique.data_sources || []).length} data source(s)</span>
  </button>`;
}

function groupCard(group) {
  return `<button class="list-item ${state.selectedGroupId === group.id ? 'is-selected' : ''}" type="button" data-group-id="${group.id}">
    <span class="item-title"><span>${escapeHtml(group.name)}</span><span>${escapeHtml(group.id)}</span></span>
    <span class="item-meta">${escapeHtml((group.aliases || []).slice(0, 4).join(', ') || 'No aliases')} · ${(group.technique_ids || []).length} TTP(s)</span>
  </button>`;
}

function moduleCard(module) {
  return `<button class="module-card" type="button" data-module="${module.id}">
    <span class="pill">${module.icon} full version</span>
    <strong>${escapeHtml(module.name)}</strong>
    <p>${escapeHtml(module.meta)}. Requires self-hosted backend services and operator-controlled data.</p>
    <span class="module-card-link">Guide: ${escapeHtml(module.docsPath ? `${FEATURE_GUIDES_URL}${module.docsPath}` : FEATURE_GUIDES_URL)}</span>
  </button>`;
}

function openFullVersionModal(module) {
  const modal = document.querySelector('#full-modal');
  const docsHref = module.docsPath ? `${FEATURE_GUIDES_URL}${module.docsPath}` : FEATURE_GUIDES_URL;
  document.querySelector('#full-modal-title').textContent = `${module.name} is available in full AdversaryGraph`;
  document.querySelector('#full-modal-subtitle').textContent = module.meta;
  document.querySelector('#full-modal-body').innerHTML = `
    <p><strong>Threat Matrix is the public light web version.</strong> This button is intentionally visible so the web workspace matches the AdversaryGraph product structure, but the operation is not executed here.</p>
    <ul>
      <li>No private reports, logs, assets, IOCs, CVEs, or API keys are uploaded to this public page.</li>
      <li>AI providers, RAG/vector search, feed sync, persistence, MalwareGraph, attack-lab containers, and SIEM validation require the self-hosted deployment.</li>
      <li>Use this light page for public ATT&amp;CK exploration, demos, and discovery. Use full AdversaryGraph for production workflows.</li>
    </ul>
    <p><a class="button primary" href="${docsHref}">Open ${escapeHtml(module.name)} full guide with screenshots</a></p>
  `;
  const docsAction = modal.querySelector('.modal-actions a:nth-child(2)');
  if (docsAction) docsAction.setAttribute('href', docsHref);
  modal.classList.add('is-open');
  modal.querySelector('[data-close-modal]').focus();
}

function closeModal() {
  document.querySelector('#full-modal')?.classList.remove('is-open');
}

function openWorkspaceSearch() {
  const modal = document.querySelector('#workspace-search-modal');
  const input = document.querySelector('#workspace-dialog-input');
  const headerInput = document.querySelector('#global-search');
  if (!modal || !input) return;
  input.value = headerInput?.value || state.query || '';
  modal.classList.add('is-open');
  input.focus();
  input.select();
}

function closeWorkspaceSearch() {
  document.querySelector('#workspace-search-modal')?.classList.remove('is-open');
}

function closeSidebar() {
  document.querySelector('#sidebar')?.classList.remove('is-open');
  document.querySelector('#mobile-menu')?.setAttribute('aria-expanded', 'false');
}

function captureActiveView() {
  const matrix = document.querySelector('.matrix-viewport');
  if (matrix) state.matrixScroll = { left: matrix.scrollLeft, top: matrix.scrollTop };
  const aptList = document.querySelector('.apt-group-list');
  if (aptList) state.aptListScrollTop = aptList.scrollTop;
}

function restoreActiveView() {
  if (state.active === 'navigator') {
    const matrix = document.querySelector('.matrix-viewport');
    const track = document.querySelector('.matrix-track');
    if (!matrix) return;
    if (track) track.style.setProperty('--matrix-scale', String(state.matrixScale));
    matrix.scrollLeft = state.matrixScroll.left;
    matrix.scrollTop = state.matrixScroll.top;
    enableMatrixDrag(matrix);
  }
  if (state.active === 'apt') {
    const aptList = document.querySelector('.apt-group-list');
    if (aptList) {
      aptList.scrollTop = state.aptListScrollTop;
      aptList.addEventListener('scroll', () => {
        if (aptList.isConnected) state.aptListScrollTop = aptList.scrollTop;
      }, { passive: true });
    }
  }
}

function handleMatrixAction(action) {
  if (action === 'zoom-in') {
    setMatrixScale(state.matrixScale + 0.1);
    return;
  }
  if (action === 'zoom-out') {
    setMatrixScale(state.matrixScale - 0.1);
    return;
  }
  if (action === 'reset') {
    setMatrixScale(1);
    return;
  }
  if (action === 'fit') {
    fitMatrixToViewport();
    return;
  }
  if (action === 'expand-all') {
    captureActiveView();
    for (const technique of state.data.techniques) {
      if (!isSubTechnique(technique) && state.data.techniques.some(child => child.parent_id === technique.id)) {
        state.expandedTechniqueIds.add(technique.id);
      }
    }
    render();
    return;
  }
  if (action === 'collapse-all') {
    captureActiveView();
    state.expandedTechniqueIds.clear();
    render();
  }
}

function setMatrixScale(nextScale) {
  const viewport = document.querySelector('.matrix-viewport');
  const track = document.querySelector('.matrix-track');
  if (!viewport || !track) return;
  const centerX = viewport.scrollLeft + (viewport.clientWidth / 2);
  const centerY = viewport.scrollTop + (viewport.clientHeight / 2);
  const previousScale = state.matrixScale;
  state.matrixScale = Math.min(1.4, Math.max(0.35, Math.round(nextScale * 100) / 100));
  track.style.setProperty('--matrix-scale', String(state.matrixScale));
  const scaleOutput = document.querySelector('.matrix-scale');
  if (scaleOutput) scaleOutput.textContent = `${Math.round(state.matrixScale * 100)}%`;
  const ratio = state.matrixScale / previousScale;
  viewport.scrollLeft = Math.max(0, (centerX * ratio) - (viewport.clientWidth / 2));
  viewport.scrollTop = Math.max(0, (centerY * ratio) - (viewport.clientHeight / 2));
  state.matrixScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
}

function fitMatrixToViewport() {
  const viewport = document.querySelector('.matrix-viewport');
  const track = document.querySelector('.matrix-track');
  const lastColumn = track?.lastElementChild;
  if (!viewport || !track || !lastColumn) return;
  const naturalWidth = lastColumn.offsetLeft + lastColumn.offsetWidth + 16;
  const fitScale = (viewport.clientWidth - 12) / naturalWidth;
  setMatrixScale(Math.min(1, fitScale));
  viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  state.matrixScroll = { left: 0, top: 0 };
}

function setTacticExpansion(tacticId, expand) {
  const tactic = state.data.tactics.find(item => [item.id, item.shortname].includes(tacticId));
  if (!tactic) return;
  const parents = state.data.techniques.filter(technique => !isSubTechnique(technique) && techniqueInTactic(technique, tactic));
  for (const parent of parents) {
    const hasChildren = state.data.techniques.some(child => child.parent_id === parent.id && techniqueInTactic(child, tactic));
    if (!hasChildren) continue;
    if (expand) state.expandedTechniqueIds.add(parent.id);
    else state.expandedTechniqueIds.delete(parent.id);
  }
}

function enableMatrixDrag(viewport) {
  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button, a, input, select')) return;
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const endDrag = event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    state.matrixScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
    drag = null;
    viewport.classList.remove('is-dragging');
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('scroll', () => {
    if (!viewport.isConnected) return;
    state.matrixScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
  }, { passive: true });
}

function filterTechniques() {
  const q = state.query.toLowerCase();
  if (!q) return state.data.techniques;
  return state.data.techniques.filter(t => haystack([t.id, t.name, t.description, t.detection, ...(t.data_sources || []), ...(t.platforms || [])]).includes(q));
}

function filterGroups() {
  const q = state.query.toLowerCase();
  if (!q) return state.data.groups;
  return state.data.groups.filter(g => haystack([g.id, g.name, g.description, ...(g.aliases || []), ...(g.technique_ids || [])]).includes(q));
}

function filterIocs() {
  const q = state.query.toLowerCase();
  const items = state.iocLibrary.items || [];
  if (!q) return items;
  return items.filter(ioc => haystack([ioc.id, ioc.type, ioc.value, ioc.threat, ioc.status, ioc.reporter, ...(ioc.tags || [])]).includes(q));
}

function filterCves() {
  const q = state.query.toLowerCase();
  const items = state.cveLibrary.items || [];
  if (!q) return items;
  return items.filter(cve => haystack([cve.id, cve.vendor, cve.product, cve.name, cve.summary, cve.known_ransomware_campaign_use, ...(cve.cwes || [])]).includes(q));
}

function iocCard(ioc) {
  return `<article class="list-item library-item">
    <span class="item-title"><span>${escapeHtml(ioc.value)}</span><span>${escapeHtml(ioc.status)}</span></span>
    <span class="item-meta">${escapeHtml(ioc.threat)} · first seen ${formatDate(ioc.first_seen)} · ${escapeHtml((ioc.tags || []).slice(0, 8).join(', ') || 'no tags')}</span>
    <span class="item-actions"><a href="${escapeHtml(ioc.source_url)}" rel="noopener">source</a><button class="tag" type="button" data-module="ioc-investigation">full enrichment</button></span>
  </article>`;
}

function cveCard(cve) {
  return `<article class="list-item library-item">
    <span class="item-title"><span>${escapeHtml(cve.id)} · ${escapeHtml(cve.name)}</span><span>${escapeHtml(cve.vendor)}</span></span>
    <span class="item-meta">${escapeHtml(cve.product)} · added ${formatDate(cve.date_added)} · ransomware use: ${escapeHtml(cve.known_ransomware_campaign_use)}</span>
    <p>${escapeHtml(shortText(cve.summary, 260))}</p>
    <span class="item-actions"><a href="${escapeHtml(cve.nvd_url)}" rel="noopener">NVD</a><a href="${escapeHtml(cve.source_url)}" rel="noopener">CISA KEV</a><button class="tag" type="button" data-module="asset-surface">match assets</button></span>
  </article>`;
}

function techniqueInTactic(technique, tactic) {
  const techniqueTactics = new Set((technique.tactic_ids || []).filter(Boolean).map(value => String(value).toLowerCase()));
  const tacticAliases = [tactic.id, tactic.shortname, slugify(tactic.name || '')]
    .filter(Boolean)
    .map(value => String(value).toLowerCase());
  return tacticAliases.some(alias => techniqueTactics.has(alias));
}

function isSubTechnique(technique) {
  return Boolean(technique.is_sub || technique.parent_id || /\.\d{3}$/.test(technique.id || ''));
}

function selectedTechniqueIds() {
  const filtered = state.query ? filterTechniques().map(t => t.id) : [state.selectedTechniqueId || state.data.techniques[0]?.id].filter(Boolean);
  return [...new Set(filtered)].slice(0, 500);
}

function exportNavigatorLayer() {
  const ids = selectedTechniqueIds();
  const layer = {
    name: `Threat Matrix Light export - ${state.query || 'selected context'}`,
    versions: { attack: state.data.version, navigator: '5.3.2', layer: '4.5' },
    domain: state.data.domain,
    description: 'Generated in Threat Matrix / AdversaryGraph Light. Browser-only public workspace; validate detections in full AdversaryGraph or an approved SIEM/lab.',
    techniques: ids.map(techniqueID => ({ techniqueID, score: 1, comment: 'Selected in Threat Matrix Light' })),
    gradient: { colors: ['#1f2937', '#ef476f'], minValue: 0, maxValue: 1 },
    legendItems: [{ label: 'Selected/search result', color: '#ef476f' }],
  };
  const blob = new Blob([JSON.stringify(layer, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'threat-matrix-adversarygraph-light-layer.json';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${ids.length} technique(s) as Navigator layer JSON.`);
}

function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.add('hidden'), 4000);
}

function domainPicker() {
  return `<label><span class="hidden">Domain</span><select class="select" id="domain-select" aria-label="ATT&CK domain">
    <option value="mitre-data.json" ${state.domainFile === 'mitre-data.json' ? 'selected' : ''}>Enterprise</option>
    <option value="mitre-data-mobile.json" ${state.domainFile === 'mitre-data-mobile.json' ? 'selected' : ''}>Mobile</option>
    <option value="mitre-data-ics.json" ${state.domainFile === 'mitre-data-ics.json' ? 'selected' : ''}>ICS</option>
    <option value="mitre-data-atlas.json" ${state.domainFile === 'mitre-data-atlas.json' ? 'selected' : ''}>ATLAS</option>
  </select></label>`;
}

function groupSelect(id, value) {
  return `<select class="select" id="${id}">${state.data.groups.map(group => `<option value="${group.id}" ${value === group.id ? 'selected' : ''}>${escapeHtml(group.name)} (${group.id})</option>`).join('')}</select>`;
}

function techniqueById(id) { return state.data.techniques.find(t => t.id === id); }
function groupById(id) { return state.data.groups.find(g => g.id === id); }
function idTag(id) { return `<button class="tag" type="button" data-technique-id="${id}">${escapeHtml(id)}</button>`; }
function tag(value) { return `<span class="tag">${escapeHtml(String(value))}</span>`; }
function emptyState(text) { return `<p>${escapeHtml(text)}</p>`; }
function haystack(values) { return values.filter(Boolean).join(' ').toLowerCase(); }
function intersection(a, b) { const set = new Set(b); return [...new Set(a)].filter(item => set.has(item)); }
function difference(a, b) { const set = new Set(b); return [...new Set(a)].filter(item => !set.has(item)); }
function groupBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}
function shortText(text, limit) {
  const value = String(text || '')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}
function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
