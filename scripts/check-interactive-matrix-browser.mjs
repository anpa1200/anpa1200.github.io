import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,existsSync,statSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const site=resolve(option('--site',project)),report=resolve(option('--report-dir','/tmp/interactive-matrix-browser'));
mkdirSync(report,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(site,'.'+route+(route.endsWith('/')?'index.html':''));if(!file.startsWith(site+sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[extname(file)]||'text/plain');res.end(readFileSync(file));});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=process.env.LIVE_ORIGIN||`http://127.0.0.1:${server.address().port}`;
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--user-data-dir='+mkdtempSync('/tmp/interactive-matrix-chrome-'),'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
const results=[],errors=[];let socket;
try{
  const endpoint=await new Promise((done,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',d=>{log+=d;const m=log.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);done(m[1]);}});chrome.on('error',reject);});
  socket=new WebSocket(endpoint);await new Promise(done=>socket.addEventListener('open',done,{once:true}));
  let id=0;const pending=new Map();
  const send=(method,params={},sessionId)=>new Promise((done,reject)=>{const n=++id;pending.set(n,{done,reject});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.done(m.result);}if(m.method==='Fetch.requestPaused')send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'},m.sessionId).catch(error=>errors.push(error.message));});
  const{targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const call=(m,p={})=>send(m,p,sessionId);
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async expression=>{const start=Date.now();while(!await evaluate(expression)){assert.ok(Date.now()-start<25000,expression);await new Promise(done=>setTimeout(done,100));}};
  await call('Page.enable');await call('Runtime.enable');
  const navigate=async(path,ready="document.documentElement.dataset.matrixReady==='true'")=>{await call('Page.navigate',{url:base+path});await wait("document.readyState==='complete' && ("+ready+")");};
  const set=(id,value)=>evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));`);
  for(const [width,theme] of [[390,'light'],[1440,'dark']])for(const view of ['enterprise','mobile','ics','atlas','iot','cloud','all']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await navigate('/attack-matrix/?view='+view);
    await evaluate(`localStorage.setItem('theme',${JSON.stringify(theme)});document.documentElement.setAttribute('data-theme',${JSON.stringify(theme)})`);
    // Theme colors animate in the shared shell; measure settled computed colors.
    await evaluate("new Promise(done=>setTimeout(done,400))");
    await evaluate(readFileSync(resolve(project,'node_modules/axe-core/axe.min.js'),'utf8'));
    const state=await evaluate(`(async()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+1,links:[...document.querySelectorAll('#matrix-results .im-technique')].map(a=>a.getAttribute('href')),duplicateIds:(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length-new Set(ids).size})(),violations:(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.slice(0,5).map(n=>n.target)}))}))()`);
    assert.equal(state.h1,1);assert.equal(state.overflow,false,view+' '+width);assert.equal(state.duplicateIds,0);assert.deepEqual(state.violations,[],view+' '+width);assert.ok(state.links.length>0);
    for(const link of state.links)assert.ok(existsSync(resolve(site,'.'+link,'index.html')),link);
    if(view==='enterprise'||view==='atlas'){await evaluate("document.querySelector('#matrix-results').scrollIntoView({block:'start',inline:'nearest'})");assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth+1"),false);const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(report,`${view}-${width}-${theme}.png`),Buffer.from(shot.data,'base64'));}
    results.push({view,width,theme,...state,links:state.links.length});
  }
  // Exact deep links, telemetry guide, platform filtering and list mode.
  await navigate('/attack-matrix/?q=T1059.001&sub=1');
  assert.ok(await evaluate("document.querySelector('#matrix-status').textContent.startsWith('1 of')"));
  assert.ok(await evaluate("document.querySelector('#matrix-results a[href=\"/ttp-simulation/techniques/enterprise/T1059.001/\"]')"));
  await set('matrix-telemetry','DC0032');
  assert.ok(await evaluate("document.querySelector('#matrix-telemetry-link').href.endsWith('/ttp-simulation/telemetry/DC0032/')"));
  await set('matrix-layout','list');assert.ok(await evaluate("document.querySelector('.im-layout-list')"));
  await evaluate("document.querySelector('[data-matrix-view=mobile]').click()");
  await set('matrix-platform','Android');
  assert.equal(await evaluate("new URL(location.href).searchParams.get('platform')"),'Android');
  await evaluate("document.querySelector('[data-matrix-view=atlas]').click()");
  assert.equal(await evaluate("document.querySelector('#matrix-platform').value"),'');
  assert.equal(await evaluate("document.querySelector('#matrix-telemetry').options.length"),1);
  await call('Runtime.evaluate',{expression:'history.back()'});await wait("new URL(location.href).searchParams.get('view')==='mobile' && document.querySelector('#matrix-platform').value==='Android'");
  // Verify a real cell navigation, not only an href string.
  await navigate('/attack-matrix/?view=atlas&q=AML.T0051.000');
  await evaluate("document.querySelector('#matrix-results a[href=\"/attack-matrix/atlas/AML.T0051.000/\"]').click()");
  await wait("location.pathname==='/attack-matrix/atlas/AML.T0051.000/' && document.readyState==='complete'");
  assert.match(await evaluate("document.querySelector('h1').textContent"),/AML.T0051.000/);
  await evaluate(readFileSync(resolve(project,'node_modules/axe-core/axe.min.js'),'utf8'));
  assert.deepEqual(await evaluate("(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id))()"),[]);
  // Keyboard-operated sub-technique disclosures; filtered URLs never become HTML.
  await navigate('/attack-matrix/');
  await evaluate("document.querySelector('#matrix-results .im-children summary').focus()");
  assert.equal(await evaluate("document.activeElement.tagName"),'SUMMARY');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await call('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait("document.querySelector('#matrix-results .im-children').open");
  const payload='<img id="matrix-query-probe" src=x onerror="window.matrixInjected=true">';
  await navigate('/attack-matrix/?q='+encodeURIComponent(payload));
  assert.ok(await evaluate("document.querySelector('.im-empty')"));
  assert.equal(await evaluate("Boolean(document.querySelector('#matrix-query-probe')||window.matrixInjected)"),false);
  await evaluate("document.querySelector('#matrix-reset').click()");assert.equal(await evaluate("document.querySelector('#matrix-query').value"),'');
  // Release builds contain the complete domain search index; check actual returned URLs.
  if(existsSync(resolve(site,'pagefind/pagefind.js'))||process.env.LIVE_ORIGIN){
    const searches=await evaluate(`(async()=>{const pf=await import('/pagefind/pagefind.js');const out=[];for(const q of ['AML.T0051','Interactive ATT&CK ATLAS matrix']){const found=await pf.search(q);const pages=await Promise.all(found.results.slice(0,20).map(r=>r.data()));out.push(pages.map(p=>new URL(p.url,location.origin).pathname));}return out;})()`);
    assert.ok(searches[0].includes('/attack-matrix/atlas/AML.T0051/'),'ATLAS technique is discoverable in domain search');
    assert.ok(searches[1].includes('/attack-matrix/'),'Matrix is discoverable in domain search');
  }
  // Network failure retains the complete useful static matrix.
  await call('Fetch.enable',{patterns:[{urlPattern:'*/attack-matrix/matrix-data.json',requestStage:'Request'}]});
  await navigate('/attack-matrix/',"document.documentElement.dataset.matrixReady==='error'");
  assert.equal(await evaluate("new Set([...document.querySelectorAll('#matrix-fallback [data-technique]')].map(e=>e.dataset.technique)).size"),1126);
  await call('Fetch.disable');
  await call('Emulation.setScriptExecutionDisabled',{value:true});
  await navigate('/attack-matrix/',"!!document.querySelector('#matrix-fallback')");
  assert.equal(await evaluate("new Set([...document.querySelectorAll('#matrix-fallback [data-technique]')].map(e=>e.dataset.technique)).size"),1126);
  assert.deepEqual(errors,[]);
  writeFileSync(resolve(report,'browser.json'),JSON.stringify({checked_at:new Date().toISOString(),origin:base,results,interactions:'deep links, filters, telemetry links, history, real technique navigation, keyboard disclosures, XSS safety, empty/reset states, failed-fetch and no-JavaScript fallbacks',errors},null,2)+'\n');
  console.log(`Passed ${results.length} framework/viewport/theme checks plus interaction, keyboard, accessibility, failure and no-JavaScript tests.`);
}finally{socket?.close();chrome.kill('SIGTERM');server.close();}
