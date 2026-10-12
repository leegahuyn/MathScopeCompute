import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {encloseNormalizedHeatMoments,heatSlowDerivativeIdentityAudit,attachActualHeatScaledEnclosure,assertActualHeatScaledEnclosure,prepareActualHeatScaledEnclosure} from '../actual-heat-scaled-enclosure.mjs';
import {readRational as read,qcompare,qsub,rational as Q} from '../actual-continuation-arithmetic.mjs';

const point=s=>({lower:s,upper:s});
const request={h:point('1/2'),argument:point('1/64'),tolerance:'1/1000000000000000'};

test('zero-argument moments are exact Gamma products without source authentication',()=>{
  const p=encloseNormalizedHeatMoments({...request,argument:point('0')});
  assert.deepEqual(p.coefficients.D0.interval,point('3/2'));
  assert.deepEqual(p.coefficients.D1.interval,point('3/2'));
  assert.deepEqual(p.coefficients.D2.interval,point('15/4'));
  assert.equal(p.terms,1);assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);
});

test('h=0 is explicitly a generic continuous extension, never an actual-source replacement',()=>{
  const p=encloseNormalizedHeatMoments({...request,h:point('0'),argument:point('0')});
  assert.deepEqual(p.coefficients.D1.interval,point('1'));assert.deepEqual(p.coefficients.D2.interval,point('2'));
  assert.match(p.proof.zeroParameterPolicy,/continuous extension/);assert.equal(p.sourceAuthenticated,false);
});

test('finite signed moment remainder and complete widths meet exact tolerance',()=>{
  const p=encloseNormalizedHeatMoments(request);assert.ok(p.terms>1);
  for(const row of Object.values(p.coefficients)){
    assert.equal(row.pass,true);assert.equal(row.signedRemainder,p.terms%2?'NONPOSITIVE':'NONNEGATIVE');
    assert.ok(qcompare(qsub(read(row.interval.upper),read(row.interval.lower)),read(request.tolerance))<=0);
    assert.ok(qcompare(read(row.remainderAbsoluteUpper),Q(0))>0);
  }
  assert.equal(p.errorBudget.includesAllImproperTail,true);assert.match(p.proof.convergenceClaim,/not claimed to converge/);
});

test('actual-scale containing boxes preserve positive normalized moments at 192 bits',()=>{
  const p=encloseNormalizedHeatMoments({h:{lower:'0',upper:'1/'+(1n<<4096n)},argument:{lower:'0',upper:'1/'+(1n<<2559n)}});
  assert.equal(p.terms,1);
  for(const row of Object.values(p.coefficients))assert.ok(qcompare(read(row.interval.lower),Q(0))>0);
  assert.ok(qcompare(read(p.coefficients.D1.interval.lower),Q(1))<0);
  assert.ok(qcompare(read(p.coefficients.D1.interval.upper),Q(1))>0);
  assert.equal(p.originalParametersSubstitutedByGenericValues,false);assert.equal(p.sourceAuthenticated,false);
});

test('all first and symmetric second source-integrand slow derivatives are checked',()=>{
  const p=heatSlowDerivativeIdentityAudit(new ActualSourceExpressions());
  assert.equal(p.checks.length,9);assert.ok(p.checks.every(r=>r.pass));assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.negativeControl.correctlyRejected,true);assert.equal(p.negativeControl.check.pass,false);
});

test('insufficient finite asymptotic remainder budget fails instead of reporting convergence',()=>{
  assert.throws(()=>encloseNormalizedHeatMoments({...request,maxTerms:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>encloseNormalizedHeatMoments({...request,h:{lower:'1/4',upper:'1/2'},maxTerms:2}),{code:'RESOURCE_LIMIT'});
});

test('invalid rational domains and impossible precision are rejected',()=>{
  for(const input of [{...request,h:point('-1')},{...request,h:point('2')},{...request,argument:point('-1/64')},{...request,argument:point('1/8')},
    {...request,h:{lower:'1/2',upper:'1/4'}},{...request,h:{lower:0,upper:0.5}},{...request,tolerance:1e-15},{...request,maxTerms:0}])
    assert.throws(()=>encloseNormalizedHeatMoments(input),{code:'INVALID_INPUT'});
  assert.throws(()=>encloseNormalizedHeatMoments({...request,tolerance:'1/'+(1n<<220n)}),{code:'PRECISION_REQUIRED'});
});

test('cancelled evaluation never produces a successful enclosure',()=>{
  assert.throws(()=>encloseNormalizedHeatMoments(request,{checkCancelled(){throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
});

test('generic reports, supplied parameters and copied-looking source objects cannot certify the member',()=>{
  assert.throws(()=>attachActualHeatScaledEnclosure(encloseNormalizedHeatMoments(request)),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualHeatScaledEnclosure({pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const input of [{h:0},{argument:0},{ellExact:'1'},{delta:'1/4'},{wholeGNUMComplete:true},[]])
    assert.throws(()=>prepareActualHeatScaledEnclosure(input),{code:'INVALID_INPUT'});
});
