import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {spawn} from 'node:child_process';
const root=new URL('..',import.meta.url).pathname;
const argv=process.argv.slice(2),value=(key,fallback)=>argv.includes(key)?argv[argv.indexOf(key)+1]:fallback;
const archive=resolve(value('--archive','../medium-bigpharma-release/build'));
const site=resolve(value('--site',root));
const report=mkdtempSync('/tmp/bigpharma-browser-');
const path='/articles/read/2026/cyberattacks-on-big-pharma-and-its-ecosystem/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
 const base=pathname.startsWith('/articles/')?archive:site;
 let file=resolve(base,pathname.replace(pathname.startsWith('/articles/')?'/articles/':'/',''));
 if(file!==base&&!file.startsWith(base+'/')){res.writeHead(403).end();return;}
 if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
 if(!existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=value('--origin',`http://127.0.0.1:${server.address().port}`);
const browser=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',`--user-data-dir=${report}/chrome`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
const failures=[],results=[];
try {
 const ws=await new Promise((r,j)=>{const timer=setTimeout(()=>j(Error('Chrome start timeout')),15000);let log='';browser.stderr.on('data',b=>{log+=b;const m=log.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);r(m[1]);}});browser.on('error',j);});
 socket=new WebSocket(ws);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let next=1;const pending=new Map();socket.addEventListener('message',e=>{const d=JSON.parse(e.data),p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(Error(JSON.stringify(d.error))):p.resolve(d.result);}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(method,params={})=>send(method,params,sessionId);
 const evaluate=async expression=>{const d=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(d.exceptionDetails)throw Error(d.exceptionDetails.text);return d.result.value;};
 await call('Page.enable');await call('Runtime.enable');
 for(const width of [390,1440])for(const theme of ['light','dark']){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+path});
  const started=Date.now();while(!await evaluate('document.readyState === "complete" && !!document.querySelector(".pharma-cover")')){if(Date.now()-started>30000)throw Error('Article did not load');await new Promise(r=>setTimeout(r,200));}
  await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}; localStorage.setItem('theme',${JSON.stringify(theme)});`);
  for(const index of [0,1,2]){
   await evaluate(`document.querySelectorAll('.pharma-cover, .pharma-figure img')[${index}].scrollIntoView({block:'center'})`);
   const start=Date.now();while(!await evaluate(`document.querySelectorAll('.pharma-cover, .pharma-figure img')[${index}].complete`)){if(Date.now()-start>15000)throw Error('Image loading timeout');await new Promise(r=>setTimeout(r,200));}
  }
  await evaluate(readFileSync(join(root,'node_modules/axe-core/axe.min.js'),'utf8'));
  const result=await evaluate(`(async()=>({width:innerWidth,theme:document.documentElement.dataset.theme,h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.querySelectorAll('.pharma-cover, .pharma-figure img')].map(i=>({src:i.currentSrc,loaded:i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,ratioError:Math.abs(i.getBoundingClientRect().width/i.getBoundingClientRect().height-i.naturalWidth/i.naturalHeight)})),missingFragments:[...document.querySelectorAll('a[href^="#"]')].map(a=>decodeURIComponent(a.hash.slice(1))).filter(id=>id&&!document.getElementById(id)),violations:(await axe.run(document.querySelector('article'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))}))()`);
  results.push(result);
  if(result.h1!==1||result.overflow||result.missingFragments.length||result.images.length!==3||result.images.some(i=>!i.loaded||i.ratioError>.01||i.width>width)||result.violations.length)failures.push(result);
  await evaluate("document.querySelector('.pharma-figure').scrollIntoView({block:'start'})");
  const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(join(report,`${width}-${theme}-figure.png`),Buffer.from(shot.data,'base64'));
 }
} finally {socket?.close();browser.kill();server.close();}
writeFileSync(join(report,'results.json'),JSON.stringify({origin,results,failures},null,2)+'\n');
console.log(JSON.stringify({report,viewports:results.length,failures:failures.length,details:failures},null,2));
if(failures.length)process.exitCode=1;
