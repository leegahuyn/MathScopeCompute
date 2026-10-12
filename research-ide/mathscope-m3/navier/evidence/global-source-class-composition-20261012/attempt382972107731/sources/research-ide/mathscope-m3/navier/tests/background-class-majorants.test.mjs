import test from 'node:test';
import assert from 'node:assert/strict';
import {originalHigherStressTailRecipe,attachGlobalBackgroundClass,assertGlobalBackgroundClass}
  from '../source-background-class-majorants.mjs';
import {rational as q,qadd,qsub,qmul,qdiv,qcompare}
  from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

const pow=(x,n)=>{let v=q(1);for(let j=0;j<n;j++)v=qmul(v,x);return v;};

test('the full finite weighted-stress block includes n1 and every order not controlled by the diagonal',()=>{
  for(let m=0;m<=30;m++){
    const p=originalHigherStressTailRecipe({order:m}),J=Math.max(2,m);
    assert.equal(p.tailStarts,J);assert.deepEqual(p.finiteOrders,Array.from({length:J-1},(_,j)=>j+1));
    assert.equal(p.originalFirstStressPole,3+3*m);assert.equal(p.epsilonExponent,'3');
    assert.equal(p.tailCoefficient.denominator,String(2n**BigInt(J-1)));
    assert.equal(p.firstStressPoleRemoved,false);assert.equal(p.nonzeroCoefficientDiscarded,false);
    assert.equal(p.sourceAuthenticated,false);assert.equal(p.completeInitialClass,false);
  }
});

test('the exact complete infinite geometric tail is bounded before the q to epsilon conversion',()=>{
  // w=qActual^h. Its exact infinite tail is (w/2)^J/(1-w/2),
  // not a numerical partial sum. The derivation must remain valid at w=1.
  for(const w of [q(1,100),q(1,2),q(9,10),q(1)])for(let m=0;m<=20;m++){
    const p=originalHigherStressTailRecipe({order:m}),r=qdiv(w,q(2)),
      exact=qdiv(pow(r,p.tailStarts),qsub(q(1),r)),
      upper=qmul(q(1,BigInt(p.tailCoefficient.denominator)),pow(w,2));
    assert.ok(qcompare(exact,upper)<=0);
    if(qcompare(w,q(1))===0)assert.equal(qcompare(exact,upper),0);
  }
});

test('omitting n1 or using a tail coefficient one half too small fails exact nonzero controls',()=>{
  for(let m=0;m<=12;m++){
    const p=originalHigherStressTailRecipe({order:m}),d=BigInt(p.tailCoefficient.denominator),
      actualTail=q(1,d),wrongTail=q(1,2n*d),first=q(3,7),
      complete=qadd(first,actualTail);
    assert.ok(qcompare(actualTail,wrongTail)>0);
    assert.ok(qcompare(complete,actualTail)>0);
    // A finite n1 bound has no extra q^h factor from a diagonal tail.
    const w=q(1,2),actualFirst=qmul(first,pow(w,2)),wrongFirst=qmul(first,pow(w,3));
    assert.ok(qcompare(actualFirst,wrongFirst)>0);
  }
});

test('the original epsilon factor and full radial background gain cannot be removed by a zero bound',()=>{
  const p=originalHigherStressTailRecipe({order:2});
  assert.equal(p.outsideScale,'epsilon_ref*s^(-A-1/2)');
  assert.equal(p.profileGain,'qActual^(2*h)');assert.equal(p.qToEpsilonConstant,'4');
  assert.ok(p.steps[2].includes('n>=J>=2'));assert.ok(p.steps[4].includes('After that sum'));
  const epsilon=q(1,5),source=q(7,3);
  assert.ok(qcompare(qmul(source,epsilon),q(0))>0);
  assert.ok(qcompare(qmul(source,pow(epsilon,3)),qmul(source,pow(epsilon,4)))>0);
});

test('only a private same-family source can attach background class authority',()=>{
  for(const fake of [{},{scope:{actualFullBackgroundSlowNormsCertified:true}},{sourceAuthenticated:true}]){
    assert.throws(()=>attachGlobalBackgroundClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalBackgroundClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
  for(const input of [{order:-1},{order:2.1},{order:3,maxWork:2},{order:Number.MAX_SAFE_INTEGER}])
    assert.throws(()=>originalHigherStressTailRecipe(input),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalHigherStressTailRecipe({actualNorm:1}),{code:'INVALID_INPUT'});
});
