import fs from 'node:fs';

const input = 'data/knowledge-sources.json';
const output = 'data/knowledge-sources.md';
const checkMode = process.argv.includes('--check');
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const sources = [...data.sources].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
const byId = new Map(sources.map(source => [source.id, source]));
const groupBy = (items, selector) => items.reduce((map, item) => {
  const key = selector(item);
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(item);
  return map;
}, new Map());
const groups = groupBy(sources, source => source.category);
const titleOverrides = new Map([
  ['ai', 'AI'], ['api', 'API'], ['cti', 'CTI'], ['dfir', 'DFIR'], ['soc', 'SOC'],
  ['nist', 'NIST'], ['mitre', 'MITRE'], ['owasp', 'OWASP']
]);
const display = value => String(value || 'not-specified').split('-').map(word => titleOverrides.get(word.toLowerCase()) || `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
const list = values => values.map(value => display(value)).join(', ');
const linkToSource = id => byId.has(id) ? `[${byId.get(id).name}](#${id})` : id;
const escapeTableCell = value => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\|/g, '\\|')
  .replace(/\r?\n/g, ' ');
const tagMap = new Map();
for (const source of sources) for (const tag of source.tags || []) {
  if (!tagMap.has(tag)) tagMap.set(tag, []);
  tagMap.get(tag).push(source);
}

const lines = [
  '# Cybersecurity Knowledge Sources', '',
  'A reviewed and deduplicated inventory of authoritative cybersecurity references, operational resources, research portals, tools, datasets, and learning platforms. Use the assessment on each entry to understand what the source can support—and what it cannot.', '',
  `- Assessment date: ${data.generated_on}`,
  `- Unique sources: ${sources.length}`,
  `- Unique canonical URLs: ${new Set(sources.map(source => source.url)).size}`,
  `- Directly reachable: ${data.validation_summary?.reachable ?? 0}`,
  `- Automated-access restricted: ${data.validation_summary?.['access-restricted'] ?? 0}`,
  `- Categories: ${groups.size}`,
  `- Tags: ${tagMap.size}`, '',
  '> Quality note: URL availability is not the same as factual authority. Scores combine authority, originality, maintenance, practical value, and transparency. Tier A covers 90–100, Tier B covers 80–89, and Tier C covers 70–79. Every rating applies only within the source’s stated scope.', '',
  '## Category index', '', '| Category | Sources |', '|---|---:|',
  ...[...groups].map(([category, entries]) => `| [${display(category)}](#category-${category}) | ${entries.length} |`), '',
  '## Tag index', '', '| Tag | Sources |', '|---|---:|',
  ...[...tagMap].sort(([a], [b]) => a.localeCompare(b)).map(([tag, entries]) => `| [${tag}](#tag-${tag}) | ${entries.length} |`), '',
  '## Source index', ''
];

for (const [category, entries] of groups) {
  lines.push(`### ${display(category)}`, '', entries.map(source => `[${source.name}](#${source.id})`).join(' · '), '');
}

lines.push('## Quick source index', '', '| Source | Category | Summary |', '|---|---|---|');
for (const source of [...sources].sort((a, b) => a.name.localeCompare(b.name))) {
  lines.push(`| [${source.name}](#${source.id}) | ${display(source.category)} | ${escapeTableCell(source.summary)} |`);
}
lines.push('');

lines.push('## Detailed assessments', '');
for (const [category, entries] of groups) {
  lines.push(`<a id="category-${category}"></a>`, `## ${display(category)}`, '');
  for (const source of entries) {
    const validation = source.validation || {};
    const status = validation.status === 'reachable'
      ? `Reachable (HTTP ${validation.http_status})`
      : validation.status === 'access-restricted'
        ? `Canonical URL; automated access restricted (HTTP ${validation.http_status})`
        : display(validation.status);
    lines.push(
      `<a id="${source.id}"></a>`, `### ${source.name}`, '',
      '**Detailed description**', '', source.description, '',
      `**Assessment:** ${source.quality.rationale}`, '',
      '**Strengths**', '', ...source.assessment.strengths.map(value => `- ${value}`), '',
      '**Limitations**', '', ...source.assessment.limitations.map(value => `- ${value}`), '',
      `**Best for:** ${source.assessment.best_for.join('; ')}.`, '',
      `- Organization: ${source.organization}`,
      `- Canonical source: [${source.url}](${source.url})`,
      `- Quality: Tier ${source.quality.tier} (${source.quality.score}/100)`,
      `- Quality dimensions: authority ${source.quality.dimensions.authority}/5; originality ${source.quality.dimensions.originality}/5; maintenance ${source.quality.dimensions.maintenance}/5; practical value ${source.quality.dimensions.practical_value}/5; transparency ${source.quality.dimensions.transparency}/5`,
      `- Evidence use: ${display(source.assessment.evidence_use)}`,
      `- Maintenance: ${display(source.assessment.maintenance)}`,
      `- Source type: ${display(source.source_kind)}`,
      `- Access: ${display(source.access)}`,
      `- Audience: ${list(source.audience)}`,
      `- Skill levels: ${list(source.skill_levels)}`,
      `- Formats: ${source.content_formats.join(', ')}`,
      `- Tags: ${source.tags.map(tag => '[`' + tag + '`](#tag-' + tag + ')').join(' ')}`,
      `- Keywords: ${source.keywords.map(keyword => `\`${keyword}\``).join(' ')}`,
      `- Related sources: ${source.related_source_ids.map(linkToSource).join(' · ')}`,
      `- Research provenance: ${source.provenance.map(display).join(', ')}`,
      `- URL validation: ${status}`,
      `- Checked: ${validation.checked_on || data.generated_on}`
    );
    if (source.caution) lines.push(`- Safety note: ${source.caution}`);
    lines.push('');
  }
}

lines.push('## Tags', '');
for (const [tag, entries] of [...tagMap].sort(([a], [b]) => a.localeCompare(b))) {
  lines.push(`<a id="tag-${tag}"></a>`, `### ${tag}`, '', entries.map(source => `[${source.name}](#${source.id})`).join(' · '), '');
}
lines.push('## Scope limitation', '', data.scope_note, '', 'The machine-readable source of truth is [`knowledge-sources.json`](./knowledge-sources.json), with lookup indexes in [`knowledge-sources-index.json`](./knowledge-sources-index.json).', '');

const serialized = lines.join('\n');
if (checkMode) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== serialized) {
    throw new Error(`${output} is stale; run npm run build-knowledge-sources.`);
  }
  console.log(`Validated ${output} with ${sources.length} sources, ${groups.size} categories, and ${tagMap.size} tags`);
} else {
  fs.writeFileSync(output, serialized);
  console.log(`Wrote ${output} with ${sources.length} sources, ${groups.size} categories, and ${tagMap.size} tags`);
}
