import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const manifest = JSON.parse(await readFile(new URL('../cloudflare/crosslink-rewrites.json', import.meta.url), 'utf8'));
assert.equal(manifest.schema_version, 1);
assert.ok(Array.isArray(manifest.rewrites) && manifest.rewrites.length > 0);
const seen = new Set();
export const crosslinkRewrites = manifest.rewrites
  .map(({ from, to }) => {
    assert.equal(typeof from, 'string');
    assert.equal(typeof to, 'string');
    assert.ok(from && to && from !== to);
    assert.ok(!seen.has(from), `Duplicate crosslink source: ${from}`);
    seen.add(from);
    const absoluteFrom = new URL(from, 'https://1200km.com');
    const absoluteTo = new URL(to, 'https://1200km.com');
    assert.equal(absoluteFrom.origin, 'https://1200km.com');
    assert.equal(absoluteTo.origin, 'https://1200km.com');
    assert.ok(!absoluteFrom.search && !absoluteFrom.hash && !absoluteTo.search && !absoluteTo.hash);
    return { from, to };
  })
  .sort((a, b) => b.from.length - a.from.length);
export const ctiSourceRewrites = manifest.source_rewrites.CTI_as_a_Code
  .sort((a, b) => b.from.length - a.from.length);
export const archiveSourceRewrites = manifest.source_rewrites.MediumArticleArchive
  .sort((a, b) => b.from.length - a.from.length);

export function rewriteCrosslinks(input, rewrites = crosslinkRewrites) {
  let output = input;
  const counts = {};
  for (const { from, to } of rewrites) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A stale route must be a complete URL token on both sides. In particular,
    // /investigations/... inside a GitHub blob URL belongs to that external
    // URL and must not be replaced with our site's absolute route.
    const pattern = new RegExp(`(?<![A-Za-z0-9_./:%~-])${escaped}(?![A-Za-z0-9_./%~-])`, 'g');
    const occurrences = [...output.matchAll(pattern)].length;
    if (!occurrences) continue;
    output = output.replace(pattern, to);
    counts[from] = occurrences;
  }
  return { output, counts };
}

export async function rewriteCrosslinksInDirectory(directory, extensions, rewrites = crosslinkRewrites) {
  if (!existsSync(directory)) return { files: 0, replacements: 0, counts: {} };
  const allowed = new Set(extensions);
  const result = { files: 0, replacements: 0, counts: {} };
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'build'].includes(entry.name)) continue;
      const child = join(path, entry.name);
      if (entry.isDirectory()) { await walk(child); continue; }
      if (!entry.isFile() || ![...allowed].some((extension) => entry.name.endsWith(extension))) continue;
      const before = await readFile(child, 'utf8');
      const { output, counts } = rewriteCrosslinks(before, rewrites);
      if (output === before) continue;
      await writeFile(child, output);
      result.files++;
      for (const [from, count] of Object.entries(counts)) {
        result.counts[from] = (result.counts[from] || 0) + count;
        result.replacements += count;
      }
    }
  }
  await walk(directory);
  return result;
}

export function missingCrosslinkTargets(site) {
  const missing = [];
  for (const { to } of crosslinkRewrites) {
    const pathname = new URL(to, 'https://1200km.com').pathname;
    const relative = decodeURIComponent(pathname).replace(/^\//, '');
    const candidates = pathname.endsWith('/')
      ? [join(site, relative, 'index.html')]
      : [join(site, relative), join(site, relative + '.html')];
    if (!candidates.some((candidate) => existsSync(candidate))) missing.push(to);
  }
  return [...new Set(missing)];
}
