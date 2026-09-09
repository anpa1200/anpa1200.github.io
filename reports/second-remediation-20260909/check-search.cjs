const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/home/andrey/git-projects/medium-scripts/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.PREVIEW_URL || 'http://127.0.0.1:4184', out=__dirname;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();const report={browser:b.version(),checks:[],failures:[]};
async function check(name,fn){try{await fn();report.checks.push(name)}catch(e){report.failures.push(name+': '+e.message)}fs.writeFileSync(out+'/search.json',JSON.stringify(report,null,2));}
const input=p.locator('pagefind-input input');
await check('query reload copied URL history Unicode clear and preserved parameter',async()=>{
 await p.goto(base+'/search.html?q=T1059.003&keep=yes');await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(500);assert.match(await p.locator('.pf-result-link').first().getAttribute('href'),/techniques\/T1059.003/);
 await input.fill('MCP');await p.waitForTimeout(700);assert.equal(new URL(p.url()).searchParams.get('q'),'MCP');assert.equal(new URL(p.url()).searchParams.get('keep'),'yes');
 const copied=await b.newPage();await copied.goto(p.url());await copied.locator('.pf-result-link').first().waitFor();assert.equal(await copied.locator('pagefind-input input').inputValue(),'MCP');await copied.close();
 await p.reload();await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(600);assert.equal(await input.inputValue(),'MCP');await input.fill('T1059.003');await input.press('Enter');await p.waitForTimeout(600);await p.goBack();await p.waitForTimeout(600);assert.equal(await input.inputValue(),'MCP');await p.goForward();await p.waitForTimeout(600);assert.equal(await input.inputValue(),'T1059.003');
 await input.fill('שלום & MCP + "é"');await p.waitForTimeout(600);assert.equal(new URL(p.url()).searchParams.get('q'),'שלום & MCP + "é"');await input.fill('');await p.waitForTimeout(600);assert.equal(new URL(p.url()).searchParams.get('q'),null);
});
await check('filters pagination refresh Back and clear',async()=>{
 await p.goto(base+'/search.html?q=security');await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(500);
 const select=p.locator('pagefind-filter-dropdown[filter="primary_type"]');await select.getByRole('combobox').click();await select.locator('[role=option][data-value=guide]').click();await p.waitForTimeout(700);assert.equal(new URL(p.url()).searchParams.get('f.primary_type'),'guide');
 await p.reload();await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(500);assert.equal(await select.locator('[data-value=guide]').getAttribute('aria-selected'),'true');
 await p.locator('[data-site-search-clear-all]').click();await p.waitForTimeout(500);assert.equal(new URL(p.url()).searchParams.get('f.primary_type'),null);
 await p.locator('[data-site-search-load-more]').click();await p.waitForTimeout(500);assert.equal(new URL(p.url()).searchParams.get('limit'),'40');await p.reload();await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(500);assert.equal(await p.locator('pagefind-results').getAttribute('max-results'),'40');
 await p.goBack();await p.waitForTimeout(500);assert.equal(new URL(p.url()).searchParams.get('limit'),null);
});
await check('newer input wins during delayed initialization',async()=>{
 await p.route('**/pagefind-component-ui.js*',async r=>{await new Promise(done=>setTimeout(done,1400));await r.continue()});
 await p.goto(base+'/search.html?q=T1059.003',{waitUntil:'commit'});await p.locator('[data-site-search-input] input').fill('MCP');await p.locator('.pf-result-link').first().waitFor();await p.waitForTimeout(700);assert.equal(await input.inputValue(),'MCP');assert.equal(new URL(p.url()).searchParams.get('q'),'MCP');await p.unroute('**/pagefind-component-ui.js*');
});
await check('rapid queries focus empty state friendly labels and analytics privacy',async()=>{
 const requests=[];p.on('request',r=>{if(/google-analytics|googletagmanager/.test(r.url()))requests.push(r.url())});
 for(const query of ['T1059.003','OilRig','"zxqvnevermatches1200km"','MCP'])await input.fill(query);await p.waitForTimeout(900);assert.equal(await input.inputValue(),'MCP');assert.equal(await input.evaluate(e=>e===document.activeElement),true);assert.match(await p.locator('.pf-result-link').first().textContent(),/MCP|Context Protocol/i);
 await input.fill('"zxqvnevermatches1200km"');await p.waitForTimeout(900);assert.equal(await p.locator('.pf-result-link:visible').count(),0);assert.match(await p.locator('.site-search-workspace').textContent(),/no results|no matching|try/i);
 await input.fill('T1059.003');await p.waitForTimeout(900);assert.match(await p.locator('.site-search-result-card').first().textContent(),/ATT&CK reference/);assert.equal(requests.length,0);await p.screenshot({path:out+'/search-desktop.png'});
});
await b.close();console.log(JSON.stringify(report,null,2));process.exitCode=report.failures.length?1:0;})().catch(e=>{console.error(e);process.exit(1)});
