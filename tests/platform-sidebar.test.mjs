import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteShell } from '../scripts/site-shell-lib.mjs';
import {
  applyPlatformSidebar,
  extractPageLinks,
  isSidebarEligible,
  renderPlatformSidebar,
} from '../scripts/platform-sidebar-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shell = loadSiteShell(ROOT);

const fixture = `<!doctype html><html lang="en"><head><title>Example</title></head><body><main>
  <h1>Example</h1><h2 id="first">First section</h2><p>Body</p>
  <h2 id="second">Second section</h2><h2 id="contents">Table of contents</h2>
</main></body></html>`;

test('page links are concise, bounded, and omit generic contents headings', () => {
  assert.deepEqual(extractPageLinks(fixture, 2), [
    { id: 'first', label: 'First section' },
    { id: 'second', label: 'Second section' },
  ]);
});

test('platform sidebar is static, searchable-content-neutral, and idempotent', () => {
  const first = applyPlatformSidebar(fixture, shell, { pathname: '/articles/example.html' });
  const second = applyPlatformSidebar(first, shell, { pathname: '/articles/example.html' });
  assert.equal(second, first);
  assert.equal((first.match(/id="platform-sidenav"/g) || []).length, 1);
  assert.match(first, /class="has-platform-sidenav" id="top"/);
  assert.match(first, /data-pagefind-ignore/);
  assert.match(first, /href="#first" data-section="first"/);
  assert.match(first, /href="\/articles\/" aria-current="location"/);
  assert.match(first, /platform-sidebar\.css\?v=20260804-1/);
  assert.match(first, /platform-sidebar\.js\?v=20260804-1/);
  assert.doesNotMatch(first, /<h2[^>]*>On this page<\/h2>/i);
});

test('redirect documents are not converted into navigable duplicate pages', () => {
  const redirect = '<html><head><title>Redirecting</title><meta http-equiv="refresh" content="0;url=/maintained/"></head><body></body></html>';
  assert.equal(isSidebarEligible(redirect), false);
  assert.equal(applyPlatformSidebar(redirect, shell, { pathname: '/legacy/' }), redirect);
});

test('governed rail contains every configured platform route', () => {
  const sidebar = renderPlatformSidebar(shell, { pathname: '/guides.html' });
  for (const section of shell.sidebar.sections) {
    for (const link of section.links) assert.match(sidebar, new RegExp(`href="${link.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  assert.match(sidebar, /href="\/guides\.html" aria-current="page"/);
});

test('shared Docusaurus bridge loads the same platform navigation assets', () => {
  const bridge = readFileSync(resolve(ROOT, 'assets/docusaurus-ecosystem.js'), 'utf8');
  assert.match(bridge, /loadPlatformSidebar/);
  assert.match(bridge, /platform-sidebar\.css\?v=20260804-1/);
  assert.match(bridge, /platform-sidebar\.js\?v=20260804-1/);
});
