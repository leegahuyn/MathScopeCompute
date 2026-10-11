import test from 'node:test';
import assert from 'node:assert/strict';
import {originalLeadingOmegaFluxIdentity,originalPositiveContinuityDefectIdentity,originalConservativePairAndWeightIdentities,originalConfluentBumpMomentIdentity,originalIposFiveDensityJacobianIdentity} from '../actual-global-conservative-moments-kernel.mjs';
import {attachActualGlobalConservativeMoments,prepareActualGlobalConservativeMoments,assertActualGlobalConservativeMoments} from '../actual-global-conservative-moments.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {explicitPrimitiveBodyIdentity} from '../actual-global-primitive-kernels.mjs';

test('weighted original Omega flux preserves its X factor and viscous boundary',()=>{
  const r=originalLeadingOmegaFluxIdentity();assert.equal(r.checks.factorization.pass,true);
  assert.equal(r.negativeControls.omittedViscousBoundary.pass,false);
  assert.equal(r.negativeControls.wrongOmegaWeight.pass,false);
  assert.equal(r.negativeControls.unprovedContinuity.pass,false);
  assert.equal(r.sourceWholeFluxAuthenticated,false);
});

test('arbitrary positive-order stream reconstruction retains both mass defects and nu',()=>{
  const r=originalPositiveContinuityDefectIdentity();assert.equal(r.indeterminateExponent,true);
  assert.equal(r.checks.factorization.pass,true);assert.equal(r.negativeControls.omittedOrderExponent.pass,false);
  assert.equal(r.negativeControls.unprovedMass.pass,false);assert.equal(r.axisDivisionEvaluated,false);
});

test('all conservative pair, radial weight, viscosity and pressure signs are independent exact identities',()=>{
  const r=originalConservativePairAndWeightIdentities();assert.equal(Object.keys(r.checks).length,9);
  assert.ok(Object.values(r.checks).every(c=>c.pass));assert.ok(Object.values(r.negativeControls).every(c=>!c.pass));
  assert.equal(r.boundaryTermsRetained,true);assert.match(r.pairExponents,/indeterminate/);
});

test('continuous confluent identity uses FTC without dropping the actual two-lambda factor',()=>{
  const r=originalConfluentBumpMomentIdentity();assert.equal(r.checks.derivative.pass,true);
  assert.equal(r.checks.valueAtOne.pass,true);assert.equal(r.negativeControls.omittedTwoLambda.pass,false);
  assert.equal(r.finitePointMomentSubstitution,false);assert.equal(r.actualMatrixOperandsAuthenticated,false);
});

test('all five continuous source correction densities have their distinct dX Jacobians',()=>{
  const r=originalIposFiveDensityJacobianIdentity();assert.equal(Object.keys(r.checks).length,5);
  assert.ok(Object.values(r.checks).every(c=>c.pass));assert.ok(Object.values(r.negativeControls).every(c=>!c.pass));
  assert.equal(r.wholeMomentsReplacedBySamples,false);
});

test('supplied source moments, derivative or completion flags cannot authorize the source adapter',()=>{
  assert.throws(()=>attachActualGlobalConservativeMoments({scope:{actualGlobalFullPressureConvolutionIdentity:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualGlobalConservativeMoments({scope:{wholeGN4Complete:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const key of ['moment','derivative','forcing','pass','wholeGN4Complete'])
    assert.throws(()=>prepareActualGlobalConservativeMoments({[key]:0}),{code:'INVALID_INPUT'});
});

test('whole weighted integrals compare bound-variable bodies without treating bound fields as free atoms',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('whole_x'),t=G.fresh('whole_t'),v=G.exp(G.mul(X,G.core.eta)),
    density=G.mul(X,v),original=G.integral(density,X,G.zero,G.one),
    renamed=G.integral(G.substitute(density,X,t),t,G.zero,G.one);
  assert.equal(explicitPrimitiveBodyIdentity(G,original,renamed,{atomicNodes:[v]}).pass,false);
  assert.equal(explicitPrimitiveBodyIdentity(G,original,renamed).pass,true);
  const wrong=G.integral(G.substitute(v,X,t),t,G.zero,G.one);
  assert.equal(explicitPrimitiveBodyIdentity(G,original,wrong).pass,false);
});
