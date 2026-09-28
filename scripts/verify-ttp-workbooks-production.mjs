import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const args=process.argv.slice(2),option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const commit=option('--site-commit',''),origin=option('--origin','https://1200km.com'),output=resolve(option('--report','/tmp/ttp-workbook-production.json'));
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('An exact expected deployment commit is required');
const inventory=JSON.parse(readFileSync('ttp-simulation/data/workbooks.json','utf8'));
const rows=[],failures=[];let cursor=0;
async function fetchText(path){const response=await fetch(origin+path+`?verify=${commit.slice(0,12)}`,{signal:AbortSignal.timeout(25000),headers:{'cache-control':'no-cache'}});return {response,text:await response.text()};}
await Promise.all(Array.from({length:6},async()=>{
  while(cursor<inventory.records.length){
    const row=inventory.records[cursor++];
    try{
      const {response,text}=await fetchText(row.page);
      const checks={http:response.status===200,build:text.includes(`name="1200km-build" content="${commit}"`),canonical:text.includes(`rel="canonical" href="https://1200km.com${row.page}"`),sections:['detection-rules','anomalies','attack-tools','simulation','synthetic-logs'].every(id=>text.includes(`id="${id}"`))};
      if(row.domain!=='atlas'){
        const fixture=await fetchText('/ttp-simulation/data/fixtures/'+row.key+'.json');
        const parsed=JSON.parse(fixture.text);
        checks.fixture=fixture.response.status===200&&parsed.technique_key===row.key&&parsed.synthetic===true;
      }
      rows.push({key:row.key,page:row.page,checks});
      if(Object.values(checks).some(pass=>!pass))failures.push({key:row.key,checks});
    }catch(error){failures.push({key:row.key,error:String(error)});}
    if(rows.length&&rows.length%100===0)console.log(`Verified ${rows.length}/${inventory.records.length} live technique pages.`);
  }
}));
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify({checked_at:new Date().toISOString(),origin,expected_commit:commit,expected_pages:inventory.records.length,rows,failures},null,2)+'\n');
if(failures.length)throw Error(`Live verification failed for ${failures.length} pages; see ${output}`);
console.log(`PASS: ${rows.length} live TTP pages and all 918 ATT&CK fixture endpoints at ${origin}.`);
