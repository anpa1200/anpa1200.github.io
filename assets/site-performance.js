(function () {
  'use strict';

  const script = document.currentScript;
  const analyticsId = script?.dataset.googleAnalyticsId || '';

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
  window.setTimeout(loadAnalytics, 30_000);
})();
