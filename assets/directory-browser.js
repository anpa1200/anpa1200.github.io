/* Progressive enhancement: complete static pages remain usable without this script. */
(() => {
  'use strict';

  const kind = document.querySelector('script[data-directory]')?.dataset.directory;
  if (!kind) return;
  const knowledge = kind === 'knowledge';
  const base = knowledge ? '/cyber-knowledge/knowledge-sources/' : '/references/';
  const selector = knowledge ? '[data-ks-source-card]' : '[data-reference-card]';
  const host = knowledge ? document.querySelector('#source-results') : document.querySelector('[data-reference-grid]');
  const controls = knowledge ? document.querySelector('[data-ks-filters]') : document.querySelector('[data-reference-controls]');
  const status = knowledge ? document.querySelector('#knowledge-source-status') : document.querySelector('.reference-status');
  const fields = knowledge ? Object.fromEntries(['q', 'category', 'tag', 'access', 'level', 'tier', 'evidence', 'maintenance', 'kind'].map(k => [k, document.getElementById('knowledge-source-' + (k === 'q' ? 'query' : k))])) : Object.fromEntries(['q', 'facet', 'tag', 'publisher', 'year', 'sort'].map(k => [k, document.querySelector('[data-reference-' + ({
    q: 'search',
    tag: 'tag-value'
  }[k] || k) + ']')]));
  const results = document.createElement('div');
  results.className = knowledge ? 'ks-source-grid' : 'reference-grid';
  const pager = document.createElement('nav');
  pager.setAttribute('aria-label', 'Filtered result pages');
  pager.className = 'directory-pagination';
  let indexPromise,
    index,
    generation = 0,
    pageNumber = 1;
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const loadIndex = () => indexPromise ||= fetch('/data/' + (knowledge ? 'knowledge' : 'reference') + '-browser-index.json').then(r => {
    if (!r.ok) throw Error('Index unavailable');
    return r.json();
  }).then(d => Array.isArray(d) ? d : d.records.map(r => ({
    ...r,
    tags: r.tags.map(i => d.tags[i]),
    search: [r.name, r.description, r.publisher].join(' ') + ' ' + r.tags.map(i => [d.tags[i].facet, d.tags[i].value, d.tags[i].key].join(' ')).join(' ')
  }))).catch(error => {
    indexPromise = null;
    throw error;
  });
  function element(tag, text, className = '') {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function link(text, href) {
    const a = element('a', text);
    a.href = /^(?:https?:\/\/|\/)/.test(href) ? href : '#';
    return a;
  }
  async function card(record) {
    const node = element('article', '', knowledge ? 'ks-source-card' : 'reference-card');
    node.id = record.id;
    node.setAttribute(knowledge ? 'data-ks-source-card' : 'data-reference-card', '');
    const heading = element('h3');
    const inert = ['indicator', 'example', 'address-review'].includes(record.kind);
    if (inert) heading.textContent = record.name;
    else heading.append(link(record.name, knowledge ? record.page + '#' + record.id : record.url));
    node.append(heading, element('p', knowledge ? record.summary : record.description));
    if (knowledge) {
      node.append(element('p', `Assessment tier ${record.tier} · ${record.access} · ${record.level.join(', ')}`), link('Read full assessment, limitations, and related sources', record.page + '#' + record.id));
      return node;
    }
    node.append(element('p', `${record.kind || 'bibliographic'} · ${record.metadata_status || 'authored-metadata'}`));
    if (inert) node.append(element('code', record.url.replace(/^https/, 'hxxps').replaceAll('.', '[.]')));
    const related = element('button', 'Find related', 'reference-related');
    related.type = 'button';
    related.setAttribute('data-find-related', '');
    node.append(related);
    const tags = element('div', '', 'reference-tags');
    for (const t of record.tags.slice(0, 12)) {
      const b = element('button', t.facet + ': ' + t.value, 'reference-tag');
      b.type = 'button';
      b.setAttribute('data-reference-tag', '');
      b.dataset.tagKey = t.key;
      b.dataset.tagFacet = t.facet;
      tags.append(b);
    }
    node.append(tags);
    if (record.tags.length > 12) {
      const details = element('details'),
        summary = element('summary', `Show all ${record.tags.length} tags`),
        body = element('div', '', 'reference-tags'),
        button = element('button', 'Show all tags here', 'button');
      button.type = 'button';
      button.setAttribute('data-load-reference-tags', '');
      body.append(button);
      details.append(summary, body);
      node.append(details);
    }
    if (record.assessed_source_id) node.append(link('Read assessed source profile', '/cyber-knowledge/knowledge-sources/#source-' + record.assessed_source_id));
    if (record.used_in?.length) {
      const details = element('details'),
        summary = element('summary', 'Pages using this source'),
        list = element('ul');
      for (const page of record.used_in) {
        const li = element('li');
        li.append(link(page.title, page.url));
        list.append(li);
      }
      details.append(summary, list);
      node.append(details);
    }
    node.append(link('Open static reference and export context', record.page + '#' + record.id));
    return node;
  }
  function readState() {
    return Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f?.value || '']));
  }
  function fromUrl() {
    const p = new URLSearchParams(location.search);
    for (const [k, f] of Object.entries(fields)) if (f) f.value = p.get(k) || (k === 'sort' ? 'title' : '');
  }
  function matches(row, state) {
    if (!normalize(state.q).split(/\s+/).filter(Boolean).every(t => normalize(row.search).includes(t))) return false;
    if (knowledge) return Object.entries(state).every(([k, v]) => !v || k === 'q' || (Array.isArray(row[k]) ? row[k].includes(v) : row[k] === v));
    return (!state.tag || row.tags.some(t => t.key === state.tag)) && (!state.publisher || row.publisher === state.publisher) && (!state.year || row.year === state.year);
  }
  async function apply(sync = true) {
    const run = ++generation;
    status.textContent = 'Loading matching records…';
    try {
      index = await loadIndex();
      if (run !== generation) return;
      const state = readState();
      let rows = index.filter(r => matches(r, state));
      rows.sort((a, b) => state.sort === 'date-desc' ? b.year.localeCompare(a.year) : state.sort === 'date-asc' ? a.year.localeCompare(b.year) : state.sort === 'publisher' ? a.publisher.localeCompare(b.publisher) : state.sort === 'tags' ? b.tags.length - a.tags.length : a.name.localeCompare(b.name));
      const size = knowledge ? 8 : 24,
        total = Math.max(1, Math.ceil(rows.length / size));
      pageNumber = Math.max(1, Math.min(Math.floor(pageNumber) || 1, total));
      const shown = rows.slice((pageNumber - 1) * size, pageNumber * size);
      const nodes = await Promise.all(shown.map(card));
      if (run !== generation) return;
      host.querySelectorAll(selector + ', [data-ks-category-section]').forEach(n => n.remove());
      results.replaceChildren(...nodes);
      if (!results.isConnected) host.append(results, pager);
      if (!nodes.length) {
        const p = document.createElement('p');
        p.textContent = 'No results. Try fewer words or clear filters.';
        results.append(p);
      }
      pager.replaceChildren();
      for (const [label, n] of [['Previous', pageNumber - 1], ['Next', pageNumber + 1]]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'button';
        b.textContent = label;
        b.disabled = n < 1 || n > total;
        b.onclick = () => {
          pageNumber = n;
          apply();
        };
        pager.append(b);
      }
      status.textContent = `${rows.length} matching records · page ${pageNumber} of ${total}`;
      const schema = document.getElementById(knowledge ? 'knowledge-sources-structured-data' : 'reference-library-structured-data') || document.querySelector('script[data-site-graph]');
      if (schema) {
        try {
          const data = JSON.parse(schema.textContent),
            list = data['@graph']?.find(v => v['@type'] === 'ItemList');
          if (list) {
            const semanticRows = knowledge ? shown : shown.filter(r => ['bibliographic', 'tool', 'dataset'].includes(r.kind));
            list.numberOfItems = semanticRows.length;
            list.itemListElement = semanticRows.map((r, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'CreativeWork',
                name: r.name,
                url: knowledge ? location.origin + r.page + '#' + r.id : r.url
              }
            }));
            schema.textContent = JSON.stringify(data);
          }
        } catch {}
      }
      if (sync) {
        const u = new URL(location.href);
        for (const [k, v] of Object.entries(state)) {
          if (v) u.searchParams.set(k, v);else u.searchParams.delete(k);
        }
        u.searchParams.set('resultPage', String(pageNumber));
        history.replaceState(null, '', u);
      }
      if (!knowledge) correlations(rows);
      document.documentElement.dataset.directoryReady = 'true';
    } catch {
      if (run === generation) status.textContent = 'Could not load directory results. Retry a filter or use the static page links and complete export.';
    }
  }
  function correlations(rows) {
    const host = document.querySelector('[data-reference-correlations]');
    if (!host) return;
    const counts = new Map();
    for (const row of rows) for (const tag of row.tags) {
      const item = counts.get(tag.key) || {
        ...tag,
        count: 0
      };
      item.count++;
      counts.set(tag.key, item);
    }
    host.replaceChildren(...[...counts.values()].sort((a, b) => b.count - a.count).slice(0, 12).map(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${t.value} (${t.count})`;
      b.onclick = () => selectTag(t.key, t.facet);
      return b;
    }));
  }
  async function tagOptions(selected = '') {
    if (knowledge) return;
    index = await loadIndex();
    const tags = new Map(index.flatMap(r => r.tags).map(t => [t.key, t]));
    fields.tag.replaceChildren(new Option('All tag values', ''), ...[...tags.values()].filter(t => !fields.facet.value || t.facet === fields.facet.value).sort((a, b) => a.value.localeCompare(b.value)).map(t => new Option(t.value, t.key)));
    fields.tag.disabled = !fields.facet.value;
    fields.tag.value = selected;
  }
  async function selectTag(key, facet) {
    if (knowledge) fields.tag.value = key;else {
      fields.facet.value = facet;
      await tagOptions(key);
    }
    pageNumber = 1;
    apply();
  }
  let timer;
  controls.addEventListener('input', e => {
    if (e.target !== fields.q) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      pageNumber = 1;
      apply();
    }, 200);
  });
  controls.addEventListener('change', async e => {
    if (e.target === fields.q) return;
    if (e.target === fields.facet) await tagOptions();
    pageNumber = 1;
    apply();
  });
  function reset() {
    for (const [k, f] of Object.entries(fields)) if (f) f.value = k === 'sort' ? 'title' : '';
    pageNumber = 1;
    apply();
    fields.q.focus();
  }
  controls.addEventListener('reset', () => setTimeout(reset, 0));
  document.querySelector('[data-reference-reset]')?.addEventListener('click', reset);
  document.addEventListener('click', async e => {
    const tag = e.target.closest('[data-reference-tag], [data-ks-tag-link]');
    if (tag) {
      e.preventDefault();
      await selectTag(tag.dataset.tagKey || tag.dataset.ksTagLink, tag.dataset.tagFacet);
      return;
    }
    const loadTags = e.target.closest('[data-load-reference-tags]');
    if (loadTags) {
      index = await loadIndex();
      const row = index.find(r => r.id === loadTags.closest(selector).id);
      if (row) {
        loadTags.parentElement.replaceChildren(...row.tags.map(t => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'reference-tag';
          b.textContent = t.facet + ': ' + t.value;
          b.onclick = () => selectTag(t.key, t.facet);
          return b;
        }));
      }
      return;
    }
    const related = e.target.closest('[data-find-related]');
    if (related) {
      index = await loadIndex();
      const source = index.find(r => r.id === related.closest(selector).id);
      if (!source) return;
      const keys = new Set(source.tags.filter(t => !['publisher', 'year', 'inclusion', 'publisher_domain'].includes(t.type)).map(t => t.key));
      const ranked = index.filter(r => r !== source).map(r => ({
        r,
        n: r.tags.filter(t => keys.has(t.key)).length
      })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 8);
      document.querySelector('[data-reference-related-list]').replaceChildren(...ranked.map(({
        r,
        n
      }) => {
        const li = document.createElement('li'),
          a = document.createElement('a');
        a.href = r.page + '#' + r.id;
        a.textContent = `${r.name} (${n} shared tags)`;
        li.append(a);
        return li;
      }));
    }
    const anchor = e.target.closest('a[href^="#source-"]');
    if (anchor) {
      index = await loadIndex();
      const row = index.find(r => '#' + r.id === anchor.hash);
      if (row && row.page !== location.pathname) {
        e.preventDefault();
        location.assign(row.page + anchor.hash);
      }
    }
  });
  async function reveal() {
    if (!/^#(?:source-|reference-|site-reference:|ai-attack-reference:)/.test(location.hash)) return;
    index = await loadIndex();
    const row = index.find(r => '#' + r.id === location.hash || (!knowledge && '#reference-' + location.hash.slice(1) === '#' + r.id));
    if (!row) return;
    if (row.page !== location.pathname) {
      location.replace(row.page + location.search + '#' + row.id);
      return;
    }
    const node = document.getElementById(row.id);
    const details = node?.querySelector('details');
    if (details) details.open = true;
    node?.scrollIntoView();
  }
  addEventListener('hashchange', reveal);
  addEventListener('popstate', async () => {
    fromUrl();
    pageNumber = Number(new URLSearchParams(location.search).get('resultPage')) || 1;
    await tagOptions(new URLSearchParams(location.search).get('tag') || '');
    apply(false);
  });
  fromUrl();
  if (location.search) {
    pageNumber = Number(new URLSearchParams(location.search).get('resultPage')) || 1;
    tagOptions(new URLSearchParams(location.search).get('tag') || '').then(() => apply(false));
  }
  reveal();
})();
