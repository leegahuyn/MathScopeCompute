import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const p = process.argv[2];
assert(p, 'Provide the original mass receipt');
const raw=fs.readFileSync(p),receipt=JSON.parse(raw),S=1n<<128n,N=32768,nn=BigInt(N),T=2n*nn,ceil=(a,b)=>(a+b-1n)/b;
// Independent positive Taylor recurrence for exp(x/64), directed six squarings,
// then rational inversion. It does not use the alternating implementation.
function expNeg(p,q){if(p>=32n*q)return [0n,S>>32n];let den=q*64n,num=1n,d=1n,lower=0n,upper=0n;for(let n=0;n<=31;n++){if(n){num*=p;d*=den*BigInt(n)}let v=S*num/d;if(n<=30){lower+=v;upper+=v+1n}else upper+=2n*(v+1n);}for(let j=0;j<6;j++){lower=lower*lower/S;upper=ceil(upper*upper,S)}return [S*S/upper,ceil(S*S,lower)];}
let lo=0n,hi=0n;for(let i=0n;i<nn;i++){let k=2n*i+1n,[a,b]=expNeg(T*T,k*(T-k));lo+=a;hi+=b;}
// |f'| <= x²e^-x < 16e^-4 <1 on x=1/(u(1-u))>=4.
// Midpoint error <= 1/(4N) for the integral, and /10 for the mass.
const den=10n*nn*S,err=S/4n,lower=lo-err,upper=hi+err;assert(lower>0n);const f=receipt.exact,fl=BigInt(f.lowerNumerator),fu=BigInt(f.upperNumerator),fd=BigInt(f.denominator);assert(lower*fd<fl*den&&upper*fd>fu*den,'independent rigorous enclosure contains both fine bounds');assert(lo*fd>=fl*den&&hi*fd<=fu*den,'the independent midpoint estimate also lies within fine bounds');
console.log(JSON.stringify({status:'PASS_INDEPENDENT_CERTIFIED_MIDPOINT_ENCLOSURE',inputReceiptSHA256:crypto.createHash('sha256').update(raw).digest('hex'),bins:N,bits:128,independentAlgorithm:'positive Taylor exp(x/64), six directed squarings and inversion; global analytic |f prime|<1 midpoint error',lower:lower.toString(),upper:upper.toString(),denominator:den.toString(),fineEnclosureInside:true,independentMidpointInsideFine:true,scope:'Same mathematical mass integral; independent arithmetic/partition enclosure, not an independent audit of the original source graph or support assumptions.'},null,2));
