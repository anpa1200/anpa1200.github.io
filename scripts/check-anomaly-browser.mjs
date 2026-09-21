#!/usr/bin/env node
// Local integration test against actual built article/source HTML. No live deploy.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync, statSync, writeFileSync} from 'node:fs';
import {mkdtemp} from 'node:fs/promises';
import {resolve, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL, fileURLToPath} from 'node:url';
import * as pagefind from 'pagefind';
import {anomalyAssignments, anomalyTaxonomy, anomalyTagsForUrl} from './anomaly-tags-lib.mjs';
import {localFileForUrl, prepareHtmlForSearch} from './search-index-lib.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name)+1] : fallback;
const archive = resolve(arg('--archive', '../anomaly-research-update/build'));
const browserModule = arg('--playwright', 'playwright');
const {chromium} = await import(browserModule.startsWith('/') ? pathToFileURL(browserModule).href : browserModule);
const temp = await mkdtemp(join(tmpdir(), '1200km-anomaly-browser-'));
const bundle = join(temp, 'pagefind');
const report = join(root, 'reports/anomaly-review-20260921');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm','.md':'text/plain; charset=utf-8'};
function local(path) {
  const isArchive = path.startsWith('/articles/read/') || path.startsWith('/articles/assets/') || path.startsWith('/articles/research/') || path==='/articles/';
  const base = path.startsWith('/pagefind/') ? bundle : isArchive ? archive : root;
  const relative = path.startsWith('/pagefind/') ? path.slice(10) : isArchive ? path.slice(10) : path.slice(1);
  const file = resolve(base, relative || 'index.html');
  if (!file.startsWith(base+'/')) return null;
  for (const candidate of [file, file+'.html', join(file, 'index.html')]) if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}
const indexed = [];
const {index, errors} = await pagefind.createIndex({forceLanguage:'en'});
assert.deepEqual(errors, []);
for (const row of anomalyAssignments) {
  const path = new URL(row.url).pathname;
  const file = local(path) || localFileForUrl(root, row.url);
  if (!file || !existsSync(file) || !file.endsWith('.html')) continue;
  const result = await index.addHTMLFile({url: path, content: prepareHtmlForSearch(row.url, readFileSync(file,'utf8'))});
  assert.deepEqual(result.errors, []);
  indexed.push(row.url);
}
assert.ok(indexed.includes(anomalyTaxonomy.article_url.replace(/\/$/,'')), 'Build the embedded archive first');
const written = await index.writeFiles({outputPath:bundle});
assert.deepEqual(written.errors, []);
await pagefind.close();
const server = createServer((req,res)=>{
  const path = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if (path==='/pagefind/search-governance.json') { res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({schema_version:1,records:{}})); return; }
  const file = local(path);
  if (!file) {res.writeHead(404).end('Not found'); return;}
  let content = readFileSync(file);
  if (file.endsWith('.html')) {
    content = content.toString().replaceAll('https://1200km.com', origin);
    if (!content.includes('/assets/site-search.js')) content = content.replace('</head>', '<script defer src="/assets/site-search.js"></script></head>');
  }
  res.writeHead(200,{'content-type':mime[extname(file)] || 'application/octet-stream','cache-control':'no-store'}).end(content);
});
await new Promise(resolveReady=>server.listen(0,'127.0.0.1',resolveReady));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:arg('--chrome','/usr/bin/google-chrome'),headless:true,args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errorsSeen = [];
page.on('pageerror',error=>errorsSeen.push(error.message));
await page.route('**/*',route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
const checks = [];
try {
  const articlePath = new URL(anomalyTaxonomy.article_url).pathname;
  await page.goto(origin+articlePath, {waitUntil:'domcontentloaded'});
  await page.locator('[data-anomaly-topics] li').nth(14).waitFor();
  assert.equal(await page.locator('[data-anomaly-topics]').count(),1);
  assert.equal(await page.locator('[data-anomaly-topics] li').count(),15);
  assert.equal(await page.locator('main article [data-anomaly-topics]').count(),1,'Topic component must be inside the article, not a main flex-row sibling');
  assert.equal(await page.locator('h1').count(),1);
  assert.ok(await page.locator('body').innerText().then(text=>/technical review status/i.test(text)));
  // Every definition anchor points to a real heading in this built article.
  for (const tag of anomalyTaxonomy.tags) assert.equal(await page.locator(`[id="${tag.id}"]`).count(),1);
  await page.locator('[data-anomaly-topics]').scrollIntoViewIfNeeded();
  await page.screenshot({path:join(report,'anomaly-topics-desktop.png')});
  checks.push('Built article: 15 topic rows, 15 real definition targets, one H1 and review warning.');
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-anomaly-topics]').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('[data-anomaly-topics]').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  assert.ok((await page.locator('[data-anomaly-topics]').boundingBox()).width>=250,'Mobile topics must not collapse to a narrow column');
  await page.screenshot({path:join(report,'anomaly-topics-mobile.png')});
  checks.push('Mobile topic component: no horizontal overflow at 390px.');
  // Emulate route replacement after hydration to exercise the shared SPA observer.
  const other = anomalyAssignments.find(row=>row.url.includes('/ITDR/') && row.evidence.length===1);
  await page.evaluate(path=>{history.pushState({},'',path); document.querySelector('[data-anomaly-topics]').remove();}, new URL(other.url).pathname);
  await page.waitForFunction(path=>document.querySelector('[data-anomaly-topics]')?.dataset.anomalyTopics===path,new URL(other.url).pathname);
  assert.equal(await page.locator('[data-anomaly-topics] li').count(),1);
  await page.evaluate(()=>{history.pushState({},'','/untagged-test'); window.dispatchEvent(new PopStateEvent('popstate'));});
  await page.waitForFunction(()=>!document.querySelector('[data-anomaly-topics]'));
  checks.push('Synthetic SPA route changes: replaced tags and removed stale tags on an untagged route.');
  await page.goto(origin+'/guides.html?tag=anomaly%3A%20temporal', {waitUntil:'domcontentloaded'});
  await page.locator('#guides-tag').waitFor();
  assert.equal(await page.locator('#guides-tag').inputValue(),'anomaly: temporal');
  assert.ok(await page.locator('.guide-item:not([hidden])').count()>0);
  for (const card of await page.locator('.guide-item:not([hidden])').all()) assert.ok((await card.innerText()).includes('Anomaly: Temporal'));
  checks.push('Real guide catalog: anomaly query-string filter selects only matching cards.');
  await page.goto(origin+'/search.html?f.anomaly=anomaly-temporal',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('pagefind-input input'));
  await page.getByText('Advanced filters',{exact:true}).click();
  await page.locator('pagefind-filter-dropdown[filter="anomaly"]').waitFor();
  const result = await page.evaluate(async()=>{
    const pf = await import('/pagefind/pagefind.js');
    const filters = await pf.filters();
    const search = await pf.search(null,{filters:{anomaly:'anomaly-temporal'}});
    return {filters,urls:await Promise.all(search.results.map(async row=>(await row.data()).url))};
  });
  assert.equal(Object.keys(result.filters.anomaly).length,15);
  const expected = indexed.filter(url=>anomalyTagsForUrl(url).includes('anomaly-temporal')).map(url=>new URL(url).pathname).sort();
  assert.deepEqual(result.urls.map(url=>new URL(url,origin).pathname.replace(/\/$/,'')).sort(),expected);
  await page.waitForFunction(()=>document.querySelector('[data-site-search-active-list]')?.textContent.includes('Anomaly Temporal'));
  checks.push(`Real Pagefind subset: all 15 facets; temporal filter returns exactly ${expected.length} expected pages; search UI restores deep link.`);
  assert.deepEqual(errorsSeen,[],'Browser runtime errors');
  writeFileSync(join(report,'browser-validation.json'),JSON.stringify({passed:true,scope:'Local build integration; Pagefind indexes only reviewed pages with local source/built HTML. SPA route test is synthetic, not a live companion deployment.',indexed_pages:indexed.length,total_reviewed_pages:anomalyAssignments.length,checks,errors:errorsSeen,temp_bundle:bundle},null,2)+'\n');
  console.log(JSON.stringify({passed:true,indexed_pages:indexed.length,checks}));
} finally { await browser.close(); await new Promise(resolveClosed=>server.close(resolveClosed)); }
