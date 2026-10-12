import test from 'node:test';
import assert from 'node:assert/strict';
import {finiteCovarianceBandExclusionArithmetic,prepareActualCovarianceBandAdmissibility,certifyActualCovarianceBandAdmissibility,assertActualCovarianceBandAdmissibility} from '../actual-covariance-band-admissibility.mjs';

test('finite-band exponent comparisons retain positive h and all exact powers',()=>{
  const audit=finiteCovarianceBandExclusionArithmetic();
  assert.equal(audit.pass,true);assert.ok(audit.rows.every(r=>r.pass));
  assert.equal(audit.frequencyExponent,8204);assert.equal(audit.limit,128);
  assert.equal(audit.floatingTranscendentalEvaluation,false);
  for(let ell=1n;ell<=128n;ell++)assert.ok(ell<(1n<<8204n));
});

test('a caller cannot set h to zero, supply a threshold or attach positivity',()=>{
  for(const key of ['h','ellMinimum','qStar','determinant','positiveWeights','completed'])
    assert.throws(()=>prepareActualCovarianceBandAdmissibility({ellExact:'1',[key]:0}),{code:'INVALID_INPUT'});
});

test('unsupported bands and a changed profile are rejected before source compilation',()=>{
  for(const ellExact of ['0','129','9999'])assert.throws(()=>prepareActualCovarianceBandAdmissibility({ellExact}),{code:'UNSUPPORTED'});
  for(const ellExact of [1,'1.0','-1','10000'])assert.throws(()=>prepareActualCovarianceBandAdmissibility({ellExact}),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualCovarianceBandAdmissibility({sourceProfile:'different-profile',ellExact:'1'}),{code:'UNSUPPORTED'});
});

test('copied operator and conclusion objects cannot authenticate a source theorem',()=>{
  assert.throws(()=>certifyActualCovarianceBandAdmissibility({}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCovarianceBandAdmissibility({decision:{uniformTheoremNonmembershipProved:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
