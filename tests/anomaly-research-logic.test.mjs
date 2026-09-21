import test from 'node:test';
import assert from 'node:assert/strict';
// Synthetic mathematical counterexamples, not KQL/SPL execution or incident replay.
test('time proximity alone can attach an unrelated successful identity', () => {
  const attempts = [{tenant:'A', user:'victim', time:100}];
  const success = {tenant:'A', user:'bystander', time:110};
  assert.equal(attempts.some(a=>success.time>=a.time && success.time<=a.time+60), true);
  assert.equal(attempts.some(a=>a.tenant===success.tenant && a.user===success.user && success.time>=a.time && success.time<=a.time+60), false);
});
test('same time bin does not prove failure preceded success', () => {
  const failure = 100, success = 90, window = 300;
  assert.equal(Math.floor(failure/window), Math.floor(success/window));
  assert.equal(success>=failure, false);
});
test('positive-standard-deviation gate drops a deviation from a stable baseline', () => {
  const baseline = [10,10,10,10], today = 1000;
  const mean = baseline.reduce((a,b)=>a+b,0)/baseline.length;
  const variance = baseline.reduce((a,b)=>a+(b-mean)**2,0)/baseline.length;
  assert.ok(today>mean*10);
  assert.equal(variance>0, false);
});
test('inner join drops a previously unseen user rather than evaluating cold start', () => {
  const historic = new Map([['existing',10]]);
  const current = [{user:'new',count:10000}];
  assert.equal(current.filter(row=>historic.has(row.user)).length, 0);
});
test('additional analytic gating can reduce recall', () => {
  const truth = new Set(['a','b']);
  const original = new Set(['a','b','benign']);
  const gate = new Set(['a']);
  const gated = new Set([...original].filter(id=>gate.has(id)));
  const recall = set=>[...truth].filter(id=>set.has(id)).length/truth.size;
  assert.equal(recall(original),1);
  assert.equal(recall(gated),0.5);
});
test('short-label character entropy cannot establish the stated generic DNS threshold', () => {
  const entropy = value=>{
    const counts = new Map(); for(const ch of value) counts.set(ch,(counts.get(ch)||0)+1);
    return [...counts.values()].reduce((sum,n)=>sum-(n/value.length)*Math.log2(n/value.length),0);
  };
  assert.ok(entropy('mail')<=Math.log2(4));
  assert.ok(entropy('login')<=Math.log2(5));
  // This alphabetically ordered string is maximally entropic by histogram,
  // even though it is predictable: histogram entropy is not proof of randomness.
  assert.equal(entropy('abcdefghijklmnop'),4);
});
