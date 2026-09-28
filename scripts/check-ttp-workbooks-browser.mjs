import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const site=resolve(option('--site',root)),report=resolve(option('--report-dir','/tmp/ttp-workbook-browser-20260928'));
mkdirSync(report,{recursive:true});
const inventory=JSON.parse(readFileSync(site+'/ttp-simulation/data/workbooks.json','utf8'));
if(args.includes('--key'))inventory.records=inventory.records.filter(r=>r.key===option('--key',''));
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer((req,res)=>{let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}const path=resolve(site,'.'+route+(route.endsWith('/')?'index.html':''));if(!path.startsWith(site+sep)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=option('--live-origin',`http://127.0.0.1:${server.address().port}`);
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--disable-renderer-backgrounding','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows',`--user-data-dir=${mkdtempSync('/tmp/ttp-workbook-chrome-')}`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
const results=[],errors=[];let socket;
try{
  const endpoint=await new Promise((done,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);chrome.stderr.on('data',data=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);done(match[1]);}});chrome.on('error',reject);});
  socket=new WebSocket(endpoint);await new Promise(done=>socket.addEventListener('open',done,{once:true}));
  let id=0;const pending=new Map();
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);const task=pending.get(message.id);if(task){pending.delete(message.id);clearTimeout(task.timer);message.error?task.reject(Error(JSON.stringify(message.error))):task.done(message.result);}});
  const send=(method,params={},sessionId)=>new Promise((done,reject)=>{const number=++id;const timer=setTimeout(()=>{pending.delete(number);reject(Error('CDP timeout '+method));},30000);pending.set(number,{done,reject,timer});socket.send(JSON.stringify({id:number,method,params,...(sessionId?{sessionId}:{})}));});
  const jobs=inventory.records.flatMap(row=>[390,1440].map(width=>({row,width})));
  let cursor=0;
  async function worker(){
    const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const call=(method,params={})=>send(method,params,sessionId);
    const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    await call('Page.enable');await call('Runtime.enable');
    while(cursor<jobs.length){
      const {row,width}=jobs[cursor++];
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await call('Page.navigate',{url:base+row.page});
      const started=Date.now();let ready=false;
      while(!ready){ready=await evaluate(`location.pathname===${JSON.stringify(row.page)} && document.readyState==='complete' && (!document.querySelector('#app') || !document.querySelector('#app').hidden)`);if(Date.now()-started>25000)throw Error('Page readiness timeout '+row.page);if(!ready)await new Promise(done=>setTimeout(done,30));}
      // Give hydration/stylesheet layout a bounded settling interval. Background tabs
      // do not reliably schedule requestAnimationFrame, even in headless Chrome.
      await new Promise(done=>setTimeout(done,80));
      const result=await evaluate(`(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+1,duplicateIds:ids.filter((v,i)=>ids.indexOf(v)!==i),sections:['detection-rules','anomalies','attack-tools','simulation','synthetic-logs'].filter(id=>!document.getElementById(id)),canonical:document.querySelector('link[rel=canonical]')?.href,workbook:document.querySelector('[data-workbook]')?.dataset.workbook||null};})()`);
      if(result.overflow){
        const screenshot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(report+'/overflow.png',Buffer.from(screenshot.data,'base64'));
        console.log(row.page,width,await evaluate("({doc:document.documentElement.scrollWidth,viewport:innerWidth,body:document.body.scrollWidth,htmlStyle:getComputedStyle(document.documentElement).cssText,elements:[...document.querySelectorAll('body *')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,id:e.id,cls:e.className,scroll:e.scrollWidth,client:e.clientWidth,overflow:getComputedStyle(e).overflow,display:getComputedStyle(e).display,rect:JSON.stringify(e.getBoundingClientRect()),text:e.textContent.slice(0,80)})).slice(0,18)})"));
      }
      assert.equal(result.h1,1,row.page);assert.equal(result.overflow,false,row.page+' '+width);assert.deepEqual(result.duplicateIds,[],row.page);assert.deepEqual(result.sections,[],row.page);assert.equal(result.canonical,'https://1200km.com'+row.page);
      if(row.domain!=='atlas'){
        assert.equal(result.workbook,row.key);
        await evaluate("document.querySelector('[data-workbook-check]')?.click()");
        const clickStart=Date.now();let checked;
        do{checked=await evaluate("document.querySelector('[data-workbook-result]')?.dataset.passed");if(Date.now()-clickStart>10000)throw Error('Fixture timeout '+row.key);if(checked===undefined)await new Promise(done=>setTimeout(done,20));}while(checked===undefined);
        assert.equal(checked,'true',row.key+' fixture');
      }
      if(['enterprise/T1595','enterprise/T1059.001','mobile/T1423','ics/T0880','atlas/AML.T0051'].includes(row.key)){
        await evaluate(readFileSync(root+'node_modules/axe-core/axe.min.js','utf8'));
        const violations=await evaluate("(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})))()");
        assert.deepEqual(violations,[],row.page+' accessibility');
        const screenshot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(report+'/'+row.key.replaceAll('/','-')+'-'+width+'.png',Buffer.from(screenshot.data,'base64'));
      }
      results.push({key:row.key,page:row.page,width,...result});
      if(results.length%100===0)console.log(`Browser validated ${results.length}/${jobs.length} page/viewport cases.`);
    }
    await send('Target.closeTarget',{targetId});
  }
  await Promise.all(Array.from({length:args.includes('--key')?1:4},worker));
  assert.deepEqual(errors,[]);
  writeFileSync(report+'/browser.json',JSON.stringify({checked_at:new Date().toISOString(),origin:base,total:results.length,unique_pages:inventory.records.length,results,errors,live_attacks_executed_by_browser:0},null,2)+'\n');
  console.log(`PASS: ${results.length} browser cases, ${inventory.records.length} unique pages, offline fixture buttons and representative accessibility checks.`);
}finally{
  socket?.close();chrome.kill('SIGTERM');server.close();
}
