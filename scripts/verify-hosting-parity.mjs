#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkStaticArtifact, artifactFiles } from './check-static-artifact.mjs';
import { canonicalUrls, CHECKED_HEADERS, comparableHeader, expectedMime, localAsset, sha256, withoutBuildIdentity } from './hosting-parity-lib.mjs';
import { MARKDOWN_ROUTES, parseHeaderPolicy, responseHeaders } from '../cloudflare/site-worker-lib.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback = '') => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const site = resolve(option('--site', 'dist'));
const preview = new URL(option('--preview-origin'));
const production = new URL(option('--production-origin', 'https://1200km.com'));
assert.ok((preview.protocol === 'https:' && preview.hostname.endsWith('.workers.dev'))
  || (preview.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(preview.hostname)), 'Preview must be workers.dev or a loopback test server');
assert.equal(preview.pathname, '/', 'Preview URL must be an origin, not a path');
assert.equal(preview.search, '');
const reportPath = resolve(option('--report', '/tmp/1200km-hosting-parity.json'));
const artifact = await checkStaticArtifact(site);
const paths = new Set((await artifactFiles(site)).map((path) => relative(site, path).replaceAll('\\', '/')));
const rules = parseHeaderPolicy(await readFile(join(site, '_headers'), 'utf8'));
const report = {
  generated_at: new Date().toISOString(), preview_origin: preview.origin, production_origin: production.origin,
  artifact, preview_failures: [], production_differences: [], responses: [],
  note: 'HTTP GET/HEAD only. No production mutations. Build identity is compared exactly to the downloaded artifact, not assumed equal to another release. Browser search is a separate check.',
};
const nonce = `${Date.now()}-${artifact.identity.site_commit.slice(0, 8)}`;

async function fetchRecord(origin, path, accept = '*/*', method = 'GET', extraHeaders = {}) {
  const url = new URL(path, origin);
  url.searchParams.set('__hosting_verify', nonce);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method, redirect: 'manual', cache: 'no-store',
        headers: { Accept: accept, 'Cache-Control': 'no-cache', Pragma: 'no-cache', ...extraHeaders }, signal: AbortSignal.timeout(25_000) });
      if (response.status >= 500 && attempt < 2) { await response.body?.cancel(); continue; }
      const body = Buffer.from(await response.arrayBuffer());
      return { requested_url: url.href, status: response.status, headers: Object.fromEntries(response.headers), bytes: body.length, sha256: sha256(body), body };
    } catch (error) { lastError = error; }
  }
  throw lastError;
}
const publicRecord = ({ body, ...record }) => record;
const fail = (path, check, detail) => report.preview_failures.push({ path, check, detail });
const difference = (path, check, expected, actual, classification = 'cutover-blocker') => report.production_differences.push({ path, check, production: expected, preview: actual, classification });
function check(condition, path, label, detail) { if (!condition) fail(path, label, detail); }

async function compare(path, accept = '*/*', method = 'GET') {
  const label = `${method} ${path}${accept.includes('markdown') ? ' [Markdown]' : ''}`;
  const pathname = new URL(path, preview).pathname;
  try {
    const [next, old] = await Promise.all([fetchRecord(preview, path, accept, method), fetchRecord(production, path, accept, method)]);
    let expected = localAsset(pathname, paths);
    const alternate = MARKDOWN_ROUTES.get(pathname)?.slice(1);
    const markdown = method === 'GET' && accept.includes('markdown') && alternate && paths.has(alternate);
    if (markdown) expected = { status: 200, asset: alternate };
    check(next.status === expected.status, label, 'status versus artifact', { expected: expected.status, actual: next.status });
    let expectedBody = null;
    if (expected.asset && method !== 'HEAD') {
      expectedBody = await readFile(join(site, expected.asset));
      check(next.sha256 === sha256(expectedBody), label, 'exact body versus artifact', { asset: expected.asset, expected: sha256(expectedBody), actual: next.sha256 });
      if (expected.asset.endsWith('.html')) {
        const canonicals = canonicalUrls(next.body.toString());
        check(JSON.stringify(canonicals) === JSON.stringify(canonicalUrls(expectedBody.toString())), label, 'canonical preserved', canonicals);
        check(!canonicals.some((url) => url.includes('.workers.dev')), label, 'no preview canonical rewrite', canonicals);
      }
    }
    if (method === 'HEAD') check(next.bytes === 0, label, 'empty HEAD body', next.bytes);
    const required = responseHeaders({}, pathname, rules);
    if (expected.status === 404) required.set('Content-Type', 'text/html; charset=utf-8');
    if (markdown) required.set('Content-Type', 'text/markdown; charset=utf-8');
    for (const [name, value] of required) {
      if (name === 'vary') check((next.headers.vary || '').toLowerCase().split(/,\s*/).includes('accept'), label, 'Vary Accept', next.headers.vary);
      else check(comparableHeader(name, next.headers[name]) === comparableHeader(name, value), label, `${name} policy`, { expected: value, actual: next.headers[name] || null });
    }
    if (expected.asset && !required.has('Content-Type')) {
      const mime = expectedMime(expected.asset);
      const actual = comparableHeader('content-type', next.headers['content-type'] || '');
      const normalized = comparableHeader('content-type', mime);
      check(normalized.includes(';') ? actual === normalized : actual.split(';')[0] === normalized, label, 'asset MIME', { expected: mime, actual });
    }
    if (markdown) {
      check(next.headers['x-markdown-tokens'] === String(Math.ceil(expectedBody.toString().split(/\s+/).filter(Boolean).length * 1.33)), label, 'Markdown token estimate', next.headers['x-markdown-tokens']);
    }
    if (preview.hostname.endsWith('.workers.dev')) check(next.headers['x-robots-tag'] === 'noindex', label, 'preview not indexed', next.headers['x-robots-tag']);
    if (expected.status === 301) {
      const location = new URL(next.headers.location || '', next.requested_url);
      const requested = new URL(next.requested_url);
      check(location.origin === preview.origin && location.pathname === `${pathname}/` && location.search === requested.search && !location.hash, label, 'directory redirect URL/query', next.headers.location);
    } else check(!next.headers.location, label, 'no unwanted redirect', next.headers.location);

    if (old.status !== next.status) difference(label, 'HTTP status', old.status, next.status);
    const oldLocation = old.headers.location ? new URL(old.headers.location, old.requested_url) : null;
    const nextLocation = next.headers.location ? new URL(next.headers.location, next.requested_url) : null;
    const relativeLocation = (url) => url ? `${url.pathname}${url.search}${url.hash}` : null;
    if (relativeLocation(oldLocation) !== relativeLocation(nextLocation)) difference(label, 'redirect target', relativeLocation(oldLocation), relativeLocation(nextLocation));
    if (oldLocation && oldLocation.origin !== production.origin) difference(label, 'external production redirect requires review', oldLocation.href, nextLocation?.href);
    if (old.sha256 !== next.sha256 && method !== 'HEAD') {
      let classification = 'cutover-blocker';
      if (pathname === '/build.json') classification = 'expected-distinct-build-identity';
      else if (old.status === next.status && [301, 302, 307, 308].includes(next.status)) classification = 'provider-redirect-body';
      else if (markdown && old.status === 200 && old.headers['content-type']?.startsWith('text/html')) classification = 'configured-agent-policy-not-live';
      else if (withoutBuildIdentity(old.body.toString()) === withoutBuildIdentity(next.body.toString())) classification = 'expected-HTML-build-marker';
      difference(label, 'response body SHA-256', old.sha256, next.sha256, classification);
    }
    if (!markdown && next.headers['content-type']?.startsWith('text/html') && old.status === next.status) {
      const before = canonicalUrls(old.body.toString());
      const after = canonicalUrls(next.body.toString());
      if (JSON.stringify(before) !== JSON.stringify(after)) difference(label, 'canonical URLs', before, after);
    }
    for (const name of CHECKED_HEADERS) {
      const before = comparableHeader(name, old.headers[name]);
      const after = comparableHeader(name, next.headers[name]);
      if (before === after) continue;
      let classification = 'cutover-blocker';
      if (name === 'x-robots-tag' && after === 'noindex') classification = 'preview-only-noindex';
      else if (name === 'vary') classification = 'provider-cache-variation';
      else if (!before && ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options', 'link'].includes(name)) classification = 'configured-edge-policy-not-live';
      else if (name === 'content-type' && (markdown || pathname.startsWith('/.well-known/') || pathname.endsWith('.md'))) classification = 'configured-agent-policy-not-live';
      difference(label, name, old.headers[name] || null, next.headers[name] || null, classification);
    }
    report.responses.push({ path, accept, method, asset: expected.asset, preview: publicRecord(next), production: publicRecord(old) });
  } catch (error) { fail(label, 'request or comparison failed', error.message); }
}

const baseline = await fetchRecord(production, '/build.json');
report.production_before = JSON.parse(baseline.body);
const cases = new Set([
  '/', '/index.html', '/index', '/about.html', '/about', '/about/', '/projects.html', '/projects/',
  '/articles/', '/articles/index.html', '/articles?query=a%20b&tag=T1595',
  '/ttp-simulation/', '/ttp-simulation/techniques/enterprise/T1595/', '/attack-tools/', '/detection-rules/',
  '/cyber-knowledge/', '/courses/', '/ai-security-course/module-00/chapter-04.html',
  '/threat-matrix/', '/threat-matrix/techniques/T1059.003/', '/attack-matrix/',
  '/anomaly-detection-atlas/', '/anomaly-detection-atlas/attack-statistical-anomaly-mapping/',
  '/build.json', '/sitemap.xml', '/sitemap-all.xml', '/robots.txt', '/llms.txt', '/llms-full.txt',
  '/agent-index.md', '/auth.md', '/data/site-facts.json', '/data/site-facts.schema.json',
  '/data/article-archive-build.json', '/assets/site-search.js', '/assets/interactive-matrix.mjs',
  '/pagefind/pagefind.js', '/pagefind/pagefind-entry.json', '/404.html', '/__hosting_migration_not_found__',
  '/articles/__hosting_migration_not_found__/', '/__hosting_migration_not_found__.json',
]);
for (const path of paths) if (path.startsWith('.well-known/')) cases.add(`/${path}`);
const article = [...paths].find((path) => path.startsWith('articles/read/') && path.includes('big-pharma') && path.endsWith('/index.html'))
  || [...paths].find((path) => path.startsWith('articles/read/') && path.endsWith('/index.html'));
assert.ok(article, 'Representative article must be present in complete artifact');
cases.add(`/${article.slice(0, -'index.html'.length)}`);
const knowledge = [...paths].find((path) => /^cyber-knowledge\/[^/]+\/index.html$/.test(path));
assert.ok(knowledge, 'Cyber Knowledge field guide missing');
cases.add(`/${knowledge.slice(0, -'index.html'.length)}`);
for (const expression of [/^assets\/.*\.css$/, /^assets\/.*\.png$/, /^assets\/.*\.webp$/, /\.woff2$/, /^pagefind\/.*\.wasm$/, /^pagefind\/.*\.pagefind$/, /^pagefind\/fragment\//, /^pagefind\/index\//]) {
  const path = [...paths].find((entry) => expression.test(entry));
  if (path) cases.add(`/${path}`);
}
for (const entry of JSON.parse(await readFile(join(ROOT, 'seo/remote-sitemaps.json'), 'utf8'))) {
  const path = new URL(entry.url).pathname;
  cases.add(path);
  cases.add(path.replace(/sitemap\.xml$/, ''));
}
for (const entry of JSON.parse(await readFile(join(ROOT, 'seo/remote-pages.json'), 'utf8'))) cases.add(new URL(entry.url).pathname);

// Audit every same-origin sitemap URL against the exact artifact. Missing
// companion pages remain visible even when a few representative routes pass.
const sitemap = await readFile(join(site, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
const absent = sitemapUrls.filter((entry) => {
  const url = new URL(entry);
  return url.origin === production.origin && localAsset(url.pathname, paths).status === 404;
});
report.sitemap_inventory = { total_urls: sitemapUrls.length, missing_from_artifact: absent };
for (const path of absent.slice(0, 12)) cases.add(new URL(path).pathname);
if (absent.length) difference('sitemap.xml', 'same-origin URLs absent from artifact', `${absent.length} published sitemap URLs`, 'not served by this ASSETS-only deployment');

const jobs = [...cases].map((path) => [path, '*/*', 'GET']);
for (const path of MARKDOWN_ROUTES.keys()) jobs.push([`${path}?format=markdown`, 'text/markdown', 'GET']);
for (const path of ['/', '/about.html', '/articles', '/__hosting_migration_not_found__']) jobs.push([path, '*/*', 'HEAD']);
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < jobs.length) await compare(...jobs[cursor++]);
}));
const publishedBuild = report.responses.find((entry) => entry.path === '/build.json');
check(publishedBuild?.preview.sha256 === sha256(await readFile(join(site, 'build.json'))), '/build.json', 'exact quality build identity', publishedBuild?.preview.sha256);
const after = await fetchRecord(production, '/build.json');
report.production_after = JSON.parse(after.body);
report.production_unchanged = baseline.sha256 === after.sha256;
if (!report.production_unchanged) difference('/build.json', 'production changed during comparison; rerun on stable baseline', report.production_before, report.production_after);
const [previewRange, productionRange] = await Promise.all([preview, production].map((origin) => fetchRecord(origin, '/about.html', '*/*', 'GET', { Range: 'bytes=0-9', 'Accept-Encoding': 'identity' })));
report.range_probe = { preview: publicRecord(previewRange), production: publicRecord(productionRange) };
const about = await readFile(join(site, 'about.html'));
check([200, 206].includes(previewRange.status), 'Range /about.html', 'valid range response status', previewRange.status);
check(previewRange.sha256 === sha256(previewRange.status === 206 ? about.subarray(0, 10) : about), 'Range /about.html', 'range body versus artifact', previewRange.sha256);
if (previewRange.status !== productionRange.status) difference('Range /about.html', 'partial-response support', productionRange.status, previewRange.status, 'provider-range-full-body-fallback');
report.summary = {
  http_cases: jobs.length, preview_contract_failures: report.preview_failures.length,
  production_differences: report.production_differences.length,
  cutover_blockers: report.production_differences.filter((entry) => entry.classification === 'cutover-blocker').length,
  deployment_scope: 'workers.dev only; no custom-domain cutover',
};
report.summary.ready_for_cutover = report.summary.preview_contract_failures === 0 && report.summary.production_differences === 0;
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report.summary, report: reportPath }, null, 2));
// An exploratory preview may explicitly request --report-only-differences.
// It never suppresses an artifact/header/URL contract failure. Default CI is
// strict about unknown differences and missing companion routes.
if (report.preview_failures.length || (report.summary.cutover_blockers && !args.includes('--report-only-differences'))) process.exitCode = 1;
