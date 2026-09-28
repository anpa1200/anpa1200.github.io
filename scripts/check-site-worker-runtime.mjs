#!/usr/bin/env node
// Integration test against real local workerd + Static Assets, not an ASSETS mock.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(join(tmpdir(), '1200km-worker-runtime-'));
const pause = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const listener = createServer();
await new Promise((resolvePromise) => listener.listen(0, '127.0.0.1', resolvePromise));
const port = listener.address().port;
await new Promise((resolvePromise) => listener.close(resolvePromise));
const html = '<!doctype html><html><head><title>Fixture</title></head><body>Evidence fixture</body></html>';
const fixtures = {
  'anomaly-detection-atlas/reports/cti-ir/f5-2024-ddos-attack-trends.html': '<html>Archived source capture fixture</html>',
  'index.html': html, 'about.html': html, 'projects.html': html,
  'articles/index.html': html, '404.html': '<h1>Custom 404 fixture</h1>',
  'index.md': '# Research\n\nMarkdown fixture.', 'projects.md': '# Projects',
  '.well-known/api-catalog': '{"linkset":[]}', '.well-known/openapi.json': '{}',
  '.well-known/oauth-protected-resource': '{}', 'data/example.json': '{}',
  'assets/example.js': 'console.log("fixture");', 'pagefind/test.wasm': Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]),
  'pagefind/example.pf_fragment': Buffer.from([1, 2, 3]), 'build.json': '{}',
  '_headers': await readFile(join(root, '_headers'), 'utf8'),
};
for (const [path, body] of Object.entries(fixtures)) {
  await mkdir(dirname(join(temporary, path)), { recursive: true });
  await writeFile(join(temporary, path), body);
}
const child = spawn(process.execPath, [join(root, 'cloudflare/node_modules/wrangler/bin/wrangler.js'),
  'dev', '--local', '--config', 'cloudflare/wrangler.preview.json', '--assets', temporary,
  '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0'], {
  cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CHOKIDAR_USEPOLLING: 'true', CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (chunk) => { logs = `${logs}${chunk}`.slice(-18000); });
child.stderr.on('data', (chunk) => { logs = `${logs}${chunk}`.slice(-18000); });
const origin = `http://127.0.0.1:${port}`;
let checks = 0;
async function request(path, init = {}) {
  const response = await fetch(`${origin}${path}`, { ...init, redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.ok(response.headers.get('Content-Security-Policy'), path);
  assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=31536000', path);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff', path);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*', path);
  checks++;
  return response;
}
try {
  const deadline = Date.now() + 45000;
  let ready = false;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      const response = await fetch(`${origin}/about.html`, { signal: AbortSignal.timeout(500) });
      await response.body?.cancel();
      ready = true;
      break;
    } catch { await pause(200); }
  }
  assert.ok(ready, `Local Worker failed to start:\n${logs}`);
  for (const path of ['/', '/index.html', '/index', '/about', '/about.html', '/projects.html', '/articles/', '/articles/index.html', '/articles/?q=a%20b']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('Location'), null);
    assert.equal(await response.text(), html, path);
  }
  const redirect = await request('/articles?q=a%20b');
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), `${origin}/articles/?q=a%20b`);
  for (const path of ['/missing', '/nested/missing/', '/about/', '/missing.md']) {
    const response = await request(path, { headers: { Range: 'bytes=0-1', 'If-None-Match': '*' } });
    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), fixtures['404.html']);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  }
  const home = await request('/');
  const links = home.headers.get('Link').split(/,\s*(?=<)/);
  assert.equal(links.length, new Set(links).size, 'Discovery links are duplicated');
  assert.ok(links.some((link) => link.startsWith('</feed.xml>')));
  await home.body?.cancel();
  const capture = '/anomaly-detection-atlas/reports/cti-ir/f5-2024-ddos-attack-trends.html';
  for (const path of [capture, capture.slice(0, -5)]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), fixtures[capture.slice(1)]);
    assert.equal(response.headers.get('Content-Disposition'), 'attachment');
    assert.equal(response.headers.get('Content-Security-Policy'), "default-src 'none'; sandbox; frame-ancestors 'none'");
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
  for (const path of ['/?q=kept', '/projects.html', '/projects/']) {
    const response = await request(path, { headers: { Accept: 'text/markdown', Range: 'bytes=0-1' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.ok(response.headers.get('Vary').includes('Accept'));
    assert.equal(await response.text(), path.startsWith('/projects') ? fixtures['projects.md'] : fixtures['index.md']);
  }
  const json = await request('/.well-known/api-catalog');
  assert.equal(json.headers.get('Content-Type'), 'application/linkset+json; charset=utf-8');
  assert.equal(await json.text(), fixtures['.well-known/api-catalog']);
  for (const path of ['/.well-known/openapi.json', '/.well-known/oauth-protected-resource', '/data/example.json', '/build.json']) {
    const response = await request(path);
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
    assert.equal(await response.text(), '{}');
  }
  const script = await request('/assets/example.js');
  assert.equal(script.headers.get('Content-Type'), 'application/javascript; charset=utf-8');
  await script.body?.cancel();
  const wasm = await request('/pagefind/test.wasm');
  assert.equal(wasm.headers.get('Content-Type'), 'application/wasm');
  await wasm.body?.cancel();
  const binary = await request('/pagefind/example.pf_fragment');
  assert.equal(binary.headers.get('Content-Type'), 'application/octet-stream');
  assert.deepEqual(Buffer.from(await binary.arrayBuffer()), fixtures['pagefind/example.pf_fragment']);
  const asset = await request('/about.html');
  const etag = asset.headers.get('ETag');
  assert.ok(etag);
  await asset.body?.cancel();
  const conditional = await request('/about.html', { headers: { 'If-None-Match': etag } });
  assert.equal(conditional.status, 304);
  assert.equal(await conditional.text(), '');
  const range = await request('/about.html', { headers: { Range: 'bytes=0-9' } });
  // Static Assets currently ignores Range in this runtime. HTTP permits a full
  // 200 response; verify its complete body, and report the provider difference.
  assert.ok([200, 206].includes(range.status));
  assert.equal(await range.text(), range.status === 206 ? html.slice(0, 10) : html);
  console.log(`ASSETS Range probe: HTTP ${range.status} (${range.status === 206 ? 'partial body' : 'complete-body fallback'}). Live parity records the production comparison.`);
  for (const [path, status] of [['/', 200], ['/missing', 404]]) {
    const response = await request(path, { method: 'HEAD' });
    assert.equal(response.status, status);
    assert.equal(await response.text(), '');
  }
  console.log(`Real workerd + ASSETS integration passed: ${checks} HTTP cases, including _headers, Markdown, 404, range and conditional responses.`);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await Promise.race([new Promise((resolvePromise) => child.once('exit', resolvePromise)), pause(3000)]);
  if (child.exitCode === null) child.kill('SIGKILL');
  await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
