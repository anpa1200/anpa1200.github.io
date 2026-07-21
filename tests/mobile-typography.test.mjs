import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standalonePages = [
  'index.html',
  'about.html',
  'cv.html',
  'projects.html',
  'guides.html',
  'labs.html',
  'external-validation.html',
  'adversarygraph/index.html',
  'search.html',
  'adversarygraph-web-guide.html',
  'cti.html',
  'pt-tools.html',
  'hexstrike.html',
  'ai-offensive.html',
  'cover-letter.html',
];

test('mobile source does not globally constrain ordinary prose', () => {
  for (const file of standalonePages) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /max-width\s*:\s*30ch/i, `${file} must not impose the emergency 30ch measure`);
    assert.doesNotMatch(
      source,
      /(?:^|[},]\s*)(?:p\s*,\s*li|li\s*,\s*p)\s*\{[^}]*overflow-wrap\s*:\s*anywhere/is,
      `${file} must not apply emergency wrapping to all paragraphs and list items`,
    );
    assert.doesNotMatch(
      source,
      /@media\s*\([^)]*max-width[^)]*\)[\s\S]*?body\s*\{[^}]*overflow-x\s*:\s*hidden/is,
      `${file} must not hide page overflow to mask a mobile layout defect`,
    );
  }
});

test('shared styles distinguish prose from unbroken technical content', () => {
  const styles = readFileSync(join(ROOT, 'assets', 'site-theme.css'), 'utf8');
  assert.match(styles, /p,\s*\nli\s*\{[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;/s);
  assert.match(styles, /a\[href\^="http"\][\s\S]*?overflow-wrap:\s*anywhere;/);
  assert.match(styles, /pre\s*\{[^}]*overflow-x:\s*auto;[^}]*white-space:\s*pre;/s);
  assert.match(styles, /pre code\s*\{[^}]*overflow-wrap:\s*normal;/s);
  assert.match(styles, /table:not\(\.compare-table\)\s*\{[^}]*overflow-x:\s*auto;/s);
  assert.match(styles, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*10rem\),\s*1fr\)\)/);
});

test('generated AdversaryGraph docs load the post-bundle typography correction', () => {
  const longDocument = readFileSync(join(ROOT, 'adversarygraph-docs', 'full-flow', 'index.html'), 'utf8');
  const override = readFileSync(
    join(ROOT, 'adversarygraph-docs', 'assets', 'css', 'mobile-typography.20260721.css'),
    'utf8',
  );
  assert.match(longDocument, /mobile-typography\.20260721\.css/);
  assert.match(override, /\.theme-doc-markdown p,\s*\n\.theme-doc-markdown li\s*\{[^}]*overflow-wrap:\s*normal;/s);
  assert.match(override, /\.theme-doc-markdown a\[href\^="http"\][\s\S]*?overflow-wrap:\s*anywhere;/);
  assert.match(override, /\.theme-doc-markdown table\s*\{[^}]*overflow-x:\s*auto;/s);
});
