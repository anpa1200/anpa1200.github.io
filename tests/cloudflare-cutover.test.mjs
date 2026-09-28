import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { sha256 } from '../scripts/hosting-parity-lib.mjs';
const commit = 'a'.repeat(40), digest = `sha256:${'b'.repeat(64)}`;
const rollback = {site_commit:'d'.repeat(40),artifact_digest:`sha256:${'e'.repeat(64)}`};

function scenario(mode, { ready = true, failAfterSwitch = false, wrongRecord = false, wrongRollback = false, staleDns = false, certificateHosts = ['1200km.com','*.1200km.com'] } = {}) {
  const temp = mkdtempSync(join(tmpdir(), '1200km-cutover-test-'));
  try {
    const parity = join(temp, 'parity.json'), evidence = join(temp, 'evidence.json'), mutations = join(temp, 'mutations.json');
    const baseline = join(temp, 'baseline.json');
    const baselineText = JSON.stringify({schema_version:1, rollback_identity:rollback, approved_changes:[]});
    writeFileSync(baseline, baselineText);
    writeFileSync(parity, JSON.stringify({ generated_at: new Date().toISOString(), preview_origin: 'https://1200km-site.1200km.workers.dev',
      production_before:rollback,production_after:rollback,production_unchanged:true,migration_review:{sha256:sha256(baselineText),rollback_identity:rollback},
      summary: { ready_for_cutover: ready, cutover_blockers: ready ? 0 : 1, preview_contract_failures: 0 },
      sitemap_inventory: { missing_from_artifact: [] }, artifact: { identity: { site_commit: commit, artifact_digest: digest } } }));
    const preload = join(temp, 'mock.mjs');
    writeFileSync(preload, `
      import {writeFileSync} from 'node:fs';
      let proxied = false, productionReads = 0; const mutations = [];
      const timer = globalThis.setTimeout; globalThis.setTimeout = (fn, ms, ...args) => timer(fn, ms === 5000 ? 0 : ms, ...args);
      globalThis.fetch = async (input, options = {}) => {
        const url = new URL(input), path = url.pathname, method = options.method || 'GET';
        if (method !== 'GET') { mutations.push({path, method, body: JSON.parse(options.body)}); proxied = JSON.parse(options.body).proxied; writeFileSync(${JSON.stringify(mutations)}, JSON.stringify(mutations)); }
        if (path === '/build.json') {
          const worker = url.hostname !== '1200km.com';
          const isNew = worker || (proxied && !(++productionReads === 1 && ${JSON.stringify(staleDns)}));
          let build = isNew ? {site_commit:'${commit}',artifact_digest:'${digest}'} : ${JSON.stringify(rollback)};
          if ((${JSON.stringify(failAfterSwitch)} && proxied && !worker) || (${JSON.stringify(wrongRollback)} && !proxied && !worker)) build.site_commit = 'c'.repeat(40);
          return new Response(JSON.stringify(build), {headers:isNew ? {'cf-ray':'test',server:'cloudflare'} : {server:'GitHub.com'}});
        }
        let result;
        if (path.endsWith('/dns_records')) result = [{id:'9409b2009ec9d703a294ec93c5461d3d',type:'CNAME',name:'1200km.com',content:${JSON.stringify(wrongRecord ? 'unexpected.example' : 'anpa1200.github.io')},ttl:1,proxied}];
        else if (path.endsWith('/workers/routes')) result = [{id:'route-id',pattern:'1200km.com/*',script:'1200km-site'}];
        else if (path.endsWith('/ssl/certificate_packs')) result = [{id:'cert-id',status:'active',hosts:${JSON.stringify(certificateHosts)}}];
        else if (path.endsWith('/settings/ssl')) result = {value:'full'};
        else if (path.endsWith('/workers/subdomain')) result = {subdomain:'1200km'};
        else result = {id:'3b7d60bc8ed435424d085603a583bd2f',name:'1200km.com',status:'active',account:{id:'7a79808a203a002faa892a5363c9fa2c'}};
        return Response.json({success:true,result});
      };
    `);
    const result = spawnSync(process.execPath, ['--import', preload, new URL('../scripts/cloudflare-site-cutover.mjs', import.meta.url).pathname,
      '--mode', mode, '--site-commit', commit, '--parity', parity, '--baseline', baseline, '--evidence', evidence], {
      encoding: 'utf8', timeout: 10_000, env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: '7a79808a203a002faa892a5363c9fa2c', CLOUDFLARE_API_TOKEN: 'unit-test-only' },
    });
    let changes = []; try { changes = JSON.parse(readFileSync(mutations, 'utf8')); } catch {}
    return { ...result, changes };
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

test('status never changes routing or DNS', () => {
  const result = scenario('status'); assert.equal(result.status, 0, result.stderr); assert.deepEqual(result.changes, []);
});
test('cutover changes only the exact existing apex CNAME proxy flag', () => {
  const result = scenario('cutover'); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.changes, [{path:'/client/v4/zones/3b7d60bc8ed435424d085603a583bd2f/dns_records/9409b2009ec9d703a294ec93c5461d3d',method:'PATCH',body:{proxied:true}}]);
});
test('failed parity or unexpected DNS prevents all mutations', () => {
  for (const options of [{ ready: false }, { wrongRecord: true }, { wrongRollback:true },
    {certificateHosts:'1200km.com'}, {certificateHosts:['1200km.com.example.org']}, {certificateHosts:['prefix1200km.com']}]) {
    const result = scenario('cutover', options); assert.notEqual(result.status, 0); assert.deepEqual(result.changes, []);
  }
});
test('healthy frozen Pages responses remain acceptable during DNS propagation', () => {
  const result = scenario('cutover', { staleDns:true }); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.changes.map((change)=>change.body), [{proxied:true}]);
});
test('failed live identity triggers automatic rollback', () => {
  const result = scenario('cutover', { failAfterSwitch: true }); assert.notEqual(result.status, 0);
  assert.deepEqual(result.changes.map((change) => change.body), [{proxied:true}, {proxied:false}]);
});
test('explicit rollback leaves the CNAME target and Pages deployment unchanged', () => {
  const result = scenario('rollback'); assert.equal(result.status, 0, result.stderr);
  assert.equal(result.changes.length, 1); assert.deepEqual(result.changes[0].body, {proxied:false});
});
