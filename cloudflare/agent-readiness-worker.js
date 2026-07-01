const MARKDOWN_ROUTES = new Map([
  ['/', '/index.md'],
  ['/projects/', '/projects.md'],
  ['/projects.html', '/projects.md'],
  ['/adversarygraph/', '/adversarygraph.md'],
  ['/adversarygraph-docs/', '/adversarygraph-docs/index.md'],
  ['/adversarygraph-docs/capabilities/', '/adversarygraph-docs/capabilities.md'],
  ['/cti-analyst-field-manual/', '/cti-analyst-field-manual/index.md'],
  ['/israel-government-threat-actors-cti/', '/israel-government-threat-actors-cti/index.md'],
]);

const HOME_LINKS = [
  '</llms.txt>; rel="alternate"; type="text/plain"',
  '</agent-index.md>; rel="alternate"; type="text/markdown"',
  '</auth.md>; rel="authorization"; type="text/markdown"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
];

const JSON_WELL_KNOWN_PATHS = new Set([
  '/.well-known/openapi.json',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
  '/.well-known/oauth-protected-resource',
  '/.well-known/mcp/server-card.json',
  '/.well-known/agent-skills/index.json',
  '/.well-known/skills/index.json',
]);

function wantsMarkdown(request) {
  const accept = request.headers.get('accept') || '';
  return accept.toLowerCase().includes('text/markdown');
}

function addDiscoveryHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  if (pathname === '/' || pathname === '/index.html') {
    for (const link of HOME_LINKS) headers.append('Link', link);
  }
  if (MARKDOWN_ROUTES.has(pathname)) {
    headers.append('Link', `<${MARKDOWN_ROUTES.get(pathname)}>; rel="alternate"; type="text/markdown"`);
  }
  if (pathname.endsWith('.md')) {
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
  }
  if (pathname === '/llms.txt') {
    headers.set('Content-Type', 'text/plain; charset=utf-8');
  }
  if (pathname === '/.well-known/api-catalog') {
    headers.set('Content-Type', 'application/linkset+json; charset=utf-8');
  }
  if (JSON_WELL_KNOWN_PATHS.has(pathname)) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  if (pathname.startsWith('/.well-known/')) {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  return headers;
}

async function serveMarkdown(request, url) {
  const mdPath = MARKDOWN_ROUTES.get(url.pathname);
  if (!mdPath) return null;

  const mdUrl = new URL(mdPath, url.origin);
  const mdResponse = await fetch(mdUrl.toString(), {
    headers: {
      Accept: 'text/markdown,text/plain;q=0.9,*/*;q=0.1',
      'User-Agent': request.headers.get('user-agent') || '1200km-agent-readiness-worker',
    },
  });
  if (!mdResponse.ok) return null;

  const body = await mdResponse.text();
  const headers = new Headers(addDiscoveryHeaders(mdResponse, url.pathname));
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', 'Accept');
  headers.set('X-Markdown-Tokens', String(Math.ceil(body.split(/\s+/).filter(Boolean).length * 1.33)));
  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && wantsMarkdown(request)) {
      const markdownResponse = await serveMarkdown(request, url);
      if (markdownResponse) return markdownResponse;
    }

    const originResponse = await fetch(request);
    const headers = addDiscoveryHeaders(originResponse, url.pathname);
    if (MARKDOWN_ROUTES.has(url.pathname)) {
      headers.set('Vary', headers.get('Vary') ? `${headers.get('Vary')}, Accept` : 'Accept');
    }
    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers,
    });
  },
};
