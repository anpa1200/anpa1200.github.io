#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function artifactFiles(site) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), `Asset symlink is not supported: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Non-regular asset: ${path}`);
    }
  }
  await walk(site);
  return files.sort((a, b) => relative(site, a).localeCompare(relative(site, b)));
}

export async function checkStaticArtifact(site, expectedCommit = '') {
  const identity = JSON.parse(await readFile(join(site, 'build.json'), 'utf8'));
  assert.match(identity.site_commit, /^[a-f0-9]{40}$/);
  assert.match(identity.artifact_digest, /^sha256:[a-f0-9]{64}$/);
  if (expectedCommit) assert.equal(identity.site_commit, expectedCommit, 'Wrong quality-job commit');
  const files = await artifactFiles(site);
  assert.ok(files.length <= 100_000, 'Workers Paid asset count limit exceeded');
  const digest = createHash('sha256');
  let bytes = 0;
  for (const path of files) {
    const rel = relative(site, path).replaceAll('\\', '/');
    const metadata = await lstat(path);
    assert.ok(metadata.size <= 25 * 1024 * 1024, `${rel}: exceeds 25 MiB asset limit`);
    bytes += metadata.size;
    if (rel === 'build.json') continue;
    // Exact algorithm from build-identity.mjs. Verify, never regenerate or edit
    // the downloaded artifact: Pages and Workers must receive identical bytes.
    digest.update(`${rel}\0${metadata.size}\0`);
    digest.update(await readFile(path));
    digest.update('\0');
  }
  assert.equal(`sha256:${digest.digest('hex')}`, identity.artifact_digest, 'Artifact bytes changed after quality validation');
  for (const path of ['index.html', '404.html', '.well-known/api-catalog', '.well-known/openapi.json', 'pagefind/pagefind.js']) {
    assert.ok(files.includes(join(site, path)), `Required asset is absent: ${path}`);
  }
  assert.equal(await readFile(join(site, '_headers'), 'utf8'), await readFile(join(ROOT, '_headers'), 'utf8'), 'Worker policy differs from staged _headers');
  // These change the ASSETS router independently of our Worker. Do not allow a
  // future build to introduce them without an explicit compatibility review.
  for (const path of ['_redirects', '.assetsignore', '_worker.js']) {
    assert.ok(!files.includes(join(site, path)), `Unexpected asset routing control: ${path}`);
  }
  return { files: files.length, bytes, identity };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const value = (flag, fallback = '') => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
  console.log(JSON.stringify(await checkStaticArtifact(resolve(value('--site', 'dist')), value('--site-commit')), null, 2));
}
