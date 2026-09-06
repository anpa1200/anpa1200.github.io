(function () {
  'use strict';

  const form = document.querySelector('[data-ks-filters]');
  if (!form) return;

  const cards = Array.from(document.querySelectorAll('[data-ks-source-card]'));
  const categorySections = Array.from(document.querySelectorAll('[data-ks-category-section]'));
  const status = document.getElementById('knowledge-source-status');
  const emptyState = document.querySelector('[data-ks-empty]');
  const activeFilter = document.querySelector('[data-ks-active-filter]');
  const activeFilterLabel = document.querySelector('[data-ks-active-filter-label]');
  const results = document.getElementById('source-results');
  const fields = {
    q: document.getElementById('knowledge-source-query'),
    category: document.getElementById('knowledge-source-category'),
    tag: document.getElementById('knowledge-source-tag'),
    access: document.getElementById('knowledge-source-access'),
    level: document.getElementById('knowledge-source-level'),
    tier: document.getElementById('knowledge-source-tier'),
    evidence: document.getElementById('knowledge-source-evidence'),
    maintenance: document.getElementById('knowledge-source-maintenance'),
    kind: document.getElementById('knowledge-source-kind'),
  };
  const ownedParameters = Object.keys(fields);
  const searchCache = new WeakMap();

  function normalize(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('en')
      .replace(/[^a-z0-9+#.]+/g, ' ')
      .trim();
  }

  function tokens(value) {
    return String(value || '').split(/\s+/).filter(Boolean);
  }

  function optionExists(field, value) {
    if (!field || !value) return value === '';
    return Array.from(field.options).some(function (option) {
      return option.value === value;
    });
  }

  function readUrlState() {
    const parameters = new URLSearchParams(window.location.search);
    const state = {};
    for (const name of ownedParameters) {
      const raw = (parameters.get(name) || '').trim();
      state[name] = name === 'q' || optionExists(fields[name], raw) ? raw : '';
    }
    return state;
  }

  function readFormState() {
    const state = {};
    for (const name of ownedParameters) state[name] = (fields[name]?.value || '').trim();
    return state;
  }

  function writeFormState(state) {
    for (const name of ownedParameters) {
      const value = state[name] || '';
      if (name === 'q' || optionExists(fields[name], value)) fields[name].value = value;
      else fields[name].value = '';
    }
  }

  function clearFormState() {
    for (const name of ownedParameters) fields[name].value = '';
  }

  function writeUrlState(state) {
    const url = new URL(window.location.href);
    for (const name of ownedParameters) {
      const value = state[name];
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    try {
      window.history.replaceState(window.history.state, '', url);
    } catch {
      // History mutation may be blocked for local files or hardened browser contexts.
    }
  }

  function cardSearchText(card) {
    if (!searchCache.has(card)) {
      searchCache.set(card, normalize(`${card.textContent} ${card.dataset.indexTerms || ''}`));
    }
    return searchCache.get(card);
  }

  function cardMatches(card, state) {
    const queryTokens = normalize(state.q).split(/\s+/).filter(Boolean);
    if (queryTokens.length && !queryTokens.every(function (token) {
      return cardSearchText(card).includes(token);
    })) return false;

    if (state.category && card.dataset.category !== state.category) return false;
    if (state.tag && !tokens(card.dataset.tags).includes(state.tag)) return false;
    if (state.access && card.dataset.access !== state.access) return false;
    if (state.level && !tokens(card.dataset.skills).includes(state.level)) return false;
    if (state.tier && card.dataset.tier !== state.tier) return false;
    if (state.evidence && card.dataset.evidence !== state.evidence) return false;
    if (state.maintenance && card.dataset.maintenance !== state.maintenance) return false;
    if (state.kind && card.dataset.sourceKind !== state.kind) return false;
    return true;
  }

  function selectionLabel(field) {
    const option = field?.selectedOptions?.[0];
    if (!option || !option.value) return '';
    return option.textContent.replace(/\s+\(\d+\)$/, '');
  }

  function describeState(state) {
    const labels = [];
    if (state.q) labels.push(`Search “${state.q}”`);
    if (state.category) labels.push(`Category: ${selectionLabel(fields.category)}`);
    if (state.tag) labels.push(`Tag: ${selectionLabel(fields.tag)}`);
    if (state.access) labels.push(`Access: ${selectionLabel(fields.access)}`);
    if (state.level) labels.push(`Level: ${selectionLabel(fields.level)}`);
    if (state.tier) labels.push(`Tier: ${selectionLabel(fields.tier)}`);
    if (state.evidence) labels.push(`Evidence: ${selectionLabel(fields.evidence)}`);
    if (state.maintenance) labels.push(`Maintenance: ${selectionLabel(fields.maintenance)}`);
    if (state.kind) labels.push(`Type: ${selectionLabel(fields.kind)}`);
    return labels.join(' · ');
  }

  function updateStatus(visibleCount) {
    if (!status) return;
    const count = document.createElement('strong');
    count.textContent = String(visibleCount);
    status.replaceChildren(count, document.createTextNode(` of ${cards.length} sources shown`));
  }

  function updateCategorySections() {
    for (const section of categorySections) {
      const sectionCards = Array.from(section.querySelectorAll('[data-ks-source-card]'));
      const visibleCount = sectionCards.filter(function (card) { return !card.hidden; }).length;
      section.hidden = visibleCount === 0;
      const count = section.querySelector('[data-ks-category-count]');
      if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? 'source' : 'sources'}`;
    }
  }

  function applyFilters(options) {
    const settings = options || {};
    const state = readFormState();
    let visibleCount = 0;

    for (const card of cards) {
      const matches = cardMatches(card, state);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    }

    updateCategorySections();
    updateStatus(visibleCount);
    if (emptyState) emptyState.hidden = visibleCount !== 0;

    const description = describeState(state);
    if (activeFilter && activeFilterLabel) {
      activeFilter.hidden = !description;
      activeFilterLabel.textContent = description;
    }

    if (settings.syncUrl !== false) writeUrlState(state);
    document.documentElement.dataset.ksReady = 'true';
    return visibleCount;
  }

  function focusSource(target) {
    const assessment = target.querySelector('.ks-assessment');
    if (assessment) assessment.open = true;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', function cleanup() {
      target.removeAttribute('tabindex');
    }, { once: true });
  }

  function sourceTargetFromHash(hash) {
    if (!/^#source-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hash)) return null;
    return document.getElementById(hash.slice(1));
  }

  function revealHashTarget(options) {
    const settings = options || {};
    const target = sourceTargetFromHash(window.location.hash);
    if (!target) return false;

    if (target.hidden || target.closest('[data-ks-category-section]')?.hidden) {
      clearFormState();
      applyFilters({ syncUrl: true });
    }

    const assessment = target.querySelector('.ks-assessment');
    if (assessment) assessment.open = true;
    if (settings.scroll) target.scrollIntoView({ behavior: settings.behavior || 'smooth', block: 'start' });
    if (settings.focus) focusSource(target);
    return true;
  }

  function realignCurrentHash(behavior) {
    if (revealHashTarget({ scroll: true, focus: false, behavior: behavior || 'auto' })) return;
    if (!/^#[a-z][a-z0-9-]*$/.test(window.location.hash)) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && target.closest('main')) {
      target.scrollIntoView({ behavior: behavior || 'auto', block: 'start' });
    }
  }

  function navigateToSource(anchor) {
    const target = sourceTargetFromHash(anchor.hash);
    if (!target) return;

    clearFormState();
    applyFilters({ syncUrl: true });
    try {
      window.history.pushState(window.history.state, '', anchor.hash);
    } catch {
      window.location.hash = anchor.hash;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    focusSource(target);
  }

  function activateTag(tag) {
    if (!optionExists(fields.tag, tag)) return;
    clearFormState();
    fields.tag.value = tag;
    applyFilters({ syncUrl: true });
    if (results) {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const title = document.getElementById('source-results-title');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
        title.addEventListener('blur', function cleanup() {
          title.removeAttribute('tabindex');
        }, { once: true });
      }
    }
  }

  form.addEventListener('input', function (event) {
    if (event.target === fields.q) applyFilters();
  });

  form.addEventListener('change', function () {
    applyFilters();
  });

  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      applyFilters();
      fields.q.focus();
    }, 0);
  });

  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;
    const tagLink = event.target.closest('[data-ks-tag-link]');
    if (tagLink) {
      event.preventDefault();
      activateTag(tagLink.dataset.ksTagLink);
      return;
    }

    const sourceLink = event.target.closest('a[href^="#source-"]');
    if (sourceLink) {
      event.preventDefault();
      navigateToSource(sourceLink);
    }
  });

  document.addEventListener('keydown', function (event) {
    const target = event.target;
    const editable = target instanceof HTMLInputElement
      || target instanceof HTMLSelectElement
      || target instanceof HTMLTextAreaElement
      || target.isContentEditable;

    if (event.key === '/' && !editable) {
      event.preventDefault();
      fields.q.focus();
    }
    if (event.key === 'Escape' && target === fields.q && fields.q.value) {
      fields.q.value = '';
      applyFilters();
    }
  });

  window.addEventListener('popstate', function () {
    writeFormState(readUrlState());
    applyFilters({ syncUrl: false });
    window.requestAnimationFrame(function () { realignCurrentHash('auto'); });
  });

  window.addEventListener('hashchange', function () {
    window.requestAnimationFrame(function () { realignCurrentHash('auto'); });
  });

  writeFormState(readUrlState());
  applyFilters({ syncUrl: false });
  window.requestAnimationFrame(function () { realignCurrentHash('auto'); });
  window.addEventListener('load', function () {
    window.requestAnimationFrame(function () { realignCurrentHash('auto'); });
    window.setTimeout(function () { realignCurrentHash('auto'); }, 120);
  }, { once: true });
}());
