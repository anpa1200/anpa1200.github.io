import { isIP } from 'node:net';

export const TERMINAL_CLASSIFICATIONS = new Set(['dead', 'redirect-loop', 'malformed']);

export function isNonPublicIpAddress(address) {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(ip) === 6) {
    return ip === '::' || ip === '::1' || ip.startsWith('::ffff:')
      || /^f[cd][0-9a-f]{2}:/.test(ip) || /^fe[89ab][0-9a-f]:/.test(ip)
      || /^ff[0-9a-f]{2}:/.test(ip) || /^2001:0?db8:/.test(ip);
  }
  if (isIP(ip) !== 4) return false;
  const [a, b, c] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2)))
    || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    || (a === 203 && b === 0 && c === 113);
}

export function isNonPublicLinkTarget(value) {
  let url;
  try { url = value instanceof URL ? value : new URL(value); }
  catch { return true; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return true;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' || /\.(?:localhost|local|internal|test|invalid)$/.test(host)
    || isNonPublicIpAddress(host);
}

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
