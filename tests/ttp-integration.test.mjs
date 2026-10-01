import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tagPath } from '../ttp-simulation/assets/tag-links.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = join(root, 'ttp-simulation');
const json = (p) => JSON.parse(readFileSync(join(base, p), 'utf8'));
const html = (p) => readFileSync(join(base, p, 'index.html'), 'utf8');
const integration = json('data/integration.json');
const catalog = json('data/catalog.json');
const quote = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('all technique, telemetry, tool and original rule pages are published references', () => {
  assert.equal(integration.counts.simulations, 918);
  assert.equal(integration.counts.detection_workspaces, 918);
  assert.equal(integration.counts.tools, 116);
  assert.equal(integration.counts.telemetry, 139);
  assert.equal(integration.counts.sigma_rules, 2791);
  for (const page of integration.pages) {
    const body = html(page.page);
    assert.match(body, /data-pagefind-body/, page.page);
    if (page.kind === 'tag') assert.match(body, /<meta name="robots" content="noindex,follow">/, page.page);
    else assert.doesNotMatch(body, /content="noindex/, page.page);
    assert.equal((body.match(/<h1\b/g) || []).length, 1, page.page);
    assert.match(body, new RegExp(`rel="canonical" href="https://1200km.com/ttp-simulation/${quote(page.page)}"`));
    assert.match(body, /No browser attack runner or production-validated detector is asserted/);
  }
});

test('every tag resolves to a populated page with exact reciprocal members', () => {
  assert.equal(integration.tags.length, integration.counts.tag_pages);
  for (const tag of integration.tags) {
    assert.equal(tag.page, tagPath(tag.facet, tag.value));
    assert.ok(tag.members.length, tag.page);
    const body = html(tag.page);
    for (const member of tag.members) {
      assert.ok(existsSync(join(base, member.page, 'index.html')), member.page);
      assert.ok(body.includes(`href="/ttp-simulation/${member.page}"`), `${tag.page} -> ${member.page}`);
      assert.ok(html(member.page).includes(`href="/ttp-simulation/${tag.page}"`), `${member.page} -> ${tag.page}`);
    }
  }
});

test('all TTP detection links and telemetry/tool back-references are exact', () => {
  for (const row of catalog.records) {
    assert.ok(html(row.page).includes(`/ttp-simulation/${row.detections.page}`));
    assert.ok(html(row.detections.page).includes(`/ttp-simulation/${row.page}`));
    for (const ref of row.telemetry_references) {
      assert.ok(html(ref.page).includes(`/ttp-simulation/${row.page}`));
      assert.ok(html(ref.page).includes(`/ttp-simulation/${row.detections.page}`));
    }
    for (const ref of row.tool_references) {
      assert.ok(html(ref.page).includes(`/ttp-simulation/${row.page}`));
      assert.ok(html(ref.page).includes(`/ttp-simulation/${row.detections.page}`));
    }
  }
});

test('individual rules preserve author, source, license, original YAML and tagged TTPs', () => {
  for (const summary of json('data/detection-rules.json').records) {
    const rule = json(summary.data_path);
    const body = html(`detections/rules/${rule.id}/`);
    assert.ok(body.includes(rule.source_sha256));
    assert.ok(body.includes(rule.license_url));
    assert.ok(body.includes(rule.source_url));
    assert.match(body, /not been compiled for a SIEM backend/);
    for (const t of rule.techniques) assert.ok(body.includes(`/ttp-simulation/detections/${t.key}/`));
  }
});

test('existing local actor, technique and hub pages contain durable backlinks', () => {
  for (const row of integration.backlinks) {
    const path = join(root, row.path);
    if (!existsSync(path)) continue; // Article archive is rebuilt by CI; Atlas is a companion repository.
    const body = readFileSync(path, 'utf8');
    assert.equal((body.match(/<!-- ttp-ecosystem:start -->/g) || []).length, 1, row.path);
    for (const link of row.links) assert.ok(body.includes(`/ttp-simulation/${link.target}`), row.path);
  }
});

test('interactive facet URLs have matching generated pages and preserve contexts', () => {
  for (const row of catalog.records) {
    for (const [field, facet] of [['environments', 'environment'], ['platforms', 'platform'], ['tactics', 'tactic'], ['constraints', 'constraint']]) {
      for (const value of row[field]) if (value !== 'None') assert.ok(existsSync(join(base, tagPath(facet, value), 'index.html')));
    }
  }
  const app = readFileSync(join(base, 'assets/catalog-app.mjs'), 'utf8');
  assert.match(app, /chips\(row.environments, 'environment'\)/);
  assert.match(app, /chips\(row.tactics, 'tactic'\)/);
  assert.match(app, /reference.remove\(\)/);
  assert.doesNotMatch(app, /\$\{location\.search\}/, 'Query strings must not flow into HTML templates');
  assert.match(app, /link\.search = location\.search/);
  assert.match(app, /\[data-return-to-catalog\]'\)\.search = location\.search/);
});

test('all three modules participate in global navigation and CI publication', () => {
  const shell = JSON.parse(readFileSync(join(root, 'data/site-shell.json')));
  for (const path of ['/ttp-simulation/', '/ttp-simulation/tools/', '/ttp-simulation/detections/']) {
    assert.ok(shell.secondary_navigation.some((r) => r.href === path));
    assert.ok(shell.sidebar.sections.some((s) => s.links.some((r) => r.href === path)));
  }
  const workflow = readFileSync(join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.ok(workflow.indexOf('Integrate searchable TTP modules') > workflow.indexOf('Build and stage canonical article archive'));
  assert.ok(workflow.indexOf('Integrate searchable TTP modules') < workflow.indexOf('Build canonical metadata and release HTML'));
});

test('actor-tool backlinks use explicit pinned software relationships, not common TTP inference', () => {
  const evidence = json('data/actor-tool-links.json');
  assert.equal(evidence.attack_commit, catalog.source_manifest.attack_commit);
  assert.equal(evidence.source.sha256, catalog.source_manifest.sources.find(r => r.file === 'enterprise.json').sha256);
  assert.equal(new Set(evidence.records.map(r => r.relationship_id)).size, evidence.records.length);
  for (const edge of evidence.records) {
    const tool = json(`data/tools/${edge.tool_id}.json`);
    assert.ok(html(tool.page).includes(`/threat-matrix/actors/${edge.actor_id}/`));
    const actor = readFileSync(join(root, `threat-matrix/actors/${edge.actor_id}/index.html`), 'utf8');
    assert.ok(actor.includes(`/ttp-simulation/${tool.page}`));
    assert.match(edge.source_ref, /^intrusion-set--/);
    assert.match(edge.target_ref, /^(?:tool|malware)--/);
  }
});
