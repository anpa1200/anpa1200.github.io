import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {atlas,atlasFamiliesForTechnique,atlasFamiliesForTelemetry,withAtlasSnapshotNotice} from '../scripts/anomaly-atlas-lib.mjs';
import {anomalyTagsForUrl} from '../scripts/anomaly-tags-lib.mjs';
test('every operational family has a real topic identity and a reciprocal collection route',()=>{
 assert.equal(atlas.families.length,15);
 for(const f of atlas.families){assert.deepEqual(anomalyTagsForUrl(f.url),[f.tag]);for(const id of f.telemetry){assert.ok(atlasFamiliesForTelemetry(id).includes(f));const page=readFileSync(new URL('../ttp-simulation/telemetry/'+id+'/index.html',import.meta.url),'utf8');assert.ok(page.includes(f.url));}}
});
test('exact enterprise identities connect models without forcing other domains or retired identifiers',()=>{
 assert.ok(atlasFamiliesForTechnique('enterprise/T1059.001').some(f=>f.id==='parent-child'));
 assert.deepEqual(atlasFamiliesForTechnique('mobile/T1059.001'),[]);
 assert.deepEqual(atlasFamiliesForTechnique('enterprise/T9999'),[]);
 const page=readFileSync(new URL('../ttp-simulation/detections/enterprise/T1059.001/index.html',import.meta.url),'utf8');assert.ok(page.includes('/families/parent-child/'));
});
test('publication compatibility notice is bounded and idempotent',()=>{
 const before='<html><head></head><body><div id="__docusaurus"><main><article><h1 id="old">Research</h1><p id="preserved">Evidence.</p></article></main></div></body></html>';
 const after=withAtlasSnapshotNotice(before);assert.ok(after.includes('id="preserved"'));assert.equal(withAtlasSnapshotNotice(after),after);assert.ok(after.includes('Publication snapshot.'));assert.ok(after.includes('/anomaly-detection-atlas/research/'));
 assert.ok(after.indexOf('data-atlas-publication-snapshot')<after.indexOf('id="__docusaurus"'));
 assert.ok(after.includes('<link rel="stylesheet" href="/assets/anomaly-tags.css'));
 assert.throws(()=>withAtlasSnapshotNotice('<main>No hydration root</main>'));
});

test('source-rendered article notice stays inside its hydration tree without duplication',()=>{
 const source='<html><head></head><body><div id="__docusaurus"><main><article><h1 id="old">Research</h1><aside data-atlas-publication-snapshot="true">Maintained version in the Atlas.</aside><p id="preserved">Evidence.</p></article></main></div></body></html>';
 const after=withAtlasSnapshotNotice(source);
 assert.equal((after.match(/data-atlas-publication-snapshot/g)||[]).length,1);
 assert.ok(after.indexOf('id="__docusaurus"')<after.indexOf('data-atlas-publication-snapshot'));
 assert.ok(after.includes('<p id="preserved">Evidence.</p>'));
 assert.equal(withAtlasSnapshotNotice(after),after);
});
