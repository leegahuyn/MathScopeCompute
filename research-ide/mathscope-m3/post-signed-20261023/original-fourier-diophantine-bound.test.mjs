import test from 'node:test';
import assert from 'node:assert/strict';
import {exactOriginalTwoTorusSmallDivisor as small,exactOriginalFourierTailTheorem as tail}
  from './original-fourier-diophantine-bound.mjs';
test('original 2-torus exact irrational algebraic identity and nonzero integer norm for all finite sampled modes',()=>{
 for(let k0=-18;k0<=18;k0++)for(let k1=-18;k1<=18;k1++){
   if(!k0&&!k1)continue;
   const x=small(k0,k1),a=BigInt(x.quadratic.integerA),b=BigInt(x.quadratic.integerB),N=BigInt(x.maxFrequency);
   assert.equal(a*a-2n*b*b,BigInt(x.quadratic.integerNorm));
   assert.ok(BigInt(x.quadratic.integerNorm)!==0n);
   assert.ok((a<0n?-a:a)<=2n*N);
   assert.ok((b<0n?-b:b)<=N);
   assert.equal(x.floatingPointResonanceTestUsed,false);
 }
});
test('arbitrarily large integral Fourier vectors keep exact BigInt norm and do not overflow JS floating point',()=>{
 const x=small('123456789123456789123456789','-987654321987654321987654321');
 assert.equal(x.quadratic.integerNormNonzero,true);
 assert.equal(x.floatingPointResonanceTestUsed,false);
});
test('zero Haar mode is rejected, not divided by zero',()=>assert.throws(()=>small(0,0),{code:'ZERO_TORUS_MODE'}));
test('unsafe binary64 Fourier coordinates are rejected',()=>assert.throws(()=>small(Number.MAX_SAFE_INTEGER+1,1),{code:'UNSAFE_FOURIER_MODE'}));
test('source tail for each fixed derivative order includes four additional input derivatives',()=>{
 for(const n of [0,1,2,3,7,12,25]){
   const x=tail(n,16);
   assert.equal(x.requiredSourceDerivativeOrder,n+4);
   assert.equal(x.allOrderUniformConstantsAndLossesProved,false);
   assert.equal(x.originalActualSourceCNormUpperEvaluated,false);
   assert.equal(x.oneFixedOutputOrderConditionalBound,true);
 }
});
test('cutoff reciprocal remains exact for unbounded positive integer K',()=>{
 const x=tail(4,'10000000000000000000000001');
 assert.match(x.conditionalUpperBound,/10000000000000000000000001/);
 assert.equal(x.allModesOutsideFiniteCutoffRetained,true);
});
test('zero and negative cutoffs are rejected',()=>{
 assert.throws(()=>tail(1,0),{code:'INVALID_FOURIER_CUTOFF'});
 assert.throws(()=>tail(1,-1),{code:'INVALID_FOURIER_CUTOFF'});
});
test('negative and fractional derivative orders are rejected',()=>{
 assert.throws(()=>tail(-1,2),{code:'INVALID_DERIVATIVE_ORDER'});
 assert.throws(()=>tail(0.5,2),{code:'INVALID_DERIVATIVE_ORDER'});
});
