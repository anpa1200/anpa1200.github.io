// Reproducible source overlay for the pinned, separately built archive.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleIdentityFromFile, articleLifecycle, lifecycleAdmonition, publishedFromSource } from './article-lifecycle-lib.mjs';
import { rewriteExternalText, unlinkPrivateUrls } from './external-link-replacements.mjs';
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

// Reviewed editorial corrections (typos, Medium export artifacts, placeholder
// example links). Each fixed-string entry must match, so upstream edits are
// noticed instead of silently skipped; re-running is a no-op.
const overlay = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'archive-editorial-overlay.json'), 'utf8'));
const markdownFiles = [];
for (const directory of ['docs']) {
  const root = resolve(archive, directory);
  if (!existsSync(root)) continue;
  for (const file of readdirSync(root, { recursive: true })) if (/\.mdx?$/i.test(file)) markdownFiles.push(resolve(root, file));
}
const tocPattern = new RegExp(overlay.medium_toc_anchor_links.pattern, 'g');
let editorial = 0;
for (const entry of [...overlay.phrase_replacements, ...overlay.unlink_replacements]) {
  let matched = false;
  for (const path of markdownFiles) {
    const text = readFileSync(path, 'utf8');
    // When the replacement wraps the original (backticks), skip already-wrapped text.
    const pending = entry.replace.includes(entry.find) ? text.split(entry.replace).join('') : text;
    if (!pending.includes(entry.find)) { matched ||= text.includes(entry.replace); continue; }
    matched = true;
    const next = entry.replace.includes(entry.find)
      ? text.split(entry.replace).map((part) => part.split(entry.find).join(entry.replace)).join(entry.replace)
      : text.split(entry.find).join(entry.replace);
    writeFileSync(path, next);
    editorial += 1;
  }
  // Strict for the pinned archive; unit-test fixtures may opt out.
  if (!matched && process.env.ARCHIVE_OVERLAY_OPTIONAL !== '1') throw Error(`Archive editorial overlay no longer matches: ${JSON.stringify(entry.find)}`);
}
let external = 0;
for (const path of markdownFiles) {
  const text = readFileSync(path, 'utf8');
  let next = text.replace(tocPattern, overlay.medium_toc_anchor_links.replace);
  next = rewriteExternalText(next).output;
  next = unlinkPrivateUrls(next).output;
  if (next !== text) { writeFileSync(path, next); external += 1; }
}
console.log(`Applied archive editorial overlay (${editorial} file edit(s)) and link hygiene to ${external} Markdown file(s).`);

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
