import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { rerankSearchResults } from '../scripts/search-governance-lib.mjs';

const source = readFileSync(new URL('../assets/site-search.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('  function shouldGovernDiscovery'), source.indexOf('  async function installDiscoveryGovernance'));
const runtime = vm.runInNewContext(`(() => { ${functions}; return {rerankDiscoveryResults, plausibleSearchWord, installQueryValidation}; })()`);

test('runtime and build ranking prioritize matching titles over directory boosts', () => {
  const results = [{id:'directory',score:40}, {id:'article',score:15}, {id:'reference',score:20}];
  const records = { directory:{title:'Research library',boost:12}, article:{title:'Cyberattacks on Big Pharma and Its Ecosystem',boost:.2}, reference:{title:'Pharma reference',boost:1} };
  for (const query of ['Big Pharma','big pharma','"Big Pharma"']) {
    assert.equal(runtime.rerankDiscoveryResults(results,query,records)[0].id,'article');
    assert.deepEqual(Array.from(runtime.rerankDiscoveryResults(results,query,records),r=>r.id),rerankSearchResults(results,query,records).map(r=>r.id));
  }
  assert.equal(runtime.rerankDiscoveryResults(results,'T1059.003',records),results);
});

test('query validation preserves completion and bounded typo matching', () => {
  for (const [q,w] of [['kerberosting','kerberoasting'],['t1059.00','t1059.003'],['detect','detection'],['ransomwares','ransomware']]) assert.ok(runtime.plausibleSearchWord(q,w),q);
  for (const [q,w] of [['nonexistentsearchtermxyz','nonexistent'],['asdfghjkl','asd'],['zzzxqvnonexistent12345','12345']]) assert.equal(runtime.plausibleSearchWord(q,w),false,q);
});

test('invalid long tokens return consistent zero counts and do not lose filters on valid searches', async () => {
  const calls=[];
  const engine={search:async (term,options)=>{calls.push([term,options]); return {results:term.startsWith('"')?[]:[{data:async()=>({content:'kerberoasting detection',meta:{}})}], filters:{topic:{security:1}}};}};
  runtime.installQueryValidation(engine);
  const none=await engine.search('nonexistentsearchtermxyz');
  assert.equal(none.results.length,0); assert.equal(none.unfilteredResultCount,0); assert.equal(Object.keys(none.filters).length,0);
  const options={filters:{topic:'security'}};
  assert.equal((await engine.search('kerberosting',options)).results.length,1);
  assert.equal(calls.at(-1)[1],options);
  const before=calls.length;
  await engine.search('kerberosting',options);
  assert.equal(calls.length,before+1,'validation is cached across edits and filters');
});

const bundle = process.env.SEARCH_TEST_BUNDLE;
test('real Pagefind negative controls, title ranking, identifiers, and typo recovery', {skip:!bundle}, async t => {
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>{try{return new Response(readFileSync(`${bundle}/${new URL(url).pathname.replace(/^\//,'')}`));}catch{return new Response('',{status:404});}};
  try {
    const module=await import(pathToFileURL(`${bundle}/pagefind.js`).href);
    const engine=module.createInstance({basePath:'http://search.test/',baseUrl:'/',language:'en',noWorker:true,ranking:{pageLength:.5,termFrequency:.8,termSimilarity:1,metaWeights:{title:10,identifier:20,aliases:12,description:3,collection:2}}});
    await engine.init();
    runtime.installQueryValidation(engine);
    for(const query of ['zzzxqvnonexistent12345','qzxwvu nonsense','nonexistentsearchtermxyz','asdfghjkl']) assert.equal((await engine.search(query)).results.length,0,query);
    const records=JSON.parse(readFileSync(`${bundle}/search-governance.json`)).records;
    const pharma=runtime.rerankDiscoveryResults((await engine.search('Big Pharma')).results,'Big Pharma',records);
    await t.test('Big Pharma archive title is ranked first', {skip:!Object.values(records).some(r=>/Cyberattacks on Big Pharma/i.test(r.title))}, async()=> {
      assert.match((await pharma[0].data()).meta.title,/Cyberattacks on Big Pharma/i);
    });
    assert.match((await (await engine.search('T1059.003')).results[0].data()).url,/\/threat-matrix\/techniques\/T1059.003\//);
    assert.ok((await engine.search('T1059.00')).results.length);
    assert.ok((await engine.search('Kerberosting')).results.length);
    console.log('Verified real index: four nonsense queries → zero; identifier, prefix and typo recovery preserved');
  } finally { globalThis.fetch=originalFetch; }
});
