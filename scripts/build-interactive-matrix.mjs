#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applySiteShell,loadSiteShell} from './site-shell-lib.mjs';
import {applyPlatformSidebar} from './platform-sidebar-lib.mjs';
import {VIEWS,escapeHtml as h,renderMatrix,readState} from '../assets/interactive-matrix-logic.mjs';
import {renderAtlasEngineering} from '../ttp-simulation/assets/workbook-render.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),check=args.includes('--check');
const site=resolve(args.includes('--site')?args[args.indexOf('--site')+1]:ROOT);
const read=p=>JSON.parse(readFileSync(join(site,p),'utf8'));
const sources=read('data/interactive-matrix-sources.json'),inventory=read('ttp-simulation/data/catalog.json');
const shell=loadSiteShell(site),changed=[];
const a=(url,label)=>`<a href="${h(url)}">${h(label)}</a>`;
const local=id=>`/attack-matrix/atlas/${id}/`;
const model={schema_version:1,generated_on:sources.imported_on,domains:[
  ...Object.entries(sources.attack).map(([id,r])=>({id,name:`MITRE ATT&CK ${id==='ics'?'ICS':id[0].toUpperCase()+id.slice(1)}`,version:r.version,tactics:r.tactics})),
  {id:'atlas',name:'MITRE ATLAS',version:sources.atlas.version,tactics:sources.atlas.tactics},
],telemetry:read('ttp-simulation/data/telemetry.json').records.map(r=>({id:r.id,name:r.name,page:'/ttp-simulation/'+r.page})),records:[
  ...inventory.records.map(r=>({key:r.key,id:r.id,name:r.name,domain:r.domain,parent_id:r.parent_id,tactics:r.tactics,platforms:r.platforms.filter(x=>x!=='None'),environments:r.environments,page:'/ttp-simulation/'+r.page,telemetry:r.telemetry_references.map(t=>t.id),classification:r.classification,detection_page:'/ttp-simulation/'+r.detections.page})),
  ...sources.atlas.techniques.map(r=>({key:'atlas/'+r.id,id:r.id,name:r.name,domain:'atlas',parent_id:r.parent_id,tactics:r.tactics,platforms:r.platforms,environments:[],page:local(r.id),telemetry:[],classification:'not_assessed',maturity:r.maturity})),
]};
function output(path,content){const file=join(site,path);if(existsSync(file)&&readFileSync(file,'utf8')===content)return;if(check){changed.push(path);return;}mkdirSync(dirname(file),{recursive:true});writeFileSync(file,content);}
function page(path,title,description,body,{interactive=false,keywords=[]}={}){
  const url='https://1200km.com/'+path;
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(title)} | 1200km</title><meta name="description" content="${h(description)}"><meta name="author" content="Andrey Pautov"><meta name="robots" content="index,follow"><meta name="keywords" content="${h(keywords.join(', '))}">
<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:title" content="${h(title)}"><meta property="og:description" content="${h(description)}"><meta property="og:image" content="https://1200km.com/assets/site-og-v2.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${h(title)}"><meta name="twitter:description" content="${h(description)}"><meta name="twitter:image" content="https://1200km.com/assets/site-og-v2.png">
<link rel="icon" href="/assets/ap-logo-72.png"><link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default"><link rel="stylesheet" href="/assets/interactive-matrix.css">
<link rel="stylesheet" href="/ttp-simulation/assets/workbook.css">
<script src="/assets/theme-bootstrap.js"></script><script src="/assets/site-theme.js?v=20260904-light-default" defer></script><script src="/assets/site-performance.js" data-google-analytics-id="G-TMTG21RVHM" defer></script>
${interactive?'<script type="module" src="/assets/interactive-matrix.mjs"></script>':''}
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':interactive?'CollectionPage':'TechArticle',headline:title,name:title,description,url,dateModified:sources.imported_on,author:{'@type':'Person',name:'Andrey Pautov',url:'https://1200km.com/about.html'},isPartOf:{'@type':'WebSite',name:'1200km',url:'https://1200km.com/'}}).replaceAll('<','\\u003c')}</script>
</head><body class="interactive-matrix-page" id="top"><header class="site-header"></header><main id="main-content" data-pagefind-body>${body}</main><footer></footer></body></html>\n`;
  output(path+'index.html',applyPlatformSidebar(applySiteShell(html,shell,{path:path+'index.html',active:'attack-matrix',back_to_top:true}),shell,{pathname:'/'+path}));
}
const related=`<nav class="im-related" aria-label="Connected modules">${[['/ttp-simulation/','Attack Simulations'],['/ttp-simulation/tools/','Attack Tools'],['/ttp-simulation/detections/','Detection Rules'],['/ttp-simulation/telemetry/','Telemetry Library'],['https://1200km.com/anomaly-detection-atlas/','Anomaly Detection Atlas'],['/threat-matrix/','Threat actor workspace']].map(([u,l])=>a(u,l)).join('')}</nav>`;
const controls=`<div id="matrix-controls" class="im-controls" hidden>
  <div class="im-filter-grid"><label class="im-query">Search name, ID or platform<input id="matrix-query" type="search" maxlength="200" placeholder="PowerShell, T1059.001, prompt injection…" autocomplete="off"></label><label>Layout<select id="matrix-layout" data-filter="layout"><option value="matrix">Tactic columns</option><option value="list">Wrapped columns / mobile</option></select></label></div>
  <details class="im-more-filters" id="matrix-more-filters"><summary>Platform, telemetry and simulation filters</summary><div class="im-filter-grid">${[['platform','Platform'],['environment','Environment'],['tactic','Tactic'],['telemetry','Mapped telemetry'],['simulation','Simulation evidence']].map(([id,label])=>`<label>${label}<select id="matrix-${id}" data-filter="${id}"><option value="">All</option></select></label>`).join('')}</div></details>
  <div class="im-actions"><label><input id="matrix-sub" type="checkbox" data-filter="sub">Expand sub-techniques</label><button class="im-button" type="button" id="matrix-reset">Clear filters</button><a id="matrix-share" href="/attack-matrix/">Link to this view</a><a id="matrix-telemetry-link" href="/ttp-simulation/telemetry/" hidden>Telemetry guide</a></div></div>`;
page('attack-matrix/','Interactive ATT&CK & ATLAS Matrix','Explore Enterprise, Mobile, ICS, ATLAS, IoT/OT and cloud views. Open every technique page, filter telemetry and inspect simulation evidence.',`
<section class="im-hero"><p class="im-eyebrow">1200km / attack & detection modules</p><h1>Interactive ATT&amp;CK<br>&amp; ATLAS matrix</h1><p class="im-lead">From an adversary technique to its local workspace. Explore tactics, open TTP pages, and follow the connected simulation, detection and telemetry evidence.</p><div class="im-metrics"><span><strong>${inventory.records.length}</strong> ATT&amp;CK entries</span><span><strong>${sources.atlas.techniques.length}</strong> ATLAS entries</span><span><strong>4</strong> frameworks / domains</span><span>Every technique is linked</span></div></section>
${related}<section id="matrix" aria-labelledby="matrix-heading"><h2 id="matrix-heading">Explore the matrix</h2><nav class="im-views" aria-label="Matrix framework or derived view">${VIEWS.map(([id,label])=>`<a href="?view=${id}#matrix" data-matrix-view="${id}">${h(label)}</a>`).join('')}</nav><p id="matrix-scope" class="im-scope">Enterprise, Mobile and ICS are ATT&amp;CK domains. ATLAS is a separate AI-security framework. IoT/OT and cloud are explicitly labelled 1200km navigation views.</p>${controls}<p id="matrix-status" class="im-result-count" role="status">The complete static matrices below work without JavaScript. Interactive filters load when available.</p><p>Scroll within each matrix to explore tactics, or choose the wrapped layout. Use each parent’s disclosure control to show its sub-techniques. Counts are unique techniques plus sub-techniques, not the number of tactic cells.</p><div id="matrix-results"></div><div id="matrix-fallback">${renderMatrix(model,readState(new URLSearchParams('view=all')))}</div></section>
<section class="im-method" aria-labelledby="matrix-method"><h2 id="matrix-method">Evidence, scope and source versions</h2><ul><li><strong>Documented candidate:</strong> at least one compatible procedure in the pinned catalog; not an executed, reviewed or fully integrated simulation. <strong>No catalog candidate:</strong> unsupported in the current evidence set, not technically impossible. <strong>Not assessed:</strong> ATLAS has reference pages, not an ATT&amp;CK lab-coverage assessment.</li><li>Telemetry filters use existing technique-to-collection mappings. A match is not proof that an individual rule detects the technique. ATLAS has no asserted telemetry mapping here.</li><li>The IoT/OT view combines ICS with Enterprise Network Devices. It is not an official or exhaustive IoT matrix. Cloud selects explicit cloud/service platforms. Both retain source-domain boundaries.</li><li>All active entries in the pinned datasets are represented. Revoked and deprecated ATT&amp;CK entries remain excluded under the existing catalog policy.</li></ul><p>ATT&amp;CK ${h(inventory.attack_version)} · ATLAS ${h(sources.atlas.version)} (data format ${h(sources.atlas.format_version)}) · imported ${h(sources.imported_on)}. Sources are pinned, not a live feed.</p><p>${Object.entries(sources.attack).map(([id,r])=>a(r.source.url,`Pinned ${id} STIX`)).join(' · ')} · ${a(sources.atlas.source.url,'Pinned ATLAS YAML')} · ${a('/attack-matrix/provenance.json','Versions and SHA-256 hashes')} · ${a('/ttp-simulation/data/catalog.json','Simulation catalog provenance')}</p><p>${a('https://attack.mitre.org/matrices/enterprise/','MITRE Enterprise')} · ${a('https://attack.mitre.org/matrices/mobile/','MITRE Mobile')} · ${a('https://attack.mitre.org/matrices/ics/','MITRE ICS')} · ${a('https://atlas.mitre.org/','MITRE ATLAS')} · ${a('/attack-matrix/atlas-notice.txt','ATLAS attribution')} · ${a('/attack-matrix/LICENSE-ATLAS.txt','Apache 2.0 license')}</p><p>ATT&amp;CK is a registered trademark and ATLAS is a trademark of The MITRE Corporation. This independently built 1200km navigation module does not imply MITRE endorsement.</p></section>`,{interactive:true,keywords:['MITRE ATT&CK','MITRE ATLAS','Enterprise','Mobile','ICS','IoT','cloud','TTP matrix','simulation','telemetry']});

// Render only safe text and explicit hyperlinks from source Markdown; never source HTML.
function descriptionHtml(text){
  return text.split(/\n\s*\n/).map(paragraph=>{
    let out='',last=0;
    for(const match of paragraph.matchAll(/\[([^\]]+)\]\(([^\s)]+)\)/g)){
      out+=h(paragraph.slice(last,match.index));let url=match[2];
      if(/^\/techniques\/AML\.T\d{4}(?:\.\d{3})?\/?$/.test(url)) {const id=url.split('/')[2];url=sources.atlas.techniques.some(r=>r.id===id)?local(id):'https://atlas.mitre.org'+url;}
      else if(url.startsWith('/'))url='https://atlas.mitre.org'+url;
      out+=/^https:\/\//.test(url)?a(url,match[1]):h(match[0]);last=match.index+match[0].length;
    }
    return '<p>'+out+h(paragraph.slice(last))+'</p>';
  }).join('');
}
const ul=items=>items.length?'<ul>'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<p>No explicit relationship in this pinned source.</p>';
for(const row of sources.atlas.techniques){
  const peers=sources.atlas.techniques.filter(r=>r.parent_id===row.id),parent=sources.atlas.techniques.find(r=>r.id===row.parent_id);
  const attack=inventory.records.filter(r=>r.id===row.attack_reference?.id);
  const scopeLink=(key,value,label)=>a('/attack-matrix/?'+new URLSearchParams({view:'atlas',[key]:value})+'#matrix',label);
  page(`attack-matrix/atlas/${row.id}/`,`${row.id} ${row.name} — ATLAS technique`,`${row.id} ${row.name}: MITRE ATLAS source definition, tactics, platforms, related techniques, mitigations and case studies.`,`
  <section class="im-hero"><p class="im-eyebrow">MITRE ATLAS ${h(sources.atlas.version)} / technique reference</p><h1>${h(row.id)}<br>${h(row.name)}</h1><p>${a('/attack-matrix/?view=atlas#matrix','← Back to the ATLAS matrix')} · ${a('https://atlas.mitre.org/techniques/'+row.id,'Official MITRE definition')}</p><div class="im-tags">${row.platforms.map(p=>scopeLink('platform',p,p)).join('')}${row.tactics.map(id=>scopeLink('tactic',id,sources.atlas.tactics.find(t=>t.id===id).name)).join('')}<span>Source maturity: ${h(row.maturity||'not supplied')}</span></div></section>
  <section class="im-detail"><h2 id="definition">MITRE source definition</h2>${descriptionHtml(row.description)}<p>Source modified ${h(row.modified)}. Reproduced from the pinned ATLAS release; inline technique links resolve to local reference pages.</p></section>
  <section class="im-detail"><h2 id="related-techniques">Parent, sub-techniques and ATT&amp;CK references</h2>${ul([...(parent?[a(local(parent.id),`${parent.id} ${parent.name} — parent`)]:[]),...peers.map(r=>a(local(r.id),`${r.id} ${r.name}`)),...attack.map(r=>a('/ttp-simulation/'+r.page,`${r.id} ${r.name} — explicit ATLAS ATT&CK reference`))])}</section>
  <section class="im-detail"><h2 id="source-evidence">Source-backed defensive context</h2><h3>MITRE mitigations</h3>${ul(row.mitigations.map(r=>a('https://atlas.mitre.org/mitigations/'+r.id,`${r.id} ${r.name}`)))}<h3>MITRE case studies</h3>${ul(row.case_studies.map(r=>a('https://atlas.mitre.org/studies/'+r.id,`${r.id} ${r.name} · ${r.type}`)))}<p>These are explicit source relationships, not independently reproduced incidents or validated detection coverage.</p></section>
  ${renderAtlasEngineering(row)}
  <section class="im-detail"><h2 id="validation-boundary">Simulation and telemetry boundary</h2><p>This is a technique reference page, not a runnable simulation. No ATLAS-specific telemetry mapping, local attack execution or detector validation is asserted. MITRE maturity describes its source evidence, not a 1200km lab result.</p><p>For broader context—not technique-specific control mappings—see ${a('/cyber-knowledge/ai-security.html','AI Security')}, ${a('/ai-security-course.html','AI Security Course')}, and ${a('https://1200km.com/anomaly-detection-atlas/research/validation/','detection-validation methodology')}.</p>${related}</section>
  <section class="im-detail"><h2 id="provenance">Provenance and attribution</h2><p>${a(sources.atlas.source.url,'Immutable MITRE ATLAS source')} · ${a('/attack-matrix/provenance.json','Import provenance')} · ${a('/attack-matrix/atlas-notice.txt','Attribution and transformation notice')} · ${a('/attack-matrix/LICENSE-ATLAS.txt','Apache License 2.0')}</p><p>${h(sources.atlas.copyright)}. Source text and explicit relationships are retained; navigation, formatting and local links are provided by 1200km.</p>${ul(row.references.filter(r=>r.url&&/^https:\/\//.test(r.url)).map(r=>a(r.url,r.title||r.name||r.url)))}</section>`,{keywords:[row.id,row.name,'MITRE ATLAS','AI security',...row.platforms]});
}
output('attack-matrix/matrix-data.json',JSON.stringify(model)+'\n');
output('attack-matrix/provenance.json',JSON.stringify({imported_on:sources.imported_on,attack:sources.attack,atlas:{...sources.atlas,techniques:undefined,tactics:undefined}},null,2)+'\n');
if(changed.length)throw Error(`Interactive matrix is stale: ${changed.join(', ')}. Run npm run build-interactive-matrix.`);
console.log(`Interactive matrix ${check?'verified':'generated'}: ${model.records.length} technique pages linked; ${sources.atlas.techniques.length} local ATLAS references.`);
