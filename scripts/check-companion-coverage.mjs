#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { artifactFiles } from './check-static-artifact.mjs';
import { localAsset } from './hosting-parity-lib.mjs';
import { validateCompanions } from './companion-sites-lib.mjs';
import { RETIRED_VENDOR_REPORTS, isEvidenceDocument } from '../cloudflare/evidence-documents.js';

const args = process.argv.slice(2);
assert.ok(args.includes('--site'), '--site required');
const site = resolve(args[args.indexOf('--site') + 1]);
const paths = new Set((await artifactFiles(site)).map((file) => relative(site, file).replaceAll('\\', '/')));
const manifest = validateCompanions(JSON.parse(await readFile(new URL('../cloudflare/companion-sites.json', import.meta.url), 'utf8')));
const builds = JSON.parse(await readFile(join(site, 'data/companion-builds.json'), 'utf8'));
const failures = [];
let sitemapUrls = 0, assetReferences = 0;
for (const path of RETIRED_VENDOR_REPORTS.keys()) {
  assert.ok(!paths.has(path.slice(1)), `Retired vendor capture must not be staged: ${path}`);
}
for (const entry of manifest) {
  assert.ok(builds.sites.some((built) => built.mount === entry.mount && built.commit === entry.commit && built.files > 0), `Missing pinned build identity: ${entry.mount}`);
  if (!paths.has(`${entry.mount}/index.html`)) failures.push(`Missing companion root ${entry.mount}`);
}
for (const path of paths) {
  if (/^(?:sitemap(?:-all)?\.xml)$/.test(path) || manifest.some((entry) => path === `${entry.mount}/sitemap.xml`)) {
    const xml = await readFile(join(site, path), 'utf8');
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = new URL(loc.replaceAll('&amp;', '&'));
      if (url.origin !== 'https://1200km.com') continue;
      sitemapUrls++;
      if (localAsset(url.pathname, paths).status === 404) failures.push(`${path}: unstaged URL ${url.pathname}`);
    }
  }
  if (!path.endsWith('.html') || isEvidenceDocument(path) || !manifest.some((entry) => path.startsWith(`${entry.mount}/`))) continue;
  const html = await readFile(join(site, path), 'utf8');
  if (/^CTI_as_a_Code\/intake-(?:form|proactive|fullcycle)\/index\.html$/.test(path)) {
    const textareas = [...html.matchAll(/<textarea\b[^>]*>/gi)];
    if (!textareas.length) failures.push(`${path}: no intake textareas found`);
    for (const [tag] of textareas) {
      if (!/\baria-label=["'][^"']+["']|\baria-labelledby=["'][^"']+["']/i.test(tag)) {
        failures.push(`${path}: intake textarea has no accessible name`);
      }
    }
  }
  for (const [tag] of html.matchAll(/<(?:script|link|img|source)\b[^>]*>/gi)) {
    if (/^<link/i.test(tag) && !/\brel=["'](?:stylesheet|preload|modulepreload|icon)["']/i.test(tag)) continue;
    const value = tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
    if (!value || /^(?:data:|blob:)/.test(value)) continue;
    const url = new URL(value.replaceAll('&amp;', '&'), `https://1200km.com/${path}`);
    if (url.origin !== 'https://1200km.com') continue;
    assetReferences++;
    if (localAsset(url.pathname, paths).status !== 200) failures.push(`${path}: missing resource ${url.pathname}`);
  }
}
console.log(JSON.stringify({ companion_sites: manifest.length, sitemap_urls_checked: sitemapUrls, asset_references_checked: assetReferences, failures }, null, 2));
assert.equal(failures.length, 0, 'Full ecosystem must be contained in the static artifact');
