import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const sha = (path) => `h-${createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 10)}`;

test('shared assets get content-hash versions, including references between assets', () => {
  const site = mkdtempSync(join(tmpdir(), '1200km-fingerprint-'));
  try {
    mkdirSync(join(site, 'assets'), { recursive: true });
    mkdirSync(join(site, 'data'), { recursive: true });
    mkdirSync(join(site, 'docs/assets/css'), { recursive: true });
    writeFileSync(join(site, 'assets/theme.css'), '.skip-link{top:10px}\n');
    writeFileSync(join(site, 'assets/loader.js'), 'const l=document.createElement("link");l.href="/assets/theme.css?v=20260101";if(!document.querySelector(\'link[href*="/assets/theme.css"]\'))document.head.append(l);\n');
    writeFileSync(join(site, 'docs/assets/css/styles.1a2b3c4d.css'), 'body{}');
    writeFileSync(join(site, 'index.html'), '<link rel="stylesheet" href="/assets/theme.css?v=20260101"><script src="https://1200km.com/assets/loader.js?v=old-2" defer></script><link href="/docs/assets/css/styles.1a2b3c4d.css"><img src="/assets/theme.css">');
    for (let pass = 0; pass < 2; pass += 1) {
      const result = spawnSync(process.execPath, [join(root, 'scripts/fingerprint-shared-assets.mjs'), '--site', site], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    const css = sha(join(site, 'assets/theme.css'));
    const loaderSource = readFileSync(join(site, 'assets/loader.js'), 'utf8');
    assert.match(loaderSource, new RegExp(`/assets/theme\\.css\\?v=${css}"`), 'asset-to-asset reference uses the content hash');
    assert.match(loaderSource, /link\[href\*="\/assets\/theme\.css"\]/, 'unversioned attribute selectors stay untouched');
    const loader = sha(join(site, 'assets/loader.js'));
    const html = readFileSync(join(site, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`href="/assets/theme\\.css\\?v=${css}"`));
    assert.match(html, new RegExp(`src="https://1200km\\.com/assets/loader\\.js\\?v=${loader}"`));
    assert.match(html, /href="\/docs\/assets\/css\/styles\.1a2b3c4d\.css"/, 'companion hashed assets are unchanged');
    assert.match(html, /<img src="\/assets\/theme\.css">/, 'unversioned references are unchanged');
    const manifest = JSON.parse(readFileSync(join(site, 'data/asset-fingerprints.json'), 'utf8'));
    assert.deepEqual(manifest, { 'loader.js': loader, 'theme.css': css });
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test('fingerprinting refuses the authoring checkout', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/fingerprint-shared-assets.mjs'), '--site', root], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});
