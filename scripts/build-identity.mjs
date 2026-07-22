#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback = '') {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function gitValue(parameters, cwd = ROOT) {
  try {
    return execFileSync('git', parameters, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const site = resolve(option('--site', ROOT));
const siteCommit = option('--site-commit', process.env.GITHUB_SHA || gitValue(['rev-parse', 'HEAD']));
const archiveCommit = option('--archive-commit', process.env.ARTICLE_ARCHIVE_COMMIT || '');
const workflowRunId = option('--workflow-run-id', process.env.GITHUB_RUN_ID || 'local');
const builtAt = option('--built-at', process.env.BUILD_TIMESTAMP || new Date().toISOString());

if (!/^[0-9a-f]{40}$/i.test(siteCommit)) throw new Error(`Invalid site commit: ${siteCommit || '(missing)'}`);
if (!/^[0-9a-f]{40}$/i.test(archiveCommit)) throw new Error(`Invalid article archive commit: ${archiveCommit || '(missing)'}`);
if (Number.isNaN(Date.parse(builtAt))) throw new Error(`Invalid build timestamp: ${builtAt}`);

const skippedDirectories = new Set(['.git', 'node_modules']);

async function walk(directory = site) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function addBuildMeta(html) {
  const meta = `    <meta name="1200km-build" content="${siteCommit}" />\n`;
  if (/<meta\b[^>]*name=["']1200km-build["'][^>]*>/i.test(html)) {
    return html.replace(/\s*<meta\b[^>]*name=["']1200km-build["'][^>]*>\s*/i, `\n${meta}`);
  }
  if (!/<\/head>/i.test(html)) throw new Error('HTML document has no closing head element');
  return html.replace(/<\/head>/i, `${meta}  </head>`);
}

const htmlFiles = (await walk()).filter((path) => path.endsWith('.html')).sort();
for (const path of htmlFiles) {
  const html = await readFile(path, 'utf8');
  await writeFile(path, addBuildMeta(html));
}

const digest = createHash('sha256');
const artifactFiles = (await walk())
  .filter((path) => relative(site, path).replace(/\\/g, '/') !== 'build.json')
  .sort((left, right) => relative(site, left).localeCompare(relative(site, right)));
for (const path of artifactFiles) {
  const rel = relative(site, path).replace(/\\/g, '/');
  const metadata = await stat(path);
  digest.update(`${rel}\0${metadata.size}\0`);
  digest.update(await readFile(path));
  digest.update('\0');
}

const facts = JSON.parse(await readFile(join(site, 'data', 'site-facts.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(site, 'data', 'content-catalog.json'), 'utf8'));
const identity = {
  site_commit: siteCommit,
  artifact_digest: `sha256:${digest.digest('hex')}`,
  built_at: new Date(builtAt).toISOString(),
  workflow_run_id: String(workflowRunId),
  archive_source_repository: 'anpa1200/medium-blog-navigation',
  archive_source_commit: archiveCommit,
  site_facts_model_version: String(facts.model_version),
  content_catalog_model_version: String(catalog.catalog_version),
};

await writeFile(join(site, 'build.json'), `${JSON.stringify(identity, null, 2)}\n`);
console.log(`Build identity emitted for ${siteCommit} (${identity.artifact_digest}).`);
console.log(`Injected build identity into ${htmlFiles.length} HTML documents.`);
