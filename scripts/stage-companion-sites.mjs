#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sameOriginPlatformAssets, validateCompanions } from './companion-sites-lib.mjs';
import { isEvidenceDocument } from '../cloudflare/evidence-documents.js';
import { prepareCompanionSource } from './prepare-companion-source.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
assert.ok(option('--site'), '--site must point to the quality staging artifact');
const site = resolve(option('--site'));
assert.notEqual(site, root, 'Never build companions over the source checkout');
const workspace = await mkdtemp(join(resolve(option('--work-parent', tmpdir())), '1200km-companions-'));
const entries = validateCompanions(JSON.parse(await readFile(join(root, 'cloudflare/companion-sites.json'), 'utf8')));
console.log(`Pinned companion source workspace: ${workspace}`);
function run(command, commandArgs, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, commandArgs, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(Error(`${command} ${commandArgs.join(' ')} failed (${code}) in ${cwd}`)));
  });
}
async function walk(path) {
  const files = [];
  for (const item of await readdir(path, { withFileTypes: true })) {
    if (item.name === '.git' || item.name === '.github' || item.name === 'node_modules') continue;
    const file = join(path, item.name);
    assert.ok(!item.isSymbolicLink(), `Symlink in published companion output: ${file}`);
    if (item.isDirectory()) files.push(...await walk(file));
    else if (item.isFile()) files.push(file);
  }
  return files;
}
const evidence = [];
// Sequential builds bound peak memory. npm ci honors upstream lockfiles.
for (const entry of entries) {
  const checkout = join(workspace, entry.mount);
  await mkdir(checkout);
  await run('git', ['init', '--quiet'], checkout);
  await run('git', ['fetch', '--quiet', '--depth=1', `https://github.com/${entry.repository}.git`, entry.commit], checkout);
  await run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD'], checkout);
  const source = resolve(checkout, entry.directory);
  let output = source;
  if (entry.kind === 'docusaurus') {
    const config = (await readdir(source)).find((name) => /^docusaurus\.config\.[cm]?[jt]s$/.test(name));
    assert.ok(config, `${entry.mount}: missing Docusaurus config`);
    const path = join(source, config);
    await writeFile(path, sameOriginPlatformAssets(await readFile(path, 'utf8')));
    await prepareCompanionSource(source, entry.mount, path);
    await lstat(join(source, 'package-lock.json'));
    await run('npm', ['ci', '--no-fund', '--no-audit'], source);
    await run('npm', ['run', 'build'], source);
    output = join(source, 'build');
  }
  const files = await walk(output);
  assert.ok(files.includes(join(output, 'index.html')), `${entry.mount}: missing published index`);
  let changed = 0;
  // Reviewed asset-origin overlay for prebuilt publications/static JS. This
  // precedes all validation and identity generation, never artifact download.
  for (const file of files) {
    if (isEvidenceDocument(`${entry.mount}/${file.slice(output.length + 1)}`)) continue;
    if (!/\.(?:html|js|css)$/.test(file)) continue;
    const before = await readFile(file, 'utf8');
    const after = sameOriginPlatformAssets(before);
    if (after !== before) { await writeFile(file, after); changed++; }
  }
  const destination = join(site, entry.mount);
  await mkdir(destination, { recursive: true });
  for (const file of files) {
    const target = join(destination, file.slice(output.length + 1));
    // The main repository owns the consolidated Atlas. Import only its missing
    // historical companion pages/assets, never overwrite the newer integration.
    if (entry.mount === 'anomaly-detection-atlas' && existsSync(target)) continue;
    await mkdir(dirname(target), { recursive: true });
    // Preserve main-owned legacy Markdown alternates. Atlas integration is
    // reapplied by the existing quality job after staging these publications.
    await cp(file, target);
  }
  const sourceDate = execFileSync('git', ['show', '-s', '--format=%cs', entry.commit], { cwd: checkout, encoding: 'utf8' }).trim();
  evidence.push({ ...entry, source_committed_at: sourceDate, files: files.length, asset_origin_overlays: changed });
  if (entry.mount === 'CTI_as_a_Code') {
    // This upstream Markdown image uses an absolute /img URL. Publish its
    // actual pinned file at that existing URL as a compatibility alias.
    const image = 'img/celltronx/cert-il-advisory-IL-2024-TAL-0847.png';
    await mkdir(dirname(join(site, image)), { recursive: true });
    assert.ok(!existsSync(join(site, image)), 'Unexpected image alias collision');
    await cp(join(output, image), join(site, image));
    // The pinned investigation links directly to its ATT&CK Navigator layer,
    // which lives outside docs-site and is not emitted by Docusaurus.
    const navigator = 'investigations/lifetech-2024-11/03-analysis/attck-mapping/attck-navigator-layer.json';
    const publishedNavigator = join(site, entry.mount, navigator);
    await mkdir(dirname(publishedNavigator), { recursive: true });
    assert.ok(!existsSync(publishedNavigator), 'Unexpected Navigator-layer alias collision');
    await cp(join(checkout, navigator), publishedNavigator);
  }
  console.log(`Staged ${entry.mount}: ${files.length} files from ${entry.commit}`);
}
await mkdir(join(site, 'data'), { recursive: true });
await writeFile(join(site, 'data/companion-builds.json'), `${JSON.stringify({ schema_version: 1, asset_origin_overlay: 1, sites: evidence }, null, 2)}\n`);
console.log(`Staged ${evidence.length} pinned companion publications.`);
