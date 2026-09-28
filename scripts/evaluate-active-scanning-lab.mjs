import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {scanFeatures,fanoutAnomaly,normalizeAcceptRecords} from '../ttp-simulation/labs/active-scanning/analyze.mjs';
const folder=resolve(process.argv[2]),manifest=JSON.parse(readFileSync(join(folder,'capture-manifest.json'),'utf8'));
const native=readFileSync(join(folder,'accept.jsonl'),'utf8').trim().split('\n').map(s=>JSON.parse(s));
const events=normalizeAcceptRecords(native),result=scanFeatures(events);
assert.equal(manifest.target,'127.0.0.1');assert.equal(manifest.observed_ports,32);
assert.equal(result.status,'observed');
// A fixed one-minute boundary can split this short capture. Report that limitation,
// never shift timestamps just to force an expected result.
const observed=result.windows.filter(r=>r.threshold_match);
const syntheticBaseline=Array.from({length:30},(_,i)=>1+i%3);
const anomaly=result.windows.map(w=>({...w,score:fanoutAnomaly(w.distinct_ports,syntheticBaseline)}));
const report={native_capture:manifest,detector:result,matched_windows:observed.length,anomaly,baseline:'Explicitly synthetic 30-window toy baseline, NOT a captured or production-trained baseline.',boundary:'Observed loopback open-port fan-out only; thresholds and anomaly calibration are educational, not production validation.'};
writeFileSync(join(folder,'detection-result.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({records:native.length,windows:result.windows.length,matched_windows:observed.length,synthetic_baseline:true}));
