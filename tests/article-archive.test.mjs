import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const facts = JSON.parse(read('data/site-facts.json')).facts;
const workflow = read('.github/workflows/pages.yml');
const metadataBuilder = read('scripts/build-site-artifacts.mjs');
const archiveStager = read('scripts/stage-article-archive-governance.mjs');
const articleIndexes = [
  'ai-offensive.html',
  'cti.html',
  'guides.html',
  'hexstrike.html',
  'labs.html',
  'pt-tools.html',
];

test('Pages deploys the pinned article source into the canonical /articles route', () => {
  assert.match(workflow, /repository:\s*anpa1200\/medium-blog-navigation/);
  assert.match(workflow, /ARTICLE_ARCHIVE_COMMIT:\s*[0-9a-f]{40}/);
  assert.match(workflow, /ref:\s*\$\{\{\s*env\.ARTICLE_ARCHIVE_COMMIT\s*\}\}/);
  assert.match(workflow, /npm run validate:archive/);
  assert.match(workflow, /npm run build:embedded/);
  assert.match(workflow, /stage-article-archive-governance\.mjs/);
  assert.match(workflow, /site\/articles/);
  const pinnedCommit = workflow.match(/ARTICLE_ARCHIVE_COMMIT:\s*([0-9a-f]{40})/)?.[1];
  assert.ok(pinnedCommit, 'workflow must pin a full article source commit');
  assert.ok(
    facts['content.medium_exported_articles'].source.some((url) => url.includes(`/blob/${pinnedCommit}/`)),
    'article fact must cite the pinned catalog commit',
  );
  assert.match(archiveStager, /articleFact\.value !== catalog\.length/);
  assert.match(archiveStager, /canonical_status_counts/);
});

test('article discovery pages use local reading URLs instead of publication URLs', () => {
  const publicationArticle = /href="https:\/\/(?:medium\.com\/(?:@1200km|bugbountywriteup)|infosecwriteups\.com)\/[^"#?]+-[0-9a-f]{12}"/i;
  let localLinks = 0;
  for (const path of articleIndexes) {
    const html = read(path);
    assert.doesNotMatch(html, publicationArticle, `${path} still uses a publication URL as its primary article link`);
    localLinks += [...html.matchAll(/href="\/articles\/read\/[^"]+"/g)].length;
  }
  assert.ok(localLinks >= 177, `expected broad local archive coverage, found ${localLinks} links`);
});

test('the old remote archive is not merged into the canonical sitemap', () => {
  const remoteSitemaps = JSON.parse(read('seo/remote-sitemaps.json'));
  assert.equal(remoteSitemaps.some(item => item.url.includes('/medium-blog-navigation/')), false);
  const collectionConfig = JSON.parse(read('data/content-catalog.config.json'));
  const archive = collectionConfig.declared_collections.find(item => item.id === 'collection:medium-export');
  assert.equal(archive.canonical_prefix, 'https://1200km.com/articles/');
  assert.equal(archive.primary_type, 'article');
});

test('article archive routes receive authoritative sitemap dates', () => {
  assert.match(metadataBuilder, /function archiveDate\(canonical\)/);
  assert.match(metadataBuilder, /content\.medium_exported_articles/);
  assert.match(metadataBuilder, /archiveDate\(page\.canonical\)/);
});
