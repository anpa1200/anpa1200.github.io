// Release-shaped local preview: exact staged source and an already built pinned archive.
import { cpSync, mkdirSync, existsSync, mkdtempSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const args=process.argv.slice(2),option=(name)=>args[args.indexOf(name)+1];
if(!args.includes('--archive'))throw Error('Pass --archive /path/to/the/pinned/built/archive');
const root=process.cwd(),archive=resolve(option('--archive'));
if(!existsSync(archive+'/build/index.html'))throw Error('The archive must already be built');
const site=args.includes('--site')?resolve(option('--site')):mkdtempSync('/tmp/1200km-ttp-preview-');
if(site===root||site.startsWith(root+'/')||root.startsWith(site+'/'))throw Error('Preview must be outside the source checkout');
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const exclusions=['.github/','cloudflare/','scripts/','tests/','content/','reports/site-audit-20260909/','reports/second-remediation-20260909/'];
for(const file of files){
 if(exclusions.some(p=>file.startsWith(p))||['.gitignore','package.json','package-lock.json'].includes(file))continue;
 mkdirSync(dirname(site+'/'+file),{recursive:true});cpSync(root+'/'+file,site+'/'+file);
}
cpSync(archive+'/build',site+'/articles',{recursive:true});
function run(script,...options){execFileSync(process.execPath,['scripts/'+script,...options],{stdio:'inherit'});}
const archiveCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:archive,encoding:'utf8'}).trim();
run('stage-article-archive-governance.mjs','--site',site,'--source',root,'--archive',archive,'--archive-commit',archiveCommit);
run('build-site-shell.mjs','--site',site);
run('build-ttp-integration.mjs','--site',site,'--require-archive');
run('inject-search-loader.mjs','--site',site);
run('build-site-artifacts.mjs','--site',site,'--source',root,'--remote');
run('build-platform-sidebar.mjs','--site',site);
run('build-content-catalog.mjs','--site',site,'--source',root,'--sitemap',site+'/sitemap.xml','--remote');
run('build-site-reference-library.mjs','--site',site,'--source',root);
run('build-reference-library.mjs','--site',site);
run('build-site-artifacts.mjs','--site',site,'--source',root,'--remote');
run('build-platform-sidebar.mjs','--site',site);
run('build-content-catalog.mjs','--site',site,'--source',root,'--sitemap',site+'/sitemap.xml','--remote');
run('build-ai-discovery.mjs','--site',site);
run('build-search-index.mjs','--site',site,'--sitemap',site+'/sitemap.xml','--output',site+'/pagefind','--remote','--canonical-sitemap-output',site+'/sitemap.xml');
console.log('PREVIEW_READY='+site);
