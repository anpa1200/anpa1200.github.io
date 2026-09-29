import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import legacy from '../cloudflare/agent-readiness-worker.js';
import { createSiteWorker, LEGACY_CROSSLINK_REDIRECTS, MARKDOWN_ROUTES, parseHeaderPolicy, responseHeaders } from '../cloudflare/site-worker-lib.js';

const policy = readFileSync(new URL('../_headers', import.meta.url), 'utf8');
const worker = createSiteWorker(policy);
const calls = [];
const files = new Map([
  ['/index.html', ['HOME', 'text/html; charset=utf-8']],
  ['/about.html', ['ABOUT', 'text/html; charset=utf-8']],
  ['/projects.html', ['PROJECTS', 'text/html; charset=utf-8']],
  ['/articles/index.html', ['ARTICLES', 'text/html; charset=utf-8']],
  ['//foreign.example/index.html', ['DOUBLE SLASH', 'text/html']],
  ['/404.html', ['CUSTOM NOT FOUND', 'text/html; charset=utf-8']],
  ['/.well-known/api-catalog', ['{"linkset":[]}', 'application/octet-stream']],
  ...[...MARKDOWN_ROUTES.values()].map((path) => [path, ['# Markdown\n\nEvidence and discovery.', 'text/plain']]),
]);
function environment(available = files) {
  return { ASSETS: { async fetch(request) {
    calls.push(request);
    const entry = available.get(new URL(request.url).pathname);
    return new Response(request.method === 'HEAD' ? null : entry?.[0] || 'BINDING 404', {
      status: entry ? 200 : 404,
      headers: { 'Content-Type': entry?.[1] || 'text/plain', ETag: '"fixture"' },
    });
  } } };
}
async function get(path, init = {}, env = environment()) {
  calls.length = 0;
  return worker.fetch(new Request(`https://1200km-site.test.workers.dev${path}`, init), env);
}

test('ASSETS-only root, directories, explicit HTML, and extensionless Pages aliases', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('An origin network fetch is forbidden'); };
  try {
    for (const [path, body] of [['/', 'HOME'], ['/index.html', 'HOME'], ['/articles/', 'ARTICLES'], ['/articles/index.html', 'ARTICLES'], ['/about.html', 'ABOUT'], ['/about', 'ABOUT'], ['/projects.html', 'PROJECTS']]) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.equal(await response.text(), body, path);
      assert.equal(response.headers.get('Location'), null, path);
    }
    await get('/articles/?q=a%20b&tag=T1595');
    assert.equal(new URL(calls[0].url).search, '?q=a%20b&tag=T1595');
  } finally { globalThis.fetch = original; }
});

test('directory redirect retains host and query and leaves fragment inheritance to browser', async () => {
  const response = await get('/articles?q=a%20b#section');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://1200km-site.test.workers.dev/articles/?q=a%20b');
  assert.equal(calls.at(-1).method, 'HEAD');
  assert.equal((await get('//foreign.example')).headers.get('Location'), 'https://1200km-site.test.workers.dev//foreign.example/');
});

test('all broken legacy crosslinks redirect to reviewed current routes without origin escape', async () => {
  assert.equal(LEGACY_CROSSLINK_REDIRECTS.size, 35);
  for (const [oldPath, newPath] of LEGACY_CROSSLINK_REDIRECTS) {
    const response = await get(`${oldPath}?source=old#section`);
    assert.equal(response.status, 301, oldPath);
    assert.equal(response.headers.get('Location'), `https://1200km-site.test.workers.dev${newPath}?source=old`, oldPath);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(calls.length, 0, 'Redirect must not fetch an origin or asset');
  }
  assert.equal((await get('/about.html')).status, 200, 'Existing explicit HTML remains valid');
});

test('production HTTP redirects to HTTPS without dropping path or query', async () => {
  calls.length = 0;
  const response = await worker.fetch(new Request('http://1200km.com/about.html?q=a%20b'), environment());
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://1200km.com/about.html?q=a%20b');
  assert.equal(calls.length, 0);
});

test('third-party source captures are unmodified downloads and never executable indexed pages', async () => {
  const path = '/anomaly-detection-atlas/reports/cti-ir/f5-2024-ddos-attack-trends.html';
  for (const requestPath of [path, path.slice(0, -5)]) {
    const response = await get(requestPath, {}, environment(new Map([[path, ['SOURCE CAPTURE', 'text/html']]])));
    assert.equal(await response.text(), 'SOURCE CAPTURE');
    assert.equal(response.headers.get('Content-Disposition'), 'attachment');
    assert.match(response.headers.get('Content-Security-Policy'), /sandbox/);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
  assert.equal(responseHeaders({}, path.replace('/f5-', '/%665-'), parseHeaderPolicy(policy)).get('Content-Disposition'), 'attachment');
});

test('unknown requests serve root 404 with 404 status, even nested and conditional requests', async () => {
  for (const path of ['/missing', '/articles/missing/', '/missing.md', '/missing.json', '/about/']) {
    const response = await get(path, { headers: { 'If-None-Match': '"fixture"', Range: 'bytes=0-1' } });
    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'CUSTOM NOT FOUND');
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(calls.at(-1).headers.get('If-None-Match'), null);
    assert.equal(calls.at(-1).headers.get('Range'), null);
  }
  assert.equal((await get('/404.html')).status, 200);
});

test('HEAD retains status and headers but never returns body or negotiates Markdown', async () => {
  for (const path of ['/', '/about.html', '/articles', '/missing']) {
    const response = await get(path, { method: 'HEAD', headers: { Accept: 'text/markdown' } });
    assert.equal(await response.text(), '');
    assert.ok(response.headers.get('Content-Security-Policy'));
  }
  assert.equal((await get('/', { method: 'HEAD', headers: { Accept: 'text/markdown' } })).headers.get('Content-Type'), 'text/html; charset=utf-8');
});

test('non-read methods never invoke ASSETS and retain security policy', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await get('/', { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'GET, HEAD');
    assert.equal(calls.length, 0);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  }
});

test('all Markdown alternates use binding, preserve query and reproduce legacy tokens', async () => {
  for (const [path, alternate] of MARKDOWN_ROUTES) {
    const response = await get(`${path}?q=research`, { headers: { Accept: 'TEXT/MARKDOWN', Range: 'bytes=0-1' } });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), files.get(alternate)[0]);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.match(response.headers.get('Vary'), /Accept/);
    assert.equal(response.headers.get('X-Markdown-Tokens'), '7');
    assert.equal(new URL(calls[0].url).pathname, alternate);
    assert.equal(new URL(calls[0].url).search, '?q=research');
    assert.equal(calls[0].headers.get('Range'), null);
  }
});

test('unavailable Markdown falls back to HTML, without soft 404 or origin escape', async () => {
  const available = new Map(files);
  available.delete('/index.md');
  const response = await get('/', { headers: { Accept: 'text/markdown' } }, environment(available));
  assert.equal(await response.text(), 'HOME');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.match(response.headers.get('Vary'), /Accept/);
});

test('extensionless well-known endpoint is fetched as a file and has correct MIME and CORS', async () => {
  const response = await get('/.well-known/api-catalog');
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(response.headers.get('Content-Type'), 'application/linkset+json; charset=utf-8');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('untyped Pagefind binaries and JSON retain Pages MIME types', async () => {
  for (const path of ['/pagefind/wasm.en.pagefind', '/pagefind/fragment/test.pf_fragment', '/pagefind/index/test.pf_index']) {
    const response = await get(path, {}, { ASSETS: { fetch: async () => new Response(new Uint8Array([1, 2, 3])) } });
    assert.equal(response.headers.get('Content-Type'), 'application/octet-stream');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([1, 2, 3]));
  }
  const response = await get('/build.json', {}, { ASSETS: { fetch: async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }) } });
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
});

test('live ASSETS text MIME without charset retains the Pages UTF-8 declaration', async () => {
  for (const [path, mime] of [['/about.html', 'text/html'], ['/assets/test.css', 'text/css'], ['/robots.txt', 'text/plain']]) {
    const response = await get(path, {}, { ASSETS: { fetch: async () => new Response('UTF-8 evidence', { headers: { 'Content-Type': mime } }) } });
    assert.equal(response.headers.get('Content-Type'), `${mime}; charset=utf-8`);
  }
  const redirect = await get('/articles');
  assert.equal(redirect.headers.get('Content-Type'), 'text/html');
});

test('every _headers declaration is enforced independently of the binding', () => {
  // Independent reference interpreter, tested at a witness for every rule and
  // nested wildcard. No generated copy of the policy can silently become stale.
  const declarations = [];
  let pattern;
  for (const line of policy.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (line.startsWith('/')) pattern = line.trim();
    else {
      const separator = line.indexOf(':');
      declarations.push({ pattern, name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() });
    }
  }
  for (const path of [...new Set(declarations.map(({ pattern }) => pattern.replaceAll('*', 'nested/sample'))), '/index.html', '/missing']) {
    const output = responseHeaders({}, path, parseHeaderPolicy(policy));
    for (const { pattern, name, value } of declarations) {
      const [prefix, suffix] = pattern.split('*');
      const matches = suffix === undefined ? path === prefix : path.startsWith(prefix) && path.endsWith(suffix);
      if (matches) assert.ok(output.get(name)?.includes(value), `${path} must enforce ${name}: ${value}`);
    }
    assert.equal(output.get('Access-Control-Allow-Origin'), '*');
    assert.deepEqual([...responseHeaders(output, path, parseHeaderPolicy(policy))], [...output], 'Headers must be idempotent');
  }
});

test('unsupported future _headers syntax fails closed and is not silently ignored', () => {
  for (const text of ['/path/:id\n  X-Test: yes', '/path\n  ! Content-Security-Policy', 'https://example.com/*\n  X-Test: yes', '/**\n  X-Test: yes', '']) {
    assert.throws(() => parseHeaderPolicy(text));
  }
});

test('new Worker preserves legacy security, discovery, MIME and Markdown semantics', async () => {
  const source = readFileSync(new URL('../cloudflare/agent-readiness-worker.js', import.meta.url), 'utf8');
  const legacyRoutes = [...source.split('const HOME_LINKS')[0].matchAll(/\['([^']+)', '([^']+)'\]/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual([...MARKDOWN_ROUTES], legacyRoutes);
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => environment().ASSETS.fetch(typeof request === 'string' ? new Request(request) : request);
  try {
    for (const path of ['/', '/index.html', '/projects.html', '/llms.txt', '/.well-known/api-catalog', '/.well-known/mcp/server-card.json', '/data/site-facts.json', '/agent-index.md']) {
      const request = new Request(`https://example.test${path}`);
      const old = await legacy.fetch(request);
      const next = await worker.fetch(request, environment());
      for (const name of ['Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options']) {
        assert.equal(next.headers.get(name), old.headers.get(name), `${path} ${name}`);
      }
      for (const link of (old.headers.get('Link') || '').split(/,\s*(?=<)/).filter(Boolean)) {
        assert.ok(next.headers.get('Link')?.includes(link), `${path}: lost ${link}`);
      }
    }
    for (const path of MARKDOWN_ROUTES.keys()) {
      const request = new Request(`https://example.test${path}`, { headers: { Accept: 'text/markdown' } });
      const old = await legacy.fetch(request);
      const next = await worker.fetch(request, environment());
      assert.equal(await next.text(), await old.text());
      for (const name of ['Content-Type', 'X-Markdown-Tokens', 'Vary']) assert.equal(next.headers.get(name), old.headers.get(name));
    }
  } finally { globalThis.fetch = original; }
});
