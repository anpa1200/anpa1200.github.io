import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const data = JSON.parse(readFileSync('data/kill-chain.json','utf8'));
const stages = ['Reconnaissance','Weaponization','Delivery','Exploitation','Installation','Command and Control','Actions on Objectives'];
test('classic stages, unique identities and explicit coverage decisions',()=>{
 assert.deepEqual(data.stages.map(s=>s.name),stages);
 assert.ok(readFileSync('.github/workflows/pages.yml','utf8').includes(`ARTICLE_ARCHIVE_COMMIT: ${data.archive_commit}`),'Update the reviewed inventory when the published archive pin changes.');
 assert.equal(data.items.filter(i=>i.id.startsWith('archive:')).length,194);
 assert.equal(data.items.filter(i=>i.kind==='trainsec').length,87);
 assert.equal(new Set(data.items.map(i=>i.id)).size,data.items.length);
 assert.equal(new Set(data.items.map(i=>i.url)).size,data.items.length);
 for(const i of data.items){assert.ok(i.evidence_sections.length,i.id);assert.ok(i.placements.length || i.exclusion_reason,i.id);assert.equal(new Set(i.placements.map(p=>p.stage)).size,i.placements.length);for(const p of i.placements){assert.ok(data.stages.some(s=>s.slug===p.stage));assert.ok(p.note.length>40);assert.ok(Array.isArray(p.read_sections));}}
});
test('rendered stage counts, canonical identity, metadata, and accessible static navigation',()=>{
 const landing=readFileSync('kill-chain/index.html','utf8');assert.equal((landing.match(/class="kc-banner kc-stage-/g)||[]).length,7);
 for(const stage of data.stages){
  const text=readFileSync(`kill-chain/${stage.slug}/index.html`,'utf8');
  const rows=data.items.filter(i=>i.placements.some(p=>p.stage===stage.slug));
  assert.ok(landing.includes(`${rows.length} readings`));
  assert.equal((text.match(/<li><h3>/g)||[]).length,rows.length);
  assert.ok(text.includes(`<link rel="canonical" href="https://1200km.com/kill-chain/${stage.slug}/">`));
  assert.ok(text.includes('id="main-content"'));assert.ok(text.includes('Skip to main content'));assert.ok(text.includes('aria-current="page"'));
  assert.ok(text.includes('not a mandatory linear sequence'));assert.ok(text.includes('not an official one-to-one mapping'));
  for(const i of rows){const url=i.url.replace('https://1200km.com','');assert.ok(text.includes(`href="${url.replace(/&/g,'&amp;')}"`),i.id);}
  const schema=JSON.parse(text.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema.mainEntity.itemListElement.length,rows.length);
 }
});
test('all local source links exist or match exact pinned archive paths',()=>{
 const articleRoot=process.env.KILL_CHAIN_ARCHIVE;
 if(articleRoot){const canonical=JSON.parse(readFileSync(resolve(articleRoot,'src/data/article-catalog.json'),'utf8'));assert.deepEqual(new Set(data.items.filter(i=>i.id.startsWith('archive:')).map(i=>i.url.replace(/\/$/,''))),new Set(canonical.map(i=>i.canonical_url.replace(/\/$/,''))));}
 for(const i of data.items){
  if(i.id.startsWith('archive:')){
   assert.equal(i.url,`https://1200km.com/articles/read/${i.id.slice(8)}/`);
   if(articleRoot){const p=resolve(articleRoot,'docs/articles',i.source_path);const text=readFileSync(p);assert.equal(createHash('sha256').update(text).digest('hex'),i.source_sha256,i.id);}
  }else if(i.placements.length&&i.url.startsWith('https://1200km.com/')){
   let p=i.url.slice('https://1200km.com/'.length);if(p.endsWith('/'))p+='index.html';assert.ok(existsSync(p),i.url);
  }
 }
});
test('all local guide/lab/research/case-study canonical identities have reviewed decisions',()=>{
 const catalog=JSON.parse(readFileSync('data/content-catalog.json','utf8')).items;
 const known=new Set(data.items.map(i=>i.url));
 for(const i of catalog.filter(i=>['guide','lab','research','case-study'].includes(i.primary_type)&&!i.canonical_url.includes('/kill-chain/')))assert.ok(known.has(i.canonical_url),i.canonical_url);
});

test('curated ATT&CK mappings cover every stage with official active technique identities',()=>{
 const attack=JSON.parse(readFileSync('data/kill-chain-attack.json','utf8'));
 assert.equal(attack.source.release,'20.0');
 assert.match(attack.source.repository_commit,/^[a-f0-9]{40}$/);
 assert.match(attack.source.sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(Object.keys(attack.stages),data.stages.map(s=>s.slug));
 const officialPath=process.env.ATTACK_ENTERPRISE_SOURCE;
 const official=officialPath?JSON.parse(readFileSync(officialPath,'utf8')):null;
 if(official)assert.equal(createHash('sha256').update(readFileSync(officialPath)).digest('hex'),attack.source.sha256);
 const sourceObjects=new Map((official?.objects||[]).map(o=>[o.id,o]));
 for(const stage of data.stages){
  const rows=attack.stages[stage.slug];assert.ok(rows.length>=5);
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  const page=readFileSync(`kill-chain/${stage.slug}/index.html`,'utf8');
  assert.ok(page.includes('id="ttp-examples"'));assert.ok(page.includes('not an exhaustive checklist or an official one-to-one mapping'));
  assert.equal((page.match(/class="kc-ttp-link"/g)||[]).length,rows.length);
  for(const row of rows){
   const technique=attack.techniques[row.id];assert.ok(technique,row.id);
   assert.match(row.id,/^T\d{4}(?:\.\d{3})?$/);assert.ok(row.relevance.length>60);
   assert.equal(technique.revoked,false);assert.equal(technique.deprecated,false);
   assert.equal(technique.is_subtechnique,row.id.includes('.'));
   assert.equal(new URL(technique.url).origin,'https://attack.mitre.org');
   assert.equal(new URL(technique.url).pathname.replace(/\/$/,''),`/techniques/${row.id.replace('.','/')}`);
   assert.ok(page.includes(`href="${technique.url}"`));
   if(technique.parent)assert.equal(technique.parent.id,row.id.split('.')[0]);
   if(official){
    const o=sourceObjects.get(technique.stix_id);assert.ok(o);
    assert.equal(o.type,'attack-pattern');assert.ok(!o.revoked&&!o.x_mitre_deprecated);
    assert.equal(o.name,technique.name);assert.equal(o.modified,technique.modified);
    const ref=o.external_references.find(r=>r.source_name==='mitre-attack');
    assert.equal(ref.external_id,row.id);assert.equal(ref.url,technique.url);
    if(technique.parent){
     const p=official.objects.find(p=>p.type==='attack-pattern'&&p.external_references?.some(r=>r.source_name==='mitre-attack'&&r.external_id===technique.parent.id));
     assert.ok(p&&!p.revoked&&!p.x_mitre_deprecated);assert.equal(p.name,technique.parent.name);
     assert.ok(official.objects.some(r=>r.type==='relationship'&&r.relationship_type==='subtechnique-of'&&r.source_ref===o.id&&r.target_ref===p.id&&!r.revoked));
    }
   }
  }
 }
 assert.ok(attack.stages['delivery'].some(r=>r.id==='T1608.001')&&attack.stages.weaponization.some(r=>r.id==='T1608.001'));
 assert.ok(attack.stages['command-and-control'].some(r=>r.id==='T1041')&&attack.stages['actions-on-objectives'].some(r=>r.id==='T1041'));
});
