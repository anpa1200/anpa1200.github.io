import assert from 'node:assert/strict';
import test from 'node:test';
import {transformReleaseHtml} from '../scripts/release-html-lib.mjs';

test('staged archive pages use the staged theme and ecosystem scripts',()=>{
 const scripts=['docusaurus-ecosystem','site-theme','theme-bootstrap'];
 const html='<html><head><title>Article</title>'+scripts.map(name=>`<script src="https://1200km.com/assets/${name}.js?v=test" defer></script>`).join('')+'</head><body><div id="__docusaurus"><main><article><h1>Article</h1><p>Evidence-backed article.</p></article></main></div></body></html>';
 const output=transformReleaseHtml(html,{canonical:'https://1200km.com/articles/read/example/',dateModified:'2026-09-26'});
 for(const script of scripts){
  assert.ok(output.includes(`src="/assets/${script}.js?v=test"`),script);
  assert.ok(!output.includes(`src="https://1200km.com/assets/${script}.js`),script);
 }
 assert.ok(output.includes('<div id="__docusaurus"><main><article><h1>Article</h1><p>Evidence-backed article.</p></article></main></div>'));
});
