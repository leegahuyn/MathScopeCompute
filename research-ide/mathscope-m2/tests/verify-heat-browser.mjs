// Compare an observed public browser export and DOM tables with the independently
// executed source/Worker receipts. This script does not operate the browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {sha256} from '../../mathscope-m0/contracts.mjs';
import {scalarText} from '../visualization/observations.mjs';

const evidence=new URL('../navier/research/evidence/heat-runtime-20261011/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,evidence),'utf8'));
const fileSHA=name=>createHash('sha256').update(fs.readFileSync(new URL(name,evidence))).digest('hex');
const source=read('attempt1-source-runtime.json'),worker=read('attempt1-worker-runtime.json');
const browser=read('m2-v77-heat-browser-observation-20261011.json');
const replay=read('m2-v77-heat-browser-replay-20261011.json');
const publication=read('publication-verification.json');
assert.equal(publication.exactCandidateBytes,true);
assert.equal(publication.version,77);assert.equal(publication.versionHash,'7d4d3fb4');
assert.equal(browser.job.status,'COMPLETED');assert.equal(browser.job.id,'m2-job:mv3j2v8y:1');
assert.deepEqual(browser.job.result,replay.result);
assert.deepEqual(replay.request,source.request);
assert.equal(replay.environment.version,'0.3.10');
assert.equal(replay.environment.execution,'BROWSER_WEB_WORKER');
assert.equal(replay.environment.workerSha256,worker.environment.workerSha256);
assert.equal(replay.mathematicalHash,source.mathematicalHash);
assert.equal(replay.mathematicalHash,worker.mathematicalHash);
assert.equal(await sha256(replay.result.results),source.certificateSHA256);
assert.equal(replay.result.results.graph.sha256,source.graphSHA256);
assert.equal(replay.result.scope.formalPass,false);
assert.equal(replay.result.scope.m3MayStart,false);
assert.equal(browser.panels.length,source.panelRows.length);
let sourceCells=0,displayLabels=0;
const panels=[];
for(let i=0;i<source.panelRows.length;i++){
  const expected=source.panelRows[i],actual=browser.panels[i];
  assert.equal(actual.title,expected.title);
  assert.deepEqual(actual.rows,expected.rows.map(row=>row.map(scalarText)));
  assert.ok(actual.scrollWidth<=actual.clientWidth+1);
  assert.ok(actual.containerScrollWidth<=actual.containerClientWidth+1);
  assert.ok(actual.cellWhiteSpace.every(x=>x==='pre-wrap'));
  assert.ok(actual.cellWrap.every(x=>x==='anywhere'));
  for(let r=0;r<expected.rows.length;r++)for(let c=0;c<expected.rows[r].length;c++){
    const path=expected.cellSourcePaths[r][c];
    if(path){
      const value=path.split('.').reduce((v,k)=>v?.[k],browser.job);
      assert.deepEqual(value,expected.rows[r][c],path);
      sourceCells++;
    }else{assert.equal(c,0);displayLabels++;}
  }
  panels.push({id:expected.id,title:actual.title,rows:actual.rows.length,cells:actual.rows.flat().length,
    displayedCellsSHA256:await sha256(JSON.stringify(actual.rows.flat())),
    sourcePathValuesEqual:true,horizontalOverflow:false,
    clientWidth:actual.clientWidth,scrollWidth:actual.scrollWidth});
}
assert.equal(sourceCells,106);assert.equal(displayLabels,11);
const screenshots=[];
for(const name of ['m2-v77-heat-screenshot-20261011.json','m2-v77-heat-table-screenshot-20261011.json']){
  const receipt=read(name);assert.equal(receipt.encoding,'RAW_JPEG_BYTES');
  assert.equal(fileSHA(receipt.file),receipt.sha256);
  assert.equal(fs.statSync(new URL(receipt.file,evidence)).size,receipt.bytes);
  screenshots.push(receipt);
}
const currentConsole=browser.console.filter(item=>item.timestamp>=publication.retrievedAt);
const knownExtension=currentConsole.filter(item=>item.message.startsWith('Error sending browser metadata to extension:'));
const knownWebGL=currentConsole.filter(item=>item.message.startsWith('THREE.WebGLRenderer:'));
const unclassified=currentConsole.filter(item=>!knownExtension.includes(item)&&!knownWebGL.includes(item));
assert.equal(unclassified.length,0,JSON.stringify(unclassified));
const record={schema:'MathScope.M2.HeatRuntime.BrowserVerification/1',reviewedAt:new Date().toISOString(),
  status:'SCOPED_PUBLIC_WORKER_AND_EXACT_DOM_TABLES_VERIFIED',url:browser.url,pageVersion:77,versionHash:'7d4d3fb4',
  runtimeVersion:'0.3.10',implementationCommit:publication.implementationCommit,jobId:browser.job.id,
  inputHash:replay.inputHash,mathematicalHash:replay.mathematicalHash,certificateSHA256:source.certificateSHA256,
  graphSHA256:source.graphSHA256,workerSHA256:replay.environment.workerSha256,
  sourceWorkerBrowserMathematicalHashesAgree:true,sourceWorkerBrowserCertificateHashesAgree:true,
  browserEnvironment:replay.environment.runtime,sourceAndBrowserEnvironmentEqual:false,
  portabilityGuarantee:false,panelCount:4,sourceValueCellsCompared:sourceCells,displayLabels,
  allCellsSourceBound:false,allValueCellsSourceBound:true,panels,screenshots,
  strictConsoleClean:currentConsole.length===0,
  consoleCheck:{since:publication.retrievedAt,totalReturned:browser.console.length,currentPageWindow:currentConsole.length,
    extensionMetadataErrors:knownExtension.length,legacyWebGLUnavailableErrors:knownWebGL.length,
    unclassifiedErrors:unclassified.length,m2WorkerOrPanelErrorsObserved:0,
    scope:'Only the returned error/warn log window; legacy WebGL failure is not hidden or relabeled as clean.'},
  mobileBrowserQAExecuted:false,
  inputEditedDuringRun:false,original64CriteriaNotPromoted:true,newLeanKernelProof:false,m3MayStart:false,
  scope:replay.result.scope,
  evidence:Object.fromEntries(['m2-v77-heat-browser-observation-20261011.json','m2-v77-heat-browser-replay-20261011.json',
    'publication-verification.json','provider-publication.json'].map(name=>[name,fileSHA(name)]))};
fs.writeFileSync(new URL('browser-verification.json',evidence),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({pass:true,mathematicalHash:record.mathematicalHash,certificateSHA256:record.certificateSHA256,
  panels:4,sourceCells,displayLabels,horizontalOverflow:false,strictConsoleClean:record.strictConsoleClean,
  console:record.consoleCheck,m3MayStart:false}));
