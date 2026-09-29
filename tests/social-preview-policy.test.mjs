import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);

test('unsupported or oversized companion social images use the existing raster card', () => {
  const site = mkdtempSync(join(tmpdir(), '1200km-social-'));
  try {
    const page = join(site, 'israel-government-threat-actors-cti/index.html');
    mkdirSync(resolve(page, '..'), { recursive: true });
    writeFileSync(page, '<!doctype html><html><head><meta property="og:image" content="https://1200km.com/israel-government-threat-actors-cti/img/social-card.svg"><meta name="twitter:image" content="/img/card.svg"><meta property="og:image:alt" content="SVG-specific image"><meta name="twitter:image:alt" content="SVG-specific image"></head><body><a href="/actors/oilrig/">OilRig</a></body></html>');
    const oversized = join(site, 'operation-desert-hydra/index.html');
    mkdirSync(resolve(oversized, '..'), { recursive: true });
    writeFileSync(join(site, 'operation-desert-hydra/cover.png'), Buffer.alloc(5 * 1024 * 1024 + 1));
    writeFileSync(oversized, '<!doctype html><html><head><meta property="og:image" content="https://1200km.com/operation-desert-hydra/cover.png"></head><body><img src="/operation-desert-hydra/cover.png" alt="Cover"></body></html>');
    const result = spawnSync(process.execPath, [join(root, 'scripts/normalize-platform-assets.mjs'), '--site', site], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(page, 'utf8');
    assert.equal((html.match(/https:\/\/1200km\.com\/assets\/site-og-v2\.png/g) || []).length, 2);
    assert.doesNotMatch(html, /SVG-specific image|content="[^"]*\.svg"/);
    assert.match(html, /href="\/actors\/oilrig\/"/);
    const coverHtml = readFileSync(oversized, 'utf8');
    assert.match(coverHtml, /<meta property="og:image" content="https:\/\/1200km\.com\/assets\/site-og-v2\.png"/);
    assert.match(coverHtml, /<img src="\/operation-desert-hydra\/cover\.png"/);
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});
