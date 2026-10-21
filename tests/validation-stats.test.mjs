import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collect, pages, update, writeTransaction } from '../scripts/update-validation-stats.mjs';
const root = path.resolve(import.meta.dirname, '..');
const previous = JSON.parse(readFileSync(path.join(root, 'assets/validation/stats.json')));
const now = new Date('2026-10-22T12:00:00Z');
function api(endpoint) {
 if (endpoint.startsWith('users/anpa1200/repos?')) return [{ name:'AIDebug',html_url:'https://github.com/anpa1200/AIDebug',fork:false,private:false,stargazers_count:20,forks_count:3 }];
 if (endpoint === 'users/anpa1200') return {followers:42,following:0,public_repos:1};
 if (endpoint.endsWith('/traffic/clones')) return {count:3,uniques:2,clones:[{timestamp:'2026-10-21T00:00:00Z',count:3,uniques:2}]};
 if (endpoint.endsWith('/releases/latest')) return {tag_name:endpoint.includes('AIDebug')?'v3.0.0':'v8.1.2'};
 if (endpoint.includes('/issues?')) return [{number:1},{number:2,pull_request:{url:'pr'}}];
 return {stargazers_count:20,watchers_count:20,subscribers_count:2,forks_count:3,open_issues_count:2,pushed_at:'2026-10-21T12:00:00Z'};
}
function fixture() {
 const dir=mkdtempSync(path.join(os.tmpdir(),'validation-test-'));
 mkdirSync(path.join(dir,'assets/validation'),{recursive:true});
 for (const file of ['external-validation.html','assets/validation/stats.json','assets/validation/clone-history.json','sitemap.xml','sitemap-all.xml','assets/validation/clone-traffic.json']) writeFileSync(path.join(dir,file),readFileSync(path.join(root,file)));
 return dir;
}
function bytes(dir) { return ['external-validation.html','assets/validation/stats.json','assets/validation/clone-history.json','sitemap.xml','sitemap-all.xml','assets/validation/clone-traffic.json'].map(file=>readFileSync(path.join(dir,file),'utf8')); }
test('subscribers differ from stars; actual issues exclude PRs; historical evidence is immutable',()=>{
 const original=structuredClone(previous);
 const result=collect(previous,api,now);
 assert.equal(result.repositories.aidebug.watchers,2);
 assert.equal(result.repositories.aidebug.open_issues,1);
 assert.equal(result.repositories.aidebug.open_pull_requests,1);
 for (const key of ['clone_traffic','github','gitlab','aidebug_distribution']) assert.deepEqual(result[key],previous[key]);
 assert.deepEqual(previous,original);
});
test('pagination retains later repository/issue pages',()=>{
 let calls=0;const result=pages('endpoint',()=>++calls===1?Array.from({length:100},(_,id)=>({id})):[{id:100}]);
 assert.equal(result.length,101);assert.equal(calls,2);
});
test('successful update renders consistent counters and preserves legacy clone records',()=>{
 const dir=fixture();try {
 const before=bytes(dir);update(dir,api,now);const after=bytes(dir);
 const oldHistory=JSON.parse(before[2]), newHistory=JSON.parse(after[2]);assert.deepEqual(newHistory.baseline,oldHistory.baseline);for(const [date,value] of Object.entries(oldHistory.days))if(date<=oldHistory.aggregate_only_through)assert.deepEqual(newHistory.days[date],value);assert.match(after[0],/data-validation="profile.followers">42<\/span>/);
 assert.equal(JSON.parse(after[1]).repositories.aidebug.watchers,2);
 assert.match(after[0],/AIDebug accepted into REMnux/);
 assert.match(after[0],/"dateModified": "2026-10-22"/);
 for(const index of [3,4]) assert.match(after[index],/<loc>https:\/\/1200km.com\/external-validation.html<\/loc>\s*<lastmod>2026-10-22<\/lastmod>/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('missing HTML marker fails before any file changes',()=>{
 const dir=fixture();try {
 const file=path.join(dir,'external-validation.html');writeFileSync(file,readFileSync(file,'utf8').replaceAll('data-validation="profile.followers"','data-missing="profile.followers"'));
 const before=bytes(dir);assert.throws(()=>update(dir,api,now),/Missing validation marker/);assert.deepEqual(bytes(dir),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('API failure and release boundary change never become zeros or partial updates',()=>{
 const dir=fixture();try {
 const before=bytes(dir);assert.throws(()=>update(dir,()=>{throw Error('unavailable');},now),/unavailable/);assert.deepEqual(bytes(dir),before);
 assert.throws(()=>update(dir,e=>e.endsWith('/releases/latest')?{tag_name:'v99'}:api(e),now),/requires an evidence/);assert.deepEqual(bytes(dir),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('failure on second rename rolls back first write and removes temporary files',()=>{
 const dir=fixture();try {
 const files=['external-validation.html','assets/validation/stats.json'].map(f=>path.join(dir,f));let calls=0;const before=bytes(dir);
 assert.throws(()=>writeTransaction(files.map(f=>[f,'changed']), (a,b)=>{if(++calls===2)throw Error('disk failure');renameSync(a,b);}),/disk failure/);
 assert.deepEqual(bytes(dir),before);assert.equal(readdirSync(path.join(dir,'assets/validation')).some(f=>f.endsWith('.tmp')),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
