import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { sha256, canonicalUrls, comparableHeader, withoutBuildIdentity, localAsset } from '../scripts/hosting-parity-lib.mjs';
import { artifactFiles } from '../scripts/check-static-artifact.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('phase one cannot change existing production configuration or deployment jobs', () => {
  const protectedFiles = {
    'wrangler.toml': 'dc34c12ea4e50a4390a3b6fa84ecba3422a4b69dc10795c009fb184f74f0e3ec',
    'cloudflare/agent-readiness-worker.js': '2c3b81557a3affe377815e614654556e1fb5e5efb42a0f4da7098b92d560c49a',
    '.github/workflows/cloudflare-worker.yml': '3c035844771cbcca0b1e6cd47c4c732c7fd8182b05bb4818af717f9a4daf0b71',
    'CNAME': '20858abe23a3060bacf7ba49c7eae8609af158460ba05b14ce7a460fff91fb5a',
  };
  for (const [path, digest] of Object.entries(protectedFiles)) assert.equal(sha256(read(path)), digest, `${path}: production change requires a separate authorized cutover`);
  const workflow = read('.github/workflows/pages.yml');
  assert.equal(sha256(workflow.slice(workflow.indexOf('\n  deploy:\n'))), '80ac8e297a7d94a983c5caae328fdd539fa9d4d27bc79ac7e4225993b0ee1cec', 'Existing Pages deploy and verification jobs must remain byte-identical');
});

test('new Worker has no production route, custom domain, or Cloudflare site build', () => {
  const config = JSON.parse(read('cloudflare/wrangler.site.json'));
  assert.equal(config.name, '1200km-site');
  assert.equal(config.main, './site-worker.js');
  assert.equal(config.workers_dev, true);
  assert.deepEqual(config.routes, []);
  for (const field of ['route', 'build', 'env', 'triggers', 'services']) assert.equal(config[field], undefined, `Unexpected ${field}`);
  assert.deepEqual(config.assets, { directory: '../dist', binding: 'ASSETS', run_worker_first: true, html_handling: 'none', not_found_handling: 'none' });
  assert.deepEqual(config.rules, [{ type: 'Text', globs: ['**/_headers'], fallthrough: false }]);
  assert.match(read('cloudflare/site-worker.js'), /import headerPolicy from '\.\.\/_headers'/);
});

test('deployment uses exact same-run artifact, locked dependencies, and no fork credentials', () => {
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /static-artifact-id: \$\{\{ steps\.static-artifact\.outputs\.artifact-id \}\}/);
  const upload = workflow.slice(workflow.indexOf('      - name: Preserve exact validated site'), workflow.indexOf('\n  cloudflare-preview:'));
  assert.match(upload, /path: \$\{\{ runner.temp \}\}\/site/);
  assert.match(upload, /include-hidden-files: true/);
  assert.match(upload, /if-no-files-found: error/);
  const preview = workflow.slice(workflow.indexOf('\n  cloudflare-preview:'), workflow.indexOf('\n  deploy:'));
  assert.match(preview, /needs: quality/);
  assert.match(preview, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /^\s*pull_request_target:/m);
  assert.match(preview, /artifact-ids: \$\{\{ needs.quality.outputs.static-artifact-id \}\}/);
  assert.match(preview, /path: \.\/dist/);
  assert.match(preview, /check-static-artifact.mjs --site \.\/dist --site-commit/);
  assert.match(preview, /command: deploy --config wrangler.site.json/);
  assert.doesNotMatch(preview, /--route|custom.domain|npm run build|deploy-pages|upsert-dns/);
  for (const match of workflow.matchAll(/uses:\s*([^\s]+)@([^\s]+)/g)) assert.match(match[2], /^[a-f0-9]{40}$/, `Floating action ${match[1]}`);
  const version = JSON.parse(read('cloudflare/package.json')).devDependencies.wrangler;
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.match(preview, new RegExp(`wranglerVersion: ${version.replaceAll('.', '\\.')}`));
  assert.equal(JSON.parse(read('cloudflare/package-lock.json')).packages['node_modules/wrangler'].version, version);
});

test('parity normalization cannot hide non-build changes', () => {
  const html = `<meta name="1200km-build" content="${'a'.repeat(40)}" /><p>Evidence</p>`;
  assert.equal(withoutBuildIdentity(html), withoutBuildIdentity(html.replace('a'.repeat(40), 'b'.repeat(40))));
  assert.notEqual(withoutBuildIdentity(html), withoutBuildIdentity(html.replace('Evidence', 'Changed')));
  assert.equal(comparableHeader('content-type', 'text/javascript; charset=utf-8'), comparableHeader('content-type', 'application/javascript;charset=utf-8'));
  assert.notEqual(comparableHeader('content-security-policy', "default-src 'self'"), comparableHeader('content-security-policy', "default-src *"));
  assert.deepEqual(canonicalUrls('<link href="https://1200km.com/about.html" rel="canonical">'), ['https://1200km.com/about.html']);
});

test('artifact routing expectations distinguish missing companion content from valid pages', () => {
  const paths = new Set(['index.html', 'about.html', 'articles/index.html', '404.html', '.well-known/api-catalog']);
  assert.deepEqual(localAsset('/', paths), { status: 200, asset: 'index.html' });
  assert.deepEqual(localAsset('/about.html', paths), { status: 200, asset: 'about.html' });
  assert.deepEqual(localAsset('/about', paths), { status: 200, asset: 'about.html' });
  assert.deepEqual(localAsset('/articles', paths), { status: 301, asset: null });
  assert.deepEqual(localAsset('/.well-known/api-catalog', paths), { status: 200, asset: '.well-known/api-catalog' });
  assert.deepEqual(localAsset('/companion/', paths), { status: 404, asset: '404.html' });
});

test('artifact enumeration includes hidden discovery assets', async () => {
  const site = await mkdtemp(join(tmpdir(), '1200km-artifact-test-'));
  try {
    await mkdir(join(site, '.well-known'));
    await writeFile(join(site, '.well-known/api-catalog'), '{}');
    await writeFile(join(site, 'index.html'), 'test');
    assert.deepEqual(await artifactFiles(site), [join(site, '.well-known/api-catalog'), join(site, 'index.html')]);
  } finally { await rm(site, { recursive: true, force: true }); }
});
