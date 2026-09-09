import { isIP } from 'node:net';

export const weakReferenceTitle = value => /^\s*(?:\[\d+\]|\(link to this tool(?: here)?\))\s*$/i.test(value || '');
export const inertReferenceKinds = new Set(['indicator', 'example', 'address-review']);
export function classifyReference(url, context = '', override = {}) {
  if (override.kind) return override.kind;
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '');
  if (isIP(host)) {
    if (/^(?:192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/.test(host)) return 'example';
    return /\b(?:indicator|ioc|command.and.control|c2|payload)\b/i.test(context) ? 'indicator' : 'address-review';
  }
  if (/^(?:example\.(?:com|org|net|invalid)|.*\.invalid)$/.test(host)) return 'example';
  if (/\bcontact us\b/i.test(context) && context.length < 100) return 'contact';
  if (/\b(?:sign in|log in|subscribe|follow me)\b/i.test(context) && context.length < 100) return 'navigation';
  if (/\b(?:dataset|data set|data feed)\b/i.test(context)) return 'dataset';
  if (host === 'github.com' && parsed.pathname.split('/').filter(Boolean).length >= 2 && /\b(?:tool|repository|script|source code)\b/i.test(context)) return 'tool';
  return 'bibliographic';
}

export function enrichReference(record, context, config) {
  const override = config.records[record.url.replace(/\/$/, '')] || {};
  const kind = classifyReference(record.url, context.anchors.join(' '), override);
  const originalTitle = record.title;
  const weak = weakReferenceTitle(originalTitle) || /^https?:\/\//.test(originalTitle);
  const host = new URL(record.url).hostname.replace(/^www\./, '');
  const publisher = inertReferenceKinds.has(kind) ? 'Not a publisher' : config.publishers[host]?.name || record.publisher;
  const title = override.title || (inertReferenceKinds.has(kind)
    ? `${kind === 'example' ? 'Synthetic example' : kind === 'indicator' ? 'Reported indicator' : 'Address requiring review'} in ${context.sources[0]?.title || 'research intake'}`
    : weak ? `Citation ${originalTitle.startsWith('[') ? originalTitle : ''} in ${context.sources[0]?.title || host} — document title needs review` : originalTitle);
  const review = override.title ? 'metadata-recovered' : weak || kind === 'address-review' ? 'review-needed' : 'authored-metadata';
  return { ...record, title, publisher, kind, metadata_status: review,
    tags: inertReferenceKinds.has(kind) ? (record.tags || []).filter(tag => tag.type !== "publisher_domain" && tag.facet !== "Publisher domain") : record.tags,
    description: inertReferenceKinds.has(kind) ? 'Preserved address evidence from the originating investigation. It is not a bibliographic source or a recommended destination.' : record.description,
    provenance: { original_title: originalTitle, original_publisher: record.publisher, anchor_texts: context.anchors,
      metadata_source: override.evidence_url || null, reviewed_at: override.reviewed_at || null,
      review_note: override.note || (review === 'review-needed' ? 'Publication title not established; retain originating context and resolve metadata before relying on this reference.' : 'Authored metadata retained; this does not establish claim-level support.') } };
}
