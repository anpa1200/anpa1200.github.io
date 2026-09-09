import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { citationArtifacts, validateMapping } from '../scripts/editorial-integrity-lib.mjs';
const json = p => JSON.parse(readFileSync(p, 'utf8'));
test('every reference and assessment has an ordinary static page with its stable ID', () => {
  for (const [name, model, field] of [['reference', 'data/reference-library.json', 'records'], ['knowledge', 'data/knowledge-sources.json', 'sources']]) {
    const data = json(`data/${name}-browser-index.json`),
      rows = Array.isArray(data) ? data : data.records;
    assert.equal(rows.length, json(model)[field].length);
    assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
    const pages = new Map();
    for (const row of rows) {
      const p = row.page.slice(1) + 'index.html';
      if (!pages.has(p)) pages.set(p, readFileSync(p, 'utf8'));
      assert.ok(pages.get(p).includes(`id="${row.id}"`), row.id);
    }
    for (const [p, html] of pages) {
      assert.ok(statSync(p).size < (name === 'reference' ? 200000 : 250000), `${p} exceeds decoded HTML budget`);
      assert.ok(html.includes('aria-label="' + (name === 'reference' ? 'Reference pages' : 'Source directory pages') + '"'));
    }
  }
});
test('citation guard rejects publication artifacts but allows intentional code examples', () => {
  assert.equal(citationArtifacts('Claim【17†L1-L2】').length, 1);
  assert.equal(citationArtifacts('```text\n【17†L1-L2】\n``` and `【17†L1】`').length, 0);
});
test('mapping validator rejects wrong labels, domains, retired records and missing evidence', () => {
  const manifest = {
    framework: 'MITRE ATT&CK',
    release: '19.1',
    domain: 'enterprise-attack',
    records: [{
      id: 'T1059.003',
      name: 'Windows Command Shell'
    }]
  };
  const m = {
    framework: manifest.framework,
    release: manifest.release,
    domain: manifest.domain,
    id: 'T1059.003',
    name: 'Windows Command Shell',
    evidence_url: 'https://attack.mitre.org/techniques/T1059/003/',
    review_boundary: 'taxonomy only'
  };
  assert.ok(validateMapping(m, manifest));
  for (const patch of [{
    name: 'PowerShell'
  }, {
    domain: 'mobile-attack'
  }, {
    id: 'T9999'
  }, {
    release: '18'
  }, {
    evidence_url: ''
  }]) assert.throws(() => validateMapping({
    ...m,
    ...patch
  }, manifest));
  assert.throws(() => validateMapping(m, {
    ...manifest,
    records: [{
      ...manifest.records[0],
      revoked: true
    }]
  }));
});
test('Enterprise defense release agrees and command-shell strategy retains analytic data components', () => {
  const core = json('threat-matrix/mitre-data.json'),
    defense = json('threat-matrix/mitre-defense-data.json');
  assert.equal(core.version, defense.version);
  assert.equal(core.domain, defense.domain);
  const t = defense.techniques.find(t => t.id === 'T1059.003');
  assert.ok(t.detection_strategies.some(s => s.id === 'DET0202'));
  assert.ok(t.detection_strategies.flatMap(s => s.analytics).flatMap(a => a.log_sources).every(l => l.data_component?.id));
});
test('benign fixture identifies the intended positive and rejects independent negative controls', () => {
  const result = JSON.parse(execFileSync('python3', ['learning-paths/command-shell-validation/validate.py'], {
    encoding: 'utf8'
  }));
  assert.deepEqual(result, {
    candidate_ids: ['word-shell'],
    events_read: 6
  });
  execFileSync('python3', ['-c', "import runpy; c=runpy.run_path('learning-paths/command-shell-validation/validate.py')['candidate']; assert not c({}); assert c({'EventID':'4688','ParentProcessName':'winword.exe','NewProcessName':'CMD.EXE'})"]);
});
test('reader RSS excludes taxonomy and retains substantive research with stable GUIDs', () => {
  const feed = readFileSync('feed.xml', 'utf8');
  assert.doesNotMatch(feed, /<link>[^<]*(?:trainsec\/(?:authors|domains)|trainsec-library\.html)/);
  assert.match(feed, /<link>https:\/\/1200km.com\/ai-attack-statistics\/<\/link>/);
  assert.match(feed, /<link>https:\/\/1200km.com\/learning-paths\/command-shell-validation\/<\/link>/);
  for (const item of feed.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const link = item[1].match(/<link>(.*?)<\/link>/)?.[1];
    assert.ok(item[1].includes(`<guid isPermaLink="true">${link}</guid>`));
    assert.ok(Number.isFinite(Date.parse(item[1].match(/<pubDate>(.*?)<\/pubDate>/)?.[1])));
  }
  const sitemap = readFileSync('sitemap-all.xml', 'utf8');
  assert.match(sitemap, /<loc>https:\/\/1200km.com\/<\/loc>\s*<lastmod>2026-09-09<\/lastmod>/);
  assert.match(sitemap, /<loc>https:\/\/1200km.com\/external-validation.html<\/loc>\s*<lastmod>2026-09-03<\/lastmod>/);
});
