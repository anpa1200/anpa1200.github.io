import { createHash } from 'node:crypto';

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const CHECKED_HEADERS = [
  'content-type', 'content-security-policy', 'strict-transport-security',
  'x-content-type-options', 'referrer-policy', 'permissions-policy',
  'x-frame-options', 'access-control-allow-origin', 'link', 'vary', 'x-robots-tag',
];

export function comparableHeader(name, value = '') {
  if (value === null) return '';
  if (name === 'content-type') return value.toLowerCase().replace(/\s*;\s*/g, ';')
    .replace('text/javascript', 'application/javascript').replace('text/xml', 'application/xml');
  if (name === 'content-security-policy') return value.split(';').map((part) => part.trim().replace(/\s+/g, ' ')).filter(Boolean).sort().join(';');
  if (name === 'link') return [...new Set(value.split(/,\s*(?=<)/).filter(Boolean))].sort().join(', ');
  if (name === 'vary') return [...new Set(value.toLowerCase().split(',').map((part) => part.trim()).filter(Boolean))].sort().join(',');
  return value;
}

export function canonicalUrls(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].flatMap(([tag]) => {
    // Published Docusaurus pages can legally omit attribute quotes. Detect
    // their canonical links too, instead of reporting a false missing URL.
    const attributes = Object.fromEntries([...tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
    if (!attributes.rel?.toLowerCase().split(/\s+/).includes('canonical')) return [];
    return [attributes.href?.replaceAll('&amp;', '&') || ''];
  });
}

// Deliberately narrow normalization: no text, dates, scripts, citations, or
// arbitrary hashes are stripped to make different publications appear equal.
export function withoutBuildIdentity(html) {
  return html
    .replace(/(<meta\b[^>]*\bname=["']1200km-build["'][^>]*\bcontent=["'])[a-f0-9]{40}(["'][^>]*>)/gi, '$1BUILD$2')
    .replace(/(<code\b[^>]*\bdata-site-build-id(?:=["'][^"']*["'])?[^>]*>)[a-f0-9]{40}(<\/code>)/gi, '$1BUILD$2');
}

export function localAsset(pathname, paths) {
  let path;
  try { path = decodeURIComponent(pathname).replace(/^\//, ''); } catch { return { status: 404, asset: '404.html' }; }
  const direct = path.endsWith('/') || !path ? `${path}index.html` : path;
  if (paths.has(direct)) return { status: 200, asset: direct };
  if (path && !path.endsWith('/')) {
    if (!path.endsWith('.html') && paths.has(`${path}.html`)) return { status: 200, asset: `${path}.html` };
    if (paths.has(`${path}/index.html`)) return { status: 301, asset: null };
  }
  return { status: 404, asset: '404.html' };
}

export function expectedMime(asset) {
  if (!asset) return '';
  const suffix = asset.split('.').at(-1).toLowerCase();
  return ({ html: 'text/html; charset=utf-8', md: 'text/markdown; charset=utf-8',
    txt: 'text/plain; charset=utf-8', json: 'application/json',
    js: 'application/javascript; charset=utf-8', mjs: 'application/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8', xml: 'application/xml', svg: 'image/svg+xml',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    pdf: 'application/pdf', woff2: 'font/woff2', wasm: 'application/wasm',
  })[suffix] || 'application/octet-stream';
}
