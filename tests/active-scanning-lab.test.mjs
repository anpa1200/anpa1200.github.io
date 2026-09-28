import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {scanFeatures,fanoutAnomaly,normalizeAcceptRecords} from '../ttp-simulation/labs/active-scanning/analyze.mjs';
const event=(port,ts=1800000001)=>({ts,'id.orig_h':'192.0.2.10','id.resp_h':'198.51.100.20','id.resp_p':port,conn_state:'REJ'});
test('scan threshold separates positive fixture, normal traffic and approved scanner',()=>{
  const scan=Array.from({length:32},(_,i)=>event(18080+i));
  assert.equal(scanFeatures(scan).windows[0].threshold_match,true);
  assert.equal(scanFeatures([event(443),event(443)]).windows[0].threshold_match,false);
  assert.equal(scanFeatures(scan,{approvedSources:['192.0.2.10']}).windows[0].threshold_match,false);
  assert.equal(scanFeatures([]).status,'no_telemetry');
  assert.equal(scanFeatures([{ts:1800000000}]).status,'invalid_telemetry');
  const slow=Array.from({length:32},(_,i)=>event(18080+i,1800000001+i*61));
  assert.equal(scanFeatures(slow).windows.some(r=>r.threshold_match),false,'Known low-and-slow blind spot must stay explicit');
});
test('robust fan-out example uses separate training and handles zero dispersion',()=>{
  const baseline=Array.from({length:30},(_,i)=>1+i%3);
  assert.equal(fanoutAnomaly(32,baseline).anomalous,true);
  assert.equal(fanoutAnomaly(3,baseline).anomalous,false);
  assert.equal(fanoutAnomaly(32,[1,2,3]).status,'insufficient_baseline');
  assert.equal(fanoutAnomaly(32,Array(30).fill(1)).status,'zero_dispersion');
});

test('published bounded-lab result is reproducible from unchanged native accept records',()=>{
  const folder=new URL('../ttp-simulation/labs/active-scanning/evidence/',import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL('capture-manifest.json',folder),'utf8'));
  for(const [name,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(new URL(name,folder))).digest('hex'),hash,name);
  const native=readFileSync(new URL('accept.jsonl',folder),'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.equal(native.length,32);assert.equal(new Set(native.map(r=>r.destination_port)).size,32);
  assert.ok(native.every(r=>r.synthetic===false&&r.source_ip==='127.0.0.1'&&r.destination_ip==='127.0.0.1'&&r.destination_port>=18080&&r.destination_port<=18111));
  const expected=JSON.parse(readFileSync(new URL('detection-result.json',folder),'utf8'));
  assert.deepEqual(scanFeatures(normalizeAcceptRecords(native)),expected.detector);
  assert.equal(expected.matched_windows,1);
  assert.match(expected.baseline,/synthetic/);
});
