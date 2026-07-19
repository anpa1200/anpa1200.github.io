(function () {
  'use strict';

  if (window.__1200kmSiteSearch) return;
  window.__1200kmSiteSearch = true;

  const ASSET_VERSION = '20260719-1';
  const PAGEFIND_VERSION = '1.5.2';
  const path = window.location.pathname.replace(/\/index\.html$/i, '/');
  const interactiveThreatMatrix = path === '/threat-matrix/' || path === '/threat-matrix';
  const searchPage = Boolean(document.querySelector('[data-site-search-page]'));
  let componentsReady = false;
  let searchFailed = false;
  let mountFrame = 0;
  let readinessTimer = 0;

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
    link.setAttribute('aria-label', 'Search all 1200km research');
    link.innerHTML = '<span aria-hidden="true" class="site-search-fallback-icon"></span><span class="site-search-fallback-text">Search</span>';
    return link;
  }

  function buildTrigger(compact) {
    const trigger = document.createElement('pagefind-modal-trigger');
    trigger.setAttribute('placeholder', 'Search');
    trigger.setAttribute('shortcut', 'mod+k');
    if (compact) {
      trigger.setAttribute('compact', 'true');
      trigger.setAttribute('hide-shortcut', 'true');
    }
    return trigger;
  }

  function populateHost(host, compact) {
    const state = `${componentsReady}:${compact}`;
    if (host.dataset.siteSearchMounted === state) return;
    host.dataset.siteSearchMounted = state;
    host.replaceChildren(componentsReady ? buildTrigger(compact) : fallbackLink(compact));
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
    populateHost(host, window.matchMedia('(max-width: 760px)').matches);
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
    const query = new URLSearchParams(window.location.search).get('q')?.trim();
    if (!query) return;
    const inputComponent = searchPage.querySelector('pagefind-searchbox');
    const input = inputComponent && (inputComponent.inputEl || inputComponent.querySelector('input'));
    if (!input) return;
    input.value = query.slice(0, 300);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function mountSearchPageComponents() {
    const searchPage = document.querySelector('[data-site-search-page]');
    if (!searchPage || searchPage.dataset.searchComponentsMounted === 'true') return;
    searchPage.dataset.searchComponentsMounted = 'true';

    const inputHost = searchPage.querySelector('[data-site-search-input]');
    if (inputHost) {
      const input = document.createElement('pagefind-searchbox');
      input.setAttribute('placeholder', 'Try T1059.003, MuddyWater, Kerberoasting, RAG MCP…');
      input.setAttribute('max-results', '12');
      input.setAttribute('show-sub-results', 'false');
      if (!window.matchMedia('(max-width: 760px)').matches) input.setAttribute('autofocus', 'true');
      inputHost.replaceWith(input);
    }

    const summaryHost = searchPage.querySelector('[data-site-search-summary]');
    if (summaryHost) summaryHost.remove();

    const resultsHost = searchPage.querySelector('[data-site-search-results]');
    if (resultsHost) resultsHost.remove();
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
      if (searchPage) mountSearchPageComponents();
      else ensureModal();

      await instance.triggerLoad();
      if (searchFailed) throw new Error('The search index did not initialize.');

      window.clearTimeout(readinessTimer);
      componentsReady = true;
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
    addStylesheet('site-search-component-styles', `/pagefind/pagefind-component-ui.css?v=${PAGEFIND_VERSION}`);
    addStylesheet('site-search-styles', `/assets/site-search.css?v=${ASSET_VERSION}`);
    mount();
    document.addEventListener('pagefind-error', handleComponentError);
    readinessTimer = window.setTimeout(handleComponentError, 20_000);
    loadComponents();

    const docusaurusRoot = document.getElementById('__docusaurus');
    if (docusaurusRoot) {
      new MutationObserver(scheduleMount).observe(docusaurusRoot, { childList: true, subtree: true });
    }
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(max-width: 760px)').addEventListener('change', scheduleMount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
