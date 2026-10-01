import {readFileSync} from 'node:fs';
export const atlas=JSON.parse(readFileSync(new URL('../data/anomaly-atlas.json',import.meta.url)));
export const atlasSearchUrls=[...new Set(['https://1200km.com/anomaly-detection-atlas/', 'https://1200km.com/anomaly-detection-atlas/research/', 'https://1200km.com/anomaly-detection-atlas/families/', 'https://1200km.com/anomaly-detection-atlas/visuals/', 'https://1200km.com/anomaly-detection-atlas/research/provenance/', ...atlas.pages.map(p=>p.url)])];
export const atlasFamilyAssignments=atlas.families.map(f=>({url:f.url,evidence:[{tag:f.tag}]}));
export const atlasWorkedAssignments=atlas.pages.filter(p=>p.id.startsWith('worked-')).map(p=>({url:p.url,evidence:p.tags.map(tag=>({tag}))}));
export function atlasFamiliesForTechnique(key){
 if(!key?.startsWith('enterprise/'))return [];
 const id=key.split('/')[1];
 const models=atlas.models.filter(m=>m.technique===id).map(m=>m.id);
 return atlas.families.filter(f=>f.techniques.includes(id)||f.models.some(m=>models.includes(m)));
}
export function atlasFamiliesForTelemetry(id){return atlas.families.filter(f=>f.telemetry.includes(id));}
export const snapshotNotice='<aside data-atlas-publication-snapshot="true" class="anomaly-atlas-notice"><strong>Publication snapshot.</strong> Revised 21 September 2026; consolidated 27 September 2026. This full-length edition and its anchors remain available for citations. The maintained version is the <a href="https://1200km.com/anomaly-detection-atlas/research/">unified Anomaly Detection Atlas</a> for focused research chapters, <a href="https://1200km.com/anomaly-detection-atlas/families/">family pages</a>, <a href="https://1200km.com/anomaly-detection-atlas/attack-statistical-anomaly-mapping/">models</a>, and the <a href="https://1200km.com/anomaly-detection-atlas/visuals/">visual index</a>. Start with <a href="https://1200km.com/anomaly-detection-atlas/research/worked-password-spray/">password spraying</a>, <a href="https://1200km.com/anomaly-detection-atlas/research/worked-saas-downloads/">SaaS downloads</a>, or the <a href="https://1200km.com/anomaly-detection-atlas/research/worked-kerberoasting/">Kerberoasting zero-match</a>. Integration does not imply a new incident audit or production validation.</aside>';
export function withAtlasSnapshotNotice(html){
 // Keep the notice outside React's hydration root so it is neither removed nor
 // reinserted after first paint. Existing article markup and anchors stay intact.
 const root=/(<div\b[^>]*\bid=["']__docusaurus["'][^>]*>)/i;
 if(!root.test(html))throw Error('Snapshot hydration root is missing');
 const notice=snapshotNotice.replace('<aside ', '<aside aria-label="Publication snapshot" ');
 // A source-rendered notice belongs to the hydrated article and must stay there.
 const rootPosition=html.search(root),noticePosition=html.search(/<aside\b[^>]*data-atlas-publication-snapshot/);
 const sourceNotice=noticePosition>rootPosition;
 let result=sourceNotice?html:html.replace(/<aside\b[^>]*data-atlas-publication-snapshot[^>]*>[\s\S]*?<\/aside>/g,'').replace(root,notice+'$1');
 if(!/<link\b[^>]*href=["'][^"']*\/assets\/anomaly-tags\.css/.test(result))result=result.replace('</head>','<link rel="stylesheet" href="/assets/anomaly-tags.css?v=20260927-1"></head>');
 return result;
}
