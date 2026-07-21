#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SITE_ORIGIN, normalizeSiteUrl, validatePage } from './search-index-lib.mjs';

const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
if (siteIndex < 0 || !args[siteIndex + 1]) throw new Error('Usage: inject-search-loader.mjs --site <staged-site>');
const site = resolve(args[siteIndex + 1]);
const loader = '<script src="/assets/site-search.js?v=20260721-5" defer></script>';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

let injected = 0;
for (const file of await walk(site)) {
  const relative = file.slice(site.length).replace(/\\/g, '/');
  let html = await readFile(file, 'utf8');
  if (relative === '/threat-matrix/index.html') continue;
  const pageUrl = normalizeSiteUrl(new URL(relative, SITE_ORIGIN).href);
  if (!pageUrl || !validatePage(pageUrl.href, html).indexable) continue;
  // Inject directly even when a shared theme/ecosystem loader is present. The
  // loader scripts detect this tag and stand down, while the versioned URL
  // prevents a previously cached shared loader from hiding a new search release.
  if (/site-search\.js/i.test(html)) continue;
  if (!/<\/head>/i.test(html)) continue;
  html = html.replace(/<\/head>/i, `  ${loader}\n</head>`);
  await writeFile(file, html);
  injected += 1;
}

console.log(`Injected the site-search loader into ${injected} staged HTML page(s).`);
