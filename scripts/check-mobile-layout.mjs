#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const outputIndex = args.indexOf('--screenshots');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const screenshotRoot = resolve(
  outputIndex >= 0 ? args[outputIndex + 1] : `/tmp/1200km-mobile-layout-${process.pid}`,
);
const chrome = process.env.CHROME_PATH || 'google-chrome';

if (!existsSync(join(site, 'index.html'))) throw new Error(`Site root not found at ${site}`);

const pages = [
  ['home', '/'],
  ['about', '/about.html'],
  ['cv', '/cv.html'],
  ['projects', '/projects.html'],
  ['guides', '/guides.html'],
  ['labs', '/labs.html'],
  ['validation', '/external-validation.html'],
  ['adversarygraph', '/adversarygraph/'],
  ['search', '/search.html'],
  ['docs-long', '/adversarygraph-docs/full-flow/'],
  ['threat-matrix', '/threat-matrix/'],
];

const deployableCatalogPath = join(site, 'data', 'content-catalog.json');
if (existsSync(deployableCatalogPath)) {
  const deployableCatalog = JSON.parse(readFileSync(deployableCatalogPath, 'utf8'));
  const governedArticle = (deployableCatalog.items || []).find((item) =>
    item.lifecycle === 'historical'
    && /^https:\/\/1200km\.com\/articles\/read\/\d{4}\/[^/]*adversarygraph-v4/i.test(item.canonical_url || '')
  ) || (deployableCatalog.items || []).find((item) =>
    item.lifecycle
    && item.lifecycle !== 'maintained'
    && /^https:\/\/1200km\.com\/articles\/read\/\d{4}\/[^/]+\/$/i.test(item.canonical_url || '')
  );
  if (governedArticle?.canonical_url) {
    pages.push(['article-lifecycle', new URL(governedArticle.canonical_url).pathname]);
  }
}

const viewports = [
  { label: '320', width: 320, height: 900, mobile: true },
  { label: '360', width: 360, height: 900, mobile: true },
  { label: '375', width: 375, height: 900, mobile: true },
  { label: '390', width: 390, height: 900, mobile: true, screenshot: true },
  { label: '430', width: 430, height: 900, mobile: true },
  { label: '768', width: 768, height: 960, mobile: false },
  { label: 'desktop', width: 1440, height: 1000, mobile: false },
  { label: 'wide-desktop', width: 1920, height: 1080, mobile: false, screenshot: true },
  { label: 'ultrawide', width: 2560, height: 1080, mobile: false },
  // A 1280px browser at 200% zoom exposes roughly a 640 CSS-pixel layout viewport.
  { label: 'zoom-200', width: 640, height: 900, mobile: false, screenshot: true, zoom: 2 },
];

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
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  let relative = pathname.replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const file = resolve(site, relative);
  if (!file.startsWith(`${site}/`)) return null;
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
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
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

async function evaluate(devtools, sessionId, expression) {
  const result = await devtools.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function waitForReady(devtools, sessionId, path) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const ready = await evaluate(devtools, sessionId, `(() => {
      if (document.readyState !== 'complete') return false;
      if (${JSON.stringify(path)} === '/threat-matrix/') {
        return Boolean(document.querySelector('#root')?.textContent?.trim().length > 500);
      }
      return Boolean(document.body?.textContent?.trim().length > 100);
    })()`);
    if (ready) return;
    await wait(120);
  }
  throw new Error(`Timed out loading ${path}`);
}

function layoutExpression(checkFixture) {
  return `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const round = (value) => Math.round(value * 10) / 10;
    const selector = 'main p, main li, article p, article li, .page-hero p, .profile-hero p, .cv-hero p';
    const prose = Array.from(document.querySelectorAll(selector)).filter((element) =>
      visible(element)
      && !element.closest('nav, footer, pre, table, .sr-only, [hidden], .site-search-modal, .page-sidenav')
      && !element.closest('#layout-regression-fixture')
    );
    const badWrap = prose.filter((element) => {
      const style = getComputedStyle(element);
      return style.overflowWrap === 'anywhere' || style.wordBreak === 'break-all';
    }).slice(0, 5).map((element) => ({
      tag: element.tagName,
      className: String(element.className).slice(0, 80),
      text: element.textContent.trim().slice(0, 90),
      overflowWrap: getComputedStyle(element).overflowWrap,
      wordBreak: getComputedStyle(element).wordBreak,
    }));
    const narrowProse = window.innerWidth >= 390 && window.innerWidth <= 430 ? prose.filter((element) => {
      const parent = element.parentElement?.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      if (!parent || parent.width < 340) return false;
      return rect.width < parent.width * 0.72;
    }).slice(0, 5).map((element) => ({
      tag: element.tagName,
      className: String(element.className).slice(0, 80),
      width: round(element.getBoundingClientRect().width),
      parentWidth: round(element.parentElement.getBoundingClientRect().width),
      maxWidth: getComputedStyle(element).maxWidth,
    })) : [];
    const controls = Array.from(document.querySelectorAll(
      'header a, header button, header summary, .page-hero-links a, .profile-actions a, .cv-actions a, .cl-actions a, .hero-actions a, .button'
    )).filter(visible);
    const controlOverflow = controls.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1;
    }).slice(0, 5).map((element) => ({
      text: element.textContent.trim().slice(0, 60),
      left: round(element.getBoundingClientRect().left),
      right: round(element.getBoundingClientRect().right),
    }));

    const productTitleElement = document.querySelector('[data-product-name="AdversaryGraph"]');
    const productTitle = productTitleElement && visible(productTitleElement) ? (() => {
      const rect = productTitleElement.getBoundingClientRect();
      const style = getComputedStyle(productTitleElement);
      const lineHeight = parseFloat(style.lineHeight);
      return {
        clientWidth: round(productTitleElement.clientWidth),
        scrollWidth: round(productTitleElement.scrollWidth),
        height: round(rect.height),
        lineHeight: round(lineHeight),
        whiteSpace: style.whiteSpace,
        singleLine: rect.height <= lineHeight * 1.25,
        contentContained: productTitleElement.scrollWidth <= productTitleElement.clientWidth + 1,
      };
    })() : null;

    let fixture = null;
    if (${checkFixture}) {
      const host = document.querySelector('.theme-doc-markdown') || document.querySelector('main') || document.body;
      const section = document.createElement('section');
      section.id = 'layout-regression-fixture';
      section.style.cssText = 'box-sizing:border-box;width:calc(100% - 32px);max-width:860px;margin:24px auto;padding:16px;border:1px solid currentColor';
      section.innerHTML = \`
        <h2 data-fixture="heading">IdentityProviderConfigurationValidationAndCounterintelligenceCorrelation</h2>
        <p data-fixture="prose">Ordinary prose should use the available content width and preserve complete words without emergency wrapping.</p>
        <p><a data-fixture="url" href="https://github.com/anpa1200/adversarygraph/tree/main/documentation/examples/identity-provider-configuration-validation-and-counterintelligence-correlation">https://github.com/anpa1200/adversarygraph/tree/main/documentation/examples/identity-provider-configuration-validation-and-counterintelligence-correlation</a></p>
        <p><code data-fixture="hash">sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</code></p>
        <pre data-fixture="pre"><code>./scripts/release-readiness.sh --configuration identity-provider-configuration-validation-and-counterintelligence-correlation --full</code></pre>
        <table data-fixture="table"><thead><tr><th>ATT&amp;CK identifier</th><th>Repository evidence location</th><th>Validation status</th></tr></thead><tbody><tr><td>T1059.003</td><td>documentation/examples/identity-provider-configuration-validation-and-counterintelligence-correlation</td><td>Analyst review required</td></tr></tbody></table>
        <div class="hero-actions"><a class="button" href="#fixture-primary">Open technical evidence</a><a class="button" href="#fixture-secondary">Review validation methodology</a></div>
      \`;
      host.append(section);
      const bounds = section.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(section).paddingLeft) + parseFloat(getComputedStyle(section).paddingRight);
      const proseElement = section.querySelector('[data-fixture="prose"]');
      const proseStyle = getComputedStyle(proseElement);
      const contained = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
      };
      const pre = section.querySelector('[data-fixture="pre"]');
      const table = section.querySelector('[data-fixture="table"]');
      fixture = {
        proseWidth: round(proseElement.getBoundingClientRect().width),
        contentWidth: round(bounds.width - padding),
        proseWrap: proseStyle.overflowWrap,
        proseWordBreak: proseStyle.wordBreak,
        headingContained: contained(section.querySelector('[data-fixture="heading"]')),
        urlContained: contained(section.querySelector('[data-fixture="url"]')),
        hashContained: contained(section.querySelector('[data-fixture="hash"]')),
        preContained: contained(pre),
        preOverflow: getComputedStyle(pre).overflowX,
        preScrollable: pre.scrollWidth > pre.clientWidth,
        tableContained: contained(table),
        tableOverflow: getComputedStyle(table).overflowX,
        tableScrollable: table.scrollWidth >= table.clientWidth,
        buttonsContained: Array.from(section.querySelectorAll('.button')).every(contained),
      };
    }

    return {
      viewport: window.innerWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth + 1,
      proseCount: prose.length,
      badWrap,
      narrowProse,
      controlOverflow,
      productTitle,
      fixture,
    };
  })()`;
}

function threatMatrixInteractionExpression() {
  return `(async () => {
    const pause = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
    const round = (value) => Math.round(value * 10) / 10;
    const containedHorizontally = (element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1;
    };
    const heroHeading = document.querySelector('.hero h1');
    const heroHeadingContained = !heroHeading || heroHeading.scrollWidth <= heroHeading.clientWidth + 1;

    document.querySelector('[data-module="navigator"]')?.click();
    await pause(100);

    let viewport = document.querySelector('.matrix-viewport');
    let track = document.querySelector('.matrix-track');
    const tacticCount = document.querySelectorAll('.tactic-column').length;
    const collapsedByDefault = document.querySelectorAll('.subtechnique-list').length === 0;
    const matrixInitial = {
      clientWidth: viewport?.clientWidth || 0,
      clientHeight: viewport?.clientHeight || 0,
      scrollWidth: viewport?.scrollWidth || 0,
      scrollHeight: viewport?.scrollHeight || 0,
      trackWidth: track ? round(track.getBoundingClientRect().width) : 0,
      contained: containedHorizontally(viewport),
    };

    document.querySelector('.subtechnique-toggle')?.click();
    await pause(100);
    const expandedChildren = document.querySelectorAll('.subtechnique-list .technique-sub').length;

    viewport = document.querySelector('.matrix-viewport');
    if (viewport) {
      viewport.scrollLeft = Math.min(120, Math.max(0, viewport.scrollWidth - viewport.clientWidth));
      viewport.dispatchEvent(new Event('scroll'));
    }
    const firstTechnique = document.querySelector('.matrix-viewport .technique');
    firstTechnique?.click();
    await pause(100);

    viewport = document.querySelector('.matrix-viewport');
    const detail = document.querySelector('.navigator-detail');
    const detailState = {
      present: Boolean(detail),
      contained: containedHorizontally(detail),
      scrollLeft: viewport?.scrollLeft || 0,
      scrollWidth: viewport?.scrollWidth || 0,
      clientWidth: viewport?.clientWidth || 0,
      scrollPreserved: (
        !viewport
        || matrixInitial.scrollWidth <= matrixInitial.clientWidth
        || viewport.scrollWidth <= viewport.clientWidth
        || viewport.scrollLeft > 0
      ),
    };
    const sidebarRect = document.querySelector('.sidebar')?.getBoundingClientRect();
    const workspaceRect = document.querySelector('.workspace')?.getBoundingClientRect();
    const mainRect = document.querySelector('.main')?.getBoundingClientRect();
    const navigatorRect = document.querySelector('.navigator-workspace')?.getBoundingClientRect();
    const mainStyle = document.querySelector('.main') ? getComputedStyle(document.querySelector('.main')) : null;
    const workspaceFit = {
      sidebarRight: sidebarRect ? round(sidebarRect.right) : null,
      workspaceLeft: workspaceRect ? round(workspaceRect.left) : null,
      workspaceRight: workspaceRect ? round(workspaceRect.right) : null,
      mainLeft: mainRect ? round(mainRect.left) : null,
      mainRight: mainRect ? round(mainRect.right) : null,
      contentLeft: navigatorRect ? round(navigatorRect.left) : null,
      contentRight: navigatorRect ? round(navigatorRect.right) : null,
      paddingLeft: mainStyle ? round(Number.parseFloat(mainStyle.paddingLeft)) : null,
      paddingRight: mainStyle ? round(Number.parseFloat(mainStyle.paddingRight)) : null,
      shellFillsViewport: Boolean(
        sidebarRect
        && workspaceRect
        && mainRect
        && Math.abs(workspaceRect.left - sidebarRect.right) <= 1
        && Math.abs(mainRect.left - workspaceRect.left) <= 1
        && Math.abs(mainRect.right - window.innerWidth) <= 1
      ),
      contentFillsMain: Boolean(
        mainRect
        && navigatorRect
        && mainStyle
        && navigatorRect.left - mainRect.left <= Number.parseFloat(mainStyle.paddingLeft) + 1
        && mainRect.right - navigatorRect.right <= Number.parseFloat(mainStyle.paddingRight) + 18
      ),
    };

    const scaleBefore = Number.parseFloat(getComputedStyle(document.querySelector('.matrix-track')).getPropertyValue('--matrix-scale'));
    document.querySelector('[data-matrix-action="zoom-out"]')?.click();
    await pause(40);
    const scaleAfter = Number.parseFloat(getComputedStyle(document.querySelector('.matrix-track')).getPropertyValue('--matrix-scale'));
    viewport = document.querySelector('.matrix-viewport');
    const viewportRect = viewport?.getBoundingClientRect();
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: viewportRect ? viewportRect.left + (viewportRect.width * 0.35) : 0,
      clientY: viewportRect ? viewportRect.top + (viewportRect.height * 0.35) : 0,
      deltaY: -120,
    });
    const wheelPrevented = viewport ? !viewport.dispatchEvent(wheelEvent) : false;
    await pause(40);
    const wheelScaleAfter = Number.parseFloat(getComputedStyle(document.querySelector('.matrix-track')).getPropertyValue('--matrix-scale'));
    document.querySelector('[data-matrix-action="fit"]')?.click();
    await pause(80);
    const fitScale = Number.parseFloat(getComputedStyle(document.querySelector('.matrix-track')).getPropertyValue('--matrix-scale'));

    document.querySelector('[data-module="apt"]')?.click();
    await pause(100);
    const aptPanel = document.querySelector('.split-list-panel');
    const aptList = document.querySelector('.apt-group-list');
    const aptPanelRect = aptPanel?.getBoundingClientRect();
    const aptListRect = aptList?.getBoundingClientRect();
    const aptState = {
      panelContained: containedHorizontally(aptPanel),
      detailContained: containedHorizontally(document.querySelector('.split-detail-panel')),
      listHeight: aptList?.clientHeight || 0,
      listUsesPanel: aptPanelRect && aptListRect ? aptPanelRect.bottom - aptListRect.bottom < 28 : false,
    };

    return {
      heroHeadingContained,
      tacticCount,
      collapsedByDefault,
      expandedChildren,
      matrixInitial,
      detailState,
      workspaceFit,
      scaleBefore,
      scaleAfter,
      zoomChanged: Number.isFinite(scaleBefore) && Number.isFinite(scaleAfter) && scaleAfter < scaleBefore,
      wheelPrevented,
      wheelScaleAfter,
      wheelZoomChanged: Number.isFinite(wheelScaleAfter) && wheelScaleAfter > scaleAfter,
      fitScale,
      aptState,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth + 1,
    };
  })()`;
}

await mkdir(screenshotRoot, { recursive: true });
await new Promise((resolvePromise, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolvePromise);
});

const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-background-networking',
  '--remote-debugging-port=0',
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
await devtools.send('Network.setBlockedURLs', {
  urls: [
    'https://www.googletagmanager.com/*',
    'https://www.google-analytics.com/*',
    'https://fonts.googleapis.com/*',
    'https://fonts.gstatic.com/*',
  ],
}, sessionId);

const failures = [];
const results = [];

try {
  for (const viewport of viewports) {
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    }, sessionId);

    for (const [name, path] of pages) {
      await devtools.send('Page.navigate', { url: `${origin}${path}` }, sessionId);
      await waitForReady(devtools, sessionId, path);
      await wait(path === '/threat-matrix/' ? 500 : 120);

      const checkFixture = (name === 'home' || name === 'docs-long')
        && ['320', '430', '768', 'desktop', 'zoom-200'].includes(viewport.label);
      const state = await evaluate(devtools, sessionId, layoutExpression(checkFixture));
      results.push({ page: name, viewport: viewport.label, ...state });

      if (state.horizontalOverflow) failures.push(`${name}@${viewport.label}: page width ${state.scrollWidth} exceeds viewport ${state.viewport}`);
      if (state.badWrap.length) failures.push(`${name}@${viewport.label}: ordinary prose uses emergency wrapping ${JSON.stringify(state.badWrap)}`);
      if (state.narrowProse.length) failures.push(`${name}@${viewport.label}: ordinary prose is unnecessarily narrow ${JSON.stringify(state.narrowProse)}`);
      if (state.controlOverflow.length) failures.push(`${name}@${viewport.label}: navigation or CTA overflow ${JSON.stringify(state.controlOverflow)}`);
      if (name === 'adversarygraph' && (!state.productTitle?.singleLine || !state.productTitle?.contentContained)) {
        failures.push(`${name}@${viewport.label}: product title wraps or escapes its column ${JSON.stringify(state.productTitle)}`);
      }
      if (state.fixture) {
        const fixture = state.fixture;
        if (fixture.proseWidth < fixture.contentWidth * 0.9 || fixture.proseWrap === 'anywhere' || fixture.proseWordBreak === 'break-all') {
          failures.push(`${name}@${viewport.label}: stress prose failed ${JSON.stringify(fixture)}`);
        }
        if (!fixture.headingContained || !fixture.urlContained || !fixture.hashContained || !fixture.preContained || !fixture.tableContained || !fixture.buttonsContained) {
          failures.push(`${name}@${viewport.label}: stress content escaped its container ${JSON.stringify(fixture)}`);
        }
        if (!['auto', 'scroll'].includes(fixture.preOverflow) || !fixture.preScrollable) {
          failures.push(`${name}@${viewport.label}: code block is not horizontally usable ${JSON.stringify(fixture)}`);
        }
        if (!['auto', 'scroll'].includes(fixture.tableOverflow) || !fixture.tableScrollable) {
          failures.push(`${name}@${viewport.label}: table is not horizontally usable ${JSON.stringify(fixture)}`);
        }
      }

      if (name === 'threat-matrix' && ['390', '768', 'desktop', 'wide-desktop', 'ultrawide'].includes(viewport.label)) {
        const workspaceState = await evaluate(devtools, sessionId, threatMatrixInteractionExpression());
        results.push({ page: 'threat-matrix-interactions', viewport: viewport.label, ...workspaceState });
        const minimumMatrixHeight = viewport.label === '390' ? 300 : 360;
        if (workspaceState.tacticCount < 6) {
          failures.push(`threat-matrix@${viewport.label}: Navigator rendered only ${workspaceState.tacticCount} tactic columns`);
        }
        if (!workspaceState.heroHeadingContained) {
          failures.push(`threat-matrix@${viewport.label}: Discover heading overflows its content column`);
        }
        if (!workspaceState.collapsedByDefault || workspaceState.expandedChildren < 1) {
          failures.push(`threat-matrix@${viewport.label}: sub-technique collapse/expand failed ${JSON.stringify(workspaceState)}`);
        }
        if (
          workspaceState.matrixInitial.clientWidth < 240
          || workspaceState.matrixInitial.clientHeight < minimumMatrixHeight
          || workspaceState.matrixInitial.trackWidth < 500
          || !workspaceState.matrixInitial.contained
        ) {
          failures.push(`threat-matrix@${viewport.label}: matrix viewport is not usable ${JSON.stringify(workspaceState.matrixInitial)}`);
        }
        if (!workspaceState.detailState.present || !workspaceState.detailState.contained || !workspaceState.detailState.scrollPreserved) {
          failures.push(`threat-matrix@${viewport.label}: technique detail interaction failed ${JSON.stringify(workspaceState.detailState)}`);
        }
        if (
          ['desktop', 'wide-desktop', 'ultrawide'].includes(viewport.label)
          && (!workspaceState.workspaceFit.shellFillsViewport || !workspaceState.workspaceFit.contentFillsMain)
        ) {
          failures.push(`threat-matrix@${viewport.label}: workspace does not dynamically fill the area beside the sidebar ${JSON.stringify(workspaceState.workspaceFit)}`);
        }
        if (
          !workspaceState.zoomChanged
          || !workspaceState.wheelPrevented
          || !workspaceState.wheelZoomChanged
          || !Number.isFinite(workspaceState.fitScale)
        ) {
          failures.push(`threat-matrix@${viewport.label}: zoom/fit controls failed ${JSON.stringify(workspaceState)}`);
        }
        if (
          !workspaceState.aptState.panelContained
          || !workspaceState.aptState.detailContained
          || workspaceState.aptState.listHeight < 220
          || !workspaceState.aptState.listUsesPanel
        ) {
          failures.push(`threat-matrix@${viewport.label}: APT split workspace is not fitted ${JSON.stringify(workspaceState.aptState)}`);
        }
        if (workspaceState.horizontalOverflow) {
          failures.push(`threat-matrix@${viewport.label}: interactive views create page-level horizontal overflow`);
        }
      }

      const captureRegressionScreenshot = viewport.screenshot && (
        viewport.label === '390'
        || ['home', 'docs-long'].includes(name)
        || (name === 'adversarygraph' && viewport.label === 'wide-desktop')
      );
      if (captureRegressionScreenshot) {
        const screenshot = await devtools.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
          fromSurface: true,
        }, sessionId);
        await writeFile(join(screenshotRoot, `${name}-${viewport.label}.png`), Buffer.from(screenshot.data, 'base64'));

        if (name === 'threat-matrix' && viewport.label === '390') {
          await evaluate(devtools, sessionId, `document.querySelector('#root')?.scrollIntoView({ block: 'start' })`);
          await wait(120);
          const navigationScreenshot = await devtools.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false,
            fromSurface: true,
          }, sessionId);
          await writeFile(
            join(screenshotRoot, 'threat-matrix-navigation-390.png'),
            Buffer.from(navigationScreenshot.data, 'base64'),
          );
        }
      }

      if (name === 'threat-matrix' && ['390', 'wide-desktop', 'ultrawide'].includes(viewport.label)) {
        if (['wide-desktop', 'ultrawide'].includes(viewport.label)) {
          const aptScreenshot = await devtools.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false,
            fromSurface: true,
          }, sessionId);
          await writeFile(
            join(screenshotRoot, `threat-matrix-apt-${viewport.label}.png`),
            Buffer.from(aptScreenshot.data, 'base64'),
          );
        }
        await evaluate(devtools, sessionId, `document.querySelector('[data-module="navigator"]')?.click()`);
        await wait(120);
        const matrixScreenshot = await devtools.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
          fromSurface: true,
        }, sessionId);
        await writeFile(
          join(screenshotRoot, `threat-matrix-navigator-${viewport.label}.png`),
          Buffer.from(matrixScreenshot.data, 'base64'),
        );
      }
    }
  }

  await writeFile(join(screenshotRoot, 'layout-results.json'), `${JSON.stringify(results, null, 2)}\n`);
} finally {
  socket.close();
  browser.kill('SIGTERM');
  server.close();
}

if (failures.length) {
  console.error(`Mobile layout regression failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Screenshots and measurements: ${screenshotRoot}`);
  process.exit(1);
}

console.log(`Mobile layout regression passed for ${pages.length} pages across ${viewports.length} viewport/zoom configurations.`);
console.log(`Screenshots and measurements: ${screenshotRoot}`);
