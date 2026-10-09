import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createLogIntervals} from './log-interval.mjs';
import {Q,qa,qm,qd,qn,qs,parseQ} from './exact-polynomial.mjs';

const read=name=>{const raw=readFileSync(new URL(name,import.meta.url));return {data:JSON.parse(raw),sha256:createHash('sha256').update(raw).digest('hex')};};
const same=(a,b)=>{a=parseQ(a);b=parseQ(b);return a.n*b.d===b.n*a.d;};
const exactRecord=r=>`${r.numerator}/${r.denominator}`;
function exact(v,name){
  if(typeof v!=='string'||v.length>2000||! /^-?\d+(?:\/\d+)?$/.test(v))throw new Error(`${name} must be an exact rational string of at most 2000 characters`);
  const q=parseQ(v);if(q.d<=0n)throw new Error(`${name} needs a positive denominator`);return q;
}
function between(q,a,b,name){if(q.n*a.d<a.n*q.d||q.n*b.d>b.n*q.d)throw new Error(`${name} outside the supported exact interval`);}

/** Evaluate enclosures belonging to the selected analytic source profile.
 * Files are loaded internally; the public input accepts no caller-supplied
 * certificates, interval widths, amplitudes, or theorem-truth flags.
 */
export function evaluateSourceProfileLog(input={}) {
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.getPrototypeOf(input)!==Object.prototype)throw new Error('Input must be a plain JSON object');
  for(const key of Object.keys(input))if(!['phase','coordinate','eta','profile'].includes(key))throw new Error(`Unsupported input: ${key}`);
  const profile=input.profile??'final';
  if(!['final','initial-small-j'].includes(profile))throw new Error('profile must be final or initial-small-j');
  const phase=input.phase??'axis',coordinate=exact(input.coordinate??'4','coordinate'),eta=exact(input.eta??'0','eta');
  between(eta,Q(-1),Q(1),'eta');
  const prefix=read(profile==='final'?'axis-prefix-final.json':'axis-prefix-common-small-j.json'),debt=read(profile==='final'?'uniform-source-debt-final.json':'uniform-source-debt-small-j.json'),axis=read(profile==='final'?'source-axis-cone-refined.json':'source-axis-small-j-trial.json');
  const p=prefix.data.sourceProfileParameters,s=debt.data.singleSourceProfile;
  if(debt.data.sourceFiles.axisCertificate.sha256!==axis.sha256)throw new Error('Source certificate hash mismatch');
  for(const key of ['h','j0','Lambda','sigmaStar','logC'])if(!same(p[key],s[key]))throw new Error(`Source profile mismatch: ${key}`);
  if(prefix.data.status!=='SOURCE_BOUND_INTERVAL_PREFIX_COMPUTED'||debt.data.status!=='ANALYTIC_BOUND_CHAIN_PASSED')throw new Error('Unavailable source profile bounds');
  const T=createLogIntervals(1024),{D}=T,logC=parseQ(s.logC),Tsh=parseQ(s.Tsh),lambda=parseQ(s.Lambda);
  const obs={schema:'MathScope.Navier.SourceLogObservation/1',status:'ENCLOSURE_COMPUTED',profile,phase,coordinate:qs(coordinate),eta:qs(eta),
    sourceProfileHash:prefix.data.sourceProfileHash,sourceFiles:{prefix:prefix.sha256,uniformDebt:debt.sha256,axis:axis.sha256},
    selectedParameters:{h:s.h,j0:s.j0,Lambda:s.Lambda,logC:s.logC,Tsh:s.Tsh,logXR:'log(110)+10*(logC+14)'},
    evidenceGrade:'DIRECTED_INTERVAL_EVALUATION_CONDITIONAL_ON_SOURCE_ANALYTIC_BOUND_CHAIN',
    logCoordinates:{},fieldIntervals:{},gates:{positiveFieldsNeverUnderflowedToZero:true,exactOffsetPreserved:true,binary64ProofDecisions:false,wholeProfileCone:false,generatedAnalyticPremisesKernelChecked:false},
    scope:'Axis intervals include the finite-prefix rounding and infinite radial tail. Transition values are enclosures of the same analytic continuation. Joining values enclose its implicit moment root. No point value inside these enclosures, global stress support, or whole-profile theorem is asserted.'};
  const box=x=>({exact:D.pack(x),display:D.display(x)});
  const putLog=(name,offset,remainder)=>{obs.logCoordinates[name]={offsetExact:qs(offset),remainder:box(remainder),meaning:`${name} = offsetExact + remainder; exponentiation is intentionally not required.`};};
  const logScaled=value=>{
    if(typeof value==='string')return {offset:Q(0),remainder:T.logQ(value)};
    if(value.kind!=='POSITIVE_SCALED_EXPONENTIAL')throw new Error('Unknown source-selected positive scale');
    let remainder=T.logQ(value.coefficientNumeratorExact);
    for(const factor of value.denominatorFactors)remainder=D.sub(remainder,D.scaleBy(T.logQ(factor.baseExact),factor.power));
    return {offset:parseQ(value.exponentExact),remainder};
  };
  const evalAxis=(Y,component)=>{
    const row=prefix.data.evaluations.find(r=>r.Y===Y&&r.radialDerivative===0&&r.etaDerivative===0);
    if(!row)throw new Error('Axis coordinate must be one of 0, 1, 2, 4, 41/10');
    return D.fromPack(row[component]);
  };
  if(phase==='axis'){
    if(eta.n!==0n)throw new Error('The current computed axis jets are centered at eta=0; select joining for an arbitrary real eta');
    const Y=qs(coordinate),phi=evalAxis(Y,'phiInfiniteEnclosure'),u=evalAxis(Y,'uInfiniteEnclosure');
    if(phi[0]<=0n)throw new Error('The current interval does not prove positive Phi');
    obs.fieldIntervals.Phi=box(phi);obs.fieldIntervals.U=box(D.add(D.q(s.j0),D.div(u,D.q(s.Lambda))));
    putLog('logF',qn(logC),T.logI(phi));
    if(coordinate.n===0n){obs.fieldIntervals.E={exactZero:true,reason:'E=sqrt(2X) F at the Cartesian axis X=0; F remains strictly positive.'};obs.logCoordinates.logX={kind:'NEGATIVE_INFINITY',reason:'X=0 exactly'};}
    else{
      const logX=D.sub(T.logQ(Y),T.logQ(s.Lambda));putLog('logX',Q(0),logX);
      putLog('logE',qn(logC),D.add(T.logI(phi),D.scaleBy(D.add(T.logQ('2'),logX),'1/2')));
    }
  }else if(phase==='shape-transition'){
    if(eta.n!==0n)throw new Error('The resolved transition observation currently uses eta=0');
    between(coordinate,Q(0),Q(1),'transition fraction');
    const phi4=evalAxis('4','phiInfiniteEnclosure'),ellCenter=D.add(T.logI(phi4),D.scaleBy(T.logQ('220'),'1/2'));
    const ell=D.add(ellCenter,D.symmetric(D.q(debt.data.estimates.logFChange.exact)));
    const sigma=T.step(qs(coordinate)),y=qm(coordinate,Tsh),rem=D.mul(D.sub(D.one,sigma),ell);
    putLog('logE',qa(qn(logC),qd(y,Q(10))),rem);
    putLog('logX',y,T.logQ('110'));
    putLog('logNormalizedX',qa(y,qn(qm(Q(10),qa(logC,Q(14))))),D.zero);
    obs.fieldIntervals.U=box(D.add(D.q(s.j0),D.symmetric(D.q(debt.data.estimates.UDeviationFromAxisDatum.exact))));
    obs.fieldIntervals.ell_i=box(ell);obs.fieldIntervals.sigma=box(sigma);
    obs.derivation='B.26 starts with F=e^(-logC)*Phi(4,0). The exact integral of its bounded prescribed logarithmic slope has absolute value at most logFChange. B.34 then gives the displayed affine logarithmic expression.';
  }else if(phase==='joining'){
    between(coordinate,Q(-8),Q(-5),'joining log(x)');
    const root=read(profile==='final'?'../uniform-gluing/source-final-bound-moment-inclusion.json':'../uniform-gluing/source-bound-moment-inclusion.json'),map=read('../uniform-gluing/uniform-moment-certificate.json');
    if(root.data.sourceSHA256!==debt.sha256||root.data.uniformMapSHA256!==map.sha256)throw new Error('The moment root belongs to a different source datum');
    obs.sourceFiles.uniformRoot=root.sha256;obs.sourceFiles.uniformMomentMap=map.sha256;
    const f=D.inv(D.add(D.one,D.pow(D.q(qs(eta)),2))),K=D.mul(T.expQ('14'),f),idealEOverK=T.expQ(qs(qd(coordinate,Q(10))));
    const bump=D.q(exactRecord(map.data.results[0].radialBounds.bumpSupremum));
    const insideBumps=coordinate.n>-6n*coordinate.d&&coordinate.n<-5n*coordinate.d;
    const eError=insideBumps?D.mul(bump,D.q(exactRecord(root.data.exactBounds.eRadius))):D.zero;
    const EOverK=D.add(idealEOverK,D.symmetric(eError));if(EOverK[0]<=0n)throw new Error('A positive angular field was not enclosed');
    putLog('logE',Q(14),D.add(T.logI(f),T.logI(EOverK)));
    putLog('logX',qm(Q(10),qa(logC,Q(14))),D.add(T.logQ('110'),D.q(qs(coordinate))));
    putLog('logNormalizedX',coordinate,D.zero);
    let U=D.q(qs(qm(Q(4),eta)));
    if(coordinate.n<-7n*coordinate.d){
      const restore=T.step(qs(qa(coordinate,Q(8))));
      U=D.add(U,D.symmetric(D.mul(D.sub(D.one,restore),D.q(debt.data.estimates.UDeviationFrom4EtaUpper.exact))));
    }else if(insideBumps)U=D.add(U,D.symmetric(D.mul(K,D.mul(bump,D.q(exactRecord(root.data.exactBounds.uRadius))))));
    obs.fieldIntervals.U=box(U);obs.fieldIntervals.EOverK=box(EOverK);
    obs.derivation='The five logarithmic bump supports are disjoint, so at most one basis function is active. Each is bounded by the certified global sigma-prime supremum. E=K*(x^(1/10)+vE); U restoration and the two axial root coefficients use the same source-bound implicit root.';
  }else if(phase==='activation-factor'){
    between(coordinate,Q(0),Q(1),'activation fraction');
    let logOneMinusKappa;
    if(typeof s.kappa0==='string')logOneMinusKappa=T.logQ(qs(qa(Q(1),qn(parseQ(s.kappa0)))));
    else{
      // The selected exponent is <=-bits, the coefficient is below one,
      // and every denominator factor is >=1. Hence 0<kappa<=2^-bits.
      const exponent=parseQ(s.kappa0.exponentExact),numerator=parseQ(s.kappa0.coefficientNumeratorExact);
      if(exponent.n>-BigInt(D.bits)*exponent.d||numerator.n<=0n||numerator.n>numerator.d||s.kappa0.denominatorFactors.some(f=>parseQ(f.baseExact).n<parseQ(f.baseExact).d))throw new Error('The source kappa upper enclosure was not established');
      logOneMinusKappa=T.logI([D.scale-1n,D.scale]);
      const lk=logScaled(s.kappa0);putLog('logKappa0',lk.offset,lk.remainder);
    }
    if(coordinate.n===0n){obs.fieldIntervals.activationFactor={exactZero:true,reason:'The actual A.5 cutoff sigma is identically zero on y<=0.'};}
    else if(coordinate.n===coordinate.d){putLog('logActivationFactor',Q(0),logOneMinusKappa);}
    else{
      const l=T.logStep(qs(coordinate));putLog('logActivationFactor',parseQ(l.offsetExact),D.add(l.remainder,logOneMinusKappa));
    }
    const lt=logScaled(s.t1);putLog('logActivationWidth',lt.offset,lt.remainder);
    obs.derivation='This is the actual scalar e_a=(1-kappa0)*sigma(y/t1) in B.26 for the selected widths. The separate vector factorization T0=e_a B0 has not been established for this selected datum.';
    obs.gates.scalarFlatFactorOnly=true;
  }else throw new Error('phase must be axis, shape-transition, joining, or activation-factor');
  obs.arithmetic={bits:D.bits,operations:T.operations(),method:T.method};return obs;
}
