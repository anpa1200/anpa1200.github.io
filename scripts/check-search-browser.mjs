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

async function activateLazySearch(devtools, sessionId) {
  await waitForExpression(
    devtools,
    sessionId,
    `Boolean(document.querySelector('.site-search-host, [data-site-search-hero]'))`,
    'progressive search fallback',
  );
  await evaluate(devtools, sessionId, `(() => {
    const target = document.querySelector('.site-search-host, [data-site-search-hero]');
    if (target) target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    return Boolean(target);
  })()`);
}

async function attachPage(devtools, url, metrics = null, options = {}) {
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
  if (options.disableScripts) await devtools.send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
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
  '--disable-dev-shm-usage',
  '--disable-software-rasterizer',
  '--disable-background-networking',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let browserLogs = '';
const websocketUrl = await new Promise((resolvePromise, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Chrome did not expose DevTools. ${browserLogs.slice(-2000)}`)), 45_000);
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
    `/T1059\.003/.test(document.querySelector('[data-site-search-summary] .pf-summary')?.textContent || '') && document.querySelectorAll('[data-site-search-results] .pf-result').length > 0 && document.querySelector('[data-site-search-results] .pf-results')?.getAttribute('aria-busy') !== 'true'`,
    'full-page result placeholders'
  );
  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-results] .pf-result')?.scrollIntoView({ block: 'center' })`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(document.querySelector('[data-site-search-results] .pf-result-link[href]')) && document.querySelector('[data-site-search-results] .pf-results')?.getAttribute('aria-busy') !== 'true'`,
    'live full-page results'
  );

  const searchState = await evaluate(devtools, searchPage.sessionId, `(() => ({
    input: document.querySelector('[data-site-search-page] pagefind-input .pf-input')?.value,
    results: Array.from(document.querySelectorAll('[data-site-search-results] .pf-result-link[href]')).slice(0, 5).map((link) => ({ path: new URL(link.href).pathname, text: link.textContent.trim() })),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    error: document.querySelector('.pf-error')?.textContent || '',
    inputType: document.querySelector('[data-site-search-page] pagefind-input .pf-input')?.type,
    inputLabel: document.querySelector('[data-site-search-page] pagefind-input .pf-input')?.closest('[role="search"]')?.getAttribute('aria-label'),
    resultsLabel: document.querySelector('[data-site-search-results] .pf-results')?.getAttribute('aria-label'),
    summary: document.querySelector('[data-site-search-summary] .pf-summary')?.textContent,
  }))()`);
  if (searchState.input !== 'T1059.003') failures.push(`query hydration failed: ${searchState.input}`);
  if (searchState.results[0]?.path !== '/threat-matrix/techniques/T1059.003/') {
    failures.push(`entity full-page ranking failed: ${JSON.stringify(searchState.results)}`);
  }
  if (searchState.overflow) failures.push('mobile search page has horizontal overflow');
  if (searchState.error) failures.push(`Pagefind rendered an error: ${searchState.error}`);
  if (searchState.inputType !== 'search' || !/search/i.test(searchState.inputLabel || '') || !/results/i.test(searchState.resultsLabel || '') || !/result/i.test(searchState.summary || '')) {
    failures.push(`full-page search semantics are incomplete: ${JSON.stringify(searchState)}`);
  }

  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-page] pagefind-input .pf-input').focus()`);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40,
  }, searchPage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40,
  }, searchPage.sessionId);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.activeElement === document.querySelector('[data-site-search-results] .pf-result-link')`,
    'full-page ArrowDown result navigation'
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
    `document.activeElement === document.querySelector('[data-site-search-page] pagefind-input .pf-input')`,
    'full-page ArrowUp input navigation'
  );

  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = '"zxqvnevermatches1200km"';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `/no results/i.test(document.querySelector('[data-site-search-summary] .pf-summary')?.textContent || '')`,
    'full-page zero-result state'
  );
  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = 'T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-page] pagefind-input .pf-input')?.value === 'T1059.003' && new URL(document.querySelector('[data-site-search-results] .pf-result-link[href]')?.href || location.href).pathname === '/threat-matrix/techniques/T1059.003/'`,
    'full-page recovery after zero results'
  );
  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = 'threat intelligence';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `/\\bcore\\b/i.test(document.querySelector('[data-site-search-results] .pf-result:first-child .site-search-result-meta')?.textContent || '')`,
    'broad search prefers governed core content'
  );
  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = 'Historical AdversaryGraph v4 Capability Map';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `new URL(document.querySelector('[data-site-search-results] .pf-result-link[href]')?.href || location.href).pathname === '/articles/adversarygraph-v2-self-hosted-ai-cti-platform.html'`,
    'full historical title remains exactly retrievable'
  );
  const searchFilters = await evaluate(
    devtools,
    searchPage.sessionId,
    `Array.from(document.querySelectorAll('[data-site-search-filters] pagefind-filter-dropdown')).map((item) => item.getAttribute('filter'))`,
  );
  const expectedFilters = ['primary_type', 'primary_domain', 'audience', 'status', 'lifecycle', 'evidence_level', 'collection_tier', 'version', 'source', 'updated_year', 'topic', 'section'];
  if (JSON.stringify(searchFilters) !== JSON.stringify(expectedFilters)) {
    failures.push(`expected controlled search facets ${expectedFilters.join(', ')}, found ${searchFilters.join(', ')}`);
  }
  const filterSemantics = await evaluate(devtools, searchPage.sessionId, `Array.from(document.querySelectorAll('[data-site-search-filters] .pf-dropdown-trigger')).map((button) => ({ role: button.getAttribute('role'), expanded: button.getAttribute('aria-expanded'), controls: button.getAttribute('aria-controls'), label: button.getAttribute('aria-label') }))`);
  if (filterSemantics.length !== expectedFilters.length || filterSemantics.some((filter) => filter.role !== 'combobox' || filter.expanded !== 'false' || !filter.controls || !filter.label)) {
    failures.push(`search facet semantics are incomplete: ${JSON.stringify(filterSemantics)}`);
  }

  await evaluate(devtools, searchPage.sessionId, `(() => {
    const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
    instance.triggerSearchWithFilters('AdversaryGraph', { primary_domain: ['threat-intelligence'] });
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(document.querySelector('[data-site-search-active]:not([hidden]) .site-search-filter-chip')) && /Domain: Threat Intelligence/.test(document.querySelector('.site-search-filter-chip')?.textContent || '')`,
    'visible removable active filter'
  );
  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-clear-all]').click()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelector('[data-site-search-active]')?.hidden === true && Object.keys(window.PagefindComponents.getInstanceManager().getInstance('default').searchFilters || {}).length === 0`,
    'clear-all search filters'
  );

  await evaluate(devtools, searchPage.sessionId, `window.PagefindComponents.getInstanceManager().getInstance('default').triggerSearchWithFilters('', {})`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelectorAll('[data-site-search-results] .pf-result').length === 20 && /^Showing 20 of ([2-9][0-9]|[1-9][0-9]{2,}) results\.$/.test(document.querySelector('[data-site-search-progress]')?.textContent || '') && !document.querySelector('[data-site-search-pagination]')?.hidden`,
    'initial paginated result set'
  );
  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-load-more]').click()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `document.querySelectorAll('[data-site-search-results] .pf-result').length === 40 && /^Showing 40 of /.test(document.querySelector('[data-site-search-progress]')?.textContent || '')`,
    'load-more result expansion'
  );

  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = 'Detection logic T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `Boolean(Array.from(document.querySelectorAll('[data-site-search-results] .pf-heading-link[href*="#"]')).find((link) => new URL(link.href).hash === '#detection-logic'))`,
    'heading-level search result'
  );
  const deepLinkState = await evaluate(devtools, searchPage.sessionId, `(async () => {
    const link = Array.from(document.querySelectorAll('[data-site-search-results] .pf-heading-link[href*="#"]')).find((item) => new URL(item.href).hash === '#detection-logic');
    if (!link) return { found: false };
    const url = new URL(link.href);
    const html = await fetch(url.pathname).then((response) => response.text());
    const documentCopy = new DOMParser().parseFromString(html, 'text/html');
    return { found: true, hash: url.hash, targetExists: Boolean(documentCopy.getElementById(url.hash.slice(1))) };
  })()`);
  if (!deepLinkState.found || !deepLinkState.targetExists) {
    failures.push(`section deep link is not resolvable: ${JSON.stringify(deepLinkState)}`);
  }

  const desktopMetrics = {
    width: 1880,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false,
  };
  const staticHome = await attachPage(devtools, `${origin}/`, desktopMetrics, { disableScripts: true });
  const staticControl = await evaluate(devtools, staticHome.sessionId, `(() => {
    const control = document.querySelector('.site-search-host--standalone .site-search-fallback');
    const host = control?.closest('.site-search-host');
    const theme = document.querySelector('#theme-btn');
    const rect = control?.getBoundingClientRect();
    const style = control && getComputedStyle(control);
    const hit = rect && document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      href: control ? new URL(control.href).pathname : '',
      label: control?.getAttribute('aria-label') || '',
      visible: Boolean(rect && rect.width >= 180 && rect.height >= 38 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0),
      unoccluded: Boolean(control && (hit === control || control.contains(hit))),
      beforeTheme: Boolean(host && theme && (host.compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_FOLLOWING)),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      navigation: Array.from(document.querySelectorAll('.site-header .nav-list a')).map((link) => ({
        label: link.textContent.trim(),
        path: new URL(link.href).pathname,
        current: link.getAttribute('aria-current'),
      })),
      footerLinks: Array.from(document.querySelectorAll('.site-footer nav a')).map((link) => new URL(link.href).pathname),
    };
  })()`);
  if (staticControl.href !== '/search.html' || !/search/i.test(staticControl.label) || !staticControl.visible || !staticControl.unoccluded || !staticControl.beforeTheme || staticControl.overflow) {
    failures.push(`static desktop search fallback failed: ${JSON.stringify(staticControl)}`);
  }
  await devtools.send('Target.closeTarget', { targetId: staticHome.targetId });

  const staticMobile = await attachPage(devtools, `${origin}/about.html`, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  }, { disableScripts: true });
  const staticMobileState = await evaluate(devtools, staticMobile.sessionId, `(() => {
    const summary = document.querySelector('.nav-menu-toggle');
    const rect = summary?.getBoundingClientRect();
    return {
      navigation: Array.from(document.querySelectorAll('.site-header .nav-list a')).map((link) => link.textContent.trim()),
      footerCount: document.querySelectorAll('.site-footer nav a').length,
      privacy: Boolean(document.querySelector('.site-footer a[href="/privacy.html"]')),
      search: new URL(document.querySelector('.site-search-fallback')?.href || location.href).pathname,
      menuVisible: Boolean(rect && rect.width >= 44 && rect.height >= 44),
      center: rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);
  if (JSON.stringify(staticMobileState.navigation) !== JSON.stringify(['Research', 'Library', 'Products & Labs', 'AdversaryGraph', 'About', 'CV', 'External validation'])
    || staticMobileState.footerCount !== 8
    || !staticMobileState.privacy
    || staticMobileState.search !== '/search.html'
    || !staticMobileState.menuVisible
    || staticMobileState.overflow) {
    failures.push(`no-JavaScript mobile shell failed: ${JSON.stringify(staticMobileState)}`);
  }
  if (staticMobileState.center) {
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...staticMobileState.center }, staticMobile.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...staticMobileState.center }, staticMobile.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...staticMobileState.center }, staticMobile.sessionId);
  }
  await waitForExpression(
    devtools,
    staticMobile.sessionId,
    `document.querySelector('details.nav-links')?.open && getComputedStyle(document.querySelector('.site-header .nav-list')).display !== 'none'`,
    'no-JavaScript native mobile navigation disclosure'
  );
  await devtools.send('Target.closeTarget', { targetId: staticMobile.targetId });

  const desktopHome = await attachPage(devtools, `${origin}/`, desktopMetrics);
  await activateLazySearch(devtools, desktopHome.sessionId);
  await waitForExpression(
    devtools,
    desktopHome.sessionId,
    `Boolean(document.querySelector('.site-search-host--standalone .pf-trigger-btn[aria-haspopup="dialog"]')) && Boolean(document.querySelector('[data-site-search-hero][data-search-state="ready"] .pf-searchbox-input'))`,
    'visible desktop header and hero search readiness'
  );
  const desktopState = await evaluate(devtools, desktopHome.sessionId, `(() => {
    const trigger = document.querySelector('.site-search-host--standalone .pf-trigger-btn');
    const heroInput = document.querySelector('[data-site-search-hero] .pf-searchbox-input');
    const theme = document.querySelector('#theme-btn');
    const links = document.querySelector('.nav-links');
    const header = document.querySelector('.site-header');
    const brand = document.querySelector('.site-header .brand');
    const sidebar = document.querySelector('.page-sidenav');
    const primaryLinks = Array.from(document.querySelectorAll('.site-header .nav-list > a'));
    const navigationLinks = Array.from(document.querySelectorAll('.site-header .nav-list a'));
    const triggerRect = trigger?.getBoundingClientRect();
    const heroRect = heroInput?.getBoundingClientRect();
    const themeRect = theme?.getBoundingClientRect();
    const linksRect = links?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const linkRects = primaryLinks.map((link) => link.getBoundingClientRect());
    const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const hit = triggerRect && document.elementFromPoint(triggerRect.left + triggerRect.width / 2, triggerRect.top + triggerRect.height / 2);
    return {
      triggerVisible: Boolean(triggerRect && triggerRect.width >= 180 && triggerRect.height >= 38 && (hit === trigger || trigger.contains(hit))),
      heroVisible: Boolean(heroRect && heroRect.width >= 500 && heroRect.height >= 44),
      headerHeight: headerRect?.height || 0,
      primaryCount: primaryLinks.length + document.querySelectorAll('.site-header .nav-list > details').length,
      primaryRows: new Set(linkRects.map((rect) => Math.round(rect.top))).size,
      brandVisible: Boolean(brand && getComputedStyle(brand).display !== 'none'),
      sidebarVisible: Boolean(sidebarRect && sidebarRect.width >= 220 && sidebarRect.width <= 260 && getComputedStyle(sidebar).display !== 'none'),
      sidebarTargetHeight: Math.min(...Array.from(document.querySelectorAll('.sidenav-scroll a')).map((link) => link.getBoundingClientRect().height)),
      sidebarCurrent: Boolean(document.querySelector('.sidenav-scroll a[aria-current="location"]')),
      bodyOffset: parseFloat(getComputedStyle(document.body).paddingLeft),
      sidebarWidth: sidebarRect?.width || 0,
      overlapsTheme: overlaps(triggerRect, themeRect),
      overlapsLinks: overlaps(triggerRect, linksRect),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      center: triggerRect ? { x: triggerRect.left + triggerRect.width / 2, y: triggerRect.top + triggerRect.height / 2 } : null,
      navigation: navigationLinks.map((link) => ({
        label: link.textContent.trim(),
        path: new URL(link.href).pathname,
        current: link.getAttribute('aria-current'),
      })),
      footerLinks: Array.from(document.querySelectorAll('.site-footer nav a')).map((link) => new URL(link.href).pathname),
    };
  })()`);
  if (!desktopState.triggerVisible
    || !desktopState.heroVisible
    || desktopState.headerHeight > 72
    || desktopState.primaryCount !== 5
    || desktopState.primaryRows !== 1
    || desktopState.brandVisible
    || !desktopState.sidebarVisible
    || desktopState.sidebarTargetHeight < 36
    || !desktopState.sidebarCurrent
    || Math.abs(desktopState.bodyOffset - desktopState.sidebarWidth) > 1
    || desktopState.overlapsTheme
    || desktopState.overlapsLinks
    || desktopState.overflow) {
    failures.push(`desktop search layout failed: ${JSON.stringify(desktopState)}`);
  }
  const canonicalNavigation = [
    { label: 'Research', path: '/cti.html', current: null },
    { label: 'Library', path: '/guides.html', current: null },
    { label: 'Products & Labs', path: '/projects.html', current: null },
    { label: 'AdversaryGraph', path: '/adversarygraph/', current: null },
    { label: 'About', path: '/about.html', current: null },
    { label: 'CV', path: '/cv.html', current: null },
    { label: 'External validation', path: '/external-validation.html', current: null },
  ];
  if (JSON.stringify(staticControl.navigation) !== JSON.stringify(canonicalNavigation)
    || JSON.stringify(desktopState.navigation) !== JSON.stringify(staticControl.navigation)
    || JSON.stringify(desktopState.footerLinks) !== JSON.stringify(staticControl.footerLinks)
    || staticControl.footerLinks.length !== 8
    || !staticControl.footerLinks.includes('/privacy.html')) {
    failures.push(`source/rendered shell mismatch: ${JSON.stringify({
      sourceNavigation: staticControl.navigation,
      renderedNavigation: desktopState.navigation,
      sourceFooter: staticControl.footerLinks,
      renderedFooter: desktopState.footerLinks,
    })}`);
  }

  await evaluate(devtools, desktopHome.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-hero] .pf-searchbox-input');
    input.value = 'T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    desktopHome.sessionId,
    `new URL(document.querySelector('[data-site-search-hero] .pf-searchbox-result[href]')?.href || location.href).pathname === '/threat-matrix/techniques/T1059.003/'`,
    'homepage hero autocomplete ranking'
  );
  await evaluate(devtools, desktopHome.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-hero] .pf-searchbox-input');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);

  if (desktopState.center) {
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...desktopState.center }, desktopHome.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...desktopState.center }, desktopHome.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...desktopState.center }, desktopHome.sessionId);
  }
  await waitForExpression(
    devtools,
    desktopHome.sessionId,
    `Boolean(document.querySelector('#site-search-modal dialog')?.open) && document.activeElement === document.querySelector('#site-search-modal .pf-input')`,
    'desktop search-bar click and modal focus'
  );
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, desktopHome.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, desktopHome.sessionId);
  await waitForExpression(
    devtools,
    desktopHome.sessionId,
    `!document.querySelector('#site-search-modal dialog')?.open && document.activeElement === document.querySelector('.site-search-host--standalone .pf-trigger-btn')`,
    'desktop modal close and focus restoration'
  );

  const standardHome = await attachPage(devtools, `${origin}/`, {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await activateLazySearch(devtools, standardHome.sessionId);
  await waitForExpression(
    devtools,
    standardHome.sessionId,
    `Boolean(document.querySelector('.site-search-host--standalone .pf-trigger-btn')) && document.querySelectorAll('.site-header .nav-list a').length === 7`,
    'standard desktop header readiness'
  );
  const standardHeaderState = await evaluate(devtools, standardHome.sessionId, `(() => {
    const brand = document.querySelector('.site-header .brand');
    const list = document.querySelector('.site-header .nav-list');
    const trigger = document.querySelector('.site-search-host--standalone .pf-trigger-btn');
    const theme = document.querySelector('#theme-btn');
    const header = document.querySelector('.site-header');
    const rect = (node) => node?.getBoundingClientRect();
    const brandRect = rect(brand);
    const listRect = rect(list);
    const triggerRect = rect(trigger);
    const themeRect = rect(theme);
    const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    return {
      height: rect(header)?.height || 0,
      brandVisible: Boolean(brandRect && brandRect.width > 0 && getComputedStyle(brand).display !== 'none'),
      rows: new Set(Array.from(list.querySelectorAll(':scope > a, :scope > details > summary')).map((control) => Math.round(control.getBoundingClientRect().top))).size,
      overlaps: overlaps(brandRect, listRect) || overlaps(brandRect, triggerRect) || overlaps(listRect, triggerRect) || overlaps(listRect, themeRect) || overlaps(triggerRect, themeRect),
      sidebarVisible: getComputedStyle(document.querySelector('.page-sidenav')).display !== 'none',
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);
  if (standardHeaderState.height > 72
    || !standardHeaderState.brandVisible
    || standardHeaderState.rows !== 1
    || standardHeaderState.overlaps
    || standardHeaderState.sidebarVisible
    || standardHeaderState.overflow) {
    failures.push(`standard desktop header layout failed: ${JSON.stringify(standardHeaderState)}`);
  }
  await devtools.send('Target.closeTarget', { targetId: standardHome.targetId });

  const homePage = await attachPage(devtools, `${origin}/`, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await activateLazySearch(devtools, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `Boolean(document.querySelector('.site-search-host .pf-trigger-btn[aria-haspopup="dialog"]'))`,
    'global search trigger'
  );

  const mobileHeaderState = await evaluate(devtools, homePage.sessionId, `(() => {
    const trigger = document.querySelector('.site-search-host .pf-trigger-btn');
    const menu = document.querySelector('.nav-menu-toggle');
    const theme = document.querySelector('#theme-btn');
    const brand = document.querySelector('.site-header .brand');
    const header = document.querySelector('.site-header');
    const rect = (node) => node?.getBoundingClientRect();
    const triggerRect = rect(trigger);
    const menuRect = rect(menu);
    const themeRect = rect(theme);
    const brandRect = rect(brand);
    const headerRect = rect(header);
    const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const hit = triggerRect && document.elementFromPoint(triggerRect.left + triggerRect.width / 2, triggerRect.top + triggerRect.height / 2);
    return {
      triggerVisible: Boolean(triggerRect && triggerRect.width >= 44 && triggerRect.height >= 44 && (hit === trigger || trigger.contains(hit))),
      menuVisible: Boolean(menuRect && menuRect.width >= 44 && menuRect.height >= 44),
      themeVisible: Boolean(themeRect && themeRect.width >= 44 && themeRect.height >= 44),
      headerHeight: headerRect?.height || 0,
      overlaps: overlaps(brandRect, menuRect) || overlaps(brandRect, triggerRect) || overlaps(brandRect, themeRect) || overlaps(menuRect, triggerRect) || overlaps(menuRect, themeRect) || overlaps(triggerRect, themeRect),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      shortcutText: /ctrl|cmd|command/i.test(header?.textContent || ''),
      shortcutAria: Boolean(document.querySelector('.site-search-host [aria-keyshortcuts]')),
      shortcutBadge: Boolean(document.querySelector('.site-search-host .pf-trigger-shortcut')),
      center: triggerRect ? { x: triggerRect.left + triggerRect.width / 2, y: triggerRect.top + triggerRect.height / 2 } : null,
    };
  })()`);
  if (!mobileHeaderState.triggerVisible
    || !mobileHeaderState.menuVisible
    || !mobileHeaderState.themeVisible
    || mobileHeaderState.headerHeight > 72
    || mobileHeaderState.overlaps
    || mobileHeaderState.overflow
    || mobileHeaderState.shortcutText
    || mobileHeaderState.shortcutAria
    || mobileHeaderState.shortcutBadge) {
    failures.push(`mobile header layout failed: ${JSON.stringify(mobileHeaderState)}`);
  }

  await evaluate(devtools, homePage.sessionId, `document.querySelector('.nav-menu-toggle').focus()`);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'char', key: ' ', code: 'Space', text: ' ', unmodifiedText: ' ', windowsVirtualKeyCode: 32,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32,
  }, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `document.querySelector('details.nav-links')?.open && getComputedStyle(document.querySelector('.site-header .nav-list')).display !== 'none'`,
    'mobile navigation disclosure'
  );
  const mobileMenuState = await evaluate(devtools, homePage.sessionId, `(() => {
    const list = document.querySelector('.site-header .nav-list');
    const rect = list.getBoundingClientRect();
    const links = Array.from(list.querySelectorAll(':scope > a, :scope > details > summary'));
    return {
      count: links.length,
      secondaryCount: list.querySelectorAll('.nav-more-list a').length,
      minTargetHeight: Math.min(...links.map((link) => link.getBoundingClientRect().height)),
      withinViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);
  if (mobileMenuState.count !== 5 || mobileMenuState.secondaryCount !== 3 || mobileMenuState.minTargetHeight < 44 || !mobileMenuState.withinViewport || mobileMenuState.overflow) {
    failures.push(`mobile navigation disclosure failed: ${JSON.stringify(mobileMenuState)}`);
  }
  await evaluate(devtools, homePage.sessionId, `document.querySelector('.nav-more > summary').click()`);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `document.querySelector('.nav-more')?.open && Array.from(document.querySelectorAll('.nav-more-list a')).every((link) => link.getBoundingClientRect().height >= 44)`,
    'mobile More disclosure'
  );
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `!document.querySelector('.nav-more')?.open && document.querySelector('details.nav-links')?.open && document.activeElement === document.querySelector('.nav-more > summary')`,
    'mobile More Escape close and focus restoration'
  );
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
  }, homePage.sessionId);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `!document.querySelector('details.nav-links')?.open && document.activeElement === document.querySelector('.nav-menu-toggle')`,
    'mobile navigation Escape close and focus restoration'
  );

  await evaluate(devtools, homePage.sessionId, `document.querySelector('.nav-menu-toggle').click()`);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `document.querySelector('details.nav-links')?.open`,
    'mobile navigation reopen'
  );
  await evaluate(devtools, homePage.sessionId, `document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `!document.querySelector('details.nav-links')?.open`,
    'mobile navigation outside-click close'
  );

  const mobileFooterState = await evaluate(devtools, homePage.sessionId, `(() => {
    const footer = document.querySelector('.site-footer');
    footer?.scrollIntoView({ block: 'end' });
    const rect = footer?.getBoundingClientRect();
    return {
      links: footer?.querySelectorAll('nav a').length || 0,
      labels: Array.from(footer?.querySelectorAll('nav') || []).map((nav) => nav.getAttribute('aria-label')),
      privacy: Boolean(footer?.querySelector('a[href="/privacy.html"]')),
      contained: Boolean(rect && rect.left >= -1 && rect.right <= window.innerWidth + 1),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);
  if (mobileFooterState.links !== 8
    || JSON.stringify(mobileFooterState.labels) !== JSON.stringify(['Footer navigation', 'Site information'])
    || !mobileFooterState.privacy
    || !mobileFooterState.contained
    || mobileFooterState.overflow) {
    failures.push(`mobile footer layout failed: ${JSON.stringify(mobileFooterState)}`);
  }
  await evaluate(devtools, homePage.sessionId, `window.scrollTo(0, 0)`);

  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, homePage.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, homePage.sessionId);
  await wait(250);
  const shortcutState = await evaluate(devtools, homePage.sessionId, `({
    modalOpen: Boolean(document.querySelector('#site-search-modal dialog')?.open),
    heroFocused: document.activeElement === document.querySelector('[data-site-search-hero] .pf-searchbox-input'),
  })`);
  if (shortcutState.modalOpen || shortcutState.heroFocused) {
    failures.push(`Ctrl+K must not invoke search: ${JSON.stringify(shortcutState)}`);
  }

  if (mobileHeaderState.center) {
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...mobileHeaderState.center }, homePage.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...mobileHeaderState.center }, homePage.sessionId);
    await devtools.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...mobileHeaderState.center }, homePage.sessionId);
  }
  await waitForExpression(
    devtools,
    homePage.sessionId,
    `Boolean(document.querySelector('#site-search-modal dialog')?.open) && document.activeElement === document.querySelector('#site-search-modal .pf-input')`,
    'mobile search click and modal focus'
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

  await evaluate(devtools, searchPage.sessionId, `(() => {
    const input = document.querySelector('[data-site-search-page] pagefind-input .pf-input');
    input.value = 'T1059.003';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForExpression(
    devtools,
    searchPage.sessionId,
    `new URL(document.querySelector('[data-site-search-results] .pf-result-link')?.href || location.href).pathname === '/threat-matrix/techniques/T1059.003/'`,
    'full-page result before keyboard navigation'
  );
  await evaluate(devtools, searchPage.sessionId, `document.querySelector('[data-site-search-results] .pf-result-link').focus()`);
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
    'full-page result Enter navigation'
  );

  const entityFile = join(site, 'threat-matrix', 'techniques', 'T1059.003', 'index.html');
  if (existsSync(entityFile) && /site-search\.js/i.test(readFileSync(entityFile, 'utf8'))) {
    await activateLazySearch(devtools, searchPage.sessionId);
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
    if (check.selector.includes('docusaurus')) await wait(1_500);
    await activateLazySearch(devtools, page.sessionId);
    await waitForExpression(
      devtools,
      page.sessionId,
      `Boolean(document.querySelector(${JSON.stringify(check.selector)})) && !document.querySelector('.pf-error')`,
      check.label
    );
    await devtools.send('Target.closeTarget', { targetId: page.targetId });
  }

  const threatMatrix = await attachPage(devtools, `${origin}/threat-matrix/`, {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await waitForExpression(
    devtools,
    threatMatrix.sessionId,
    `Boolean(document.querySelector('button[aria-label="Search this workspace"]'))`,
    'Threat Matrix workspace search label'
  );
  const threatMatrixSearchState = await evaluate(devtools, threatMatrix.sessionId, `(() => {
    const globalForm = document.querySelector('.tm-search-scopes__global');
    const globalInput = document.querySelector('#tm-global-search');
    const workspaceButton = document.querySelector('button[aria-label="Search this workspace"]');
    return {
      globalLabel: document.querySelector('label[for="tm-global-search"]')?.textContent.trim(),
      globalAction: new URL(globalForm?.action || location.href).pathname,
      globalInputName: globalInput?.name,
      workspaceLabel: workspaceButton?.getAttribute('aria-label'),
      siteModal: Boolean(document.querySelector('#site-search-modal')),
      pagefindLoader: Boolean(document.querySelector('script[src*="site-search.js"]')),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);
  if (threatMatrixSearchState.globalLabel !== 'Search all 1200km research'
    || threatMatrixSearchState.globalAction !== '/search.html'
    || threatMatrixSearchState.globalInputName !== 'q'
    || threatMatrixSearchState.workspaceLabel !== 'Search this workspace'
    || threatMatrixSearchState.siteModal
    || threatMatrixSearchState.pagefindLoader
    || threatMatrixSearchState.overflow) {
    failures.push(`Threat Matrix search scopes are not distinct: ${JSON.stringify(threatMatrixSearchState)}`);
  }
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, threatMatrix.sessionId);
  await devtools.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2,
  }, threatMatrix.sessionId);
  await waitForExpression(
    devtools,
    threatMatrix.sessionId,
    `Boolean(document.querySelector('[role="dialog"][aria-label="Search this workspace"]')) && !document.querySelector('#site-search-modal')`,
    'workspace-only Ctrl+K behavior'
  );
  await devtools.send('Target.closeTarget', { targetId: threatMatrix.targetId });

  const browserErrors = devtools.events.filter((event) =>
    event.method === 'Runtime.exceptionThrown'
    || (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params?.entry?.level))
  );
  const relevantErrors = browserErrors.filter((event) => !/favicon|googleapis|gstatic|googletagmanager|google-analytics|1200km\.com\/assets\/ap-logo\.png.*Content Security Policy/i.test(JSON.stringify(event)));
  if (relevantErrors.length) failures.push(`browser console errors: ${JSON.stringify(relevantErrors.slice(0, 5))}`);

  await devtools.send('Target.closeTarget', { targetId: searchPage.targetId });
  await devtools.send('Target.closeTarget', { targetId: desktopHome.targetId });
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

console.log('Browser search smoke test passed (fallback, facets, active filters, counts, Load More, section links, ranking, responsive layout, keyboard flow, and standalone/Docusaurus/Threat Matrix integrations).');
