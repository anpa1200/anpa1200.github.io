import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'data', 'trainsec-library.json');
const outputRoot = path.join(root, 'articles', 'trainsec');
const siteOrigin = 'https://1200km.com';
const retrievedAt = new Date().toISOString().slice(0, 10);

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

function normalizeMedia(body) {
  let out = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
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
  return out;
}

function rewriteSourceLinks(body) {
  return body.replace(/(href|src)=("|')\/(?!\/)/g, '$1=$2https://trainsec.net/');
}

function localPathFor(article) {
  return `/articles/trainsec/${slugFor(article)}.html`;
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

function pageFor(article, body, localPath, allArticles) {
  const title = escapeHtml(article.title);
  const seoTitle = escapeHtml(article.title.length > 78 ? `${article.title.slice(0, 75).replace(/[\s,:;]+$/, '')}…` : article.title);
  const author = escapeHtml(article.author);
  const date = escapeHtml(article.date);
  const category = escapeHtml(article.domain || article.category);
  const mode = escapeHtml(article.mode || 'Article');
  const source = escapeHtml(article.url);
  const published = new Date(article.date);
  const publishedIso = Number.isNaN(published.valueOf()) ? '' : published.toISOString().slice(0, 10);
  const rights = `All rights reserved. Rights belong to TrainSec.net and ${author}. 1200km.com is the publishing platform. Published with permission from the TrainSec rights holders.`;
  const tags = (article.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${seoTitle} — TrainSec article | 1200km</title>
<meta name="description" content="${escapeHtml(article.excerpt || `${article.title} by ${article.author}, republished from TrainSec.net with permission.`)}">
<meta name="author" content="${author}"><meta name="trainsec-author" content="${author}"><meta name="trainsec-source" content="${source}"><meta name="keywords" content="${escapeHtml([article.author, article.domain, article.mode, ...(article.tags || [])].join(', '))}">
${publishedIso ? `<meta property="article:published_time" content="${publishedIso}">` : ''}
<link rel="canonical" href="${siteOrigin}/${localPath}">
<meta property="og:type" content="article"><meta property="og:title" content="${seoTitle}"><meta property="og:url" content="${siteOrigin}/${localPath}">
<script type="application/ld+json">${siteArticleJsonLd(`${siteOrigin}/${localPath}`, article.title, publishedIso || retrievedAt, source)}</script>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050c1a;color:#dbe7fb;font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(1040px,calc(100% - 32px));margin:auto}.site-header{border-bottom:1px solid #1a3060}.site-header .wrap{display:flex;align-items:center;justify-content:space-between;min-height:68px;gap:18px}.brand{color:#eef5ff;text-decoration:none;font-weight:700}.brand small{display:block;color:#8fa8cf;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{color:#a9c0e4;text-decoration:none}.article{padding:54px 0 70px}.eyebrow{color:#42d6a1;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.article h1{max-width:900px;margin:10px 0 12px;font-size:clamp(2.1rem,5vw,4rem);line-height:1.08}.meta{color:#91a8ca}.rights-disclaimer{margin:26px 0;padding:16px 18px;border:1px solid #2a6c68;border-radius:10px;background:rgba(13,67,66,.28);color:#c1dad7}.rights-disclaimer a,.source-attribution a,.related-links a{color:#72aaff}.tag-row{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0}.tag{padding:4px 8px;border-radius:999px;background:#11294e;color:#9fc1f7;font-size:.75rem}.trainsec-content{margin-top:34px}.trainsec-content h2,.trainsec-content h3{line-height:1.25;color:#eef5ff;margin-top:2.2em}.trainsec-content img{display:block;max-width:100%;height:auto;margin:1.5rem auto;border-radius:8px}.trainsec-content figure{margin:1.8rem 0;padding:12px;border:1px solid #243e68;border-radius:9px;background:#08152b}.trainsec-content figcaption{color:#9fb4d4;font-size:.9rem}.trainsec-content iframe{display:block;width:100%;min-height:360px;border:0;border-radius:8px}.trainsec-content pre{overflow:auto;padding:16px;border:1px solid #243e68;border-radius:8px;background:#071225}.trainsec-content code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.related-links{margin-top:42px;padding-top:22px;border-top:1px solid #1a3060}.related-links h2{color:#eef5ff}.source-attribution{margin-top:30px;padding-top:22px;border-top:1px solid #1a3060;color:#a9bbd8}.source-attribution strong{color:#eef5ff}footer{padding:25px 0 45px;border-top:1px solid #1a3060;color:#91a8ca}@media(max-width:680px){.site-header .wrap{align-items:flex-start;flex-direction:column;padding:14px 0}.article{padding-top:38px}.trainsec-content iframe{min-height:230px}}
</style></head><body>
<header class="site-header"><div class="wrap"><a class="brand" href="/"><strong>Andrey Pautov</strong><small>Security research</small></a><nav aria-label="Primary"><a href="/cti.html">Research</a><a href="/guides.html">Library</a><a href="/articles/">Articles</a><a href="/cyber-knowledge/">Cyber Knowledge</a></nav></div></header>
<main class="wrap" data-pagefind-body><article class="article">
<p class="eyebrow">TrainSec source integration · ${category} · ${mode}</p><h1>${title}</h1>
<p class="meta"><strong>Author:</strong> ${author} · <strong>Published:</strong> ${date}</p>
<div class="tag-row">${tags}</div>
<aside class="rights-disclaimer"><strong>Rights and attribution.</strong> ${rights} <a href="${source}" target="_blank" rel="noopener noreferrer">Original source ↗</a></aside>
<div class="trainsec-content">${rewriteSourceLinks(normalizeMedia(body))}</div>
${relatedMarkup(article, allArticles)}
<p class="source-attribution"><strong>Original publication:</strong> <a href="${source}" target="_blank" rel="noopener noreferrer">TrainSec Knowledge Library ↗</a><br>Original text, screenshots, infographics, videos, and author biography remain attributed to TrainSec.net and the named author. This page is hosted by 1200km.com with permission from the TrainSec rights holders.</p>
</article></main><footer><div class="wrap"><a href="/articles/trainsec-library.html">Back to TrainSec Knowledge Library</a> · <a href="/articles/trainsec/authors.html">Authors</a> · <a href="/articles/trainsec/domains.html">Domains</a> · <a href="/articles/">All articles</a></div></footer>
</body></html>`;
}

function directoryPage(kind, groups) {
  const title = kind === 'authors' ? 'TrainSec Authors' : 'TrainSec Domains';
  const intro = kind === 'authors'
    ? 'Author index for the permitted TrainSec Knowledge Library mirrors. Every name links to the locally integrated articles and retains the original source attribution.'
    : 'Domain index for the permitted TrainSec Knowledge Library mirrors. Use these cross-links to move between malware analysis, Windows internals, hardware security, and related research.';
  const sections = groups.map((group) => `<section class="directory-group"><h2>${escapeHtml(group.name)}</h2><p class="count">${group.articles.length} article${group.articles.length === 1 ? '' : 's'}</p><ul>${group.articles.map((article) => `<li><a href="${localPathFor(article)}">${escapeHtml(article.title)}</a><span> · ${escapeHtml(article.author)}</span></li>`).join('')}</ul></section>`).join('');
  const canonical = `${siteOrigin}/articles/trainsec/${kind}.html`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — TrainSec | 1200km</title><meta name="description" content="${escapeHtml(intro)}"><meta name="author" content="Andrey Pautov"><meta property="article:published_time" content="${retrievedAt}"><link rel="canonical" href="${canonical}"><script type="application/ld+json">${siteArticleJsonLd(canonical, title)}</script><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#050c1a;color:#dbe7fb;font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(1040px,calc(100% - 32px));margin:auto}.site-header{border-bottom:1px solid #1a3060}.site-header .wrap{display:flex;align-items:center;justify-content:space-between;min-height:68px;gap:18px}.brand{color:#eef5ff;text-decoration:none;font-weight:700}.brand small{display:block;color:#8fa8cf;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}nav{display:flex;flex-wrap:wrap;gap:14px}nav a{color:#a9c0e4;text-decoration:none}.hero{padding:52px 0 32px;border-bottom:1px solid #1a3060}.eyebrow{color:#42d6a1;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(2.2rem,5vw,4rem);line-height:1.08;margin:10px 0}.lead{max-width:850px;color:#a9bbd8}.directory-group{margin:28px 0;padding:22px;border:1px solid #24406f;border-radius:10px;background:#08152b}.directory-group h2{margin:0;color:#eef5ff}.count{color:#91a8ca;margin:3px 0 12px}.directory-group li{margin:6px 0}.directory-group a,footer a{color:#72aaff}.directory-group span{color:#91a8ca}footer{margin-top:40px;padding:25px 0 45px;border-top:1px solid #1a3060;color:#91a8ca}@media(max-width:680px){.site-header .wrap{align-items:flex-start;flex-direction:column;padding:14px 0}}</style></head><body><header class="site-header"><div class="wrap"><a class="brand" href="/"><strong>Andrey Pautov</strong><small>Security research</small></a><nav aria-label="Primary"><a href="/articles/trainsec-library.html">Library</a><a href="/articles/trainsec/authors.html">Authors</a><a href="/articles/trainsec/domains.html">Domains</a><a href="/articles/">Articles</a></nav></div></header><main class="wrap" data-pagefind-body><section class="hero"><p class="eyebrow">TrainSec source integration · directory</p><h1>${title}</h1><p class="lead">${escapeHtml(intro)}</p></section>${sections}</main><footer><div class="wrap"><a href="/articles/trainsec-library.html">Back to TrainSec Knowledge Library</a> · <a href="/articles/">All articles</a></div></footer></body></html>`;
}

async function fetchArticle(article) {
  const response = await fetch(article.url, { headers: { 'user-agent': '1200km-TrainSec-permitted-import/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const body = findElementorContent(html);
  if (!body || body.length < 100) throw new Error('article content container not found');
  return body;
}

const payload = JSON.parse(await fs.readFile(dataPath, 'utf8'));
await fs.mkdir(outputRoot, { recursive: true });
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
    try {
      const body = await fetchArticle(article);
      article.local_path = `/${localPath}`;
      await fs.writeFile(path.join(outputRoot, `${slug}.html`), pageFor(article, body, localPath, payload.articles));
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
for (const article of payload.articles) {
  if (!article.local_path) continue;
  const titleAnchor = `<h2><a href="${article.url}" target="_blank" rel="noopener noreferrer">`;
  const localAnchor = `<h2><a href="${article.local_path}">`;
  catalogue = catalogue.replace(titleAnchor, localAnchor);
}
catalogue = catalogue.replace('A source-linked catalogue of TrainSec’s public knowledge-library articles integrated into the 1200km article ecosystem. Browse by author, domain, mode, and topic, then follow the attribution link to the original publication.', 'A permitted integration of TrainSec’s Knowledge Library. Read the complete original text with screenshots, infographics, and embedded videos in the original order, then follow the attribution link to TrainSec.net.');
catalogue = catalogue.replace('<meta name="description"', '<meta name="author" content="Andrey Pautov"><meta property="article:published_time" content="2026-08-03"><meta name="description"');
if (!catalogue.includes('data-trainsec-catalogue-graph')) {
  catalogue = catalogue.replace('</head>', `<script type="application/ld+json" data-trainsec-catalogue-graph>${siteArticleJsonLd('https://1200km.com/articles/trainsec-library.html', 'TrainSec Knowledge Library')}</script>\n</head>`);
}
catalogue = catalogue.replace('<p><strong>TrainSec source integration.</strong>', '<p><strong>TrainSec source integration.</strong> <a href="/articles/trainsec/authors.html">Author index ↗</a> · <a href="/articles/trainsec/domains.html">Domain index ↗</a> ·');
await fs.writeFile(cataloguePath, catalogue);

// Add every local mirror to both sitemaps after the catalogue URL.
const sitemapEntries = payload.articles.filter((article) => article.local_path).map((article) => `  <url>\n    <loc>${siteOrigin}${article.local_path}</loc>\n    <lastmod>${retrievedAt}</lastmod>\n  </url>`).join('\n');
const directoryEntries = ['authors', 'domains'].map((name) => `  <url>\n    <loc>${siteOrigin}/articles/trainsec/${name}.html</loc>\n    <lastmod>${retrievedAt}</lastmod>\n  </url>`).join('\n');
for (const sitemapName of ['sitemap.xml', 'sitemap-all.xml']) {
  const sitemapPath = path.join(root, sitemapName);
  let sitemap = await fs.readFile(sitemapPath, 'utf8');
  const additions = [
    !sitemap.includes('/articles/trainsec/authors.html') ? directoryEntries : '',
    !sitemap.includes('/articles/trainsec/vmmap-basics-how-to-read-a-windows-processs-memory-layout.html') ? sitemapEntries : '',
  ].filter(Boolean).join('\n');
  if (additions) {
    const anchor = '  <url>\n    <loc>https://1200km.com/articles/trainsec-library.html</loc>';
    const position = sitemap.indexOf(anchor);
    if (position >= 0) {
      const close = sitemap.indexOf('  </url>', position);
      sitemap = `${sitemap.slice(0, close + '  </url>'.length)}\n${additions}${sitemap.slice(close + '  </url>'.length)}`;
    }
  }
  await fs.writeFile(sitemapPath, sitemap);
}

const indexPath = path.join(root, 'articles', 'index.html');
let indexHtml = await fs.readFile(indexPath, 'utf8');
indexHtml = indexHtml.replace('TrainSec Knowledge Library: 84 source-linked articles', 'TrainSec Knowledge Library: 84 permitted full mirrors');
indexHtml = indexHtml.replace('Source-linked metadata catalogue of TrainSec articles with rights and attribution notices.', 'Permitted full mirrors of 84 TrainSec articles with original text, screenshots, infographics, videos, author attribution, and source links.');
await fs.writeFile(indexPath, indexHtml);

console.log(`\nTrainSec import complete: ${completed} imported, ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
