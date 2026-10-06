import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/site-search.js',import.meta.url),'utf8');

function hydration({edited=true, query='Big Pharma', address='old query'}={}) {
  const input={value:'',focus(){this.focused=true;}};
  const calls=[];
  const context={input,calls,readSearchAddress:()=>({query:address,filters:{topic:['security']},limit:60}),
    document:{querySelector:()=>({querySelector:()=>input})},setSearchPageStatus(){},setSearchPageLimit:v=>calls.push(['limit',v]),
    pagefindInstance:{triggerSearchWithFilters:(...args)=>calls.push(['search',...args])},writeSearchAddress:()=>calls.push(['url']),
    queryEdited:edited,pendingSearchValue:query,searchPageActivationRequested:true,restoringSearch:false,hydrated:false,knownFilters:''};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function hydrateSearchPageQuery'),source.indexOf('  function repairFilterAccessibility'))+';hydrateSearchPageQuery();',context);
  return {context,input,calls};
}

test('hydration keeps pasted text and URL filters instead of restoring stale query',()=>{
  const {input,calls,context}=hydration();
  assert.equal(input.value,'Big Pharma'); assert.equal(input.focused,true); assert.equal(context.hydrated,true);
  assert.deepEqual(calls[1],['search','Big Pharma',{topic:['security']}]); assert.deepEqual(calls[0],['limit',20]);
});
test('clearing the input while loading remains an intentional empty query',()=>{
  const {input,calls}=hydration({query:''}); assert.equal(input.value,''); assert.equal(calls[1][1],'');
});
test('untouched URL hydration retains pagination and search query',()=>{
  const {input,calls}=hydration({edited:false}); assert.equal(input.value,'old query'); assert.deepEqual(calls[0],['limit',60]);
});
test('fallback stays editable until engine and translations load, then mounts and hydrates without a timer gap',async()=>{
  const calls=[];let releaseLoad,releaseGovernance;
  const instance={on(){},triggerLoad:()=>new Promise(r=>{releaseLoad=r;}),searchResult:null};
  const context={window:{PagefindComponents:{configureInstance:()=>instance},clearTimeout(){},setTimeout(){throw Error('Delayed hydration can overwrite intervening input');}},
    searchPage:true,pagefindInstance:null,document:{querySelector:()=>null},mountSearchPageComponents:()=>calls.push('mount'),
    installDiscoveryGovernance:()=>new Promise(r=>{releaseGovernance=r;}),searchFailed:false,readinessTimer:0,componentsReady:false,
    repairFilterAccessibility(){},mount(){},hydrateSearchPageQuery:()=>calls.push('hydrate'),handleComponentError:e=>{throw e;}};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  async function configureComponents'),source.indexOf('  function handleComponentError'))+';completion=configureComponents();',context);
  assert.deepEqual(calls,[],'editable fallback must survive engine load');
  releaseLoad(); await new Promise(setImmediate); assert.deepEqual(calls,[],'fallback survives governance load');
  releaseGovernance(true); await context.completion;
  assert.deepEqual(calls,['mount','hydrate']); assert.equal(context.componentsReady,true);
});

test('homepage enhancement preserves an early pasted query and keyboard focus',()=>{
  const previous={value:'Big Pharma'};
  const next={value:'',dispatchEvent(event){this.event=event.type;},focus(){this.focused=true;}};
  let replaced=false;
  const host={dataset:{searchState:'loading'},querySelector:()=>replaced?next:previous,replaceChildren(){replaced=true;}};
  const context={document:{querySelector:()=>host,activeElement:previous},componentsReady:true,searchFailed:false,buildHeroSearchbox:()=>({}),Event:class {constructor(type){this.type=type;}}};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function heroSearchHost'),source.indexOf('  function standaloneHost'))+';heroSearchHost();',context);
  assert.equal(next.value,'Big Pharma');assert.equal(next.event,'input');assert.equal(next.focused,true);
});
