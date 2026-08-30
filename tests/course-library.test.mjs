import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'course-library.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(ROOT, 'data', 'course-library.schema.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'courses', 'index.html'), 'utf8');
const detail = readFileSync(join(ROOT, 'courses', 'trainsec-malware-analyst-professional-level-1', 'index.html'), 'utf8');
const client = readFileSync(join(ROOT, 'assets', 'course-library.js'), 'utf8');
const helpingMaterials = readFileSync(join(ROOT, 'cyber-knowledge', 'helping-materials', 'index.html'), 'utf8');

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('course library passes its governed JSON Schema', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  assert.equal(ajv.validate(schema, model), true, ajv.errorsText(ajv.errors));
});

test('published module has unique and resolved course, review, and path identities', () => {
  assert.equal(model.courses.length, 1);
  assert.equal(model.reviews.length, 1);
  assert.equal(model.learning_paths.length, 1);
  const ids = [...model.courses, ...model.reviews, ...model.learning_paths].map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  const governedUrls = [
    ...model.courses.map((course) => course.canonical_url),
    ...model.reviews.flatMap((review) => [review.canonical_url, review.full_review_url]),
  ];
  assert.equal(new Set(governedUrls).size, governedUrls.length);
  const reviewIds = new Set(model.reviews.map((review) => review.id));
  const courseIds = new Set(model.courses.map((course) => course.id));
  for (const path of model.learning_paths) {
    for (const reviewId of path.related_review_ids) assert.ok(reviewIds.has(reviewId), reviewId);
    for (const courseId of path.related_course_ids) assert.ok(courseIds.has(courseId), courseId);
    assert.ok(path.related_review_ids.length + path.related_course_ids.length > 0, path.id);
    assert.deepEqual(path.steps.map((step) => step.position), path.steps.map((_, index) => index + 1));
    assert.equal(new Set(path.steps.map((step) => step.url)).size, path.steps.length);
  }
});

test('review policy publishes only completed evidence-backed decisions with disclosure', () => {
  for (const review of model.reviews) {
    assert.equal(review.status, 'completed');
    assert.match(review.completed_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.notEqual(review.recommendation, 'pending');
    assert.ok(review.evidence.length >= 3);
    assert.ok(review.strengths.length >= 1);
    assert.ok(review.limitations.length >= 1);
    assert.ok(review.official_fact_sources.length >= 2);
    assert.ok(review.local_evidence_sources.length >= 1);
    assert.match(review.facts_verified_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof review.commercial_disclosure.affiliate_link, 'boolean');
    assert.equal(typeof review.commercial_disclosure.provider_controlled_conclusions, 'boolean');
    assert.ok(review.advertised_content_hours > 0);
    assert.equal('workload_hours' in review, false);
    assert.ok(review.completed_at <= review.published_at);
    assert.ok(review.published_at <= review.updated_at);
    assert.ok(review.facts_verified_at >= review.published_at);
    assert.ok(review.syllabus_verified_at >= review.published_at);
  }
});

test('course and review source URLs are HTTPS and cover assets exist', () => {
  const urls = model.courses.flatMap((course) => [course.creator_url, course.canonical_url, ...course.fact_sources]);
  for (const review of model.reviews) {
    urls.push(review.provider_url, review.course_url, review.syllabus_url, review.canonical_url, review.full_review_url, ...review.official_fact_sources, ...review.local_evidence_sources);
    for (const asset of [review.cover.src]) {
      assert.ok(existsSync(join(ROOT, asset.replace(/^\//, ''))), asset);
    }
  }
  for (const url of urls) assert.match(url, /^https:\/\//, url);
});

test('every learning-path step resolves to a governed local page or staged archive identity', () => {
  for (const path of model.learning_paths) {
    for (const step of path.steps) {
      assert.match(step.url, /^\/(?!\/)[^\\\u0000-\u001f\u007f]*$/, step.url);
      const local = join(ROOT, step.url.replace(/^\//, ''), step.url.endsWith('/') ? 'index.html' : '');
      const stagedArchiveIdentity = step.url.startsWith('/articles/read/') && helpingMaterials.includes(`href="${step.url}"`);
      assert.ok(existsSync(local) || stagedArchiveIdentity, `unresolved learning-path step: ${step.url}`);
    }
  }
});

test('review companion count is derived from its governed learning path', () => {
  const review = model.reviews[0];
  const path = model.learning_paths.find((entry) => entry.related_review_ids.includes(review.id));
  assert.ok(path);
  assert.equal(path.steps.filter((step) => step.kind !== 'learning-record').length, review.companion_count);
});

test('hub statically renders every record with one canonical identity', () => {
  const total = model.courses.length + model.reviews.length + model.learning_paths.length;
  assert.equal(count(html, /data-course-entry\b/g), total);
  assert.equal(count(html, /<h1\b/g), 1);
  assert.equal(count(html, /<main\b/g), 1);
  assert.match(html, /<link rel="canonical" href="https:\/\/1200km\.com\/courses\/"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/1200km\.com\/courses\/"/);
  assert.match(html, /data-pagefind-body/);
  assert.match(html, /<label hidden><span>Topic<\/span>/);
  assert.match(html, /course-library\.css\?v=20260830-1/);
  assert.match(html, /course-library\.js\?v=20260830-1/);
  assert.match(html, /<meta property="og:image" content="https:\/\/1200km\.com\/assets\/site-og-v2\.png"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /href="\/courses\/"[^>]*>Courses<\/a>/);
  assert.match(html, /aria-current="page" href="\/courses\/">Courses<\/a>/);
  assert.match(html, /id="platform-sidenav"/);
  assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")[^>]*>[^<]/);
  for (const entry of [...model.courses, ...model.reviews, ...model.learning_paths]) {
    assert.equal(count(html, new RegExp(`id="(?:course|review|path)-${escapeRegex(entry.id)}"`, 'g')), 1, entry.id);
  }
});

test('hub structured data distinguishes owned course, independent review, and learning resource', () => {
  const source = html.match(/<script type="application\/ld\+json" id="course-library-structured-data">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source);
  const graph = JSON.parse(source)['@graph'];
  assert.deepEqual(graph.map((entry) => entry['@type']), ['CollectionPage', 'ItemList', 'BreadcrumbList']);
  const items = graph.find((entry) => entry['@type'] === 'ItemList');
  assert.equal(items.numberOfItems, 3);
  assert.deepEqual(items.itemListElement.map((entry) => entry.item['@type']), ['Course', 'LearningResource', 'LearningResource']);
  assert.equal(items.itemListElement[1].item.about['@type'], 'Course');
  assert.equal(items.itemListElement[1].item.subjectOf['@type'], 'TechArticle');
  assert.equal(items.itemListElement[1].item.subjectOf.url, model.reviews[0].full_review_url);
  assert.equal('reviewRating' in items.itemListElement[1].item, false);
});

test('TrainSec detail remains a distinct learning record synchronized with the model', () => {
  const review = model.reviews[0];
  for (const value of [review.title, review.provider, review.course_url, review.syllabus_url, review.recommendation_label]) {
    assert.match(detail, new RegExp(escapeRegex(value)));
  }
  assert.match(detail, /article:published_time" content="2026-08-19"/);
  assert.match(detail, /article:modified_time" content="2026-08-30"/);
  assert.match(detail, /src="\/assets\/site-og-v2\.png"/);
  assert.match(detail, /class="course-table-scroll" role="region"[^>]*tabindex="0"><table>/);
  assert.match(detail, /aria-current="location" href="\/courses\/">Courses<\/a>/);
  assert.match(detail, /id="platform-sidenav"/);
  assert.match(detail, /id="main-content"/);
  assert.doesNotMatch(detail, /href="https:\/\/training\.trainsec\.net\/malware-analyst-professional-level-1\/v6dfz"/);
});

test('client provides progressive filtering, URL restoration, sorting, reset, and live status', () => {
  for (const token of [
    'URLSearchParams', 'history.replaceState', 'data-course-search', 'data-course-kind',
    'data-course-topic', 'data-course-level', 'data-course-sort', 'data-course-reset',
    'data-course-count', 'data-course-empty', 'entry.hidden', 'list.appendChild',
  ]) assert.match(client, new RegExp(escapeRegex(token)), token);
});
