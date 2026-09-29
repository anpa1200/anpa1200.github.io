// Restore reviewed static backlinks after Docusaurus hydration and client routing.
// Text/URLs come from the versioned exact-match manifest, never arbitrary HTML.
(() => {
  if (window.__ttpGuideLinks) return;
  window.__ttpGuideLinks = true;
  let routes;
  const cache = new Map();
  let timer, running = false, ready = false;
  const base = '/ttp-simulation/';
  const path = () => location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const allowed = (target) => /^(?:tools\/[^/]+\/|techniques\/(?:enterprise|mobile|ics)\/T\d{4}(?:\.\d{3})?\/|detections\/(?:enterprise|mobile|ics)\/T\d{4}(?:\.\d{3})?\/)$/.test(target);
  function link(target, text) { const a = document.createElement('a'); a.href = base + target; a.textContent = text; return a; }
  async function update() {
    if (!ready || running || !routes) return;
    const current = path(), key = routes[current];
    const main = document.querySelector('main');
    if (!main) return;
    const previous = main.querySelector('#ttp-ecosystem[data-ttp-guide-key]');
    if (previous && previous.dataset.ttpGuideKey !== key) previous.remove();
    if (!key) return;
    running = true;
    try {
      if (!cache.has(key)) {
        const response = await fetch(`${base}data/guide-backlinks/${key}.json`);
        if (!response.ok) return;
        cache.set(key, await response.json());
      }
      if (path() !== current) return;
      const records = cache.get(key).links.filter(r => allowed(r.target));
      if (!main.querySelector('#ttp-ecosystem')) {
        const section = document.createElement('section'); section.id = 'ttp-ecosystem'; section.className = 'ttp-ecosystem-links'; section.dataset.ttpGuideKey = key;
        const heading = document.createElement('h2'); heading.textContent = 'Attack tools, simulations and detection rules'; section.append(heading);
        const note = document.createElement('p'); note.textContent = 'Explicit source relationships; documented procedures and detectors are not live-validation or attribution claims.'; section.append(note);
        const ul = document.createElement('ul');
        for (const row of records) { const li = document.createElement('li'); li.append(link(row.target, row.title), document.createTextNode(' — ' + row.basis)); ul.append(li); }
        // Docusaurus main is a flex layout; insert within the article column.
        section.append(ul); (main.querySelector('article') || main).append(section);
      }
      main.querySelector('#ttp-ecosystem').dataset.ttpGuideKey = key;
      const names = new Map(records.filter(r => r.title.endsWith(' tool reference')).map(r => [r.title.replace(/ tool reference$/, ''), r.target]));
      if (names.size) {
        const pattern = new RegExp(`\\b(${[...names.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\b`, 'g');
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {acceptNode(node) { return node.parentElement?.closest('a,pre,code,script,style,nav,header,footer,#ttp-ecosystem') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }});
        const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        for(const node of nodes){const text=node.textContent;pattern.lastIndex=0;const matches=[...text.matchAll(pattern)];if(!matches.length)continue;const fragment=document.createDocumentFragment();let end=0;for(const m of matches){fragment.append(document.createTextNode(text.slice(end,m.index)),link(names.get(m[0]),m[0]));end=m.index+m[0].length;}fragment.append(document.createTextNode(text.slice(end)));node.replaceWith(fragment);}
      }
    } catch { /* Original article and statically generated links remain usable. */ }
    finally { running = false; }
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 120); };
  fetch(`${base}data/guide-backlinks.json`).then(r => { if (!r.ok) throw Error('No guide manifest'); return r.json(); }).then(data => { routes=data.routes; schedule(); }).catch(()=>{});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('popstate',schedule);
  // Never rewrite React-owned article text while Docusaurus is hydrating.
  const begin = () => {
    const run = () => { ready = true; schedule(); };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1500 });
    else setTimeout(run, 0);
  };
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, { once: true });
})();
