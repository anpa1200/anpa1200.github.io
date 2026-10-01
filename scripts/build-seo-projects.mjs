#!/usr/bin/env node
// Bounded build orchestration. Source locations are explicit CLI inputs and all
// dependency versions come from each project's existing package-lock.json.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
if (!args.includes('--projects') || !args.includes('--logs')) throw Error('--projects and --logs required');
const base = resolve(option('--projects')), logs = resolve(option('--logs'));
const root = resolve(import.meta.dirname, '..');
const targets = [
  ['adversarygraph-docs', '', '/adversarygraph-docs/'],
  ['Hexstrike-AI', '', '/Hexstrike-AI-guide/'],
  ['CTI_as_a_Code', 'docs-site', '/CTI_as_a_Code/'],
  ['cti-analyst-field-manual', '', '/cti-analyst-field-manual/'],
  ['israel-government-threat-actors-cti', '', '/israel-government-threat-actors-cti/'],
  ['customer-driven-ai-cti-project', '', '/customer-driven-ai-cti-project/'],
  ['insider-threat-detection', '', '/insider-threat-detection/'],
  ['anomaly-detection-atlas', '', '/anomaly-detection-atlas/'],
  ['ai-vs-defense', '', '/ai-vs-defense/'],
  ['operation-desert-hydra', 'docs-site', '/operation-desert-hydra/'],
  ['opencti-intelligent-shield', 'docs-site', '/opencti-intelligent-shield/'],
];
mkdirSync(logs, { recursive: true });
const results = [];
function run(command, commandArgs, cwd, log) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, { cwd, env: { ...process.env, CI: 'true', NO_UPDATE_NOTIFIER: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
    child.on('error', reject); child.on('close', code => resolvePromise(code));
  });
}
async function worker() {
  while (targets.length) {
    const [name, subdir, prefix] = targets.shift();
    const cwd = join(base, name, subdir), started = new Date().toISOString();
    const log = createWriteStream(join(logs, name + '.log'));
    console.log(`Building ${name}`);
    let stage = 'overlay';
    let code = await run(process.execPath, [join(root, 'scripts/export-documentation-seo.mjs'), '--project', cwd, '--prefix', prefix], root, log);
    if (!code && !existsSync(join(cwd, 'node_modules'))) { stage = 'npm ci'; code = await run('npm', ['ci', '--no-fund'], cwd, log); }
    if (!code) { stage = 'build'; code = await run('npm', ['run', 'build'], cwd, log); }
    log.end();
    results.push({ name, cwd, prefix, started, ended: new Date().toISOString(), stage, exit_code: code });
    writeFileSync(join(logs, 'build-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(`${name}: ${code === 0 ? 'PASS' : 'FAIL'} (${stage})`);
  }
}
await Promise.all([worker(), worker()]);
if (results.some(result => result.exit_code)) process.exitCode = 1;
