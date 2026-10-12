// One genuine source-heavy run per process; a Worker run must match its
// independently executed source run and the previously authenticated heat graph.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createM2Engine} from '../core/engine.mjs';
import {listExamples,validateDomainRequest} from '../core/registry.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../core/worker-data.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const mode=process.argv[2]??'worker',stem=process.argv[3]??'attempt1';
assert.ok(['source','worker'].includes(mode));assert.match(stem,/^[a-z0-9-]+$/);
const out=new URL('../navier/research/evidence/heat-runtime-20261011/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const target=new URL(stem+'-'+mode+'-runtime.json',out),replayTarget=new URL(stem+'-'+mode+'-replay.json',out);
assert.equal(fs.existsSync(target),false,'Use a new stem; preserve all earlier run records.');
assert.equal(fs.existsSync(replayTarget),false,'Use a new stem; preserve all earlier replay records.');
const example=(await listExamples()).find(e=>e.request.kind==='ns.actual-heat-scaled-enclosure');
assert.equal((await validateDomainRequest(example.request)).ok,true);
assert.equal(await sha256(WORKER_SOURCE),WORKER_SHA256);
const sourceRef=new URL('../navier/research/evidence/actual-heat-20261011/actual-heat-scaled-enclosure-source-attempt1.json',import.meta.url);
const original=JSON.parse(fs.readFileSync(sourceRef,'utf8'));
const files=['core/registry.mjs','navier/index.mjs','navier/actual-heat-scaled-enclosure.mjs',
  'visualization/actual-heat-panels.mjs','visualization/m2-views.mjs','m2.worker.js','workspace.bundle.js','tests/heat-runtime-case.mjs'];
const snapshot=async()=>Object.fromEntries(await Promise.all(files.map(async path=>[path,await sha256(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'))])));
const before=await snapshot();
function factory(source){
  const bridge='const {parentPort}=require("node:worker_threads");globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on("message",data=>self.onmessage({data}));\n';
  const native=new Worker(bridge+source,{eval:true,resourceLimits:{maxOldGenerationSizeMb:2048}});
  const proxy={postMessage:x=>native.postMessage(x),terminate:()=>native.terminate(),onmessage:null,onerror:null};
  native.on('message',data=>proxy.onmessage?.({data}));native.on('error',error=>proxy.onerror?.(error));return proxy;
}
const startedAt=new Date().toISOString(),start=performance.now(),engine=createM2Engine(mode==='source'?{local:true}:{workerFactory:factory});
try{
  const job=await engine.wait((await engine.submit(example.request)).id);
  assert.equal(job.status,'COMPLETED',JSON.stringify(job.result));
  const certificate=job.result.results;assert.equal(certificate.pass,true);
  assert.equal(certificate.graph.sha256,original.certificate.graph.sha256);
  assert.equal(await sha256(certificate),await sha256(original.certificate));
  assert.ok(certificate.checks.length>0&&certificate.checks.every(c=>c.pass));
  assert.equal(certificate.scope.actualHeatFactorAndNineSlowJetsBound,true);
  for(const key of ['wholeLeadingFJetsEnclosed','actualPulseVolterraJetsEnclosed','wholeCovarianceHEnclosed','determinantOrWeightsEnclosed','wholeGNUMComplete','newLeanKernelProof','m3MayStart'])assert.equal(certificate.scope[key],false);
  assert.equal(job.result.scope.formalPass,false);assert.equal(job.result.scope.fullSameProfileN5,false);
  const panels=listM2Panels(job);assert.equal(panels.length,4);
  let checkedSourcePathCells=0,unboundDisplayLabels=0;
  const panelRows=[];
  for(const panel of panels){
    const view=makeM2Visualization(job,{panel:panel.id});assert.equal(view.state,'READY');assert.equal(view.scene.points.length,0);
    const table=view.table;
    for(let i=0;i<table.rows.length;i++)for(let j=0;j<table.rows[i].length;j++){
      const path=table.cellSourcePaths[i][j];
      if(path){assert.deepEqual(table.rows[i][j],path.split('.').reduce((v,k)=>v?.[k],job),path);checkedSourcePathCells++;}
      else {assert.equal(j,0);unboundDisplayLabels++;}
    }
    panelRows.push({id:panel.id,title:table.title,rows:table.rows,cellSourcePaths:table.cellSourcePaths});
  }
  const after=await snapshot();assert.deepEqual(after,before);
  const certificateSHA256=await sha256(certificate),environment=await engine.environment();
  assert.equal(environment.version,'0.3.10');assert.equal(environment.workerSha256,WORKER_SHA256);
  if(mode==='worker'){
    const reference=JSON.parse(fs.readFileSync(new URL(stem+'-source-runtime.json',out),'utf8'));
    for(const key of ['mathematicalHash','certificateSHA256'])assert.equal(key==='mathematicalHash'?job.mathematicalHash:certificateSHA256,reference[key]);
    assert.deepEqual(after,reference.runtimeSHA256);
  }
  const record={schema:'MathScope.M2.HeatRuntimeCase/1',startedAt,finishedAt:new Date().toISOString(),mode,stem,pass:true,exitCode:0,
    command:'node --max-old-space-size=2048 research-ide/mathscope-m2/tests/heat-runtime-case.mjs '+mode+' '+stem,
    request:job.request,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    mathematicalHash:job.mathematicalHash,certificateSHA256,sourceCompilerParity:true,sourceWorkerParity:mode==='worker',
    originalSourceReceiptSHA256:await sha256(fs.readFileSync(sourceRef,'utf8')),graphSHA256:certificate.graph.sha256,
    environment:{schema:environment.schema,version:environment.version,workerSha256:environment.workerSha256,execution:environment.execution,runtime:environment.runtime,hash:environment.hash},
    panelCount:panels.length,checkedSourcePathCells,unboundDisplayLabels,allCellsSourceBound:false,panelRows,
    scope:job.result.scope,runtimeSHA256:after,sourceFilesUnchangedDuringRun:true};
  fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');
  fs.writeFileSync(replayTarget,JSON.stringify(await engine.exportBundle(job.id),null,2)+'\n');
  console.log(JSON.stringify({mode,pass:true,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,mathematicalHash:job.mathematicalHash,certificateSHA256,graphSHA256:certificate.graph.sha256,panelCount:4,checkedSourcePathCells,unboundDisplayLabels}));
}catch(error){
  fs.writeFileSync(target,JSON.stringify({schema:'MathScope.M2.HeatRuntimeFailure/1',startedAt,finishedAt:new Date().toISOString(),mode,stem,pass:false,
    elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,error:{name:error.name,message:error.message,stack:error.stack},runtimeSHA256:before},null,2)+'\n');
  throw error;
}finally{engine.dispose();}
