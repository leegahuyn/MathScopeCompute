import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.M3_PLAYWRIGHT_PACKAGE||'playwright');
const repo=fileURLToPath(new URL('../../../../',import.meta.url));
const release=path.join(repo,'research-ide/mathscope-m3/evidence/all64-20261012/release56');
const output=process.env.M3_BROWSER_EVIDENCE||path.join(release,'browser-observed');
fs.mkdirSync(output,{recursive:true});
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const inputs=JSON.parse(fs.readFileSync(path.join(release,'candidate-pages.json'),'utf8'));
const pages=new Map(inputs.files.map(row=>{
  const packed=fs.readFileSync(path.join(repo,row.path));assert.equal(packed.length,row.bytes);assert.equal(sha(packed),row.sha256);
  const raw=gunzipSync(packed);assert.equal(raw.length,row.rawBytes);assert.equal(sha(raw),row.rawSHA256);
  return [row.path.includes('baseline-')?'/baseline.html':'/candidate.html',raw];
}));
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  if(pathname==='/favicon.ico'){response.writeHead(204).end();return;}
  const body=pages.get(pathname);if(!body){response.writeHead(404).end('Not found');return;}
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store'});response.end(body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const result={schema:'MathScope.M3.Release56.RenderedBrowserVerification/1',startedUTC:new Date().toISOString(),
  browserPluginFallbackReason:'Browser plugin not available; local browser download returned a truncated archive. Run the unchanged candidate in GitHub Actions Chromium.',
  candidatePubliclyPublished:false,inputs,sourceOnlyArchiveFlow:true,viewports:[],baselinePageErrors:[],baselineConsoleErrors:[],
  candidatePageErrors:[],candidateConsoleErrors:[],pass:false};
let browser;
const wall=setTimeout(()=>{result.failure='Observed browser gate exceeded 240 seconds';fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(result,null,2));process.exit(124);},240000);
try{
  browser=await chromium.launch({headless:true});result.browserVersion=browser.version();
  const baseline=await browser.newContext({viewport:{width:1440,height:1050}}),old=await baseline.newPage();
  old.on('pageerror',e=>result.baselinePageErrors.push(e.message));
  old.on('console',m=>{if(m.type()==='error')result.baselineConsoleErrors.push(m.text());});
  await old.goto(base+'/baseline.html#research-fluid-m3/N6',{waitUntil:'domcontentloaded',timeout:45000});
  await old.waitForFunction(()=>window.MathScopeM3ExtendedWorkspace?.audit()?.navier?.package==='N6',undefined,{timeout:45000});
  const oldWorkspace=old.locator('[data-e3="n3"]');
  await oldWorkspace.locator('[data-e3-input="example"]').selectOption('N6-global-temporal-inverse-record');
  await oldWorkspace.locator('[data-e3-action="load"]').click();await oldWorkspace.locator('[data-e3-action="run"]').click();
  await old.waitForFunction(()=>{const s=window.MathScopeM3ExtendedWorkspace?.audit()?.navier;return s&&!s.busy&&s.resultDigest;},undefined,{timeout:60000});
  await baseline.close();
  for(const viewport of [{width:1440,height:1050},{width:390,height:844}]){
    const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage();
    const localErrors=[],localConsole=[];
    page.on('pageerror',e=>{localErrors.push(e.message);result.candidatePageErrors.push(e.message);});
    page.on('console',m=>{if(m.type()==='error'){localConsole.push(m.text());result.candidateConsoleErrors.push(m.text());}});
    await page.goto(base+'/candidate.html#research-fluid-m3/N6',{waitUntil:'domcontentloaded',timeout:45000});
    const workspace=page.locator('[data-e3="n3"]');
    await workspace.locator('[data-e3-input="example"]').selectOption('N6-global-forced-current-record');
    await workspace.locator('[data-e3-action="load"]').click();
    await workspace.locator('[data-e3-action="run"]').click();
    await page.waitForFunction(()=>{const s=window.MathScopeM3ExtendedWorkspace?.audit()?.navier;return s&&!s.busy&&s.sourceForcedHarmonicRows===10;},undefined,{timeout:60000});
    const initial=await page.evaluate(()=>window.MathScopeM3ExtendedWorkspace.audit().navier);
    assert.equal(initial.sourceForcedInverseRows,20);assert.equal(initial.sourcePoints,0);assert.equal(initial.displayedPoints,0);
    assert.equal(await workspace.locator('.e3-error').count(),0);
    const panel=workspace.locator('[data-source-forced-current]');
    assert.equal(await panel.locator('[data-source-forced-row]').count(),10);
    assert.equal(await panel.locator('[data-source-forced-inverse]').count(),2);
    assert.match(await panel.locator('[data-source-forced-pressure]').innerText(),/p_mean = expr #/);
    const link=await panel.locator('[data-source-forced-artifact]').getAttribute('href');
    assert.match(link,/\/blob\/ed47ff6aa2b109dc32be78908d09e4885c484036\//);
    const last=panel.locator('[data-source-forced-select]').last(),key=await last.getAttribute('data-source-forced-select');
    await last.click();
    const chosen=JSON.parse(await workspace.locator('[data-e3-out="selection"]').textContent());
    assert.equal(chosen.key,key);assert.equal(chosen.sourceChangedBySelection,false);assert.equal(chosen.sourcePath,'result.results.summary.templates[9]');
    assert.equal(chosen.inverseRows.length,2);assert.equal(chosen.expressionIdsAreNumericalValues,false);
    const after=await page.evaluate(()=>window.MathScopeM3ExtendedWorkspace.audit().navier);
    assert.equal(after.resultDigest,initial.resultDigest);assert.equal(after.selectedForcedCurrentKey,key);
    const first=panel.locator('[data-source-forced-select]').first();await first.focus();await page.keyboard.press('Space');
    const keyboard=await page.evaluate(()=>window.MathScopeM3ExtendedWorkspace.audit().navier);
    assert.equal(keyboard.resultDigest,initial.resultDigest);assert.notEqual(keyboard.selectedForcedCurrentKey,key);
    await workspace.locator('[data-e3-action="replay"]').click();
    await page.waitForFunction(()=>window.MathScopeM3ExtendedWorkspace?.audit()?.navier.lastReplay==='MATCH',undefined,{timeout:60000});
    const replay=await page.evaluate(()=>window.MathScopeM3ExtendedWorkspace.audit().navier);
    assert.equal(replay.resultDigest,initial.resultDigest);
    assert.equal(await workspace.locator('[data-e3-out="scene"]').isVisible(),false);
    assert.equal(await workspace.locator('[data-e3-input="selected"]').isVisible(),false);
    await panel.evaluate(node=>node.scrollIntoView({block:'start',behavior:'instant'}));
    await page.evaluate(()=>window.scrollBy(0,-24));
    const image='forced-source-'+viewport.width+'x'+viewport.height+'.png';
    await page.screenshot({path:path.join(output,image),fullPage:false,animations:'disabled'});
    const geometry=await page.evaluate(()=>({viewportWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,
      tableScrollWidth:document.querySelector('[data-source-forced-modes]').parentElement.scrollWidth,
      tableClientWidth:document.querySelector('[data-source-forced-modes]').parentElement.clientWidth,
      sourceTableBeforeInspector:!!(document.querySelector('[data-source-forced-current]').compareDocumentPosition(document.querySelector('[data-e3="n3"] .e3-inspector'))&Node.DOCUMENT_POSITION_FOLLOWING)}));
    assert.equal(geometry.sourceTableBeforeInspector,true);
    assert.ok(geometry.documentWidth<=geometry.viewportWidth+2,'Unexpected document-wide horizontal overflow: '+JSON.stringify(geometry));
    const novelPageErrors=localErrors.filter(x=>!result.baselinePageErrors.includes(x));
    assert.deepEqual(novelPageErrors,[],'New page errors in the changed flow');
    result.viewports.push({viewport,initial,after,keyboard,replay,selectedSourcePath:chosen.sourcePath,
      immutableSourceURL:link,geometry,screenshot:image,screenshotSHA256:sha(fs.readFileSync(path.join(output,image))),
      pageErrors:localErrors,consoleErrors:localConsole,newPageErrors:novelPageErrors,pass:true});
    await context.close();
  }
  result.pass=result.viewports.length===2&&result.viewports.every(x=>x.pass);
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{
  result.finishedUTC=new Date().toISOString();fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(result,null,2)+'\n');
  clearTimeout(wall);await browser?.close();await new Promise(resolve=>server.close(resolve));
  console.log(JSON.stringify({pass:result.pass,viewports:result.viewports.length,evidence:output,failure:result.failure??null}));
}
