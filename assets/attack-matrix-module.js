(() => {
  const state = { attack: null, mesh: null, query: '', platform: '', selected: null };
  const routeLabels = {
    'explicit-id': 'Explicit ATT&CK ID',
    'explicit-name': 'Exact technique name',
    'topic-match': 'Governed topic match',
    'tactic-route': 'Tactic learning route',
  };
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

  function referenceUrl(item) {
    return (item.references || []).find((reference) => /^https:\/\/attack\.mitre\.org\//.test(reference.url || ''))?.url || '';
  }

  function linkedIdentity(item) {
    const label = `${escapeHtml(item.id)} · ${escapeHtml(item.name)}`;
    const url = referenceUrl(item);
    return url ? `<a href="${escapeHtml(url)}">${label}</a>` : label;
  }

  function button(technique, sub = false) {
    return `<button class="mesh-technique${sub ? ' mesh-sub' : ''}" type="button" data-technique="${escapeHtml(technique.id)}" aria-pressed="${state.selected === technique.id}"><strong>${escapeHtml(technique.id)}</strong>${escapeHtml(technique.name)}</button>`;
  }

  function selectTechnique(id) {
    const technique = state.attack.techniques.find((item) => item.id === id);
    if (!technique) return selectRevokedTechnique(id);
    state.selected = id;
    renderMatrix();
    const routes = state.mesh.techniques[id]?.knowledge_routes || [];
    const groups = state.attack.groups.filter((group) => group.technique_ids.includes(id));
    $('#mesh-detail').innerHTML = `<p class="mesh-kicker">${escapeHtml(id)} · ${escapeHtml((technique.tactic_ids || []).join(' · '))}</p>
      <h2 id="detail-title">${escapeHtml(technique.name)}</h2>
      <p>${escapeHtml(technique.description)}</p>
      <p><a href="/threat-matrix/techniques/${encodeURIComponent(id)}/">Open the full static technique dossier →</a></p>
      ${section('Cyber Knowledge routes', routes.map((route) => `<li><a href="${escapeHtml(route.url)}">${escapeHtml(route.title)}</a><br><small>${escapeHtml(route.domain_name)} · ${escapeHtml(routeLabels[route.basis] || route.basis)} · ${route.score}/100</small></li>`))}
      ${section(`Observed groups (${groups.length})`, groups.slice(0,20).map((group) => `<li><a href="/threat-matrix/actors/${encodeURIComponent(group.id)}/">${escapeHtml(group.name)} (${escapeHtml(group.id)})</a></li>`))}
      ${section(`Mitigations (${(technique.mitigations || []).length})`, (technique.mitigations || []).map((item) => `<li><strong>${linkedIdentity(item)}</strong><br>${escapeHtml(item.description)}</li>`))}
      ${section(`Detection strategies (${(technique.detection_strategies || []).length})`, (technique.detection_strategies || []).map((item) => `<li><strong>${linkedIdentity(item)}</strong><br>${(item.analytics || []).map((analytic) => `${linkedIdentity(analytic)}: ${escapeHtml(analytic.description)}`).join('<br>')}</li>`))}
      <div class="mesh-detail-section"><strong>Platforms</strong><div class="mesh-pill-list">${(technique.platforms || []).map((item) => `<span class="mesh-pill">${escapeHtml(item)}</span>`).join('')}</div></div>`;
  }

  function selectRevokedTechnique(id) {
    const old = (state.attack.revoked_techniques || []).find((item) => item.id === id);
    if (!old) return false;
    const successor = old.successor;
    $('#mesh-detail').innerHTML = `<p class="mesh-kicker">${escapeHtml(old.id)} · ${escapeHtml(old.status)}</p>
      <h2 id="detail-title">${escapeHtml(old.name)}</h2>
      <div class="mesh-revoked-notice"><strong>This identifier is not a live matrix entry.</strong>
      ${successor ? `<p>MITRE’s STIX <code>revoked-by</code> relationship resolves it to <button type="button" data-successor="${escapeHtml(successor.id)}">${escapeHtml(successor.id)} · ${escapeHtml(successor.name)}</button>.</p>` : '<p>No current successor is published in this bundle.</p>'}</div>
      ${successor ? `<p><a href="/threat-matrix/techniques/${encodeURIComponent(successor.id)}/">Open the current technique dossier →</a></p>` : ''}`;
    $('#mesh-detail [data-successor]')?.addEventListener('click', (event) => selectTechnique(event.currentTarget.dataset.successor));
    return true;
  }

  function section(title, items) {
    return `<section class="mesh-detail-section"><h3>${escapeHtml(title)}</h3>${items.length ? `<ul>${items.join('')}</ul>` : '<p>No published relationship in this dataset.</p>'}</section>`;
  }

  async function init() {
    try {
      const [attack, defense, mesh] = await Promise.all([
        fetch('/threat-matrix/mitre-data.json').then((response) => {
          if (!response.ok) throw new Error(`ATT&CK data HTTP ${response.status}`);
          return response.json();
        }),
        fetch('/threat-matrix/mitre-defense-data.json').then((response) => {
          if (!response.ok) throw new Error(`ATT&CK defense data HTTP ${response.status}`);
          return response.json();
        }),
        fetch('/cyber-knowledge/attack-knowledge-mesh.json').then((response) => {
          if (!response.ok) throw new Error(`Knowledge mesh HTTP ${response.status}`);
          return response.json();
        }),
      ]);
      const defenseByTechnique = new Map((defense.techniques || []).map((item) => [item.id, item]));
      attack.techniques = attack.techniques.map((technique) => ({ ...technique, ...(defenseByTechnique.get(technique.id) || {}) }));
      state.attack = attack; state.mesh = mesh;
      const platforms = [...new Set(attack.techniques.flatMap((item) => item.platforms || []))].sort();
      $('#mesh-platform').insertAdjacentHTML('beforeend', platforms.map((item) => `<option>${escapeHtml(item)}</option>`).join(''));
      $('#mesh-stats').innerHTML = `<span>ATT&amp;CK ${escapeHtml(attack.version)}</span><span>${attack.tactics.length} tactics</span><span>${attack.techniques.length} techniques</span><span>${attack.groups.length} groups</span><span>${mesh.modules.length} knowledge modules</span>`;
      renderMatrix();
      const requestedTechnique = new URLSearchParams(location.search).get('technique');
      if (requestedTechnique) selectTechnique(requestedTechnique.toUpperCase());
    } catch (error) {
      const provenance = $('#mesh-provenance');
      const lastBuild = provenance?.dataset.bundleDate || 'unknown';
      $('#mesh-stats').insertAdjacentHTML('beforeend', `<span class="mesh-error">Interactive enhancement unavailable: ${escapeHtml(error.message)}. Static data below is from the last successful bundle build (${escapeHtml(lastBuild)}).</span>`);
    }
  }

  $('#mesh-search').addEventListener('input', (event) => {
    const raw = event.target.value.trim();
    state.query = normalize(raw);
    renderMatrix();
    if (/^T\d{4}(?:\.\d{3})?$/i.test(raw)) selectRevokedTechnique(raw.toUpperCase());
  });
  $('#mesh-platform').addEventListener('change', (event) => { state.platform = event.target.value; renderMatrix(); });
  $('#mesh-clear').addEventListener('click', () => { state.query = ''; state.platform = ''; $('#mesh-search').value = ''; $('#mesh-platform').value = ''; renderMatrix(); });
  init();
})();
