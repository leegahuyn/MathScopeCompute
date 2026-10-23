/**
 * Exact algebraic small-divisor certificate for ORIGINAL v_t=(sqrt(2)-1,1).
 *
 * For k=(k0,k1)!=(0,0), write a=k1-k0, b=k0. Then
 * (a+b sqrt(2))(a-b sqrt(2))=a^2-2b^2 in Z\{0}.
 * Hence |v_t.k|^{-1} <= |a|+sqrt(2)|b|
 * <= (2+sqrt(2))*max(|k0|,|k1|).
 *
 * For source torus C_(d+4), cutoff K>=1 and derivative order d:
 * ||N^{-1}(F-Haar F)-S_K||_{C^d}
 * <= 8(2+sqrt(2)) C_(d+4) / ((2pi)^5 K).
 *
 * THIS MODULE DOES NOT CLAIM THAT C_(d+4) WAS EVALUATED FOR THE ORIGINAL
 * 4M-NODE CORRECTION, OR THAT ALL ORDERS d ARE UNIFORMLY CONTROLLED.
 */
export const DIAPHANTINE_SCHEMA='MathScope.N6.OriginalTwoTorusSmallDivisorBound/1';
const fail=(code,msg)=>{throw Object.assign(new Error(msg),{code});};
const abs=x=>x<0n?-x:x;
function asInteger(x){if(typeof x==='bigint')return x;
  if(typeof x==='number'&&Number.isSafeInteger(x))return BigInt(x);
  if(typeof x==='string'&&/^-?(?:0|[1-9][0-9]*)$/.test(x))return BigInt(x);
  fail('UNSAFE_FOURIER_MODE','Fourier mode integer must be exact BigInt or safe integer.');
}
export function exactOriginalTwoTorusSmallDivisor(k0,k1){
 const x=asInteger(k0),y=asInteger(k1);
 if(x===0n&&y===0n)fail('ZERO_TORUS_MODE','The original Haar zero mode must never be inverted.');
 const a=y-x,b=x,norm=a*a-2n*b*b;
 if(norm===0n||abs(norm)<1n)
   fail('INVALID_ALGEBRAIC_NORM','Nonzero original irrational frequency must have nonzero integer norm.');
 const N=abs(x)>abs(y)?abs(x):abs(y);
 return {schema:DIAPHANTINE_SCHEMA,mode:[String(x),String(y)],quadratic:{
   integerA:String(a),integerB:String(b),integerNorm:String(norm),
   integerNormNonzero:true,integerNormMagnitudeAtLeastOne:true},
   maxFrequency:String(N),direction:['sqrt(2)-1','1'],
   certifiedIdentity:'(a+b*sqrt(2))*(a-b*sqrt(2))=a^2-2*b^2',
   certifiedInverseBound:'1/abs((sqrt(2)-1)*k0+k1)<=abs(k1-k0)+sqrt(2)*abs(k0)<=(2+sqrt(2))*N',
   floatingPointResonanceTestUsed:false,
   sourceDerivativeBoundEvaluated:false};
}
export function exactOriginalFourierTailTheorem(order,cutoff){
 if(!Number.isSafeInteger(order)||order<0||order>1000000)
   fail('INVALID_DERIVATIVE_ORDER','A concrete nonnegative derivative order is required.');
 const K=asInteger(cutoff);
 if(K<1n)fail('INVALID_FOURIER_CUTOFF','Original Fourier cutoff K must be >=1.');
 return {schema:'MathScope.N6.OriginalTorusAllFixedOrdersTailTheorem/1',
   derivativeOrder:order,requiredSourceDerivativeOrder:order+4,
   cutoff:String(K),exactLatticeShell:'max-norm shell n contains 8*n lattice points',
   exactSummableSeries:'sum_{n>K} n^{-2} <= 1/K',
   conditionalUpperBound:'8*(2+sqrt(2))*C_'+(order+4)+'/((2*pi)^5*'+K+')',
   allModesOutsideFiniteCutoffRetained:true,
   oneFixedOutputOrderConditionalBound:true,
   originalActualSourceCNormUpperEvaluated:false,
   allOrderUniformConstantsAndLossesProved:false,
   originalAtoDIterationCertified:false,
   originalFinalField67NumericCertified:0};
}
