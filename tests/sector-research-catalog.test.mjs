import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createContentItem,buildCatalog,VOCABULARIES} from '../scripts/content-catalog-lib.mjs';
const config=JSON.parse(readFileSync(new URL('../data/content-catalog.config.json',import.meta.url)));
const url='https://1200km.com/articles/read/2026/cyberattacks-on-big-pharma-and-its-ecosystem/';
test('clean-slug research retains reviewed scope and stable-reference lifecycle through both catalog passes',()=>{
 const html=`<html><head><title>Cyberattacks on Big Pharma and Its Ecosystem</title><link rel="canonical" href="${url}"><meta name="description" content="Evidence-based pharmaceutical cyberattack research"><meta property="article:published_time" content="2026-09-26"></head><body><h1>Cyberattacks on Big Pharma and Its Ecosystem</h1></body></html>`;
 const item=createContentItem({url,html},config);
 const final=buildCatalog([item],config).items[0];
 for(const row of [item,final]){
  assert.equal(row.primary_type,'article');
  assert.equal(row.primary_domain,'threat-intelligence');
  assert.ok(VOCABULARIES.primary_domains.includes(row.primary_domain));
  assert.equal(row.evidence_level,'source-backed');
  assert.equal(row.lifecycle,'stable-reference');
  assert.match(row.applies_to,/2026-09-25/);
  assert.ok(row.featured);assert.ok(row.audience.includes('cti-analyst'));
 }
});
