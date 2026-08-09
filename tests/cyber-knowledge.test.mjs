import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE = 'https://1200km.com/cyber-knowledge/';
const modules = [
  'cti',
  'red-team',
  'blue-team',
  'vulnerability-research',
  'malware-analysis',
  'secure-code',
  'dfir',
  'cloud-security',
  'grc',
  'osint',
  'ai-security',
];
const temporaryPublicationLanguage =
  /\b(?:under construction|coming soon|work in progress|syllabus draft live|placeholder page|content forthcoming)\b/i;
const knowledgeModel = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge.json'), 'utf8'));
const crosslinkModel = JSON.parse(
  readFileSync(join(ROOT, 'data', 'cyber-knowledge-crosslinks.json'), 'utf8'),
);

function source(name) {
  return readFileSync(join(ROOT, 'cyber-knowledge', name), 'utf8');
}

function decode(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function tagContent(html, selector) {
  if (selector === 'title') {
    return decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim());
  }
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return decode(
    html.match(new RegExp(`<meta\\s+${escaped}\\s+content="([^"]*)"`, 'i'))?.[1]
      || html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+${escaped}`, 'i'))?.[1],
  );
}

function linkHref(html, relation) {
  const tag = html.match(new RegExp(`<link[^>]+rel="${relation}"[^>]*>`, 'i'))?.[0] || '';
  return tag.match(/href="([^"]+)"/i)?.[1];
}

function jsonLdEntries(html) {
  return [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const parsed = JSON.parse(match[1]);
      return parsed['@graph'] || [parsed];
    });
}

test('Cyber Knowledge hub is the canonical collection for eleven maintained guides', () => {
  const html = source('index.html');
  const entries = jsonLdEntries(html);
  const collection = entries.find((entry) => entry['@type'] === 'CollectionPage');

  assert.equal(tagContent(html, 'property="og:title"'), tagContent(html, 'title'));
  assert.equal(tagContent(html, 'name="twitter:title"'), tagContent(html, 'title'));
  assert.equal(tagContent(html, 'property="og:description"'), tagContent(html, 'name="description"'));
  assert.equal(tagContent(html, 'name="twitter:description"'), tagContent(html, 'name="description"'));
  assert.equal(linkHref(html, 'canonical'), BASE);
  assert.ok(collection, 'CollectionPage JSON-LD is required');
  assert.ok(entries.find((entry) => entry['@type'] === 'ItemList'), 'generated domain ItemList is required');
  assert.equal(collection.hasPart?.length, modules.length);
  assert.ok(collection.hasPart.every((item) => item['@type'] === 'TechArticle'));
  assert.match(html, /Cross-domain learning and operational pathways/);
  assert.match(html, /Cybersecurity Knowledge Base and Practitioner Field Guides/);
  assert.match(html, /id="entry-paths"/);
  assert.equal((html.match(/class="entry-path-card"/g) || []).length, 9);
  assert.doesNotMatch(html, temporaryPublicationLanguage);
  for (const module of modules) {
    assert.match(html, new RegExp(`/cyber-knowledge/${module}\\.html`), module);
  }
});

test('Cyber Knowledge reference indexes are canonical, static, and source-linked', () => {
  const cases = [
    ['glossary/index.html', 'https://1200km.com/cyber-knowledge/glossary/', 'DefinedTermSet'],
    ['sources/index.html', 'https://1200km.com/cyber-knowledge/sources/', 'ItemList'],
    ['editorial-policy/index.html', 'https://1200km.com/cyber-knowledge/editorial-policy/', 'CreativeWork'],
  ];
  for (const [path, canonical, expectedType] of cases) {
    const html = source(path);
    assert.equal(linkHref(html, 'canonical'), canonical, path);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, path);
    assert.match(tagContent(html, 'name="robots"'), /index,\s*follow/i, path);
    assert.ok(jsonLdEntries(html).some((entry) => {
      const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
      return types.includes(expectedType);
    }), `${path}: ${expectedType}`);
    assert.match(html, /data-pagefind-body/, path);
    assert.match(html, /href="\/cyber-knowledge\/"/, path);
  }
});

test('Helping Materials is the canonical collection and Short Guides is only a legacy redirect', () => {
  const helpingMaterials = source('helping-materials/index.html');
  const helpingEntries = jsonLdEntries(helpingMaterials);
  const collection = helpingEntries.find((entry) => entry['@type'] === 'CollectionPage');

  assert.equal(
    linkHref(helpingMaterials, 'canonical'),
    'https://1200km.com/cyber-knowledge/helping-materials/',
  );
  assert.match(tagContent(helpingMaterials, 'name="robots"'), /index,\s*follow/i);
  assert.equal(collection?.mainEntity?.['@type'], 'ItemList');
  assert.equal(collection?.mainEntity?.numberOfItems, 3);
  assert.equal((helpingMaterials.match(/class="article-card"/g) || []).length, 3);
  assert.match(helpingMaterials, /One library, reusable tags/);

  const legacy = source('short-guides/index.html');
  assert.match(tagContent(legacy, 'name="robots"'), /noindex,\s*follow/i);
  assert.equal(
    linkHref(legacy, 'canonical'),
    'https://1200km.com/cyber-knowledge/helping-materials/',
  );
  assert.match(legacy, /http-equiv="refresh"[^>]+helping-materials/i);
});

test('each module has consistent SEO, AI-readable structure, and source-review status', () => {
  for (const module of modules) {
    const html = source(`${module}.html`);
    const title = tagContent(html, 'title');
    const description = tagContent(html, 'name="description"');
    const entries = jsonLdEntries(html);
    const article = entries.find((entry) => {
      const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
      return types.includes('TechArticle');
    });
    const course = entries.find((entry) => {
      const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
      return types.includes('Course') && types.includes('LearningResource');
    });

    assert.equal(linkHref(html, 'canonical'), `${BASE}${module}.html`, module);
    assert.equal(tagContent(html, 'property="og:title"'), title, module);
    assert.equal(tagContent(html, 'name="twitter:title"'), title, module);
    assert.equal(tagContent(html, 'property="og:description"'), description, module);
    assert.equal(tagContent(html, 'name="twitter:description"'), description, module);
    assert.equal(tagContent(html, 'property="og:type"'), 'article', module);
    assert.equal(tagContent(html, 'property="og:locale"'), 'en_US', module);
    assert.match(tagContent(html, 'name="robots"'), /index,\s*follow/i, module);
    assert.ok(title.length >= 30 && title.length <= 60, `${module}: title length ${title.length}`);
    assert.ok(
      description.length >= 70 && description.length <= 240,
      `${module}: description length ${description.length}`,
    );
    assert.ok(article, `${module}: TechArticle JSON-LD is required`);
    assert.ok(course, `${module}: Course/LearningResource JSON-LD is required`);
    assert.equal(course.educationalLevel, 'Intermediate to advanced', module);
    assert.ok(course.hasPart.length >= 10, `${module}: module learning resources`);
    assert.equal(article.isPartOf?.['@id'], 'https://1200km.com/#website', module);
    assert.equal(article.learningResourceType, 'Cybersecurity practitioner field guide', module);
    assert.equal(article.educationalLevel, 'Intermediate to advanced', module);
    assert.equal(article.datePublished, tagContent(html, 'property="article:published_time"'), module);
    const expectedModified = knowledgeModel.domains.find((domain) => domain.id === module)?.modified_at
      || knowledgeModel.collection.reviewed_at;
    assert.equal(article.dateModified, expectedModified, module);
    assert.equal(tagContent(html, 'property="article:modified_time"'), expectedModified, module);
    assert.ok(article.breadcrumb, module);
    assert.match(html, /data-pagefind-body/, module);
    assert.match(html, /Version 1\.0/, module);
    assert.match(html, /Source review: <time datetime="2026-07-27">27 Jul 2026<\/time>/, module);
    assert.match(html, /Maintained by <a href="\/about\.html">Andrey Pautov<\/a>/, module);
    assert.match(html, /href="\/cyber-knowledge\/editorial-policy\/">Editorial policy and corrections<\/a>/, module);
    assert.match(html, /Status: maintained practitioner guide/, module);
    assert.match(html, /class="knowledge-pathway"/, module);
    assert.match(html, /src="\/assets\/cyber-knowledge\.js"/, module);
    assert.match(tagContent(html, 'property="og:image"'), /\/assets\/cyber-knowledge-og\/.+\.png$/, module);
    assert.match(html, /href="\/cyber-knowledge\/"/, module);
    assert.ok((html.match(/href="\//g) || []).length >= 10, `${module}: internal link density`);
    assert.ok((html.match(/href="https?:\/\//g) || []).length >= 6, `${module}: source link density`);
    assert.doesNotMatch(html, /<summary>\s*<a\b/i, `${module}: nested interactive summary link`);
    for (const match of html.matchAll(/<(?:div)\b[^>]*class="[^"]*table-(?:wrap|scroll)[^"]*"[^>]*>/gi)) {
      assert.match(match[0], /\btabindex="0"/i, `${module}: scrollable table wrapper must be focusable`);
    }
    for (const match of html.matchAll(/<pre\b[^>]*>/gi)) {
      assert.match(match[0], /\btabindex="0"/i, `${module}: scrollable code block must be focusable`);
    }
    assert.doesNotMatch(html, temporaryPublicationLanguage, module);
    assert.doesNotMatch(html, /href="\/articles\/read\/\d{4}\/[^"#?\/]+"/, `${module}: article archive trailing slash`);
  }
});

test('module discovery sequence is explicit in source HTML', () => {
  for (let index = 0; index < modules.length; index += 1) {
    const module = modules[index];
    const html = source(`${module}.html`);
    assert.equal(linkHref(html, 'up'), '/cyber-knowledge/', `${module}: up`);
    const previous = modules[(index - 1 + modules.length) % modules.length];
    const next = modules[(index + 1) % modules.length];
    assert.equal(linkHref(html, 'prev'), `/cyber-knowledge/${previous}.html`, `${module}: prev`);
    assert.equal(linkHref(html, 'next'), `/cyber-knowledge/${next}.html`, `${module}: next`);
  }
});

test('every numbered module has one valid cross-domain Cyber Knowledge handoff', () => {
  const domainById = new Map(knowledgeModel.domains.map((domain) => [domain.id, domain]));

  for (const domain of knowledgeModel.domains) {
    const html = source(domain.path.split('/').at(-1));
    const moduleIds = [...html.matchAll(
      /<(?:article|section|div)\b[^>]*\bid=["']((?:m|module-)\d+)["'][^>]*>/gi,
    )].map((match) => match[1]);
    const mappings = crosslinkModel.links[domain.id];
    assert.ok(mappings, `${domain.id}: crosslink mapping is required`);
    assert.deepEqual(
      Object.keys(mappings).sort(),
      [...new Set(moduleIds)].sort(),
      `${domain.id}: every numbered module must be mapped exactly once`,
    );
    const generatedCrosslinkExceptions = domain.id === 'ai-security' ? 1 : 0;
    assert.equal(
      (html.match(/cyber-knowledge:module-crosslink:start/g) || []).length,
      moduleIds.length - generatedCrosslinkExceptions,
      `${domain.id}: generated handoff count`,
    );

    for (const [moduleId, [targetDomainId, targetModuleId]] of Object.entries(mappings)) {
      assert.notEqual(targetDomainId, domain.id, `${domain.id}#${moduleId}: cross-domain target`);
      const targetDomain = domainById.get(targetDomainId);
      assert.ok(targetDomain, `${domain.id}#${moduleId}: known target domain`);
      const targetHtml = source(targetDomain.path.split('/').at(-1));
      assert.match(
        targetHtml,
        new RegExp(`\\bid=["']${targetModuleId}["']`),
        `${domain.id}#${moduleId}: target anchor exists`,
      );
      const href = `/${targetDomain.path}#${targetModuleId}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (domain.id === 'ai-security' && moduleId === 'module-13') {
        assert.match(html, new RegExp(`href="${href}"`), `${domain.id}#${moduleId}: contextual target link`);
        continue;
      }
      assert.match(
        html,
        new RegExp(`class="further-reading module-crosslink"[\\s\\S]*?href="${href}"`),
        `${domain.id}#${moduleId}: generated target link`,
      );
    }
  }
});

test('OSINT attack-surface handoffs target the intended modules', () => {
  const osint = source('osint.html');
  const redTeam = source('red-team.html');
  const cloud = source('cloud-security.html');
  assert.match(redTeam, /\bid="m2"/);
  assert.match(cloud, /\bid="module-11"/);
  assert.match(osint, /href="\/cyber-knowledge\/red-team\.html#m2"/);
  assert.match(osint, /href="\/cyber-knowledge\/cloud-security\.html#module-11">Cloud posture and exposure/);
  assert.doesNotMatch(osint, /cloud-security\.html#module-10">Cloud posture and exposure/);
});

test('CTI terms have one generated DefinedTermSet', () => {
  const sets = jsonLdEntries(source('cti.html')).filter((entry) => entry['@type'] === 'DefinedTermSet');
  assert.equal(sets.length, 1);
  assert.equal(sets[0].hasDefinedTerm.length, 69);
  for (const term of sets[0].hasDefinedTerm) {
    assert.equal(term['@type'], 'DefinedTerm');
    assert.match(term.url, /^https:\/\/1200km\.com\/cyber-knowledge\/cti\.html#[a-z0-9-]+$/);
    assert.ok(term.name);
    assert.ok(term.description);
  }
});

test('domain glossaries have generated, independently addressable DefinedTerm records', () => {
  const expectedMinimum = new Map([
    ['blue-team', 20],
    ['vulnerability-research', 16],
    ['malware-analysis', 16],
  ]);
  for (const [module, minimum] of expectedMinimum) {
    const html = source(`${module}.html`);
    const sets = jsonLdEntries(html).filter((entry) => entry['@type'] === 'DefinedTermSet');
    assert.equal(sets.length, 1, module);
    assert.ok(sets[0].hasDefinedTerm.length >= minimum, module);
    for (const term of sets[0].hasDefinedTerm) {
      assert.equal(term['@type'], 'DefinedTerm', module);
      const fragment = new URL(term.url).hash.slice(1);
      assert.ok(fragment, `${module}: term fragment`);
      assert.match(html, new RegExp(`\\bid="${fragment}"`), `${module}: ${fragment}`);
      assert.ok(term.name, module);
      assert.ok(term.description, module);
    }
  }
});

test('shared knowledge styles preserve focus and light-theme contrast', () => {
  const css = readFileSync(join(ROOT, 'assets', 'site-theme.css'), 'utf8');
  assert.match(css, /\.table-wrap:focus-visible[\s\S]*outline:/);
  assert.match(css, /\.table-wrap table:not\(\.compare-table\)[\s\S]*display:\s*table/);
  assert.match(css, /\.analysis-note a[\s\S]*text-decoration:\s*underline/);
  assert.match(css, /\[data-theme="light"\] \.workflow strong[\s\S]*color:\s*#163f80/);
  assert.match(css, /\[data-theme="light"\] \.evidence-note strong[\s\S]*color:\s*#00684f/);
  assert.match(css, /\[data-theme="light"\] \.boundary strong[\s\S]*color:\s*#7a4800/);
  assert.match(css, /\[data-theme="light"\] \.case-study h3[\s\S]*color:\s*#7f1d2d/);
  assert.match(css, /\[data-theme="light"\] \.decision-gate strong[\s\S]*color:\s*#00684f/);
});
