#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://1200km.com';
const OUT = join(ROOT, 'sitemap-all.xml');
const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walk(dir = ROOT) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlFromPath(path) {
  const rel = relative(ROOT, path).replace(/\\/g, '/');
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.slice(0, -'index.html'.length)}`;
  return `${BASE}/${rel}`;
}

function canonicalFromHtml(html) {
  const match = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return match ? match[1] : null;
}

function shouldSkip(rel, html) {
  if (rel.includes('/404.html') || rel === '404.html') return true;
  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) return true;
  if (/<title[^>]*>\s*Page Not Found\b/i.test(html)) return true;
  return false;
}

const entries = new Map();

for (const path of walk()) {
  const rel = relative(ROOT, path).replace(/\\/g, '/');
  const html = readFileSync(path, 'utf8');
  if (shouldSkip(rel, html)) continue;

  const canonical = canonicalFromHtml(html) || urlFromPath(path);
  if (!canonical.startsWith(`${BASE}/`)) continue;
  if (canonical.includes('/404.html')) continue;

  const lastmod = statSync(path).mtime.toISOString().slice(0, 10);
  const existing = entries.get(canonical);
  if (!existing || existing.lastmod < lastmod) entries.set(canonical, { loc: canonical, lastmod });
}

const sorted = [...entries.values()].sort((a, b) => a.loc.localeCompare(b.loc));
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sorted.map((entry) => [
    '  <url>',
    `    <loc>${xmlEscape(entry.loc)}</loc>`,
    `    <lastmod>${entry.lastmod}</lastmod>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

writeFileSync(OUT, xml);
console.log(`Wrote ${relative(ROOT, OUT)} with ${sorted.length} URLs.`);
