export const TERMINAL_CLASSIFICATIONS = new Set(['dead', 'redirect-loop', 'malformed']);

export function classifyProbe({ status = 0, error = '' } = {}) {
  if (status >= 200 && status < 400) return 'healthy';
  if (status === 403 || status === 429) return 'blocked';
  if (status === 404 || status === 410) return 'dead';
  if (/redirect|too many|maximum.*redirect/i.test(error)) return 'redirect-loop';
  if (/invalid url|malformed/i.test(error)) return 'malformed';
  return 'transient';
}

export function allowlistMatch(url, entries = []) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  return entries.find((entry) => {
    const host = String(entry.host || '').toLowerCase();
    return hostname === host || (entry.include_subdomains && hostname.endsWith(`.${host}`));
  }) || null;
}

export function updateLinkState(url, probe, previous = {}, checkedAt = new Date().toISOString()) {
  const classification = classifyProbe(probe);
  const terminal = TERMINAL_CLASSIFICATIONS.has(classification);
  const previousTerminal = TERMINAL_CLASSIFICATIONS.has(previous.classification);
  const consecutiveTerminalFailures = terminal
    ? (previousTerminal ? Number(previous.consecutive_terminal_failures || 1) + 1 : 1)
    : 0;
  return {
    url,
    status: Number(probe.status || 0),
    method: probe.method || null,
    classification,
    error: probe.error || null,
    checked_at: checkedAt,
    consecutive_terminal_failures: consecutiveTerminalFailures,
  };
}

export function stableTerminalFailures(records) {
  return records.filter((record) => (
    TERMINAL_CLASSIFICATIONS.has(record.classification)
    && record.consecutive_terminal_failures >= 2
  ));
}
