import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {atlas,withAtlasSnapshotNotice} from './anomaly-atlas-lib.mjs';
const args=process.argv.slice(2),i=args.indexOf('--site');
const root=resolve(i>=0?args[i+1]:import.meta.dirname+'/..');
const path=resolve(root,'.'+new URL(atlas.publication_snapshot).pathname,'index.html');
if(existsSync(path)){
 const before=readFileSync(path,'utf8'),after=withAtlasSnapshotNotice(before);
 if(!after.includes('data-atlas-publication-snapshot'))throw Error('Snapshot notice insertion failed');
 if(before!==after){if(args.includes('--check'))throw Error('Stale Atlas publication notice');writeFileSync(path,after);}
 console.log('Preserved original publication and added unified Atlas navigation.');
}else if(args.includes('--require-archive'))throw Error('Expected built article archive');
const hubMarkup='<!-- anomaly-atlas:start --><section id="anomaly-atlas" class="ttp-ecosystem-links"><h2>Anomaly Detection Atlas</h2><p>Start with <a href="https://1200km.com/anomaly-detection-atlas/research/worked-password-spray/">password spraying</a>, <a href="https://1200km.com/anomaly-detection-atlas/research/worked-saas-downloads/">SaaS downloads</a>, or the <a href="https://1200km.com/anomaly-detection-atlas/research/worked-kerberoasting/">Kerberoasting zero-match</a>. Follow the unified research from <a href="https://1200km.com/anomaly-detection-atlas/research/">statistical-signal foundations and documented incidents</a> to <a href="https://1200km.com/anomaly-detection-atlas/families/">operational anomaly families</a>, <a href="https://1200km.com/anomaly-detection-atlas/attack-statistical-anomaly-mapping/">measurable models</a>, <a href="https://1200km.com/anomaly-detection-atlas/research/telemetry/">collection contracts</a>, and <a href="https://1200km.com/anomaly-detection-atlas/research/validation/">validation limits</a>. The <a href="https://1200km.com/anomaly-detection-atlas/visuals/">visual index</a> connects all 55 current figures to their evidence and text equivalents.</p><p>Use these references alongside the <a href="/ttp-simulation/detections/">Detection Rules</a>, <a href="/ttp-simulation/telemetry/">Telemetry Library</a>, and <a href="/ttp-simulation/">Attack Simulations</a> modules. Source evidence and documented procedures do not establish production detector performance.</p></section><!-- anomaly-atlas:end -->';
for(const name of ['guides.html','projects.html','labs.html','cti.html','cyber-knowledge/blue-team.html']){
 const file=resolve(root,name);if(!existsSync(file))throw Error('Missing ecosystem hub '+name);
 const before=readFileSync(file,'utf8');const after=before.replace(/<!-- anomaly-atlas:start -->[\s\S]*?<!-- anomaly-atlas:end -->/g,'').replace('</main>',hubMarkup+'</main>');
 if(!after.includes(hubMarkup))throw Error('Cannot integrate Atlas into '+name);
 if(args.includes('--check')){if(before!==after)throw Error('Stale Atlas hub '+name);}else if(before!==after)writeFileSync(file,after);
}
