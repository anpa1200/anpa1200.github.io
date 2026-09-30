#!/usr/bin/env node
// Verifies governed article lifecycle notices in the deployable build.
// The notices are inserted into the pinned archive source before the
// Docusaurus build (scripts/prepare-article-archive.mjs), so React renders
// them inside the article body under the H1. This step checks that every
// governed article carries exactly the notice the deployable catalogue
// expects, and keeps the code-block stylesheet on governed pages.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localFileForUrl } from './search-index-lib.mjs';
import { ARTICLE_BODY_MARKER, LIFECYCLE_MESSAGES, lifecycleDocsLink, lifecycleNoticeProblem } from './article-lifecycle-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = resolve(siteIndex >= 0 ? args[siteIndex + 1] || '' : ROOT);
const catalogPath = join(siteRoot, 'data', 'content-catalog.json');

if (!existsSync(catalogPath)) throw new Error(`Missing deployable content catalogue: ${catalogPath}`);
if (!existsSync(join(siteRoot, 'assets', 'content-governance.css'))) throw new Error('Missing lifecycle stylesheet in deployable output.');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (catalog.scope !== 'deployable-domain-catalog') throw new Error('Lifecycle notices require the complete deployable-domain catalogue.');

const failures = [];
let verified = 0;
const routes = {};
for (const item of catalog.items || []) {
  if (!/^https:\/\/1200km\.com\/articles\/read\/\d{4}\//.test(item.canonical_url)) continue;
  const path = localFileForUrl(siteRoot, item.canonical_url);
  if (!path) throw new Error(`${item.id}: article lifecycle page is missing from deployable output.`);
  let html = await readFile(path, 'utf8');
  if (!html.includes(ARTICLE_BODY_MARKER)) throw new Error(`${item.id}: Docusaurus article body marker is missing.`);
  const problem = lifecycleNoticeProblem(html, item.lifecycle);
  if (problem) {
    failures.push(`${item.canonical_url}: ${problem}`);
    continue;
  }
  const message = LIFECYCLE_MESSAGES[item.lifecycle];
  if (!message) continue;
  if (!html.includes('/assets/content-governance.css')) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/content-governance.css">\n</head>');
    await writeFile(path, html);
  }
  routes[new URL(item.canonical_url).pathname] = {
    lifecycle: item.lifecycle,
    label: message.label,
    text: message.text,
    docsLink: lifecycleDocsLink(item.lifecycle, item.title),
  };
  verified += 1;
}

if (failures.length) {
  console.error(`Article lifecycle verification failed (${failures.length}):\n- ${failures.slice(0, 40).join('\n- ')}`);
  process.exit(1);
}
await writeFile(join(siteRoot, 'data', 'article-lifecycle.json'), `${JSON.stringify({ routes }, null, 2)}\n`);
console.log(`Verified in-article lifecycle notices on ${verified} governed article page(s).`);
