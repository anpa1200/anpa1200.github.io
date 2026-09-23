import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root=resolve(new URL('../research/adversarygraph-pcap-stories/',import.meta.url).pathname);
const text=name=>readFileSync(join(root,name),'utf8');
const json=name=>JSON.parse(text(name));
const sha=data=>createHash('sha256').update(data).digest('hex');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);

test('twenty-case publication keeps failures and correct model identities visible',()=>{
  const report=json('answer-comparisons.json');
  assert.equal(report.cases.length,20);
  assert.deepEqual(report.statistics.native_outcomes,{partial:12,missed:4,withheld:4});
  assert.equal(json('operational-metrics.json').summaries_passed,16);
  assert.deepEqual(json('operational-metrics.json').model_ids,['claude-opus-4-8','gpt-4.1-2025-04-14']);
  assert.equal((text('ARTICLE.md').match(/^### \d+\./gm)||[]).length,20);
  assert.equal((text('ARTICLE.md').match(/^```text$/gm)||[]).length,20);
  assert.match(text('ARTICLE.md'),/not a pure model-accuracy score/);
  assert.match(text('README.md'),/public derivative/);
});

test('all twenty screenshots retain original bytes and individually reviewed provenance',()=>{
  for(const row of json('answer-comparisons.json').cases){
    const proof=json(`${row.date}/screenshot-validation.json`);
    const digest=sha(readFileSync(join(root,`${row.date}/screen-summary.png`)));
    assert.equal(digest,proof.screenshot_sha256,row.date);
    assert.equal(digest,proof.visual_review.image_sha256,row.date);
    assert.equal(proof.visual_review.status,'passed');
    assert.equal(proof.capture_sha256,row.capture_sha256);
    assert.equal(proof.native_summary_saved,row.native_summary_saved);
    assert.ok(existsSync(join(root,`${row.date}/SHORT-REPORT.html`)));
    assert.ok(existsSync(join(root,`${row.date}/REVIEWED-SHORT-REPORT.html`)));
  }
  assert.equal(sha(readFileSync(join(root,'cover.png'))),'909c699acd4fef964bf9809cbfcb3b657071c3ffc4c7b14f879eccf2b12ca14c');
});

test('public evidence payloads and bundle match their declared hashes',()=>{
  for(const name of ['SHA256SUMS','DOWNLOAD.sha256'])for(const line of text(name).trim().split('\n')){
    const [expected,path]=line.split('  ');assert.equal(sha(readFileSync(join(root,path))),expected,path);
  }
  for(const entry of json('PUBLIC-PROVENANCE.json').public_files){
    assert.equal(sha(readFileSync(join(root,entry.file))),entry.public_sha256,entry.file);
    if(entry.file.endsWith('.png'))assert.equal(entry.byte_identical,true);
  }
});

test('public supplement excludes local URLs, payload binaries and broken relative links',()=>{
  for(const file of walk(root)){
    assert.doesNotMatch(file,/\.(?:pcap|pcapng|exe|dll|eml|pdf)$/i);
    if(!/\.(?:html|md|json)$/.test(file))continue;
    const value=readFileSync(file,'utf8');
    assert.doesNotMatch(value,/\/home\/andrey\/|https?:\/\/(?:127\.0\.0\.1|localhost)/,file);
    assert.doesNotMatch(value,/\bAIza[0-9A-Za-z_-]{30,}\b/,file);
    if(!file.endsWith('.html'))continue;
    for(const match of value.matchAll(/(?:href|src)="([^"#]+)"/g)){
      const target=match[1];if(/^(?:[a-z]+:|\/)/i.test(target))continue;
      assert.ok(existsSync(resolve(dirname(file),target.split('#')[0])),`${file}: ${target}`);
    }
  }
});
