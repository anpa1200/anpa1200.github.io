import {readFileSync} from 'node:fs';

export const research = JSON.parse(readFileSync(new URL('../data/sector-research.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// These are editorial reading routes, deliberately outside the MITRE STIX
// relationships and the scored knowledge mesh. They add no attribution edges.
export function sectorResearchSection(kind, id) {
  const rows = research.publications.flatMap(publication =>
    (publication[kind] || []).filter(row => row.id === id).map(row => ({publication, row})));
  if (!rows.length) return '';
  return `\n<section class="attack-knowledge-detail"><h2 id="sector-research">Related sector research</h2>
<p>Editorial reading routes, not additional MITRE relationships or proof of an actor's involvement in a particular incident.</p>
<ul>${rows.map(({publication:p,row:r}) => `<li><a href="${escape(p.url)}#${escape(r.anchor)}">${escape(p.title)}</a> — ${escape(r.scope)} Evidence cutoff: ${escape(p.evidence_cutoff)}.</li>`).join('\n')}</ul></section>`;
}
