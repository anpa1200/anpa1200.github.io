#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const bundleIndex = args.indexOf('--bundle');
const bundle = resolve(bundleIndex >= 0 ? args[bundleIndex + 1] : 'pagefind');
const remote = args.includes('--remote');
const minimumPages = remote ? 1600 : 1000;
const required = [
  'pagefind.js',
  'pagefind-component-ui.js',
  'pagefind-component-ui.css',
  'pagefind-worker.js',
  'pagefind-entry.json',
  'search-build.json',
  'wasm.en.pagefind',
];
const failures = [];

for (const file of required) {
  const path = join(bundle, file);
  if (!existsSync(path) || statSync(path).size === 0) failures.push(`missing or empty ${file}`);
}

let build;
try {
  build = JSON.parse(readFileSync(join(bundle, 'search-build.json'), 'utf8'));
  if (build.pagefindVersion !== '1.5.2') failures.push(`expected Pagefind 1.5.2, found ${build.pagefindVersion}`);
  if (build.indexedPages < minimumPages) failures.push(`expected at least ${minimumPages} indexed pages, found ${build.indexedPages}`);
  if (build.failedPages > (remote ? 12 : 0)) failures.push(`too many failed pages: ${build.failedPages}`);
} catch (error) {
  failures.push(`invalid search-build.json: ${error.message}`);
}

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pagefind': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
};

function safeBundlePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname).replace(/^\/+/, '');
  const path = resolve(bundle, pathname);
  return path.startsWith(`${bundle}/`) ? path : null;
}

async function checkQueries() {
  const server = createServer((request, response) => {
    const file = safeBundlePath(request.url || '/');
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(readFileSync(file));
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  const basePath = `http://127.0.0.1:${address.port}/`;

  try {
    const module = await import(`${pathToFileURL(join(bundle, 'pagefind.js')).href}?check=${Date.now()}`);
    const search = module.createInstance({
      basePath,
      baseUrl: '/',
      language: 'en',
      noWorker: true,
      ranking: {
        pageLength: 0.5,
        termFrequency: 0.8,
        termSimilarity: 1,
        metaWeights: { title: 10, identifier: 20, aliases: 12, description: 3, collection: 2 },
      },
    });
    await search.init();
    const checks = [
      { query: 'T1059.003', expectedPrefix: '/threat-matrix/techniques/T1059.003/', first: true },
      { query: 'T1059.00', expectedPrefix: '/threat-matrix/techniques/T1059.0', first: true },
      { query: 'G0034', expectedPrefix: '/threat-matrix/actors/G0034/', first: true },
      { query: 'G0069', expectedPrefix: '/threat-matrix/actors/G0069/', first: true },
      { query: 'MuddyWater', expectedPrefix: '/threat-matrix/actors/G0069/' },
      { query: 'Kerberoasting', expectedPrefix: '/ITDR/' },
      { query: 'Kerberosting', expectedPrefix: '/ITDR/' },
      { query: 'IOC enrichment', expectedPrefix: '/adversarygraph' },
    ];
    for (const { query, expectedPrefix, first = false } of checks) {
      const result = await search.search(query);
      const top = await Promise.all(result.results.slice(0, 10).map((item) => item.data()));
      console.log(`Search quality "${query}": ${top.map((item) => item.url).join(', ') || '(no results)'}`);
      if (!top.length) {
        failures.push(`query "${query}" returned no results`);
        continue;
      }
      const expected = top.findIndex((item) => item.url.startsWith(expectedPrefix));
      if (expected < 0) {
        failures.push(`query "${query}" did not return ${expectedPrefix} in the top ten (got ${top.map((item) => item.url).join(', ')})`);
      }
      if (first && expected !== 0) {
        failures.push(`identifier query "${query}" should rank its entity first (rank was ${expected + 1})`);
      }
    }
    await search.destroy();
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}

if (!failures.length) {
  try {
    await checkQueries();
  } catch (error) {
    failures.push(`query validation crashed: ${error.stack || error.message}`);
  }
}

if (failures.length) {
  console.error('Search index check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Search index check passed (${build.indexedPages} pages, Pagefind ${build.pagefindVersion}).`);
