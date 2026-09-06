import fs from 'node:fs';

const dataset = JSON.parse(fs.readFileSync('data/knowledge-sources.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('data/knowledge-sources-index.json', 'utf8'));
const markdown = fs.readFileSync('data/knowledge-sources.md', 'utf8');
const errors = [];
const ids = new Set(dataset.sources.map(source => source.id));
const urls = new Set();
const seenIds = new Set();
const seenDescriptions = new Map();
const seenSummaries = new Map();
const allowedEvidence = new Set(['primary-authoritative', 'primary-operational', 'secondary-corroborating', 'mixed', 'preprint', 'peer-reviewed-primary']);
const allowedMaintenance = new Set(['active', 'periodic', 'continuous', 'unclear']);
const allowedSkills = new Set(['beginner', 'intermediate', 'advanced']);
const allowedSourceKinds = new Set([
  'government', 'standards-body', 'academic', 'nonprofit-technical',
  'open-source-project', 'open-core', 'commercial-technical',
  'independent-technical', 'mixed-license-tool'
]);

for (const source of dataset.sources) {
  const location = source.id || source.name || 'unknown source';
  if (seenIds.has(source.id)) errors.push(`${location}: duplicate id`);
  seenIds.add(source.id);
  const normalizedUrl = new URL(source.url).href.replace(/\/$/, '').toLowerCase();
  if (urls.has(normalizedUrl)) errors.push(`${location}: duplicate canonical URL`);
  urls.add(normalizedUrl);
  const words = String(source.description || '').trim().split(/\s+/).filter(Boolean).length;
  if (words < 140 || words > 200) errors.push(`${location}: description has ${words} words; expected 140-200`);
  const summaryWords = String(source.summary || '').trim().split(/\s+/).filter(Boolean).length;
  if (summaryWords < 60 || summaryWords > 110) errors.push(`${location}: summary has ${summaryWords} words; expected 60-110`);
  if (!source.organization) errors.push(`${location}: missing organization`);
  if (!allowedSourceKinds.has(source.source_kind)) errors.push(`${location}: invalid source_kind ${source.source_kind}`);
  const normalizedDescription = String(source.description || '').trim().toLowerCase();
  if (seenDescriptions.has(normalizedDescription)) errors.push(`${location}: duplicates description from ${seenDescriptions.get(normalizedDescription)}`);
  seenDescriptions.set(normalizedDescription, location);
  const normalizedSummary = String(source.summary || '').trim().toLowerCase();
  if (seenSummaries.has(normalizedSummary)) errors.push(`${location}: duplicates summary from ${seenSummaries.get(normalizedSummary)}`);
  seenSummaries.set(normalizedSummary, location);
  if (normalizedDescription === normalizedSummary) errors.push(`${location}: summary and description are identical`);
  if (!source.assessment) errors.push(`${location}: missing assessment`);
  if (!allowedEvidence.has(source.assessment?.evidence_use)) errors.push(`${location}: invalid evidence_use`);
  if (!allowedMaintenance.has(source.assessment?.maintenance)) errors.push(`${location}: invalid maintenance`);
  if (!Array.isArray(source.assessment?.strengths) || source.assessment.strengths.length < 2) errors.push(`${location}: insufficient strengths`);
  if (!Array.isArray(source.assessment?.limitations) || source.assessment.limitations.length < 1) errors.push(`${location}: insufficient limitations`);
  if (!Array.isArray(source.assessment?.best_for) || source.assessment.best_for.length < 2) errors.push(`${location}: insufficient best_for`);
  if (!Array.isArray(source.tags) || source.tags.length < 5) errors.push(`${location}: expected at least 5 tags`);
  for (const tag of source.tags || []) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) errors.push(`${location}: invalid tag ${tag}`);
  if (new Set(source.tags || []).size !== (source.tags || []).length) errors.push(`${location}: duplicate tag`);
  if (!Array.isArray(source.keywords) || source.keywords.length < 5) errors.push(`${location}: insufficient keywords`);
  if (!Array.isArray(source.audience) || !source.audience.length) errors.push(`${location}: missing audience`);
  if (!Array.isArray(source.skill_levels) || !source.skill_levels.length) errors.push(`${location}: missing skill levels`);
  for (const level of source.skill_levels || []) if (!allowedSkills.has(level)) errors.push(`${location}: invalid skill level ${level}`);
  if (!Array.isArray(source.content_formats) || !source.content_formats.length) errors.push(`${location}: missing content formats`);
  if (!Array.isArray(source.related_source_ids) || source.related_source_ids.length < 2) errors.push(`${location}: insufficient crosslinks`);
  if (new Set(source.related_source_ids || []).size !== (source.related_source_ids || []).length) errors.push(`${location}: duplicate crosslink`);
  for (const related of source.related_source_ids || []) {
    if (!ids.has(related)) errors.push(`${location}: unknown related id ${related}`);
    if (related === source.id) errors.push(`${location}: self-related id`);
  }
  if (!['reachable', 'access-restricted'].includes(source.validation?.status)) errors.push(`${location}: URL not validated`);
  for (const [dimension, rating] of Object.entries(source.quality?.dimensions || {})) {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) errors.push(`${location}: invalid quality dimension ${dimension}`);
  }
}

const allowedTags = new Set(dataset.controlled_tag_vocabulary || []);
for (const source of dataset.sources) for (const tag of source.tags || []) if (!allowedTags.has(tag)) errors.push(`${source.id}: uncontrolled tag ${tag}`);
const formatTagRules = [
  [/\blabs?\b|challenge/i, 'labs'],
  [/\bdatasets?\b/i, 'datasets'],
  [/\bfeeds?\b/i, 'feeds'],
  [/\bvideos?\b/i, 'video'],
  [/\bbooks?\b/i, 'books'],
  [/\brepositor(?:y|ies)\b/i, 'repositories'],
];
for (const source of dataset.sources) {
  const formats = (source.content_formats || []).join(' ');
  for (const [pattern, tag] of formatTagRules) {
    if (pattern.test(formats) && allowedTags.has(tag) && !source.tags.includes(tag)) {
      errors.push(`${source.id}: missing format-derived tag ${tag}`);
    }
  }
}

if (index.source_count !== dataset.sources.length) errors.push('index source count differs from dataset');
if (Object.keys(index.by_id).length !== dataset.sources.length) errors.push('by_id index is incomplete');
for (const source of dataset.sources) {
  if (!index.by_id[source.id]) errors.push(`${source.id}: absent from by_id index`);
  else if (index.by_id[source.id].summary !== source.summary) errors.push(`${source.id}: stale summary in by_id index`);
  for (const tag of source.tags || []) if (!index.tags[tag]?.includes(source.id)) errors.push(`${source.id}: absent from tag index ${tag}`);
  for (const keyword of source.keywords || []) if (!index.keywords[keyword]?.includes(source.id)) errors.push(`${source.id}: absent from keyword index ${keyword}`);
  for (const category of [source.category, ...(source.secondary_categories || [])]) if (!index.categories[category]?.includes(source.id)) errors.push(`${source.id}: absent from category index ${category}`);
  for (const audience of source.audience || []) if (!index.audiences[audience]?.includes(source.id)) errors.push(`${source.id}: absent from audience index ${audience}`);
  for (const level of source.skill_levels || []) if (!index.skill_levels[level]?.includes(source.id)) errors.push(`${source.id}: absent from skill index ${level}`);
  if (!index.evidence_use[source.assessment.evidence_use]?.includes(source.id)) errors.push(`${source.id}: absent from evidence-use index`);
  if (!index.access[source.access]?.includes(source.id)) errors.push(`${source.id}: absent from access index`);
  if (!index.quality_tiers[source.quality.tier]?.includes(source.id)) errors.push(`${source.id}: absent from quality-tier index`);
}
const sourceById = new Map(dataset.sources.map(source => [source.id, source]));
const inverseRules = {
  tags: source => source.tags || [],
  keywords: source => source.keywords || [],
  categories: source => [source.category, ...(source.secondary_categories || [])],
  organizations: source => [source.organization],
  audiences: source => source.audience || [],
  skill_levels: source => source.skill_levels || [],
  evidence_use: source => [source.assessment.evidence_use],
  maintenance: source => [source.assessment.maintenance],
  source_kinds: source => [source.source_kind],
  access: source => [source.access],
  quality_tiers: source => [source.quality.tier]
};
for (const [indexName, selector] of Object.entries(inverseRules)) {
  for (const [value, indexedIds] of Object.entries(index[indexName] || {})) {
    for (const id of indexedIds) {
      if (!sourceById.has(id)) errors.push(`${indexName}.${value}: unknown indexed id ${id}`);
      else if (!selector(sourceById.get(id)).includes(value)) errors.push(`${indexName}.${value}: stale membership ${id}`);
    }
  }
}
const markdownAnchors = new Set([...markdown.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1]));
const markdownTargets = [...markdown.matchAll(/\]\(#([^)]+)\)/g)].map(match => match[1]);
for (const source of dataset.sources) {
  if (!markdownAnchors.has(source.id)) errors.push(`${source.id}: missing Markdown source anchor`);
  if (!markdown.includes(`| [${source.name}](#${source.id}) |`)) errors.push(`${source.id}: missing Markdown quick-index row`);
}
for (const category of Object.keys(index.categories)) if (!markdownAnchors.has(`category-${category}`)) errors.push(`missing Markdown category anchor ${category}`);
for (const tag of Object.keys(index.tags)) if (!markdownAnchors.has(`tag-${tag}`)) errors.push(`missing Markdown tag anchor ${tag}`);
for (const target of markdownTargets) if (!markdownAnchors.has(target)) errors.push(`broken Markdown target ${target}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  sources: dataset.sources.length,
  urls: urls.size,
  tags: Object.keys(index.tags).length,
  categories: Object.keys(index.categories).length,
  crosslinks: dataset.sources.reduce((sum, source) => sum + source.related_source_ids.length, 0)
}));
