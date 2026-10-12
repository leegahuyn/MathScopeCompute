import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState} from '../source-global-current.mjs';
import {attachGlobalMomentCurrent,assertGlobalMomentCurrent} from '../source-global-moment.mjs';
import {attachGlobalCurrentPressure,assertGlobalCurrentPressure} from '../source-global-pressure.mjs';
import {attachGlobalMomentPressure,assertGlobalMomentPressure,globalMomentPressureCertificate} from '../source-global-moment-pressure.mjs';

let task,lastResourceCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_MOMENT_PRESSURE '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own full moment-pressure source worker exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-moment-pressure-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context),moment=attachGlobalMomentCurrent(current,context),
    pressure=attachGlobalCurrentPressure(current,context);
  return attachGlobalMomentPressure(pressure,moment,context);
});

test('the literal five-moment full-pressure update uses one authenticated all81 current and all five actual defect rows',async()=>{
  const s=await get(),{G,moment,previousPressure}=s;
  assert.equal(assertGlobalMomentCurrent(moment),true);assert.equal(assertGlobalCurrentPressure(previousPressure),true);
  assert.equal(moment.current,previousPressure.current);assert.equal(G.baseGraph,moment.G);
  assert.equal(previousPressure.cover.rows.length,81);assert.equal(moment.bumps.momentRows.length,5);
  assert.deepEqual(s.source.actualOldDefects,{P:moment.current.mean.P,Jtheta:moment.current.mean.Jtheta,Jz:moment.current.mean.Jz});
  assert.deepEqual(s.source.actualNewDefects,{P:moment.mean.P,Jtheta:moment.mean.Jtheta,Jz:moment.mean.Jz});
  assert.equal(s.source.originalM2Modified,false);assert.equal(s.source.callerReplacementFieldUsed,false);
  assert.ok(s.checks.every(x=>x.pass));assert.ok(moment.bumps.coefficients.checks.every(x=>x.pass));
});

test('new pressure is independently reconstructed by full shifted8.12 with both auxiliary directions and the cutoff defect',async()=>{
  const s=await get(),{G,pressure,previousPressure}=s;
  assert.equal(pressure.fullReconstructionEquation,'p_m,new=T_0(g_r,new-rho*Pnew)');
  assert.notEqual(pressure.value,previousPressure.pressure.value);assert.notEqual(pressure.value,s.moment.mean.pressure.value);
  assert.notEqual(pressure.cutoffRemainder,G.zero);assert.equal(pressure.cutoffRemainderDeclaredZero,false);
  assert.ok(previousPressure.geometry.Y.every(y=>G.freeCoordinates(pressure.value).has(y)));
  assert.ok([pressure.integrals,pressure.radialAuxiliaryIntegrals,pressure.slowZIntegrals].every(x=>x.endpointCheck.pass));
  for(const id of ['complete-old-radial-source-is-the-authenticated-pressure-input','complete-old-angular-source-is-the-authenticated-residual',
    'complete-old-axial-source-retains-authenticated-pressure','complete-new-pressure-radial-FTC','complete-new-radial-residual-retains-P-and-A0'])
    assert.equal(s.checks.find(x=>x.id===id)?.pass,true,id);
  assert.equal(pressure.mechanicalIntegralReduction,false);
});

test('the full old/new equations retain all nonlinear8.26/8.27 terms and exactly conserve the two original weighted integrals',async()=>{
  const s=await get(),{G,nonlinear}=s;
  assert.deepEqual(s.mean.exactConservationIntegrals.map(x=>x.target),[G.zero,G.zero]);
  assert.ok(s.mean.exactConservationIntegrals.every(x=>G.nodes[x.raw].op==='definite_integral'));
  assert.equal(s.moment.potential.divergenceCheck.pass,true);assert.equal(nonlinear.nonlinearRemaindersDeclaredZero,false);
  assert.deepEqual(Object.keys(nonlinear.terms),['time','radial','axial','angular','viscous']);
  assert.ok(Object.values(nonlinear.terms).every(x=>x!==G.zero));
  assert.deepEqual(nonlinear.defects,s.moment.nonlinear.remainderDefects);
  assert.ok(nonlinear.actualSourceIdentityChecks.length>=3&&nonlinear.actualSourceIdentityChecks.every(x=>x.pass));
  assert.equal(s.mean.allNonlinearCurrentTermsRetained,true);assert.equal(nonlinear.oldAndNewCovarianceCancelOnlyInTheirDifference,true);
  assert.deepEqual(s.mean.fullAngularCovariance,s.previousPressure.covariance.fullAngularMean);
});

test('original tiny positive lambda controls the actual ill-conditioned inverse without an unscaled binary64 surrogate',async()=>{
  const s=await get(),{G,conditioning:c,moment}=s;
  assert.equal(c.lambda,G.parameter('lambda'));assert.equal(c.lambda,moment.bumps.lambda);assert.equal(c.d,G.q(1,5));
  assert.equal(c.thetaLower,G.q(1,5));assert.equal(c.thetaUpper,G.q(2,5));
  assert.equal(c.angularInverseUpper,27);assert.equal(c.angularNormalizedConditionUpper,G.q(189));
  assert.equal(c.axialScale[0],moment.bumps.mu[3]);assert.equal(c.axialScale[1],G.mul(moment.bumps.a,moment.bumps.mu[4]));
  assert.equal(c.positiveSourceMomentIntervals.length,5);assert.ok(c.positiveSourceMomentIntervals.every(x=>x[0]>0));
  assert.equal(c.axialNormalizedConditionUpper,G.div(c.axialLambdaScaledConditionUpper,c.lambda));
  assert.equal(c.allOriginalPositiveRowFactorsRetained,true);assert.equal(c.uniformLambdaLimitClaimed,false);
  assert.equal(c.binary64UnscaledConditionNumber,false);assert.equal(c.sourceAuthenticated,true);
  assert.deepEqual(c.originalLambdaExpression,{exp:{product:[{integer:-1000},{ref:'T'}]}});
});

test('all requested source derivatives are expanded and the private result rejects changed operators or premature j0 claims',async()=>{
  const s=await get(),c=s.closure;
  assert.equal(c.allRequestedSharedBodiesMaterialized,true);assert.equal(c.allDeclaredCoverRowsRetained,true);
  assert.equal(c.baseClosure.allRequestedSharedBodiesMaterialized,true);assert.ok(c.baseClosure.pulseBlocks.length>0);
  assert.equal(assertGlobalMomentPressure(s),true);assert.throws(()=>assertGlobalMomentPressure({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.pressure,'value',s.G.zero],[s.conditioning,'lambda',s.G.zero],
    [s.scope,'initializedJ0',true],[s.scope,'completeN6',true]]){
    const saved=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalMomentPressure(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalMomentPressure(s),true);assert.equal(s.scope.individualN606OperatorCriteriaSatisfied,true);
  for(const name of ['temporalMeanUpdateApplied','initializedJ0','allOrderTargetClassBoundsCertified','completeN6','numericalWholeFieldEnclosure','newLeanKernelProof'])
    assert.equal(s.scope[name],false,name);
});

test('the observed full moment-pressure certificate pins its complete source chain with literal row and package scopes distinct',async()=>{
  const s=await get(),c=await globalMomentPressureCertificate(s);
  assert.match(c.graph.sha256,/^[a-f0-9]{64}$/);assert.ok(c.graph.deltaNodeCount>0);
  assert.equal(c.individualOperatorAcceptanceDoesNotCompletePackage,true);assert.equal(c.numericalValuesOrEnclosures,false);
  assert.equal(c.scope.individualN606OperatorCriteriaSatisfied,true);assert.equal(c.scope.initializedJ0,false);
  assert.equal(c.sourceMoment.sourceCurrent.sourceBand.upstreamSource.graph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.equal(c.sourcePressure.cover.rows.length,81);assert.ok(c.sourcePressure.checks.every(x=>x.pass));
  observe({stage:'global-source-moment-pressure-certificate-ready',nodeCount:s.G.nodes.length,deltaNodes:c.graph.deltaNodeCount});
  if(process.env.M3_N6_GLOBAL_MOMENT_PRESSURE_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_MOMENT_PRESSURE_EVIDENCE,JSON.stringify(c,null,2)+'\n');
});
