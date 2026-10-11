// One genuine source-heavy calculation per process, against the shipped Worker.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createM2Engine} from '../core/engine.mjs';
import {listExamples,validateDomainRequest} from '../core/registry.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../core/worker-data.mjs';
import {makeM2Visualization,listM2Panels} from '../visualization/m2-views.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const kind=process.argv[2],mode=process.argv[3]??'worker';
assert.ok(['ns.actual-cutoff-masses','ns.actual-band-admissibility'].includes(kind));
assert.ok(['source','worker'].includes(mode));
const out=new URL('../navier/research/evidence/m2-continuation-20261011/',import.meta.url);
const example=(await listExamples()).find(e=>e.request.kind===kind);assert.ok(example);
assert.equal((await validateDomainRequest(example.request)).ok,true);
assert.equal(await sha256(WORKER_SOURCE),WORKER_SHA256);
const sourcePaths=['core/registry.mjs','navier/index.mjs','navier/actual-cutoff-mass-enclosure.mjs',
  'navier/actual-covariance-band-admissibility.mjs','visualization/actual-continuation-panels.mjs',
  'visualization/m2-views.mjs','m2.worker.js','workspace.bundle.js'];
const snapshot=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async path=>
  [path,await sha256(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'))])));
const before=await snapshot();
function workerFactory(source){
  const bridge='const {parentPort}=require("node:worker_threads");globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on("message",data=>self.onmessage({data}));\n';
  const native=new Worker(bridge+source,{eval:true,resourceLimits:{maxOldGenerationSizeMb:2048}});
  const proxy={postMessage:x=>native.postMessage(x),terminate:()=>native.terminate(),onmessage:null,onerror:null};
  native.on('message',data=>proxy.onmessage?.({data}));native.on('error',error=>proxy.onerror?.(error));return proxy;
}
const start=performance.now(),engine=createM2Engine(mode==='source'?{local:true}:{workerFactory});
try{
  const job=await engine.wait((await engine.submit(example.request)).id);
  assert.equal(job.status,'COMPLETED',JSON.stringify(job.result));
  const certificate=job.result.results;assert.equal(certificate.pass,true);
  assert.ok(certificate.checks.length>0&&certificate.checks.every(c=>c.pass));
  assert.equal(job.result.scope.formalPass,false);
  assert.equal(job.result.scope.fullSameProfileN5,false);
  if(kind==='ns.actual-cutoff-masses'){
    assert.equal(certificate.scope.actualSlowPulseDerivativeNumericallyEnclosed,false);
    assert.equal(certificate.scope.wholeGNUMComplete,false);
    assert.ok(certificate.values.longitudinalSquareMass.absoluteEnclosure.lower);
  }else{
    assert.equal(certificate.decision.uniformTheoremNonmembershipProved,true);
    assert.equal(job.result.scope.actualPositiveWeightsProved,false);
  }
  const panels=listM2Panels(job);assert.equal(panels.length,kind==='ns.actual-cutoff-masses'?3:2);
  let checkedSourcePathCells=0,unboundDisplayLabels=0;
  for(const panel of panels){
    const view=makeM2Visualization(job,{panel:panel.id});assert.equal(view.state,'READY');
    assert.equal(view.scene.points.length,0);
    for(const table of [view.table,...view.relatedTables])for(let i=0;i<table.rows.length;i++)for(let j=0;j<table.rows[i].length;j++){
      const path=table.cellSourcePaths?.[i]?.[j];
      if(!path){assert.ok(j===0&&typeof table.rows[i][j]==='string');unboundDisplayLabels++;continue;}
      const source=path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((x,k)=>x?.[k],job);
      assert.deepEqual(table.rows[i][j],source,path);checkedSourcePathCells++;
    }
  }
  const after=await snapshot();assert.deepEqual(after,before,'Runtime sources must stay fixed during each run.');
  const certificateSHA256=await sha256(certificate),sourceName=kind.slice(3)+'-source-runtime.json';
  if(mode==='worker'){
    const reference=JSON.parse(fs.readFileSync(new URL(sourceName,out)));
    assert.equal(job.mathematicalHash,reference.mathematicalHash);
    assert.equal(certificateSHA256,reference.certificateSHA256);
    assert.deepEqual(after,reference.runtimeSHA256);
  }
  const env=await engine.environment();
  const record={schema:'MathScope.M2.Continuation.RuntimeCase/1',kind,mode,pass:true,exitCode:0,
    command:'node --max-old-space-size=2048 research-ide/mathscope-m2/tests/continuation-runtime-case.mjs '+kind+' '+mode,
    request:job.request,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    environment:{schema:env.schema,version:env.version,workerSha256:env.workerSha256,execution:env.execution,runtime:env.runtime,hash:env.hash},
    mathematicalHash:job.mathematicalHash,certificateSHA256,sourceCompilerParity:mode==='worker',panelCount:panels.length,
    checkedCellsWithSourcePathsMatchSource:true,checkedSourcePathCells,unboundDisplayLabels,allCellsSourceBound:false,
    numericalPhysicalMarks:0,scope:job.result.scope,certificateGraph:certificate.graph??null,
    sourceProgram:certificate.sourceProgram??null,bindingProgram:certificate.bindingProgram??null,
    sourceFilesUnchangedDuringRun:true,runtimeSHA256:after};
  fs.writeFileSync(new URL(kind.slice(3)+'-'+mode+'-runtime.json',out),JSON.stringify(record,null,2)+'\n');
  fs.writeFileSync(new URL(kind.slice(3)+'-'+mode+'-replay.json',out),JSON.stringify(await engine.exportBundle(job.id),null,2)+'\n');
  console.log(JSON.stringify({kind,mode,pass:true,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,
    certificateSHA256,mathematicalHash:job.mathematicalHash,sourceCompilerParity:record.sourceCompilerParity,
    panelCount:panels.length,checkedSourcePathCells,unboundDisplayLabels}));
}finally{engine.dispose();}
