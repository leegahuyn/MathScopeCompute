import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualGlobalPressureConvolution,assertActualGlobalPressureConvolution,actualGlobalPressureConvolutionCertificate} from '../actual-global-pressure-convolution.mjs';
let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-pressure-constructor-start'});return prepared=prepareActualGlobalPressureConvolution({order:2,maxNodes:2000000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('the actual original leading-stream proof and positive induction share the unchanged original prefix',()=>{
  const p=source();assert.equal(count,1);assert.equal(p.sourceBinding.sourceMassAndContinuityAuthenticated,true);
  assert.ok(p.sourceBinding.commonOriginalNodeCount>10000);assert.equal(p.sourceBinding.newAuditNodeIdsInterchanged,false);
  assert.equal(p.stream.scope.actualGlobalLeadingMassPrimitiveIdentity,true);
});

test('both actual common-core branches identify every leading F/U/v source representative',()=>{
  const p=source(),r=p.leadingRestrictions;assert.equal(r.cases.length,2);
  for(const c of r.cases){assert.equal(c.rows.length,3);for(const x of c.rows){assert.equal(x.check.pass,true);assert.ok(x.reduced.trace.length>0);}}
  assert.equal(r.commonCore.pass,true);assert.equal(r.commonCore.domain[1],p.primitives.prepared.bootstrap.inner.aSquared);
});

test('the actual full Ipos leading F equals the original reserved power with lambda and radius retained',()=>{
  const p=source(),r=p.leadingRestrictions.ipos;assert.equal(r.pass,true);assert.equal(r.selectedCheck.pass,true);
  assert.equal(r.densityCheck.pass,true);assert.equal(r.amplitudeCheck.pass,true);assert.equal(r.sourceAmplitudeCheck.pass,true);
  assert.equal(r.fullHeatAndAllCorrectionRootsRetained,true);assert.equal(r.positiveCovarianceWeightsAssumed,false);
  assert.equal(r.generic.negativeControls.omittedRadiusDivision.pass,false);assert.equal(r.generic.negativeControls.omittedLambda.pass,false);
});

test('the original positive cutoff average retains its mass on the whole common collar',()=>{
  const p=source();assert.equal(p.commonTuples.length,1);const row=p.commonTuples[0];
  assert.equal(row.pass,true);assert.equal(row.localMassAfterCutoffDiscarded,false);assert.equal(row.uncutRawTupleUsedAcrossActivation,false);
  assert.equal(row.averageLiteralCheck.pass,true);assert.equal(row.averageBranches.core.pass,true);assert.equal(row.averageBranches.middle.pass,true);
  assert.equal(row.reconstructionChecks.global.pass,true);assert.equal(row.reconstructionChecks.local.pass,true);
});

test('both actual pressure densities equal the independent full global ordered-pair/Omega convolution',()=>{
  const p=source();assert.equal(p.rows.length,2);assert.equal(p.scope.actualGlobalFullPressureConvolutionIdentity,true);
  for(const row of p.rows){assert.equal(row.finalIdentity.pass,true);assert.equal(row.originalDerivativeCheck.pass,true);
    assert.equal(row.actualAllOrderedPairs,row.order+1);assert.equal(row.omega.sourceOrders.length,row.order);assert.equal(row.omega.pass,true);
    assert.equal(row.assumedResidualZero,false);assert.notEqual(row.originalUnrewrittenDifference,p.G.zero);
    assert.ok(row.omega.exterior.every(e=>e.U.pass&&e.v.pass));
  }
  assert.equal(p.rows[0].pressurePrimitiveProved,true);assert.equal(p.rows[1].pressurePrimitiveProved,true);
  assert.equal(p.primitives.rows[0].fullPressureComparison.identified,false);
});

test('the literal original Omega prefix keeps all four true FTC densities and the genuine source continuity',()=>{
  const p=source(),r=p.omegaPrefix;assert.equal(r.pass,true);assert.equal(r.sourceBodyCheck.pass,true);assert.equal(r.factorization.pass,true);
  assert.deepEqual(Object.keys(r.rows),['Jeta','Heta','H','K']);
  for(const row of Object.values(r.rows)){assert.equal(row.endpointCheck.pass,true);assert.equal(row.derivativeCheck.pass,true);assert.equal(row.compactIntegralAssignedZero,false);}
  assert.equal(r.actualContinuityPremise.privateSourceSealChecked,true);assert.equal(r.actualContinuityPremise.sourceM,p.primitives.prepared.bootstrap.finalM);
  assert.equal(r.newPrimitiveChosen,false);assert.equal(r.allActualPrefixTermsRetained,true);
  assert.equal(r.generic.negativeControls.missingRadialBoundary.pass,false);assert.equal(r.generic.negativeControls.unprovedContinuity.pass,false);
});

test('the true natural axis datum and all four complete weighted histories close the original Omega constant',()=>{
  const r=source().omegaPrefix;assert.equal(r.axis.axisFormulaCheck.pass,true);assert.equal(r.axis.axisValueCheck.pass,true);
  assert.equal(r.axis.divisionByZeroEvaluated,false);assert.equal(r.exterior.wholeRows.length,4);
  for(const row of r.exterior.wholeRows)assert.equal(row.check.pass,true);
  assert.equal(r.exterior.wholePressureCheck.pass,true);assert.equal(r.exterior.constantXDerivative,source().G.zero);
});

test('the actual Pi1 joins its local prefix, all three continuous pressure bumps and original third moment',()=>{
  const p=source(),r=p.pressureOne;assert.equal(r.pass,true);assert.equal(r.bodyCheck.pass,true);assert.equal(r.localWholeCheck.pass,true);
  assert.equal(r.bumpRows.length,3);for(const row of r.bumpRows){assert.equal(row.jacobian.pass,true);assert.equal(row.totalCheck.pass,true);}
  assert.equal(r.incomingCheck.pass,true);assert.equal(r.totalShapeCheck.pass,true);assert.equal(r.momentCheck.pass,true);
  assert.deepEqual(Object.keys(r.joins),['axis','Xkeep','Xcut','bumps','Xv','Xplus']);
  assert.equal(r.originalConservativeStressMomentsClaimedHere,false);assert.equal(p.primitives.rows[0].pressure.pass,false);
  assert.equal(p.scope.actualGlobalPressurePrimitivesOnGeneratedPrefix,true);
});

test('the live source seal rejects injected completion and the scoped fixed receipt survives append-only work',async()=>{
  const p=source();assert.throws(()=>assertActualGlobalPressureConvolution({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const saved=p.scope.wholeGN4Complete;p.scope.wholeGN4Complete=true;assert.throws(()=>assertActualGlobalPressureConvolution(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.wholeGN4Complete=saved;
  const certificate=await actualGlobalPressureConvolutionCertificate(p);p.G.fresh('after_pressure_restriction_certificate');
  assert.equal((await actualGlobalPressureConvolutionCertificate(p)).graph.sha256,certificate.graph.sha256);
  assert.equal(certificate.scope.wholeGN4Complete,false);assert.equal(certificate.scope.newLeanKernelProof,false);assert.equal(certificate.scope.m3MayStart,false);
  if(process.env.M2_GLOBAL_PRESSURE_EVIDENCE)await writeFile(process.env.M2_GLOBAL_PRESSURE_EVIDENCE,JSON.stringify({certificate,sourceConstructions:count,actualExecutedPositiveOrders:[1,2],currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
