import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { rewriteExternalHrefs } from '../scripts/external-link-replacements.mjs';
const root=fileURLToPath(new URL('..', import.meta.url));
test('reviewed external references reach their verified destination in real staged HTML', async () => {
const report=JSON.parse(await readFile(join(root,'reports/external-links/review-2026-10-14.json'),'utf8'));
const repaired=report.records.filter(x=>x.outcome==='repaired');
const paths=[...new Set(repaired.flatMap(x=>x.sources))];
let replacements=0;const coverage=new Set();
for (const path of paths) {
 const html=await readFile(join(root,path),'utf8');
 const result=rewriteExternalHrefs(html);
 assert.equal(result.output.replace(/(\shref=)(["'])(https?:\/\/[^"']+)\2/gi,'$1$2URL$2'),html.replace(/(\shref=)(["'])(https?:\/\/[^"']+)\2/gi,'$1$2URL$2'),'Only href values may change');
 assert.equal(rewriteExternalHrefs(result.output).output,result.output,'Staging is idempotent');
 for(const row of repaired.filter(x=>x.sources.includes(path))) {
  const escaped=row.release_replacement.to.replaceAll('&','&amp;');
  assert.ok(result.output.includes(`href="${escaped}`)||result.output.includes(`href='${escaped}`),`${row.url} not rewritten in ${path}`);
  coverage.add(row.url);
 }
 replacements+=result.replacements;

}
assert.equal(coverage.size,23);
assert.ok(replacements > 0);
});
