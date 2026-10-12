import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareGlobalSourceBand} from '../source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../source-global-representative.mjs';
import {attachGlobalCurrentState,globalGraphEqual} from '../source-global-current.mjs';
import {attachGlobalCurrentPressure,assertGlobalCurrentPressure} from '../source-global-pressure.mjs';
import {attachGlobalTemporalInverse,assertGlobalTemporalInverse,globalTemporalInverseCertificate} from '../source-global-temporal.mjs';

let task,lastResourceCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# GLOBAL_TEMPORAL '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes}));
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('Own actual temporal source worker exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastResourceCheck>1000){lastResourceCheck=Date.now();observe({stage:'bounded-global-temporal-memory-checkpoint'});}}};
const get=()=>task??=Promise.resolve().then(()=>{
  const band=prepareGlobalSourceBand({coefficientOrder:1,maxNodes:3500000},context),representative=attachGlobalFixedRepresentative(band,context),
    current=attachGlobalCurrentState(representative,context),pressure=attachGlobalCurrentPressure(current,context);
  return attachGlobalTemporalInverse(pressure,context);
});

test('the actual temporal source comes from the complete authenticated pressure and both original current residuals',async()=>{
  const s=await get();assert.equal(assertGlobalCurrentPressure(s.pressure),true);
  assert.equal(s.G,s.pressure.G);assert.equal(s.pressure.cover.rows.length,81);
  assert.equal(s.inverses.theta.body,s.pressure.residual.Etheta);assert.equal(s.inverses.z.body,s.pressure.residual.Ez);
  assert.equal(s.source.callerBodyOrBoundsAccepted,false);assert.equal(s.source.originalM2Modified,false);
  assert.equal(s.periodicity.sourceAuthenticated,true);assert.ok(s.periodicity.checks.every(x=>x.pass));
  assert.ok(s.checks.every(x=>x.pass));
});

test('actual Fourier coefficients, exact divisors, the projected zero mode and complete C0/C1 tails are all retained',async()=>{
  const s=await get(),G=s.G,Y=s.pressure.geometry.Y;
  for(const inverse of Object.values(s.inverses)){
    const f=inverse.finite;assert.equal(f.fullLatticeModeCount,8);assert.equal(f.pairCount,4);
    assert.equal(inverse.identity.pass,true);assert.ok(inverse.identity.rows.every(x=>x.pass));
    assert.equal(inverse.exactZeroMode,G.zero);assert.equal(f.zeroMode.inverted,false);assert.equal(f.zeroMode.retainedSeparately,true);
    assert.notEqual(inverse.exact,f.value);assert.equal(inverse.finiteSumReplacesExactLimit,false);
    assert.equal(G.nodes[inverse.exact].op,'m3_aux_inverse_partial');
    assert.deepEqual(f.tails.map(t=>t.sourceDerivativeOrder),[4,5]);
    assert.deepEqual(f.tails.map(t=>t.sourceBound.highestGeneratedTorusDerivativeTotalOrder),[6,7]);
    assert.ok(f.tails.every(t=>t.tailTendsToZero&&!t.omittedModesSetToZero&&Y.every(y=>!G.freeCoordinates(t.upper).has(y))));
    assert.notEqual(inverse.sourceProjectionErrorUpper,G.zero);assert.notEqual(inverse.NDerivativeLimitErrorUpper,G.zero);
    assert.ok(f.rows.every(row=>row.coefficient.coefficientIsExactIntegral&&!row.coefficient.numericalQuadratureValueSupplied));
  }
});

test('every requested inverse derivative has the actual differentiated source and a matching executed source tail',async()=>{
  const s=await get(),c=s.closure;
  assert.equal(c.allRequestedSharedBodiesMaterialized,true);assert.equal(c.allDeclaredCoverRowsRetained,true);
  assert.equal(c.baseClosure.allRequestedSharedBodiesMaterialized,true);assert.ok(c.baseClosure.pulseBlocks.length>0);
  assert.ok(c.indexedPartials.some(x=>x.orders[3]+x.orders[4]>=7));
  assert.ok(s.derivativeQueries.some(x=>x.slowOrders[1]>0),'the axial-potential Z derivative has its own source');
  assert.ok(s.derivativeQueries.some(x=>x.slowOrders[2]>0),'the retained slow time derivative has its own source');
  for(const p of c.exactInversePartials)assert.ok(s.derivativeQueries.some(q=>q.system===p.system&&
    q.slowOrders.every((x,j)=>x===p.orders[j])&&q.maximumTorusOrder>=p.orders[3]+p.orders[4]));
  assert.ok(s.derivativeQueries.every(q=>q.actualTailAssignedToEveryRequestedPartial&&q.sourceDerivativesGeneratedBeforeSubstitution&&
    q.tail.sourceDerivativeOrder===q.maximumTorusOrder+4));
});

test('the actual axial T1 potential keeps both physical scaling and the full A1 and slow-time remainder',async()=>{
  const s=await get(),{G,potential:p}=s;
  assert.ok(p.checks.every(x=>x.pass));assert.equal(p.integrals.endpointCheck.pass,true);assert.equal(p.angularIntegrals.endpointCheck.pass,true);
  assert.notEqual(p.cutoffRemainder,G.zero);assert.equal(p.cutoffRemainderDeclaredZero,false);
  assert.equal(globalGraphEqual(G,G.mul(s.pressure.geometry.ci,p.velocity.v),G.neg(s.inverses.theta.exact),
    [s.pressure.geometry.ci,s.inverses.theta.exact]).pass,true);
  assert.notEqual(p.slowTime.angular,G.zero);assert.notEqual(p.slowTime.axial,G.zero);assert.equal(p.slowTimeTermsRetained,true);
  assert.equal(s.scope.actualOriginalAxialPotentialRealized,true);assert.equal(s.scope.actualSourceAuxiliaryTemporalInverseConstructed,true);
});

test('the private actual temporal inverse rejects changed source/tail records and keeps later initialization work explicit',async()=>{
  const s=await get();assert.equal(assertGlobalTemporalInverse(s),true);
  assert.throws(()=>assertGlobalTemporalInverse({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,name,bad]of [[s.inverses.theta,'body',s.G.zero],[s.inverses.z.finite.tails[0],'upper',s.G.zero],
    [s.scope,'initializedJ0',true],[s.convergence,'fourExtraDerivativesRetained',false]]){
    const saved=object[name];object[name]=bad;try{assert.throws(()=>assertGlobalTemporalInverse(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[name]=saved;}
  }
  assert.equal(assertGlobalTemporalInverse(s),true);assert.equal(s.scope.originalN605OperatorCriteriaSatisfied,true);
  for(const name of ['actualPostTemporalNonlinearPressureReconstructed','actualFiveMomentsAfterTemporalApplied','initializedJ0',
    'allOrderTargetClassBoundsCertified','completeN6','numericalWholeFieldEnclosure','newLeanKernelProof'])assert.equal(s.scope[name],false,name);
});

test('the observed temporal certificate binds exact source coefficients, all requested derivative tails and its original pressure input',async()=>{
  const s=await get(),c=await globalTemporalInverseCertificate(s);assert.match(c.graph.sha256,/^[a-f0-9]{64}$/);
  assert.ok(c.graph.deltaNodeCount>0);assert.equal(c.sourcePressure.cover.rows.length,81);
  assert.equal(c.convergence.completeOmittedSquareLatticeRetained,true);assert.equal(c.convergence.numericalFourierCoefficientsEvaluated,false);
  assert.equal(c.numericalValuesOrEnclosures,false);assert.equal(c.individualOperatorAcceptanceDoesNotCompletePackage,true);
  observe({stage:'global-source-temporal-certificate-ready',nodeCount:s.G.nodes.length,deltaNodes:c.graph.deltaNodeCount});
  if(process.env.M3_N6_GLOBAL_TEMPORAL_EVIDENCE)await writeFile(process.env.M3_N6_GLOBAL_TEMPORAL_EVIDENCE,JSON.stringify(c,null,2)+'\n');
});
