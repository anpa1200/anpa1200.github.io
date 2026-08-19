import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TRAINSEC_SOURCE_ORIGIN = 'https://trainsec.net';
export const TRAINSEC_MIRROR_ORIGIN = 'https://1200km.com';
export const TRAINSEC_EXPECTED_ARTICLE_COUNT = 84;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = resolve(ROOT, 'data', 'trainsec-library.json');

function exactUrl(value, origin, label) {
  if (typeof value !== 'string' || !value) throw new Error(`${label} must be a non-empty absolute URL.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL: ${value}`);
  }
  if (parsed.origin !== origin || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an exact ${origin} URL without credentials, query, or fragment: ${value}`);
  }
  if (parsed.href !== value) throw new Error(`${label} is not stored in its exact normalized form: ${value}`);
  return parsed;
}

function expectedLocalPath(sourceUrl) {
  const source = exactUrl(sourceUrl, TRAINSEC_SOURCE_ORIGIN, 'TrainSec article URL');
  if (!source.pathname.startsWith('/library/') || !source.pathname.endsWith('/')) {
    throw new Error(`TrainSec article URL must use /library/.../ with a trailing slash: ${sourceUrl}`);
  }
  const slug = source.pathname
    .slice('/library/'.length)
    .replace(/\/+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (!slug) throw new Error(`TrainSec article URL has no article slug: ${sourceUrl}`);
  return `/articles/trainsec/${slug}.html`;
}

export function buildTrainsecCanonicalEntries(payload) {
  if (!payload || !Array.isArray(payload.articles)) throw new Error('TrainSec manifest must contain an articles array.');
  if (payload.article_count !== TRAINSEC_EXPECTED_ARTICLE_COUNT
    || payload.articles.length !== TRAINSEC_EXPECTED_ARTICLE_COUNT) {
    throw new Error(`TrainSec manifest must declare and contain exactly ${TRAINSEC_EXPECTED_ARTICLE_COUNT} articles.`);
  }

  const localUrls = new Set();
  const sourceUrls = new Set();
  return Object.freeze(payload.articles.map((article, index) => {
    const source = exactUrl(article?.url, TRAINSEC_SOURCE_ORIGIN, `TrainSec article ${index + 1} URL`);
    const localPath = expectedLocalPath(source.href);
    if (article?.local_path !== localPath) {
      throw new Error(`TrainSec article ${index + 1} local_path must be ${localPath}; received ${article?.local_path || '(missing)'}.`);
    }
    const localUrl = `${TRAINSEC_MIRROR_ORIGIN}${localPath}`;
    exactUrl(localUrl, TRAINSEC_MIRROR_ORIGIN, `TrainSec article ${index + 1} local URL`);
    if (localUrls.has(localUrl)) throw new Error(`Duplicate TrainSec local mirror URL: ${localUrl}`);
    if (sourceUrls.has(source.href)) throw new Error(`Duplicate TrainSec canonical source URL: ${source.href}`);
    localUrls.add(localUrl);
    sourceUrls.add(source.href);
    if (article.tags !== undefined
      && (!Array.isArray(article.tags) || article.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))) {
      throw new Error(`TrainSec article ${index + 1} tags must be non-empty strings.`);
    }
    return Object.freeze({
      local_path: localPath,
      local_url: localUrl,
      canonical_url: source.href,
      tags: Object.freeze([...(article.tags || [])]),
    });
  }));
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
export const trainsecCanonicalEntries = buildTrainsecCanonicalEntries(manifest);

const entryByLocal = new Map(trainsecCanonicalEntries.map((entry) => [entry.local_url, entry]));
const localByCanonical = new Map(trainsecCanonicalEntries.map((entry) => [entry.canonical_url, entry.local_url]));

function exactLookupUrl(value, origin) {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== origin || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return parsed.href === value ? parsed.href : null;
  } catch {
    return null;
  }
}

export function trainsecCanonicalForLocalUrl(value) {
  const localUrl = exactLookupUrl(value, TRAINSEC_MIRROR_ORIGIN);
  return localUrl ? entryByLocal.get(localUrl)?.canonical_url || null : null;
}

export function trainsecCanonicalEntryForLocalUrl(value) {
  const localUrl = exactLookupUrl(value, TRAINSEC_MIRROR_ORIGIN);
  return localUrl ? entryByLocal.get(localUrl) || null : null;
}

export function trainsecLocalUrlForCanonical(value) {
  const canonicalUrl = exactLookupUrl(value, TRAINSEC_SOURCE_ORIGIN);
  return canonicalUrl ? localByCanonical.get(canonicalUrl) || null : null;
}

export function isAuthorizedTrainsecCanonical(localUrl, canonicalUrl) {
  return trainsecCanonicalForLocalUrl(localUrl) === canonicalUrl
    && trainsecLocalUrlForCanonical(canonicalUrl) === localUrl;
}
