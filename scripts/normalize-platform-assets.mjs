#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { sameOriginPlatformAssets } from './companion-sites-lib.mjs';
import { parse, serialize } from 'parse5';
import { isEvidenceDocument } from '../cloudflare/evidence-documents.js';
const companions = JSON.parse(await readFile(new URL('../cloudflare/companion-sites.json', import.meta.url), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('../seo/companion-metadata.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2), index = args.indexOf('--site');
assert.ok(index >= 0 && args[index + 1], '--site staging directory required');
const site = resolve(args[index + 1]);
assert.notEqual(site, resolve(import.meta.dirname, '..'), 'Do not rewrite the source checkout');
let changed = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'pagefind'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    const relativePath = path.slice(site.length + 1);
    if (isEvidenceDocument(relativePath)) continue;
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && /\.(?:js|css|html)$/.test(path)) {
      const before = await readFile(path, 'utf8');
      let after = sameOriginPlatformAssets(before);
      if (entry.name.endsWith('.html') && companions.some((companion) => relativePath.startsWith(`${companion.mount}/`))) {
        // Standard HTML parsing preserves the DOM while making valid unquoted
        // attributes readable by the existing release metadata transformations.
        const document = parse(after);
        const visit = (node) => {
          const title = metadata.titles[relativePath], description = metadata.descriptions[relativePath];
          if (node.tagName === 'title' && title) node.childNodes = [{ nodeName: '#text', value: title, parentNode: node }];
          if (node.tagName === 'meta') {
            const key = node.attrs.find((attr) => ['name', 'property'].includes(attr.name))?.value;
            const value = ['og:title', 'twitter:title'].includes(key) ? title : ['description', 'og:description', 'twitter:description'].includes(key) ? description : '';
            const content = node.attrs.find((attr) => attr.name === 'content');
            if (value && content) content.value = value;
          }
          for (const child of node.childNodes || []) visit(child);
        };
        visit(document);
        after = serialize(document);
      }
      if (after !== before) { await writeFile(path, after); changed++; }
    }
  }
}
await walk(site);
console.log(`Normalized same-origin platform assets in ${changed} staged files before validation.`);
