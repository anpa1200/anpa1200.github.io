// Shared article lifecycle policy for the pinned Docusaurus archive.
// The same rules classify an article from its archive source (before the
// Docusaurus build, so the notice is rendered inside the article by React)
// and verify the built page against the deployable content catalogue.

export const LIFECYCLE_MESSAGES = Object.freeze({
  historical: {
    label: 'Historical version',
    admonition: 'caution',
    text: 'This article documents an earlier product version or a time-bound state. It is retained for provenance and is not current product guidance.',
  },
  preserved: {
    label: 'Preserved article',
    admonition: 'caution',
    text: 'This older publication is retained for research history. Current technical applicability has not been asserted; validate versions, commands, and assumptions before use.',
  },
  'currentness-unknown': {
    label: 'Currentness not reverified',
    admonition: 'info',
    text: 'This published article remains available in the archive, but its technical currentness has not yet been reverified. Validate it against current authoritative sources before use.',
  },
  'stable-reference': {
    label: 'Stable reference',
    admonition: 'info',
    text: 'This article is retained as a durable reference. Validate environment-specific commands, versions, and assumptions before operational use.',
  },
});

export const ADVERSARYGRAPH_DOCS_URL = 'https://1200km.com/adversarygraph-docs/';

// Mirrors applyArticleGovernance() in content-catalog-lib.mjs.
export function articleLifecycle({ id, slug, published }, policy = {}) {
  const has = (list, value) => Boolean(value) && new Set(list || []).has(value);
  if (has(policy.current_core_ids, id) || has(policy.current_core_slugs, slug)) return 'maintained';
  if (has(policy.stable_reference_ids, id) || has(policy.stable_reference_slugs, slug)) return 'stable-reference';
  if (has(policy.historical_ids, id)) return 'historical';
  if (policy.preserved_before && published && published < policy.preserved_before) return 'preserved';
  return 'currentness-unknown';
}

export function lifecycleDocsLink(lifecycle, title) {
  return lifecycle === 'historical' && /adversarygraph/i.test(title || '');
}

// Markdown admonition inserted directly under the article H1.
export function lifecycleAdmonition(lifecycle, title) {
  const message = LIFECYCLE_MESSAGES[lifecycle];
  if (!message) return '';
  const link = lifecycleDocsLink(lifecycle, title)
    // Archive convention for same-origin links: explicit target="_self".
    ? ` <a href="${ADVERSARYGRAPH_DOCS_URL}" target="_self">Open current AdversaryGraph documentation</a>.`
    : '';
  return `:::${message.admonition}[${message.label}]\n\n${message.text}${link}\n\n:::\n`;
}

export function articleIdentityFromFile(fileName) {
  const slug = fileName.replace(/\.mdx?$/i, '').toLowerCase();
  const id = slug.match(/-([a-f0-9]{12})$/i)?.[1]?.toLowerCase() || null;
  return { slug, id };
}

export function publishedFromSource(markdown, fileName) {
  return markdown.match(/\*\*Published:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1]
    || fileName.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1]
    || null;
}
