#!/usr/bin/env node
// Candidate discovery only. Nothing in this script assigns a public tag.
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const report = join(root, 'reports/anomaly-review-20260921');
const inventory = JSON.parse(await readFile(join(report, 'corpus-inventory.json')));
const rules = [
  ['volumetric', /volumetric|volume anomal|bulk download|mass download|volume spike|unusual.{0,40}(volume|bytes)|baseline.{0,40}(bytes|volume)/i],
  ['frequency-rate', /rate anomal|frequency anomal|failed.{0,35}(threshold|burst)|password spray.{0,60}(detect|threshold)|rate.{0,20}(baseline|threshold)|burst.{0,40}(auth|login|fail)/i],
  ['temporal', /temporal anomal|off.hours|outside.{0,25}(business|working|normal).{0,10}hours|beacon.{0,55}(interval|periodic|detect)|periodic.{0,55}(beacon|callback|anomal)/i],
  ['peer-group', /peer.group|peer baseline|cohort.{0,40}(baseline|compar|anomal)|role.based baseline|role.{0,25}behavioral baseline/i],
  ['sequence', /sequence.based detect|sequence anomal|ordered.{0,35}(event|sequence)|correlat.{0,70}(chain|sequence)|(?:attack|behavioral|behavioural|process).{0,12}chain.{0,60}(detect|alert|correlat)/i],
  ['graph-relationship', /graph anomal|relationship anomal|new.{0,35}host.to.host|unusual.{0,40}(relationship|communication edge)|new.{0,20}edge.{0,50}(anomal|detect|suspicious)|communication graph/i],
  ['geographic-asn', /impossible travel|atypical travel|geographic.{0,15}anomal|unfamiliar.{0,40}(asn|country|location)|new country|ASN.{0,25}anomal/i],
  ['identity-access', /(?:unusual|unexpected|suspicious|anomalous).{0,35}(?:sign.in|logon|login|token|privilege|identity)|(?:identity|access).{0,15}anomal|MFA.{0,35}(?:reset|change).{0,60}(?:detect|suspicious|alert)/i],
  ['rare-process-service', /rare.process|rare.service|(?:uncommon|first.seen|rare).{0,30}(?:process|binary|service|executable)|(?:process|service).{0,25}rarity/i],
  ['parent-child', /parent.child|process.lineage|process.ancestry|w3wp.{0,60}(?:cmd|powershell)|office.{0,45}spawn.{0,30}(?:shell|script)/i, /detect|anomal|suspicious|hunt|investigat|malicious/i],
  ['data-movement', /data.movement anomal|unexpected.{0,35}(?:transfer|export|download|destination)|(?:exfiltration|bulk download).{0,60}(?:baseline|detect|anomal)|(?:detect|anomal).{0,60}(?:exfiltration|bulk download)/i],
  ['protocol-application', /protocol anomal|protocol misuse|dns tunnel|DNS.{0,40}(?:entropy|encoded label)|unexpected.{0,25}protocol/i],
  ['negative-absence', /negative anomal|(?:missing|absent|lost|loss of).{0,30}(?:heartbeat|expected telemetry|expected logs)|(?:heartbeat|telemetry).{0,20}(?:loss|disappear|silence)|absence.{0,35}(?:expected|event stream)/i],
  ['state-change', /state.change.{0,40}(?:anomal|detect|alert)|(?:unauthorized|unexpected|suspicious).{0,45}(?:account creation|role assignment|permission change|service creation|configuration change)|(?:alert|detect).{0,45}(?:new service|new scheduled task|permission change|new account)/i],
];
const candidates = [];
for (const row of inventory.records) {
  if (row.status !== 'read') continue;
  const text = await readFile(join(inventory.cache_root, row.cache_file), 'utf8');
  const paragraphs = text.split(/\n\s*\n/).filter(part => !/^(?:##? (?:Ecosystem Fit|Follow|References)|\*\*Crosslinks:|\*\*Evidence tags:|<a href)/i.test(part.trim()));
  const matches = [];
  for (const [id, pattern, context] of rules) {
    const evidence = [];
    for (const paragraph of paragraphs) {
      const index = paragraph.search(pattern);
      if (index < 0) continue;
      const window = paragraph.slice(Math.max(0,index-250), index+500).replace(/\s+/g, ' ').trim();
      if (context && !context.test(window)) continue;
      if (!evidence.includes(window)) evidence.push(window);
      if (evidence.length === 2) break;
    }
    if (evidence.length) matches.push({tag: `anomaly-${id}`, evidence});
  }
  if (matches.length) candidates.push({url: row.url, title: row.title, kind: row.kind, archive_id: row.archive_id || null, source_sha256: row.sha256, matches});
}
await writeFile(join(report, 'tag-candidates.json'), JSON.stringify({policy: 'Unreviewed candidates only; regex discovery never constitutes a public tag assignment.', candidates}, null, 2)+'\n');
const lines = candidates.map((row, index) => `${index}\t${row.url}\t${row.title}\t${row.matches.map(match=>match.tag.replace('anomaly-','')).join(', ')}`);
await writeFile(join(report, 'tag-candidates.tsv'), 'candidate\turl\ttitle\tcandidate_tags\n'+lines.join('\n')+'\n');
console.log(JSON.stringify({scanned: inventory.read, candidate_pages: candidates.length, candidate_mappings: candidates.reduce((sum,row)=>sum+row.matches.length,0)}));
