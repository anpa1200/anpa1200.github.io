(() => {
  'use strict';

  const grid = document.querySelector('[data-reference-grid]');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('[data-reference-card]')];
  const search = document.querySelector('[data-reference-search]');
  const facet = document.querySelector('[data-reference-facet]');
  const tagValue = document.querySelector('[data-reference-tag-value]');
  const publisher = document.querySelector('[data-reference-publisher]');
  const year = document.querySelector('[data-reference-year]');
  const sort = document.querySelector('[data-reference-sort]');
  const reset = document.querySelector('[data-reference-reset]');
  const count = document.querySelector('[data-reference-count]');
  const active = document.querySelector('[data-reference-active]');
  const empty = document.querySelector('[data-reference-empty]');
  const correlations = document.querySelector('[data-reference-correlations]');
  const relatedList = document.querySelector('[data-reference-related-list]');
  const relatedHelp = document.querySelector('[data-reference-related-help]');

  const tagMap = new Map();
  for (const button of grid.querySelectorAll('[data-reference-tag]')) {
    if (!tagMap.has(button.dataset.tagKey)) {
      tagMap.set(button.dataset.tagKey, {
        key: button.dataset.tagKey,
        facet: button.dataset.tagFacet,
        type: button.dataset.tagType,
        value: button.dataset.tagValue,
      });
    }
  }

  function cardTags(card) {
    return new Set(card.dataset.tagKeys.split('|').filter(Boolean));
  }

  function optionsForFacet(value) {
    return [...tagMap.values()]
      .filter((item) => !value || item.facet === value)
      .sort((left, right) => left.value.localeCompare(right.value));
  }

  function refreshTagValues(selected = '') {
    const options = optionsForFacet(facet.value);
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'All tag values';
    tagValue.replaceChildren(all, ...options.map((item) => {
      const option = document.createElement('option');
      option.value = item.key;
      option.textContent = item.value;
      return option;
    }));
    tagValue.disabled = !facet.value;
    if (selected && options.some((item) => item.key === selected)) tagValue.value = selected;
  }

  function stateFromUrl() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    facet.value = params.get('facet') || '';
    refreshTagValues(params.get('tag') || '');
    publisher.value = params.get('publisher') || '';
    year.value = params.get('year') || '';
    sort.value = params.get('sort') || 'title';
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    if (facet.value) params.set('facet', facet.value);
    if (tagValue.value) params.set('tag', tagValue.value);
    if (publisher.value) params.set('publisher', publisher.value);
    if (year.value) params.set('year', year.value);
    if (sort.value !== 'title') params.set('sort', sort.value);
    const query = params.toString();
    history.replaceState(null, '', query ? `${location.pathname}?${query}` : location.pathname);
  }

  function compare(left, right) {
    if (sort.value === 'title') return left.dataset.referenceTitle.localeCompare(right.dataset.referenceTitle);
    if (sort.value === 'publisher') {
      return left.dataset.referencePublisher.localeCompare(right.dataset.referencePublisher)
        || left.dataset.referenceTitle.localeCompare(right.dataset.referenceTitle);
    }
    if (sort.value === 'tags') return cardTags(right).size - cardTags(left).size;
    const dates = left.dataset.referenceYear.localeCompare(right.dataset.referenceYear);
    return sort.value === 'date-asc' ? dates : -dates;
  }

  function updateCorrelations(visibleCards) {
    const totals = new Map();
    for (const card of visibleCards) {
      for (const key of cardTags(card)) totals.set(key, (totals.get(key) || 0) + 1);
    }
    const selected = tagValue.value;
    const items = [...totals]
      .filter(([key]) => key !== selected)
      .sort((left, right) => right[1] - left[1] || tagMap.get(left[0]).value.localeCompare(tagMap.get(right[0]).value))
      .slice(0, 24);
    correlations.replaceChildren(...items.map(([key, total]) => {
      const item = tagMap.get(key);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.correlationKey = key;
      const totalLabel = document.createElement('small');
      totalLabel.textContent = String(total);
      button.append(document.createTextNode(`${item.value} `), totalLabel);
      button.title = `${item.facet}: ${item.value}`;
      return button;
    }));
  }

  function apply() {
    const query = search.value.trim().toLowerCase();
    const selectedTag = tagValue.value;
    const visible = [];
    for (const card of cards) {
      const show = (!query || card.dataset.search.includes(query))
        && (!selectedTag || cardTags(card).has(selectedTag))
        && (!publisher.value || card.dataset.referencePublisher === publisher.value)
        && (!year.value || card.dataset.referenceYear === year.value);
      card.hidden = !show;
      if (show) visible.push(card);
    }
    visible.sort(compare).forEach((card) => grid.append(card));
    cards.filter((card) => card.hidden).forEach((card) => grid.append(card));
    count.textContent = String(visible.length);
    empty.hidden = visible.length !== 0;
    const selected = tagMap.get(selectedTag);
    active.textContent = selected ? `· ${selected.facet}: ${selected.value}` : '';
    for (const button of grid.querySelectorAll('[data-reference-tag]')) {
      button.setAttribute('aria-pressed', String(button.dataset.tagKey === selectedTag));
    }
    updateCorrelations(visible);
    writeUrl();
  }

  function selectTag(key) {
    const item = tagMap.get(key);
    if (!item) return;
    facet.value = item.facet;
    refreshTagValues(key);
    apply();
    document.querySelector('.reference-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function related(card) {
    const sourceTags = cardTags(card);
    const metadataTypes = new Set([
      'publisher', 'publisher_domain', 'source_type', 'inclusion', 'ai_relevance',
      'statistical_use', 'retrieval_method', 'publication_date_precision',
      'publication_date_method', 'relevance_basis', 'content_quality',
      'review_requirement', 'source_lineage', 'evidence_inventory', 'year',
    ]);
    const meaningful = new Set([...sourceTags].filter((key) => !metadataTypes.has(tagMap.get(key)?.type)));
    const ranked = cards
      .filter((candidate) => candidate !== card)
      .map((candidate) => {
        const shared = [...cardTags(candidate)].filter((key) => meaningful.has(key));
        return { candidate, shared };
      })
      .filter((item) => item.shared.length)
      .sort((left, right) => right.shared.length - left.shared.length || left.candidate.dataset.referenceTitle.localeCompare(right.candidate.dataset.referenceTitle))
      .slice(0, 8);
    relatedHelp.textContent = `Most similar to “${card.querySelector('h3').textContent.trim()}” by shared normalized tags.`;
    relatedList.replaceChildren(...ranked.map(({ candidate, shared }) => {
      const li = document.createElement('li');
      const link = candidate.querySelector('h3 a').cloneNode(true);
      const detail = document.createElement('small');
      detail.textContent = `${shared.length} shared: ${shared.slice(0, 4).map((key) => tagMap.get(key).value).join(', ')}${shared.length > 4 ? '…' : ''}`;
      li.append(link, detail);
      return li;
    }));
    document.querySelector('[data-reference-related-list]')?.closest('.reference-correlation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  search.addEventListener('input', apply);
  facet.addEventListener('change', () => {
    refreshTagValues();
    apply();
  });
  for (const control of [tagValue, publisher, year, sort]) control.addEventListener('change', apply);
  reset.addEventListener('click', () => {
    search.value = '';
    facet.value = '';
    refreshTagValues();
    publisher.value = '';
    year.value = '';
    sort.value = 'title';
    relatedList.replaceChildren();
    relatedHelp.textContent = 'Select Find related on a reference to rank other sources by shared normalized tags.';
    apply();
    search.focus();
  });
  grid.addEventListener('click', (event) => {
    const tagButton = event.target.closest('[data-reference-tag]');
    if (tagButton) selectTag(tagButton.dataset.tagKey);
    const relatedButton = event.target.closest('[data-find-related]');
    if (relatedButton) related(relatedButton.closest('[data-reference-card]'));
  });
  correlations.addEventListener('click', (event) => {
    const button = event.target.closest('[data-correlation-key]');
    if (button) selectTag(button.dataset.correlationKey);
  });
  addEventListener('popstate', () => {
    stateFromUrl();
    apply();
  });

  stateFromUrl();
  apply();
})();
