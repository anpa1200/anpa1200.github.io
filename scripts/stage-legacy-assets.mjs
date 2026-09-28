#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { safeLegacyAsset } from './legacy-assets-lib.mjs';
const args=process.argv.slice(2), index=args.indexOf('--site');
assert.ok(index>=0&&args[index+1],'--site required');
const site=resolve(args[index+1]), root=resolve(import.meta.dirname,'..');
assert.notEqual(site,root,'Never stage compatibility assets over source');
const directory=join(root,'cloudflare/legacy-assets');
const manifest=JSON.parse(await readFile(join(directory,'legacy-assets.json'),'utf8'));
assert.equal(manifest.schema_version,1);
assert.match(manifest.archive,/^legacy-assets-\d{8}\.tar\.gz$/);
const hash=body=>createHash('sha256').update(body).digest('hex');
const archive=join(directory,manifest.archive);
assert.equal(hash(await readFile(archive)),manifest.archive_sha256,'Legacy snapshot hash mismatch');
const files=new Set(),archived=new Set();
for(const entry of manifest.files){
  assert.ok(safeLegacyAsset(entry.path),entry.path);assert.ok(!files.has(entry.path),'Duplicate legacy path');files.add(entry.path);
  assert.match(entry.sha256,/^[a-f0-9]{64}$/);assert.ok(entry.bytes>0&&entry.bytes<=25*1024*1024);
  assert.equal(typeof entry.archived,'boolean');if(entry.archived)archived.add(entry.path);
}
assert.ok(files.size>0&&files.size<30000);
// Validate both names and member types BEFORE extracting the committed blob.
// No links, special files, absolute paths, or undeclared archive members.
const listing=execFileSync('tar',['-tzf',archive,'--quoting-style=literal'],{encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n');
const directories=new Set(['.']);
for(const path of files){let dir=dirname(path);while(dir!=='.'){directories.add(dir);dir=dirname(dir);}}
const listedFiles=[];
for(const name of listing){
  assert.ok(name.startsWith('./'),name);const path=name.slice(2).replace(/\/$/,'')||'.';
  if(name.endsWith('/'))assert.ok(directories.has(path),`Unexpected directory ${name}`);
  else{assert.ok(archived.has(path),`Unexpected archive entry ${name}`);listedFiles.push(path);}
}
assert.equal(listedFiles.length,archived.size);assert.equal(new Set(listedFiles).size,archived.size);
const types=execFileSync('tar',['-tvzf',archive,'--quoting-style=literal'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n');
assert.ok(types.every(line=>/^[d-]/.test(line)),'Archive links or special members are forbidden');
const temporary=await mkdtemp(join(tmpdir(),'1200km-legacy-stage-'));
const added=[],reused=[];
try{
  execFileSync('tar',['-xzf',archive,'-C',temporary,'--no-same-owner','--no-same-permissions']);
  for(const entry of manifest.files){
    const source=join(temporary,entry.path),target=join(site,entry.path);
    if(!entry.archived){assert.ok(existsSync(target),`Previously published media missing; refresh compatibility snapshot: ${entry.path}`);assert.ok((await lstat(target)).isFile(),`Asset target collision: ${entry.path}`);reused.push({path:entry.path,sha256:hash(await readFile(target))});continue;}
    const metadata=await lstat(source);assert.ok(metadata.isFile()&&!metadata.isSymbolicLink());
    const body=await readFile(source);assert.equal(body.length,entry.bytes);assert.equal(hash(body),entry.sha256,entry.path);
    if(existsSync(target)){
      assert.ok((await lstat(target)).isFile(),`Asset target collision: ${entry.path}`);
      reused.push({path:entry.path,sha256:hash(await readFile(target))});continue;
    }
    await mkdir(dirname(target),{recursive:true});await cp(source,target);added.push({path:entry.path,sha256:entry.sha256});
  }
}finally{await rm(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
const evidence={schema_version:1,snapshot_sha256:manifest.archive_sha256,captured_at:manifest.captured_at,
  policy:'Add missing versioned legacy assets only; current validated assets take precedence. No runtime origin fallback.',added,reused};
await mkdir(join(site,'data'),{recursive:true});
await writeFile(join(site,'data/legacy-assets-provenance.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(`Legacy client compatibility: ${added.length} retained files, ${reused.length} current files; all ${files.size} old asset URLs available.`);
