#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const failures = [];
const skipped = new Set(['.git', 'node_modules', 'pagefind']);
const forbiddenNames = [/^\.env$/i, /^\.env\.(?:local|production|development|test)$/i, /\.(?:pem|key|p12|pfx)$/i, /(?:^|\.)id_(?:rsa|ed25519)$/i, /~$/, /\.bak$/i];
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.md', '.yml', '.yaml']);
const secretPatterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[opusr]_[A-Za-z0-9_]{30,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
];
const israeliMobile = /(?:\+?972[\s().-]*(?:0[\s().-]*)?|\b0)5\d(?:[\s().-]*\d){7}\b/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

for (const file of walk(site)) {
  const rel = relative(site, file);
  if (forbiddenNames.some((pattern) => pattern.test(basename(file)))) failures.push(`${rel}: forbidden private or temporary filename`);
  if (!textExtensions.has(extname(file).toLowerCase()) || statSync(file).size > 15_000_000) continue;
  const text = readFileSync(file, 'utf8');
  for (const [label, pattern] of secretPatterns) if (pattern.test(text)) failures.push(`${rel}: possible ${label}`);
  if (extname(file).toLowerCase() === '.html' && (israeliMobile.test(text) || /href=["']tel:/i.test(text))) {
    failures.push(`${rel}: public HTML contains a phone number or telephone link`);
  }
  if (extname(file).toLowerCase() === '.json') {
    try { JSON.parse(text); } catch (error) { failures.push(`${rel}: invalid JSON (${error.message})`); }
  }
  if (extname(file).toLowerCase() === '.html') {
    for (const match of text.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(match[1]); } catch (error) { failures.push(`${rel}: invalid JSON-LD (${error.message})`); }
    }
  }
}

for (const required of ['index.html', 'privacy.html', 'robots.txt', 'sitemap.xml', 'feed.xml']) {
  if (!existsSync(join(site, required))) failures.push(`Missing deployable ${required}`);
}
for (const xmlName of ['sitemap.xml', 'sitemap-all.xml', 'feed.xml']) {
  const path = join(site, xmlName);
  if (!existsSync(path)) continue;
  const xml = readFileSync(path, 'utf8');
  if (!/^<\?xml\b/.test(xml) || !/<(?:urlset|rss)\b/.test(xml)) failures.push(`${xmlName}: malformed XML envelope`);
}

if (failures.length) {
  console.error(`Deployable hygiene failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Deployable hygiene passed: no forbidden files, known secret forms, phone-bearing HTML, or malformed machine-readable files found.');
