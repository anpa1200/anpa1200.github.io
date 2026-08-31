#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag, fallback = '') => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const expectedCommit = valueAfter('--site-commit', process.env.GITHUB_SHA || '');
const expectedArchiveCommit = valueAfter('--archive-commit', process.env.ARTICLE_ARCHIVE_COMMIT || '');
const reportPath = resolve(valueAfter('--report', 'production-verification.json'));
const maxAttempts = Number(valueAfter('--attempts', '6'));
const origins = [
  { id: 'custom-domain', url: valueAfter('--custom-origin', 'https://1200km.com') },
  { id: 'github-pages', url: valueAfter('--pages-origin', 'https://anpa1200.github.io') },
];
const knowledgeModel = JSON.parse(await readFile(resolve(ROOT, 'data/cyber-knowledge.json'), 'utf8'));

if (!/^[0-9a-f]{40}$/i.test(expectedCommit)) throw new Error(`Expected full site commit, received ${expectedCommit || '(missing)'}`);
if (!/^[0-9a-f]{40}$/i.test(expectedArchiveCommit)) throw new Error(`Expected full archive commit, received ${expectedArchiveCommit || '(missing)'}`);

const wait = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const sha256 = (body) => createHash('sha256').update(body).digest('hex');

async function fetchRecord(origin, path, attempt) {
  const separator = path.includes('?') ? '&' : '?';
  const requestedUrl = `${origin}${path}${separator}verify=${expectedCommit.slice(0, 12)}-${attempt}-${Date.now()}`;
  const response = await fetch(requestedUrl, {
    cache: 'no-store',
    headers: { accept: 'text/html,application/json;q=0.9,*/*;q=0.5', 'cache-control': 'no-cache', pragma: 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  return {
    path,
    requested_url: requestedUrl,
    final_url: response.url,
    status: response.status,
    headers: Object.fromEntries([...response.headers.entries()].filter(([name]) => ['cache-control', 'content-type', 'etag', 'last-modified', 'server', 'x-cache'].includes(name))),
    response_sha256: sha256(body),
    body,
  };
}

function buildMetaPresent(body) {
  return new RegExp(`<meta\\b[^>]*name=["']1200km-build["'][^>]*content=["']${expectedCommit}["']`, 'i').test(body)
    || new RegExp(`<meta\\b[^>]*content=["']${expectedCommit}["'][^>]*name=["']1200km-build["']`, 'i').test(body);
}

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function titleContent(body) {
  return decodeHtml(body.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() || '');
}

function metaContent(body, attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = body.match(new RegExp(`<meta\\b[^>]*${attribute}=["']${escaped}["'][^>]*>`, 'i'))?.[0] || '';
  return decodeHtml(tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '');
}

function headingContent(body) {
  return decodeHtml((body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim());
}

function knowledgeChecks(domain, body) {
  const expectedTitle = `${domain.short} Field Guide — Cyber Knowledge | 1200km`;
  const expectedImage = `https://1200km.com/assets/cyber-knowledge-og/${domain.id}.png`;
  return [
    { label: 'current build ID', pass: buildMetaPresent(body) },
    { label: `canonical title ${expectedTitle}`, pass: titleContent(body) === expectedTitle },
    { label: `canonical H1 ${domain.name}`, pass: headingContent(body) === domain.name },
    { label: `canonical OG image ${domain.id}.png`, pass: metaContent(body, 'property', 'og:image') === expectedImage },
    { label: `canonical Twitter image ${domain.id}.png`, pass: metaContent(body, 'name', 'twitter:image') === expectedImage },
    { label: `OG image alt names ${domain.name}`, pass: metaContent(body, 'property', 'og:image:alt') === `${domain.name} — 1200km Cyber Knowledge` },
  ];
}

function pageChecks(path, body, articleCount) {
  const common = [{ label: 'current build ID', pass: buildMetaPresent(body) }];
  const checks = {
    '/': [...common,
      { label: 'Explore research', pass: body.includes('Explore research') },
      { label: 'AdversaryGraph hero action', pass: /class=["'][^"']*button[^"']*["'][^>]*href=["'][^"']*adversarygraph/i.test(body) },
    ],
    '/about.html': [...common,
      { label: 'fact attributes', pass: body.includes('data-site-fact=') && body.includes('data-fact-value=') },
      { label: `archive count ${articleCount}`, pass: body.includes(`data-fact-value="${articleCount}"`) },
      { label: 'accepted and open contribution facts are separate', pass: body.includes('contributions.accepted_external') && body.includes('contributions.open_external') },
    ],
    '/projects.html': [...common,
      { label: 'Portfolio Map', pass: body.includes('Portfolio Map') },
      { label: 'Product Names and Lifecycle', pass: body.includes('Product Names and Lifecycle') },
    ],
    '/articles/': [...common,
      { label: 'local canonical archive', pass: /rel=["']canonical["'][^>]*href=["']https:\/\/1200km\.com\/articles\//i.test(body) || /href=["']https:\/\/1200km\.com\/articles\/["'][^>]*rel=["']canonical["']/i.test(body) },
      { label: `archive count ${articleCount}`, pass: new RegExp(`(?:Articles[^<]{0,80}|of\\s+)${articleCount}`, 'i').test(body.replace(/<[^>]+>/g, ' ')) },
    ],
    '/threat-matrix/': [...common,
      { label: 'Threat Matrix name', pass: body.includes('Threat Matrix') },
      { label: 'public read-only boundary', pass: /public[\s\S]{0,80}read-only/i.test(body) },
      { label: 'global research search', pass: body.includes('Search all 1200km research') },
    ],
    '/privacy.html': [...common,
      { label: 'Privacy and Data Handling', pass: body.includes('Privacy and Data Handling') },
    ],
    '/courses/': [...common,
      { label: 'Courses and Learning Paths H1', pass: headingContent(body) === 'Courses & Learning Paths' },
      { label: 'completed TrainSec learning record', pass: body.includes('/courses/trainsec-malware-analyst-professional-level-1/') && body.includes('Recommended for practical learners') },
      { label: 'original AI Security course', pass: body.includes('/ai-security-course.html') && body.includes('Current Development') },
    ],
    '/courses/trainsec-malware-analyst-professional-level-1/': [...common,
      { label: 'TrainSec learning record H1', pass: headingContent(body) === 'TrainSec Malware Analyst Professional Level 1' },
      { label: 'learning-record boundary', pass: body.includes('Independent Learning Record') && body.includes('advertised 8.5 hours') },
      { label: 'canonical course identity', pass: /rel=["']canonical["'][^>]*href=["']https:\/\/1200km\.com\/courses\/trainsec-malware-analyst-professional-level-1\//i.test(body) || /href=["']https:\/\/1200km\.com\/courses\/trainsec-malware-analyst-professional-level-1\/["'][^>]*rel=["']canonical["']/i.test(body) },
    ],
    '/ai-security-course/module-00/chapter-03.html': [...common,
      { label: 'Chapter 3 H1', pass: headingContent(body) === 'Neural Networks and Optimization' },
      { label: 'Chapter 3 completion status', pass: /<strong[^>]*>Chapter complete<\/strong>/.test(body) && body.includes('Chapter 3 status: complete.') },
      { label: 'Chapter 3 evidence release', pass: body.includes('MITRE ATLAS v2026.07 release') && body.includes('/ai-security-course/module-00-workbook.html#chapter-03-assessment') },
      { label: 'Chapter 3 publication identity', pass: body.includes('"dateModified":"2026-08-30"') && body.includes('https://medium.com/@1200km/ai-security-course-module-00-chapter-3-1bf0411472f6') },
    ],
  };
  return checks[path] || common;
}

async function verifyOrigin(origin, attempt) {
  const records = [];
  const buildRecord = await fetchRecord(origin.url, '/build.json', attempt);
  records.push(buildRecord);
  let build;
  try { build = JSON.parse(buildRecord.body); } catch { build = null; }
  const factsRecord = await fetchRecord(origin.url, '/data/site-facts.json', attempt);
  records.push(factsRecord);
  let facts;
  try { facts = JSON.parse(factsRecord.body); } catch { facts = null; }
  const articleCount = facts?.facts?.['content.local_article_archive']?.value;
  const identityChecks = [
    { label: 'build.json HTTP 200', pass: buildRecord.status === 200 },
    { label: 'build.json expected site commit', pass: build?.site_commit === expectedCommit },
    { label: 'build.json expected archive commit', pass: build?.archive_source_commit === expectedArchiveCommit },
    { label: 'build.json artifact digest', pass: /^sha256:[0-9a-f]{64}$/i.test(build?.artifact_digest || '') },
    { label: 'site facts available', pass: factsRecord.status === 200 && Number.isInteger(articleCount) },
  ];
  for (const path of ['/', '/about.html', '/projects.html', '/articles/', '/threat-matrix/', '/privacy.html', '/courses/', '/courses/trainsec-malware-analyst-professional-level-1/', '/ai-security-course/module-00/chapter-03.html']) {
    const record = await fetchRecord(origin.url, path, attempt);
    record.fingerprints = pageChecks(path, record.body, articleCount);
    records.push(record);
  }
  for (const domain of knowledgeModel.domains) {
    const path = `/${domain.path}`;
    const record = await fetchRecord(origin.url, path, attempt);
    record.fingerprints = knowledgeChecks(domain, record.body);
    records.push(record);
  }
  for (const record of records) delete record.body;
  const failures = [
    ...identityChecks.filter((check) => !check.pass).map((check) => check.label),
    ...records.flatMap((record) => (record.fingerprints || []).filter((check) => !check.pass).map((check) => `${record.path}: ${check.label}`)),
    ...records.filter((record) => record.status !== 200).map((record) => `${record.path}: HTTP ${record.status}`),
  ];
  return { origin: origin.url, identity: build, identity_checks: identityChecks, records, failures, pass: failures.length === 0 };
}

const attempts = [];
let finalResults = [];
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    finalResults = [];
    for (const origin of origins) finalResults.push({ id: origin.id, ...await verifyOrigin(origin, attempt) });
  } catch (error) {
    finalResults = [{ id: 'verification-runtime', pass: false, failures: [error.message], records: [] }];
  }
  attempts.push({ attempt, checked_at: new Date().toISOString(), results: finalResults });
  if (finalResults.every((result) => result.pass)) break;
  if (attempt < maxAttempts) await wait(Math.min(2 ** attempt * 2_000, 32_000));
}

const custom = finalResults.find((result) => result.id === 'custom-domain');
const pages = finalResults.find((result) => result.id === 'github-pages');
const comparisons = [];
if (custom && pages) {
  const paths = new Set([...custom.records.map((record) => record.path), ...pages.records.map((record) => record.path)]);
  for (const path of paths) {
    const left = custom.records.find((record) => record.path === path);
    const right = pages.records.find((record) => record.path === path);
    comparisons.push({
      path,
      hashes_match: left?.response_sha256 === right?.response_sha256,
      custom_final_url: left?.final_url,
      pages_final_url: right?.final_url,
      redirect_behavior_matches: left?.final_url?.replace('1200km.com', 'ORIGIN') === right?.final_url?.replace('anpa1200.github.io', 'ORIGIN'),
    });
  }
}

const report = {
  expected_site_commit: expectedCommit,
  expected_archive_commit: expectedArchiveCommit,
  completed_at: new Date().toISOString(),
  pass: finalResults.every((result) => result.pass),
  final_results: finalResults,
  origin_comparisons: comparisons,
  attempts,
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.pass) {
  console.error(`Production verification failed after ${attempts.length} attempt(s). Report: ${reportPath}`);
  for (const result of finalResults) result.failures?.forEach((failure) => console.error(`- ${result.id}: ${failure}`));
  process.exit(1);
}
console.log(`Production verification passed for ${expectedCommit} on both configured entry points.`);
console.log(`Report: ${reportPath}`);
