#!/usr/bin/env node
/**
 * Internal link & asset checker for the 1200km.com static site.
 *
 * Checks (fatal):
 *   - relative links/assets resolve to a real file on disk
 *   - in-page anchors (#id) point to an element that exists in the same file
 *   - absolute https://1200km.com/<file>.{html,pdf,png,xml,txt} map to a real local file
 *     unless the path belongs to a separately published 1200km sibling site
 *
 * Reports (non-fatal warnings):
 *   - leftover anpa1200.github.io references
 *   - external URLs (only probed with --external; bot-blocks 403/405/429 are ignored)
 *
 * Usage:
 *   node scripts/check-links.mjs            # internal checks only (fast, offline)
 *   node scripts/check-links.mjs --external # additionally probe external URLs (network)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkExternal = process.argv.includes('--external');

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const LIVE_1200KM_ROOTS = [
  '/CTI_as_a_Code/',
  '/cti-analyst-field-manual/',
  '/israel-government-threat-actors-cti/',
  '/operation-desert-hydra/',
];

function walkHtml(dir = ROOT) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(relative(ROOT, path));
  }
  return files.sort();
}

const htmlFiles = walkHtml();

const hrefRe = /(?:href|src)\s*=\s*"([^"]+)"/gi;
const idRe = /\sid\s*=\s*"([^"]+)"/gi;

const results = { broken: [], missingAnchor: [], oldDomain: [], external: [], ok: 0 };
const fileText = {};
const idsByFile = {};

for (const f of htmlFiles) {
  const t = readFileSync(join(ROOT, f), 'utf8');
  fileText[f] = t;
  const ids = new Set();
  let m;
  while ((m = idRe.exec(t))) ids.add(m[1]);
  idsByFile[f] = ids;
}

function localPathExists(rel) {
  const clean = rel.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return true;
  const p = normalize(join(ROOT, decodeURIComponent(clean.replace(/^\//, ''))));
  if (!p.startsWith(ROOT)) return false;
  if (!existsSync(p)) return false;
  if (statSync(p).isDirectory()) return existsSync(join(p, 'index.html'));
  return true;
}

function resolveLocalRef(fromFile, url) {
  const clean = url.split('#')[0].split('?')[0];
  if (clean.startsWith('/')) return clean;
  return normalize(join(dirname(fromFile), clean));
}

function isLive1200kmSiblingPath(pathname) {
  return LIVE_1200KM_ROOTS.some((root) => pathname === root || pathname.startsWith(root));
}

const externalToProbe = new Set();

for (const f of htmlFiles) {
  let m;
  hrefRe.lastIndex = 0;
  while ((m = hrefRe.exec(fileText[f]))) {
    const url = m[1].trim();
    if (!url) continue;
    if (/^(mailto:|tel:|data:|javascript:)/i.test(url)) continue;
    if (/anpa1200\.github\.io/i.test(url)) results.oldDomain.push(`${f}: ${url}`);

    if (url.startsWith('#')) {
      const id = url.slice(1);
      if (id && !idsByFile[f].has(id)) results.missingAnchor.push(`${f}: ${url}`);
      else results.ok++;
      continue;
    }

    if (/^https?:\/\//i.test(url)) {
      let u;
      try { u = new URL(url); } catch { continue; }
      if (u.hostname === '1200km.com') {
        if (isLive1200kmSiblingPath(u.pathname)) externalToProbe.add(url);
        else if (localPathExists(u.pathname)) results.ok++;
        else externalToProbe.add(url);
      } else {
        externalToProbe.add(url);
      }
      continue;
    }

    if (url.startsWith('//')) { externalToProbe.add('https:' + url); continue; }
    if (url.startsWith('/') && isLive1200kmSiblingPath(url.split('#')[0].split('?')[0])) {
      externalToProbe.add('https://1200km.com' + url);
      continue;
    }

    const resolved = resolveLocalRef(f, url);
    if (!localPathExists(resolved)) results.broken.push(`${f}: ${url}`);
    else results.ok++;
  }
}

if (checkExternal) {
  const ignore = new Set([403, 405, 429]); // common bot-block / method-not-allowed responses
  for (const url of externalToProbe) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (r.status >= 400 && !ignore.has(r.status)) results.external.push(`[${r.status}] ${url}`);
    } catch (e) {
      results.external.push(`[ERR ${e.name}] ${url}`);
    }
  }
}

const line = '\u2500'.repeat(64);
console.log(line);
console.log('Link check \u2014 ' + ROOT);
console.log(line);
console.log(`HTML files scanned  : ${htmlFiles.length}`);
console.log(`Internal links OK   : ${results.ok}`);
console.log(`External URLs found : ${externalToProbe.size}` + (checkExternal ? ' (probed)' : ' (not probed; pass --external)'));
console.log('');

function block(title, arr) {
  console.log(`${title}: ${arr.length}`);
  for (const x of arr) console.log('  - ' + x);
  if (arr.length) console.log('');
}

block('BROKEN internal links / missing files', results.broken);
block('MISSING anchors (#id not found in page)', results.missingAnchor);
block('OLD DOMAIN references (anpa1200.github.io)', results.oldDomain);
if (checkExternal) block('EXTERNAL warnings (non-2xx, 403/405/429 ignored as bot-blocks)', results.external);

const fatal = results.broken.length + results.missingAnchor.length;
console.log(line);
console.log(fatal === 0 ? 'PASS \u2014 no broken internal links or anchors.' : `FAIL \u2014 ${fatal} internal issue(s) found.`);
console.log(line);
process.exit(fatal === 0 ? 0 : 1);
