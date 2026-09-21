#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {anomalyTaxonomy, anomalyAssignments, anomalyTagsForUrl, anomalySearchHref} from './anomaly-tags-lib.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = process.argv.includes('--check');
const labels = new Map(anomalyTaxonomy.tags.map(tag => [tag.id, tag.label]));
function output(path, content) {
  const old = readFileSync(path, 'utf8');
  if (check) { if (old !== content) throw Error(`Stale anomaly tags: ${path}`); }
  else if (old !== content) writeFileSync(path, content);
}
const payload = {schema_version: 1, reviewed_at: anomalyTaxonomy.reviewed_at, article_url: anomalyTaxonomy.article_url, policy: 'Navigation topics, not independently validated incidents or detection coverage.', tags: anomalyTaxonomy.tags, pages: Object.fromEntries(anomalyAssignments.map(row => [new URL(row.url).pathname, row.evidence.map(item => item.tag)]))};
const publicPath = resolve(root, 'data/anomaly-tags.json');
if (check) output(publicPath, JSON.stringify(payload)+'\n'); else writeFileSync(publicPath, JSON.stringify(payload)+'\n');
const path = resolve(root, 'guides.html');
const old = readFileSync(path, 'utf8');
const html = old.replace(/(<div class="guide-item"[\s\S]*?)(?=<div class="guide-item"|$)/g, block => {
  const href = block.match(/class="guide-title"\s+href="([^"]+)"/)?.[1];
  if (!href) return block;
  block = block.replace(/<!-- anomaly-card-tags:start -->[\s\S]*?<!-- anomaly-card-tags:end -->/g, '');
  const tags = anomalyTagsForUrl(href);
  if (!tags.length) return block;
  const markup = tags.map(id => `<span class="guide-tag"><a href="${anomalySearchHref(id)}">${labels.get(id)}</a></span>`).join('');
  return block.replace(/(<div class="guide-tags">[\s\S]*?)(<\/div>)/, `$1<!-- anomaly-card-tags:start -->${markup}<!-- anomaly-card-tags:end -->$2`);
});
output(path, html);
const archiveArg = process.argv.indexOf('--archive');
if (archiveArg >= 0) {
  const archive = resolve(process.argv[archiveArg+1]);
  const audit = readFileSync(resolve(root, 'reports/anomaly-review-20260921/research-fact-audit.md'), 'utf8');
  const auditPath = resolve(archive, 'static/research/anomaly-fact-audit.md');
  if (check) output(auditPath, audit); else writeFileSync(auditPath, audit);
  for (const name of ['article-catalog.json', 'trainsec-catalog.json']) {
    const path = resolve(archive, 'src/data', name);
    const catalog = JSON.parse(readFileSync(path));
    for (const row of catalog) {
      const url = name.startsWith('trainsec') ? `https://1200km.com/articles/${row.local_path}` : `https://1200km.com/articles/read/${row.local_path}/`;
      row.tags = [...new Set([...(row.tags || []).filter(tag => !tag.startsWith('Anomaly: ')), ...anomalyTagsForUrl(url).map(id => labels.get(id))])];
    }
    output(path, JSON.stringify(catalog, null, 2)+'\n');
  }
}
console.log(`Anomaly navigation current: ${anomalyTaxonomy.tags.length} tags, ${anomalyAssignments.length} reviewed pages.`);
