import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadSiteShell, renderHeader, renderFooter, applySiteShell } from './site-shell-lib.mjs';
const shell = loadSiteShell(process.cwd());
for (const [slug, title, description] of [['', 'Practical security learning paths', 'Ordered CTI, detection, AI security, and malware-triage tasks with prerequisites and expected outputs.'], ['command-shell-validation/', 'Validate a command-shell detection candidate', 'Read benign synthetic process events and verify a narrow detection candidate with positive and negative controls.']]) {
  const path = 'learning-paths/' + slug + 'index.html',
    url = 'https://1200km.com/' + path.replace('index.html', '');
  const page = shell.pages.find(p => p.path === path);
  const body = readFileSync('content/learning-paths/' + (slug ? 'command-shell-validation' : 'index') + '.html.inc', 'utf8');
  const schema = {
    '@context': 'https://schema.org',
    '@type': slug ? 'TechArticle' : 'CollectionPage',
    headline: title,
    name: title,
    url,
    description,
    dateModified: '2026-09-09',
    ...(slug ? {
      datePublished: '2026-09-09'
    } : {}),
    author: {
      '@type': 'Person',
      name: 'Andrey Pautov',
      url: 'https://1200km.com/about.html'
    }
  };
  let html = `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | 1200km</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="${slug ? 'article' : 'website'}"><meta property="og:image" content="https://1200km.com/assets/site-og-v2.png"><meta property="og:image:alt" content="1200km practical security learning"><link rel="stylesheet" href="/assets/site-theme.css?v=20260904-light-default"><script src="/assets/theme-bootstrap.js"></script><script src="/assets/site-theme.js?v=20260904-light-default" defer></script><script type="application/ld+json">${JSON.stringify(schema)}</script><style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:2rem 1rem;line-height:1.7}pre{padding:1rem;background:var(--surface-2,#eee)}li{margin-block:.5rem}</style></head><body>${renderHeader(shell, page)}<main id="main-content" data-pagefind-body><p><a href="/">Home</a> / <a href="/learning-paths/">Learning paths</a></p>${body}</main>${renderFooter(shell, page)}</body></html>\n`;
  html = applySiteShell(html, shell, page);
  mkdirSync('learning-paths/' + slug, {
    recursive: true
  });
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== html) throw Error('Learning path stale: ' + path);
  } else writeFileSync(path, html);
}
