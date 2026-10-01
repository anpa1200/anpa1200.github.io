#!/usr/bin/env node
// Compare article prose to Git, excluding only front matter and permitted links.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
const [archiveArg,outputArg]=process.argv.slice(2);
if(!archiveArg||!outputArg)throw Error('archive directory and evidence output required');
const archive=resolve(archiveArg),base=execFileSync('git',['rev-parse','HEAD'],{cwd:archive,encoding:'utf8'}).trim();
const paths=execFileSync('git',['ls-files','docs/articles'],{cwd:archive,encoding:'utf8'}).trim().split('\n').filter(p=>/\.mdx?$/.test(p));
const strip=text=>text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'').replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi,'[LINK]').replace(/\[[^\]\n]*\]\([^\)\n]*\)/g,'[LINK]');
const failures=[];
for(const path of paths){const before=execFileSync('git',['show',base+':'+path],{cwd:archive,encoding:'utf8',maxBuffer:10000000}),after=readFileSync(join(archive,path),'utf8');if(strip(before)!==strip(after))failures.push(path);}
const result={base,articles_checked:paths.length,normalization:'Ignore front matter and link markup only; all remaining article prose must match exactly.',failures};
writeFileSync(resolve(outputArg),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(failures.length)process.exitCode=1;
