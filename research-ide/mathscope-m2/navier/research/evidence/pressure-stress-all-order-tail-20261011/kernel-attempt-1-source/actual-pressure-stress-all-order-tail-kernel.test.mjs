import test from 'node:test';
import assert from 'node:assert/strict';
import {allFiniteTerminalGaussianRules} from '../actual-pressure-stress-all-order-tail-kernel.mjs';
import {assertActualPressureStressPhysicalSeminorms,attachActualPressureStressPhysicalSeminorms} from '../actual-pressure-stress-all-order-tail.mjs';

const factorial=n=>{let p=1n;for(let j=2;j<=n;j++)p*=BigInt(j);return p;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const rising=(n,k)=>{let p=1n;for(let j=0;j<k;j++)p*=BigInt(n+j);return p;};
const falling=(n,k)=>{let p=1n;for(let j=0;j<k;j++)p*=BigInt(n-j);return p;};

test('arbitrary finite Gaussian derivatives include order17 with no mathematical cap16',()=>{
  const r=allFiniteTerminalGaussianRules({derivativeOrder:17});assert.equal(r.pass,true);
  assert.equal(r.laurent.length,18);assert.equal(r.laurent[17].pole,57);
  assert.equal(r.mathematicalDerivativeOrderCap,null);assert.equal(r.sourceAuthenticated,false);
  assert.equal(r.newLeanKernelProof,false);assert.ok(Object.values(r.checks).every(Boolean));
  assert.ok(r.work.operations<=r.work.requiredWork&&r.work.requiredWork<=r.work.maxWork);
});

test('a separate exponential Bell derivative calculation checks every exact Laurent row at delta=1/5',()=>{
  const m=20,r=allFiniteTerminalGaussianRules({derivativeOrder:m}),expDerivative=[1n];
  const gDerivative=k=>-100n*((k%2)?-1n:1n)*BigInt(k+1)*5n**BigInt(k)*factorial(k);
  for(let n=1;n<=m;n++){
    let value=0n;for(let k=0;k<n;k++)value+=choose(n-1,k)*gDerivative(k+1)*expDerivative[n-1-k];
    expDerivative.push(value);
  }
  for(let n=0;n<=m;n++){
    let product=0n;for(let j=0;j<=n;j++)product+=choose(n,j)*expDerivative[j]*((n-j)%2?-1n:1n)*rising(6,n-j)*5n**BigInt(6+n-j);
    const laurent=r.laurent[n].coefficients.reduce((total,[power,coefficient])=>total+BigInt(coefficient)*5n**BigInt(-power),0n);
    assert.equal(laurent,product,'derivative '+n);
  }
});

test('all Stirling coordinate conversion rows recover direct derivatives of X^23',()=>{
  const m=20,r=allFiniteTerminalGaussianRules({derivativeOrder:m});
  for(let n=0;n<=m;n++){
    const converted=(n%2?-1n:1n)*r.ordinaryXConversion.unsignedStirlingFirst[n].reduce((total,c,j)=>total+BigInt(c)*(-23n)**BigInt(j),0n);
    assert.equal(converted,falling(23,n),'radial derivative '+n);
  }
});

test('finite work exhaustion is explicit and an incomplete derivative family cannot pass',()=>{
  assert.throws(()=>allFiniteTerminalGaussianRules({derivativeOrder:17,maxWork:100}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>allFiniteTerminalGaussianRules({derivativeOrder:-1}),{code:'INVALID_INPUT'});
  assert.throws(()=>allFiniteTerminalGaussianRules({derivativeOrder:1.5}),{code:'INVALID_INPUT'});
});

test('generic recurrence success supplies no authority to manufacture an actual source seminorm',()=>{
  const fake={scope:{actualPressureStressPhysicalSeminorms:true},n1Weighted:{rules:allFiniteTerminalGaussianRules({derivativeOrder:17})}};
  assert.throws(()=>assertActualPressureStressPhysicalSeminorms(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>attachActualPressureStressPhysicalSeminorms(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
