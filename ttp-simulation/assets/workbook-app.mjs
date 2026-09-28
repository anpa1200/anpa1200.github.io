import {validateFixture} from './workbook-logic.mjs';
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-workbook-check]');
  if(!button)return;
  const key=button.dataset.workbookCheck;
  if(!/^(enterprise|mobile|ics)\/T\d{4}(?:\.\d{3})?$/.test(key))return;
  const result=button.parentElement.querySelector('[data-workbook-result]');
  button.disabled=true;result.textContent='Checking the synthetic collection contract…';
  try{
    const response=await fetch(`/ttp-simulation/data/workbooks/${key}.json`);
    if(!response.ok)throw Error(`Workbook HTTP ${response.status}`);
    const workbook=await response.json();
    const checked=validateFixture(workbook.synthetic,workbook);
    result.textContent=checked.passed?`PASS: ${workbook.synthetic.events.length} illustrative collection events satisfy their required-field contracts. This is NOT TTP simulation or detector validation.`:'FAIL: '+checked.errors.join('; ');
    result.dataset.passed=String(checked.passed);
  }catch(error){result.textContent=`Check unavailable: ${error.message}. No validation result is claimed.`;}
  finally{button.disabled=false;}
});
