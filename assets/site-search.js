(function () {
  'use strict';

  if (window.__1200kmSiteSearch) return;
  window.__1200kmSiteSearch = true;

  const ASSET_VERSION = '20260720-1';
  const PAGEFIND_VERSION = '1.5.2';
  const compactNavigation = window.matchMedia('(max-width: 1180px)');
  const path = window.location.pathname.replace(/\/index\.html$/i, '/');
  const interactiveThreatMatrix = path === '/threat-matrix/' || path === '/threat-matrix';
  const searchPage = Boolean(document.querySelector('[data-site-search-page]'));
  let componentsReady = false;
  let searchFailed = false;
  let mountFrame = 0;
  let readinessTimer = 0;
  let modalOpener = null;

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
    const input = document.createElement('pagefind-searchbox');
    input.dataset.siteSearchControl = 'hero-autocomplete';
    input.setAttribute('placeholder', 'Search actors, ATT&CK techniques, AdversaryGraph, CTI, labs…');
    input.setAttribute('max-results', '8');
    input.setAttribute('show-sub-results', 'false');
    input.setAttribute('shortcut', 'disabled');
    input.setAttribute('hide-shortcut', 'true');
    return input;
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
      input.setAttribute('shortcut', 'disabled');
      input.setAttribute('hide-shortcut', 'true');
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
    compactNavigation.addEventListener('change', scheduleMount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
