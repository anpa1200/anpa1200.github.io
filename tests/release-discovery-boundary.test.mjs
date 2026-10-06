import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const facts = JSON.parse(read('data/site-facts.json')).facts;
test('stable documentation and moving development branch have separate provenance', () => {
  assert.equal(facts['adversarygraph.current_source_release'].status, 'released');
  assert.equal(facts['adversarygraph.current_source_release'].value, facts['adversarygraph.latest_release_tag'].value);
  assert.match(facts['adversarygraph.current_source_release'].scope, /does not describe.*development/);
  assert.equal(facts['adversarygraph.development_version'].status, 'current-development');
  const commit = facts['adversarygraph.development_commit'].value;
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.ok(facts['adversarygraph.development_version'].source.some(url => url.includes(`/blob/${commit}/VERSION`)));
});
test('AI discovery surfaces preserve stable versus development boundaries', () => {
  for (const path of ['llms.txt', 'llms-full.txt', 'agent-index.md', 'index.md', 'adversarygraph.md', 'projects.html', 'adversarygraph/full-version-feature-guides.html', 'adversarygraph-docs/unified-rag-mcp.md']) {
    const text = read(path);
    if (['llms.txt', 'llms-full.txt', 'agent-index.md', 'index.md', 'adversarygraph.md'].includes(path)) assert.ok(text.includes(facts['adversarygraph.development_version'].value), path);
    assert.ok(text.includes(facts['adversarygraph.latest_release_tag'].value), path);
    assert.doesNotMatch(text, /immutable\s+(?:GitHub\s+)?(?:release|tag)|not an immutable tag until|main is at v7\.0\.0/i, path);
  }
});
