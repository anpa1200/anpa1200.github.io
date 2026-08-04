import { stripHtml, tagAttributes } from './release-html-lib.mjs';

export const SIDEBAR_START = '<!-- platform-sidebar:start -->';
export const SIDEBAR_END = '<!-- platform-sidebar:end -->';
export const SIDEBAR_ASSET_VERSION = '20260804-1';

const SIDEBAR_REGION = new RegExp(
  `${SIDEBAR_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${SIDEBAR_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
  'i',
);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizePath(value) {
  try {
    let path = new URL(value, 'https://1200km.com').pathname.replace(/\/{2,}/g, '/');
    if (path.endsWith('/index.html')) path = path.slice(0, -'index.html'.length);
    return path || '/';
  } catch {
    return '/';
  }
}

function currentState(link, pathname) {
  if (link.external) return '';
  const matches = link.match_prefixes?.length ? link.match_prefixes : [link.href];
  const matched = matches.some((candidate) => {
    const prefix = normalizePath(candidate);
    return prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix;
  });
  if (!matched) return '';
  return pathname === normalizePath(link.href) ? ' aria-current="page"' : ' aria-current="location"';
}

function shortenLabel(value, maximum = 56) {
  const label = stripHtml(value).replace(/\s+/g, ' ').trim();
  return label.length <= maximum ? label : `${label.slice(0, maximum - 1).trimEnd()}…`;
}

function stripExistingSidebar(html) {
  let transformed = html.replace(SIDEBAR_REGION, '');
  transformed = transformed.replace(
    /\s*<aside\b(?=[^>]*(?:\bid=["'](?:page|platform)-sidenav["']|\bclass=["'][^"']*\bpage-sidenav\b[^"']*["']))[^>]*>[\s\S]*?<\/aside>\s*/i,
    '\n',
  );
  return transformed.replace(/(<body\b[^>]*>)\s*/i, '$1');
}

export function extractPageLinks(html, maximum = 7) {
  const withoutSidebar = stripExistingSidebar(html);
  const main = withoutSidebar.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || withoutSidebar;
  const links = [];
  const seen = new Set();
  for (const match of main.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi)) {
    const attributes = tagAttributes(`<h2 ${match[1]}>`);
    const id = attributes.id || '';
    const label = shortenLabel(match[2]);
    if (!id || !label || seen.has(id) || id.startsWith('sidenav-')) continue;
    if (/^(?:table of contents|contents)$/i.test(label)) continue;
    seen.add(id);
    links.push({ id, label });
    if (links.length >= maximum) break;
  }
  return links;
}

function renderPageSection(pageLinks) {
  if (!pageLinks.length) return '';
  const links = pageLinks.map((item, index) => (
    `            <li><a${index === 0 ? ' class="active" aria-current="location"' : ''} href="#${escapeHtml(item.id)}" data-section="${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`
  )).join('\n');
  return `        <section class="sidenav-section" aria-labelledby="sidenav-page-label">
          <div class="sidenav-group" id="sidenav-page-label">On this page</div>
          <ul class="sidenav-list">
${links}
          </ul>
        </section>`;
}

function renderGlobalSection(section, pathname) {
  const links = section.links.map((item) => {
    const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const suffix = item.external ? '<span class="sidenav-external" aria-hidden="true">↗</span>' : '';
    return `            <li><a href="${escapeHtml(item.href)}"${currentState(item, pathname)}${external}>${escapeHtml(item.label)}${suffix}</a></li>`;
  }).join('\n');
  return `        <section class="sidenav-section" aria-labelledby="sidenav-${escapeHtml(section.id)}-label">
          <div class="sidenav-group" id="sidenav-${escapeHtml(section.id)}-label">${escapeHtml(section.label)}</div>
          <ul class="sidenav-list">
${links}
          </ul>
        </section>`;
}

export function renderPlatformSidebar(shell, { pathname = '/', pageLinks = [] } = {}) {
  const normalizedPath = normalizePath(pathname);
  const pageSection = renderPageSection(pageLinks);
  const sections = shell.sidebar.sections.map((section) => renderGlobalSection(section, normalizedPath)).join('\n');
  return `${SIDEBAR_START}
    <aside class="page-sidenav platform-sidenav" id="platform-sidenav" aria-label="Platform navigation" data-pagefind-ignore>
      <a class="sidenav-brand" href="/">
        <img src="${escapeHtml(shell.brand.logo)}" alt="" width="32" height="32" loading="lazy" decoding="async" />
        <span class="sidenav-brand-copy">
          <strong>${escapeHtml(shell.brand.name)}</strong>
          <small>${escapeHtml(shell.brand.descriptor)}</small>
        </span>
      </a>
      <nav class="sidenav-scroll" aria-label="Page contents and platform sections">
${pageSection ? `${pageSection}\n` : ''}${sections}
      </nav>
      <div class="sidenav-footer">
        <span>1200km.com</span>
        <a href="#top" title="Back to top">↑ top</a>
      </div>
    </aside>
    ${SIDEBAR_END}`;
}

function ensureHeadAsset(html, pattern, markup) {
  if (pattern.test(html)) return html;
  return html.replace(/<\/head>/i, `    ${markup}\n  </head>`);
}

function ensureBodyState(html) {
  const topTargetCount = (html.match(/\bid\s*=\s*["']top["']/gi) || []).length;
  return html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    let next = attributes.replace(/\bclass\s*=\s*(["'])([\s\S]*?)\1/i, (classTag, quote, classes) => {
      const values = classes.split(/\s+/).filter((value) => value && value !== 'has-page-sidenav');
      if (!values.includes('has-platform-sidenav')) values.push('has-platform-sidenav');
      return `class=${quote}${values.join(' ')}${quote}`;
    });
    if (!/\bclass\s*=/i.test(next)) next += ' class="has-platform-sidenav"';
    if (topTargetCount > 1 && /\bid\s*=\s*["']top["']/i.test(next)) {
      next = next.replace(/\s+id\s*=\s*(["'])top\1/i, '');
    }
    if (!/\bid\s*=/i.test(next) && topTargetCount === 0) next += ' id="top"';
    return `<body${next}>`;
  });
}

export function isSidebarEligible(html) {
  if (!/<html\b/i.test(html) || !/<body\b/i.test(html)) return false;
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i.test(html)) return false;
  const title = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (/^redirecting\b/i.test(title)) return false;
  return true;
}

export function applyPlatformSidebar(html, shell, { pathname = '/' } = {}) {
  if (!isSidebarEligible(html)) return html;
  const withoutSidebar = stripExistingSidebar(html);
  const pageLinks = extractPageLinks(withoutSidebar, shell.sidebar.max_page_links);
  const sidebar = renderPlatformSidebar(shell, { pathname, pageLinks });
  let transformed = ensureBodyState(withoutSidebar);
  transformed = transformed.replace(/<body\b[^>]*>/i, (body) => `${body}\n${sidebar}\n`);
  transformed = ensureHeadAsset(
    transformed,
    /href=["'][^"']*\/assets\/platform-sidebar\.css/i,
    `<link rel="stylesheet" href="/assets/platform-sidebar.css?v=${SIDEBAR_ASSET_VERSION}" />`,
  );
  transformed = ensureHeadAsset(
    transformed,
    /src=["'][^"']*\/assets\/platform-sidebar\.js/i,
    `<script src="/assets/platform-sidebar.js?v=${SIDEBAR_ASSET_VERSION}" defer></script>`,
  );
  return transformed;
}
