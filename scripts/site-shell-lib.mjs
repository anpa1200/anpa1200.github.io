import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const HEADER_START = '<!-- site-shell:header:start -->';
export const HEADER_END = '<!-- site-shell:header:end -->';
export const FOOTER_START = '<!-- site-shell:footer:start -->';
export const FOOTER_END = '<!-- site-shell:footer:end -->';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function loadSiteShell(root) {
  const path = join(root, 'data', 'site-shell.json');
  if (!existsSync(path)) throw new Error(`Site shell definition not found: ${path}`);
  const shell = JSON.parse(readFileSync(path, 'utf8'));
  if (!shell.version
    || !shell.brand
    || !Array.isArray(shell.primary_navigation)
    || shell.primary_navigation.length !== 4
    || !Array.isArray(shell.secondary_navigation)
    || shell.secondary_navigation.length < 1
    || !Array.isArray(shell.pages)) {
    throw new Error('data/site-shell.json is missing required shell fields');
  }
  return shell;
}

function currentState(item, page) {
  if (item.id !== page.active) return '';
  const exact = item.href === `/${page.path}`
    || (item.href.endsWith('/') && page.path === `${item.href.slice(1)}index.html`);
  return ` class="${item.flagship ? 'nav-flagship ' : ''}active" aria-current="${exact ? 'page' : 'location'}"`;
}

function renderNavigationLinks(shell, page, indent = '            ') {
  return shell.primary_navigation.map((item) => {
    const staticClass = item.flagship && item.id !== page.active ? ' class="nav-flagship"' : '';
    const state = currentState(item, page) || staticClass;
    return `${indent}<a${state} href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
  }).join('\n');
}

function renderSecondaryNavigation(shell, page, indent = '              ') {
  const active = shell.secondary_navigation.some((item) => item.id === page.active);
  const links = shell.secondary_navigation.map((item) => {
    const state = currentState(item, page);
    return `${indent}  <a${state} href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
  }).join('\n');
  return `${indent.slice(0, -2)}<details class="nav-more"${active ? ' data-active="true"' : ''}>
${indent}<summary>More</summary>
${indent}<div class="nav-more-list">
${links}
${indent}</div>
${indent.slice(0, -2)}</details>`;
}

export function renderHeader(shell, page) {
  const brand = shell.brand;
  return `${HEADER_START}
    <header class="site-header" data-site-shell="standalone" data-site-shell-version="${escapeHtml(shell.version)}">
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <nav class="nav" aria-label="Primary navigation">
        <a class="brand" href="${escapeHtml(brand.href)}">
          <img src="${escapeHtml(brand.logo)}" alt="" width="36" height="36" />
          <span class="brand-copy"><strong>${escapeHtml(brand.name)}</strong><small>${escapeHtml(brand.descriptor)}</small></span>
        </a>
        <details class="nav-links" data-mobile-navigation>
          <summary class="nav-menu-toggle" aria-label="Open navigation" aria-controls="primary-nav-list">
            <span class="nav-menu-icon" aria-hidden="true"><span></span><span></span></span>
            <span class="nav-menu-text">Menu</span>
          </summary>
          <div class="nav-list" id="primary-nav-list">
            <!-- site-shell:primary-navigation:start -->
${renderNavigationLinks(shell, page)}
${renderSecondaryNavigation(shell, page)}
            <!-- site-shell:primary-navigation:end -->
          </div>
        </details>
        <div class="site-search-host site-search-host--standalone" data-site-search-theme data-search-state="loading" role="search" aria-label="Site search">
          <a class="site-search-fallback" data-site-search-control="fallback" href="/search.html" aria-label="Search all 1200km research">
            <span aria-hidden="true" class="site-search-fallback-icon"></span>
            <span class="site-search-fallback-text">Search research</span>
          </a>
        </div>
        <button class="theme-btn" id="theme-btn" type="button" aria-label="Toggle theme" title="Toggle theme">☀</button>
      </nav>
    </header>
    ${HEADER_END}`;
}

export function renderFooter(shell, page) {
  const about = shell.secondary_navigation.find((item) => item.id === 'about');
  const footerNavigation = about ? [...shell.primary_navigation, about] : shell.primary_navigation;
  const globalLinks = footerNavigation.map((item) =>
    `          <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('\n');
  const informationLinks = shell.footer.site_information.map((item) => {
    const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const suffix = item.external ? '<span class="visually-hidden"> (opens in a new tab)</span><span aria-hidden="true"> ↗</span>' : '';
    return `          <a href="${escapeHtml(item.href)}"${external}>${escapeHtml(item.label)}${suffix}</a>`;
  }).join('\n');
  const top = page.back_to_top ? '\n        <a href="#top" data-back-to-top>Back to top ↑</a>' : '';

  return `${FOOTER_START}
    <footer class="site-footer" data-site-shell="standalone" data-site-shell-version="${escapeHtml(shell.version)}">
      <div class="shared-footer-inner">
        <a class="shared-footer-brand" href="/">
          <img src="${escapeHtml(shell.brand.logo)}" alt="" width="32" height="32" />
          <span><strong>${escapeHtml(shell.brand.name)}</strong><small>${escapeHtml(shell.brand.descriptor)}</small></span>
        </a>
        <nav class="shared-footer-links" aria-label="Footer navigation">
${globalLinks}
        </nav>
        <nav class="shared-footer-meta" aria-label="Site information">
${informationLinks}
        </nav>
      </div>
      <div class="shared-footer-bottom">
        <span>${escapeHtml(shell.footer.copyright)}</span>${top}
      </div>
    </footer>
    ${FOOTER_END}`;
}

function replaceShellRegion(html, start, end, fallback, replacement, label, pagePath) {
  const marked = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (marked.test(html)) return html.replace(marked, replacement);
  if (!fallback.test(html)) throw new Error(`${pagePath}: unable to locate ${label}`);
  return html.replace(fallback, replacement);
}

function ensureTopTarget(html) {
  return html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    if (/\bid\s*=/.test(attributes)) return tag;
    return `<body${attributes} id="top">`;
  });
}

function ensureMainTarget(html) {
  return html.replace(/<main\b([^>]*)>/i, (tag, attributes) => {
    if (/\bid\s*=/.test(attributes)) return tag;
    return `<main${attributes} id="main-content">`;
  });
}

function ensureStaticThemeStyles(html) {
  if (/href=["'][^"']*\/assets\/site-theme\.css/i.test(html)) return html;
  return html.replace(/<\/head>/i, '    <link rel="stylesheet" href="/assets/site-theme.css?v=20260721-shell" />\n  </head>');
}

function ensureStaticThemeScript(html) {
  if (/src=["'][^"']*\/assets\/site-theme\.js/i.test(html)) return html;
  return html.replace(/<\/head>/i, '    <script src="/assets/site-theme.js?v=20260721-shell" defer></script>\n  </head>');
}

export function applySiteShell(html, shell, page) {
  let transformed = replaceShellRegion(
    html,
    HEADER_START,
    HEADER_END,
    /<header\b(?=[^>]*\bclass=["'][^"']*\bsite-header\b[^"']*["'])[^>]*>[\s\S]*?<\/header>/i,
    renderHeader(shell, page),
    'standalone header',
    page.path,
  );
  transformed = replaceShellRegion(
    transformed,
    FOOTER_START,
    FOOTER_END,
    /<footer\b[^>]*>[\s\S]*?<\/footer>/i,
    renderFooter(shell, page),
    'standalone footer',
    page.path,
  );
  return ensureStaticThemeScript(ensureStaticThemeStyles(ensureMainTarget(ensureTopTarget(transformed))));
}
