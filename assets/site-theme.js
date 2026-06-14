(function () {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia('(prefers-color-scheme: light)');

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

    const path = window.location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
    const activePath = path === 'cover-letter.html'
      ? 'cv.html'
      : path === 'threatmapper-web-guide.html'
        ? 'https://1200km.com/threat-matrix/'
        : path;
    links.querySelectorAll('a').forEach(function (link) {
      const href = link.getAttribute('href') || '';
      const local = href.split('#')[0].split('?')[0];
      const active = local === activePath || href === activePath || (activePath === '' && local === 'index.html');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (!links.querySelector('[data-shared-threatmapper]')) {
      const threatMapper = document.createElement('a');
      threatMapper.href = 'https://1200km.com/threat-matrix/';
      threatMapper.textContent = 'ThreatMapper';
      threatMapper.dataset.sharedThreatmapper = 'true';
      threatMapper.className = 'nav-flagship';
      links.insertBefore(threatMapper, links.querySelector('a[href="cti.html"]'));
    }

    if (!links.querySelector('a[href="projects.html"]')) {
      const projects = document.createElement('a');
      projects.href = 'projects.html';
      projects.textContent = 'Projects';
      const github = links.querySelector('a[href="https://github.com/anpa1200"]');
      links.insertBefore(projects, github);
    }

    if (!nav.querySelector('#theme-btn')) {
      const button = document.createElement('button');
      button.className = 'theme-btn';
      button.id = 'theme-btn';
      button.type = 'button';
      button.setAttribute('aria-label', 'Toggle theme');
      nav.appendChild(button);
    }

    if (activePath === 'https://1200km.com/threat-matrix/') {
      const threatMapper = links.querySelector('[data-shared-threatmapper]');
      if (threatMapper) {
        threatMapper.classList.add('active');
        threatMapper.setAttribute('aria-current', 'page');
      }
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
          <a class="button primary" href="https://1200km.com/threat-matrix/">Open ThreatMapper</a>
        </div>
        <div class="site-ecosystem-grid">
          <article class="site-ecosystem-card">
            <span>Flagship platform</span>
            <h3>ThreatMapper</h3>
            <p>Investigate actors and TTPs, compare behavior, and move into detection and hunting guidance.</p>
            <div class="site-ecosystem-links">
              <a href="https://1200km.com/threat-matrix/">Web workspace</a>
              <a href="https://1200km.com/threatmapper/">Project hub</a>
              <a href="https://1200km.com/threatmapper-docs/">Docs</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Intelligence</span>
            <h3>CTI Research</h3>
            <p>Actor profiles, evidence-led attribution, ATT&amp;CK mapping, reports, and analyst methodology.</p>
            <div class="site-ecosystem-links">
              <a href="cti.html">CTI library</a>
              <a href="https://1200km.com/cti-analyst-field-manual/">Field manual</a>
              <a href="https://medium.com/@1200km">Medium</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Practice</span>
            <h3>Labs &amp; Offensive Research</h3>
            <p>Reproducible attack simulations and security labs built to validate defensive assumptions.</p>
            <div class="site-ecosystem-links">
              <a href="labs.html">Labs</a>
              <a href="ai-offensive.html">AI Offensive</a>
              <a href="pt-tools.html">PT Tools</a>
            </div>
          </article>
          <article class="site-ecosystem-card">
            <span>Reference</span>
            <h3>Guides &amp; Source</h3>
            <p>Practical field guides, implementation documentation, source code, and professional context.</p>
            <div class="site-ecosystem-links">
              <a href="guides.html">Guides</a>
              <a href="projects.html">Projects</a>
              <a href="https://github.com/anpa1200">GitHub</a>
              <a href="about.html">About</a>
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
            <img src="assets/ap-logo.png" alt="" width="36" height="36" />
            <strong>Andrey Pautov</strong>
          </a>
          <p>CTI-to-detection practitioner building threat intelligence research, analyst tooling, and practical security labs.</p>
        </div>
        <nav class="shared-footer-column" aria-label="Research">
          <strong>Research</strong>
          <a href="cti.html">CTI</a>
          <a href="guides.html">Guides</a>
          <a href="labs.html">Labs</a>
          <a href="https://medium.com/@1200km">Medium</a>
        </nav>
        <nav class="shared-footer-column" aria-label="Platforms and tools">
          <strong>Platforms &amp; Tools</strong>
          <a href="https://1200km.com/threat-matrix/">ThreatMapper Web</a>
          <a href="https://1200km.com/threatmapper/">ThreatMapper Hub</a>
          <a href="projects.html">Projects</a>
          <a href="ai-offensive.html">AI Offensive</a>
          <a href="pt-tools.html">PT Tools</a>
        </nav>
        <nav class="shared-footer-column" aria-label="Profile and contact">
          <strong>Profile &amp; Contact</strong>
          <a href="about.html">About</a>
          <a href="cv.html">CV</a>
          <a href="projects.html">Projects</a>
          <a href="https://github.com/anpa1200">GitHub</a>
          <a href="mailto:1200km@gmail.com">Email</a>
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

    const button = document.getElementById('theme-btn');
    if (button && !button.dataset.themeReady) {
      button.dataset.themeReady = 'true';
      button.addEventListener('click', function () {
        applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      });
    }
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
