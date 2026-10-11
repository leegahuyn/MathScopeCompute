import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {physicalCenterFrequencyAudit,exactInversePhysicalTorusCenter,physicalCenterCurlAlgebra,enclosePhysicalCenterCoefficients} from '../actual-physical-center-kernel.mjs';
import {readRational,qcompare,rational as Q} from '../actual-continuation-arithmetic.mjs';

const fixture=()=>{
  const G=new ActualConvergentExpressions(),s=G.sqrt(G.q(2)),q=(n,d=1)=>G.q(n,d);
  return {G,input:{Q:q(1,16),Lambda:G.sub(q(4),s),Tg:G.add(q(4),s),paletteIndex:q(3),dr:q(3,2),Dgeom:G.sub(q(4),G.mul(q(2),s)),
    basis:[[G.one,G.sub(G.one,s)],[G.sub(s,G.one),G.one]],center:[q(1,1048576),G.zero],anchorYi:[q(11,3),q(7,2)]}};
};
test('positive h and the actual strong band yield a nonzero exact displacement budget',()=>{
  const p=physicalCenterFrequencyAudit();assert.equal(p.pass,true);assert.ok(p.rows.every(r=>r.pass));
  assert.equal(p.power,16384);assert.equal(p.bits,16384);assert.equal(p.hReplacedByZero,false);
  assert.ok(qcompare(readRational(p.positiveErrorUpper),Q(0))>0);assert.equal(p.sourceAuthenticated,false);
  assert.equal(physicalCenterFrequencyAudit({power:1000000,bits:1000000}).pass,true);
  assert.throws(()=>physicalCenterFrequencyAudit({power:1.5}),{code:'INVALID_INPUT'});
});
test('the original torus inverse retains its integer lift and exact positive-real rules',()=>{
  const {G,input}=fixture(),p=exactInversePhysicalTorusCenter(G,input);
  assert.equal(p.pass,true);assert.ok(p.reconstructionChecks.every(r=>r.pass));assert.ok(p.timeIdentity.pass&&p.radiusSquareIdentity.pass);
  assert.deepEqual(p.copy,[G.q(4),G.q(4)]);assert.equal(p.slow.Z,G.zero);assert.equal(p.profile.eta,G.zero);
  assert.equal(p.positiveRadialCoordinateProvedHere,false);assert.equal(p.physicalSourceMembershipProvedHere,false);
  assert.notEqual(p.slow.T,G.one);assert.notEqual(p.slow.R,p.rawSlowR);
  assert.match(p.positiveRealRules.nearestLift,/copy_j/);assert.match(p.positiveRealRules.radial,/exactly/);
});
test('an altered original basis, multiplier or caller membership flag is rejected',()=>{
  const {G,input}=fixture();
  assert.throws(()=>exactInversePhysicalTorusCenter(G,{...input,basis:[[G.one,G.zero],[G.zero,G.one]]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactInversePhysicalTorusCenter(G,{...input,Lambda:G.q(3)}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactInversePhysicalTorusCenter(G,{...input,physicalSourceMembershipProvedHere:true}),{code:'INVALID_INPUT'});
});
test('phase zero gives the full curl value only after the actual normal constraint',()=>{
  const G=new ActualConvergentExpressions(),p=physicalCenterCurlAlgebra(G);
  assert.equal(p.pass,true);assert.equal(p.checks.length,3);assert.ok(p.checks.every(r=>r.pass));
  assert.equal(p.negativeControl.correctlyRejected,true);assert.equal(p.negativeControl.check.pass,false);
  assert.equal(p.derivativesOfCurlRemainderDiscarded,false);assert.equal(p.nonlinearResidualDiscarded,false);
});
test('three signed cylindrical components and full H/y columns are directed simultaneously',()=>{
  const p=enclosePhysicalCenterCoefficients();assert.equal(p.pass,true);assert.ok(p.rows.every(r=>r.toleranceMet));
  for(const [i,sign]of [1,-1].entries()){
    for(const c of [0,1])assert.ok(qcompare(readRational(p.values.pulseCylindrical[i][c].lower),Q(353,1000))>0);
    const z=p.values.pulseCylindrical[i][2];assert.ok(sign===1?qcompare(readRational(z.lower),Q(0))>0:qcompare(readRational(z.upper),Q(0))<0);
    assert.ok(qcompare(readRational(p.values.weightedCylindrical[i][0].lower),Q(498,1000))>0);
    assert.ok(qcompare(readRational(p.values.weights[i].lower),Q(1984,1000))>0);
  }
  assert.ok(qcompare(readRational(p.values.covariance[1][0].lower),Q(0))>0);
  assert.ok(qcompare(readRational(p.values.covariance[1][1].upper),Q(0))<0);
  assert.ok(qcompare(readRational(p.values.determinant[0].upper),Q(0))<0);
  for(const x of p.values.squareRootWeights)assert.ok(qcompare(readRational(x.lower),Q(1))>0);
  assert.equal(p.positiveRemaindersRetained,true);assert.equal(p.physicalSourcePointCertifiedHere,false);
  assert.equal(p.slowOrFastDerivativeValuesEnclosed,false);assert.equal(p.exactPositiveScalesNumericallyEvaluated,false);
});
test('a numerical kernel cannot accept supplied H, source flags or a forged zero tolerance',()=>{
  for(const input of [{H:[[1,1],[1,-1]]},{sourceAuthenticated:true},{tolerance:'0'},{centerTolerance:0}])
    assert.throws(()=>enclosePhysicalCenterCoefficients(input),{code:'INVALID_INPUT'});
});
