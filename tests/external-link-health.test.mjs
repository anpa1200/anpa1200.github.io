import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowlistMatch,
  classifyProbe,
  stableTerminalFailures,
  updateLinkState,
} from '../scripts/external-link-health-lib.mjs';

test('HEAD/GET outcomes distinguish healthy, blocked, dead, and redirect loops', () => {
  assert.equal(classifyProbe({ status: 204 }), 'healthy');
  assert.equal(classifyProbe({ status: 403 }), 'blocked');
  assert.equal(classifyProbe({ status: 429 }), 'blocked');
  assert.equal(classifyProbe({ status: 404 }), 'dead');
  assert.equal(classifyProbe({ status: 410 }), 'dead');
  assert.equal(classifyProbe({ error: 'redirect count exceeded' }), 'redirect-loop');
});

test('a seeded stable 404 fails only on its second consecutive run', () => {
  const first = updateLinkState('https://example.invalid/missing', { status: 404, method: 'GET' });
  assert.equal(stableTerminalFailures([first]).length, 0);
  const second = updateLinkState(
    first.url,
    { status: 404, method: 'GET' },
    first,
  );
  assert.equal(second.consecutive_terminal_failures, 2);
  assert.deepEqual(stableTerminalFailures([second]), [second]);
});

test('anti-bot allowlist matches reviewed hosts without masking other domains', () => {
  const entries = [{ host: 'linkedin.com', include_subdomains: true, reason: 'anti-bot' }];
  assert.ok(allowlistMatch('https://www.linkedin.com/in/example/', entries));
  assert.equal(allowlistMatch('https://linkedin.example/', entries), null);
});
