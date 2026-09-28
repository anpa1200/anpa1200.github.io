#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2);
const option = (name, fallback = '') => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const origin = new URL(option('--origin')).origin;
const site = resolve(option('--site', 'dist'));
const manifest = JSON.parse(await readFile(new URL('../cloudflare/companion-sites.json', import.meta.url), 'utf8'));
const profile = await mkdtemp(join(tmpdir(), '1200km-companion-browser-'));
const chrome = spawn(process.env.CHROME_PATH || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const results = [], failures = [];
let socket;
try {
  const endpoint = await new Promise((done, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(Error('Chrome startup timeout')), 15000);
    chrome.stderr.on('data', (data) => { output += data; const match = output.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timeout); done(match[1]); } });
    chrome.on('error', reject);
  });
  socket = new WebSocket(endpoint);
  await new Promise((done) => socket.addEventListener('open', done, { once: true }));
  let next = 0, events = [];
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method) events.push(message);
    const item = pending.get(message.id);
    if (item) { pending.delete(message.id); message.error ? item.reject(Error(JSON.stringify(message.error))) : item.done(message.result); }
  });
  const send = (method, params = {}, sessionId) => new Promise((done, reject) => {
    const id = ++next; pending.set(id, { done, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params = {}) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable'); await call('Log.enable');
  const routes = [];
  for (const entry of manifest) {
    routes.push(`/${entry.mount}/`);
    try {
      const xml = await readFile(join(site, entry.mount, 'sitemap.xml'), 'utf8');
      const candidate = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname)
        .find((path) => path !== `/${entry.mount}/` && path.startsWith(`/${entry.mount}/`));
      if (candidate) routes.push(candidate);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const width of [390, 1440]) for (const route of new Set(routes)) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    events = [];
    await call('Page.navigate', { url: `${origin}${route}` });
    const deadline = Date.now() + 30_000;
    while (!await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && document.querySelector('h1') && document.styleSheets.length > 0`)) {
      assert.ok(Date.now() < deadline, `Page did not load: ${route}`);
      await new Promise((done) => setTimeout(done, 150));
    }
    await new Promise((done) => setTimeout(done, 500));
    const state = await evaluate(`({title:document.title,h1:document.querySelector('h1')?.textContent,h1Count:document.querySelectorAll('h1').length,mainCount:document.querySelectorAll('main,[role="main"]').length,overflow:document.documentElement.scrollWidth > innerWidth + 1,brokenImages:[...document.images].filter(i=>i.complete && i.currentSrc && i.naturalWidth===0).map(i=>i.currentSrc)})`);
    const problems = events.flatMap((event) => {
      if (event.method === 'Runtime.exceptionThrown') return [`JavaScript: ${event.params.exceptionDetails.text}`];
      if (event.method === 'Log.entryAdded' && /Content Security Policy|Refused to (?:load|execute|connect)/i.test(event.params.entry.text)) return [event.params.entry.text];
      if (event.method === 'Network.responseReceived' && event.params.response.url.startsWith(origin + '/') && event.params.response.status >= 400) return [`HTTP ${event.params.response.status}: ${event.params.response.url}`];
      return [];
    });
    if (state.brokenImages.length) problems.push(`Broken images: ${state.brokenImages.join(', ')}`);
    if (state.overflow) problems.push('Horizontal viewport overflow');
    if (state.h1Count !== 1) problems.push(`Expected one hydrated H1, found ${state.h1Count}`);
    if (state.mainCount !== 1) problems.push(`Expected one hydrated main landmark, found ${state.mainCount}`);
    if (problems.length) failures.push({ route, width, problems });
    results.push({ route, width, ...state });
  }
} finally {
  socket?.close(); chrome.kill('SIGTERM');
  await new Promise((done) => chrome.exitCode === null ? chrome.once('exit', done) : done());
  await rm(profile, { recursive: true, force: true });
}
const report = { origin, results, failures };
await writeFile(resolve(option('--report', '/tmp/1200km-companion-browser.json')), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ pages: results.length, failures }, null, 2));
assert.equal(failures.length, 0, 'Companion browser validation failed');
