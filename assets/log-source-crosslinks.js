/* Restore reviewed source links after article hydration and client-side navigation. */
(()=>{
  let rows=[],queued=false;
  const path=()=>location.pathname.replace(/index\.html$/,'').replace(/\/$/,'');
  const normalize=p=>('/'+p).replace(/index\.html$/,'').replace(/\/$/,'');
  function render(){
    queued=false;const current=path(),row=rows.find(r=>normalize(r.path)===current);
    for(const el of document.querySelectorAll('[data-log-source-crosslinks]'))if(el.dataset.logSourceCrosslinks!==current)el.remove();
    if(!row||!row.links?.length||document.querySelector('[data-log-source-crosslinks]'))return;
    const main=document.querySelector('main');if(!main)return;
    const section=document.createElement('section');section.className='ttp-ecosystem-links';section.dataset.logSourceCrosslinks=current;section.setAttribute('aria-label','Native security log sources');
    const h=document.createElement('h2');h.textContent='Native security log sources';section.append(h);
    const p=document.createElement('p'),a=document.createElement('a');a.href='/log-sources/';a.textContent='Security Log-Source Library';p.append('Use the ',a,' for grouped producers, attributed native samples, field structure and collection limits. These source-format references support research; they do not establish deployed coverage or detector effectiveness.');section.append(p);
    const links=document.createElement('p');row.links.forEach((r,i)=>{if(i)links.append(' · ');const a=document.createElement('a');a.href='/log-sources/'+r.id+'/';a.textContent=r.title;links.append(a);});section.append(links);main.append(section);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
  fetch('/data/log-source-crosslinks.json').then(r=>{if(!r.ok)throw Error('Crosslink data unavailable');return r.json();}).then(data=>{rows=data;schedule();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});addEventListener('popstate',schedule);}).catch(()=>{/* Static links remain the fallback when hydration leaves them intact. */});
})();
