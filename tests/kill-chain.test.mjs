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
