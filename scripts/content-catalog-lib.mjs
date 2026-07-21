import {
  SITE_ORIGIN,
  canonicalFromHtml,
  classifyTopics,
  findMetaContent,
  normalizeCanonical,
  stripHtml,
} from './search-index-lib.mjs';

export const VOCABULARIES = Object.freeze({
  primary_types: [
    'research',
    'case-study',
    'guide',
    'lab',
    'tool',
    'platform',
    'documentation',
    'article',
    'mirror',
    'contribution',
    'index',
    'profile',
    'policy',
  ],
  primary_domains: [
    'threat-intelligence',
    'detection-engineering',
    'threat-hunting',
    'malware-analysis',
    'identity-security',
    'offensive-security',
    'cloud-security',
    'ai-security',
    'embedded-security',
    'application-security',
    'portfolio-governance',
    'cross-domain',
  ],
  audiences: [
    'cti-analyst',
    'detection-engineer',
    'threat-hunter',
    'security-engineer',
    'security-leader',
    'platform-operator',
    'developer',
    'general',
  ],
  statuses: [
    'released',
    'maintained',
    'current-development',
    'experimental',
    'superseded',
    'archived',
    'submitted',
    'accepted',
  ],
  maturity: ['production', 'stable', 'beta', 'experimental', 'historical', 'reference'],
  evidence_levels: [
    'source-backed',
    'lab-validated',
    'release-evidence',
    'externally-accepted',
    'illustrative',
    'unverified',
  ],
});

export const CANONICAL_POLICY = Object.freeze({
  identity: 'One catalogue item represents one public artefact. Its stable ID is independent of display category, and its canonical URL is unique.',
  medium_and_local_mirrors: 'A locally hosted companion or export is typed as mirror and records the Medium publication as source_url. The 1200km archive URL is the preferred stable URL when it contains durable local context or assets; otherwise the external publication remains canonical. Duplicate source links are not emitted as second items.',
  versioned_material: 'Version-specific pages remain public only with an explicit version or applies_to boundary. Superseded material requires an archive reason and a visible historical or archive notice.',
  redirects: 'Legacy URLs are aliases, not independent catalogue items. They remain noindex redirects to the maintained canonical identity.',
});

const TOPIC_TAGS = new Map([
  ['AdversaryGraph', 'adversarygraph'],
  ['MITRE ATT&CK', 'mitre-attack'],
  ['Cyber threat intelligence', 'threat-intelligence'],
  ['Threat hunting', 'threat-hunting'],
  ['Detection engineering', 'detection-engineering'],
  ['Identity security', 'identity-security'],
  ['Malware analysis', 'malware-analysis'],
  ['AI security', 'ai-security'],
  ['Offensive security', 'offensive-security'],
  ['Incident response', 'incident-response'],
  ['Cloud security', 'cloud-security'],
  ['Embedded security', 'embedded-security'],
  ['Security research', 'security-research'],
]);

function isoDate(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}/);
  if (!match || Number.isNaN(Date.parse(`${match[0]}T00:00:00Z`))) return null;
  return match[0];
}

function htmlDates(html) {
  const published = [
    ...html.matchAll(/"datePublished"\s*:\s*"([^"]+)"/gi),
    ...html.matchAll(/<meta\b[^>]*(?:property|name)=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/gi),
  ].map((match) => isoDate(match[1])).filter(Boolean).sort()[0] || null;
  const updated = [
    ...html.matchAll(/"dateModified"\s*:\s*"([^"]+)"/gi),
    ...html.matchAll(/<meta\b[^>]*(?:property|name)=["']article:modified_time["'][^>]*content=["']([^"']+)["'][^>]*>/gi),
  ].map((match) => isoDate(match[1])).filter(Boolean).sort().at(-1) || null;
  return { published, updated };
}

function cleanTitle(html, url) {
  return stripHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || new URL(url).pathname).replace(/\s+[|—-]\s+1200km.*$/i, '').trim();
}

function cleanSummary(html, title) {
  const description = findMetaContent(html, 'description');
  if (description) return stripHtml(description).slice(0, 700);
  for (const match of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const value = stripHtml(match[1]);
    if (value.length >= 40 && value !== title) return value.slice(0, 700);
  }
  return `${title}. Public content record in the 1200km security-research catalogue.`;
}

function normalizedUrl(value, base = SITE_ORIGIN) {
  try {
    const url = new URL(value, base);
    url.hash = '';
    if (url.hostname === '1200km.com') return normalizeCanonical(url.href);
    url.search = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function idForUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase()
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const path = decodeURIComponent(url.pathname)
    .replace(/\/index\.html$/i, '/')
    .replace(/[^a-zA-Z0-9._-]+/g, ':')
    .replace(/^:+|:+$/g, '')
    .toLowerCase();
  return `${host === '1200km-com' ? 'site' : host}:${path || 'home'}`;
}

function collectionForUrl(url, config) {
  return [...config.declared_collections]
    .sort((a, b) => b.canonical_prefix.length - a.canonical_prefix.length)
    .find((collection) => url.startsWith(collection.canonical_prefix));
}

function inferType(url, title, html, collection) {
  const path = new URL(url).pathname;
  if (collection) {
    if (collection.id === 'collection:medium-export') {
      if (/^\/medium-blog-navigation\/(?:docs\/(?:articles|analysis)\/)?$/i.test(path)) return 'index';
      return 'mirror';
    }
    if (collection.id === 'collection:adversarygraph-docs') {
      if (/\/use-cases\/(?!$)/i.test(path) || /case-stud/i.test(path)) return 'case-study';
      return 'documentation';
    }
    if (/\/labs?\//i.test(path) || /\/simulations\/scenarios\//i.test(path)) return 'lab';
    return collection.primary_type;
  }
  if (/^\/threat-matrix\/(?:actors|techniques)\//i.test(path)) return 'mirror';
  if (path === '/threat-matrix/') return 'tool';
  if (path === '/adversarygraph/') return 'platform';
  if (/^\/articles\/.+\.html$/i.test(path)) return 'article';
  if (/\b(case study|case-study|in practice)\b/i.test(title)) return 'case-study';
  if (/\blab\b|simulation/i.test(path)) return 'lab';
  if (/guide|manual/i.test(path) || /\bguide\b/i.test(title)) return 'guide';
  if (/docs?/i.test(path)) return 'documentation';
  if (/^(?:\/|\/(?:cti|projects|labs|guides|search)\.html|\/articles\/)$/i.test(path)) return 'index';
  if (/\/(?:about|cv)\.html$/i.test(path)) return 'profile';
  if (/\/privacy\.html$/i.test(path)) return 'policy';
  if (/tool|matrix/i.test(path)) return 'tool';
  return /research|threat|attack|detection|malware|security/i.test(`${title} ${html.slice(0, 4000)}`) ? 'research' : 'guide';
}

function inferDomain(url, title, html, collection) {
  const path = new URL(url).pathname;
  const text = `${path} ${title} ${findMetaContent(html, 'description')}`;
  if (/^\/threat-matrix\//i.test(path)) return 'threat-intelligence';
  if (collection && collection.primary_domain !== 'cross-domain') return collection.primary_domain;
  if (/^\/ITDR\//.test(path) || /identity|kerberos|active directory|entra|oauth|saml/i.test(text)) return 'identity-security';
  if (/embedded|firmware|hardware|uefi|bmc/i.test(text)) return 'embedded-security';
  if (/malware|reverse engineering|debugger|unpack/i.test(text)) return 'malware-analysis';
  if (/threat hunt|hunting hypoth|hunt quer/i.test(text)) return 'threat-hunting';
  if (/detection|sigma|telemetry|siem|anomaly/i.test(text)) return 'detection-engineering';
  if (/cloud|kubernetes|aws|azure|gcp/i.test(text)) return 'cloud-security';
  if (/pentest|penetration|offensive|hexstrike|exploit|password crack|nmap|burp/i.test(text)) return 'offensive-security';
  if (/\bai\b|\bllm\b|agentic|prompt injection/i.test(text)) return 'ai-security';
  if (/adversarygraph|threat-matrix|\bcti\b|threat intelligence|att&ck|attack actor|ioc/i.test(text)) return 'threat-intelligence';
  if (/about|portfolio|projects|privacy|search|curriculum vitae/i.test(text)) return 'portfolio-governance';
  return 'cross-domain';
}

function defaultsForType(primaryType, primaryDomain) {
  const audiences = {
    'threat-intelligence': ['cti-analyst'],
    'detection-engineering': ['detection-engineer', 'threat-hunter'],
    'threat-hunting': ['threat-hunter', 'detection-engineer'],
    'malware-analysis': ['security-engineer', 'cti-analyst'],
    'identity-security': ['security-engineer', 'detection-engineer'],
    'offensive-security': ['security-engineer'],
    'cloud-security': ['security-engineer', 'detection-engineer'],
    'ai-security': ['security-engineer', 'developer'],
    'embedded-security': ['security-engineer', 'cti-analyst'],
    'application-security': ['security-engineer', 'developer'],
    'portfolio-governance': ['general'],
    'cross-domain': ['general'],
  };
  const evidence = primaryType === 'lab' ? 'illustrative'
    : primaryType === 'platform' ? 'release-evidence'
      : primaryType === 'mirror' ? 'source-backed'
        : 'source-backed';
  const maturity = ['mirror', 'documentation', 'index', 'profile', 'policy'].includes(primaryType) ? 'reference' : 'stable';
  return { audience: audiences[primaryDomain], evidence_level: evidence, maturity };
}

function mediumSourceFromHtml(html, pageUrl) {
  const candidates = [...html.matchAll(/https:\/\/(?:medium\.com\/@1200km|infosecwriteups\.com)\/[^"'<\s\\]+/gi)]
    .map((match) => normalizedUrl(match[0]))
    .filter((value) => value && !/^https:\/\/medium\.com\/@1200km\/?$/i.test(value));
  if (!candidates.length) return null;
  const suffix = new URL(pageUrl).pathname.match(/-([a-f0-9]{12})\/?$/i)?.[1];
  return (suffix && candidates.find((value) => value.toLowerCase().endsWith(suffix.toLowerCase()))) || candidates[0];
}

function sourceForThreatMatrix(url) {
  const path = new URL(url).pathname;
  const actor = path.match(/^\/threat-matrix\/actors\/(G\d{4})\//i)?.[1];
  if (actor) return `https://attack.mitre.org/groups/${actor.toUpperCase()}/`;
  const technique = path.match(/^\/threat-matrix\/techniques\/(T\d{4}(?:\.\d{3})?)\//i)?.[1];
  return technique ? `https://attack.mitre.org/techniques/${technique.toUpperCase().replace('.', '/')}/` : null;
}

function applyOverride(item, override = {}) {
  const merged = { ...item, ...override };
  if (!override.source_url && item.source_url) merged.source_url = item.source_url;
  return merged;
}

export function createContentItem({ url: rawUrl, html, updatedAt = null, source = 'local' }, config) {
  const canonical = normalizeCanonical(canonicalFromHtml(html) || rawUrl, rawUrl) || normalizedUrl(rawUrl);
  if (!canonical) throw new Error(`Cannot catalogue invalid URL: ${rawUrl}`);
  const title = cleanTitle(html, canonical);
  const collection = collectionForUrl(canonical, config);
  const primaryType = inferType(canonical, title, html, collection);
  const primaryDomain = inferDomain(canonical, title, html, collection);
  const defaults = defaultsForType(primaryType, primaryDomain);
  const dates = htmlDates(html);
  const topics = classifyTopics(canonical, html).map((topic) => TOPIC_TAGS.get(topic)).filter(Boolean);
  const path = new URL(canonical).pathname;
  const identifier = path.match(/\/(?:actors|techniques)\/([^/]+)\//i)?.[1]?.toLowerCase();
  const sourceUrl = sourceForThreatMatrix(canonical)
    || (collection?.id === 'collection:medium-export' ? mediumSourceFromHtml(html, canonical) : null)
    || (collection?.source_url && collection.source_url !== canonical ? collection.source_url : null);
  const version = title.match(/\b(?:AdversaryGraph|ThreatMapper)\s+v(\d+(?:\.\d+){0,2})/i)?.[1]
    || (collection?.id === 'collection:adversarygraph-docs' ? path.match(/-v(\d+(?:-\d+)*)\/?$/i)?.[1]?.replace(/-/g, '.') : null);
  const item = {
    id: idForUrl(canonical),
    title,
    primary_type: primaryType,
    primary_domain: primaryDomain,
    audience: collection?.audience || defaults.audience,
    status: collection?.status || 'maintained',
    maturity: collection?.maturity || defaults.maturity,
    evidence_level: collection?.evidence_level || defaults.evidence_level,
    ...(version ? { version } : {}),
    applies_to: collection?.applies_to || 'current published 1200km content',
    canonical_url: canonical,
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    published_at: dates.published,
    updated_at: dates.updated || isoDate(updatedAt),
    summary: cleanSummary(html, title),
    tags: [...new Set([
      ...topics,
      ...(identifier ? [identifier] : []),
      primaryDomain,
      primaryType,
    ])].sort(),
    featured: config.featured_urls.includes(canonical),
    indexable: !['external-index', 'nonindex-local'].includes(source),
    ...(collection ? { collection_id: collection.id } : {}),
  };
  return applyOverride(item, config.overrides[canonical]);
}

function anchorSummary(html, offset, title) {
  const start = Math.max(0, html.lastIndexOf('<div class="guide-item"', offset));
  const article = Math.max(0, html.lastIndexOf('<article', offset));
  const containerStart = Math.max(start, article);
  const endCandidates = [html.indexOf('</div>', offset), html.indexOf('</article>', offset)].filter((value) => value > offset);
  const end = endCandidates.length ? Math.min(...endCandidates) : Math.min(html.length, offset + 1400);
  const block = html.slice(containerStart, end + 12);
  const paragraph = stripHtml(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  return paragraph || `${title}. External article linked from the maintained 1200km content indexes.`;
}

export function externalArticleItems(indexDocuments, config, existingItems = []) {
  const usedSources = new Set(existingItems.map((item) => item.source_url).filter(Boolean));
  const byUrl = new Map();
  for (const { html } of indexDocuments) {
    const pattern = /<a\b[^>]*href=["'](https:\/\/(?:medium\.com\/@1200km|infosecwriteups\.com)\/[^"'#?\s]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const match of html.matchAll(pattern)) {
      const canonical = normalizedUrl(match[1]);
      if (!canonical || usedSources.has(canonical) || byUrl.has(canonical)) continue;
      const anchorTitle = stripHtml(match[2]);
      const slugTitle = canonical.split('/').at(-1).replace(/-[a-f0-9]{12}$/i, '').replace(/-/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
      const title = !anchorTitle || /^article$|^medium(?: article| research)?$/i.test(anchorTitle) ? slugTitle : anchorTitle;
      if (!title) continue;
      const summary = anchorSummary(html, match.index, title);
      const primaryDomain = inferDomain(canonical, title, summary, null);
      const defaults = defaultsForType('article', primaryDomain);
      const version = title.match(/\b(?:AdversaryGraph|ThreatMapper)\s+v(\d+(?:\.\d+){0,2})/i)?.[1];
      byUrl.set(canonical, {
        id: idForUrl(canonical),
        title,
        primary_type: 'article',
        primary_domain: primaryDomain,
        audience: defaults.audience,
        status: 'released',
        maturity: 'stable',
        evidence_level: 'unverified',
        ...(version ? { version } : {}),
        applies_to: version
          ? `version-specific external publication for AdversaryGraph ${version}`
          : 'external publication linked from a maintained 1200km index',
        canonical_url: canonical,
        published_at: null,
        updated_at: null,
        summary,
        tags: [...new Set([primaryDomain, 'article'])].sort(),
        featured: config.featured_urls.includes(canonical),
        indexable: false,
      });
    }
  }
  return [...byUrl.values()];
}

function counts(items, field) {
  return Object.fromEntries([...items.reduce((result, item) => {
    result.set(item[field], (result.get(item[field]) || 0) + 1);
    return result;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b)));
}

export function buildCatalog(items, config, scope = 'local-source-catalog') {
  const sorted = [...items].sort((a, b) => a.canonical_url.localeCompare(b.canonical_url));
  return {
    $schema: './content-catalog.schema.json',
    catalog_version: config.catalog_version,
    generated_at: config.verified_at,
    scope,
    controlled_vocabularies: VOCABULARIES,
    canonical_policy: CANONICAL_POLICY,
    declared_collections: config.declared_collections,
    aliases: config.aliases,
    inventory: {
      item_count: sorted.length,
      indexable_count: sorted.filter((item) => item.indexable).length,
      external_count: sorted.filter((item) => !item.canonical_url.startsWith(`${SITE_ORIGIN}/`)).length,
      by_primary_type: counts(sorted, 'primary_type'),
      by_primary_domain: counts(sorted, 'primary_domain'),
      by_status: counts(sorted, 'status'),
      by_evidence_level: counts(sorted, 'evidence_level'),
    },
    items: sorted,
  };
}

export function catalogueSearchMetadata(item) {
  return {
    primaryType: item.primary_type,
    primaryDomain: item.primary_domain,
    status: item.status,
    evidenceLevel: item.evidence_level,
  };
}

export function normalizeContentUrl(value, base = SITE_ORIGIN) {
  return normalizedUrl(value, base);
}
