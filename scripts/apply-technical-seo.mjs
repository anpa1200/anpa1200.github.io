#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { applyTechnicalSeo } from './technical-seo-lib.mjs';
const args = process.argv.slice(2);
const root = resolve(args.includes('--site') ? args[args.indexOf('--site') + 1] : new URL('..', import.meta.url).pathname);
const check = args.includes('--check');
const skipped = new Set(['.git', 'node_modules', 'pagefind', '.cache', '.build']);
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => skipped.has(e.name) || (dir === root && e.name === 'reports') ? [] : e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []); }
let changes = 0;
for (const file of walk(root)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const url = 'https://1200km.com/' + rel.replace(/(?:^|\/)index\.html$/, match => match.startsWith('/') ? '/' : '');
  const before = readFileSync(file, 'utf8');
  const after = applyTechnicalSeo(before, url);
  if (before === after) continue;
  if (check) throw Error(`Technical SEO source is stale: ${rel}`);
  writeFileSync(file, after); changes++;
}
console.log(`${check ? 'Verified' : 'Updated'} technical SEO metadata; ${changes} changed HTML files. Body prose outside authorized headings/intros/links is untouched.`);
