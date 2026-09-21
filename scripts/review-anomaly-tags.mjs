#!/usr/bin/env node
// Authoring step: compile explicit editorial decisions, never auto-approve regex hits.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const report = join(root, 'reports/anomaly-review-20260921');
const read = path => JSON.parse(readFileSync(path));
const candidateBytes = readFileSync(join(report, 'tag-candidates.json'));
assert.equal(createHash('sha256').update(candidateBytes).digest('hex'), '25a4b73cc7bb3e6ee19ae5152eb32976ea9c32a71366c3334d945a8cd0ae4ad3', 'Candidate order changed; re-review, do not reuse numerical decisions');
const {candidates} = JSON.parse(candidateBytes);
const decisions = read(join(report, 'review-decisions.json'));
const inventory = read(join(report, 'corpus-inventory.json'));
const taxonomy = read(join(root, 'data/anomaly-taxonomy.json'));
const knownTags = new Set(taxonomy.tags.map(tag => tag.id));
const assignments = [];
const reviews = [];
for (const [index, row] of candidates.entries()) {
  assert.ok(decisions.approved[index] || decisions.rejection_reasons[index], `No decision: ${index}`);
  const codes = (decisions.approved[index] || '').split(' ').filter(Boolean);
  const record = inventory.records.find(item => item.url === row.url);
  const full = readFileSync(join(inventory.cache_root, record.cache_file), 'utf8').replace(/\s+/g, ' ');
  const evidence = codes.map(code => {
    const tag = `anomaly-${decisions.aliases[code]}`;
    assert.ok(knownTags.has(tag), `Unknown tag ${code}`);
    const match = row.matches.find(item => item.tag === tag);
    const override = decisions.evidence_overrides[`${index}:${code}`] || (code === 'M' ? decisions.composition_evidence[index] : null);
    let excerpt;
    if (override) {
      const start = full.toLowerCase().indexOf(override.toLowerCase());
      assert.ok(start >= 0, `Missing override ${index}:${code}`);
      excerpt = full.slice(Math.max(0, start-120), start+650);
    } else {
      assert.ok(match, `No reviewed evidence ${index}:${code}`);
      // Prefer a substantive passage to a heading or table of contents.
      excerpt = [...match.evidence].reverse().find(value => value.length > 100 && !/\*\*Detection Methods\*\*/.test(value)) || match.evidence[0];
      if (excerpt.length < 100) {
        const start = full.indexOf(excerpt);
        if (start >= 0) excerpt = full.slice(start, start+750);
      }
    }
    assert.ok(full.includes(excerpt), `Evidence not in captured source: ${row.url} ${tag}`);
    return {tag, excerpt};
  });
  const rejected = row.matches.filter(match => !evidence.some(item => item.tag === match.tag)).map(match => match.tag);
  reviews.push({url: row.url, disposition: evidence.length ? 'topic-reviewed-tagged' : 'topic-reviewed-rejected', approved: evidence.map(item => item.tag), rejected, reason: decisions.rejection_reasons[index] || 'Keep only analytically relevant matches; remaining hits are incidental, navigation-only or insufficiently specific.'});
  if (evidence.length) assignments.push({url: row.url, title: row.title, archive_id: row.archive_id, source_sha256: row.source_sha256, reviewed_at: taxonomy.reviewed_at, evidence});
}
for (const row of inventory.records) {
  if (!reviews.some(review => review.url === row.url)) reviews.push({url: row.url, disposition: row.status === 'read' ? 'scanned-no-candidate' : 'unread', approved: [], rejected: [], reason: 'No match under conservative candidate rules; this is not proof of irrelevance or a factual review.'});
}
const document = {schema_version: 1, reviewed_at: taxonomy.reviewed_at, policy: decisions.policy, assignments};
writeFileSync(join(root, 'data/anomaly-tag-assignments.json'), JSON.stringify(document, null, 2)+'\n');
writeFileSync(join(report, 'page-dispositions.json'), JSON.stringify({scope: inventory.scope, reviews: reviews.sort((a,b)=>a.url.localeCompare(b.url))}, null, 2)+'\n');
console.log(`Reviewed ${candidates.length} candidates; ${assignments.length} tagged pages, ${assignments.reduce((sum,row)=>sum+row.evidence.length,0)} mappings; ${reviews.length} page dispositions.`);
