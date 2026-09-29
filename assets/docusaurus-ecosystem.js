(function () {
  function loadPlatformSidebar() {
    if (!document.querySelector('link[href*="/assets/platform-sidebar.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '/assets/platform-sidebar.css?v=20260830-1';
      stylesheet.dataset.platformSidebarAsset = 'true';
      document.head.appendChild(stylesheet);
    }
    if (!document.querySelector('script[src*="/assets/platform-sidebar.js"]')) {
      const script = document.createElement('script');
      script.src = '/assets/platform-sidebar.js?v=20260830-1';
      script.defer = true;
      script.dataset.platformSidebarLoader = 'true';
      document.head.appendChild(script);
    }
  }

  function loadSiteSearch() {
    if (document.querySelector('script[data-site-search-loader], script[src*="/assets/site-search.js"]')) return;
    const script = document.createElement('script');
    script.src = '/assets/site-search.js?v=20260722-3';
    script.defer = true;
    script.dataset.siteSearchLoader = 'true';
    document.head.appendChild(script);
  }

  loadPlatformSidebar();
  loadSiteSearch();

  function addGateway() {
    const root = document.getElementById('__docusaurus');
    if (!root || !root.parentNode) return;

    let gateway = document.querySelector('.ecosystem-project-bar');
    if (!gateway) {
      gateway = document.createElement('aside');
      gateway.className = 'ecosystem-project-bar';
      gateway.setAttribute('aria-label', 'Explore the 1200km research ecosystem');
      gateway.innerHTML = `
        <div class="ecosystem-project-inner">
          <div class="ecosystem-project-heading">
            <div>
              <h2>Explore the 1200km security research ecosystem</h2>
              <p>Continue from this project into connected intelligence research, detection guidance, analyst tooling, documentation, and reproducible labs.</p>
            </div>
            <a class="button button--primary" href="https://1200km.com/threat-matrix/">Open AdversaryGraph</a>
          </div>
          <div class="ecosystem-project-grid">
            <article class="ecosystem-project-card"><strong>AdversaryGraph</strong><span>Interactive actor and ATT&amp;CK research workspace with detection and hunting context.</span><a href="https://1200km.com/threat-matrix/">Open workspace →</a></article>
            <article class="ecosystem-project-card"><strong>CTI Research</strong><span>Actor profiles, attribution methodology, reports, and CTI-to-detection workflows.</span><a href="https://1200km.com/cti.html">Explore CTI →</a></article>
            <article class="ecosystem-project-card"><strong>Labs &amp; Offensive Research</strong><span>Reproducible attack simulations and practical security environments.</span><a href="https://1200km.com/labs.html">Explore labs →</a></article>
            <article class="ecosystem-project-card"><strong>Portfolio &amp; Source</strong><span>All projects, guides, source repositories, articles, and professional context.</span><a href="https://1200km.com/">Open portfolio →</a></article>
          </div>
        </div>
      `;
    }

    // Keep the gateway outside React's hydration root, across route changes.
    // The old pre-hydration insertion before .footer caused a React mismatch.
    if (gateway.parentNode !== root.parentNode || gateway.previousElementSibling !== root) {
      root.parentNode.insertBefore(gateway, root.nextSibling);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addGateway, { once: true });
  else addGateway();
})();
