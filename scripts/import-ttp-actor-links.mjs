// Extract explicit actor -> software 'uses' edges from the pinned ATT&CK bundle.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/import-ttp-actor-links.mjs /path/to/pinned/enterprise.json');
const catalog=JSON.parse(readFileSync(join(root,'ttp-simulation/data/catalog.json')));
const source=catalog.source_manifest.sources.find(r=>r.file==='enterprise.json');
const bytes=readFileSync(input);
if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw Error('Input does not match the pinned ATT&CK enterprise source');
const bundle=JSON.parse(bytes);
const toolIds=new Set(JSON.parse(readFileSync(join(root,'ttp-simulation/data/tools.json'))).records.map(r=>r.id));
const groups=new Map(JSON.parse(readFileSync(join(root,'threat-matrix/mitre-data.json'))).groups.map(r=>[r.id,r]));
const active=o=>!o.revoked&&!o.x_mitre_deprecated;
const id=o=>o.external_references?.find(r=>r.source_name==='mitre-attack')?.external_id;
const objects=new Map(bundle.objects.filter(active).map(o=>[o.id,o]));
const records=[];
for(const r of bundle.objects){
 if(r.type!=='relationship'||r.relationship_type!=='uses'||!active(r))continue;
 const actor=objects.get(r.source_ref),tool=objects.get(r.target_ref);
 if(actor?.type!=='intrusion-set'||!['tool','malware'].includes(tool?.type))continue;
 const actorId=id(actor),toolId=id(tool);
 if(!groups.has(actorId)||!toolIds.has(toolId))continue;
 records.push({actor_id:actorId,actor_name:groups.get(actorId).name,tool_id:toolId,relationship_id:r.id,source_ref:r.source_ref,target_ref:r.target_ref,source_url:source.url,citations:(r.external_references||[]).filter(c=>c.url).map(c=>({title:c.source_name,url:c.url}))});
}
records.sort((a,b)=>a.tool_id.localeCompare(b.tool_id)||a.actor_id.localeCompare(b.actor_id));
writeFileSync(join(root,'ttp-simulation/data/actor-tool-links.json'),JSON.stringify({source,attack_commit:catalog.source_manifest.attack_commit,policy:'Active explicit intrusion-set uses selected software edges. No associations inferred through shared techniques.',records},null,2)+'\n');
console.log(`Imported ${records.length} exact actor-to-tool relationships from the hash-verified source.`);
