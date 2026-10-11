import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualGlobalConservativeMoments,assertActualGlobalConservativeMoments,actualGlobalConservativeMomentsCertificate} from '../actual-global-conservative-moments.mjs';

let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-conservative-constructor-start'});
    return prepared=prepareActualGlobalConservativeMoments({order:2,maxNodes:2000000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('one genuine constructor supplies all global pressure, leading stream and positive moment operands',()=>{
  const p=source();assert.equal(count,1);assert.equal(p.rows.length,2);
  assert.equal(p.sourceBinding.fullGlobalPressureAndOriginalM0PrivateSealsChecked,true);
  assert.equal(p.sourceBinding.newAuditNodeIdsInterchanged,false);
});

test('Ipos original U0 is zero while the accumulated stream is retained',()=>{
  const p=source(),r=p.leadingIpos;assert.equal(r.zero.value,p.G.zero);assert.equal(r.globalSourceCheck.pass,true);
  assert.ok(r.reduced.trace.length>0);assert.equal(r.accumulatedM0Discarded,false);assert.equal(r.v0AssumedZero,false);
});

test('weighted Omega flux binds five original complete literal histories and actual FTC derivatives',()=>{
  const p=source(),r=p.omegaFlux;assert.deepEqual(Object.keys(r.rows),['J0','J0eta','H0','H0eta','K1']);
  for(const row of Object.values(r.rows)){assert.equal(row.densityCheck.pass,true);assert.equal(row.wholeCheck.pass,true);
    assert.equal(row.ftc.derivativeCheck.pass,true);assert.equal(row.ftc.integrandFreeOfExternalX,true);}
  assert.equal(r.factorization.pass,true);assert.equal(r.continuityCheck.pass,true);assert.equal(r.wholeCheck.pass,true);
  assert.equal(r.sourceWhole,p.pressure.primitives.prepared.bootstrap.fluxOmega);
  assert.equal(r.originalFluxOperandChanged,false);assert.equal(r.newPrimitiveDerivedFromOriginalWholeDensities,true);
  assert.equal(r.axis.divisionByZeroEvaluated,false);
});

test('all thirteen actual continuous matrix entries use the full original radial supports and densities',()=>{
  const p=source(),r=p.matrix;assert.equal(r.rows.length,13);assert.ok(r.rows.every(v=>v.check.pass));
  assert.equal(r.powerAdditionChecks.UAngularFlux.pass,true);assert.equal(r.powerAdditionChecks.EAxialFlux.pass,true);
  assert.equal(r.lambdaReplacedByZero,false);assert.equal(r.finiteMomentSamplesUsed,false);
  assert.equal(p.generic.confluent.negativeControls.omittedTwoLambda.pass,false);
});

test('original local moment bodies keep the genuine kappa cutoff and complete lower integrals',()=>{
  const p=source();for(const r of p.rows){assert.equal(r.localRows.length,5);
    assert.ok(r.localRows.every(v=>v.bodyCheck.pass&&v.check.pass));assert.ok(r.incomingChecks.every(v=>v.pass));
    assert.equal(r.fieldChecks.U.pass,true);assert.equal(r.fieldChecks.F.pass,true);}
  assert.equal(p.rows[1].lowerRows.length,3);assert.ok(p.rows[1].lowerRows.every(v=>v.right===p.pressure.primitives.prepared.bootstrap.orderOne.Xplus&&v.check.pass));
});

test('each full global moment includes every ordered pair and its original continuous correction',()=>{
  const p=source();for(const r of p.rows){assert.equal(r.allPairs.length,r.order+1);assert.equal(r.lowerPairs.length,r.order-1);
    assert.equal(r.actualWholeIntegrals.length,5);assert.equal(r.actualFullDensities.length,5);
    assert.ok(r.checks.every(c=>c.pass));assert.ok(r.correctionChecks.every(c=>c.pass));
    assert.equal(r.negativeControls.fifthCorrectionOmitted.pass,false);assert.equal(r.globalDensityIdentification.allOrderedPairsRetained,true);
    assert.equal(r.globalDensityIdentification.actualLeadingHeatOmitted,false);assert.equal(r.globalDensityIdentification.actualLeadingStreamDiscarded,false);}
});

test('actual positive mass primitives supply continuity without dropping accumulated local mass or nu',()=>{
  const p=source();assert.equal(p.continuity.length,2);for(const r of p.continuity){
    assert.equal(r.reconstruction.pass,true);assert.equal(r.coreMassCheck.pass,true);assert.equal(r.middleCheck.pass,true);
    assert.notEqual(r.originalContinuityDefect,p.G.zero);assert.equal(r.accumulatedMassDiscarded,false);assert.equal(r.defectExpressionRetained,true);}
});

test('source proof seals reject fabricated completion and retain frozen original program semantics',async()=>{
  const p=source();assert.throws(()=>assertActualGlobalConservativeMoments({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=p.scope.wholeGN4Complete;p.scope.wholeGN4Complete=true;
  assert.throws(()=>assertActualGlobalConservativeMoments(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.wholeGN4Complete=original;
  const c=await actualGlobalConservativeMomentsCertificate(p);p.G.fresh('after_actual_global_conservative_moment_certificate');
  assert.equal((await actualGlobalConservativeMomentsCertificate(p)).graph.sha256,c.graph.sha256);
  assert.equal(c.scope.actualGlobalFiveMomentDensitiesBound,true);assert.equal(c.scope.actualGlobalTangentialStressCancellation,false);
  assert.equal(c.scope.leadingOrderZeroResidualCancelled,false);assert.equal(c.scope.wholeGN4Complete,false);
  assert.equal(c.scope.newLeanKernelProof,false);assert.equal(c.scope.m3MayStart,false);
  if(process.env.M2_GLOBAL_CONSERVATIVE_EVIDENCE)await writeFile(process.env.M2_GLOBAL_CONSERVATIVE_EVIDENCE,
    JSON.stringify({certificate:c,sourceConstructions:count,actualExecutedPositiveOrders:[1,2],currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
