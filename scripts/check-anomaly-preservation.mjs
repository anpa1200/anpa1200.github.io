#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const baseline = 'b153d8464a9c97c02e83d558e8b067389a4f1413';
const git = args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const old = JSON.parse(git(['show',`${baseline}:data/content-catalog.json`]));
const current = JSON.parse(readFileSync(resolve(root,'data/content-catalog.json')));
const withoutTags = item=>{const {tags,...identity}=item; return identity;};
assert.deepEqual(current.items.map(withoutTags),old.items.map(withoutTags),'Non-tag catalog metadata changed');
for(const path of ['robots.txt','llms.txt','sitemap.xml','sitemap-all.xml']) assert.equal(readFileSync(resolve(root,path),'utf8'),git(['show',`${baseline}:${path}`]),`${path} changed`);
const guides = readFileSync(resolve(root,'guides.html'),'utf8').replace(/<!-- anomaly-card-tags:start -->[\s\S]*?<!-- anomaly-card-tags:end -->/g,'');
assert.equal(guides,git(['show',`${baseline}:guides.html`]),'Guide body changed outside explicit tag markers');
const result={passed:true,baseline,catalog_identities:current.items.length,unchanged:['all non-tag catalog metadata','existing canonical and alternate URL identities','robots.txt','llms.txt','sitemap.xml','sitemap-all.xml','guide content outside added tag markers'],scope:'Main-site source preservation, not deployment verification.'};
writeFileSync(resolve(root,'reports/anomaly-review-20260921/preservation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
