(function () {
  'use strict';

  // Populates any [data-click-count-slug] element from the edge-worker
  // click counter at /api/click-count/<slug> (see cloudflare/agent-readiness-worker.js).
  // Stays hidden on a zero count or a failed/blocked fetch — never shows a
  // broken or embarrassing "0" badge.
  document.querySelectorAll('[data-click-count-slug]').forEach(function (el) {
    const slug = el.getAttribute('data-click-count-slug');
    const value = el.querySelector('[data-click-count-value]');
    if (!slug || !value) return;

    fetch('/api/click-count/' + encodeURIComponent(slug), { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data || !data.count) return;
        value.textContent = Number(data.count).toLocaleString('en-US');
        el.hidden = false;
      })
      .catch(function () { /* stay hidden on any failure */ });
  });
})();
