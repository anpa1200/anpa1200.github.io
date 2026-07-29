import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

test('knowledge mesh covers every Cyber Knowledge domain and practitioner module', async () => {
  const [mesh, catalog] = await Promise.all([
    readJson('data/attack-knowledge-mesh.json'),
    readJson('data/cyber-knowledge.json'),
  ]);
  assert.match(mesh.attack.version, /^\d+(?:\.\d+)+$/, 'ATT&CK version is missing or invalid');
  assert.deepEqual(
    [...new Set(mesh.modules.map((module) => module.domain_id))].sort(),
    catalog.domains.map((domain) => domain.id).sort(),
  );
  assert.equal(mesh.modules.length, 150);
  for (const module of mesh.modules) {
    assert.ok(module.techniques.length > 0, `${module.id} has no technique tags`);
    assert.ok(module.tactics.length > 0, `${module.id} has no tactic tags`);
    assert.match(module.url, /^\/cyber-knowledge\/.+#(?:m|module-)\d+$/);
  }
});

test('every ATT&CK technique has a governed Cyber Knowledge route', async () => {
  const [mesh, attack] = await Promise.all([
    readJson('data/attack-knowledge-mesh.json'),
    readJson('threat-matrix/mitre-data.json'),
  ]);
  assert.equal(Object.keys(mesh.techniques).length, attack.techniques.length);
  for (const technique of attack.techniques) {
    const routes = mesh.techniques[technique.id]?.knowledge_routes || [];
    assert.ok(routes.length > 0, `${technique.id} has no knowledge route`);
    assert.ok(routes.every((route) => ['explicit-id', 'explicit-name', 'topic-match', 'tactic-route'].includes(route.basis)));
  }
});

test('official defensive relationships survive the public ATT&CK transform', async () => {
  const attack = await readJson('threat-matrix/mitre-data.json');
  const defense = await readJson('threat-matrix/mitre-defense-data.json');
  assert.ok(Buffer.byteLength(JSON.stringify(attack)) < 2 * 1024 * 1024, 'interactive ATT&CK bundle exceeds 2 MiB');
  assert.equal(defense.version, attack.version);
  const mitigationCount = defense.techniques.flatMap((technique) => technique.mitigations || []).length;
  const strategyCount = defense.techniques.flatMap((technique) => technique.detection_strategies || []).length;
  const analyticCount = defense.techniques.flatMap((technique) =>
    (technique.detection_strategies || []).flatMap((strategy) => strategy.analytics || [])).length;
  assert.equal(mitigationCount, 1448);
  assert.equal(strategyCount, 697);
  assert.equal(analyticCount, 1745);
});

test('matrix module and static pages expose the same knowledge mesh', async () => {
  const page = await readFile('cyber-knowledge/attack-matrix.html', 'utf8');
  assert.match(page, /MITRE ATT&amp;CK Knowledge Mesh/);
  assert.match(page, /attack-matrix-module\.js/);
  assert.match(page, /id="methodology"/);
  assert.doesNotMatch(page, /Loading ATT&amp;CK mesh/);
  assert.match(page, /data-bundle-date="\d{4}-\d{2}-\d{2}"/);
  assert.match(page, /© 2026 The MITRE Corporation\. This work is reproduced and distributed with the permission of The MITRE Corporation\./);
  assert.match(page, /class="mesh-tactic"/, 'server-rendered matrix fallback is missing');
  for (const path of ['cyber-knowledge/cti.html', 'cyber-knowledge/ai-security.html', 'threat-matrix/techniques/T1059.003/index.html']) {
    const html = await readFile(path, 'utf8');
    assert.match(html, /ATTACK_KNOWLEDGE_MESH_START/, `${path} lacks generated mesh`);
  }
});

test('runtime ATT&CK audit preserves live, retired, defensive, and failure semantics', async () => {
  const [attack, defense, app, builder] = await Promise.all([
    readJson('threat-matrix/mitre-data.json'),
    readJson('threat-matrix/mitre-defense-data.json'),
    readFile('assets/attack-matrix-module.js', 'utf8'),
    readFile('scripts/build-attack-knowledge-mesh.mjs', 'utf8'),
  ]);
  assert.ok(attack.version);
  assert.ok(attack.retrieved_at);
  assert.deepEqual(
    attack.tactics.filter((item) => item.id === 'TA0005' || item.id === 'TA0112').map((item) => item.name).sort(),
    ['Defense Impairment', 'Stealth'],
  );
  assert.equal(attack.tactics.some((item) => item.name === 'Defense Evasion'), false);
  assert.equal(attack.techniques.some((item) => item.id.startsWith('T1562')), false);
  assert.deepEqual(
    attack.techniques.filter((item) => item.id === 'T1685' || item.parent_id === 'T1685').map((item) => item.id).sort(),
    ['T1685', 'T1685.001', 'T1685.002', 'T1685.003', 'T1685.004', 'T1685.005', 'T1685.006'],
  );
  for (const [id, subCount] of [['T1078', 4], ['T1685', 6], ['T1027', 18], ['T1059', 13], ['T1566', 4]]) {
    assert.equal(attack.techniques.filter((item) => item.parent_id === id).length, subCount, `${id} sub-technique count drifted`);
  }
  assert.equal(attack.revoked_techniques.find((item) => item.id === 'T1562')?.successor?.id, 'T1685');
  const strategy = defense.techniques.flatMap((item) => item.detection_strategies || []).find((item) => item.id === 'DET0425');
  assert.equal(strategy?.references?.[0]?.url, 'https://attack.mitre.org/detectionstrategies/DET0425');
  assert.ok(strategy.analytics.length > 0);
  assert.ok(strategy.analytics.every((item) => item.references.some((reference) => reference.url.includes(`#${item.id}`))));
  for (const label of ['Explicit ATT&CK ID', 'Exact technique name', 'Governed topic match', 'Tactic learning route']) assert.match(app, new RegExp(label));
  assert.match(app, /last successful bundle build/);
  assert.match(app, /mitre-defense-data\.json/);
  assert.doesNotMatch(builder, new RegExp(`ATT&CK ${attack.version.replace('.', '\\.')}`), 'current ATT&CK version is hardcoded in the page generator');
});
