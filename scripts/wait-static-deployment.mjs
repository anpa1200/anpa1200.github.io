#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const sha256=body=>createHash('sha256').update(body).digest('hex');

export async function waitForStaticDeployment({origin,identity,assets=[],fetcher=fetch,pause=ms=>new Promise(done=>setTimeout(done,ms)),attempts=60}) {
  const url=new URL(origin);
  assert.ok(url.protocol==='https:'&&url.hostname.endsWith('.workers.dev'));
  assert.equal(url.pathname,'/');assert.equal(url.search,'');assert.equal(url.hash,'');
  const deadline=Date.now()+300000;
  let last='No response';
  for(let attempt=0;attempt<attempts&&Date.now()<deadline;attempt++){
    try{
      const response=await fetcher(new URL(`/build.json?deployment_ready=${Date.now()}-${attempt}`,url),
        {redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
      last=`HTTP ${response.status}`;
      if(response.status===200){
        const actual=await response.json();
        if(isDeepStrictEqual(actual,identity)&&response.headers.has('cf-ray')&&response.headers.get('server')==='cloudflare'){
          // build.json can appear before every Static Asset has propagated.
          let ready=true;
          for(const asset of assets){
            const assetUrl=new URL(asset.path,url);
            assetUrl.searchParams.set('deployment_ready',`${Date.now()}-${attempt}`);
            const page=await fetcher(assetUrl,{redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
            const body=Buffer.from(await page.arrayBuffer());
            if(page.status!==200||sha256(body)!==sha256(asset.body)){
              last=`Asset not ready: ${asset.path} (HTTP ${page.status})`;
              ready=false;
              break;
            }
          }
          if(ready)return actual;
        }else last='Previous or unexpected deployment identity';
      }else await response.body?.cancel();
    }catch(error){last=error.message;}
    if(attempt+1<attempts&&Date.now()<deadline)await pause(5000);
  }
  throw Error(`Worker did not serve the exact validated build within the readiness window: ${last}`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2),option=flag=>{const i=args.indexOf(flag);assert.ok(i>=0&&args[i+1],flag);return args[i+1]};
  const site=resolve(option('--site'));
  const identity=JSON.parse(await readFile(join(site,'build.json'),'utf8'));
  const assets=await Promise.all([
    ['/','index.html'],
    ['/about.html','about.html'],
    ['/articles/','articles/index.html'],
    ['/ai-security-course/module-00/chapter-04.html','ai-security-course/module-00/chapter-04.html'],
  ].map(async([path,file])=>({path,body:await readFile(join(site,file))})));
  await waitForStaticDeployment({origin:option('--origin'),identity,assets});
  console.log(`Cloudflare deployment ready: ${identity.site_commit} ${identity.artifact_digest}`);
}
