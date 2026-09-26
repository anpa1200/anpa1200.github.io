import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {research,sectorResearchSection} from '../scripts/sector-research-lib.mjs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const attack=JSON.parse(read('threat-matrix/mitre-data.json'));
const p=research.publications[0];

test('sector links validate against actual actor and technique IDs without adding attribution edges',()=>{
 assert.equal(research.relationship_type,'editorial-reading-route');
 assert.equal(p.evidence_cutoff,'2026-09-25');
 assert.equal(p.techniques.length,21);assert.equal(p.actors.length,6);
 for(const [kind,records] of [['techniques',attack.techniques],['actors',attack.groups]]){
  const seen=new Set();for(const row of p[kind]){
   assert.ok(!seen.has(row.id));seen.add(row.id);
   assert.ok(records.some(r=>r.id===row.id),row.id);
   assert.ok(row.scope.length>40);assert.ok(row.anchor);
   const path=`threat-matrix/${kind}/${row.id}/index.html`;
   assert.ok(read(path).includes(sectorResearchSection(kind,row.id)),path);
  }
 }
 assert.match(p.techniques.find(r=>r.id==='T1586').scope,/T1078 account use/);
 assert.match(p.techniques.find(r=>r.id==='T1041').scope,/Analytical mapping/);
 assert.equal(sectorResearchSection('actors','unknown'),'');
});

test('publication is discoverable from hubs and six relevant field guides',()=>{
 for(const page of ['index.html','cti.html','guides.html',...['cti','blue-team','cloud-security','dfir','grc','malware-analysis'].map(d=>`cyber-knowledge/${d}.html`)])assert.ok(read(page).includes(new URL(p.url).pathname),page);
 const config=JSON.parse(read('data/content-catalog.config.json'));
 assert.equal(config.overrides[p.url].evidence_level,'source-backed');
 assert.equal(config.overrides[p.url].lifecycle,'stable-reference');
 assert.ok(config.featured_urls.includes(p.url));
 assert.ok(config.article_lifecycle_policy.stable_reference_slugs.includes('cyberattacks-on-big-pharma-and-its-ecosystem'));
 assert.ok(read('llms.txt').includes(p.url));
});
