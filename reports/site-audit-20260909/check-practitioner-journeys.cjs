// PLAYWRIGHT_MODULE=/path/to/playwright node this-file.cjs /path/to/staged/site
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/andrey/git-projects/medium-scripts/node_modules/playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(process.argv[2] || '/tmp/1200km-audit-release-preview');
  const report = { site: root, checks: [], failures: [] };
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/') && file !== root) { res.writeHead(404).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file += '/index.html';
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  report.browser = browser.version();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  async function check(name, fn) {
    try { await fn(); report.checks.push(name); } catch (error) { report.failures.push(name + ': ' + error.message); }
  }
  await check('Homepage to detection task and runnable fixture downloads', async () => {
    await page.goto(base);
    await page.locator('.audience-cta').filter({ hasText: 'Build and validate' }).click();
    await page.locator('a[href="/learning-paths/command-shell-validation/"]').first().click();
    await page.getByRole('heading', { name: /Validate a command-shell/, level: 1 }).waitFor();
    for (const file of ['events.json', 'validate.py']) {
      const response = await page.request.get(base + '/learning-paths/command-shell-validation/' + file);
      assert.equal(response.status(), 200);
      assert.ok((await response.body()).length > 100);
    }
  });
  await check('Static technique to selected workspace, copy, query persistence and refresh', async () => {
    await page.goto(base + '/threat-matrix/techniques/T1059.003/');
    const workspace = page.getByRole('link', { name: 'Open detection, hunting, mitigation, and evidence workspace' });
    const target = new URL(await workspace.getAttribute('href'));
    assert.equal(target.hash, '#/techniques/T1059.003');
    await page.goto(base + target.pathname + target.hash);
    await page.locator('.detail h1').filter({ hasText: 'Windows Command Shell' }).waitFor();
    await page.getByText('Copy entity link', { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-copy-status]')?.textContent.length);
    await page.reload();
    await page.locator('.detail h1').filter({ hasText: 'Windows Command Shell' }).waitFor();
    assert.ok((await page.locator('.detail').boundingBox()).y < 844, 'Selected entity must appear in the first mobile screen');
    await page.goto(base + '/threat-matrix/#/techniques/T1059.003?q=cmd');
    await page.locator('.detail h1').waitFor();
    assert.equal(await page.locator('input[placeholder*="Search"]').first().inputValue(), 'cmd');
  });
  await check('Directory filter to later detail, Back and complete exports', async () => {
    await page.goto(base + '/cyber-knowledge/knowledge-sources/');
    await page.locator('#knowledge-source-query').fill('SLSA');
    await page.waitForFunction(() => document.documentElement.dataset.directoryReady === 'true');
    await page.locator('#source-slsa').getByRole('link', { name: 'Read full assessment, limitations, and related sources' }).click();
    await page.locator('article#source-slsa details[open]').waitFor();
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#knowledge-source-query')?.value === 'SLSA');
    for (const [file, field] of [['knowledge-sources.json', 'sources'], ['reference-library.json', 'records']]) {
      const response = await page.request.get(base + '/data/' + file);
      assert.equal(response.status(), 200);
      assert.ok((await response.json())[field].length >= 165);
    }
  });
  await check('Guide TOC keyboard, code focus, next step and 320px reflow', async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(base + '/ai-security-course/module-00/chapter-04.html');
    const toc = page.locator('.toc a').first();
    await toc.focus(); await page.keyboard.press('Enter');
    assert.ok(new URL(page.url()).hash.length > 1);
    assert.equal(await page.locator('ol.toc').evaluate(n => getComputedStyle(n).listStyleType), 'none');
    const pre = page.locator('pre[tabindex="0"]').first();
    await pre.focus(); assert.ok(await pre.evaluate(n => n === document.activeElement));
    await page.keyboard.press('ArrowRight');
    assert.ok(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
    const next = page.locator('a[href="/ai-security-course/module-00.html#lifecycle"]');
    await next.focus(); await page.keyboard.press('Enter');
    await page.waitForURL('**/ai-security-course/module-00.html#lifecycle');
    assert.ok(page.url().endsWith('/ai-security-course/module-00.html#lifecycle'));
    for (const scale of [2, 4]) {
      await page.setViewportSize({ width: Math.floor(1280 / scale), height: 900 });
      assert.ok(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
    }
  });
  await check('Research to provenance, downloadable inventory and RSS', async () => {
    await page.goto(base + '/ai-attack-statistics/');
    await page.locator('a[href="/ai-attack-statistics/data/"]').first().click();
    await page.getByRole('heading', { name: 'Audit the collection boundary' }).waitFor();
    const csv = await page.request.get(base + '/ai-attack-statistics/data/publications.csv');
    assert.equal(csv.status(), 200); assert.ok((await csv.text()).includes('publication_id'));
    const readme = await page.request.get(base + '/ai-attack-statistics/data/README.md');
    assert.ok((await readme.text()).match(/cit|111|103/i));
    const feed = await page.request.get(base + '/feed.xml');
    assert.ok((await feed.text()).includes('https://1200km.com/ai-attack-statistics/'));
    assert.equal((await page.request.get(base + '/this-audit-route-does-not-exist-20260909/')).status(), 404);
  });
  await browser.close(); await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(path.join(__dirname, 'practitioner-journeys.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2)); process.exitCode = report.failures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exit(1); });
