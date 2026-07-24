import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  PERSON_ID,
  SOFTWARE_ID,
  WEBSITE_ID,
  connectedGraphFromHtml,
  normalizeDocusaurusBrandLogoAlts,
  normalizeSeoTitle,
  transformReleaseHtml,
} from '../scripts/release-html-lib.mjs';

function objectById(graph, id) {
  return graph.find((object) => object['@id'] === id);
}

test('homepage emits a WebPage connected to the stable AdversaryGraph entity', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const canonical = 'https://1200km.com/';
  const output = transformReleaseHtml(html, {
    canonical,
    dateModified: '2026-07-20',
    titleMap: new Map([[canonical, 'Home']]),
    htmlPath: new URL('../index.html', import.meta.url).pathname,
    siteRoot: new URL('..', import.meta.url).pathname,
  });
  const graph = connectedGraphFromHtml(output);
  const page = objectById(graph, `${canonical}#webpage`);
  const software = objectById(graph, SOFTWARE_ID);
  assert.equal(page['@type'], 'WebPage');
  assert.deepEqual(page.isPartOf, { '@id': WEBSITE_ID });
  assert.deepEqual(page.mainEntity, { '@id': SOFTWARE_ID });
  assert.deepEqual(software.mainEntityOfPage, { '@id': page['@id'] });
  assert.deepEqual(software.author, { '@id': PERSON_ID });
  assert.equal(/<meta\b[^>]*name=["']keywords["']/i.test(output), false);
});

test('an archive article receives connected article semantics and deterministic dates', () => {
  const canonical = 'https://1200km.com/articles/read/2026/example-article/';
  const input = `<!doctype html><html lang="en"><head>
    <title>Example Research | 1200km Security Research Articles | 1200km</title>
    <meta name="description" content="A visible research summary.">
    <meta name="keywords" content="legacy, keywords">
    <meta property="og:type" content="article">
    <meta property="og:title" content="Example Research | 1200km Security Research Articles | 1200km">
    <link rel="canonical" href="${canonical}">
  </head><body><nav aria-label="Primary"></nav><main><article><h1>Example Research</h1><p>A visible research summary.</p></article></main></body></html>`;
  const output = transformReleaseHtml(input, {
    canonical,
    datePublished: '2026-02-03',
    dateModified: '2026-02-05',
  });
  const graph = connectedGraphFromHtml(output);
  const article = objectById(graph, `${canonical}#article`);
  const page = objectById(graph, `${canonical}#webpage`);
  assert.equal(article['@type'], 'TechArticle');
  assert.equal(article.headline, 'Example Research');
  assert.equal(article.url, canonical);
  assert.equal(article.datePublished, '2026-02-03');
  assert.equal(article.dateModified, '2026-02-05');
  assert.deepEqual(article.mainEntityOfPage, { '@id': page['@id'] });
  assert.deepEqual(article.author, { '@id': PERSON_ID });
  assert.deepEqual(article.publisher, { '@id': PERSON_ID });
  assert.match(output, /<meta property="article:published_time" content="2026-02-03"/);
  assert.match(output, /<meta property="article:modified_time" content="2026-02-05"/);
  assert.match(output, /<title>Example Research \| 1200km<\/title>/);
  assert.equal(output.includes('legacy, keywords'), false);
});

test('only a real Question and acceptedAnswer collection remains FAQPage', () => {
  const canonical = 'https://1200km.com/faq/';
  const input = `<!doctype html><html lang="en"><head><title>Questions</title><meta name="description" content="Questions and answers"><script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: 'What is this?',
      acceptedAnswer: { '@type': 'Answer', text: 'A governed test page.' },
    }],
  })}</script></head><body><nav></nav><main><h1>Questions</h1></main></body></html>`;
  const output = transformReleaseHtml(input, { canonical, dateModified: '2026-07-22' });
  const page = objectById(connectedGraphFromHtml(output), `${canonical}#webpage`);
  assert.equal(page['@type'], 'FAQPage');
  assert.equal(page.mainEntity[0]['@type'], 'Question');
  assert.equal(page.mainEntity[0].acceptedAnswer['@type'], 'Answer');
});

test('known generated title suffixes are shortened without truncating the content title', () => {
  assert.equal(
    normalizeSeoTitle('Architecture Diagrams | AdversaryGraph Documentation — CTI-to-Detection Workbench | 1200km'),
    'Architecture Diagrams | AdversaryGraph Docs',
  );
  assert.equal(
    normalizeSeoTitle('AdversaryGraph — Commercial-Ready CTI-to-Detection Workbench | 1200km | AdversaryGraph Documentation — CTI-to-Detection Workbench | 1200km'),
    'Commercial-Ready CTI-to-Detection Workbench | AdversaryGraph Docs',
  );
  assert.equal(
    normalizeSeoTitle('Identity Governance & Administration (IGA) | ITDR – Identity Threat Detection & Response'),
    'Identity Governance & Administration (IGA) | ITDR',
  );
  assert.equal(
    normalizeSeoTitle('A deliberately long article title that must remain complete | 1200km'),
    'A deliberately long article title that must remain complete | 1200km',
  );
});

test('Docusaurus brand logos are decorative when adjacent title text names the site', () => {
  const input = '<a class="navbar__brand" href="/docs/"><div class="navbar__logo"><img src="/logo.png" alt="1200km"></div><b class="navbar__title">Research guide</b></a>';
  assert.match(normalizeDocusaurusBrandLogoAlts(input), /<img src="\/logo\.png" alt="">/);
  const standalone = '<img src="/evidence.png" alt="AdversaryGraph investigation graph">';
  assert.equal(normalizeDocusaurusBrandLogoAlts(standalone), standalone);
});
