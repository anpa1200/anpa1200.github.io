#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const requiredPages = [
  { file: 'index.html', url: 'https://1200km.com/', schema: ['Person', 'WebSite'] },
  { file: 'adversarygraph/index.html', url: 'https://1200km.com/adversarygraph/', schema: ['SoftwareApplication'] },
  { file: 'projects.html', url: 'https://1200km.com/projects.html', schema: ['CollectionPage'] },
  { file: 'cti.html', url: 'https://1200km.com/cti.html', schema: ['CollectionPage'] },
  { file: 'guides.html', url: 'https://1200km.com/guides.html', schema: ['CollectionPage'] },
  { file: 'labs.html', url: 'https://1200km.com/labs.html', schema: ['CollectionPage'] },
  { file: 'articles/index.html', url: 'https://1200km.com/articles/', schema: ['CollectionPage'] },
  { file: 'articles/adversarygraph-v2-self-hosted-ai-cti-platform.html', url: 'https://1200km.com/articles/adversarygraph-v2-self-hosted-ai-cti-platform.html', schema: ['TechArticle'] },
  { file: 'articles/adversarygraph-from-log-to-report-ioc-investigation.html', url: 'https://1200km.com/articles/adversarygraph-from-log-to-report-ioc-investigation.html', schema: ['TechArticle'] },
  { file: 'newest-detection-engineering-techniques/index.html', url: 'https://1200km.com/newest-detection-engineering-techniques/', schema: ['TechArticle'] },
  { file: 'embedded-systems-hardware-firmware/index.html', url: 'https://1200km.com/embedded-systems-hardware-firmware/', schema: ['TechArticle'] },
  { file: 'about.html', url: 'https://1200km.com/about.html', schema: ['ProfilePage'] },
  { file: 'cv.html', url: 'https://1200km.com/cv.html', schema: ['ProfilePage'] },
  { file: 'adversarygraph/use-cases.html', url: 'https://1200km.com/adversarygraph/use-cases.html', schema: ['CollectionPage'] },
];

const failures = [];

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function has(text, needle) {
  return text.includes(needle);
}

function hasMetaName(html, name) {
  return new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i').test(html);
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) blocks.push(match[1].trim());
  return blocks;
}

function schemaTypes(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (typeof value['@type'] === 'string') out.push(value['@type']);
  if (Array.isArray(value['@type'])) out.push(...value['@type']);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => schemaTypes(item, out));
    else schemaTypes(child, out);
  }
  return out;
}

function checkPage(page) {
  if (!existsSync(join(ROOT, page.file))) {
    failures.push(`${page.file}: file missing`);
    return;
  }
  const html = read(page.file);
  if (!hasMetaName(html, 'description')) failures.push(`${page.file}: missing meta description`);
  if (!has(html, `<link rel="canonical" href="${page.url}"`)) failures.push(`${page.file}: canonical does not match ${page.url}`);
  if (!has(html, `<meta property="og:url" content="${page.url}"`)) failures.push(`${page.file}: og:url does not match ${page.url}`);
  if (!has(html, '<meta property="og:site_name"')) failures.push(`${page.file}: missing og:site_name`);
  if (!has(html, 'rel="alternate" type="application/rss+xml"')) failures.push(`${page.file}: missing RSS discovery link`);

  const types = [];
  const blocks = jsonLdBlocks(html);
  if (!blocks.length) failures.push(`${page.file}: missing JSON-LD`);
  for (const block of blocks) {
    try {
      types.push(...schemaTypes(JSON.parse(block)));
    } catch (error) {
      failures.push(`${page.file}: invalid JSON-LD (${error.message})`);
    }
  }
  for (const type of page.schema) {
    if (!types.includes(type)) failures.push(`${page.file}: missing JSON-LD type ${type}`);
  }
}

for (const page of requiredPages) checkPage(page);

const robots = read('robots.txt');
if (!has(robots, 'Sitemap: https://1200km.com/sitemap.xml')) failures.push('robots.txt: missing sitemap index');
if (!has(robots, 'Sitemap: https://1200km.com/sitemap-all.xml')) failures.push('robots.txt: missing full generated sitemap');
if (!has(robots, 'Disallow: /cover-letter.html')) failures.push('robots.txt: cover letter should remain disallowed');
if (!has(robots, 'Content-Signal: search=yes, ai-input=yes, ai-train=no')) failures.push('robots.txt: missing Content-Signal policy');

const sitemapIndex = read('sitemap.xml');
if (!has(sitemapIndex, '<loc>https://1200km.com/sitemap-pages.xml</loc>')) failures.push('sitemap.xml: missing main page sitemap');
if (!has(sitemapIndex, '<loc>https://1200km.com/sitemap-all.xml</loc>')) failures.push('sitemap.xml: missing full generated sitemap');
if (!has(sitemapIndex, '<loc>https://1200km.com/threat-matrix/entity-sitemap.xml</loc>')) failures.push('sitemap.xml: missing Threat Matrix entity sitemap');

const sitemapPages = read('sitemap-pages.xml');
for (const page of requiredPages) {
  if (!has(sitemapPages, `<loc>${page.url}</loc>`)) failures.push(`sitemap-pages.xml: missing ${page.url}`);
}
if (has(sitemapPages, 'cover-letter.html')) failures.push('sitemap-pages.xml: noindex cover-letter.html should not be listed');

const feed = read('feed.xml');
if (!has(feed, '<rss version="2.0"')) failures.push('feed.xml: missing RSS root');
if (!has(feed, '<atom:link href="https://1200km.com/feed.xml" rel="self" type="application/rss+xml" />')) failures.push('feed.xml: missing self atom:link');
if (!has(feed, '<item>')) failures.push('feed.xml: missing feed items');

const sitemapAll = read('sitemap-all.xml');
const sitemapAllUrlCount = (sitemapAll.match(/<loc>/g) || []).length;
if (!has(sitemapAll, '<loc>https://1200km.com/threat-matrix/techniques/T1053.005/</loc>')) failures.push('sitemap-all.xml: missing Threat Matrix canonical technique page');
if (!has(sitemapAll, '<loc>https://1200km.com/adversarygraph-docs/</loc>')) failures.push('sitemap-all.xml: missing AdversaryGraph docs canonical page');
if (!has(sitemapAll, '<loc>https://1200km.com/ITDR/</loc>')) failures.push('sitemap-all.xml: missing ITDR canonical page');
if (has(sitemapAll, '404.html')) failures.push('sitemap-all.xml: should not list 404 pages');
if (has(sitemapAll, 'cover-letter.html')) failures.push('sitemap-all.xml: should not list noindex cover letter');
if (sitemapAllUrlCount < 1000) failures.push(`sitemap-all.xml: expected broad coverage, found only ${sitemapAllUrlCount} URLs`);

if (failures.length) {
  console.error('SEO check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('SEO check passed.');
