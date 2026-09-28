#!/usr/bin/env node
// Operator workflow only. DNS scope is deliberately the existing apex CNAME;
// no record deletion, zone creation, nameserver change, or GitHub Pages removal.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha256 } from './hosting-parity-lib.mjs';
import { validateMigrationReview } from './migration-review-lib.mjs';
const ACCOUNT = '7a79808a203a002faa892a5363c9fa2c';
const ZONE = '3b7d60bc8ed435424d085603a583bd2f';
const RECORD = '9409b2009ec9d703a294ec93c5461d3d';
const args = process.argv.slice(2);
const option = (name, fallback = '') => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const mode = option('--mode', 'status');
assert.ok(['status', 'cutover', 'rollback'].includes(mode));
assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, ACCOUNT, 'Wrong Cloudflare account');
assert.ok(process.env.CLOUDFLARE_API_TOKEN, 'CLOUDFLARE_API_TOKEN missing');
const evidence = resolve(option('--evidence', '/tmp/cloudflare-cutover.json'));
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json();
  assert.ok(response.ok && data.success, `Cloudflare ${method} ${path}: HTTP ${response.status}; codes ${(data.errors || []).map((error) => error.code).join(',')}`);
  return data.result;
}
async function identity(origin) {
  const response = await fetch(`${origin}/build.json?cutover=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, `${origin}: build identity unavailable`);
  return { identity: await response.json(), cloudflare: response.headers.has('cf-ray'), server: response.headers.get('server') };
}
const [zone, records, routes, certificates, ssl, subdomain] = await Promise.all([
  api(`/zones/${ZONE}`), api(`/zones/${ZONE}/dns_records?name=1200km.com`),
  api(`/zones/${ZONE}/workers/routes`), api(`/zones/${ZONE}/ssl/certificate_packs`),
  api(`/zones/${ZONE}/settings/ssl`), api(`/accounts/${ACCOUNT}/workers/subdomain`),
]);
assert.equal(zone.name, '1200km.com');
assert.equal(zone.account.id, ACCOUNT);
assert.equal(zone.status, 'active');
assert.equal(records.length, 1, 'Unexpected apex record topology; stop for review');
const record = records[0];
assert.equal(record.id, RECORD);
assert.equal(record.type, 'CNAME');
assert.equal(record.name, '1200km.com');
assert.equal(record.content, 'anpa1200.github.io');
assert.equal(record.ttl, 1);
const snapshot = { checked_at: new Date().toISOString(), mode, zone: zone.id, record, routes, ssl: ssl.value,
  certificates: certificates.map(({ id, status, hosts }) => ({ id, status, hosts })) };
await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
if (mode === 'status') {
  console.log(JSON.stringify({ zone: zone.name, proxied: record.proxied, routes, evidence }));
} else if (mode === 'rollback') {
  await api(`/zones/${ZONE}/dns_records/${RECORD}`, 'PATCH', { proxied: false });
  snapshot.result = 'Restored direct GitHub Pages DNS; Worker route retained but receives no unproxied traffic';
  await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(snapshot.result);
} else {
  assert.equal(record.proxied, false, 'Already proxied; do not repeat a cutover blindly');
  assert.ok(['full', 'strict'].includes(ssl.value), 'TLS must not use Flexible mode');
  assert.ok(certificates.some((cert) => cert.status === 'active'
    && Array.isArray(cert.hosts) && cert.hosts.some((host) => host === '1200km.com')), 'Active apex TLS certificate required');
  assert.equal(routes.length, 1, 'Unexpected route topology; stop for review');
  assert.equal(routes[0].pattern, '1200km.com/*');
  assert.equal(routes[0].script, '1200km-site');
  const expected = option('--site-commit');
  assert.match(expected, /^[a-f0-9]{40}$/);
  const parity = JSON.parse(await readFile(resolve(option('--parity')), 'utf8'));
  const baselineText = await readFile(resolve(option('--baseline', new URL('../cloudflare/migration-baseline.json', import.meta.url).pathname)), 'utf8');
  const baseline = validateMigrationReview(JSON.parse(baselineText));
  assert.equal(parity.summary.ready_for_cutover, true, 'Main-release strict parity has not passed');
  assert.equal(parity.summary.cutover_blockers, 0);
  assert.equal(parity.summary.preview_contract_failures, 0);
  assert.equal(parity.sitemap_inventory.missing_from_artifact.length, 0);
  assert.ok(parity.legacy_inventory.total_urls > 0);
  assert.equal(parity.legacy_inventory.missing_from_artifact.length, 0, 'Cached-client compatibility incomplete');
  assert.equal(parity.artifact.identity.site_commit, expected);
  assert.equal(parity.production_unchanged, true);
  assert.deepEqual(parity.production_before, baseline.rollback_identity);
  assert.deepEqual(parity.production_after, baseline.rollback_identity);
  assert.equal(parity.migration_review?.sha256, sha256(baselineText), 'Wrong reviewed migration baseline');
  assert.deepEqual(parity.migration_review.rollback_identity, baseline.rollback_identity);
  const age = Date.now() - Date.parse(parity.generated_at);
  assert.ok(age >= 0 && age < 3_600_000, 'Parity evidence must be less than one hour old');
  const workerOrigin = `https://1200km-site.${subdomain.subdomain}.workers.dev`;
  assert.equal(parity.preview_origin, workerOrigin);
  const [worker, production] = await Promise.all([identity(workerOrigin), identity('https://1200km.com')]);
  assert.equal(worker.identity.site_commit, expected);
  assert.deepEqual(worker.identity, parity.artifact.identity, 'Worker differs from the validated release');
  assert.deepEqual(production.identity, baseline.rollback_identity, 'Frozen GitHub rollback changed before cutover');
  assert.equal(production.cloudflare, false, 'Production unexpectedly already traverses Cloudflare');
  snapshot.build = worker.identity;
  snapshot.rollback_build = production.identity;
  snapshot.review_sha256 = sha256(baselineText);
  // Snapshot is persisted BEFORE the only traffic-changing mutation.
  await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
  try {
    await api(`/zones/${ZONE}/dns_records/${RECORD}`, 'PATCH', { proxied: true });
    snapshot.changed_at = new Date().toISOString();
    await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
    let observed = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      const current = await identity('https://1200km.com');
      if (current.cloudflare && current.server === 'cloudflare') {
        assert.deepEqual(current.identity, worker.identity, 'Cloudflare serves an unexpected release');
        observed = true; break;
      }
      // Cached DNS can still reach the healthy old origin during propagation.
      assert.deepEqual(current.identity, baseline.rollback_identity, 'Rollback origin changed during propagation');
      await new Promise((done) => setTimeout(done, 5000));
    }
    assert.ok(observed, 'Cloudflare production response not observed within propagation window');
    snapshot.result = 'Cloudflare Worker production origin verified';
  } catch (error) {
    await api(`/zones/${ZONE}/dns_records/${RECORD}`, 'PATCH', { proxied: false });
    snapshot.result = 'Automatic rollback to GitHub Pages';
    snapshot.failure = error.message;
    await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
    throw error;
  }
  await writeFile(evidence, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(snapshot.result);
}
