#!/usr/bin/env node
// Regenerates source-derived engineering workbooks; never executes imported commands.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {collectionFixture,validateFixture,featureLenses} from '../ttp-simulation/assets/workbook-logic.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
const site=resolve(args.includes('--site')?args[args.indexOf('--site')+1]:ROOT),check=args.includes('--check'),changed=[];
const read=p=>JSON.parse(readFileSync(join(site,p),'utf8'));
const base='ttp-simulation/data/',catalog=read(base+'catalog.json'),source=read('data/ttp-workbook-sources.json');
const raw=new Map(source.records.map(r=>[r.key,r])),tools=read(base+'tools.json'),telemetry=read(base+'telemetry.json');
const sources=new Map(telemetry.records.map(r=>[r.id,read(base+`telemetry/${r.id}.json`)]));
const allTools=new Map(tools.records.map(r=>[r.id,read(base+`tools/${r.id}.json`)]));
function output(path,value){const body=typeof value==='string'?value:JSON.stringify(value)+'\n',file=join(site,path);if(existsSync(file)&&readFileSync(file,'utf8')===body)return;if(check){changed.push(path);return;}mkdirSync(dirname(file),{recursive:true});writeFileSync(file,body);}
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
if(JSON.stringify(source.source_manifest)!==JSON.stringify(catalog.source_manifest))throw Error('Workbook and catalog source snapshots differ');
const manifest=[];
const nmap=allTools.get('nmap');
const scanKeys=['enterprise/T1595','enterprise/T1595.001'];
for(const key of scanKeys){
  const row=read(base+'techniques/'+key+'.json');
  const evidence={basis:'editorial_capability',description:key.endsWith('.001')?'Nmap probes an explicit authorized IP target list; IP-block scanning requires a separately bounded multi-host lab. This is a capability mapping, not inherited T1046 coverage.':'Nmap TCP connect scanning implements active probing in a pre-compromise reconnaissance scenario. Internal post-compromise service discovery remains T1046.',source_url:'https://nmap.org/book/man-port-scanning-techniques.html',guide_id:nmap.guides[0].id,guide_url:nmap.guides[0].url,technique_url:row.source_url,reviewed_on:'2026-09-28'};
  const reference={id:nmap.id,name:nmap.name,page:nmap.page,kind:nmap.kind,bases:['editorial_capability'],evidence:[evidence]};
  row.attack_tools.references=row.attack_tools.references.filter(r=>r.id!==nmap.id);row.attack_tools.references.push(reference);
  const entry=catalog.records.find(r=>r.key===key);
  entry.tool_references=entry.tool_references.filter(r=>r.id!==nmap.id);entry.tool_references.push(reference);entry.tool_tags=[...new Set([...entry.tool_tags,nmap.name])].sort();
  const detection=read(base+'detections/'+key+'.json');detection.tool_references=entry.tool_references;
  output(base+'detections/'+key+'.json',detection);output(base+'techniques/'+key+'.json',row);
  nmap.techniques=nmap.techniques.filter(r=>r.key!==key);nmap.techniques.push({...Object.fromEntries(['key','id','name','domain','page','environments','platforms'].map(k=>[k,row[k]])),bases:['editorial_capability'],evidence:[evidence]});
  for(const ref of row.telemetry.references){const existing=nmap.telemetry_context.find(r=>r.id===ref.id);if(existing)existing.technique_keys=[...new Set([...existing.technique_keys,key])].sort();else nmap.telemetry_context.push({...ref,technique_keys:[key]});}
}
nmap.techniques.sort((a,b)=>a.key.localeCompare(b.key));nmap.telemetry_context.sort((a,b)=>a.id.localeCompare(b.id));
nmap.technique_count=nmap.techniques.length;nmap.bases=[...new Set(nmap.techniques.flatMap(r=>r.bases))].sort();nmap.mapped_environments=[...new Set(nmap.techniques.flatMap(r=>r.environments))].sort();
nmap.reviewed_on='2026-09-28';
output(base+'tools/nmap.json',nmap);
const toolSummary=tools.records.find(r=>r.id==='nmap');for(const key of ['technique_count','bases','mapped_environments'])toolSummary[key]=nmap[key];
tools.counts.tagged_techniques=catalog.records.filter(r=>r.tool_references.length).length;
tools.workbook_overlay={reviewed_on:'2026-09-28',source:'scripts/build-ttp-workbooks.mjs',scope:'Two explicit Nmap capability associations: T1595 and T1595.001. Existing pinned software relationships and original curation provenance are retained.'};
tools.counts.tool_technique_links=[...allTools.values()].reduce((n,t)=>n+t.techniques.length,0);
tools.counts.evidence_records={};
for(const tool of allTools.values())for(const row of tool.techniques)for(const evidence of row.evidence)tools.counts.evidence_records[evidence.basis]=(tools.counts.evidence_records[evidence.basis]||0)+1;
output(base+'tools.json',tools);
for(const summary of catalog.records){
  // Read the original source when checking, but join the reviewed Nmap overlay in memory.
  const row=read(base+'techniques/'+summary.key+'.json'),original=raw.get(row.key),det=read(base+'detections/'+row.key+'.json');
  row.simulation.label=original?.candidates.length?'Atomic candidate documented · not lab-validated':'No Atomic candidate · feasibility not ruled out';
  output(base+'techniques/'+row.key+'.json',row);
  if(!original||original.id!==row.id||original.stix_id!==row.source_stix_id||original.modified!==row.source_modified)throw Error('Source identity mismatch: '+row.key);
  const refs=summary.tool_references.map(r=>({...r,guides:allTools.get(r.id)?.guides||[]}));
  const collection=row.telemetry.references.map(ref=>{const s=sources.get(ref.id);if(!s)throw Error('Missing collection reference '+ref.id);return {...Object.fromEntries(['id','name','page','kind','category','description','collection_focus','providers','configuration','configuration_example','required_fields','example','example_note','limitations','sources'].map(k=>[k,s[k]])),association:ref.kind,anomaly_design:featureLenses[s.category]};});
  const workbook={schema_version:1,key:row.key,id:row.id,name:row.name,domain:row.domain,reviewed_on:'2026-09-28',
    source_url:row.source_url,source_file:catalog.source_manifest.sources.find(r=>r.file===row.domain+'.json'),source_object_sha256:digest(original),
    description:original.description,references:original.references,platforms:row.platforms,environments:row.environments,
    visibility:row.telemetry.visibility,visibility_note:det.visibility_note||row.telemetry.planning_note||null,
    parent:row.parent_id?catalog.records.find(r=>r.domain===row.domain&&r.id===row.parent_id):null,
    children:catalog.records.filter(r=>r.domain===row.domain&&r.parent_id===row.id).map(r=>({key:r.key,id:r.id,name:r.name,page:r.page})),
    telemetry:collection,detection:{...det,tool_references:refs},tools:refs,
    software:original.software,actors:original.actors,mitigations:original.mitigations,candidates:original.candidates,
    simulation:{atomic_status:original.candidates.length?'documented_candidate':'no_atomic_candidate',lab_execution:'not_run',browser_attack_runner:false,
      prerequisites:row.domain==='ics'?'Use a process simulator or isolated test rig with no connection to production controllers or physical actuators. Preserve safety interlocks; destructive effects require synthetic evidence, not real equipment damage.':row.domain==='mobile'?'Use owned test devices or emulators, disposable app accounts and test data. Verify platform/version instrumentation; desktop test procedures do not establish mobile coverage.':'Use disposable lab hosts and test accounts, explicit target allowlists, a clean snapshot, bounded egress and a restore plan. Review every candidate and dependency before any execution.',
      scenario:row.key==='enterprise/T1595'?'bounded_nmap_connect_scan':null},
    validation:{source_identity:'checked_against_pinned_source',relationship_join:'exact_ids_no_inheritance',page_contract:'automated_checks_required',sensor_capture:'not_run',detection_backend:'not_run',adversary_simulation:'not_run',independent_incident_fact_check:'not_performed'},
  };
  workbook.technique_links={};
  for(const match of JSON.stringify([original,det]).matchAll(/\/techniques\/(T\d{4})(?:\/(\d{3}))?/g)){
    const id=match[1]+(match[2]?'.'+match[2]:'');
    const target=catalog.records.find(r=>r.domain===row.domain&&r.id===id)||catalog.records.find(r=>r.domain==='enterprise'&&r.id===id)||catalog.records.find(r=>r.id===id);
    if(target)workbook.technique_links[id]='/ttp-simulation/'+target.page;
  }
  workbook.synthetic=collection.length?collectionFixture(workbook):null;
  if(workbook.synthetic&&!validateFixture(workbook.synthetic,workbook).passed)throw Error('Invalid collection fixture '+row.key);
  output(base+'workbooks/'+row.key+'.json',workbook);
  if(workbook.synthetic)output(base+'fixtures/'+row.key+'.json',workbook.synthetic);
  manifest.push({key:row.key,id:row.id,name:row.name,domain:row.domain,page:'/ttp-simulation/'+row.page,
    full_definition:!!original.description,detection_analytics:det.counts.analytics,sigma_sources:det.counts.sigma,
    anomaly_models:det.counts.atlas_anomaly,collection_contracts:collection.length,atomic_candidates:original.candidates.length,
    lab_tools:refs.length,documented_software:original.software.length,source_identity_checked:true,
    synthetic_collection_fixture:!!workbook.synthetic,live_attack_validation:false,production_detector_validation:false});
}
output(base+'catalog.json',catalog);
// CSV is an interoperability export: preserve columns and update only tool fields through regeneration.
const csvLines=readFileSync(join(site,base+'catalog.csv'),'utf8').trimEnd().split(/\r?\n/),header=csvLines[0];
const fields=header.split(',');
const csvCell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replaceAll('"','""')+'"';
// Existing catalog exports use a stable flat schema, all sourced from the summary records.
output(base+'catalog.csv',header+'\n'+catalog.records.map(r=>fields.map(k=>csvCell(r[k.replaceAll('"','')])).join(',')).join('\n')+'\n');
const atlas=read('data/interactive-matrix-sources.json');
for(const row of atlas.atlas.techniques)manifest.push({key:'atlas/'+row.id,id:row.id,name:row.name,domain:'atlas',page:`/attack-matrix/atlas/${row.id}/`,full_definition:!!row.description,explicit_mitigations:row.mitigations.length,case_studies:row.case_studies.length,source_identity_checked:true,live_attack_validation:false,production_detector_validation:false});
const counts={total:manifest.length,attack:catalog.records.length,atlas:atlas.atlas.techniques.length,with_collection_fixtures:manifest.filter(r=>r.synthetic_collection_fixture).length,with_atomic_candidates:manifest.filter(r=>r.atomic_candidates>0).length,with_lab_tool_associations:manifest.filter(r=>r.lab_tools>0).length,with_documented_software:manifest.filter(r=>r.documented_software>0).length,with_exact_anomaly_models:manifest.filter(r=>r.anomaly_models>0).length,live_validated_attacks:0};
output(base+'workbooks.json',{schema_version:1,reviewed_on:'2026-09-28',counts,scope:'All matrix destinations. Source identity and page completeness are not semantic review of every source claim or execution of every attack.',records:manifest});
if(changed.length)throw Error('Stale workbooks: '+changed.slice(0,12).join(', ')+` (${changed.length} files). Run npm run build-ttp-workbooks.`);
console.log(JSON.stringify({workbooks:counts,mode:check?'checked':'generated'}));
