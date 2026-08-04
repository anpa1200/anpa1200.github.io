const DISTRIBUTIONS = Object.freeze({
  by_primary_type: 'primary_type',
  by_primary_domain: 'primary_domain',
  by_lifecycle: 'lifecycle',
  by_evidence_level: 'evidence_level',
  by_collection_tier: 'collection_tier',
  by_canonical_owner: 'canonical_owner',
  by_source_platform: 'source_platform',
});

function counts(items, field) {
  const values = new Map();
  for (const item of items) {
    const value = item[field] || '(not set)';
    values.set(value, (values.get(value) || 0) + 1);
  }
  return Object.fromEntries([...values].sort(([a], [b]) => a.localeCompare(b)));
}

function distributions(items) {
  return Object.fromEntries(Object.entries(DISTRIBUTIONS).map(([name, field]) => [name, counts(items, field)]));
}

function reviewItem(item) {
  return {
    id: item.id,
    title: item.title,
    canonical_url: item.canonical_url,
    primary_domain: item.primary_domain,
    lifecycle: item.lifecycle,
    published_at: item.published_at,
    updated_at: item.updated_at,
  };
}

function tagCounts(items) {
  const values = new Map();
  for (const item of items) {
    for (const tag of item.tags || []) values.set(tag, (values.get(tag) || 0) + 1);
  }
  return [...values].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

export function buildTaxonomyAudit(catalog) {
  const items = catalog.items || [];
  const generated = items.filter((item) => ['reference-entity', 'generated-reference'].includes(item.primary_type));
  const authored = items.filter((item) => !['reference-entity', 'generated-reference', 'redirect'].includes(item.primary_type));
  const currentnessUnknown = authored.filter((item) => item.lifecycle === 'currentness-unknown');
  const unverified = authored.filter((item) => item.evidence_level === 'unverified');
  const maintainedWithoutDate = items.filter((item) => item.lifecycle === 'maintained' && !item.updated_at);
  const historicalCore = items.filter((item) => ['archived', 'historical', 'preserved', 'superseded'].includes(item.lifecycle) && item.collection_tier === 'core');
  const genericTagItems = items.filter((item) => item.tags?.includes('security-research'));
  const underspecifiedTags = authored.filter((item) => (item.tags || []).length < 2);
  const tags = tagCounts(items);
  const warnings = [];

  if (generated.length) warnings.push({
    code: 'GENERATED_REFERENCE_DISTRIBUTION',
    severity: 'review',
    count: generated.length,
    message: `${generated.length} generated ATT&CK reference records affect raw type and domain totals. Use authored_only to review editorial distribution without the generated corpus.`,
  });
  if (currentnessUnknown.length) warnings.push({
    code: 'CURRENTNESS_REVIEW_QUEUE',
    severity: 'review',
    count: currentnessUnknown.length,
    message: `${currentnessUnknown.length} authored items remain currentness-unknown and are not presented as maintained guidance.`,
  });
  if (unverified.length) warnings.push({
    code: 'EVIDENCE_REVIEW_QUEUE',
    severity: 'review',
    count: unverified.length,
    message: `${unverified.length} authored items retain the unverified evidence level pending source-by-source review.`,
  });
  if (maintainedWithoutDate.length) warnings.push({
    code: 'MAINTENANCE_WITHOUT_EVIDENCE',
    severity: 'error',
    count: maintainedWithoutDate.length,
    message: `${maintainedWithoutDate.length} maintained items lack dated update evidence.`,
  });
  if (historicalCore.length) warnings.push({
    code: 'HISTORICAL_CORE_CONFLICT',
    severity: 'error',
    count: historicalCore.length,
    message: `${historicalCore.length} preserved, historical, superseded, or archived items are incorrectly assigned to the core tier.`,
  });
  if (genericTagItems.length) warnings.push({
    code: 'GENERIC_SECURITY_RESEARCH_TAG',
    severity: 'error',
    count: genericTagItems.length,
    message: `${genericTagItems.length} items use the non-discriminating security-research tag; assign subject-specific tags instead.`,
  });
  if (underspecifiedTags.length) warnings.push({
    code: 'UNDERSPECIFIED_TAGS',
    severity: 'review',
    count: underspecifiedTags.length,
    message: `${underspecifiedTags.length} authored items have fewer than two discovery tags.`,
  });

  return {
    $schema: '../data/content-taxonomy-audit.schema.json',
    report_version: '1.0.0',
    generated_at: catalog.generated_at,
    catalog_version: catalog.catalog_version,
    scope: catalog.scope,
    item_count: items.length,
    distributions: distributions(items),
    authored_only: {
      item_count: authored.length,
      ...distributions(authored),
    },
    tagging: {
      unique_tag_count: tags.length,
      generic_security_research_count: genericTagItems.length,
      underspecified_authored_count: underspecifiedTags.length,
      authored_with_author_tag: authored.filter((item) => item.tags?.some((tag) => tag.startsWith('author:'))).length,
      top_tags: Object.fromEntries(tags.slice(0, 40)),
    },
    review_queues: {
      currentness_unknown: currentnessUnknown.map(reviewItem),
      unverified: unverified.map(reviewItem),
    },
    warnings,
  };
}
