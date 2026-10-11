import test from 'node:test';
import assert from 'node:assert/strict';
import {originalPositiveConservativeTotalIdentity,originalSignedStressSplitIdentity} from '../actual-positive-global-stress-kernel.mjs';
import {assertActualPositiveGlobalStress,attachActualPositiveGlobalStress} from '../actual-positive-global-stress.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

test('the full conservative identity retains an indeterminate order and every radial boundary',()=>{
  const r=originalPositiveConservativeTotalIdentity();assert.equal(r.pass,true);
  assert.equal(Object.keys(r.checks).length,10);assert.ok(Object.values(r.checks).every(c=>c.pass));
  assert.equal(r.radialBoundariesKeptInExecutedIdentity,true);assert.equal(r.originalContinuityDefectsRetainedByPairKernel,true);
  assert.equal(r.pair.pass,true);assert.equal(r.sourceFieldsOrMomentsAssumed,false);
  assert.equal(r.actualWholeIntegralsAuthenticated,false);assert.equal(r.newLeanKernelProof,false);
});

test('pressure integration by parts, angular radial weight, and the previous viscosity each matter',()=>{
  const r=originalPositiveConservativeTotalIdentity();
  assert.deepEqual(Object.keys(r.negativeControls),['discardedPressureBoundary','wrongPressureMomentSign','missingAngularRadialWeight','omittedPreviousViscosity']);
  assert.ok(Object.values(r.negativeControls).every(c=>!c.pass));
  assert.equal(r.pair.negativeControls.discardedAngularContinuity.pass,false);
  assert.equal(r.pair.negativeControls.discardedAxialContinuity.pass,false);
});

test('backward minus forward equals the whole moment, which cannot be presumed zero',()=>{
  const r=originalSignedStressSplitIdentity();assert.equal(r.pass,true);assert.ok(Object.values(r.checks).every(c=>c.pass));
  assert.equal(r.negativeControls.unprovedWholeTheta.pass,false);assert.equal(r.negativeControls.unprovedWholeZ.pass,false);
  assert.equal(r.negativeControls.wrongBackwardThetaSign.pass,false);assert.equal(r.negativeControls.missingAngularTwo.pass,false);
  assert.equal(r.sourceTotalMomentAuthenticated,false);
});

test('a nonconstant polynomial density validates signed FTC with a genuine nonzero total obstruction',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('independent_stress_x'),q=(n,d=1)=>G.q(n,d),
    f=G.add(G.one,G.mul(q(3),G.pow(x,2))),primitive=G.add(x,G.pow(x,3)),
    left=q(1),right=q(2),total=G.sub(G.substitute(primitive,x,right),G.substitute(primitive,x,left)),
    partial=G.sub(primitive,G.substitute(primitive,x,left)),backwardPart=G.sub(G.substitute(primitive,x,right),primitive),
    forward=G.neg(G.div(partial,G.mul(q(2),x))),backward=G.div(backwardPart,G.mul(q(2),x)),
    verify=value=>sourceGraphRationalIdentity(G,value);
  assert.equal(verify(G.sub(G.derivative(primitive,x),f)).pass,true);
  assert.equal(verify(G.add(G.derivative(G.mul(q(2),x,forward),x),f)).pass,true);
  assert.equal(verify(G.sub(G.sub(backward,forward),G.div(total,G.mul(q(2),x)))).pass,true);
  assert.equal(verify(G.sub(backward,forward)).pass,false);
  assert.equal(verify(G.add(G.derivative(G.mul(q(2),x,backward),x),f)).pass,true);
});

test('source completion cannot be manufactured from a passing general identity',()=>{
  const fake={generic:{totals:originalPositiveConservativeTotalIdentity()},scope:{actualPositiveGlobalMomentumCoefficientCancellation:true}};
  assert.throws(()=>assertActualPositiveGlobalStress(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>attachActualPositiveGlobalStress(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
