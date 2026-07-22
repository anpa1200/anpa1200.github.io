#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const failures = [];
const skipped = new Set(['.build', '.git', 'node_modules', 'pagefind']);

function walk(directory = site) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (skipped.has(entry)) continue;
    const path = join(directory, entry);
    const metadata = statSync(path);
    if (metadata.isDirectory()) files.push(...walk(path));
    else if (path.endsWith('.html')) files.push(path);
  }
  return files;
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

function localFragment(href) {
  if (!href.startsWith('#') || href === '#' || href.startsWith('#/') || href.startsWith('#!')) return '';
  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return href.slice(1);
  }
}

const files = walk().sort();
for (const path of files) {
  const name = relative(site, path).replace(/\\/g, '/');
  const html = readFileSync(path, 'utf8');
  const ids = new Map();
  for (const match of html.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)) {
    const id = match[1] || match[2];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) failures.push(`${name}: duplicate id "${id}" appears ${count} times.`);
  }

  for (const tag of html.matchAll(/<[^!][^>]*>/g)) {
    const attrs = attributes(tag[0]);
    for (const attribute of ['aria-labelledby', 'aria-describedby']) {
      for (const reference of (attrs[attribute] || '').trim().split(/\s+/).filter(Boolean)) {
        if (!ids.has(reference)) failures.push(`${name}: ${attribute} references missing id "${reference}".`);
      }
    }
    const fragment = localFragment(attrs.href || '');
    if (fragment && !ids.has(fragment)) failures.push(`${name}: href references missing local fragment "#${fragment}".`);
  }
}

const heroPages = [
  'index.html', 'about.html', 'cti.html', 'guides.html', 'projects.html', 'labs.html',
  'external-validation.html', 'adversarygraph/index.html', 'articles/index.html',
];
for (const name of heroPages) {
  const path = join(site, name);
  if (!existsSync(path)) {
    failures.push(`${name}: representative page is missing.`);
    continue;
  }
  const html = readFileSync(path, 'utf8');
  const mainOpen = html.search(/<main\b/i);
  const mainClose = html.search(/<\/main>/i);
  const hero = html.search(/<(?:div|header|section)\b[^>]*class=["'][^"']*(?:hero|page-hero|profile-hero)[^"']*["']/i);
  if ((html.match(/<main\b/gi) || []).length !== 1) failures.push(`${name}: expected exactly one main landmark.`);
  if (hero < 0 || mainOpen < 0 || mainClose < hero || hero < mainOpen) failures.push(`${name}: hero is not inside the main landmark.`);
}

if (failures.length) {
  console.error(`HTML semantic validation failed (${failures.length}):`);
  failures.slice(0, 200).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 200) console.error(`- ${failures.length - 200} additional failure(s) omitted.`);
  process.exit(1);
}
console.log(`HTML semantic validation passed for ${files.length} documents.`);
