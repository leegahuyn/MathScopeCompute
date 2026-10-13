/** Uniform mixed slow/fast Gaussian calculus for the original moving frame.
 * This module proves a finite-order bound from explicit analytic premises.
 * A source adapter must authenticate the same common background constants,
 * stable propagator and primitive lower bounds for every actual label.
 */
import {homogeneousPulseGaussianPowerAudit} from './actual-pulse-gaussian-power-kernel.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const choose=(n,j)=>factorial(n)/(factorial(j)*factorial(n-j));
const reserve=n=>n<=1n?0:(n-1n).toString(2).length;
const plus=(a,b)=>a===null||b===null?null:a+b;
const sumPowers=xs=>{const p=xs.filter(x=>x!==null);return p.length?Math.max(...p)+reserve(BigInt(p.length)):null;};
const leibniz=(a,b,m)=>sumPowers(Array.from({length:m+1},(_,j)=>{const p=plus(a[j],b[m-j]);return p===null?null:p+reserve(choose(m,j));}));

/** Each M_j bounds EVERY derivative word of length j, including mixed
 * words. The differentiated equation uses the same stable propagator as
 * order zero. Only positive derivative matrices enter the Duhamel source.
 * L<=Lmax*S<=B*S is used once per slow differentiation stage.
 */
export function stableMixedVolterraPowerRecurrence({matrixPowers,order}={}){
  if(!Number.isSafeInteger(order)||order<0||!Array.isArray(matrixPowers)||matrixPowers.length<order+1||
    matrixPowers.some(x=>x!==null&&(!Number.isSafeInteger(x)||x<0)))
    fail('INVALID_INPUT','Supply a finite total-order matrix bound including order zero.');
  const powers=[0],rows=[];
  for(let m=1;m<=order;m++){
    const slowTerms=Array.from({length:m},(_,j)=>{
      const k=j+1,p=plus(matrixPowers[k],powers[m-k]);
      return {matrixOrder:k,solutionOrder:m-k,binomial:choose(m,k).toString(),power:p===null?null:p+reserve(choose(m,k))};
    });
    const fastTerms=Array.from({length:m},(_,j)=>{
      const p=plus(matrixPowers[j],powers[m-1-j]);
      return {matrixOrder:j,solutionOrder:m-1-j,binomial:choose(m-1,j).toString(),power:p===null?null:p+reserve(choose(m-1,j))};
    });
    const slowNumerator=sumPowers(slowTerms.map(x=>x.power)),slowPower=slowNumerator===null?null:slowNumerator+1,
      fastPower=sumPowers(fastTerms.map(x=>x.power)),nonzero=[slowPower,fastPower].filter(x=>x!==null),
      power=nonzero.length?Math.max(...nonzero):null;
    powers.push(power);rows.push({order:m,slowTerms,fastTerms,slowPower,fastPower,power,
      integrationLengthPower:1,propagatorPower:m+1,
      slowIdentity:'w_alpha(v)=integral_0^v V(v,s)*sum_(0<beta<=alpha) binom(alpha,beta)*M_beta(s)*w_(alpha-beta)(s) ds',
      fastIdentity:'D_slow^alpha D_v^(b+1)w=D_slow^alpha D_v^b(Mw); every right-hand solution derivative has smaller total order.'});
  }
  return {schema:'MathScope.StableMixedVolterraPowers/1',order,powers,rows,
    estimate:'Every slow/fast derivative word of total length m satisfies ||D^m w||_infinity <= W^(m+1)*(B*S)^powers[m].',
    premises:['S>=1, B>=max(2,Lmax), W>=1, L<=Lmax*S.',
      'The SAME original homogeneous initial datum is independent of all slow coordinates.',
      'The original propagator obeys ||V(v,s)||<=W for 0<=s<=v<=L.',
      'Every actual mixed coefficient derivative of order j has induced infinity norm <=(B*S)^matrixPowers[j].'],
    proof:'Induct on total order. A word with a fast derivative is handled by the differentiated ODE. A purely slow word uses Duhamel and its zero initial derivative; count all subsets of each length with binomial(m,j). W^(m-j+2)<=W^(m+1) when j>=1. The interval contributes one B*S. No order-dependent growth exp(L) is introduced.',
    exponentialInBandIntroduced:false,sourceAuthenticated:false,pass:true};
}

/** Lift the independently retained original matrix-operation ledger from
 * v derivatives to bounds for every mixed derivative word. Original F,
 * F_R and G_R now have their ACTUAL nonzero slow derivatives. Frozen c0,
 * lambda0, u and the representative remain constants in slow variables.
 * Every lifted row still follows the identical algebraic operation DAG.
 */
export function allOrderMixedGaussianJetPowerAudit(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('INVALID_INPUT','Only a finite derivative order and work budget select this generic calculus.');
  const order=input.order??2,maxWork=input.maxWork??20000;
  const original=homogeneousPulseGaussianPowerAudit({order,maxWork}),size=order+2,map=new Map(),rows=[];
  const profileNames=new Set(['original F','original F_R','original G_R']);
  const at=(name)=>{const p=map.get(name);if(!p)fail('INTERNAL_VALIDATION','A mixed jet ledger dependency is absent: '+name);return p;};
  for(const r of original.rows){
    let p;
    if(r.rule==='v-independent source operand'){
      p=profileNames.has(r.label)?Array(size).fill(1):r.label==='original R'?[1,0,...Array(size-2).fill(null)]:[...r.powers];
    }else if(r.rule==='affine in v; every derivative of order at least two is zero'){
      // n is affine only in v. Its slow coefficients need not be affine.
      // The original n=(x0-v*H_R,p/R,pz-epsilon*v*H_Z) and C_(m+2)
      // give the displayed safe B^(m+16)*S bound, with all factorials in B.
      p=r.label.startsWith('original n_')?Array.from({length:size},(_,j)=>j+16):[...r.powers];
    }else if(r.rule==='triangle inequality, including finite sum count'){
      p=Array.from({length:size},(_,j)=>sumPowers(r.inputs.map(x=>at(x)[j])));
    }else if(r.rule==='ordinary Leibniz rule with every binomial coefficient'){
      p=Array.from({length:size},(_,j)=>leibniz(at(r.inputs[0]),at(r.inputs[1]),j));
    }else if(r.rule==='differentiate a*(1/a)=1; divide by the unchanged positive absolute lower bound'){
      const a=at(r.inputs[0]);p=[r.lowerPower];
      for(let m=1;m<size;m++){
        const v=sumPowers(Array.from({length:m},(_,i)=>{const j=i+1,t=plus(a[j],p[m-j]);return t===null?null:t+reserve(choose(m,j));}));
        p.push(v===null?null:v+r.lowerPower);
      }
    }else if(r.rule==='differentiate sqrt(a)^2=a; retain all middle products and the positive square-root lower bound'){
      const a=at(r.inputs[0]);p=[Math.ceil(a[0]/2)];
      for(let m=1;m<size;m++){
        const v=sumPowers([a[m],...Array.from({length:m-1},(_,i)=>{const j=i+1,t=plus(p[j],p[m-j]);return t===null?null:t+reserve(choose(m,j));})]);
        p.push(v===null?null:v+r.sqrtLowerPower);
      }
    }else if(r.rule==='one derivative shift; last entry is unused in the truncated downstream calculation'){
      p=[...at(r.inputs[0]).slice(1),null];
    }else fail('INTERNAL_VALIDATION','An unrecognized original frame operation cannot acquire a mixed derivative bound.');
    if(p.length!==size||p.some(x=>x!==null&&(!Number.isSafeInteger(x)||x<0)))fail('RESOURCE_LIMIT','The finite mixed derivative power ledger exceeded exact integer capacity.');
    if(map.has(r.label))fail('INTERNAL_VALIDATION','The original operation ledger has a duplicate label.');
    map.set(r.label,p);rows.push({label:r.label,powers:p,originalRule:r.rule,inputs:[...r.inputs],
      nonzeroSlowProfileJetsRetained:profileNames.has(r.label),allMixedWordsOfEachTotalLength:true});
  }
  const matrixRows=[['actual wMatrix 00','original projected matrix 01'],['original projected matrix 10','actual wMatrix 11']],
    frameRows=Array.from({length:3},(_,i)=>Array.from({length:2},(_,j)=>'original B '+i+j)),
    norm=A=>Array.from({length:order+1},(_,j)=>Math.max(...A.map(row=>sumPowers(row.map(name=>at(name)[j]))??0))),
    matrix=norm(matrixRows),frame=norm(frameRows),w=stableMixedVolterraPowerRecurrence({matrixPowers:matrix,order}),
    rho=at('original log P derivative'),P=[0];
  for(let m=0;m<order;m++)P.push(sumPowers(Array.from({length:m+1},(_,j)=>rho[j]+P[m-j]+reserve(choose(m,j)))));
  const Pw=Array.from({length:order+1},(_,m)=>leibniz(P,w.powers,m)),
    t=Array.from({length:order+1},(_,m)=>leibniz(frame,Pw,m));
  if([...matrix,...frame,...P,...Pw,...t].some(x=>!Number.isSafeInteger(x)))fail('INTERNAL_VALIDATION','A required actual frame mixed bound is missing.');
  return {schema:'MathScope.AllOrderMixedGaussianJetPowerAudit/1',order,rows,matrixRows,frameRows,
    powers:{matrix,frame,w:w.powers,P,Pw,t},volterra:w,
    base:'B_m>=max(Bnorm,C_(m+2),(m+2)!,Lmax,2^128), fixed independently of ell, labels and representative; S=ell^2>=1.',
    sourcePremises:{
      background:'Every original slow derivative of F,G through m+2 is bounded by C_(m+2) on the same enlarged source annulus, for the same common recursive cutoff sequence.',
      normal:'n=(x0-v*H_R,p/R,pz-epsilon*v*H_Z), H=p*F+pz*G. Both H_R and H_Z retain all mixed slow derivatives. Frozen p,pz,x0 and their source scales, R^-1 and reference data obey the unchanged Bnorm bounds. epsilon<=1 and 0<=v<=L<=Lmax*S. Leibniz and derivatives of 1/R then give |D^j n_i|<=(B_m*S)^(j+16); the extra power16 retains all finite products and sums.',
      positiveFloors:'The unchanged source has |n_tan|,|n|>=Bnorm^-2, |c0|>=Bnorm^-1 and sqrt(1+sref^2)>=1. These imply the weaker (B_m*S) floors used by the exact reciprocal/sqrt recurrence.',
      frozenReference:'P, c0, lambda0, sref, dref and every frozen representative/carrier are slow independent inside each fixed-label chart; v derivatives of the reference data are retained.',
      stable:'The actual original matrix has mu_infinity(M)<=(2E+Ed)/S; hence its propagator is bounded by fixed W=exp((2E+Ed)*Lmax). Use the original positive Gaussian envelope P(v).'},
    estimate:'For every fixed total slow/fast order m, ||D^m t||_infinity <= W^(m+1)*(B_m*S)^powers.t[m]*P(v). At positive temporal-cutoff derivatives, P(v)<=exp(-a*ell^2) with the SAME a>0.',
    allMixedLeibnizSubsetsCounted:true,initialSlowDerivativesExactlyZero:true,orderDependentQThresholdRequired:false,
    sourceAuthenticated:false,allLabelsAuthenticated:false,physicalWeightDerivativesIncluded:false,numericalValuesComputed:false,pass:true};
}
