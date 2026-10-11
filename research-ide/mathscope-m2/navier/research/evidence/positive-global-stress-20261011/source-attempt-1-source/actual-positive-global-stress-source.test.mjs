import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualPositiveGlobalStress,assertActualPositiveGlobalStress,actualPositiveGlobalStressCertificate} from '../actual-positive-global-stress.mjs';

let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-positive-global-stress-constructor-start'});
    return prepared=prepareActualPositiveGlobalStress({order:2,maxNodes:2200000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('one actual source prefix supplies every raw positive momentum and radial density',()=>{
  const p=source();assert.equal(count,1);assert.equal(p.rawRows.length,2);assert.equal(p.radialRows.length,2);
  for(const r of p.rawRows){assert.equal(r.thetaCheck.pass,true);assert.equal(r.axialCheck.pass,true);
    assert.equal(r.pressureCheck.pass,true);assert.ok(r.fieldChecks.every(c=>c.check.pass));
    assert.equal(r.pairs.length,r.order+1);assert.equal(r.allOriginalConvolutionTermsRetained,true);
    assert.equal(r.lowerForcingDropped,false);assert.equal(r.sourceInner.pass,true);
    assert.equal(r.innerRestriction.sourceCoreChecks,true);}
  assert.equal(p.inner.parametric.pass,true);
});

test('the leading mass and angular viscosity use full original moment identities',()=>{
  const p=source(),r=p.leading;
  assert.equal(r.mass.massExterior.pass,true);assert.equal(r.mass.pass,true);
  assert.equal(r.angular.normalizationCheck.pass,true);assert.equal(r.angular.originalAuditProof.pass,true);
  assert.equal(r.angular.originalAuditProof.constantOfIntegrationIncluded,true);
  assert.equal(r.angular.originalAuditProof.heatChangeAloneUsedAsWholeMoment,false);
  assert.equal(r.angular.copy.newAuditNodeIdsInterchanged,false);
  assert.equal(r.angular.copy.sourceOpaqueFunctionsReconstructed,false);
  assert.equal(r.angular.sourceHeatExterior.pass,true);
  assert.equal(r.angular.heatOnlyMomentUsed,false);
  assert.equal(r.angular.improperIntegralDeclaredAbsolutelyConvergentWithoutSubtraction,false);
});

test('the total reduction binds all five actual whole moments and retains indeterminate exponent and boundary checks',()=>{
  const p=source();assert.equal(p.momentFamilies.length,12);assert.ok(p.totals.zeroRewriteTrace.length>0);
  assert.equal(p.generic.totals.radialBoundariesKeptInExecutedIdentity,true);
  assert.equal(p.generic.totals.originalContinuityDefectsRetainedByPairKernel,true);
  for(const r of p.totals.rows){assert.equal(r.actualMomentFamilies.length,5);assert.equal(r.lowerMomentFamilies.length,2);
    assert.equal(r.thetaReduced,p.G.zero);assert.equal(r.axialReduced,p.G.zero);
    assert.ok(Object.values(r.fullExponentAndBoundaryChecks).every(c=>c.pass));
    assert.equal(r.callerMomentValuesAccepted,false);assert.equal(r.allFixedEtaDerivatives,true);}
});

test('original forward and backward stress integrals have the same complete density, endpoints, and required sign',()=>{
  const p=source();assert.equal(p.stressRows.length,4);
  for(const r of p.stressRows){assert.equal(r.rawDensityCheck.pass,true);assert.equal(r.wholeDensityCheck.pass,true);
    assert.equal(r.backwardSign.pass,true);assert.equal(r.originalSignedFTC.pass,true);
    assert.equal(r.interiorCoefficientCheck.pass,true);assert.equal(r.actualConservativeTotalReduced,p.G.zero);
    assert.notEqual(r.retainedDefect,p.G.zero);assert.equal(r.finiteLowDefectDiscarded,false);
    assert.equal(r.defectDefinedAsZero,false);assert.equal(r.allFixedDerivativeJetsMatch,true);
    if(r.order===1)assert.equal(r.originalTotalCheck.pass,true);}
  assert.equal(p.generic.signedSplit.negativeControls.unprovedWholeTheta.pass,false);
  assert.equal(p.generic.signedSplit.negativeControls.unprovedWholeZ.pass,false);
});

test('order one keeps the terminal angular heat collar and every previous-order viscosity',()=>{
  const p=source(),b=p.moments.pressure.primitives.prepared.bootstrap;
  const ftc=(n,c)=>p.sourceFTC.rows.find(r=>r.order===n&&r.component===c);
  assert.equal(ftc(1,'theta').openDomain[1],b.orderOne.Xb);
  assert.equal(ftc(1,'z').openDomain[1],b.orderOne.Xplus);
  assert.equal(ftc(2,'theta').openDomain[1],b.orderOne.Xplus);
  for(const r of p.rawRows){assert.notEqual(r.lowerAngular,p.G.zero);assert.notEqual(r.lowerAxial,p.G.zero);
    assert.ok(Object.values(r.exterior).every(c=>c.pass));}
  assert.equal(p.generic.totals.negativeControls.omittedPreviousViscosity.pass,false);
});

test('the retained radial defects use the original complete pressure convolution primitive',()=>{
  const p=source();for(const r of p.radialRows){assert.notEqual(r.retainedDefect,p.G.zero);
    assert.equal(r.actualOriginalPressureConvolutionProof.pass,true);assert.equal(r.finiteLowDefectDiscarded,false);
    assert.equal(r.defectDefinedAsZero,false);assert.equal(r.pass,true);}
});

test('private source seals reject a fabricated result or a changed original coefficient',()=>{
  const p=source();assert.throws(()=>assertActualPositiveGlobalStress({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.stressRows[0].actualStress;p.stressRows[0].actualStress=p.G.zero;
  assert.throws(()=>assertActualPositiveGlobalStress(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.stressRows[0].actualStress=old;
  assert.equal(assertActualPositiveGlobalStress(p),true);
});

test('the stable certificate records positive cancellation while leaving the global residual and M3 gates closed',async()=>{
  const p=source(),c=await actualPositiveGlobalStressCertificate(p);
  p.G.fresh('after_actual_positive_global_stress_certificate');
  assert.equal((await actualPositiveGlobalStressCertificate(p)).graph.sha256,c.graph.sha256);
  assert.equal(c.scope.actualPositiveGlobalMomentumCoefficientCancellation,true);
  assert.equal(c.scope.actualPositiveStressWholeResidualIntegralsZero,true);
  assert.equal(c.scope.actualOriginalForwardBackwardStressEquality,true);
  assert.equal(c.scope.actualStressBothEndpointJoins,true);
  assert.equal(c.scope.originalFiniteLowDefectExpressionsRetained,true);
  assert.equal(c.scope.actualLeadingOrderZeroResidualCancelled,false);
  assert.equal(c.scope.commonInfiniteCutoffBackgroundAssembled,false);
  assert.equal(c.scope.allOrderPhysicalResidualFlatness,false);
  assert.equal(c.scope.wholeGN4Complete,false);assert.equal(c.scope.newLeanKernelProof,false);
  assert.equal(c.scope.m3MayStart,false);
  if(process.env.M2_POSITIVE_GLOBAL_STRESS_EVIDENCE)await writeFile(process.env.M2_POSITIVE_GLOBAL_STRESS_EVIDENCE,
    JSON.stringify({certificate:c,sourceConstructions:count,actualExecutedPositiveOrders:[1,2],currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
