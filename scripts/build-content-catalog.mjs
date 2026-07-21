#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCatalog,
  createContentItem,
  externalArticleItems,
} from './content-catalog-lib.mjs';
import {
  SITE_ORIGIN,
  localFileForUrl,
  parseSitemapEntries,
  validatePage,
} from './search-index-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const siteRoot = resolve(option('--site', ROOT));
const sourceRoot = resolve(option('--source', ROOT));
const output = resolve(option('--output', join(siteRoot, 'data', 'content-catalog.json')));
const sitemapPath = resolve(option('--sitemap', join(siteRoot, args.includes('--remote') ? 'sitemap.xml' : 'sitemap-all.xml')));
const remote = args.includes('--remote');
const check = args.includes('--check');
const config = JSON.parse(await readFile(join(sourceRoot, 'data', 'content-catalog.config.json'), 'utf8'));
const parsed = parseSitemapEntries(await readFile(sitemapPath, 'utf8'), SITE_ORIGIN);
if (parsed.isIndex) throw new Error('Content catalogue requires a flat sitemap URL set.');

function gitDate(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relative(sourceRoot, path)], {
      cwd: sourceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

async function fetchHtml(url, attempts = 3) {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'text/html',
          'user-agent': '1200km-content-catalog/1.0 (+https://1200km.com/)',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      if (html.length > 8_000_000) throw new Error('response too large');
      return html;
    } catch (caught) {
      error = caught;
      if (attempt < attempts) await new Promise((done) => setTimeout(done, 300 * (2 ** (attempt - 1))));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${url}: ${error?.message || 'request failed'}`);
}

async function loadPage(entry) {
  const localPath = localFileForUrl(siteRoot, entry.loc);
  if (localPath) {
    return {
      url: entry.loc,
      html: await readFile(localPath, 'utf8'),
      updatedAt: entry.lastmod || gitDate(join(sourceRoot, relative(siteRoot, localPath))),
      source: 'local',
    };
  }
  if (!remote) throw new Error(`${entry.loc}: sitemap URL has no local file`);
  return { url: entry.loc, html: await fetchHtml(entry.loc), updatedAt: entry.lastmod || null, source: 'remote' };
}

const pages = [];
const failures = [];
const concurrency = remote ? 16 : 32;
for (let offset = 0; offset < parsed.entries.length; offset += concurrency) {
  const batch = await Promise.all(parsed.entries.slice(offset, offset + concurrency).map(async (entry) => {
    try {
      return await loadPage(entry);
    } catch (error) {
      failures.push(error.message);
      return null;
    }
  }));
  for (const page of batch.filter(Boolean)) {
    const validation = validatePage(page.url, page.html);
    if (!validation.indexable) {
      failures.push(`${page.url}: ${validation.reason}`);
      continue;
    }
    pages.push(page);
  }
}
if (failures.length) throw new Error(`Content catalogue could not read ${failures.length} sitemap page(s):\n${failures.slice(0, 30).join('\n')}`);

const sitemapItemCount = pages.length;
const localItems = pages.map((page) => createContentItem(page, config));
for (const relativePath of config.additional_pages || []) {
  const path = join(siteRoot, relativePath);
  if (!existsSync(path)) throw new Error(`Missing configured additional page: ${relativePath}`);
  const url = `https://1200km.com/${relativePath.replace(/index\.html$/, '')}`;
  localItems.push(createContentItem({
    url,
    html: await readFile(path, 'utf8'),
    updatedAt: gitDate(join(sourceRoot, relativePath)),
    source: 'nonindex-local',
  }, config));
}
const indexDocuments = [];
for (const relativePath of config.major_indexes) {
  const path = join(siteRoot, relativePath);
  if (!existsSync(path)) throw new Error(`Missing configured major index: ${relativePath}`);
  indexDocuments.push({ relativePath, html: await readFile(path, 'utf8') });
}
const declaredItems = config.declared_items || [];
const externalItems = externalArticleItems(indexDocuments, config, [...localItems, ...declaredItems]);
const catalog = buildCatalog([...localItems, ...declaredItems, ...externalItems], config, remote ? 'deployable-domain-catalog' : 'local-source-catalog');

const serialized = `${JSON.stringify(catalog, null, 2)}\n`;
if (check) {
  if (!existsSync(output)) throw new Error(`Content catalogue is missing: ${output}`);
  const current = await readFile(output, 'utf8');
  if (current !== serialized) throw new Error('Content catalogue is stale. Run npm run build-content.');
  console.log(`Content catalogue is current: ${catalog.inventory.item_count} identities.`);
} else {
  await writeFile(output, serialized);
  console.log(`Wrote ${catalog.inventory.item_count} content identities to ${output}.`);
}
console.log(`Coverage: ${sitemapItemCount} sitemap pages, ${(config.additional_pages || []).length} additional noindex page(s), ${externalItems.length} externally canonical articles, ${catalog.inventory.indexable_count} indexable items.`);
