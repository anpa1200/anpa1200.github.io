import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function techniqueInTactic(technique, tactic) {
  const techniqueTactics = new Set((technique.tactic_ids || []).filter(Boolean).map(value => String(value).toLowerCase()));
  return [tactic.id, tactic.shortname, slugify(tactic.name || '')]
    .filter(Boolean)
    .some(alias => techniqueTactics.has(String(alias).toLowerCase()));
}

function isSubTechnique(technique) {
  return Boolean(technique.is_sub || technique.parent_id || /\.\d{3}$/.test(technique.id || ''));
}

test('Threat Matrix Enterprise ATT&CK data renders non-empty Navigator columns', async () => {
  const data = await readJson('threat-matrix/mitre-data.json');
  assert.equal(data.version, '19.1');
  assert.equal(data.source?.name, 'MITRE ATT&CK STIX data');
  assert.ok(data.techniques.length >= 690);
  assert.ok(data.groups.length >= 170);

  const emptyTactics = data.tactics
    .map(tactic => ({
      tactic: tactic.name,
      count: data.techniques.filter(technique => !isSubTechnique(technique) && techniqueInTactic(technique, tactic)).length,
    }))
    .filter(row => row.count === 0);

  assert.deepEqual(emptyTactics, []);
});

test('Threat Matrix static demo libraries meet requested public demo sizes', async () => {
  const iocs = await readJson('threat-matrix/demo-data/iocs.json');
  const cves = await readJson('threat-matrix/demo-data/cves.json');

  assert.equal(iocs.source?.name, 'abuse.ch URLhaus recent URL feed');
  assert.ok(iocs.items.length >= 2000);
  assert.equal(cves.source?.name, 'CISA Catalog of Known Exploited Vulnerabilities');
  assert.ok(cves.items.length >= 300);
});
