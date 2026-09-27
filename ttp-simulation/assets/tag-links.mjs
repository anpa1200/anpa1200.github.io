// One deterministic URL for each navigation facet; no fuzzy entity matching.
export const tagSlug = (value) => encodeURIComponent(String(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unspecified');
export const tagPath = (facet, value) => `tags/${facet}/${tagSlug(value)}/`;
export function tagLinks(values, facet, { escape, url }) {
  return values.filter((value) => value && value !== 'None').map((value) => `<a class="chip" href="${url(tagPath(facet, value))}">${escape(value)}</a>`).join('');
}
