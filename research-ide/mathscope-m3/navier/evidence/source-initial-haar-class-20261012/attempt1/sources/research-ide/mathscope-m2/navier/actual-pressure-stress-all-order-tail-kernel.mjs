/** Exact finite Gaussian/coordinate recurrences for the original n=1
 * terminal stress. The derivative order is not a theorem cap; the caller
 * supplies an explicit work budget and every requested term is retained.
 * This algebra authenticates no source stress, total moment or cutoff.
 */
import {fail} from './actual-continuation-arithmetic.mjs';

export function allFiniteTerminalGaussianRules({derivativeOrder=2,maxWork=200000}={}){
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||!Number.isSafeInteger(maxWork)||maxWork<1)
    fail('INVALID_INPUT','Use a nonnegative finite derivative order and positive finite recurrence-work budget.');
  const m=derivativeOrder,requiredWork=2*(m+1)*(m+2);
  if(!Number.isSafeInteger(requiredWork)||requiredWork>maxWork)
    fail('RESOURCE_LIMIT','The finite Gaussian and coordinate recurrences exceed the declared work budget. No derivative was dropped.');
  const abs=c=>c<0n?-c:c,laurent=[];let current=new Map([[-6,1n]]),operations=0;
  for(let j=0;j<=m;j++){
    const coefficients=[...current].filter(([,c])=>c).sort((a,b)=>a[0]-b[0]);
    laurent.push({derivativeOrder:j,pole:6+3*j,coefficients:coefficients.map(([p,c])=>[p,String(c)]),
      absoluteCoefficientSum:String(coefficients.reduce((total,[,c])=>total+abs(c),0n))});
    if(j===m)break;
    const next=new Map(),add=(p,c)=>{next.set(p,(next.get(p)??0n)+c);operations++;};
    for(const[p,c]of current){add(p-1,BigInt(p)*c);add(p-3,8n*c);}current=next;
  }
  const stirling=Array.from({length:m+1},(_,r)=>Array(r+1).fill(0n));stirling[0][0]=1n;
  for(let r=1;r<=m;r++)for(let j=1;j<=r;j++){
    stirling[r][j]=(stirling[r-1][j-1]??0n)+BigInt(r-1)*(stirling[r-1][j]??0n);operations++;
  }
  const checks={positiveIntegratingFactor:8n*16n-3n===125n,threePowersGained:6-3===3,
    fullHighestPole:laurent.every(row=>row.coefficients[0][0]===-row.pole&&BigInt(row.coefficients[0][1])===8n**BigInt(row.derivativeOrder)),
    fullCoordinateRows:stirling.length===m+1&&stirling.every((row,r)=>row[r]===1n)};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','The all-finite original Gaussian recurrence failed.');
  return {schema:'MathScope.AllFiniteTerminalGaussianRules/1',derivativeOrder:m,mathematicalDerivativeOrderCap:null,
    seed:'E(delta)=exp(-4/delta^2), with its actual flat extension at delta=0',deltaInterval:['0','1/4'],laurent,
    derivativeRule:'d_delta(E*Q)=E*(Q_prime+8*delta^-3*Q)',
    induction:'The Leibniz rule maps every finite Laurent polynomial Q to Q_prime+8*delta^-3*Q. Starting from Q=delta^-6 generates the exact derivative for every finite order. The highest pole grows by3, with coefficient8^j; no sampled list substitutes for this recurrence.',
    integration:{identity:'d_delta(E*delta^-3)=E*delta^-6*(8-3*delta^2)',positiveFactorLower:'125/16',integralUpperFactor:'16/125',
      inequality:'Integral_0^delta E(u)*u^-6 du <= (16/125)*E(delta)*delta^-3',
      endpoint:'For every fixed real p, exp(-4/delta^2)*delta^-p tends to0 at delta=0.'},
    ordinaryXConversion:{identity:'partial_X^r=(-1)^r*X^-r*sum_j unsignedStirlingFirst(r,j)*partial_delta^j',
      unsignedStirlingFirst:stirling.map(row=>row.map(String)),
      induction:'Differentiate X^-r once and use partial_X=-X^-1*partial_delta; the coefficient recurrence is c(r+1,j)=c(r,j-1)+r*c(r,j).'},
    work:{requiredWork,operations,maxWork},checks,pass:true,sourceAuthenticated:false,numericalQuadrature:false,newLeanKernelProof:false};
}
