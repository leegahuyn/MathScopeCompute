import test from 'node:test';
import assert from 'node:assert/strict';
import {numericalExponentialArithmetic,closedNumericalExponentialEndpoint} from '../actual-numerical-exponential-arithmetic.mjs';
import {rational as Q,qadd,qsub,qmul,qdiv,qcompare,readRational,qtext} from '../actual-continuation-arithmetic.mjs';

const point=q=>[q,q],neg=a=>[[-a[1][0],a[1][1]],[-a[0][0],a[0][1]]],
  plus=(a,b)=>[qadd(a[0],b[0]),qadd(a[1],b[1])],
  product=(a,b)=>{const p=a.flatMap(x=>b.map(y=>qmul(x,y))).sort(qcompare);return [p[0],p[3]];},
  inverse=a=>[qdiv(Q(1),a[1]),qdiv(Q(1),a[0])];

// An independent exact-rational oracle. No elementary operation or
// dyadic endpoint from the implementation is used in this positive
// Taylor sum or its explicit next-term geometric remainder.
function oracleExp(q){
  if(q[0]<0n)return inverse(oracleExp([-q[0],q[1]]));
  assert(qcompare(q,Q(4))<=0);
  let sum=Q(1),term=Q(1);const N=200;
  for(let n=1;n<=N;n++){term=qdiv(qmul(term,q),Q(n));sum=qadd(sum,term);}
  const next=qdiv(qmul(term,q),Q(N+1)),tail=qdiv(next,qsub(Q(1),qdiv(q,Q(N+2))));
  return [sum,qadd(sum,tail)];
}
function encloses(N,x,reference){
  const p=N.regularBounds(x),lo=readRational(p.lower),hi=readRational(p.upper);
  assert(qcompare(lo,reference[0])<=0,'lower endpoint exceeds independent rational lower bound');
  assert(qcompare(hi,reference[1])>=0,'upper endpoint misses independent rational upper bound');
}
const engine=()=>numericalExponentialArithmetic({precisionBits:256});

test('ordinary signed arithmetic encloses independent exact Taylor intervals',()=>{
  const N=engine(),a=N.exp(N.point(Q(1))),b=N.exp(N.point(Q(-1,3))),ea=oracleExp(Q(1)),eb=oracleExp(Q(-1,3));
  encloses(N,a,ea);encloses(N,b,eb);
  encloses(N,N.add(a,b),plus(ea,eb));
  encloses(N,N.sub(a,b),plus(ea,neg(eb)));
  encloses(N,N.sub(b,a),plus(eb,neg(ea)));
  encloses(N,N.mul(a,N.neg(b)),neg(product(ea,eb)));
  encloses(N,N.div(a,b),product(ea,inverse(eb)));
  encloses(N,N.inverse(N.neg(a)),neg(inverse(ea)));
  encloses(N,N.pow(b,-3),oracleExp(Q(1)));
});

test('interval corners preserve both signs and rational exactness',()=>{
  const N=engine(),range=(a,b)=>N.fromClosed({lower:{rational:String(a)},upper:{rational:String(b)}});
  const p=N.toClosed(N.mul(range(-2,3),range(-5,7)));
  assert.deepEqual(p,{lower:{rational:'-15'},upper:{rational:'21'}});
  assert.deepEqual(N.toClosed(N.inverse(range(-4,-2))),{lower:{rational:'-1/2'},upper:{rational:'-1/4'}});
  assert.deepEqual(N.toClosed(N.pow(N.point('-2/3'),3)),{lower:{rational:'-8/27'},upper:{rational:'-8/27'}});
});

test('an unresolved maximum uses lower bounds for its lower endpoint',()=>{
  const N=engine(),log2=N.toClosed(N.log(N.point(2))),
    low=N.fromClosed({lower:log2.lower,upper:log2.lower}),belowTwo=N.exp(low);
  // exp(lower(log 2)) <= 2, while exact comparison deliberately cannot
  // resolve the shared lower-log endpoint at this fixed precision.
  assert.equal(N.compareEndpoints(N.toClosed(belowTwo).lower,{rational:'2'}),null);
  const m=N.toClosed(N.max([belowTwo,N.point(2)]));
  assert(m.lower.rational!==undefined);
  assert(qcompare(readRational(m.lower.rational),Q(2))<=0);
  encloses(N,N.max([belowTwo,N.point(2)]),point(Q(2)));
  assert(N.report().regularFallbacks>0);
});

test('square roots retain zero and use a rigorously positive interval',()=>{
  const N=engine();assert.deepEqual(N.toClosed(N.sqrt(N.zero())),{lower:{rational:'0'},upper:{rational:'0'}});
  const x=N.regularBounds(N.sqrt(N.point(2))),lo=readRational(x.lower),hi=readRational(x.upper);
  assert(qcompare(qmul(lo,lo),Q(2))<=0&&qcompare(qmul(hi,hi),Q(2))>=0);
  const z=N.sqrt(N.fromClosed({lower:{rational:'0'},upper:{rational:'4'}}));
  assert.equal(N.toClosed(z).lower.rational,'0');encloses(N,z,point(Q(2)));
  assert.throws(()=>N.sqrt(N.point(-1)),{code:'PRECISION_REQUIRED'});
});

test('opposite exact exponential endpoints cancel without deleting a nearby difference',()=>{
  const N=engine(),a=N.exp(N.point(1));assert.deepEqual(N.toClosed(N.sub(a,a)),{lower:{rational:'0'},upper:{rational:'0'}});
  const b=N.exp(N.point('1001/1000'));
  encloses(N,N.sub(b,a),plus(oracleExp(Q(1001,1000)),neg(oracleExp(Q(1)))));
  assert.equal(N.compareEndpoints(N.toClosed(N.sub(b,a)).lower,{rational:'0'}),1);
  assert.throws(()=>N.inverse(N.sub(a,a)),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>N.log(N.sub(a,a)),{code:'PRECISION_REQUIRED'});
});

test('huge towers, sums, products, reciprocals and integer rounding stay closed',()=>{
  const N=engine(),a=N.exp(N.exp(N.point(1000))),results=[a,N.add(a,a),N.add(a,N.one()),N.sub(a,N.one()),
    N.mul(a,a),N.pow(a,7),N.inverse(a),N.ceil(a),N.floor(a)];
  for(const r of results){
    const report=N.reportInterval(r,{logCoordinateTolerance:'1/1000000000000'});
    assert(report.toleranceMet&&report.strictlyPositiveLower&&report.finiteUpper);
    assert(closedNumericalExponentialEndpoint(report.lower)&&closedNumericalExponentialEndpoint(report.upper));
    assert.equal(report.originalValueRelativeToleranceGuaranteed,false);
    assert(qcompare(readRational(report.coordinateWidth),Q(1,1000000000000n))<=0);
  }
  assert.deepEqual(N.toClosed(N.log(N.log(a))),{lower:{rational:'1000'},upper:{rational:'1000'}});
  assert(N.report().tinyRatioBounds>0);
});

test('astronomically small positive values retain positive closed endpoints',()=>{
  const N=engine(),T=N.add(N.exp(N.point(1048576)),N.point(10)),h=N.exp(N.neg(N.mul(N.point(8002),T))),
    report=N.reportInterval(h);
  assert(report.small&&report.logarithmCount>=2&&report.strictlyPositiveLower);
  assert.equal(N.compareEndpoints(report.lower,{rational:'0'}),1);
  const materialized=N.regularBounds(h);
  assert.equal(materialized.lower,'0');assert(qcompare(readRational(materialized.upper),Q(0))>0);
  // The zero in this separate finite-dyadic VIEW is never substituted
  // into the closed positive source-scale representation.
  assert(!JSON.stringify(report.lower).includes('"rational":"0"'));
});

test('rational floor and ceiling are exact for both signs',()=>{
  const N=engine();for(const [x,lo,hi] of [['7/3','2','3'],['-7/3','-3','-2'],['4','4','4'],['0','0','0']]){
    assert.equal(N.toClosed(N.floor(N.point(x))).lower.rational,lo);
    assert.equal(N.toClosed(N.ceil(N.point(x))).upper.rational,hi);
  }
  assert.equal(qtext(Q(-7,3)),'-7/3');
});

test('non-numerical endpoints, reversed intervals and exhausted budgets fail closed',()=>{
  const N=engine(),cycle={};cycle.exp=cycle;
  for(const x of [{parameter:'h'},{integral:[]},{rational:'1',source:123},cycle]){
    assert.equal(closedNumericalExponentialEndpoint(x),false);
    assert.throws(()=>N.fromClosed({lower:x,upper:x}),{code:'INVALID_INPUT'});
  }
  assert.throws(()=>N.fromClosed({lower:{rational:'2'},upper:{rational:'1'}}),{code:'INVALID_INPUT'});
  assert.throws(()=>N.inverse(N.fromClosed({lower:{rational:'-1'},upper:{rational:'1'}})),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>N.point([1,2]),{code:'INVALID_INPUT'});
  const tiny=numericalExponentialArithmetic({precisionBits:256,maxOperations:2});
  assert.throws(()=>tiny.add(tiny.exp(tiny.point(2)),tiny.exp(tiny.point(3))),{code:'RESOURCE_LIMIT'});
  assert.equal(N.report().sourceAuthenticated,false);
});

test('the actual endpoint tree obeys the declared nesting budget',()=>{
  const N=numericalExponentialArithmetic({maxDepth:8});let x=N.point(1);
  for(let i=0;i<7;i++)x=N.exp(x);
  assert.equal(N.report().maximumEndpointDepth,8);
  assert(closedNumericalExponentialEndpoint(N.toClosed(x).lower,{maxDepth:8}));
  assert.throws(()=>N.exp(x),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>N.neg(x),{code:'RESOURCE_LIMIT'});
});

test('bounded and repeatedly rotated memoization preserve the uncached numerical endpoint result',()=>{
  const A=numericalExponentialArithmetic({precisionBits:256,maxMemoEntries:0}),B=numericalExponentialArithmetic({precisionBits:256,maxMemoEntries:5000}),
    R=numericalExponentialArithmetic({precisionBits:256,maxMemoEntries:17}),
    compute=N=>{const a=N.exp(N.exp(N.point(12))),b=N.add(a,N.point(3));
      return N.toClosed(N.add(N.mul(b,b),N.div(b,N.add(a,a))));};
  assert.deepEqual(compute(B),compute(A));assert.deepEqual(compute(B),compute(A));
  assert.deepEqual(compute(R),compute(A));assert.deepEqual(compute(R),compute(A));
  assert(R.report().memoEpoch>0);assert(R.report().memoEntries<=17);
  assert(B.report().memoHits>0);assert.equal(A.report().memoHits,0);
  const p=B.point(2);assert(Object.isFrozen(p.lower)&&Object.isFrozen(p.lower.value));
  assert.throws(()=>{p.lower.value[0]=7n;},TypeError);
});
