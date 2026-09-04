#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { applyPlatformSidebar } from './platform-sidebar-lib.mjs';
import { applySiteShell, loadSiteShell } from './site-shell-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_PATH = join(ROOT, 'data', 'course-library.json');
const SCHEMA_PATH = join(ROOT, 'data', 'course-library.schema.json');
const OUTPUT_PATH = join(ROOT, 'courses', 'index.html');
const DETAIL_PATH = join(ROOT, 'courses', 'trainsec-malware-analyst-professional-level-1', 'index.html');
const check = process.argv.includes('--check');
const model = JSON.parse(await readFile(MODEL_PATH, 'utf8'));
const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
const shell = loadSiteShell(ROOT);
const page = shell.pages.find((item) => item.path === 'courses/index.html');
const canonical = 'https://1200km.com/courses/';

if (!page) throw new Error('courses/index.html is missing from data/site-shell.json.');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function localPath(url) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://1200km.com') throw new Error(`Expected a 1200km URL: ${url}`);
  return parsed.pathname;
}

function label(value) {
  return String(value).replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function assertModel() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  if (!ajv.validate(schema, model)) {
    throw new Error(`Course library failed JSON Schema validation:\n- ${ajv.errorsText(ajv.errors, { separator: '\n- ' })}`);
  }
  const courseIds = new Set();
  const reviewIds = new Set();
  const pathIds = new Set();
  const canonicalUrls = new Set();
  if (!model.courses?.length || !model.reviews?.length || !model.learning_paths?.length) {
    throw new Error('Course library requires at least one original course, review, and learning path.');
  }
  for (const course of model.courses) {
    if (courseIds.has(course.id)) throw new Error(`Duplicate original course id: ${course.id}`);
    courseIds.add(course.id);
    if (canonicalUrls.has(course.canonical_url)) throw new Error(`Duplicate canonical URL: ${course.canonical_url}`);
    canonicalUrls.add(course.canonical_url);
    if (course.available_modules > course.planned_modules) {
      throw new Error(`${course.id}: available modules cannot exceed planned modules.`);
    }
    if (course.topics.some((topic) => topic.includes('|'))) throw new Error(`${course.id}: topic labels cannot contain |.`);
  }
  for (const review of model.reviews) {
    if (reviewIds.has(review.id)) throw new Error(`Duplicate course review id: ${review.id}`);
    reviewIds.add(review.id);
    for (const url of [review.canonical_url, review.full_review_url]) {
      if (canonicalUrls.has(url)) throw new Error(`Duplicate canonical or narrative URL: ${url}`);
      canonicalUrls.add(url);
    }
    if (review.status === 'completed' && !review.completed_at) {
      throw new Error(`${review.id}: completed review is missing completed_at.`);
    }
    if (!(review.completed_at <= review.published_at && review.published_at <= review.updated_at)) {
      throw new Error(`${review.id}: expected completed_at <= published_at <= updated_at.`);
    }
    if (review.facts_verified_at < review.published_at || review.syllabus_verified_at < review.published_at) {
      throw new Error(`${review.id}: verification dates cannot precede publication.`);
    }
    if (review.companion_count < 0 || review.topics.length === 0 || review.evidence.length === 0) {
      throw new Error(`${review.id}: review metadata is incomplete.`);
    }
    if (review.topics.some((topic) => topic.includes('|'))) throw new Error(`${review.id}: topic labels cannot contain |.`);
    for (const asset of [review.cover.src]) {
      if (!existsSync(join(ROOT, asset.replace(/^\//, '')))) throw new Error(`${review.id}: missing cover asset ${asset}.`);
    }
  }
  for (const path of model.learning_paths) {
    if (pathIds.has(path.id)) throw new Error(`Duplicate learning path id: ${path.id}`);
    pathIds.add(path.id);
    if (path.published_at > path.updated_at || path.facts_verified_at < path.published_at) {
      throw new Error(`${path.id}: path chronology is inconsistent.`);
    }
    for (const reviewId of path.related_review_ids) {
      if (!reviewIds.has(reviewId)) throw new Error(`${path.id}: unknown related review ${reviewId}.`);
    }
    for (const courseId of path.related_course_ids) {
      if (!courseIds.has(courseId)) throw new Error(`${path.id}: unknown related course ${courseId}.`);
    }
    if (path.related_review_ids.length + path.related_course_ids.length === 0) {
      throw new Error(`${path.id}: learning path must reference at least one governed course or review.`);
    }
    const positions = path.steps.map((step) => step.position);
    if (positions.some((position, index) => position !== index + 1)) {
      throw new Error(`${path.id}: step positions must be contiguous and start at 1.`);
    }
    if (new Set(path.steps.map((step) => step.url)).size !== path.steps.length) {
      throw new Error(`${path.id}: learning-path step URLs must be unique.`);
    }
    if (path.topic.includes('|')) throw new Error(`${path.id}: topic labels cannot contain |.`);
  }
}

assertModel();

const topicOccurrences = new Map();
for (const values of [
  ...model.courses.map((course) => course.topics),
  ...model.reviews.map((review) => review.topics),
  ...model.learning_paths.map((path) => [path.topic]),
]) {
  for (const topic of new Set(values.map((value) => value.toLowerCase()))) {
    topicOccurrences.set(topic, (topicOccurrences.get(topic) || 0) + 1);
  }
}
const topics = [...topicOccurrences.entries()]
  .filter(([, occurrences]) => occurrences >= 2)
  .map(([topic]) => topic)
  .sort((left, right) => left.localeCompare(right));
const levels = [...new Set([
  ...model.courses.map((course) => course.level),
  ...model.reviews.map((review) => review.level),
  ...model.learning_paths.map((path) => path.level),
])].sort();
const completedReviews = model.reviews.filter((review) => review.status === 'completed').length;
const publishedPaths = model.learning_paths.filter((path) => path.status === 'published').length;
const companionMaterials = model.reviews.reduce((sum, review) => sum + review.companion_count, 0);
const originalCourses = model.courses.length;

function chips(values) {
  return values.map((value) => `<span class="course-chip">${escapeHtml(value)}</span>`).join('');
}

function reviewCard(review) {
  const courseLinkLabel = review.commercial_disclosure.affiliate_link ? 'Official course (affiliate)' : 'Official course';
  const courseLinkRel = review.commercial_disclosure.affiliate_link ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  const search = [
    review.title, review.provider, review.summary, review.level, review.format,
    review.recommendation_label, ...review.topics, ...review.audiences,
  ].join(' ').toLowerCase();
  return `        <article class="course-entry course-review-card" id="review-${escapeHtml(review.id)}" data-course-entry data-kind="review" data-level="${escapeHtml(review.level)}" data-status="${escapeHtml(review.status)}" data-topics="${escapeHtml(review.topics.join('|').toLowerCase())}" data-date="${escapeHtml(review.published_at)}" data-title="${escapeHtml(review.title.toLowerCase())}" data-search="${escapeHtml(search)}">
          <div class="course-card-media"><img src="${escapeHtml(review.cover.src)}" alt="${escapeHtml(review.cover.alt)}" width="${review.cover.width}" height="${review.cover.height}" loading="lazy" decoding="async" /></div>
          <div class="course-card-body">
            <div class="course-card-kicker"><span>Independent course review</span><strong>${escapeHtml(review.recommendation_label)}</strong></div>
            <h3><a href="${escapeHtml(localPath(review.canonical_url))}">${escapeHtml(review.title)}</a></h3>
            <p class="course-provider">${escapeHtml(review.provider)} · ${escapeHtml(label(review.level))} · ${escapeHtml(label(review.format))}</p>
            <p>${escapeHtml(review.summary)}</p>
            <dl class="course-card-facts">
              <div><dt>Status</dt><dd>${escapeHtml(label(review.status))}</dd></div>
              <div><dt>Advertised content</dt><dd>${review.advertised_content_hours} hours</dd></div>
              <div><dt>Materials</dt><dd>${review.learning_materials}</dd></div>
              <div><dt>Companions</dt><dd>${review.companion_count}</dd></div>
            </dl>
            <div class="course-chip-list" aria-label="Course topics">${chips(review.topics)}</div>
            <details class="course-evidence"><summary>Evidence, strengths, and limitations</summary>
              <div class="course-evidence-grid">
                <div><h4>Evidence recorded</h4><ul>${review.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
                <div><h4>Strengths</h4><ul>${review.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
                <div><h4>Limitations</h4><ul>${review.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
                <div><h4>Commercial disclosure</h4><ul><li>Access: ${escapeHtml(label(review.commercial_disclosure.access_basis))}</li><li>Affiliate link: ${review.commercial_disclosure.affiliate_link ? 'yes' : 'no'}</li><li>Provider-controlled conclusions: ${review.commercial_disclosure.provider_controlled_conclusions ? 'yes' : 'no'}</li></ul></div>
              </div>
            </details>
            <p class="course-verification">Review scope: ${escapeHtml(review.review_scope)}. Course facts were checked against ${review.official_fact_sources.length} official sources; ${review.local_evidence_sources.length} local evidence record${review.local_evidence_sources.length === 1 ? '' : 's'} preserve the assessment.</p>
            <div class="course-actions">
              <a class="button primary" href="${escapeHtml(localPath(review.canonical_url))}">Open learning record</a>
              <a class="button" href="${escapeHtml(localPath(review.full_review_url))}">Read full review</a>
              <a class="button" href="${escapeHtml(review.course_url)}" target="_blank" rel="${courseLinkRel}">${courseLinkLabel} <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a>
            </div>
          </div>
        </article>`;
}

function authoredCourseCard(course) {
  const search = [course.title, course.creator, course.summary, course.status, course.level, course.format, ...course.topics, ...course.audiences].join(' ').toLowerCase();
  return `        <article class="course-entry authored-course-card" id="course-${escapeHtml(course.id)}" data-course-entry data-kind="course" data-level="${escapeHtml(course.level)}" data-status="${escapeHtml(course.status)}" data-topics="${escapeHtml(course.topics.join('|').toLowerCase())}" data-date="${escapeHtml(course.updated_at)}" data-title="${escapeHtml(course.title.toLowerCase())}" data-search="${escapeHtml(search)}">
          <div class="authored-course-copy">
            <p class="course-card-kicker"><span>Original 1200km course</span><strong>${escapeHtml(label(course.status))}</strong></p>
            <h3><a href="${escapeHtml(localPath(course.canonical_url))}">${escapeHtml(course.title)}</a></h3>
            <p class="course-provider">${escapeHtml(course.creator)} · ${escapeHtml(label(course.level))} · ${escapeHtml(label(course.format))}</p>
            <p>${escapeHtml(course.summary)}</p>
            <div class="course-chip-list" aria-label="Course topics">${chips(course.topics)}</div>
            <p class="course-verification">Facts last checked ${escapeHtml(course.facts_verified_at)} against the published course record.</p>
            <div class="course-actions"><a class="button primary" href="${escapeHtml(localPath(course.canonical_url))}">Open course</a></div>
          </div>
          <aside class="authored-course-progress" aria-label="Course publication progress">
            <span>${course.available_modules} of ${course.planned_modules}</span>
            <strong>modules available</strong>
            <meter min="0" max="${course.planned_modules}" value="${course.available_modules}">${course.available_modules} of ${course.planned_modules}</meter>
            <p>The syllabus is public. Published modules are usable now; the remaining curriculum is explicitly under construction.</p>
          </aside>
        </article>`;
}

function learningPathCard(path) {
  const relatedReviews = path.related_review_ids.map((id) => model.reviews.find((item) => item.id === id));
  const relatedCourses = path.related_course_ids.map((id) => model.courses.find((item) => item.id === id));
  const anchors = [
    ...relatedReviews.map((review) => `<a href="${escapeHtml(localPath(review.canonical_url))}">${escapeHtml(review.title)}</a> learning record`),
    ...relatedCourses.map((course) => `<a href="${escapeHtml(localPath(course.canonical_url))}">${escapeHtml(course.title)}</a> course`),
  ];
  const search = [path.title, path.summary, path.level, path.topic, ...path.outcomes, ...path.steps.map((step) => step.title)].join(' ').toLowerCase();
  return `        <article class="course-entry learning-path-card" id="path-${escapeHtml(path.id)}" data-course-entry data-kind="path" data-level="${escapeHtml(path.level)}" data-status="${escapeHtml(path.status)}" data-topics="${escapeHtml(path.topic.toLowerCase())}" data-date="${escapeHtml(path.published_at)}" data-title="${escapeHtml(path.title.toLowerCase())}" data-search="${escapeHtml(search)}">
          <div class="learning-path-heading">
            <div><p class="course-card-kicker"><span>Evidence-backed learning path</span><strong>${path.steps.length} sequenced steps</strong></p><h3>${escapeHtml(path.title)}</h3><p>${escapeHtml(path.summary)}</p></div>
            <div class="learning-path-meta"><span>${escapeHtml(label(path.level))}</span><span>${escapeHtml(path.status)}</span></div>
          </div>
          <div class="learning-path-layout">
            <ol class="learning-path-steps">${path.steps.map((step) => `<li><span>${step.position}</span><div><small>${escapeHtml(label(step.kind))}</small><a href="${escapeHtml(step.url)}">${escapeHtml(step.title)}</a></div></li>`).join('')}</ol>
            <aside class="learning-path-outcomes" aria-labelledby="outcomes-${escapeHtml(path.id)}"><h4 id="outcomes-${escapeHtml(path.id)}">Expected outcomes</h4><ul>${path.outcomes.map((outcome) => `<li>${escapeHtml(outcome)}</li>`).join('')}</ul><p>Anchored to ${anchors.join(' and ')}.</p></aside>
          </div>
        </article>`;
}

const entries = [
  ...model.courses.map(authoredCourseCard),
  ...model.reviews.map(reviewCard),
  ...model.learning_paths.map(learningPathCard),
].join('\n');

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: model.title,
      description: model.description,
      datePublished: model.published_at,
      dateModified: model.updated_at,
      inLanguage: 'en',
      author: { '@id': 'https://1200km.com/#person' },
      mainEntity: { '@id': `${canonical}#library` },
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#library`,
      name: 'Cybersecurity course reviews and learning paths',
      numberOfItems: model.courses.length + model.reviews.length + model.learning_paths.length,
      itemListElement: [
        ...model.courses.map((course, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Course',
            name: course.title,
            description: course.summary,
            url: course.canonical_url,
            datePublished: course.published_at,
            dateModified: course.updated_at,
            educationalLevel: label(course.level),
            provider: { '@type': 'Person', name: course.creator, url: course.creator_url },
          },
        })),
        ...model.reviews.map((review, index) => ({
          '@type': 'ListItem',
          position: model.courses.length + index + 1,
          item: {
            '@type': 'LearningResource',
            name: `${review.title} — independent learning record`,
            url: review.canonical_url,
            description: review.summary,
            learningResourceType: 'Independent course learning record',
            datePublished: review.published_at,
            dateModified: review.updated_at,
            author: { '@id': 'https://1200km.com/#person' },
            about: {
              '@type': 'Course',
              name: review.title,
              url: review.course_url,
              provider: { '@type': 'Organization', name: review.provider, url: review.provider_url },
            },
            subjectOf: {
              '@type': 'TechArticle',
              name: `${review.title} — full narrative review`,
              url: review.full_review_url,
            },
          },
        })),
        ...model.learning_paths.map((path, index) => ({
          '@type': 'ListItem',
          position: model.courses.length + model.reviews.length + index + 1,
          item: {
            '@type': 'LearningResource',
            name: path.title,
            description: path.summary,
            url: `${canonical}#path-${path.id}`,
            datePublished: path.published_at,
            dateModified: path.updated_at,
            educationalLevel: label(path.level),
            teaches: path.outcomes,
            author: { '@id': 'https://1200km.com/#person' },
          },
        })),
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1200km.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses & Learning Paths', item: canonical },
      ],
    },
  ],
};

const title = 'Cybersecurity Courses & Learning Paths | 1200km';
const description = 'Independent cybersecurity course reviews and evidence-backed learning paths with completed study records, practical materials, limitations, and recommendations.';

const body = `    <section class="course-hero" aria-labelledby="course-library-title">
      <div class="course-hero-copy">
        <p class="page-eyebrow">1200km learning module · Independent reviews</p>
        <h1 id="course-library-title">Courses &amp; Learning Paths</h1>
        <p class="page-lead">${escapeHtml(model.description)}</p>
        <div class="page-hero-links"><a class="button primary" href="#course-library">Explore the library</a><a class="button" href="#review-method">Read the review method</a><a class="button" href="/cyber-knowledge/helping-materials/">Open helping materials</a></div>
      </div>
      <aside class="course-principles" aria-label="Publication standard"><strong>Completion before recommendation</strong><p>${escapeHtml(model.editorial_policy.completion_rule)}</p><span>Updated ${escapeHtml(model.updated_at)}</span></aside>
    </section>
    <section class="course-metrics" aria-label="Courses and learning paths summary">
      <article><strong>${originalCourses}</strong><span>original course in development</span></article>
      <article><strong>${completedReviews}</strong><span>completed review${completedReviews === 1 ? '' : 's'}</span></article>
      <article><strong>${publishedPaths}</strong><span>published learning path${publishedPaths === 1 ? '' : 's'}</span></article>
      <article><strong>${companionMaterials}</strong><span>original companion guides</span></article>
    </section>
    <section id="course-library" aria-labelledby="course-library-heading">
      <div class="section-heading"><div><p class="page-eyebrow">Searchable learning record</p><h2 id="course-library-heading">Courses, reviews, and learning paths</h2><p>Filter original courses, completed independent reviews, and sequenced learning paths. Every result remains readable without JavaScript.</p></div></div>
      <div class="course-controls" data-course-controls>
        <label><span>Search</span><input type="search" data-course-search placeholder="Course, provider, skill, topic…" autocomplete="off" /></label>
        <label><span>Content</span><select data-course-kind><option value="">Courses, reviews, and paths</option><option value="course">Original courses</option><option value="review">Course reviews</option><option value="path">Learning paths</option></select></label>
        <label${topics.length < 2 ? ' hidden' : ''}><span>Topic</span><select data-course-topic><option value="">All topics</option>${topics.map((topic) => `<option value="${escapeHtml(topic.toLowerCase())}">${escapeHtml(label(topic))}</option>`).join('')}</select></label>
        <label><span>Level</span><select data-course-level><option value="">All levels</option>${levels.map((level) => `<option value="${escapeHtml(level)}">${escapeHtml(label(level))}</option>`).join('')}</select></label>
        <label><span>Sort</span><select data-course-sort><option value="newest">Newest first</option><option value="title">Title A–Z</option></select></label>
        <button class="button" type="button" data-course-reset>Reset</button>
      </div>
      <p class="course-result-status" aria-live="polite"><strong data-course-count>${model.courses.length + model.reviews.length + model.learning_paths.length}</strong> records shown <span data-course-active></span></p>
      <div class="course-entry-list" data-course-list>${entries}</div>
      <p class="course-empty" data-course-empty hidden>No course reviews or learning paths match the selected filters.</p>
    </section>
    <section id="review-method" class="course-method" aria-labelledby="review-method-title">
      <div><p class="page-eyebrow">Editorial standard</p><h2 id="review-method-title">How reviews earn publication</h2><p>The module separates course facts from personal evaluation and does not convert access, marketing material, or an unfinished syllabus into a recommendation.</p></div>
      <div class="course-method-grid">
        <article><span>01</span><h3>Complete</h3><p>${escapeHtml(model.editorial_policy.completion_rule)}</p></article>
        <article><span>02</span><h3>Verify</h3><p>${escapeHtml(model.editorial_policy.evidence_rule)}</p></article>
        <article><span>03</span><h3>Disclose</h3><p>${escapeHtml(model.editorial_policy.commercial_rule)}</p></article>
        <article><span>04</span><h3>Decide independently</h3><p>${escapeHtml(model.editorial_policy.independence)}</p></article>
      </div>
    </section>`;

let html = `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://1200km.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="Andrey Pautov" />
    <meta name="keywords" content="cybersecurity courses, course reviews, learning paths, malware analysis training, security education, hands-on labs" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <meta name="theme-color" content="#0f62fe" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="1200km Security Research" />
    <meta property="og:image" content="https://1200km.com/assets/site-og-v2.png" />
    <meta property="og:image:alt" content="Courses and learning paths at 1200km" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="https://1200km.com/assets/site-og-v2.png" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="1200km Security Research Feed" href="https://1200km.com/feed.xml" />
    <link rel="icon" href="/assets/ap-logo-72.png" type="image/png" sizes="72x72" />
    <link rel="stylesheet" href="/assets/site-theme.css?v=20260904-grey-red" />
    <link rel="stylesheet" href="/assets/course-library.css?v=20260830-1" />
    <script src="/assets/theme-bootstrap.js"></script>
    <script src="/assets/site-theme.js?v=20260904-grey-red" defer></script>
    <script src="/assets/site-performance.js" data-google-analytics-id="G-TMTG21RVHM" defer></script>
    <script src="/assets/course-library.js?v=20260830-1" defer></script>
    <script type="application/ld+json" id="course-library-structured-data">${safeJson(structuredData)}</script>
  </head>
  <body class="course-library-page" id="top">
    <header class="site-header"></header>
    <main id="main-content" data-pagefind-body>
${body}
    </main>
    <footer></footer>
  </body>
</html>
`;

html = applyPlatformSidebar(
  applySiteShell(html, shell, page),
  shell,
  { pathname: '/courses/' },
).replace(/^[ \t]+$/gm, '');

const detailPage = shell.pages.find((item) => item.path === 'courses/trainsec-malware-analyst-professional-level-1/index.html');
if (!detailPage) throw new Error('Course learning record is missing from data/site-shell.json.');
const currentDetail = await readFile(DETAIL_PATH, 'utf8');
const integratedDetail = applyPlatformSidebar(
  applySiteShell(currentDetail, shell, detailPage),
  shell,
  { pathname: '/courses/trainsec-malware-analyst-professional-level-1/' },
);

if (check) {
  if (!existsSync(OUTPUT_PATH) || await readFile(OUTPUT_PATH, 'utf8') !== html) {
    throw new Error('Courses and Learning Paths module is stale. Run npm run build-courses.');
  }
  if (currentDetail !== integratedDetail) {
    throw new Error('Course learning record shell or platform navigation is stale. Run npm run build-courses.');
  }
  console.log(`Courses module is current: ${model.courses.length} course(s), ${model.reviews.length} review(s), ${model.learning_paths.length} learning path(s).`);
} else {
  await writeFile(OUTPUT_PATH, html);
  if (currentDetail !== integratedDetail) await writeFile(DETAIL_PATH, integratedDetail);
  console.log(`Wrote Courses and Learning Paths module with ${model.courses.length} course(s), ${model.reviews.length} review(s), and ${model.learning_paths.length} path(s).`);
}
