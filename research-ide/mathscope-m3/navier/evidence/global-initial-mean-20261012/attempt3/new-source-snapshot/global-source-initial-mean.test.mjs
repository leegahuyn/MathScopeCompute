import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalMomentCurrent,assertGlobalMomentCurrent} from '../source-global-moment.mjs';
import {attachGlobalCurrentPressure} from '../source-global-pressure.mjs';
import {attachGlobalTemporalInverse,assertGlobalTemporalInverse} from '../source-global-temporal.mjs';
import {attachGlobalInitializedMean,assertGlobalInitializedMean,globalInitializedMeanCertificate} from '../source-global-initial-mean.mjs';
import {auditGlobalInitializedMeanDerivatives} from '../source-global-initial-mean-audit.mjs';
import {exportGlobalOriginalBaseResidual} from '../source-global-base-residual.mjs';

let task,auditTask,baseSummary,lastResourceCheck=0;
function observe(extra={}){
  if(extra.stage==='global-initial-mean-disposable-cache-release'&&typeof globalThis.gc==='function')globalThis.gc();
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_INITIAL_MEAN '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own actual initialized-mean worker exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-initial-mean-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(async()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context);
  {
    const base=await exportGlobalOriginalBaseResidual(current,context);
    if(process.env.M3_N6_GLOBAL_BASE_RESIDUAL_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_BASE_RESIDUAL_EVIDENCE,JSON.stringify(base,null,2)+'\n');
    baseSummary={graph:base.graph,source:base.source,checks:base.checks,scope:base.scope,
      exportedNodes:base.program.nodes.length,allSourceBodies:base.sourceProgramContainsAllNodeBodies,
      allDerivativeBodies:base.closure.allRequestedSharedBodiesMaterialized,roots:base.roots};
  }
  const template=attachGlobalMomentCurrent(current,context),
    pressure=attachGlobalCurrentPressure(current,context),temporal=attachGlobalTemporalInverse(pressure,context),
    s=attachGlobalInitializedMean(temporal,template,context);
  if(process.env.M3_N6_GLOBAL_INITIAL_MEAN_PARTIAL)await writeFile(process.env.M3_N6_GLOBAL_INITIAL_MEAN_PARTIAL,JSON.stringify(await globalInitializedMeanCertificate(s),null,2)+'\n');
  return s;
});
const audit=()=>auditTask??=get().then(s=>auditGlobalInitializedMeanDerivatives(s,context));

test('the actual mean state executes temporal update, new pressure, five new defects and pressure in the original order',async()=>{
  const s=await get();assert.equal(assertGlobalTemporalInverse(s.temporal),true);assert.equal(assertGlobalMomentCurrent(s.template),true);
  assert.equal(s.template.current,s.temporal.pressure.current);assert.equal(s.G,s.temporal.G);
  assert.deepEqual(s.source.exactSequence,['primary-current-pressure','temporal-8.20','post-temporal-8.12','five-moments-8.25-on-new-P-J','post-moment-8.12']);
  assert.equal(s.source.callerReplacementTargetsAccepted,false);assert.equal(s.source.originalM2Modified,false);
  assert.equal(s.scope.actualTemporalBeforeMomentSequenceConstructed,true);assert.ok(s.checks.every(x=>x.pass));
});

test('the same current exports the complete original base residual scalar DAG without sibling node IDs or zero residuals',async()=>{
  await get();assert.ok(baseSummary.checks.every(x=>x.pass));assert.equal(baseSummary.allSourceBodies,true);
  assert.equal(baseSummary.allDerivativeBodies,true);assert.ok(baseSummary.exportedNodes>600000);
  assert.equal(baseSummary.source.noSiblingGraphIDsTransplanted,true);assert.equal(baseSummary.source.originalM2Modified,false);
  assert.equal(baseSummary.scope.residualDefinedAsZero,false);assert.equal(baseSummary.scope.numericalResidualEnclosureComputed,false);
  assert.equal(baseSummary.scope.selectedRaySourceAtlasMembershipProved,false);assert.equal(baseSummary.roots.physicalBaseResidual.length,3);
  assert.match(baseSummary.graph.sha256,/^[a-f0-9]{64}$/);
});

test('the original five-row solve uses the new actual P/J and the unchanged positive lambda/profile matrix',async()=>{
  const s=await get(),b=s.bumps;
  for(const n of ['P','Jtheta','Jz']){
    assert.equal(b.actualInputDefects[n],s.stages.temporal.mean[n]);assert.notEqual(b.actualInputDefects[n],s.template.mean[n]);
    assert.notEqual(b.actualInputDefects[n],s.temporal.pressure.current.mean[n]);
  }
  assert.equal(b.originalLambda,s.template.bumps.lambda);assert.equal(b.originalPositiveA,s.template.bumps.a);
  assert.deepEqual(b.originalFiveMu,s.template.bumps.mu);assert.deepEqual(b.coefficients.angularMatrix,s.template.bumps.coefficients.angularMatrix);
  assert.deepEqual(b.coefficients.axialMatrix,s.template.bumps.coefficients.axialMatrix);assert.equal(b.exactRows.length,5);
  assert.ok(b.coefficients.checks.every(x=>x.pass));assert.equal(b.originalSourceRestriction.originalPositiveLambdaRetained,true);
});

test('both new full pressures retain every angular covariance, stress, cutoff and moving-envelope endpoint term',async()=>{
  const s=await get(),G=s.G,p=s.temporal.pressure;
  for(const stage of Object.values(s.stages)){
    assert.equal(stage.mean.fullAngularCovariance,p.covariance.fullAngularMean);assert.equal(stage.mean.fullOriginalStress,p.residual.fullOriginalStress);
    assert.ok(stage.checks.every(x=>x.pass));assert.equal(stage.pressure.allAuxiliaryModesRetained,true);
    assert.equal(stage.pressure.cutoffRemainderDeclaredZero,false);assert.equal(stage.pressure.endpointTerms.endpointTermsDeclaredZero,false);
    assert.notEqual(stage.pressure.value,p.pressure.value);assert.notEqual(stage.pressure.cutoffRemainder,G.zero);
  }
  assert.notEqual(s.stages.temporal.pressure.value,s.stages.moments.pressure.value);
});

test('full post-temporal nonlinear radial and two flux differences agree before integration, retaining every remainder',async()=>{
  const s=await get();assert.equal(s.nonlinear.expansionChecks.length,3);assert.ok(s.nonlinear.expansionChecks.every(x=>x.pass));
  for(const n of ['P','Jtheta','Jz'])assert.equal(s.nonlinear.actualNewDefects[n],s.stages.moments.mean[n]);
  assert.equal(s.nonlinear.remaindersDeclaredZero,false);assert.equal(s.nonlinear.mechanicalRawIntegralReduction,false);
  assert.ok(Object.values(s.nonlinear.remainderDefects).every(x=>Number.isSafeInteger(x)&&s.G.nodes[x]));
});

test('the original five-bump potential keeps divergence and both exact conservation rows without a fabricated zero integral',async()=>{
  const s=await get(),G=s.G;assert.ok(s.potential.checks.every(x=>x.pass));assert.notEqual(s.potential.whole,G.zero);
  assert.equal(s.potential.analyticIntegralReductionUsed,true);assert.equal(s.conservation.angular,G.zero);assert.equal(s.conservation.axial,G.zero);
  assert.equal(s.conservation.exactTemporalZeroMeanSource.theta,G.zero);assert.equal(s.conservation.exactTemporalZeroMeanSource.z,G.zero);
  assert.equal(s.scope.exactConservation9_10,true);assert.equal(s.conservation.actualFiveRows.length,2);
});

test('the new private state rejects forged coefficients/scope and keeps Prop9.5 class and full angular dependencies open',async()=>{
  const s=await get();assert.equal(assertGlobalInitializedMean(s),true);
  assert.throws(()=>assertGlobalInitializedMean({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.bumps.actualInputDefects,'P',s.G.zero],[s.stages.moments.pressure,'value',s.G.zero],[s.scope,'initializedJ0',true]]){
    const saved=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalInitializedMean(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalInitializedMean(s),true);
  for(const n of ['fullNonzeroAngularResidualAttached','originalProp9_5ClassBoundsEstablished','initializedJ0','completeN6','numericalWholeFieldEnclosure'])assert.equal(s.scope[n],false,n);
});

test('every requested new mean/pressure derivative has its own actual source and executed omitted-mode tail',async()=>{
  const a=await audit();assert.ok(a.checks.every(x=>x.pass));assert.equal(a.everyNewInverseDerivativeTailMaterialized,true);
  assert.equal(a.closure.allRequestedSharedBodiesMaterialized,true);assert.equal(a.closure.baseClosure.allRequestedSharedBodiesMaterialized,true);
  assert.equal(a.closure.allDeclaredCoverRowsRetained,true);
  assert.equal(a.materializationBudget.maximumTotalNodes,6500000);
  assert.equal(a.materializationBudget.mathematicalSourceChanged,false);
  assert.equal(a.closure.exactLeibnizProgram.allIntegerCoefficientsRetained,true);
  assert.equal(a.closure.exactLeibnizProgram.inheritedCompletedClosures,1);
  assert.equal(a.closure.exactLeibnizProgram.expandedRowStorageRetained,false);
  assert.equal(a.closure.exactLeibnizProgram.exactOriginalRowReferencesRetained,true);
  assert.ok(a.closure.exactLeibnizProgram.cacheReleases.length>0);
  for(const p of a.closure.exactInversePartials)assert.ok(a.derivativeQueries.some(q=>q.system===p.system&&
    q.slowOrders.every((n,j)=>n===p.orders[j])&&q.maximumTorusOrder>=p.orders[3]+p.orders[4]));
  assert.ok(a.derivativeQueries.some(q=>!q.reusedIdenticalEarlierSourceBound));
});

test('the observed mean sequence certificate binds the new source derivatives and explicitly separates class completion',async()=>{
  const a=await audit();assert.match(a.graph.sha256,/^[a-f0-9]{64}$/);assert.ok(a.graph.deltaNodeCount>0);
  assert.equal(a.source.scope.actualNewDefectsUsedForFiveMoments,true);assert.equal(a.source.Prop9_5ClassAcceptanceStillRequired,true);
  assert.equal(a.initializedJ0,false);assert.equal(a.completeN6,false);assert.equal(a.numericalWholeFieldEnclosure,false);
  observe({stage:'global-initial-mean-certificate-ready',nodeCount:a.graph.nodeCount});
  if(process.env.M3_N6_GLOBAL_INITIAL_MEAN_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_INITIAL_MEAN_EVIDENCE,JSON.stringify(a,null,2)+'\n');
});
