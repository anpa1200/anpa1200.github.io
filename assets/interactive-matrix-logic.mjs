// Shared by the static generator and browser. No source commands are executed.
export const VIEWS = [
  ['enterprise', 'Enterprise'], ['mobile', 'Mobile'], ['ics', 'ICS / OT'],
  ['atlas', 'ATLAS / AI'], ['iot', 'IoT / OT view'], ['cloud', 'Cloud view'], ['all', 'All frameworks'],
];
export const STATUS = {
  can_simulate: 'Documented candidate', cannot_simulate_yet: 'No catalog candidate', not_assessed: 'Not assessed',
};
export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export function inView(row, view) {
  if (view === 'all') return true;
  if (view === 'iot') return row.domain === 'ics' || (row.domain === 'enterprise' && row.platforms.includes('Network Devices'));
  if (view === 'cloud') return row.domain === 'enterprise' && row.platforms.some(p => ['IaaS', 'SaaS', 'Office 365', 'Identity Provider'].includes(p));
  return row.domain === view;
}
export function readState(params = new URLSearchParams()) {
  return {view: VIEWS.some(([v]) => v === params.get('view')) ? params.get('view') : 'enterprise',
    q: (params.get('q') || '').slice(0, 200), platform: params.get('platform') || '', environment: params.get('environment') || '',
    tactic: params.get('tactic') || '', telemetry: params.get('telemetry') || '',
    simulation: Object.hasOwn(STATUS, params.get('simulation')) ? params.get('simulation') : '',
    layout: params.get('layout') === 'list' ? 'list' : 'matrix', sub: params.get('sub') === '1'};
}
export function stateParams(state) {
  const params = new URLSearchParams();
  for (const key of ['view', 'q', 'platform', 'environment', 'tactic', 'telemetry', 'simulation', 'layout']) {
    if (state[key] && !(key === 'view' && state[key] === 'enterprise') && !(key === 'layout' && state[key] === 'matrix')) params.set(key, state[key]);
  }
  if (state.sub) params.set('sub', '1');
  return params;
}
export function filterRows(data, state) {
  const words = state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return data.records.filter(r => inView(r, state.view)
    && (!state.platform || r.platforms.includes(state.platform))
    && (!state.environment || r.environments.includes(state.environment))
    && (!state.tactic || r.tactics.includes(state.tactic))
    && (!state.telemetry || r.telemetry.includes(state.telemetry))
    && (!state.simulation || r.classification === state.simulation)
    && words.every(w => `${r.id} ${r.name} ${r.domain} ${r.platforms.join(' ')} ${r.tactics.join(' ')}`.toLowerCase().includes(w)));
}
export function scopeNote(view) {
  if (view === 'iot') return '1200km IoT / OT navigation view: all ICS techniques plus Enterprise techniques explicitly tagged Network Devices. This is not an official IoT matrix or exhaustive IoT coverage. Review Linux, cloud and mobile views for other device architectures. Domain boundaries and source mappings are preserved.';
  if (view === 'cloud') return '1200km cloud navigation view: Enterprise techniques explicitly tagged IaaS, SaaS, Office 365 or Identity Provider. This is a source-platform filter, not a separate ATT&CK domain; cloud-hosted endpoints and containers may require other views.';
  if (view === 'atlas') return 'MITRE ATLAS is a separate AI-security framework. Its maturity labels describe source evidence, not validated 1200km simulations. ATLAS telemetry and simulation coverage have not been assessed in the existing ATT&CK catalog.';
  return 'Official Enterprise, Mobile and ICS domains retain their own tactic order. ATLAS is a separate AI-security framework. Each technique link opens a local TTP page. Matrix membership is not proof of detector effectiveness or lab validation.';
}
function cell(row, context = false) {
  const h = escapeHtml;
  return `<div class="im-cell${context ? ' im-context' : ''}" data-technique="${h(row.key)}"><a class="im-technique" href="${h(row.page)}"><span class="im-id">${h(row.id)}</span><span>${h(row.name)}</span></a><div class="im-cell-meta"><span class="im-status im-status-${h(row.classification)}">${h(context ? 'Parent context' : STATUS[row.classification])}</span>${row.detection_page ? `<a href="${h(row.detection_page)}" aria-label="Detection workspace for ${h(row.id)}">Detection ↗</a>` : ''}</div></div>`;
}
export function renderMatrix(data, state) {
  const h = escapeHtml;
  const rows = filterRows(data, state);
  if (!rows.length) return '<div class="im-empty"><h3>No matching techniques</h3><p>Clear a filter or choose another framework. An empty result is not proof that an attack or detection is impossible.</p></div>';
  return data.domains.map(domain => {
    const selected = rows.filter(r => r.domain === domain.id);
    if (!selected.length) return '';
    const all = data.records.filter(r => r.domain === domain.id);
    const tactics = domain.tactics.filter(t => !state.tactic || state.tactic === t.slug);
    const columns = tactics.map(t => {
      const hits = selected.filter(r => r.tactics.includes(t.slug));
      const hitIds = new Set(hits.map(r => r.id));
      // A child may belong to a tactic its parent does not. Retain labelled parent context.
      const parents = all.filter(r => !r.parent_id && (hitIds.has(r.id) || hits.some(c => c.parent_id === r.id))).sort((a,b) => a.name.localeCompare(b.name));
      const cards = parents.map(parent => {
        const children = hits.filter(r => r.parent_id === parent.id).sort((a,b) => a.id.localeCompare(b.id));
        return `<div class="im-family">${cell(parent, !hitIds.has(parent.id))}${children.length ? `<details class="im-children"${state.sub || state.q || state.platform || state.environment || state.telemetry || state.simulation ? ' open' : ''}><summary>${children.length} sub-technique${children.length === 1 ? '' : 's'}</summary><div>${children.map(r => cell(r)).join('')}</div></details>` : ''}</div>`;
      }).join('');
      return `<section class="im-column" aria-labelledby="matrix-${h(domain.id)}-${h(t.id)}"><h4 id="matrix-${h(domain.id)}-${h(t.id)}"><a href="${h(t.url)}">${h(t.name)}</a><small>${hits.length} matching entries</small></h4>${cards || '<p class="im-no-matches">No matches</p>'}</section>`;
    }).join('');
    return `<section class="im-framework"><h3>${h(domain.name)} <small>${h(domain.version)} · ${selected.length} unique techniques and sub-techniques</small></h3><div class="im-board im-layout-${h(state.layout)}" tabindex="0" role="region" aria-label="${h(domain.name)} matrix; scroll horizontally to explore tactics">${columns}</div></section>`;
  }).join('');
}
