import {readFileSync} from 'node:fs';
export const anomalyTaxonomy = JSON.parse(readFileSync(new URL('../data/anomaly-taxonomy.json', import.meta.url)));
export const anomalyAssignments = JSON.parse(readFileSync(new URL('../data/anomaly-tag-assignments.json', import.meta.url))).assignments;
const byUrl = new Map(anomalyAssignments.map(row => [anomalyUrlKey(row.url), row.evidence.map(item => item.tag)]));
export function anomalyUrlKey(value) {
  try {
    const url = new URL(value, 'https://1200km.com/');
    if (url.origin !== 'https://1200km.com') return '';
    return url.origin + url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  } catch { return ''; }
}
export function anomalyTagsForUrl(url) { return byUrl.get(anomalyUrlKey(url)) || []; }
export function withAnomalyTags(item) {
  const reviewed = [item.canonical_url, ...(item.alternate_urls || [])].flatMap(anomalyTagsForUrl);
  return {...item, tags: [...new Set([...(item.tags || []).filter(tag => !tag.startsWith('anomaly-')), ...reviewed])]};
}
export function anomalySearchHref(id) {
  if (!anomalyTaxonomy.tags.some(tag => tag.id === id)) throw Error('Unknown anomaly tag');
  return '/search.html?f.anomaly=' + encodeURIComponent(id);
}
