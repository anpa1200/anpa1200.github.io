#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allowlistMatch,
  stableTerminalFailures,
  updateLinkState,
} from './external-link-health-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const siteRoot = resolve(option('--site', ROOT));
const outputPath = resolve(option('--output', join(ROOT, 'reports', 'external-links', 'latest.json')));
const statePath = resolve(option('--state', join(ROOT, '.cache', 'external-links-state.json')));
const contractsOnly = args.includes('--contracts-only');
const timeoutMs = Number(option('--timeout-ms', '15000'));
const concurrency = Math.max(1, Number(option('--concurrency', '8')));
const skipped = new Set(['.git', 'node_modules', 'pagefind', 'materials']);

async function json(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function walk(directory = siteRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skipped.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function externalUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/\b(?:href|src)=["'](https?:\/\/[^"'<>]+)["']/gi)) {
    const decoded = match[1].replace(/&amp;/gi, '&');
    try {
      const url = new URL(decoded);
      if (url.hostname !== '1200km.com') urls.push(url.href);
    } catch {
      urls.push(decoded);
    }
  }
  return urls;
}

async function probe(url) {
  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('malformed URL protocol');
  } catch (error) {
    return { status: 0, method: null, error: `malformed URL: ${error.message}` };
  }

  const request = async (method) => {
    const headers = {
      accept: 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.2',
      'user-agent': '1200km-link-health/1.0 (+https://1200km.com/.well-known/security.txt)',
    };
    if (method === 'GET') headers.range = 'bytes=0-2047';
    const response = await fetch(parsed, {
      method,
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.body) await response.body.cancel();
    return { status: response.status, method, error: '' };
  };

  try {
    const head = await request('HEAD');
    if (head.status >= 200 && head.status < 400) return head;
    return await request('GET');
  } catch (headError) {
    try {
      return await request('GET');
    } catch (getError) {
      return {
        status: 0,
        method: 'GET',
        error: `${headError.message}; GET fallback: ${getError.message}`,
      };
    }
  }
}

const contractData = await json(join(ROOT, 'data', 'external-link-contracts.json'), { contracts: [] });
const allowlistData = await json(join(ROOT, 'data', 'external-link-allowlist.json'), { entries: [] });
const previousState = await json(statePath, { urls: {} });
const provenance = new Map();

for (const contract of contractData.contracts || []) {
  provenance.set(contract.url, new Set([`contract:${contract.id}`]));
}

if (!contractsOnly) {
  for (const path of await walk()) {
    const html = await readFile(path, 'utf8');
    for (const url of externalUrls(html)) {
      if (!provenance.has(url)) provenance.set(url, new Set());
      provenance.get(url).add(relative(siteRoot, path).replace(/\\/g, '/'));
    }
  }
}

const urls = [...provenance.keys()].sort();
const checkedAt = new Date().toISOString();
const records = new Array(urls.length);
let cursor = 0;

async function worker() {
  while (cursor < urls.length) {
    const index = cursor;
    cursor += 1;
    const url = urls[index];
    const result = updateLinkState(url, await probe(url), previousState.urls?.[url], checkedAt);
    const allowlisted = allowlistMatch(url, allowlistData.entries || []);
    records[index] = {
      ...result,
      sources: [...provenance.get(url)].sort(),
      allowlist: allowlisted ? { reason: allowlisted.reason } : null,
    };
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, urls.length || 1) }, worker));
const stableFailures = stableTerminalFailures(records);
const counts = Object.fromEntries(
  [...new Set(records.map((record) => record.classification))]
    .sort()
    .map((classification) => [
      classification,
      records.filter((record) => record.classification === classification).length,
    ]),
);
const report = {
  schema_version: 1,
  generated_at: checkedAt,
  contracts_only: contractsOnly,
  summary: {
    checked: records.length,
    stable_terminal_failures: stableFailures.length,
    by_classification: counts,
  },
  records,
};
const state = {
  schema_version: 1,
  updated_at: checkedAt,
  urls: Object.fromEntries(records.map((record) => [record.url, {
    classification: record.classification,
    consecutive_terminal_failures: record.consecutive_terminal_failures,
    checked_at: record.checked_at,
  }])),
};

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(statePath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);

console.log(`External links: ${records.length} checked; ${stableFailures.length} stable terminal failure(s).`);
for (const record of records.filter((item) => item.classification !== 'healthy')) {
  console.log(`${record.classification.toUpperCase()} ${record.status || '-'} ${record.url}`);
}
if (stableFailures.length) process.exitCode = 1;
