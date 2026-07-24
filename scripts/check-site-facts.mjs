import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const sourceRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const siteFlag = process.argv.indexOf('--site');
const siteRoot = siteFlag >= 0 ? path.resolve(process.argv[siteFlag + 1] || '') : sourceRoot;
const factsPath = path.join(sourceRoot, 'data', 'site-facts.json');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath, root = siteRoot) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`Missing required file: ${path.relative(sourceRoot, absolute)}`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

function walk(root, predicate) {
  const results = [];
  if (!existsSync(root)) return results;
  for (const entry of readdirSync(root)) {
    if (['.git', 'node_modules', 'pagefind'].includes(entry)) continue;
    const absolute = path.join(root, entry);
    const metadata = statSync(absolute);
    if (metadata.isDirectory()) results.push(...walk(absolute, predicate));
    else if (predicate(absolute)) results.push(absolute);
  }
  return results;
}

function fact(key) {
  const item = model.facts[key];
  if (!item) fail(`Missing fact: ${key}`);
  return item || { value: null };
}

function parseJsonLd(html, relativePath) {
  const documents = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      documents.push(JSON.parse(match[1]));
    } catch (error) {
      fail(`${relativePath}: invalid JSON-LD (${error.message})`);
    }
  }
  return documents;
}

function flattenJsonLd(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) flattenJsonLd(item, output);
  } else if (value && typeof value === 'object') {
    output.push(value);
    for (const item of Object.values(value)) flattenJsonLd(item, output);
  }
  return output;
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const sourceModel = JSON.parse(readFileSync(factsPath, 'utf8'));
const model = siteRoot === sourceRoot
  ? sourceModel
  : JSON.parse(read('data/site-facts.json'));
const allowedStatuses = new Set([
  'released',
  'current-development',
  'maintained',
  'experimental',
  'submitted',
  'accepted',
  'closed-unmerged',
  'superseded',
  'archived',
  'verified',
]);

if (model.$schema !== './site-facts.schema.json') fail('Fact model has an unexpected $schema value.');
if (!/^\d+\.\d+\.\d+$/.test(model.model_version || '')) fail('Fact model version must be semantic.');
if (!model.facts || typeof model.facts !== 'object' || Array.isArray(model.facts)) fail('Fact model must contain a facts object.');

for (const [key, item] of Object.entries(model.facts || {})) {
  for (const required of ['value', 'scope', 'verified_at', 'source', 'status']) {
    if (!(required in item)) fail(`${key}: missing ${required}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.verified_at || '') || Number.isNaN(Date.parse(`${item.verified_at}T00:00:00Z`))) {
    fail(`${key}: verified_at must be a valid ISO date.`);
  }
  if (!Array.isArray(item.source) || !item.source.length || item.source.some(value => typeof value !== 'string' || !value.trim())) {
    fail(`${key}: source must be a non-empty string array.`);
  }
  if (!allowedStatuses.has(item.status)) fail(`${key}: unsupported status ${item.status}.`);
  if (typeof item.scope !== 'string' || !item.scope.trim()) fail(`${key}: scope must be non-empty.`);
}

if (siteRoot !== sourceRoot) {
  if (JSON.stringify(model) !== JSON.stringify(sourceModel)) fail('Deployable fact model differs from the validated source model.');
}

const stable = fact('adversarygraph.stable_release').value;
const stableTag = fact('adversarygraph.latest_release_tag').value;
if (stableTag !== `v${stable}`) fail('Stable release and latest release tag disagree.');
if (fact('adversarygraph.stable_release').status !== 'released') fail('Stable release must have released status.');
if (fact('adversarygraph.development_status').status !== 'current-development') fail('Development status must be current-development.');

const techniquePages = fact('content.threat_matrix_technique_pages').value;
const actorPages = fact('content.threat_matrix_actor_pages').value;
if (techniquePages + actorPages !== fact('content.threat_matrix_entity_pages').value) {
  fail('Threat Matrix entity total does not equal technique plus actor pages.');
}
if (fact('content.field_guide_names').value.length !== fact('content.field_guides').value) {
  fail('Field-guide count does not equal the maintained field-guide list.');
}
if (fact('content.local_article_archive').value <= 0) {
  fail('Local article archive count must be a positive, explicitly scoped value.');
}
if (!/not a claim about the current Medium publication total/i.test(fact('content.local_article_archive').scope)) {
  fail('Local article archive fact must explicitly exclude the live Medium publication total.');
}
const registry = fact('products.portfolio_registry').value;
if (!Array.isArray(registry) || !registry.some(item => item.name === 'AdversaryGraph' && item.status === 'maintained')
  || !registry.some(item => item.name === 'Threat Matrix' && item.status === 'maintained')
  || !registry.some(item => item.name === 'ThreatMapper' && item.status === 'superseded')
  || !registry.some(item => item.status === 'archived')) {
  fail('Product registry must separate maintained, superseded, and archived entries.');
}

const stats = JSON.parse(read('assets/validation/stats.json'));
if (stats.totals?.merged_external_items !== fact('contributions.accepted_external').value) {
  fail('Accepted external contribution fact disagrees with assets/validation/stats.json.');
}
if (stats.totals?.open_upstream_items !== fact('contributions.open_external').value) {
  fail('Open external contribution fact disagrees with assets/validation/stats.json.');
}
if (stats.github?.closed_unmerged_prs !== fact('contributions.closed_unmerged_external').value) {
  fail('Closed-unmerged contribution fact disagrees with assets/validation/stats.json.');
}
if (stats.repositories?.adversarygraph?.release !== stableTag) {
  fail('AdversaryGraph release fact disagrees with assets/validation/stats.json.');
}

if (siteRoot === sourceRoot) {
  const countIndexPages = relativeDirectory => walk(path.join(sourceRoot, relativeDirectory), file => path.basename(file) === 'index.html').length;
  if (countIndexPages('threat-matrix/techniques') !== techniquePages) fail('Generated Threat Matrix technique page count disagrees with facts.');
  if (countIndexPages('threat-matrix/actors') !== actorPages) fail('Generated Threat Matrix actor page count disagrees with facts.');
  const localArticles = readdirSync(path.join(sourceRoot, 'articles')).filter(name => name.endsWith('.html') && name !== 'index.html').length;
  if (localArticles !== fact('content.local_companion_articles').value) fail('Local companion article count disagrees with facts.');
  const listedLabs = (readFileSync(path.join(sourceRoot, 'labs.html'), 'utf8').match(/\bclass=["'][^"']*\blab-row\b[^"']*["']/g) || []).length;
  if (listedLabs !== fact('content.listed_labs').value) fail('Listed lab count disagrees with labs.html.');
  const remoteSites = JSON.parse(readFileSync(path.join(sourceRoot, 'seo', 'remote-sitemaps.json'), 'utf8'));
  const excluded = new Set(['Live AdversaryGraph Documentation', '1200km Article Archive']);
  if (remoteSites.filter(item => !excluded.has(item.name)).length !== fact('content.field_guides').value) {
    fail('Field-guide count disagrees with seo/remote-sitemaps.json.');
  }
}

const requiredSurfaces = [
  'index.html',
  'about.html',
  'cv.html',
  'projects.html',
  'labs.html',
  'external-validation.html',
  'adversarygraph/index.html',
  'threat-matrix/index.html',
];
const currentTexts = [];
for (const relativePath of requiredSurfaces) {
  const html = read(relativePath);
  const text = visibleText(html);
  currentTexts.push([relativePath, html, text]);
  if (/\b(?:current|latest|stable)\s+(?:release|version)[^.!?]{0,80}\bv(?:2|4|5)(?:\.\d+){0,2}\b/i.test(text)) {
    fail(`${relativePath}: current release/version statement contains an unauthorized historical value.`);
  }
  if (relativePath === 'adversarygraph/index.html' && /\bAdversaryGraph AI\b(?!\s+Analysis)/i.test(html)) {
    fail(`${relativePath}: use the canonical product name AdversaryGraph.`);
  }
  if (relativePath === 'threat-matrix/index.html' && /<(?:title|h1)\b[^>]*>[^<]*AdversaryGraph Web/i.test(html)) {
    fail(`${relativePath}: use the approved public workspace name Threat Matrix.`);
  }
}

const adgHtml = currentTexts.find(([name]) => name === 'adversarygraph/index.html')?.[1] || '';
const adgNodes = flattenJsonLd(parseJsonLd(adgHtml, 'adversarygraph/index.html'));
const adgSoftware = adgNodes.find(node => node['@type'] === 'SoftwareApplication');
if (!adgSoftware) fail('adversarygraph/index.html: SoftwareApplication JSON-LD is missing.');
else {
  if (adgSoftware.name !== fact('adversarygraph.product_name').value) fail('AdversaryGraph JSON-LD product name disagrees with facts.');
  if (adgSoftware.alternateName !== fact('products.threatmapper').value.name) fail('AdversaryGraph JSON-LD historical alias disagrees with facts.');
  if (adgSoftware.softwareVersion !== stable) fail('AdversaryGraph JSON-LD softwareVersion disagrees with facts.');
  if (!String(adgSoftware.releaseNotes || '').includes(stableTag)) fail('AdversaryGraph JSON-LD releaseNotes does not point to the stable tag notes.');
}

const homeHtml = currentTexts.find(([name]) => name === 'index.html')?.[1] || '';
const homeNodes = flattenJsonLd(parseJsonLd(homeHtml, 'index.html'));
const homeSoftware = homeNodes.find(node => node['@type'] === 'SoftwareApplication' && node.name === 'AdversaryGraph');
if (!homeSoftware || homeSoftware.softwareVersion !== stable) fail('Homepage AdversaryGraph structured data disagrees with the stable release fact.');
else if (homeSoftware.alternateName !== fact('products.threatmapper').value.name) fail('Homepage AdversaryGraph structured data omits the governed historical alias.');

const markerPattern = /data-site-fact=["']([^"']+)["'][^>]*data-fact-value=["']([^"']+)["']/gi;
const requiredMarkers = new Map([
  ['adversarygraph.latest_release_tag', String(stableTag)],
  ['contributions.accepted_external', String(fact('contributions.accepted_external').value)],
  ['contributions.open_external', String(fact('contributions.open_external').value)],
  ['content.local_article_archive', String(fact('content.local_article_archive').value)],
  ['content.field_guides', String(fact('content.field_guides').value)],
  ['content.listed_labs', String(fact('content.listed_labs').value)],
]);
const foundMarkers = new Map();
for (const [relativePath, html] of currentTexts) {
  for (const match of html.matchAll(markerPattern)) {
    const [key, value] = match.slice(1);
    if (!foundMarkers.has(key)) foundMarkers.set(key, []);
    foundMarkers.get(key).push({ relativePath, value });
  }
}
for (const [key, expected] of requiredMarkers) {
  const markers = foundMarkers.get(key) || [];
  if (!markers.length) fail(`No current surface exposes the required ${key} fact marker.`);
  for (const marker of markers) {
    if (marker.value !== expected) fail(`${marker.relativePath}: ${key} marker is ${marker.value}, expected ${expected}.`);
  }
}

const allHtml = walk(siteRoot, file => file.endsWith('.html'));
const phonePatterns = [
  /href\s*=\s*["']tel:/i,
  /(?:\+?972[\s().-]*(?:0[\s().-]*)?|\b0)5\d(?:[\s().-]*\d){7}\b/,
];
for (const absolute of allHtml) {
  const html = readFileSync(absolute, 'utf8');
  if (phonePatterns.some(pattern => pattern.test(html))) {
    fail(`${path.relative(siteRoot, absolute)}: public HTML contains a phone number or tel link.`);
  }
}

const cname = read('CNAME').trim();
if (cname !== '1200km.com') fail(`CNAME must publish only the canonical apex; found ${cname || '(empty)'}.`);

const legacyRedirects = [
  ['threatmapper.html', 'https://1200km.com/adversarygraph/'],
  ['threatmapper/index.html', 'https://1200km.com/adversarygraph/'],
  ['threatmapper-docs/index.html', 'https://1200km.com/adversarygraph-docs/'],
  ['threatmapper-web.html', 'https://1200km.com/adversarygraph-web-guide.html'],
  ['threatmapper-web-guide.html', 'https://1200km.com/adversarygraph-web-guide.html'],
];
for (const [relativePath, canonical] of legacyRedirects) {
  const html = read(relativePath);
  if (!/http-equiv=["']refresh["']/i.test(html)
    || !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || !html.includes(`rel="canonical" href="${canonical}"`)) {
    fail(`${relativePath}: legacy alias must be a noindex compatibility redirect to ${canonical}.`);
  }
}

const publicEmail = String(fact('contact.public_email').value);
for (const relativePath of ['index.html', 'about.html', 'cv.html']) {
  const html = read(relativePath);
  if (!html.includes(`href="mailto:${publicEmail}"`)) fail(`${relativePath}: public Email control does not use the governed contact address.`);
  if (/href=["']#["'][^>]*>\s*Email\s*</i.test(html)) fail(`${relativePath}: Email control still uses an inert fragment.`);
}

for (const [relativePath, , text] of currentTexts) {
  if (/\b(?:52\+|150\+|15\+)\b/.test(text)) fail(`${relativePath}: ambiguous legacy content count remains.`);
}

const publicTextFiles = walk(siteRoot, file => /\.(?:html|md|txt|xml|json)$/i.test(file));
const brokenDevelopmentPath = '1200km.com/adversarygraph-docs/unified-rag-mcp/';
for (const absolute of publicTextFiles) {
  const relative = path.relative(siteRoot, absolute);
  if (relative === 'SITE-FACTS.md'
    || relative === 'data/content-catalog.json'
    || relative === 'data/content-catalog.config.json'
    || relative.startsWith('adversarygraph-docs/unified-rag-mcp')) continue;
  if (readFileSync(absolute, 'utf8').includes(brokenDevelopmentPath)) {
    fail(`${relative}: links to the undeployed Unified RAG/MCP Docusaurus route.`);
  }
}

const docsOutputRoot = path.join(siteRoot, 'adversarygraph-docs');
for (const absolute of walk(docsOutputRoot, file => /\.(?:html|md|js)$/i.test(file))) {
  const content = readFileSync(absolute, 'utf8');
  if (/Current release:\s*(?:<strong>)?(?:AdversaryGraph\s+)?v5\.9\.1/i.test(content)
    || /Current v5\.x releases/i.test(content)
    || /\bAdversaryGraph AI\b(?!\s+Analysis)/i.test(content)) {
    fail(`${path.relative(siteRoot, absolute)}: stale current-version or product-name content remains in documentation output.`);
  }
}
const threatMatrixOutputRoot = path.join(siteRoot, 'threat-matrix');
for (const absolute of walk(threatMatrixOutputRoot, file => /\.(?:html|js)$/i.test(file))) {
  if (path.relative(siteRoot, absolute) === 'threat-matrix/index.html') continue;
  if (/\bAdversaryGraph Web\b/i.test(readFileSync(absolute, 'utf8'))) {
    fail(`${path.relative(siteRoot, absolute)}: generated workspace output uses the superseded AdversaryGraph Web name.`);
  }
}

const publicWorkspace = fact('products.public_attack_workspace').value;
if (publicWorkspace.name !== 'Threat Matrix' || publicWorkspace.canonical_url !== 'https://1200km.com/threat-matrix/') {
  fail('Public ATT&CK workspace name or URL disagrees with the approved terminology.');
}
const threatMatrixText = currentTexts.find(([name]) => name === 'threat-matrix/index.html')?.[2] || '';
if (!threatMatrixText.includes('Threat Matrix') || !threatMatrixText.includes('public') || !threatMatrixText.includes('AdversaryGraph')) {
  fail('Threat Matrix page does not explain its public-workspace relationship to AdversaryGraph.');
}
const threatMatrixHtml = currentTexts.find(([name]) => name === 'threat-matrix/index.html')?.[1] || '';
const threatMatrixNodes = flattenJsonLd(parseJsonLd(threatMatrixHtml, 'threat-matrix/index.html'));
const threatMatrixApplication = threatMatrixNodes.find(node => node['@type'] === 'WebApplication' && node.name === 'Threat Matrix');
const threatMatrixPlatform = threatMatrixNodes.find(node => node['@id'] === 'https://1200km.com/#software'
  && node['@type'] === 'SoftwareApplication' && node.name === 'AdversaryGraph');
if (!threatMatrixApplication) fail('Threat Matrix WebApplication JSON-LD is missing.');
else {
  const connectedRelationship = threatMatrixApplication.isPartOf?.['@id'] === 'https://1200km.com/#software'
    && threatMatrixPlatform?.softwareVersion === stable;
  const sourceRelationship = threatMatrixApplication.isPartOf?.name === 'AdversaryGraph'
    && threatMatrixApplication.isPartOf?.softwareVersion === stable;
  if (!connectedRelationship && !sourceRelationship) {
    fail('Threat Matrix structured data disagrees with the AdversaryGraph relationship or stable release fact.');
  }
}

const textSurfaceRequirements = new Map([
  ['index.md', [stableTag, 'Unreleased', 'data/site-facts.json']],
  ['projects.md', [stableTag, 'Unreleased', 'Threat Matrix', 'ThreatMapper']],
  ['adversarygraph.md', [stableTag, 'Unreleased', 'data/site-facts.json']],
  ['llms.txt', [stableTag, 'Accepted external contributions: 8', 'Open external submissions: 31']],
  ['llms-full.txt', [stableTag, 'post-v6 work on `main` is Unreleased', 'Threat Matrix']],
  ['agent-index.md', [stableTag, 'Unreleased', 'data/site-facts.json']],
  ['adversarygraph-docs/index.md', [`Current release: ${stableTag}.`]],
  ['adversarygraph-docs/capabilities.md', [`Current release: ${stableTag}.`]],
]);
for (const [relativePath, values] of textSurfaceRequirements) {
  const content = read(relativePath);
  for (const value of values) if (!content.includes(value)) fail(`${relativePath}: missing required fact text ${value}.`);
}

const feed = read('feed.xml');
if (!feed.includes(`AdversaryGraph ${stableTag} Stable Release`)) fail('feed.xml: stable AdversaryGraph release item is missing.');
if (!feed.includes('Historical: AdversaryGraph v4 Capability Map')) fail('feed.xml: version-specific v4 item is not labelled historical.');
const catalog = read('.well-known/api-catalog');
if (!catalog.includes('https://1200km.com/data/site-facts.json')) fail('API catalog does not expose the authoritative fact model.');

for (const pdfName of ['cv.pdf', 'cover-letter.pdf']) {
  const absolute = path.join(siteRoot, pdfName);
  if (!existsSync(absolute)) continue;
  try {
    const text = execFileSync('pdftotext', [absolute, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (phonePatterns[1].test(text)) fail(`${pdfName}: public PDF contains a phone number.`);
  } catch {
    // HTML privacy remains mandatory in CI; PDF text inspection runs when pdftotext is available.
  }
}

if (failures.length) {
  console.error(`Site fact consistency failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Site fact consistency passed for ${path.relative(sourceRoot, siteRoot) || '.'}`);
console.log(`Stable ${stableTag}; ${fact('contributions.accepted_external').value} accepted contributions; ${fact('contributions.open_external').value} open submissions.`);
