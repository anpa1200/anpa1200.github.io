import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { transformHtmlElements } from './html-token-utils.mjs';

const policy = JSON.parse(readFileSync(new URL('../data/seo-policy.json', import.meta.url), 'utf8'));
const targets = JSON.parse(readFileSync(new URL('../data/seo-targeting.json', import.meta.url), 'utf8')).pages;
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function seoPolicy(url) {
  try { return policy.pages[new URL(url, 'https://1200km.com').pathname]; } catch { return undefined; }
}

export function sitemapEligible(url) {
  const entry = seoPolicy(url);
  return !entry || ['Priority', 'Supporting'].includes(entry.classification);
}

function setMeta(html, attribute, name, value) {
  let seen = false;
  const out = html.replace(/<meta\b[^>]*>/gi, tag => {
    const $ = load(tag, null, false);
    const element = $('meta');
    if ((element.attr(attribute) || '').toLowerCase() !== name) return tag;
    if (seen) return '';
    seen = true;
    if (/\bcontent\s*=/i.test(tag)) return tag.replace(/(\bcontent\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s>]+)/i, () => `content="${escape(value)}"`);
    return tag.replace(/\s*\/?>$/, ending => ` content="${escape(value)}"${ending}`);
  });
  return seen ? out : out.replace(/<\/head>/i, () => `<meta ${attribute}="${name}" content="${escape(value)}">\n</head>`);
}

export function applyIndexPolicy(html, canonical) {
  let out = html.replace(/<html\b[^>]*>/i, tag => /\blang\s*=/i.test(tag) ? tag : tag.replace(/>$/, ' lang="en">'));
  const entry = seoPolicy(canonical);
  if (entry?.classification === 'Thin') return setMeta(out, 'name', 'robots', 'noindex,follow');
  if (entry?.classification === 'Excluded' || /<meta\b[^>]*(?:noindex|http-equiv=["']refresh)/i.test(out)) return out;
  return setMeta(out, 'name', 'robots', 'index,follow,max-image-preview:large');
}

/** Head changes do not serialize or reformat the page body. Docusaurus body
 * changes belong in its source; post-render edits would break hydration. */
export function applyTechnicalSeo(html, canonical, { body = true } = {}) {
  let out = applyIndexPolicy(html, canonical);
  const entry = seoPolicy(canonical);
  if (!entry || entry.classification === 'Excluded') return out;
  out = transformHtmlElements(out, 'title', el => `${el.openTag}${escape(entry.title)}${el.closeTag}`);
  for (const [attr, key, value] of [
    ['name', 'description', entry.description],
    ['property', 'og:title', entry.title], ['name', 'twitter:title', entry.title],
    ['property', 'og:description', entry.description], ['name', 'twitter:description', entry.description],
  ]) out = setMeta(out, attr, key, value);
  if (!body || /\bid=["']__docusaurus["']/i.test(out)) return out;
  const target = targets[new URL(canonical).pathname];
  if (target?.h1) {
    let first = true;
    out = transformHtmlElements(out, 'h1', el => {
      if (!first) return el.full;
      first = false;
      return `${el.openTag}${escape(target.h1)}${el.closeTag}`;
    });
  }
  if (target?.intro) {
    const split = out.search(/<\/h1>/i) + 5;
    if (split >= 5) {
      let replaced = false;
      out = out.slice(0, split) + transformHtmlElements(out.slice(split), 'p', el => {
        if (replaced || /data-content-freshness|content-freshness|eyebrow/.test(el.openTag)) return el.full;
        replaced = true;
        return `${el.openTag}${escape(target.intro)}${el.closeTag}`;
      });
    }
  }
  let h1Count = 0;
  out = transformHtmlElements(out, 'h1', el => ++h1Count === 1 ? el.full : el.full.replace(/^<h1\b/i, '<h2').replace(/<\/h1>$/i, '</h2>'));
  return out;
}

export function contentSignals(html) {
  const $ = load(html);
  const content = $('article.markdown').first().length ? $('article.markdown').first() : $('main').first().length ? $('main').first() : $('article').first();
  const copy = content.clone();
  copy.find('script,style,nav,footer,[data-article-discovery],.theme-doc-footer').remove();
  const text = copy.text().replace(/\s+/g, ' ').trim();
  const steps = content.find('h2,h3').toArray().map(el => ({ name: $(el).text().replace(/[\u200b\u200c]/g, '').trim(), id: $(el).attr('id') }))
    .filter(step => /^(?:step\s+\d+\b|\d+[.)]\s+(?:install|configure|create|run|verify|test|start|deploy|connect|open|check)\b)/i.test(step.name) && step.id);
  return { wordCount: text ? text.split(/\s+/).length : 0, steps };
}

/** Repair schema-domain errors without changing the visible content or
 * inventing facts. The source value is retained on its valid property/type. */
export function repairSchemaDomains(value) {
  if (Array.isArray(value)) return value.map(repairSchemaDomains);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, repairSchemaDomains(child)]));
  const types = [result['@type']].flat().filter(Boolean);
  if (result.codeRepository && types.includes('SoftwareApplication') && !types.includes('SoftwareSourceCode')) result['@type'] = [...types, 'SoftwareSourceCode'];
  if (types.some(type => ['TechArticle', 'Article', 'BlogPosting', 'HowTo'].includes(type))) {
    delete result.breadcrumb; // The connected WebPage owns the breadcrumb.
    if (result.primaryImageOfPage) { result.image ||= result.primaryImageOfPage; delete result.primaryImageOfPage; }
  }
  if (types.includes('WebPage') && result.proficiencyLevel) { result.educationalLevel = result.proficiencyLevel; delete result.proficiencyLevel; }
  if (types.includes('ItemList')) delete result.dateModified; // Kept on WebPage.
  if (types.includes('ListItem')) delete result.additionalProperty; // Non-schema taxonomy annotations remain in the visible catalog.
  if (types.includes('ImageObject')) for (const dimension of ['width', 'height']) {
    if (typeof result[dimension] === 'number') result[dimension] = { '@type': 'QuantitativeValue', value: result[dimension], unitText: 'px' };
  }
  return result;
}
