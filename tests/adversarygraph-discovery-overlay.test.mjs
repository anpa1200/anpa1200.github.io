import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {prepareAdversaryGraphDiscovery} from '../scripts/adversarygraph-discovery-overlay.mjs';
const facts=JSON.parse(readFileSync(new URL('../data/site-facts.json',import.meta.url))).facts;
test('companion source overlay uses PNG geometry and is idempotent',()=>{
 const root=mkdtempSync(join(tmpdir(),'adg-discovery-'));
 try {
  for(const path of ['docs','src/pages','static/img'])mkdirSync(join(root,path),{recursive:true});
  const png=Buffer.alloc(24);png.writeUInt32BE(0x89504e47,0);png.write('IHDR',12);png.writeUInt32BE(1440,16);png.writeUInt32BE(900,20);writeFileSync(join(root,'static/img/proof.png'),png);
  writeFileSync(join(root,'docs/intro.md'),'Current source release: v7.0.0. Latest published immutable GitHub release.');
  const file=join(root,'src/pages/index.js');
  writeFileSync(file,`const proofScreens=[{src: 'img/proof.png',}]; const gallery=proofScreens.map(({title, body, src, href, alt}) => <img src={\`\${baseUrl}\${src}\`} alt={alt} loading="lazy" />); const heading=<h1>Docs</h1>;`);
  prepareAdversaryGraphDiscovery(root,facts);const first=readFileSync(file,'utf8');
  assert.match(first,/width: 1440, height: 900/);assert.match(first,/width=\{width\} height=\{height\}/);
  assert.ok(first.includes(facts['adversarygraph.development_version'].value));
  assert.doesNotMatch(readFileSync(join(root,'docs/intro.md'),'utf8'),/immutable/);
  prepareAdversaryGraphDiscovery(root,facts);assert.equal(readFileSync(file,'utf8'),first);
 } finally {rmSync(root,{recursive:true,force:true});}
});
