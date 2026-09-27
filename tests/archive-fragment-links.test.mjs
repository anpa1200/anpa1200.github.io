import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('archive fragments are deferred in source and strictly validated in the assembled site',()=>{
 const root=mkdtempSync(join(tmpdir(),'1200km-fragment-test-'));
 try{
  mkdirSync(join(root,'scripts'));
  copyFileSync(new URL('../scripts/check-links.mjs',import.meta.url),join(root,'scripts/check-links.mjs'));
  writeFileSync(join(root,'index.html'),'<a href="/articles/read/2026/example/#evidence">Research</a>');
  const check=(...args)=>spawnSync(process.execPath,[join(root,'scripts/check-links.mjs'),...args],{encoding:'utf8'});
  assert.equal(check().status,0,'source defers separately built archive fragments');
  assert.equal(check('--site',root).status,1,'assembled site rejects missing archive page');
  const article=join(root,'articles/read/2026/example');mkdirSync(article,{recursive:true});
  writeFileSync(join(article,'index.html'),'<h1 id="wrong">Research</h1>');
  assert.equal(check('--site',root).status,1,'assembled site rejects missing fragment');
  writeFileSync(join(article,'index.html'),'<h1 id="evidence">Research</h1>');
  assert.equal(check('--site',root).status,0,'assembled site accepts an existing fragment');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('Atlas sidebar routes use the separately published project without masking broken local links',()=>{
 const root=mkdtempSync(join(tmpdir(),'1200km-sidebar-project-test-'));
 try{
  mkdirSync(join(root,'scripts'));
  copyFileSync(new URL('../scripts/check-links.mjs',import.meta.url),join(root,'scripts/check-links.mjs'));
  const check=(...args)=>spawnSync(process.execPath,[join(root,'scripts/check-links.mjs'),...args],{encoding:'utf8'});
  writeFileSync(join(root,'index.html'),'<a href="/anomaly-detection-atlas/">Atlas</a><a href="/anomaly-detection-atlas/research/">Research</a>');
  assert.equal(check().status,0,'source recognizes the independently published project');
  assert.equal(check('--site',root).status,0,'main-site artifacts do not contain sibling project files');
  writeFileSync(join(root,'index.html'),'<a href="/anomaly-detection-atlas-other/">Wrong prefix</a>');
  assert.equal(check().status,1,'similarly named local paths remain strict');
  writeFileSync(join(root,'index.html'),'<a href="/missing-local-page.html">Missing local file</a>');
  assert.equal(check('--site',root).status,1,'ordinary missing local files still fail');
 }finally{rmSync(root,{recursive:true,force:true});}
});
