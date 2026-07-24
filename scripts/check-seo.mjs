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
  SOFTWARE_ID,
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
const requireCatalogAgreement = args.includes('--require-catalog-agreement');
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

function directTypes(value) {
  const type = value?.['@type'];
  return Array.isArray(type) ? type : typeof type === 'string' ? [type] : [];
}

function referenceId(value) {
  return value && typeof value === 'object' ? value['@id'] || '' : '';
}

function validIsoDate(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
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

function checkGraph(rel, canonical, html, expectedLastmod = '') {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1) failures.push(`${rel}: expected one consolidated JSON-LD block, found ${scripts.length}`);
  const parsed = parseJsonLd(html);
  if (parsed.failures.length) {
    failures.push(`${rel}: invalid JSON-LD (${parsed.failures.join('; ')})`);
    return;
  }
  const topLevelIds = parsed.objects.map((object) => object?.['@id']).filter(Boolean);
  const ids = new Set(topLevelIds);
  if (ids.size !== topLevelIds.length) failures.push(`${rel}: top-level JSON-LD @id values are not unique`);
  const requiredIds = [PERSON_ID, WEBSITE_ID, `${canonical}#webpage`, `${canonical}#breadcrumb`];
  for (const id of requiredIds) if (!ids.has(id)) failures.push(`${rel}: connected graph is missing ${id}`);
  const types = schemaTypes(parsed.objects);
  for (const type of ['Person', 'WebSite', 'BreadcrumbList']) {
    if (!types.includes(type)) failures.push(`${rel}: graph is missing ${type}`);
  }
  if (!types.some((type) => ['WebPage', 'AboutPage', 'CollectionPage', 'ContactPage', 'FAQPage', 'ItemPage', 'ProfilePage', 'SearchResultsPage'].includes(type))) {
    failures.push(`${rel}: graph is missing a WebPage type`);
  }
  const page = parsed.objects.find((object) => object?.['@id'] === `${canonical}#webpage`);
  const visibleTitle = stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || '');
  if (page?.url !== canonical) failures.push(`${rel}: WebPage.url does not match the canonical URL`);
  if (page?.name !== visibleTitle) failures.push(`${rel}: WebPage.name does not match the visible H1`);
  if (referenceId(page?.isPartOf) !== WEBSITE_ID) failures.push(`${rel}: WebPage.isPartOf does not reference the site WebSite`);
  if (referenceId(page?.breadcrumb) !== `${canonical}#breadcrumb`) failures.push(`${rel}: WebPage.breadcrumb does not reference the page breadcrumb`);
  if (expectedLastmod && page?.dateModified !== expectedLastmod) {
    failures.push(`${rel}: WebPage.dateModified ${page?.dateModified || '(missing)'} disagrees with sitemap lastmod ${expectedLastmod}`);
  }
  for (const reference of internalReferences(parsed.objects)) {
    if (!ids.has(reference)) failures.push(`${rel}: unresolved internal JSON-LD reference ${reference}`);
  }
  const breadcrumb = parsed.objects.find((object) => object?.['@id'] === `${canonical}#breadcrumb`);
  const positions = breadcrumb?.itemListElement?.map((item) => item.position) || [];
  if (!positions.length || positions.some((position, index) => position !== index + 1)) {
    failures.push(`${rel}: breadcrumb positions are missing or non-sequential`);
  }
  const lastCrumb = breadcrumb?.itemListElement?.at(-1);
  const expectedCrumbName = canonical === 'https://1200km.com/' ? 'Home' : visibleTitle;
  if (lastCrumb?.item !== canonical || lastCrumb?.name !== expectedCrumbName) {
    failures.push(`${rel}: final breadcrumb does not represent the visible current page`);
  }

  if (directTypes(page).includes('FAQPage')) {
    const questions = Array.isArray(page.mainEntity) ? page.mainEntity : [page.mainEntity].filter(Boolean);
    if (!questions.length || questions.some((question) => (
      !directTypes(question).includes('Question')
      || typeof question.name !== 'string'
      || !directTypes(question.acceptedAnswer).includes('Answer')
      || typeof question.acceptedAnswer?.text !== 'string'
    ))) failures.push(`${rel}: FAQPage does not contain visible Question/acceptedAnswer entities`);
  }

  const articleObjects = parsed.objects.filter((object) => directTypes(object)
    .some((type) => ['Article', 'BlogPosting', 'TechArticle'].includes(type)));
  const articleExpected = /^https:\/\/1200km\.com\/articles\/read\/\d{4}\/[^/]+\/?$/i.test(canonical)
    || /^https:\/\/1200km\.com\/articles\/[^/]+\.html$/i.test(canonical);
  if (articleExpected && articleObjects.length !== 1) {
    failures.push(`${rel}: expected one article entity, found ${articleObjects.length}`);
  }
  for (const article of articleObjects) {
    if (article['@id'] !== `${canonical}#article`) failures.push(`${rel}: article @id is not page-specific #article`);
    if (article.url !== canonical) failures.push(`${rel}: article URL does not match canonical`);
    if (article.headline !== visibleTitle) failures.push(`${rel}: article headline does not match the visible H1`);
    if (referenceId(article.mainEntityOfPage) !== `${canonical}#webpage`) failures.push(`${rel}: article mainEntityOfPage does not reference the WebPage`);
    if (referenceId(article.author) !== PERSON_ID) failures.push(`${rel}: article author does not reference the site Person`);
    if (!article.publisher) failures.push(`${rel}: article publisher is missing`);
    if (articleExpected && !validIsoDate(article.datePublished)) failures.push(`${rel}: article datePublished is missing or invalid`);
    if (article.datePublished && !validIsoDate(article.datePublished)) failures.push(`${rel}: article datePublished is invalid`);
    if (expectedLastmod && !validIsoDate(article.dateModified)) failures.push(`${rel}: article dateModified is missing or invalid`);
    if (validIsoDate(article.datePublished) && validIsoDate(article.dateModified)
      && article.dateModified < article.datePublished) failures.push(`${rel}: article dateModified precedes datePublished`);
    if (article.datePublished && findMetaContent(html, 'article:published_time') !== article.datePublished) failures.push(`${rel}: article published meta disagrees with JSON-LD`);
    if (article.dateModified && findMetaContent(html, 'article:modified_time') !== article.dateModified) failures.push(`${rel}: article modified meta disagrees with JSON-LD`);
    if (expectedLastmod && article.dateModified !== expectedLastmod) failures.push(`${rel}: article dateModified disagrees with sitemap lastmod`);
  }

  for (const software of parsed.objects.filter((object) => directTypes(object)
    .some((type) => ['SoftwareApplication', 'SoftwareSourceCode'].includes(type)))) {
    if (software.name !== 'AdversaryGraph') continue;
    if (software['@id'] !== SOFTWARE_ID) failures.push(`${rel}: AdversaryGraph does not use the stable software @id`);
    if (referenceId(page?.mainEntity) === SOFTWARE_ID) {
      if (referenceId(software.mainEntityOfPage) !== `${canonical}#webpage`) failures.push(`${rel}: AdversaryGraph mainEntityOfPage does not reference the current WebPage`);
    } else if (['https://1200km.com/', 'https://1200km.com/adversarygraph/'].includes(canonical)) {
      failures.push(`${rel}: WebPage.mainEntity does not reference AdversaryGraph`);
    }
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

const sitemapDates = new Map();
const preliminarySitemapPath = join(siteRoot, 'sitemap-all.xml');
if (existsSync(preliminarySitemapPath)) {
  for (const entry of parseSitemapEntries(readFileSync(preliminarySitemapPath, 'utf8')).entries) {
    sitemapDates.set(entry.loc, entry.lastmod || '');
  }
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
  if (/<meta\b[^>]*\bname=["']keywords["']/i.test(releaseHtml)) failures.push(`${page.rel}: legacy meta keywords are present`);
  const documentTitle = stripHtml(releaseHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (!documentTitle) failures.push(`${page.rel}: document title is missing`);
  if (documentTitle.length > 115) failures.push(`${page.rel}: document title remains excessively long (${documentTitle.length} characters)`);
  if (/\|\s*AdversaryGraph Documentation\b|\|\s*ITDR\s*[–—-]\s*Identity Threat Detection/i.test(documentTitle)) {
    failures.push(`${page.rel}: document title retains a repetitive generated suffix`);
  }
  if ((documentTitle.match(/\|\s*1200km\b/gi) || []).length > 1) failures.push(`${page.rel}: document title repeats the site name`);
  if (/\|\s*1200km\s*\|/i.test(documentTitle)) failures.push(`${page.rel}: document title contains a duplicated site-name fragment`);
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
  checkGraph(
    page.rel,
    page.canonical,
    releaseHtml,
    requireReleaseTransform ? sitemapDates.get(page.canonical) || '' : '',
  );
}

const canonicalUrls = new Set(pages.map((page) => page.canonical));
const auxiliarySitemapUrls = new Set(['https://1200km.com/llms.txt']);
const expectedLocalSitemapUrls = new Set([...canonicalUrls, ...auxiliarySitemapUrls]);
const sitemapAllPath = join(siteRoot, 'sitemap-all.xml');
const sitemapPath = join(siteRoot, 'sitemap.xml');
if (!existsSync(sitemapAllPath) || !existsSync(sitemapPath)) failures.push('sitemap files are missing');
else {
  const local = parseSitemapEntries(readFileSync(sitemapAllPath, 'utf8'));
  const complete = parseSitemapEntries(readFileSync(sitemapPath, 'utf8'));
  if (local.isIndex || complete.isIndex) failures.push('sitemaps must be flat URL sets generated from canonical pages');
  const localUrls = new Set(local.entries.map((entry) => entry.loc));
  if (localUrls.size !== expectedLocalSitemapUrls.size) failures.push(`sitemap-all.xml has ${localUrls.size} URLs; expected ${expectedLocalSitemapUrls.size}`);
  for (const url of expectedLocalSitemapUrls) if (!localUrls.has(url)) failures.push(`sitemap-all.xml is missing ${url}`);
  for (const entry of local.entries) {
    if (!expectedLocalSitemapUrls.has(entry.loc)) failures.push(`sitemap-all.xml contains a non-local/non-canonical URL: ${entry.loc}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod || '')) failures.push(`sitemap-all.xml has no accurate lastmod for ${entry.loc}`);
  }
  const completeUrls = new Set(complete.entries.map((entry) => entry.loc));
  if (completeUrls.size !== complete.entries.length) failures.push('sitemap.xml contains duplicate URLs');
  if (completeUrls.size < expectedLocalSitemapUrls.size) failures.push('sitemap.xml does not cover all local canonical pages and discovery files');
  for (const url of expectedLocalSitemapUrls) if (!completeUrls.has(url)) failures.push(`sitemap.xml is missing local URL ${url}`);
}

let catalogItemsByUrl = new Map();
if (requireCatalogAgreement) {
  const catalogPath = join(siteRoot, 'data', 'content-catalog.json');
  if (!existsSync(catalogPath)) failures.push('content catalogue is missing for canonical agreement checks');
  else {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    catalogItemsByUrl = new Map((catalog.items || []).map((item) => [item.canonical_url, item]));
    for (const page of pages) {
      const item = catalogItemsByUrl.get(page.canonical);
      if (!item) {
        failures.push(`${page.rel}: canonical page has no content-catalog identity`);
        continue;
      }
      if (item.canonical_url !== page.canonical) failures.push(`${page.rel}: content-catalog canonical disagrees with HTML`);
      const expectedDate = item.updated_at || item.published_at || '';
      const sitemapDate = sitemapDates.get(page.canonical) || '';
      if (expectedDate !== sitemapDate) {
        failures.push(`${page.rel}: content-catalog date ${expectedDate || '(missing)'} disagrees with sitemap lastmod ${sitemapDate || '(missing)'}`);
      }
    }
  }
}

const robotsPath = join(siteRoot, 'robots.txt');
if (!existsSync(robotsPath)) failures.push('robots.txt is missing');
else {
  const robots = readFileSync(robotsPath, 'utf8');
  const groups = robotsGroups(robots);
  const allowed = [
    'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot',
    'Claude-User', 'PerplexityBot', 'Perplexity-User', 'GPTBot', 'ClaudeBot',
    'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'FacebookBot',
    'Bytespider', 'cohere-ai',
  ];
  for (const agent of allowed) {
    const group = groups.find((item) => item.agents.includes(agent));
    if (!group?.rules.includes('allow:/')) failures.push(`robots.txt does not allow ${agent}`);
  }
  if (!robots.includes('Policy: search=yes, user-triggered AI retrieval=yes, model training=yes')) failures.push('robots.txt does not document the AI use policy');
  if (!robots.includes('# LLM guide: https://1200km.com/llms.txt')) failures.push('robots.txt does not advertise the LLM guide');
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
  if (requireCatalogAgreement) {
    for (const match of feed.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const itemXml = match[1];
      const url = normalizeCanonical(itemXml.match(/<guid\b[^>]*>\s*([^<]+)\s*<\/guid>/i)?.[1] || '');
      const catalogItem = catalogItemsByUrl.get(url);
      if (!catalogItem) {
        failures.push(`feed.xml item has no catalogue identity: ${url || '(missing URL)'}`);
        continue;
      }
      const published = itemXml.match(/<pubDate>\s*([^<]+)\s*<\/pubDate>/i)?.[1] || '';
      const publishedDate = published && !Number.isNaN(Date.parse(published))
        ? new Date(published).toISOString().slice(0, 10) : '';
      if (publishedDate !== catalogItem.published_at) {
        failures.push(`feed.xml publication date for ${url} disagrees with the content catalogue`);
      }
      const updated = itemXml.match(/<atom:updated>\s*([^<]+)\s*<\/atom:updated>/i)?.[1]?.slice(0, 10) || publishedDate;
      const expectedUpdated = catalogItem.updated_at || catalogItem.published_at;
      if (updated !== expectedUpdated) failures.push(`feed.xml update date for ${url} disagrees with the content catalogue`);
    }
  }
}

const validationTargetsPath = join(siteRoot, 'seo', 'structured-data-validation.json');
if (!existsSync(validationTargetsPath)) failures.push('structured-data manual-validation targets are missing');
else {
  const targets = JSON.parse(readFileSync(validationTargetsPath, 'utf8'));
  if (targets.schema_validator !== 'https://validator.schema.org/') failures.push('structured-data targets omit the Schema.org validator');
  if (targets.google_rich_results_test !== 'https://search.google.com/test/rich-results') failures.push('structured-data targets omit Google Rich Results Test');
  if (!Array.isArray(targets.representative_urls) || targets.representative_urls.length < 6) {
    failures.push('structured-data targets must contain at least six representative URLs');
  } else {
    const seen = new Set();
    for (const target of targets.representative_urls) {
      const url = normalizeCanonical(target.url);
      if (!url || !url.startsWith('https://1200km.com/')) failures.push(`invalid structured-data validation URL: ${target.url || '(missing)'}`);
      if (!target.expected_type || !target.reason) failures.push(`incomplete structured-data validation target: ${target.url || '(missing)'}`);
      if (seen.has(url)) failures.push(`duplicate structured-data validation target: ${url}`);
      seen.add(url);
    }
  }
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
