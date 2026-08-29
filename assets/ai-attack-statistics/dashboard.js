(() => {
  'use strict';

  const searchInput = document.querySelector('#source-search');
  const publisherSelect = document.querySelector('#source-publisher');
  const yearSelect = document.querySelector('#source-year');
  const typeSelect = document.querySelector('#source-type');
  const resetButton = document.querySelector('#source-reset');
  const resultStatus = document.querySelector('#source-count');
  const emptyRow = document.querySelector('#source-empty');
  const rows = Array.from(document.querySelectorAll('[data-dashboard-source]'));

  if (
    !searchInput ||
    !publisherSelect ||
    !yearSelect ||
    !typeSelect ||
    !resetButton ||
    !resultStatus ||
    !emptyRow ||
    rows.length === 0
  ) {
    return;
  }

  const normalize = (value) =>
    String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en')
      .trim();

  const filters = {
    search: searchInput,
    publisher: publisherSelect,
    year: yearSelect,
    type: typeSelect,
  };

  const restoreQueryState = () => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(filters).forEach(([name, control]) => {
      const value = params.get(name);
      if (value !== null && Array.from(control.options || []).some((option) => option.value === value)) {
        control.value = value;
      } else if (name === 'search' && value !== null) {
        control.value = value.slice(0, 200);
      }
    });
  };

  const updateQueryState = () => {
    if (!window.history || typeof window.history.replaceState !== 'function') return;

    const params = new URLSearchParams(window.location.search);
    Object.entries(filters).forEach(([name, control]) => {
      const value = control.value.trim();
      if (value) params.set(name, value);
      else params.delete(name);
    });

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  };

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    const publisher = normalize(publisherSelect.value);
    const year = normalize(yearSelect.value);
    const sourceType = normalize(typeSelect.value);
    let visible = 0;

    rows.forEach((row) => {
      const matches =
        (!query || normalize(row.dataset.search).includes(query)) &&
        (!publisher || normalize(row.dataset.publisher) === publisher) &&
        (!year || normalize(row.dataset.year) === year) &&
        (!sourceType || normalize(row.dataset.sourceType) === sourceType);

      row.hidden = !matches;
      if (matches) visible += 1;
    });

    const noun = visible === 1 ? 'publication' : 'publications';
    resultStatus.textContent = `${visible} of ${rows.length} eligible ${noun}`;
    emptyRow.hidden = visible !== 0;
    updateQueryState();
  };

  const resetFilters = () => {
    Object.values(filters).forEach((control) => {
      control.value = '';
    });
    applyFilters();
    searchInput.focus();
  };

  searchInput.addEventListener('input', applyFilters);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchInput.value) {
      searchInput.value = '';
      applyFilters();
    }
  });
  publisherSelect.addEventListener('change', applyFilters);
  yearSelect.addEventListener('change', applyFilters);
  typeSelect.addEventListener('change', applyFilters);
  resetButton.addEventListener('click', resetFilters);

  restoreQueryState();
  applyFilters();
  document.documentElement.dataset.dashboardEnhanced = 'true';
})();
