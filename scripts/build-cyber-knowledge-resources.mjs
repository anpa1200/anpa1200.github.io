#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge.json'), 'utf8'));
const hub = readFileSync(join(ROOT, 'cyber-knowledge', 'index.html'), 'utf8');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonLd(html) {
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const parsed = JSON.parse(match[1]);
      return parsed['@graph'] || [parsed];
    });
}

const sourceByDomain = new Map(model.domains.map((domain) => [
  domain.id,
  readFileSync(join(ROOT, domain.path), 'utf8'),
]));

const terms = [];
for (const domain of model.domains) {
  for (const set of jsonLd(sourceByDomain.get(domain.id)).filter((entry) => entry['@type'] === 'DefinedTermSet')) {
    for (const term of set.hasDefinedTerm || []) {
      terms.push({
        name: term.name,
        description: term.description,
        url: term.url.replace('https://1200km.com', ''),
        domain,
      });
    }
  }
}
terms.sort((left, right) => left.name.localeCompare(right.name));

const sources = new Map();
for (const domain of model.domains) {
  const html = sourceByDomain.get(domain.id);
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = match[1].replace(/&amp;/g, '&');
    const label = text(match[2]);
    const key = url.replace(/\/$/, '');
    if (!sources.has(key)) sources.set(key, { url, labels: new Set(), domains: new Set() });
    if (label) sources.get(key).labels.add(label);
    sources.get(key).domains.add(domain.id);
  }
}

function sourceClass(url) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host === '1200km.com') return '1200km research';
  if (host.endsWith('.gov') || host.endsWith('.mil') || host.endsWith('.gov.uk')) return 'Government';
  if (/^(?:attack\.mitre\.org|atlas\.mitre\.org|cwe\.mitre\.org|capec\.mitre\.org)$/.test(host)) return 'Framework';
  if (/^(?:nist\.gov|www\.nist\.gov|iso\.org|www\.iso\.org|owasp\.org|www\.cisecurity\.org)$/.test(host)) return 'Standard or framework';
  if (host === 'github.com' || host === 'gitlab.com') return 'Source repository';
  if (host.endsWith('.edu')) return 'Academic';
  return 'First-party or practitioner reference';
}

function metadataPage({ slug, title, description, h1, lead, body, graph }) {
  const canonical = `https://1200km.com/cyber-knowledge/${slug}/`;
  const pageGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        name: h1,
        description,
        url: canonical,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://1200km.com/#website' },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        dateModified: model.collection.reviewed_at,
        author: { '@id': 'https://1200km.com/#person' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
          { '@type': 'ListItem', position: 2, name: 'Cyber Knowledge', item: 'https://1200km.com/cyber-knowledge/' },
          { '@type': 'ListItem', position: 3, name: h1, item: canonical },
        ],
      },
      { ...graph, '@context': undefined },
    ],
  };
  let html = hub
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
    .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<main\b[\s\S]*?<\/main>/i, `<main data-pagefind-body id="main-content">
      <div class="page-hero"><div class="page-hero-inner">
        <p class="page-eyebrow"><a href="/cyber-knowledge/">Cyber Knowledge</a> · Reference index</p>
        <h1 class="page-title">${escapeHtml(h1)}</h1>
        <p class="page-lead">${escapeHtml(lead)}</p>
        <form action="/search.html" method="get" role="search" class="page-hero-links">
          <label class="visually-hidden" for="${slug}-search">Search all 1200km research</label>
          <input id="${slug}-search" name="q" type="search" placeholder="Search terms, sources, frameworks, and workflows" />
          <button class="button primary" type="submit">Search</button>
        </form>
      </div></div>
      ${body}
    </main>`)
    .replace('</head>', `    <script type="application/ld+json" id="cyber-knowledge-structured-data">\n${JSON.stringify(pageGraph, (key, value) => value === undefined ? undefined : value, 2).split('\n').map((line) => `      ${line}`).join('\n')}\n    </script>\n  </head>`);
  return html.replace(/^[ \t]+$/gm, '');
}

const letters = [...new Set(terms.map((term) => term.name[0].toUpperCase()).filter((letter) => /[A-Z0-9]/.test(letter)))];
const glossaryBody = `<section aria-labelledby="glossary-index-title">
        <h2 id="glossary-index-title">Defined terms</h2>
        <p class="section-intro">${terms.length} source-linked definitions consolidated from the maintained guides. The linked guide section remains the canonical detailed context.</p>
        <nav class="page-hero-links" aria-label="Glossary alphabet">${letters.map((letter) => `<a class="button" href="#letter-${letter.toLowerCase()}">${letter}</a>`).join('')}</nav>
${letters.map((letter) => `        <section id="letter-${letter.toLowerCase()}" aria-labelledby="letter-${letter.toLowerCase()}-title">
          <h3 id="letter-${letter.toLowerCase()}-title">${letter}</h3>
          <div class="domain-grid">
${terms.filter((term) => term.name.toUpperCase().startsWith(letter)).map((term) => `            <article class="domain-card">
              <span class="domain-index">${escapeHtml(term.domain.short)}</span>
              <h4 class="domain-title"><a href="${escapeHtml(term.url)}">${escapeHtml(term.name)}</a></h4>
              <p class="domain-desc">${escapeHtml(term.description)}</p>
            </article>`).join('\n')}
          </div>
        </section>`).join('\n')}
      </section>`;
const glossaryGraph = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': 'https://1200km.com/cyber-knowledge/glossary/#defined-terms',
  name: '1200km Cyber Knowledge glossary',
  url: 'https://1200km.com/cyber-knowledge/glossary/',
  dateModified: model.collection.reviewed_at,
  hasDefinedTerm: terms.map((term) => ({
    '@type': 'DefinedTerm',
    name: term.name,
    description: term.description,
    url: `https://1200km.com${term.url}`,
  })),
};

const sourceRecords = [...sources.values()].sort((left, right) => {
  const leftLabel = [...left.labels][0] || left.url;
  const rightLabel = [...right.labels][0] || right.url;
  return leftLabel.localeCompare(rightLabel);
});
const sourceGroups = [...new Set(sourceRecords.map((record) => sourceClass(record.url)))].sort();
const sourcesBody = `<section aria-labelledby="source-index-title">
        <h2 id="source-index-title">Referenced sources</h2>
        <p class="section-intro">${sourceRecords.length} unique external destinations cited by the ten guides. Classification is descriptive; normative authority depends on the exact document and claim.</p>
${sourceGroups.map((group) => `        <section id="source-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" aria-labelledby="source-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title">
          <h3 id="source-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title">${escapeHtml(group)}</h3>
          <div class="domain-grid">
${sourceRecords.filter((record) => sourceClass(record.url) === group).map((record) => {
    const label = [...record.labels].sort((a, b) => a.length - b.length)[0] || new URL(record.url).hostname;
    const used = [...record.domains].map((id) => model.domains.find((domain) => domain.id === id).short).join(', ');
    return `            <article class="domain-card">
              <span class="domain-index">${escapeHtml(new URL(record.url).hostname)}</span>
              <h4 class="domain-title"><a href="${escapeHtml(record.url)}">${escapeHtml(label)}</a></h4>
              <p class="domain-desc"><strong>Used in:</strong> ${escapeHtml(used)}</p>
              <p class="domain-audience">Referenced as of ${escapeHtml(model.collection.reviewed_at)}. Use the destination’s own version and supersession notice for normative decisions.</p>
            </article>`;
  }).join('\n')}
          </div>
        </section>`).join('\n')}
      </section>`;
const sourcesGraph = {
  '@type': 'ItemList',
  '@id': 'https://1200km.com/cyber-knowledge/sources/#collection',
  name: 'Cyber Knowledge source index',
  url: 'https://1200km.com/cyber-knowledge/sources/',
  dateModified: model.collection.reviewed_at,
  numberOfItems: sourceRecords.length,
  itemListElement: sourceRecords.map((record, index) => ({ '@type': 'ListItem', position: index + 1, name: [...record.labels][0] || record.url, url: record.url })),
};

const policyBody = `<section aria-labelledby="policy-title">
        <h2 id="policy-title">Evidence and editorial policy</h2>
        <div class="domain-grid">
          <article class="domain-card"><h3 class="domain-title">Source selection</h3><p class="domain-desc">Prefer official standards, government publications, framework owners, first-party documentation, peer-reviewed research, and technically credible primary research. Internal 1200km material is labelled as research, a lab, a tool, or a workflow—not as an external standard.</p></article>
          <article class="domain-card"><h3 class="domain-title">Review and versioning</h3><p class="domain-desc">Guide metadata records publication and last-review dates. Version-sensitive claims should name the document or framework revision. “Reviewed” describes an editorial source review; it does not claim independent certification.</p></article>
          <article class="domain-card"><h3 class="domain-title">Corrections</h3><p class="domain-desc">Report a factual issue, broken link, or outdated reference through the public <a href="https://github.com/anpa1200/anpa1200.github.io/issues/new">GitHub issue form</a>. Include the affected URL, quoted claim, proposed source, and reason for correction.</p></article>
          <article class="domain-card"><h3 class="domain-title">AI assistance</h3><p class="domain-desc">AI may assist drafting, classification, comparison, or navigation. It is not treated as evidence. Technical claims, mappings, citations, and operational recommendations require human review against the cited source and relevant environment.</p></article>
          <article class="domain-card"><h3 class="domain-title">Claims and uncertainty</h3><p class="domain-desc">Facts, interpretation, assumptions, recommendations, confidence, and uncertainty should remain distinguishable. Indicators do not independently prove compromise; framework mappings do not prove control effectiveness.</p></article>
          <article class="domain-card"><h3 class="domain-title">Ownership and contact</h3><p class="domain-desc">The project is maintained by <a href="/about.html">Andrey Pautov</a>. Repository history provides the public change record. See <a href="/privacy.html">Privacy and Data Handling</a> for site-level handling boundaries.</p></article>
        </div>
      </section>`;
const policyGraph = {
  '@type': 'CreativeWork',
  '@id': 'https://1200km.com/cyber-knowledge/editorial-policy/#page',
  name: 'Cyber Knowledge editorial and source policy',
  url: 'https://1200km.com/cyber-knowledge/editorial-policy/',
  dateModified: model.collection.reviewed_at,
  author: { '@id': 'https://1200km.com/#person' },
};

const outputs = [
  ['glossary', metadataPage({
    slug: 'glossary',
    title: 'Cybersecurity Glossary — Cyber Knowledge | 1200km',
    description: 'A source-linked glossary of cybersecurity terminology consolidated from the ten 1200km practitioner field guides.',
    h1: 'Cyber Knowledge Glossary',
    lead: 'Concise definitions with direct links to the field-guide sections where each term is used in operational context.',
    body: glossaryBody,
    graph: glossaryGraph,
  })],
  ['sources', metadataPage({
    slug: 'sources',
    title: 'Cybersecurity Source Index — Cyber Knowledge | 1200km',
    description: 'Authoritative, first-party, research, and practitioner sources referenced across the 1200km Cyber Knowledge field guides.',
    h1: 'Cyber Knowledge Source Index',
    lead: 'A transparent inventory of the external material referenced by the field guides, grouped by source class and linked to its publisher.',
    body: sourcesBody,
    graph: sourcesGraph,
  })],
  ['editorial-policy', metadataPage({
    slug: 'editorial-policy',
    title: 'Editorial and Source Policy — Cyber Knowledge | 1200km',
    description: 'How 1200km Cyber Knowledge selects sources, reviews claims, records versions, handles AI assistance, and corrects factual issues.',
    h1: 'Editorial and Source Policy',
    lead: 'The evidence, review, correction, versioning, and AI-assistance rules used to maintain Cyber Knowledge.',
    body: policyBody,
    graph: policyGraph,
  })],
];

const stale = [];
for (const [slug, html] of outputs) {
  const path = join(ROOT, 'cyber-knowledge', slug, 'index.html');
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== html) stale.push(path);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, html);
  }
}
if (stale.length) throw new Error(`Cyber Knowledge resource pages are stale:\n- ${stale.join('\n- ')}`);
console.log(`${check ? 'Validated' : 'Generated'} glossary, source index, and editorial policy.`);
