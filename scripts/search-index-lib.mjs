import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { addHeadingIds, markPagefindContent } from './release-html-lib.mjs';

export const SITE_ORIGIN = 'https://1200km.com';

const LEGACY_PREFIXES = ['/threatmapper/', '/threatmapper-docs/'];
const ENTITY_PATH = /^\/threat-matrix\/(actors|techniques)\/([^/]+)\/$/i;

function decodeEntities(value = '') {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

export function escapeAttribute(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function stripHtml(value = '') {
  return decodeEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

export function attributesFromTag(tag = '') {
  const attributes = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = pattern.exec(tag))) {
    const key = match[1].toLowerCase();
    if (key === 'meta' || key === 'link' || key === 'body' || key === 'head') continue;
    attributes[key] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

export function findMetaContent(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    if ((attributes.name || '').toLowerCase() === name.toLowerCase()) return attributes.content || '';
    if ((attributes.property || '').toLowerCase() === name.toLowerCase()) return attributes.content || '';
  }
  return '';
}

export function canonicalFromHtml(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    const rel = (attributes.rel || '').toLowerCase().split(/\s+/);
    if (rel.includes('canonical')) return attributes.href || '';
  }
  return '';
}

export function normalizeSiteUrl(value, base = SITE_ORIGIN) {
  let url;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== '1200km.com') return null;
  url.hash = '';
  url.search = '';
  url.hostname = '1200km.com';

  let pathname = url.pathname.replace(/\/{2,}/g, '/');
  if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'index.html'.length);
  const finalSegment = pathname.split('/').pop() || '';
  if (pathname !== '/' && !finalSegment.includes('.') && !pathname.endsWith('/')) pathname += '/';
  url.pathname = pathname;
  return url;
}

export function normalizeCanonical(value, base = SITE_ORIGIN) {
  return normalizeSiteUrl(value, base)?.href || null;
}

export function parseSitemap(xml, base = SITE_ORIGIN) {
  const parsed = parseSitemapEntries(xml, base);
  return { isIndex: parsed.isIndex, locations: parsed.entries.map((entry) => entry.loc) };
}

export function parseSitemapEntries(xml, base = SITE_ORIGIN) {
  const isIndex = /<sitemapindex\b/i.test(xml);
  const element = isIndex ? 'sitemap' : 'url';
  const entries = [];
  const seen = new Set();
  for (const match of xml.matchAll(new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)<\\/${element}>`, 'gi'))) {
    const location = match[1].match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i)?.[1];
    const loc = location ? normalizeCanonical(decodeEntities(location), base) : null;
    if (!loc || seen.has(loc)) continue;
    const lastmodValue = match[1].match(/<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i)?.[1] || '';
    const lastmod = decodeEntities(lastmodValue).match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '';
    seen.add(loc);
    entries.push({ loc, ...(lastmod ? { lastmod } : {}) });
  }
  // Tolerate minimal sitemap fixtures that omit the url/sitemap wrapper.
  if (!entries.length) {
    for (const match of xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
      const loc = normalizeCanonical(decodeEntities(match[1]), base);
      if (!loc || seen.has(loc)) continue;
      seen.add(loc);
      entries.push({ loc });
    }
  }
  return { isIndex, entries };
}

export function localFileForUrl(root, value) {
  const url = normalizeSiteUrl(value);
  if (!url) return null;
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const candidates = [];
  if (!relativePath) candidates.push('index.html');
  else if (relativePath.endsWith('/')) candidates.push(`${relativePath}index.html`);
  else {
    candidates.push(relativePath);
    if (!relativePath.split('/').pop()?.includes('.')) candidates.push(`${relativePath}/index.html`);
  }
  for (const candidate of candidates) {
    const path = resolve(root, candidate);
    if (!path.startsWith(`${resolve(root)}/`) && path !== resolve(root, 'index.html')) continue;
    if (existsSync(path)) return path;
  }
  return null;
}

export function shouldExcludeUrl(value) {
  const url = normalizeSiteUrl(value);
  if (!url) return true;
  const path = url.pathname.toLowerCase();
  if (path === '/cover-letter.html' || path.endsWith('/404.html') || path === '/404.html') return true;
  return LEGACY_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function validatePage(urlValue, html) {
  const url = normalizeSiteUrl(urlValue);
  if (!url) return { indexable: false, reason: 'off-origin-or-invalid-url' };
  if (shouldExcludeUrl(url.href)) return { indexable: false, reason: 'excluded-path' };
  if (!/<html\b/i.test(html) || !/<body\b/i.test(html)) return { indexable: false, reason: 'not-html' };

  const robots = findMetaContent(html, 'robots').toLowerCase();
  if (robots.split(/[\s,]+/).includes('noindex')) return { indexable: false, reason: 'noindex' };
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i.test(html)) {
    return { indexable: false, reason: 'redirect' };
  }
  const title = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (/^(redirecting|page not found|404\b)/i.test(title)) return { indexable: false, reason: 'redirect-or-not-found' };

  const canonical = canonicalFromHtml(html);
  if (canonical) {
    const canonicalUrl = normalizeCanonical(canonical, url.href);
    if (!canonicalUrl) return { indexable: false, reason: 'off-origin-canonical' };
    if (canonicalUrl !== url.href) return { indexable: false, reason: 'canonical-alias' };
  }
  return { indexable: true, reason: null };
}

function extractJsonLdAliases(html) {
  const aliases = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.alternateName === 'string') aliases.push(value.alternateName);
    if (Array.isArray(value.alternateName)) aliases.push(...value.alternateName.filter((item) => typeof item === 'string'));
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1]));
    } catch {
      // Invalid third-party structured data should not make the search build fail.
    }
  }
  return aliases;
}

function extractAliases(html) {
  const aliases = extractJsonLdAliases(html);
  for (const match of html.matchAll(/Aliases:\s*([\s\S]*?)<\/p>/gi)) {
    aliases.push(...stripHtml(match[1]).split(/\s*,\s*/));
  }
  return [...new Set(aliases.map((alias) => stripHtml(alias)).filter(Boolean))].slice(0, 24);
}

export function classifyUrl(urlValue) {
  const pathname = normalizeSiteUrl(urlValue)?.pathname || '/';
  if (/^\/threat-matrix\/actors\//i.test(pathname)) return 'Threat actors';
  if (/^\/threat-matrix\/techniques\//i.test(pathname)) return 'ATT&CK techniques';
  if (/^\/articles\//i.test(pathname) || /^\/medium-blog-navigation\//i.test(pathname)) return 'Articles';
  if (/^\/adversarygraph-docs\//i.test(pathname)) return 'AdversaryGraph docs';
  if (/^\/ITDR\//.test(pathname)) return 'Identity security';
  if (/lab|simulation/i.test(pathname)) return 'Labs';
  if (/^\/(adversarygraph|threat-matrix)\/?/i.test(pathname) || pathname === '/projects.html') return 'Projects';
  if (/manual|guide|docs|atlas|cti|detection/i.test(pathname)) return 'Guides & research';
  return '1200km';
}

export function classifyContentType(urlValue) {
  const pathname = normalizeSiteUrl(urlValue)?.pathname || '/';
  if (/^\/threat-matrix\/actors\//i.test(pathname)) return 'Threat actor profile';
  if (/^\/threat-matrix\/techniques\//i.test(pathname)) return 'ATT&CK technique';
  if (/^\/articles\//i.test(pathname) || /newest-detection|embedded-systems/i.test(pathname)) return 'Article';
  if (/\/docs?\/|\/adversarygraph-docs\//i.test(pathname)) return 'Documentation';
  if (/lab|simulation/i.test(pathname)) return 'Lab';
  if (/^\/(?:adversarygraph|threat-matrix)\/?$/i.test(pathname) || /(?:aidebug|stratus)/i.test(pathname)) return 'Tool';
  if (/^(?:\/|\/about\.html|\/cv\.html)$/i.test(pathname)) return 'Profile';
  if (/search\.html$/i.test(pathname)) return 'Search';
  if (/articles\/$|projects\.html$|guides\.html$|labs\.html$|cti\.html$/i.test(pathname)) return 'Collection';
  return 'Research & guide';
}

const TOPIC_RULES = [
  ['AdversaryGraph', /adversarygraph|threatmapper/i],
  ['MITRE ATT&CK', /mitre|att&ck|attack technique|\bT\d{4}(?:\.\d{3})?\b|\bG\d{4}\b/i],
  ['Cyber threat intelligence', /\bcti\b|threat intelligence|threat actor|ioc|indicator of compromise/i],
  ['Threat hunting', /threat hunt|hunting hypothesis|hunt quer/i],
  ['Detection engineering', /detection engineer|sigma|yara|siem|telemetry|detection rule/i],
  ['Identity security', /identity|itdr|active directory|kerberos|entra|iam/i],
  ['Malware analysis', /malware|reverse engineering|sandbox|static analysis|dynamic analysis/i],
  ['AI security', /\bai\b|artificial intelligence|\bllm\b|rag|mcp|agentic/i],
  ['Offensive security', /offensive|penetration test|red team|exploit|attack simulation/i],
  ['Incident response', /incident response|\bir\b|forensic|containment/i],
  ['Cloud security', /cloud|aws|azure|gcp|kubernetes|container/i],
  ['Embedded security', /embedded|firmware|hardware|uefi|iot|bmc/i],
];

export function classifyTopics(urlValue, html) {
  const haystack = [
    normalizeSiteUrl(urlValue)?.pathname || '',
    resultTitle(html, urlValue),
    findMetaContent(html, 'description'),
    findMetaContent(html, 'keywords'),
  ].join(' ');
  const topics = TOPIC_RULES.filter(([, pattern]) => pattern.test(haystack)).map(([name]) => name);
  return topics.length ? topics.slice(0, 6) : ['Security research'];
}

function searchDate(html) {
  return html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/i)?.[1]
    || html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/i)?.[1]
    || findMetaContent(html, 'article:modified_time').match(/^\d{4}-\d{2}-\d{2}/)?.[0]
    || '';
}

function sourceName(catalogItem, canonicalUrl) {
  const sourceValue = catalogItem?.source_url || canonicalUrl;
  try {
    const source = new URL(sourceValue);
    const hostname = source.hostname.toLowerCase().replace(/^www\./, '');
    const labels = {
      '1200km.com': '1200km',
      'attack.mitre.org': 'MITRE ATT&CK',
      'github.com': 'GitHub',
      'medium.com': 'Medium',
      'infosecwriteups.com': 'InfoSec Write-ups',
      'pypi.org': 'PyPI',
    };
    return labels[hostname] || hostname;
  } catch {
    return '1200km';
  }
}

function contentVersion(catalogItem) {
  if (catalogItem?.version) return catalogItem.version;
  const appliesToVersion = catalogItem?.applies_to?.match(/\bv?\d+\.\d+(?:\.\d+)?\b/i)?.[0];
  return appliesToVersion || 'Not version-specific';
}

function resultTitle(html, urlValue) {
  const h1 = stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const title = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const entity = normalizeSiteUrl(urlValue)?.pathname.match(ENTITY_PATH);
  if (entity) {
    const identifier = decodeURIComponent(entity[2]).toUpperCase();
    const name = h1 || title.split('|')[0].trim();
    return name.toUpperCase().includes(identifier) ? name : `${identifier} — ${name}`;
  }
  return h1 || title || normalizeSiteUrl(urlValue)?.pathname || '1200km';
}

export function prepareHtmlForSearch(urlValue, html, catalogItem = null) {
  const url = normalizeSiteUrl(urlValue);
  if (!url) throw new Error(`Cannot prepare invalid URL: ${urlValue}`);

  const entity = url.pathname.match(ENTITY_PATH);
  const identifier = entity ? decodeURIComponent(entity[2]).toUpperCase() : '';
  const title = resultTitle(html, url.href).slice(0, 220);
  const description = findMetaContent(html, 'description').slice(0, 420);
  const aliases = extractAliases(html).join(', ').slice(0, 700);
  const collection = classifyUrl(url.href);
  const contentType = classifyContentType(url.href);
  const topics = classifyTopics(url.href, html);
  const date = catalogItem?.updated_at || catalogItem?.published_at || searchDate(html);
  const updatedYear = date?.match(/^\d{4}/)?.[0] || 'Unknown';
  const source = sourceName(catalogItem, url.href);
  const version = contentVersion(catalogItem);
  const metadata = [
    `<meta content="${escapeAttribute(title)}" data-pagefind-meta="title[content]">`,
    description ? `<meta content="${escapeAttribute(description)}" data-pagefind-meta="description[content]">` : '',
    identifier ? `<meta content="${escapeAttribute(identifier)}" data-pagefind-meta="identifier[content]">` : '',
    aliases ? `<meta content="${escapeAttribute(aliases)}" data-pagefind-meta="aliases[content]">` : '',
    `<meta content="${escapeAttribute(collection)}" data-pagefind-filter="section[content]" data-pagefind-meta="collection[content]">`,
    `<meta content="${escapeAttribute(contentType)}" data-pagefind-filter="content_type[content]" data-pagefind-meta="content_type[content]">`,
    catalogItem?.primary_type ? `<meta content="${escapeAttribute(catalogItem.primary_type)}" data-pagefind-filter="primary_type[content]" data-pagefind-meta="primary_type[content]">` : '',
    catalogItem?.primary_domain ? `<meta content="${escapeAttribute(catalogItem.primary_domain)}" data-pagefind-filter="primary_domain[content]" data-pagefind-meta="primary_domain[content]">` : '',
    catalogItem?.status ? `<meta content="${escapeAttribute(catalogItem.status)}" data-pagefind-filter="lifecycle[content]" data-pagefind-meta="lifecycle[content]">` : '',
    catalogItem?.status ? `<meta content="${escapeAttribute(catalogItem.status)}" data-pagefind-filter="status[content]" data-pagefind-meta="status[content]">` : '',
    catalogItem?.evidence_level ? `<meta content="${escapeAttribute(catalogItem.evidence_level)}" data-pagefind-filter="evidence_level[content]" data-pagefind-meta="evidence_level[content]">` : '',
    ...(catalogItem?.audience || []).map((audience) => `<meta content="${escapeAttribute(audience)}" data-pagefind-filter="audience[content]">`),
    catalogItem?.audience?.length ? `<meta content="${escapeAttribute(catalogItem.audience.join(', '))}" data-pagefind-meta="audience[content]">` : '',
    `<meta content="${escapeAttribute(version)}" data-pagefind-filter="version[content]" data-pagefind-meta="version[content]">`,
    `<meta content="${escapeAttribute(source)}" data-pagefind-filter="source[content]" data-pagefind-meta="source[content]">`,
    `<meta content="${escapeAttribute(updatedYear)}" data-pagefind-filter="updated_year[content]" data-pagefind-meta="updated_year[content]">`,
    ...topics.map((topic) => `<meta content="${escapeAttribute(topic)}" data-pagefind-filter="topic[content]">`),
    `<meta content="${escapeAttribute(topics.join(', '))}" data-pagefind-meta="topics[content]">`,
    date ? `<meta content="${escapeAttribute(date)}" data-pagefind-meta="date[content]">` : '',
  ].filter(Boolean).join('\n    ');

  // Do not create search-only anchors that are absent from a hydrated
  // Docusaurus page. Docusaurus emits stable heading IDs at build time.
  let prepared = /\bid=["']__docusaurus["']/i.test(html) ? html : addHeadingIds(html);
  prepared = prepared.replace(/<head\b[^>]*>/i, (tag) => `${tag}\n    ${metadata}`);
  prepared = markPagefindContent(prepared);
  return prepared;
}

export async function collectLocalSitemapUrls(root, entry = join(root, 'sitemap.xml')) {
  const pages = new Set();
  const visited = new Set();

  async function visit(reference) {
    const normalized = normalizeCanonical(reference) || reference;
    if (visited.has(normalized)) return;
    visited.add(normalized);

    let path = reference;
    if (/^https?:/i.test(reference)) {
      const url = normalizeSiteUrl(reference);
      if (!url) return;
      path = localFileForUrl(root, url.href);
      if (!path && url.pathname.endsWith('.xml')) path = join(root, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
    }
    if (!path || !existsSync(path)) return;
    const sitemap = parseSitemap(readFileSync(path, 'utf8'), SITE_ORIGIN);
    if (sitemap.isIndex) {
      for (const location of sitemap.locations) await visit(location);
    } else {
      sitemap.locations.forEach((location) => pages.add(location));
    }
  }

  await visit(entry);
  return pages;
}
