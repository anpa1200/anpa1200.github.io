import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const pages = ['about.html', 'ai-offensive.html', 'cti.html', 'cv.html', 'guides.html', 'hexstrike.html', 'index.html', 'labs.html', 'projects.html', 'pt-tools.html'];

test('authored hubs link directly to canonical article, project, and home routes', () => {
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    assert.doesNotMatch(html, /<a\b[^>]*\bhref=["'](?:https:\/\/1200km\.com)?\/articles\/read\/\d{4}\/[^/"'?#]+["']/i, page);
    assert.doesNotMatch(html, /<a\b[^>]*\bhref=["'](?:https:\/\/1200km\.com)?\/operation-desert-hydra\/docs\/[^/"'?#]+["']/i, page);
    assert.doesNotMatch(html, /<a\b[^>]*\bhref=["']\/?index\.html["']/i, page);
  }
});
