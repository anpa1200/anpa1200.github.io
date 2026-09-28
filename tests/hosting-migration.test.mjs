import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { sha256, canonicalUrls, comparableHeader, withoutBuildIdentity, localAsset } from '../scripts/hosting-parity-lib.mjs';
import { artifactFiles } from '../scripts/check-static-artifact.mjs';
import { applyMigrationReview, comparisonHash } from '../scripts/migration-review-lib.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('migration preserves GitHub Pages and the retired edge configuration for rollback', () => {
  const protectedFiles = {
    'wrangler.toml': 'dc34c12ea4e50a4390a3b6fa84ecba3422a4b69dc10795c009fb184f74f0e3ec',
    'cloudflare/agent-readiness-worker.js': '2c3b81557a3affe377815e614654556e1fb5e5efb42a0f4da7098b92d560c49a',
    'CNAME': '20858abe23a3060bacf7ba49c7eae8609af158460ba05b14ce7a460fff91fb5a',
  };
  for (const [path, digest] of Object.entries(protectedFiles)) assert.equal(sha256(read(path)), digest, `${path}: production change requires a separate authorized cutover`);
  const workflow = read('.github/workflows/pages.yml');
  const pages = workflow.slice(workflow.indexOf('\n  deploy:\n'), workflow.indexOf('\n  production-verification:'));
  assert.match(pages, /needs: quality/);
  assert.match(pages, /actions\/deploy-pages@/);
  assert.match(pages, /name: github-pages/);
  assert.match(pages, /if: \$\{\{ false \}\}/);
  assert.match(read('.github/workflows/cloudflare-worker.yml'), /if: \$\{\{ false \}\}/);
  assert.match(workflow, /needs: \[quality, cloudflare-production\]/);
  assert.match(workflow, /needs.cloudflare-production.outputs.live == 'true'/);
  assert.match(workflow, /upload-pages-artifact@[\s\S]*?if: \$\{\{ false \}\}/);
});

test('preview Worker has no production route, custom domain, or Cloudflare site build', () => {
  const config = JSON.parse(read('cloudflare/wrangler.preview.json'));
  assert.equal(config.name, '1200km-site-preview');
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
  const preview = workflow.slice(workflow.indexOf('\n  cloudflare-preview:'), workflow.indexOf('\n  cloudflare-production:'));
  assert.match(preview, /needs: quality/);
  assert.match(preview, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /^\s*pull_request_target:/m);
  assert.match(preview, /artifact-ids: \$\{\{ needs.quality.outputs.static-artifact-id \}\}/);
  assert.match(preview, /path: \.\/dist/);
  assert.match(preview, /check-static-artifact.mjs --site \.\/dist --site-commit/);
  assert.match(preview, /command: deploy --config wrangler.preview.json/);
  assert.doesNotMatch(preview, /--route|custom.domain|npm run build|deploy-pages|upsert-dns/);
  for (const match of workflow.matchAll(/uses:\s*([^\s]+)@([^\s]+)/g)) assert.match(match[2], /^[a-f0-9]{40}$/, `Floating action ${match[1]}`);
  const version = JSON.parse(read('cloudflare/package.json')).devDependencies.wrangler;
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.match(preview, new RegExp(`wranglerVersion: ${version.replaceAll('.', '\\.')}`));
  assert.equal(JSON.parse(read('cloudflare/package-lock.json')).packages['node_modules/wrangler'].version, version);
});

test('production is main-only and cannot run before preview validation', () => {
  const workflow = read('.github/workflows/pages.yml');
  const production = workflow.slice(workflow.indexOf('\n  cloudflare-production:'), workflow.indexOf('\n  deploy:'));
  assert.match(production, /github.ref == 'refs\/heads\/main'/);
  assert.match(production, /github.event_name != 'pull_request'/);
  assert.match(production, /vars.CLOUDFLARE_SITE_DEPLOY_ENABLED == 'true'/);
  assert.match(production, /needs: \[quality, cloudflare-preview\]/);
  assert.match(production, /--migration-baseline cloudflare\/migration-baseline.json/);
  assert.match(production, /artifact-ids: \$\{\{ needs.quality.outputs.static-artifact-id \}\}/);
  assert.doesNotMatch(production, /--report-only-differences/);
  const config = JSON.parse(read('cloudflare/wrangler.site.json'));
  assert.equal(config.name, '1200km-site');
  assert.deepEqual(config.routes, [{ pattern: '1200km.com/*', zone_id: '3b7d60bc8ed435424d085603a583bd2f' }]);
  assert.deepEqual(config.assets, JSON.parse(read('cloudflare/wrangler.preview.json')).assets);
});

test('parity normalization cannot hide non-build changes', () => {
  const html = `<meta name="1200km-build" content="${'a'.repeat(40)}" /><p>Evidence</p>`;
  assert.equal(withoutBuildIdentity(html), withoutBuildIdentity(html.replace('a'.repeat(40), 'b'.repeat(40))));
  assert.notEqual(withoutBuildIdentity(html), withoutBuildIdentity(html.replace('Evidence', 'Changed')));
  assert.equal(comparableHeader('content-type', 'text/javascript; charset=utf-8'), comparableHeader('content-type', 'application/javascript;charset=utf-8'));
  assert.notEqual(comparableHeader('content-security-policy', "default-src 'self'"), comparableHeader('content-security-policy', "default-src *"));
  assert.deepEqual(canonicalUrls('<link href="https://1200km.com/about.html" rel="canonical">'), ['https://1200km.com/about.html']);
  assert.deepEqual(canonicalUrls('<link data-rh=true rel=canonical href=https://1200km.com/opencti-intelligent-shield/>'), ['https://1200km.com/opencti-intelligent-shield/']);
  assert.deepEqual(canonicalUrls('<link data-rel=canonical href=https://example.org>'), []);
});

test('migration exceptions bind exact before/after differences to the frozen rollback', () => {
  const identity = { site_commit: 'a'.repeat(40), artifact_digest: `sha256:${'b'.repeat(64)}` };
  const change = { path: 'GET /about.html', check: 'response body SHA-256', production: 'old', preview: 'new', reason: 'Reviewed release markup and same-origin asset correction.' };
  const review = { schema_version: 1, rollback_identity: identity, approved_changes: [change] };
  const report = () => ({ production_before: identity, production_unchanged: true, production_differences: [{...change, classification:'cutover-blocker'}] });
  const valid = report(); assert.equal(applyMigrationReview(valid, review), 1);
  assert.equal(valid.production_differences[0].classification, 'reviewed-migration-difference');
  const drift = report(); drift.production_differences[0].preview = 'unexpected';
  assert.equal(applyMigrationReview(drift, review), 0);
  assert.equal(drift.production_differences[0].classification, 'cutover-blocker');
  assert.throws(() => applyMigrationReview({...report(), production_before:{...identity, site_commit:'c'.repeat(40)}}, review));
  assert.throws(() => applyMigrationReview({...report(), production_unchanged:false}, review));
  assert.throws(() => applyMigrationReview(report(), {...review, approved_changes:[change,change]}));
  const html = `<meta name="1200km-build" content="${'a'.repeat(40)}"><p>Preserved research</p>`;
  assert.equal(comparisonHash(Buffer.from(html), 'text/html'), comparisonHash(Buffer.from(html.replace('a'.repeat(40), 'c'.repeat(40))), 'text/html'));
  assert.notEqual(comparisonHash(Buffer.from(html), 'text/html'), comparisonHash(Buffer.from(html.replace('Preserved', 'Changed')), 'text/html'));
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
