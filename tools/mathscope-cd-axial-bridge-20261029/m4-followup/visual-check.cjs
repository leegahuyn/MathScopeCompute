const {chromium}=require('C:/Users/사용자/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const url='http://127.0.0.1:38771/ui-fixture.html?race';await page.goto(url,{waitUntil:'networkidle'});
 assert.match(await page.title(),/MathScope proof job/);await page.waitForSelector('[data-r1="proof-job-host"][data-proof-state="KERNEL_PENDING"]');
 const box=page.locator('[data-proof="input"]'),host=page.locator('[data-r1="proof-job-host"]'),detail=page.locator('[data-proof="details"]');
 const before=JSON.parse(await detail.textContent());assert.equal(before.kernelPass,false);
 const p=JSON.parse(await box.inputValue());let prior=before.jobId;const jobs=[];
 const updates=[['G','SU2'],['delta','D2'],['p',3],['precision',32],['coefficientFormula','[3,-3,5,7]'],['coefficientField','Fp'],['coefficients',['3','-3','5','7']],['assumptions',[{id:'H',statement:'True'}]]];
 for(const [key,value] of updates){p[key]=value;await box.fill(JSON.stringify(p));
  await page.waitForFunction(old=>{const d=document.querySelector('[data-proof="details"]');try{return JSON.parse(d.textContent).jobId!==old}catch{return false}},prior);
  const job=JSON.parse(await detail.textContent());assert.notEqual(job.jobId,prior);assert.equal(job.kernelPass,false);prior=job.jobId;jobs.push({key,jobId:prior});}
 await box.fill('{');assert.equal(await host.getAttribute('data-proof-state'),'INVALID_INPUT');assert.equal(await detail.textContent(),'');
 p.G='SLOW';await box.fill(JSON.stringify(p));assert.equal(await host.getAttribute('data-proof-state'),'GENERATING');
 p.G='FAST';await box.fill(JSON.stringify(p));await page.waitForFunction(()=>{let d=document.querySelector('[data-proof="details"]');try{return JSON.parse(d.textContent).jobId && window.proofEditor.snapshot().params.G==='FAST'}catch{return false}});
 const fast=JSON.parse(await detail.textContent());await page.evaluate(()=>window.releaseSlow());await page.waitForTimeout(100);
 assert.equal(JSON.parse(await detail.textContent()).jobId,fast.jobId);assert.equal(await page.evaluate(()=>window.proofEditor.snapshot().params.G),'FAST');
 await page.locator('[data-proof="input"]').scrollIntoViewIfNeeded();await page.screenshot({path:'desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-proof="input"]').scrollIntoViewIfNeeded();await page.screenshot({path:'mobile.png'});
 const fit=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert.ok(fit.scroll<=fit.viewport,JSON.stringify(fit));
 assert.deepEqual(errors,[]);
 fs.writeFileSync('visual-check-result.json',JSON.stringify({status:'PASS isolated UI fixture',browser:'Chrome headless / Playwright; Browser plugin unavailable',url,initial:before.jobId,inputChanges:jobs,raceWinner:fast.jobId,invalidJSONCleared:true,slowOlderCompletionRejected:true,consoleErrors:errors,viewports:['1200x900','390x844'],limitations:['R1 fixture uses exact source markup but does not execute original R1 worker script','proof panel is not integrated in site builder or deployed','no Lean kernel run or mathematical semantics beyond fixed fixture']},null,2));
 await browser.close();console.log('UI fixture PASS: actual event handlers, stale input, generation race, desktop/mobile');
})().catch(e=>{console.error(e);process.exitCode=1});
