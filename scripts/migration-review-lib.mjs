import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { sha256, withoutBuildIdentity } from './hosting-parity-lib.mjs';

export function comparisonHash(body, contentType) {
  return sha256(contentType?.startsWith('text/html') ? withoutBuildIdentity(body.toString()) : body);
}

export function validateMigrationReview(review) {
  assert.equal(review.schema_version, 1);
  assert.match(review.rollback_identity?.site_commit || '', /^[a-f0-9]{40}$/);
  assert.match(review.rollback_identity?.artifact_digest || '', /^sha256:[a-f0-9]{64}$/);
  assert.ok(Array.isArray(review.approved_changes));
  const keys = new Set();
  for (const entry of review.approved_changes) {
    assert.ok(typeof entry.path === 'string' && /^(?:GET|HEAD) \//.test(entry.path));
    assert.ok(typeof entry.check === 'string' && typeof entry.reason === 'string' && entry.reason.length >= 20);
    assert.ok(Object.hasOwn(entry, 'production') && Object.hasOwn(entry, 'preview'));
    const key = `${entry.path}\0${entry.check}`;
    assert.ok(!keys.has(key), `Duplicate reviewed difference: ${entry.path} ${entry.check}`);
    keys.add(key);
  }
  return review;
}

export function applyMigrationReview(report, review) {
  validateMigrationReview(review);
  // Exceptions apply only against this exact frozen rollback release. They
  // cannot suppress a difference from a newer or unexpectedly changed origin.
  assert.deepEqual(report.production_before, review.rollback_identity, 'Rollback baseline changed; migration review is stale');
  assert.equal(report.production_unchanged, true, 'Production changed during comparison');
  let applied = 0;
  for (const difference of report.production_differences) {
    if (difference.classification !== 'cutover-blocker') continue;
    const before = difference.comparison?.production ?? difference.production;
    const after = difference.comparison?.preview ?? difference.preview;
    const approved = review.approved_changes.find((entry) => entry.path === difference.path && entry.check === difference.check
      && isDeepStrictEqual(entry.production, before) && isDeepStrictEqual(entry.preview, after));
    if (!approved) continue;
    difference.classification = 'reviewed-migration-difference';
    difference.review_reason = approved.reason;
    applied++;
  }
  return applied;
}
