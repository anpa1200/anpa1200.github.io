const FULL_VERSION_URL = 'https://1200km.com/adversarygraph/';
const DOCS_URL = 'https://1200km.com/adversarygraph-docs/';
const GITHUB_URL = 'https://github.com/anpa1200/adversarygraph';

const modules = [
  { group: 'Public workspace', id: 'discover', icon: '◆', name: 'Discover', meta: 'public intelligence overview', live: true },
  { group: 'Public workspace', id: 'navigator', icon: '▦', name: 'Navigator', meta: 'ATT&CK matrix and layers', live: true },
  { group: 'Public workspace', id: 'apt', icon: '◎', name: 'APT Library', meta: 'groups, aliases, TTPs', live: true },
  { group: 'Public workspace', id: 'compare', icon: '⇄', name: 'Compare', meta: 'group overlap analysis', live: true },
  { group: 'Public workspace', id: 'coverage', icon: '◫', name: 'Coverage Leads', meta: 'static detection gaps', live: true },
  { group: 'Public workspace', id: 'export', icon: '⇩', name: 'Layer Export', meta: 'Navigator JSON export', live: true },
  { group: 'Analysis', id: 'analyze', icon: '✦', name: 'AI Analyze', meta: 'reports, logs, PDFs' },
  { group: 'Analysis', id: 'reports-research', icon: '▤', name: 'Reports Research', meta: 'stored report sessions' },
  { group: 'Analysis', id: 'evidence-graph', icon: '⟠', name: 'Evidence Graph', meta: 'persistent evidence links' },
  { group: 'Operations', id: 'operations', icon: '☷', name: 'Operations', meta: 'cases and tasks' },
  { group: 'Operations', id: 'pipeline', icon: '↯', name: 'Pipeline', meta: 'workflow automation' },
  { group: 'Operations', id: 'observability', icon: '◌', name: 'Observability', meta: 'self-test and audit' },
  { group: 'Threat programs', id: 'threat-radar', icon: '◉', name: 'Threat Radar', meta: 'business relevance monitor' },
  { group: 'Threat programs', id: 'asset-surface', icon: '▧', name: 'Asset Surface', meta: 'asset/CVE/IOC matching' },
  { group: 'Threat programs', id: 'threat-hunting', icon: '⌕', name: 'Threat Hunting', meta: 'AI-assisted hunts' },
  { group: 'Threat programs', id: 'query-library', icon: '⌘', name: 'Query Library', meta: 'Sigma, SPL, KQL, YARA-L' },
  { group: 'Intelligence feeds', id: 'ioc-library', icon: '●', name: 'IOC Library', meta: 'feed-backed IOC store' },
  { group: 'Intelligence feeds', id: 'ioc-investigation', icon: '◍', name: 'IOC Investigation', meta: 'VT, OTX, urlscan, Shodan' },
  { group: 'Intelligence feeds', id: 'cve', icon: '◇', name: 'CVE Intelligence', meta: 'KEV/CVSS/exploit context' },
  { group: 'Intelligence feeds', id: 'feeds', icon: '↻', name: 'Feeds Management', meta: 'keys and source sync' },
  { group: 'Validation lab', id: 'attack-simulation', icon: '▶', name: 'Attack Simulation', meta: 'rule validation traffic' },
  { group: 'Validation lab', id: 'retrohunt', icon: '↺', name: 'RetroHunt', meta: 'historical validation jobs' },
  { group: 'MalwareGraph', id: 'malware-analysis', icon: '☣', name: 'Malware Analysis', meta: 'static/dynamic workbench' },
  { group: 'MalwareGraph', id: 'malware-unpacker', icon: '▣', name: 'Malware Unpacker', meta: 'packing and strings' },
  { group: 'MalwareGraph', id: 'dynamic-analysis', icon: '▸', name: 'Dynamic Analysis', meta: 'sandbox-backed execution' },
  { group: 'Admin', id: 'knowledge', icon: '▥', name: 'Knowledge Library', meta: 'RAG corpus and sources' },
  { group: 'Admin', id: 'statistics', icon: '▰', name: 'Statistics', meta: 'database analytics' },
  { group: 'Admin', id: 'troubleshooting', icon: '?', name: 'Troubleshooting', meta: 'operator diagnostics' },
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
};

const root = document.querySelector('#root');

init().catch(error => {
  root.innerHTML = `<main class="noscript"><h1>Threat Matrix failed to load</h1><p>${escapeHtml(error.message || String(error))}</p></main>`;
});

async function init() {
  renderShell();
  await loadDomain('mitre-data.json');
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
            </label>
            <span class="pill">browser-only</span>
            <a class="button" href="/search.html?q=AdversaryGraph">Search 1200km</a>
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
  state.selectedTechniqueId ||= state.data.techniques[0]?.id || '';
  state.selectedGroupId ||= state.data.groups[0]?.id || '';
  state.compareA ||= state.data.groups[0]?.id || '';
  state.compareB ||= state.data.groups[1]?.id || state.data.groups[0]?.id || '';
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
      state.active = id;
      closeSidebar();
      render();
    }
    const techniqueButton = event.target.closest('[data-technique-id]');
    if (techniqueButton) {
      state.selectedTechniqueId = techniqueButton.dataset.techniqueId;
      render();
    }
    const groupButton = event.target.closest('[data-group-id]');
    if (groupButton) {
      state.selectedGroupId = groupButton.dataset.groupId;
      render();
    }
    const exportButton = event.target.closest('[data-export-layer]');
    if (exportButton) exportNavigatorLayer();
    const close = event.target.closest('[data-close-modal]');
    if (close || event.target.id === 'full-modal') closeModal();
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
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
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
  }[state.active]?.() || renderDiscover();
  main.innerHTML = html;
}

function renderDiscover() {
  const data = state.data;
  const filteredTechniques = filterTechniques().slice(0, 6);
  const filteredGroups = filterGroups().slice(0, 5);
  return `
    <section class="hero">
      <div class="panel hero-copy">
        <div class="eyebrow">AdversaryGraph Light · public browser workspace</div>
        <h1>ATT&amp;CK exploration with the AdversaryGraph product shape.</h1>
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
      <aside class="notice">
        <strong>Light-version boundary</strong>
        <p>This page does not run AI analysis, query telemetry, sync private feeds, store investigations, execute malware, simulate attacks, or forward SIEM events. Those operations require the self-hosted AdversaryGraph deployment.</p>
      </aside>
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
  const selected = techniqueById(state.selectedTechniqueId) || filterTechniques()[0] || state.data.techniques[0];
  if (selected) state.selectedTechniqueId = selected.id;
  return `
    <section class="grid">
      <div class="panel card span-8">
        <div class="card-head">
          <div><h2>Navigator</h2><p>Browser-only ATT&amp;CK matrix. Use search to highlight techniques.</p></div>
          <div class="toolbar">${domainPicker()}<button class="button" type="button" data-export-layer>Export layer</button></div>
        </div>
        <div class="matrix" aria-label="ATT&CK matrix">${renderMatrix()}</div>
      </div>
      <div class="panel card span-4">
        <div class="card-head"><div><h2>Technique detail</h2><p>Static ATT&amp;CK context from bundled public data.</p></div></div>
        ${selected ? techniqueDetail(selected) : emptyState('Select a technique.')}
      </div>
    </section>
  `;
}

function renderAptLibrary() {
  const selected = groupById(state.selectedGroupId) || filterGroups()[0] || state.data.groups[0];
  if (selected) state.selectedGroupId = selected.id;
  return `
    <section class="grid">
      <div class="panel card span-5">
        <div class="card-head"><div><h2>APT Library</h2><p>Public ATT&amp;CK groups, aliases, and mapped techniques.</p></div>${domainPicker()}</div>
        <div class="list">${filterGroups().map(groupCard).join('') || emptyState('No groups found.')}</div>
      </div>
      <div class="panel card span-7">
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
    const total = state.data.techniques.filter(t => (t.tactic_ids || []).includes(tactic.id)).length;
    const withDetection = state.data.techniques.filter(t => (t.tactic_ids || []).includes(tactic.id) && String(t.detection || '').trim()).length;
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

function renderMatrix() {
  const hits = new Set(filterTechniques().map(t => t.id));
  return state.data.tactics.map(tactic => {
    const techniques = state.data.techniques.filter(t => !t.is_sub && (t.tactic_ids || []).includes(tactic.id));
    return `<section class="tactic-column"><div class="tactic-title">${escapeHtml(tactic.name)}</div>${techniques.map(t => `
      <button class="technique ${hits.has(t.id) && state.query ? 'is-hit' : ''} ${state.selectedTechniqueId === t.id ? 'is-selected' : ''}" type="button" data-technique-id="${t.id}">
        <span class="tech-id">${escapeHtml(t.id)}</span><span class="tech-name">${escapeHtml(t.name)}</span>
      </button>
    `).join('')}</section>`;
  }).join('');
}

function techniqueDetail(technique) {
  const actors = state.data.groups.filter(group => (group.technique_ids || []).includes(technique.id)).slice(0, 12);
  return `<article class="detail">
    <div><div class="eyebrow">${escapeHtml(technique.id)}</div><h2>${escapeHtml(technique.name)}</h2></div>
    <div class="detail-section"><h3>Description</h3><p>${escapeHtml(shortText(technique.description, 900))}</p></div>
    <div class="detail-section"><h3>Detection guidance</h3><p>${escapeHtml(shortText(technique.detection || 'No public detection text in this bundled ATT&CK record.', 700))}</p></div>
    <div class="detail-section"><h3>Data sources</h3><div class="tag-list">${(technique.data_sources || []).slice(0, 16).map(tag).join('') || tag('Not specified')}</div></div>
    <div class="detail-section"><h3>Mapped groups</h3><div class="tag-list">${actors.map(g => `<button class="tag" type="button" data-group-id="${g.id}">${escapeHtml(g.name)}</button>`).join('') || tag('No local group mappings')}</div></div>
  </article>`;
}

function groupDetail(group) {
  const techniques = (group.technique_ids || []).map(techniqueById).filter(Boolean);
  return `<article class="card">
    <div class="eyebrow">${escapeHtml(group.id)}</div>
    <h2>${escapeHtml(group.name)}</h2>
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
  </button>`;
}

function openFullVersionModal(module) {
  const modal = document.querySelector('#full-modal');
  document.querySelector('#full-modal-title').textContent = `${module.name} is available in full AdversaryGraph`;
  document.querySelector('#full-modal-subtitle').textContent = module.meta;
  document.querySelector('#full-modal-body').innerHTML = `
    <p><strong>Threat Matrix is the public light web version.</strong> This button is intentionally visible so the web workspace matches the AdversaryGraph product structure, but the operation is not executed here.</p>
    <ul>
      <li>No private reports, logs, assets, IOCs, CVEs, or API keys are uploaded to this public page.</li>
      <li>AI providers, RAG/vector search, feed sync, persistence, MalwareGraph, attack-lab containers, and SIEM validation require the self-hosted deployment.</li>
      <li>Use this light page for public ATT&amp;CK exploration, demos, and discovery. Use full AdversaryGraph for production workflows.</li>
    </ul>
  `;
  modal.classList.add('is-open');
  modal.querySelector('[data-close-modal]').focus();
}

function closeModal() {
  document.querySelector('#full-modal')?.classList.remove('is-open');
}

function closeSidebar() {
  document.querySelector('#sidebar')?.classList.remove('is-open');
  document.querySelector('#mobile-menu')?.setAttribute('aria-expanded', 'false');
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

function selectedTechniqueIds() {
  const filtered = state.query ? filterTechniques().map(t => t.id) : [state.selectedTechniqueId || state.data.techniques[0]?.id].filter(Boolean);
  return [...new Set(filtered)].slice(0, 500);
}

function exportNavigatorLayer() {
  const ids = selectedTechniqueIds();
  const layer = {
    name: `Threat Matrix Light export - ${state.query || 'selected context'}`,
    versions: { attack: state.data.version, navigator: '5.1.0', layer: '4.5' },
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
  return `<label><span class="hidden">Domain</span><select class="select" id="domain-select">
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
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
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
