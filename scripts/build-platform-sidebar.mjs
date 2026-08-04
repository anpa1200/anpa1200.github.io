#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteShell } from './site-shell-lib.mjs';
import { applyPlatformSidebar, isSidebarEligible } from './platform-sidebar-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const index = args.indexOf('--site');
const siteRoot = resolve(index >= 0 && args[index + 1] ? args[index + 1] : ROOT);
const skipped = new Set(['.build', '.git', 'node_modules', 'pagefind']);

async function walk(directory = siteRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function pathnameFor(path) {
  const rel = relative(siteRoot, path).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

const shell = loadSiteShell(siteRoot);
let integrated = 0;
let excluded = 0;
for (const path of (await walk()).sort()) {
  const html = await readFile(path, 'utf8');
  if (!isSidebarEligible(html)) {
    excluded += 1;
    continue;
  }
  const transformed = applyPlatformSidebar(html, shell, { pathname: pathnameFor(path) });
  if (transformed !== html) await writeFile(path, transformed);
  integrated += 1;
}

console.log(`Integrated governed platform navigation into ${integrated} HTML page(s); excluded ${excluded} redirect/non-document page(s).`);
