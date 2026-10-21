import test from 'node:test';
import assert from 'node:assert/strict';
import { collectClones } from '../scripts/validation-clones.mjs';
const now=new Date('2026-10-21T06:00:00Z');
const names=['anpa1200/AIDebug','anpa1200/removed-later'];
const stats={clone_traffic:{status:'historical-not-refreshed',last_14_days:{since:'2026-09-19',through:'2026-10-03',clones:50},cumulative:{since:'2026-06-13',through:'2026-10-03',clones:150}},aidebug_distribution:{},verification:{}};
const history={tracking_started:'2026-06-13',baseline:{through:'2026-10-02',clones:100,uniques:30},days:{'2026-10-03':{clones:50,uniques:20}}};
const api=endpoint=>endpoint.includes('AIDebug')?{count:17,uniques:8,clones:[{timestamp:'2026-10-06T00:00:00Z',count:7,uniques:3},{timestamp:'2026-10-07T00:00:00Z',count:4,uniques:2},{timestamp:'2026-10-20T00:00:00Z',count:5,uniques:2},{timestamp:'2026-10-21T00:00:00Z',count:1,uniques:1}]}:{count:6,uniques:2,clones:[{timestamp:'2026-10-20T00:00:00Z',count:6,uniques:2}]};
test('aligned UTC window excludes old boundary and current partial day; gaps stay unknown',()=>{
 const r=collectClones(stats,history,names,api,now);
 assert.equal(r.stats.clone_traffic.current_window.clones,15);
 assert.equal(r.stats.aidebug_distribution.current_clone_count,9);
 assert.equal(r.stats.clone_traffic.current_window.since,'2026-10-07');assert.equal(r.stats.clone_traffic.current_window.through,'2026-10-20');
 assert.equal(r.stats.clone_traffic.cumulative.clones,165);assert.equal(r.stats.clone_traffic.cumulative.uniques,null);
 assert.deepEqual(r.stats.clone_traffic.cumulative.missing_dates,['2026-10-04','2026-10-05','2026-10-06']);
 assert.ok(!Object.hasOwn(r.history.days,'2026-10-06'));assert.deepEqual(r.history.days['2026-10-08'],{clones:0,uniques:0});
 assert.deepEqual(r.history.baseline,history.baseline);assert.deepEqual(r.history.days['2026-10-03'],history.days['2026-10-03']);assert.ok(!history.daily_by_repository);
});
test('overlapping snapshots replace matching repository-days rather than double counting',()=>{
 const first=collectClones(stats,history,names,api,now),second=collectClones(first.stats,first.history,names,api,now);
 assert.deepEqual(second.history.days,first.history.days);assert.equal(second.stats.clone_traffic.cumulative.clones,165);
});
test('removed repositories remain in historical daily observations',()=>{
 const first=collectClones(stats,history,names,api,now),second=collectClones(first.stats,first.history,[names[0]],api,now);
 assert.equal(second.stats.clone_traffic.current_window.clones,9);assert.equal(second.stats.clone_traffic.cumulative.clones,165);
 assert.equal(second.history.daily_by_repository['2026-10-20'][names[1]].clones,6);
});
test('failed or inconsistent traffic never becomes public zero or modifies inputs',()=>{
 const original=structuredClone(history);
 assert.throws(()=>collectClones(stats,history,names,()=>{throw Error('HTTP 403');},now),/HTTP 403/);
 assert.throws(()=>collectClones(stats,history,names,()=>({count:3,uniques:1,clones:[]}),now),/Inconsistent/);
 assert.deepEqual(history,original);assert.equal(stats.clone_traffic.cumulative.clones,150);
});
