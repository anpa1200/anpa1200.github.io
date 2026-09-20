import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(new URL('../research/adversarygraph-ten-pcaps/', import.meta.url).pathname);
const read = name => readFileSync(join(root, name), 'utf8');
const json = name => JSON.parse(read(name));
const sha = data => createHash('sha256').update(data).digest('hex');
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]);

test('public evidence covers only the ten additional cases and preserves qualified metrics', () => {
  const summary = json('evidence/summary.json');
  assert.equal(summary.cases.length, 10);
  assert.deepEqual([summary.totals.packets, summary.totals.facts_correct, summary.totals.facts_total, summary.totals.indicators_available, summary.totals.indicators_total], [263116, 52, 52, 87, 88]);
  assert.equal(summary.totals.enriched_unique_indicators, 52);
  assert.equal(summary.totals.case_indicator_associations, 53);
  assert.equal(summary.totals.llm_tokens, 0);
  assert.match(read('article.md'), /not evidence of 98.86% malware-detection accuracy/);
  assert.match(read('README.md'), /not a byte-identical release/);
  assert.match(read('README.md'), /do not let a reader independently replay/);
});

test('all case reports, ten original PDFs and twenty original screenshots are present', () => {
  for (const { date } of json('evidence/summary.json').cases) {
    for (const name of ['REPORT.md', 'REPORT.html', 'NATIVE-REPORT.md', 'api-upload.json', 'ENRICHMENT.html']) {
      assert.ok(existsSync(join(root, `reports/cases/${date}/${name}`)), `${date}/${name}`);
    }
    assert.equal(readFileSync(join(root, `reports/cases/${date}/pdf-export-fixed.pdf`)).subarray(0, 5).toString(), '%PDF-');
  }
  const images = json('evidence/screenshot-verification.json').screenshots;
  assert.equal(images.length, 20);
  for (const image of images) assert.equal(sha(readFileSync(join(root, image.file))), image.sha256);
});

test('52 public provider summaries retain outcomes without bulk raw responses', () => {
  const metrics = json('evidence/enrichment-metrics.json');
  assert.equal(metrics.length, 52);
  for (const lookup of metrics) {
    const result = json(`reports/${lookup.file}`);
    assert.equal(result.artifact, lookup.artifact);
    assert.equal(result.sources.length, 10);
    assert.ok(result.sources.every(source => !Object.hasOwn(source, 'raw')));
    assert.equal(Object.hasOwn(result, 'ai_input'), false);
    assert.match(result.public_note, /not the complete provider response/);
  }
  const example = json('reports/enrichment/5227c07b63528de74033.json');
  assert.equal(example.suspicion_score, 100);
  assert.match(example.sources.find(s => s.source === 'virustotal').summary, /0 engines marked malicious and 1 suspicious; 53 harmless/);
});

test('public payloads and downloadable bundle match their checksums', () => {
  for (const manifest of ['SHA256SUMS', 'DOWNLOAD.sha256']) {
    for (const line of read(manifest).trim().split('\n')) {
      const [expected, file] = line.split('  ');
      assert.equal(sha(readFileSync(join(root, file))), expected, file);
    }
  }
  for (const row of json('evidence/source-provenance.json').public_files) {
    assert.equal(sha(readFileSync(join(root, row.file))), row.public_sha256, row.file);
  }
});

test('public supplement has no workstation URLs or broken local report links', () => {
  for (const file of files(root).filter(file => /\.(html|md|json)$/.test(file))) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\/home\/andrey\/|https?:\/\/(?:127\.0\.0\.1|localhost)/, file);
    if (!file.endsWith('.html')) continue;
    for (const match of text.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      const target = match[1];
      if (/^(?:[a-z]+:|\/)/i.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(file), target.split('#')[0])), `${file}: ${target}`);
    }
  }
});
