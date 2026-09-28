import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {renderWorkbook,sourceText,renderAtlasEngineering} from '../ttp-simulation/assets/workbook-render.mjs';
import {validateFixture,featureLenses} from '../ttp-simulation/assets/workbook-logic.mjs';
import {textForPhoneScan} from '../scripts/privacy-check-lib.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),read=p=>JSON.parse(readFileSync(root+p,'utf8'));
const raw=read('data/ttp-workbook-sources.json'),catalog=read('ttp-simulation/data/catalog.json'),audit=read('ttp-simulation/data/workbooks.json');
const full=new Map(raw.records.map(r=>[r.key,r]));
const sections=['technique-description','telemetry','detection-rules','anomalies','anomaly-design','attack-tools','simulation','synthetic-logs','validation','sources'];

test('all 1126 matrix destinations receive source-aware engineering sections',()=>{
  assert.equal(audit.records.length,1126);
  assert.equal(new Set(audit.records.map(r=>r.key)).size,1126);
  for(const record of audit.records){
    const html=readFileSync(root+record.page.slice(1)+'index.html','utf8');
    assert.ok(record.full_definition,record.key);
    for(const id of record.domain==='atlas'?['detection-rules','anomalies','attack-tools','simulation','synthetic-logs']:sections)assert.ok(html.includes(`id="${id}"`),`${record.key} ${id}`);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,record.key+' duplicate IDs');
    assert.equal(record.live_attack_validation,false);
    assert.equal(record.production_detector_validation,false);
  }
});

test('every ATT&CK workbook preserves the full pinned definition and exact candidates',()=>{
  assert.deepEqual(raw.source_manifest,catalog.source_manifest);
  for(const row of catalog.records){
    const w=read(`ttp-simulation/data/workbooks/${row.key}.json`),s=full.get(row.key);
    assert.equal(w.description,s.description,row.key);
    assert.equal(w.source_object_sha256,createHash('sha256').update(JSON.stringify(s)).digest('hex'),row.key);
    assert.deepEqual(w.candidates,s.candidates,row.key);
    assert.deepEqual(w.software,s.software,row.key);
    assert.equal(w.detection.key,row.key);
    for(const candidate of w.candidates){assert.ok(candidate.source_definition_sha256);assert.ok(candidate.source_url.includes('/'+row.id+'/'));}
    for(const ref of Object.values(w.technique_links))assert.ok(existsSync(root+ref.slice(1)+'index.html'),ref);
    const body=renderWorkbook(w);
    for(const id of sections)assert.ok(body.includes(`id="${id}"`),row.key+' '+id);
    assert.match(body,/not.*(?:attack|TTP)|not attack/i);
    for(const t of w.telemetry)assert.ok(featureLenses[t.category],row.key+' '+t.category);
  }
});

test('all 918 offline fixtures pass collection contracts and reject missing-field negative controls',()=>{
  let total=0,negative=0;
  for(const row of catalog.records){
    const w=read(`ttp-simulation/data/workbooks/${row.key}.json`);
    if(!w.synthetic)continue;
    total++;
    assert.equal(validateFixture(w.synthetic,w).passed,true,row.key);
    assert.deepEqual(w.synthetic,read(`ttp-simulation/data/fixtures/${row.key}.json`));
    const noEvents={...w.synthetic,events:[]};assert.equal(validateFixture(noEvents,w).passed,false,row.key);
    const mismatch={...w.synthetic,technique_key:'not-the-technique'};assert.equal(validateFixture(mismatch,w).passed,false,row.key);
    for(const [index,event] of w.synthetic.events.entries()){
      const contract=w.telemetry.find(r=>r.id===event.telemetry_id);
      for(const field of contract.required_fields){
        const fixture=structuredClone(w.synthetic);delete fixture.events[index].observation[field];
        assert.equal(validateFixture(fixture,w).passed,false,`${row.key} ${event.telemetry_id} ${field}`);negative++;
      }
    }
  }
  assert.equal(total,918);assert.ok(negative>5000);
});

test('Nmap associations are explicit and reciprocal, not copied from T1046',()=>{
  const n=read('ttp-simulation/data/tools/nmap.json');
  for(const key of ['enterprise/T1595','enterprise/T1595.001']){
    const w=read(`ttp-simulation/data/workbooks/${key}.json`);
    const association=w.tools.find(r=>r.id==='nmap');assert.ok(association);
    assert.deepEqual(association.bases,['editorial_capability']);
    assert.ok(n.techniques.some(r=>r.key===key));
    assert.equal(association.guides.length,5);
  }
  const tools=read('ttp-simulation/data/tools.json');
  const rows=tools.records.map(r=>read(`ttp-simulation/data/tools/${r.id}.json`));
  assert.equal(tools.counts.tool_technique_links,rows.reduce((n,r)=>n+r.techniques.length,0));
});

test('ATLAS plans preserve source boundaries and never manufacture log records',()=>{
  for(const row of read('data/interactive-matrix-sources.json').atlas.techniques){
    const html=renderAtlasEngineering(row);
    assert.match(html,/No executable detector/);assert.match(html,/not a native event/);
    assert.ok(html.includes(row.id));
  }
});

test('untrusted source HTML, script URLs and retirement/cross-domain links cannot become active content',()=>{
  const w={domain:'enterprise',references:[],technique_links:{T1059:'/ttp-simulation/techniques/enterprise/T1059/'}};
  const html=sourceText('<img src=x onerror=alert(1)> [bad](javascript:alert(1)) [retired](/techniques/T9999/) [local](/techniques/T1059/)',w);
  assert.doesNotMatch(html,/<img|href="javascript:/);
  const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(hrefs,[
    'https://attack.mitre.org/techniques/T9999/',
    '/ttp-simulation/techniques/enterprise/T1059/',
  ]);
});

test('historic advisory IDs do not bypass real phone/contact privacy checks',()=>{
  const url='https://www.symantec.com/security_response/writeup.jsp?docid=2012-050412-4128-99';
  const number='050'+'123'+'4567';
  assert.equal(textForPhoneScan(url),'[structured-public-advisory-url]');
  assert.ok(textForPhoneScan(`<a href="${url}">${number}</a>`).includes(number));
  assert.ok(textForPhoneScan(`<a href="tel:${number}">contact</a>`).includes('tel:'+number));
  assert.ok(textForPhoneScan('https://example.test/'+number).includes(number));
});
