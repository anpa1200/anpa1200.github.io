import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  crosslinkRewrites, ctiSourceRewrites, missingCrosslinkTargets, rewriteCrosslinks, rewriteCrosslinksInDirectory,
} from '../scripts/canonical-crosslinks.mjs';

test('all reviewed crosslink targets are unique same-origin paths', () => {
  assert.equal(crosslinkRewrites.length, 35);
  assert.equal(new Set(crosslinkRewrites.map(({ from }) => from)).size, crosslinkRewrites.length);
  for (const { from, to } of crosslinkRewrites) {
    assert.equal(new URL(from, 'https://1200km.com').origin, 'https://1200km.com');
    assert.equal(new URL(to, 'https://1200km.com').origin, 'https://1200km.com');
  }
});

test('pinned Markdown and JSX links are rewritten before the hydration build', async () => {
  const root = mkdtempSync(join(tmpdir(), '1200km-crosslinks-'));
  try {
    mkdirSync(join(root, 'docs'));
    const source = join(root, 'docs', 'case.mdx');
    writeFileSync(source, '[Case](/CTI_as_a_Code/docs/training/02-proactive-celltronx/)\n'
      + '<a href="https://1200km.com/israel-government-threat-actors-cti/docs/actors/apt42">Actor</a>\n');
    const result = await rewriteCrosslinksInDirectory(root, ['.mdx']);
    assert.equal(result.replacements, 2);
    const rewritten = readFileSync(source, 'utf8');
    assert.match(rewritten, /\/CTI_as_a_Code\/training\/proactive-celltronx\//);
    assert.match(rewritten, /\/israel-government-threat-actors-cti\/actors\/apt42\//);
    assert.deepEqual(rewriteCrosslinks(rewritten).counts, {});
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('rewrite never corrupts a valid child route sharing a stale parent prefix', () => {
  const valid = 'https://1200km.com/cti-analyst-field-manual/docs/actor-research/actor-profile-template/';
  const stale = 'https://1200km.com/cti-analyst-field-manual/docs/actor-research/';
  const result = rewriteCrosslinks(`<a href="${valid}">valid</a><a href="${stale}">stale</a>`);
  assert.equal(result.output.matchAll(/actor-profile-template\/actor-profile-template/g).next().done, true);
  assert.equal((result.output.match(/actor-profile-template\//g) || []).length, 2);
  assert.equal(result.counts[stale], 1);
});

test('Docusaurus CTI source routes are normalized before its base URL is applied', () => {
  assert.equal(ctiSourceRewrites.length, 9);
  const input = '[Assignment](/docs/training/02-proactive-celltronx) [Catalog](/docs/training)';
  const { output, counts } = rewriteCrosslinks(input, ctiSourceRewrites);
  assert.equal(output, '[Assignment](/CTI_as_a_Code/training/proactive-celltronx/) [Catalog](/CTI_as_a_Code/training/)');
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), 2);
});

test('every canonical destination must be emitted into the static artifact', () => {
  const root = mkdtempSync(join(tmpdir(), '1200km-crosslink-targets-'));
  try {
    const navigator = '/CTI_as_a_Code/investigations/lifetech-2024-11/03-analysis/attck-mapping/attck-navigator-layer.json';
    for (const { to } of crosslinkRewrites) {
      if (to === navigator) continue;
      const pathname = new URL(to, 'https://1200km.com').pathname;
      const relative = decodeURIComponent(pathname).replace(/^\//, '');
      const file = join(root, relative, 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, 'target');
    }
    assert.deepEqual(missingCrosslinkTargets(root), [navigator]);
    const file = join(root, navigator.slice(1));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, '{}');
    assert.deepEqual(missingCrosslinkTargets(root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
