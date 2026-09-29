import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {readState,stateParams,filterRows,renderMatrix,inView,scopeNote} from '../assets/interactive-matrix-logic.mjs';
import {loadSiteShell} from '../scripts/site-shell-lib.mjs';
import {renderPlatformSidebar} from '../scripts/platform-sidebar-lib.mjs';
import {classifyUrl,classifyContentType} from '../scripts/search-index-lib.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const data=read('attack-matrix/matrix-data.json'),sources=read('data/interactive-matrix-sources.json'),catalog=read('ttp-simulation/data/catalog.json');
const state=query=>readState(new URLSearchParams(query));

test('all pinned ATT&CK and ATLAS entries are represented exactly once and link to real pages',()=>{
  assert.equal(data.records.length,catalog.records.length+sources.atlas.techniques.length);
  assert.equal(new Set(data.records.map(r=>r.key)).size,data.records.length);
  assert.deepEqual(data.records.filter(r=>r.domain!=='atlas').map(r=>r.key),catalog.records.map(r=>r.key));
  for(const row of data.records){
    assert.ok(existsSync(resolve(root,'.'+row.page,'index.html')),row.page);
    assert.ok(row.page.startsWith('/ttp-simulation/techniques/')||row.page.startsWith('/attack-matrix/atlas/'));
    assert.ok(row.tactics.length,row.key);
    const domain=data.domains.find(d=>d.id===row.domain);
    assert.ok(domain);
    for(const tactic of row.tactics)assert.ok(domain.tactics.some(t=>t.slug===tactic),row.key+' '+tactic);
    if(row.parent_id)assert.ok(data.records.some(p=>p.domain===row.domain&&p.id===row.parent_id&&!p.parent_id),row.key+' parent');
    for(const id of row.telemetry)assert.ok(data.telemetry.some(t=>t.id===id),id);
    if(row.detection_page)assert.ok(existsSync(resolve(root,'.'+row.detection_page,'index.html')));
  }
});
test('versions and official tactic order remain pinned rather than sorted by ID',()=>{
  assert.equal(sources.attack.enterprise.version,catalog.attack_version);
  assert.equal(data.domains.find(d=>d.id==='enterprise').tactics[0].id,'TA0043');
  assert.equal(data.domains.find(d=>d.id==='ics').tactics[0].id,'TA0108');
  assert.equal(data.domains.find(d=>d.id==='atlas').tactics[2].id,'AML.TA0001');
  assert.equal(data.domains.find(d=>d.id==='atlas').tactics[2].name,'AI Attack Adaptation');
  for(const source of [...Object.values(sources.attack).map(r=>r.source),sources.atlas.source]){
    assert.match(source.sha256,/^[a-f0-9]{64}$/);
    assert.match(source.url,/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[a-f0-9]{40}\//);
  }
});
test('exact ID filtering preserves child link and explicitly labelled parent context',()=>{
  const s=state('q=T1059.001');
  assert.deepEqual(filterRows(data,s).map(r=>r.id),['T1059.001']);
  const html=renderMatrix(data,s);
  assert.match(html,/href="\/ttp-simulation\/techniques\/enterprise\/T1059\.001\/"/);
  assert.match(html,/Parent context/);
  assert.match(html,/<details class="im-children" open>/);
});
test('IoT and cloud views are bounded source-platform selections, not invented domains',()=>{
  const iot=data.records.filter(r=>inView(r,'iot'));
  assert.ok(iot.some(r=>r.domain==='ics'));
  assert.ok(iot.some(r=>r.domain==='enterprise'));
  assert.ok(iot.every(r=>r.domain==='ics'||r.platforms.includes('Network Devices')));
  assert.ok(!iot.some(r=>r.domain==='atlas'||r.domain==='mobile'));
  assert.match(scopeNote('iot'),/not an official IoT matrix or exhaustive IoT coverage/);
  assert.ok(filterRows(data,state('view=cloud')).every(r=>r.domain==='enterprise'));
});
test('source-mapped telemetry and documented procedures are distinct from unassessed ATLAS',()=>{
  assert.ok(filterRows(data,state('telemetry=DC0032')).length>0);
  const atlas=filterRows(data,state('view=atlas'));
  assert.equal(atlas.length,208);
  assert.ok(atlas.every(r=>r.classification==='not_assessed'&&r.telemetry.length===0&&!r.detection_page));
  assert.equal(filterRows(data,state('view=atlas&simulation=can_simulate')).length,0);
  assert.equal(filterRows(data,state('view=atlas&telemetry=DC0032')).length,0);
});
test('URL state roundtrips and rejects unsupported options',()=>{
  const s=state('view=mobile&q=test&platform=Android&layout=list&sub=1&simulation=can_simulate');
  assert.deepEqual(readState(stateParams(s)),s);
  assert.equal(state('view=unexpected&layout=javascript&simulation=__proto__').view,'enterprise');
  assert.equal(state('simulation=__proto__').simulation,'');
  assert.equal(state('q='+encodeURIComponent('x'.repeat(800))).q.length,200);
});
test('no-result and malicious query states remain text, not HTML',()=>{
  const html=renderMatrix(data,state('q='+encodeURIComponent('<img onerror=alert(1)>')));
  assert.match(html,/No matching techniques/);
  assert.doesNotMatch(html,/<img|onerror/);
});
test('static fallback exposes every technique without JavaScript and all IDs are unique',()=>{
  const html=readFileSync(resolve(root,'attack-matrix/index.html'),'utf8');
  const keys=new Set([...html.matchAll(/data-technique="([^"]+)"/g)].map(m=>m[1]));
  assert.equal(keys.size,data.records.length);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.match(html,/id="matrix-controls"[^>]*hidden/);
});
test('ATLAS local descriptions retain source-backed crosslinks and explicit validation limits',()=>{
  const html=readFileSync(resolve(root,'attack-matrix/atlas/AML.T0051/index.html'),'utf8');
  assert.match(html,/href="\/attack-matrix\/atlas\/AML\.T0051\.000\/"/);
  assert.match(html,/not a runnable simulation/);
  assert.match(html,/Source maturity: Realized/);
  assert.match(html,/Apache License 2.0/);
  assert.match(html,/canonical" href="https:\/\/1200km.com\/attack-matrix\/atlas\/AML.T0051\/"/);
});
test('ATLAS relationships remain navigable when upstream MITRE deep links are unavailable',()=>{
  const mitigations=readFileSync(resolve(root,'attack-matrix/atlas/mitigations/index.html'),'utf8');
  const studies=readFileSync(resolve(root,'attack-matrix/atlas/case-studies/index.html'),'utf8');
  const mitigationIds=new Set(sources.atlas.techniques.flatMap(r=>r.mitigations.map(m=>m.id)));
  const studyIds=new Set(sources.atlas.techniques.flatMap(r=>r.case_studies.map(s=>s.id)));
  assert.equal(mitigationIds.size,40);
  assert.equal(studyIds.size,73);
  for(const id of mitigationIds)assert.ok(mitigations.includes(`id="${id}"`),id);
  for(const id of studyIds)assert.ok(studies.includes(`id="${id}"`),id);
  for(const technique of sources.atlas.techniques){
    const html=readFileSync(resolve(root,`attack-matrix/atlas/${technique.id}/index.html`),'utf8');
    assert.doesNotMatch(html,/href="https:\/\/atlas\.mitre\.org\/(?:techniques|mitigations|studies|tactics)\//);
    for(const relation of technique.mitigations)assert.ok(html.includes(`/attack-matrix/atlas/mitigations/#${relation.id}`),technique.id+' '+relation.id);
    for(const relation of technique.case_studies)assert.ok(html.includes(`/attack-matrix/atlas/case-studies/#${relation.id}`),technique.id+' '+relation.id);
  }
});
test('ATLAS tactic headings link to local filtered matrix views, not unavailable upstream deep links',()=>{
  const tactics=sources.atlas.tactics;
  assert.equal(tactics.length,16);
  for(const tactic of tactics)assert.equal(tactic.url,`/attack-matrix/?view=atlas&tactic=${tactic.id}#matrix`);
  assert.deepEqual(data.domains.find(domain=>domain.id==='atlas').tactics,tactics);
  const html=readFileSync(resolve(root,'attack-matrix/index.html'),'utf8');
  assert.doesNotMatch(html,/href="https:\/\/atlas\.mitre\.org\/tactics\//);
  for(const tactic of tactics)assert.ok(html.includes(`href="/attack-matrix/?view=atlas&amp;tactic=${tactic.id}#matrix"`),tactic.id);
});
test('matrix is first in the attack module sidebar and highlighted throughout ATLAS references',()=>{
  const shell=loadSiteShell(root),group=shell.sidebar.sections.find(s=>s.id==='detection-lab');
  assert.equal(group.links[0].href,'/attack-matrix/');
  for(const path of ['/attack-matrix/','/attack-matrix/atlas/AML.T0051/']){
    const html=renderPlatformSidebar(shell,{pathname:path});
    assert.match(html,/href="\/attack-matrix\/" aria-current="(?:page|location)"/);
    assert.doesNotMatch(html,/href="\/anomaly-detection-atlas\/" aria-current=/);
  }
  assert.doesNotMatch(renderPlatformSidebar(shell,{pathname:'/attack-matrix-other/'}),/href="\/attack-matrix\/" aria-current=/);
});
test('search keeps ATLAS technique references separate from tools and articles',()=>{
  assert.equal(classifyContentType('https://1200km.com/attack-matrix/'),'Tool');
  assert.equal(classifyContentType('https://1200km.com/attack-matrix/atlas/AML.T0051/'),'ATLAS technique');
  assert.equal(classifyUrl('https://1200km.com/attack-matrix/atlas/AML.T0051/'),'ATLAS techniques');
});
