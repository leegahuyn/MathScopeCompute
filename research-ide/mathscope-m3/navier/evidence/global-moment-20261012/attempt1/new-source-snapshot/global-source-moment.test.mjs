import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalMomentCurrent,assertGlobalMomentCurrent,globalMomentCurrentCertificate} from '../source-global-moment.mjs';

let task,lastResourceCheck=0,certificate;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_MOMENT '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own global moment source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-moment-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context);
  return attachGlobalMomentCurrent(current,context);
});

test('the actual original all-label P/J feed all five source bumps with the original positive lambda',async()=>{
  const s=await get(),G=s.G,old=s.current;
  assert.equal(assertGlobalCurrentState(old),true);assert.ok(s.checks.every(x=>x.pass));
  assert.deepEqual(s.source.actualGlobalDefectRoots,{P:old.mean.P,Jtheta:old.mean.Jtheta,Jz:old.mean.Jz});
  assert.equal(s.source.callerSuppliedTargets,false);assert.equal(s.source.originalLambda,G.parameter('lambda'));
  assert.equal(s.bumps.lambda,G.parameter('lambda'));assert.equal(s.bumps.d,G.q(1,5));
  assert.equal(s.bumps.sourceRestriction.restriction.pass,true);assert.equal(s.bumps.sourceRestriction.originalPositiveLambdaRetained,true);
  assert.equal(s.bumps.coefficients.checks.length,5);assert.ok(s.bumps.coefficients.checks.every(x=>x.pass));
  assert.ok(s.bumps.coefficients.angular.some(x=>x!==G.zero));assert.ok(s.bumps.coefficients.axial.every(x=>x!==G.zero));
  assert.equal(s.bumps.momentRows.length,5);assert.equal(s.bumps.mu.length,5);
  for(const integral of s.bumps.mu)assert.equal(G.nodes[integral].op,'definite_integral');
  assert.equal(s.bumps.sourceRestriction.restriction.profiles.potentialHullIncluded,true);
  assert.equal(s.scope.actualAllLabelTargetsUsed,true);assert.equal(s.scope.arbitraryGenericArraysUsedAsSource,false);
});

test('the actual axial bump potential retains its raw whole integral and proves incompressibility by FTC',async()=>{
  const s=await get(),G=s.G,p=s.potential;
  assert.equal(p.gammaCheck.pass,true);assert.equal(p.divergenceCheck.pass,true);
  assert.equal(G.nodes[p.primitive].op,'definite_integral');assert.equal(G.nodes[p.whole].op,'definite_integral');
  assert.notEqual(p.whole,G.zero);assert.notEqual(p.deltaBeta,G.zero);
  assert.equal(p.weightedWholeNormalization.id,'axial-velocity-moment');assert.equal(p.wholeRawIntegralDiscarded,false);
  assert.equal(p.analyticalIntegralReductionUsed,true);
  for(const root of Object.values(s.velocity.increment))assert.notEqual(root,G.zero);
  for(const name of ['v','gamma']){
    const n=G.nodes[s.velocity.increment[name]],body=G.materializeExpressionFunction(...n.args);
    assert.equal(body,name==='v'?s.bumps.deltaV:s.bumps.gammaDesired);
  }
});

test('all six original full-curl means and the complete background remain in the new nonlinear residual and pressure',async()=>{
  const s=await get(),G=s.G;
  assert.equal(s.mean.covariance,s.current.covariance.fullAuxiliaryMean);
  assert.equal(s.mean.fullOriginalStress,s.current.mean.residual.fullOriginalStress);
  assert.equal(s.mean.background.b,s.current.band.fields.b);assert.equal(s.mean.background.G,s.current.band.fields.G);
  assert.equal(s.mean.pressure.check.pass,true);assert.notEqual(s.mean.pressure.value,s.current.mean.pressure.value);
  for(const name of ['gr','P','Jtheta','Jz'])assert.notEqual(s.mean[name],s.current.mean[name]);
  assert.equal(s.mean.residual.allBackgroundAndSixCovarianceTermsRetained,true);
  assert.equal(s.mean.residual.auxiliaryMode,'COMPLETE_HAAR_ZERO_MODE');
  assert.equal(s.nonlinear.allNonlinearTermsRecomputed,true);assert.equal(s.nonlinear.nonlinearRemaindersDeclaredZero,false);
  assert.ok(s.nonlinear.expansionChecks.every(x=>x.pass));
  for(const name of ['angular','radial','axial','time','viscous'])assert.notEqual(s.nonlinear.terms[name],G.zero);
  for(const root of Object.values(s.nonlinear.remainderDefects))assert.notEqual(root,G.zero);
});

test('this actual pre-temporal update is not promoted into the paper initialized j0 or a complete full-mode PDE',async()=>{
  const s=await get();
  assert.equal(s.scope.actualOriginalGlobalFiveMomentUpdateConstructed,true);
  assert.equal(s.scope.actualCompleteMeanResidualAndPressureRecomputed,true);
  for(const name of ['temporalMeanInverseApplied','initializedJ0','fullNonzeroAuxiliaryPressureConstructed','allOrderTargetClassBoundsCertified','completeN6','newLeanKernelProof'])
    assert.equal(s.scope[name],false);
  assert.equal(s.bumps.sourceRestriction.mechanicalRawIntegralReduction,false);
  assert.equal(s.mean.pressure.fullNonzeroAuxiliaryPressureConstructed,false);
});

test('changed coefficients, pressure or claimed source phase invalidate the private moment state',async()=>{
  const s=await get();assert.throws(()=>assertGlobalMomentCurrent({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.source,'actualGlobalDefectRoots',{P:0,Jtheta:0,Jz:0}],
    [s.bumps.coefficients,'angular',[s.G.zero,s.G.zero,s.G.zero]],[s.mean.pressure,'value',s.G.zero],[s.scope,'initializedJ0',true]]){
    const saved=object[name];object[name]=bad;
    try{assert.throws(()=>assertGlobalMomentCurrent(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalMomentCurrent(s),true);
});

test('the execution certificate binds the original source and newly constructed actual nonlinear graph',async()=>{
  const s=await get();certificate=await globalMomentCurrentCertificate(s);
  assert.match(certificate.graph.sha256,/^[a-f0-9]{64}$/);assert.ok(certificate.graph.deltaNodeCount>0);
  assert.equal(certificate.numericalValuesOrEnclosures,false);assert.equal(certificate.sourceCurrent.scope.all81PointCandidatesRetained,true);
  assert.equal(certificate.sourceCurrent.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  observe({stage:'global-source-moment-certificate-ready',nodeCount:s.G.nodes.length,deltaNodes:certificate.graph.deltaNodeCount});
  if(process.env.M3_N6_GLOBAL_MOMENT_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_MOMENT_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
});
