const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');
const { PNG } = require(process.env.MATHSCOPE_PNGJS_PATH || 'pngjs');
const { readFileSync,writeFileSync } = require('node:fs');
const { join,resolve } = require('node:path');
const os=require('node:os');
const root=resolve(process.argv[2]), bytes=readFileSync(process.argv[3]),base='http://127.0.0.1:39165/candidate.html';
const budget=JSON.parse(readFileSync(join(root,'budget.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const candidateSHA256=sha(bytes);
assert(budget.scope.endsWith(candidateSHA256));
const cdn='https://cdn.jsdelivr.net/npm/three@0.180.0/';
const paths=['build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js'];
const three=new Map(paths.map(path=>[cdn+path,readFileSync(join(root,'three',path.split('/').at(-1)))]));
const archivePins=JSON.parse(readFileSync(join(root,'archive-asset-pins.json')));
const archiveBase='https://cdn.websitepublisher.ai/custom/wid29770/';
const assets=new Map(Object.entries(archivePins).map(([path,pin])=>{
 const data=readFileSync(join(root,'assets',path.split('/').at(-1)));
 assert.equal(sha(data),pin.sha256);
 const url=archiveBase+path+(path.endsWith('stage7.js')?'?v=stage8-cloud-diagnostics-20261008':'');
 return [url,{data,mimeType:path.endsWith('.css')?'text/css':'text/javascript'}];
}));
const audit=page=>page.evaluate(()=>window.MathScopeP7VisualController.audit());
const p95=xs=>[...xs].sort((a,b)=>a-b)[Math.ceil(.95*xs.length)-1];
const fixture='P7-01';
const scene='#m3-p7-visualization';
const rendered=page=>page.waitForFunction(()=>window.MathScopeP7VisualController?.audit().renderer.currentModelRendered,{},{timeout:20000});
const overlays='vite-error-overlay,nextjs-portal [data-nextjs-dialog-overlay],#webpack-dev-server-client-overlay';
async function testView(browser,mode,mobile) {
 const view=mobile?budget.mobile:budget.desktop;
 const label=mode+'-'+(mobile?'mobile':'desktop');
 const context=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:view.dpr,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 try {
 const page=await context.newPage(),errors=[],fallbackErrors=[],blocked=new Set(),served=new Set();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&m.text().includes('THREE.WebGLRenderer'))fallbackErrors.push(m.text());});
 await page.route('**/*',r=>{
   const url=r.request().url();
   if(url===base)return r.fulfill({body:bytes,contentType:'text/html; charset=utf-8'});
   if(three.has(url))return r.fulfill({body:three.get(url),headers:{'access-control-allow-origin':'*'},contentType:'text/javascript'});
   if(assets.has(url)){
     const asset=assets.get(url);
     served.add(url);
     return r.fulfill({body:asset.data,headers:{'access-control-allow-origin':'*'},contentType:asset.mimeType});
   }
   blocked.add(url);
   return r.abort();
 });
 await page.goto(base+'#research-m3',{waitUntil:'domcontentloaded'});
 const host=page.locator(scene),canvas=host.locator('canvas');
 await host.scrollIntoViewIfNeeded();
 await rendered(page);
 const initial=await audit(page);
 assert.equal(initial.criterion,fixture);
 assert.equal(initial.renderer.renderer,mode==='webgl'?'WEBGL':'CANVAS2D');
 assert.equal(initial.renderer.fallbackReason,mode==='webgl'?null:'WEBGL_UNAVAILABLE');
 assert.equal(initial.renderer.webGLRendered,mode==='webgl');
 assert.equal(initial.renderer.canvasCount,1);
 assert.deepEqual(initial.renderer.rendered,budget.expectedMarks);
 assert.equal(initial.renderer.skipped,0);
 assert(initial.renderer.drawCalls>0);
 assert.equal(initial.renderer.pixelRatio,Math.min(view.dpr,1.5));
 assert.equal(await canvas.getAttribute('role'),'img');
 await canvas.evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
 await rendered(page);
 const rect=await canvas.evaluate(el=>{
   const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
   const hit=document.elementFromPoint(x,y);
   return {left:r.left,top:r.top,width:r.width,height:r.height,dpr:devicePixelRatio,
     sceneHit:hit?.closest('[data-p7v="scene"]')===el.closest('[data-p7v="scene"]')};
 });
 assert(rect.sceneHit&&rect.left>=0&&rect.top>=0&&rect.left+rect.width<=view.width+1&&rect.top+rect.height<=view.height+1);
 const viewportPng=PNG.sync.read(await page.screenshot());
 const x=Math.ceil(rect.left*rect.dpr),y=Math.ceil(rect.top*rect.dpr);
 const w=Math.floor((rect.left+rect.width)*rect.dpr)-x,h=Math.floor((rect.top+rect.height)*rect.dpr)-y;
 const png=new PNG({width:w,height:h});
 PNG.bitblt(viewportPng,png,x,y,w,h,0,0);
 const sceneBytes=PNG.sync.write(png);
 writeFileSync(join(root,label+'.png'),sceneBytes);
 const colors=new Map();
 for(let i=0;i<png.data.length;i+=4) {
   const key=png.data.readUInt32BE(i);
   colors.set(key,(colors.get(key)||0)+1);
 }
 const pixelColors=[...colors].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([color,n])=>({color:color.toString(16).padStart(8,'0'),n}));
 assert(colors.size>10 && pixelColors[0].n<png.width*png.height*.998);
 const select=host.locator('[data-p7v="selection"]');
 const index=1;
 const optionValues=await select.locator('option').evaluateAll(opts=>opts.map(x=>x.value).filter(x=>x!==''));
 assert(optionValues.length>index);
 await select.selectOption(optionValues[index]);
 const selected=await audit(page),selectedJson=JSON.parse(await host.locator('[data-p7v="selection-detail"]').textContent());
 if(mobile){
   await host.locator('[data-p7v-action="next"]').tap();
   assert.notEqual((await audit(page)).renderer.selectedId,selected.renderer.selectedId);
   await select.selectOption(optionValues[index]);
 }
 const rawTable=await host.locator('[data-p7v="table-body"]').innerText();
 assert(selected.renderer.selectedId&&selectedJson.source&&rawTable.length>100);
 assert.equal(selectedJson.proofStatusPromoted,false);
 await canvas.scrollIntoViewIfNeeded();
 await canvas.focus();
 const cdp=await context.newCDPSession(page);
 const heap=[];
 const mem=async()=>{ const m=await cdp.send('Runtime.getHeapUsage'); heap.push(m.usedSize+m.embedderHeapUsedSize+m.backingStorageSize); };
 await mem();
 await page.evaluate(()=>{
   window.__r105Latency=[];
   let pending=null;
   const renderer=()=>window.MathScopeP7VisualController.audit().renderer;
   const auditOutput=document.querySelector('#m3-p7-visualization [data-p7v="audit"]');
   const observer=new MutationObserver(()=>{
     if(!pending)return;
     const state=renderer();
     if(state.frames<=pending.frame||!state.currentModelRendered)return;
     window.__r105Latency.push(performance.now()-pending.start);
     pending=null;
   });
   observer.observe(auditOutput,{childList:true});
   document.querySelector('#m3-p7-visualization canvas').addEventListener('keydown',event=>{
     if(!['ArrowRight','ArrowLeft'].includes(event.key))return;
     pending={start:performance.now(),frame:renderer().frames};
   },{capture:true});
 });
 for(let i=0;i<budget.interactionsPerView;i++){
   await page.keyboard.press(i%2===0?'ArrowRight':'ArrowLeft');
   await page.waitForFunction(i=>window.__r105Latency.length===i,i+1);
   await mem();
 }
 const times=await page.evaluate(()=>window.__r105Latency);
 const cameraChanged=(await audit(page)).renderer.camera;
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(previous=>JSON.stringify(window.MathScopeP7VisualController.audit().renderer.camera)!==JSON.stringify(previous),cameraChanged);
 assert.equal((await audit(page)).renderer.selectedId,selected.renderer.selectedId);
 await page.keyboard.press('Home');
 await rendered(page);
 assert.equal((await audit(page)).renderer.camera.zoom,initial.renderer.camera.zoom);
 const boundedMemory=heap.every(v=>Number.isFinite(v)&&v<=budget.rendererMemoryBytes);
 const boundedLatency=p95(times)<=budget.latencyP95Milliseconds;
 const launcher=page.locator('#ms-m4-launcher');
 await launcher.focus();
 await page.keyboard.press('Enter');
 const dialog=page.locator('#ms-m4-dialog');
 assert.equal(await dialog.getAttribute('open'),'');
 await dialog.locator('[data-criterion="R1-05"]').press('Enter');
 assert.match(await dialog.locator('[data-detail-title]').innerText(),/R1-05/);
 const p=dialog.locator('[data-m4-formal-view]');
 await p.locator(':scope > summary').press('Enter');
 await p.locator('[data-claim-expert] summary').press('Enter');
 const longText=await p.locator('[data-claim-type]').textContent();
 const ko=await p.locator('[data-claim-explanation]').textContent();
 assert(longText.length>200 && /[∀ℕ]/.test(longText));
 assert(ko.length>60&&/[가-힣]/.test(ko));
 await p.locator('[data-claim-type]').waitFor({state:'visible'});
 const overflow=await page.evaluate(()=>{
   const dlg=document.querySelector('#ms-m4-dialog'), typ=dlg.querySelector('[data-claim-type]');
   const v=el=>({client:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX});
   const containing=typ.parentElement.getBoundingClientRect();
   const text=typ.firstChild;
   const glyphs={nonWhitespace:0,spaces:0,outsideGlyphs:[],hangingSpaces:[]};
   for(let i=0;i<text.length;i++){
     const whitespace=/\s/u.test(text.textContent[i]);
     glyphs[whitespace?'spaces':'nonWhitespace']++;
     const range=document.createRange();
     range.setStart(text,i);
     range.setEnd(text,i+1);
     const r=range.getBoundingClientRect();
     if(r.width>0&&(r.left<containing.left-1||r.right>containing.right+1))
       glyphs[whitespace?'hangingSpaces':'outsideGlyphs'].push({character:text.textContent[i],index:i,left:r.left,right:r.right});
   }
   return {document:v(document.documentElement),dialog:v(dlg),
     formula:{parentWidth:containing.width,...glyphs,inside:glyphs.nonWhitespace>0&&glyphs.outsideGlyphs.length===0}};
 });
 const geometry=await page.evaluate(()=>{
   const width=document.documentElement.clientWidth;
   return [...document.body.querySelectorAll('*')].filter(el=>{
     const b=el.getBoundingClientRect();
     return b.width>0&&b.right>width+2&&b.left<width;
   }).slice(0,18).map(el=>({tag:el.tagName,id:el.id,classes:String(el.className).slice(0,80),
     right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}));
 });
 const clippingChecks={document:overflow.document.scroll<=overflow.document.client+1,
   dialog:overflow.dialog.scroll<=overflow.dialog.client+1,
   formula:overflow.formula.inside};
 await p.locator('[data-claim-type]').evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
 const formulaBytes=await page.screenshot({path:join(root,label+'-formula.png')});
 console.log(JSON.stringify({label,overflow,clippingChecks,geometry}));
 await page.keyboard.press('Escape');
 assert.equal(await dialog.getAttribute('open'),null);
 assert.equal(await launcher.evaluate(el=>el===document.activeElement),true);
 assert.equal(await page.locator(overlays).count(),0);
 assert.deepEqual(errors,[]);
 assert.equal(served.size,assets.size);
 if(mode==='webgl')assert.deepEqual(fallbackErrors,[]);
 else assert(fallbackErrors.some(e=>e.includes('disabled by enterprise policy or commandline switch')));
 return {label,viewport:view,browserVersion:browser.version(),initial,selectedId:selected.renderer.selectedId,selectedJson,
   rawTableSHA256:sha(rawTable),selectedValueSHA256:sha(JSON.stringify(selectedJson)),renderedPixels:{width:png.width,height:png.height,distinctColors:colors.size,pixelColors},
   screenshotSHA256:sha(sceneBytes),formulaScreenshotSHA256:sha(formulaBytes),
   keyboard:{interactionCount:times.length,p95Milliseconds:p95(times),maxMilliseconds:Math.max(...times),samples:times,reset:true,modalFocusRestored:true},
   memory:{snapshots:heap.length,peakBytes:Math.max(...heap),samples:heap},
   longText:{formulaCharacters:longText.length,explanationCharacters:ko.length,overflow,clippingChecks,geometry},
   fallbackErrors,archivedAssetURLsServed:[...served].sort(),blockedExternalRequestCount:blocked.size,errors,boundedMemory,boundedLatency};
 } finally {await context.close();}
}
async function run(){
 const views=[];
 for(const mode of ['webgl','cpu']){
   const args=mode==='webgl'?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--disable-webgl'];
   const browser=await chromium.launch({executablePath:process.env.MATHSCOPE_CHROME_PATH,headless:true,args});
   try{
     for(const mobile of [false,true]){
       const result=await testView(browser,mode,mobile);views.push(result);
       console.log(JSON.stringify({label:result.label,p95:result.keyboard.p95Milliseconds,peak:result.memory.peakBytes,distinctColors:result.renderedPixels.distinctColors}));
     }
   }finally{await browser.close();}
 }
 const [v,...rest]=views;
 for(const other of rest){
   assert.deepEqual(other.initial.renderer.displayDomains,v.initial.renderer.displayDomains);
   assert.equal(other.selectedValueSHA256,v.selectedValueSHA256);
   assert.equal(other.rawTableSHA256,v.rawTableSHA256);
 }
 const complete=views.every(v=>v.boundedMemory&&v.boundedLatency&&Object.values(v.longText.clippingChecks).every(Boolean));
 writeFileSync(join(root,'R1-05_RECEIPT.json'),JSON.stringify({schema:'MathScope.M4.R105.BrowserAudit/1',candidateSHA256,scope:budget.scope,thresholds:budget,
  environment:{platform:os.platform(),release:os.release(),architecture:os.arch(),cpus:os.cpus().length,
    cpuModel:os.cpus()[0].model,physicalMobileDeviceTested:false,webGLBackend:'Chrome ANGLE SwiftShader'}, 
  dependencies:{three:Object.fromEntries([...three].map(([url,b])=>[url,sha(b)])),archivedPageAssets:archivePins},views,measured:true,publicationConfirmed:false,
  verdict:complete?'PASS_ISOLATED_DESKTOP_MOBILE_WEBGL_CPU_SCOPED_BENCHMARK':'PARTIAL_SCOPED_BROWSER_AUDIT'},null,2)+'\n');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});

