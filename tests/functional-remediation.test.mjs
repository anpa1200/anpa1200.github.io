import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'pagefind', 'materials']);

function walkHtml(directory = ROOT) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function hrefFromTag(tag) {
  return tag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1] || '';
}

test('email controls have a working no-JavaScript mailto fallback', () => {
  const failures = [];
  let controls = 0;
  for (const path of walkHtml()) {
    const html = readFileSync(path, 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*(?:data-email-user|aria-label=["']Email["'])[^>]*>[\s\S]*?<\/a>/gi)) {
      controls += 1;
      const href = hrefFromTag(match[0]);
      if (href !== 'mailto:1200km@gmail.com') failures.push(`${path}: ${href || '(missing href)'}`);
    }
    for (const match of html.matchAll(/<a\b[^>]*href=["']#["'][^>]*>\s*Email\s*<\/a>/gi)) {
      failures.push(`${path}: Email still points to #`);
    }
  }
  assert.ok(controls >= 4, `expected at least four email controls, found ${controls}`);
  assert.deepEqual(failures, []);
});

test('nested 404 recovery links are root-relative and resolve locally', async (context) => {
  const notFoundHtml = readFileSync(join(ROOT, '404.html'), 'utf8');
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidate = resolve(ROOT, relative);
    if (candidate.startsWith(`${ROOT}/`) && existsSync(candidate) && statSync(candidate).isFile()) {
      response.writeHead(200, { 'content-type': contentTypes[extname(candidate)] || 'application/octet-stream' });
      response.end(readFileSync(candidate));
      return;
    }
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(notFoundHtml);
  });
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  context.after(() => server.close());

  const origin = `http://127.0.0.1:${server.address().port}`;
  const missing = await fetch(`${origin}/does/not/exist/x.html`);
  assert.equal(missing.status, 404);
  const rendered404 = await missing.text();
  const recoveryMarkup = rendered404.match(/<div class="error-nav">([\s\S]*?)<\/div>\s*<a class="error-home"[\s\S]*?<\/a>/i)?.[0];
  assert.ok(recoveryMarkup, '404 recovery controls were not found');
  const recoveryLinks = [...recoveryMarkup.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
  assert.ok(recoveryLinks.length >= 7, `expected at least seven recovery links, found ${recoveryLinks.length}`);

  for (const href of recoveryLinks) {
    assert.ok(href.startsWith('/'), `404 recovery link must be root-relative: ${href}`);
    const response = await fetch(new URL(href, origin));
    assert.equal(response.status, 200, `404 recovery link must resolve: ${href}`);
  }
});

test('ITDR snapshot has a valid source target and no dead edit controls', () => {
  const representativePages = [
    join(ROOT, 'ITDR', 'index.html'),
    join(ROOT, 'ITDR', 'docs', 'intro', 'index.html'),
    join(ROOT, 'ITDR', 'docs', 'iga', 'iga-overview', 'index.html'),
  ];
  for (const path of representativePages) {
    const html = readFileSync(path, 'utf8');
    assert.doesNotMatch(html, /https:\/\/github\.com\/anpa1200\/ITDR(?:["/<])/i, `${path}: dead ITDR repository target`);
    assert.doesNotMatch(html, />\s*Edit this page\s*</i, `${path}: edit control must be disabled`);
    assert.match(
      html,
      /https:\/\/github\.com\/anpa1200\/anpa1200\.github\.io\/tree\/main\/ITDR/i,
      `${path}: valid published-source target is missing`,
    );
  }
});
