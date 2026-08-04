(function () {
  'use strict';

  var MAX_PAGE_LINKS = 7;
  var sections = [
    { label: 'Explore', links: [
      ['Threat intelligence', '/cti.html', ['/cti.html', '/cti-analyst-field-manual/', '/israel-government-threat-actors-cti/', '/CTI_as_a_Code/', '/operation-desert-hydra/', '/customer-driven-ai-cti-project/']],
      ['AdversaryGraph', '/adversarygraph/', ['/adversarygraph/', '/adversarygraph-docs/', '/threat-matrix/']],
      ['Security labs', '/labs.html', ['/labs.html']],
      ['Guides', '/guides.html', ['/guides.html', '/anomaly-detection-atlas/', '/insider-threat-detection/', '/opencti-intelligent-shield/', '/ITDR/']],
      ['Cyber Knowledge', '/cyber-knowledge/', ['/cyber-knowledge/']],
      ['Articles', '/articles/', ['/articles/']],
      ['Projects', '/projects.html', ['/projects.html']]
    ] },
    { label: 'Tools & proof', links: [
      ['HexStrike', '/hexstrike.html', ['/hexstrike.html']],
      ['Offensive research', '/ai-offensive.html', ['/ai-offensive.html']],
      ['PT tools', '/pt-tools.html', ['/pt-tools.html']],
      ['External validation', '/external-validation.html', ['/external-validation.html']]
    ] },
    { label: 'Profile', links: [
      ['About me', '/about.html', ['/about.html']],
      ['CV', '/cv.html', ['/cv.html']],
      ['GitHub', 'https://github.com/anpa1200', [], true],
      ['Medium', 'https://medium.com/@1200km', [], true]
    ] }
  ];

  var observer = null;
  var mutationTimer = null;
  var lastSignature = '';

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizePath(value) {
    try {
      var path = new URL(value, location.origin).pathname.replace(/\/{2,}/g, '/');
      return path.endsWith('/index.html') ? path.slice(0, -10) : path;
    } catch (_) {
      return '/';
    }
  }

  function currentAttribute(href, matches) {
    var pathname = normalizePath(location.pathname);
    var active = (matches || [href]).some(function (candidate) {
      var prefix = normalizePath(candidate);
      return prefix.endsWith('/') ? pathname.indexOf(prefix) === 0 : pathname === prefix;
    });
    if (!active) return '';
    return pathname === normalizePath(href) ? ' aria-current="page"' : ' aria-current="location"';
  }

  function pageLinks() {
    return Array.from(document.querySelectorAll('main h2[id]')).filter(function (heading) {
      return !heading.closest('#platform-sidenav') && heading.id && !heading.id.startsWith('sidenav-');
    }).filter(function (heading) {
      return !/^(?:table of contents|contents)$/i.test(heading.textContent.trim());
    }).slice(0, MAX_PAGE_LINKS).map(function (heading) {
      var label = heading.textContent.replace(/\s+/g, ' ').trim();
      return { id: heading.id, label: label.length > 56 ? label.slice(0, 55).trimEnd() + '…' : label };
    });
  }

  function pageSection(links) {
    if (!links.length) return '';
    return '<section class="sidenav-section" aria-labelledby="sidenav-page-label">' +
      '<div class="sidenav-group" id="sidenav-page-label">On this page</div>' +
      '<ul class="sidenav-list">' + links.map(function (item, index) {
        return '<li><a' + (index === 0 ? ' class="active" aria-current="location"' : '') +
          ' href="#' + escapeHtml(item.id) + '" data-section="' + escapeHtml(item.id) + '">' +
          escapeHtml(item.label) + '</a></li>';
      }).join('') + '</ul></section>';
  }

  function globalSections() {
    return sections.map(function (section, sectionIndex) {
      return '<section class="sidenav-section" aria-labelledby="runtime-sidenav-' + sectionIndex + '">' +
        '<div class="sidenav-group" id="runtime-sidenav-' + sectionIndex + '">' + escapeHtml(section.label) + '</div>' +
        '<ul class="sidenav-list">' + section.links.map(function (item) {
          var external = item[3] ? ' target="_blank" rel="noopener noreferrer"' : '';
          var suffix = item[3] ? '<span class="sidenav-external" aria-hidden="true">↗</span>' : '';
          return '<li><a href="' + escapeHtml(item[1]) + '"' + currentAttribute(item[1], item[2]) + external + '>' +
            escapeHtml(item[0]) + suffix + '</a></li>';
        }).join('') + '</ul></section>';
    }).join('');
  }

  function ensureSidebar() {
    var sidebar = document.getElementById('platform-sidenav');
    if (!sidebar) {
      sidebar = document.createElement('aside');
      sidebar.id = 'platform-sidenav';
      sidebar.className = 'page-sidenav platform-sidenav';
      sidebar.setAttribute('aria-label', 'Platform navigation');
      sidebar.setAttribute('data-pagefind-ignore', '');
      sidebar.innerHTML = '<a class="sidenav-brand" href="/">' +
        '<img src="/assets/ap-logo.png" alt="" width="32" height="32" loading="lazy" decoding="async">' +
        '<span class="sidenav-brand-copy"><strong>Andrey Pautov</strong><small>Security research</small></span></a>' +
        '<nav class="sidenav-scroll" aria-label="Page contents and platform sections"></nav>' +
        '<div class="sidenav-footer"><span>1200km.com</span><a href="#top" title="Back to top">↑ top</a></div>';
      document.body.insertBefore(sidebar, document.body.firstChild);
    }
    document.body.classList.remove('has-page-sidenav');
    document.body.classList.add('has-platform-sidenav');
    if (!document.body.id) document.body.id = 'top';
    return sidebar;
  }

  function activateSectionNavigation(sidebar) {
    if (observer) observer.disconnect();
    var links = Array.from(sidebar.querySelectorAll('a[data-section]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var entries = links.map(function (link) {
      return { link: link, section: document.getElementById(link.dataset.section) };
    }).filter(function (entry) { return entry.section; });
    observer = new IntersectionObserver(function (changes) {
      changes.forEach(function (change) {
        if (!change.isIntersecting) return;
        entries.forEach(function (entry) {
          var active = entry.section === change.target;
          entry.link.classList.toggle('active', active);
          if (active) entry.link.setAttribute('aria-current', 'location');
          else entry.link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    entries.forEach(function (entry) { observer.observe(entry.section); });
  }

  function integrate() {
    if (!document.body) return;
    var links = pageLinks();
    var signature = location.pathname + '|' + links.map(function (item) { return item.id + ':' + item.label; }).join('|');
    var sidebar = ensureSidebar();
    if (signature === lastSignature && sidebar.querySelector('.sidenav-scroll')) return;
    lastSignature = signature;
    sidebar.querySelector('.sidenav-scroll').innerHTML = pageSection(links) + globalSections();
    activateSectionNavigation(sidebar);
  }

  function scheduleIntegration() {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(integrate, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', integrate, { once: true });
  else integrate();
  window.addEventListener('popstate', scheduleIntegration);
  new MutationObserver(scheduleIntegration).observe(document.documentElement, { childList: true, subtree: true });
})();
