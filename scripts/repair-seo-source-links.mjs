#!/usr/bin/env node
// Bounded link-only migration. No prose, headings, examples or file names change.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2);
if (args.length !== 3) throw Error('Pass CTI_as_a_Code docs root, field-manual docs root, archive docs root');
const exact = new Map([
  ['/docs/lifetech-pharma-case-study', '/lifetech-pharma-case-study/'],
  ['/docs/celltronx-proactive-case-study', '/celltronx-proactive-case-study/'],
  ['/docs/reactive-walkthrough', '/reactive-walkthrough/'],
  ['/docs/proactive-walkthrough', '/proactive-walkthrough/'],
  ['/docs/training/01-reactive-lifetech', '/training/reactive-lifetech/'],
  ['/docs/training/02-proactive-celltronx', '/training/proactive-celltronx/'],
  ['/docs/training', '/training/'],
  ['/investigations/lifetech-2024-11/03-analysis/attck-mapping/attck-navigator-layer.json', 'https://github.com/anpa1200/CTI_as_a_Code/blob/main/investigations/lifetech-2024-11/03-analysis/attck-mapping/attck-navigator-layer.json'],
  ['https://1200km.com/cti-analyst-field-manual/docs/actor-research/', 'https://1200km.com/cti-analyst-field-manual/docs/actor-research/actor-profile-template/'],
  ['https://1200km.com/customer-driven-ai-cti-project/docs/practitioner-package/package-index/', 'https://1200km.com/customer-driven-ai-cti-project/docs/practitioner-package/'],
  ['https://1200km.com/israel-government-threat-actors-cti/detection-status-dashboard/', 'https://1200km.com/israel-government-threat-actors-cti/detection-engineering/detection-status-dashboard/'],
  ['https://1200km.com/adversarygraph-docs/get-started.html', 'https://1200km.com/adversarygraph-docs/getting-started/'],
  ['https://1200km.com/adversarygraph-docs/capabilities.html', 'https://1200km.com/adversarygraph-docs/capabilities/'],
]);
function replacement(url) {
  let result = exact.get(url) || url;
  result = result.replace('https://1200km.com/cti-analyst-field-manual/CTI_as_a_Code/', 'https://1200km.com/cti-analyst-field-manual/docs/');
  if (result === 'https://1200km.com/cti-analyst-field-manual/docs/intelligence-production/') result = 'https://1200km.com/cti-analyst-field-manual/docs/cti-foundations/finished-intelligence-vs-research-notes/';
  return result;
}
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [join(dir, e.name)] : []); }
const changes = [];
for (const dir of args.map(p => resolve(p))) for (const file of walk(dir)) {
  const before = readFileSync(file, 'utf8');
  let fence = '';
  const after = before.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = ''; return line; }
    if (fence) return line;
    return line.replace(/(\]\()([^\s)]+)(\))/g, (full, a, url, b) => a + replacement(url) + b)
      .replace(/(\bhref=["'])([^"']+)(["'])/g, (full, a, url, b) => a + replacement(url) + b);
  }).join('\n');
  if (before !== after) { writeFileSync(file, after); changes.push(file); }
}
console.log(JSON.stringify({ changed_files: changes.length, files: changes }, null, 2));
