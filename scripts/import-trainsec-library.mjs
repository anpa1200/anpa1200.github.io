import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  TRAINSEC_EXPECTED_ARTICLE_COUNT,
  buildTrainsecCanonicalEntries,
  isAuthorizedTrainsecCanonical,
} from './trainsec-canonical-lib.mjs';

const root = process.cwd();
const dataPath = path.join(root, 'data', 'trainsec-library.json');
const outputRoot = path.join(root, 'articles', 'trainsec');
const coverRoot = path.join(root, 'assets', 'trainsec', 'covers');
const mediaRoot = path.join(root, 'assets', 'trainsec', 'media');
const siteOrigin = 'https://1200km.com';
const retrievedAt = new Date().toISOString().slice(0, 10);
const metadataOnly = process.argv.slice(2).includes('--metadata-only');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const calendarMonths = new Map([
  ['january', 1], ['february', 2], ['march', 3], ['april', 4],
  ['may', 5], ['june', 6], ['july', 7], ['august', 8],
  ['september', 9], ['october', 10], ['november', 11], ['december', 12],
]);

function calendarDateIso(value) {
  const isoMatch = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
      ? isoMatch[0]
      : '';
  }
  const match = String(value || '').trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return '';
  const month = calendarMonths.get(match[1].toLowerCase());
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!month || day < 1 || day > 31 || year < 1) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function trainsecImageUrl(article) {
  if (!article.image) return '';
  let image;
  try {
    image = new URL(article.image);
  } catch {
    throw new Error(`TrainSec image URL is invalid: ${article.image}`);
  }
  if (image.protocol !== 'https:' || image.hostname !== 'trainsec.net' || image.username || image.password || image.hash
    || image.href !== article.image) {
    throw new Error(`TrainSec image URL is not an exact authorized TrainSec URL: ${article.image}`);
  }
  return image.href;
}

function headingSlug(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|#38);/gi, ' and ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '') || 'section';
}

function addStableHeadingIds(html) {
  const used = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]));
  return html.replace(/<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, content) => {
    if (/\bid\s*=/i.test(attributes)) return full;
    const base = headingSlug(content);
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    return `<h${level}${attributes} id="${escapeHtml(id)}">${content}</h${level}>`;
  });
}

function slugFor(article) {
  const pathname = new URL(article.url).pathname.replace(/^\/library\//, '').replace(/\/+$/, '');
  return pathname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function findElementorContent(html) {
  const marker = html.indexOf('elementor-widget-theme-post-content');
  let open = marker >= 0 ? html.indexOf('<div class="elementor-widget-container"', marker) : -1;
  if (open < 0) {
    const fallback = html.search(/<div[^>]+class="[^"]*(?:entry-content|post-content)[^"]*"[^>]*>/i);
    open = fallback;
  }
  if (open < 0) return '';
  const openEnd = html.indexOf('>', open);
  if (openEnd < 0) return '';
  let depth = 1;
  let cursor = openEnd + 1;
  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = cursor;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('</')) depth -= 1;
    else if (!match[0].endsWith('/>')) depth += 1;
    if (depth === 0) return html.slice(openEnd + 1, match.index);
  }
  return html.slice(openEnd + 1);
}

function attributeValue(attrs, name) {
  return attrs.match(new RegExp(`\\s${name}=("|')([^"']*)\\1`, 'i'))?.[2] || '';
}

function youtubeIdFrom(src) {
  return src.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i)?.[1] || '';
}

function stripUnsafeBlocks(value) {
  let out = value;
  for (const tag of ['script', 'style', 'form', 'noscript']) {
    let lower = out.toLowerCase();
    let start = lower.indexOf(`<${tag}`);
    while (start >= 0) {
      const openEnd = lower.indexOf('>', start);
      if (openEnd < 0) break;
      const closeStart = lower.indexOf(`</${tag}`, openEnd + 1);
      if (closeStart < 0) {
        out = out.slice(0, start);
        break;
      }
      const closeEnd = lower.indexOf('>', closeStart);
      if (closeEnd < 0) break;
      out = out.slice(0, start) + out.slice(closeEnd + 1);
      lower = out.toLowerCase();
      start = lower.indexOf(`<${tag}`);
    }
  }
  return out;
}

function normalizeMedia(body, article) {
  let out = stripUnsafeBlocks(body)
    .replace(/<((?:img|iframe)\b)([^>]*?)(\/?)>/gi, (full, tagName, attrs, slash) => {
      const valueOf = (name) => {
        const match = attrs.match(new RegExp(`\\s${name}=("|')([^"']*)\\1`, 'i'));
        return match?.[2] || '';
      };
      const lazySrc = valueOf('data-lazy-src') || valueOf('data-src');
      const lazySrcset = valueOf('data-lazy-srcset');
      const lazySizes = valueOf('data-lazy-sizes');
      let clean = attrs
        .replace(/\sdata-lazy-srcset=("|')[^"']*\1/gi, '')
        .replace(/\sdata-lazy-sizes=("|')[^"']*\1/gi, '')
        .replace(/\sdata-lazy-src=("|')[^"']*\1/gi, '')
        .replace(/\sdata-src=("|')[^"']*\1/gi, '');
      if (lazySrc) clean = clean.replace(/\ssrc=(?:"[^"]*"|'[^']*')/gi, '') + ` src="${lazySrc}"`;
      if (lazySrcset) clean = clean.replace(/\ssrcset=(?:"[^"]*"|'[^']*')/gi, '') + ` srcset="${lazySrcset}"`;
      if (lazySizes) clean = clean.replace(/\ssizes=(?:"[^"]*"|'[^']*')/gi, '') + ` sizes="${lazySizes}"`;
      return `<${tagName}${clean}${slash}>`;
    });
  // Elementor reuses widget IDs across the page (especially in author and
  // promotional blocks). They are presentation metadata, not article
  // anchors; remove them so each local document remains semantically valid.
  out = out.replace(/\s+id=(?:"[^"]*"|'[^']*')/gi, '');
  out = out.replace(/\s+data-(?:elementor-)?id=(?:"[^"]*"|'[^']*')/gi, '');
  // The source template mixes visual heading levels with its surrounding
  // Elementor layout. Keep the original heading text while making the local
  // article hierarchy valid beneath the page H1.
  out = out.replace(/<h[1-6](\b[^>]*)>/gi, '<h2$1>').replace(/<\/h[1-6]>/gi, '</h2>');
  // Use the privacy-preserving YouTube host and provide a visible source link
  // when a browser, extension, or network policy cannot render an iframe.
  out = out.replace(/<iframe\b([\s\S]*?)><\/iframe>/gi, (full, attrs) => {
    const videoId = youtubeIdFrom(attributeValue(attrs, 'src'));
    if (!videoId) return full;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    let clean = attrs
      .replace(/\ssrc=(?:"[^"]*"|'[^']*')/i, '')
      .replace(/\sloading=(?:"[^"]*"|'[^']*')/i, '')
      .replace(/\stitle=(?:"[^"]*"|'[^']*')/i, '');
    clean += ` src="${embedUrl}" loading="eager" title="${escapeHtml(article.title)}"`;
    return `<div class="video-embed"><iframe${clean}></iframe><p class="video-fallback"><a href="${watchUrl}" target="_blank" rel="noopener noreferrer">If the player does not load, watch this video on YouTube ↗</a></p></div>`;
  });
  return out;
}

function rewriteSourceLinks(body) {
  return body.replace(/(href|src)=("|')\/(?!\/)/g, '$1=$2https://trainsec.net/');
}

function localPathFor(article) {
  return `/articles/trainsec/${slugFor(article)}.html`;
}

function imageExtension(url, contentType = '') {
  const fromType = contentType.toLowerCase().match(/image\/(jpeg|jpg|png|gif|webp|svg\+xml|avif)/)?.[1];
  if (fromType) return fromType === 'svg+xml' ? 'svg' : fromType === 'jpeg' ? 'jpg' : fromType;
  const fromUrl = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(fromUrl) ? (fromUrl === 'jpeg' ? 'jpg' : fromUrl) : 'jpg';
}

async function downloadCover(url, article) {
  if (!url) return '';
  try {
    const response = await fetch(url, { headers: { 'user-agent': '1200km-TrainSec-permitted-import/1.0' } });
    if (!response.ok) return '';
    const extension = imageExtension(url, response.headers.get('content-type') || 'image/jpeg');
    const filename = `${slugFor(article)}.${extension}`;
    await fs.writeFile(path.join(coverRoot, filename), Buffer.from(await response.arrayBuffer()));
    return `/assets/trainsec/covers/${filename}`;
  } catch {
    return '';
  }
}

const mediaCache = new Map();
async function localMediaPath(url) {
  const cleanUrl = url.replaceAll('&amp;', '&');
  if (!/^https?:\/\//i.test(cleanUrl)) return '';
  if (!mediaCache.has(cleanUrl)) {
    mediaCache.set(cleanUrl, (async () => {
      try {
        const response = await fetch(cleanUrl, { headers: { 'user-agent': '1200km-TrainSec-permitted-import/1.0' } });
        if (!response.ok) return '';
        const extension = imageExtension(cleanUrl, response.headers.get('content-type') || 'image/jpeg');
        const hash = crypto.createHash('sha1').update(cleanUrl).digest('hex').slice(0, 16);
        const filename = `${hash}.${extension}`;
        await fs.writeFile(path.join(mediaRoot, filename), Buffer.from(await response.arrayBuffer()));
        return `/assets/trainsec/media/${filename}`;
      } catch {
        return '';
      }
    })());
  }
  return mediaCache.get(cleanUrl);
}

async function localizeBodyImages(html) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  const replacements = await Promise.all(images.map(async ([tag]) => {
    const src = attributeValue(tag, 'src');
    const local = await localMediaPath(src);
    if (!local) return [tag, tag];
    const next = tag
      .replace(/\ssrc=(?:"[^"]*"|'[^']*')/i, ` src="${local}"`)
      .replace(/\ssrcset=(?:"[^"]*"|'[^']*')/i, '')
      .replace(/\ssizes=(?:"[^"]*"|'[^']*')/i, '');
    return [tag, next];
  }));
  return replacements.reduce((output, [before, after]) => output.replace(before, after), html);
}

function siteArticleJsonLd(canonical, headline, datePublished = retrievedAt, source = '') {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonical}#article`,
    url: canonical,
    headline,
    author: { '@id': 'https://1200km.com/#person' },
    publisher: { '@id': 'https://1200km.com/#person' },
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    datePublished,
    dateModified: retrievedAt,
    ...(source ? { isBasedOn: source } : {}),
  }).replaceAll('<', '\\u003c');
}

function trainsecArticleJsonLd(article, canonical, datePublished) {
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: article.title,
        mainEntity: { '@id': articleId },
      },
      {
        '@type': 'Article',
        '@id': articleId,
        url: canonical,
        headline: article.title,
        author: { '@type': 'Person', name: article.author },
        publisher: { '@type': 'Organization', name: 'TrainSec', url: 'https://trainsec.net/' },
        mainEntityOfPage: { '@id': webpageId },
        datePublished,
        isBasedOn: canonical,
      },
    ],
  }).replaceAll('<', '\\u003c');
}

function matchingTags(html, tagName, predicate) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))]
    .map((match) => match[0])
    .filter(predicate);
}

function oneTag(html, tagName, predicate, label) {
  const matches = matchingTags(html, tagName, predicate);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches.length}.`);
  return matches[0];
}

function replaceOneLiteral(html, before, after, label) {
  const first = html.indexOf(before);
  if (first < 0 || html.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Could not replace exactly one ${label}.`);
  }
  return `${html.slice(0, first)}${after}${html.slice(first + before.length)}`;
}

function insertBeforeHeadClose(html, value) {
  const matches = [...html.matchAll(/<\/head>/gi)];
  if (matches.length !== 1) throw new Error(`Expected exactly one closing head tag; found ${matches.length}.`);
  return `${html.slice(0, matches[0].index)}${value}\n${html.slice(matches[0].index)}`;
}

function upsertMeta(html, attribute, key, content) {
  const matches = matchingTags(
    html,
    'meta',
    (tag) => attributeValue(tag, attribute).toLowerCase() === key.toLowerCase(),
  );
  if (matches.length > 1) throw new Error(`Expected at most one ${key} metadata tag; found ${matches.length}.`);
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}">`;
  return matches.length ? replaceOneLiteral(html, matches[0], tag, `${key} metadata tag`) : insertBeforeHeadClose(html, tag);
}

function removeMeta(html, attribute, key) {
  const matches = matchingTags(
    html,
    'meta',
    (tag) => attributeValue(tag, attribute).toLowerCase() === key.toLowerCase(),
  );
  if (matches.length > 1) throw new Error(`Expected at most one ${key} metadata tag; found ${matches.length}.`);
  return matches.length ? replaceOneLiteral(html, matches[0], '', `${key} metadata tag`) : html;
}

function ensureRssDiscovery(html) {
  const matches = matchingTags(html, 'link', (tag) => (
    attributeValue(tag, 'rel').toLowerCase().split(/\s+/).includes('alternate')
      && attributeValue(tag, 'type').toLowerCase() === 'application/rss+xml'
  ));
  if (matches.length > 1) throw new Error(`Expected at most one RSS discovery link; found ${matches.length}.`);
  const tag = '<link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml">';
  return matches.length ? replaceOneLiteral(html, matches[0], tag, 'RSS discovery link') : insertBeforeHeadClose(html, tag);
}

function ensurePagefindIgnored(html) {
  let output = html.replace(/\sdata-pagefind-body(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
  const main = oneTag(output, 'main', () => true, 'main element');
  const ignorePattern = /\sdata-pagefind-ignore(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi;
  const ignoreAttributes = [...main.matchAll(ignorePattern)];
  if (ignoreAttributes.length > 1) throw new Error(`Expected at most one Pagefind ignore attribute; found ${ignoreAttributes.length}.`);
  const normalizedMain = ignoreAttributes.length
    ? main.replace(ignorePattern, ' data-pagefind-ignore="all"')
    : main.replace(/>$/, ' data-pagefind-ignore="all">');
  return replaceOneLiteral(output, main, normalizedMain, 'main element');
}

function enhanceTrainsecReleaseMetadata(html, article) {
  const description = article.excerpt || `${article.title} by ${article.author}, republished from TrainSec.net with permission.`;
  const image = trainsecImageUrl(article);
  let output = html;
  output = removeMeta(output, 'name', 'keywords');
  output = upsertMeta(output, 'property', 'og:site_name', 'TrainSec');
  output = upsertMeta(output, 'property', 'og:description', description);
  output = upsertMeta(output, 'name', 'twitter:card', 'summary_large_image');
  output = upsertMeta(output, 'name', 'twitter:title', article.title);
  output = upsertMeta(output, 'name', 'twitter:description', description);
  if (image) {
    const alt = `Cover image for ${article.title}`;
    output = upsertMeta(output, 'property', 'og:image', image);
    output = upsertMeta(output, 'property', 'og:image:alt', alt);
    output = upsertMeta(output, 'name', 'twitter:image', image);
    output = upsertMeta(output, 'name', 'twitter:image:alt', alt);
  }
  output = ensureRssDiscovery(output);
  output = ensurePagefindIgnored(output);
  return addStableHeadingIds(output);
}

function metadataOnlyPage(article, canonicalEntry, html) {
  const { canonical_url: canonical, local_url: localMirror } = canonicalEntry;
  if (article.url !== canonical || !isAuthorizedTrainsecCanonical(localMirror, canonical)) {
    throw new Error('Manifest canonical mapping is not authorized.');
  }
  if (!html.includes(`<h1>${escapeHtml(article.title)}</h1>`)) {
    throw new Error('Visible H1 does not match the manifest title.');
  }
  if (!html.includes(`<strong>Published:</strong> ${escapeHtml(article.date)}`)) {
    throw new Error('Visible publication date does not match the manifest date.');
  }

  const sourceTag = oneTag(
    html,
    'meta',
    (tag) => attributeValue(tag, 'name').toLowerCase() === 'trainsec-source',
    'TrainSec source metadata tag',
  );
  if (attributeValue(sourceTag, 'content') !== canonical) throw new Error('TrainSec source metadata disagrees with the manifest.');

  const canonicalTag = oneTag(
    html,
    'link',
    (tag) => attributeValue(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'),
    'canonical link',
  );
  const priorCanonical = attributeValue(canonicalTag, 'href');
  if (![localMirror, canonical].includes(priorCanonical)) {
    throw new Error(`Existing canonical is neither the authorized mirror nor source URL: ${priorCanonical || '(missing)'}`);
  }

  const ogUrlTag = oneTag(
    html,
    'meta',
    (tag) => attributeValue(tag, 'property').toLowerCase() === 'og:url',
    'Open Graph URL tag',
  );
  const priorOgUrl = attributeValue(ogUrlTag, 'content');
  if (![localMirror, canonical].includes(priorOgUrl)) {
    throw new Error(`Existing og:url is neither the authorized mirror nor source URL: ${priorOgUrl || '(missing)'}`);
  }

  const authorTags = [
    oneTag(
      html,
      'meta',
      (tag) => attributeValue(tag, 'name').toLowerCase() === 'author',
      'author metadata tag',
    ),
    oneTag(
      html,
      'meta',
      (tag) => attributeValue(tag, 'name').toLowerCase() === 'trainsec-author',
      'TrainSec author metadata tag',
    ),
  ];

  const publishedTag = oneTag(
    html,
    'meta',
    (tag) => attributeValue(tag, 'property').toLowerCase() === 'article:published_time',
    'article publication date tag',
  );
  const jsonLdTag = oneTag(
    html,
    'script',
    (tag) => attributeValue(tag, 'type').toLowerCase() === 'application/ld+json',
    'JSON-LD script',
  );
  const jsonLdClose = html.indexOf('</script>', html.indexOf(jsonLdTag) + jsonLdTag.length);
  if (jsonLdClose < 0) throw new Error('JSON-LD script is not closed.');
  const jsonLdBlock = html.slice(html.indexOf(jsonLdTag), jsonLdClose + '</script>'.length);

  const publishedIso = calendarDateIso(article.date);
  if (!publishedIso) throw new Error(`Unsupported TrainSec publication date: ${article.date || '(missing)'}`);

  let output = html;
  output = replaceOneLiteral(output, canonicalTag, `<link rel="canonical" href="${escapeHtml(canonical)}">`, 'canonical link');
  output = replaceOneLiteral(output, ogUrlTag, `<meta property="og:url" content="${escapeHtml(canonical)}">`, 'Open Graph URL tag');
  output = replaceOneLiteral(output, publishedTag, `<meta property="article:published_time" content="${publishedIso}">`, 'article publication date tag');
  for (const tag of authorTags) {
    const name = attributeValue(tag, 'name').toLowerCase();
    output = replaceOneLiteral(output, tag, `<meta name="${name}" content="${escapeHtml(article.author)}">`, `${name} metadata tag`);
  }
  const mirrorTags = matchingTags(output, 'meta', (tag) => attributeValue(tag, 'name').toLowerCase() === 'trainsec-mirror');
  if (mirrorTags.length > 1) throw new Error(`Expected at most one TrainSec mirror metadata tag; found ${mirrorTags.length}.`);
  if (mirrorTags.length === 1) {
    const previousMirror = attributeValue(mirrorTags[0], 'content');
    if (previousMirror !== localMirror) throw new Error('TrainSec mirror metadata disagrees with the manifest.');
    output = replaceOneLiteral(output, mirrorTags[0], `<meta name="trainsec-mirror" content="${escapeHtml(localMirror)}">`, 'TrainSec mirror metadata tag');
  } else {
    output = replaceOneLiteral(output, sourceTag, `${sourceTag}<meta name="trainsec-mirror" content="${escapeHtml(localMirror)}">`, 'TrainSec source metadata tag');
  }
  output = replaceOneLiteral(
    output,
    jsonLdBlock,
    `<script type="application/ld+json">${trainsecArticleJsonLd(article, canonical, publishedIso)}</script>`,
    'JSON-LD block',
  );
  return enhanceTrainsecReleaseMetadata(output, article);
}

async function updateExistingTrainsecMetadata(payload, canonicalEntries) {
  const expectedFiles = canonicalEntries.map((entry) => path.basename(entry.local_path)).sort();
  const actualFiles = (await fs.readdir(outputRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && !['authors.html', 'domains.html'].includes(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(`TrainSec mirror file set mismatch: expected ${expectedFiles.length}, found ${actualFiles.length}.`);
  }

  const articleByLocalPath = new Map(payload.articles.map((article) => [article.local_path, article]));
  const pendingWrites = [];
  for (const entry of canonicalEntries) {
    const article = articleByLocalPath.get(entry.local_path);
    if (!article) throw new Error(`No manifest article found for ${entry.local_path}.`);
    const target = path.resolve(root, `.${entry.local_path}`);
    if (!target.startsWith(`${path.resolve(outputRoot)}${path.sep}`)) throw new Error(`Unsafe TrainSec mirror path: ${entry.local_path}`);
    const html = await fs.readFile(target, 'utf8');
    try {
      pendingWrites.push([target, metadataOnlyPage(article, entry, html)]);
    } catch (error) {
      throw new Error(`${entry.local_path}: ${error.message || error}`);
    }
  }

  // Validation above is intentionally complete before the first write so a
  // mismatched manifest or page cannot leave a partially migrated corpus.
  for (const [target, html] of pendingWrites) await fs.writeFile(target, html);
  return pendingWrites.length;
}

function relatedMarkup(article, articles) {
  const related = articles
    .filter((candidate) => candidate.url !== article.url)
    .sort((a, b) => {
      const score = (candidate) => (candidate.author === article.author ? 2 : 0) + (candidate.domain === article.domain ? 1 : 0);
      return score(b) - score(a) || a.title.localeCompare(b.title);
    })
    .slice(0, 4);
  if (!related.length) return '';
  return `<section class="related-links" aria-labelledby="related-heading"><h2 id="related-heading">Related TrainSec publications</h2><ul>${related.map((candidate) => `<li><a href="${localPathFor(candidate)}">${escapeHtml(candidate.title)}</a> <span>(${escapeHtml(candidate.author)})</span></li>`).join('')}</ul></section>`;
}

function pageFor(article, body, localPath, allArticles, canonicalEntry) {
  const title = escapeHtml(article.title);
  const seoTitle = escapeHtml(article.title.length > 78 ? `${article.title.slice(0, 75).replace(/[\s,:;]+$/, '')}…` : article.title);
  const author = escapeHtml(article.author);
  const date = escapeHtml(article.date);
  const category = escapeHtml(article.domain || article.category);
  const mode = escapeHtml(article.mode || 'Article');
  const canonical = canonicalEntry?.canonical_url || '';
  const localMirror = canonicalEntry?.local_url || '';
  if (!isAuthorizedTrainsecCanonical(localMirror, canonical) || canonical !== article.url) {
    throw new Error(`TrainSec canonical mapping is not authorized for ${localPath}.`);
  }
  const source = escapeHtml(canonical);
  const mirror = escapeHtml(localMirror);
  const publishedIso = calendarDateIso(article.date);
  if (!publishedIso) throw new Error(`Unsupported TrainSec publication date for ${localPath}: ${article.date || '(missing)'}`);
  const rights = `All rights reserved. Rights belong to TrainSec.net and ${author}. 1200km.com is the publishing platform. Published with permission from the TrainSec rights holders.`;
  const tags = (article.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  const html = `<!doctype html>
<html lang="en" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${seoTitle} — TrainSec article | 1200km</title>
<meta name="description" content="${escapeHtml(article.excerpt || `${article.title} by ${article.author}, republished from TrainSec.net with permission.`)}">
<meta name="author" content="${author}"><meta name="trainsec-author" content="${author}"><meta name="trainsec-source" content="${source}"><meta name="trainsec-mirror" content="${mirror}">
<meta property="article:published_time" content="${publishedIso}">
<link rel="canonical" href="${source}">
<meta property="og:type" content="article"><meta property="og:title" content="${seoTitle}"><meta property="og:url" content="${source}">
<script type="application/ld+json">${trainsecArticleJsonLd(article, canonical, publishedIso)}</script>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050c1a;color:#dbe7fb;font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(1040px,calc(100% - 32px));margin:auto}.site-header{border-bottom:1px solid #1a3060}.site-header .wrap{display:flex;align-items:center;justify-content:space-between;min-height:68px;gap:18px}.brand{color:#eef5ff;text-decoration:none;font-weight:700}.brand small{display:block;color:#8fa8cf;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{color:#a9c0e4;text-decoration:none}.article{padding:54px 0 70px}.eyebrow{color:#42d6a1;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.article h1{max-width:900px;margin:10px 0 12px;font-size:clamp(2.1rem,5vw,4rem);line-height:1.08}.meta{color:#91a8ca}.rights-disclaimer{margin:26px 0;padding:16px 18px;border:1px solid #2a6c68;border-radius:10px;background:rgba(13,67,66,.28);color:#c1dad7}.rights-disclaimer a,.source-attribution a,.related-links a{color:#72aaff}.tag-row{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0}.tag{padding:4px 8px;border-radius:999px;background:#11294e;color:#9fc1f7;font-size:.75rem}.trainsec-content{margin-top:34px}.trainsec-content h2,.trainsec-content h3{line-height:1.25;color:#eef5ff;margin-top:2.2em}.trainsec-content img{display:block;max-width:100%;height:auto;margin:1.5rem auto;border-radius:8px}.trainsec-content figure{margin:1.8rem 0;padding:12px;border:1px solid #243e68;border-radius:9px;background:#08152b}.trainsec-content figcaption{color:#9fb4d4;font-size:.9rem}.trainsec-content iframe{display:block;width:100%;min-height:360px;border:0;border-radius:8px}.trainsec-content pre{overflow:auto;padding:16px;border:1px solid #243e68;border-radius:8px;background:#071225}.trainsec-content code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.related-links{margin-top:42px;padding-top:22px;border-top:1px solid #1a3060}.related-links h2{color:#eef5ff}.source-attribution{margin-top:30px;padding-top:22px;border-top:1px solid #1a3060;color:#a9bbd8}.source-attribution strong{color:#eef5ff}footer{padding:25px 0 45px;border-top:1px solid #1a3060;color:#91a8ca}@media(max-width:680px){.site-header .wrap{align-items:flex-start;flex-direction:column;padding:14px 0}.article{padding-top:38px}.trainsec-content iframe{min-height:230px}}
 .article-cover{max-width:860px;margin:28px 0;padding:10px;border:1px solid #243e68;border-radius:10px;background:#08152b}.article-cover img{display:block;width:100%;height:auto;border-radius:7px}.article-cover figcaption{padding:6px 4px 0;color:#9fb4d4;font-size:.82rem}.video-embed{margin:2rem 0;padding:12px;border:1px solid #243e68;border-radius:9px;background:#08152b}.video-fallback{margin:.65rem 0 0;color:#9fb4d4;font-size:.9rem}.video-fallback a{color:#72aaff}</style><link rel="stylesheet" href="/assets/site-theme.css?v=20260904-grey-red"></head><body>
<header class="site-header"><div class="wrap"><a class="brand" href="/"><strong>Andrey Pautov</strong><small>Security research</small></a><nav aria-label="Primary"><a href="/cti.html">Research</a><a href="/guides.html">Library</a><a href="/articles/">Articles</a><a href="/cyber-knowledge/">Cyber Knowledge</a></nav></div></header>
<main class="wrap" data-pagefind-ignore="all"><article class="article">
<p class="eyebrow">TrainSec source integration · ${category} · ${mode}</p><h1>${title}</h1>
<p class="meta"><strong>Author:</strong> ${author} · <strong>Published:</strong> ${date}</p>
<div class="tag-row"><span class="tag">TrainSec</span>${tags}</div>
${article.cover_path ? `<figure class="article-cover"><img src="${article.cover_path}" alt="Cover image for ${title}" loading="eager"><figcaption>Cover image from the original TrainSec publication.</figcaption></figure>` : ''}
<aside class="rights-disclaimer"><strong>Rights and attribution.</strong> ${rights} <a href="${source}" target="_blank" rel="noopener noreferrer">Original source ↗</a></aside>
<div class="trainsec-content">${body}</div>
${relatedMarkup(article, allArticles)}
<p class="source-attribution"><strong>Original publication:</strong> <a href="${source}" target="_blank" rel="noopener noreferrer">TrainSec Knowledge Library ↗</a><br>Original text, screenshots, infographics, videos, and author biography remain attributed to TrainSec.net and the named author. This page is hosted by 1200km.com with permission from the TrainSec rights holders.</p>
</article></main><footer><div class="wrap"><a href="/articles/trainsec-library.html">Back to TrainSec Knowledge Library</a> · <a href="/articles/trainsec/authors.html">Authors</a> · <a href="/articles/trainsec/domains.html">Domains</a> · <a href="/articles/">All articles</a></div></footer>
</body></html>`;
  return enhanceTrainsecReleaseMetadata(html, article);
}

function directoryPage(kind, groups) {
  const title = kind === 'authors' ? 'TrainSec Authors' : 'TrainSec Domains';
  const intro = kind === 'authors'
    ? 'Author index for the permitted TrainSec Knowledge Library mirrors. Every name links to the locally integrated articles and retains the original source attribution.'
    : 'Domain index for the permitted TrainSec Knowledge Library mirrors. Use these cross-links to move between malware analysis, Windows internals, hardware security, and related research.';
  const sections = groups.map((group) => `<section class="directory-group"><h2>${escapeHtml(group.name)}</h2><p class="count">${group.articles.length} article${group.articles.length === 1 ? '' : 's'}</p><ul>${group.articles.map((article) => `<li><a href="${localPathFor(article)}">${escapeHtml(article.title)}</a><span> · ${escapeHtml(article.author)}</span></li>`).join('')}</ul></section>`).join('');
  const canonical = `${siteOrigin}/articles/trainsec/${kind}.html`;
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — TrainSec | 1200km</title><meta name="description" content="${escapeHtml(intro)}"><meta name="author" content="Andrey Pautov"><meta property="article:published_time" content="${retrievedAt}"><link rel="canonical" href="${canonical}"><script type="application/ld+json">${siteArticleJsonLd(canonical, title)}</script><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050c1a;color:#dbe7fb;font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(1040px,calc(100% - 32px));margin:auto}.site-header{border-bottom:1px solid #1a3060}.site-header .wrap{display:flex;align-items:center;justify-content:space-between;min-height:68px;gap:18px}.brand{color:#eef5ff;text-decoration:none;font-weight:700}.brand small{display:block;color:#8fa8cf;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{color:#a9c0e4;text-decoration:none}.hero{padding:52px 0 32px;border-bottom:1px solid #1a3060}.eyebrow{color:#42d6a1;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(2.2rem,5vw,4rem);line-height:1.08;margin:10px 0}.lead{max-width:850px;color:#a9bbd8}.directory-group{margin:28px 0;padding:22px;border:1px solid #24406f;border-radius:10px;background:#08152b}.directory-group h2{margin:0;color:#eef5ff}.count{color:#91a8ca;margin:3px 0 12px}.directory-group li{margin:6px 0}.directory-group a,footer a{color:#72aaff}.directory-group span{color:#91a8ca}footer{margin-top:40px;padding:25px 0 45px;border-top:1px solid #1a3060;color:#91a8ca}@media(max-width:680px){.site-header .wrap{align-items:flex-start;flex-direction:column;padding:14px 0}}</style><link rel="stylesheet" href="/assets/site-theme.css?v=20260904-grey-red"></head><body><header class="site-header"><div class="wrap"><a class="brand" href="/"><strong>Andrey Pautov</strong><small>Security research</small></a><nav aria-label="Primary"><a href="/articles/trainsec-library.html">Library</a><a href="/articles/trainsec/authors.html">Authors</a><a href="/articles/trainsec/domains.html">Domains</a><a href="/articles/">Articles</a></nav></div></header><main class="wrap" data-pagefind-body><section class="hero"><p class="eyebrow">TrainSec source integration · directory</p><h1>${title}</h1><p class="lead">${escapeHtml(intro)}</p></section>${sections}</main><footer><div class="wrap"><a href="/articles/trainsec-library.html">Back to TrainSec Knowledge Library</a> · <a href="/articles/">All articles</a></div></footer></body></html>`;
}

async function fetchArticle(article) {
  const response = await fetch(article.url, { headers: { 'user-agent': '1200km-TrainSec-permitted-import/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const body = findElementorContent(html);
  if (!body || body.length < 100) throw new Error('article content container not found');
  const imageMeta = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  const coverUrl = imageMeta?.[1] ? new URL(imageMeta[1], article.url).href : article.image || '';
  return { body, coverUrl };
}

const payload = JSON.parse(await fs.readFile(dataPath, 'utf8'));
const canonicalEntries = buildTrainsecCanonicalEntries(payload);
const canonicalByLocalPath = new Map(canonicalEntries.map((entry) => [entry.local_path, entry]));

if (metadataOnly) {
  const updated = await updateExistingTrainsecMetadata(payload, canonicalEntries);
  console.log(`TrainSec metadata update complete: ${updated}/${TRAINSEC_EXPECTED_ARTICLE_COUNT} mirrors updated; source text, media files, directories, catalogues, and sitemaps unchanged.`);
} else {
await fs.mkdir(outputRoot, { recursive: true });
await fs.mkdir(coverRoot, { recursive: true });
await fs.mkdir(mediaRoot, { recursive: true });
const failures = [];
let completed = 0;
const concurrency = 5;
let cursor = 0;
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= payload.articles.length) return;
    const article = payload.articles[index];
    const slug = slugFor(article);
    const localPath = `articles/trainsec/${slug}.html`;
    const canonicalEntry = canonicalByLocalPath.get(`/${localPath}`);
    if (!canonicalEntry) {
      failures.push({ url: article.url, title: article.title, error: `No authorized canonical mapping for /${localPath}` });
      process.stdout.write(`FAILED ${article.title}: no authorized canonical mapping\n`);
      continue;
    }
    try {
      const { body, coverUrl } = await fetchArticle(article);
      article.local_path = `/${localPath}`;
      article.image = coverUrl || article.image || '';
      article.cover_path = await downloadCover(article.image, article);
      const mediaReadyBody = await localizeBodyImages(rewriteSourceLinks(normalizeMedia(body, article)));
      await fs.writeFile(path.join(outputRoot, `${slug}.html`), pageFor(article, mediaReadyBody, localPath, payload.articles, canonicalEntry));
      completed += 1;
      process.stdout.write(`Imported ${completed}/${payload.articles.length}: ${article.title}\n`);
    } catch (error) {
      failures.push({ url: article.url, title: article.title, error: String(error.message || error) });
      process.stdout.write(`FAILED ${article.title}: ${error.message || error}\n`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

payload.retrieved_at = retrievedAt;
payload.license_note = 'Full article text and embedded media are reproduced with permission from TrainSec rights holders. Rights remain with TrainSec.net and each named author; 1200km.com is the publishing platform.';
payload.authors = [...new Set(payload.articles.map((article) => article.author))].sort().map((name) => ({ name, articles: payload.articles.filter((article) => article.author === name).map((article) => article.local_path) }));
payload.domains = [...new Set(payload.articles.map((article) => article.domain))].sort().map((name) => ({ name, articles: payload.articles.filter((article) => article.domain === name).map((article) => article.local_path) }));
payload.import_status = { imported: completed, failed: failures.length, failures };
await fs.writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`);

const authorGroups = payload.authors.map((group) => ({ name: group.name, articles: payload.articles.filter((article) => article.author === group.name) }));
const domainGroups = payload.domains.map((group) => ({ name: group.name, articles: payload.articles.filter((article) => article.domain === group.name) }));
await fs.writeFile(path.join(outputRoot, 'authors.html'), directoryPage('authors', authorGroups));
await fs.writeFile(path.join(outputRoot, 'domains.html'), directoryPage('domains', domainGroups));

// Point catalogue titles at the local mirrors while retaining the original
// TrainSec link in each Source line and rights notice.
const cataloguePath = path.join(root, 'articles', 'trainsec-library.html');
let catalogue = await fs.readFile(cataloguePath, 'utf8');
// Catalogue cards must never inherit the full-article discovery navigation.
// Keep “Continue research” on article pages only, even if a source export
// accidentally includes that navigation in the catalogue fragment.
catalogue = catalogue.replace(/<nav\b[^>]*aria-label=["']Continue research["'][\s\S]*?<\/nav>/gi, '');
const authorMeta = '<meta name="author" content="Andrey Pautov"><meta property="article:published_time" content="2026-08-03">';
catalogue = catalogue.replace(/(?:<meta name="author" content="Andrey Pautov"><meta property="article:published_time" content="2026-08-03">)+/g, authorMeta);
for (const article of payload.articles) {
  if (!article.local_path) continue;
  const titleAnchor = `<h2><a href="${article.url}" target="_blank" rel="noopener noreferrer">`;
  const localAnchor = `<h2><a href="${article.local_path}">`;
  catalogue = catalogue.replace(titleAnchor, localAnchor);
  // The catalogue's data-title attribute is lower-cased text (not escaped
  // entity text), so match it exactly even when a title contains an apostrophe.
  const normalizedTitle = article.title.toLowerCase();
  const cardStarts = [normalizedTitle, escapeHtml(normalizedTitle)]
    .map((title) => `<article class="article-card" data-title="${title}"`);
  const cardPosition = cardStarts.reduce((position, cardStart) => (
    position >= 0 ? position : catalogue.indexOf(cardStart)
  ), -1);
  if (cardPosition >= 0 && article.cover_path && !catalogue.slice(cardPosition, cardPosition + 900).includes('article-card-cover')) {
    const openingEnd = catalogue.indexOf('>', cardPosition);
    const cover = `<a class="article-card-cover" href="${article.local_path}" aria-label="Read ${escapeHtml(article.title)}"><img src="${article.cover_path}" alt="" loading="lazy"></a>`;
    catalogue = `${catalogue.slice(0, openingEnd + 1)}${cover}${catalogue.slice(openingEnd + 1)}`;
  }
  if (cardPosition >= 0) {
    const nextTag = catalogue.indexOf('>', cardPosition);
    const cardOpening = catalogue.slice(cardPosition, nextTag + 1);
    const cardAttributes = [];
    if (!cardOpening.includes('data-category=')) cardAttributes.push('data-category="TrainSec"');
    if (!cardOpening.includes('data-tags=')) {
      cardAttributes.push(`data-tags="${escapeHtml((article.tags || []).join(' ').toLowerCase())}"`);
    }
    if (cardAttributes.length) {
      const markedOpening = `${cardOpening.slice(0, -1)} ${cardAttributes.join(' ')}>`;
      catalogue = `${catalogue.slice(0, cardPosition)}${markedOpening}${catalogue.slice(nextTag + 1)}`;
    }
  }
}
// Make catalogue metadata actionable: every author, domain, mode, and tag
// chip can be clicked to apply the corresponding filter.
for (const authorName of [...new Set(payload.articles.map((article) => article.author))]) {
  const value = escapeHtml(authorName);
  catalogue = catalogue.replaceAll(
    `<p class="article-meta"><strong>Author:</strong> ${value} ·`,
    `<p class="article-meta"><strong>Author:</strong> <button class="filter-chip" type="button" data-filter="author" data-filter-value="${value}">${value}</button> ·`,
  );
}
for (const article of payload.articles) {
  const domain = escapeHtml(article.domain || article.category || '');
  const mode = escapeHtml(article.mode || 'Article');
  const kicker = `<p class="article-kicker">${domain} · ${mode}</p>`;
  const clickableKicker = `<p class="article-kicker"><button class="filter-chip" type="button" data-filter="domain" data-filter-value="${domain}">${domain}</button> · <button class="filter-chip" type="button" data-filter="mode" data-filter-value="${mode}">${mode}</button></p>`;
  catalogue = catalogue.replaceAll(kicker, clickableKicker);
  for (const tag of article.tags || []) {
    const value = escapeHtml(tag);
    catalogue = catalogue.replaceAll(
      `<span class="tag">${value}</span>`,
      `<button class="tag filter-chip" type="button" data-filter="tag" data-filter-value="${value}">${value}</button>`,
    );
  }
}
// Older generated catalogues used the search field for tag chips. Normalize
// them to the dedicated tag facet in both newly generated and existing pages.
catalogue = catalogue.replaceAll('data-filter="search"', 'data-filter="tag"');
catalogue = catalogue.replace('A source-linked catalogue of TrainSec’s public knowledge-library articles integrated into the 1200km article ecosystem. Browse by author, domain, mode, and topic, then follow the attribution link to the original publication.', 'A permitted integration of TrainSec’s Knowledge Library. Read the complete original text with screenshots, infographics, and embedded videos in the original order, then follow the attribution link to TrainSec.net.');
if (!catalogue.includes('<meta name="author"')) {
  catalogue = catalogue.replace('<meta name="description"', `${authorMeta}<meta name="description"`);
}
if (!catalogue.includes('data-trainsec-catalogue-graph')) {
  catalogue = catalogue.replace('</head>', `<script type="application/ld+json" data-trainsec-catalogue-graph>${siteArticleJsonLd('https://1200km.com/articles/trainsec-library.html', 'TrainSec Knowledge Library')}</script>\n</head>`);
}
if (!catalogue.includes('data-trainsec-directory-links')) {
  catalogue = catalogue.replace('<p><strong>TrainSec source integration.</strong>', '<p data-trainsec-directory-links><strong>TrainSec source integration.</strong> <a href="/articles/trainsec/authors.html">Author index ↗</a> · <a href="/articles/trainsec/domains.html">Domain index ↗</a> ·');
}
if (!catalogue.includes('.article-card-cover')) {
  catalogue = catalogue.replace('</style>', '.article-grid{align-items:stretch}.article-card{height:100%;min-height:430px;display:flex;flex-direction:column}.article-card .rights-disclaimer{margin-top:auto}.article-card-cover{display:block;height:150px;margin:-20px -20px 8px;overflow:hidden;border-radius:10px 10px 0 0;background:#08152b}.article-card-cover img{display:block;width:100%;height:100%;object-fit:cover}.article-card .tag-row{min-height:28px}.toolbar button{min-height:42px;padding:0 14px;border:1px solid #294574;border-radius:7px;background:#102449;color:#e5efff;cursor:pointer}.toolbar button:hover{border-color:#72aaff;background:#16315e}@media(max-width:700px){.article-card{min-height:0}.article-card-cover{height:170px}}</style>');
}
if (!catalogue.includes('.toolbar button')) {
  catalogue = catalogue.replace('</style>', '.toolbar button{min-height:42px;padding:0 14px;border:1px solid #294574;border-radius:7px;background:#102449;color:#e5efff;cursor:pointer}.toolbar button:hover{border-color:#72aaff;background:#16315e}</style>');
}
if (!catalogue.includes('.filter-chip')) {
  catalogue = catalogue.replace('</style>', '.filter-chip{font:inherit;color:#72aaff;background:transparent;border:0;padding:0;cursor:pointer;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:3px}.filter-chip:hover,.filter-chip:focus-visible{color:#b7d2ff;text-decoration-color:currentColor;outline:0}.tag.filter-chip{padding:4px 8px;border-radius:999px;background:#11294e;color:#9fc1f7;text-decoration:none;font-size:.75rem}.tag.filter-chip:hover,.tag.filter-chip:focus-visible{background:#1b3c71;color:#fff}.article-meta .filter-chip{font-size:inherit}.article-kicker{display:flex;flex-wrap:wrap;align-items:center;gap:.35em}.article-card{overflow-wrap:anywhere}@media(max-width:700px){.article-grid{grid-template-columns:minmax(0,1fr);align-items:start}.article-card{height:auto !important;min-height:0;overflow:hidden}.article-card-cover{height:auto;aspect-ratio:16/9}.article-card .rights-disclaimer{margin-top:0}}</style>');
}
if (!catalogue.includes('trainsec-card-layout-fix')) {
  catalogue = catalogue.replace('</head>', '<style id="trainsec-card-layout-fix">.article-grid{align-items:stretch;grid-auto-rows:auto}.article-card{height:auto;min-height:430px;align-self:stretch;box-sizing:border-box}@media(max-width:700px){.article-card{height:auto !important;min-height:0}}</style>\n</head>');
}
if (!catalogue.includes('id="filter-reset"')) {
  catalogue = catalogue.replace('<span id="result-count"', '<button id="filter-search" type="button">Search</button><button id="filter-reset" type="button">Clear filters</button><span id="result-count"');
}
if (!catalogue.includes('id="filter-search"')) {
  catalogue = catalogue.replace('<span id="result-count"', '<button id="filter-search" type="button">Search</button><span id="result-count"');
}
if (!catalogue.includes('id="tag-filter"')) {
  const tags = [...new Map(
    payload.articles.flatMap((article) => (article.tags || []).map((tag) => [tag.toLowerCase(), tag])),
  ).entries()].sort(([a], [b]) => a.localeCompare(b));
  const tagOptions = tags.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
  catalogue = catalogue.replace(
    '<button id="filter-reset"',
    `<label class="visually-hidden" for="tag-filter">Topic tag</label><select id="tag-filter" autocomplete="off"><option value="">All tags</option>${tagOptions}</select><button id="filter-reset"`,
  );
}
if (!catalogue.includes('id="category-filter"')) {
  catalogue = catalogue.replace('<input id="article-search"', '<input id="article-search" autocomplete="off"');
  catalogue = catalogue.replace('<label class="visually-hidden" for="author-filter">Author</label><select id="author-filter"', '<label class="visually-hidden" for="category-filter">Category</label><select id="category-filter" autocomplete="off"><option value="">All categories</option><option value="TrainSec">TrainSec</option></select><label class="visually-hidden" for="author-filter">Author</label><select id="author-filter" autocomplete="off"');
  catalogue = catalogue.replace('<select id="domain-filter"', '<select id="domain-filter" autocomplete="off"').replace('<select id="mode-filter"', '<select id="mode-filter" autocomplete="off"');
  catalogue = catalogue.replace('const cards=[...document.querySelectorAll(".article-card")],search=document.querySelector("#article-search"),author=', 'const cards=[...document.querySelectorAll(".article-card")],category=document.querySelector("#category-filter"),search=document.querySelector("#article-search"),author=');
  catalogue = catalogue.replace(')&&(!author.value||card.dataset.author===author.value)', ')&&(!category.value||card.dataset.category===category.value)&&(!author.value||card.dataset.author===author.value)');
  catalogue = catalogue.replace('[search,author,domain,mode].forEach(control=>control.addEventListener("input",apply));[author,domain,mode].forEach(control=>control.addEventListener("change",apply))})();', '[search,category,author,domain,mode].forEach(control=>control.addEventListener("input",apply));[category,author,domain,mode].forEach(control=>control.addEventListener("change",apply));apply()})();');
}
catalogue = catalogue.replace('const cards=[...document.querySelectorAll(".article-card")],search=...,author=', 'const cards=[...document.querySelectorAll(".article-card")],category=document.querySelector("#category-filter"),search=...,author=');
catalogue = catalogue.replace('const matchesAuthor=!author.value||card.dataset.author===author.value;', 'const matchesCategory=!category||!category.value||card.dataset.category===category.value;const matchesAuthor=!author.value||card.dataset.author===author.value;');
catalogue = catalogue.replace('&&matchesAuthor&&matchesDomain&&matchesMode;', '&&matchesCategory&&matchesAuthor&&matchesDomain&&matchesMode;');
catalogue = catalogue.replace('[search,author,domain,mode].forEach(control=>control.addEventListener("input",apply));', '[search,category,author,domain,mode].filter(Boolean).forEach(control=>control.addEventListener("input",apply));');
catalogue = catalogue.replace('[author,domain,mode].forEach(control=>control.addEventListener("change",apply))', '[category,author,domain,mode].filter(Boolean).forEach(control=>control.addEventListener("change",apply));apply()');
const filterScript = '<script src="/assets/trainsec-library-filters.js?v=20260804-1" defer></script>';
catalogue = catalogue.replace(/<script>\(\(\)=>\{const cards=[\s\S]*?<\/script>/, filterScript);
if (!catalogue.includes('/assets/trainsec-library-filters.js')) {
  catalogue = catalogue.replace('</body>', `${filterScript}\n</body>`);
}
await fs.writeFile(cataloguePath, catalogue);

const indexPath = path.join(root, 'articles', 'index.html');
let indexHtml = await fs.readFile(indexPath, 'utf8');
indexHtml = indexHtml.replace('TrainSec Knowledge Library: 84 source-linked articles', 'TrainSec Knowledge Library: 84 permitted full mirrors');
indexHtml = indexHtml.replace('Source-linked metadata catalogue of TrainSec articles with rights and attribution notices.', 'Permitted full mirrors of 84 TrainSec articles with original text, screenshots, infographics, videos, author attribution, and source links.');
await fs.writeFile(indexPath, indexHtml);

console.log(`\nTrainSec import complete: ${completed} imported, ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
}
