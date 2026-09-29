// Reproducible source overlay for the pinned, separately built archive.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sameOriginPlatformAssets } from './companion-sites-lib.mjs';
import { archiveSourceRewrites, rewriteCrosslinksInDirectory } from './canonical-crosslinks.mjs';
const args = process.argv.slice(2),
  i = args.indexOf('--archive');
if (i < 0 || !args[i + 1]) throw Error('--archive source checkout required');
const archive = resolve(args[i + 1]);
const path = resolve(archive, 'docusaurus.config.js');
let source = sameOriginPlatformAssets(readFileSync(path, 'utf8'));
if (/\btrailingSlash:\s*true\b/.test(source)) {
  writeFileSync(path, source);
  console.log('Archive slash policy already explicit');
} else {
  if (/\btrailingSlash\s*:/.test(source)) throw Error('Archive has a conflicting slash policy; review the source before updating');
  if (!source.includes('const config = {')) throw Error('Unknown Docusaurus config shape');
  source = source.replace('const config = {', 'const config = {\n  trailingSlash: true, // Match 1200km sitemap, canonical links, and directory hosting.');
  writeFileSync(path, source);
  console.log('Prepared archive source with trailingSlash: true');
}
let replacements = 0;
for (const directory of ['docs', 'src', 'static']) {
  const path = resolve(archive, directory);
  const extensions = ['.md', '.mdx', '.js', '.jsx', '.ts', '.tsx', '.html', '.json'];
  replacements += (await rewriteCrosslinksInDirectory(path, extensions, archiveSourceRewrites)).replacements;
  replacements += (await rewriteCrosslinksInDirectory(path, extensions)).replacements;
}
console.log(`Normalized ${replacements} pinned archive crosslink(s) before Docusaurus hydration build.`);
