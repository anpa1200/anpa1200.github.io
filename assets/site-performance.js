(function () {
  'use strict';
  // Google Analytics 4 runs on every page except search, whose URLs carry
  // visitor-typed queries. Disclosed on /privacy.html#analytics-and-browser-storage.
  const script = document.currentScript;
  const analyticsId = script?.dataset.googleAnalyticsId || '';
  const enabled = Boolean(analyticsId) && window.location.pathname !== '/search.html';
  const affiliateLinks = new Map([
    ['https://training.trainsec.net/malware-analyst-professional-level-1/v6dfz', 'trainsec-malware-analyst-professional-level-1'],
  ]);

  // Docusaurus companions call window.gtag on every client-side route change,
  // so it must always be a function; on search it discards the calls.
  if (enabled) {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') window.gtag = function () { window.dataLayer.push(arguments); };
  } else if (typeof window.gtag !== 'function') {
    window.gtag = function () {};
  }

  if (enabled && !window.__1200kmAnalyticsLoaded) {
    window.__1200kmAnalyticsLoaded = true;
    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.appendChild(tag);
  }

  document.addEventListener('click', function (event) {
    if (!window.__1200kmAnalyticsLoaded) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    let destination;
    try { destination = new URL(anchor.href, window.location.href); } catch { return; }
    const affiliateId = affiliateLinks.get(destination.href);
    if (!affiliateId) return;
    window.gtag('event', 'affiliate_click', {
      affiliate_id: affiliateId,
      link_domain: destination.hostname,
      link_url: destination.href,
    });
  }, { capture: true });
})();
