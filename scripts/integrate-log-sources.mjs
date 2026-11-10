#!/usr/bin/env node
// Curated navigation associations only; never infer telemetry coverage from text matches.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
const args=process.argv.slice(2),root=process.cwd(),site=resolve(args.includes('--site')?args[args.indexOf('--site')+1]:root);
const mappings=[
 ["articles/read/2025/2025-02-24-soc-tier-1-the-complete-onboarding-guide-to-security-monitoring-and-incident-response-824a1dfe4476/index.html", ["windows-security-4624", "linux-sshd", "cisco-asa-connections"]],
 ["articles/read/2025/2025-07-09-threat-hunting-with-the-pyramid-of-pain-8add3cedb380/index.html", ["sysmon-1", "zeek-dns"]],
 ["articles/read/2025/2025-12-12-protocol-level-network-threat-hunting-a-wireshark-centric-guide-a6770ffc96c6/index.html", ["zeek-connection", "zeek-dns", "suricata-alert"]],
 ["articles/read/2025/2025-12-14-endpoint-threat-hunting-proactive-detection-on-windows-linux-and-macos-f892d9b8a113/index.html", ["sysmon-1", "linux-audit-execve", "macos-unified"]],
 ["articles/read/2026/2026-04-22-detecting-malicious-insider-activity-a-technical-detection-engineering-guide-3c3b41e95e82/index.html", ["windows-security-4663", "m365-sharepoint", "postgres-log"]],
 ["articles/read/2026/2026-07-11-newest-detection-engineering-techniques-from-rules-to-validated-security-telemetry-a5ccb46d5556/index.html", ["sysmon-1", "kubernetes-audit", "aws-cloudtrail"]],
 ["articles/read/2026/incident-response-lifecycle/index.html", ["windows-security-4688", "linux-audit-syscall", "entra-audit"]],

 ['guides.html',['windows-security-4624','linux-sshd','zeek-connection']],
 ['labs.html',['sysmon-1','linux-audit-syscall','suricata-alert']],
 ['cyber-knowledge/blue-team.html',['windows-security-4624','sysmon-1','zeek-dns','aws-cloudtrail']],
 ['cyber-knowledge/dfir.html',['windows-security-4688','linux-audit-execve','powershell-4104']],
 ['articles/read/2026/threat-hunting-from-intelligence-to-validated-defense/index.html',['sysmon-1','windows-security-4769','linux-audit-syscall','aws-cloudtrail','okta-system-log']],
 ['adversarygraph/index.html',['zeek-connection','zeek-dns','suricata-alert']],
 ['newest-detection-engineering-techniques/index.html',['sysmon-1','kubernetes-audit','gcp-audit']],
 ['anomaly-detection-atlas/research/telemetry/index.html',['windows-security-4624','windows-security-4769','okta-system-log']],
];
const sources=JSON.parse(readFileSync(join(root,'data/log-sources.json'))).sources;const receipts=[];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
for(const [path,ids] of mappings){const file=join(site,path);if(!existsSync(file)){receipts.push({path,status:'not-present-in-this-build'});continue;}
 const links=ids.map(id=>{const r=sources.find(r=>r.id===id);if(!r)throw Error('Unknown log source '+id);return `<a href="/log-sources/${id}/">${esc(r.title)}</a>`;}).join(' · ');
 const block=`<!-- log-sources:start --><section class="ttp-ecosystem-links" aria-label="Native security log sources"><h2>Native security log sources</h2><p>Use the <a href="/log-sources/">Security Log-Source Library</a> for grouped producers, attributed native samples, field structure and collection limits. These source-format references support research; they do not establish deployed coverage or detector effectiveness.</p><p>${links}</p></section><!-- log-sources:end -->`;
 let html=readFileSync(file,'utf8');html=html.replace(/<!-- log-sources:start -->[\s\S]*?<!-- log-sources:end -->/g,'');if(!html.includes('</main>'))throw Error('Missing main '+path);const anchor=html.includes('<!-- anomaly-atlas:start -->')?'<!-- anomaly-atlas:start -->':'</main>';html=html.replace(anchor,block+anchor);writeFileSync(file,html);receipts.push({path,status:'linked',profiles:ids});
}
mkdirSync(join(site,'data'),{recursive:true});writeFileSync(join(site,'data/log-source-crosslinks.json'),JSON.stringify(receipts,null,2)+'\n');console.log('Log-source crosslinks:',receipts.filter(x=>x.status==='linked').length);
