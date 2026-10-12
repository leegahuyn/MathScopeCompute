import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {annulusCovarianceAlgebraAudit} from '../actual-annulus-covariance-kernel.mjs';
import {ActualAnnulusCovarianceExpressions,prepareActualAdmissibleAnnulusCovariance,attachActualAdmissibleAnnulusCovariance,assertActualAdmissibleAnnulusCovariance} from '../actual-admissible-annulus-covariance.mjs';

test('the full cylindrical reference pressure projects to the actual two by two growth operator',()=>{
  const a=annulusCovarianceAlgebraAudit();assert.equal(a.pass,true);assert.equal(a.checks.referenceProjection.length,4);
  assert.ok(a.checks.referenceProjection.every(x=>x.pass));assert.equal(a.negativeControls.omittedPressureDetected,true);
  assert.equal(a.sourceAuthenticated,false);assert.match(a.pressureRetained,/Actual n-prime and B-prime/);
});
test('both exact reference eigenvectors need their square root of one plus slope squared',()=>{
  const a=annulusCovarianceAlgebraAudit();assert.equal(a.checks.referenceDiagonalization.length,4);assert.ok(a.checks.referenceDiagonalization.every(x=>x.pass));
  assert.equal(a.negativeControls.omittedReferenceRootDetected,true);assert.match(a.referenceRelationsRequired,/lambda0\^2=-2F0/);
});
test('the physically oriented covariance determinant has the negative sign and both positive masses',()=>{
  const a=annulusCovarianceAlgebraAudit();assert.equal(a.checks.physicalDeterminant.pass,true);assert.equal(a.negativeControls.reversedDeterminantSignDetected,true);
  assert.match(a.determinantIdentity,/mass_plus\*mass_minus/);assert.equal(a.analyticErrorBoundsProducedHere,false);
});
test('a frozen rounded carrier has exactly zero slow derivative while actual slow operands keep theirs',()=>{
  const base=new ActualConvergentExpressions(),G=new ActualAnnulusCovarianceExpressions(base),R=G.fresh('generic_slow_R'),label=G.fresh('generic_frozen_label'),
    rounded=G.ceiling(label),p=G.choose(rounded,G.q(-1,2),G.q(1,2),rounded,G.one,rounded),active=G.mul(G.q(3),R),body=G.mul(p,active);
  assert.equal(G.derivative(p,R),G.zero);assert.equal(G.derivative(active,R),G.q(3));
  assert.equal(G.derivative(body,R),G.mul(p,G.q(3)));assert.ok(G.freeCoordinates(p).has(label));
});
test('undeclared or unimplemented parameter derivatives of a Volterra limit still fail explicitly',()=>{
  const base=new ActualConvergentExpressions(),G=new ActualAnnulusCovarianceExpressions(base),v=G.fresh('generic_v'),R=G.fresh('generic_R'),
    system=G.defineCovarianceVolterra({name:'ActualNeededParameterVariation',variable:v,parameters:[R],matrix:[[R,G.zero],[G.zero,R]],normUpper:G.add(G.one,G.pow(R,2)),length:G.one}),
    w=G.covarianceValue(system,0,v,[R]);
  assert.throws(()=>G.derivative(w,R),{code:'UNSUPPORTED'});assert.notEqual(G.derivative(w,v),G.zero);
});
test('a generic algebra receipt or caller positivity input cannot issue an actual annulus H certificate',()=>{
  assert.throws(()=>attachActualAdmissibleAnnulusCovariance(annulusCovarianceAlgebraAudit()),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualAdmissibleAnnulusCovariance({decision:{actualPositiveWeightsOnOpenWholeAnnulus:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const input of [{ell:'100'},{H:[[1,0],[0,1]]},{sourceNorm:1},{originalGamma:true},{allBands:true},[]])
    assert.throws(()=>prepareActualAdmissibleAnnulusCovariance(input),{code:'INVALID_INPUT'});
});
