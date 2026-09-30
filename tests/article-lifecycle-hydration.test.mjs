import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const run = (script, args) => spawnSync(process.execPath, [join(root, 'scripts', script), ...args], { encoding: 'utf8', env: { ...process.env, ARCHIVE_OVERLAY_OPTIONAL: '1' } });

function archiveFixture() {
  const archive = mkdtempSync(join(tmpdir(), '1200km-archive-'));
  for (const directory of ['docs/articles/2024', 'docs/articles/2026', 'src', 'static']) mkdirSync(join(archive, directory), { recursive: true });
  writeFileSync(join(archive, 'docusaurus.config.js'), 'const config = {\n  trailingSlash: true,\n};\nmodule.exports = config;\n');
  const article = (title, published) => `---\ntitle: "${title}"\n---\n\n# ${title}\n\n<img src="/img/cover.png" alt="Cover image" />\n\n:::info Article Metadata\n- **Published:** ${published}\n:::\n\n## Body\n\nText.\n`;
  writeFileSync(join(archive, 'docs/articles/2024/2024-10-17-old-guide-d51cf98c789f.md'), article('Old guide', '2024-10-17'));
  // 7dfd6a0917cf is a reviewed current-core id: maintained, no notice.
  writeFileSync(join(archive, 'docs/articles/2026/2026-09-20-core-research-7dfd6a0917cf.md'), article('Core research', '2026-09-20'));
  return archive;
}

test('archive source gets the lifecycle notice directly under the article H1, idempotently', () => {
  const archive = archiveFixture();
  try {
    for (let pass = 0; pass < 2; pass += 1) {
      const result = run('prepare-article-archive.mjs', ['--archive', archive]);
      assert.equal(result.status, 0, result.stderr);
    }
    const preserved = readFileSync(join(archive, 'docs/articles/2024/2024-10-17-old-guide-d51cf98c789f.md'), 'utf8');
    assert.match(preserved, /^# Old guide\n\n:::caution\[Preserved article\]\n\nThis older publication/m);
    assert.equal(preserved.match(/:::caution\[Preserved article\]/g).length, 1, 'notice must not be duplicated on re-run');
    assert.ok(preserved.indexOf('Preserved article') < preserved.indexOf('Cover image'), 'notice renders above the cover image');
    const maintained = readFileSync(join(archive, 'docs/articles/2026/2026-09-20-core-research-7dfd6a0917cf.md'), 'utf8');
    assert.doesNotMatch(maintained, /:::(?:caution|info)\[/);
  } finally {
    rmSync(archive, { recursive: true, force: true });
  }
});

function builtSite(bodyNotice, extra = '') {
  const site = mkdtempSync(join(tmpdir(), '1200km-lifecycle-'));
  const article = join(site, 'articles/read/2024/sample/index.html');
  mkdirSync(join(site, 'data'), { recursive: true });
  mkdirSync(join(site, 'assets'), { recursive: true });
  mkdirSync(resolve(article, '..'), { recursive: true });
  writeFileSync(join(site, 'assets/content-governance.css'), '.theme-code-block{}');
  writeFileSync(join(site, 'data/content-catalog.json'), JSON.stringify({
    scope: 'deployable-domain-catalog',
    items: [{ id: 'sample', title: 'Sample article', lifecycle: 'preserved', canonical_url: 'https://1200km.com/articles/read/2024/sample/' }],
  }));
  writeFileSync(article, `<!doctype html><html><head></head><body>${extra}<div id="__docusaurus"><main><article><div class="theme-doc-markdown markdown"><header><h1>Sample</h1></header>${bodyNotice}<p>Intro</p><h2>Body</h2></div></article></main></div></body></html>`);
  return { site, article };
}

const notice = '<div class="theme-admonition theme-admonition-caution alert alert--warning"><div class="admonitionHeading"><span class="admonitionIcon"><svg viewBox="0 0 16 16"><path d="M8 1"></path></svg></span>Preserved article</div><div class="admonitionContent"><p>This older publication is retained.</p></div></div>';

test('build verification accepts the in-article notice and writes the route manifest', () => {
  const { site, article } = builtSite(notice);
  try {
    const result = run('apply-content-lifecycle.mjs', ['--site', site]);
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(article, 'utf8');
    assert.match(html, /href="\/assets\/content-governance\.css"/);
    assert.doesNotMatch(html, /content-governance\.js/, 'no runtime insertion script');
    assert.doesNotMatch(html, /data-governance-fallback/);
    const reactRoot = html.slice(html.indexOf('<div id="__docusaurus">'));
    assert.match(reactRoot, /Preserved article/, 'notice is inside the Docusaurus article body');
    const manifest = JSON.parse(readFileSync(join(site, 'data/article-lifecycle.json'), 'utf8'));
    assert.equal(manifest.routes['/articles/read/2024/sample/'].lifecycle, 'preserved');
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test('build verification fails when a governed notice is missing or rendered outside the article', () => {
  for (const [label, fixture] of [
    ['missing', builtSite('')],
    ['legacy body-level banner', builtSite(notice, '<aside class="content-lifecycle-banner" data-governance-fallback>Preserved article</aside>')],
  ]) {
    try {
      const result = run('apply-content-lifecycle.mjs', ['--site', fixture.site]);
      assert.notEqual(result.status, 0, `${label} must fail verification`);
      assert.match(result.stderr, /Article lifecycle verification failed/);
    } finally {
      rmSync(fixture.site, { recursive: true, force: true });
    }
  }
});

test('retired lifecycle runtime stays inert and TTP guide runtime keeps its deferred contract', () => {
  const runtime = readFileSync(join(root, 'assets/content-governance.js'), 'utf8');
  assert.doesNotMatch(runtime, /document\.|createElement|MutationObserver|history\[/);
  const guideRuntime = readFileSync(join(root, 'ttp-simulation/assets/guide-links.js'), 'utf8');
  assert.match(guideRuntime, /if \(!ready \|\| running \|\| !routes\) return/);
  assert.match(guideRuntime, /addEventListener\('load', begin, \{ once: true \}\)/);
  assert.match(guideRuntime, /requestIdleCallback\(run/);
  const backlinkBuilder = readFileSync(join(root, 'scripts/build-ttp-integration.mjs'), 'utf8');
  assert.match(backlinkBuilder, /docusaurus \? '<aside id="ttp-ecosystem"/);
  assert.match(backlinkBuilder, /aria-label="Related attack tools, simulations and detection rules"/);
});

test('one shared rule decides whether a built article carries the right lifecycle notice', async () => {
  const { lifecycleNoticeProblem } = await import('../scripts/article-lifecycle-lib.mjs');
  const page = (body) => `<body><div id="__docusaurus"><article><div class="theme-doc-markdown markdown"><header><h1>T</h1></header>${body}<h2>Body</h2></div></article></div></body>`;
  assert.equal(lifecycleNoticeProblem(page(notice), 'preserved'), null);
  assert.match(lifecycleNoticeProblem(page(''), 'preserved'), /expected "Preserved article" notice/);
  assert.match(lifecycleNoticeProblem(page(notice), 'historical'), /expected "Historical version" notice/);
  assert.equal(lifecycleNoticeProblem(page(''), 'maintained'), null);
  assert.match(lifecycleNoticeProblem(page(notice), 'maintained'), /carries a lifecycle notice/);
  // The retired body-level banner before the Docusaurus root is rejected.
  const legacy = `<aside data-governance-fallback data-content-lifecycle="preserved">Preserved article</aside>${page('')}`;
  assert.match(lifecycleNoticeProblem(legacy, 'preserved'), /legacy lifecycle banner/);
});
