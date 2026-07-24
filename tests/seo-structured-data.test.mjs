import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  PERSON_ID,
  SOFTWARE_ID,
  WEBSITE_ID,
  connectedGraphFromHtml,
  addImageDimensions,
  addLcpPreload,
  normalizeDocusaurusBrandLogoAlts,
  normalizeMetaDescriptions,
  normalizeSocialImages,
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
  const person = objectById(graph, PERSON_ID);
  const website = objectById(graph, WEBSITE_ID);
  assert.equal(page['@type'], 'WebPage');
  assert.deepEqual(page.isPartOf, { '@id': WEBSITE_ID });
  assert.deepEqual(page.mainEntity, { '@id': SOFTWARE_ID });
  assert.deepEqual(software.mainEntityOfPage, { '@id': page['@id'] });
  assert.deepEqual(software.author, { '@id': PERSON_ID });
  assert.equal(software.name, 'AdversaryGraph');
  assert.equal(software.alternateName, 'ThreatMapper');
  assert.equal(software.softwareVersion, '6.0.0');
  assert.equal(software.codeRepository, 'https://github.com/anpa1200/adversarygraph');
  assert.equal(software.license, 'https://github.com/anpa1200/adversarygraph/blob/v6.0.0/LICENSE');
  assert.equal(person.email, 'mailto:1200km@gmail.com');
  assert.equal(person.contactPoint.email, 'mailto:1200km@gmail.com');
  assert.ok(person.sameAs.includes('https://infosecwriteups.com/@1200km'));
  assert.equal(website.name, '1200km Security Research');
  assert.equal(Object.hasOwn(website, 'potentialAction'), false);
  assert.equal(/<meta\b[^>]*name=["']keywords["']/i.test(output), false);
});

test('release images reserve space, lazy-load non-LCP media, and preload explicit LCP media', () => {
  const fixtureRoot = new URL('..', import.meta.url).pathname;
  const regular = addImageDimensions(
    '<main><img src="/assets/ap-logo.png" alt="Evidence image"></main>',
    { htmlPath: `${fixtureRoot}index.html`, siteRoot: fixtureRoot },
  );
  assert.match(regular, /width="\d+"/);
  assert.match(regular, /height="\d+"/);
  assert.match(regular, /loading="lazy"/);
  assert.match(regular, /decoding="async"/);
  const highPriority = '<html><head></head><body><img src="/hero.webp" alt="Research overview" fetchpriority="high" loading="eager"></body></html>';
  assert.match(addLcpPreload(highPriority), /rel="preload" as="image" href="\/hero\.webp" fetchpriority="high"/);
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
  assert.match(output, /data-content-freshness/);
  assert.match(output, /data-article-discovery/);
  assert.match(output, /id="continue-research"/);
  assert.match(output, /Research article archive/);
});

test('ATT&CK technique pages do not receive editorial archive navigation', () => {
  const canonical = 'https://1200km.com/threat-matrix/techniques/T1059/';
  const input = `<!doctype html><html lang="en"><head><title>Command and Scripting Interpreter</title>
    <meta name="description" content="ATT&CK technique reference.">
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle' })}</script>
  </head><body><nav></nav><main><article><h1>Command and Scripting Interpreter</h1></article></main></body></html>`;
  const output = transformReleaseHtml(input, { canonical, dateModified: '2026-07-22' });
  assert.doesNotMatch(output, /data-article-discovery/);
  assert.doesNotMatch(output, /data-content-freshness/);
});

test('metadata descriptions are unique-page prose rather than generic level labels', () => {
  const input = '<html><head><title>IOC Enrichment | AdversaryGraph Docs</title><meta name="description" content="Level: Intermediate"><meta property="og:description" content="Level: Intermediate"></head><body><main><h1>IOC Enrichment</h1></main></body></html>';
  const output = normalizeMetaDescriptions(input);
  assert.match(output, /content="IOC Enrichment\. Practical security guidance/);
  assert.doesNotMatch(output, /content="Level: Intermediate"/);
});

test('pages without a bespoke share image receive the governed social fallback', () => {
  const input = '<html><head><title>Research Note | 1200km</title></head><body><main><h1>Research Note</h1></main></body></html>';
  const output = normalizeSocialImages(input);
  assert.match(output, /property="og:image" content="https:\/\/1200km\.com\/assets\/site-og-v2\.png"/);
  assert.match(output, /name="twitter:image" content="https:\/\/1200km\.com\/assets\/site-og-v2\.png"/);
  assert.match(output, /property="og:image:width" content="1200"/);
  assert.match(output, /property="og:image:alt"/);
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
