(() => {
  const cards = [...document.querySelectorAll('.article-card')];
  const category = document.querySelector('#category-filter');
  const search = document.querySelector('#article-search');
  const author = document.querySelector('#author-filter');
  const domain = document.querySelector('#domain-filter');
  const mode = document.querySelector('#mode-filter');
  const tag = document.querySelector('#tag-filter');
  const filterSearch = document.querySelector('#filter-search');
  const reset = document.querySelector('#filter-reset');
  const count = document.querySelector('#result-count');
  const controls = [search, category, author, domain, mode, tag].filter(Boolean);
  const chips = [...document.querySelectorAll('[data-filter-value]')];
  const params = new URLSearchParams(location.search);

  const setControl = (control, key) => {
    if (!control) return;
    const value = params.get(key) || '';
    if (control.tagName === 'SELECT') {
      control.value = [...control.options].some((option) => option.value === value) ? value : '';
    } else {
      control.value = value;
    }
  };

  setControl(search, 'q');
  setControl(category, 'category');
  setControl(author, 'author');
  setControl(domain, 'domain');
  setControl(mode, 'mode');
  setControl(tag, 'tag');

  const syncUrl = () => {
    const next = new URLSearchParams();
    if (search?.value.trim()) next.set('q', search.value.trim());
    if (category?.value) next.set('category', category.value);
    if (author?.value) next.set('author', author.value);
    if (domain?.value) next.set('domain', domain.value);
    if (mode?.value) next.set('mode', mode.value);
    if (tag?.value) next.set('tag', tag.value);
    const query = next.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
  };

  const apply = ({ updateUrl = false } = {}) => {
    const query = search?.value.trim().toLowerCase() || '';
    const selectedTag = tag?.value.trim().toLowerCase() || '';
    let shown = 0;

    cards.forEach((card) => {
      const haystack = [
        card.dataset.title,
        card.dataset.author,
        card.dataset.domain,
        card.dataset.mode,
        card.dataset.tags,
      ].filter(Boolean).join(' ').toLowerCase();
      const matches = (!query || haystack.includes(query))
        && (!category?.value || card.dataset.category === category.value)
        && (!author?.value || card.dataset.author === author.value)
        && (!domain?.value || card.dataset.domain === domain.value)
        && (!mode?.value || card.dataset.mode === mode.value)
        && (!selectedTag || haystack.includes(selectedTag));
      card.hidden = !matches;
      if (matches) shown += 1;
    });
    if (count) count.textContent = `${shown} shown`;
    if (updateUrl) syncUrl();
  };

  const applyChip = (chip) => {
    const target = chip.dataset.filter;
    const value = chip.dataset.filterValue || '';
    if (target === 'search') {
      const tagValue = value.toLowerCase();
      if (tag && [...tag.options].some((option) => option.value === tagValue)) {
        tag.value = tagValue;
      } else if (search) {
        search.value = value;
      }
    } else {
      const control = { category, author, domain, mode, tag }[target];
      if (control) control.value = value;
    }
    apply({ updateUrl: true });
  };

  search?.addEventListener('input', () => apply());
  [category, author, domain, mode, tag].filter(Boolean).forEach((control) => {
    control.addEventListener('change', () => apply({ updateUrl: true }));
  });
  chips.forEach((chip) => chip.addEventListener('click', () => applyChip(chip)));
  filterSearch?.addEventListener('click', () => {
    apply({ updateUrl: true });
    document.querySelector('#article-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  reset?.addEventListener('click', () => {
    controls.forEach((control) => { control.value = ''; });
    apply({ updateUrl: true });
    search?.focus();
  });

  apply();
})();
