import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE_ROOT = new URL('..', import.meta.url).pathname;
const THREAT_MATRIX_ROOT = join(SITE_ROOT, 'threat-matrix');
const DEMO_DATA_ROOT = join(THREAT_MATRIX_ROOT, 'demo-data');

const ATTACK_INDEX_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/v19.1/index.json';
const URLHAUS_RECENT_URL = 'https://urlhaus.abuse.ch/downloads/json_recent/';
const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const args = process.argv.slice(2);
const offlineCacheIndex = args.indexOf('--offline-cache');
const offlineCache = offlineCacheIndex >= 0 ? args[offlineCacheIndex + 1] : '';

const DOMAIN_OUTPUTS = {
  'Enterprise ATT&CK': { output: 'mitre-data.json', domain: 'enterprise' },
  'Mobile ATT&CK': { output: 'mitre-data-mobile.json', domain: 'mobile' },
  'ICS ATT&CK': { output: 'mitre-data-ics.json', domain: 'ics' },
};

async function main() {
  await mkdir(DEMO_DATA_ROOT, { recursive: true });

  const attackIndex = await readJsonSource(ATTACK_INDEX_URL, 'attack-stix-index.json');
  for (const collection of attackIndex.collections || []) {
    const target = DOMAIN_OUTPUTS[collection.name];
    if (!target) continue;
    const latest = collection.versions?.[0];
    if (!latest?.url) throw new Error(`Missing latest URL for ${collection.name}`);
    const bundle = await readJsonSource(latest.url, basenameFromUrl(latest.url));
    const generated = transformAttackBundle(bundle, {
      domain: target.domain,
      version: latest.version,
      source_url: latest.url,
      source_modified: latest.modified,
    });
    await writeJson(join(THREAT_MATRIX_ROOT, target.output), generated);
    console.log(`Wrote ${target.output}: ${generated.techniques.length} techniques, ${generated.groups.length} groups, ATT&CK ${generated.version}`);
  }

  const iocs = buildIocDemoLibrary(await readJsonSource(URLHAUS_RECENT_URL, 'urlhaus_recent.json'));
  await writeJson(join(DEMO_DATA_ROOT, 'iocs.json'), iocs);
  console.log(`Wrote demo-data/iocs.json: ${iocs.items.length} indicators`);

  const cves = buildCveDemoLibrary(await readJsonSource(CISA_KEV_URL, 'known_exploited_vulnerabilities.json'));
  await writeJson(join(DEMO_DATA_ROOT, 'cves.json'), cves);
  console.log(`Wrote demo-data/cves.json: ${cves.items.length} vulnerabilities`);
}

async function readJsonSource(url, offlineName) {
  if (offlineCache) {
    return JSON.parse(await readFile(join(offlineCache, offlineName), 'utf8'));
  }
  return fetchJson(url);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': '1200km-threat-matrix-data-builder/1.0 (+https://1200km.com/)' },
  });
  if (!response.ok) throw new Error(`Fetch failed for ${url}: HTTP ${response.status}`);
  return response.json();
}

function basenameFromUrl(url) {
  return new URL(url).pathname.split('/').pop();
}

function transformAttackBundle(bundle, metadata) {
  const objects = (bundle.objects || []).filter((object) => !object.revoked && !object.x_mitre_deprecated);
  const byStixId = new Map(objects.map((object) => [object.id, object]));
  const externalIdByStixId = new Map(objects.map((object) => [object.id, externalId(object)]).filter(([, id]) => id));

  const subtechniqueParents = new Map();
  for (const relationship of objects.filter((object) => object.type === 'relationship' && object.relationship_type === 'subtechnique-of')) {
    const child = externalIdByStixId.get(relationship.source_ref);
    const parent = externalIdByStixId.get(relationship.target_ref);
    if (child && parent) subtechniqueParents.set(child, parent);
  }

  const techniqueIdsByGroup = new Map();
  for (const relationship of objects.filter((object) => object.type === 'relationship' && object.relationship_type === 'uses')) {
    const source = byStixId.get(relationship.source_ref);
    const targetId = externalIdByStixId.get(relationship.target_ref);
    if (source?.type !== 'intrusion-set' || !targetId?.startsWith('T')) continue;
    const groupId = externalId(source);
    if (!groupId) continue;
    if (!techniqueIdsByGroup.has(groupId)) techniqueIdsByGroup.set(groupId, new Set());
    techniqueIdsByGroup.get(groupId).add(targetId);
  }

  const tactics = objects
    .filter((object) => object.type === 'x-mitre-tactic')
    .map((object) => ({
      id: externalId(object),
      name: object.name || externalId(object),
      shortname: object.x_mitre_shortname || slugify(object.name || ''),
    }))
    .filter((tactic) => tactic.id && tactic.shortname)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const techniques = objects
    .filter((object) => object.type === 'attack-pattern' && externalId(object)?.startsWith('T'))
    .map((object) => {
      const id = externalId(object);
      const tacticIds = [...new Set((object.kill_chain_phases || []).map((phase) => phase.phase_name).filter(Boolean))];
      return {
        id,
        name: object.name || id,
        description: compactText(object.description, 1600),
        detection: compactText(object.x_mitre_detection, 1100),
        data_sources: [...new Set(object.x_mitre_data_sources || [])].sort(),
        platforms: [...new Set(object.x_mitre_platforms || [])].sort(),
        tactic_ids: tacticIds,
        is_sub: Boolean(object.x_mitre_is_subtechnique || subtechniqueParents.has(id)),
        parent_id: subtechniqueParents.get(id) || null,
        references: primaryReferenceFor(object),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const groups = objects
    .filter((object) => object.type === 'intrusion-set' && externalId(object)?.startsWith('G'))
    .map((object) => {
      const id = externalId(object);
      return {
        id,
        name: object.name || id,
        aliases: [...new Set([...(object.aliases || []), ...(object.x_mitre_aliases || [])].filter(Boolean))].sort(),
        description: compactText(object.description, 1700),
        references: primaryReferenceFor(object),
        technique_ids: [...(techniqueIdsByGroup.get(id) || new Set())].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return {
    domain: metadata.domain,
    version: metadata.version,
    generated: new Date().toISOString(),
    source: {
      name: 'MITRE ATT&CK STIX data',
      url: metadata.source_url,
      index_url: ATTACK_INDEX_URL,
      modified: metadata.source_modified,
      license_note: 'ATT&CK is a registered trademark of The MITRE Corporation. This static browser bundle uses public ATT&CK data for defensive research navigation.',
    },
    tactics,
    techniques,
    groups,
  };
}

function compactText(value, limit) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!limit || text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trim()}…`;
}

function buildIocDemoLibrary(urlhaus) {
  const rows = [];
  for (const [urlhausId, entries] of Object.entries(urlhaus || {})) {
    for (const entry of entries || []) {
      rows.push({
        id: `urlhaus-${urlhausId}`,
        type: 'url',
        value: entry.url,
        threat: entry.threat || 'malware_download',
        status: entry.url_status || 'unknown',
        first_seen: normalizeUrlhausDate(entry.dateadded),
        last_seen: normalizeUrlhausDate(entry.last_online),
        tags: [...new Set(entry.tags || [])].sort(),
        source: 'abuse.ch URLhaus',
        source_url: entry.urlhaus_link || `https://urlhaus.abuse.ch/url/${urlhausId}/`,
        reporter: entry.reporter || '',
      });
    }
  }
  rows.sort((a, b) => String(b.first_seen || '').localeCompare(String(a.first_seen || '')));
  return {
    generated: new Date().toISOString(),
    source: {
      name: 'abuse.ch URLhaus recent URL feed',
      url: URLHAUS_RECENT_URL,
      scope: 'Public recent malware URL indicators, trimmed to 2,000 records for a browser-only demo library.',
    },
    count: 2000,
    items: rows.slice(0, 2000),
  };
}

function buildCveDemoLibrary(kev) {
  const items = [...(kev.vulnerabilities || [])]
    .map((item) => ({
      id: item.cveID,
      vendor: item.vendorProject || '',
      product: item.product || '',
      name: item.vulnerabilityName || item.cveID,
      date_added: item.dateAdded || '',
      due_date: item.dueDate || '',
      known_ransomware_campaign_use: item.knownRansomwareCampaignUse || 'Unknown',
      cwes: item.cwes || [],
      summary: item.shortDescription || '',
      required_action: item.requiredAction || '',
      notes: item.notes || '',
      source: 'CISA Known Exploited Vulnerabilities catalog',
      source_url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(item.cveID)}`,
      nvd_url: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(item.cveID)}`,
      evidence_level: 'known-exploited',
    }))
    .sort((a, b) => String(b.date_added).localeCompare(String(a.date_added)) || a.id.localeCompare(b.id))
    .slice(0, 300);

  return {
    generated: new Date().toISOString(),
    source: {
      name: kev.title || 'CISA Known Exploited Vulnerabilities catalog',
      url: CISA_KEV_URL,
      catalog_version: kev.catalogVersion || '',
      released: kev.dateReleased || '',
      scope: 'Latest 300 CISA KEV entries by date_added for a browser-only CVE demo library.',
    },
    count: items.length,
    items,
  };
}

function externalId(object) {
  return object?.external_references?.find((reference) => reference.external_id)?.external_id || '';
}

function referencesFor(object) {
  return (object.external_references || [])
    .map((reference) => ({
      label: reference.description || reference.source_name || reference.external_id || reference.url || 'reference',
      url: reference.url || '',
      source: reference.source_name || '',
    }))
    .filter((reference) => reference.url)
    .slice(0, 20);
}

function primaryReferenceFor(object) {
  const references = referencesFor(object);
  const preferred = references.find((reference) =>
    reference.source === 'mitre-attack' || /attack\.mitre\.org/i.test(reference.url));
  return [preferred || references[0]].filter(Boolean);
}

function normalizeUrlhausDate(value) {
  if (!value) return '';
  const normalized = String(value).replace(' UTC', 'Z').replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`);
}

await main();
