(function () {
  'use strict';

  if (window.__1200kmSiteSearch) return;
  window.__1200kmSiteSearch = true;

  const ASSET_VERSION = '20260722-3';
  const PAGEFIND_VERSION = '1.5.2';
  const SEARCH_PAGE_BATCH_SIZE = 20;
  const SEARCH_FILTERS = [
    { key: 'primary_type', label: 'Content type' },
    { key: 'primary_domain', label: 'Domain' },
    { key: 'audience', label: 'Audience' },
    { key: 'status', label: 'Status' },
    { key: 'lifecycle', label: 'Lifecycle' },
    { key: 'evidence_level', label: 'Evidence level' },
    { key: 'collection_tier', label: 'Collection tier' },
    { key: 'version', label: 'Version' },
    { key: 'source', label: 'Source' },
    { key: 'updated_year', label: 'Updated year' },
    { key: 'topic', label: 'Topic' },
    { key: 'section', label: 'Collection' },
  ];
  const compactNavigation = window.matchMedia('(max-width: 1180px)');
  const path = window.location.pathname.replace(/\/index\.html$/i, '/');
  const interactiveThreatMatrix = path === '/threat-matrix/' || path === '/threat-matrix';
  const searchPage = Boolean(document.querySelector('[data-site-search-page]'));
  let componentsReady = false;
  let searchFailed = false;
  let mountFrame = 0;
  let readinessTimer = 0;
  let modalOpener = null;
  let searchPageActivationRequested = false;
  let pendingSearchValue = '';
  let searchPageLimit = SEARCH_PAGE_BATCH_SIZE;
  let searchPageTotal = 0;
  let pagefindInstance = null;

  function shouldGovernDiscovery(term) {
    if (term === null || term === undefined || !String(term).trim()) return true;
    const normalized = String(term).trim().toLowerCase();
    if (normalized === 'adversarygraph') return true;
    const tokens = normalized.split(/\s+/).filter(Boolean);
    return tokens.length === 2 || tokens.length === 3;
  }

  function rerankDiscoveryResults(results, term, records) {
    if (!Array.isArray(results) || !shouldGovernDiscovery(term)) return results;
    return results.map(function (result, index) {
      return {
        result,
        index,
        governedScore: (Number(result.score) || 0) * (records?.[result.id]?.boost || 1),
      };
    }).sort(function (left, right) {
      return right.governedScore - left.governedScore
        || (Number(right.result.score) || 0) - (Number(left.result.score) || 0)
        || left.index - right.index;
    }).map(function (entry) { return entry.result; });
  }

  async function installDiscoveryGovernance(instance) {
    const engine = instance?.__pagefind__;
    if (!engine || engine.__1200kmGovernanceInstalled) return false;
    try {
      const response = await fetch(`/pagefind/search-governance.json?v=${ASSET_VERSION}`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const governance = await response.json();
      if (governance.schema_version !== 1 || !governance.records) throw new Error('invalid governance payload');
      const originalSearch = engine.search.bind(engine);
      engine.search = async function (term, options) {
        const result = await originalSearch(term, options);
        if (result?.results) result.results = rerankDiscoveryResults(result.results, term, governance.records);
        return result;
      };
      engine.__1200kmGovernanceInstalled = true;
      return true;
    } catch (error) {
      console.warn('Search discovery governance unavailable; preserving Pagefind relevance order.', error);
      return false;
    }
  }

  if (interactiveThreatMatrix) return;

  function addStylesheet(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function currentTheme() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function syncTheme() {
    const theme = currentTheme();
    document.querySelectorAll('[data-site-search-theme]').forEach(function (element) {
      element.setAttribute('data-pf-theme', theme);
    });
  }

  function ensureModal() {
    if (document.getElementById('site-search-modal')) return;
    const modal = document.createElement('pagefind-modal');
    modal.id = 'site-search-modal';
    modal.dataset.siteSearchTheme = 'true';
    modal.setAttribute('reset-on-close', 'true');
    document.body.appendChild(modal);
  }

  function fallbackLink(compact) {
    const link = document.createElement('a');
    link.className = 'site-search-fallback' + (compact ? ' site-search-fallback--compact' : '');
    link.href = '/search.html';
    link.dataset.siteSearchControl = 'fallback';
    link.setAttribute('aria-label', 'Search all 1200km research');
    link.innerHTML = '<span aria-hidden="true" class="site-search-fallback-icon"></span><span class="site-search-fallback-text">Search research</span>';
    return link;
  }

  function buildTrigger(compact) {
    const button = document.createElement('button');
    button.className = 'pf-trigger-btn';
    button.type = 'button';
    button.dataset.siteSearchControl = 'trigger';
    button.setAttribute('aria-label', 'Search all 1200km research');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'site-search-modal');

    const icon = document.createElement('span');
    icon.className = 'pf-trigger-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);

    if (!compact) {
      const text = document.createElement('span');
      text.className = 'pf-trigger-text';
      text.textContent = 'Search research';
      button.appendChild(text);
    }

    button.addEventListener('click', function () {
      const modal = document.getElementById('site-search-modal');
      if (!modal || typeof modal.open !== 'function') return;
      modalOpener = button;
      button.setAttribute('aria-expanded', 'true');
      modal.open();
    });
    return button;
  }

  function populateHost(host, compact) {
    const state = `${componentsReady}:${compact}`;
    if (host.dataset.siteSearchMounted === state) return;
    host.dataset.siteSearchMounted = state;
    host.dataset.searchState = componentsReady ? 'ready' : searchFailed ? 'error' : 'loading';
    host.classList.toggle('site-search-host--compact', compact);
    host.replaceChildren(componentsReady ? buildTrigger(compact) : fallbackLink(compact));
  }

  function buildHeroFallback() {
    const form = document.createElement('form');
    form.className = 'site-search-hero-form';
    form.action = '/search.html';
    form.method = 'get';
    form.setAttribute('role', 'search');
    form.dataset.siteSearchControl = 'hero-fallback';
    form.innerHTML = '<span class="site-search-hero-icon" aria-hidden="true"></span>'
      + '<input type="search" name="q" maxlength="300" autocomplete="off" spellcheck="false" enterkeyhint="search" '
      + 'aria-label="Search all 1200km security research" placeholder="Search actors, ATT&amp;CK techniques, AdversaryGraph, CTI, labs…">'
      + '<button type="submit">Search</button>';
    return form;
  }

  function buildHeroSearchbox() {
    const wrapper = document.createElement('div');
    wrapper.className = 'site-search-hero-enhanced';
    const input = document.createElement('pagefind-searchbox');
    input.dataset.siteSearchControl = 'hero-autocomplete';
    input.setAttribute('placeholder', 'Search actors, ATT&CK techniques, AdversaryGraph, CTI, labs…');
    input.setAttribute('max-results', '10');
    input.setAttribute('show-sub-results', 'true');
    input.setAttribute('shortcut', 'disabled');
    input.setAttribute('hide-shortcut', 'true');
    const allResults = document.createElement('a');
    allResults.className = 'site-search-view-all';
    allResults.href = '/search.html';
    allResults.textContent = 'Open full search with filters →';
    wrapper.addEventListener('input', function (event) {
      if (!event.target?.matches?.('.pf-searchbox-input')) return;
      const query = event.target.value.trim();
      allResults.href = query ? `/search.html?q=${encodeURIComponent(query.slice(0, 300))}` : '/search.html';
    });
    wrapper.append(input, allResults);
    return wrapper;
  }

  function heroSearchHost() {
    const host = document.querySelector('[data-site-search-hero]');
    if (!host) return;
    const state = componentsReady ? 'ready' : searchFailed ? 'error' : 'loading';
    if (host.dataset.searchState === state) return;
    host.dataset.searchState = state;
    if (componentsReady) host.replaceChildren(buildHeroSearchbox());
    else if (!host.querySelector('.site-search-hero-form')) host.replaceChildren(buildHeroFallback());
  }

  function standaloneHost() {
    const nav = document.querySelector('.site-header .nav');
    if (!nav) return;
    let host = nav.querySelector(':scope > .site-search-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'site-search-host site-search-host--standalone';
      host.dataset.siteSearchTheme = 'true';
      const themeButton = nav.querySelector('#theme-btn, .theme-btn');
      nav.insertBefore(host, themeButton || null);
    }
    populateHost(host, compactNavigation.matches);
  }

  function docusaurusHost() {
    const target = document.querySelector('[class*="navbarSearchContainer"], .navbar__items--right');
    if (!target) return;
    let host = target.querySelector(':scope > .site-search-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'site-search-host site-search-host--docusaurus navbar__item';
      host.dataset.siteSearchTheme = 'true';
      if (target.matches('[class*="navbarSearchContainer"]')) target.appendChild(host);
      else target.insertBefore(host, target.firstChild);
    }
    populateHost(host, true);
  }

  function entityHost() {
    if (!/^\/threat-matrix\/(actors|techniques)\//i.test(path)) return;
    let host = document.querySelector('body > .site-search-host--floating');
    if (!host) {
      host = document.createElement('div');
      host.className = 'site-search-host site-search-host--floating';
      host.dataset.siteSearchTheme = 'true';
      document.body.appendChild(host);
    }
    populateHost(host, false);
  }

  function mount() {
    if (searchPage) {
      syncTheme();
      return;
    }
    standaloneHost();
    docusaurusHost();
    entityHost();
    heroSearchHost();
    syncTheme();
  }

  function scheduleMount() {
    if (mountFrame) return;
    mountFrame = window.requestAnimationFrame(function () {
      mountFrame = 0;
      mount();
    });
  }

  function setSearchPageStatus(message, state) {
    const status = document.querySelector('[data-site-search-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function hydrateSearchPageQuery() {
    const searchPage = document.querySelector('[data-site-search-page]');
    if (!searchPage) return;
    setSearchPageStatus('Search is ready. Results update as you type.', 'ready');
    const query = new URLSearchParams(window.location.search).get('q')?.trim() || pendingSearchValue.trim();
    const inputComponent = searchPage.querySelector('pagefind-input, pagefind-searchbox');
    const input = inputComponent && (inputComponent.inputEl || inputComponent.querySelector('input'));
    if (!input) return;
    if (query) {
      input.value = query.slice(0, 300);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (searchPageActivationRequested) input.focus();
  }

  function repairFilterAccessibility(filtersHost) {
    if (!filtersHost) return;
    filtersHost.querySelectorAll('pagefind-filter-dropdown').forEach(function (dropdown) {
      const button = dropdown.querySelector('.pf-dropdown-trigger');
      const label = dropdown.getAttribute('label');
      if (button && label) button.setAttribute('aria-label', label);
    });
  }

  function formatFilterValue(value) {
    return String(value)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function setSearchPageLimit(limit) {
    searchPageLimit = Math.max(SEARCH_PAGE_BATCH_SIZE, limit);
    const results = document.querySelector('[data-site-search-results] pagefind-results');
    if (results) results.setAttribute('max-results', String(searchPageLimit));
  }

  function updateSearchPagination() {
    const pagination = document.querySelector('[data-site-search-pagination]');
    const button = document.querySelector('[data-site-search-load-more]');
    const progress = document.querySelector('[data-site-search-progress]');
    if (!pagination || !button || !progress) return;
    const visible = Math.min(searchPageLimit, searchPageTotal);
    progress.textContent = searchPageTotal ? `Showing ${visible} of ${searchPageTotal} results.` : '';
    const remaining = Math.max(0, searchPageTotal - visible);
    pagination.hidden = remaining === 0;
    button.hidden = remaining === 0;
    if (remaining) {
      const next = Math.min(SEARCH_PAGE_BATCH_SIZE, remaining);
      button.textContent = `Load ${next} more results`;
      button.setAttribute('aria-label', `Load ${next} more results; ${remaining} results remain`);
    }
  }

  function activeSearchFilters() {
    const filters = pagefindInstance?.searchFilters || {};
    return Object.entries(filters)
      .flatMap(function ([key, values]) {
        return (Array.isArray(values) ? values : []).map(function (value) { return { key, value }; });
      });
  }

  function applySearchFilters(filters) {
    if (!pagefindInstance) return;
    setSearchPageLimit(SEARCH_PAGE_BATCH_SIZE);
    pagefindInstance.triggerSearchWithFilters(pagefindInstance.searchTerm || '', filters);
  }

  function renderActiveFilters() {
    const host = document.querySelector('[data-site-search-active]');
    const list = document.querySelector('[data-site-search-active-list]');
    if (!host || !list) return;
    const active = activeSearchFilters();
    host.hidden = active.length === 0;
    const labels = new Map(SEARCH_FILTERS.map(function (filter) { return [filter.key, filter.label]; }));
    const fragment = document.createDocumentFragment();
    active.forEach(function (filter) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'site-search-filter-chip';
      button.dataset.filterKey = filter.key;
      button.dataset.filterValue = filter.value;
      button.setAttribute('aria-label', `Remove ${labels.get(filter.key) || filter.key} filter: ${formatFilterValue(filter.value)}`);
      button.textContent = `${labels.get(filter.key) || filter.key}: ${formatFilterValue(filter.value)} ×`;
      button.addEventListener('click', function () {
        const filters = { ...(pagefindInstance?.searchFilters || {}) };
        const remaining = (filters[filter.key] || []).filter(function (value) { return value !== filter.value; });
        if (remaining.length) filters[filter.key] = remaining;
        else delete filters[filter.key];
        applySearchFilters(filters);
      });
      fragment.appendChild(button);
    });
    list.replaceChildren(fragment);
  }

  function repairResultAccessibility(root = document) {
    const results = [];
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.('.pf-searchbox-result')) results.push(root);
    root.querySelectorAll?.('.pf-searchbox-result').forEach(function (result) { results.push(result); });
    results.forEach(function (result) {
      // Pagefind labels the link from its title and describes it from excerpt
      // text inside the same interactive element. Axe correctly flags that as
      // a visible-label mismatch. Let the option derive its name from all of
      // its visible contents instead.
      result.removeAttribute('aria-labelledby');
      result.removeAttribute('aria-describedby');
    });
  }

  function mountSearchPageComponents() {
    const searchPage = document.querySelector('[data-site-search-page]');
    if (!searchPage || searchPage.dataset.searchComponentsMounted === 'true') return;
    searchPage.dataset.searchComponentsMounted = 'true';

    const inputHost = searchPage.querySelector('[data-site-search-input]');
    if (inputHost) {
      pendingSearchValue = inputHost.querySelector('input')?.value || pendingSearchValue;
      const input = document.createElement('pagefind-input');
      input.setAttribute('placeholder', 'Try T1059.003, MuddyWater, Kerberoasting, RAG MCP…');
      if (!window.matchMedia('(max-width: 760px)').matches) input.setAttribute('autofocus', 'true');
      inputHost.replaceWith(input);
    }

    const filtersHost = searchPage.querySelector('[data-site-search-filters]');
    if (filtersHost) {
      const fragment = document.createDocumentFragment();
      SEARCH_FILTERS.forEach(function (filter) {
        const dropdown = document.createElement('pagefind-filter-dropdown');
        dropdown.setAttribute('filter', filter.key);
        dropdown.setAttribute('label', filter.label);
        dropdown.setAttribute('single-select', 'true');
        dropdown.setAttribute('sort', 'count-desc');
        fragment.appendChild(dropdown);
      });
      filtersHost.replaceChildren(fragment);
      const observer = new MutationObserver(function () {
        repairFilterAccessibility(filtersHost);
      });
      observer.observe(filtersHost, { childList: true, subtree: true });
      window.requestAnimationFrame(function () {
        repairFilterAccessibility(filtersHost);
        window.setTimeout(function () {
          repairFilterAccessibility(filtersHost);
        }, 500);
      });
    }

    const summaryHost = searchPage.querySelector('[data-site-search-summary]');
    if (summaryHost) {
      const summary = document.createElement('pagefind-summary');
      summary.setAttribute('default-message', 'Browse all indexed research or enter a query.');
      summaryHost.replaceChildren(summary);
    }

    const resultsHost = searchPage.querySelector('[data-site-search-results]');
    if (resultsHost) {
      const results = document.createElement('pagefind-results');
      results.setAttribute('max-results', String(SEARCH_PAGE_BATCH_SIZE));
      results.setAttribute('max-sub-results', '4');
      const template = document.createElement('script');
      template.type = 'text/pagefind-template';
      template.dataset.template = 'result';
      template.textContent = `
        <li class="pf-result">
          <article class="site-search-result-card">
            <p class="site-search-result-meta">
              <span>{{ meta.primary_type }}</span>
              <span>{{ meta.primary_domain }}</span>
              <span>{{ meta.status }}</span>
              <span>{{ meta.lifecycle }}</span>
              <span>{{ meta.evidence_level }}</span>
              <span>{{ meta.collection_tier }}</span>
              <span>{{ meta.source }}</span>
              <span>{{ meta.updated_year }}</span>
            </p>
            <h2 class="pf-result-title"><a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a></h2>
            {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
            {{#if sub_results}}
            <div class="pf-subresults">
              <ul class="pf-heading-chips">
                {{#each sub_results as sub}}
                <li class="pf-heading-chip"><a class="pf-heading-link" href="{{ sub.url | safeUrl }}">{{ sub.title }}</a>{{#if sub.excerpt}}<p class="pf-heading-excerpt">{{+ sub.excerpt +}}</p>{{/if}}</li>
                {{/each}}
              </ul>
            </div>
            {{/if}}
          </article>
        </li>`;
      results.appendChild(template);
      resultsHost.replaceChildren(results);
    }

    const clearAll = searchPage.querySelector('[data-site-search-clear-all]');
    clearAll?.addEventListener('click', function () { applySearchFilters({}); });
    const loadMore = searchPage.querySelector('[data-site-search-load-more]');
    loadMore?.addEventListener('click', function () {
      setSearchPageLimit(Math.min(searchPageTotal, searchPageLimit + SEARCH_PAGE_BATCH_SIZE));
      pagefindInstance?.triggerSearch(pagefindInstance.searchTerm || '');
    });

    const workspace = searchPage.querySelector('.site-search-workspace');
    workspace?.addEventListener('input', function (event) {
      if (event.target?.matches?.('pagefind-input input, .pf-input')) setSearchPageLimit(SEARCH_PAGE_BATCH_SIZE);
    }, true);
    workspace?.addEventListener('change', function (event) {
      if (event.target?.closest?.('pagefind-filter-dropdown')) setSearchPageLimit(SEARCH_PAGE_BATCH_SIZE);
    }, true);
  }

  async function configureComponents() {
    try {
      if (!window.PagefindComponents?.configureInstance) throw new Error('Pagefind Component UI did not initialize.');
      const instance = window.PagefindComponents.configureInstance('default', {
        bundlePath: '/pagefind/',
        baseUrl: '/',
        excerptLength: 28,
        ranking: {
          pageLength: 0.5,
          termFrequency: 0.8,
          termSimilarity: 1,
          metaWeights: {
            title: 10,
            identifier: 20,
            aliases: 12,
            description: 3,
            collection: 2,
          },
        },
      });
      pagefindInstance = instance;
      if (searchPage) {
        instance.faceted = true;
        mountSearchPageComponents();
        instance.on('search', function () {
          renderActiveFilters();
        }, searchPage);
        instance.on('results', function (result) {
          searchPageTotal = result?.results?.length || 0;
          updateSearchPagination();
          renderActiveFilters();
          if (instance.searchTerm) {
            const resultsComponent = document.querySelector('[data-site-search-results] pagefind-results');
            resultsComponent?.results?.slice(0, 3).forEach(function (entry) { entry.load(); });
          }
        }, searchPage);
      }
      else {
        ensureModal();
        const modal = document.getElementById('site-search-modal');
        const dialog = modal && (modal.dialogEl || modal.querySelector('dialog'));
        if (dialog && dialog.dataset.siteSearchFocusManaged !== 'true') {
          dialog.dataset.siteSearchFocusManaged = 'true';
          dialog.addEventListener('close', function () {
            document.querySelectorAll('[data-site-search-control="trigger"]').forEach(function (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
            });
            const opener = modalOpener;
            modalOpener = null;
            if (opener && opener.isConnected) opener.focus();
          });
        }
      }

      await instance.triggerLoad();
      const governanceInstalled = await installDiscoveryGovernance(instance);
      if (searchPage && governanceInstalled && instance.searchResult) {
        instance.triggerSearch(instance.searchTerm || '');
      }
      if (searchFailed) throw new Error('The search index did not initialize.');

      window.clearTimeout(readinessTimer);
      componentsReady = true;
      repairFilterAccessibility(document.querySelector('[data-site-search-filters]'));
      mount();
      window.setTimeout(hydrateSearchPageQuery, 100);
    } catch (error) {
      handleComponentError(error);
    }
  }

  function handleComponentError() {
    searchFailed = true;
    window.clearTimeout(readinessTimer);
    componentsReady = false;
    mount();
    setSearchPageStatus('Search could not load. Please refresh, or browse the research collections below.', 'error');
  }

  function loadComponents() {
    if (document.getElementById('site-search-components')) return;
    const script = document.createElement('script');
    script.id = 'site-search-components';
    script.type = 'module';
    script.src = `/pagefind/pagefind-component-ui.js?v=${PAGEFIND_VERSION}`;
    script.addEventListener('load', configureComponents, { once: true });
    script.addEventListener('error', handleComponentError, { once: true });
    document.head.appendChild(script);
  }

  function initialize() {
    addStylesheet('site-search-styles', `/assets/site-search.css?v=${ASSET_VERSION}`);
    mount();
    document.addEventListener('pagefind-error', handleComponentError);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          repairResultAccessibility(node);
        });
      });
      repairFilterAccessibility(document.querySelector('[data-site-search-filters]'));
    }).observe(document.body, { childList: true, subtree: true });
    function beginSearchLoad() {
      if (document.getElementById('site-search-components')) return;
      if (searchPage) setSearchPageStatus('Loading the research index…', 'loading');
      addStylesheet('site-search-component-styles', `/pagefind/pagefind-component-ui.css?v=${PAGEFIND_VERSION}`);
      readinessTimer = window.setTimeout(handleComponentError, 6_000);
      loadComponents();
    }
    if (searchPage) {
      const query = new URLSearchParams(window.location.search).get('q')?.trim();
      if (query) beginSearchLoad();
      else {
        const workspace = document.querySelector('.site-search-workspace');
        const activateSearchPage = function (event) {
          if (!event.target?.closest?.('[data-site-search-input], [data-site-search-filters]')) return;
          pendingSearchValue = document.querySelector('[data-site-search-input] input')?.value || '';
          searchPageActivationRequested = true;
          workspace?.removeEventListener('focusin', activateSearchPage);
          workspace?.removeEventListener('pointerover', activateSearchPage);
          beginSearchLoad();
        };
        workspace?.addEventListener('focusin', activateSearchPage);
        workspace?.addEventListener('pointerover', activateSearchPage, { passive: true });
      }
    } else {
      const eagerLoad = function (event) {
        if (!event.target?.closest?.('.site-search-host, [data-site-search-hero]')) return;
        document.removeEventListener('focusin', eagerLoad);
        document.removeEventListener('pointerover', eagerLoad);
        beginSearchLoad();
      };
      document.addEventListener('focusin', eagerLoad);
      document.addEventListener('pointerover', eagerLoad, { passive: true });
    }

    const docusaurusRoot = document.getElementById('__docusaurus');
    if (docusaurusRoot) {
      new MutationObserver(scheduleMount).observe(docusaurusRoot, { childList: true, subtree: true });
    }
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    compactNavigation.addEventListener('change', scheduleMount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
