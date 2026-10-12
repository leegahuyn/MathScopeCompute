import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualPositiveGlobalStress} from '../actual-positive-global-stress.mjs';
import {attachActualPressureStressPhysicalSeminorms,assertActualPressureStressPhysicalSeminorms,actualPressureStressPhysicalSeminormCertificate} from '../actual-pressure-stress-all-order-tail.mjs';

let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-all-order-pressure-stress-constructor-start'});
    const positive=prepareActualPositiveGlobalStress({order:2,maxNodes:2600000},{onProgress:progress});
    return prepared=attachActualPressureStressPhysicalSeminorms(positive,{throughOrder:2,derivativeOrder:1,maxProfileJets:20000,maxJetRequests:200000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('all physical pressure and stress constants come from the same actual smooth globally cancelled source',()=>{
  const p=source(),original=p.positiveStress.moments.pressure.primitives.prepared;assert.equal(count,1);
  assert.equal(p.G,original.G);assert.equal(p.rows.length,2);
  for(const row of p.rows){assert.equal(row.components.length,3);assert.equal(row.bounds.length,2);
    assert.equal(row.sameActualPressureRoot,original.records[row.order].global.Pi);
    assert.deepEqual(row.sameActualStressRoots,[original.records[row.order].stress.Ttheta,original.records[row.order].stress.Tz]);
    assert.ok(row.components.every(c=>c.byOrder.length===2));}
  assert.equal(p.scope.allSourceSmoothStressJoinsAuthenticated,true);assert.equal(p.scope.mathematicalDerivativeOrderCap,null);
});

test('the complete anchored FTC faces are retained and every actual bound has no free coordinates',()=>{
  const p=source();assert.ok(p.ftcRows.length>0);assert.equal(p.work.actualFTCRows,p.ftcRows.length);
  assert.ok(p.work.actualFTCRows<=p.work.requiredProfileJets);
  for(const row of p.ftcRows){assert.equal(row.faces.length,1<<row.coordinates.length);
    assert.deepEqual(row.faces.map(f=>f.mask),Array.from({length:1<<row.coordinates.length},(_,i)=>i));
    assert.equal(p.G.freeCoordinates(row.bound).size,0);assert.equal(row.finiteExactIntegral,true);assert.equal(row.decimalEvaluation,false);}
});

test('all higher stress quotient and direct weighted derivatives use the same positive original zeta',()=>{
  const p=source(),r=p.weightedStress[0];assert.equal(p.weightedStress.length,1);assert.equal(r.order,2);
  assert.equal(r.quotientJets.length,6);assert.equal(r.directWeightedJets.length,6);
  assert.equal(r.bounds.length,2);assert.equal(r.directWeightedBounds.length,2);
  assert.equal(r.zeta,p.n1Weighted.zeta);assert.equal(r.zeta,p.domain.originalZeta);
  assert.equal(r.positiveZetaOnWholeRectangle,true);assert.equal(r.actualZeroExtensionAtBothSupportEnds,true);
  assert.ok(r.normalizedRows.some(row=>row.eulerOrder===1));assert.ok(r.directNormalizedRows.some(row=>row.eulerOrder===1));
});

test('all finite order-one constants retain the actual terminal heat factor, backward primitive, and Gaussian gain',()=>{
  const p=source(),r=p.n1Weighted;assert.ok(Object.values(r.sourceChecks).every(Boolean));
  assert.equal(p.orderOneSeed.request.derivativeOrder,0);assert.equal(r.rules.derivativeOrder,1);
  assert.equal(r.terminal.B,p.orderOneSeed.terminal.B);assert.equal(r.terminal.completeHeat,p.orderOneSeed.terminal.heatAtDelta);
  assert.equal(r.terminal.fullImproperHeatTailRetained,true);assert.equal(r.terminal.factorization.check.pass,true);
  assert.equal(r.terminal.terminalNorms.length,3);assert.equal(r.weightedRows.length,3);
  assert.equal(r.interior.length,6);assert.deepEqual(r.poles,[3,6]);assert.equal(r.bounds.length,2);
  assert.equal(r.mathematicalDerivativeOrderCap,null);assert.equal(r.originalFirstCutoffReplaced,false);
  assert.equal(r.allFiniteRequestedDerivativesGenerated,true);
});

test('normalized pressure includes actual Euler/X/eta derivatives and explicit insufficient-budget failure',()=>{
  const p=source();assert.equal(p.normalizedPressure.length,2);
  for(const r of p.normalizedPressure){assert.equal(r.jets.length,3);assert.equal(r.bounds.length,2);
    assert.ok(r.normalizedRows.some(row=>row.eulerOrder===1));assert.equal(r.zeroExtensionSuppliesEveryLargerFixedRadialRectangle,true);}
  assert.throws(()=>attachActualPressureStressPhysicalSeminorms(p.positiveStress,{throughOrder:2,derivativeOrder:17,maxProfileJets:1}),{code:'RESOURCE_LIMIT'});
});

test('private proof seals reject fabricated or mutated bound families and keep certificates stable under appends',async()=>{
  const p=source();assert.throws(()=>assertActualPressureStressPhysicalSeminorms({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=p.n1Weighted.bounds[1];p.n1Weighted.bounds[1]=p.G.zero;
  assert.throws(()=>assertActualPressureStressPhysicalSeminorms(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.n1Weighted.bounds[1]=original;
  const c=await actualPressureStressPhysicalSeminormCertificate(p);p.G.fresh('after_all_order_pressure_stress_certificate');
  assert.equal((await actualPressureStressPhysicalSeminormCertificate(p)).graph.sha256,c.graph.sha256);
  assert.equal(c.scope.arbitraryFiniteDerivativeAlgorithm,true);assert.equal(c.scope.sameOriginalZetaAtEveryOrder,true);
  assert.equal(c.scope.commonInfiniteCutoffsChosen,false);assert.equal(c.scope.fullPhysicalResidualFlatness,false);
  assert.equal(c.scope.wholeGN4Complete,false);assert.equal(c.scope.newLeanKernelProof,false);assert.equal(c.scope.m3MayStart,false);
  if(process.env.M2_PRESSURE_STRESS_TAIL_EVIDENCE)await writeFile(process.env.M2_PRESSURE_STRESS_TAIL_EVIDENCE,
    JSON.stringify({certificate:c,sourceConstructions:count,actualExecutedPositiveOrders:[1,2],actualExecutedDerivativeOrder:1,currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
