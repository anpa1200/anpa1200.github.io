#!/usr/bin/env node
// One-time migration: proposals are reviewed and checked into data/seo-policy.json.
// The build consumes the reviewed policy, never an unreviewed live crawl.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'reports/technical-seo-20260920/before/pages.json')));
const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/seo-targeting.json'))).pages;
const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/seo-article-titles.json')));
const articleDescriptions = JSON.parse(fs.readFileSync(path.join(root, 'data/seo-article-descriptions.json')));
const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'data/seo-description-overrides.json')));
const overridesPath = path.join(root, 'data/seo-metadata-overrides.json');
const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath)) : {};
const short = text => text.replace(/\s*\|\s*(?:1200km|AdversaryGraph(?: Docs)?|ITDR|Anomaly Detection Atlas)\s*$/i, '').trim();
const goodTitle = value => value.length >= 30 && value.length <= 60;
const goodDescription = value => value.length >= 120 && value.length <= 155 && !/[.…]{2,}|…/.test(value);
const pages = {};
const unresolved = [];

function titleFor(page, pathname) {
  if (goodTitle(page.title)) return page.title;
  const hash = pathname.split('/').filter(Boolean).at(-1)?.slice(-12);
  if (articles[hash]) return `${articles[hash]} | 1200km`;
  const name = short(page.title);
  const candidates = [];
  if (pathname.includes('/threat-matrix/')) {
    candidates.push(name.replace(' threat actor profile', ' actor profile').replace('ATT&CK technique', 'ATT&CK') + ' | 1200km');
    candidates.push(name.replace(' threat actor profile', '').replace(' — ATT&CK technique', '').replace(' ATT&CK technique', '') + ' | 1200km');
  }
  if (pathname.startsWith('/israel-government-threat-actors-cti/actors/')) candidates.push(`${name} — Threat Actor Evidence | 1200km`);
  if (pathname.startsWith('/israel-government-threat-actors-cti/tools/')) candidates.push(`${name} — Tool Intelligence | 1200km`);
  const contexts = {
    'CTI_as_a_Code': 'CTI as Code', 'ITDR': 'Identity Security',
    'adversarygraph-docs': 'AdversaryGraph', 'cti-analyst-field-manual': 'CTI Tradecraft',
    'customer-driven-ai-cti-project': 'Customer CTI', 'insider-threat-detection': 'Insider Threats',
    'operation-desert-hydra': 'Desert Hydra', 'Hexstrike-AI-guide': 'HexStrike Guide',
    'israel-government-threat-actors-cti': 'CTI Research', 'ai-vs-defense': 'AI vs Defense',
  };
  const context = contexts[pathname.split('/')[1]];
  if (context) candidates.push(`${name} — ${context} | 1200km`);
  candidates.push(`${name} | 1200km`);
  return candidates.find(goodTitle) || page.title;
}

function descriptionFor(page, pathname) {
  const leaf = pathname.split('/').filter(Boolean).at(-1) || '';
  const authored = articleDescriptions[leaf.slice(-12)] || articleDescriptions[leaf];
  if (pathname.startsWith('/articles/') && authored) page = { ...page, description: authored };
  if (descriptions[pathname]) page = { ...page, description: descriptions[pathname] };
  if (goodDescription(page.description)) return page.description;
  if (pathname.startsWith('/threat-matrix/actors/')) {
    const name = page.h1;
    const id = pathname.split('/').filter(Boolean).at(-1);
    const candidates = [
      `Investigate ${name} (${id}): review published aliases, ATT&CK techniques, CTI references and detection research linked to this actor.`,
      `Review ${name} (${id}), its published aliases and ATT&CK techniques, with linked threat intelligence and defensive research for analyst review.`,
      `${name} (${id}): review published aliases, mapped ATT&CK techniques and linked CTI research. Follow the sources before making an attribution.`,
    ];
    const result = candidates.find(goodDescription);
    if (result) return result;
  }
  if (pathname.startsWith('/threat-matrix/techniques/')) {
    const name = page.h1;
    const id = pathname.split('/').filter(Boolean).at(-1);
    const candidates = [
      `Investigate ${name} (${id}) with ATT&CK behavior, defensive context and linked CTI references. Check source evidence before applying a mapping.`,
      `Review ${name} (${id}): ATT&CK behavior, detection context and related threat intelligence, with source links for analyst validation.`,
      `${name} (${id}): inspect ATT&CK behavior, associated intelligence and defensive context through linked research and source evidence.`,
      `Review ATT&CK ${id}, ${name}, with source-linked behavior, detection context and related threat intelligence.`,
      `Review ${id}, ${name}, with ATT&CK behavior, defensive context and source references.`,
    ];
    const result = candidates.find(goodDescription);
    if (result) return result;
  }
  let text = page.description.replace(/\s+/g, ' ').trim();
  // Remove complete redundant wording, not a trailing word fragment.
  const substitutions = [
    [/\bpractical, evidence-led\b/gi, 'evidence-led'],
    [/\bpractical defensive\b/gi, 'defensive'],
    [/\bthe documented\b/gi, 'documented'],
    [/\bthe available\b/gi, 'available'],
    [/\bthe evidence\b/gi, 'evidence'],
    [/\band the\b/gi, 'and'],
    [/\bwith the\b/gi, 'with'],
    [/\bfor the\b/gi, 'for'],
    [/\bin order to\b/gi, 'to'],
    [/\bLearn how to\b/gi, 'Learn to'],
    [/\bExplore the\b/gi, 'Explore'],
    [/\bReview the\b/gi, 'Review'],
    [/\bUnderstand the\b/gi, 'Understand'],
    [/\bcomprehensive guide to\b/gi, 'guide to'],
    [/\ba practical guide to\b/gi, 'a guide to'],
    [/\bdetailed guide to\b/gi, 'guide to'],
    [/\bpractical /gi, ''],
    [/\bdocumented /gi, ''],
    [/\btransparent /gi, ''],
    [/\bavailable /gi, ''],
    [/\bcomplete /gi, ''],
    [/\brelated /gi, ''],
    [/\bexplicit /gi, ''],
    [/\bself-hosted stack\b/gi, 'stack'],
    [/\bwhile keeping\b/gi, 'keeping'],
    [/\busing the\b/gi, 'using'],
    [/\bacross the\b/gi, 'across'],
    [/\bto the\b/gi, 'to'],
    [/, and /g, ' and '],
    [/\bincluding /gi, 'with '],
    [/\brepeatable /gi, ''],
    [/\bstructured scenarios\b/gi, 'scenarios'],
    [/\bworkflow steps\b/gi, 'steps'],
    [/\bintelligence program\b/gi, 'CTI program'],
    [/\bintelligence triggers\b/gi, 'triggers'],
    [/\bbefore an incident\b/gi, 'before incidents'],
    [/\bconnect four triggers\b/gi, 'link four triggers'],
    [/\bengineering actions\b/gi, 'actions'],
    [/\boperational barriers\b/gi, 'barriers'],
    [/\bintended outputs\b/gi, 'outputs'],
    [/\bprivilege-escalation risk\b/gi, 'escalation risk'],
    [/\bcloud identity attack surface\b/gi, 'cloud attack surface'],
    [/\bas foundations for investigating\b/gi, 'as context for'],
    [/\breview extracted IOCs\b/gi, 'review IOCs'],
    [/\bdifferences in attacker skill\b/gi, 'attacker skill gaps'],
    [/\band what that change means for\b/gi, 'and implications for'],
    [/\bATT&CK detection logic\b/gi, 'ATT&CK detections'],
    [/\ba particular detection\b/gi, 'a detection'],
    [/\bappropriate reference models\b/gi, 'reference models'],
    [/\bfirewall and EDR observations\b/gi, 'firewall and EDR logs'],
    [/\bmodule configuration\b/gi, 'module setup'],
    [/\bunderstanding what each fingerprint establishes and what it does not\b/gi, 'understanding each fingerprint and its evidentiary limits'],
    [/\bsetup and delivery workflow\b/gi, 'delivery workflow'],
    [/\blab setup workflow\b/gi, 'lab workflow'],
    [/\bthe need for analyst verification\b/gi, 'analyst verification needs'],
    [/\bfollowing the setup guide\b/gi, 'using the setup guide'],
    [/\bsecurity articles by topic\b/gi, 'articles by topic'],
    [/\bdefensive investigation\b/gi, 'investigation'],
    [/\bthe security questions discussed\b/gi, 'security questions'],
    [/\badministrative account creation\b/gi, 'admin account creation'],
    [/\bpersona-based social engineering\b/gi, 'persona-based deception'],
    [/\blong-lived persistence\b/gi, 'persistence'],
    [/\bcustom malware\b/gi, 'malware'],
    [/\beach repository detection\b/gi, 'repository detections'],
    [/\bcustomer-style pilot handoff\b/gi, 'pilot handoff'],
    [/\blead-generation material\b/gi, 'research leads'],
    [/\bthen validate aliases\b/gi, 'validate aliases'],
    [/\bsensor access, and data collection\b/gi, 'sensor and data access'],
    [/\bsensor access and data collection\b/gi, 'sensor and data access'],
    [/\blegitimate or compromised email accounts\b/gi, 'email accounts'],
    [/\bthe entry covers implant delivery\b/gi, 'covering implant delivery'],
    [/\bAndroid destructive logic\b/gi, 'Android wiping'],
    [/\bwhile preserving source\b/gi, 'preserving source'],
    [/\bsoftware association through\b/gi, 'software link through'],
    [/\bweb shell deployed on compromised servers\b/gi, 'web shell on compromised servers'],
    [/\bintrusion-chain context\b/gi, 'intrusion context'],
    [/\bto this software through\b/gi, 'to software through'],
    [/\baccount activity\b/gi, 'account use'],
    [/\bwithout exercising live agent privileges\b/gi, 'without live agent privileges'],
    [/\bsynthetic process events\b/gi, 'synthetic events'],
    [/\bbrowser-based Threat Matrix\b/gi, 'Threat Matrix'],
    [/\bsource intelligence\b/gi, 'source CTI'],
    [/\ba first local deployment\b/gi, 'a local deployment'],
    [/\bstrict identifiers\b/gi, 'identifiers'],
    [/\bevidence-backed validation\b/gi, 'validation'],
    [/\bknown operational limits\b/gi, 'operational limits'],
    [/\bnetwork isolation\b/gi, 'isolation'],
    [/\bthis (?=(?:medium|high|low)-confidence|MITRE-listed)/gi, ''],
    [/\btool record\b/gi, 'tool entry'],
    [/\bsoftware record\b/gi, 'software entry'],
    [/\bwith attention to\b/gi, 'covering'],
    [/\busing (?=(?:LSASS|parent process|its phishing))/gi, 'via '],
    [/\bcustom tooling\b/gi, 'custom tools'],
    [/\bsource context\b/gi, 'sources'],
    [/\bevidence provenance\b/gi, 'provenance'],
    [/\bdefensive hunt limits\b/gi, 'hunt limits'],
    [/\bdefensive hunts\b/gi, 'hunts'],
    [/\bresponse guidance\b/gi, 'response advice'],
    [/\bgathering target information\b/gi, 'gathering target details'],
    [/\bthe first part of this guide\b/gi, 'this first guide'],
    [/\bresearch report's evidence\b/gi, "report's evidence"],
    [/\band useful investigative context\b/gi, 'and investigative context'],
    [/\bthe associated testing\b/gi, 'the testing'],
    [/\bwithin a controlled and authorized test environment\b/gi, 'in a controlled, authorized test environment'],
    [/\bevaluating the evidence\b/gi, 'evaluating evidence'],
    [/\bfurther investigation\b/gi, 'investigation'],
    [/\bdefensive research\b/gi, 'defense research'],
    [/\bopen questions\b/gi, 'questions'],
    [/\bcontrolled security-training setup\b/gi, 'controlled training setup'],
    [/\bthe scope of its documented capabilities\b/gi, 'its documented scope'],
    [/\bthe security questions discussed\b/gi, 'security questions'],
    [/\bsupporting observations\b/gi, 'observations'],
    [/\blocally integrated articles\b/gi, 'local articles'],
    [/\bother domains\b/gi, 'domains'],
    [/\bsource references\b/gi, 'sources'],
    [/\bsource records\b/gi, 'sources'],
    [/\bsource scope\b/gi, 'source limits'],
    [/\bvia LSASS-memory context\b/gi, 'via LSASS context'],
    [/\bsource-backed capabilities\b/gi, 'sourced capabilities'],
    [/\bnetwork credential validation\b/gi, 'credential validation'],
    [/\bcommand execution\b/gi, 'execution'],
    [/\brecurring check-ins\b/gi, 'check-ins'],
    [/\bthat uses\b/gi, 'using'],
    [/\bassociation confidence\b/gi, 'linkage confidence'],
    [/\bcredential access tool entry\b/gi, 'credential tool entry'],
    [/\bcloud synchronization utility\b/gi, 'cloud sync utility'],
    [/\bavoiding unsupported behavior claims\b/gi, 'avoiding unsupported claims'],
    [/\bfile-system filter driver\b/gi, 'file-system driver'],
    [/\bmodular infostealer and RAT\b/gi, 'infostealer and RAT'],
    [/\bintended outputs\b/gi, 'outputs'],
  ];
  for (const [pattern, replacement] of substitutions) {
    if (goodDescription(text)) return text;
    text = text.replace(pattern, replacement);
  }
  return goodDescription(text) ? text : page.description;
}

for (const p of audit) {
  const pathname = new URL(p.url).pathname;
  const eligible = p.status === 200 && p.canonical_self && !p.noindex && p.content_type.includes('html');
  let classification = 'Supporting';
  let reason = 'Substantive supporting reference or documentation';
  const hub = pathname === '/' || pathname.split('/').filter(Boolean).length === 1;
  if (!eligible) {
    classification = 'Excluded';
    reason = p.status !== 200 ? `HTTP ${p.status}; URL retained, not a sitemap candidate` : p.noindex ? 'Existing noindex retained' : 'Non-HTML or non-self-canonical; canonical ownership retained';
  } else if (/\/(?:page\/\d+|tags?(?:\/[^/]+)?|categories(?:\/[^/]+)?)\/$/.test(pathname)
    || (p.word_count < 300 && !hub && !targets[pathname])) {
    classification = 'Thin';
    reason = /\/page\//.test(pathname) ? 'Pagination; keep crawlable and navigable' : p.word_count < 300 ? 'Short supporting page under 300 measured main-content words; retain content and URL' : 'Tag/category navigation';
  } else if (targets[pathname] || hub || pathname.includes('/articles/read/') || p.inbound_internal_links >= 50 && p.word_count >= 500) {
    classification = 'Priority';
    reason = 'Substantive practitioner content or established navigation entry point';
  }
  const chosen = { ...targets[pathname], ...overrides[pathname] };
  const entry = { classification, reason, word_count: p.word_count, title: chosen.title || titleFor(p, pathname), description: chosen.description || descriptionFor(p, pathname) };
  if (chosen.h1) entry.h1 = chosen.h1;
  if (chosen.intro) entry.intro = chosen.intro;
  if (eligible && classification !== 'Thin') {
    if (!goodTitle(entry.title)) unresolved.push({ pathname, field: 'title', value: entry.title, h1: p.h1 });
    if (!goodDescription(entry.description)) unresolved.push({ pathname, field: 'description', value: entry.description, paragraphs: p.paragraphs, headings: p.headings });
  }
  pages[pathname] = entry;
}
const counts = Object.values(pages).reduce((out, p) => { out[p.classification] = (out[p.classification] || 0) + 1; return out; }, {});
fs.writeFileSync(path.join(root, 'data/seo-policy.json'), JSON.stringify({ schema_version: 1, audit_date: '2026-09-20', counts, pages }, null, 2) + '\n');
fs.writeFileSync('/tmp/1200km-seo-unresolved.json', JSON.stringify(unresolved, null, 2));
console.log(JSON.stringify({ counts, unresolved: unresolved.length, titles: unresolved.filter(p => p.field === 'title').length, descriptions: unresolved.filter(p => p.field === 'description').length }));
