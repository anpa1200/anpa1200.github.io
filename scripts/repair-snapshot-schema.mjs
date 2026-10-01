// Remove empty structured-data URL placeholders from preserved evidence HTML.
// Never change source prose, attribution, canonical ownership or real URLs.
import {readFileSync,writeFileSync} from 'node:fs';
function clean(value){
  if(Array.isArray(value))return value.map(clean);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).filter(([key,val])=>!(key==='url'&&val==='')).map(([key,val])=>[key,clean(val)]));
}
for(const path of process.argv.slice(2)){
  const before=readFileSync(path,'utf8');
  const after=before.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(all,open,text,close)=>{
    const value=JSON.parse(text),fixed=clean(value);
    return JSON.stringify(value)===JSON.stringify(fixed)?all:open+JSON.stringify(fixed).replace(/</g,'\\u003c')+close;
  });
  if(after!==before){writeFileSync(path,after);console.log(path+': removed empty JSON-LD URL placeholders');}
}
