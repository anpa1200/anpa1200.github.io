#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const site = resolve(valueAfter('--site', ROOT));
const expectedCommit = valueAfter('--site-commit', '');
const failures = [];

async function walk(directory = site) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

let identity;
try {
  identity = JSON.parse(await readFile(join(site, 'build.json'), 'utf8'));
} catch (error) {
  throw new Error(`Unable to read build.json: ${error.message}`);
}

for (const field of [
  'site_commit', 'artifact_digest', 'built_at', 'workflow_run_id',
  'archive_source_repository', 'archive_source_commit',
  'site_facts_model_version', 'content_catalog_model_version',
]) {
  if (!identity[field]) failures.push(`build.json is missing ${field}`);
}
if (!/^[0-9a-f]{40}$/i.test(identity.site_commit || '')) failures.push('site_commit is not a full Git SHA');
if (!/^sha256:[0-9a-f]{64}$/i.test(identity.artifact_digest || '')) failures.push('artifact_digest is not a SHA-256 digest');
if (!/^[0-9a-f]{40}$/i.test(identity.archive_source_commit || '')) failures.push('archive_source_commit is not a full Git SHA');
if (identity.archive_source_repository !== 'anpa1200/medium-blog-navigation') failures.push('archive source repository is unexpected');
if (Number.isNaN(Date.parse(identity.built_at || ''))) failures.push('built_at is not an ISO date');
if (expectedCommit && identity.site_commit !== expectedCommit) failures.push(`expected ${expectedCommit}, found ${identity.site_commit}`);

const pages = await walk();
for (const path of pages) {
  const html = await readFile(path, 'utf8');
  const matches = [...html.matchAll(/<meta\b[^>]*name=["']1200km-build["'][^>]*>/gi)];
  if (matches.length !== 1) failures.push(`${relative(site, path)} has ${matches.length} build identity tags`);
  else if (!matches[0][0].includes(identity.site_commit)) failures.push(`${relative(site, path)} does not expose the current build commit`);
}

if (failures.length) {
  console.error(`Build identity validation failed (${failures.length}):`);
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Build identity validated for ${pages.length} HTML documents (${identity.site_commit}).`);
