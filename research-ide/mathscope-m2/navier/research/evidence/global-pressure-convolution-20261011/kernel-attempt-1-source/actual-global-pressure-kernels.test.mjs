import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {originalPressurePairConvolutionIdentity,originalReservedPowerLogIdentity,reduceExpressionOnDeclaredBranches} from '../actual-global-pressure-kernels.mjs';

test('ordered pressure convolution includes both leading placements and every middle pair',()=>{
  for(const n of [1,2,5,9]){const r=originalPressurePairConvolutionIdentity(n);assert.equal(r.pass,true);assert.equal(r.pairs.length,n+1);
    assert.equal(r.negativeControls.omittedLeadingPair.pass,false);if(n>1)assert.equal(r.negativeControls.omittedInterior.pass,false);}
});

test('actual reserved-power log algebra retains the radius division and positive lambda',()=>{
  const r=originalReservedPowerLogIdentity();assert.equal(r.pass,true);assert.equal(r.sourceAuthenticated,false);
  assert.equal(r.negativeControls.omittedRadiusDivision.pass,false);assert.equal(r.negativeControls.omittedLambda.pass,false);
});

test('literal branch reduction never discards an accumulated nonzero compact primitive',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('pressure_branch_X'),t=G.fresh('pressure_branch_t'),
    density=G.choose(t,G.q(1),G.q(2),G.zero,G.exp(t),G.zero),prefix=G.integral(density,t,G.zero,X),
    closed=G.choose(X,G.q(1),G.q(3),G.zero,prefix,G.q(7)),
    r=reduceExpressionOnDeclaredBranches(G,closed,{coordinate:X,selectPiecewise:()=>4});
  assert.equal(r.value,prefix);assert.equal(r.literalIntegralBodiesPreserved,true);assert.notEqual(r.value,G.zero);assert.equal(r.sourceAuthenticated,false);
});

test('branch reduction preserves the chosen actual formula and enforces an independent work budget',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('pressure_budget_X'),body=G.choose(X,G.one,G.q(2),X,G.pow(X,2),G.pow(X,3));
  const r=reduceExpressionOnDeclaredBranches(G,body,{coordinate:X,selectPiecewise:()=>4});assert.equal(r.value,G.pow(X,2));
  assert.throws(()=>reduceExpressionOnDeclaredBranches(G,body,{coordinate:X,selectPiecewise:()=>4,maxVisits:1}),{code:'RESOURCE_LIMIT'});
});
