// Deterministic, reviewable link selection from existing pages only.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const audit = JSON.parse(fs.readFileSync(new URL('reports/technical-seo-20260920/before/pages.json', root)));
const policy = JSON.parse(fs.readFileSync(new URL('data/seo-policy.json', root))).pages;
const byPath = new Map(audit.map(p => [new URL(p.url).pathname, p]));
const links = {};
function add(source, target, label) {
  if (!byPath.has(source) || !byPath.has(target)) throw Error(`Unknown published route: ${source} → ${target}`);
  const list = links[source] ||= [];
  if (list.some(x => x.href === target)) return;
  if (list.length >= 5) throw Error(`Link budget exceeded for ${source}`);
  list.push({href: target, label: label || policy[target]?.title.replace(/ \| 1200km$/, '') || byPath.get(target).h1});
}
function hubFor(page) {
  const text = `${page.h1} ${page.description}`;
  if (/malware|pcap|wireshark|reverse.engineer|shellcode|ransomware|portable executable/i.test(text)) return '/cyber-knowledge/malware-analysis.html';
  if (/cloud|azure|aws|entra|kubernetes/i.test(text)) return '/cyber-knowledge/cloud-security.html';
  if (/sigma|detect|siem|blue.team|hunting|defen[sc]|soc\b|anomal/i.test(text)) return '/cyber-knowledge/blue-team.html';
  if (/pentest|penetration|red.team|offensive|exploit|hexstrike|flipper|payload/i.test(text)) return '/cyber-knowledge/red-team.html';
  if (/\bAI\b|\bLLM\b|agent|prompt|model|neural/i.test(text)) return '/ai-offensive.html';
  return '/cyber-knowledge/cti.html';
}
const articles = audit.filter(p => p.status === 200 && p.canonical_self && p.url.includes('/articles/read/20'));
const groups = new Map();
for (const article of articles) {
  const path = new URL(article.url).pathname, hub = hubFor(article);
  add(path, hub);
  const list = groups.get(hub) || []; list.push(article); groups.set(hub, list);
}
const strength = (a,b) => b.inbound_internal_links - a.inbound_internal_links || b.word_count - a.word_count || a.url.localeCompare(b.url);
for (const [hub, group] of groups) for (const p of group.sort(strength).slice(0,5)) add(hub, new URL(p.url).pathname);
for (const [hub, match] of [
  ['/adversarygraph/', /adversarygraph|threatmapper/i], ['/hexstrike.html', /hexstrike/i],
  ['/cti.html', /intelligence|attribution|\bCTI\b/i], ['/labs.html', /pcap|wireshark|lab|walkthrough/i],
  ['/ai-attack-statistics/', /AI|LLM|agent/i], ['/cyber-knowledge/', /detection|malware|intelligence/i],
]) for (const p of articles.filter(p => match.test(p.h1)).sort(strength).slice(0,5)) add(hub, new URL(p.url).pathname);
const actors = ['G0017','G0030','G0055','G0097','G1028','G1042','G1049','G1050'];
const actorSources = ['/threat-matrix/', '/israel-government-threat-actors-cti/navigation/actor-workbench/', '/israel-government-threat-actors-cti/reports/actor-deep-research-prompts/', '/israel-government-threat-actors-cti/reports/worked-cases/'];
actors.forEach((id,i) => {
  const target = `/threat-matrix/actors/${id}/`;
  for (const source of [actorSources[Math.floor(i/4)], actorSources[2+Math.floor(i/4)]]) add(source,target,`${byPath.get(target).h1} (${id}) — actor evidence`);
});
for (const id of ['T1562.007','T1562.009','T1562.010','T1562.011','T1562.012']) {
  const target = `/threat-matrix/techniques/${id}/`;
  for (const source of ['/israel-government-threat-actors-cti/navigation/ttp-detection-matrix/','/israel-government-threat-actors-cti/detection-engineering/detection-status-dashboard/']) add(source,target,`${byPath.get(target).h1} (${id})`);
}
for (const source of ['/CTI_as_a_Code/','/customer-driven-ai-cti-project/']) add(source, '/CTI_as_a_Code/celltronx-proactive-case-study/');
for (const source of [...actorSources, '/israel-government-threat-actors-cti/navigation/ttp-detection-matrix/','/israel-government-threat-actors-cti/detection-engineering/detection-status-dashboard/','/CTI_as_a_Code/','/customer-driven-ai-cti-project/']) if (policy[source].classification !== 'Priority') throw Error(`Orphan source must be Priority: ${source}`);
fs.writeFileSync(new URL('data/seo-internal-links.json',root), JSON.stringify({selection:'Existing article topic match; strongest means inbound links, then substantive word count, not unverified traffic. Actor and technique links are research references, not attribution claims.',pages:links},null,2)+'\n');
console.log(`Selected contextual links for ${Object.keys(links).length} existing pages; maximum five per page.`);
