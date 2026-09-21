(() => {
  'use strict';
  if (window.__1200kmAnomalyTags) return;
  window.__1200kmAnomalyTags = true;
  let registry;
  let timer;
  const key = path => path.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  function render() {
    if (!registry) return;
    const path = key(location.pathname);
    const ids = registry.pages[path] || [];
    document.querySelectorAll('[data-anomaly-topics]').forEach(node => {
      if (node.dataset.anomalyTopics !== path || !ids.length) node.remove();
    });
    if (!ids.length || document.querySelector('[data-anomaly-topics]')) return;
    // Mount only after a page's article has hydrated. The mutation observer also
    // remounts when Docusaurus replaces the content during client navigation.
    // A comma-separated selector returns document order, not preference order:
    // it would select <main> before its article and break Docusaurus's flex row.
    const article = document.querySelector('main article .theme-doc-markdown')
      || document.querySelector('main article')
      || document.querySelector('main #article-body')
      || document.querySelector('main');
    if (!article || !document.querySelector('h1')) return;
    const section = document.createElement('section');
    section.dataset.anomalyTopics = path;
    section.className = 'anomaly-topics';
    section.setAttribute('aria-label', 'Related anomaly topics');
    section.setAttribute('data-pagefind-ignore', 'all');
    const heading = document.createElement('h2');
    heading.textContent = 'Explore related anomaly topics';
    section.append(heading);
    const note = document.createElement('p');
    note.textContent = 'Topic links describe relevance, not validated detection coverage. Open a definition or browse related articles and guides.';
    section.append(note);
    const list = document.createElement('ul');
    for (const id of ids) {
      const tag = registry.tags.find(item => item.id === id);
      if (!tag) continue;
      const item = document.createElement('li');
      const browse = document.createElement('a');
      browse.href = '/search.html?f.anomaly=' + encodeURIComponent(id);
      browse.textContent = tag.label;
      browse.title = tag.definition;
      const definition = document.createElement('a');
      definition.href = registry.article_url + '#' + id;
      definition.textContent = 'Definition';
      definition.setAttribute('aria-label', tag.label + ' definition');
      item.append(browse, document.createTextNode(' · '), definition);
      list.append(item);
    }
    section.append(list);
    article.append(section);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 120); }
  async function start() {
    try {
      const response = await fetch('/data/anomaly-tags.json?v=20260921-1', {credentials: 'same-origin'});
      if (!response.ok) throw Error('HTTP ' + response.status);
      registry = await response.json();
      if (registry.schema_version !== 1) throw Error('Unknown schema');
      const sheet = document.createElement('link');
      sheet.rel = 'stylesheet';
      sheet.href = '/assets/anomaly-tags.css?v=20260921-1';
      document.head.append(sheet);
      new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true});
      window.addEventListener('popstate', schedule);
      schedule();
    } catch (error) {
      console.warn('Anomaly navigation unavailable; page content is unaffected.', error.message);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})();
