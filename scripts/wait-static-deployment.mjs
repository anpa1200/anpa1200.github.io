#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export async function waitForStaticDeployment({origin,identity,fetcher=fetch,pause=ms=>new Promise(done=>setTimeout(done,ms)),attempts=60}) {
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
        if(isDeepStrictEqual(actual,identity)&&response.headers.has('cf-ray')&&response.headers.get('server')==='cloudflare')return actual;
        last='Previous or unexpected deployment identity';
      }else await response.body?.cancel();
    }catch(error){last=error.message;}
    if(attempt+1<attempts&&Date.now()<deadline)await pause(5000);
  }
  throw Error(`Worker did not serve the exact validated build within the readiness window: ${last}`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2),option=flag=>{const i=args.indexOf(flag);assert.ok(i>=0&&args[i+1],flag);return args[i+1]};
  const identity=JSON.parse(await readFile(join(resolve(option('--site')),'build.json'),'utf8'));
  await waitForStaticDeployment({origin:option('--origin'),identity});
  console.log(`Cloudflare deployment ready: ${identity.site_commit} ${identity.artifact_digest}`);
}
