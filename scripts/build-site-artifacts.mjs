#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalFromHtml,
  normalizeCanonical,
  parseSitemapEntries,
  validatePage,
} from './search-index-lib.mjs';
import {
  parseJsonLd,
  stripHtml,
  tagAttributes,
  transformReleaseHtml,
} from './release-html-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const siteRoot = resolve(option('--site', ROOT));
const sourceRoot = resolve(option('--source', ROOT));
const includeRemote = args.includes('--remote');
const transformHtml = !args.includes('--metadata-only');
const remoteConfigPath = resolve(option('--remote-config', join(ROOT, 'seo', 'remote-sitemaps.json')));
const remotePagesPath = resolve(option('--remote-pages', join(ROOT, 'seo', 'remote-pages.json')));
const skippedDirectories = new Set(['.build', '.git', 'node_modules', 'pagefind']);

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function walk(directory = siteRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function urlForFile(path) {
  const rel = relative(siteRoot, path).replace(/\\/g, '/');
  if (rel === 'index.html') return 'https://1200km.com/';
  if (rel.endsWith('/index.html')) return `https://1200km.com/${rel.slice(0, -'index.html'.length)}`;
  return `https://1200km.com/${rel}`;
}

function metaContent(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = tagAttributes(match[0]);
    if ((attributes.name || '').toLowerCase() === key.toLowerCase()
      || (attributes.property || '').toLowerCase() === key.toLowerCase()) return attributes.content || '';
  }
  return '';
}

function schemaValues(value, key, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (typeof value[key] === 'string') output.push(value[key]);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => schemaValues(item, key, output));
    else if (child && typeof child === 'object') schemaValues(child, key, output);
  }
  return output;
}

function schemaTypes(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  const type = value['@type'];
  if (typeof type === 'string') output.push(type);
  else if (Array.isArray(type)) output.push(...type.filter((item) => typeof item === 'string'));
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => schemaTypes(item, output));
    else if (child && typeof child === 'object') schemaTypes(child, output);
  }
  return output;
}

function isoDate(value) {
  if (typeof value !== 'string') return '';
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (!match || Number.isNaN(Date.parse(match[0]))) return '';
  return match[0];
}

function contentDates(html) {
  const { objects } = parseJsonLd(html);
  const modified = [
    ...schemaValues(objects, 'dateModified'),
    metaContent(html, 'article:modified_time'),
  ].map(isoDate).filter(Boolean).sort().at(-1) || '';
  const published = [
    ...schemaValues(objects, 'datePublished'),
    metaContent(html, 'article:published_time'),
  ].map(isoDate).filter(Boolean).sort()[0] || '';
  return { modified, published };
}

function gitDate(path) {
  const rel = relative(siteRoot, path);
  const sourcePath = join(sourceRoot, rel);
  if (!existsSync(sourcePath)) return '';
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relative(sourceRoot, sourcePath)], {
      cwd: sourceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

let articleArchiveVerifiedAt = '';
try {
  const facts = JSON.parse(await readFile(join(sourceRoot, 'data', 'site-facts.json'), 'utf8'));
  articleArchiveVerifiedAt = isoDate(facts?.facts?.['content.medium_exported_articles']?.verified_at);
} catch {
  // A staged subtree can omit the main-site fact model; page metadata remains the fallback.
}

function archiveDate(canonical) {
  let pathname = '';
  try {
    pathname = new URL(canonical).pathname;
  } catch {
    return '';
  }
  const datedArticle = pathname.match(/^\/articles\/read\/\d{4}\/(\d{4}-\d{2}-\d{2})-/);
  if (datedArticle) return isoDate(datedArticle[1]);
  if (pathname === '/articles/read/' || pathname === '/articles/read') return articleArchiveVerifiedAt;
  return '';
}

function sitemapXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(({ loc, lastmod }) => [
      '  <url>',
      `    <loc>${xmlEscape(loc)}</loc>`,
      ...(lastmod ? [`    <lastmod>${xmlEscape(lastmod)}</lastmod>`] : []),
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/xml,text/xml;q=0.9,*/*;q=0.5',
          'user-agent': '1200km-sitemap-builder/1.0 (+https://1200km.com/)',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, 300 * (2 ** (attempt - 1))));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${url}: ${lastError?.message || 'request failed'}`);
}

async function collectRemoteSitemap(sourceUrl, entries, visited = new Set()) {
  const normalized = normalizeCanonical(sourceUrl);
  if (!normalized || visited.has(normalized)) return;
  visited.add(normalized);
  const xml = await fetchText(normalized);
  const parsed = parseSitemapEntries(xml, normalized);
  if (parsed.isIndex) {
    for (const entry of parsed.entries) await collectRemoteSitemap(entry.loc, entries, visited);
    return;
  }
  for (const entry of parsed.entries) {
    if (!entry.loc) continue;
    const existing = entries.get(entry.loc);
    if (!existing || (!existing.lastmod && entry.lastmod)) entries.set(entry.loc, entry);
  }
}

function feedCandidate(rel, types) {
  if (!types.some((type) => ['Article', 'BlogPosting', 'TechArticle'].includes(type))) return false;
  return rel.startsWith('articles/')
    || rel.startsWith('newest-detection-engineering-techniques/')
    || rel.startsWith('embedded-systems-hardware-firmware/');
}

function rssDate(value) {
  return new Date(value.includes('T') ? value : `${value}T00:00:00Z`).toUTCString();
}

function feedXml(items) {
  const lastBuildDate = items.map((item) => item.modified || item.published).sort().at(-1);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>1200km Security Research</title>',
    '    <link>https://1200km.com/</link>',
    '    <atom:link href="https://1200km.com/feed.xml" rel="self" type="application/rss+xml" />',
    '    <description>CTI-to-detection research, AdversaryGraph updates, malware analysis, detection engineering, security labs, and analyst tooling by Andrey Pautov.</description>',
    '    <language>en</language>',
    ...(lastBuildDate ? [`    <lastBuildDate>${rssDate(lastBuildDate)}</lastBuildDate>`] : []),
    '    <ttl>1440</ttl>',
    ...items.flatMap((item) => [
      '    <item>',
      `      <title>${xmlEscape(item.title)}</title>`,
      `      <link>${xmlEscape(item.url)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(item.url)}</guid>`,
      `      <pubDate>${rssDate(item.published)}</pubDate>`,
      ...(item.modified && item.modified !== item.published
        ? [`      <atom:updated>${item.modified}T00:00:00Z</atom:updated>`] : []),
      `      <description>${xmlEscape(item.description)}</description>`,
      '    </item>',
    ]),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

const files = (await walk()).sort();
const pages = [];
const titleMap = new Map();

for (const path of files) {
  const html = await readFile(path, 'utf8');
  const url = urlForFile(path);
  const validation = validatePage(url, html);
  if (!validation.indexable) continue;
  const canonical = canonicalFromHtml(html) ? normalizeCanonical(canonicalFromHtml(html), url) : normalizeCanonical(url);
  if (!canonical || canonical !== normalizeCanonical(url)) continue;
  const title = stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || canonical);
  titleMap.set(canonical, title);
  pages.push({ path, html, canonical, title });
}

const localEntries = new Map();
const feedItems = [];

for (const page of pages) {
  const rel = relative(siteRoot, page.path).replace(/\\/g, '/');
  const dates = contentDates(page.html);
  const lastmod = dates.modified || dates.published || archiveDate(page.canonical) || gitDate(page.path);
  localEntries.set(page.canonical, { loc: page.canonical, ...(lastmod ? { lastmod } : {}) });

  const parsed = parseJsonLd(page.html);
  const types = schemaTypes(parsed.objects);
  if (feedCandidate(rel, types) && dates.published) {
    feedItems.push({
      url: page.canonical,
      title: page.title,
      description: metaContent(page.html, 'description'),
      published: dates.published,
      modified: dates.modified,
    });
  }

  if (transformHtml) {
    const transformed = transformReleaseHtml(page.html, {
      canonical: page.canonical,
      dateModified: lastmod,
      titleMap,
      htmlPath: page.path,
      siteRoot,
    });
    await writeFile(page.path, transformed);
  }
}

const factModel = JSON.parse(await readFile(join(sourceRoot, 'data', 'site-facts.json'), 'utf8'));
const stableTag = factModel.facts['adversarygraph.latest_release_tag'];
const stablePublished = factModel.facts['adversarygraph.release_published_at'];
const developmentStatus = factModel.facts['adversarygraph.development_status'];
if (!stableTag || stableTag.status !== 'released' || !stablePublished || !developmentStatus) {
  throw new Error('Authoritative AdversaryGraph release facts are incomplete.');
}
feedItems.push({
  url: 'https://1200km.com/adversarygraph/',
  title: `AdversaryGraph ${stableTag.value} Stable Release`,
  description: `AdversaryGraph ${stableTag.value} is the latest stable release. ${developmentStatus.value}`,
  published: stablePublished.value,
  modified: stablePublished.value,
});

const remoteEntries = new Map();
if (includeRemote) {
  const sources = JSON.parse(await readFile(remoteConfigPath, 'utf8'));
  for (const source of sources) {
    process.stdout.write(`Reading ${source.name} sitemap…\n`);
    await collectRemoteSitemap(source.url, remoteEntries);
  }
  const standalonePages = JSON.parse(await readFile(remotePagesPath, 'utf8'));
  for (const page of standalonePages) {
    const loc = normalizeCanonical(page.url);
    if (loc) remoteEntries.set(loc, { loc });
  }
}

for (const url of localEntries.keys()) remoteEntries.delete(url);
const localSorted = [...localEntries.values()].sort((a, b) => a.loc.localeCompare(b.loc));
const canonicalSorted = [...localEntries.values(), ...remoteEntries.values()]
  .sort((a, b) => a.loc.localeCompare(b.loc));
feedItems.sort((a, b) => (b.published.localeCompare(a.published) || a.url.localeCompare(b.url)));

await mkdir(siteRoot, { recursive: true });
await writeFile(join(siteRoot, 'sitemap-all.xml'), sitemapXml(localSorted));
await writeFile(join(siteRoot, 'sitemap.xml'), sitemapXml(canonicalSorted));
await writeFile(join(siteRoot, 'feed.xml'), feedXml(feedItems));

console.log(`Prepared ${pages.length} canonical local pages${transformHtml ? ' and transformed release HTML' : ''}.`);
console.log(`Wrote sitemap-all.xml (${localSorted.length}), sitemap.xml (${canonicalSorted.length}), and feed.xml (${feedItems.length}).`);
