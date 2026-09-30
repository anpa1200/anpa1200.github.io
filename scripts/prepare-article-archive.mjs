// Reproducible source overlay for the pinned, separately built archive.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleIdentityFromFile, articleLifecycle, lifecycleAdmonition, publishedFromSource } from './article-lifecycle-lib.mjs';
import { sameOriginPlatformAssets } from './companion-sites-lib.mjs';
import { archiveSourceRewrites, rewriteCrosslinksInDirectory } from './canonical-crosslinks.mjs';
const args = process.argv.slice(2),
  i = args.indexOf('--archive');
if (i < 0 || !args[i + 1]) throw Error('--archive source checkout required');
const archive = resolve(args[i + 1]);
const path = resolve(archive, 'docusaurus.config.js');
let source = sameOriginPlatformAssets(readFileSync(path, 'utf8'));
if (/\btrailingSlash:\s*true\b/.test(source)) {
  writeFileSync(path, source);
  console.log('Archive slash policy already explicit');
} else {
  if (/\btrailingSlash\s*:/.test(source)) throw Error('Archive has a conflicting slash policy; review the source before updating');
  if (!source.includes('const config = {')) throw Error('Unknown Docusaurus config shape');
  source = source.replace('const config = {', 'const config = {\n  trailingSlash: true, // Match 1200km sitemap, canonical links, and directory hosting.');
  writeFileSync(path, source);
  console.log('Prepared archive source with trailingSlash: true');
}
let replacements = 0;
for (const directory of ['docs', 'src', 'static']) {
  const path = resolve(archive, directory);
  const extensions = ['.md', '.mdx', '.js', '.jsx', '.ts', '.tsx', '.html', '.json'];
  replacements += (await rewriteCrosslinksInDirectory(path, extensions, archiveSourceRewrites)).replacements;
  replacements += (await rewriteCrosslinksInDirectory(path, extensions)).replacements;
}
console.log(`Normalized ${replacements} pinned archive crosslink(s) before Docusaurus hydration build.`);

// Lifecycle notices are part of the article source, so Docusaurus renders
// them inside the article body under the H1: no hydration mismatch, no
// runtime insertion, and no layout shift above the site navigation.
const policy = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'content-catalog.config.json'), 'utf8')).article_lifecycle_policy || {};
const articleRoot = resolve(archive, 'docs', 'articles');
const lifecycleCounts = {};
for (const file of existsSync(articleRoot) ? readdirSync(articleRoot, { recursive: true }) : []) {
  // Only dated article pages (docs/articles/<year>/*.md), never index pages.
  if (!/\.mdx?$/i.test(file) || !/^\d{4}$/.test(basename(dirname(resolve(articleRoot, file))))) continue;
  const path = resolve(articleRoot, file);
  const markdown = readFileSync(path, 'utf8');
  const fileName = basename(file);
  const { id, slug } = articleIdentityFromFile(fileName);
  const title = markdown.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] || '';
  const lifecycle = articleLifecycle({ id, slug, published: publishedFromSource(markdown, fileName) }, policy);
  const admonition = lifecycleAdmonition(lifecycle, title);
  lifecycleCounts[lifecycle] = (lifecycleCounts[lifecycle] || 0) + 1;
  if (!admonition) continue;
  const heading = markdown.match(/^# .+$/m);
  if (!heading) throw Error(`${file}: archive article has no H1 for its lifecycle notice`);
  if (markdown.includes(admonition.trim())) continue;
  const at = heading.index + heading[0].length;
  writeFileSync(path, `${markdown.slice(0, at)}\n\n${admonition}${markdown.slice(at)}`);
}
console.log(`Prepared article lifecycle notices: ${JSON.stringify(lifecycleCounts)}`);
