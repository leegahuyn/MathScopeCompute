// A single source-heavy case per process; run source/worker cases serially.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createM2Engine} from '../core/engine.mjs';
import {listExamples,validateDomainRequest} from '../core/registry.mjs';
import {makeM2Visualization,listM2Panels} from '../visualization/m2-views.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const kind=process.argv[2],mode=process.argv[3]??'worker';
assert.ok(['ns.actual-pulse-jet','ns.actual-covariance-sensitivity','ns.actual-full-curl'].includes(kind));
assert.ok(['source','worker'].includes(mode));
const root=new URL('../navier/research/evidence/differential-extension-20261011/',import.meta.url);
const example=(await listExamples()).find(e=>e.request.kind===kind);assert.ok(example);
for(const request of [
  {...example.request,precision:{mode:'DIRECTED_BIGINT',bits:192}},
  {...example.request,input:{...example.request.input,ellExact:'2'}},
  {...example.request,input:{...example.request.input,completed:true}},
  {...example.request,budget:{maxOperations:1}}
])assert.equal((await validateDomainRequest(request)).ok,false);
function workerFactory(source){
  const bridge='const {parentPort}=require("node:worker_threads");globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on("message",data=>self.onmessage({data}));\n';
  const native=new Worker(bridge+source,{eval:true}),proxy={postMessage:x=>native.postMessage(x),terminate:()=>native.terminate(),onmessage:null,onerror:null};
  native.on('message',data=>proxy.onmessage?.({data}));native.on('error',error=>proxy.onerror?.(error));return proxy;
}
const start=performance.now(),engine=createM2Engine(mode==='source'?{local:true}:{workerFactory});
try{
  const job=await engine.wait((await engine.submit(example.request)).id);
  assert.equal(job.status,'COMPLETED',JSON.stringify(job.result));
  const certificate=job.result.results;assert.equal(certificate.pass,true);assert.ok(certificate.checks.every(c=>c.pass));
  assert.equal(certificate.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);
  const panels=listM2Panels(job);assert.equal(panels.length,kind==='ns.actual-covariance-sensitivity'?5:kind==='ns.actual-pulse-jet'?4:3);
  let checkedSourcePathCells=0,unboundDisplayCells=0;
  for(const panel of panels){
    const view=makeM2Visualization(job,{panel:panel.id});assert.equal(view.state,'READY');assert.equal(view.scene.points.length,0);
    for(const table of [view.table,...view.relatedTables])for(let i=0;i<table.rows.length;i++)for(let j=0;j<table.rows[i].length;j++){
      const path=table.cellSourcePaths?.[i]?.[j];
      if(!path){
        const value=table.rows[i][j],label=j===0&&table.columns[0]==='항목'&&typeof value==='string';
        assert.ok(label||value===null,'Unbound cells must be display labels or empty placeholders');
        unboundDisplayCells++;continue;
      }
      const source=path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((x,k)=>x?.[k],job);
      assert.deepEqual(table.rows[i][j],source,path);checkedSourcePathCells++;
    }
  }
  const sourceName=kind.slice(3)+'-source-runtime.json';let reference=null;
  if(mode==='worker'){
    if(kind==='ns.actual-pulse-jet')reference=JSON.parse(fs.readFileSync(new URL('pulse-jet-source-terms1.json',root))).sourceCompilerReceipt.sha256;
    if(kind==='ns.actual-full-curl')reference=JSON.parse(fs.readFileSync(new URL('full-curl-source.json',root))).sha256;
    if(kind==='ns.actual-covariance-sensitivity')reference=JSON.parse(fs.readFileSync(new URL(sourceName,root))).graph.sha256;
    assert.equal(certificate.graph.sha256,reference,'Static bundled worker must reproduce the independently exercised source compiler graph.');
  }
  const sourceFiles=['navier/index.mjs','navier/actual-covariance-sensitivity.mjs','navier/actual-pulse-jet-source.mjs','navier/actual-pulse-jet-kernel.mjs','navier/actual-full-curl.mjs'];
  const runtimeSHA256=Object.fromEntries(await Promise.all(sourceFiles.map(async p=>[p,await sha256(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'))])));
  const record={schema:'MathScope.DifferentialRuntimeCase/1',kind,mode,pass:true,command:'node research-ide/mathscope-m2/tests/differential-runtime-case.mjs '+kind+' '+mode,exitCode:0,
    request:job.request,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,environment:await engine.environment(),
    mathematicalHash:job.mathematicalHash,certificateSHA256:await sha256(certificate),graph:certificate.graph,
    sourceCompilerReference:reference,sourceCompilerParity:mode==='worker',panelCount:panels.length,
    allCellsSourceBound:unboundDisplayCells===0,checkedCellsWithSourcePathsMatchSource:true,checkedSourcePathCells,unboundDisplayCells,
    numericalPhysicalMarks:0,scope:certificate.scope,runtimeSHA256};
  fs.writeFileSync(new URL(kind.slice(3)+'-'+mode+'-runtime.json',root),JSON.stringify(record,null,2)+'\n');
  fs.writeFileSync(new URL(kind.slice(3)+'-'+mode+'-replay.json',root),JSON.stringify(await engine.exportBundle(job.id),null,2)+'\n');
  console.log(JSON.stringify({kind,mode,pass:true,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,compilerSHA256:certificate.graph.sha256,
    certificateSHA256:record.certificateSHA256,sourceCompilerParity:record.sourceCompilerParity,panelCount:panels.length}));
}finally{engine.dispose();}
