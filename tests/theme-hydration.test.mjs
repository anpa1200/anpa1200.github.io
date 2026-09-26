import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('shared theme control survives an archive header replacement',()=>{
 const values=new Map([['theme','light']]),attributes=new Map(),handlers=new Map();
 const makeButton=()=>({attrs:new Map(),dataset:{},textContent:'',setAttribute(k,v){this.attrs.set(k,v);},addEventListener(){},closest(){return this;}});
 let button=makeButton();
 const root={setAttribute:(k,v)=>attributes.set(k,v),getAttribute:k=>attributes.get(k)};
 const document={
  documentElement:root,readyState:'complete',
  getElementById:id=>id==='theme-btn'?button:{},
  querySelector:selector=>selector.startsWith('script[')?{}:null,
  querySelectorAll:()=>[],
  addEventListener:(name,handler)=>handlers.set(name,handler),
 };
 vm.runInNewContext(readFileSync(new URL('../assets/site-theme.js',import.meta.url),'utf8'),{
  document,
  localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},
  window:{matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){}},
 });
 assert.equal(attributes.get('data-theme'),'light');
 assert.equal(typeof handlers.get('click'),'function','Use a document-level handler that survives hydration');
 button=makeButton(); // React replaces the server-rendered header node.
 handlers.get('click')({target:button});
 assert.equal(attributes.get('data-theme'),'dark');
 assert.equal(values.get('theme'),'dark');
 assert.equal(button.attrs.get('aria-label'),'Switch to light mode');
 handlers.get('click')({target:{closest:()=>button}}); // Click a nested icon.
 assert.equal(attributes.get('data-theme'),'light');
 assert.equal(button.attrs.get('aria-label'),'Switch to dark mode');
 handlers.get('click')({target:{closest:()=>null}});
 assert.equal(attributes.get('data-theme'),'light');
});
