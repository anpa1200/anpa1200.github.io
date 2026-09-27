import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const project = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const site = resolve(args.includes('--site') ? args[args.indexOf('--site') + 1] : project);
const reportDir = resolve(args.includes('--report-dir') ? args[args.indexOf('--report-dir') + 1] : '/tmp/ttp-browser-evidence');
mkdirSync(reportDir, {recursive:true});
const mime = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer((req,res)=>{
  const route = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(site,'.'+route+(route.endsWith('/')?'index.html':''));
  if(!path.startsWith(site+sep)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
const profile=mkdtempSync('/tmp/ttp-release-chrome-');
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
const results=[], errors=[];let socket;
try {
 const endpoint=await new Promise((done,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',data=>{out+=data;const m=out.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);done(m[1]);}});chrome.on('error',reject);});
 socket=new WebSocket(endpoint);await new Promise(done=>socket.addEventListener('open',done,{once:true}));
 let next=0;const pending=new Map();
 socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);const item=pending.get(msg.id);if(item){pending.delete(msg.id);msg.error?item.reject(Error(JSON.stringify(msg.error))):item.done(msg.result);}});
 const send=(method,params={},sessionId)=>new Promise((done,reject)=>{const id=++next;pending.set(id,{done,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(m,p={})=>send(m,p,sessionId);
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const waitFor=async expression=>{const start=Date.now();while(!await evaluate(expression)){assert.ok(Date.now()-start<20000,expression);await new Promise(done=>setTimeout(done,100));}};
 await call('Page.enable');await call('Runtime.enable');
 const routes=['','tools/','detections/','telemetry/','techniques/enterprise/T1059.001/','techniques/ics/T0880/','techniques/mobile/T1423/','tools/nmap/','tools/S0002/','telemetry/DC0032/','detections/enterprise/T1059.001/','detections/enterprise/T1593/','detections/mobile/T1423/','detections/ics/T0880/','detections/rules/1ab3c5ed-5baf-417b-bb6b-78ca33f6c3df/','tags/environment/onprem/','tags/'];
 for(const width of [390,1440])for(const route of routes){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base+'/ttp-simulation/'+route});
  await waitFor("document.readyState==='complete' && (!document.querySelector('#app') || !document.querySelector('#app').hidden)");
  await evaluate(readFileSync(resolve(project,'node_modules/axe-core/axe.min.js'),'utf8'));
  const result=await evaluate(`(async()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+1,violations:(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),tagLinks:[...document.querySelectorAll('a.chip')].map(a=>a.getAttribute('href'))}))()`);
  assert.equal(result.h1,1,route);assert.equal(result.overflow,false,route);assert.deepEqual(result.violations,[],route);
  for(const link of result.tagLinks){const path=new URL(link,base).pathname;if(path.startsWith('/ttp-simulation/'))assert.ok(existsSync(resolve(site,'.'+path,'index.html')),link);}
  if(route===''){
   await evaluate(`document.querySelector('[name=q]').value='T1059.001';document.querySelector('[name=q]').dispatchEvent(new Event('input',{bubbles:true}));`);
   assert.equal(await evaluate("document.querySelectorAll('.technique-card').length"),1);
   assert.ok(await evaluate("document.querySelector('.technique-card .detection-link').href.includes('/detections/enterprise/T1059.001/')"));
  }
  if(route==='telemetry/DC0032/')assert.ok(await evaluate("document.querySelector('.telemetry-detection-link').href.includes('/detections/')"));
  if(route==='tools/nmap/')assert.ok(await evaluate("document.querySelector('.tool-detection-link').href.includes('/detections/')"));
  if(route==='detections/enterprise/T1059.001/'){
   await evaluate("document.querySelector('.sigma-source').open=true");
   await waitFor("document.querySelector('.sigma-source').dataset.loaded==='yes'");
   assert.ok(await evaluate("document.querySelector('.rule-content code').textContent.includes('title:')"));
   assert.ok(await evaluate("document.querySelector('.sigma-rule h3 a').href.includes('/detections/rules/')"));
  }
  if(['','tools/nmap/','detections/enterprise/T1059.001/'].includes(route)){
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   writeFileSync(resolve(reportDir,`${route.replaceAll('/','-')||'simulations'}-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  results.push({route,width,...result});
 }
 // Preserve filter queries as URL data, including markup-like input, without parsing them as HTML.
 const query='?q=T1059.001';
 await call('Page.navigate',{url:base+'/ttp-simulation/'+query});
 await waitFor("document.querySelectorAll('[data-technique-link]').length===1");
 const techniqueHref=await evaluate("document.querySelector('[data-technique-link]').href");
 assert.equal(new URL(techniqueHref).searchParams.get('q'),'T1059.001');
 assert.equal(await evaluate("Boolean(document.querySelector('#ttp-query-probe') || window.ttpQueryExecuted)"),false);
 const markup='\"><img id="ttp-query-probe" src="invalid" onerror="window.ttpQueryExecuted=true">';
 const detailUrl=techniqueHref+'&note='+encodeURIComponent(markup);
 await call('Page.navigate',{url:detailUrl});
 await waitFor("document.querySelector('[data-return-to-catalog]')");
 assert.equal(new URL(await evaluate("document.querySelector('[data-return-to-catalog]').href")).search,new URL(detailUrl).search);
 assert.equal(await evaluate("Boolean(document.querySelector('#ttp-query-probe') || window.ttpQueryExecuted)"),false);
 await call('Page.navigate',{url:base+'/ttp-simulation/?q='+encodeURIComponent(markup)});
 await waitFor("document.querySelector('#cards .empty')");
 assert.equal(await evaluate("Boolean(document.querySelector('#ttp-query-probe') || window.ttpQueryExecuted)"),false);
 // Staged article backlinks must survive hydration and removal/reconstruction of the main DOM.
 const guide='/articles/read/2024/2024-10-26-mastering-nmap-a-comprehensive-guide-to-network-exploration-and-security-auditing-part-1-f36d74d1b2c0/';
 if(existsSync(resolve(site,'.'+guide,'index.html'))){
  await call('Page.navigate',{url:base+guide});
  await waitFor("document.querySelector('#ttp-ecosystem[data-ttp-guide-key] a[href=\"/ttp-simulation/tools/nmap/\"]')");
  assert.ok(await evaluate("Boolean(document.querySelector('#ttp-ecosystem').closest('article'))"));
  await evaluate("document.querySelector('#ttp-ecosystem').remove()");
  await waitFor("document.querySelector('#ttp-ecosystem[data-ttp-guide-key] a[href=\"/ttp-simulation/tools/nmap/\"]')");
  assert.ok(await evaluate("document.querySelectorAll('main a[href=\"/ttp-simulation/tools/nmap/\"]').length>1"));
 }
 // Check readable static content with JavaScript disabled, separately from enhancement tests.
 await call('Emulation.setScriptExecutionDisabled',{value:true});
 for(const route of ['tools/','techniques/enterprise/T1059.001/','detections/enterprise/T1059.001/']){
  await call('Page.navigate',{url:base+'/ttp-simulation/'+route});
  await new Promise(done=>setTimeout(done,350));
  assert.ok(await evaluate("document.querySelector('#reference-copy h1') && !document.querySelector('#reference-copy').hidden"));
  assert.ok(await evaluate("document.querySelectorAll('#ecosystem-connections a').length>=3"));
 }
 assert.deepEqual(errors,[]);
 writeFileSync(resolve(reportDir,'browser.json'),JSON.stringify({checked_at:new Date().toISOString(),site,results,errors,no_js_routes:3,live_simulations_executed:0},null,2)+'\n');
 console.log(`Passed ${results.length} route/viewport configurations and three no-JavaScript pages; no accessibility, overflow or runtime failures.`);
}finally{socket?.close();chrome.kill('SIGTERM');server.close();}
