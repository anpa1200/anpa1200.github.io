import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveDatesForUrl } from '../scripts/archive-dates-lib.mjs';
import { transformReleaseHtml, connectedGraphFromHtml } from '../scripts/release-html-lib.mjs';

const url = 'https://1200km.com/articles/read/2026/adversarygraph-pcap-investigation-stories/';
const row = {canonical_url: url.slice(0, -1), published_at: '2026-09-23', updated_at: '2026-09-23'};

test('clean article routes receive real dates from the pinned catalog', () => {
  assert.deepEqual(archiveDatesForUrl(url, [row]), {published: '2026-09-23', modified: '2026-09-23'});
  const output = transformReleaseHtml('<html lang="en"><head><title>PCAP investigation study</title><link rel="canonical" href="'+url+'"></head><body><main><article><h1>PCAP investigation study</h1><p>Measured investigation results.</p></article></main></body></html>', {
    canonical:url, datePublished:row.published_at, dateModified:row.updated_at,
  });
  assert.match(output, /data-content-freshness/);
  assert.match(output, /article:published_time[^>]*2026-09-23/);
  const article=connectedGraphFromHtml(output).find(n=>n['@type']==='TechArticle');
  assert.equal(article.datePublished,'2026-09-23');
});

test('unknown articles and invalid dates never inherit a build date', () => {
  const empty={published:'',modified:''};
  assert.deepEqual(archiveDatesForUrl(url,[]),empty);
  assert.deepEqual(archiveDatesForUrl(url,[{...row,published_at:'2026-02-30',updated_at:null}]),empty);
  assert.deepEqual(archiveDatesForUrl(url.replace('1200km.com','example.org'),[row]),empty);
  assert.deepEqual(archiveDatesForUrl(url,[{...row,updated_at:'2026-09-22'}]),{published:'2026-09-23',modified:'2026-09-23'});
});
