(() => {
  'use strict';

  const STORAGE_KEY = '1200km:cyber-knowledge-progress:v1';

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function writeProgress(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Progress is optional; the guides remain usable without storage.
    }
  }

  function moduleSections() {
    const seen = new Set();
    return [...document.querySelectorAll('main [id]')].filter((section) => {
      if (!/^(?:m|module-)\d+$/i.test(section.id) || seen.has(section.id)) return false;
      seen.add(section.id);
      return true;
    });
  }

  function enhanceGuide() {
    const sections = moduleSections();
    if (!sections.length) return;
    const path = location.pathname;
    const state = readProgress();
    const complete = new Set(Array.isArray(state[path]) ? state[path] : []);
    const heading = document.querySelector('h1');
    if (!heading) return;

    const summary = document.createElement('div');
    summary.className = 'knowledge-progress';
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-live', 'polite');
    heading.insertAdjacentElement('afterend', summary);

    function update() {
      state[path] = [...complete];
      writeProgress(state);
      const percent = Math.round((complete.size / sections.length) * 100);
      summary.innerHTML = `<strong>${complete.size} of ${sections.length} modules complete</strong><progress max="${sections.length}" value="${complete.size}">${percent}%</progress><span>${percent}% saved in this browser</span>`;
    }

    for (const section of sections) {
      const sectionHeading = section.querySelector('h2');
      if (!sectionHeading) continue;
      const control = document.createElement('label');
      control.className = 'knowledge-module-check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = complete.has(section.id);
      checkbox.setAttribute('aria-label', `Mark ${sectionHeading.textContent.trim()} complete`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) complete.add(section.id);
        else complete.delete(section.id);
        update();
      });
      control.append(checkbox, document.createTextNode(' Complete'));
      sectionHeading.insertAdjacentElement('afterend', control);
    }

    const navLinks = [...document.querySelectorAll('a[href^="#"]')]
      .filter((link) => sections.some((section) => link.hash === `#${section.id}`));
    if ('IntersectionObserver' in window && navLinks.length) {
      const byId = new Map(navLinks.map((link) => [link.hash.slice(1), link]));
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        for (const link of navLinks) link.removeAttribute('aria-current');
        byId.get(visible.target.id)?.setAttribute('aria-current', 'location');
      }, { rootMargin: '-20% 0px -65%', threshold: [0.05, 0.5] });
      sections.forEach((section) => observer.observe(section));
    }
    update();
  }

  function enhanceHub() {
    const state = readProgress();
    for (const card of document.querySelectorAll('.domain-card[data-domain-id]')) {
      const link = card.querySelector('.domain-link');
      const moduleFact = card.querySelector('.domain-facts span');
      const total = Number(moduleFact?.textContent.match(/\d+/)?.[0] || 0);
      if (!link || !total) continue;
      const path = new URL(link.href, location.href).pathname;
      const done = new Set(Array.isArray(state[path]) ? state[path] : []).size;
      const progress = document.createElement('div');
      progress.className = 'knowledge-card-progress';
      progress.innerHTML = `<progress max="${total}" value="${Math.min(done, total)}">${done} of ${total}</progress><span>${done} of ${total} complete</span>`;
      link.insertAdjacentElement('beforebegin', progress);
    }
  }

  enhanceGuide();
  enhanceHub();
})();
