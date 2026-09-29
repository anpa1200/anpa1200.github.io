// Restore lifecycle notices only after Docusaurus has hydrated its React root.
// The build emits a crawlable fallback outside that root for no-JavaScript users.
(() => {
  if (window.__articleLifecycleReady) return;
  window.__articleLifecycleReady = true;
  const root = document.querySelector('#__docusaurus');
  if (!root) return;
  let routes, loading = false, ready = false, timer;
  const route = () => location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const initialRoute = route();
  function loadRoutes() {
    if (routes || loading) return;
    loading = true;
    fetch('/data/article-lifecycle.json').then(response => {
      if (!response.ok) throw Error('Article lifecycle manifest unavailable');
      return response.json();
    }).then(data => { routes = data.routes; schedule(); }).catch(() => { loading = false; });
  }
  function update() {
    if (!ready) return;
    const pathname = route();
    const article = root.querySelector('main .theme-doc-markdown.markdown');
    if (!article) return;
    const existing = root.querySelector('[data-governance-runtime]');
    if (existing?.dataset.articleRoute === pathname) return;
    existing?.remove();
    const fallback = document.querySelector('body > [data-governance-fallback]');
    if (fallback && pathname === initialRoute) {
      fallback.removeAttribute('data-governance-fallback');
      fallback.dataset.articleRoute = pathname;
      fallback.dataset.governanceRuntime = '';
      article.append(fallback);
      return;
    }
    fallback?.remove();
    if (!routes) { loadRoutes(); return; }
    const record = routes[pathname];
    if (!record) return;
    const aside = document.createElement('aside');
    aside.className = 'content-lifecycle-banner';
    aside.dataset.contentLifecycle = record.lifecycle;
    aside.dataset.articleRoute = pathname;
    aside.dataset.governanceRuntime = '';
    aside.setAttribute('aria-label', 'Content lifecycle');
    const strong = document.createElement('strong');
    strong.textContent = record.label;
    const paragraph = document.createElement('p');
    paragraph.textContent = record.text;
    if (record.docsLink) {
      paragraph.append(' ');
      const link = document.createElement('a');
      link.href = '/adversarygraph-docs/';
      link.textContent = 'Open current AdversaryGraph documentation';
      paragraph.append(link, '.');
    }
    aside.append(strong, paragraph);
    article.append(aside);
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 120); };
  const begin = () => {
    const run = () => { ready = true; schedule(); };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 0);
  };
  if (document.readyState === 'complete') begin();
  else addEventListener('load', begin, { once: true });
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  addEventListener('popstate', schedule);
})();
