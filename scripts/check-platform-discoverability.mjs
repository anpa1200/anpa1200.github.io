#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseJsonLd } from './release-html-lib.mjs';
import { canonicalFromHtml, findMetaContent, normalizeCanonical, validatePage } from './search-index-lib.mjs';
import { isSidebarEligible } from './platform-sidebar-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const siteRoot = resolve(option('--site', ROOT));
const reportPath = resolve(option('--report', join(siteRoot, 'reports', 'platform-discoverability-audit.json')));
const skipped = new Set(['.build', '.git', 'node_modules', 'pagefind']);

async function walk(directory = siteRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function urlForFile(path) {
  const rel = relative(siteRoot, path).replace(/\\/g, '/');
  if (rel === 'index.html') return 'https://1200km.com/';
  if (rel.endsWith('/index.html')) return `https://1200km.com/${rel.slice(0, -'index.html'.length)}`;
  return `https://1200km.com/${rel}`;
}

function count(pattern, value) {
  return (value.match(pattern) || []).length;
}

const pages = [];
const violations = [];
for (const path of (await walk()).sort()) {
  const html = await readFile(path, 'utf8');
  const rel = relative(siteRoot, path).replace(/\\/g, '/');
  const url = urlForFile(path);
  const validation = validatePage(url, html);
  const sidebarEligible = isSidebarEligible(html);
  const sidebarPresent = /\bid=["']platform-sidenav["']/i.test(html);
  const sidebarIgnored = /<aside\b[^>]*\bid=["']platform-sidenav["'][^>]*\bdata-pagefind-ignore\b/i.test(html);
  const sidebarCss = /href=["'][^"']*\/assets\/platform-sidebar\.css/i.test(html);
  const sidebarJs = /src=["'][^"']*\/assets\/platform-sidebar\.js/i.test(html);
  if (sidebarEligible && (!sidebarPresent || !sidebarIgnored || !sidebarCss || !sidebarJs)) {
    violations.push(`${rel}: incomplete governed sidebar integration`);
  }
  const sidebarHtml = html.match(/<aside\b[^>]*\bid=["']platform-sidenav["'][^>]*>[\s\S]*?<\/aside>/i)?.[0] || '';
  if (sidebarPresent && /<h[1-6]\b/i.test(sidebarHtml)) {
    violations.push(`${rel}: sidebar pollutes the document heading hierarchy`);
  }

  const indexable = validation.indexable;
  const canonical = canonicalFromHtml(html) ? normalizeCanonical(canonicalFromHtml(html), url) : '';
  const jsonLd = parseJsonLd(html);
  const pageGraph = jsonLd.objects.flatMap((item) => item?.['@graph'] || [item]);
  const webPage = pageGraph.find((item) => {
    const types = Array.isArray(item?.['@type']) ? item['@type'] : [item?.['@type']];
    return types.some((type) => /(?:WebPage|CollectionPage|ProfilePage|AboutPage|FAQPage|ItemPage|SearchResultsPage)$/.test(type || ''));
  });
  const aboutCount = Array.isArray(webPage?.about) ? webPage.about.length : (webPage?.about ? 1 : 0);
  if (indexable) {
    if (!canonical || canonical !== normalizeCanonical(url)) violations.push(`${rel}: canonical URL is absent or disagrees with its deployed URL`);
    if (!findMetaContent(html, 'description')) violations.push(`${rel}: meta description is missing`);
    for (const field of ['og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
      if (!findMetaContent(html, field)) violations.push(`${rel}: ${field} is missing`);
    }
    if (jsonLd.failures.length || !webPage) violations.push(`${rel}: connected WebPage JSON-LD is missing or invalid`);
  }
  pages.push({
    rel,
    indexable,
    sidebar_eligible: sidebarEligible,
    sidebar_present: sidebarPresent,
    canonical: Boolean(canonical),
    description: Boolean(findMetaContent(html, 'description')),
    social_complete: ['og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image'].every((field) => Boolean(findMetaContent(html, field))),
    structured_data: Boolean(webPage) && !jsonLd.failures.length,
    semantic_topics: aboutCount,
    pagefind_body: /\bdata-pagefind-body\b/i.test(html) || /\bid=["']__docusaurus["']/i.test(html),
    h1_count: count(/<h1\b/gi, html),
    main_count: count(/<main\b/gi, html),
  });
}

const catalogPath = join(siteRoot, 'data', 'content-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const genericTags = catalog.items.filter((item) => item.tags?.includes('security-research'));
const underspecifiedTags = catalog.items.filter((item) => item.indexable && (item.tags || []).length < 2);
if (genericTags.length) violations.push(`${genericTags.length} catalog items use the generic security-research tag`);
if (underspecifiedTags.length) violations.push(`${underspecifiedTags.length} indexable catalog items have fewer than two tags`);

const indexable = pages.filter((page) => page.indexable);
const eligible = pages.filter((page) => page.sidebar_eligible);
const requiredDiscovery = ['robots.txt', 'sitemap.xml', 'sitemap-all.xml', 'llms.txt', 'llms-full.txt', 'agent-index.md', 'data/content-catalog.json'];
const discoveryFiles = Object.fromEntries(requiredDiscovery.map((name) => [name, existsSync(join(siteRoot, name))]));
for (const [name, present] of Object.entries(discoveryFiles)) if (!present) violations.push(`${name}: required discovery surface is missing`);

const bridge = await readFile(join(siteRoot, 'assets', 'docusaurus-ecosystem.js'), 'utf8');
const remoteSidebarBridge = /platform-sidebar\.js\?v=20260804-1/.test(bridge) && /platform-sidebar\.css\?v=20260804-1/.test(bridge);
if (!remoteSidebarBridge) violations.push('Docusaurus ecosystem bridge does not load governed platform navigation');

const metric = (field) => indexable.filter((page) => page[field]).length;
const report = {
  $schema: 'https://1200km.com/data/platform-discoverability-audit.schema.json',
  report_version: '1.0.0',
  generated_at: new Date().toISOString(),
  site_root: siteRoot,
  pages: {
    html_documents: pages.length,
    indexable: indexable.length,
    sidebar_eligible: eligible.length,
    sidebar_integrated: eligible.filter((page) => page.sidebar_present).length,
    canonical_complete: metric('canonical'),
    description_complete: metric('description'),
    social_metadata_complete: metric('social_complete'),
    structured_data_complete: metric('structured_data'),
    semantic_topic_pages: indexable.filter((page) => page.semantic_topics > 0).length,
    pagefind_content_complete: metric('pagefind_body'),
  },
  taxonomy: {
    catalog_items: catalog.items.length,
    indexable_items: catalog.inventory.indexable_count,
    unique_tags: new Set(catalog.items.flatMap((item) => item.tags || [])).size,
    generic_security_research_tags: genericTags.length,
    underspecified_indexable_items: underspecifiedTags.length,
    author_facets: new Set(catalog.items.flatMap((item) => item.tags || []).filter((tag) => tag.startsWith('author:'))).size,
  },
  ai_and_search_discovery: { files: discoveryFiles, remote_docusaurus_sidebar_bridge: remoteSidebarBridge },
  exclusions: {
    count: pages.length - eligible.length,
    policy: 'Meta-refresh redirects and redirect-title documents do not receive navigation or become independent content identities.',
  },
  violations,
};

const schema = JSON.parse(await readFile(join(ROOT, 'data', 'platform-discoverability-audit.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
if (!ajv.validate(schema, report)) {
  violations.push(`discoverability report schema: ${ajv.errorsText(ajv.errors)}`);
}

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (violations.length) {
  console.error(`Platform discoverability audit failed (${violations.length}):`);
  violations.slice(0, 80).forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}
console.log(`Platform discoverability audit passed: ${indexable.length} indexable pages, ${report.pages.sidebar_integrated}/${eligible.length} eligible pages with governed navigation, ${report.taxonomy.unique_tags} discovery tags.`);
