import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { transformReleaseHtml } from '../scripts/release-html-lib.mjs';

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
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
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
