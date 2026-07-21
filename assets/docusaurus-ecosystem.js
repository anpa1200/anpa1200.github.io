(function () {
  function loadSiteSearch() {
    if (document.querySelector('script[data-site-search-loader], script[src*="/assets/site-search.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://1200km.com/assets/site-search.js?v=20260721-5';
    script.defer = true;
    script.dataset.siteSearchLoader = 'true';
    document.head.appendChild(script);
  }

  loadSiteSearch();

  function addGateway() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    let gateway = document.querySelector('.ecosystem-project-bar');
    if (!gateway) {
      gateway = document.createElement('section');
      gateway.className = 'ecosystem-project-bar';
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

    // Docusaurus/React may reorder injected root siblings during client-side
    // navigation. Keep the gateway anchored directly before the current footer.
    if (gateway.parentNode !== footer.parentNode || gateway.nextElementSibling !== footer) {
      footer.parentNode.insertBefore(gateway, footer);
    }
  }

  function integrate() {
    addGateway();
  }

  integrate();
  new MutationObserver(integrate).observe(document.documentElement, { childList: true, subtree: true });
})();
