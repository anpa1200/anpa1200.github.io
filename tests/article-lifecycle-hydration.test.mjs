import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);

test('article lifecycle fallback remains outside React root and has a route manifest', () => {
  const site = mkdtempSync(join(tmpdir(), '1200km-lifecycle-'));
  try {
    const article = join(site, 'articles/read/2024/sample/index.html');
    mkdirSync(join(site, 'data'), { recursive: true });
    mkdirSync(join(site, 'assets'), { recursive: true });
    mkdirSync(resolve(article, '..'), { recursive: true });
    writeFileSync(join(site, 'assets/content-governance.css'), '.content-lifecycle-banner{}');
    writeFileSync(join(site, 'data/content-catalog.json'), JSON.stringify({
      scope: 'deployable-domain-catalog',
      items: [{ id: 'sample', title: 'Sample article', lifecycle: 'preserved', canonical_url: 'https://1200km.com/articles/read/2024/sample/' }],
    }));
    writeFileSync(article, '<!doctype html><html><head></head><body><div id="__docusaurus"><main><div class="theme-doc-markdown markdown"><h1>Sample</h1></div></main></div></body></html>');
    const result = spawnSync(process.execPath, [join(root, 'scripts/apply-content-lifecycle.mjs'), '--site', site], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(article, 'utf8');
    const reactRoot = html.slice(html.indexOf('<div id="__docusaurus">'), html.indexOf('</main></div>') + '</main></div>'.length);
    assert.doesNotMatch(reactRoot, /content-lifecycle-banner/);
    assert.match(html, /data-governance-fallback/);
    assert.match(html, /src="\/assets\/content-governance\.js" defer/);
    const manifest = JSON.parse(readFileSync(join(site, 'data/article-lifecycle.json'), 'utf8'));
    const runtime = readFileSync(join(root, 'assets/content-governance.js'), 'utf8');
    assert.match(runtime, /article\.append\(fallback\)/);
    assert.match(runtime, /if \(!routes\) \{ loadRoutes\(\); return; \}/);
    assert.doesNotMatch(runtime, /article\.prepend\(aside\)/);
    const backlinkBuilder = readFileSync(join(root, 'scripts/build-ttp-integration.mjs'), 'utf8');
    assert.match(backlinkBuilder, /docusaurus \? '<aside id="ttp-ecosystem"/);
    assert.match(backlinkBuilder, /aria-label="Related attack tools, simulations and detection rules"/);
    assert.equal(manifest.routes['/articles/read/2024/sample/'].lifecycle, 'preserved');
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});
