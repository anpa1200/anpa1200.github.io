(() => {
  const main = document.querySelector('#main-content');
  if (!main) return;

  const groups = [...main.querySelectorAll('.lab-group')];
  const cards = groups.flatMap((group) => [...group.querySelectorAll('.guide-item')].map((card) => {
    const titleLink = card.querySelector('.guide-title');
    const title = titleLink?.textContent.trim() || '';
    const tags = [...card.querySelectorAll('.guide-tag')].map((tag) => tag.textContent.trim()).filter(Boolean);
    card.dataset.category = group.id;
    card.dataset.title = title;
    card.dataset.tags = tags.join(' ');
    card.dataset.tagList = tags.map((tag) => tag.toLowerCase()).join('|');
    card.dataset.guideCover = coverFor(group.id);
    card.style.setProperty('--guide-cover', `url("${card.dataset.guideCover}")`);
    return card;
  }));

  const controls = document.createElement('form');
  controls.id = 'guides-catalogue-controls';
  controls.setAttribute('role', 'search');
  controls.innerHTML = `
    <div class="guides-control">
      <label for="guides-search">Search guides</label>
      <input id="guides-search" type="search" placeholder="Search titles, descriptions, or tags…" autocomplete="off">
    </div>
    <div class="guides-control">
      <label for="guides-category">Category</label>
      <select id="guides-category"><option value="">All categories</option>${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.querySelector('.group-title')?.textContent.trim() || group.id)}</option>`).join('')}</select>
    </div>
    <div class="guides-control">
      <label for="guides-tag">Topic tag</label>
      <select id="guides-tag"><option value="">All topics</option>${topicOptions(cards).map((tag) => `<option value="${escapeHtml(tag.toLowerCase())}">${escapeHtml(tag)}</option>`).join('')}</select>
    </div>
    <button id="guides-filter-search" type="submit">Search</button>
    <button id="guides-filter-reset" type="button">Clear filters</button>
    <span id="guides-result-count" aria-live="polite"></span>`;
  const firstGroup = groups[0];
  if (firstGroup) main.insertBefore(controls, firstGroup);

  const search = controls.querySelector('#guides-search');
  const category = controls.querySelector('#guides-category');
  const tag = controls.querySelector('#guides-tag');
  const count = controls.querySelector('#guides-result-count');
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  category.value = params.get('category') || '';
  tag.value = params.get('tag') || '';

  const syncUrl = () => {
    const next = new URLSearchParams();
    if (search.value.trim()) next.set('q', search.value.trim());
    if (category.value) next.set('category', category.value);
    if (tag.value) next.set('tag', tag.value);
    const query = next.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
  };

  const apply = ({ updateUrl = false } = {}) => {
    const query = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const selectedTag = tag.value.toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      const haystack = `${card.dataset.title} ${card.textContent} ${card.dataset.tags}`.toLowerCase();
      const matches = (!query || haystack.includes(query))
        && (!selectedCategory || card.dataset.category === selectedCategory)
        && (!selectedTag || card.dataset.tagList.split('|').includes(selectedTag));
      card.hidden = !matches;
      if (matches) shown += 1;
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector('.guide-item:not([hidden])');
    });
    if (count) count.textContent = `${shown} guide${shown === 1 ? '' : 's'} shown`;
    if (updateUrl) syncUrl();
  };

  search.addEventListener('input', () => apply());
  [category, tag].forEach((control) => control.addEventListener('change', () => apply({ updateUrl: true })));
  controls.addEventListener('submit', (event) => {
    event.preventDefault();
    apply({ updateUrl: true });
    firstGroup?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  controls.querySelector('#guides-filter-reset').addEventListener('click', () => {
    search.value = '';
    category.value = '';
    tag.value = '';
    apply({ updateUrl: true });
    search.focus();
  });
  apply();

  function topicOptions(items) {
    const labels = new Map();
    items.forEach((item) => item.querySelectorAll('.guide-tag').forEach((tag) => {
      const label = tag.textContent.trim();
      if (label && !labels.has(label.toLowerCase())) labels.set(label.toLowerCase(), label);
    }));
    return [...labels.values()].sort((a, b) => a.localeCompare(b));
  }

  function coverFor(groupId) {
    const covers = {
      cti: '/assets/cyber-knowledge-og/cti.png',
      detection: '/assets/cyber-knowledge-og/blue-team.png',
      'network-recon': '/assets/cyber-knowledge-og/osint.png',
      'web-app': '/assets/cyber-knowledge-og/secure-code.png',
      'password-attacks': '/assets/cyber-knowledge-og/vulnerability-research.png',
      exploitation: '/assets/cyber-knowledge-og/red-team.png',
      'ai-pentesting': '/assets/cyber-knowledge-og/ai-security.png',
      'malware-analysis': '/assets/cyber-knowledge-og/malware-analysis.png',
      'cloud-k8s-ad': '/assets/cyber-knowledge-og/cloud-security.png',
      'ai-security': '/assets/cyber-knowledge-og/ai-security.png',
    };
    return covers[groupId] || '/assets/cyber-knowledge-og/hub.png';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }
})();
