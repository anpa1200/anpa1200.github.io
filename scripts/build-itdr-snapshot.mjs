#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback = '') {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const source = resolve(option('--source', process.env.ITDR_SOURCE || join(ROOT, '..', 'ITDR')));
const canonicalConfig = join(ROOT, 'sources', 'itdr', 'docusaurus.config.js');
const sourceConfig = join(source, 'docusaurus.config.js');
const sourceBuild = join(source, 'build');
const stage = await mkdtemp(join(tmpdir(), '1200km-itdr-'));
const stagedSite = join(stage, 'site');
const stagedItDr = join(stagedSite, 'ITDR');

try {
  const config = await readFile(canonicalConfig, 'utf8');
  await writeFile(sourceConfig, config);
  execFileSync('npm', ['run', 'build'], { cwd: source, stdio: 'inherit' });
  await cp(sourceBuild, stagedItDr, { recursive: true });
  execFileSync('node', [
    join(ROOT, 'scripts', 'build-site-artifacts.mjs'),
    '--site',
    stagedSite,
    '--source',
    ROOT,
  ], { cwd: ROOT, stdio: 'inherit' });
  await rm(join(ROOT, 'ITDR'), { recursive: true, force: true });
  await cp(stagedItDr, join(ROOT, 'ITDR'), { recursive: true });
  console.log(`Rebuilt ${join(ROOT, 'ITDR')} from ${source}.`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
