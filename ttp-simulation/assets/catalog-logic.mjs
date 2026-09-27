export const classificationLabels = {
  can_simulate: 'Can simulate · documented procedure',
  cannot_simulate_yet: 'Cannot simulate yet · support gap',
};

export function filterRecords(records, filters = {}) {
  const terms = (filters.q || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return records.filter((row) => {
    if (filters.domain && row.domain !== filters.domain) return false;
    if (filters.classification && row.classification !== filters.classification) return false;
    if (filters.level && row.level !== filters.level) return false;
    if (filters.visibility && row.visibility !== filters.visibility) return false;
    if (filters.detection && row.detection_status !== filters.detection) return false;
    for (const [filter, field] of [['environment', 'environments'], ['platform', 'platforms'], ['tactic', 'tactics'], ['telemetry', 'telemetry_tags'], ['tool', 'tool_tags'], ['anomaly', 'anomaly_tags']]) {
      if (filters[filter] && !(row[field] || []).includes(filters[filter])) return false;
    }
    const haystack = [row.id, row.name, row.domain, ...row.tactics, ...row.platforms, ...row.telemetry_tags, ...row.environments, ...(row.tool_tags || []), ...(row.anomaly_tags || []), ...(row.tool_references || []).map((t) => t.id)].join(' ').toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
  }).sort((a, b) => {
    if (filters.sort === 'candidates') return b.candidate_count - a.candidate_count || a.id.localeCompare(b.id);
    if (filters.sort === 'name') return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    if (filters.sort === 'feasibility') return a.classification.localeCompare(b.classification) || a.id.localeCompare(b.id);
    return a.id.localeCompare(b.id) || a.domain.localeCompare(b.domain);
  });
}

export function csvCell(value) {
  let text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; // spreadsheet formula hardening
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCsv(records) {
  const fields = ['id', 'name', 'domain', 'level', 'classification', 'environments', 'platforms', 'tactics', 'telemetry_tags', 'tool_tags', 'detection_status', 'anomaly_tags', 'candidate_count', 'implementation'];
  return [fields.map(csvCell).join(','), ...records.map((row) => fields.map((key) => csvCell(row[key])).join(','))].join('\r\n');
}

export function pageSlice(records, page, pageSize = 40) {
  const pages = Math.max(1, Math.ceil(records.length / pageSize));
  const current = Math.max(1, Math.min(Number.isFinite(page) ? Math.floor(page) : 1, pages));
  return { records: records.slice((current - 1) * pageSize, current * pageSize), page: current, pages };
}
