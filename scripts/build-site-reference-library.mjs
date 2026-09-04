#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function option(name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? resolve(args[index + 1]) : fallback; }
const SITE_ROOT = option('--site', ROOT);
const SOURCE_ROOT = option('--source', ROOT);
const check = process.argv.includes('--check');
const baseline = JSON.parse(await readFile(join(SOURCE_ROOT, 'data', 'ai-attack-reference-library.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(SITE_ROOT, 'data', 'content-catalog.json'), 'utf8'));
const outputPath = join(SITE_ROOT, 'data', 'reference-library.json');
const CONTENT_TYPES = new Set(['article', 'case-study', 'documentation', 'guide', 'lab', 'mirror', 'research']);
const EXCLUDED_HOSTS = new Set(['1200km.com', 'www.1200km.com', 'linkedin.com', 'www.linkedin.com']);
const EXCLUDED_URLS = new Set([
  'https://github.com/anpa1200',
  'https://medium.com/@1200km',
]);

function decodeHtml(value) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ').trim();
}

function slug(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9.+/-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function normalizeUrl(value) {
  try {
    const url = new URL(decodeHtml(value));
    if (url.protocol !== 'https:') return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    const normalized = url.toString().replace(/\/$/, '');
    if (EXCLUDED_HOSTS.has(url.hostname.toLowerCase()) || EXCLUDED_URLS.has(normalized)) return null;
    return normalized;
  } catch { return null; }
}

function localPath(canonicalUrl) {
  const url = new URL(canonicalUrl);
  let path = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  return join(SITE_ROOT, path);
}

function tag(facet, value, type) {
  return { facet, type, value: String(value), key: `${type.replaceAll('_', '-')}:${slug(value)}` };
}

function publisher(url) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return host.split('.').slice(0, -1).join('.').split(/[.-]/).filter(Boolean)
    .map((part) => part.length <= 4 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)).join(' ') || host;
}

const usage = new Map();
for (const item of catalog.items.filter((entry) => entry.indexable && CONTENT_TYPES.has(entry.primary_type) && entry.canonical_url.startsWith('https://1200km.com/'))) {
  let html;
  try { html = await readFile(localPath(item.canonical_url), 'utf8'); } catch { continue; }
  const links = html.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](https:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const match of links) {
    const url = normalizeUrl(match[1]);
    if (!url) continue;
    const anchor = decodeHtml(match[2]);
    const source = { title:item.title, url:item.canonical_url, type:item.primary_type, domain:item.primary_domain };
    const entry = usage.get(url) || { anchors:new Map(), sources:new Map() };
    if (anchor && !/^https?:\/\//i.test(anchor) && anchor.length <= 240) entry.anchors.set(anchor.toLowerCase(), anchor);
    entry.sources.set(item.canonical_url, source);
    usage.set(url, entry);
  }
}

const baselineByUrl = new Map(baseline.records.map((record) => [normalizeUrl(record.url), record]));
const urls = new Set([...baselineByUrl.keys(), ...usage.keys()].filter(Boolean));
const records = [...urls].map((url) => {
  const original = baselineByUrl.get(url);
  const found = usage.get(url);
  const usedIn = [...(found?.sources.values() || [])].sort((a, b) => a.title.localeCompare(b.title) || a.url.localeCompare(b.url));
  const anchor = [...(found?.anchors.values() || [])].sort((a, b) => b.length - a.length)[0];
  const host = new URL(url).hostname.replace(/^www\./, '');
  const title = original?.title || anchor || url;
  const siteTags = [
    tag('Publisher domain', host, 'publisher_domain'),
    ...[...new Set(usedIn.map((source) => source.type))].map((value) => tag('Used by content type', value, 'used_by_type')),
    ...[...new Set(usedIn.map((source) => source.domain))].map((value) => tag('Used by topic', value, 'used_by_topic')),
  ];
  const tags = [...new Map([...(original?.tags || []), ...siteTags].map((item) => [item.key, item])).values()]
    .sort((a, b) => a.facet.localeCompare(b.facet) || a.value.localeCompare(b.value));
  return {
    id: original?.id || `site-reference:${slug(host)}:${createHash('sha256').update(url).digest('hex').slice(0, 16)}`,
    title,
    description: original?.description || `External source cited by ${usedIn.length} maintained 1200km ${usedIn.length === 1 ? 'page' : 'pages'}.`,
    url: original?.url || url,
    publisher: original?.publisher || publisher(url),
    published_at: original?.published_at || null,
    inclusion: original?.inclusion || 'site',
    tags,
    used_in: usedIn,
  };
}).sort((a, b) => a.title.localeCompare(b.title) || a.url.localeCompare(b.url));

const tagKeys = new Set(records.flatMap((record) => record.tags.map((item) => item.key)));
const payload = {
  $schema:'./reference-library.schema.json', schema_version:2, generated_at:'2026-09-04',
  title:'1200km Article and Guide Reference Library',
  description:'Deduplicated external sources cited across maintained 1200km articles, guides, research, case studies, documentation, and labs.',
  evidence_boundary:'Tags and usage links are discovery metadata derived from published 1200km pages. Citation does not imply endorsement, current validity, attribution, exploitation, causality, or control effectiveness.',
  source_dataset:'/data/content-catalog.json and /data/ai-attack-reference-library.json',
  record_count:records.length,
  core_count:records.filter((item) => item.inclusion === 'core').length,
  context_count:records.filter((item) => item.inclusion === 'context').length,
  site_count:records.filter((item) => item.inclusion === 'site').length,
  usage_link_count:records.reduce((sum, item) => sum + item.used_in.length, 0),
  unique_tag_count:tagKeys.size,
  tag_assignment_count:records.reduce((sum, item) => sum + item.tags.length, 0),
  records,
};
const rendered = `${JSON.stringify(payload, null, 2)}\n`;
if (check) {
  if (await readFile(outputPath, 'utf8') !== rendered) throw new Error('Site reference library is stale. Run npm run build-reference-data.');
  console.log(`Site reference library current: ${records.length} references and ${payload.usage_link_count} usage links.`);
} else {
  await writeFile(outputPath, rendered);
  console.log(`Wrote ${records.length} references and ${payload.usage_link_count} usage links to ${outputPath}.`);
}
