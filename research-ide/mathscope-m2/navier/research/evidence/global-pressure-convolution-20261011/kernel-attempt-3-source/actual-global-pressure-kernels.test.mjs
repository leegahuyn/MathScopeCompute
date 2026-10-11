import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {explicitPrimitiveBodyIdentity} from '../actual-global-primitive-kernels.mjs';
import {originalPressurePairConvolutionIdentity,originalReservedPowerLogIdentity,reduceExpressionOnDeclaredBranches,rewriteExactPressureOperands} from '../actual-global-pressure-kernels.mjs';

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

test('operand rewrite retains an unproved defect and never rewrites an integral or branch body',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('pressure_rewrite_X'),t=G.fresh('pressure_rewrite_t'),
    source=G.add(X,G.one),replacement=G.pow(X,2),prefix=G.integral(source,t,G.zero,X),
    branch=G.choose(X,G.one,G.q(2),source,source,G.zero),shell=G.add(source,prefix,branch),
    r=rewriteExactPressureOperands(G,shell,{replacements:new Map([[source,replacement]])});
  assert.equal(explicitPrimitiveBodyIdentity(G,r.value,G.add(replacement,prefix,branch)).pass,true);assert.equal(r.trace.length,1);assert.equal(r.sourceAuthenticated,false);
  assert.equal(rewriteExactPressureOperands(G,G.sub(source,replacement)).value,G.sub(source,replacement));
  assert.throws(()=>rewriteExactPressureOperands(G,shell,{maxVisits:1}),{code:'RESOURCE_LIMIT'});
});
