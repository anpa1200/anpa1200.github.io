#!/usr/bin/env node
import fs from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),report=join(root,'reports/technical-seo-20260920');
const audit=JSON.parse(fs.readFileSync(join(report,'before/pages.json'))),policy=JSON.parse(fs.readFileSync(join(root,'data/seo-policy.json'))),targets=JSON.parse(fs.readFileSync(join(root,'data/seo-targeting.json')));
const md=s=>String(s||'').replace(/\|/g,'\\|').replace(/\n/g,' '),csv=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
let targeting='# Query targeting — 20 most-linked pages\n\n'+targets.selection+' Character limits are editorial checks, not Google ranking rules. The homepage keeps its existing H1 as requested.\n';
for(const [path,t]of Object.entries(targets.pages)){
 const before=audit.find(p=>p.url==='https://1200km.com'+path);
 targeting+=`\n## ${path}\n\nPrimary query: ${t.query}. Unique inbound sources: ${before.inbound_internal_links}.\n\n| Field | Before | After |\n|---|---|---|\n`;
 for(const [key,value]of [['title',t.title],['description',t.description],['h1',t.keep_h1?before.h1:t.h1],['intro',t.intro]])targeting+=`| ${key} | ${md(key==='intro'?before.paragraphs[0]:before[key])} | ${md(value)} |\n`;
}
fs.writeFileSync(join(root,'seo-targeting.md'),targeting);
fs.writeFileSync(join(report,'classification.csv'),['url,classification,reason,word_count',...Object.entries(policy.pages).map(([path,p])=>['https://1200km.com'+path,p.classification,p.reason,p.word_count].map(csv).join(','))].join('\n')+'\n');
let decisions='# Canonical ownership and preserved aliases\n\nExisting paths are retained. Redirecting aliases are omitted from the search sitemap; this does not remove their URLs. TrainSec mirrors and third-party evidence snapshots retain their original publisher canonicals.\n\n| Requested URL | Observed status | Existing canonical / destination | Decision |\n|---|---|---|---|\n';
for(const p of audit.filter(p=>p.canonical&&p.canonical!==p.url))decisions+=`| ${md(p.url)} | ${p.status} | ${md(p.canonical)} | Preserve canonical ownership; exclude alias from sitemap |\n`;
fs.writeFileSync(join(report,'canonical-decisions.md'),decisions);
const protectedFiles={};
for(const name of ['robots.txt','llms.txt']){
 const before=execFileSync('git',['show','HEAD:'+name],{cwd:root}),after=fs.readFileSync(join(root,name)),hash=b=>createHash('sha256').update(b).digest('hex');
 protectedFiles[name]={before_sha256:hash(before),after_sha256:hash(after),unchanged:before.equals(after)};
 if(!before.equals(after))throw Error(`Protected file changed: ${name}`);
}
fs.writeFileSync(join(report,'protected-files.json'),JSON.stringify(protectedFiles,null,2)+'\n');
fs.writeFileSync(join(report,'protected-files.diff'),execFileSync('git',['diff','HEAD','--','robots.txt','llms.txt'],{cwd:root}));
const names=execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trim().split('\n').map(line=>line.slice(3));
const group=f=>/seo-crawl|seo-audit|\/before\//.test(f)?'1 — Audit':/seo-targeting/.test(f)?'5 — Query targeting':/seo-internal-links|prepare-seo-links/.test(f)?'6 — Internal links':/PUBLISHING|seo-manual|seo-targeting|technical-seo-20260920/.test(f)?'7 — Documentation and evidence':/sitemap|seo-policy|prepare-seo-policy/.test(f)?'4 — Index hygiene':/schema|release-html/.test(f)?'3 — Structured data':'2 — Templates, source metadata and dependent generated outputs';
const groups=new Map();for(const f of names){const key=group(f);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
let files='# Main repository changed-file inventory\n\nGenerated HTML changes are driven by reviewed metadata and template code; no route renames are intended. Independent documentation repository diffs are recorded separately.\n';
for(const [step,paths]of [...groups].sort())files+=`\n## ${step}\n\n| File |\n|---|\n${paths.sort().map(f=>'| '+md(f)+' |').join('\n')}\n`;
fs.writeFileSync(join(report,'changed-files.md'),files);
console.log('Wrote query targeting, URL classification, canonical decisions, protected-file proof and changed-file inventory.');
