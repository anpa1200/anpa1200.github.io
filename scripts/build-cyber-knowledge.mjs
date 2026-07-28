#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const check = args.includes('--check');
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge.json'), 'utf8'));
const crosslinkModel = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge-crosslinks.json'), 'utf8'));
const { domains, collection } = model;
let moduleIndex = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assertModel() {
  if (!Array.isArray(domains) || domains.length !== 10) throw new Error('Cyber Knowledge model must contain ten domains');
  const ids = new Set();
  const paths = new Set();
  const positions = new Set();
  for (const domain of domains) {
    if (ids.has(domain.id)) throw new Error(`Duplicate Cyber Knowledge id: ${domain.id}`);
    if (paths.has(domain.path)) throw new Error(`Duplicate Cyber Knowledge path: ${domain.path}`);
    if (positions.has(domain.position)) throw new Error(`Duplicate Cyber Knowledge position: ${domain.position}`);
    ids.add(domain.id);
    paths.add(domain.path);
    positions.add(domain.position);
  }
  if ([...positions].sort((a, b) => a - b).join(',') !== '1,2,3,4,5,6,7,8,9,10') {
    throw new Error('Cyber Knowledge positions must be exactly 1 through 10');
  }
}

function stripHtml(value) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function moduleCount(html) {
  const values = [...html.matchAll(/\bid=["'](?:m|module-)(\d+)["']/gi)].map((match) => Number(match[1]));
  const unique = new Set(values.filter((value) => Number.isInteger(value) && value > 0));
  return unique.size ? Math.max(...unique) : 0;
}

function readingMinutes(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
  const words = stripHtml(main).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function moduleParts(html) {
  return [...html.matchAll(/<[a-z][^>]*\bid=["']((?:m|module-)\d+)["'][^>]*>[\s\S]*?<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)]
    .map((match) => ({
      id: match[1],
      name: stripHtml(match[2]),
    }))
    .filter((part) => part.name);
}

function matchingElementClose(html, openingEnd, tagName) {
  const tags = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tags.lastIndex = openingEnd;
  let depth = 1;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    if (/^<\//.test(match[0])) depth -= 1;
    else if (!/\/\s*>$/.test(match[0])) depth += 1;
    if (depth === 0) return { start: match.index, end: tags.lastIndex };
  }
  return null;
}

function ensureModuleCrosslinks(html, domain) {
  html = html.replace(
    /\r?\n[ \t]*<!-- cyber-knowledge:module-crosslink:start -->[\s\S]*?<!-- cyber-knowledge:module-crosslink:end -->\r?\n/gi,
    '',
  );
  const mappings = crosslinkModel.links[domain.id];
  const openings = [...html.matchAll(/<(article|section|div)\b[^>]*\bid=["']((?:m|module-)\d+)["'][^>]*>/gi)];
  const insertions = [];
  for (const opening of openings) {
    const [, tagName, moduleId] = opening;
    const target = mappings[moduleId];
    if (!target) throw new Error(`${domain.path}#${moduleId}: cross-domain handoff is missing`);
    const [targetDomainId, targetModuleId] = target;
    const targetDomain = domains.find((candidate) => candidate.id === targetDomainId);
    const targetPart = moduleIndex.get(`${targetDomainId}:${targetModuleId}`);
    if (!targetDomain || !targetPart) {
      throw new Error(`${domain.path}#${moduleId}: invalid handoff ${targetDomainId}#${targetModuleId}`);
    }
    if (targetDomainId === domain.id) {
      throw new Error(`${domain.path}#${moduleId}: handoff must target another Cyber Knowledge domain`);
    }
    const openingEnd = opening.index + opening[0].length;
    const closing = matchingElementClose(html, openingEnd, tagName);
    if (!closing) throw new Error(`${domain.path}#${moduleId}: unable to locate module closing tag`);
    const href = `/${targetDomain.path}#${targetModuleId}`;
    const block = `
          <!-- cyber-knowledge:module-crosslink:start -->
          <p class="further-reading module-crosslink"><strong>Related Cyber Knowledge:</strong> <a href="${escapeHtml(href)}">${escapeHtml(targetDomain.name)} — ${escapeHtml(targetPart.name)}</a></p>
          <!-- cyber-knowledge:module-crosslink:end -->
`;
    insertions.push({ at: closing.start, block });
  }
  for (const insertion of insertions.sort((left, right) => right.at - left.at)) {
    html = `${html.slice(0, insertion.at)}${insertion.block}${html.slice(insertion.at)}`;
  }
  return html;
}

function assertCrosslinkModel(source) {
  const domainIds = new Set(domains.map((domain) => domain.id));
  for (const key of Object.keys(crosslinkModel.links)) {
    if (!domainIds.has(key)) throw new Error(`Unknown Cyber Knowledge crosslink domain: ${key}`);
  }
  moduleIndex = new Map();
  for (const domain of domains) {
    const parts = moduleParts(source.get(domain.id));
    const mappings = crosslinkModel.links[domain.id];
    if (!mappings) throw new Error(`${domain.path}: no crosslink mapping`);
    for (const part of parts) moduleIndex.set(`${domain.id}:${part.id}`, part);
    const partIds = new Set(parts.map((part) => part.id));
    const mappingIds = new Set(Object.keys(mappings));
    const missing = [...partIds].filter((id) => !mappingIds.has(id));
    const unknown = [...mappingIds].filter((id) => !partIds.has(id));
    if (missing.length || unknown.length) {
      throw new Error(`${domain.path}: crosslink coverage mismatch; missing=${missing.join(',') || 'none'} unknown=${unknown.join(',') || 'none'}`);
    }
  }
}

function slugify(value) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function glossaryRegion(html) {
  return html.match(
    /(<(?:article|section)\b[^>]*\bid=["']glossary["'][^>]*>)([\s\S]*?)(?=<(?:article|section)\b[^>]*\bid=["'][^"']+["'])/i,
  );
}

function ensureGlossaryTermAnchors(html, domain) {
  if (!['blue-team', 'vulnerability-research', 'malware-analysis'].includes(domain.id)) return html;
  const region = glossaryRegion(html);
  if (!region) throw new Error(`${domain.path}: glossary region not found`);
  const anchored = region[0].replace(
    /<p><strong(?![^>]*\bid=)([^>]*)>([^<:]+):<\/strong>/gi,
    (full, attributes, name) => `<p><strong${attributes} id="term-${slugify(name)}">${name}:</strong>`,
  );
  return html.replace(region[0], anchored);
}

function definedTerms(html, domain) {
  if (domain.id !== 'cti') {
    if (!['blue-team', 'vulnerability-research', 'malware-analysis'].includes(domain.id)) return [];
    const region = glossaryRegion(html);
    if (!region) throw new Error(`${domain.path}: glossary region not found`);
    return [...region[0].matchAll(/<p><strong[^>]*\bid=["']([^"']+)["'][^>]*>([^<:]+):<\/strong>\s*([\s\S]*?)<\/p>/gi)]
      .map((match) => ({
        '@type': 'DefinedTerm',
        name: stripHtml(match[2]),
        description: stripHtml(match[3]),
        url: `https://1200km.com/${domain.path}#${match[1]}`,
        inDefinedTermSet: `https://1200km.com/${domain.path}#defined-terms`,
      }))
      .filter((term) => term.name && term.description);
  }
  const terms = [];
  for (const match of html.matchAll(/<div class="featured-term">([\s\S]*?)<\/div>/gi)) {
    const block = match[1];
    const title = block.match(/<(?:a|span)\b[^>]*class="guide-title"[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:a|span)>/i);
    const description = block.match(/<p class="guide-desc">([\s\S]*?)<\/p>/i);
    if (!title || !description) continue;
    terms.push({
      '@type': 'DefinedTerm',
      name: stripHtml(title[2]),
      description: stripHtml(description[1]),
      url: `https://1200km.com/${domain.path}#${title[1]}`,
      inDefinedTermSet: `https://1200km.com/${domain.path}#defined-terms`,
    });
  }
  return terms;
}

function ensureGeneratedJsonLd(html, id, value) {
  const script = `    <script type="application/ld+json" id="${id}">\n${JSON.stringify(value, null, 2)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')}\n    </script>`;
  const pattern = new RegExp(`[ \\t]*<script\\b(?=[^>]*\\bid="${id}")[^>]*>[\\s\\S]*?<\\/script>[ \\t]*\\r?\\n?`, 'gi');
  html = html.replace(pattern, '');
  return replaceRequired(html, /\s*<\/head>/i, `\n${script}\n  </head>`, `${id} insertion`, id);
}

function removeLegacyJsonLdType(html, type) {
  return html.replace(
    /(<script\s+type="application\/ld\+json"\s+data-site-graph>)([\s\S]*?)(<\/script>)/gi,
    (full, start, json, end) => {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed['@graph'])) return full;
      const filtered = parsed['@graph'].filter((entry) => entry?.['@type'] !== type);
      if (filtered.length === parsed['@graph'].length) return full;
      return `${start}\n${JSON.stringify({ ...parsed, '@graph': filtered }, null, 2)
        .split('\n')
        .map((line) => `      ${line}`)
        .join('\n')}\n    ${end}`;
    },
  );
}

function ensureEnhancementScript(html) {
  if (/src=["']\/assets\/cyber-knowledge\.js["']/i.test(html)) return html;
  return replaceRequired(
    html,
    /[ \t]*<\/body>/i,
    '    <script src="/assets/cyber-knowledge.js" defer></script>\n  </body>',
    'Cyber Knowledge enhancement script',
    'cyber-knowledge',
  );
}

function domainStructuredData(html, domain) {
  const url = `https://1200km.com/${domain.path}`;
  const minutes = readingMinutes(html);
  const parts = moduleParts(html);
  const graph = [
    {
      '@type': ['Course', 'LearningResource'],
      '@id': `${url}#course`,
      name: domain.name,
      description: domain.description,
      url,
      provider: { '@id': 'https://1200km.com/#person' },
      teaches: domain.topics,
      educationalLevel: 'Intermediate to advanced',
      timeRequired: `PT${minutes}M`,
      coursePrerequisites: 'Use the prerequisites and authorization boundaries stated in the field guide.',
      hasPart: parts.map((part, index) => ({
        '@type': 'LearningResource',
        position: index + 1,
        name: part.name,
        url: `${url}#${part.id}`,
      })),
      datePublished: domain.published_at,
      dateModified: collection.reviewed_at,
      inLanguage: 'en',
    },
  ];
  const terms = definedTerms(html, domain);
  if (terms.length) {
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${url}#defined-terms`,
      name: `${domain.name} defined terms`,
      url: `${url}#glossary`,
      hasDefinedTerm: terms,
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function hubStructuredData(stats) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${collection.canonical_url}#domain-list`,
    name: `${collection.name} domains`,
    numberOfItems: domains.length,
    itemListElement: domains.map((domain) => ({
      '@type': 'ListItem',
      position: domain.position,
      name: domain.name,
      url: `https://1200km.com/${domain.path}`,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'module count', value: stats.get(domain.id).modules },
        { '@type': 'PropertyValue', name: 'estimated reading time', value: `${stats.get(domain.id).minutes} minutes` },
      ],
    })),
  };
}

function humanDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function fullHumanDate(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function replaceRequired(html, pattern, replacement, label, path) {
  if (!pattern.test(html)) throw new Error(`${path}: unable to locate ${label}`);
  return html.replace(pattern, replacement);
}

function setMeta(html, attribute, key, value, path) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])[^>]*>`, 'i');
  return replaceRequired(html, pattern, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`, `${key} metadata`, path);
}

function setTitle(html, value, path) {
  return replaceRequired(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(value)}</title>`, 'title', path);
}

function ensureArticleDates(html, published, modified) {
  html = html.replace(/^[ \t]*<meta\b[^>]*property=["']article:(?:published|modified)_time["'][^>]*>[ \t]*\r?\n/gim, '');
  const tags = [
    `    <meta property="article:published_time" content="${published}" />`,
    `    <meta property="article:modified_time" content="${modified}" />`,
  ].join('\n');
  return html.replace(/^([ \t]*<meta property="og:locale" content="en_US"\s*\/?>)[ \t]*$/im, `$1\n${tags}`);
}

function ensureSequenceLinks(html, domain) {
  const index = domains.findIndex((candidate) => candidate.id === domain.id);
  const previous = domains[(index - 1 + domains.length) % domains.length];
  const next = domains[(index + 1) % domains.length];
  html = html.replace(/^[ \t]*<link rel="(?:up|prev|next)"[^>]*>[ \t]*\r?\n/gim, '');
  const links = [
    '    <link rel="up" href="/cyber-knowledge/" />',
    `    <link rel="prev" href="/${previous.path}" />`,
    `    <link rel="next" href="/${next.path}" />`,
  ].join('\n');
  return replaceRequired(
    html,
    /^([ \t]*<link rel="canonical"[^>]*>)[ \t]*$/im,
    `$1\n${links}`,
    'canonical link',
    domain.path,
  );
}

function renderPathway(domain) {
  const index = domains.findIndex((candidate) => candidate.id === domain.id);
  const previous = domains[(index - 1 + domains.length) % domains.length];
  const next = domains[(index + 1) % domains.length];
  return `    <nav class="knowledge-pathway" aria-label="Cyber Knowledge learning path">
      <p class="knowledge-pathway__label">Continue through the knowledge base</p>
      <div class="knowledge-pathway__links">
        <a href="/${previous.path}"><small>Previous domain</small><strong>← ${escapeHtml(previous.name)}</strong></a>
        <a href="/cyber-knowledge/"><small>All guides</small><strong>Cyber Knowledge hub</strong></a>
        <a href="/${next.path}"><small>Next domain</small><strong>${escapeHtml(next.name)} →</strong></a>
      </div>
    </nav>`;
}

function transformDomain(html, domain) {
  html = html.replace(
    /href=(["'])(\/articles\/read\/\d{4}\/[^"'#?\/]+)([?#][^"']*)?\1/gi,
    (full, quote, path, suffix = '') => `href=${quote}${path}/${suffix}${quote}`,
  );
  const title = `${domain.short} Field Guide — Cyber Knowledge | 1200km`;
  html = setTitle(html, title, domain.path);
  html = setMeta(html, 'name', 'description', domain.description, domain.path);
  html = setMeta(html, 'property', 'og:title', title, domain.path);
  html = setMeta(html, 'property', 'og:description', domain.description, domain.path);
  html = setMeta(html, 'name', 'twitter:title', title, domain.path);
  html = setMeta(html, 'name', 'twitter:description', domain.description, domain.path);
  html = setMeta(html, 'property', 'og:image', `https://1200km.com/assets/cyber-knowledge-og/${domain.id}.png`, domain.path);
  html = setMeta(html, 'property', 'og:image:alt', `${domain.name} — 1200km Cyber Knowledge`, domain.path);
  html = setMeta(html, 'name', 'twitter:image', `https://1200km.com/assets/cyber-knowledge-og/${domain.id}.png`, domain.path);
  html = setMeta(html, 'name', 'twitter:image:alt', `${domain.name} — 1200km Cyber Knowledge`, domain.path);
  html = ensureArticleDates(html, domain.published_at, collection.reviewed_at);
  html = ensureSequenceLinks(html, domain);
  html = html
    .replace(/"datePublished":\s*"\d{4}-\d{2}-\d{2}"/g, `"datePublished": "${domain.published_at}"`)
    .replace(/"dateModified":\s*"\d{4}-\d{2}-\d{2}"/g, `"dateModified": "${collection.reviewed_at}"`)
    .replace(/"educationalLevel":\s*"Beginner to advanced"/g, '"educationalLevel": "Intermediate to advanced"');
  html = replaceRequired(
    html,
    /<p class="page-eyebrow">[\s\S]*?<\/p>/i,
    `<p class="page-eyebrow"><a href="/cyber-knowledge/">Cyber Knowledge</a> · Domain ${String(domain.position).padStart(2, '0')} of ${domains.length} · Practitioner field guide</p>`,
    'visible breadcrumb',
    domain.path,
  );
  html = replaceRequired(
    html,
    /<h1\b([^>]*)class="page-title"([^>]*)>[\s\S]*?<\/h1>/i,
    `<h1$1class="page-title"$2>${escapeHtml(domain.name)}</h1>`,
    'page title heading',
    domain.path,
  );
  html = replaceRequired(
    html,
    /    <nav class="knowledge-pathway"[\s\S]*?<\/nav>/i,
    renderPathway(domain),
    'learning-path navigation',
    domain.path,
  );
  if (domain.id === 'cti') {
    html = removeLegacyJsonLdType(html, 'DefinedTermSet');
    html = html.replaceAll(
      'https://1200km.com/cyber-knowledge/cti.html#glossary',
      'https://1200km.com/cyber-knowledge/cti.html#defined-terms',
    );
  }
  html = ensureGlossaryTermAnchors(html, domain);
  html = ensureModuleCrosslinks(html, domain);
  html = ensureGeneratedJsonLd(html, 'cyber-knowledge-structured-data', domainStructuredData(html, domain));
  html = ensureEnhancementScript(html);
  html = html.replace(/^[ \t]+$/gm, '');
  return html;
}

function renderCards(stats) {
  return `        <!-- cyber-knowledge:cards:start -->
        <div class="domain-grid">
${domains.map((domain) => {
    const stat = stats.get(domain.id);
    const baseline = domain.baseline
      ? `\n              <span class="domain-baseline">Baseline: ${escapeHtml(domain.baseline)}</span>`
      : '';
    return `          <article class="domain-card" data-domain-id="${escapeHtml(domain.id)}">
            <span class="domain-index">Domain ${String(domain.position).padStart(2, '0')}</span>
            <h3 class="domain-title"><a href="/${domain.path}">${escapeHtml(domain.name)}</a></h3>
            <p class="domain-desc">${escapeHtml(domain.card_description)}</p>
            <p class="domain-facts">
              <span>${stat.modules} modules</span>
              <span>~${stat.minutes} min</span>
              <span>Reviewed ${escapeHtml(humanDate(collection.reviewed_at))}</span>${baseline}
            </p>
            <ul class="domain-topics" aria-label="${escapeHtml(domain.name)} topics">
${domain.topics.map((topic) => `              <li>${escapeHtml(topic)}</li>`).join('\n')}
            </ul>
            <span class="domain-status ready">Maintained practitioner guide</span>
            <a class="domain-link" href="/${domain.path}">Open field guide →</a>
          </article>`;
  }).join('\n\n')}
        </div>
        <!-- cyber-knowledge:cards:end -->`;
}

function crossDomainEdges(source) {
  const byPath = new Map(domains.map((domain) => [domain.path, domain]));
  const edges = new Map();
  for (const domain of domains) {
    const html = source.get(domain.id);
    for (const match of html.matchAll(/href=["']\/([^"'#]+)(#[^"']+)?["']/gi)) {
      const target = byPath.get(match[1]);
      if (!target || target.id === domain.id) continue;
      const key = `${domain.id}>${target.id}`;
      if (!edges.has(key)) {
        edges.set(key, {
          source: domain,
          target,
          href: `/${match[1]}${match[2] || ''}`,
        });
      }
    }
  }
  return [...edges.values()];
}

function renderRelationshipMap(edges) {
  const centre = { x: 500, y: 260 };
  const radius = 205;
  const points = new Map(domains.map((domain, index) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2 / domains.length);
    return [domain.id, {
      x: centre.x + Math.cos(angle) * radius,
      y: centre.y + Math.sin(angle) * radius,
    }];
  }));
  return `      <!-- cyber-knowledge:relationship-map:start -->
      <section id="domain-map" aria-labelledby="domain-map-title">
        <h2 id="domain-map-title">How the ten domains connect</h2>
        <p class="section-intro">This map is generated from cross-domain links in the field guides. Each connection reflects an existing route to another guide.</p>
        <div class="knowledge-map">
          <svg viewBox="0 0 1000 520" role="group" aria-labelledby="knowledge-map-svg-title knowledge-map-svg-desc">
            <title id="knowledge-map-svg-title">Cyber Knowledge cross-domain relationship map</title>
            <desc id="knowledge-map-svg-desc">Ten domain nodes connected by links already present in the field guides. A complete text equivalent follows the diagram.</desc>
            <g class="knowledge-map__edges">
${edges.map((edge) => {
    const from = points.get(edge.source.id);
    const to = points.get(edge.target.id);
    return `              <a href="${escapeHtml(edge.href)}"><title>${escapeHtml(edge.source.name)} to ${escapeHtml(edge.target.name)}</title><line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" /></a>`;
  }).join('\n')}
            </g>
            <g class="knowledge-map__nodes">
${domains.map((domain) => {
    const point = points.get(domain.id);
    return `              <a href="/${domain.path}"><circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="34" /><text x="${point.x.toFixed(1)}" y="${(point.y + 5).toFixed(1)}">${String(domain.position).padStart(2, '0')}</text><title>${escapeHtml(domain.name)}</title></a>`;
  }).join('\n')}
            </g>
          </svg>
          <details class="knowledge-map__text">
            <summary>Text equivalent: ${edges.length} cross-domain routes</summary>
            <ul>
${edges.map((edge) => `              <li><a href="/${edge.source.path}">${escapeHtml(edge.source.name)}</a> → <a href="${escapeHtml(edge.href)}">${escapeHtml(edge.target.name)}</a></li>`).join('\n')}
            </ul>
          </details>
        </div>
      </section>
      <!-- cyber-knowledge:relationship-map:end -->`;
}

function generatedRegion(html, name, content, before) {
  const pattern = new RegExp(`\\s*<!-- cyber-knowledge:${name}:start -->[\\s\\S]*?<!-- cyber-knowledge:${name}:end -->\\s*`, 'i');
  if (pattern.test(html)) return html.replace(pattern, `\n\n${content}\n\n`);
  return replaceRequired(html, before, `${content}\n$&`, `${name} region`, 'cyber-knowledge/index.html');
}

function renderEcosystem() {
  return `      <!-- cyber-knowledge:ecosystem:start -->
      <section id="ecosystem" aria-labelledby="ecosystem-title">
        <h2 id="ecosystem-title">Continue into the 1200km ecosystem</h2>
        <p class="section-intro">Move from the field guides into published research, browser-based ATT&amp;CK exploration, hands-on labs, and the self-hosted AdversaryGraph platform.</p>
        <div class="domain-grid ecosystem-grid">
          <article class="domain-card"><span class="domain-index">Platform</span><h3 class="domain-title"><a href="/adversarygraph/">AdversaryGraph</a></h3><p class="domain-desc">Product overview, deployment routes, documentation, and validation evidence.</p></article>
          <article class="domain-card"><span class="domain-index">Public workspace</span><h3 class="domain-title"><a href="/threat-matrix/">Threat Matrix</a></h3><p class="domain-desc">Browse ATT&amp;CK groups, techniques, comparisons, coverage leads, and Navigator layers.</p></article>
          <article class="domain-card"><span class="domain-index">Research</span><h3 class="domain-title"><a href="/cti.html">CTI research</a></h3><p class="domain-desc">Actor profiles, campaigns, detection research, and source-linked analysis.</p></article>
          <article class="domain-card"><span class="domain-index">Practice</span><h3 class="domain-title"><a href="/labs.html">Security labs</a></h3><p class="domain-desc">Controlled lab environments, validation walkthroughs, and reproducible evidence.</p></article>
          <article class="domain-card"><span class="domain-index">Writing</span><h3 class="domain-title"><a href="/articles/">Article archive</a></h3><p class="domain-desc">Local, searchable versions of published long-form research and technical articles.</p></article>
          <article class="domain-card"><span class="domain-index">Evidence</span><h3 class="domain-title"><a href="/external-validation.html">External validation</a></h3><p class="domain-desc">Source-backed external contributions, references, and acceptance evidence.</p></article>
        </div>
      </section>
      <!-- cyber-knowledge:ecosystem:end -->`;
}

function transformHub(html, stats, edges) {
  html = ensureArticleDates(html, collection.published_at, collection.reviewed_at);
  html = setMeta(html, 'property', 'og:image', 'https://1200km.com/assets/cyber-knowledge-og/hub.png', 'cyber-knowledge/index.html');
  html = setMeta(html, 'property', 'og:image:alt', 'Cyber Knowledge — ten practitioner domains at 1200km', 'cyber-knowledge/index.html');
  html = setMeta(html, 'name', 'twitter:image', 'https://1200km.com/assets/cyber-knowledge-og/hub.png', 'cyber-knowledge/index.html');
  html = setMeta(html, 'name', 'twitter:image:alt', 'Cyber Knowledge — ten practitioner domains at 1200km', 'cyber-knowledge/index.html');
  html = replaceRequired(
    html,
    /<div class="notice" role="note">[\s\S]*?<\/div>\s*<\/div>/i,
    `<div class="notice" role="note">
            <div>
              <strong>Ten domains · maintained practitioner guides</strong>
              <p>Last reviewed <time datetime="${collection.reviewed_at}">${escapeHtml(fullHumanDate(collection.reviewed_at))}</time></p>
            </div>
          </div>`,
    'collection status notice',
    'cyber-knowledge/index.html',
  );
  html = replaceRequired(
    html,
    /<(?:div|nav)\b[^>]*class="[^"]*page-hero-links[^"]*"[^>]*>[\s\S]*?<\/(?:div|nav)>/i,
    `<nav class="page-hero-links role-chooser" aria-label="Choose a Cyber Knowledge starting point">
            <a class="button primary" href="/cyber-knowledge/blue-team.html">SOC analyst → Blue Team</a>
            <a class="button" href="/cyber-knowledge/red-team.html">Offensive tester → Red Team</a>
            <a class="button" href="/cyber-knowledge/cti.html">Vocabulary first → CTI</a>
            <a class="button" href="/cyber-knowledge/dfir.html">Responding now → DFIR</a>
            <a class="button" href="/cyber-knowledge/grc.html">Building the program → GRC</a>
          </nav>`,
    'role-based starting points',
    'cyber-knowledge/index.html',
  );
  const cards = renderCards(stats);
  const marked = /        <!-- cyber-knowledge:cards:start -->[\s\S]*?        <!-- cyber-knowledge:cards:end -->/i;
  if (marked.test(html)) html = html.replace(marked, cards);
  else {
    html = replaceRequired(
      html,
      /        <div class="domain-grid">[\s\S]*?        <\/div>\s*      <\/section>/i,
      `${cards}\n      </section>`,
      'domain cards',
      'cyber-knowledge/index.html',
    );
  }
  html = generatedRegion(html, 'relationship-map', renderRelationshipMap(edges), /[ \t]*<\/main>/i);
  html = generatedRegion(html, 'ecosystem', renderEcosystem(), /[ \t]*<\/main>/i);
  html = ensureGeneratedJsonLd(html, 'cyber-knowledge-structured-data', hubStructuredData(stats));
  html = ensureEnhancementScript(html);
  return html;
}

assertModel();
const stale = [];
const stats = new Map();
const source = new Map();

for (const domain of domains) {
  const path = join(site, domain.path);
  if (!existsSync(path)) throw new Error(`Missing Cyber Knowledge page: ${domain.path}`);
  const html = readFileSync(path, 'utf8');
  source.set(domain.id, html);
  const modules = moduleCount(html);
  if (!modules) throw new Error(`${domain.path}: no numbered modules detected`);
  stats.set(domain.id, { modules, minutes: readingMinutes(html) });
}
assertCrosslinkModel(source);

for (const domain of domains) {
  const path = join(site, domain.path);
  const current = source.get(domain.id);
  const generated = transformDomain(current, domain);
  source.set(domain.id, generated);
  stats.set(domain.id, {
    modules: moduleCount(generated),
    minutes: readingMinutes(generated),
  });
  if (current === generated) continue;
  if (check) stale.push(domain.path);
  else writeFileSync(path, generated);
}

const hubPath = join(site, 'cyber-knowledge/index.html');
const hubCurrent = readFileSync(hubPath, 'utf8');
const hubGenerated = transformHub(hubCurrent, stats, crossDomainEdges(source));
if (hubCurrent !== hubGenerated) {
  if (check) stale.push('cyber-knowledge/index.html');
  else writeFileSync(hubPath, hubGenerated);
}

if (stale.length) throw new Error(`Cyber Knowledge generated regions are stale:\n- ${stale.join('\n- ')}`);
console.log(`${check ? 'Validated' : 'Generated'} Cyber Knowledge metadata and navigation for ${domains.length} domains.`);
