import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('hygiene accepts only the exact documented AWS example and rejects another key-shaped value',()=>{
 const dir=mkdtempSync(join(tmpdir(),'log-hygiene-'));
 try{for(const name of ['index.html','privacy.html','robots.txt'])writeFileSync(join(dir,name),'Example');for(const name of ['sitemap.xml','feed.xml'])writeFileSync(join(dir,name),'<?xml version="1.0"?><urlset></urlset>');
 const scan=value=>{writeFileSync(join(dir,'sample.json'),JSON.stringify({accessKeyId:value}));return spawnSync(process.execPath,['scripts/check-deployable-hygiene.mjs','--site',dir],{encoding:'utf8'});};
 assert.equal(scan('AKIAIOSFODNN7EXAMPLE').status,0);
 const rejected=scan('AKIA'+'Z'.repeat(16));assert.equal(rejected.status,1);assert.match(rejected.stderr,/possible AWS access key/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
