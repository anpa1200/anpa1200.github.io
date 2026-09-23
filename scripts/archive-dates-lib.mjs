// Clean article URLs carry no publication date. The pinned archive catalog is
// the authority; do not substitute the current build or verification date.
function isoDate(value) {
  if (typeof value !== 'string') return '';
  const date = value.match(/^\d{4}-\d{2}-\d{2}(?=$|T)/)?.[0];
  if (!date || Number.isNaN(Date.parse(date))) return '';
  return new Date(date).toISOString().slice(0, 10) === date ? date : '';
}

export function archiveDatesForUrl(canonical, catalog) {
  const empty = { published: '', modified: '' };
  let url;
  try { url = new URL(canonical); } catch { return empty; }
  if (url.origin !== 'https://1200km.com' || !url.pathname.startsWith('/articles/read/')) return empty;
  const identity = url.origin + url.pathname.replace(/\/$/, '');
  const row = catalog.find(item => item.canonical_url?.replace(/\/$/, '') === identity);
  if (!row) return empty;
  const published = isoDate(row.published_at);
  const updated = isoDate(row.updated_at);
  return { published, modified: updated && (!published || updated >= published) ? updated : published };
}
