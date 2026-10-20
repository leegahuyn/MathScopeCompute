import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
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
const verifierSHA256=sha(await readFile(fileURLToPath(import.meta.url))),
  baseline=gunzipSync(await readFile(resolve(own,'../../mathscope-m3/evidence/all64-20261012/release56/candidate-v031-attempt2.html.gz'))),
  fragment=await readFile(resolve(own,'patch-fragment.html'),'utf8'),
  marker='<script type="application/json" id="ms-m4-data">',dataStart=fragment.indexOf(marker)+marker.length,dataEnd=fragment.indexOf('</script>',dataStart),
  serialized=fragment.slice(dataStart,dataEnd),deliveredSerialized=serialized.replaceAll('\\u003c','<');
assert.equal(sha(baseline),model.publicBaselineSha256);
assert.equal(fragment.split(marker).length,2);assert.ok(dataEnd>dataStart);
assert.deepEqual(JSON.parse(serialized),model);assert.deepEqual(JSON.parse(deliveredSerialized),model);
assert.equal(/<(?:\/?script|!--)/i.test(deliveredSerialized),false,'Unsafe publisher inline-data serialization');
const deliveredFragment=fragment.slice(0,dataStart)+deliveredSerialized+fragment.slice(dataEnd),
  hasPinnedHistoricalCandidate=Boolean(build.baselineCheck?.insertionAnchor && build.baselineCheck?.candidateSha256);
let expectedEncodedSHA256=null,expectedDeliveredSHA256=null;
if(hasPinnedHistoricalCandidate){
  const anchor=build.baselineCheck.insertionAnchor,
    expectedEncoded=baseline.toString('utf8').replace(anchor,anchor+fragment),
    expectedDelivered=baseline.toString('utf8').replace(anchor,anchor+deliveredFragment);
  expectedEncodedSHA256=sha(expectedEncoded);expectedDeliveredSHA256=sha(expectedDelivered);
  assert.equal(expectedEncodedSHA256,build.baselineCheck.candidateSha256);
  assert.equal(baseline.toString('utf8').split(anchor).length,2);
}
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader'],...(option('--browser-executable',null)?{executablePath:option('--browser-executable')}: {})});
  for(const [name,viewport]of [['desktop',{width:1440,height:1050}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile',reducedMotion:'reduce'}),page=await context.newPage(),issues=[],environmentWarnings=[];
    // The 28 MB document exceeds Chromium's default inspector body cache.
    // This read-only CDP session captures the actual navigation response with
    // a bounded cache; no request is intercepted or replaced.
    const network=await context.newCDPSession(page);
    await network.send('Network.enable',{maxTotalBufferSize:134217728,maxResourceBufferSize:67108864});
    let documentRequestId,finishDocument;
    const documentFinished=new Promise(resolve=>{finishDocument=resolve;});
    network.on('Network.responseReceived',event=>{if(event.type==='Document'&&event.response.url===url&&!documentRequestId)documentRequestId=event.requestId;});
    network.on('Network.loadingFinished',event=>{if(event.requestId===documentRequestId)finishDocument();});
    const knownBrowserEnvironmentWarning = text =>
      /Automatic fallback to software WebGL has been deprecated/.test(text) ||
      /GL Driver Message \\(OpenGL, Performance, GL_CLOSE_PATH_NV, High\\): GPU stall due to ReadPixels/.test(text);
    page.on('console',msg=>{
      if(!['error','warning'].includes(msg.type()))return;
      const item={type:msg.type(),text:msg.text()};
      if(msg.type()==='warning'&&knownBrowserEnvironmentWarning(msg.text()))environmentWarnings.push(item);
      else issues.push(item);
    });
    page.on('pageerror',error=>issues.push({type:'pageerror',text:error.message}));
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    assert.equal(response.status(),200);
    const requestedURL=new URL(url),actualURL=new URL(page.url());
    assert.equal(actualURL.origin,requestedURL.origin,'Live browser stayed on the WebsitePublisher origin');
    assert.equal(actualURL.pathname,requestedURL.pathname,'Live browser stayed on the same published page despite query-string canonicalization');
    assert.ok((await page.title()).startsWith('MathScope'));
    assert.ok(documentRequestId,'Actual document request must be captured');
    let bodyTimeout;
    try{await Promise.race([documentFinished,new Promise((_,reject)=>{bodyTimeout=setTimeout(()=>reject(new Error('Document response capture timed out')),60000);})]);}
    finally{clearTimeout(bodyTimeout);}
    const body=await network.send('Network.getResponseBody',{requestId:documentRequestId}),raw=Buffer.from(body.body,body.base64Encoded?'base64':'utf8'),actualSHA256=sha(raw);
    const serializedProfile=hasPinnedHistoricalCandidate
      ? (actualSHA256===expectedEncodedSHA256?'AS_AUTHORED':actualSHA256===expectedDeliveredSHA256?'PUBLISHER_UNICODE_LT_DECODING':null)
      : 'LIVE_V118_READBACK_ONLY';
    if(hasPinnedHistoricalCandidate){
      assert.ok(serializedProfile,'Actual public document differs from both independently reconstructed byte-exact candidates');
      const activeFragment=serializedProfile==='AS_AUTHORED'?fragment:deliveredFragment;
      const originalRecovered=raw.toString('utf8').replace(activeFragment,'');
      assert.equal(sha(originalRecovered),model.publicBaselineSha256,'Every pre-existing v102 byte must be preserved');
    }
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
    // The v118 runtime overlay is distinct from the historical embedded M4 panel.
    // Verify its current GitHub-backed matrix rather than inferring acceptance from the old snapshot.
    // The runtime keeps a source template in the DOM; scope all assertions to the
    // visible cloned section so a hidden <template> cannot accidentally satisfy QA.
    const currentM4Panel=page.locator('#ms4c:visible');
    await currentM4Panel.waitFor({state:'visible',timeout:60000});
    const currentM4Summary=currentM4Panel.locator('#ms4c-acceptance-summary');
    await currentM4Summary.click();
    const currentM4SummaryText=await currentM4Summary.innerText();
    assert.match(currentM4SummaryText,/ACCEPTED 0 \/ 16/);
    assert.match(currentM4SummaryText,/PARTIAL 14/);
    assert.match(currentM4SummaryText,/OPEN 2 \(R1-05, R1-08\)/);
    assert.match(currentM4SummaryText,/finalAcceptance=UNCONFIRMED/);
    assert.match(currentM4SummaryText,/HOLD/);
    assert.match(currentM4SummaryText,/a046586e421155f72914eb1ffbec48519b4bd2bb/);
    const currentM4Selector=currentM4Panel.locator('#ms4c-criterion');
    assert.equal(await currentM4Selector.locator('option').count(),16);
    await currentM4Selector.selectOption('R1-05');
    const r105Detail=await currentM4Panel.locator('#ms4c-criterion-detail').innerText();
    assert.match(r105Detail,/"status": "OPEN"/);
    assert.match(r105Detail,/cbf3523079cf3217fc1fcfd04f811610039ca900|a046586e421155f72914eb1ffbec48519b4bd2bb/);
    await currentM4Selector.selectOption('R1-08');
    const r108Detail=await currentM4Panel.locator('#ms4c-criterion-detail').innerText();
    assert.match(r108Detail,/"status": "OPEN"/);
    assert.match(r108Detail,/a046586e421155f72914eb1ffbec48519b4bd2bb/);

    // The current overlay is hosted inside the M4 modal; close it only after the overlay check.
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('ms-m4-launcher').getAttribute('aria-expanded')==='false');
    assert.equal(await page.locator('#ms-m4-launcher').evaluate(node=>document.activeElement===node),true);

    // Inspect the currently published M3 ledger panel, keeping its open gates visible.
    const currentM3Launcher=page.locator('#ms3ip-open');
    await currentM3Launcher.waitFor({state:'attached',timeout:60000});
    await currentM3Launcher.click();
    const currentM3Dialog=page.locator('#ms3ip');
    await currentM3Dialog.waitFor({state:'visible',timeout:30000});
    assert.match(await page.locator('#ms3ip-m3-count').innerText(),/62\s*\/\s*64/);
    assert.match(await page.locator('#ms3ip-tau').innerText(),/null/);
    const currentM3Text=await currentM3Dialog.innerText();
    assert.match(currentM3Text,/N7-06/);
    assert.match(currentM3Text,/N8-05/);
    assert.match(currentM3Text,/OPEN/);
    await currentM3Launcher.click();

    assert.deepEqual(issues,[],'Public page console health');
    results.push({name,viewport,url:page.url(),httpStatus:response.status(),documentSHA256:actualSHA256,documentBytes:raw.length,
      publicDocumentIntercepted:false,documentHashSource:'ACTUAL_CHROMIUM_NAVIGATION_RESPONSE',serializedProfile,
      historicalBaselineByteComparison:hasPinnedHistoricalCandidate?'PASS':'NOT_RUN_CURRENT_LIVE_SOURCE_IS_NOT_THE_V102_BUILD_INPUT',
      allOriginalBytesPreserved:hasPinnedHistoricalCandidate?true:null,modelSemanticEquality:true,inspectorCacheBudgetBytes:{total:134217728,resource:67108864},criteriaSelected:24,keyboard:true,actualExportDownload:true,forgedPassQuarantined:true,wrongSourceRejected:true,
      currentRuntimeM4MatrixVerified:true,currentRuntimeM4MatrixBlobSha:'a046586e421155f72914eb1ffbec48519b4bd2bb',r105Status:'OPEN',r108Status:'OPEN',
      currentM3PanelVerified:true,currentM3Count:'62/64',openM3Criteria:['N7-06','N8-05'],actualGlobalTau:null,
      originalCountsPreserved:true,dialogClippingAbsent:true,focusReturned:true,consoleIssues:issues,environmentWarnings,webglFallbackMode:'Chromium --enable-unsafe-swiftshader (CI-only software fallback opt-in)',screenshot:name+'.png',screenshotSHA256:sha(await readFile(resolve(out,name+'.png')))});
    await context.close();
  }
  const receipt={schema:'MathScope.M4.ActualPublicPanelVerification/1',startedAt,finishedAt:new Date().toISOString(),browserVersion:browser.version(),
    expectedDocumentSHA256:expectedEncodedSHA256,expectedPublisherSerializedSHA256:expectedDeliveredSHA256,sourceVerifierSHA256:verifierSHA256,sourceModelSHA256:sha(await readFile(resolve(own,'panel-model.json'))),
    passed:true,publicationConfirmed:true,mathematicalCriteriaPromoted:false,
    mathematicalScope:'This receipt observes the actual currently served page and panel interaction only; it does not certify M3 mathematical closure or M4 final acceptance.',
    livePageVersionObserved:'read-back separately through WebsitePublisher API; this script does not infer version number from content bytes',
    historicalV102ByteComparison:hasPinnedHistoricalCandidate?'PERFORMED':'NOT_PERFORMED',
    M3:[56,64],M4FinalAcceptance:'UNCONFIRMED',results};
  await writeFile(resolve(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,out,results:results.length}));
}catch(error){
  await writeFile(resolve(out,'receipt.json'),JSON.stringify({schema:'MathScope.M4.ActualPublicPanelVerification/1',startedAt,failedAt:new Date().toISOString(),passed:false,publicationConfirmed:false,error:error.stack,results},null,2)+'\n',{flag:'wx'});
  throw error;
}finally{if(browser)await browser.close();}
