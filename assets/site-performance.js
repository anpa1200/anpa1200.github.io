(function () {
  'use strict';
  // Google Analytics is opt-in. Nothing from Google loads, and no analytics
  // cookie is set, until the visitor accepts in the consent banner. The choice
  // is stored locally and can be changed from the privacy page at any time.
  const script = document.currentScript;
  const analyticsId = script?.dataset.googleAnalyticsId || '';
  const CONSENT_KEY = '1200km-analytics-consent';
  const affiliateLinks = new Map([
    ['https://training.trainsec.net/malware-analyst-professional-level-1/v6dfz', 'trainsec-malware-analyst-professional-level-1'],
  ]);

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* private mode: ask again next visit */ }
  }

  // Docusaurus companions call window.gtag on every client-side route change.
  // Until the visitor opts in, accept and discard those calls: nothing is
  // queued, so nothing collected before consent is sent after it.
  function discard() {}
  if (typeof window.gtag !== 'function') window.gtag = discard;

  function loadAnalytics() {
    // Search URLs contain visitor-authored queries; never send them to analytics.
    if (readConsent() !== 'granted' || window.location.pathname === '/search.html' || !analyticsId || window.__1200kmAnalyticsLoaded) return;
    window.__1200kmAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    if (window.gtag === discard) window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.appendChild(tag);
  }

  function removeBanner() {
    document.getElementById('analytics-consent')?.remove();
  }

  function choose(value) {
    writeConsent(value);
    removeBanner();
    if (value === 'granted') loadAnalytics();
    else if (window.__1200kmAnalyticsLoaded) {
      // Revoking consent: stop further collection now and on every later page.
      window[`ga-disable-${analyticsId}`] = true;
    }
    document.dispatchEvent(new CustomEvent('analytics-consent-change', { detail: value }));
  }

  // Self-contained styles: Docusaurus companion pages do not load site-theme.css.
  // Dark panel with high-contrast text in both themes; fixed, so it never
  // shifts page layout, and bounded to the viewport at 375 px.
  const STYLES = '.analytics-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:720px;margin:0 auto;'
    + 'padding:14px 16px;border:1px solid #4b5563;border-radius:10px;background:#1f2328;color:#f5f5f5;box-shadow:0 10px 30px rgba(0,0,0,.35);'
    + 'font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}'
    + '.analytics-consent p{margin:0;flex:1 1 280px;color:#f5f5f5}.analytics-consent a{color:#9ecbff;text-decoration:underline}'
    + '.analytics-consent-actions{display:flex;gap:8px;flex-wrap:wrap}.analytics-consent button{min-height:36px;padding:0 14px;border-radius:7px;'
    + 'font:inherit;font-weight:700;cursor:pointer;border:1px solid #f5f5f5}.analytics-consent button[data-analytics-choice="granted"]{background:#f5f5f5;color:#1f2328}'
    + '.analytics-consent button[data-analytics-choice="denied"]{background:transparent;color:#f5f5f5}'
    + '.analytics-consent button:focus-visible,.analytics-consent a:focus-visible{outline:3px solid #9ecbff;outline-offset:2px}'
    + '@media print{.analytics-consent{display:none}}';

  function showBanner() {
    if (!analyticsId || document.getElementById('analytics-consent') || window.location.pathname === '/search.html') return;
    if (!document.getElementById('analytics-consent-styles')) {
      const style = document.createElement('style');
      style.id = 'analytics-consent-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
    const banner = document.createElement('section');
    banner.id = 'analytics-consent';
    banner.className = 'analytics-consent';
    banner.setAttribute('aria-label', 'Analytics consent');
    banner.innerHTML = '<p>May 1200km.com use Google Analytics to count visits and see which pages help? '
      + 'It sets cookies and is off unless you accept. <a href="/privacy.html#analytics-and-browser-storage">Privacy details</a></p>'
      + '<div class="analytics-consent-actions">'
      + '<button type="button" data-analytics-choice="granted">Accept analytics</button>'
      + '<button type="button" data-analytics-choice="denied">Decline</button></div>';
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target : null;
    const choice = target?.closest('[data-analytics-choice]');
    if (choice) { choose(choice.getAttribute('data-analytics-choice')); return; }
    // Privacy page control: forget the stored choice and ask again.
    if (target?.closest('[data-analytics-consent-reset]')) {
      try { localStorage.removeItem(CONSENT_KEY); } catch { /* ignore */ }
      showBanner();
      document.getElementById('analytics-consent')?.querySelector('button')?.focus();
      return;
    }
    const anchor = target?.closest('a[href]');
    if (!anchor) return;
    let destination;
    try { destination = new URL(anchor.href, window.location.href); } catch { return; }
    const affiliateId = affiliateLinks.get(destination.href);
    if (!affiliateId || !window.__1200kmAnalyticsLoaded) return;
    window.gtag?.('event', 'affiliate_click', {
      affiliate_id: affiliateId,
      link_domain: destination.hostname,
      link_url: destination.href,
    });
  }, { capture: true });

  window.__1200kmAnalyticsConsent = { get: readConsent, choose };

  function start() {
    const consent = readConsent();
    if (consent === 'granted') loadAnalytics();
    else if (consent !== 'denied') showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
