#!/usr/bin/env python3
"""Evidence-first HTML/sitemap crawl. Requires requests and beautifulsoup4.

Counts unique linking source/target URLs, not repeated navigation anchors. Crawl
the full sitemap plus HTML links within three homepage hops. Cache is keyed by
requested URL; use a new --cache directory for a fresh verification crawl.
"""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

BASE = 'https://1200km.com'
COLUMNS = 'url,status,title,title_len,description,desc_len,h1,h1_count,word_count,canonical,canonical_self,has_jsonld,jsonld_types,has_lang,og_complete,inbound_internal_links,outbound_internal_links,in_sitemap,noindex,template'.split(',')
ASSET = re.compile(r'\.(?:png|jpe?g|webp|gif|svg|ico|pdf|zip|gz|7z|tar|pcap|pcapng|exe|dll|bin|json|csv|xml|txt|md|js|css|map|woff2?|ttf|mp[34]|webm)$', re.I)

def normalize(url, base=BASE + '/'):
    parts = urlsplit(urljoin(base, url))
    if parts.hostname not in {'1200km.com', 'anpa1200.github.io', 'www.1200km.com'}:
        return None
    # Fragments are locations in a document; query variants are not new pages.
    return urlunsplit(('https', '1200km.com', parts.path or '/', '', ''))

def types(value):
    result = []
    if isinstance(value, dict):
        result += value.get('@type', []) if isinstance(value.get('@type'), list) else [value['@type']] if '@type' in value else []
        for item in value.values(): result += types(item)
    elif isinstance(value, list):
        for item in value: result += types(item)
    return sorted(set(result))

def parse(url, response):
    soup = BeautifulSoup(response.get('text', ''), 'lxml')
    def meta(name):
        tag = soup.find('meta', attrs={'name': name}) or soup.find('meta', attrs={'property': name})
        return str(tag.get('content', '')) if tag else ''
    canonical_tag = soup.find('link', rel=lambda v: v and 'canonical' in v)
    canonical = urljoin(response.get('final_url', url), canonical_tag.get('href', '')) if canonical_tag else ''
    title = soup.title.get_text(' ', strip=True) if soup.title else ''
    h1s = [tag.get_text(' ', strip=True) for tag in soup.find_all('h1')]
    structured, failures = [], []
    for tag in soup.find_all('script', type='application/ld+json'):
        try: structured.append(json.loads(tag.string or tag.get_text()))
        except Exception as exc: failures.append(str(exc))
    links = []
    for tag in soup.find_all('a', href=True):
        target = normalize(tag['href'], response.get('final_url', url))
        if target and target != url and not ASSET.search(urlsplit(target).path):
            links.append({'url': target, 'anchor': tag.get_text(' ', strip=True), 'contextual': not bool(tag.find_parent(['nav', 'header', 'footer', 'aside']))})
    docusaurus = bool(soup.find(id='__docusaurus'))
    content = soup.select_one('article .markdown') or soup.find('main') or soup.find('article') or soup.body or soup
    content = BeautifulSoup(str(content), 'lxml')
    for tag in content.select('script, style, nav, footer, aside, [hidden], [aria-hidden="true"], .pagination-nav, .theme-doc-toc-desktop, .theme-doc-toc-mobile'):
        tag.decompose()
    text = content.get_text(' ', strip=True)
    headings = [{'tag': tag.name, 'id': tag.get('id', ''), 'text': tag.get_text(' ', strip=True)} for tag in content.find_all(re.compile('^h[1-6]$'))]
    paragraphs = [tag.get_text(' ', strip=True) for tag in content.find_all('p')]
    robots = meta('robots')
    description = meta('description')
    html = soup.find('html')
    return {
        'url': url, 'status': response['status'], 'title': title, 'title_len': len(title),
        'description': description, 'desc_len': len(description), 'h1': ' | '.join(h1s), 'h1_count': len(h1s),
        'word_count': len(re.findall(r"\b[\w]+(?:['’-][\w]+)*\b", text)),
        'canonical': canonical, 'canonical_self': canonical == url,
        'has_jsonld': bool(structured), 'jsonld_types': '|'.join(types(structured)),
        'has_lang': bool(html and html.get('lang')), 'og_complete': all(meta('og:' + k) for k in ['title', 'description', 'type', 'url', 'image']),
        'inbound_internal_links': 0, 'outbound_internal_links': len(set(link['url'] for link in links)),
        'in_sitemap': False, 'noindex': bool(re.search(r'\bnoindex\b', robots, re.I)),
        'template': 'article-archive' if '/articles/read/' in url else 'docusaurus' if docusaurus else 'static',
        'final_url': response.get('final_url', url), 'final_status': response.get('final_status', response['status']),
        'content_type': response.get('content_type', ''), 'error': response.get('error', ''),
        'links': links, 'headings': headings, 'paragraphs': paragraphs[:4], 'body_excerpt': text[:4000],
        'jsonld': structured, 'jsonld_errors': failures, 'robots': robots,
        'html_sha256': hashlib.sha256(response.get('text', '').encode()).hexdigest(),
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='reports/technical-seo-20260920/before')
    parser.add_argument('--cache', default='.cache/technical-seo-before')
    parser.add_argument('--sitemap', default=BASE + '/sitemap.xml')
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--site', help='Read a staged filesystem; statuses are simulated, not live HTTP proof.')
    args = parser.parse_args()
    out, cache = Path(args.output), Path(args.cache)
    out.mkdir(parents=True, exist_ok=True); cache.mkdir(parents=True, exist_ok=True)
    def fetch(url):
        key = cache / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if key.exists(): return json.loads(key.read_text())
        if args.site:
            path = Path(args.site) / urlsplit(url).path.lstrip('/')
            if path.is_dir(): path /= 'index.html'
            if not path.exists() and not path.suffix: path = path.with_suffix('.html')
            result = {'status': 200 if path.is_file() else 404, 'final_status': 200 if path.is_file() else 404, 'final_url': url, 'content_type': 'text/html' if path.suffix == '.html' else '', 'text': path.read_text(errors='replace') if path.is_file() else ''}
        else:
            try:
                response = requests.get(url, timeout=(10, 35), headers={'User-Agent': '1200km-owner-SEO-audit/1.0 (+https://1200km.com/)'})
                response.encoding = 'utf-8'
                result = {'status': response.history[0].status_code if response.history else response.status_code, 'final_status': response.status_code, 'final_url': response.url, 'content_type': response.headers.get('content-type', ''), 'text': response.text}
            except requests.RequestException as exc:
                result = {'status': 0, 'final_status': 0, 'final_url': url, 'text': '', 'error': str(exc)}
        key.write_text(json.dumps(result))
        return result
    sitemap_urls, visited = set(), set()
    def sitemap(url):
        if url in visited: return
        visited.add(url)
        root = ET.fromstring(fetch(url)['text'])
        locs = [element.text for element in root.iter() if element.tag.endswith('}loc') or element.tag == 'loc']
        if root.tag.endswith('sitemapindex'):
            for child in locs: sitemap(child)
        else:
            for item in locs:
                if normalize(item): sitemap_urls.add(normalize(item))
    sitemap(args.sitemap)
    pages = {}
    def batch(urls):
        pending = sorted(set(urls) - pages.keys())
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for url, response in zip(pending, pool.map(fetch, pending)):
                pages[url] = parse(url, response)
                if len(pages) % 100 == 0: print(f'Parsed {len(pages)} URLs', flush=True)
    print(f'Sitemap has {len(sitemap_urls)} unique URLs', flush=True)
    batch(sitemap_urls | {BASE + '/'})
    frontier, reached = {BASE + '/'}, {BASE + '/'}
    for depth in range(1, 4):
        next_urls = {link['url'] for source in frontier for link in pages.get(source, {}).get('links', [])} - reached
        batch(next_urls)
        reached |= next_urls; frontier = next_urls
        print(f'Homepage depth {depth}: {len(next_urls)} new URLs; total {len(pages)}', flush=True)
    inbound = defaultdict(set)
    for source, page in pages.items():
        for link in page['links']: inbound[link['url']].add(source)
    for url, page in pages.items():
        page['in_sitemap'] = url in sitemap_urls
        page['inbound_internal_links'] = len(inbound[url])
    rows = [pages[url] for url in sorted(pages)]
    with (out / 'seo-audit.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=COLUMNS, extrasaction='ignore')
        writer.writeheader(); writer.writerows(rows)
    (out / 'pages.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')
    indexable = [page for page in rows if page['status'] == 200 and 'html' in page['content_type'] and not page['noindex'] and page['canonical_self']]
    def duplicates(field):
        groups = defaultdict(list)
        for page in indexable: groups[page[field]].append(page['url'])
        return {value: urls for value, urls in groups.items() if len(urls) > 1}
    summary = {'checked_at': datetime.now(timezone.utc).isoformat(), 'mode': 'staged-files' if args.site else 'live-http', 'total_urls': len(rows), 'sitemap_urls': len(sitemap_urls), 'homepage_3_click_urls': len(reached), 'status_counts': dict(Counter(page['status'] for page in rows)), 'indexable_self_canonical_html': len(indexable), 'duplicate_titles': duplicates('title'), 'duplicate_descriptions': duplicates('description'), 'indexable_title_outside_30_60': sum(not 30 <= page['title_len'] <= 60 for page in indexable), 'indexable_description_outside_120_155': sum(not 120 <= page['desc_len'] <= 155 for page in indexable), 'indexable_bad_h1': sum(page['h1_count'] != 1 for page in indexable), 'indexable_missing_lang': sum(not page['has_lang'] for page in indexable), 'indexable_missing_jsonld': sum(not page['has_jsonld'] for page in indexable), 'indexable_invalid_jsonld': sum(bool(page['jsonld_errors']) for page in indexable), 'indexable_zero_inbound': [page['url'] for page in indexable if page['inbound_internal_links'] == 0], 'query_policy': 'Fragment and query variants collapse to the underlying path; URLs differing by path or trailing slash remain distinct.'}
    (out / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    (out / 'urls.txt').write_text('\n'.join(sorted(pages)) + '\n')
    print(json.dumps({k: v for k, v in summary.items() if not isinstance(v, (dict, list))}, indent=2), flush=True)

if __name__ == '__main__': main()
