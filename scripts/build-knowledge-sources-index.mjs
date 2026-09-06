import fs from 'node:fs';

const datasetPath = 'data/knowledge-sources.json';
const outputPath = 'data/knowledge-sources-index.json';
const checkMode = process.argv.includes('--check');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

const sortObjectArrays = map => Object.fromEntries(
  [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ids]) => [key, [...new Set(ids)].sort()])
);
const indexBy = selector => {
  const map = new Map();
  for (const source of dataset.sources) {
    for (const value of selector(source)) {
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(source.id);
    }
  }
  return sortObjectArrays(map);
};

const index = {
  schema_version: 1,
  generated_on: dataset.generated_on,
  source_count: dataset.sources.length,
  by_id: Object.fromEntries(dataset.sources.map(source => [source.id, {
    name: source.name,
    url: source.url,
    category: source.category,
    summary: source.summary,
    tags: source.tags || []
  }])),
  categories: indexBy(source => [source.category, ...(source.secondary_categories || [])]),
  organizations: indexBy(source => [source.organization]),
  tags: indexBy(source => source.tags || []),
  keywords: indexBy(source => source.keywords || []),
  audiences: indexBy(source => source.audience || []),
  skill_levels: indexBy(source => source.skill_levels || []),
  evidence_use: indexBy(source => source.assessment?.evidence_use ? [source.assessment.evidence_use] : []),
  maintenance: indexBy(source => source.assessment?.maintenance ? [source.assessment.maintenance] : []),
  source_kinds: indexBy(source => [source.source_kind]),
  access: indexBy(source => [source.access]),
  quality_tiers: indexBy(source => [source.quality.tier])
};

const serialized = `${JSON.stringify(index, null, 2)}\n`;
if (checkMode) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== serialized) {
    throw new Error(`${outputPath} is stale; run npm run build-knowledge-sources.`);
  }
  console.log(`Validated ${outputPath}: ${Object.keys(index.tags).length} tags across ${index.source_count} sources`);
} else {
  fs.writeFileSync(outputPath, serialized);
  console.log(`Wrote ${outputPath}: ${Object.keys(index.tags).length} tags across ${index.source_count} sources`);
}
