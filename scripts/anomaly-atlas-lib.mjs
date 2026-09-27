import {readFileSync} from 'node:fs';
export const atlas=JSON.parse(readFileSync(new URL('../data/anomaly-atlas.json',import.meta.url)));
export const atlasFamilyAssignments=atlas.families.map(f=>({url:f.url,evidence:[{tag:f.tag}]}));
export function atlasFamiliesForTechnique(key){
 if(!key?.startsWith('enterprise/'))return [];
 const id=key.split('/')[1];
 const models=atlas.models.filter(m=>m.technique===id).map(m=>m.id);
 return atlas.families.filter(f=>f.techniques.includes(id)||f.models.some(m=>models.includes(m)));
}
export function atlasFamiliesForTelemetry(id){return atlas.families.filter(f=>f.telemetry.includes(id));}
export const snapshotNotice='<aside data-atlas-publication-snapshot="true" class="anomaly-atlas-notice"><strong>Publication snapshot.</strong> This full-length edition and its anchors remain available for citations. Continue in the <a href="https://1200km.com/anomaly-detection-atlas/research/">unified Anomaly Detection Atlas</a> for focused research chapters, <a href="https://1200km.com/anomaly-detection-atlas/families/">family pages</a>, <a href="https://1200km.com/anomaly-detection-atlas/attack-statistical-anomaly-mapping/">models</a>, and the <a href="https://1200km.com/anomaly-detection-atlas/visuals/">visual index</a>. Integration does not imply a new incident audit or production validation.</aside>';
export function withAtlasSnapshotNotice(html){
 // Keep the notice outside React's hydration root so it is neither removed nor
 // reinserted after first paint. Existing article markup and anchors stay intact.
 const root=/(<div\b[^>]*\bid=["']__docusaurus["'][^>]*>)/i;
 if(!root.test(html))throw Error('Snapshot hydration root is missing');
 const notice=snapshotNotice.replace('<aside ', '<aside aria-label="Publication snapshot" ');
 let result=html.replace(/<aside\b[^>]*data-atlas-publication-snapshot[^>]*>[\s\S]*?<\/aside>/g,'').replace(root,notice+'$1');
 if(!/<link\b[^>]*href=["'][^"']*\/assets\/anomaly-tags\.css/.test(result))result=result.replace('</head>','<link rel="stylesheet" href="/assets/anomaly-tags.css?v=20260927-1"></head>');
 return result;
}
