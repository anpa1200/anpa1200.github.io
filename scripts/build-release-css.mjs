// Compact shared stylesheets and standalone inline styles in the staged
// release (comments and redundant whitespace only; see css-compact-lib).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compactCss, compactInlineStyles } from './css-compact-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), index = args.indexOf('--site');
if (index < 0 || !args[index + 1]) throw Error('Pass --site with a staged release directory');
const site = resolve(args[index + 1]);
if (site === root) throw Error('Do not compact the authoring checkout');

let saved = 0, stylesheets = 0, pages = 0;
async function write(file, source, output) {
  if (Buffer.byteLength(output) >= Buffer.byteLength(source)) return false;
  saved += Buffer.byteLength(source) - Buffer.byteLength(output);
  await writeFile(file, output);
  return true;
}
for (const directory of ['assets', 'ttp-simulation/assets']) {
  for (const name of await readdir(join(site, directory))) {
    if (!name.endsWith('.css')) continue;
    const file = join(site, directory, name), source = await readFile(file, 'utf8');
    if (await write(file, source, `${compactCss(source)}\n`)) stylesheets += 1;
  }
}
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { if (!['pagefind', 'node_modules'].includes(entry.name)) await walk(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const source = await readFile(path, 'utf8');
    if (!source.includes('<style')) continue;
    if (await write(path, source, compactInlineStyles(source))) pages += 1;
  }
}
await walk(site);
console.log(`Compacted ${stylesheets} shared stylesheet(s) and inline styles in ${pages} standalone page(s); saved ${saved} bytes.`);
