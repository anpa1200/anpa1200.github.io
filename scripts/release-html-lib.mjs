import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

export const PERSON_ID = 'https://1200km.com/#person';
export const WEBSITE_ID = 'https://1200km.com/#website';
export const SOFTWARE_ID = 'https://1200km.com/#software';

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
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'TechArticle']);

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

function replaceAttribute(tag, name, value) {
  const escaped = escapeAttribute(value);
  const pattern = new RegExp(`(\\b${name}\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, `$1"${escaped}"`);
  return tag.replace(/\s*\/?\s*>$/, (ending) => ` ${name}="${escaped}"${ending}`);
}

export function removeMetaKeywords(html) {
  return html.replace(/\s*<meta\b[^>]*>/gi, (tag) => (
    (tagAttributes(tag).name || '').toLowerCase() === 'keywords' ? '' : tag
  ));
}

export function normalizeSeoTitle(value = '') {
  let title = decodeEntities(stripHtml(value));
  title = title
    .replace(/\s*\|\s*AdversaryGraph Documentation\s*[—-]\s*CTI-to-Detection Workbench\s*\|\s*1200km\s*$/i, ' | AdversaryGraph Docs')
    .replace(/\s*\|\s*ITDR\s*[–—-]\s*Identity Threat Detection\s*&\s*Response\s*$/i, ' | ITDR')
    .replace(/\s*\|\s*1200km Security Research Articles\s*\|\s*1200km\s*$/i, ' | 1200km')
    .replace(/(?:\s*\|\s*1200km){2,}\s*$/i, ' | 1200km')
    .replace(/\s*\|\s*1200km\s*\|\s*AdversaryGraph Docs\s*$/i, ' | AdversaryGraph Docs')
    .replace(/^AdversaryGraph\s*[—-]\s*(.+)\s*\|\s*AdversaryGraph Docs$/i, '$1 | AdversaryGraph Docs')
    .replace(/^(ITDR\s*[–—-]\s*Identity Threat Detection\s*&\s*Response)\s*\|\s*ITDR$/i, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return title;
}

export function normalizeDocumentTitles(html) {
  let transformed = html.replace(/<title\b([^>]*)>([\s\S]*?)<\/title>/i, (full, attributes, title) => (
    `<title${attributes}>${escapeHtml(normalizeSeoTitle(title))}</title>`
  ));
  transformed = transformed.replace(/<meta\b[^>]*>/gi, (tag) => {
    const attributes = tagAttributes(tag);
    const key = (attributes.property || attributes.name || '').toLowerCase();
    if (!['og:title', 'twitter:title'].includes(key) || !attributes.content) return tag;
    return replaceAttribute(tag, 'content', normalizeSeoTitle(attributes.content));
  });
  return transformed;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function markPagefindContent(html, weight = null) {
  const weightAttribute = Number.isFinite(weight) ? ` data-pagefind-weight="${weight.toFixed(2)}"` : '';
  function mark(tag, attributes, name) {
    let next = attributes;
    if (!/\bdata-pagefind-body\b/i.test(next)) next += ' data-pagefind-body';
    if (weightAttribute && !/\bdata-pagefind-weight\s*=/i.test(next)) next += weightAttribute;
    return `<${name}${next}>`;
  }
  let foundMain = false;
  const withMain = html.replace(/<main\b([^>]*)>/gi, (tag, attributes) => {
    foundMain = true;
    return mark(tag, attributes, 'main');
  });
  if (foundMain) return withMain;
  return withMain.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    return mark(tag, attributes, 'body');
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

function findNestedObject(value, predicate) {
  if (!value || typeof value !== 'object') return null;
  if (predicate(value)) return value;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findNestedObject(item, predicate);
        if (found) return found;
      }
    } else if (child && typeof child === 'object') {
      const found = findNestedObject(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

function isQuestion(value) {
  return value && typeof value === 'object'
    && schemaTypes(value).includes('Question')
    && typeof value.name === 'string'
    && value.name.trim()
    && value.acceptedAnswer
    && schemaTypes(value.acceptedAnswer).includes('Answer')
    && typeof value.acceptedAnswer.text === 'string'
    && value.acceptedAnswer.text.trim();
}

function isValidFaqPage(value) {
  const entities = Array.isArray(value?.mainEntity) ? value.mainEntity : [value?.mainEntity].filter(Boolean);
  return entities.length > 0 && entities.every(isQuestion);
}

function normalizeReferences(value, preserveEntity = false) {
  if (Array.isArray(value)) return value.map((child) => normalizeReferences(child));
  if (!value || typeof value !== 'object') return value;
  const types = schemaTypes(value);
  if (!preserveEntity && types.includes('Person') && value.name === 'Andrey Pautov') return { '@id': PERSON_ID };
  if (!preserveEntity && types.includes('WebSite') && (!value.url || value.url === 'https://1200km.com/')) return { '@id': WEBSITE_ID };
  if (!preserveEntity && types.some((type) => ['SoftwareApplication', 'SoftwareSourceCode'].includes(type))
    && value.name === 'AdversaryGraph') return { '@id': SOFTWARE_ID };
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

function articleDocument(html, canonical, objects) {
  if (objects.some((object) => schemaTypes(object).some((type) => ARTICLE_TYPES.has(type)))) return true;
  const pathname = new URL(canonical).pathname;
  return /^\/articles\/read\/\d{4}\/[^/]+\/?$/i.test(pathname)
    || /^\/articles\/[^/]+\.html$/i.test(pathname);
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

export function buildConnectedGraph(html, {
  canonical,
  datePublished = '',
  dateModified = '',
  titleMap = new Map(),
}) {
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
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    inLanguage: 'en',
  };

  const specializedPageType = schemaTypes(pageSource).find((type) => (
    WEB_PAGE_TYPES.has(type)
    && type !== 'WebPage'
    && (type !== 'FAQPage' || isValidFaqPage(pageSource))
    && (type !== 'ProfilePage'
      || /^https:\/\/1200km\.com\/(?:about|cv)\.html$/i.test(canonical)
      || pageSource.mainEntity?.['@id'] === PERSON_ID)
  ));
  const breadcrumb = buildBreadcrumb(canonical, title, titleMap);
  const page = {
    ...normalizeReferences(cloneWithoutContext(pageSource)),
    '@type': specializedPageType || 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    ...(description ? { description } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    breadcrumb: { '@id': breadcrumb['@id'] },
    author: { '@id': PERSON_ID },
    inLanguage: pageSource.inLanguage || 'en',
  };
  if (image && !page.primaryImageOfPage) page.primaryImageOfPage = { '@type': 'ImageObject', url: image };
  if (dateModified) page.dateModified = dateModified;
  if (specializedPageType !== 'FAQPage' && schemaTypes(pageSource).includes('FAQPage')) delete page.mainEntity;

  const excluded = new Set(['Person', 'WebSite', 'BreadcrumbList', ...WEB_PAGE_TYPES]);
  const sourcePrimary = objects.filter((object) => {
    const types = schemaTypes(object);
    return types.length && !types.some((type) => excluded.has(type));
  });
  if (!sourcePrimary.length && articleDocument(html, canonical, objects)) {
    sourcePrimary.push({ '@type': 'TechArticle' });
  }
  const primary = [];
  const usedIds = new Set([PERSON_ID, WEBSITE_ID, page['@id'], breadcrumb['@id']]);
  for (const object of sourcePrimary) {
    const types = schemaTypes(object);
    const normalized = normalizeReferences(cloneWithoutContext(object), true);
    const ordinal = primary.length + 1;
    const isArticle = types.some((type) => ARTICLE_TYPES.has(type));
    const isAdversaryGraph = types.some((type) => /Software/.test(type))
      && (normalized.name === 'AdversaryGraph' || normalized['@id'] === SOFTWARE_ID);
    const suffix = isArticle ? 'article'
      : types.some((type) => /Software/.test(type)) ? 'software'
        : types.includes('FAQPage') ? 'faq' : `entity-${ordinal}`;
    let entityId = isAdversaryGraph ? SOFTWARE_ID : (normalized['@id'] || `${canonical}#${suffix}`);
    if (usedIds.has(entityId)) {
      let sequence = 2;
      const base = `${canonical}#${suffix}`;
      entityId = base;
      while (usedIds.has(entityId)) entityId = `${base}-${sequence++}`;
    }
    normalized['@id'] = entityId;
    usedIds.add(entityId);
    if (types.some((type) => PRIMARY_ENTITY_TYPES.has(type))) {
      normalized.author = normalized.author || { '@id': PERSON_ID };
      normalized.publisher = normalized.publisher || { '@id': PERSON_ID };
      normalized.mainEntityOfPage = { '@id': page['@id'] };
      if (dateModified) normalized.dateModified = dateModified;
    }
    if (isArticle) {
      normalized.url = canonical;
      normalized.headline = title;
      if (description) normalized.description = description;
      if (image && !normalized.image) normalized.image = image;
      if (datePublished) normalized.datePublished = datePublished;
    }
    primary.push(normalized);
  }

  if (specializedPageType === 'ProfilePage') page.mainEntity = { '@id': PERSON_ID };
  else if (specializedPageType !== 'FAQPage' && primary.length) page.mainEntity = { '@id': primary[0]['@id'] };

  const related = [];
  const referencesSoftware = JSON.stringify([page, primary]).includes(`"@id":"${SOFTWARE_ID}"`);
  if (referencesSoftware && !usedIds.has(SOFTWARE_ID)) {
    const embeddedSoftware = findNestedObject(objects, (object) => (
      schemaTypes(object).some((type) => ['SoftwareApplication', 'SoftwareSourceCode'].includes(type))
      && object.name === 'AdversaryGraph'
    ));
    related.push({
      ...(embeddedSoftware ? normalizeReferences(cloneWithoutContext(embeddedSoftware), true) : {}),
      '@type': 'SoftwareApplication',
      '@id': SOFTWARE_ID,
      name: 'AdversaryGraph',
      url: embeddedSoftware?.url || 'https://1200km.com/adversarygraph/',
      applicationCategory: embeddedSoftware?.applicationCategory || 'SecurityApplication',
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [person, website, page, breadcrumb, ...primary, ...related],
  };
}

export function replaceStructuredData(html, options) {
  const graph = buildConnectedGraph(html, options);
  let withoutJsonLd = html.replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const article = graph['@graph'].find((object) => schemaTypes(object).some((type) => ARTICLE_TYPES.has(type)));
  if (article?.datePublished) withoutJsonLd = upsertMeta(withoutJsonLd, 'property', 'article:published_time', article.datePublished);
  if (article?.dateModified) withoutJsonLd = upsertMeta(withoutJsonLd, 'property', 'article:modified_time', article.dateModified);
  const payload = JSON.stringify(graph, null, 2).replace(/<\/script/gi, '<\\/script');
  const script = `\n    <script type="application/ld+json" data-site-graph>\n${payload.split('\n').map((line) => `      ${line}`).join('\n')}\n    </script>\n`;
  // Use a callback so `$&`, `$\`` and `$'` sequences inside CTI descriptions
  // are treated as literal JSON content rather than replacement tokens.
  return withoutJsonLd.replace(/[ \t]*<\/head>/i, () => `${script}</head>`);
}

function upsertMeta(html, attribute, key, content) {
  let found = false;
  const transformed = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    const attributes = tagAttributes(tag);
    if ((attributes[attribute] || '').toLowerCase() !== key.toLowerCase()) return tag;
    if (found) return '';
    found = true;
    return replaceAttribute(tag, 'content', content);
  });
  if (found) return transformed;
  const meta = `    <meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />\n`;
  return transformed.replace(/<\/head>/i, () => `${meta}</head>`);
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
  transformed = removeMetaKeywords(transformed);
  transformed = normalizeDocumentTitles(transformed);
  // Keep release-owned browser enhancements on the same origin. Checked-in
  // Docusaurus output historically used an absolute production URL, which made
  // local/staged accessibility tests execute the previously deployed script.
  transformed = transformed.replace(
    /(["'])https:\/\/1200km\.com\/assets\/docusaurus-ecosystem\.js(\?[^"']*)?\1/gi,
    '$1/assets/docusaurus-ecosystem.js$2$1',
  );
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
