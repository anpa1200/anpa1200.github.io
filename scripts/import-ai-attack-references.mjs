#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const input = resolve(option(
  '--input',
  join(ROOT, '..', 'AI_Attack_statistics', 'dataset', 'publications.jsonl'),
));
const output = resolve(option('--output', join(ROOT, 'data', 'reference-library.json')));

const TYPE_LABELS = {
  actor_motivation: 'Actor motivation',
  ai_technology: 'AI technology',
  ai_use_case: 'AI use case',
  attack_vector: 'Attack vector',
  campaign: 'Campaign',
  country_or_region: 'Country or region',
  cve: 'CVE',
  data_type: 'Data type',
  evidence_landscape: 'Evidence landscape',
  impact: 'Impact',
  infrastructure: 'Infrastructure',
  kill_chain_phase: 'Kill Chain phase',
  llm_model: 'LLM model',
  llm_provider: 'LLM provider',
  malicious_ai_tool: 'Malicious AI tool',
  malware_or_tool: 'Malware or tool',
  mitre_attack_id: 'MITRE ATT&CK ID',
  mitre_tactic: 'MITRE tactic',
  sector: 'Sector',
  target: 'Target',
  threat_group: 'Threat group',
  threat_group_identifier: 'Threat-group identifier',
  ttp: 'TTP',
};

const SOURCE_TYPE_LABELS = {
  empirical_or_academic: 'academic or empirical research',
  forecast_or_assessment: 'forecast or strategic assessment',
  government_or_law_enforcement: 'government or law-enforcement publication',
  operational_cti: 'operational CTI publication',
  other: 'research publication',
  provider_or_government_report: 'provider or government report',
  vendor_threat_report: 'threat-research report',
};

function slug(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9.+/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sentenceList(values) {
  if (values.length < 2) return values[0] || '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function description(row) {
  const topics = [
    ...(row.tags.ai_use_case || []),
    ...(row.tags.ttp || []),
    ...(row.tags.ai_technology || []),
  ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);
  const sourceType = SOURCE_TYPE_LABELS[row.source_type] || 'research publication';
  const focus = topics.length
    ? ` covering ${sentenceList(topics)}`
    : ' on AI and cybersecurity';
  const context = [
    ...(row.tags.threat_group || []).slice(0, 1),
    ...(row.tags.sector || []).slice(0, 1),
    ...(row.tags.llm_provider || []).slice(0, 1),
  ].filter((value, index, values) => values.indexOf(value) === index);
  const suffix = context.length ? ` Indexed with ${sentenceList(context)} context.` : '';
  return `${row.publisher} ${sourceType}${focus}.${suffix}`.replace(/\.\s*\./g, '.').slice(0, 300);
}

function tag(facet, value, type) {
  return {
    facet,
    type,
    value: String(value),
    key: `${type.replaceAll('_', '-')}:${slug(value)}`,
  };
}

function values(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean);
}

function titleCase(value) {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function record(row) {
  const tags = [
    tag('Publisher', row.publisher, 'publisher'),
    tag('Publisher domain', row.publisher_domain, 'publisher_domain'),
    tag('Source type', SOURCE_TYPE_LABELS[row.source_type] || row.source_type, 'source_type'),
    tag('Inclusion', row.analysis_inclusion === 'context_only' ? 'Context only' : 'Core AI-attack research', 'inclusion'),
    tag('AI relevance', row.ai_relevance, 'ai_relevance'),
    tag('Statistical use', row.statistical_use, 'statistical_use'),
    tag('Retrieval method', titleCase(row.retrieval_methods), 'retrieval_method'),
    tag('Publication date precision', titleCase(row.publication_date_precision), 'publication_date_precision'),
    tag('Publication date method', titleCase(row.publication_date_method), 'publication_date_method'),
    tag('Relevance basis', row.relevance_basis, 'relevance_basis'),
    tag('Evidence quality', titleCase(row.content_quality), 'content_quality'),
    tag('Review requirement', row.manual_review_required === 'yes' ? 'Manual review required' : 'No manual review required', 'review_requirement'),
    ...(row.publication_year ? [tag('Year', row.publication_year, 'year')] : [tag('Year', 'Unknown', 'year')]),
    ...(row.duplicate_group ? [tag('Duplicate lineage', row.duplicate_group, 'duplicate_group')] : []),
    ...values(row.companion_source_ids).map((value) => tag('Companion source', value, 'source_lineage')),
    ...(row.metric_count ? [tag('Evidence inventory', 'Contains extracted metrics', 'evidence_inventory')] : []),
    ...(row.ioc_count ? [tag('Evidence inventory', 'Contains extracted IOCs', 'evidence_inventory')] : []),
  ];
  for (const [type, values] of Object.entries(row.tags || {})) {
    const facet = TYPE_LABELS[type];
    if (!facet) throw new Error(`${row.publication_id}: unsupported tag type ${type}`);
    for (const value of values) tags.push(tag(facet, value, type));
  }
  for (const indicator of row.iocs || []) {
    const kind = titleCase(indicator.ioc_type);
    tags.push(tag(`IOC · ${kind}`, indicator.value, 'ioc'));
  }
  for (const metric of row.metrics || []) {
    const confidence = metric.confidence ? ` · ${metric.confidence} confidence` : '';
    tags.push(tag(`Extracted metric · ${titleCase(metric.metric_type)}`, `${metric.raw_value}${confidence}`, 'metric'));
  }
  const unique = [...new Map(tags.map((item) => [item.key, item])).values()]
    .sort((left, right) => left.facet.localeCompare(right.facet) || left.value.localeCompare(right.value));
  return {
    id: `ai-attack-reference:${row.publication_id}`,
    title: row.title.trim(),
    description: description(row),
    url: row.primary_url,
    publisher: row.publisher,
    published_at: row.publication_date || null,
    inclusion: row.analysis_inclusion === 'context_only' ? 'context' : 'core',
    tags: unique,
  };
}

const lines = (await readFile(input, 'utf8')).split(/\r?\n/).filter(Boolean);
const source = lines.map((line, index) => {
  try {
    return JSON.parse(line);
  } catch (error) {
    throw new Error(`${input}:${index + 1}: ${error.message}`);
  }
});
const included = source.filter((row) => ['include_with_manual_validation', 'context_only'].includes(row.analysis_inclusion));
const records = included.map(record).sort((left, right) => {
  const dateOrder = String(right.published_at || '').localeCompare(String(left.published_at || ''));
  return dateOrder || left.title.localeCompare(right.title);
});
const urls = new Set(records.map((item) => item.url.replace(/\/$/, '')));
if (records.length !== 111 || urls.size !== records.length) {
  throw new Error(`Expected 111 unique usable references; found ${records.length} records and ${urls.size} URLs.`);
}

const tagKeys = new Set(records.flatMap((item) => item.tags.map((itemTag) => itemTag.key)));
const tagAssignments = records.reduce((count, item) => count + item.tags.length, 0);
const payload = {
  $schema: './reference-library.schema.json',
  schema_version: 1,
  generated_at: '2026-08-29',
  title: 'AI Usage in Cyberattacks Reference Library',
  description: 'Deduplicated CTI, IR, government, provider, academic, and threat-research references about AI use in cyberattacks.',
  evidence_boundary: 'Tags, IOCs, and metrics are machine-extracted discovery metadata. A value or co-occurrence does not prove malicious use, attribution, exploitation, causality, prevalence, or current indicator validity.',
  source_dataset: 'AI_Attack_statistics/dataset/publications.jsonl',
  record_count: records.length,
  core_count: records.filter((item) => item.inclusion === 'core').length,
  context_count: records.filter((item) => item.inclusion === 'context').length,
  unique_tag_count: tagKeys.size,
  tag_assignment_count: tagAssignments,
  records,
};
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${records.length} references with ${tagAssignments} tag assignments and ${tagKeys.size} unique tags to ${output}.`);
