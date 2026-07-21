import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOOTER_END,
  FOOTER_START,
  HEADER_END,
  HEADER_START,
  loadSiteShell,
  renderFooter,
  renderHeader,
} from '../scripts/site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shell = loadSiteShell(ROOT);
const expectedLabels = shell.primary_navigation.map((item) => item.label);
const expectedHrefs = shell.primary_navigation.map((item) => item.href);

function region(html, start, end) {
  return html.slice(html.indexOf(start), html.indexOf(end) + end.length);
}

function links(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    attributes: match[1],
    href: match[1].match(/\bhref="([^"]+)"/)?.[1] || '',
    label: match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
}

test('every standalone page contains the generated canonical header and footer', () => {
  assert.equal(shell.pages.length, 24);
  assert.deepEqual(expectedLabels, ['Research', 'AdversaryGraph', 'Labs', 'Library', 'Projects', 'About']);
  assert.ok(expectedHrefs.every((href) => href.startsWith('/')), 'primary destinations must be root-relative');

  for (const page of shell.pages) {
    const html = readFileSync(join(ROOT, page.path), 'utf8');
    const header = region(html, HEADER_START, HEADER_END);
    const footer = region(html, FOOTER_START, FOOTER_END);
    assert.equal(header, renderHeader(shell, page), `${page.path}: header differs from generated source`);
    assert.equal(footer, renderFooter(shell, page), `${page.path}: footer differs from generated source`);
    assert.equal((html.match(/data-site-shell="standalone"/g) || []).length, 2, `${page.path}: shell regions must be unique`);
    assert.match(html, /<body\b[^>]*\bid="top"/, `${page.path}: back-to-top target is missing`);
    assert.match(html, /href="\/assets\/site-theme\.css\?v=20260721-shell"/, `${page.path}: shared shell CSS must be static`);
    assert.match(html, /src="\/assets\/site-theme\.js\?v=20260721-shell"/, `${page.path}: shared shell interactions must load statically`);

    const primary = region(header, '<div class="nav-list" id="primary-nav-list">', '</div>');
    const primaryLinks = links(primary);
    assert.deepEqual(primaryLinks.map((link) => link.label), expectedLabels, `${page.path}: primary labels differ`);
    assert.deepEqual(primaryLinks.map((link) => link.href), expectedHrefs, `${page.path}: primary destinations differ`);
    assert.equal((primary.match(/aria-current=/g) || []).length, page.active ? 1 : 0, `${page.path}: active state differs`);
    assert.doesNotMatch(primary, />\s*(?:CV|CTI|HexStrike|Offensive|PT Tools|Validation|GitHub|Medium)(?:\s*↗)?\s*</i, `${page.path}: obsolete menu item remains`);

    assert.match(footer, /aria-label="Footer navigation"/);
    assert.match(footer, /aria-label="Site information"/);
    assert.match(footer, /href="\/privacy\.html">Privacy \/ Data Handling</);
    assert.match(footer, /href="\/about\.html#contact">Contact</);
    assert.match(footer, /href="https:\/\/github\.com\/anpa1200"/);
    assert.equal(footer.includes('data-back-to-top'), page.back_to_top, `${page.path}: back-to-top policy differs`);
  }
});

test('runtime JavaScript enhances but does not reconstruct the standalone shell', () => {
  const theme = readFileSync(join(ROOT, 'assets', 'site-theme.js'), 'utf8');
  for (const obsolete of ['normalizeHeader', 'normalizeFooter', 'addEcosystemGateway', 'navItems', 'replaceChildren']) {
    assert.doesNotMatch(theme, new RegExp(obsolete), `site-theme.js must not contain ${obsolete}`);
  }
  assert.match(theme, /details\.nav-links\[data-mobile-navigation\]/);
  assert.match(theme, /event\.key !== 'Escape'/);
  assert.match(theme, /summary\.focus\(\)/);
  assert.match(theme, /!links\.contains\(event\.target\)/);
});

test('Docusaurus and Threat Matrix retain native shells with explicit ecosystem routes', () => {
  const ecosystem = readFileSync(join(ROOT, 'assets', 'docusaurus-ecosystem.js'), 'utf8');
  assert.doesNotMatch(ecosystem, /addNavigation|data-ecosystem-nav|insertBefore\(link/);

  for (const path of ['adversarygraph-docs/index.html', 'ITDR/index.html']) {
    const html = readFileSync(join(ROOT, path), 'utf8');
    assert.equal((html.match(/<nav\b[^>]*class="[^"]*\bnavbar\b[^"]*"/g) || []).length, 1, `${path}: competing Docusaurus navbar`);
    assert.match(html, /href="https:\/\/1200km\.com\/"[^>]*>(?:Main|Main Page|1200km Research)</, `${path}: main-site route is missing`);
    assert.match(html, /docusaurus-ecosystem\.js\?v=20260721-shell/);
  }

  const workspace = readFileSync(join(ROOT, 'threat-matrix', 'index.html'), 'utf8');
  assert.doesNotMatch(workspace, /class="site-header"/, 'application workspace must not receive a competing global header');
  assert.match(workspace, /<noscript>[\s\S]*?href="https:\/\/1200km\.com\/adversarygraph\/"/);
  assert.match(workspace, /class="ag-web-project-intro[\s\S]*?href="https:\/\/1200km\.com\/adversarygraph\/"/);
});
