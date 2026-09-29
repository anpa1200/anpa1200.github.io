#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] || '' : root);
const check = args.includes('--check');
const path = join(site, 'ai-security-course/glossary.html');
const html = readFileSync(path, 'utf8');
const literal = html.match(/const TERMS = (\[[\s\S]*?\]);\s*const /)?.[1];
if (!literal) throw new Error('AI course glossary TERMS array not found.');
const terms = JSON.parse(literal);
if (!Array.isArray(terms) || terms.some((item) => !Array.isArray(item) || item.length !== 3 || item.some((part) => typeof part !== 'string'))) {
  throw new Error('AI course glossary TERMS must contain term, category, and definition strings.');
}
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const groups = new Map();
for (const item of [...terms].sort((a, b) => a[0].localeCompare(b[0]))) {
  const letter = item[0][0].toUpperCase();
  if (!groups.has(letter)) groups.set(letter, []);
  groups.get(letter).push(item);
}
const sections = [...groups].map(([letter, items]) => [
  `      <section aria-labelledby="glossary-letter-${escape(letter.toLowerCase())}">`,
  `        <h2 class="letter" id="glossary-letter-${escape(letter.toLowerCase())}">${escape(letter)}</h2>`,
  '        <div class="terms">',
  ...items.map(([term, category, definition]) => `          <article class="term"><h3>${escape(term)}</h3><p>${escape(definition)}</p><span class="cat">${escape(category)}</span></article>`),
  '        </div>',
  '      </section>',
].join('\n')).join('\n');
const generated = `<!-- glossary-static:start -->\n    <div id="glossary" data-glossary-static>\n${sections}\n    </div>\n    <!-- glossary-static:end -->`;
const region = /<!-- glossary-static:start -->[\s\S]*?<!-- glossary-static:end -->|<div id="glossary"><\/div>/;
if (!region.test(html)) throw new Error('AI course glossary static region not found.');
const output = html.replace(region, generated).replace(
  'This searchable glossary requires JavaScript. The terminology is also included in the Module 00 course source.',
  'Search and category filters require JavaScript; every definition is available below without it.',
);
if (check && output !== html) throw new Error('AI course glossary static definitions are stale. Run npm run build-ai-course-glossary.');
if (!check && output !== html) writeFileSync(path, output);
console.log(`${check ? 'Validated' : 'Generated'} ${terms.length} static AI course glossary entries.`);
