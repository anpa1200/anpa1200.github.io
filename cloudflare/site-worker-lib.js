// This is deliberately separate from the currently configured production Worker.
// Regression tests compare its agent behavior with agent-readiness-worker.js.
import { isEvidenceRequest } from './evidence-documents.js';
import crosslinkManifest from './crosslink-rewrites.json' with { type: 'json' };
export const LEGACY_CROSSLINK_REDIRECTS = new Map(crosslinkManifest.rewrites.map(({ from, to }) => {
  const source = new URL(from, 'https://1200km.com');
  const target = new URL(to, 'https://1200km.com');
  if (source.origin !== 'https://1200km.com' || target.origin !== 'https://1200km.com') {
    throw new Error('Crosslink redirects must remain on 1200km.com');
  }
  return [source.pathname, target.pathname];
}));
if (LEGACY_CROSSLINK_REDIRECTS.size !== crosslinkManifest.rewrites.length) {
  throw new Error('Duplicate legacy crosslink redirect path');
}
export const MARKDOWN_ROUTES = new Map([
  ['/', '/index.md'],
  ['/projects/', '/projects.md'],
  ['/projects.html', '/projects.md'],
  ['/adversarygraph/', '/adversarygraph.md'],
  ['/adversarygraph-docs/', '/adversarygraph-docs/index.md'],
  ['/adversarygraph-docs/capabilities/', '/adversarygraph-docs/capabilities.md'],
  ['/cti-analyst-field-manual/', '/cti-analyst-field-manual/index.md'],
  ['/israel-government-threat-actors-cti/', '/israel-government-threat-actors-cti/index.md'],
]);

// Only the syntax actually used in _headers is supported. Fail closed on a new
// unsupported rule rather than silently dropping security policy on deployment.
export function parseHeaderPolicy(text) {
  const rules = [];
  let current;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim();
      if (!pattern.startsWith('/') || /[:?!\s]/.test(pattern) || (pattern.match(/\*/g) || []).length > 1) {
        throw new Error(`Unsupported _headers path: ${pattern}`);
      }
      const expression = pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      current = { pattern, matches: new RegExp(`^${expression}$`), headers: [] };
      rules.push(current);
    } else {
      const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/);
      if (!current || !match || /:(?:splat|[A-Za-z]\w*)\b/.test(match[2])) {
        throw new Error(`Unsupported _headers declaration: ${line.trim()}`);
      }
      current.headers.push([match[1], match[2]]);
    }
  }
  if (!rules.length) throw new Error('Empty _headers policy');
  return rules;
}

function appendUnique(headers, name, value, separator = /,\s*/) {
  const values = (headers.get(name) || '').split(separator).filter(Boolean);
  if (!values.includes(value)) values.push(value);
  headers.set(name, values.join(', '));
}

export function responseHeaders(original, pathname, rules) {
  const headers = new Headers(original);
  const policy = new Map();
  for (const rule of rules) {
    if (!rule.matches.test(pathname)) continue;
    for (const [name, value] of rule.headers) {
      const key = name.toLowerCase();
      if (!policy.has(key)) policy.set(key, new Set());
      policy.get(key).add(value);
    }
  }
  for (const [name, values] of policy) {
    // Replacing binding headers makes this idempotent even when ASSETS also
    // applies _headers. In particular, ACAO must never become "*, *".
    if (name === 'link') {
      for (const value of values) appendUnique(headers, name, value, /,\s*(?=<)/);
    } else headers.set(name, [...values].join(', '));
  }
  // GitHub Pages supplies wildcard CORS for its public, read-only responses.
  // The old edge Worker preserved it; retain it beyond the explicit rules.
  if (!headers.has('Access-Control-Allow-Origin')) headers.set('Access-Control-Allow-Origin', '*');
  if (pathname === '/index.html') {
    for (const rule of rules.filter((item) => item.pattern === '/')) {
      for (const [name, value] of rule.headers) {
        if (name.toLowerCase() === 'link') appendUnique(headers, name, value, /,\s*(?=<)/);
      }
    }
  }
  if (MARKDOWN_ROUTES.has(pathname)) {
    appendUnique(headers, 'Link', `<${MARKDOWN_ROUTES.get(pathname)}>; rel="alternate"; type="text/markdown"`, /,\s*(?=<)/);
    appendUnique(headers, 'Vary', 'Accept');
  }
  // Preserve the current Pages MIME spelling for JS modules (both spellings
  // are valid JavaScript MIME types, but parity should not depend on that).
  if (/\.(?:js|mjs)$/.test(pathname) && !headers.get('Content-Type')?.startsWith('text/html')) {
    headers.set('Content-Type', 'application/javascript; charset=utf-8');
  }
  if (pathname.endsWith('.json') && !headers.get('Content-Type')?.startsWith('text/html')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  if (isEvidenceRequest(pathname)) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Content-Disposition', 'attachment');
    headers.set('Content-Security-Policy', "default-src 'none'; sandbox; frame-ancestors 'none'");
  }
  return headers;
}

function assetRequest(request, pathname, { probe = false, markdown = false } = {}) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.hash = ''; // Fragments never reach an HTTP server; query stays intact.
  const headers = new Headers(request.headers);
  if (probe || markdown) {
    // A range/conditional request must not turn a directory probe into a
    // partial response, or Markdown negotiation into a truncated document.
    for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) headers.delete(name);
  }
  if (markdown) {
    headers.set('Accept', 'text/markdown,text/plain;q=0.9,*/*;q=0.1');
    if (!headers.has('User-Agent')) headers.set('User-Agent', '1200km-agent-readiness-worker');
  }
  return new Request(url, { method: probe ? 'HEAD' : request.method, headers, redirect: 'manual' });
}

export function createSiteWorker(headerText) {
  const rules = parseHeaderPolicy(headerText);
  const finish = (response, pathname, request, status = response.status) => {
    const headers = responseHeaders(response.headers, pathname, rules);
    // Static Assets defaults to revalidation on every visit. Cache asset URLs
    // in browsers; reserve immutable for names with an embedded content hash.
    // Query-string versions are not assumed immutable because some are stale.
    if (status === 200 && (pathname.startsWith('/pagefind/') || /\.(?:avif|css|gif|ico|jpe?g|js|mjs|mp4|png|svg|ttf|wasm|webm|webp|woff2?)$/i.test(pathname))) {
      const fingerprinted = /\.[a-f0-9]{8,}\.(?:css|js|mjs|avif|gif|jpe?g|png|svg|webp|woff2?)$/i.test(pathname);
      headers.set('Cache-Control', fingerprinted
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400');
    }

    // Production ASSETS omits these charsets even though local workerd adds
    // them. Preserve Pages' UTF-8 declaration without changing redirect MIME.
    const mime = headers.get('Content-Type') || '';
    if (![301, 302, 303, 307, 308].includes(status) && /^text\/(?:html|css|plain)$/i.test(mime)) {
      headers.set('Content-Type', `${mime}; charset=utf-8`);
    }
    // Wrangler cannot infer MIME for Pagefind's .pf_* / .pagefind binaries.
    // GitHub Pages uses octet-stream for unknown extensions; match that default.
    if (!headers.has('Content-Type') && ![204, 205, 304].includes(status)) headers.set('Content-Type', 'application/octet-stream');
    if (new URL(request.url).hostname.endsWith('.workers.dev')) appendUnique(headers, 'X-Robots-Tag', 'noindex');
    return new Response(request.method === 'HEAD' || [204, 205, 304].includes(status) ? null : response.body, { status, headers });
  };

  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const pathname = url.pathname;
      if (url.hostname === '1200km.com' && url.protocol === 'http:') {
        url.protocol = 'https:';
        return finish(new Response(null, { status: 301, headers: { Location: url.href, 'Content-Type': 'text/html' } }), pathname, request);
      }
      if (!['GET', 'HEAD'].includes(request.method)) {
        return finish(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }), pathname, request);
      }
      if (LEGACY_CROSSLINK_REDIRECTS.has(pathname)) {
        const target = `${url.origin}${LEGACY_CROSSLINK_REDIRECTS.get(pathname)}${url.search}`;
        return finish(new Response(null, { status: 301, headers: { Location: target, 'Content-Type': 'text/html' } }), pathname, request);
      }
      if (request.method === 'GET' && (request.headers.get('Accept') || '').toLowerCase().includes('text/markdown')) {
        const alternate = MARKDOWN_ROUTES.get(pathname);
        if (alternate) {
          const response = await env.ASSETS.fetch(assetRequest(request, alternate, { markdown: true }));
          if (response.ok) {
            const body = await response.text();
            const headers = responseHeaders(response.headers, pathname, rules);
            headers.set('Content-Type', 'text/markdown; charset=utf-8');
            appendUnique(headers, 'Vary', 'Accept');
            headers.set('X-Markdown-Tokens', String(Math.ceil(body.split(/\s+/).filter(Boolean).length * 1.33)));
            headers.delete('Content-Length');
            return finish(new Response(body, { status: 200, headers }), pathname, request);
          }
          await response.body?.cancel();
        }
      }

      const assetPath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
      let response = await env.ASSETS.fetch(assetRequest(request, assetPath));
      if (response.status !== 404) return finish(response, pathname, request);
      await response.body?.cancel();

      if (!pathname.endsWith('/')) {
        // GitHub Pages also accepts /about for /about.html. This is an internal
        // compatibility alias, never an automatic .html -> extensionless redirect.
        if (!pathname.endsWith('.html')) {
          response = await env.ASSETS.fetch(assetRequest(request, `${pathname}.html`));
          if (response.status !== 404) return finish(response, pathname, request);
          await response.body?.cancel();
        }
        const directory = await env.ASSETS.fetch(assetRequest(request, `${pathname}/index.html`, { probe: true }));
        const directoryExists = directory.ok;
        await directory.body?.cancel();
        if (directoryExists) {
          // Keep the incoming host and browser fragment inheritance. An explicit
          // origin also prevents a //-prefixed path becoming an open redirect.
          const location = `${url.origin}${pathname}/${url.search}`;
          return finish(new Response(null, { status: 301, headers: { Location: location, 'Content-Type': 'text/html' } }), pathname, request);
        }
      }
      response = await env.ASSETS.fetch(assetRequest(request, '/404.html', { markdown: true }));
      if (!response.ok) {
        await response.body?.cancel();
        return finish(new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }), pathname, request);
      }
      // Always the existing root 404 document, never an SPA or nearest-directory fallback.
      const result = finish(response, pathname, request, 404);
      result.headers.set('Content-Type', 'text/html; charset=utf-8');
      return result;
    },
  };
}
