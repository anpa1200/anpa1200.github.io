// Reproducible source overlay for the pinned, separately built archive.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const args = process.argv.slice(2),
  i = args.indexOf('--archive');
if (i < 0 || !args[i + 1]) throw Error('--archive source checkout required');
const path = resolve(args[i + 1], 'docusaurus.config.js');
let source = readFileSync(path, 'utf8');
if (/\btrailingSlash:\s*true\b/.test(source)) {
  console.log('Archive slash policy already explicit');
  process.exit(0);
}
if (/\btrailingSlash\s*:/.test(source)) throw Error('Archive has a conflicting slash policy; review the source before updating');
if (!source.includes('const config = {')) throw Error('Unknown Docusaurus config shape');
source = source.replace('const config = {', 'const config = {\n  trailingSlash: true, // Match 1200km sitemap, canonical links, and directory hosting.');
writeFileSync(path, source);
console.log('Prepared archive source with trailingSlash: true');
