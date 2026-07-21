#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalFromHtml,
  findMetaContent,
  normalizeCanonical,
  parseSitemapEntries,
  validatePage,
} from './search-index-lib.mjs';
import {
  PERSON_ID,
  WEBSITE_ID,
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
const requireReleaseTransform = args.includes('--require-release-transform');
const failures = [];
const skippedDirectories = new Set(['.build', '.git', 'node_modules', 'pagefind']);

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

function internalReferences(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (typeof value['@id'] === 'string' && Object.keys(value).length === 1 && value['@id'].startsWith('https://1200km.com/')) {
    output.push(value['@id']);
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => internalReferences(item, output));
    else if (child && typeof child === 'object') internalReferences(child, output);
  }
  return output;
}

function checkHeadingHierarchy(rel, html) {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => Number(match[1]));
  const h1Count = headings.filter((level) => level === 1).length;
  if (h1Count !== 1) failures.push(`${rel}: expected exactly one H1, found ${h1Count}`);
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      failures.push(`${rel}: heading level jumps from H${headings[index - 1]} to H${headings[index]}`);
      break;
    }
  }
}

function localImage(src, htmlPath) {
  if (!src || /^(?:data:|blob:|\/\/)/i.test(src)) return null;
  let pathname = src.split(/[?#]/, 1)[0];
  if (/^https?:/i.test(pathname)) {
    let url;
    try { url = new URL(pathname); } catch { return null; }
    if (url.hostname !== '1200km.com') return null;
    pathname = url.pathname;
  }
  let path;
  try {
    path = pathname.startsWith('/')
      ? resolve(siteRoot, decodeURIComponent(pathname).replace(/^\/+/, ''))
      : resolve(dirname(htmlPath), decodeURIComponent(pathname));
  } catch {
    return null;
  }
  return path.startsWith(`${siteRoot}/`) && existsSync(path) ? path : null;
}

function checkImages(rel, html, htmlPath, requireDimensions = true) {
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attributes = tagAttributes(match[0]);
    if (!Object.hasOwn(attributes, 'alt')) failures.push(`${rel}: image is missing alt text (${attributes.src || 'unknown source'})`);
    if (requireDimensions && localImage(attributes.src, htmlPath) && (!attributes.width || !attributes.height)) {
      failures.push(`${rel}: local image is missing explicit dimensions (${attributes.src})`);
    }
  }
}

function checkGraph(rel, canonical, html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1) failures.push(`${rel}: expected one consolidated JSON-LD block, found ${scripts.length}`);
  const parsed = parseJsonLd(html);
  if (parsed.failures.length) {
    failures.push(`${rel}: invalid JSON-LD (${parsed.failures.join('; ')})`);
    return;
  }
  const ids = new Set(parsed.objects.map((object) => object?.['@id']).filter(Boolean));
  const requiredIds = [PERSON_ID, WEBSITE_ID, `${canonical}#webpage`, `${canonical}#breadcrumb`];
  for (const id of requiredIds) if (!ids.has(id)) failures.push(`${rel}: connected graph is missing ${id}`);
  const types = schemaTypes(parsed.objects);
  for (const type of ['Person', 'WebSite', 'BreadcrumbList']) {
    if (!types.includes(type)) failures.push(`${rel}: graph is missing ${type}`);
  }
  if (!types.some((type) => ['WebPage', 'AboutPage', 'CollectionPage', 'ContactPage', 'FAQPage', 'ItemPage', 'ProfilePage', 'SearchResultsPage'].includes(type))) {
    failures.push(`${rel}: graph is missing a WebPage type`);
  }
  for (const reference of internalReferences(parsed.objects)) {
    if (!ids.has(reference)) failures.push(`${rel}: unresolved internal JSON-LD reference ${reference}`);
  }
  const breadcrumb = parsed.objects.find((object) => object?.['@id'] === `${canonical}#breadcrumb`);
  const positions = breadcrumb?.itemListElement?.map((item) => item.position) || [];
  if (!positions.length || positions.some((position, index) => position !== index + 1)) {
    failures.push(`${rel}: breadcrumb positions are missing or non-sequential`);
  }
}

function robotsGroups(text) {
  const groups = [];
  let agents = [];
  let rules = [];
  function flush() {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) {
      if (agents.length && rules.length) flush();
      continue;
    }
    const [field, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (field.toLowerCase() === 'user-agent') {
      if (rules.length) flush();
      agents.push(value);
    } else if (agents.length) rules.push(`${field.toLowerCase()}:${value}`);
  }
  flush();
  return groups;
}

const files = (await walk()).sort();
const pages = [];
const titleMap = new Map();

for (const path of files) {
  const html = readFileSync(path, 'utf8');
  const url = urlForFile(path);
  const validation = validatePage(url, html);
  if (!validation.indexable) continue;
  const rel = relative(siteRoot, path).replace(/\\/g, '/');
  const canonicalLinks = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/gi)];
  if (canonicalLinks.length !== 1) failures.push(`${rel}: expected one canonical link, found ${canonicalLinks.length}`);
  const canonical = normalizeCanonical(canonicalFromHtml(html), url);
  if (canonical !== normalizeCanonical(url)) failures.push(`${rel}: canonical is not self-referential (${canonical || 'missing'})`);
  if (!findMetaContent(html, 'description')) failures.push(`${rel}: missing meta description`);
  if (normalizeCanonical(findMetaContent(html, 'og:url'), url) !== normalizeCanonical(url)) failures.push(`${rel}: og:url is missing or non-canonical`);
  if (!/<html\b[^>]*\blang=["']en(?:-[^"']+)?["']/i.test(html)) failures.push(`${rel}: html lang is missing or not English`);
  if (!/<main\b/i.test(html)) failures.push(`${rel}: missing main landmark`);
  if (!/<nav\b/i.test(html)) failures.push(`${rel}: missing navigation landmark`);
  checkHeadingHierarchy(rel, html);
  const title = stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || canonical);
  titleMap.set(canonical, title);
  pages.push({ path, rel, html, canonical });
}

for (const page of pages) {
  const releaseHtml = requireReleaseTransform
    ? page.html
    : transformReleaseHtml(page.html, {
      canonical: page.canonical,
      titleMap,
      htmlPath: page.path,
      siteRoot,
    });
  if (requireReleaseTransform && !/data-site-graph/.test(releaseHtml)) failures.push(`${page.rel}: release graph was not emitted`);
  const isDocusaurus = /\bid=["']__docusaurus["']/i.test(releaseHtml);
  if (/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com/i.test(releaseHtml)) failures.push(`${page.rel}: release HTML still blocks on an external web font`);
  if (/googletagmanager\.com\/gtag\/js/i.test(releaseHtml)) failures.push(`${page.rel}: analytics was not deferred to user interaction`);
  if (!isDocusaurus && !/<main\b[^>]*data-pagefind-body/i.test(releaseHtml)) failures.push(`${page.rel}: main is not marked as Pagefind content`);
  // H1 is already addressable by the canonical page URL. Never mutate a
  // hydrated Docusaurus tree just to add anchors; its generated document pages
  // already expose anchors, while custom landing components may intentionally
  // omit them.
  if (!isDocusaurus) {
    for (const heading of releaseHtml.matchAll(/<h[2-6]\b([^>]*)>/gi)) {
      if (!/\bid=["'][^"']+["']/i.test(heading[1])) {
        failures.push(`${page.rel}: a release heading has no deep-link ID`);
        break;
      }
    }
  }
  if (!/rel=["'][^"']*alternate[^"']*["'][^>]+application\/rss\+xml/i.test(releaseHtml)
    && !/application\/rss\+xml[^>]+rel=["'][^"']*alternate/i.test(releaseHtml)) {
    failures.push(`${page.rel}: missing RSS discovery link`);
  }
  checkImages(page.rel, releaseHtml, page.path, !isDocusaurus);
  checkGraph(page.rel, page.canonical, releaseHtml);
}

const canonicalUrls = new Set(pages.map((page) => page.canonical));
const sitemapAllPath = join(siteRoot, 'sitemap-all.xml');
const sitemapPath = join(siteRoot, 'sitemap.xml');
if (!existsSync(sitemapAllPath) || !existsSync(sitemapPath)) failures.push('sitemap files are missing');
else {
  const local = parseSitemapEntries(readFileSync(sitemapAllPath, 'utf8'));
  const complete = parseSitemapEntries(readFileSync(sitemapPath, 'utf8'));
  if (local.isIndex || complete.isIndex) failures.push('sitemaps must be flat URL sets generated from canonical pages');
  const localUrls = new Set(local.entries.map((entry) => entry.loc));
  if (localUrls.size !== canonicalUrls.size) failures.push(`sitemap-all.xml has ${localUrls.size} URLs; expected ${canonicalUrls.size}`);
  for (const url of canonicalUrls) if (!localUrls.has(url)) failures.push(`sitemap-all.xml is missing ${url}`);
  for (const entry of local.entries) {
    if (!canonicalUrls.has(entry.loc)) failures.push(`sitemap-all.xml contains a non-local/non-canonical URL: ${entry.loc}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod || '')) failures.push(`sitemap-all.xml has no accurate lastmod for ${entry.loc}`);
  }
  const completeUrls = new Set(complete.entries.map((entry) => entry.loc));
  if (completeUrls.size !== complete.entries.length) failures.push('sitemap.xml contains duplicate URLs');
  if (completeUrls.size < canonicalUrls.size) failures.push('sitemap.xml does not cover all local canonical pages');
  for (const url of canonicalUrls) if (!completeUrls.has(url)) failures.push(`sitemap.xml is missing local URL ${url}`);
}

const robotsPath = join(siteRoot, 'robots.txt');
if (!existsSync(robotsPath)) failures.push('robots.txt is missing');
else {
  const robots = readFileSync(robotsPath, 'utf8');
  const groups = robotsGroups(robots);
  const allowed = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
  const blocked = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'FacebookBot', 'Bytespider', 'cohere-ai'];
  for (const agent of allowed) {
    const group = groups.find((item) => item.agents.includes(agent));
    if (!group?.rules.includes('allow:/')) failures.push(`robots.txt does not allow ${agent}`);
  }
  for (const agent of blocked) {
    const group = groups.find((item) => item.agents.includes(agent));
    if (!group?.rules.includes('disallow:/')) failures.push(`robots.txt does not block training crawler ${agent}`);
  }
  if (!robots.includes('Policy: search=yes, user-triggered AI retrieval=yes, model training=no')) failures.push('robots.txt does not document the AI use policy');
  const sitemapDirectives = robots.match(/^Sitemap:\s*\S+/gim) || [];
  if (sitemapDirectives.length !== 1 || sitemapDirectives[0] !== 'Sitemap: https://1200km.com/sitemap.xml') {
    failures.push('robots.txt must advertise exactly the generated canonical sitemap');
  }
}

const feedPath = join(siteRoot, 'feed.xml');
if (!existsSync(feedPath)) failures.push('feed.xml is missing');
else {
  const feed = readFileSync(feedPath, 'utf8');
  if (!/<rss\b[^>]*version=["']2\.0["']/i.test(feed)) failures.push('feed.xml is not RSS 2.0');
  if (!/atom:link\b[^>]*href=["']https:\/\/1200km\.com\/feed\.xml["'][^>]*rel=["']self["']/i.test(feed)) failures.push('feed.xml is missing its canonical self link');
  const itemUrls = [...feed.matchAll(/<guid\b[^>]*>\s*([^<]+)\s*<\/guid>/gi)].map((match) => normalizeCanonical(match[1])).filter(Boolean);
  if (itemUrls.length < 4) failures.push(`feed.xml has only ${itemUrls.length} articles; expected at least four`);
  if (new Set(itemUrls).size !== itemUrls.length) failures.push('feed.xml contains duplicate items');
  for (const url of itemUrls) if (!canonicalUrls.has(url)) failures.push(`feed.xml contains a non-canonical local item: ${url}`);
}

for (const file of ['llms.txt', 'llms-full.txt']) {
  const path = join(siteRoot, file);
  if (!existsSync(path) || readFileSync(path, 'utf8').trim().length < 200) failures.push(`${file} is missing or incomplete`);
}

if (failures.length) {
  console.error(`SEO release validation failed with ${failures.length} issue(s):`);
  failures.slice(0, 200).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 200) console.error(`- …and ${failures.length - 200} more`);
  process.exit(1);
}

console.log(`SEO release validation passed for ${pages.length} canonical pages.`);
