// Local review build: existing source + an already built pinned article archive.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2),
  value = (k, f) => args.includes(k) ? args[args.indexOf(k) + 1] : f;
const root = process.cwd(),
  site = resolve(value('--site', '/tmp/1200km-audit-preview'));
const archive = resolve(value('--archive', '/tmp/1200km-archive-source'));
const archiveBuild = resolve(value('--archive-build', archive + '/build'));
if (!existsSync(archiveBuild + '/index.html')) throw Error('Build the pinned article archive first; see the verification report.');
if (site === root || root.startsWith(site + '/') || site.startsWith(root + '/')) throw Error('Preview must be separate from source');
mkdirSync(site, {
  recursive: true
});
cpSync(root, site, {
  recursive: true,
  filter: p => {
    const r = relative(root, p);
    return !r.split('/').some(n => ['.git', 'node_modules', '.cache', 'pagefind', '_site', '.1200km-pagefind'].includes(n)) && !r.startsWith('reports/site-audit-20260909') && !r.startsWith('reports/second-remediation-20260909') && !r.startsWith('reports/technical-seo-20260920') && !r.startsWith('.1200km-pagefind-');
  }
});
cpSync(archiveBuild, site + '/articles', {
  recursive: true
});
const projects = value('--projects', null);
if (projects) for (const [directory, source, prefix] of [
  ['adversarygraph-docs','build','adversarygraph-docs'], ['Hexstrike-AI','build','Hexstrike-AI-guide'],
  ['CTI_as_a_Code','docs-site/build','CTI_as_a_Code'], ['cti-analyst-field-manual','build','cti-analyst-field-manual'],
  ['israel-government-threat-actors-cti','build','israel-government-threat-actors-cti'], ['customer-driven-ai-cti-project','build','customer-driven-ai-cti-project'],
  ['insider-threat-detection','build','insider-threat-detection'], ['anomaly-detection-atlas','build','anomaly-detection-atlas'],
  ['ai-vs-defense','build','ai-vs-defense'], ['operation-desert-hydra','docs-site/build','operation-desert-hydra'],
  ['opencti-intelligent-shield','docs-site/build','opencti-intelligent-shield'],
]) cpSync(resolve(projects,directory,source), resolve(site,prefix), {recursive:true});
const itdr = value('--itdr-build', null);
if (itdr) cpSync(resolve(itdr), resolve(site,'ITDR'), {recursive:true});
const legacy = value('--legacy-build', null);
if (legacy) cpSync(resolve(legacy), resolve(site,'medium-blog-navigation'), {recursive:true});
const actorBuild = value('--actor-build', null);
if (actorBuild) cpSync(resolve(actorBuild), site + '/israel-government-threat-actors-cti', {
  recursive: true
});
function run(script, ...flags) {
  console.log('Running', script);
  execFileSync(process.execPath, ['scripts/' + script, ...flags], {
    cwd: root,
    stdio: 'inherit'
  });
}
run('stage-article-archive-governance.mjs', '--site', site, '--source', root, '--archive', archive, '--archive-commit', '869e5abd9f806f3de7d800f3b4f0f3ec867b2923');
run('build-site-shell.mjs', '--site', site);
run('build-site-artifacts.mjs', '--site', site, '--source', root);
run('build-platform-sidebar.mjs', '--site', site);
run('build-content-catalog.mjs', '--site', site, '--source', root, '--sitemap', site + '/sitemap.xml');
run('build-site-reference-library.mjs', '--site', site, '--source', root);
run('build-reference-library.mjs', '--site', site);
run('build-site-artifacts.mjs', '--site', site, '--source', root);
run('build-platform-sidebar.mjs', '--site', site);
run('build-content-catalog.mjs', '--site', site, '--source', root, '--sitemap', site + '/sitemap.xml');
run('build-ai-discovery.mjs', '--site', site);
if (args.includes('--skip-search')) { console.log('Preview built without the search index at', site); process.exit(0); }
run('inject-search-loader.mjs', '--site', site);
run('build-search-index.mjs', '--site', site, '--sitemap', site + '/sitemap.xml', '--output', site + '/pagefind');
console.log('Preview built at', site);
