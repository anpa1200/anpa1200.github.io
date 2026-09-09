import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { citationArtifacts } from './editorial-integrity-lib.mjs';
const root = process.cwd();
const skip = new Set(['.git', 'node_modules', '.cache', '.docusaurus', 'build', 'pagefind', 'research-downloads', 'materials']);
function walk(dir = '') {
  return readdirSync(join(root, dir), {
    withFileTypes: true
  }).flatMap(e => skip.has(e.name) || !dir && e.name === 'reports' ? [] : e.isDirectory() ? walk(join(dir, e.name)) : /\.(md|html)$/.test(e.name) ? [join(dir, e.name)] : []);
}
const legacy = JSON.parse(readFileSync('data/editorial-artifact-baseline.json', 'utf8'));
let existing = 0;
const failures = [];
for (const file of walk()) {
  const artifacts = citationArtifacts(readFileSync(file, 'utf8'));
  if (!artifacts.length) continue;
  const baseline = legacy[file] || [];
  const counts = new Map();
  for (const token of baseline) counts.set(token, (counts.get(token) || 0) + 1);
  for (const token of artifacts) {
    if (counts.get(token) > 0) {
      existing++;
      counts.set(token, counts.get(token) - 1);
    } else failures.push(file + ': unexplained citation artifact ' + token);
  }
}
if (failures.length) throw Error(failures.join('\n'));
console.log(`Editorial artifact check passed; ${existing} unchanged legacy artifacts remain outside the scoped repair. Intentional fenced/inline code examples are excluded.`);
