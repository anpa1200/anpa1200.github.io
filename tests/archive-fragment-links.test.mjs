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
  mkdirSync(join(root,'cloudflare'));
  copyFileSync(new URL('../cloudflare/evidence-documents.js',import.meta.url),join(root,'cloudflare/evidence-documents.js'));
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
  mkdirSync(join(root,'cloudflare'));
  copyFileSync(new URL('../cloudflare/evidence-documents.js',import.meta.url),join(root,'cloudflare/evidence-documents.js'));
  copyFileSync(new URL('../scripts/check-links.mjs',import.meta.url),join(root,'scripts/check-links.mjs'));
  const check=(...args)=>spawnSync(process.execPath,[join(root,'scripts/check-links.mjs'),...args],{encoding:'utf8'});
  writeFileSync(join(root,'index.html'),'<a href="/anomaly-detection-atlas/">Atlas</a><a href="/anomaly-detection-atlas/research/">Research</a>');
  assert.equal(check().status,0,'source recognizes the independently published project');
  assert.equal(check('--site',root).status,1,'assembled site requires bundled sibling project files');
  const atlas=join(root,'anomaly-detection-atlas');mkdirSync(join(atlas,'research'),{recursive:true});
  writeFileSync(join(atlas,'index.html'),'<h1>Atlas</h1>');
  writeFileSync(join(atlas,'research/index.html'),'<h1>Research</h1>');
  assert.equal(check('--site',root).status,0,'assembled site accepts present sibling project files');
  writeFileSync(join(root,'index.html'),'<a href="/anomaly-detection-atlas-other/">Wrong prefix</a>');
  assert.equal(check().status,1,'similarly named local paths remain strict');
  writeFileSync(join(root,'index.html'),'<a href="/missing-local-page.html">Missing local file</a>');
  assert.equal(check('--site',root).status,1,'ordinary missing local files still fail');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('single-quoted links, srcset candidates and poster assets are checked without false old-domain warnings',()=>{
 const root=mkdtempSync(join(tmpdir(),'1200km-link-attributes-test-'));
 try{
  mkdirSync(join(root,'scripts'));
  mkdirSync(join(root,'cloudflare'));
  copyFileSync(new URL('../cloudflare/evidence-documents.js',import.meta.url),join(root,'cloudflare/evidence-documents.js'));
  copyFileSync(new URL('../scripts/check-links.mjs',import.meta.url),join(root,'scripts/check-links.mjs'));
  const check=()=>spawnSync(process.execPath,[join(root,'scripts/check-links.mjs'),'--site',root],{encoding:'utf8'});
  writeFileSync(join(root,'target.html'),'<h1 id="evidence">Evidence</h1>');
  writeFileSync(join(root,'first.webp'),'first');
  writeFileSync(join(root,'poster.jpg'),'poster');
  writeFileSync(join(root,'index.html'),[
   "<a href='/target.html#evidence'>Evidence</a>",
   '<a href="https://github.com/anpa1200/anpa1200.github.io/tree/main">Source repository</a>',
   '<img srcset="data:image/png;base64,AAAA 1x, /first.webp 2x, /missing.webp 3x">',
   "<video poster='/poster.jpg'></video>",
  ].join(''));
  let result=check();
  assert.equal(result.status,1);
  assert.match(result.stdout,/BROKEN internal links \/ missing files: 1/);
  assert.match(result.stdout,/missing\.webp/);
  assert.match(result.stdout,/OLD DOMAIN references \(anpa1200\.github\.io\): 0/);
  writeFileSync(join(root,'missing.webp'),'second');
  result=check();
  assert.equal(result.status,0);
  assert.match(result.stdout,/MISSING anchors \(#id not found in page\): 0/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
