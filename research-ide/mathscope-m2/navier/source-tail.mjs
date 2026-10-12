import {point,iadd,isub,imul,iscale,iexp,jconst,jvar,jadd,jsub,jdiv,jexp} from '../../mathscope-m1/navier/numerics.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const factorial=n=>{let a=1;for(let k=2;k<=n;k++)a*=k;return a;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const box=(x,name)=>{if(typeof x==='number'&&Number.isFinite(x))return point(x);if(!Array.isArray(x)||x.length!==2||!x.every(Number.isFinite)||x[0]>x[1])fail(name+' must be a finite real interval.');return x.slice();};
const cbox=(x,name)=>{if(x&&typeof x==='object'&&!Array.isArray(x)){if(Object.keys(x).some(k=>!['re','im'].includes(k)))fail('Only re/im complex interval fields are supported.');return {re:box(x.re,name+'.re'),im:box(x.im??0,name+'.im')};}return {re:box(x,name),im:point(0)};};
const cadd=(a,b)=>({re:iadd(a.re,b.re),im:iadd(a.im,b.im)}),cscale=(a,s)=>({re:imul(a.re,s),im:imul(a.im,s)});
const vzero=()=>Array.from({length:3},()=>({re:point(0),im:point(0)}));
const maximumAbs=a=>Math.max(Math.abs(a[0]),Math.abs(a[1]));

/** A smooth explicit local operator probe, not a source growing-mode solution. */
export function defaultTailJet(derivativeOrder=2){
  if(!Number.isInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>8)fail('The installed finite tail jet order is 0..8.');
  const n=derivativeOrder+1,v=jvar(point(.5),n),one=jconst(1,n),rate=jsub(jdiv(one,jsub(one,v)),jdiv(one,v)),psi=jdiv(one,jadd(one,jexp(rate))),psiDerivatives=psi.map((x,i)=>iscale(x,factorial(i)));
  const forcing=Array.from({length:derivativeOrder+1},(_,i)=>[i<3?(i===0?.2:i===1?.1:.05):0,{re:i===0?-.3:i===1?.2:0,im:i<2?.05:0},i===0?.15:0]),amplitude=Array.from({length:derivativeOrder+1},(_,i)=>[{re:iscale(iexp(point(.5)),.01),im:i<2?.02:0},i===0?.02:i===1?-.01:0,i===0?-.015:i===1?.02:0]);
  return {derivativeOrder,variable:'v',point:.5,psiDerivatives,forcingDerivatives:forcing,amplitudeDerivatives:amplitude,definition:'psi(v)=1/(1+exp(1/(1-v)-1/v)) on 0<v<1, extended by one/zero. Explicit polynomial forcing and exp/polynomial amplitude jets.',inputRole:'EXPLICIT_SMOOTH_OPERATOR_PROBE',actualSourcePulse:false};
}

/** Full differentiated (7.40), including every derivative of psi and psi-prime. */
export function evaluatePulseCutoffRemainder(input=defaultTailJet(),{omitPsiPrime=false,omitForcing=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('A local cutoff/forcing/amplitude derivative jet is required.');
  const m=input.derivativeOrder??2;if(!Number.isSafeInteger(m)||m<0||m>8)fail('The installed finite tail jet order is 0..8.');
  const psi=input.psiDerivatives;if(!Array.isArray(psi)||psi.length!==m+2)fail('psiDerivatives must include orders 0 through m+1; the last derivative cannot be omitted.');
  const p=psi.map((x,k)=>box(x,'psi derivative '+k));if(p[0][0]<0||p[0][1]>1)fail('The cutoff value must lie in [0,1].');
  const vectors=(rows,name)=>{if(!Array.isArray(rows)||rows.length!==m+1)fail(name+' must include orders 0 through m.');return rows.map((row,k)=>{if(!Array.isArray(row)||row.length!==3)fail(name+' order '+k+' needs three complex vector components.');return row.map((x,i)=>cbox(x,name+'['+k+']['+i+']'));});};
  const f=vectors(input.forcingDerivatives,'forcingDerivatives'),t=vectors(input.amplitudeDerivatives,'amplitudeDerivatives'),rows=[];
  for(let k=0;k<=m;k++){
    let forcing=vzero(),cutoffDerivative=vzero();
    for(let j=0;j<=k;j++){
      const oneMinusPsi=j===0?isub(point(1),p[0]):iscale(p[j],-1),a=iscale(oneMinusPsi,choose(k,j)),b=iscale(p[j+1],choose(k,j));
      forcing=forcing.map((x,i)=>cadd(x,cscale(f[k-j][i],a)));cutoffDerivative=cutoffDerivative.map((x,i)=>cadd(x,cscale(t[k-j][i],b)));
    }
    const residual=forcing.map((x,i)=>cadd(omitForcing?{re:point(0),im:point(0)}:x,omitPsiPrime?{re:point(0),im:point(0)}:cutoffDerivative[i]));
    rows.push({derivativeOrder:k,forcingTail:forcing,cutoffDerivativeTail:cutoffDerivative,residual,sourcePaths:{forcing:Array.from({length:k+1},(_,j)=>`results.cutoffRemainder.inputJet.forcingDerivatives[${j}]`),amplitude:Array.from({length:k+1},(_,j)=>`results.cutoffRemainder.inputJet.amplitudeDerivatives[${j}]`),cutoff:Array.from({length:k+2},(_,j)=>`results.cutoffRemainder.inputJet.psiDerivatives[${j}]`)},componentAbsUpper:residual.map(x=>maximumAbs(x.re)+maximumAbs(x.im))});
  }
  return {schema:'MathScope.ActualPulseCutoffResidualJet/1',sourceEquation:'7.40',retainedRemainder:'(1-psi)*f_m + psi_prime*t_m',derivativeFormula:'D^k tail = sum_j binom(k,j) [D^j(1-psi)*D^(k-j) f_m + D^(j+1)psi*D^(k-j)t_m]',inputJet:{derivativeOrder:m,psiDerivatives:p,forcingDerivatives:f,amplitudeDerivatives:t,variable:input.variable??'supplied scalar derivative variable',point:input.point??null,inputRole:input.inputRole??'DECLARED_LOCAL_JET'},rows,allTermsRetained:!omitPsiPrime&&!omitForcing,sourceInstanceCertified:false,allOrderSourceCertificate:false,actualSourcePulseEvaluated:false,dyadicFamilyBinding:null,residualVsEnvelopeComparisonPerformed:false,scope:'Outward interval linear differential operator on supplied local jets. This local probe and the independent conditional Gaussian envelope are not bound to one source family or a specific ell, and no residual-versus-envelope comparison is performed.'};
}
