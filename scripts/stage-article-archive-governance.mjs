#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1]) throw new Error(`Missing required ${name} option.`);
  return args[index + 1];
}

const siteRoot = resolve(option('--site'));
const sourceRoot = resolve(option('--source'));
const archiveRoot = resolve(option('--archive'));
const archiveCommit = option('--archive-commit');

if (!/^[0-9a-f]{40}$/.test(archiveCommit)) throw new Error('Archive commit must be a full 40-character SHA.');

const catalogPath = join(archiveRoot, 'src', 'data', 'article-catalog.json');
const schemaPath = join(archiveRoot, 'src', 'data', 'article-catalog.schema.json');
const reportPath = join(archiveRoot, 'reports', 'article-canonical-migration.csv');
const archiveFactsPath = join(archiveRoot, 'static', 'archive-facts.json');
const siteFactsPath = join(sourceRoot, 'data', 'site-facts.json');
const [catalog, archiveFacts, siteFacts] = await Promise.all([
  readFile(catalogPath, 'utf8').then(JSON.parse),
  readFile(archiveFactsPath, 'utf8').then(JSON.parse),
  readFile(siteFactsPath, 'utf8').then(JSON.parse),
]);

if (!Array.isArray(catalog) || !catalog.length) throw new Error('Article catalog is empty or malformed.');
const articleFact = siteFacts?.facts?.['content.medium_exported_articles'];
if (!articleFact) throw new Error('The content.medium_exported_articles site fact is missing.');
if (articleFact.value !== catalog.length) {
  throw new Error(`Article fact reports ${articleFact.value}; validated catalog contains ${catalog.length}.`);
}
if (archiveFacts.article_count !== catalog.length) {
  throw new Error(`Archive facts report ${archiveFacts.article_count}; catalog contains ${catalog.length}.`);
}

const pinnedSource = `https://github.com/anpa1200/medium-blog-navigation/blob/${archiveCommit}/src/data/article-catalog.json`;
if (!articleFact.source.includes(pinnedSource)) {
  throw new Error(`Article fact does not cite the pinned catalog: ${pinnedSource}`);
}

const ids = new Set();
const canonicals = new Set();
for (const row of catalog) {
  if (!row.id || ids.has(row.id)) throw new Error(`Missing or duplicate article ID: ${row.id || '(missing)'}`);
  ids.add(row.id);
  if (!row.canonical_url || canonicals.has(row.canonical_url)) {
    throw new Error(`Missing or duplicate article canonical: ${row.canonical_url || '(missing)'}`);
  }
  canonicals.add(row.canonical_url);
  const expected = `https://1200km.com/articles/read/${row.local_path}`;
  if (row.canonical_url !== expected) throw new Error(`${row.id}: canonical route does not match local_path.`);
}

const dataDirectory = join(siteRoot, 'data');
const reportDirectory = join(siteRoot, 'reports');
await Promise.all([mkdir(dataDirectory, { recursive: true }), mkdir(reportDirectory, { recursive: true })]);
await Promise.all([
  copyFile(catalogPath, join(dataDirectory, 'article-catalog.json')),
  copyFile(schemaPath, join(dataDirectory, 'article-catalog.schema.json')),
  copyFile(reportPath, join(reportDirectory, 'article-canonical-migration.csv')),
]);

const statusCounts = catalog.reduce((counts, row) => {
  const status = row.canonical_migration_status || 'missing';
  counts[status] = (counts[status] || 0) + 1;
  return counts;
}, {});
const buildRecord = {
  source_repository: 'anpa1200/medium-blog-navigation',
  source_commit: archiveCommit,
  article_count: catalog.length,
  canonical_status_counts: statusCounts,
  external_canonical_verified: catalog.filter((row) => row.external_canonical_verified).length,
};
await writeFile(join(dataDirectory, 'article-archive-build.json'), `${JSON.stringify(buildRecord, null, 2)}\n`);
console.log(`Staged governed article catalog: ${catalog.length} articles from ${archiveCommit}.`);
