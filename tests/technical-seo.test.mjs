import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyTechnicalSeo, applyIndexPolicy, contentSignals, repairSchemaDomains, sitemapEligible } from '../scripts/technical-seo-lib.mjs';

test('metadata updates preserve SVG titles and non-intro article body', () => {
  const html = '<html><head><title>Old</title></head><body><main><h1 id="stable">Existing</h1><p>Original body.</p><svg><title>Diagram meaning</title></svg></main></body></html>';
  const result = applyTechnicalSeo(html, 'https://1200km.com/threat-matrix/');
  assert.match(result, /<title>Diagram meaning<\/title>/);
  assert.match(result, /<h1 id="stable">Existing<\/h1><p>Original body\.<\/p>/);
  assert.match(result, /lang="en"/);
  assert.match(result, /index,follow,max-image-preview:large/);
  assert.equal(applyTechnicalSeo(result, 'https://1200km.com/threat-matrix/'), result);
});
test('thin pages stay accessible but are omitted from the sitemap', () => {
  const url = 'https://1200km.com/references/page/2/';
  assert.match(applyIndexPolicy('<html><head></head><body>Retained</body></html>', url), /noindex,follow/);
  assert.equal(sitemapEligible(url), false);
});
test('existing noindex is not silently changed into index', () => {
  const input = '<html lang="en"><head><meta name="robots" content="noindex,follow"></head></html>';
  assert.equal(applyIndexPolicy(input, 'https://1200km.com/cover-letter.html'), input);
});
test('homepage keeps its H1 while updating only the lead', () => {
  const input = '<html><head><title>Home</title></head><body><h1 id="hero">Threat intelligence that turns into detection.</h1><p>Old intro</p><p>Unchanged paragraph</p></body></html>';
  const result = applyTechnicalSeo(input, 'https://1200km.com/');
  assert.match(result, /<h1 id="hero">Threat intelligence that turns into detection\.<\/h1>/);
  assert.match(result, /<p>Unchanged paragraph<\/p>/);
});
test('Docusaurus postprocessing never edits the hydration tree', () => {
  const body = '<body><div id="__docusaurus"><h1>Source-owned title</h1><p>Source-owned intro</p></div></body>';
  assert.ok(applyTechnicalSeo('<html><head><title>Old</title></head>' + body + '</html>', 'https://1200km.com/adversarygraph-docs/').includes(body));
});
test('extra standalone H1s are demoted with anchors and text retained', () => {
  const input = '<html><head><title>T</title></head><body><h1>First</h1><h1 id="keep">Second <em>heading</em></h1></body></html>';
  assert.match(applyTechnicalSeo(input, 'https://1200km.com/threat-matrix/'), /<h2 id="keep">Second <em>heading<\/em><\/h2>/);
});
test('schema repairs preserve repository data on a permitted dual type', () => {
  const result = repairSchemaDomains({ '@type': 'SoftwareApplication', codeRepository: 'https://github.com/anpa1200/adversarygraph' });
  assert.deepEqual(result['@type'], ['SoftwareApplication', 'SoftwareSourceCode']);
  assert.equal(result.codeRepository, 'https://github.com/anpa1200/adversarygraph');
});
test('image dimensions use measured quantitative values, not invented dimensions', () => {
  assert.deepEqual(repairSchemaDomains({ '@type': 'ImageObject', width: 1200 }), { '@type': 'ImageObject', width: { '@type': 'QuantitativeValue', value: 1200, unitText: 'px' } });
});
test('content word counts use the whole main, not the first card', () => {
  assert.equal(contentSignals('<main><article>first card</article><article>second card</article></main>').wordCount, 4);
});
test('HowTo candidates require actual step headings and stable anchors', () => {
  assert.equal(contentSignals('<main><h2 id="a">Overview</h2><h2 id="b">Advantages</h2></main>').steps.length, 0);
  assert.equal(contentSignals('<main><h2 id="a">Step 1: Install</h2><h2 id="b">Step 2: Verify</h2></main>').steps.length, 2);
});
test('reviewed indexable metadata is unique and within editorial limits', () => {
  const { pages } = JSON.parse(readFileSync(new URL('../data/seo-policy.json', import.meta.url)));
  for (const key of ['title', 'description']) {
    const seen = new Map();
    for (const [url, p] of Object.entries(pages)) {
      if (!['Priority', 'Supporting'].includes(p.classification)) continue;
      const [min, max] = key === 'title' ? [30, 60] : [120, 155];
      assert.ok(p[key].length >= min && p[key].length <= max, `${url}: ${key} length ${p[key].length}`);
      assert.ok(!seen.has(p[key]), `${url}: duplicate ${key} with ${seen.get(p[key])}`);
      seen.set(p[key], url);
    }
  }
});
