import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(join(repositoryRoot, 'data/trainsec-library.json'), 'utf8'));

function attributeValue(tag, name) {
  return tag.match(new RegExp(`\\s${name}=("|')([^"']*)\\1`, 'i'))?.[2] || '';
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function oneMeta(html, attribute, key) {
  const matches = tags(html, 'meta').filter((tag) => attributeValue(tag, attribute).toLowerCase() === key.toLowerCase());
  assert.equal(matches.length, 1, `${key} should occur exactly once`);
  return attributeValue(matches[0], 'content');
}

function canonicalFrom(html) {
  const matches = tags(html, 'link').filter((tag) => attributeValue(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
  assert.equal(matches.length, 1, 'canonical should occur exactly once');
  return attributeValue(matches[0], 'href');
}

function dateIso(value) {
  const months = new Map([
    ['January', '01'], ['February', '02'], ['March', '03'], ['April', '04'],
    ['May', '05'], ['June', '06'], ['July', '07'], ['August', '08'],
    ['September', '09'], ['October', '10'], ['November', '11'], ['December', '12'],
  ]);
  const match = value.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  assert.ok(match, `unsupported test date: ${value}`);
  return `${match[3]}-${months.get(match[1])}-${match[2].padStart(2, '0')}`;
}

function jsonLdGraph(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'JSON-LD should occur exactly once');
  const value = JSON.parse(scripts[0][1]);
  return value['@graph'] || [value];
}

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'trainsec-importer-'));
  for (const directory of ['scripts', 'data', 'articles/trainsec']) mkdirSync(join(root, directory), { recursive: true });
  for (const file of ['import-trainsec-library.mjs', 'trainsec-canonical-lib.mjs']) {
    cpSync(join(repositoryRoot, 'scripts', file), join(root, 'scripts', file));
  }
  cpSync(join(repositoryRoot, 'data/trainsec-library.json'), join(root, 'data/trainsec-library.json'));
  for (const article of manifest.articles) {
    cpSync(join(repositoryRoot, `.${article.local_path}`), join(root, article.local_path));
  }
  for (const directory of ['authors.html', 'domains.html']) {
    cpSync(join(repositoryRoot, 'articles/trainsec', directory), join(root, 'articles/trainsec', directory));
  }
  cpSync(join(repositoryRoot, 'articles/trainsec-library.html'), join(root, 'articles/trainsec-library.html'));
  writeFileSync(join(root, 'sitemap.xml'), '<urlset><url><loc>sentinel</loc></url></urlset>\n');
  writeFileSync(join(root, 'sitemap-all.xml'), '<urlset><url><loc>sentinel-all</loc></url></urlset>\n');
  return root;
}

function runMetadataOnly(root) {
  const env = { ...process.env, TZ: 'Asia/Jerusalem' };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['scripts/import-trainsec-library.mjs', '--metadata-only'], {
    cwd: root,
    encoding: 'utf8',
    env,
  });
}

test('metadata-only import maps all 84 mirrors to their exact TrainSec canonical without date drift', () => {
  assert.equal(manifest.article_count, 84);
  assert.equal(manifest.articles.length, 84);
  const root = makeFixture();
  try {
    const untouched = new Map([
      ['hub', readFileSync(join(root, 'articles/trainsec-library.html'), 'utf8')],
      ['authors', readFileSync(join(root, 'articles/trainsec/authors.html'), 'utf8')],
      ['domains', readFileSync(join(root, 'articles/trainsec/domains.html'), 'utf8')],
      ['sitemap', readFileSync(join(root, 'sitemap.xml'), 'utf8')],
      ['sitemap-all', readFileSync(join(root, 'sitemap-all.xml'), 'utf8')],
    ]);
    assert.equal(canonicalFrom(untouched.get('hub')), 'https://1200km.com/articles/trainsec-library.html');
    assert.equal(canonicalFrom(untouched.get('authors')), 'https://1200km.com/articles/trainsec/authors.html');
    assert.equal(canonicalFrom(untouched.get('domains')), 'https://1200km.com/articles/trainsec/domains.html');
    const stalePagefindPath = join(root, `.${manifest.articles[0].local_path}`);
    writeFileSync(
      stalePagefindPath,
      readFileSync(stalePagefindPath, 'utf8').replace('data-pagefind-body', 'data-pagefind-ignore="content"'),
    );
    const result = runMetadataOnly(root);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const localUrls = new Set();
    const sourceUrls = new Set();
    for (const article of manifest.articles) {
      const localUrl = `https://1200km.com${article.local_path}`;
      const html = readFileSync(join(root, `.${article.local_path}`), 'utf8');
      assert.equal(canonicalFrom(html), article.url);
      assert.equal(oneMeta(html, 'property', 'og:url'), article.url);
      assert.equal(oneMeta(html, 'name', 'trainsec-source'), article.url);
      assert.equal(oneMeta(html, 'name', 'trainsec-mirror'), localUrl);
      assert.equal(oneMeta(html, 'name', 'author'), article.author);
      assert.equal(oneMeta(html, 'name', 'trainsec-author'), article.author);
      assert.equal(oneMeta(html, 'property', 'article:published_time'), dateIso(article.date));
      assert.equal(oneMeta(html, 'property', 'og:image'), article.image);
      assert.equal(oneMeta(html, 'name', 'twitter:image'), article.image);
      assert.equal(oneMeta(html, 'name', 'twitter:card'), 'summary_large_image');
      assert.equal(tags(html, 'meta').some((tag) => attributeValue(tag, 'name').toLowerCase() === 'keywords'), false);
      assert.doesNotMatch(html, /\bdata-pagefind-body\b/i);
      assert.match(html, /<main\b[^>]*\bdata-pagefind-ignore="all"/i);
      assert.doesNotMatch(html, /<meta\b[^>]*(?:name|property)=["']robots["'][^>]*noindex/i);
      for (const heading of html.matchAll(/<h([2-6])\b([^>]*)>/gi)) assert.match(heading[2], /\bid="[^"]+"/i);

      const graph = jsonLdGraph(html);
      const webpage = graph.find((node) => node['@type'] === 'WebPage');
      const articleNode = graph.find((node) => node['@type'] === 'Article');
      assert.equal(webpage?.['@id'], `${article.url}#webpage`);
      assert.equal(webpage?.url, article.url);
      assert.deepEqual(webpage?.mainEntity, { '@id': `${article.url}#article` });
      assert.equal(articleNode?.['@id'], `${article.url}#article`);
      assert.equal(articleNode?.url, article.url);
      assert.deepEqual(articleNode?.mainEntityOfPage, { '@id': `${article.url}#webpage` });
      assert.equal(articleNode?.author?.name, article.author);
      assert.equal(articleNode?.publisher?.name, 'TrainSec');
      assert.equal(articleNode?.publisher?.url, 'https://trainsec.net/');
      assert.equal(articleNode?.datePublished, dateIso(article.date));
      assert.equal(Object.hasOwn(articleNode, 'dateModified'), false);
      assert.equal(articleNode?.isBasedOn, article.url);
      localUrls.add(localUrl);
      sourceUrls.add(article.url);
    }
    assert.equal(localUrls.size, 84);
    assert.equal(sourceUrls.size, 84);

    assert.equal(readFileSync(join(root, 'articles/trainsec-library.html'), 'utf8'), untouched.get('hub'));
    assert.equal(readFileSync(join(root, 'articles/trainsec/authors.html'), 'utf8'), untouched.get('authors'));
    assert.equal(readFileSync(join(root, 'articles/trainsec/domains.html'), 'utf8'), untouched.get('domains'));
    assert.equal(readFileSync(join(root, 'sitemap.xml'), 'utf8'), untouched.get('sitemap'));
    assert.equal(readFileSync(join(root, 'sitemap-all.xml'), 'utf8'), untouched.get('sitemap-all'));

    const shiftedDateArticle = manifest.articles.find((article) => article.date === 'September 16, 2025');
    assert.ok(shiftedDateArticle, 'timezone regression fixture should exist');
    const shiftedDateHtml = readFileSync(join(root, `.${shiftedDateArticle.local_path}`), 'utf8');
    assert.equal(oneMeta(shiftedDateHtml, 'property', 'article:published_time'), '2025-09-16');

    const firstPass = new Map(manifest.articles.map((article) => [
      article.local_path,
      readFileSync(join(root, `.${article.local_path}`), 'utf8'),
    ]));
    const secondResult = runMetadataOnly(root);
    assert.equal(secondResult.status, 0, secondResult.stderr || secondResult.stdout);
    for (const article of manifest.articles) {
      assert.equal(
        readFileSync(join(root, `.${article.local_path}`), 'utf8'),
        firstPass.get(article.local_path),
        `${basename(article.local_path)} changed on the idempotence pass`,
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('checked-in TrainSec mirrors and discovery outputs match the exact 84-page canonical policy', () => {
  assert.equal(manifest.article_count, 84);
  assert.equal(manifest.articles.length, 84);
  const localUrls = new Set();
  const sourceUrls = new Set();

  for (const article of manifest.articles) {
    const localUrl = `https://1200km.com${article.local_path}`;
    const html = readFileSync(join(repositoryRoot, `.${article.local_path}`), 'utf8');
    assert.equal(canonicalFrom(html), article.url, article.local_path);
    assert.equal(oneMeta(html, 'property', 'og:url'), article.url, article.local_path);
    assert.equal(oneMeta(html, 'name', 'trainsec-source'), article.url, article.local_path);
    assert.equal(oneMeta(html, 'name', 'trainsec-mirror'), localUrl, article.local_path);
    assert.equal(oneMeta(html, 'name', 'author'), article.author, article.local_path);
    assert.equal(oneMeta(html, 'name', 'trainsec-author'), article.author, article.local_path);
    assert.equal(oneMeta(html, 'property', 'article:published_time'), dateIso(article.date), article.local_path);
    assert.doesNotMatch(html, /\bdata-pagefind-body\b/i, article.local_path);
    assert.match(html, /<main\b[^>]*\bdata-pagefind-ignore="all"/i, article.local_path);

    const graph = jsonLdGraph(html);
    const webpage = graph.find((node) => node['@type'] === 'WebPage');
    const articleNode = graph.find((node) => node['@type'] === 'Article');
    assert.equal(webpage?.['@id'], `${article.url}#webpage`, article.local_path);
    assert.equal(webpage?.url, article.url, article.local_path);
    assert.equal(articleNode?.['@id'], `${article.url}#article`, article.local_path);
    assert.equal(articleNode?.url, article.url, article.local_path);
    assert.equal(articleNode?.author?.name, article.author, article.local_path);
    assert.equal(articleNode?.publisher?.name, 'TrainSec', article.local_path);
    assert.equal(articleNode?.publisher?.url, 'https://trainsec.net/', article.local_path);
    assert.equal(articleNode?.datePublished, dateIso(article.date), article.local_path);
    assert.equal(Object.hasOwn(articleNode, 'dateModified'), false, article.local_path);
    assert.equal(articleNode?.isBasedOn, article.url, article.local_path);
    localUrls.add(localUrl);
    sourceUrls.add(article.url);
  }

  assert.equal(localUrls.size, 84);
  assert.equal(sourceUrls.size, 84);

  const localIndexes = [
    ['articles/trainsec-library.html', 'https://1200km.com/articles/trainsec-library.html'],
    ['articles/trainsec/authors.html', 'https://1200km.com/articles/trainsec/authors.html'],
    ['articles/trainsec/domains.html', 'https://1200km.com/articles/trainsec/domains.html'],
  ];
  for (const [path, canonical] of localIndexes) {
    const html = readFileSync(join(repositoryRoot, path), 'utf8');
    assert.equal(canonicalFrom(html), canonical, path);
    assert.match(html, /\bdata-pagefind-body\b/i, path);
  }

  for (const filename of ['sitemap.xml', 'sitemap-all.xml']) {
    const xml = readFileSync(join(repositoryRoot, filename), 'utf8');
    const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
    const locationSet = new Set(locations);
    assert.ok(locations.every((url) => new URL(url).hostname === '1200km.com'), filename);
    for (const localUrl of localUrls) assert.equal(locationSet.has(localUrl), false, `${filename}: ${localUrl}`);
    for (const [, canonical] of localIndexes) assert.equal(locationSet.has(canonical), true, `${filename}: ${canonical}`);
  }

  const feed = readFileSync(join(repositoryRoot, 'feed.xml'), 'utf8');
  for (const article of manifest.articles) {
    assert.equal(feed.includes(`https://1200km.com${article.local_path}`), false, article.local_path);
    assert.equal(feed.includes(article.url), false, article.url);
  }

  const catalog = JSON.parse(readFileSync(join(repositoryRoot, 'data/content-catalog.json'), 'utf8'));
  const trainsecItems = catalog.items.filter((item) => sourceUrls.has(item.canonical_url));
  assert.equal(trainsecItems.length, 84);
  for (const item of trainsecItems) {
    assert.equal(item.primary_type, 'mirror', item.id);
    assert.equal(item.source_url, item.canonical_url, item.id);
    assert.equal(item.indexable, false, item.id);
    assert.equal(item.alternate_urls?.length, 1, item.id);
    assert.ok(localUrls.has(item.alternate_urls[0]), item.id);
  }
});

test('metadata-only import fails before writing when a page source binding is wrong', () => {
  const root = makeFixture();
  try {
    const last = manifest.articles.at(-1);
    const first = manifest.articles[0];
    const firstPath = join(root, `.${first.local_path}`);
    const firstBefore = readFileSync(firstPath, 'utf8');
    const lastPath = join(root, `.${last.local_path}`);
    writeFileSync(lastPath, readFileSync(lastPath, 'utf8').replace(last.url, 'https://trainsec.net/library/not-authorized/'));
    const result = runMetadataOnly(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}\n${result.stdout}`, /source metadata disagrees|canonical mapping/i);
    assert.equal(readFileSync(firstPath, 'utf8'), firstBefore, 'a validation failure must occur before any page is written');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('metadata-only import requires one generic author and one TrainSec author tag', () => {
  const root = makeFixture();
  try {
    const last = manifest.articles.at(-1);
    const first = manifest.articles[0];
    const firstPath = join(root, `.${first.local_path}`);
    const firstBefore = readFileSync(firstPath, 'utf8');
    const lastPath = join(root, `.${last.local_path}`);
    writeFileSync(lastPath, readFileSync(lastPath, 'utf8').replace('name="trainsec-author"', 'name="author"'));
    const result = runMetadataOnly(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stderr}\n${result.stdout}`, /exactly one (?:author|TrainSec author) metadata tag/i);
    assert.equal(readFileSync(firstPath, 'utf8'), firstBefore, 'author validation must fail before any page is written');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
