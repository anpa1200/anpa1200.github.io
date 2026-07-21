#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import {
  SITE_ORIGIN,
  collectLocalSitemapUrls,
  localFileForUrl,
  normalizeCanonical,
  normalizeSiteUrl,
  parseSitemap,
  parseSitemapEntries,
  prepareHtmlForSearch,
  shouldExcludeUrl,
  validatePage,
} from './search-index-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const remote = args.includes('--remote');
const quiet = args.includes('--quiet');
const siteRoot = resolve(option('--site', ROOT));
const outputPath = resolve(option('--output', join(ROOT, 'pagefind')));
const minimumPages = Number.parseInt(option('--minimum-pages', remote ? '1600' : '1000'), 10);
const maxPageFailures = Number.parseInt(option('--max-page-failures', remote ? '12' : '0'), 10);
const maxStalePages = Number.parseInt(option('--max-stale-pages', '0'), 10);
const concurrency = Math.max(1, Math.min(24, Number.parseInt(option('--concurrency', '12'), 10)));
const rootSitemap = option('--sitemap', remote ? `${SITE_ORIGIN}/sitemap.xml` : join(siteRoot, 'sitemap-all.xml'));
const canonicalSitemapOutput = option('--canonical-sitemap-output');
const catalogPath = resolve(option('--catalog', join(siteRoot, 'data', 'content-catalog.json')));
const requiredIndexUrls = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/search.html`,
  `${SITE_ORIGIN}/threat-matrix/techniques/T1059.003/`,
  `${SITE_ORIGIN}/threat-matrix/actors/G0034/`,
  `${SITE_ORIGIN}/threat-matrix/actors/G0069/`,
  `${SITE_ORIGIN}/ITDR/`,
];

if (!existsSync(catalogPath)) throw new Error(`Content catalogue is required before search indexing: ${catalogPath}`);
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const catalogByUrl = new Map();
for (const item of catalog.items || []) {
  for (const value of [item.canonical_url, item.source_url, ...(item.alternate_urls || [])].filter(Boolean)) {
    const normalized = normalizeCanonical(value) || value;
    if (!catalogByUrl.has(normalized)) catalogByUrl.set(normalized, item);
  }
}

function log(message) {
  if (!quiet) console.log(message);
}

function assertSafeOutput(path) {
  const resolved = resolve(path);
  if (resolved === '/' || resolved === ROOT || resolved === resolve(ROOT, '..')) {
    throw new Error(`Refusing unsafe search output path: ${resolved}`);
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function fetchText(url, { attempts = 3, timeoutMs = 20_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'text/html,application/xml;q=0.9,text/xml;q=0.8',
          'user-agent': '1200km-search-indexer/1.0 (+https://1200km.com/search.html)',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!normalizeSiteUrl(response.url)) throw new Error(`refused off-origin redirect to ${response.url}`);
      const length = Number.parseInt(response.headers.get('content-length') || '0', 10);
      if (length > 8_000_000) throw new Error(`response too large (${length} bytes)`);
      const text = await response.text();
      if (text.length > 8_000_000) throw new Error(`response too large (${text.length} bytes)`);
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(350 * (2 ** (attempt - 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${url}: ${lastError?.message || 'request failed'}`);
}

async function collectRemoteUrls(entry) {
  const pages = new Set();
  const visited = new Set();

  async function visit(reference) {
    const isRemote = /^https?:/i.test(reference);
    const normalized = isRemote ? normalizeCanonical(reference) : resolve(reference);
    if (!normalized || visited.has(normalized)) return;
    visited.add(normalized);
    const xml = isRemote ? await fetchText(normalized) : await readFile(normalized, 'utf8');
    const sitemap = parseSitemap(xml, isRemote ? normalized : SITE_ORIGIN);
    if (sitemap.isIndex) {
      for (const location of sitemap.locations) await visit(location);
    } else {
      sitemap.locations.forEach((location) => pages.add(location));
    }
  }

  await visit(entry);
  return pages;
}

async function pageSource(url, localOnly, preferLocal) {
  const localPath = localFileForUrl(siteRoot, url);
  if ((localOnly || preferLocal) && localPath) {
    return { html: await readFile(localPath, 'utf8'), source: 'local' };
  }
  if (localOnly) throw new Error(`${url}: no local canonical file`);
  return { html: await fetchText(url), source: 'remote' };
}

async function replaceOutput(stagedOutput, destination) {
  assertSafeOutput(destination);
  await mkdir(dirname(destination), { recursive: true });
  const backup = `${destination}.previous-${process.pid}`;
  if (existsSync(destination)) await rename(destination, backup);
  try {
    await rename(stagedOutput, destination);
    if (existsSync(backup)) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (existsSync(backup) && !existsSync(destination)) await rename(backup, destination);
    throw error;
  }
}

assertSafeOutput(outputPath);
const startedAt = Date.now();
const localPages = await collectLocalSitemapUrls(siteRoot, join(siteRoot, 'sitemap-all.xml'));
const discovered = remote ? await collectRemoteUrls(rootSitemap) : localPages;
if (remote) localPages.forEach((url) => discovered.add(url));

const urls = [...discovered]
  .filter((url) => !shouldExcludeUrl(url))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
log(`Discovered ${urls.length} canonical search pages (${remote ? 'live sitemap union' : 'local sitemap union'}).`);

const { index, errors: createErrors } = await pagefind.createIndex({
  excludeSelectors: [
    '.ag-project-notice',
    '#page-sidenav',
    '.site-header',
    '.site-search-hero',
    '.site-search-host',
    '.site-ecosystem-gateway',
    '.table-of-contents',
    '.theme-doc-breadcrumbs',
    '.theme-doc-toc-mobile',
    '.theme-doc-toc-desktop',
    '.pagination-nav',
    'footer',
  ],
  forceLanguage: 'en',
  includeCharacters: '.:-_/@',
});
if (!index || createErrors.length) throw new Error(`Unable to create Pagefind index: ${createErrors.join('; ')}`);

let indexedPages = 0;
const indexedUrls = new Set();
const sourceCounts = { local: 0, remote: 0 };
const skipped = new Map();
const skippedDetails = [];
const failures = [];

for (let offset = 0; offset < urls.length; offset += concurrency) {
  const batch = urls.slice(offset, offset + concurrency);
  const fetched = await Promise.all(batch.map(async (url) => {
    try {
      // Prefer every file present in the release checkout. Live fetching is a
      // fallback for domain pages not tracked in this repository, which keeps
      // the deploy gate deterministic without reducing domain-wide coverage.
      const source = await pageSource(url, !remote, remote);
      return { url, ...source };
    } catch (error) {
      return { url, error };
    }
  }));

  for (const item of fetched) {
    if (item.error) {
      if (/HTTP (404|410)\b/.test(item.error.message)) {
        skipped.set('stale-sitemap-url', (skipped.get('stale-sitemap-url') || 0) + 1);
        skippedDetails.push({ url: item.url, reason: 'stale-sitemap-url' });
        continue;
      }
      failures.push(item.error.message);
      continue;
    }
    const validation = validatePage(item.url, item.html);
    if (!validation.indexable) {
      skipped.set(validation.reason, (skipped.get(validation.reason) || 0) + 1);
      skippedDetails.push({ url: item.url, reason: validation.reason });
      continue;
    }
    const catalogItem = catalogByUrl.get(normalizeCanonical(item.url));
    if (!catalogItem) {
      failures.push(`${item.url}: missing content-catalog identity`);
      continue;
    }
    if (!catalogItem.indexable) {
      failures.push(`${item.url}: sitemap includes a content-catalog item marked non-indexable`);
      continue;
    }
    const result = await index.addHTMLFile({
      content: prepareHtmlForSearch(item.url, item.html, catalogItem),
      url: normalizeSiteUrl(item.url).pathname,
    });
    if (result.errors.length) failures.push(`${item.url}: ${result.errors.join('; ')}`);
    else {
      indexedPages += 1;
      indexedUrls.add(normalizeCanonical(item.url));
      sourceCounts[item.source] += 1;
    }
  }
  const completed = Math.min(offset + batch.length, urls.length);
  if (completed === urls.length || completed % (concurrency * 10) === 0) {
    log(`Indexed ${completed}/${urls.length} candidates…`);
  }
}

if (indexedPages < minimumPages) {
  await pagefind.close();
  throw new Error(`Search index coverage is too small: ${indexedPages} pages; expected at least ${minimumPages}.`);
}
const stalePages = skipped.get('stale-sitemap-url') || 0;
if (stalePages > maxStalePages) {
  await pagefind.close();
  throw new Error(`Search indexing skipped ${stalePages} stale sitemap URLs (maximum ${maxStalePages}):\n${skippedDetails.filter((item) => item.reason === 'stale-sitemap-url').slice(0, 20).map((item) => item.url).join('\n')}`);
}
if (failures.length > maxPageFailures) {
  await pagefind.close();
  throw new Error(`Search indexing had ${failures.length} page failures (maximum ${maxPageFailures}):\n${failures.slice(0, 20).join('\n')}`);
}
const missingRequired = requiredIndexUrls.filter((url) => !indexedUrls.has(url));
if (missingRequired.length) {
  await pagefind.close();
  throw new Error(`Search index is missing required release fixtures:\n${missingRequired.join('\n')}`);
}

await mkdir(dirname(outputPath), { recursive: true });
const temporaryRoot = await mkdtemp(join(dirname(outputPath), '.1200km-pagefind-'));
const stagedOutput = join(temporaryRoot, 'pagefind');
const writeResult = await index.writeFiles({ outputPath: stagedOutput });
if (writeResult.errors.length) {
  await pagefind.close();
  throw new Error(`Pagefind bundle write failed: ${writeResult.errors.join('; ')}`);
}

const metadata = {
  schemaVersion: 1,
  pagefindVersion: '1.5.2',
  source: remote ? 'generated-canonical-sitemap-with-local-release-overrides' : 'canonical-local-sitemap',
  generatedAt: new Date().toISOString(),
  discoveredPages: urls.length,
  indexedPages,
  sourceCounts,
  skipped: Object.fromEntries([...skipped.entries()].sort()),
  skippedDetails: skippedDetails.slice(0, 200),
  failedPages: failures.length,
  failureDetails: failures.slice(0, 50),
  durationMs: Date.now() - startedAt,
  contentCatalogVersion: catalog.catalog_version,
  contentCatalogScope: catalog.scope,
};
await writeFile(join(stagedOutput, 'search-build.json'), `${JSON.stringify(metadata, null, 2)}\n`);
await pagefind.close();
await replaceOutput(stagedOutput, outputPath);
await rm(temporaryRoot, { recursive: true, force: true });

if (canonicalSitemapOutput) {
  const inputXml = /^https?:/i.test(rootSitemap)
    ? await fetchText(rootSitemap)
    : await readFile(resolve(rootSitemap), 'utf8');
  const parsed = parseSitemapEntries(inputXml, SITE_ORIGIN);
  if (parsed.isIndex) throw new Error('Canonical sitemap output requires a flat URL-set input.');
  const byUrl = new Map(parsed.entries.map((entry) => [entry.loc, entry]));
  const entries = [...indexedUrls].sort().map((loc) => byUrl.get(loc) || { loc });
  const xmlEscape = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => [
      '  <url>',
      `    <loc>${xmlEscape(entry.loc)}</loc>`,
      ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(resolve(canonicalSitemapOutput), xml);
  metadata.canonicalSitemapPages = entries.length;
  await writeFile(join(outputPath, 'search-build.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  log(`Wrote canonical sitemap with ${entries.length} indexed URLs to ${resolve(canonicalSitemapOutput)}.`);
}

log(`Search index ready: ${indexedPages} pages at ${outputPath}.`);
if (failures.length) {
  console.warn(`Search index completed with ${failures.length} tolerated fetch failure(s):`);
  failures.slice(0, 20).forEach((failure) => console.warn(`- ${failure}`));
}
