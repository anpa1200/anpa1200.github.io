export function citationArtifacts(text) {
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '').replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '').replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '').replace(/`[^`\n]+`/g, '');
  return [...prose.matchAll(/【[^】\n]*†[^】\n]*】|(?:cite|filecite)[^\n]*/g)].map(m => m[0]);
}
export function validateMapping(mapping, manifest) {
  if (mapping.framework !== manifest.framework || mapping.release !== manifest.release || mapping.domain !== manifest.domain) throw Error('Framework/domain/release mismatch');
  const row = manifest.records.find(r => r.id === mapping.id);
  if (!row) throw Error('Unknown identifier: ' + mapping.id);
  if (row.revoked || row.deprecated) throw Error('Retired identifier: ' + mapping.id);
  if (row.name !== mapping.name) throw Error('Technique label mismatch: ' + mapping.id);
  if (!mapping.evidence_url || !mapping.review_boundary) throw Error('Procedure evidence/review boundary required');
  return true;
}
