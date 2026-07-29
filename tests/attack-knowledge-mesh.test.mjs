import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

test('knowledge mesh covers every Cyber Knowledge domain and practitioner module', async () => {
  const [mesh, catalog] = await Promise.all([
    readJson('data/attack-knowledge-mesh.json'),
    readJson('data/cyber-knowledge.json'),
  ]);
  assert.equal(mesh.attack.version, '19.1');
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
  const mitigationCount = attack.techniques.flatMap((technique) => technique.mitigations || []).length;
  const strategyCount = attack.techniques.flatMap((technique) => technique.detection_strategies || []).length;
  const analyticCount = attack.techniques.flatMap((technique) =>
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
  for (const path of ['cyber-knowledge/cti.html', 'cyber-knowledge/ai-security.html', 'threat-matrix/techniques/T1059.003/index.html']) {
    const html = await readFile(path, 'utf8');
    assert.match(html, /ATTACK_KNOWLEDGE_MESH_START/, `${path} lacks generated mesh`);
  }
});
