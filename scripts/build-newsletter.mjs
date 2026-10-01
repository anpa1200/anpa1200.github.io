#!/usr/bin/env node
// Newsletter signup (Buttondown) rendered into pages between
// <!-- newsletter:start --> and <!-- newsletter:end --> markers.
// A plain HTML form posts to Buttondown: no third-party script, so the
// strict CSP only needs form-action https://buttondown.com.
// --check fails when any page is stale relative to data/newsletter.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(ROOT, 'data/newsletter.json'), 'utf8'));
if (config.provider !== 'buttondown') throw new Error(`Unsupported newsletter provider: ${config.provider}`);
if (config.username && !/^[A-Za-z0-9_-]{2,64}$/.test(config.username)) throw new Error('Invalid Buttondown username');
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const PAGES = [
  { file: 'subscribe.html', id: 'page', heading: 'h2', title: 'Email updates' },
  { file: 'index.html', id: 'home', heading: 'h2', title: 'Get new research by email' },
];

export function newsletterBlock({ id, heading = 'h2', title }) {
  const titleId = `newsletter-title-${id}`;
  const intro = 'New CTI, detection-engineering and malware-analysis research from 1200km.com, a few emails a month at most.';
  const rss = '<a href="/feed.xml">RSS feed</a>';
  if (!config.username) {
    return `<section class="newsletter-signup" aria-labelledby="${titleId}" data-newsletter="rss-only">
  <${heading} id="${titleId}">${escape(title)}</${heading}>
  <p>Follow new research through the ${rss}. Email delivery is being set up.</p>
</section>`;
  }
  const action = `https://buttondown.com/api/emails/embed-subscribe/${escape(config.username)}`;
  return `<section class="newsletter-signup" aria-labelledby="${titleId}" data-newsletter="buttondown">
  <${heading} id="${titleId}">${escape(title)}</${heading}>
  <p>${intro} Confirm by email (double opt-in); every issue has an unsubscribe link. <a href="/privacy.html#newsletter">How your address is handled</a>.</p>
  <form class="newsletter-form" action="${action}" method="post" target="_blank">
    <label for="newsletter-email-${id}">Email address</label>
    <input id="newsletter-email-${id}" type="email" name="email" required autocomplete="email" inputmode="email" placeholder="you@example.com">
    <input type="hidden" name="embed" value="1">
    <button type="submit" class="button primary">Subscribe</button>
  </form>
  <p class="newsletter-alt">Prefer no email? Use the ${rss}.</p>
</section>`;
}

const MARKER = /(<!-- newsletter:start -->)[\s\S]*?(<!-- newsletter:end -->)/;
const check = process.argv.includes('--check');
const stale = [];
for (const page of PAGES) {
  const path = join(ROOT, page.file);
  const html = readFileSync(path, 'utf8');
  if (!MARKER.test(html)) throw new Error(`${page.file}: newsletter markers missing`);
  const next = html.replace(MARKER, (_, start, end) => `${start}\n${newsletterBlock(page)}\n${end}`);
  if (next === html) continue;
  if (check) stale.push(page.file);
  else writeFileSync(path, next);
}
if (stale.length) throw new Error(`Newsletter block is stale in: ${stale.join(', ')}. Run node scripts/build-newsletter.mjs`);
console.log(`Newsletter (${config.username ? `buttondown:${config.username}` : 'RSS only, username not set'}) ${check ? 'verified' : 'rendered'} in ${PAGES.length} pages.`);
