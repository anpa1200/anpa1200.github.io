// Local review build: existing source + an already built pinned article archive.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2),
  value = (k, f) => args.includes(k) ? args[args.indexOf(k) + 1] : f;
const root = process.cwd(),
  site = resolve(value('--site', '/tmp/1200km-audit-preview'));
const archive = resolve(value('--archive', '/tmp/1200km-archive-source'));
if (!existsSync(archive + '/build/index.html')) throw Error('Build the pinned article archive first; see the verification report.');
if (site === root || root.startsWith(site + '/') || site.startsWith(root + '/')) throw Error('Preview must be separate from source');
mkdirSync(site, {
  recursive: true
});
cpSync(root, site, {
  recursive: true,
  filter: p => {
    const r = relative(root, p);
    return !r.split('/').some(n => ['.git', 'node_modules', '.cache', 'pagefind', '_site', '.1200km-pagefind'].includes(n)) && !r.startsWith('reports/site-audit-20260909') && !r.startsWith('.1200km-pagefind-');
  }
});
cpSync(archive + '/build', site + '/articles', {
  recursive: true
});
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
run('stage-article-archive-governance.mjs', '--site', site, '--source', root, '--archive', archive, '--archive-commit', 'a9128dbdcd37593225bcdcaf401d868130efc1d1');
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
run('inject-search-loader.mjs', '--site', site);
run('build-search-index.mjs', '--site', site, '--sitemap', site + '/sitemap.xml', '--output', site + '/pagefind');
console.log('Preview built at', site);
