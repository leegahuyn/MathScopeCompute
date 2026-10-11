import test from 'node:test';
import assert from 'node:assert/strict';
import {encloseSigmaSquareIntegral,attachActualCutoffMassEnclosure,actualCutoffMassEnclosure,assertActualCutoffMassEnclosure} from '../actual-cutoff-mass-enclosure.mjs';
import {readRational,rational,qadd,qsub,qcompare} from '../actual-continuation-arithmetic.mjs';

const q=readRational,le=(a,b)=>qcompare(q(a),q(b))<=0;
const value=x=>{const [n,d]=q(x);return Number(n)/Number(d);};
let standard;
test('original sigma-square integral: positive exact enclosure and separate rigorous width budgets',()=>{
  standard=encloseSigmaSquareIntegral();
  assert.equal(standard.pass,true);assert.equal(standard.sourceAuthenticated,false);
  assert.ok(le('47/100',standard.integral.lower)&&le(standard.integral.upper,'12/25'));
  assert.ok(qcompare(q(standard.integralWidth),rational(0))>0);
  assert.equal(qcompare(qsub(q(standard.integral.upper),q(standard.integral.lower)),q(standard.integralWidth)),0);
  const b=standard.errorBudget;
  assert.equal(qcompare(qadd(q(b.quadratureWidth),q(b.arithmeticAndElementaryWidth)),q(b.totalWidth)),0);
  assert.equal(qcompare(qadd(q(b.taylorWidth),q(b.endpointTailWidth)),q(b.quadratureWidth)),0);
  assert.ok(le(b.quadratureWidth,b.quadratureAllocation)&&le(b.arithmeticAndElementaryWidth,b.arithmeticAllocation));
  assert.ok(le(b.totalWidth,b.tolerance));assert.equal(standard.proof.taylorDegree,7);assert.equal(standard.proof.wholeCellDerivativeOrder,8);
  assert.equal(standard.proof.wholeCellJetsAreIntervals,true);assert.ok(le(standard.proof.delta,'1/2'));
  assert.ok(qcompare(q(standard.proof.delta),rational(0))>0&&qcompare(q(standard.proof.endpointTailUpper),rational(0))>0);
});

test('independent direct sigma-square Simpson diagnostic agrees; it is not the certified error bound',()=>{
  // This evaluates sigma^2 directly on the whole [0,1], without the reflected
  // product, jets, exp implementation, or exact reduction used by production.
  const n=32768,sigma=x=>x===0?0:x===1?1:1/(1+Math.exp(1/(x*x)-1/((1-x)*(1-x))));
  let sum=1;
  for(let k=1;k<n;k++){const x=sigma(k/n);sum+=(k%2?4:2)*x*x;}
  const diagnostic=sum/(3*n);
  assert.ok(diagnostic>=value(standard.integral.lower)-2e-15&&diagnostic<=value(standard.integral.upper)+2e-15);
});

test('tighter rational tolerance recomputes the actual remainder and overlaps the lower precision result',()=>{
  const result=encloseSigmaSquareIntegral({precisionBits:256,tolerance:'3/1000000000000000',maxCells:1024});
  assert.ok(le(result.integralWidth,'3/1000000000000000'));
  assert.ok(le(result.integralWidth,standard.integralWidth));
  assert.ok(le(standard.integral.lower,result.integral.upper)&&le(result.integral.lower,standard.integral.upper));
  assert.ok(result.cells>standard.cells);assert.ok(result.history.slice(0,-1).every(x=>!x.quadPass));
  assert.equal(result.arithmetic.binary64UsedForDecisions,false);
});

test('underflow keeps a positive exponential upper bound and finite precision remains honest',()=>{
  const result=encloseSigmaSquareIntegral({precisionBits:96,tolerance:'1/100000000',maxCells:256});
  assert.ok(result.arithmetic.elementary.positiveTinyUpperBounds>0);
  assert.ok(qcompare(q(result.errorBudget.arithmeticAndElementaryWidth),rational(0))>0);
  assert.ok(qcompare(q(result.errorBudget.endpointTailWidth),rational(0))>0);
  assert.ok(le(result.integralWidth,result.request.tolerance));
  assert.ok(le(result.integral.lower,standard.integral.upper)&&le(standard.integral.lower,result.integral.upper));
});

test('invalid tolerances, precision, invented bounds, and over-budget integration fail explicitly',()=>{
  for(const input of [{tolerance:1e-10},{tolerance:'0'},{tolerance:'-1/2'},{tolerance:'2'},{tolerance:'1/0'},
    {precisionBits:64},{precisionBits:513},{maxCells:3},{maxCells:6},{maxCells:8192},{coefficientBounds:'1'},{pass:true}])
    assert.throws(()=>encloseSigmaSquareIntegral(input),error=>error.code==='INVALID_INPUT');
  assert.throws(()=>encloseSigmaSquareIntegral({precisionBits:96,tolerance:'1/10000000000000000000000000000'}),error=>error.code==='PRECISION_REQUIRED');
  assert.throws(()=>encloseSigmaSquareIntegral({maxCells:4}),error=>error.code==='RESOURCE_LIMIT');
});

test('cancellation cannot return a partly computed certified result',()=>{
  let calls=0;
  assert.throws(()=>encloseSigmaSquareIntegral({}, {checkCancelled(){if(++calls===3)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),error=>error.code==='CANCELLED');
  assert.equal(calls,3);
});

test('generic/copy receipts, caller sources and unsupported factory members are not actual source tokens',async()=>{
  assert.throws(()=>assertActualCutoffMassEnclosure(standard),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');
  assert.throws(()=>assertActualCutoffMassEnclosure({...standard,sourceAuthenticated:true}),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');
  await assert.rejects(attachActualCutoffMassEnclosure({}),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');
  await assert.rejects(actualCutoffMassEnclosure({ellExact:'2'}),error=>error.code==='RESOURCE_LIMIT');
  await assert.rejects(actualCutoffMassEnclosure({sourceProfile:'invented'}),error=>error.code==='UNSUPPORTED');
  await assert.rejects(actualCutoffMassEnclosure({matrix:[1,2]}),error=>error.code==='INVALID_INPUT');
});
