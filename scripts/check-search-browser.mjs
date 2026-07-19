#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const bundleIndex = args.indexOf('--bundle');
const bundle = resolve(bundleIndex >= 0 ? args[bundleIndex + 1] : 'pagefind');
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const chrome = process.env.CHROME_PATH || 'google-chrome';

if (!existsSync(join(bundle, 'pagefind.js'))) throw new Error(`Pagefind bundle not found at ${bundle}`);
if (!existsSync(join(site, 'index.html'))) throw new Error(`Site root not found at ${site}`);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pagefind': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function fileForRequest(requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  const base = pathname.startsWith('/pagefind/') ? bundle : site;
  let relative = pathname.startsWith('/pagefind/') ? pathname.slice('/pagefind/'.length) : pathname.replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const file = resolve(base, relative);
  if (!file.startsWith(`${base}/`)) return null;
  return file;
}

const server = createServer((request, response) => {
  const file = fileForRequest(request.url || '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': contentTypes[extname(file)] || 'application/octet-stream',
  });
  response.end(readFileSync(file));
});

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        this.events.push(message);
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
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

function wait(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitForExpression(devtools, sessionId, expression, label, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    const evaluation = await devtools.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId);
    lastValue = evaluation.result?.value;
    if (lastValue) return lastValue;
    await wait(150);
  }
  const diagnostics = devtools.events.filter((event) =>
    ['Log.entryAdded', 'Network.loadingFailed', 'Runtime.consoleAPICalled', 'Runtime.exceptionThrown'].includes(event.method)
  ).slice(-20);
  const pageDiagnostics = await devtools.send('Runtime.evaluate', {
    expression: `(() => {
      const manager = window.PagefindComponents?.getInstanceManager?.();
      const instance = manager?.getInstance?.('default');
      return {
        status: document.querySelector('[data-site-search-status]')?.textContent,
        summary: document.querySelector('.pf-searchbox-status, pagefind-summary')?.textContent,
        resultsBusy: document.querySelector('.pf-searchbox-results, pagefind-results .pf-results')?.getAttribute('aria-busy'),
        renderedResults: document.querySelectorAll('.pf-searchbox-result, pagefind-results .pf-result-link').length,
        input: document.querySelector('pagefind-searchbox input, pagefind-input input')?.value,
        resources: performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/pagefind/')),
        instance: instance ? {
          options: instance.options,
          pagefindOptions: instance.pagefindOptions,
          searchTerm: instance.searchTerm,
          searchId: instance.__searchID__,
          loading: Boolean(instance.__loadPromise__),
          loaded: Boolean(instance.__pagefind__),
          components: instance.components?.map((component) => component.tagName),
        } : null,
      };
    })()`,
    returnByValue: true,
  }, sessionId);
  throw new Error(`Timed out waiting for ${label}; last value: ${JSON.stringify(lastValue)}; page state: ${JSON.stringify(pageDiagnostics.result?.value)}; browser events: ${JSON.stringify(diagnostics)}`);
}

async function evaluate(devtools, sessionId, expression) {
  const result = await devtools.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function attachPage(devtools, url, metrics = null) {
  const { targetId } = await devtools.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await devtools.send('Target.attachToTarget', { targetId, flatten: true });
  await devtools.send('Runtime.enable', {}, sessionId);
  await devtools.send('Page.enable', {}, sessionId);
  await devtools.send('Log.enable', {}, sessionId);
  await devtools.send('Network.enable', {}, sessionId);
  await devtools.send('Network.setBlockedURLs', {
    urls: [
      'https://www.googletagmanager.com/*',
      'https://www.google-analytics.com/*',
      'https://analytics.google.com/*',
      'https://region1.google-analytics.com/*',
      'https://fonts.googleapis.com/*',
      'https://fonts.gstatic.com/*',
    ],
  }, sessionId);
  if (metrics) await devtools.send('Emulation.setDeviceMetricsOverride', metrics, sessionId);
  await devtools.send('Page.navigate', { url }, sessionId);
  await waitForExpression(
    devtools,
    sessionId,
    `document.readyState === 'interactive' || document.readyState === 'complete'`,
    `navigation to ${new URL(url).pathname}`
  );
  return { targetId, sessionId };
}

await new Promise((resolvePromise, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolvePromise);
});
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const profile = await mkdtemp(join(tmpdir(), '1200km-search-chrome-'));
const browser = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-background-networking',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
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
  browser.once('error', (error) => {
    clearTimeout(timeout);
    reject(error);
  });
  browser.once('exit', (code) => {
    if (code !== null && code !== 0) {
      clearTimeout(timeout);
      reject(new Error(`Chrome exited with ${code}. ${browserLogs.slice(-2000)}`));
    }
  });
});

const socket = new WebSocket(websocketUrl);
await new Promise((resolvePromise, reject) => {
  socket.addEventListener('open', resolvePromise, { once: true });
  socket.addEventListener('error', () => reject(new Error('Unable to connect to Chrome DevTools')), { once: true });
});
const devtools = new DevTools(socket);
const failures = [];

try {
  const searchPage = await attachPage(devtools, `${origin}/search.html?q=T1059.003`, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(document.querySelector('[data-site-search-status][data-state="ready"]'))`,
    'search component readiness'
  );
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(document.querySelector('[data-site-search-page] .pf-searchbox-result[href]')) && document.querySelector('[data-site-search-page] .pf-searchbox-results')?.getAttribute('aria-busy') !== 'true'`,
    'live autocomplete results'
  );

  const searchState = await evaluate(devtools, searchPage.sessionId, `(() => ({
    input: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.value,
    results: Array.from(document.querySelectorAll('[data-site-search-page] .pf-searchbox-result[href]')).slice(0, 5).map((link) => ({ path: new URL(link.href).pathname, text: link.textContent.trim() })),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    error: document.querySelector('.pf-error')?.textContent || '',
    role: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('role'),
    autocomplete: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-autocomplete'),
    expanded: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-expanded'),
    controls: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-controls'),
    listbox: document.querySelector('[data-site-search-page] .pf-searchbox-results')?.getAttribute('role'),
    activeDescendant: document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-activedescendant'),
    controlledRole: document.getElementById(document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-controls') || '')?.getAttribute('role'),
    activeSelected: document.getElementById(document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-activedescendant') || '')?.getAttribute('aria-selected'),
  }))()`);
  if (searchState.input !== 'T1059.003') failures.push(`query hydration failed: ${searchState.input}`);
  if (searchState.results[0]?.path !== '/threat-matrix/techniques/T1059.003/') {
    failures.push(`entity autocomplete ranking failed: ${JSON.stringify(searchState.results)}`);
  }
  if (searchState.overflow) failures.push('mobile search page has horizontal overflow');
  if (searchState.error) failures.push(`Pagefind rendered an error: ${searchState.error}`);
  if (searchState.role !== 'combobox' || searchState.autocomplete !== 'list' || searchState.listbox !== 'listbox' || searchState.controlledRole !== 'listbox') {
    failures.push(`autocomplete semantics are incomplete: ${JSON.stringify(searchState)}`);
  }
  if (searchState.expanded !== 'true' || !searchState.controls || !searchState.activeDescendant || searchState.activeSelected !== 'true') {
    failures.push(`autocomplete state is not exposed to assistive technology: ${JSON.stringify(searchState)}`);
  }

  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-page] .pf-searchbox-input').focus()`);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40,
  }, searchPage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40,
  }, searchPage.sessionId);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-activedescendant') !== ${JSON.stringify(searchState.activeDescendant)}`,
    'autocomplete ArrowDown selection'
  );
  const downSelection = await evaluate(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-activedescendant')`
  );
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38,
  }, searchPage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38,
  }, searchPage.sessionId);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-page] .pf-searchbox-input')?.getAttribute('aria-activedescendant') !== ${JSON.stringify(downSelection)}`,
    'autocomplete ArrowUp selection'
  );

  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] .pf-searchbox-input');
    input.value = '"zxqvnevermatches1200km"';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(document.querySelector('[data-site-search-page] .pf-searchbox-empty'))`,
    'autocomplete zero-result state'
  );
  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] .pf-searchbox-input');
    input.value = 'T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-page] .pf-searchbox-input')?.value === 'T1059.003' && new URL(document.querySelector('[data-site-search-page] .pf-searchbox-result[href]')?.href || location.href).pathname === '/threat-matrix/techniques/T1059.003/'`,
    'autocomplete recovery after zero results'
  );

  const homePage = await attachPage(devtools, `${origin}/`, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `Boolean(document.querySelector('.site-search-host .pf-trigger-btn[aria-haspopup="dialog"][aria-keyshortcuts]'))`,
    'global search trigger'
  );
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `Boolean(document.querySelector('#site-search-modal dialog')?.open)`,
    'Ctrl+K modal open'
  );
  const mobileModalState = await evaluate(devtools, homePage.sessionId, `(() => {
    const rect = document.querySelector('#site-search-modal dialog').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      withinViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1,
    };
  })()`);
  if (mobileModalState.overflow || !mobileModalState.withinViewport) {
    failures.push(`mobile modal layout failed: ${JSON.stringify(mobileModalState)}`);
  }
  await evaluate(devtools, homePage.sessionId, `(() => {
    const input = document.querySelector('#site-search-modal .pf-input');
    input.value = 'T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `Boolean(document.querySelector('#site-search-modal .pf-result-link')) && document.querySelector('#site-search-modal .pf-results')?.getAttribute('aria-busy') !== 'true'`,
    'modal live search results'
  );
  const modalTopPath = await evaluate(
    devtools,
    homePage.sessionId,
    `new URL(document.querySelector('#site-search-modal .pf-result-link').href).pathname`
  );
  if (modalTopPath !== '/threat-matrix/techniques/T1059.003/') {
    failures.push(`modal entity ranking failed: ${modalTopPath}`);
  }
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `!document.querySelector('#site-search-modal dialog')?.open && document.activeElement === document.querySelector('.site-search-host .pf-trigger-btn')`,
    'modal close and focus restoration'
  );

  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-page] .pf-searchbox-input').focus()`);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
  }, searchPage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
  }, searchPage.sessionId);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `location.pathname === '/threat-matrix/techniques/T1059.003/'`,
    'autocomplete Enter navigation'
  );

  const entityFile = join(site, 'threat-matrix', 'techniques', 'T1059.003', 'index.html');
  if (existsSync(entityFile) && /site-search\.js/i.test(readFileSync(entityFile, 'utf8'))) {
    await waitForExpression(
      devtools,
      searchPage.sessionId,
      `Boolean(document.querySelector('.site-search-host--floating .pf-trigger-btn')) && document.documentElement.scrollWidth <= window.innerWidth + 1`,
      'mobile entity search trigger'
    );
  }

  const integrationChecks = [
    {
      file: join(site, 'newest-detection-engineering-techniques', 'index.html'),
      url: `${origin}/newest-detection-engineering-techniques/`,
      selector: '.site-search-host--standalone .pf-trigger-btn',
      label: 'CSP-protected standalone page search',
    },
    {
      file: join(site, 'ITDR', 'docs', 'iga', 'iga-overview', 'index.html'),
      url: `${origin}/ITDR/docs/iga/iga-overview/`,
      selector: '.site-search-host--docusaurus .pf-trigger-btn',
      label: 'Docusaurus page search',
    },
  ];
  for (const check of integrationChecks) {
    if (!existsSync(check.file) || !/site-search\.js/i.test(readFileSync(check.file, 'utf8'))) continue;
    const page = await attachPage(devtools, check.url);
    await waitForExpression(
      devtools,
      page.sessionId,
      `Boolean(document.querySelector(${JSON.stringify(check.selector)})) && !document.querySelector('.pf-error')`,
      check.label
    );
    await devtools.send('Target.closeTarget', { targetId: page.targetId });
  }

  const browserErrors = devtools.events.filter((event) =>
    event.method === 'Runtime.exceptionThrown'
    || (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params?.entry?.level))
  );
  const relevantErrors = browserErrors.filter((event) => !/favicon|googleapis|gstatic|googletagmanager|google-analytics/i.test(JSON.stringify(event)));
  if (relevantErrors.length) failures.push(`browser console errors: ${JSON.stringify(relevantErrors.slice(0, 5))}`);

  await devtools.send('Target.closeTarget', { targetId: searchPage.targetId });
  await devtools.send('Target.closeTarget', { targetId: homePage.targetId });
} finally {
  socket.close();
  if (browser.exitCode === null) {
    const exited = new Promise((resolvePromise) => browser.once('exit', resolvePromise));
    browser.kill('SIGTERM');
    await Promise.race([exited, wait(3_000)]);
  }
  await new Promise((resolvePromise) => server.close(resolvePromise));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

if (failures.length) {
  console.error('Browser search smoke test failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Browser search smoke test passed (ARIA autocomplete, ranking, zero-result recovery, responsive layout, keyboard flow, and standalone/Docusaurus/entity integrations).');
