import { readFileSync } from 'node:fs';
import { validateMapping } from './editorial-integrity-lib.mjs';
const args = process.argv.slice(2),
  value = k => args[args.indexOf(k) + 1];
if (!args.includes('--manifest') || !args.includes('--mappings')) throw Error('Use --manifest pinned-index.json --mappings reviewed-mappings.json');
const manifest = JSON.parse(readFileSync(value('--manifest'), 'utf8'));
const mappings = JSON.parse(readFileSync(value('--mappings'), 'utf8'));
for (const row of mappings) validateMapping(row, manifest);
console.log(`${mappings.length} scoped mappings passed pinned identifier, label, framework/domain/release, status and evidence-boundary checks. Semantic review remains explicit in each record.`);
