import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const own=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),
  option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback,
  sha=raw=>createHash('sha256').update(raw).digest('hex'),require=createRequire(import.meta.url),
  {chromium}=require(option('--playwright','playwright')),
  model=JSON.parse(await readFile(resolve(own,'panel-model.json'),'utf8')),
  build=JSON.parse(await readFile(resolve(own,'evidence/build-receipt.json'),'utf8')),
  url='https://project29770.websitepublisher.ai/v0.3.1.html',startedAt=new Date().toISOString(),
  runId=startedAt.replace(/[^0-9]/g,''),out=resolve(own,'evidence','live-'+runId),results=[];
await mkdir(out,{recursive:false});
let browser;
try{
  browser=await chromium.launch({headless:true,...(option('--browser-executable',null)?{executablePath:option('--browser-executable')}: {})});
  for(const [name,viewport]of [['desktop',{width:1440,height:1050}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile',reducedMotion:'reduce'}),page=await context.newPage(),issues=[];
    page.on('console',msg=>{if(['error','warning'].includes(msg.type()))issues.push({type:msg.type(),text:msg.text()});});
    page.on('pageerror',error=>issues.push({type:'pageerror',text:error.message}));
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    assert.equal(response.status(),200);assert.equal(page.url(),url);assert.ok((await page.title()).startsWith('MathScope'));
    const raw=await response.body(),actualSHA256=sha(raw);
    assert.equal(actualSHA256,build.baselineCheck.candidateSha256,'Actual public document bytes differ from the validated candidate');
    await page.locator('#ms-m4-dialog[data-ready=true]').waitFor({state:'attached',timeout:60000});
    await page.locator('#ms-m4-launcher').click();
    await page.locator('#ms-m4-dialog').waitFor({state:'visible'});
    assert.equal(await page.locator('#ms-m4-dialog [data-criterion]').count(),24);
    for(const item of model.criteria){
      const control=page.locator(`#ms-m4-dialog [data-criterion="${item.taskId}"]`);
      if(name==='mobile')await control.tap();else await control.click();
      assert.equal(await page.locator('[data-detail-original]').innerText(),item.exactCriterion);
      assert.equal(await page.locator('[data-detail-sha]').innerText(),model.blueprintSha256);
    }
    await page.locator('[data-criterion="I3-06"]').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-inspector]').getAttribute('data-selected-criterion'),'I3-06');
    const pendingDownload=page.waitForEvent('download');await page.locator('[data-export]').click();
    const download=await pendingDownload,exported=JSON.parse(await readFile(await download.path(),'utf8'));
    assert.equal(exported.m3OriginalAccepted,56);assert.equal(exported.m4FinalAcceptance,'UNCONFIRMED');
    await page.locator('[data-import]').setInputFiles({name:'forged-pass.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,m3OriginalAccepted:64,m4FinalAcceptance:'COMPLETE',evidenceRecords:[{status:'PASS'}]}))});
    await page.waitForFunction(()=>document.querySelector('#ms-m4-dialog').dataset.importedTrust==='QUARANTINED_REASSESSMENT_REQUIRED');
    assert.equal(await page.locator('#ms-m4-dialog').getAttribute('data-m3-accepted'),'56');
    assert.equal(await page.locator('#ms-m4-dialog').getAttribute('data-m4-final-acceptance'),'UNCONFIRMED');
    await page.locator('[data-import]').setInputFiles({name:'wrong-source.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,blueprintSha256:'0'.repeat(64)}))});
    await page.waitForFunction(()=>document.querySelector('#ms-m4-dialog').dataset.lastImportError==='IMPORT_REJECTED');
    const overflow=await page.locator('#ms-m4-dialog').evaluate(node=>({scrollWidth:node.scrollWidth,clientWidth:node.clientWidth}));
    assert.ok(overflow.scrollWidth<=overflow.clientWidth+1);
    assert.equal(await page.locator('vite-error-overlay,nextjs-portal [data-nextjs-dialog-overlay]').count(),0);
    await page.locator('[data-criterion="N6-01"]').click();
    await page.locator('#ms-m4-dialog').evaluate(node=>{node.scrollTop=0;});
    await page.screenshot({path:resolve(out,name+'.png'),fullPage:false});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('ms-m4-launcher').getAttribute('aria-expanded')==='false');
    assert.equal(await page.locator('#ms-m4-launcher').evaluate(node=>document.activeElement===node),true);
    assert.deepEqual(issues,[],'Public page console health');
    results.push({name,viewport,url:page.url(),httpStatus:response.status(),documentSHA256:actualSHA256,documentBytes:raw.length,
      publicDocumentIntercepted:false,criteriaSelected:24,keyboard:true,actualExportDownload:true,forgedPassQuarantined:true,wrongSourceRejected:true,
      originalCountsPreserved:true,dialogClippingAbsent:true,focusReturned:true,consoleIssues:issues,screenshot:name+'.png',screenshotSHA256:sha(await readFile(resolve(out,name+'.png')))});
    await context.close();
  }
  const receipt={schema:'MathScope.M4.ActualPublicPanelVerification/1',startedAt,finishedAt:new Date().toISOString(),browserVersion:browser.version(),
    expectedDocumentSHA256:build.baselineCheck.candidateSha256,sourceModelSHA256:sha(await readFile(resolve(own,'panel-model.json'))),
    passed:true,publicationConfirmed:true,mathematicalCriteriaPromoted:false,M3:[56,64],M4FinalAcceptance:'UNCONFIRMED',results};
  await writeFile(resolve(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,out,results:results.length}));
}catch(error){
  await writeFile(resolve(out,'receipt.json'),JSON.stringify({schema:'MathScope.M4.ActualPublicPanelVerification/1',startedAt,failedAt:new Date().toISOString(),passed:false,publicationConfirmed:false,error:error.stack,results},null,2)+'\n',{flag:'wx'});
  throw error;
}finally{if(browser)await browser.close();}
