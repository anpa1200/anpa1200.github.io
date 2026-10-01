#!/usr/bin/env node
import fs from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {createVocabularyValidator} from './schema-vocabulary-validator.mjs';
const args=process.argv.slice(2),opt=k=>args[args.indexOf(k)+1];
if(!args.includes('--site')||!args.includes('--vocabulary')||!args.includes('--output'))throw Error('--site, --vocabulary and --output required');
const site=resolve(opt('--site')),root=resolve(import.meta.dirname,'..'),out=resolve(opt('--output'));
fs.mkdirSync(out,{recursive:true});
const vocabulary=fs.readFileSync(opt('--vocabulary'),'utf8'),validate=createVocabularyValidator(JSON.parse(vocabulary));
const policy=JSON.parse(fs.readFileSync(join(root,'data/seo-policy.json'))).pages;
const baseline=JSON.parse(fs.readFileSync(join(root,'reports/technical-seo-20260920/before/pages.json')));
const excluded=new Set(['.git','node_modules','scripts','tests','pagefind','.cache']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>excluded.has(e.name)||(dir===site&&e.name==='reports')?[]:e.isDirectory()?walk(join(dir,e.name)):e.name.endsWith('.html')?[join(dir,e.name)]:[]);}
const pages=[],schema=[],failures=[],warnings=[],duplicates={title:new Map(),description:new Map()};
for(const file of walk(site)){
  const rel=relative(site,file);let url='https://1200km.com/'+rel.replace(/(?:^|\/)index\.html$/,m=>m.startsWith('/')?'/':'');
  const html=fs.readFileSync(file,'utf8'),$=load(html,{scriptingEnabled:false}),canonical=$('link[rel="canonical"]').attr('href')||'',robots=$('meta[name="robots"]').attr('content')||'';
  if (/^https:\/\/1200km.com\/(?:Hexstrike-AI-guide|ai-vs-defense)\//.test(url) && url.endsWith('.html') && canonical === url.slice(0,-5)) url = canonical;
  const indexable=canonical===url&&!/noindex/i.test(robots)&&!$('meta[http-equiv="refresh"]').length;
  const page={url,rel,indexable,canonical,robots,title:$('head > title').text(),description:$('meta[name="description"]').attr('content')||'',h1:$('h1').length,lang:$('html').attr('lang'),links:$('a[href]').toArray().map(e=>{try{return new URL($(e).attr('href'),url).href.split('#')[0].split('?')[0]}catch{return ''}})};
  pages.push(page);
  const blocks=[];
  $('script[type="application/ld+json"]').each((i,e)=>{try{blocks.push(JSON.parse($(e).text()))}catch(error){failures.push(`${rel}: invalid JSON-LD block ${i}: ${error.message}`)}});
  if(blocks.length){const result=validate({'@context':'https://schema.org','@graph':blocks.flatMap(b=>b['@graph']||[b])});schema.push({url,blocks:blocks.length,...result});for(const failure of result.failures)failures.push(`${rel}: ${failure}`);}
  if(!indexable)continue;
  if(page.h1!==1)failures.push(`${rel}: ${page.h1} H1 elements`);
  if(!page.lang)failures.push(`${rel}: missing lang`);
  if(!blocks.length)failures.push(`${rel}: no JSON-LD`);
  if(!/max-image-preview:large/.test(robots))failures.push(`${rel}: missing large image preview directive`);
  for(const [key,min,max] of [['title',30,60],['description',120,155]]){
    if(page[key].length<min||page[key].length>max)failures.push(`${rel}: ${key} length ${page[key].length}`);
    if(duplicates[key].has(page[key]))failures.push(`${rel}: duplicate ${key} with ${duplicates[key].get(page[key])}`);else duplicates[key].set(page[key],rel);
  }
  if(policy[new URL(url).pathname]?.classification==='Thin')failures.push(`${rel}: Thin page remains indexable`);
}
const byUrl=new Map(pages.map(p=>[p.url,p])), inbound=new Map();
for (const [path, entry] of Object.entries(policy)) {
  if (['Priority','Supporting'].includes(entry.classification) && !byUrl.get('https://1200km.com'+path)?.indexable) failures.push(`${path}: reviewed ${entry.classification} route is missing or unexpectedly nonindexable`);
}
for(const p of pages)for(const target of new Set(p.links)){if(target!==p.url){const sources=inbound.get(target)||new Set();sources.add(p.url);inbound.set(target,sources)}}
const sitemap=[...fs.readFileSync(join(site,'sitemap.xml'),'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
for(const url of sitemap)if(!byUrl.get(url)?.indexable)failures.push(`${url}: sitemap URL is not a locally rendered indexable canonical page`);
const orphans=pages.filter(p=>p.indexable&&['Priority','Supporting'].includes(policy[new URL(p.url).pathname]?.classification)&&!inbound.get(p.url)?.size);
for(const p of orphans)failures.push(`${p.rel}: no inbound link`);
const before=baseline.filter(p=>p.status===200&&p.content_type.includes('html')).map(p=>p.url).sort();
const missing=before.filter(url=>{const path=new URL(url).pathname;return !fs.existsSync(join(site,path))&&!fs.existsSync(join(site,path,'index.html'))&&!fs.existsSync(join(site,path+'.html'))});
for(const url of missing)failures.push(`${url}: previously available URL has no build file`);
const report={scope:'Rendered local build; file existence is not live HTTP or hosted Schema.org validator proof.',vocabulary_sha256:createHash('sha256').update(vocabulary).digest('hex'),html_files:pages.length,indexable_pages:pages.filter(p=>p.indexable).length,sitemap_urls:sitemap.length,schema_documents:schema.length,schema_blocks:schema.reduce((n,p)=>n+p.blocks,0),schema_failures:schema.filter(p=>!p.valid).length,orphans:orphans.map(p=>p.url),missing_published_urls:missing,failures,warnings};
fs.writeFileSync(join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(join(out,'schema-validation.json'),JSON.stringify(schema,null,2)+'\n');
fs.writeFileSync(join(out,'urls-before.txt'),before.join('\n')+'\n');
fs.writeFileSync(join(out,'urls-after.txt'),before.filter(u=>!missing.includes(u)).join('\n')+'\n');
console.log(JSON.stringify({...report,failures:failures.slice(0,40)},null,2));
if(failures.length)process.exitCode=1;
