import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DATA_PATH = join(ROOT, 'threat-matrix/mitre-data.json');
const CATALOG_PATH = join(ROOT, 'data/cyber-knowledge.json');
const OUTPUT_PATH = join(ROOT, 'data/attack-knowledge-mesh.json');
const PUBLIC_OUTPUT_PATH = join(ROOT, 'cyber-knowledge/attack-knowledge-mesh.json');
const CHECK = process.argv.includes('--check');
const START = '<!-- ATTACK_KNOWLEDGE_MESH_START -->';
const END = '<!-- ATTACK_KNOWLEDGE_MESH_END -->';
let attackGroups = [];

const DOMAIN_PROFILES = {
  cti: {
    tactics: ['reconnaissance', 'resource-development', 'initial-access', 'command-and-control'],
    terms: ['actor', 'campaign', 'intelligence', 'infrastructure', 'indicator', 'ttp', 'attribution', 'collection'],
  },
  'red-team': {
    tactics: ['reconnaissance', 'resource-development', 'initial-access', 'execution', 'persistence', 'privilege-escalation', 'lateral-movement'],
    terms: ['adversary emulation', 'payload', 'phishing', 'credential', 'exploit', 'command', 'shell', 'lateral'],
  },
  'blue-team': {
    tactics: ['initial-access', 'execution', 'persistence', 'defense-impairment', 'discovery', 'command-and-control'],
    terms: ['detection', 'telemetry', 'analytic', 'hunt', 'soc', 'alert', 'logging', 'response'],
  },
  'vulnerability-research': {
    tactics: ['reconnaissance', 'initial-access', 'execution', 'privilege-escalation'],
    terms: ['vulnerability', 'exploit', 'memory', 'fuzz', 'code execution', 'privilege', 'service', 'application'],
  },
  'malware-analysis': {
    tactics: ['execution', 'persistence', 'privilege-escalation', 'stealth', 'defense-impairment', 'command-and-control'],
    terms: ['malware', 'binary', 'process', 'injection', 'obfuscation', 'persistence', 'command', 'reverse engineering'],
  },
  'secure-code': {
    tactics: ['initial-access', 'execution', 'persistence', 'credential-access', 'collection', 'impact'],
    terms: ['application', 'api', 'software', 'supply chain', 'authentication', 'authorization', 'injection', 'secret'],
  },
  dfir: {
    tactics: ['execution', 'persistence', 'credential-access', 'discovery', 'collection', 'exfiltration', 'impact'],
    terms: ['forensic', 'evidence', 'timeline', 'memory', 'disk', 'incident', 'artifact', 'containment'],
  },
  'cloud-security': {
    tactics: ['initial-access', 'persistence', 'privilege-escalation', 'credential-access', 'discovery', 'lateral-movement', 'collection'],
    terms: ['cloud', 'container', 'kubernetes', 'identity', 'account', 'token', 'service', 'api'],
  },
  grc: {
    tactics: ['reconnaissance', 'initial-access', 'persistence', 'impact'],
    terms: ['risk', 'control', 'governance', 'assurance', 'evidence', 'policy', 'supplier', 'resilience'],
  },
  osint: {
    tactics: ['reconnaissance', 'resource-development', 'discovery'],
    terms: ['reconnaissance', 'domain', 'dns', 'infrastructure', 'identity', 'social media', 'public', 'search'],
  },
  'ai-security': {
    tactics: ['initial-access', 'execution', 'persistence', 'credential-access', 'collection', 'exfiltration', 'impact'],
    terms: ['ai', 'model', 'prompt', 'agent', 'inference', 'training data', 'tool', 'rag'],
  },
};

const TACTIC_ROUTES = {
  reconnaissance: ['osint:m1', 'cti:m4'],
  'resource-development': ['cti:m4', 'red-team:m3'],
  'initial-access': ['red-team:m4', 'blue-team:m3', 'secure-code:m2'],
  execution: ['red-team:m5', 'malware-analysis:m3', 'blue-team:m4'],
  persistence: ['red-team:m5', 'blue-team:m4', 'dfir:m5'],
  'privilege-escalation': ['vulnerability-research:m7', 'red-team:m5', 'cloud-security:m4'],
  stealth: ['malware-analysis:m6', 'blue-team:m4', 'dfir:m5'],
  'defense-impairment': ['blue-team:m4', 'malware-analysis:m6', 'dfir:m6'],
  'credential-access': ['blue-team:m5', 'cloud-security:m3', 'dfir:m5'],
  discovery: ['osint:m5', 'red-team:m5', 'cloud-security:m5'],
  'lateral-movement': ['red-team:m6', 'blue-team:m5', 'cloud-security:m5'],
  collection: ['cti:m4', 'dfir:m4', 'blue-team:m5'],
  'command-and-control': ['cti:m6', 'malware-analysis:m5', 'blue-team:m5'],
  exfiltration: ['dfir:m6', 'blue-team:m6', 'cloud-security:m7'],
  impact: ['dfir:m7', 'grc:m5', 'blue-team:m6'],
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function stripElementBlocks(value, tagName) {
  let output = String(value);
  let normalized = output.toLowerCase();
  const opening = `<${tagName}`;
  const closing = `</${tagName}`;
  let start = normalized.indexOf(opening);
  while (start !== -1) {
    const closingStart = normalized.indexOf(closing, start + opening.length);
    if (closingStart === -1) {
      output = output.slice(0, start);
      break;
    }
    const closingEnd = normalized.indexOf('>', closingStart + closing.length);
    const end = closingEnd === -1 ? output.length : closingEnd + 1;
    output = `${output.slice(0, start)} ${output.slice(end)}`;
    normalized = output.toLowerCase();
    start = normalized.indexOf(opening, start + 1);
  }
  return output;
}
const stripHtml = (value) => stripElementBlocks(stripElementBlocks(value, 'script'), 'style')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const normalize = (value) => stripHtml(value).toLowerCase().replace(/[^a-z0-9.]+/g, ' ');

function extractModules(html, domain) {
  const rows = [];
  const sectionMatches = [...html.matchAll(/<section\b[^>]*class="[^"]*\blab-group\b[^"]*"[^>]*id="(m\d+)"[^>]*>([\s\S]*?)(?=<section\b[^>]*class="[^"]*\blab-group\b|<\/main>)/gi)]
    .map((match) => ({ source_anchor: match[1], body: match[2], element_tag: 'section' }));
  const articleMatches = [...html.matchAll(/<article\b[^>]*class="[^"]*\bmodule\b[^"]*"[^>]*id="module-(\d+)"[^>]*>([\s\S]*?)<\/article>/gi)]
    .map((match) => ({ source_anchor: `module-${match[1]}`, anchor: `m${match[1]}`, body: match[2], element_tag: 'article' }));
  const divMatches = [...html.matchAll(/<div\b[^>]*class="[^"]*\bmodule\b[^"]*"[^>]*id="module-(\d+)"[^>]*>([\s\S]*?)(?=<div\b[^>]*class="[^"]*\bmodule\b[^"]*"[^>]*id="module-\d+"|<\/section>)/gi)]
    .map((match) => ({ source_anchor: `module-${match[1]}`, anchor: `m${match[1]}`, body: match[2], element_tag: 'div' }));
  for (const item of [...sectionMatches, ...articleMatches, ...divMatches]) {
    const anchor = item.anchor || item.source_anchor;
    const title = stripHtml(item.body.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || `${domain.name} ${anchor}`);
    rows.push({
      id: `${domain.id}:${anchor}`,
      domain_id: domain.id,
      domain_name: domain.name,
      title,
      anchor,
      source_anchor: item.source_anchor,
      element_tag: item.element_tag,
      url: `/${domain.path}#${item.source_anchor}`,
      text: normalize(item.body),
    });
  }
  return rows;
}

function scoreTechnique(module, technique, profile) {
  if (module.text.includes(technique.id.toLowerCase())) return { score: 100, basis: 'explicit-id' };
  const name = normalize(technique.name);
  if (name.length > 5 && module.text.includes(name)) return { score: 92, basis: 'explicit-name' };
  const techniqueTokens = [...new Set(name.split(' ').filter((token) => token.length >= 4))];
  const tokenHits = techniqueTokens.filter((token) => module.text.includes(` ${token} `)).length;
  const termHits = profile.terms.filter((term) => module.text.includes(term) && (` ${name} ${normalize(technique.description)}`).includes(term)).length;
  const tacticHit = (technique.tactic_ids || []).some((tactic) => profile.tactics.includes(tactic));
  const score = Math.min(88, tokenHits * 12 + termHits * 9 + (tacticHit ? 18 : 0));
  return score >= 30 ? { score, basis: 'topic-match' } : null;
}

function buildModuleTagBlock(module, techniquesById, tacticsByShortname) {
  const tacticLinks = module.tactics.map((id) => {
    const tactic = tacticsByShortname.get(id);
    return `<a class="attack-tag attack-tag--tactic" href="/cyber-knowledge/attack-matrix.html?tactic=${encodeURIComponent(id)}">${escapeHtml(tactic?.name || id)}</a>`;
  }).join('');
  const techniqueLinks = module.techniques.map((mapping) => {
    const technique = techniquesById.get(mapping.id);
    return `<a class="attack-tag" href="/threat-matrix/techniques/${mapping.id}/" title="${escapeHtml(mapping.basis)} · relevance ${mapping.score}/100"><span>${mapping.id}</span> ${escapeHtml(technique?.name || mapping.id)}</a>`;
  }).join('');
  return `${START}
<aside class="attack-module-map" aria-labelledby="${module.anchor}-attack-map-title">
  <h3 id="${module.anchor}-attack-map-title">ATT&amp;CK knowledge mesh</h3>
  <p>This module is contextually mapped to ATT&amp;CK Enterprise ${escapeHtml(module.attack_version)}. Tags are discovery routes, not claims that every technique is implemented or observed.</p>
  <div class="attack-tag-list" aria-label="Relevant tactics">${tacticLinks}</div>
  <div class="attack-tag-list" aria-label="Relevant techniques">${techniqueLinks}</div>
  <p class="attack-map-method"><a href="/cyber-knowledge/attack-matrix.html#methodology">Review mapping method and confidence</a></p>
</aside>
${END}`;
}

function insertModuleBlocks(html, modules, techniquesById, tacticsByShortname) {
  let output = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), '');
  for (const module of [...modules].reverse()) {
    const sectionStart = output.search(new RegExp(`<${module.element_tag}\\b[^>]*id="${module.source_anchor}"`, 'i'));
    if (sectionStart < 0) continue;
    let sectionEnd;
    if (module.element_tag === 'article') {
      sectionEnd = output.indexOf('</article>', sectionStart);
    } else if (module.element_tag === 'div') {
      const next = output.slice(sectionStart + 1).search(/<div\b[^>]*class="[^"]*\bmodule\b[^"]*"[^>]*id="module-\d+"/i);
      sectionEnd = next < 0 ? output.indexOf('</section>', sectionStart) : sectionStart + 1 + next;
    } else {
      const next = output.slice(sectionStart + 1).search(/<section\b[^>]*class="[^"]*\blab-group\b/i);
      sectionEnd = next < 0 ? output.indexOf('</main>', sectionStart) : sectionStart + 1 + next;
    }
    output = `${output.slice(0, sectionEnd)}${buildModuleTagBlock(module, techniquesById, tacticsByShortname)}\n${output.slice(sectionEnd)}`;
  }
  if (!output.includes('/assets/attack-knowledge-mesh.css')) {
    output = output.replace('</head>', '  <link rel="stylesheet" href="/assets/attack-knowledge-mesh.css">\n</head>');
  }
  return output;
}

function techniqueKnowledgeSection(technique, routes) {
  const routeCards = routes.slice(0, 12).map((route) =>
    `<a class="card" href="${escapeHtml(route.url)}"><strong>${escapeHtml(route.title)}</strong><br><span class="muted">${escapeHtml(route.domain_name)} · ${escapeHtml(route.basis)} · ${route.score}/100</span></a>`).join('');
  const mitigationCards = (technique.mitigations || []).map((item) =>
    `<article class="card"><strong>${escapeHtml(item.id)} · ${escapeHtml(item.name)}</strong><p>${escapeHtml(item.description)}</p>${item.references?.[0]?.url ? `<a href="${escapeHtml(item.references[0].url)}">MITRE mitigation source</a>` : ''}</article>`).join('');
  const detectionCards = (technique.detection_strategies || []).map((strategy) => {
    const analytics = (strategy.analytics || []).map((analytic) =>
      `<li><strong>${escapeHtml(analytic.id)} · ${escapeHtml(analytic.name)}</strong> — ${escapeHtml(analytic.description)}</li>`).join('');
    return `<article class="card"><strong>${escapeHtml(strategy.id)} · ${escapeHtml(strategy.name)}</strong>${analytics ? `<ul>${analytics}</ul>` : ''}${strategy.references?.[0]?.url ? `<a href="${escapeHtml(strategy.references[0].url)}">MITRE detection source</a>` : ''}</article>`;
  }).join('');
  return `${START}
<section class="attack-knowledge-detail">
  <h2 id="cyber-knowledge-context">Cyber Knowledge context</h2>
  <p>Use these routes to move from the ATT&amp;CK behavior into explanation, implementation, evidence handling, validation, and defensive operations. Relevance is generated from explicit identifiers/names and governed topic mappings; it is not attribution evidence.</p>
  <div class="grid">${routeCards}</div>
</section>
<section class="attack-knowledge-detail">
  <h2 id="mitigations">MITRE mitigations</h2>
  <div class="grid">${mitigationCards || '<p>No ATT&amp;CK mitigation relationship is published for this technique. Apply risk-based controls and verify scope.</p>'}</div>
</section>
<section class="attack-knowledge-detail">
  <h2 id="detection-strategies">MITRE detection strategies and analytics</h2>
  <div class="grid">${detectionCards || '<p>No ATT&amp;CK detection-strategy relationship is published for this technique.</p>'}</div>
</section>
${END}`;
}

async function enrichTechniquePage(technique, routes) {
  const path = join(ROOT, `threat-matrix/techniques/${technique.id}/index.html`);
  try {
    let html = await readFile(path, 'utf8');
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), '');
    const marker = '<section><h2 id="continue-the-investigation">';
    const section = techniqueKnowledgeSection(technique, routes);
    html = html.includes(marker) ? html.replace(marker, `${section}\n  ${marker}`) : html.replace('</main>', `${section}</main>`);
    if (!html.includes('/assets/attack-knowledge-mesh.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/attack-knowledge-mesh.css">\n</head>');
    }
    if (html.includes('<a href="/cyber-knowledge/attack-matrix.html">ATT&amp;CK Knowledge Mesh</a>') && !html.includes('article:published_time')) {
      html = html.replace('</head>', '  <meta property="article:published_time" content="2026-07-29"><meta property="article:modified_time" content="2026-07-29">\n</head>');
    }
    await writeFile(path, html.replace(/[ \t]+$/gm, ''));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const groups = attackGroups.filter((group) => group.technique_ids.includes(technique.id));
    const groupCards = groups.map((group) =>
      `<a class="card" href="/threat-matrix/actors/${escapeHtml(group.id)}/"><strong>${escapeHtml(group.name)}</strong><br><span class="muted">${escapeHtml(group.id)}</span></a>`).join('');
    const canonical = `https://1200km.com/threat-matrix/techniques/${technique.id}/`;
    const generated = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(technique.id)} ${escapeHtml(technique.name)} | AdversaryGraph</title>
<meta name="description" content="${escapeHtml(`${technique.id} ${technique.name}: ATT&CK behavior, detection strategies, mitigations, groups, and Cyber Knowledge context.`)}">
<meta property="article:published_time" content="2026-07-29"><meta property="article:modified_time" content="2026-07-29">
<link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/assets/attack-knowledge-mesh.css">
<style>body{margin:0;background:#07101f;color:#dce7f7;font:16px/1.6 system-ui,sans-serif}main{width:min(1120px,calc(100% - 2rem));margin:2rem auto}a{color:#8bd8ff}.meta,.muted{color:#93a4bd}.cta{display:inline-block;background:#e11d48;color:#fff;padding:.65rem .85rem;border-radius:.4rem;text-decoration:none;font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:.7rem}.card{display:block;border:1px solid #334155;border-radius:.5rem;padding:.8rem;background:#0d1728;color:#dce7f7;text-decoration:none}.card p{color:#c6d4e8}</style>
<script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org','@type':'TechArticle',headline:`${technique.id} ${technique.name}`,url:canonical,about:['MITRE ATT&CK',technique.id,...technique.tactic_ids] })}</script>
</head><body><main><nav><a href="/cyber-knowledge/attack-matrix.html">ATT&amp;CK Knowledge Mesh</a> / ${escapeHtml(technique.id)}</nav>
<p class="meta">${escapeHtml(technique.id)} · ${escapeHtml((technique.tactic_ids || []).join(' · '))} · ATT&amp;CK 19.1</p>
<h1>${escapeHtml(technique.name)}</h1><p>${escapeHtml(technique.description)}</p>
<p><a class="cta" href="/cyber-knowledge/attack-matrix.html?technique=${encodeURIComponent(technique.id)}">Open in the interactive knowledge mesh</a></p>
<section><h2>Detection overview</h2><p>${escapeHtml(technique.detection || 'Use the published detection strategies below and validate required telemetry in the target environment.')}</p></section>
<section><h2>Observed groups</h2><div class="grid">${groupCards || '<p>No current Enterprise group relationship is published in this bundle.</p>'}</div></section>
${techniqueKnowledgeSection(technique, routes)}
</main></body></html>`;
    await mkdir(join(ROOT, `threat-matrix/techniques/${technique.id}`), { recursive: true });
    await writeFile(path, generated);
  }
}

async function enrichGroupPage(group, reverse) {
  const path = join(ROOT, `threat-matrix/actors/${group.id}/index.html`);
  const routes = group.technique_ids.flatMap((id) => reverse[id]?.knowledge_routes || [])
    .sort((a, b) => b.score - a.score)
    .filter((route, index, all) => all.findIndex((candidate) => candidate.module_id === route.module_id) === index)
    .slice(0, 12);
  const section = `${START}
<section><h2 id="cyber-knowledge-routes">Cyber Knowledge routes</h2>
<p>These contextual routes explain behaviors associated with this ATT&amp;CK group record. They support learning and investigation planning; they do not add attribution evidence.</p>
<div class="grid">${routes.map((route) => `<a class="card" href="${escapeHtml(route.url)}"><strong>${escapeHtml(route.title)}</strong><br><span class="muted">${escapeHtml(route.domain_name)} · ${escapeHtml(route.basis)}</span></a>`).join('')}</div></section>
${END}`;
  try {
    let html = await readFile(path, 'utf8');
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), '');
    html = html.replace('</main>', `${section}</main>`);
    if (!html.includes('/assets/attack-knowledge-mesh.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/attack-knowledge-mesh.css"></head>');
    await writeFile(path, html.replace(/[ \t]+$/gm, ''));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const canonical = `https://1200km.com/threat-matrix/actors/${group.id}/`;
    const techniques = group.technique_ids.map((id) => `<a class="card" href="/threat-matrix/techniques/${escapeHtml(id)}/"><strong>${escapeHtml(id)}</strong></a>`).join('');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(group.name)} ${escapeHtml(group.id)} | AdversaryGraph</title><meta name="description" content="${escapeHtml(`${group.name} (${group.id}): aliases, ATT&CK techniques, and Cyber Knowledge routes.`)}">
<meta property="article:published_time" content="2026-07-29"><meta property="article:modified_time" content="2026-07-29"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/assets/attack-knowledge-mesh.css">
<style>body{margin:0;background:#07101f;color:#dce7f7;font:16px/1.6 system-ui,sans-serif}main{width:min(1120px,calc(100% - 2rem));margin:2rem auto}a{color:#8bd8ff}.muted{color:#93a4bd}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem}.card{display:block;border:1px solid #334155;border-radius:.5rem;padding:.8rem;background:#0d1728;color:#dce7f7;text-decoration:none}</style></head>
<body><main><nav><a href="/cyber-knowledge/attack-matrix.html">ATT&amp;CK Knowledge Mesh</a> / ${escapeHtml(group.id)}</nav><p class="muted">${escapeHtml(group.id)} · ATT&amp;CK 19.1 group</p>
<h1>${escapeHtml(group.name)}</h1><p>${escapeHtml(group.description)}</p><p><strong>Aliases:</strong> ${escapeHtml((group.aliases || []).join(', ') || 'None published')}</p>
<section><h2>Mapped techniques (${group.technique_ids.length})</h2><div class="grid">${techniques}</div></section>${section}</main></body></html>`;
    await mkdir(join(ROOT, `threat-matrix/actors/${group.id}`), { recursive: true });
    await writeFile(path, html);
  }
}

async function main() {
  const [attack, catalog] = await Promise.all([
    readFile(DATA_PATH, 'utf8').then(JSON.parse),
    readFile(CATALOG_PATH, 'utf8').then(JSON.parse),
  ]);
  const techniquesById = new Map(attack.techniques.map((item) => [item.id, item]));
  attackGroups = attack.groups;
  const tacticsByShortname = new Map(attack.tactics.map((item) => [item.shortname, item]));
  const modules = [];
  const sourcePages = new Map();

  for (const domain of catalog.domains) {
    const path = join(ROOT, domain.path);
    const html = (await readFile(path, 'utf8')).replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), '');
    sourcePages.set(domain.id, { path, html, domain });
    const profile = DOMAIN_PROFILES[domain.id];
    if (!profile) throw new Error(`Missing ATT&CK profile for ${domain.id}`);
    for (const module of extractModules(html, domain)) {
      const candidates = attack.techniques
        .map((technique) => ({ technique, mapping: scoreTechnique(module, technique, profile) }))
        .filter((row) => row.mapping)
        .sort((a, b) => b.mapping.score - a.mapping.score || a.technique.id.localeCompare(b.technique.id, undefined, { numeric: true }))
        .slice(0, 10);
      module.techniques = candidates.map(({ technique, mapping }) => ({ id: technique.id, ...mapping }));
      module.tactics = [...new Set(candidates.flatMap(({ technique }) => technique.tactic_ids || []))].slice(0, 8);
      module.attack_version = attack.version;
      delete module.text;
      modules.push(module);
    }
  }

  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const reverse = {};
  for (const technique of attack.techniques) {
    const mapped = modules.flatMap((module) => module.techniques
      .filter((mapping) => mapping.id === technique.id)
      .map((mapping) => ({ ...mapping, module })));
    const fallback = (technique.tactic_ids || []).flatMap((tactic) => (TACTIC_ROUTES[tactic] || [])
      .map((id) => moduleById.get(id)).filter(Boolean)
      .map((module) => ({ score: 24, basis: 'tactic-route', module })));
    const routes = [...mapped, ...fallback]
      .sort((a, b) => b.score - a.score)
      .filter((row, index, all) => all.findIndex((candidate) => candidate.module.id === row.module.id) === index)
      .slice(0, 12)
      .map((row) => ({
        module_id: row.module.id,
        url: row.module.url,
        title: row.module.title,
        domain_name: row.module.domain_name,
        basis: row.basis,
        score: row.score,
      }));
    reverse[technique.id] = { knowledge_routes: routes };
  }

  const mesh = {
    $schema: './attack-knowledge-mesh.schema.json',
    version: 1,
    generated_at: new Date().toISOString(),
    attack: { version: attack.version, source: attack.source.url },
    methodology: {
      scope: 'Contextual discovery links between ATT&CK Enterprise and public Cyber Knowledge modules.',
      confidence: {
        'explicit-id': 'The module contains the ATT&CK identifier.',
        'explicit-name': 'The module contains the full technique name.',
        'topic-match': 'Technique name/description, tactic, and governed domain vocabulary overlap.',
        'tactic-route': 'Fallback route from the technique tactic to a practitioner module.',
      },
      warning: 'Mappings are navigation aids, not evidence of actor use, control coverage, detection efficacy, or compromise.',
    },
    modules,
    techniques: reverse,
  };
  const serialized = `${JSON.stringify(mesh, null, 2)}\n`;
  if (CHECK) {
    const current = await readFile(OUTPUT_PATH, 'utf8');
    const normalizeGenerated = (text) => text.replace(/"generated_at": "[^"]+"/, '"generated_at": "<generated>"');
    if (normalizeGenerated(current) !== normalizeGenerated(serialized)) throw new Error('ATT&CK knowledge mesh is stale; run npm run build-attack-mesh');
    console.log(`ATT&CK knowledge mesh current: ${modules.length} modules, ${attack.techniques.length} techniques`);
    return;
  }

  await mkdir(join(ROOT, 'cyber-knowledge'), { recursive: true });
  await Promise.all([writeFile(OUTPUT_PATH, serialized), writeFile(PUBLIC_OUTPUT_PATH, serialized)]);
  for (const { html, path, domain } of sourcePages.values()) {
    await writeFile(path, insertModuleBlocks(html, modules.filter((module) => module.domain_id === domain.id), techniquesById, tacticsByShortname));
  }
  await Promise.all(attack.techniques.map((technique) => enrichTechniquePage(technique, reverse[technique.id].knowledge_routes)));
  await Promise.all(attack.groups.map((group) => enrichGroupPage(group, reverse)));
  console.log(`Built ATT&CK knowledge mesh: ${modules.length} modules, ${attack.techniques.length} techniques`);
}

await main();
