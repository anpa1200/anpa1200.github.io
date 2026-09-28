import {VIEWS, STATUS, inView, readState, stateParams, filterRows, scopeNote, renderMatrix} from './interactive-matrix-logic.mjs';

const controls = document.querySelector('#matrix-controls');
const result = document.querySelector('#matrix-results');
const status = document.querySelector('#matrix-status');
let data, state;
function fillSelect(id, values, label) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, ''), ...values.map(([value, text]) => new Option(text, value)));
}
function options() {
  const rows = data.records.filter(r => inView(r, state.view));
  const values = key => [...new Set(rows.flatMap(r => r[key]))].sort().map(x => [x, x]);
  fillSelect('matrix-platform', values('platforms'), 'All platforms');
  fillSelect('matrix-environment', values('environments'), 'All environments');
  const tactics = new Map(data.domains.filter(d => rows.some(r => r.domain === d.id)).flatMap(d => d.tactics.map(t => [t.slug, t.name])));
  fillSelect('matrix-tactic', [...tactics], 'All tactics');
  const ids = new Set(rows.flatMap(r => r.telemetry));
  fillSelect('matrix-telemetry', data.telemetry.filter(r => ids.has(r.id)).map(r => [r.id, `${r.name} · ${r.id}`]), 'All mapped telemetry');
  fillSelect('matrix-simulation', Object.entries(STATUS), 'All simulation evidence');
  for (const key of ['platform', 'environment', 'tactic', 'telemetry', 'simulation']) {
    const select = document.getElementById('matrix-' + key);
    if (![...select.options].some(o => o.value === state[key])) state[key] = '';
    select.value = state[key];
  }
  document.querySelector('#matrix-query').value = state.q;
  document.querySelector('#matrix-layout').value = state.layout;
  document.querySelector('#matrix-sub').checked = state.sub;
}
function render(historyMode = 'replace') {
  const params = stateParams(state), query = params.toString();
  if (historyMode) history[historyMode + 'State'](null, '', location.pathname + (query ? '?' + query : '') + '#matrix');
  result.innerHTML = renderMatrix(data, state);
  const rows = filterRows(data, state), total = data.records.filter(r => inView(r, state.view)).length;
  status.textContent = `${rows.length} of ${total} unique techniques and sub-techniques match. A technique may appear under more than one tactic.`;
  document.querySelector('#matrix-scope').textContent = scopeNote(state.view);
  document.querySelectorAll('[data-matrix-view]').forEach(link => {
    const active = link.dataset.matrixView === state.view;
    if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
  });
  const telemetry = data.telemetry.find(t => t.id === state.telemetry);
  const target = document.querySelector('#matrix-telemetry-link');
  target.hidden = !telemetry;
  if (telemetry) {target.href = telemetry.page; target.textContent = `Open telemetry guide: ${telemetry.name}`;}
  document.querySelector('#matrix-share').href = location.pathname + (query ? '?' + query : '') + '#matrix';
}
async function start() {
  try {
    const response = await fetch('/attack-matrix/matrix-data.json');
    if (!response.ok) throw Error('Matrix data unavailable');
    data = await response.json();
    if (data.schema_version !== 1 || !data.records?.length || !data.domains?.length) throw Error('Unsupported matrix data');
    state = readState(new URLSearchParams(location.search));
    options(); render(false);
    document.querySelector('#matrix-more-filters').open = matchMedia('(min-width:761px)').matches || ['platform','environment','tactic','telemetry','simulation'].some(key=>state[key]);
    controls.hidden = false;
    document.querySelector('#matrix-fallback').remove();
    let timer;
    document.querySelector('#matrix-query').addEventListener('input', event => {
      clearTimeout(timer); state.q = event.target.value.slice(0, 200); timer = setTimeout(() => render(), 120);
    });
    controls.addEventListener('change', event => {
      const key = event.target.dataset.filter;
      if (!key) return;
      clearTimeout(timer); state[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value; render();
    });
    document.querySelectorAll('[data-matrix-view]').forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); clearTimeout(timer);
      state = readState(new URLSearchParams('view=' + link.dataset.matrixView)); options(); render('push');
    }));
    document.querySelector('#matrix-reset').addEventListener('click', () => {
      clearTimeout(timer); state = readState(new URLSearchParams('view=' + state.view)); options(); render(); document.querySelector('#matrix-query').focus();
    });
    window.addEventListener('popstate', () => {clearTimeout(timer); state = readState(new URLSearchParams(location.search)); options(); render(false);});
    document.documentElement.dataset.matrixReady = 'true';
  } catch (error) {
    status.textContent = 'Interactive filters could not load. The complete static matrices below remain available; refresh to retry.';
    document.documentElement.dataset.matrixReady = 'error';
  }
}
start();
