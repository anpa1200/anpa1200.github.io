// Minify only shared UI assets in the staged release, never research/source data.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), index = args.indexOf('--site');
if (index < 0 || !args[index + 1]) throw Error('Pass --site with a staged release directory');
const site = resolve(args[index + 1]);
if (site === root) throw Error('Do not minify the authoring checkout');
let saved = 0;
const assets = ['assets/site-search.js', 'assets/platform-sidebar.js', 'assets/anomaly-tags.js', 'assets/docusaurus-ecosystem.js', 'assets/site-theme.js', 'assets/site-performance.js'];
for (const path of assets) {
  const file = resolve(site, path), source = await readFile(file, 'utf8');
  // No statement compression or property mangling; preserve public names and licenses.
  const result = await minify(source, {
    compress: false, mangle: true, keep_fnames: true,
    format: { comments: /@license|@preserve|^!/ },
  });
  if (!result.code) throw Error(`Empty minifier output for ${path}`);
  const output = result.code + '\n';
  if (Buffer.byteLength(output) < Buffer.byteLength(source)) {
    saved += Buffer.byteLength(source) - Buffer.byteLength(output);
    await writeFile(file, output);
  }
}
console.log(`Compacted ${assets.length} shared UI scripts; saved ${saved} bytes. Research data unchanged.`);
