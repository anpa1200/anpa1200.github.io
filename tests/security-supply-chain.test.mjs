import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  decodeEntities,
  deferThirdPartyBoot,
  replaceStructuredData,
  transformReleaseHtml,
} from '../scripts/release-html-lib.mjs';
import {
  htmlTextContent,
  removeHtmlElements,
} from '../scripts/html-token-utils.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);

test('release transformer places strict CSP before external theme bootstrap', () => {
  const input = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const output = transformReleaseHtml(input, {
    canonical: 'https://1200km.com/',
    dateModified: '2026-07-24',
    htmlPath: join(ROOT, 'index.html'),
    siteRoot: ROOT,
  });
  const cspIndex = output.indexOf('http-equiv="Content-Security-Policy"');
  const firstScriptIndex = output.search(/<script\b/i);
  assert.ok(cspIndex > -1);
  assert.ok(firstScriptIndex > cspIndex, 'CSP must precede every script');
  assert.match(output, /<script src="\/assets\/theme-bootstrap\.js"><\/script>/);
  assert.doesNotMatch(output, /<script>\(function\(\)\{var t=localStorage/);
  const csp = output.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  assert.doesNotMatch(csp, /frame-ancestors/);
  assert.doesNotMatch(csp, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
});

test('HTML element removal handles quoted delimiters and spaced closing tags', () => {
  const input = '<p>Before</p><script data-value=">">window.bad = true;</script ><p>After</p>';
  assert.equal(removeHtmlElements(input, 'script'), '<p>Before</p><p>After</p>');
  assert.equal(htmlTextContent(input).replace(/\s+/g, ' ').trim(), 'Before After');
});

test('entity decoding is single-pass and rejects invalid Unicode scalar values', () => {
  assert.equal(decodeEntities('&lt;script&gt;'), '<script>');
  assert.equal(decodeEntities('&amp;lt;script&amp;gt;'), '&lt;script&gt;');
  assert.equal(decodeEntities('&#x1f512;'), '🔒');
  assert.equal(decodeEntities('&#xD800;'), '&#xD800;');
  assert.equal(decodeEntities('&#99999999;'), '&#99999999;');
});

test('release transforms remove only selected complete script elements', () => {
  const input = [
    '<!doctype html><html><head>',
    '<script type="application/ld+json" data-value=">">{"stale":true}</script >',
    '<script src="https://www.googletagmanager.com/gtag/js?id=G-TEST123"></script >',
    '<script>gtag("config", "G-TEST123");</script >',
    '<script src="/assets/site-theme.js"></script >',
    '</head><body><main><h1>Test</h1></main></body></html>',
  ].join('');
  const withoutThirdParty = deferThirdPartyBoot(input);
  assert.doesNotMatch(withoutThirdParty, /googletagmanager|gtag\("config"/);
  assert.match(withoutThirdParty, /src="\/assets\/site-theme\.js"/);
  assert.match(withoutThirdParty, /data-google-analytics-id="G-TEST123"/);

  const output = replaceStructuredData(withoutThirdParty, {
    canonical: 'https://1200km.com/test.html',
    dateModified: '2026-07-25',
    htmlPath: join(ROOT, 'test.html'),
    siteRoot: ROOT,
  });
  assert.equal((output.match(/type="application\/ld\+json"/g) || []).length, 1);
  assert.match(output, /src="\/assets\/site-theme\.js"/);
});

test('edge worker declares all response security headers', () => {
  const worker = readFileSync(join(ROOT, 'cloudflare', 'agent-readiness-worker.js'), 'utf8');
  for (const name of [
    'Content-Security-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
  ]) {
    assert.ok(worker.includes(`'${name}'`), `${name} is missing`);
  }
  assert.match(worker, /frame-ancestors 'none'/);
});

test('all third-party workflow actions are pinned to full commit SHAs', () => {
  const workflows = readdirSync(join(ROOT, '.github', 'workflows'))
    .filter((name) => /\.ya?ml$/i.test(name));
  const unpinned = [];
  for (const name of workflows) {
    const yaml = readFileSync(join(ROOT, '.github', 'workflows', name), 'utf8');
    for (const match of yaml.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
      if (match[1].startsWith('./')) continue;
      if (!/@[a-f0-9]{40}$/.test(match[1])) unpinned.push(`${name}: ${match[1]}`);
    }
  }
  assert.deepEqual(unpinned, []);
});

test('RFC 9116 endpoint has canonical contact, policy, and future expiry', () => {
  const security = readFileSync(join(ROOT, '.well-known', 'security.txt'), 'utf8');
  assert.match(security, /^Contact: mailto:1200km@gmail\.com$/m);
  assert.match(security, /^Canonical: https:\/\/1200km\.com\/\.well-known\/security\.txt$/m);
  assert.match(security, /^Policy: https:\/\/1200km\.com\/SECURITY\.md$/m);
  const expires = security.match(/^Expires:\s*(.+)$/m)?.[1];
  assert.ok(expires && Date.parse(expires) > Date.now(), 'security.txt expiry must be in the future');
});
