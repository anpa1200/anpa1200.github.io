#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const site = resolve(valueAfter('--site', ROOT));
const reportPath = resolve(valueAfter('--report', `/tmp/1200km-browser-quality-${process.pid}.json`));
const chrome = process.env.CHROME_PATH || 'google-chrome';
const axeSource = readFileSync(join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const allowlist = JSON.parse(readFileSync(join(ROOT, 'data', 'accessibility-allowlist.json'), 'utf8'));

if (!Array.isArray(allowlist.entries)) throw new Error('Accessibility allowlist must contain an entries array.');
for (const entry of allowlist.entries) {
  for (const field of ['rule', 'page', 'selector', 'reason', 'owner', 'expires']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) throw new Error(`Accessibility allowlist entry is missing ${field}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expires) || Date.parse(`${entry.expires}T23:59:59Z`) < Date.now()) {
    throw new Error(`Accessibility allowlist entry ${entry.rule} has an invalid or expired date.`);
  }
}

if (!existsSync(join(site, 'index.html'))) throw new Error(`Site root not found at ${site}`);

let pages = [
  ['home', '/'],
  ['about', '/about.html'],
  ['cv', '/cv.html'],
  ['selected-research', '/cti.html'],
  ['library', '/guides.html'],
  ['projects', '/projects.html'],
  ['search', '/search.html?q=T1059.003'],
  ['validation', '/external-validation.html'],
  ['adversarygraph', '/adversarygraph/'],
  ['threat-matrix', '/threat-matrix/'],
  ['docs', '/adversarygraph-docs/full-flow/'],
];

const articleCatalogPath = join(site, 'data', 'article-catalog.json');
if (existsSync(articleCatalogPath)) {
  const catalog = JSON.parse(readFileSync(articleCatalogPath, 'utf8'));
  pages.push(['articles', '/articles/']);
  const choices = [
    ['article-normal', catalog.find((row) => row.images <= 2 && row.code_blocks <= 2)],
    ['article-image-heavy', [...catalog].sort((a, b) => b.images - a.images)[0]],
    ['article-code-heavy', [...catalog].sort((a, b) => b.code_blocks - a.code_blocks)[0]],
    ['article-long-title', [...catalog].sort((a, b) => b.title.length - a.title.length)[0]],
    ['article-historical', [...catalog].sort((a, b) => a.published_at.localeCompare(b.published_at))[0]],
  ];
  const selected = new Set();
  for (const [label, row] of choices) {
    if (!row || selected.has(row.local_path)) continue;
    selected.add(row.local_path);
    pages.push([label, `/articles/read/${row.local_path}/`]);
  }
}
const onlyPage = valueAfter('--only', '');
if (onlyPage) pages = pages.filter(([name]) => name === onlyPage);
if (!pages.length) throw new Error(`No browser-quality page matched --only ${onlyPage}.`);
const viewports = [
  { label: 'mobile-dark', width: 390, height: 844, mobile: true, theme: 'dark' },
  { label: 'mobile-light', width: 390, height: 844, mobile: true, theme: 'light' },
  { label: 'desktop-dark', width: 1440, height: 1000, mobile: false, theme: 'dark' },
  { label: 'desktop-light', width: 1440, height: 1000, mobile: false, theme: 'light' },
];
const budgets = { cls: 0.1, lcp_ms: 4000, transfer_bytes: 6 * 1024 * 1024 };
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.pagefind': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream', '.pf_index': 'application/octet-stream',
};

function requestFile(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://127.0.0.1').pathname);
  let relative = pathname.replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const file = resolve(site, relative);
  return file.startsWith(`${site}/`) ? file : null;
}

const server = createServer((request, response) => {
  const file = requestFile(request.url || '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  response.writeHead(200, { 'cache-control': 'no-store', 'content-type': contentTypes[extname(file)] || 'application/octet-stream' });
  response.end(readFileSync(file));
});

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { method, resolve: resolvePromise, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

const wait = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
async function evaluate(devtools, sessionId, expression) {
  const result = await devtools.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

await mkdir(dirname(reportPath), { recursive: true });
await new Promise((resolvePromise, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolvePromise);
});
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
  '--disable-component-update', '--remote-debugging-port=0', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let browserLogs = '';
const websocketUrl = await new Promise((resolvePromise, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Chrome did not expose DevTools. ${browserLogs.slice(-2000)}`)), 15_000);
  browser.stderr.setEncoding('utf8');
  browser.stderr.on('data', (chunk) => {
    browserLogs = `${browserLogs}${chunk}`.slice(-12_000);
    const match = browserLogs.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (!match) return;
    clearTimeout(timeout);
    resolvePromise(match[1]);
  });
  browser.once('error', reject);
});

const socket = new WebSocket(websocketUrl);
await new Promise((resolvePromise, reject) => {
  socket.addEventListener('open', resolvePromise, { once: true });
  socket.addEventListener('error', () => reject(new Error('Unable to connect to Chrome DevTools')), { once: true });
});
const devtools = new DevTools(socket);
const { targetId } = await devtools.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await devtools.send('Target.attachToTarget', { targetId, flatten: true });
await devtools.send('Runtime.enable', {}, sessionId);
await devtools.send('Page.enable', {}, sessionId);
await devtools.send('Network.enable', {}, sessionId);
await devtools.send('Network.setBlockedURLs', { urls: [
  'https://www.googletagmanager.com/*', 'https://www.google-analytics.com/*',
  'https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*',
] }, sessionId);
await devtools.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__quality = { cls: 0, lcp: 0, shifts: [] };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__quality.cls += entry.value;
        window.__quality.shifts.push({
          startTime: Math.round(entry.startTime),
          value: Number(entry.value.toFixed(4)),
          sources: (entry.sources || []).slice(0, 5).map((source) => ({
            node: source.node ? (source.node.id ? '#' + source.node.id : source.node.tagName?.toLowerCase() + (source.node.classList?.length ? '.' + [...source.node.classList].slice(0, 3).join('.') : '')) : '',
            previousRect: source.previousRect ? { x: source.previousRect.x, y: source.previousRect.y, width: source.previousRect.width, height: source.previousRect.height } : null,
            currentRect: source.currentRect ? { x: source.currentRect.x, y: source.currentRect.y, width: source.currentRect.width, height: source.currentRect.height } : null,
          })),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) window.__quality.lcp = entries.at(-1).startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
` }, sessionId);

const results = [];
const failures = [];
function allowlisted(page, violation) {
  if (!violation.targets.length) return false;
  return violation.targets.every((target) => allowlist.entries.some((entry) =>
    entry.rule === violation.id && entry.page === page && entry.selector === target));
}
try {
  for (const viewport of viewports) {
    await devtools.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: viewport.theme }],
    }, sessionId);
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, screenWidth: viewport.width,
      screenHeight: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    }, sessionId);
    await devtools.send('Page.navigate', { url: origin }, sessionId);
    await wait(150);
    await evaluate(devtools, sessionId, `localStorage.setItem('theme', ${JSON.stringify(viewport.theme)})`);
    for (const [name, path] of pages) {
      await devtools.send('Network.clearBrowserCache', {}, sessionId);
      await devtools.send('Page.navigate', { url: `${origin}${path}` }, sessionId);
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (await evaluate(devtools, sessionId, `document.readyState === 'complete' && document.body?.textContent?.trim().length > 100`)) break;
        await wait(100);
      }
      await wait(450);
      await evaluate(devtools, sessionId, axeSource);
      const state = await evaluate(devtools, sessionId, `(async () => {
        const audit = await axe.run(document, { resultTypes: ['violations'] });
        const resources = performance.getEntriesByType('resource');
        return {
          url: location.href,
          title: document.title,
          h1Count: document.querySelectorAll('h1').length,
          mainCount: document.querySelectorAll('main').length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          cls: Number((window.__quality?.cls || 0).toFixed(4)),
          layout_shifts: window.__quality?.shifts || [],
          lcp_ms: Math.round(window.__quality?.lcp || 0),
          transfer_bytes: Math.round(resources.reduce((total, entry) => total + (entry.transferSize || 0), 0)),
          violations: audit.violations.map((item) => ({
            id: item.id, impact: item.impact, description: item.description,
            targets: item.nodes.slice(0, 5).map((node) => node.target.join(' ')),
            samples: item.nodes.slice(0, 5).map((node) => ({ html: node.html, failure: node.failureSummary })),
          })),
        };
      })()`);
      results.push({ page: name, viewport: viewport.label, ...state });
      const blocking = state.violations.filter((item) =>
        ['moderate', 'serious', 'critical'].includes(item.impact) && !allowlisted(name, item));
      if (blocking.length) failures.push(`${name}@${viewport.label}: ${blocking.length} unallowlisted moderate/serious/critical axe violation(s): ${blocking.map((item) => item.id).join(', ')}`);
      if (state.h1Count !== 1) failures.push(`${name}@${viewport.label}: expected one h1, found ${state.h1Count}`);
      if (state.mainCount !== 1) failures.push(`${name}@${viewport.label}: expected one main landmark, found ${state.mainCount}`);
      if (state.horizontalOverflow) failures.push(`${name}@${viewport.label}: horizontal page overflow`);
      if (state.cls > budgets.cls) failures.push(`${name}@${viewport.label}: CLS ${state.cls} exceeds ${budgets.cls}`);
      if (state.lcp_ms > budgets.lcp_ms) failures.push(`${name}@${viewport.label}: local LCP ${state.lcp_ms}ms exceeds ${budgets.lcp_ms}ms`);
      if (state.transfer_bytes > budgets.transfer_bytes) failures.push(`${name}@${viewport.label}: transfer ${state.transfer_bytes} exceeds ${budgets.transfer_bytes}`);
    }
  }
} finally {
  await writeFile(reportPath, `${JSON.stringify({ generated_at: new Date().toISOString(), site, budgets, accessibility_allowlist: allowlist.entries, results, failures }, null, 2)}\n`);
  socket.close();
  browser.kill('SIGTERM');
  server.close();
}

if (failures.length) {
  console.error(`Browser quality gate failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`Report: ${reportPath}`);
  process.exit(1);
}
console.log(`Browser quality gate passed for ${pages.length} pages at ${viewports.length} viewports.`);
console.log(`Report: ${reportPath}`);
