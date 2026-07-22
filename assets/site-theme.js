(function () {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const searchAssetVersion = '20260722-2';

  function loadSiteSearch() {
    if (!document.getElementById('site-search-styles')) {
      const stylesheet = document.createElement('link');
      stylesheet.id = 'site-search-styles';
      stylesheet.rel = 'stylesheet';
      stylesheet.href = `/assets/site-search.css?v=${searchAssetVersion}`;
      document.head.appendChild(stylesheet);
    }
    if (document.querySelector('script[data-site-search-loader], script[src*="/assets/site-search.js"]')) return;
    const script = document.createElement('script');
    script.src = '/assets/site-search.js?v=20260722-2';
    script.defer = true;
    script.dataset.siteSearchLoader = 'true';
    document.head.appendChild(script);
  }

  loadSiteSearch();

  function preferredTheme() {
    return localStorage.getItem('theme') || (media.matches ? 'light' : 'dark');
  }

  function applyTheme(theme, persist) {
    const next = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);

    if (persist) localStorage.setItem('theme', next);
    if (themeColor) themeColor.setAttribute('content', next === 'light' ? '#f4f7fc' : '#07101f');

    const button = document.getElementById('theme-btn');
    if (button) {
      const target = next === 'dark' ? 'light' : 'dark';
      button.textContent = next === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', `Switch to ${target} mode`);
      button.setAttribute('title', `Switch to ${target} mode`);
      button.setAttribute('aria-pressed', String(next === 'light'));
    }
  }

  function initializeHeader() {
    const nav = document.querySelector('.site-header[data-site-shell="standalone"] .nav');
    const links = nav && nav.querySelector('details.nav-links[data-mobile-navigation]');
    if (!nav || !links) return;
    const summary = links.querySelector(':scope > .nav-menu-toggle');
    const list = links.querySelector(':scope > .nav-list');
    if (!summary || !list) return;
    const mobileNavigation = window.matchMedia('(max-width: 900px)');
    const syncNavigationMode = function () {
      if (!mobileNavigation.matches && links.open) links.open = false;
    };
    syncNavigationMode();
    if (!links.dataset.navigationMediaReady) {
      links.dataset.navigationMediaReady = 'true';
      mobileNavigation.addEventListener('change', syncNavigationMode);
    }

    if (!links.dataset.navigationReady) {
      links.dataset.navigationReady = 'true';
      links.addEventListener('toggle', function () {
        summary.setAttribute('aria-label', links.open ? 'Close navigation' : 'Open navigation');
      });
      list.addEventListener('click', function (event) {
        if (event.target.closest('a') && mobileNavigation.matches) links.open = false;
      });
      document.addEventListener('click', function (event) {
        if (links.open && mobileNavigation.matches && !links.contains(event.target)) links.open = false;
      });
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape' || !links.open || !mobileNavigation.matches) return;
        links.open = false;
        summary.focus();
      });
    }
  }

  function initializeSideNavigation() {
    const links = Array.from(document.querySelectorAll('.sidenav-scroll a[data-section]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    const sections = links.map(function (link) {
      return { link, section: document.getElementById(link.dataset.section) };
    }).filter(function (entry) {
      return entry.section;
    });
    if (!sections.length) return;

    let active = links.find(function (link) {
      return link.getAttribute('aria-current') === 'location';
    }) || null;
    const activate = function (link) {
      if (active === link) return;
      if (active) {
        active.classList.remove('active');
        active.removeAttribute('aria-current');
      }
      active = link;
      active.classList.add('active');
      active.setAttribute('aria-current', 'location');
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const match = sections.find(function (candidate) {
          return candidate.section === entry.target;
        });
        if (match) activate(match.link);
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });

    sections.forEach(function (entry) {
      observer.observe(entry.section);
    });
  }

  function initialize() {
    initializeHeader();
    initializeSideNavigation();
    applyTheme(preferredTheme(), false);
    initializeEmailLinks();

    const button = document.getElementById('theme-btn');
    if (button && !button.dataset.themeReady) {
      button.dataset.themeReady = 'true';
      button.addEventListener('click', function () {
        applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      });
    }
  }

  function initializeEmailLinks() {
    document.querySelectorAll('[data-email-user][data-email-domain]').forEach(function (item) {
      const address = `${item.dataset.emailUser}@${item.dataset.emailDomain}`;
      if (item.tagName.toLowerCase() === 'a') {
        item.href = `mailto:${address}`;
      }
      item.textContent = item.dataset.emailLabel || address;
    });
  }

  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') applyTheme(preferredTheme(), false);
  });

  media.addEventListener('change', function () {
    if (!localStorage.getItem('theme')) applyTheme(preferredTheme(), false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
