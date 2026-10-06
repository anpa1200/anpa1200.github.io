import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeMetaDescriptions, connectedGraphFromHtml } from '../scripts/release-html-lib.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const descriptions = JSON.parse(read('data/seo-descriptions.json')).descriptions;
const validationUrl = 'https://1200km.com/external-validation.html';
const pharmaUrl = 'https://1200km.com/articles/read/2026/cyberattacks-on-big-pharma-and-its-ecosystem/';

test('curated flagship article summary survives release normalization without a long title prefix', () => {
  const source = `<html><head><title>Cyberattacks on Big Pharma and Its Ecosystem: Threat Actors, Attack Surfaces, TTPs, and Defensible Lessons | 1200km</title><link rel="canonical" href="${pharmaUrl}"><meta name="description" content="An incomplete older description."></head><body></body></html>`;
  const output = normalizeMetaDescriptions(source);
  assert.ok(output.includes(`name="description" content="${descriptions[pharmaUrl]}"`));
  assert.ok(output.includes(`property="og:description" content="${descriptions[pharmaUrl]}"`));
  assert.ok(output.includes(`name="twitter:description" content="${descriptions[pharmaUrl]}"`));
  assert.equal(normalizeMetaDescriptions(output), output, 'repeated builds must not prepend titles');
});

test('validation metadata matches the substantive content update and sitemap', () => {
  const html = read('external-validation.html');
  const page = connectedGraphFromHtml(html).find((item) => item['@id'] === `${validationUrl}#webpage`);
  assert.ok(page, 'validation WebPage metadata exists');
  const verifiedDates = [...html.matchAll(/(?:verified|checked)\s+(\d{4}-\d{2}-\d{2})/gi)].map((match) => match[1]);
  assert.ok(verifiedDates.length > 0);
  assert.ok(page.dateModified >= verifiedDates.sort().at(-1), 'metadata cannot predate the stated evidence review');
  const sitemapEntry = read('sitemap.xml').match(/<url>\s*<loc>https:\/\/1200km\.com\/external-validation\.html<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/);
  assert.equal(sitemapEntry?.[1], page.dateModified);
  assert.equal(page.description, descriptions[validationUrl]);
  assert.equal(normalizeMetaDescriptions(html), html, 'source description agrees with curated release output');
});
