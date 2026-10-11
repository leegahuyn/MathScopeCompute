/** Observe fresh installed arithmetic through the module or real Worker.
 * The large original source execution is a separate pinned record. A
 * module/Worker run is never relabelled as reconstructing that graph.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createM2Engine} from '../core/engine.mjs';
import {listExamples,validateDomainRequest} from '../core/registry.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../core/worker-data.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {INSTALLED_PHYSICAL_CENTER_EVIDENCE as sourceEvidence,INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256} from '../navier/actual-physical-center-installed-evidence.mjs';
import {readRational,qcompare,qsub,rational as Q} from '../navier/actual-continuation-arithmetic.mjs';
import {numericalEndpointIsClosed} from '../navier/actual-positive-profile-log-enclosure.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';

const mode=process.argv[2],stem=process.argv[3];
assert.equal(process.argv.length,4);assert.ok(['module','worker'].includes(mode));assert.match(stem,/^[a-z0-9-]+$/);
const directory=new URL('../navier/research/evidence/physical-center-runtime-20261011/',import.meta.url);
fs.mkdirSync(directory,{recursive:true});
const target=new URL(stem+'-'+mode+'-runtime.json',directory),replayTarget=new URL(stem+'-'+mode+'-replay.json',directory);
assert.equal(fs.existsSync(target),false);assert.equal(fs.existsSync(replayTarget),false);
const source=JSON.parse(fs.readFileSync(new URL('../../../'+sourceEvidence.numericalCertificate.path,import.meta.url),'utf8')),
  example=(await listExamples()).find(row=>row.request.kind==='ns.actual-physical-center-certified-numerics');
assert.ok(example);assert.equal((await validateDomainRequest(example.request)).ok,true);
assert.equal(await sha256(WORKER_SOURCE),WORKER_SHA256);
assert.equal(await sha256(sourceEvidence),INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256);
const files=['core/registry.mjs','navier/index.mjs','navier/actual-physical-center-certified-numerics.mjs',
  'navier/actual-physical-center-installed-evidence.mjs','navier/actual-physical-center-runtime-numerics.mjs',
  'navier/actual-physical-center-positive-scale-kernel.mjs','navier/actual-physical-center-jet-conditioning.mjs',
  'navier/actual-physical-center-unscaled-numerics.mjs','navier/actual-numerical-exponential-arithmetic.mjs',
  'visualization/actual-physical-center-panels.mjs','visualization/m2-views.mjs','m2.worker.js','workspace.bundle.js',
  'tests/physical-center-runtime-case.mjs'];
const snapshot=async()=>Object.fromEntries(await Promise.all(files.map(async name=>[name,await sha256(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'))])));
const before=await snapshot(),checks=[];
function factory(workerSource){
  const bridge='const {parentPort}=require("node:worker_threads");globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on("message",data=>self.onmessage({data}));\n',
    worker=new Worker(bridge+workerSource,{eval:true,resourceLimits:{maxOldGenerationSizeMb:768}}),
    proxy={postMessage:value=>worker.postMessage(value),terminate:()=>worker.terminate(),onmessage:null,onerror:null};
  worker.on('message',data=>proxy.onmessage?.({data}));worker.on('error',error=>proxy.onerror?.(error));return proxy;
}
const startedAt=new Date().toISOString(),start=performance.now(),engine=createM2Engine(mode==='module'?{local:true}:{workerFactory:factory});
const checked=(id,fn)=>{fn();checks.push({id,pass:true});};
try{
  const job=await engine.wait((await engine.submit(example.request)).id),data=job.result?.results;
  checked('fresh-request-completes-with-installed-external-source-evidence',()=>{
    assert.equal(job.status,'COMPLETED',JSON.stringify(job.result));assert.equal(data.pass,true);
    assert.equal(data.schema,'MathScope.InstalledPhysicalCenterNumericalCertificate/1');
    assert.equal(data.sourceEvidence.authentication,'PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE');
    assert.equal(data.sourceEvidence.sourceProcess.exitCode,0);assert.equal(data.sourceEvidence.sourceProcess.complete,true);
    assert.equal(data.sourceEvidence.installedEvidenceSHA256,INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256);
    assert.equal(data.sourceEvidence.sourceChecks.length,8);assert.ok(data.checks.every(row=>row.pass));
  });
  const originalMap=new Map(source.rows.map(row=>[row.rowKey,row]));
  checked('all270-fresh-rows-match-original-bodies-and-positive-normalizers',()=>{
    assert.equal(data.numerics.rows.length,270);assert.equal(data.rowBindings.length,270);
    for(const [i,row]of data.numerics.rows.entries()){
      const old=originalMap.get(row.rowKey),binding=data.rowBindings[i];assert.ok(old);assert.equal(binding.rowKey,row.rowKey);
      for(const key of ['originalDerivative','positiveExactScale','coefficient'])assert.equal(binding[key],old[key]);
      assert.equal(row.toleranceMet,true);assert.ok(qcompare(readRational(row.positiveErrorRadius),Q(0))>0);
      assert.ok(qcompare(qsub(readRational(row.directedInterval.upper),readRational(row.directedInterval.lower)),readRational(data.request.tolerance))<=0);
      assert.ok(qcompare(readRational(row.directedInterval.lower),readRational(old.directedInterval.upper))<=0);
      assert.ok(qcompare(readRational(old.directedInterval.lower),readRational(row.directedInterval.upper))<=0);
    }
  });
  checked('fresh-values-conditioning-and-positive-scales-are-explicit',()=>{
    assert.equal(data.conditioning.pass,true);assert.ok(data.conditioning.checks.every(row=>row.pass));
    assert.equal(data.numerics.arithmetic.everyNumericalPrerequisiteRecomputed,true);
    assert.equal(data.numerics.precisionAllocation.everyFinalEndpointWidthChecked,true);
    assert.equal(data.positiveScaleNumerics.rows.length,22);assert.ok(data.positiveScaleNumerics.checks.every(row=>row.pass));
    for(const row of data.positiveScaleNumerics.rows){
      assert.ok(numericalEndpointIsClosed(row.interval.lower));assert.ok(numericalEndpointIsClosed(row.interval.upper));
      assert.equal(row.interval.strictlyPositiveLower,true);assert.equal(row.interval.originalValueRelativeErrorGuaranteed,false);
      assert.ok(qcompare(readRational(row.logCoordinateWidth),readRational(data.request.tolerance))<=0);
    }
  });
  checked('original-closed-scales-and-all270-fresh-raw-products-remain-source-bound',()=>{
    const scales=data.positiveSelectorScaleEvidence,raw=data.unscaledDerivatives;
    assert.equal(scales.pass,true);assert.ok(scales.checks.every(row=>row.pass));assert.equal(scales.rowScales.length,270);
    assert.deepEqual(scales,sourceEvidence.positiveSelectorScaleEvidence);
    assert.equal(scales.scope.individualEtaBetaPrecisionMet,false);assert.equal(scales.scope.individualTPrecisionMet,false);
    assert.equal(raw.pass,true);assert.equal(raw.rows.length,270);assert.ok(raw.checks.every(row=>row.pass));
    assert.equal(raw.sourceAuthenticated,false);assert.equal(raw.arithmetic.productsRecomputed,true);
    assert.equal(raw.arithmetic.installedPositiveIntervalsRecomputed,false);
    for(const row of raw.rows){
      const old=originalMap.get(row.rowKey);assert.ok(old);assert.equal(row.positiveExactScale,old.positiveExactScale);
      for(const interval of [row.rawDerivativeInterval,row.positiveScaleInterval]){
        assert.ok(numericalEndpointIsClosed(interval.lower));assert.ok(numericalEndpointIsClosed(interval.upper));
      }
      assert.equal(row.scaledCoefficientToleranceMet,true);assert.equal(row.positiveScaleCoordinate.toleranceMet,true);
      assert.equal(row.rawDerivativeRelativeToleranceGuaranteed,false);assert.equal(row.rawDerivativeAbsoluteWidthRequested,false);
      assert.equal(row.normalizedRadialPower,row.quantity==='physicalCurl'?0:(row.derivative.match(/R/g)??[]).length);
      assert.equal(typeof row.derivativeInterpretation,'string');
    }
  });
  checked('original-source-execution-and-current-arithmetic-scopes-remain-distinct',()=>{
    for(const name of ['runtimeReconstructedFullSourceGraph','privateSourceTokenCreated','rawUnscaledRelativeAccuracyClaimed',
      'allSourceLabelsNumericallyCovered','globalResidualNumericallyEnclosed','wholeGNUMComplete','userRequestedM2Complete','newLeanKernelProof','M3Started'])assert.equal(data.scope[name],false,name);
    assert.equal(data.scope.freshNumericalRecomputation,true);assert.equal(data.scope.originalPositiveHRetained,true);
    assert.equal(data.scope.remainingSelectorAndPaletteScalesNumericallyClosed,true);assert.equal(data.scope.freshUnscaledDerivativeIntervalProducts,true);
    assert.equal(data.numerics.sourceAuthenticated,false);assert.equal(job.result.scope.formalPass,false);
  });
  let checkedSourcePathCells=0,displayLabels=0;
  const panels=listM2Panels(job),panelRows=[];
  checked('ten-tables-retain-every-exact-source-cell-and-angular-row',()=>{
    assert.equal(panels.length,10);
    for(const panel of panels){
      const view=makeM2Visualization(job,{panel:panel.id}),table=view.table;
      assert.equal(view.state,'READY');assert.equal(view.scene.points.length,0);assert.equal(table.truncated,false);
      for(let i=0;i<table.rows.length;i++)for(let j=0;j<table.rows[i].length;j++){
        const sourcePath=table.cellSourcePaths[i][j];
        if(sourcePath){assert.deepEqual(table.rows[i][j],sourcePath.split('.').reduce((value,key)=>value?.[key],job),sourcePath);checkedSourcePathCells++;}
        else{assert.equal(j,0);displayLabels++;}
      }
      panelRows.push({id:panel.id,rows:table.rows,cellSourcePaths:table.cellSourcePaths});
    }
    assert.deepEqual(panelRows.slice(0,5).map(panel=>panel.rows.length),[84,90,54,42,22]);
    assert.equal(panelRows.find(panel=>panel.id==='physical-center-coarse-point-factors').rows.length,2);
    assert.equal(panelRows.find(panel=>panel.id==='physical-center-absolute-values').rows.length,data.positiveSelectorScaleEvidence.absoluteValues.length);
    assert.equal(panelRows.find(panel=>panel.id==='physical-center-unscaled-derivatives').rows.length,270);
    assert.equal(listM2Panels(job,{currentEditorMatches:false}).some(panel=>panel.id.startsWith('physical-center-')),false);
  });
  const precisionRejection=await validateDomainRequest({...example.request,input:{...example.request.input,tolerance:'1/'+String(1n<<121n),precisionBits:512},precision:{mode:'DIRECTED_BIGINT',bits:512}}),
    forgedInput=await validateDomainRequest({...example.request,input:{...example.request.input,sourceCertificate:sourceEvidence}});
  checked('unsupported-width-and-caller-source-record-are-rejected',()=>{assert.equal(precisionRejection.ok,false);assert.equal(precisionRejection.code,'PRECISION_REQUIRED');assert.equal(forgedInput.ok,false);});
  const bundle=await engine.exportBundle(job.id),inspection=await engine.inspectBundle(bundle);
  checked('serialized-results-have-no-inherited-authority',()=>{
    assert.equal(bundle.trust,'UNTRUSTED_WHEN_SERIALIZED');assert.equal(bundle.resumePolicy,'RECOMPUTE_FROM_ORIGINAL_INPUT');
    assert.equal(inspection.summary.importedEvidenceTrusted,false);assert.equal(inspection.summary.evidence,'UNTRUSTED_UNTIL_FRESH_RECOMPUTATION');
  });
  const after=await snapshot();assert.deepEqual(after,before);
  const certificateSHA256=await sha256(data),environment=await engine.environment();
  assert.equal(environment.version,'0.3.12');assert.equal(environment.workerSha256,WORKER_SHA256);
  if(mode==='worker'){
    const reference=JSON.parse(fs.readFileSync(new URL(stem+'-module-runtime.json',directory),'utf8'));
    checked('fresh-module-and-real-worker-results-are-byte-identical',()=>{
      assert.equal(certificateSHA256,reference.certificateSHA256);assert.equal(job.mathematicalHash,reference.mathematicalHash);assert.deepEqual(after,reference.runtimeSHA256);
    });
    const replay=await engine.replay(bundle);
    checked('worker-replay-recomputes-original-input-in-the-same-environment',()=>{
      assert.equal(replay.status,'MATCH');assert.equal(replay.freshHash,job.mathematicalHash);
      assert.equal(replay.sourceVerified,true);assert.equal(replay.importedEvidenceTrusted,false);
    });
  }
  const record={schema:'MathScope.M2.PhysicalCenterRuntimeCase/1',startedAt,finishedAt:new Date().toISOString(),mode,stem,pass:true,
    command:process.argv,elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    request:job.request,checks,mathematicalHash:job.mathematicalHash,certificateSHA256,workerSHA256:WORKER_SHA256,
    originalNumericalCertificateSHA256:sourceEvidence.numericalCertificate.sha256,installedEvidenceSHA256:INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256,
    originalGraphReconstructedInThisRun:false,coefficientNumericalPremisesFreshlyRecomputed:true,
    originalSelectorScaleEndpointsExternallyExecuted:true,all270UnscaledProductsFreshlyRecomputed:true,moduleWorkerParity:mode==='worker',
    originalPhysicalSourceGraphSHA256:data.graph.sha256,panelRows,checkedSourcePathCells,displayLabels,
    scope:job.result.scope,runtimeSHA256:after,filesUnchangedDuringRun:true,environment};
  fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});fs.writeFileSync(replayTarget,JSON.stringify(bundle,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({mode,pass:true,checks:checks.length,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,
    mathematicalHash:job.mathematicalHash,certificateSHA256,checkedSourcePathCells,displayLabels,panels:panelRows.map(row=>({id:row.id,rows:row.rows.length}))}));
}catch(error){
  fs.writeFileSync(target,JSON.stringify({schema:'MathScope.M2.PhysicalCenterRuntimeFailure/1',startedAt,mode,stem,pass:false,checks,
    elapsedMs:performance.now()-start,peakRSSBytes:process.resourceUsage().maxRSS*1024,runtimeSHA256:before,
    error:{name:error.name,code:error.code??null,message:error.message,stack:error.stack}},null,2)+'\n',{flag:'wx'});throw error;
}finally{engine.dispose();}
