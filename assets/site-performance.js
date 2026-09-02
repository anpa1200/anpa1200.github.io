(function () {
  'use strict';

  const script = document.currentScript;
  const analyticsId = script?.dataset.googleAnalyticsId || '';
  const affiliateLinks = new Map([
    ['https://training.trainsec.net/malware-analyst-professional-level-1/v6dfz', 'trainsec-malware-analyst-professional-level-1'],
  ]);

  function loadAnalytics() {
    if (!analyticsId || window.__1200kmAnalyticsLoaded) return;
    window.__1200kmAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.appendChild(tag);
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (eventName) {
    window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
  });

  document.addEventListener('click', function (event) {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;

    let destination;
    try {
      destination = new URL(anchor.href, window.location.href);
    } catch {
      return;
    }

    const affiliateId = affiliateLinks.get(destination.href);
    if (!affiliateId) return;

    loadAnalytics();
    window.gtag?.('event', 'affiliate_click', {
      affiliate_id: affiliateId,
      link_domain: destination.hostname,
      link_url: destination.href,
    });
  }, { capture: true });

  window.setTimeout(loadAnalytics, 30_000);
})();
