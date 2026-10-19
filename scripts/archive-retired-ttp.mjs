// Keep existing URLs and historical content while excluding retired entries from current search.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const catalog = JSON.parse(await readFile(join(root, 'ttp-simulation/data/catalog.json')));
const retired = JSON.parse(await readFile(join(root, 'ttp-simulation/data/retired.json')));
const check = process.argv.includes('--check');
let count = 0;
for (const row of retired) for (const kind of ['techniques', 'detections']) {
  const path = join(root, 'ttp-simulation', kind, row.domain, row.id, 'index.html');
  let html;
  try { html = await readFile(path, 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const marker = '<!-- retired-attack-record -->';
  const notice = `${marker}<aside role="note"><strong>Historical ATT&amp;CK record ${row.id}.</strong> This identifier is ${row.revoked ? 'revoked' : 'deprecated'} in ATT&amp;CK ${catalog.attack_version}. This page preserves previously published context; it is excluded from the current matrix and search. See the <a href="https://attack.mitre.org/resources/updates/updates-october-2026/">official release notes</a>.</aside>`;
  let rendered = html.replace(/<!-- retired-attack-record -->[\s\S]*?<\/aside>/, '');
  rendered = rendered.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">').replace(/ data-pagefind-body/g, '');
  rendered = rendered.replace(/(<main\b[^>]*>)/, `$1${notice}`);
  if (check && rendered !== html) throw new Error(`Stale historical record: ${path}`);
  if (!check) await writeFile(path, rendered);
  count++;
}
// Components without current catalog mappings also remain available as history.
const telemetry = JSON.parse(await readFile(join(root, 'ttp-simulation/data/telemetry.json')));
const currentTelemetry = new Set(telemetry.records.map(row => row.id));
for (const entry of await readdir(join(root, 'ttp-simulation/telemetry'), {withFileTypes:true})) {
  if (!entry.isDirectory() || currentTelemetry.has(entry.name)) continue;
  const path = join(root, 'ttp-simulation/telemetry', entry.name, 'index.html');
  let html;
  try { html=await readFile(path,'utf8'); } catch(error) { if(error.code==='ENOENT')continue; throw error; }
  const notice=`<!-- retired-attack-record --><aside role="note"><strong>Historical telemetry reference ${entry.name}.</strong> No active technique mapping uses this component in this site's ATT&amp;CK ${catalog.attack_version} catalog. Previous definitions remain for existing links; this does not imply that all telemetry from this source is obsolete.</aside>`;
  let rendered=html.replace(/<!-- retired-attack-record -->[\s\S]*?<\/aside>/,'').replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="noindex,follow">').replace(/ data-pagefind-body/g,'');
  rendered=rendered.replace(/(<main\b[^>]*>)/,`$1${notice}`);
  if(check&&rendered!==html)throw new Error(`Stale historical telemetry page: ${path}`);
  if(!check)await writeFile(path,rendered);
  count++;
}
console.log(`${check ? 'Checked' : 'Archived'} ${count} historical technique/detection/telemetry pages; identifiers retained.`);
