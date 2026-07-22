#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_POLICY,
  VOCABULARIES,
  normalizeContentUrl,
} from './content-catalog-lib.mjs';
import { parseSitemapEntries, stripHtml } from './search-index-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = siteIndex >= 0 ? resolve(args[siteIndex + 1] || '') : ROOT;
const catalogPath = join(siteRoot, 'data', 'content-catalog.json');
const configPath = join(ROOT, 'data', 'content-catalog.config.json');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  if (!existsSync(path)) {
    fail(`Missing file: ${relative(ROOT, path)}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function validDate(value) {
  return value === null || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
}

function localPathForUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.hostname !== '1200km.com') return null;
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const candidates = rel === '' ? ['index.html']
    : rel.endsWith('/') ? [`${rel}index.html`]
      : [rel, `${rel}/index.html`];
  return candidates.map((candidate) => join(siteRoot, candidate)).find((path) => existsSync(path) && statSync(path).isFile()) || null;
}

function parseLinks(html, base) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => normalizeContentUrl(match[1], base))
    .filter(Boolean);
}

function htmlFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const catalog = JSON.parse(read(catalogPath) || '{}');
const config = JSON.parse(read(configPath) || '{}');
const schema = JSON.parse(read(join(ROOT, 'data', 'content-catalog.schema.json')) || '{}');
if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Content catalogue schema must use JSON Schema draft 2020-12.');
if (catalog.$schema !== './content-catalog.schema.json') fail('Content catalogue has an unexpected $schema value.');
if (!/^\d+\.\d+\.\d+$/.test(catalog.catalog_version || '')) fail('Content catalogue version must be semantic.');
if (!validDate(catalog.generated_at)) fail('Content catalogue generated_at must be a valid ISO date.');
if (!['local-source-catalog', 'deployable-domain-catalog'].includes(catalog.scope)) fail(`Unsupported catalogue scope: ${catalog.scope}`);
if (JSON.stringify(catalog.controlled_vocabularies) !== JSON.stringify(VOCABULARIES)) fail('Checked-in controlled vocabularies disagree with the generator.');
if (JSON.stringify(catalog.canonical_policy) !== JSON.stringify(CANONICAL_POLICY)) fail('Checked-in canonical policy disagrees with the generator.');
if (!Array.isArray(catalog.items) || !catalog.items.length) fail('Content catalogue must contain items.');

const required = [
  'id', 'title', 'primary_type', 'primary_domain', 'audience', 'status', 'maturity', 'evidence_level',
  'collection_tier', 'source_platform', 'source_repository', 'original_publication', 'canonical_owner',
  'applies_to', 'canonical_url', 'published_at', 'updated_at', 'summary', 'tags', 'featured', 'indexable',
];
const ids = new Map();
const canonicals = new Map();
const alternateOwners = new Map();
const itemByAnyUrl = new Map();
for (const [index, item] of (catalog.items || []).entries()) {
  const label = item.id || `items[${index}]`;
  for (const key of required) if (!(key in item)) fail(`${label}: missing required field ${key}.`);
  if (typeof item.primary_type !== 'string' || !VOCABULARIES.primary_types.includes(item.primary_type)) fail(`${label}: unknown or non-scalar primary_type ${JSON.stringify(item.primary_type)}.`);
  if (typeof item.primary_domain !== 'string' || !VOCABULARIES.primary_domains.includes(item.primary_domain)) fail(`${label}: unknown or non-scalar primary_domain ${JSON.stringify(item.primary_domain)}.`);
  if (!Array.isArray(item.audience) || !item.audience.length || item.audience.some((value) => !VOCABULARIES.audiences.includes(value))) fail(`${label}: audience contains an unknown value.`);
  if (!VOCABULARIES.statuses.includes(item.status)) fail(`${label}: unknown status ${item.status}.`);
  if (!VOCABULARIES.maturity.includes(item.maturity)) fail(`${label}: unknown maturity ${item.maturity}.`);
  if (!VOCABULARIES.evidence_levels.includes(item.evidence_level)) fail(`${label}: unknown evidence_level ${item.evidence_level}.`);
  if (!VOCABULARIES.collection_tiers.includes(item.collection_tier)) fail(`${label}: unknown collection_tier ${item.collection_tier}.`);
  if (typeof item.source_platform !== 'string' || !item.source_platform.trim()) fail(`${label}: source_platform is required.`);
  if (typeof item.canonical_owner !== 'string' || !item.canonical_owner.trim()) fail(`${label}: canonical_owner is required.`);
  for (const key of ['source_repository', 'original_publication']) {
    try {
      const value = new URL(item[key]);
      if (!['http:', 'https:'].includes(value.protocol)) throw new Error('unsupported protocol');
    } catch {
      fail(`${label}: ${key} must be an absolute HTTP(S) URL.`);
    }
  }
  if (!validDate(item.published_at) || !validDate(item.updated_at)) fail(`${label}: publication dates must be valid ISO dates or null.`);
  if (typeof item.title !== 'string' || !item.title.trim() || typeof item.summary !== 'string' || !item.summary.trim()) fail(`${label}: title and summary are required.`);
  if (typeof item.applies_to !== 'string' || !item.applies_to.trim()) fail(`${label}: applies_to is required.`);
  if (!Array.isArray(item.tags) || !item.tags.length || new Set(item.tags).size !== item.tags.length) fail(`${label}: tags must be a non-empty unique string array.`);
  if (typeof item.featured !== 'boolean' || typeof item.indexable !== 'boolean') fail(`${label}: featured and indexable must be booleans.`);
  let canonical;
  try {
    canonical = new URL(item.canonical_url).href;
  } catch {
    fail(`${label}: invalid canonical_url ${item.canonical_url}.`);
    continue;
  }
  if (ids.has(item.id)) fail(`${label}: duplicate ID also used by ${ids.get(item.id)}.`);
  else ids.set(item.id, canonical);
  if (canonicals.has(canonical)) fail(`${label}: duplicate canonical URL also used by ${canonicals.get(canonical)}.`);
  else canonicals.set(canonical, label);
  itemByAnyUrl.set(normalizeContentUrl(canonical), item);
  for (const alternate of item.alternate_urls || []) {
    const normalized = normalizeContentUrl(alternate);
    if (!normalized) fail(`${label}: invalid alternate URL ${alternate}.`);
    else if (alternateOwners.has(normalized)) fail(`${label}: alternate URL is already owned by ${alternateOwners.get(normalized)}.`);
    else {
      alternateOwners.set(normalized, label);
      itemByAnyUrl.set(normalized, item);
    }
  }
  if (item.source_url) itemByAnyUrl.set(normalizeContentUrl(item.source_url), item);
  if (['archived', 'superseded'].includes(item.status)) {
    if (!item.archive_reason) fail(`${label}: archived or superseded content requires archive_reason.`);
    const localPath = localPathForUrl(canonical);
    if (localPath) {
      const html = read(localPath);
      const visible = stripHtml(html);
      if (!/historical|archive|superseded/i.test(visible)) fail(`${label}: superseded/archived local page lacks a visible lifecycle notice.`);
      if (/\b(current|latest)\s+(?:release|version)\b/i.test(item.title)) fail(`${label}: archived content is presented as current in its title.`);
    }
  }
  if (item.status === 'current-development') {
    const localLifecycleUrl = [canonical, ...(item.alternate_urls || [])]
      .find((value) => String(value).startsWith('https://1200km.com/'));
    const localPath = localLifecycleUrl ? localPathForUrl(localLifecycleUrl) : null;
    if (localPath) {
      const visible = stripHtml(read(localPath));
      if (!/current development|unreleased/i.test(visible)) fail(`${label}: current-development page lacks a visible lifecycle notice.`);
    }
  }
  if (item.status === 'released') {
    const localPath = localPathForUrl(canonical);
    const declared = (catalog.declared_collections || []).some((collection) => canonical.startsWith(collection.canonical_prefix));
    if (new URL(canonical).hostname === '1200km.com' && !localPath && !declared) fail(`${label}: released item has no deployable URL or declared remote collection.`);
  }
  if (item.primary_type === 'mirror' && !item.source_url) fail(`${label}: mirror item must identify source_url.`);
  if (/\b(?:AdversaryGraph|ThreatMapper)\s+v\d/i.test(item.title) && !item.version) fail(`${label}: version-specific item is missing version.`);
  if (['archived', 'superseded'].includes(item.status) && item.collection_tier !== 'archive') fail(`${label}: archived or superseded content must use the archive tier.`);
}

for (const collection of catalog.declared_collections || []) {
  if (!String(collection.id || '').startsWith('collection:')) fail('Declared collection IDs must start with collection:.');
  if (!VOCABULARIES.primary_types.includes(collection.primary_type)) fail(`${collection.id}: unknown primary_type.`);
  if (!VOCABULARIES.primary_domains.includes(collection.primary_domain)) fail(`${collection.id}: unknown primary_domain.`);
  if (!VOCABULARIES.statuses.includes(collection.status)) fail(`${collection.id}: unknown status.`);
  if (!VOCABULARIES.maturity.includes(collection.maturity)) fail(`${collection.id}: unknown maturity.`);
  if (!VOCABULARIES.evidence_levels.includes(collection.evidence_level)) fail(`${collection.id}: unknown evidence level.`);
  if (!VOCABULARIES.collection_tiers.includes(collection.collection_tier)) fail(`${collection.id}: unknown collection tier.`);
}

const aliasUrls = new Set();
for (const alias of catalog.aliases || []) {
  const aliasUrl = normalizeContentUrl(alias.alias_url);
  const canonical = normalizeContentUrl(alias.canonical_url);
  if (!aliasUrl || !canonical) fail(`Invalid alias declaration: ${JSON.stringify(alias)}.`);
  else {
    if (aliasUrls.has(aliasUrl)) fail(`Duplicate alias URL: ${aliasUrl}.`);
    aliasUrls.add(aliasUrl);
    if (!itemByAnyUrl.has(canonical)) fail(`Alias target is not catalogued: ${canonical}.`);
    const path = localPathForUrl(aliasUrl);
    if (!path) fail(`Alias has no deployed redirect file: ${aliasUrl}.`);
    else {
      const html = read(path);
      if (!/http-equiv=["']refresh/i.test(html) || !/noindex/i.test(html)) fail(`${relative(siteRoot, path)}: alias must be a noindex redirect.`);
    }
    if (alias.prefix && new URL(aliasUrl).hostname === '1200km.com') {
      const directory = join(siteRoot, decodeURIComponent(new URL(aliasUrl).pathname).replace(/^\/+|\/+$/g, ''));
      for (const htmlPath of htmlFiles(directory)) {
        const html = read(htmlPath);
        if (!/http-equiv=["']refresh/i.test(html) || !/noindex/i.test(html)) {
          fail(`${relative(siteRoot, htmlPath)}: alias-prefix page must be a noindex redirect.`);
        }
      }
    }
  }
}

const sitemapName = catalog.scope === 'deployable-domain-catalog' ? 'sitemap.xml' : 'sitemap-all.xml';
const sitemap = parseSitemapEntries(read(join(siteRoot, sitemapName))).entries.map((entry) => entry.loc);
const sitemapSet = new Set(sitemap);
for (const url of sitemap) if (!itemByAnyUrl.has(normalizeContentUrl(url))) fail(`${sitemapName}: indexed URL has no catalogue identity: ${url}.`);
for (const item of catalog.items || []) {
  if (item.indexable && item.canonical_url.startsWith('https://1200km.com/') && !sitemapSet.has(item.canonical_url)) {
    fail(`${item.id}: indexable 1200km URL is absent from ${sitemapName}.`);
  }
}

for (const relativePath of config.major_indexes || []) {
  const path = join(siteRoot, relativePath);
  const html = read(path);
  const base = relativePath === 'index.html' ? 'https://1200km.com/' : `https://1200km.com/${relativePath}`;
  for (const url of parseLinks(html, base)) {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'pypi.org' || parsedUrl.hostname === 'linkedin.com') continue;
    if (/\.(?:json|xml|txt|pdf|png|jpe?g|webp|svg)$/i.test(parsedUrl.pathname)) continue;
    if (url === 'https://medium.com/@1200km') continue;
    if (itemByAnyUrl.has(url) || aliasUrls.has(url)) continue;
    const declared = (catalog.declared_collections || []).some((collection) => url.startsWith(collection.canonical_prefix));
    if (declared && catalog.scope === 'local-source-catalog') continue;
    if (parsedUrl.hostname === '1200km.com' || /(?:medium\.com|infosecwriteups\.com)$/.test(parsedUrl.hostname)) {
      fail(`${relativePath}: indexed content link has no catalogue identity: ${url}.`);
    }
  }
}

const feed = read(join(siteRoot, 'feed.xml'));
for (const match of feed.matchAll(/<(?:link|guid)(?:\s[^>]*)?>(https:\/\/1200km\.com\/[^<]+)<\//gi)) {
  const url = normalizeContentUrl(match[1]);
  if (!itemByAnyUrl.has(url)) fail(`feed.xml: item has no catalogue identity: ${url}.`);
}

for (const [path, expected] of [
  ['https://1200km.com/hexstrike.html', 'offensive-security'],
  ['https://1200km.com/ai-offensive.html', 'offensive-security'],
  ['https://1200km.com/pt-tools.html', 'offensive-security'],
]) {
  const item = itemByAnyUrl.get(path);
  if (!item || item.primary_domain !== expected) fail(`${path}: generic offensive material must not be classified as CTI.`);
}

const expectedInventory = {
  item_count: catalog.items?.length || 0,
  indexable_count: (catalog.items || []).filter((item) => item.indexable).length,
  external_count: (catalog.items || []).filter((item) => !item.canonical_url.startsWith('https://1200km.com/')).length,
};
for (const [key, value] of Object.entries(expectedInventory)) if (catalog.inventory?.[key] !== value) fail(`inventory.${key} is ${catalog.inventory?.[key]}, expected ${value}.`);

if (failures.length) {
  console.error(`Content catalogue validation failed (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}
console.log(`Content catalogue validation passed: ${catalog.items.length} identities, ${catalog.inventory.indexable_count} indexed URLs, ${catalog.declared_collections.length} declared collections, ${catalog.aliases.length} aliases.`);
