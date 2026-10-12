import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {rational as Q,readRational,qcompare,qsub,directedArithmetic} from '../actual-continuation-arithmetic.mjs';
import {adiabaticProjectedDiagonalAudit,adiabaticTransportIdentityAudit,adiabaticPulseCenterErrorAudit,adiabaticPulseCenterControls,encloseAdiabaticPulseCenters} from '../actual-adiabatic-pulse-center-kernel.mjs';

test('the actual moving-pressure and moving-basis diagonal reduce exactly for arbitrary finite tangent tilt',()=>{
  const p=adiabaticProjectedDiagonalAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.checks.length,5);assert.ok(p.checks.every(c=>c.pass));
  assert.ok(p.negativeControls.every(c=>c.correctlyRejected&&!c.check.pass));
  assert.equal(p.squareRootRule.allFiniteRealB,true);assert.equal(p.sourceAuthenticated,false);
  assert.match(p.identity,/damping-dref/);assert.equal(p.noPressureOrBasisTermDropped,true);
});

test('both signs have the same exact positive three-quarter-power center transport',()=>{
  const p=adiabaticTransportIdentityAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.rows.length,2);assert.ok(p.rows.every(r=>r.check.pass));
  assert.ok(p.rows.every(r=>r.negativeControl.correctlyRejected));assert.equal(p.exactAntiderivative,true);assert.equal(p.sourceAuthenticated,false);
});

test('rounding, finite-length diagonal, fast-channel coupling and finite-u remainders are all positive',()=>{
  const p=adiabaticPulseCenterErrorAudit();assert.equal(p.pass,true);assert.ok(p.checks.every(r=>r.pass));
  for(const k of ['diagonalLogUpper','couplingLogUpper','halfLogUpper','referenceCorrectionUpper','absoluteCenterRadius'])assert.ok(qcompare(readRational(p.parameters[k],200000),Q(0))>0);
  assert.equal(p.parameters.scalePower,1024);assert.equal(p.parameters.offDiagonalPower,256);assert.equal(p.parameters.conePower,260);
  assert.match(p.premises.carrier,/k>S\^8/);assert.match(p.derivation.scalar,/B\^516\/S/);assert.equal(p.actualSourceAuthenticated,false);
});

test('directed square roots and a nonzero outward-rounded analytic remainder enclose the absolute center',()=>{
  const p=encloseAdiabaticPulseCenters();assert.equal(p.pass,true);assert.equal(p.rows.length,3);
  assert.ok(qcompare(readRational(p.values.center.lower),Q(3535533905932737n,10000000000000000n))>0);
  assert.ok(qcompare(readRational(p.values.center.upper),Q(3535533905932739n,10000000000000000n))<0);
  assert.ok(qcompare(readRational(p.values.centerSquared.lower),Q(1,8))<0);assert.ok(qcompare(readRational(p.values.centerSquared.upper),Q(1,8))>0);
  assert.ok(qcompare(readRational(p.values.inverseCenterSquared.lower),Q(8))<0);assert.ok(qcompare(readRational(p.values.inverseCenterSquared.upper),Q(8))>0);
  for(const r of p.rows)assert.ok(qcompare(readRational(r.width),readRational(p.request.tolerance))<=0);
  assert.equal(p.errorBudget.exactIntegratedTransportUsed,true);assert.equal(p.errorBudget.nonzeroSubUlpRemainderRoundedUp,true);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);
  assert.notEqual(p.values.center.lower,p.reference.lower);assert.notEqual(p.values.center.upper,p.reference.upper);
});

test('increasing the directed precision narrows the same center and both inverse-square bounds',()=>{
  const a=encloseAdiabaticPulseCenters({precisionBits:96,tolerance:'1/10000000000000000000'}),b=encloseAdiabaticPulseCenters({precisionBits:256,tolerance:'1/10000000000000000000000000000000000000000000000000000000'});
  for(const k of ['center','centerSquared','inverseCenterSquared']){
    assert.ok(qcompare(readRational(b.values[k].lower),readRational(a.values[k].lower))>0);
    assert.ok(qcompare(readRational(b.values[k].upper),readRational(a.values[k].upper))<0);
  }
  assert.equal(b.arithmetic.binary64UsedForDecisions,false);
});

test('no user amplitude, source flag, numeric tolerance or zero-containing inverse is accepted',()=>{
  for(const input of [{center:1},{sourceAuthenticated:true},{precisionBits:53},{precisionBits:192.5},{tolerance:1e-12},{tolerance:'0'},{tolerance:'-1'},{tolerance:'1'}])assert.throws(()=>adiabaticPulseCenterControls(input),{code:'INVALID_INPUT'});
  assert.throws(()=>adiabaticPulseCenterControls({precisionBits:96,tolerance:'1/10000000000000000000000000000000000000000'}),{code:'PRECISION_REQUIRED'});
  const A=directedArithmetic(192);assert.deepEqual(A.small(8192),[0n,1n]);assert.throws(()=>A.div(A.one(),[-1n,1n]),{code:'PRECISION_REQUIRED'});
});
