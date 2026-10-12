/** Exercise the corrected observation without importing a runtime whose
 * original-map numerical evidence is deliberately not installed yet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceBandParameters,sourceDyadicObservation,torusExactIdentityAudit,evaluatedDerivativeContract,applyEvaluatedDerivatives} from '../source-geometry.mjs';
import {ORIGINAL_RADIAL_PHASE_SPECIFICATION} from '../source-radial-phase-exponent.mjs';

test('corrected directed geometry retains exact positive h, frozen carrier and original exponent metadata',()=>{
  for(const ell of [8,16,64,256,900]){
    const b=sourceBandParameters(ell);
    assert.equal(b.dr.exact,ORIGINAL_RADIAL_PHASE_SPECIFICATION.formula);
    assert.equal(b.dr.kappaExact,'1/100000');assert.ok(b.dr.interval[0]>1&&b.dr.interval[1]<3);
    assert.equal(b.carrier.k,2);assert.equal(b.epsilon.strictlyLessThanOne,true);
    assert.equal(b.epsilon.notRoundedToAnExactOne,true);assert.equal(b.covering.frozen,true);
    assert.equal(Math.floor(b.covering.indexInterval[0]),Math.floor(b.covering.indexInterval[1]));
  }
  const r=sourceDyadicObservation({ellStart:32,count:5,T:0,Z:.2});
  assert.ok(r.rows.every(x=>x.tau===0&&x.oneSidedTimeBoundary));assert.equal(r.leadingFieldNumericallyEvaluated,false);
  assert.throws(()=>sourceDyadicObservation({h:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>sourceDyadicObservation({T:0,Z:0}),{code:'UNSUPPORTED'});
});

test('the original torus dual identities and full evaluated chain rule remain intact after the exponent correction',()=>{
  const good=torusExactIdentityAudit();assert.equal(good.pass,true);assert.equal(good.chainRule.time_v,1);
  assert.equal(good.haar.fullCoveringFactor,'1');
  assert.equal(torusExactIdentityAudit({omitFastChainRule:true}).pass,false);
  assert.equal(torusExactIdentityAudit({wrongGlobalHaarFactor:true}).pass,false);
  const c=evaluatedDerivativeContract(16,1),r=applyEvaluatedDerivatives(c,{R:0,Z:0,T:0,theta:0,Y1:0,Y2:1});
  assert.ok(r.time[0]>0);assert.ok(r.Dr[1]<0);
  assert.throws(()=>applyEvaluatedDerivatives(c,{R:1,Z:2,T:3}),{code:'INVALID_INPUT'});
  const slow=applyEvaluatedDerivatives(c,{R:1,Z:0,T:0,theta:0,Y1:0,Y2:0});
  assert.ok(slow.Dr[0]<=1&&slow.Dr[1]>=1);
});
