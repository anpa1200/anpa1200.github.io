import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { safeLegacyAsset, webpackChunks } from '../scripts/legacy-assets-lib.mjs';
import { waitForStaticDeployment } from '../scripts/wait-static-deployment.mjs';

test('legacy runtime filename maps are parsed as literals without executing code',()=>{
  assert.deepEqual(webpackChunks('r.u=e=>"assets/js/"+({12:"abcd"}[e]||e)+"."+{12:"ffff",34:"eeee"}[e]+".js"','docs'),['docs/assets/js/abcd.ffff.js','docs/assets/js/34.eeee.js']);
  assert.deepEqual(webpackChunks('r.u=e=>"assets/js/"+(({12:"abcd"})[e]||e)+"."+({12:"ffff"})[e]+".js"','docs'),['docs/assets/js/abcd.ffff.js']);
  assert.deepEqual(webpackChunks('r.u=e=>"assets/js/common.abcd.js"','docs'),['docs/assets/js/common.abcd.js']);
  assert.throws(()=>webpackChunks('r.u=e=>executeArbitraryCode(e)','docs'));
});
test('legacy snapshots cannot introduce HTML, control files, or path traversal',()=>{
  for(const path of ['docs/assets/js/runtime~main.abcd.js','pagefind/fragment/en_abcd.pf_fragment','pagefind/filter/en_abcd.pf_filter'])assert.equal(safeLegacyAsset(path),true);
  for(const path of ['../index.html','docs/assets/js/../../x.js','/docs/assets/js/a.js','docs/assets/js/%2e%2e/x.js','_headers','docs/assets/js/x.html'])assert.equal(safeLegacyAsset(path),false);
});
test('committed compatibility blob and complete inventory are hash-pinned',()=>{
  const base=new URL('../cloudflare/legacy-assets/',import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL('legacy-assets.json',base),'utf8'));
  assert.equal(manifest.schema_version,1);assert.ok(manifest.files.length>9000&&manifest.files.length<20000);
  assert.ok(manifest.files.some(entry=>entry.path==='articles/assets/js/main.bee4d950.js'));
  assert.equal(manifest.files.filter(entry=>entry.path.startsWith('pagefind/filter/')&&entry.path.endsWith('.pf_filter')).length,29,'Every frozen-production search filter must be retained');
  assert.equal(new Set(manifest.files.map(entry=>entry.path)).size,manifest.files.length);
  assert.ok(manifest.files.every(entry=>safeLegacyAsset(entry.path)&&/^[a-f0-9]{64}$/.test(entry.sha256)&&typeof entry.archived==='boolean'));
  assert.equal(createHash('sha256').update(readFileSync(new URL(manifest.archive,base))).digest('hex'),manifest.archive_sha256);
});
test('deployment readiness rejects provider 404s and older builds before accepting exact identity',async()=>{
  const identity={site_commit:'a'.repeat(40),artifact_digest:'sha256:'+ 'b'.repeat(64)};let calls=0;
  const headers={'server':'cloudflare','cf-ray':'test'};
  const fetcher=async()=>{calls++;return calls===1?new Response('not provisioned',{status:404}):new Response(JSON.stringify(calls===2?{site_commit:'old'}:identity),{headers});};
  assert.deepEqual(await waitForStaticDeployment({origin:'https://1200km-site-preview.1200km.workers.dev',identity,fetcher,pause:async()=>{},attempts:3}),identity);assert.equal(calls,3);
  await assert.rejects(waitForStaticDeployment({origin:'https://1200km-site-preview.1200km.workers.dev',identity,fetcher:async()=>new Response('no',{status:404}),pause:async()=>{},attempts:2}),/readiness window/);
});
test('deployment readiness waits for representative asset bytes after build identity changes',async()=>{
  const identity={site_commit:'a'.repeat(40),artifact_digest:'sha256:'+ 'b'.repeat(64)};
  const headers={'server':'cloudflare','cf-ray':'test'};
  let assetCalls=0;
  const fetcher=async(url)=>url.pathname==='/build.json'
    ?new Response(JSON.stringify(identity),{headers})
    :new Response(++assetCalls===1?'old page':'new page',{headers});
  const assets=[{path:'/about.html',body:Buffer.from('new page')}];
  assert.deepEqual(await waitForStaticDeployment({origin:'https://1200km-site-preview.1200km.workers.dev',identity,assets,fetcher,pause:async()=>{},attempts:3}),identity);
  assert.equal(assetCalls,2);
  await assert.rejects(waitForStaticDeployment({origin:'https://1200km-site-preview.1200km.workers.dev',identity,assets,fetcher:async(url)=>url.pathname==='/build.json'?new Response(JSON.stringify(identity),{headers}):new Response('old page',{headers}),pause:async()=>{},attempts:2}),/Asset not ready: \/about.html/);
});
