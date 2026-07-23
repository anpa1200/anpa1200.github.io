export const DISCOVERY_TIER_BOOST = Object.freeze({
  core: 12,
  reference: 1,
  archive: 0.2,
});

export const DISCOVERY_EVIDENCE_BOOST = Object.freeze({
  'externally-accepted': 1.35,
  'release-evidence': 1.3,
  'lab-validated': 1.2,
  'source-backed': 1,
  illustrative: 0.75,
  unverified: 0.6,
});

export function governanceBoost(item) {
  const tier = DISCOVERY_TIER_BOOST[item?.collection_tier] || 1;
  const evidence = DISCOVERY_EVIDENCE_BOOST[item?.evidence_level] || 1;
  return tier * evidence;
}

export function shouldApplyDiscoveryGovernance(term) {
  if (term === null || term === undefined || !String(term).trim()) return true;
  const normalized = String(term).trim().toLowerCase();
  if (normalized === 'adversarygraph') return true;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  // Preserve Pagefind's exact identifier/alias order for one-token searches,
  // and exact/full-title behavior for long, specific searches. Governance is
  // intended for broad discovery phrases and exact flagship product discovery,
  // not general one-token lookup queries.
  return tokens.length === 2 || tokens.length === 3;
}

export function rerankSearchResults(results, term, records) {
  if (!Array.isArray(results) || !shouldApplyDiscoveryGovernance(term)) return results;
  return results.map((result, index) => ({
    result,
    index,
    governedScore: (Number(result.score) || 0) * (records?.[result.id]?.boost || 1),
  })).sort((left, right) =>
    right.governedScore - left.governedScore
    || (Number(right.result.score) || 0) - (Number(left.result.score) || 0)
    || left.index - right.index
  ).map(({ result }) => result);
}
