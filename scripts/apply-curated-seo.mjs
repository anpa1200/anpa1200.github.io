#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { curatedMetaDescription, normalizeMetaDescriptions } from './release-html-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'seo-descriptions.json'), 'utf8'));
const stale = [];

function routeFile(canonical) {
  const url = new URL(canonical);
  if (url.origin !== 'https://1200km.com') throw new Error(`Unsupported curated-description origin: ${canonical}`);
  if (url.pathname === '/') return 'index.html';
  if (url.pathname.endsWith('/')) return join(url.pathname.slice(1), 'index.html');
  return url.pathname.slice(1);
}

if (model.schema_version !== 1 || !model.descriptions || Array.isArray(model.descriptions)) {
  throw new Error('data/seo-descriptions.json has an unsupported schema.');
}

for (const [canonical, description] of Object.entries(model.descriptions)) {
  if (description.length < 150 || description.length > 160) {
    throw new Error(`${canonical}: curated description must be 150–160 characters; found ${description.length}.`);
  }
  if (/…|\.\.|\s{2,}/.test(description)) {
    throw new Error(`${canonical}: curated description contains truncation, repeated punctuation, or repeated whitespace.`);
  }
  if (curatedMetaDescription(canonical) !== description) {
    throw new Error(`${canonical}: curated description loader disagrees with the source model.`);
  }
  const relativePath = routeFile(canonical);
  const path = join(ROOT, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath}: curated-description target is missing.`);
  const current = readFileSync(path, 'utf8');
  const generated = normalizeMetaDescriptions(current);
  if (generated === current) continue;
  if (check) stale.push(relativePath);
  else writeFileSync(path, generated);
}

if (stale.length) {
  throw new Error(`Curated SEO descriptions are stale:\n- ${stale.join('\n- ')}`);
}

console.log(`${check ? 'Validated' : 'Applied'} ${Object.keys(model.descriptions).length} curated meta descriptions.`);
