/** Genuine UI audit helpers for the documented Cloud Browser Tab API.
 *
 * Run these helpers from cua_repl with its existing tab. They call only the
 * documented read-only DOM and UI-locator methods; no application globals,
 * replacement result injection, CDP bypass, or synthetic renderer timings.
 * The caller supplies a screenshot callback using the shared-file workflow.
 *
 * Local Playwright was available but its browser binary was absent, and the
 * official download returned a 195-byte Site Unavailable HTML response.
 * Cloud Browser does not advertise viewport emulation; cropped screenshots
 * must never be reported as 360/390/412px responsive-layout execution.
 */

export const DIFFERENTIAL_BROWSER_ROUTES=['arithmetic','gauge','ns','observation','checklist'];
export const DIFFERENTIAL_BROWSER_EXAMPLES=[
  {id:'ns-m2-actual-covariance-sensitivity',kind:'ns.actual-covariance-sensitivity',schema:'MathScope.ActualCovarianceSensitivityCertificate/1',panels:5,scopePanel:'covariance-sensitivity-scope'},
  {id:'ns-m2-actual-pulse-jet',kind:'ns.actual-pulse-jet',schema:'MathScope.ActualPulseJetCertificate/1',panels:4,scopePanel:'pulse-jet-scope'},
  {id:'ns-m2-actual-full-curl',kind:'ns.actual-full-curl',schema:'MathScope.ActualFullCurlCertificate/1',panels:3,scopePanel:'full-curl-scope'}
];
const demand=(condition,message)=>{if(!condition)throw Error(message);};
const jsonText=async(tab,selector,controls=tab.playwright)=>controls.locator(selector).evaluate(el=>JSON.parse(el.tagName==='TEXTAREA'||el.tagName==='INPUT'?el.value:el.textContent));
const fresh=tab=>tab.playwright.domSnapshot();
const click=(tab,selector,controls=tab.playwright)=>controls.locator(selector).click();
async function clickSettled(tab,selector,controls=tab.playwright){
  await click(tab,selector,controls);
  // workspace.on() clears data-busy only after its awaited handler finishes.
  // A DOM snapshot alone can still contain the prior validation/export report.
  await controls.locator(selector+'[data-busy="false"]').waitFor({state:'attached',timeoutMs:60000});
  await fresh(tab);
}

async function routeReady(tab,route,controls=tab.playwright){
  // data-mounted is set before async native-tool registration finishes.
  // route() applies the hash only after that registration has completed.
  await controls.locator('#mathscopeResearchM2[data-mounted="true"]').waitFor({state:'attached',timeoutMs:60000});
  await controls.locator('#m2-tab-'+route+'[aria-selected="true"]').waitFor({state:'attached',timeoutMs:60000});
  await fresh(tab);
}

function domEvidenceFromHtml(html){
    const document=html.ownerDocument,root=document.querySelector('#mathscopeResearchM2'),viewport=document.documentElement.clientWidth;
    const visible=el=>el.getClientRects().length>0&&document.defaultView.getComputedStyle(el).visibility!=='hidden';
    const escaped=[];
    if(root)for(const el of root.querySelectorAll('*')){
      if(!visible(el))continue;
      const rect=el.getBoundingClientRect();if(rect.width===0||rect.right<=viewport+1&&rect.left>=-1)continue;
      let clipped=false;
      for(let p=el.parentElement;p&&p!==root;p=p.parentElement){
        const style=document.defaultView.getComputedStyle(p),box=p.getBoundingClientRect();
        if(['auto','scroll','hidden','clip'].includes(style.overflowX)&&box.left>=-1&&box.right<=viewport+1){clipped=true;break;}
      }
      if(!clipped)escaped.push({tag:el.tagName,id:el.id,className:String(el.className).slice(0,160),left:rect.left,right:rect.right,width:rect.width});
    }
    const canvas=document.querySelector('#m2-scene');
    return {title:document.title,url:document.URL,viewportWidth:viewport,viewportHeight:document.documentElement.clientHeight,
      documentWidth:document.documentElement.scrollWidth,rootPresent:!!root,rootActive:root?.classList.contains('active')===true,
      mounted:root?.dataset.mounted,rootTextLength:root?.innerText.length||0,unintendedOverflow:escaped.slice(0,25),
      selectedTabs:[...document.querySelectorAll('[data-m2-tab][aria-selected="true"]')].map(el=>el.dataset.m2Tab),
      frameworkOverlay:[...document.querySelectorAll('vite-error-overlay,nextjs-portal,[data-nextjs-dialog-overlay]')].some(visible),
      resultStatus:document.querySelector('#m2-result-status')?.textContent,
      selectedExample:document.querySelector('#m2-example')?.value,
      renderedTableRows:document.querySelector('#m2-table-body')?.children.length,
      renderedTableColumns:document.querySelector('#m2-table-head tr')?.children.length,
      observation:document.querySelector('#m2-observation')?.textContent,
      rendererText:document.querySelector('#m2-render-status')?.textContent,
      canvasDataset:canvas?{...canvas.dataset}:null};
}

export async function inspectDifferentialBrowserDOM(tab){
  return tab.playwright.locator('html').evaluate(domEvidenceFromHtml);
}

/** The measured width is the embedded document's actual CSS viewport. This
 * checks responsive layout, not device emulation or touch behavior.
 */
export async function inspectFramedDifferentialBrowserDOM(tab,frameSelector='#m2-responsive-frame'){
  return tab.playwright.frameLocator(frameSelector).locator('html').evaluate(domEvidenceFromHtml);
}

async function runSelectedExample(tab,id,controls=tab.playwright){
  await controls.locator('#m2-example').selectOption(id);
  await fresh(tab);
  await clickSettled(tab,'#m2-run',controls);
  await controls.locator('#mathscopeResearchM2[data-result-status="COMPLETED"],#mathscopeResearchM2[data-result-status="PARTIAL"],#mathscopeResearchM2[data-result-status="FAILED"],#mathscopeResearchM2[data-result-status="BUDGET_EXCEEDED"]')
    .waitFor({state:'attached',timeoutMs:60000});
  await fresh(tab);
  const job=await readSelectedAuditJob(tab,controls);
  demand(['COMPLETED','PARTIAL'].includes(job.status),id+' did not complete: '+job.status+' '+(job.result?.message||''));
  return job;
}

async function readSelectedAuditJob(tab,controls=tab.playwright){
  // Read only the audit fields from the actual rendered JSON. Transferring a
  // whole >200k-character result as a string can truncate at the browser bridge.
  // Parsing its complete DOM text locally preserves the genuine result while
  // keeping the read-only browser response bounded.
  return controls.locator('#m2-result-json').evaluate(el=>{
    const j=JSON.parse(el.textContent),d=j.result?.results;
    return {id:j.id,status:j.status,request:j.request,inputHash:j.inputHash,resultHash:j.resultHash,
      result:j.result?{sourceHash:j.result.sourceHash,message:j.result.message,
        results:d?{schema:d.schema,pass:d.pass,graph:d.graph,scope:d.scope,domain:d.domain,checks:d.checks,
          divergenceRows:d.divergenceRows?.map(row=>({sign:row.sign,domainMembershipCertified:row.domainMembershipCertified}))}:null}:null};
  });
}

/** Start once and return promptly. Some Cloud Browser locator waits end before
 * their requested timeout; an unfinished worker must be observed again without
 * re-submitting it. Inspect its terminal result with the function below.
 */
export async function startDifferentialBrowserSourceExample(tab,exampleId,{heavyRunsCoordinated=false}={}){
  demand(heavyRunsCoordinated===true,'Coordinate the >1GiB source workers before this audit.');
  demand(DIFFERENTIAL_BROWSER_EXAMPLES.some(item=>item.id===exampleId),'Unknown source audit example.');
  const state=await tab.playwright.locator('#mathscopeResearchM2').getAttribute('data-result-status');
  demand(!['RUNNING','QUEUED'].includes(state),'Wait for the current source worker before starting another.');
  await click(tab,'#m2-tab-ns');await routeReady(tab,'ns');
  await tab.playwright.locator('#m2-example').selectOption(exampleId);await fresh(tab);
  await clickSettled(tab,'#m2-run');
  const job=await readSelectedAuditJob(tab);
  return {id:exampleId,jobId:job.id,status:job.status,request:job.request,inputHash:job.inputHash};
}

/** Read and test an already executed source result. Never starts a worker. */
export async function inspectSelectedDifferentialBrowserSource(tab,exampleId){
  const expected=DIFFERENTIAL_BROWSER_EXAMPLES.find(item=>item.id===exampleId);
  demand(expected,'Unknown source audit example.');
  const job=await readSelectedAuditJob(tab),d=job.result?.results;
  demand(job.request?.kind===expected.kind,'The selected job is a different source example.');
  if(['RUNNING','QUEUED'].includes(job.status))return {id:exampleId,jobId:job.id,status:job.status,pending:true};
  demand(['COMPLETED','PARTIAL'].includes(job.status),'Source worker did not complete: '+job.status+' '+(job.result?.message||''));
  demand(d?.schema===expected.schema&&d.pass===true,'Wrong actual source certificate.');
  const options=await tab.playwright.locator('#m2-observation-select option').evaluateAll(els=>els.map(el=>({id:el.value,label:el.textContent})));
  demand(options.length===expected.panels,'Missing differential panels.');
  const panels=[];
  for(const option of options){
    await tab.playwright.locator('#m2-observation-select').selectOption(option.id);await fresh(tab);
    const dom=await inspectDifferentialBrowserDOM(tab);
    demand(dom.canvasDataset.visualizationState==='READY','Differential panel not ready.');
    demand(dom.documentWidth<=dom.viewportWidth+1&&dom.unintendedOverflow.length===0,'Differential panel has unintended viewport overflow.');
    demand(dom.canvasDataset.inputHash===job.inputHash&&dom.canvasDataset.resultHash===job.resultHash,'Panel selection lost the source-result binding.');
    panels.push({id:option.id,...dom});
  }
  await tab.playwright.locator('#m2-observation-select').selectOption(expected.scopePanel);await fresh(tab);
  if(expected.kind==='ns.actual-full-curl'){
    demand(d.scope.exercisedBandPositiveWeightsCertified===false&&d.scope.actualGlobalSlowPartitionGluingComplete===false,'Local conditional curl was promoted.');
    demand(d.divergenceRows.every(row=>row.domainMembershipCertified===false),'Conditional zero became an unconditional band claim.');
  }
  demand(d.scope.fullPhysicalResidualAndFlatErrorPackageComplete===false,'Global residual/flat-error scope was promoted.');
  return {id:expected.id,jobId:job.id,status:job.status,inputHash:job.inputHash,resultHash:job.resultHash,
    sourceHash:job.result.sourceHash,graph:d.graph,scope:d.scope,domain:d.domain,checks:d.checks,panels,functionalPass:true};
}

async function expand(tab,selector){
  const open=await tab.playwright.locator(selector).getAttribute('open');
  if(open===null){await click(tab,selector+' > summary');await fresh(tab);}
}

export async function runLightDifferentialBrowserAudit(tab,{baseUrl,capture=async()=>null}={}){
  demand(typeof baseUrl==='string','The verified published URL is required.');
  const base=baseUrl.split('#')[0],report={schema:'MathScope.DifferentialBrowserUIAudit/1',mode:'LIGHT',
    flow:'M2 route -> real control input -> source-bound result -> export/import/replay -> actual camera controls',
    browserPath:'Cloud Browser via cua_repl',localPlaywright:{status:'UNAVAILABLE_BROWSER_BINARY',downloadResponse:'HTTP 200 text/html; Site Unavailable; 195 bytes'},
    mobileViewports:{requested:[360,390,412],status:'UNAVAILABLE',reason:'No viewport/emulation capability advertised; screenshots are not substituted for layout execution.'},
    routes:[],examples:[],screenshots:[],sourceJobsExecuted:false};
  report.identity={url:await tab.url(),title:await tab.title()};
  let dom=await inspectDifferentialBrowserDOM(tab);
  demand(dom.rootPresent&&dom.mounted==='true'&&dom.rootTextLength>100,'The M2 page is not meaningfully rendered.');
  demand(!dom.frameworkOverlay,'A framework error overlay is present.');
  for(const route of DIFFERENTIAL_BROWSER_ROUTES){
    await tab.goto(base+'#research-m2/'+route);await routeReady(tab,route);
    dom=await inspectDifferentialBrowserDOM(tab);
    demand(dom.rootActive&&dom.selectedTabs.length===1&&dom.selectedTabs[0]===route,'Wrong M2 hash route: '+route);
    demand(dom.documentWidth<=dom.viewportWidth+1&&dom.unintendedOverflow.length===0,'Unintended overflow at '+route);
    report.routes.push({route,...dom});
  }
  await click(tab,'#m2-tab-ns');await fresh(tab);
  for(const expected of DIFFERENTIAL_BROWSER_EXAMPLES){
    await tab.playwright.locator('#m2-example').selectOption(expected.id);await fresh(tab);
    const request=await jsonText(tab,'#m2-input');demand(request.kind===expected.kind,'Selected NS example has the wrong kind.');
    await clickSettled(tab,'#m2-validate');
    const validation=await jsonText(tab,'#m2-validation');demand(validation.ok===true,'New NS example failed preflight.');
    report.examples.push({id:expected.id,request,validation});
  }
  await expand(tab,'#m2-completion-gate');
  report.completionGate=await tab.playwright.locator('#m2-completion-gate').innerText();
  demand(/M3.*대기/.test(report.completionGate)&&/조건부/.test(report.completionGate)&&/전역 물리 잔차/.test(report.completionGate),'M2/M3 gate wording lost a required scope condition.');
  report.screenshots.push(await capture('m2-new-ns-gate'));

  await click(tab,'#m2-tab-arithmetic');await fresh(tab);
  const small=await runSelectedExample(tab,'m2-elliptic-f9');
  await clickSettled(tab,'#m2-export');
  const exported=await tab.playwright.locator('#m2-export-content').textContent();
  // Textarea textContent may remain empty when its value was assigned by UI.
  const raw=exported||await tab.playwright.locator('#m2-export-content').evaluate(el=>el.value);
  const bundle=JSON.parse(raw);
  demand(bundle.request.kind==='arithmetic.elliptic','Unexpected small replay fixture.');
  await expand(tab,'#m2-import-panel');
  await tab.playwright.locator('#m2-import-content').fill(raw);await fresh(tab);
  await clickSettled(tab,'#m2-import-inspect');
  const inspection=await jsonText(tab,'#m2-import-report');
  demand(inspection.sameEnvironment===true&&inspection.importedEvidenceTrusted===false,'Imported evidence was trusted or not from the same runtime.');
  await clickSettled(tab,'#m2-import-input');
  const inputOnly=await jsonText(tab,'#m2-import-report');
  demand(inputOnly.status==='INPUT_LOADED'&&inputOnly.newJobSubmitted===false&&inputOnly.importedResultAdopted===false,'Input-only import incorrectly adopted a result.');
  await clickSettled(tab,'#m2-import-replay');
  // The awaited replay handler writes its final report before clearing busy.
  // Parse that report directly: regex transport quoting differs in browser
  // bindings, and must not turn a completed MATCH into a false UI failure.
  await fresh(tab);
  const replay=await jsonText(tab,'#m2-import-report');
  demand(replay.status==='MATCH'&&replay.automaticEvidenceSave===false,'UI replay did not match or saved evidence automatically.');
  report.importReplay={originalJobId:small.id,originalResultHash:small.resultHash,inspection,inputOnly,replay,bundleBytes:raw.length};
  report.screenshots.push(await capture('m2-small-import-replay'));

  await tab.goto(base+'#research-m2/observation');await tab.reload();await routeReady(tab,'observation');
  const cameraJob=await runSelectedExample(tab,'i2-blowup-pair');
  const before=await inspectDifferentialBrowserDOM(tab);
  for(let i=0;i<30;i++)await click(tab,'[data-m2-camera="'+(i%2?'right':'left')+'"]');
  await fresh(tab);const after=await inspectDifferentialBrowserDOM(tab);
  const match=after.rendererText?.match(/p95\s+([\d.]+)\s*ms/);
  demand(match,'The UI did not expose measured camera renderer p95.');
  const p95=Number(match[1]);
  demand(p95<=100,'Measured renderer p95 exceeds 100ms.');
  demand(Number(after.canvasDataset.representationRevision)>Number(before.canvasDataset.representationRevision),'Camera controls did not change representation revision.');
  for(const key of ['inputHash','resultHash','sourceHash'])demand(before.canvasDataset[key]===after.canvasDataset[key],'Camera changed '+key);
  report.camera={example:'i2-blowup-pair',jobId:cameraJob.id,actualClicks:30,p95Milliseconds:p95,targetMilliseconds:100,
    measurement:'Existing runtime renderer p95 displayed after a fresh page load and 30 actual camera clicks. Its retained draw window also includes initial page/result rendering; this is not a camera-only sample percentile or end-to-end network latency.',
    before:before.canvasDataset,after:after.canvasDataset,rendererText:after.rendererText};
  report.screenshots.push(await capture('m2-camera-metrics'));
  report.console=await tab.dev.logs({levels:['error','warn'],limit:50});
  report.consoleErrorsRequireReview=report.console.filter(entry=>entry.level==='error');
  report.pass=report.consoleErrorsRequireReview.length===0;
  return report;
}

/** Call only after cross-agent memory coordination. Uses the shipped workers
 * and preserves their actual certificate DOM, never imported result adoption.
 */
export async function runSourceDifferentialBrowserAudit(tab,{baseUrl,capture=async()=>null,heavyRunsCoordinated=false,exampleIds=DIFFERENTIAL_BROWSER_EXAMPLES.map(item=>item.id)}={}){
  demand(heavyRunsCoordinated===true,'Coordinate the >1GiB source workers before this audit.');
  demand(exampleIds.length>0&&new Set(exampleIds).size===exampleIds.length,'Source audit examples must be distinct.');
  const expectedExamples=exampleIds.map(id=>DIFFERENTIAL_BROWSER_EXAMPLES.find(item=>item.id===id));
  demand(expectedExamples.every(Boolean),'Unknown source audit example.');
  const base=baseUrl.split('#')[0],report={schema:'MathScope.DifferentialBrowserSourceAudit/1',runs:[],screenshots:[],sourceJobsExecuted:true};
  for(const expected of expectedExamples){
    if(await tab.url()!==base+'#research-m2/ns')await tab.goto(base+'#research-m2/ns');
    await tab.reload();await fresh(tab);
    await routeReady(tab,'ns');
    const job=await runSelectedExample(tab,expected.id),d=job.result?.results;
    demand(d?.schema===expected.schema&&d.pass===true,'Wrong actual source certificate.');
    const options=await tab.playwright.locator('#m2-observation-select option').evaluateAll(els=>els.map(el=>({id:el.value,label:el.textContent})));
    demand(options.length===expected.panels,'Missing differential panels.');
    const panels=[];
    for(const option of options){
      await tab.playwright.locator('#m2-observation-select').selectOption(option.id);await fresh(tab);
      const dom=await inspectDifferentialBrowserDOM(tab);
      demand(dom.canvasDataset.visualizationState==='READY','Differential panel not ready.');
      demand(dom.documentWidth<=dom.viewportWidth+1&&dom.unintendedOverflow.length===0,'Differential panel has unintended viewport overflow.');
      panels.push({id:option.id,...dom});
    }
    await tab.playwright.locator('#m2-observation-select').selectOption(expected.scopePanel);await fresh(tab);
    if(expected.kind==='ns.actual-full-curl'){
      demand(d.scope.exercisedBandPositiveWeightsCertified===false&&d.scope.actualGlobalSlowPartitionGluingComplete===false,'Local conditional curl was promoted.');
      demand(d.divergenceRows.every(row=>row.domainMembershipCertified===false),'Conditional zero became an unconditional band claim.');
    }
    demand(d.scope.fullPhysicalResidualAndFlatErrorPackageComplete===false,'Global residual/flat-error scope was promoted.');
    report.runs.push({id:expected.id,jobId:job.id,status:job.status,inputHash:job.inputHash,resultHash:job.resultHash,
      sourceHash:job.result.sourceHash,graph:d.graph,scope:d.scope,domain:d.domain,checks:d.checks,panels});
    report.screenshots.push(await capture(expected.id+'-scope'));
  }
  report.console=await tab.dev.logs({levels:['error','warn'],limit:50});
  report.consoleErrorsRequireReview=report.console.filter(entry=>entry.level==='error');
  report.pass=report.consoleErrorsRequireReview.length===0;return report;
}

/** The temporary, local harness resizes a real public-app iframe using its
 * visible select control. This is CSS viewport testing, not mobile-device
 * emulation. No app result, style, or renderer metric is injected.
 */
export async function runFramedDifferentialRouteAudit(tab,{frameSelector='#m2-responsive-frame',widths=[360,390,412]}={}){
  const controls=tab.playwright.frameLocator(frameSelector),report={
    schema:'MathScope.DifferentialResponsiveRouteAudit/1',mode:'REAL_IFRAME_CSS_VIEWPORT',
    deviceEmulation:false,sourceJobsExecuted:false,routes:[]};
  for(const width of widths){
    await tab.playwright.locator('#audit-width').selectOption(String(width));await fresh(tab);
    for(const route of DIFFERENTIAL_BROWSER_ROUTES){
      await tab.playwright.locator('#audit-route').selectOption(route);
      await routeReady(tab,route,controls);
      const dom=await inspectFramedDifferentialBrowserDOM(tab,frameSelector);
      demand(dom.viewportWidth===width,'Iframe CSS viewport does not equal the requested width.');
      demand(dom.rootActive&&dom.selectedTabs.length===1&&dom.selectedTabs[0]===route,'Wrong framed M2 hash route: '+route);
      demand(!dom.frameworkOverlay,'A framework overlay is present in the iframe.');
      demand(dom.documentWidth<=dom.viewportWidth+1&&dom.unintendedOverflow.length===0,'Unintended framed route overflow: '+width+'/'+route);
      report.routes.push({route,...dom});
    }
  }
  report.pass=true;return report;
}

/** Run one authentic source worker, then inspect the same result across four
 * actual iframe viewports. The engine terminates its worker on job settlement.
 * Call one example at a time, only after cross-agent memory coordination.
 */
export async function runFramedDifferentialSourceExample(tab,exampleId,{
  frameSelector='#m2-responsive-frame',widths=[960,360,390,412],capture=async()=>null,heavyRunsCoordinated=false
}={}){
  demand(heavyRunsCoordinated===true,'Coordinate the >1GiB source workers before this audit.');
  const expected=DIFFERENTIAL_BROWSER_EXAMPLES.find(item=>item.id===exampleId);
  demand(expected,'Unknown differential source example.');
  const controls=tab.playwright.frameLocator(frameSelector);
  await tab.playwright.locator('#audit-width').selectOption(String(widths[0]));
  await tab.playwright.locator('#audit-route').selectOption('ns');await routeReady(tab,'ns',controls);
  const job=await runSelectedExample(tab,expected.id,controls),d=job.result?.results;
  demand(d?.schema===expected.schema&&d.pass===true,'Wrong actual source certificate in iframe.');
  const options=await controls.locator('#m2-observation-select option').evaluateAll(els=>els.map(el=>({id:el.value,label:el.textContent})));
  demand(options.length===expected.panels,'Missing framed differential panels.');
  if(expected.kind==='ns.actual-full-curl'){
    demand(d.scope.exercisedBandPositiveWeightsCertified===false&&d.scope.actualGlobalSlowPartitionGluingComplete===false,'Local conditional curl was promoted.');
    demand(d.divergenceRows.every(row=>row.domainMembershipCertified===false),'Conditional zero became an unconditional band claim.');
  }
  demand(d.scope.fullPhysicalResidualAndFlatErrorPackageComplete===false,'Global residual/flat-error scope was promoted.');
  const report={schema:'MathScope.DifferentialFramedSourceAudit/1',mode:'REAL_IFRAME_CSS_VIEWPORT',deviceEmulation:false,
    sourceJobsExecuted:true,sourceJobCount:1,id:expected.id,jobId:job.id,status:job.status,inputHash:job.inputHash,resultHash:job.resultHash,
    sourceHash:job.result.sourceHash,graph:d.graph,scope:d.scope,domain:d.domain,checks:d.checks,viewports:[],screenshots:[]};
  for(const width of widths){
    await tab.playwright.locator('#audit-width').selectOption(String(width));await fresh(tab);
    const panels=[];
    for(const option of options){
      await controls.locator('#m2-observation-select').selectOption(option.id);await fresh(tab);
      const dom=await inspectFramedDifferentialBrowserDOM(tab,frameSelector);
      demand(dom.viewportWidth===width,'Iframe CSS viewport does not equal the requested width.');
      demand(dom.canvasDataset.visualizationState==='READY','Framed differential panel not ready.');
      demand(dom.documentWidth<=width+1&&dom.unintendedOverflow.length===0,'Framed differential panel has unintended viewport overflow: '+width+'/'+option.id);
      demand(dom.canvasDataset.inputHash===job.inputHash&&dom.canvasDataset.resultHash===job.resultHash,'Resize or panel selection lost the source-result binding.');
      panels.push({id:option.id,...dom});
    }
    await controls.locator('#m2-observation-select').selectOption(expected.scopePanel);await fresh(tab);
    report.viewports.push({width,panels});
    report.screenshots.push(await capture(expected.id+'-scope-'+width));
  }
  report.pass=true;return report;
}
