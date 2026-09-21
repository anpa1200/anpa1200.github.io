#!/usr/bin/env node
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {localFileForUrl, stripHtml} from './search-index-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
const archive = resolve(option('--archive', '../anomaly-research-update'));
const cache = resolve(option('--cache', '/tmp/1200km-anomaly-corpus-20260921'));
const report = join(root, 'reports/anomaly-review-20260921');
await mkdir(cache, {recursive: true});
await mkdir(report, {recursive: true});
const catalog = JSON.parse(await readFile(join(root, 'data/content-catalog.json')));
const archiveCatalog = JSON.parse(await readFile(join(archive, 'src/data/article-catalog.json')));
const config = JSON.parse(await readFile(join(root, 'data/content-catalog.config.json')));
const pages = new Map();
const discoveries = [];
const normalized = value => { const u = new URL(value, 'https://1200km.com/'); u.hash = ''; u.search = ''; return u.href.replace(/\/index\.html$/, '/').replace(/\/$/, ''); };
function add(url, details) {
  const key = normalized(url);
  if (!key.startsWith('https://1200km.com/')) return;
  if (/\/(?:tags|page)\/|\/404(?:\.html)?$|\/reports\/|\/assets\/|\/data\//.test(new URL(key).pathname)) return;
  if (!pages.has(key)) pages.set(key, {url: key, ...details});
}
for (const row of archiveCatalog) add(`https://1200km.com/articles/read/${row.local_path}/`, {title: row.title, kind: 'article', source: join(archive, 'docs/articles', row.local_path + '.md'), archive_id: row.id});
for (const row of catalog.items) {
  if (!['article', 'mirror', 'guide', 'documentation', 'research', 'case-study', 'lab'].includes(row.primary_type)) continue;
  const url = row.canonical_url.startsWith('https://1200km.com/') ? row.canonical_url : (row.alternate_urls || []).find(value => value.startsWith('https://1200km.com/'));
  if (url) add(url, {title: row.title, kind: row.primary_type, canonical: row.canonical_url});
}
const guides = await readFile(join(root, 'guides.html'), 'utf8');
for (const match of guides.matchAll(/<a\b[^>]*class="guide-title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
  const href = new URL(match[1], 'https://1200km.com/guides.html').href;
  if (href.startsWith('https://1200km.com/')) add(href, {title: stripHtml(match[2]), kind: 'guide-index-target'});
  else discoveries.push({url: href, status: 'external-guide-link-not-hosted-here'});
}
const prefixes = new Set(config.declared_collections.filter(row => row.id !== 'collection:trainsec-library').map(row => row.canonical_prefix));
for (const prefix of ['ai-security-course', 'Hexstrike-AI-guide']) prefixes.add(`https://1200km.com/${prefix}/`);
async function fetchText(url) {
  const r = await fetch(url, {signal: AbortSignal.timeout(25000), headers: {'User-Agent': '1200km-anomaly-research-review/1.0'}});
  const body = await r.text();
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  return {body, status: r.status, final_url: r.url};
}
for (const prefix of prefixes) {
  const url = prefix + 'sitemap.xml';
  try {
    const {body} = await fetchText(url);
    const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&'));
    for (const page of urls) if (!page.endsWith('.xml')) add(page, {kind: 'guide-collection', collection: prefix});
    discoveries.push({url, status: 'read', pages: urls.length});
  } catch (error) { discoveries.push({url, status: 'unavailable', error: error.message}); }
}
function mainText(body, markdown) {
  if (markdown) return body.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<!-- anomaly-tags:start -->[\s\S]*?<!-- anomaly-tags:end -->/g, '');
  let text = body.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0] || body.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || body;
  text = text.replace(/<(script|style|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<\/(?:p|li|h[1-6]|tr|pre|div)>/gi, '$&\n\n');
  return text.split(/\n\s*\n/).map(part => stripHtml(part).replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
}
const pending = [...pages.values()];
const rows = [];
async function worker() {
  while (pending.length) {
    const page = pending.shift();
    try {
      const local = page.source || localFileForUrl(root, page.url);
      let body, transport;
      if (local && existsSync(local)) { body = await readFile(local, 'utf8'); transport = 'local-source'; }
      else { const remote = await fetchText(page.url); body = remote.body; transport = 'live-html'; }
      const markdown = local?.endsWith('.md');
      if (!markdown && /<meta\b[^>]*http-equiv=["']refresh["']/i.test(body)) throw Error('meta-refresh, not a content page');
      const text = mainText(body, markdown);
      const title = page.title || stripHtml(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || 'Untitled');
      const hash = createHash('sha256').update(text).digest('hex');
      const filename = hash + '.txt';
      await writeFile(join(cache, filename), text);
      rows.push({...page, title, transport, status: 'read', words: text.split(/\s+/).length, sha256: hash, cache_file: filename});
    } catch (error) { rows.push({...page, status: 'unavailable', error: error.message}); }
    if (rows.length % 50 === 0) console.log(`Read ${rows.length}/${pages.size} content records`);
  }
}
await Promise.all(Array.from({length: 6}, () => worker()));
rows.sort((a,b) => a.url.localeCompare(b.url));
const result = {reviewed_at: new Date().toISOString(), archive_root: archive, main_root: root, cache_root: cache, scope: 'All archive article sources; cataloged hosted articles, guides, documentation, labs and research; guide-index destinations; discoverable companion sitemaps. Reference-entity stubs and navigation/tag pages are excluded.', total: rows.length, read: rows.filter(row => row.status === 'read').length, unavailable: rows.filter(row => row.status !== 'read').length, discovery: discoveries, records: rows};
await writeFile(join(report, 'corpus-inventory.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({total: result.total, read: result.read, unavailable: result.unavailable, discovery_failures: discoveries.filter(row => row.status === 'unavailable')}));
