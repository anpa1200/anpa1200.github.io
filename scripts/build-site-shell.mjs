#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const check = args.includes('--check');
const shell = loadSiteShell(ROOT);
const stale = [];

for (const page of shell.pages) {
  const path = resolve(site, page.path);
  if (!path.startsWith(`${site}/`) || !existsSync(path)) {
    stale.push(`${page.path}: file is missing`);
    continue;
  }
  const current = readFileSync(path, 'utf8');
  const generated = applySiteShell(current, shell, page);
  if (current === generated) continue;
  if (check) stale.push(`${page.path}: generated shell is stale`);
  else writeFileSync(path, generated);
}

if (stale.length) {
  throw new Error(`Site shell validation failed:\n- ${stale.join('\n- ')}`);
}

console.log(`${check ? 'Validated' : 'Generated'} canonical standalone shell for ${shell.pages.length} pages.`);
