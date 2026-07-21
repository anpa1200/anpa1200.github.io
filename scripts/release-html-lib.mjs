import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

export const PERSON_ID = 'https://1200km.com/#person';
export const WEBSITE_ID = 'https://1200km.com/#website';

const WEB_PAGE_TYPES = new Set([
  'AboutPage',
  'CollectionPage',
  'ContactPage',
  'FAQPage',
  'ItemPage',
  'ProfilePage',
  'SearchResultsPage',
  'WebPage',
]);
const PRIMARY_ENTITY_TYPES = new Set([
  'Article',
  'BlogPosting',
  'CreativeWork',
  'Dataset',
  'FAQPage',
  'HowTo',
  'SoftwareApplication',
  'SoftwareSourceCode',
  'TechArticle',
]);

export function decodeEntities(value = '') {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)));
}

export function stripHtml(value = '') {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function tagAttributes(tag = '') {
  const attributes = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = pattern.exec(tag))) {
    const key = match[1].toLowerCase();
    if (!key || /^(?:img|meta|link|main|h[1-6])$/.test(key)) continue;
    attributes[key] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function escapeAttribute(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function slugifyHeading(value = '') {
  const slug = stripHtml(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
  return slug || 'section';
}

export function addHeadingIds(html) {
  const used = new Set(
    [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => decodeEntities(match[1])),
  );
  return html.replace(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, content) => {
    if (/\bid\s*=/i.test(attributes)) return full;
    const base = slugifyHeading(content);
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    return `<h${level}${attributes} id="${escapeAttribute(id)}">${content}</h${level}>`;
  });
}

export function markPagefindContent(html) {
  let foundMain = false;
  const withMain = html.replace(/<main\b([^>]*)>/gi, (tag, attributes) => {
    foundMain = true;
    if (/\bdata-pagefind-body\b/i.test(attributes)) return tag;
    return `<main${attributes} data-pagefind-body>`;
  });
  if (foundMain) return withMain;
  return withMain.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    if (/\bdata-pagefind-body\b/i.test(attributes)) return tag;
    return `<body${attributes} data-pagefind-body>`;
  });
}

function schemaTypes(value) {
  const type = value?.['@type'];
  return Array.isArray(type) ? type : typeof type === 'string' ? [type] : [];
}

export function parseJsonLd(html) {
  const objects = [];
  const failures = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) objects.push(...parsed);
      else if (Array.isArray(parsed?.['@graph'])) objects.push(...parsed['@graph']);
      else if (parsed && typeof parsed === 'object') objects.push(parsed);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return { objects, failures };
}

function cloneWithoutContext(value) {
  if (!value || typeof value !== 'object') return {};
  const clone = structuredClone(value);
  delete clone['@context'];
  return clone;
}

function firstObjectWithType(objects, wanted) {
  return objects.find((object) => schemaTypes(object).some((type) => wanted.has(type)));
}

function normalizeReferences(value) {
  if (Array.isArray(value)) return value.map(normalizeReferences);
  if (!value || typeof value !== 'object') return value;
  const types = schemaTypes(value);
  if (types.includes('Person') && value.name === 'Andrey Pautov') return { '@id': PERSON_ID };
  if (types.includes('WebSite') && (!value.url || value.url === 'https://1200km.com/')) return { '@id': WEBSITE_ID };
  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === '@context') continue;
    normalized[key] = normalizeReferences(child);
  }
  return normalized;
}

function pageTitle(html) {
  return stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || '1200km Security Research');
}

function metaContent(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = tagAttributes(match[0]);
    if ((attributes.name || '').toLowerCase() === key.toLowerCase()
      || (attributes.property || '').toLowerCase() === key.toLowerCase()) return attributes.content || '';
  }
  return '';
}

function breadcrumbName(url, titleMap) {
  return titleMap?.get(url) || decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || 'Home')
    .replace(/\.html$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildBreadcrumb(canonical, title, titleMap = new Map()) {
  const url = new URL(canonical);
  const parts = url.pathname.split('/').filter(Boolean);
  const candidates = ['https://1200km.com/'];
  let path = '';
  for (let index = 0; index < parts.length - 1; index += 1) {
    path += `/${parts[index]}`;
    const parent = `${url.origin}${path}/`;
    if (titleMap.has(parent)) candidates.push(parent);
  }
  if (canonical !== 'https://1200km.com/') candidates.push(canonical);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [...new Set(candidates)].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item === 'https://1200km.com/' ? 'Home' : item === canonical ? title : breadcrumbName(item, titleMap),
      item,
    })),
  };
}

export function buildConnectedGraph(html, { canonical, dateModified = '', titleMap = new Map() }) {
  const { objects, failures } = parseJsonLd(html);
  if (failures.length) throw new Error(`Invalid JSON-LD: ${failures.join('; ')}`);

  const title = pageTitle(html);
  const description = metaContent(html, 'description');
  const image = metaContent(html, 'og:image');
  const personSource = firstObjectWithType(objects, new Set(['Person'])) || {};
  const websiteSource = firstObjectWithType(objects, new Set(['WebSite'])) || {};
  const pageSource = firstObjectWithType(objects, WEB_PAGE_TYPES) || {};

  const person = {
    ...cloneWithoutContext(personSource),
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Andrey Pautov',
    url: 'https://1200km.com/',
    image: 'https://1200km.com/assets/ap-logo.png',
    jobTitle: personSource.jobTitle || 'Threat Intelligence Research Engineer',
    worksFor: personSource.worksFor || { '@type': 'Organization', name: 'XPLG' },
    sameAs: personSource.sameAs || [
      'https://github.com/anpa1200',
      'https://medium.com/@1200km',
      'https://www.linkedin.com/in/andrey-pautov/',
    ],
  };
  const website = {
    ...cloneWithoutContext(websiteSource),
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: websiteSource.name || '1200km Security Research',
    url: 'https://1200km.com/',
    publisher: { '@id': PERSON_ID },
    inLanguage: 'en',
  };

  const specializedPageType = schemaTypes(pageSource).find((type) => WEB_PAGE_TYPES.has(type) && type !== 'WebPage');
  const breadcrumb = buildBreadcrumb(canonical, title, titleMap);
  const page = {
    ...normalizeReferences(cloneWithoutContext(pageSource)),
    '@type': specializedPageType || 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: pageSource.name || pageSource.headline || title,
    ...(description ? { description } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    breadcrumb: { '@id': breadcrumb['@id'] },
    author: { '@id': PERSON_ID },
    inLanguage: pageSource.inLanguage || 'en',
  };
  if (image && !page.primaryImageOfPage) page.primaryImageOfPage = { '@type': 'ImageObject', url: image };
  if (dateModified && !page.dateModified) page.dateModified = dateModified;

  const excluded = new Set(['Person', 'WebSite', 'BreadcrumbList', ...WEB_PAGE_TYPES]);
  const primary = [];
  for (const object of objects) {
    const types = schemaTypes(object);
    if (!types.length || types.some((type) => excluded.has(type))) continue;
    const normalized = normalizeReferences(cloneWithoutContext(object));
    const ordinal = primary.length + 1;
    const suffix = types.some((type) => /Article|BlogPosting/.test(type)) ? 'article'
      : types.some((type) => /Software/.test(type)) ? 'software'
        : types.includes('FAQPage') ? 'faq' : `entity-${ordinal}`;
    normalized['@id'] = normalized['@id'] || `${canonical}#${suffix}`;
    if (types.some((type) => PRIMARY_ENTITY_TYPES.has(type))) {
      normalized.author = normalized.author || { '@id': PERSON_ID };
      normalized.mainEntityOfPage = normalized.mainEntityOfPage || { '@id': page['@id'] };
      if (dateModified && !normalized.dateModified) normalized.dateModified = dateModified;
    }
    primary.push(normalized);
  }

  if (specializedPageType === 'ProfilePage') page.mainEntity = { '@id': PERSON_ID };
  else if (primary.length) page.mainEntity = { '@id': primary[0]['@id'] };

  return {
    '@context': 'https://schema.org',
    '@graph': [person, website, page, breadcrumb, ...primary],
  };
}

export function replaceStructuredData(html, options) {
  const graph = buildConnectedGraph(html, options);
  const withoutJsonLd = html.replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const payload = JSON.stringify(graph, null, 2).replace(/<\/script/gi, '<\\/script');
  const script = `\n    <script type="application/ld+json" data-site-graph>\n${payload.split('\n').map((line) => `      ${line}`).join('\n')}\n    </script>\n`;
  // Use a callback so `$&`, `$\`` and `$'` sequences inside CTI descriptions
  // are treated as literal JSON content rather than replacement tokens.
  return withoutJsonLd.replace(/<\/head>/i, () => `${script}</head>`);
}

function imageDimensions(buffer, extension) {
  const ext = extension.toLowerCase();
  if (ext === '.png' && buffer.length >= 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (ext === '.gif' && buffer.length >= 10) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (ext === '.webp' && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    const format = buffer.toString('ascii', 12, 16);
    if (format === 'VP8X') {
      const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
      const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
      return { width, height };
    }
    if (format === 'VP8 ' && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (format === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

function localImagePath(src, htmlPath, siteRoot) {
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
  if (!path.startsWith(`${resolve(siteRoot)}/`) || !existsSync(path)) return null;
  return path;
}

export function addImageDimensions(html, { htmlPath, siteRoot }) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const attributes = tagAttributes(tag);
    if (!attributes.src || (attributes.width && attributes.height)) return tag;
    const path = localImagePath(attributes.src, htmlPath, siteRoot);
    if (!path) return tag;
    const dimensions = imageDimensions(readFileSync(path), extname(path));
    if (!dimensions?.width || !dimensions?.height) return tag;
    const additions = [
      attributes.width ? '' : ` width="${dimensions.width}"`,
      attributes.height ? '' : ` height="${dimensions.height}"`,
    ].join('');
    return tag.replace(/\s*\/?\s*>$/, (ending) => `${additions}${ending}`);
  });
}

export function addRssDiscovery(html) {
  if (/rel=["'][^"']*alternate[^"']*["'][^>]+application\/rss\+xml/i.test(html)
    || /type=["']application\/rss\+xml["'][^>]+rel=["'][^"']*alternate/i.test(html)) return html;
  return html.replace(/<\/head>/i, '    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />\n  </head>');
}

export function deferThirdPartyBoot(html) {
  let analyticsId = '';
  let transformed = html.replace(
    /\s*<script\b[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([^"'&]+)[^"']*["'][^>]*>\s*<\/script>/gi,
    (_, id) => {
      analyticsId ||= decodeEntities(id);
      return '';
    },
  );
  transformed = transformed.replace(
    /\s*<script\b(?![^>]*\bsrc=)[^>]*>(?:(?!<\/script>)[\s\S])*?\bgtag\s*\(\s*["']config["']\s*,\s*["'](G-[A-Z0-9]+)["'](?:(?!<\/script>)[\s\S])*?<\/script>/gi,
    (_, id) => {
      analyticsId ||= id;
      return '';
    },
  );

  // The local CSS already declares a professional system-font fallback stack.
  // Avoid a late web-font swap, which delays text LCP and causes needless work.
  transformed = transformed
    .replace(/\s*<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']+["'][^>]*>/gi, '')
    .replace(/\s*<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*>/gi, '')
    .replace(/\s*<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*rel=["']preconnect["'][^>]*>/gi, '');

  if (analyticsId && !/site-performance\.js/i.test(transformed)) {
    const performanceScript = `    <script src="/assets/site-performance.js"${analyticsId ? ` data-google-analytics-id="${escapeAttribute(analyticsId)}"` : ''} defer></script>\n`;
    transformed = transformed.replace(/<\/head>/i, () => `${performanceScript}</head>`);
  }
  return transformed;
}

export function transformReleaseHtml(html, options) {
  let transformed = deferThirdPartyBoot(html);
  // Docusaurus hydrates its server-rendered application tree. Mutating that
  // tree after the framework build creates avoidable React hydration errors.
  // Its headings already carry stable IDs; Pagefind adds its content marker to
  // an indexing-only copy instead of changing the deployed application DOM.
  const isDocusaurus = /\bid=["']__docusaurus["']/i.test(transformed);
  if (!isDocusaurus) {
    transformed = addHeadingIds(transformed);
    transformed = markPagefindContent(transformed);
    transformed = addImageDimensions(transformed, options);
  }
  transformed = addRssDiscovery(transformed);
  transformed = replaceStructuredData(transformed, options);
  return transformed;
}

export function connectedGraphFromHtml(html) {
  return parseJsonLd(html).objects;
}
