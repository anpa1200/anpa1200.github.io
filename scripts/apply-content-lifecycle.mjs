#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localFileForUrl } from './search-index-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = resolve(siteIndex >= 0 ? args[siteIndex + 1] || '' : ROOT);
const catalogPath = join(siteRoot, 'data', 'content-catalog.json');

if (!existsSync(catalogPath)) throw new Error(`Missing deployable content catalogue: ${catalogPath}`);
if (!existsSync(join(siteRoot, 'assets', 'content-governance.css'))) throw new Error('Missing lifecycle banner stylesheet in deployable output.');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (catalog.scope !== 'deployable-domain-catalog') throw new Error('Lifecycle banners require the complete deployable-domain catalogue.');

const messages = Object.freeze({
  historical: {
    label: 'Historical version',
    text: 'This article documents an earlier product version or a time-bound state. It is retained for provenance and is not current product guidance.',
  },
  preserved: {
    label: 'Preserved article',
    text: 'This older publication is retained for research history. Current technical applicability has not been asserted; validate versions, commands, and assumptions before use.',
  },
  'currentness-unknown': {
    label: 'Currentness not reverified',
    text: 'This published article remains available in the archive, but its technical currentness has not yet been reverified. Validate it against current authoritative sources before use.',
  },
  'stable-reference': {
    label: 'Stable reference',
    text: 'This article is retained as a durable reference. Validate environment-specific commands, versions, and assumptions before operational use.',
  },
});

let updated = 0;
for (const item of catalog.items || []) {
  if (!/^https:\/\/1200km\.com\/articles\/read\/\d{4}\//.test(item.canonical_url)) continue;
  const message = messages[item.lifecycle];
  if (!message) continue;
  const path = localFileForUrl(siteRoot, item.canonical_url);
  if (!path) throw new Error(`${item.id}: article lifecycle page is missing from deployable output.`);
  let html = await readFile(path, 'utf8');
  if (html.includes('data-content-lifecycle=')) throw new Error(`${item.id}: lifecycle banner is already present before the governed build step.`);
  const marker = '<div class="theme-doc-markdown markdown">';
  if (!html.includes(marker)) throw new Error(`${item.id}: Docusaurus article body marker is missing.`);
  if (!html.includes('/assets/content-governance.css')) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/content-governance.css">\n</head>');
  }
  const docsLink = item.lifecycle === 'historical' && /adversarygraph/i.test(item.title)
    ? ' <a href="/adversarygraph-docs/">Open current AdversaryGraph documentation</a>.'
    : '';
  const banner = `<aside class="content-lifecycle-banner" data-content-lifecycle="${item.lifecycle}" aria-label="Content lifecycle"><strong>${message.label}</strong><p>${message.text}${docsLink}</p></aside>`;
  html = html.replace(marker, `${marker}${banner}`);
  await writeFile(path, html);
  updated += 1;
}

console.log(`Applied static lifecycle banners to ${updated} governed article page(s).`);
