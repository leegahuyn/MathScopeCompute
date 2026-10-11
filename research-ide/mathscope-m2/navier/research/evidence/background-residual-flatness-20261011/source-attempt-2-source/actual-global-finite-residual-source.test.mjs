import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualPositiveGlobalStress} from '../actual-positive-global-stress.mjs';
import {attachActualFiniteGlobalResidual,assertActualFiniteGlobalResidual,actualFiniteGlobalResidualCertificate} from '../actual-global-finite-residual.mjs';

let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-full-finite-global-residual-start'});
    const positive=prepareActualPositiveGlobalStress({order:2,maxNodes:2600000},{onProgress:progress});
    return prepared=attachActualFiniteGlobalResidual(positive,{truncationOrder:2,derivativeOrder:0,maxWords:4096,maxProfileJets:20000,maxJetRequests:200000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('the independent leading audit keeps the exact original node prefix and all source expression bodies',()=>{
  const p=source();assert.equal(count,1);assert.notEqual(p.G,p.positiveStress.G);
  assert.equal(p.sourceCopy.identicalOriginalNodePrefix,true);assert.equal(p.sourceCopy.originalExpressionBodiesPreserved,true);
  assert.equal(p.coefficients.Pi[0],p.leading.target.Pi);assert.deepEqual(p.coefficients.stress[0],p.leading.target.raw);
  assert.equal(p.leading.scope.actualLeadingPressureAxisDatumRetained,true);
});

test('every actual low finite coefficient keeps its defect and binds to independently proved global cancellation',()=>{
  const p=source(),low=p.coefficients.rows.slice(0,3);assert.equal(low.length,3);
  for(const r of low){assert.equal(r.cancellation.pass,true);assert.ok(Object.values(r.cancellation.checks).every(c=>c.pass));
    assert.equal(r.retainedActualDefectsNotDefinedAsZero,true);assert.deepEqual(r.reducedDefects,{angular:p.G.zero,axial:p.G.zero,radial:p.G.zero});}
  assert.equal(low[1].cancellation.lowerViscosityRetained,true);assert.equal(low[1].cancellation.sourceBothEndpointJets,true);
  assert.ok(Object.values(low[0].cancellation.sourceIdentity).every(c=>c.pass));
});

test('all high ordered convolution and viscosity terms are retained and the complete physical residual is bounded',()=>{
  const p=source();assert.equal(p.coefficients.rows.length,6);assert.equal(p.tail.rows.length,3);
  assert.deepEqual(p.coefficients.rows[5].indices.omega.orderedPairs,[[2,2]]);
  assert.equal(p.tail.fullFiniteResidualBoundEstablished,true);assert.equal(p.tail.lossIndependentOfTruncationOrder,true);
  assert.equal(p.tail.shiftedAxialViscosityRetained,true);assert.equal(p.tail.allOrderedQuadraticPairsRetained,true);
  for(const r of p.tail.rows)for(const c of r.components)assert.equal(c.words.rows.length,1);
});

test('finite velocity growth and all residual constants use complete anchored source FTC faces',()=>{
  const p=source();assert.equal(p.partialVelocity.derivativeOrder,2);assert.equal(p.partialVelocity.rows.length,15);
  assert.equal(p.partialVelocity.leadingFullHeatIncluded,true);assert.equal(p.partialVelocity.leadingGlobalStreamIncluded,true);
  assert.equal(p.partialVelocity.actualPositiveOrdersIncluded,true);
  for(const r of p.tail.ftcRows){assert.equal(r.faces.length,1<<r.coordinates.length);assert.equal(p.G.freeCoordinates(r.bound).size,0);}
  assert.equal(p.G.freeCoordinates(p.tail.bound).size,0);assert.equal(p.G.freeCoordinates(p.partialVelocity.bound).size,0);
});

test('private source seals reject cloned or changed cancellation claims, and report exact executed scope',async()=>{
  const p=source();assert.throws(()=>assertActualFiniteGlobalResidual({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=p.coefficients.rows[1].cancellation.pass;p.coefficients.rows[1].cancellation.pass=false;
  assert.throws(()=>assertActualFiniteGlobalResidual(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.coefficients.rows[1].cancellation.pass=original;
  const c=await actualFiniteGlobalResidualCertificate(p);p.G.fresh('after_finite_residual_certificate');
  assert.equal((await actualFiniteGlobalResidualCertificate(p)).graph.sha256,c.graph.sha256);
  assert.equal(c.scope.actualFullFiniteResidualCoefficientCancellation,true);assert.equal(c.scope.arbitraryFiniteDerivativeRecipe,true);
  assert.equal(c.scope.allOrderCommonCutoffSummationBound,false);assert.equal(c.scope.wholeGN4Complete,false);assert.equal(c.scope.m3MayStart,false);
  if(process.env.M2_GLOBAL_FINITE_RESIDUAL_EVIDENCE)await writeFile(process.env.M2_GLOBAL_FINITE_RESIDUAL_EVIDENCE,JSON.stringify({certificate:c,
    sourceConstructions:count,actualExecutedPositiveOrders:[1,2],actualExecutedTruncationOrder:2,actualExecutedDerivativeOrder:0,
    fixedPartialVelocityDerivativeOrder:2,currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
