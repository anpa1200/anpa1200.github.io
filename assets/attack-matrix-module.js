(() => {
  const state = { attack: null, mesh: null, query: '', platform: '', selected: null };
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[character]);
  const normalize = (value) => String(value ?? '').toLowerCase();

  function techniqueMatches(technique) {
    if (state.platform && !(technique.platforms || []).includes(state.platform)) return false;
    if (!state.query) return true;
    const groups = state.attack.groups.filter((group) => group.technique_ids.includes(technique.id)).flatMap((group) => [group.name, ...(group.aliases || [])]);
    const defenses = [...(technique.mitigations || []).flatMap((item) => [item.id,item.name]), ...(technique.detection_strategies || []).flatMap((item) => [item.id,item.name])];
    return normalize([technique.id, technique.name, technique.description, ...groups, ...defenses].join(' ')).includes(state.query);
  }

  function renderMatrix() {
    const visible = state.attack.techniques.filter(techniqueMatches);
    const visibleIds = new Set(visible.map((item) => item.id));
    $('#mesh-result-count').textContent = `${visible.length.toLocaleString()} of ${state.attack.techniques.length.toLocaleString()} techniques shown`;
    $('#mesh-matrix').innerHTML = state.attack.tactics.map((tactic) => {
      const techniques = state.attack.techniques.filter((item) => (item.tactic_ids || []).includes(tactic.shortname) && visibleIds.has(item.id));
      const parents = techniques.filter((item) => !item.is_sub);
      return `<section class="mesh-tactic" aria-labelledby="tactic-${escapeHtml(tactic.id)}"><h3 id="tactic-${escapeHtml(tactic.id)}">${escapeHtml(tactic.name)} · ${techniques.length}</h3>${parents.map((parent) => {
        const subs = techniques.filter((item) => item.parent_id === parent.id);
        return `${button(parent)}${subs.map((sub) => button(sub, true)).join('')}`;
      }).join('')}</section>`;
    }).join('');
    $('#mesh-matrix').querySelectorAll('[data-technique]').forEach((button) => button.addEventListener('click', () => selectTechnique(button.dataset.technique)));
  }

  function button(technique, sub = false) {
    return `<button class="mesh-technique${sub ? ' mesh-sub' : ''}" type="button" data-technique="${escapeHtml(technique.id)}" aria-pressed="${state.selected === technique.id}"><strong>${escapeHtml(technique.id)}</strong>${escapeHtml(technique.name)}</button>`;
  }

  function selectTechnique(id) {
    state.selected = id;
    renderMatrix();
    const technique = state.attack.techniques.find((item) => item.id === id);
    const routes = state.mesh.techniques[id]?.knowledge_routes || [];
    const groups = state.attack.groups.filter((group) => group.technique_ids.includes(id));
    $('#mesh-detail').innerHTML = `<p class="mesh-kicker">${escapeHtml(id)} · ${escapeHtml((technique.tactic_ids || []).join(' · '))}</p>
      <h2 id="detail-title">${escapeHtml(technique.name)}</h2>
      <p>${escapeHtml(technique.description)}</p>
      <p><a href="/threat-matrix/techniques/${encodeURIComponent(id)}/">Open the full static technique dossier →</a></p>
      ${section('Cyber Knowledge routes', routes.map((route) => `<li><a href="${escapeHtml(route.url)}">${escapeHtml(route.title)}</a><br><small>${escapeHtml(route.domain_name)} · ${escapeHtml(route.basis)} · ${route.score}/100</small></li>`))}
      ${section(`Observed groups (${groups.length})`, groups.slice(0,20).map((group) => `<li><a href="/threat-matrix/actors/${encodeURIComponent(group.id)}/">${escapeHtml(group.name)} (${escapeHtml(group.id)})</a></li>`))}
      ${section(`Mitigations (${(technique.mitigations || []).length})`, (technique.mitigations || []).map((item) => `<li><strong>${escapeHtml(item.id)} · ${escapeHtml(item.name)}</strong><br>${escapeHtml(item.description)}</li>`))}
      ${section(`Detection strategies (${(technique.detection_strategies || []).length})`, (technique.detection_strategies || []).map((item) => `<li><strong>${escapeHtml(item.id)} · ${escapeHtml(item.name)}</strong><br>${(item.analytics || []).map((analytic) => `${escapeHtml(analytic.id)}: ${escapeHtml(analytic.description)}`).join('<br>')}</li>`))}
      <div class="mesh-detail-section"><strong>Platforms</strong><div class="mesh-pill-list">${(technique.platforms || []).map((item) => `<span class="mesh-pill">${escapeHtml(item)}</span>`).join('')}</div></div>`;
  }

  function section(title, items) {
    return `<section class="mesh-detail-section"><h3>${escapeHtml(title)}</h3>${items.length ? `<ul>${items.join('')}</ul>` : '<p>No published relationship in this dataset.</p>'}</section>`;
  }

  async function init() {
    try {
      const [attack, mesh] = await Promise.all([
        fetch('/threat-matrix/mitre-data.json').then((response) => {
          if (!response.ok) throw new Error(`ATT&CK data HTTP ${response.status}`);
          return response.json();
        }),
        fetch('/cyber-knowledge/attack-knowledge-mesh.json').then((response) => {
          if (!response.ok) throw new Error(`Knowledge mesh HTTP ${response.status}`);
          return response.json();
        }),
      ]);
      state.attack = attack; state.mesh = mesh;
      const platforms = [...new Set(attack.techniques.flatMap((item) => item.platforms || []))].sort();
      $('#mesh-platform').insertAdjacentHTML('beforeend', platforms.map((item) => `<option>${escapeHtml(item)}</option>`).join(''));
      $('#mesh-stats').innerHTML = `<span>ATT&amp;CK ${escapeHtml(attack.version)}</span><span>${attack.tactics.length} tactics</span><span>${attack.techniques.length} techniques</span><span>${attack.groups.length} groups</span><span>${mesh.modules.length} knowledge modules</span>`;
      renderMatrix();
      const requestedTechnique = new URLSearchParams(location.search).get('technique');
      if (requestedTechnique && attack.techniques.some((item) => item.id === requestedTechnique)) selectTechnique(requestedTechnique);
    } catch (error) {
      $('#mesh-stats').innerHTML = `<span>Unable to load enhanced matrix: ${escapeHtml(error.message)}</span>`;
      $('#mesh-matrix').innerHTML = '<p><a href="/threat-matrix/">Open the standalone Threat Matrix fallback</a>.</p>';
    }
  }

  $('#mesh-search').addEventListener('input', (event) => { state.query = normalize(event.target.value.trim()); renderMatrix(); });
  $('#mesh-platform').addEventListener('change', (event) => { state.platform = event.target.value; renderMatrix(); });
  $('#mesh-clear').addEventListener('click', () => { state.query = ''; state.platform = ''; $('#mesh-search').value = ''; $('#mesh-platform').value = ''; renderMatrix(); });
  init();
})();
