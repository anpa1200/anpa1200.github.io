#!/usr/bin/env node
// Content-hash versions for shared /assets/*.css|js in a staged release.
//
// References that already carry an explicit version (`/assets/x.css?v=...`)
// are rewritten to `?v=h-<10 hex sha256>`. The Worker marks only that form as
// immutable, so a changed file always gets a new URL and returning visitors
// never keep a stale stylesheet or script. Unversioned references (for example
// attribute selectors such as `[src*="/assets/site-search.js"]`) are left alone.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const index = args.indexOf('--site');
if (index < 0 || !args[index + 1]) throw Error('Pass --site with a staged release directory');
const site = resolve(args[index + 1]);
if (site === root) throw Error('Do not fingerprint the authoring checkout');
const assetDir = join(site, 'assets');
if (!existsSync(assetDir)) throw Error(`Missing ${assetDir}`);

const shared = readdirSync(assetDir).filter((name) => /\.(?:css|js|mjs)$/i.test(name));
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Only a literal version token is replaced. A computed version such as
// `?v=${searchAssetVersion}` inside a template literal is code, not a token,
// and must never be touched (the minified script would otherwise break).
const reference = new RegExp(`((?:https://1200km\\.com)?/assets/(${shared.map(escape).join('|')}))\\?v=[A-Za-z0-9._-]+(?![A-Za-z0-9._{$-])`, 'g');
const hash = (name) => `h-${createHash('sha256').update(readFileSync(join(assetDir, name))).digest('hex').slice(0, 10)}`;
const rewrite = (text, versions) => text.replace(reference, (_, path, name) => `${path}?v=${versions.get(name)}`);

// Shared assets may reference each other (the ecosystem loader injects the
// sidebar and search assets). Iterate until every version is a fixed point.
let versions = new Map(shared.map((name) => [name, hash(name)]));
for (let pass = 0; ; pass += 1) {
  if (pass > 8) throw Error('Shared asset references do not converge; check for a reference cycle');
  for (const name of shared) {
    const file = join(assetDir, name);
    const before = readFileSync(file, 'utf8');
    const after = rewrite(before, versions);
    if (after !== before) writeFileSync(file, after);
  }
  const next = new Map(shared.map((name) => [name, hash(name)]));
  if ([...next].every(([name, value]) => versions.get(name) === value)) break;
  versions = next;
}

function* files(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(?:html|xml|js|mjs|css|json|md|txt)$/i.test(entry.name) && !path.startsWith(`${assetDir}/`)) yield path;
  }
}

let rewritten = 0;
let documents = 0;
for (const path of files(site)) {
  const before = readFileSync(path, 'utf8');
  if (!before.includes('/assets/')) continue;
  const after = rewrite(before, versions);
  if (after !== before) {
    writeFileSync(path, after);
    documents += 1;
    rewritten += (before.match(reference) || []).length;
  }
}
writeFileSync(join(site, 'data', 'asset-fingerprints.json'), `${JSON.stringify(Object.fromEntries([...versions].sort()), null, 2)}\n`);
console.log(`Fingerprinted ${versions.size} shared assets; rewrote ${rewritten} versioned reference(s) in ${documents} file(s) under ${relative(root, site) || site}.`);
