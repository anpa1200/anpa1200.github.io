(function () {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const searchAssetVersion = '20260719-2';

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
    script.src = '/assets/site-search.js?v=20260719-2';
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

  function normalizeHeader() {
    const nav = document.querySelector('.site-header .nav');
    const links = nav && nav.querySelector('.nav-links');
    if (!nav || !links) return;

    const navItems = [
      { href: '/about.html', label: 'About' },
      { href: '/cv.html', label: 'CV' },
      { href: '/cti.html', label: 'CTI' },
      { href: '/labs.html', label: 'Labs' },
      { href: '/guides.html', label: 'Guides' },
      { href: '/articles/', label: 'Articles' },
      { href: '/hexstrike.html', label: 'HexStrike' },
      { href: '/ai-offensive.html', label: 'Offensive' },
      { href: '/pt-tools.html', label: 'PT Tools' },
      { href: '/projects.html', label: 'Projects' },
      { href: '/external-validation.html', label: 'Validation' },
      { href: 'https://github.com/anpa1200', label: 'GitHub ↗', external: true },
      { href: 'https://medium.com/@1200km', label: 'Medium ↗', external: true },
    ];

    links.replaceChildren(...navItems.map(function (item) {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (item.external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      return link;
    }));

    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    const path = pathname.split('/').pop() || 'index.html';
    const activePath = path === 'cover-letter.html'
      ? '/cv.html'
      : path === 'adversarygraph-web-guide.html'
        ? 'https://1200km.com/threat-matrix/'
        : pathname === '/articles'
          ? '/articles/'
          : pathname;
    links.querySelectorAll('a').forEach(function (link) {
      const href = link.getAttribute('href') || '';
      const local = href.split('#')[0].split('?')[0];
      const active = local === activePath || href === activePath || (activePath === '/' && local === '/');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (!nav.querySelector('#theme-btn')) {
      const button = document.createElement('button');
      button.className = 'theme-btn';
      button.id = 'theme-btn';
      button.type = 'button';
      button.setAttribute('aria-label', 'Toggle theme');
      nav.appendChild(button);
    }

    if (!nav.querySelector(':scope > .site-search-host')) {
      const host = document.createElement('div');
      host.className = 'site-search-host site-search-host--standalone';
      host.dataset.siteSearchTheme = 'true';
      host.dataset.searchState = 'loading';
      host.innerHTML = '<a class="site-search-fallback" data-site-search-control="fallback" href="/search.html" aria-label="Search all 1200km research">'
        + '<span aria-hidden="true" class="site-search-fallback-icon"></span>'
        + '<span class="site-search-fallback-text">Search research</span>'
        + '<kbd class="site-search-fallback-shortcut" aria-hidden="true">Ctrl K</kbd></a>';
      nav.insertBefore(host, nav.querySelector('#theme-btn'));
    }

  }

  function addEcosystemGateway() {
    if (document.querySelector('.site-ecosystem-gateway')) return;
    const footer = document.querySelector('footer, .footer');
    if (!footer) return;

    const gateway = document.createElement('section');
    gateway.className = 'site-ecosystem-gateway';
    gateway.setAttribute('aria-labelledby', 'site-ecosystem-heading');
    gateway.innerHTML = `
      <div class="site-ecosystem-inner">
        <div class="site-ecosystem-heading">
          <div>
            <p class="site-ecosystem-eyebrow">1200km Security Research Ecosystem</p>
            <h2 id="site-ecosystem-heading">Move from intelligence to practical action.</h2>
            <p>Explore connected research, tooling, documentation, and reproducible labs across the full CTI-to-detection workflow.</p>
          </div>
          <a class="button primary" href="https://1200km.com/threat-matrix/">Open AdversaryGraph</a>
        </div>
        <div class="site-ecosystem-grid">
          <article class="site-ecosystem-card">
            <span>Flagship platform</span>
            <h3>AdversaryGraph</h3>
            <p>Investigate actors and TTPs, compare behavior, and move into detection and hunting guidance.</p>
            <div class="site-ecosystem-links">
              <a href="https://1200km.com/threat-matrix/">Web workspace</a>
              <a href="https://1200km.com/adversarygraph/">Project hub</a>
              <a href="https://1200km.com/adversarygraph-docs/">Docs</a>
              <a href="https://1200km.com/articles/adversarygraph-v2-self-hosted-ai-cti-platform.html">Article</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Intelligence</span>
            <h3>CTI Research</h3>
            <p>Actor profiles, evidence-led attribution, ATT&amp;CK mapping, reports, and analyst methodology.</p>
            <div class="site-ecosystem-links">
              <a href="/cti.html">CTI library</a>
              <a href="https://1200km.com/cti-analyst-field-manual/">Field manual</a>
              <a href="https://medium.com/@1200km">Medium</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Practice</span>
            <h3>Labs &amp; Offensive Research</h3>
            <p>Reproducible attack simulations and security labs built to validate defensive assumptions.</p>
            <div class="site-ecosystem-links">
              <a href="/labs.html">Labs</a>
              <a href="/ai-offensive.html">AI Offensive</a>
              <a href="/pt-tools.html">PT Tools</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Reference</span>
            <h3>Guides &amp; Source</h3>
            <p>Practical field guides, implementation documentation, source code, and professional context.</p>
            <div class="site-ecosystem-links">
              <a href="/guides.html">Guides</a>
              <a href="/projects.html">Projects</a>
              <a href="https://github.com/anpa1200">GitHub</a>
              <a href="/about.html">About</a>
            </div>
          </article>
        </div>
      </div>
    `;
    footer.parentNode.insertBefore(gateway, footer);
  }

  function normalizeFooter() {
    const footer = document.querySelector('footer, .footer');
    if (!footer || footer.dataset.sharedFooter === 'true') return;
    footer.dataset.sharedFooter = 'true';
    footer.innerHTML = `
      <div class="shared-footer-inner">
        <div class="shared-footer-brand">
          <a href="index.html">
            <img src="/assets/ap-logo.png" alt="" width="36" height="36" />
            <strong>Andrey Pautov</strong>
          </a>
          <p>CTI-to-detection practitioner building threat intelligence research, analyst tooling, and practical security labs.</p>
        </div>
        <nav class="shared-footer-column" aria-label="Research">
          <strong>Research</strong>
          <a href="/cti.html">CTI</a>
          <a href="/guides.html">Guides</a>
          <a href="/labs.html">Labs</a>
          <a href="/articles/">Articles</a>
          <a href="https://medium.com/@1200km">Medium</a>
        </nav>
        <nav class="shared-footer-column" aria-label="Platforms and tools">
          <strong>Platforms &amp; Tools</strong>
          <a href="https://1200km.com/threat-matrix/">AdversaryGraph Web</a>
          <a href="https://1200km.com/adversarygraph/">AdversaryGraph Hub</a>
          <a href="/projects.html">Projects</a>
          <a href="/ai-offensive.html">AI Offensive</a>
          <a href="/pt-tools.html">PT Tools</a>
        </nav>
        <nav class="shared-footer-column" aria-label="Profile and contact">
          <strong>Profile &amp; Contact</strong>
          <a href="/about.html">About</a>
          <a href="/cv.html">CV</a>
          <a href="/projects.html">Projects</a>
          <a href="https://github.com/anpa1200">GitHub</a>
          <a href="#" data-email-user="1200km" data-email-domain="gmail.com">Email</a>
        </nav>
      </div>
      <div class="shared-footer-bottom">
        <span>© ${new Date().getFullYear()} Andrey Pautov · Original research and tooling</span>
        <a href="#top" data-back-to-top>Back to top ↑</a>
      </div>
    `;

    const top = footer.querySelector('[data-back-to-top]');
    if (top) {
      top.addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function initialize() {
    normalizeHeader();
    applyTheme(preferredTheme(), false);
    addEcosystemGateway();
    normalizeFooter();
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
