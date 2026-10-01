#!/usr/bin/env node
// Export reviewed metadata to a Docusaurus source checkout. This is a source
// overlay, shared with the pinned archive build; it never edits article prose.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { contentSignals } from './technical-seo-lib.mjs';
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
if (!args.includes('--project') || !args.includes('--prefix')) throw Error('--project and --prefix required');
const project = resolve(option('--project'));
const prefix = option('--prefix');
if (!prefix.startsWith('/') || !prefix.endsWith('/')) throw Error('Use the existing exact project prefix');
const root = resolve(import.meta.dirname, '..');
const source = JSON.parse(readFileSync(join(root, 'data/seo-policy.json')));
const facts = JSON.parse(readFileSync(join(root, 'data/site-facts.json'))).facts;
const pages = Object.fromEntries(Object.entries(source.pages).filter(([path]) => path.startsWith(prefix)));
const linking = JSON.parse(readFileSync(join(root, 'data/seo-internal-links.json'))).pages;
for (const [path, entry] of Object.entries(pages)) if (linking[path]) entry.links = linking[path];
for (const [path, entry] of Object.entries(pages)) {
  if (entry.classification === 'Excluded') continue;
  const rel = path.slice(prefix.length);
  const built = [join(project,'build',rel,'index.html'),join(project,'build',rel+'.html')].find(existsSync);
  if (!built) continue;
  const signals = contentSignals(readFileSync(built,'utf8'));
  if (signals.steps.length >= 2) entry.howTo = {'@type':'HowTo','@id':'https://1200km.com'+path+'#howto',name:entry.title,mainEntityOfPage:'https://1200km.com'+path,step:signals.steps.map(step=>({'@type':'HowToStep',name:step.name,text:step.name,url:'https://1200km.com'+path+'#'+step.id}))};
}
if (prefix === '/articles/') {
  const catalog = JSON.parse(readFileSync(join(project, 'src/data/article-catalog.json')));
  // Legacy lab copies have the same recorded source article. Retain their
  // URLs and bodies while assigning canonical ownership to the article.
  for (const file of readdirSync(join(project,'docs/labs')).filter(name=>name.endsWith('.md'))) {
    const md = readFileSync(join(project,'docs/labs',file),'utf8');
    const id = md.match(/\*\*Source article:\*\*[^\n]*?([0-9a-f]{12})(?:\)|\])/i)?.[1];
    const row = catalog.find(article=>article.id===id);
    const leaf = md.match(/^id:\s*["']?([^"'\n]+)/m)?.[1] || file.slice(0,-3);
    if(row) pages['/medium-blog-navigation/docs/labs/'+leaf+'/'] = {classification:'Excluded',canonical:'https://1200km.com/articles/read/'+row.local_path.replace(/\/?$/,'/'),reason:'Legacy duplicate of the recorded source article; preserve URL and canonicalize to maintained article'};
  }
  for(const leaf of ['analysis','reading-paths','media-validation','labs']) pages['/medium-blog-navigation/docs/'+leaf+'/'] = {classification:'Thin',reason:'Legacy archive navigation and build scaffolding; retained and crawlable'};
  for (const row of catalog) {
    const path = '/articles/read/' + row.local_path.replace(/\/?$/, '/');
    const entry = pages[path];
    if (!entry) continue;
    const mdFile = join(project, 'docs/articles', row.local_path.replace(/\/$/, '') + '.md');
    let md = readFileSync(mdFile, 'utf8');
    const published = md.match(/\*\*Published:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1] || row.published_at?.slice(0,10);
    if (!published || published !== row.published_at.slice(0,10)) throw Error(`Publication date requires review: ${path}`);
    if (!/^datePublished:/m.test(md.split('---')[1])) {
      md = md.replace(/^---\n/, `---\ndatePublished: ${published}\n`);
      writeFileSync(mdFile, md);
    }
    const modified = execFileSync('git', ['log','-1','--format=%cs','--',mdFile], {cwd:project,encoding:'utf8'}).trim();
    const built = join(project, 'build/read', row.local_path, 'index.html');
    const words = existsSync(built) ? contentSignals(readFileSync(built,'utf8')).wordCount : undefined;
    entry.article = {'@type':'TechArticle','@id':'https://1200km.com'+path+'#article',headline:entry.title,description:entry.description,datePublished:published,...(modified ? {dateModified:modified} : {}),author:{'@id':'https://1200km.com/#person'},publisher:{'@id':'https://1200km.com/#person'},mainEntityOfPage:'https://1200km.com'+path,...(row.cover_image ? {image:row.cover_image} : {}),...(words ? {wordCount:words} : {}),keywords:row.tags?.length ? row.tags : [row.category],articleSection:row.category};
  }
}
const shared = {
  prefix, pages, gitHistory: existsSync(join(project,'.git')) || existsSync(join(project,'../.git')),
  person: { '@type': 'Person', '@id': 'https://1200km.com/#person', name: facts['identity.person_name'].value, url: 'https://1200km.com/', sameAs: facts['identity.same_as'].value },
  website: { '@type': 'WebSite', '@id': 'https://1200km.com/#website', url: 'https://1200km.com/', name: facts['site.name'].value, publisher: { '@id': 'https://1200km.com/#person' } },
};
const folder = join(project, 'src/theme/Root');
const output = join(folder, 'index.js');
if (existsSync(output) && !readFileSync(output, 'utf8').includes('1200km technical SEO overlay')) throw Error(`Existing Root component requires a manual merge: ${output}`);
mkdirSync(folder, { recursive: true });
writeFileSync(join(folder, 'seo-policy.json'), JSON.stringify(shared, null, 2) + '\n');
writeFileSync(output, `// 1200km technical SEO overlay: SSR and client navigation use the same metadata.
import React from 'react';
import Head from '@docusaurus/Head';
import {useLocation} from '@docusaurus/router';
import model from './seo-policy.json';
export default function Root({children}) {
  const {pathname} = useLocation();
  const entry = model.pages[pathname];
  const canonical = 'https://1200km.com' + pathname;
  const parents = Object.keys(model.pages).filter(path => path !== pathname && pathname.startsWith(path) && path.endsWith('/') && model.pages[path].classification !== 'Excluded').sort((a,b) => a.length-b.length);
  const trail = ['/', ...parents.filter(path => path !== '/'), pathname].filter((path, i, all) => all.indexOf(path) === i);
  const graph = { '@context': 'https://schema.org', '@graph': [model.person, model.website, {
    '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb',
    itemListElement: trail.map((path, i) => ({ '@type': 'ListItem', position: i + 1, name: path === '/' ? 'Home' : (model.pages[path]?.title || path.split('/').filter(Boolean).pop()).replace(/ \\| 1200km$/, ''), item: 'https://1200km.com' + path })),
  }, ...(entry?.article ? [entry.article] : []), ...(entry?.howTo ? [entry.howTo] : [])] };
  const active = entry?.title && entry.classification !== 'Excluded';
  return <>{children}{entry?.links?.length > 0 && <section className="container margin-vert--lg" data-seo-related aria-label="Related research"><h2>Related research</h2><ul>{entry.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul></section>}<Head titleTemplate="%s" htmlAttributes={{lang: 'en'}}>
    {active && <title>{entry.title}</title>}
    {active && <meta name="description" content={entry.description} />}
    {active && <meta property="og:title" content={entry.title} />}
    {active && <meta property="og:description" content={entry.description} />}
    {active && <meta name="twitter:title" content={entry.title} />}
    {active && <meta name="twitter:description" content={entry.description} />}
    {active && <meta name="robots" content={entry.classification === 'Thin' ? 'noindex,follow' : 'index,follow,max-image-preview:large'} />}
    {!active && (entry?.classification === 'Thin' || entry?.canonical || pathname.endsWith('/404.html')) && <meta name="robots" content="noindex,follow" />}
    {entry?.canonical && <link rel="canonical" href={entry.canonical} />}
    {entry?.canonical && <meta property="og:url" content={entry.canonical} />}
    {entry?.article?.datePublished && <meta property="article:published_time" content={entry.article.datePublished} />}
    {entry && <script type="application/ld+json" id="technical-seo-shared-graph">{JSON.stringify(graph).replace(/</g, '\\u003c')}</script>}
  </Head></>;
}
`);
const plugin = join(project, 'technical-seo-plugin.cjs');
writeFileSync(plugin, `// Metadata is rendered by Root; sitemap filtering happens in its native hook.
module.exports = () => ({name: '1200km-technical-seo'});
`);
writeFileSync(join(project, 'technical-seo-sitemap.cjs'), `// Filter during native sitemap generation, avoiding concurrent postBuild races.
const policy = require('./src/theme/Root/seo-policy.json');
module.exports = config => {
  for (const preset of config.presets || []) {
    if (!Array.isArray(preset) || !String(preset[0]).includes('classic')) continue;
    const options = preset[1];
    if (options.sitemap === false) continue;
    const previous = options.sitemap || {};
    options.sitemap = {...previous, priority: null, changefreq: null, lastmod: policy.gitHistory ? 'date' : null,
      createSitemapItems: async params => {
        const items = previous.createSitemapItems ? await previous.createSitemapItems(params) : await params.defaultCreateSitemapItems(params);
        return items.filter(item => !['Thin','Excluded'].includes(policy.pages[new URL(item.url).pathname]?.classification)).map(item => ({...item,priority:null,changefreq:null}));
      }
    };
  }
  return config;
};
`);
const config = ['docusaurus.config.js', 'docusaurus.config.ts'].map(name => join(project, name)).find(existsSync);
if (!config) throw Error(`No Docusaurus config in ${project}`);
let configText = readFileSync(config, 'utf8');
if (!configText.includes('applyTechnicalSitemap')) {
  const esm = /export default config;/.test(configText);
  configText = (esm ? "import applyTechnicalSitemap from './technical-seo-sitemap.cjs';\n" : "const applyTechnicalSitemap = require('./technical-seo-sitemap.cjs');\n") + configText;
  configText = configText.replace(/(?:export default config;|module\.exports = config;)/, match => 'applyTechnicalSitemap(config);\n' + match);
  writeFileSync(config, configText);
}
if (!configText.includes('./technical-seo-plugin.cjs')) {
  if (/\bplugins:\s*\[/.test(configText)) configText = configText.replace(/\bplugins:\s*\[/, "plugins: ['./technical-seo-plugin.cjs', ");
  else configText = configText.replace(/(const config(?:\s*:\s*Config)?\s*=\s*\{)/, "$1\n  plugins: ['./technical-seo-plugin.cjs'],");
  if (!configText.includes('./technical-seo-plugin.cjs')) throw Error('Unknown Docusaurus config shape');
  writeFileSync(config, configText);
}
console.log(`Exported SSR/client SEO policy for ${Object.keys(pages).length} audited routes to ${project}.`);
// Older project plugins also write descriptions after SSR. Feed them the same
// reviewed policy so the built head and client navigation cannot disagree.
const oldPlugin = join(project, 'seo-metadata-plugin.cjs');
if (existsSync(oldPlugin)) {
  let pluginText = readFileSync(oldPlugin, 'utf8');
  if (!pluginText.includes('technicalPolicy')) {
    pluginText = "const technicalPolicy = require('./src/theme/Root/seo-policy.json');\n" + pluginText;
    pluginText = pluginText.replace('const description = metadata.descriptions[pathname];', "const technicalEntry = technicalPolicy.pages[pathname];\n        if (technicalEntry?.classification === 'Thin') { seenPaths.add(pathname); continue; }\n        const description = technicalEntry?.description || metadata.descriptions[pathname];");
    pluginText = pluginText.replace('description.length < 140 || description.length > 160', "technicalEntry?.classification !== 'Thin' && (description.length < 120 || description.length > 155)");
    pluginText = pluginText.replace('outside 140–160', 'outside 120–155');
    writeFileSync(oldPlugin, pluginText);
  }
  if (!pluginText.includes("classification === 'Thin'")) {
    pluginText = pluginText.replace('const technicalEntry = technicalPolicy.pages[pathname];', "const technicalEntry = technicalPolicy.pages[pathname];\n        if (technicalEntry?.classification === 'Thin') { seenPaths.add(pathname); continue; }");
    writeFileSync(oldPlugin, pluginText);
  }
}
