#!/usr/bin/env node
// One-time, read-only migration capture. Outputs are reviewed and committed;
// deployment never fetches these files from the retired production origin.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'parse5';
import { safeLegacyAsset, webpackChunks, packLegacySnapshot } from './legacy-assets-lib.mjs';
const args = process.argv.slice(2);
const option = (flag) => { const i=args.indexOf(flag); assert.ok(i>=0 && args[i+1], flag); return resolve(args[i+1]); };
const baseline = option('--baseline'), output = option('--output'), site = option('--site');
const workspace = await mkdtemp(join(tmpdir(), '1200km-legacy-capture-'));
const manifest = JSON.parse(await readFile(new URL('../cloudflare/companion-sites.json', import.meta.url), 'utf8'));
const hash = (body) => createHash('sha256').update(body).digest('hex');
const files = new Map();
const pending = [];
function enqueue(path) { assert.ok(safeLegacyAsset(path), `Unsafe legacy asset: ${path}`); if (!files.has(path)) { files.set(path, null); pending.push(path); } }
async function fetchBody(path) {
  const response = await fetch(`https://1200km.com/${path}`, {signal:AbortSignal.timeout(30_000)});
  assert.equal(response.status, 200, path);
  assert.ok(!response.headers.get('content-type')?.startsWith('text/html'), `Asset returned HTML: ${path}`);
  const body=Buffer.from(await response.arrayBuffer());
  assert.ok(body.length <= 25*1024*1024 && body.length>0, `Asset size: ${path}`);
  return body;
}
for (const entry of manifest.filter((entry) => entry.kind === 'docusaurus')) {
  const origin = `https://1200km.com/${entry.mount}/`;
  const response = await fetch(origin, {signal:AbortSignal.timeout(30_000)});
  assert.equal(response.status, 200, origin);
  const document=parse(await response.text());
  function visit(node) {
    const attrs=Object.fromEntries((node.attrs||[]).map(({name,value})=>[name,value]));
    const ref=node.tagName==='script'?attrs.src:node.tagName==='link'&&attrs.rel==='stylesheet'?attrs.href:null;
    if(ref){const url=new URL(ref,origin);const path=url.pathname.slice(1);if(url.origin==='https://1200km.com'&&path.startsWith(`${entry.mount}/assets/`))enqueue(path);}
    for(const child of node.childNodes||[])visit(child);
  }
  visit(document);
}
// Bounded parallelism; runtime tables discover every lazy JavaScript chunk,
// not only the home-page chunks that happen to load in a smoke test.
while (pending.length) {
  const batch=pending.splice(0,8);
  await Promise.all(batch.map(async(path)=>{
    const body=await fetchBody(path), mount=path.split('/')[0];
    files.set(path,{path,sha256:hash(body),bytes:body.length,source:`https://1200km.com/${path}`});
    await mkdir(dirname(join(workspace,path)),{recursive:true});await writeFile(join(workspace,path),body);
    if(/\/runtime~main\.[a-f0-9]+\.js$/.test(path))for(const chunk of webpackChunks(body.toString(),mount))enqueue(chunk);
    if(/\.(?:js|css)$/.test(path))for(const match of body.toString().matchAll(/["'(](assets\/(?:images|media)\/[A-Za-z0-9_.~%/-]+\.(?:png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|otf))["')]/g))enqueue(`${mount}/${match[1]}`);
  }));
  assert.ok(files.size<10000,'Unexpected legacy asset expansion');
  console.log(`Captured ${[...files.values()].filter(Boolean).length} assets; ${pending.length} queued`);
}
async function baselineAssets(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory()){await baselineAssets(path);continue;}
    assert.ok(entry.isFile(),'Nonregular Pagefind asset');
    const rel=relative(baseline,path).replaceAll('\\','/');
    if(!safeLegacyAsset(rel)||files.has(rel)||!(rel.startsWith('pagefind/')||/\/assets\/(?:js|css)\//.test(rel)))continue;
    const body=await readFile(path);await mkdir(dirname(join(workspace,rel)),{recursive:true});await writeFile(join(workspace,rel),body);
    files.set(rel,{path:rel,sha256:hash(body),bytes:body.length,source:`github-actions:36406794449/${rel}`});
  }
}
await baselineAssets(baseline);
console.log(JSON.stringify({output,workspace,...await packLegacySnapshot({files:[...files.values()],workspace,output,site})}));
