import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { classifyReference, enrichReference, weakReferenceTitle } from '../scripts/reference-metadata-lib.mjs';
import { hardenStandaloneHead } from '../scripts/release-html-lib.mjs';
import { prepareHtmlForSearch } from '../scripts/search-index-lib.mjs';
const json = p => JSON.parse(readFileSync(p, 'utf8'));

test('reference roles preserve bibliographic citations and conservatively classify address evidence', () => {
  assert.equal(classifyReference('https://www.cisa.gov/advisory', '[1]'), 'bibliographic');
  assert.equal(classifyReference('https://github.com/owner/tool', 'Tool repository'), 'tool');
  assert.equal(classifyReference('https://github.com/owner/paper', 'Published research'), 'bibliographic');
  assert.equal(classifyReference('https://data.example.edu/release', 'Dataset'), 'dataset');
  assert.equal(classifyReference('https://example.invalid/test', 'Fixture'), 'example');
  assert.equal(classifyReference('https://203.0.113.87/update'), 'example');
  assert.equal(classifyReference('https://91.211.251.245/ga.js', 'reported C2 indicator'), 'indicator');
  assert.equal(classifyReference('https://192.168.0.1/docs', 'Network appliance manual'), 'address-review');
  assert.equal(classifyReference('https://vendor.example.edu/login', 'Sign in'), 'navigation');
  assert.equal(weakReferenceTitle('A legitimate numbered citation [1] in prose'), false);
  assert.equal(weakReferenceTitle('[19]'), true);
  assert.equal(weakReferenceTitle('(Link to this tool here)'), true);
});
test('metadata recovery keeps IDs, query identity, anchor provenance, and honest unresolved labels', () => {
  const config = {publishers: {'adsecurity.org': {name: 'ADSecurity'}}, records: {'https://adsecurity.org/?p=3458': {title:'Kerberoasting review', evidence_url:'https://adsecurity.org/?p=3458'}}};
  const raw = {id:'stable', url:'https://adsecurity.org/?p=3458', title:'[1]', publisher:'Adsecurity',tags:[]};
  const context = {anchors:['[1]'],sources:[{title:'Worked investigation',url:'https://1200km.com/example'}]};
  const fixed = enrichReference(raw, context, config);
  assert.equal(fixed.id, raw.id); assert.equal(fixed.url, raw.url);
  assert.equal(fixed.publisher,'ADSecurity'); assert.equal(fixed.provenance.original_title,'[1]');
  assert.equal(fixed.metadata_status,'metadata-recovered');
  const unresolved=enrichReference({...raw,url:'https://other.example.edu/?p=3458'}, context, config);
  assert.match(unresolved.title,/Worked investigation.*needs review/); assert.equal(unresolved.metadata_status,'review-needed');
  // Similar-looking documents and organizations retain separate identities.
  const other=enrichReference({...raw,id:'other',url:'https://adsecurity.org/?p=3459'},context,config);
  assert.notEqual(other.id,fixed.id); assert.notEqual(other.url,fixed.url); assert.equal(other.metadata_status,'review-needed');
  const ip=enrichReference({...raw,url:'https://203.0.113.87/update',tags:[{facet:'Publisher domain',type:'publisher_domain',value:'203.0.113.87'}]},context,config);
  assert.equal(ip.publisher,'Not a publisher'); assert.deepEqual(ip.tags,[]);
});
test('search preparation separates structural text without damaging inline query tokens', () => {
  const html='<html><head><title>Fixture</title></head><body><main><table><tr><td>Windows Command Shell</td><td>T1059.003</td></tr></table><p>Power<em>Shell</em></p></main></body></html>';
  const prepared=prepareHtmlForSearch('https://1200km.com/fixture.html',html);
  assert.match(prepared, /Shell<\/td> <td>T1059/);
  assert.match(prepared, /Power<em>Shell<\/em>/);
});
test('defensive summaries distinguish published absence, missing import, and another framework', () => {
  const source=readFileSync('threat-matrix/assets/adversarygraph-light.js','utf8');
  const fn=source.slice(source.indexOf('function defensiveSummary('),source.indexOf('async function init('));
  const context=vm.createContext({});vm.runInContext(fn,context);
  assert.match(context.defensiveSummary({defense_summary:{strategies:1,analytics:2}},'mitre-data.json'),/1 detection strategy · 2 analytics/);
  assert.match(context.defensiveSummary({defense_summary:{strategies:0,analytics:0}},'mitre-data.json'),/No published/);
  assert.equal(context.defensiveSummary({},'mitre-data-ics.json'),'Defensive relationships not imported');
  assert.match(context.defensiveSummary({},'mitre-data-atlas.json'),/not applicable/);
});
test('all three benign exercises execute and their deliberate negative controls fail', () => {
  const run=(...args)=>JSON.parse(execFileSync('python3',args,{encoding:'utf8'}));
  assert.deepEqual(run('learning-paths/command-shell-validation/validate.py','learning-paths/command-shell-validation/events.json'),{candidate_ids:['word-shell'],events_read:6});
  assert.deepEqual(run('learning-paths/agent-permission-validation/validate.py','learning-paths/agent-permission-validation/requests.json'),{allowed_ids:['read-report'],denied:5,events_observed:6,negative_controls_rejected:2});
  assert.deepEqual(run('learning-paths/safe-artifact-triage/triage.py','learning-paths/safe-artifact-triage/fixture.zip'),json('learning-paths/safe-artifact-triage/expected.json'));
  assert.deepEqual(run('learning-paths/safe-artifact-triage/triage.py','--self-test'),{negative_controls_rejected:3,positive_fixture_passed:true});
});

test('search navigation does not disclose query URLs through document referrers', () => {
  const source=readFileSync('search.html','utf8');
  assert.match(source, /<meta name="referrer" content="no-referrer"/);
  assert.match(hardenStandaloneHead(source), /<meta name="referrer" content="no-referrer"/);
});
