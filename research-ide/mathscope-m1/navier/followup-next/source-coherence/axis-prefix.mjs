import {createHash} from 'node:crypto';
import {certifyAxisSource,axisSourceExampleInput} from '../../followup-construction/axis-source-certificate.mjs';
import {makeBudget} from '../../numerics.mjs';
import {certifySourceAxisForCone} from './refine-axis-certificate.mjs';
import {createDyadic,createIntervalJets} from './dyadic.mjs';
import {Q,qa,qm,qd,qn,qs,parseQ} from './exact-polynomial.mjs';

const factorial=n=>{let r=1n;for(let j=2;j<=n;j++)r*=BigInt(j);return r;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const power=(a,n)=>Q(a.n**BigInt(n),a.d**BigInt(n));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function tail(M,rho,Y,N,k,m){
  if(!Y.n)return Q(0);
  const n=N+1,q=qd(Y,Q(20)),c=Q(factorial(m)*choose(n+m,m)*factorial(n)/factorial(n-k),BigInt((m+1)**2*(n+1)**2));
  const first=qm(qm(qm(M,qd(Q(1),power(rho,m))),c),qd(power(q,n),power(Y,k)));
  const ratio=qm(q,Q(n+1+m,n+1-k));if(ratio.n>=ratio.d)throw new Error('Tail does not have a geometric majorant');
  return qd(first,qa(Q(1),qn(ratio)));
}

/** Outward interval prefix of the SAME source-defined nonlinear axis sequence.
 * The default source is generated afresh, and caller norm/tail replacement is
 * impossible. Its analytic premise bundle still has the original Lean boundary.
 */
export function runSourceAxisPrefix(input={}){
  for(const k of Object.keys(input))if(!['radialDegree','etaDegree','arithmeticBits','source','logC','sourceSelection'].includes(k))throw new Error(`Unknown input: ${k}`);
  const N=input.radialDegree??24,etaDegree=input.etaDegree??2,bits=input.arithmeticBits??512;
  if(!Number.isSafeInteger(N)||N<2||N>32||!Number.isSafeInteger(etaDegree)||etaDegree<0||etaDegree>4)throw new Error('radialDegree must be 2..32 and etaDegree 0..4');
  const sourceInput=input.source??axisSourceExampleInput();
  const baseBudget=makeBudget({maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048});
  if(input.sourceSelection!==undefined&&!['original','cone-margin'].includes(input.sourceSelection))throw new Error('sourceSelection must be original or cone-margin');
  const producer=input.sourceSelection==='cone-margin'?certifySourceAxisForCone:certifyAxisSource;
  const c=producer({...sourceInput,tailDegree:N,sampleEta:'0'},baseBudget);
  if(c.status!=='VERIFIED_LOCAL_BOUND_CERTIFICATE')return {status:'SOURCE_CERTIFICATE_FAILED',source:c,fullProfileCertified:false};
  if(input.logC!==undefined&&(typeof input.logC!=='string'||input.logC.length>2000||!/^\d+(?:\/\d+)?$/.test(input.logC)))throw new Error('logC must be an exact positive rational string of at most 2000 characters');
  const selectedLogC=input.logC===undefined?parseQ(c.selectedParameters.logC):parseQ(input.logC),minimumLogC=parseQ(c.selectedParameters.logC);
  if(selectedLogC.n*minimumLogC.d<minimumLogC.n*selectedLogC.d)throw new Error('Selected logC is below the generated analytic normalization threshold');
  let operations=0;const D=createDyadic(bits,()=>{if(++operations>60000000)throw new Error('Interval operation budget exceeded');});
  // One parameter derivative may be spent per radial recursion step. Exporting
  // m<=etaDegree with M=N+etaDegree+2 therefore never uses a fabricated top jet.
  const M=N+etaDegree+2,J=createIntervalJets(D,M),zero=()=>J.C(0),e=zero();e[1]=D.one;
  const one=J.C(1),h=D.q(c.selectedParameters.h),j0=D.q(c.selectedParameters.j0),sigma=D.q(c.selectedParameters.sigmaStar),lam=D.q(c.selectedParameters.Lambda),invLam=D.inv(lam);
  const A=D.add(D.q('1/2'),h),dd=D.sub(D.q('1/2'),h),d=J.sub(one,J.mul(e,e)),L=J.sub(one,J.scale(J.mul(e,e),D.scaleBy(h,2))),invL=J.inv(L),Us=J.add(J.scale(e,D.q(4)),J.scale(one,j0)),Hs=J.add(J.scale(e,dd),J.mul(d,Us));
  const Ws=J.sub(J.sub(one,J.scale(d,D.q(4))),J.scale(J.mul(e,Us),D.scaleBy(dd,2))),Hs2=J.mul(Hs,Hs),den=J.add(Hs2,J.scale(one,D.mul(sigma,sigma))),chi=J.div(Hs2,den),zeta=J.neg(J.div(J.mul(L,Hs),den));
  const pc=c.sourcePressureCertificate,massLo=D.q(pc.innerThetaOneMassLower),massHi=D.q(pc.totalMassUpper),Pi=zero();
  const pressureJetProof=[];
  for(let m=0;m<=M;m++){
    if(m%2){Pi[m]=D.zero;pressureJetProof.push({order:m,parity:'odd',interval:D.pack(D.zero)});continue;}
    const k=m/2,a=D.scaleBy(massLo,k+1),b=D.scaleBy(massHi,k+1),box=[a[0],b[1]];
    Pi[m]=k%2===0?D.neg(box):box;
    pressureJetProof.push({order:m,parity:'even',k,interval:D.pack(Pi[m])});
  }
  // On |z|<=r, |phase(z)|<=r sup|zeta|. This disk is inside the
  // same source certificate tube. A dyadic upper bound for g^2 is obtained
  // without evaluating exp(-logC) or replacing a positive number with zero.
  const radius=parseQ(c.complexInput.cauchyRadius),zsup=parseQ(c.complexInput.complexSuprema.normalizedGradient),lambdaExact=parseQ(c.selectedParameters.Lambda),logC=selectedLogC;
  const exponentMargin=qm(Q(2),qa(logC,qn(qm(lambdaExact,qm(radius,zsup))))),amplitudeBits=4*bits+128*M;
  if(exponentMargin.n<BigInt(amplitudeBits)*exponentMargin.d)throw new Error('Source normalization does not support requested g^2 derivative enclosure');
  const amplitudeBound=Q(1,1n<<BigInt(amplitudeBits)),g2=zero(),g2Records=[];
  for(let m=0;m<=M;m++){
    const b=qd(amplitudeBound,power(radius,m)),z=D.q(qs(b));g2[m]=m===0?[0n,z[1]]:D.symmetric(z);
    g2Records.push({order:m,exactCauchyUpper:qs(b),interval:D.pack(g2[m])});
  }
  const Zs=J.add(J.sub(J.sub(J.scale(J.mul(J.sub(one,J.scale(J.mul(e,Us),D.q(2))),Us),D.neg(A)),J.scale(Hs,D.q(4))),J.mul(d,J.deriv(Pi))),J.scale(J.mul(e,Pi),D.scaleBy(A,4)));
  const phi=[one],u=[zero()],rmul=(a,b,n)=>{let r=zero();for(let k=0;k<=n;k++)r=J.add(r,J.mul(a[k]??zero(),b[n-k]??zero()));return r;};
  for(let n=0;n<N;n++){
    const AX=u.map((v,k)=>J.scale(v,D.q(`1/${k+1}`))),B=AX.map(v=>J.sub(J.scale(J.mul(e,v),D.scaleBy(dd,-2)),J.mul(d,J.deriv(v))));
    const W=B.map((v,k)=>J.add(J.scale(v,invLam),k===0?Ws:zero())),U=u.map((v,k)=>J.add(J.scale(v,invLam),k===0?Us:zero())),Hc=u.map((v,k)=>J.add(J.scale(J.mul(d,v),invLam),k===0?Hs:zero()));
    const pref=W.map((v,k)=>J.add(J.add(v,J.scale(J.sub(k===0?one:zero(),J.scale(J.mul(e,U[k]),D.q(2))),h)),J.mul(J.mul(d,u[k]),zeta)));
    const DXphi=phi.map((v,k)=>J.scale(v,D.q(k))),DXu=u.map((v,k)=>J.scale(v,D.q(k))),phiEta=phi.map(J.deriv),uEta=u.map(J.deriv);
    const R1=J.mul(invL,J.add(J.add(rmul(pref,phi,n),rmul(W,DXphi,n)),rmul(Hc,phiEta,n)));
    const p=[zero()];for(let k=1;k<=n;k++)p.push(J.scale(J.mul(g2,rmul(phi,phi,k-1)),D.q(`1/${k}`)));
    const alpha=J.add(J.scale(J.sub(one,J.scale(J.mul(e,Us),D.q(4))),A),J.scale(d,D.q(4)));
    let R2=J.mul(alpha,u[n]);
    R2=J.add(R2,J.scale(J.mul(e,rmul(u,u,n)),D.mul(D.scaleBy(A,-2),invLam)));
    R2=J.add(R2,rmul(W,DXu,n));R2=J.add(R2,J.mul(Hs,uEta[n]));R2=J.add(R2,J.scale(J.mul(d,rmul(u,uEta,n)),invLam));
    R2=J.add(R2,J.scale(J.mul(e,p[n]??zero()),D.scaleBy(A,-4)));R2=J.add(R2,J.mul(d,J.deriv(p[n]??zero())));R2=J.add(R2,J.scale(J.mul(e,p[n]??zero()),D.q(-2*n)));R2=J.mul(invL,R2);
    phi.push(J.scale(J.add(J.neg(J.mul(chi,phi[n])),J.scale(R1,invLam)),D.q(`1/${2*(n+1)*(n+2)}`)));
    u.push(J.scale(J.add(n===0?J.neg(J.mul(Zs,invL)):zero(),J.scale(R2,invLam)),D.q(`1/${2*(n+1)*(n+1)}`)));
  }
  const packedPhi=phi.map(row=>row.slice(0,etaDegree+1).map(D.pack)),packedU=u.map(row=>row.slice(0,etaDegree+1).map(D.pack));
  const yvalues=['0','1','2','4','41/10'],evaluations=[];
  for(const y of yvalues){
    const Y=D.q(y),exactY=parseQ(y);
    const evaluate=(rows,m,k)=>{let out=D.zero;for(let n=N;n>=k;n--){let fac=1;for(let j=0;j<k;j++)fac*=n-j;out=D.add(D.mul(out,Y),D.scaleBy(rows[n][m],fac*Number(factorial(m))));}return out;};
    for(let m=0;m<=etaDegree;m++)for(let k=0;k<=2;k++){
      const rest=tail(parseQ(c.tails.solutionNormUpper),parseQ(c.selectedParameters.coefficientRadius),exactY,N,k,m),remainder=D.symmetric(D.q(qs(rest)));
      const phiFinite=evaluate(phi,m,k),uFinite=evaluate(u,m,k),phiWhole=D.add(phiFinite,remainder),uWhole=D.add(uFinite,remainder);
      evaluations.push({Y:y,eta:'0',radialDerivative:k,etaDerivative:m,finitePhi:D.pack(phiFinite),finiteU:D.pack(uFinite),infiniteRadialTailUpper:qs(rest),phiInfiniteEnclosure:D.pack(phiWhole),uInfiniteEnclosure:D.pack(uWhole),display:{phi:D.display(phiWhole),u:D.display(uWhole)}});
    }
  }
  const originalBasis={sourcePressureParameters:c.inputModel.pressure.sourceParameters,...c.selectedParameters,logC:qs(selectedLogC),C:{kind:'EXACT_POSITIVE_EXPONENTIAL',log:qs(selectedLogC)}};
  return {schema:'MathScope.Navier.SourceAxisIntervalPrefix/1',status:'SOURCE_BOUND_INTERVAL_PREFIX_COMPUTED',input:{radialDegree:N,etaDegree,arithmeticBits:bits,source:sourceInput,sourceSelection:input.sourceSelection??'original',logC:qs(selectedLogC)},sourceProfileParameters:originalBasis,sourceProfileHash:hash(originalBasis),
    sourceCertificateBinding:{sourceStatus:c.status,sourceInputHash:hash(sourceInput),sourceCertificateMathematicalHash:hash({...c,execution:undefined}),sourceSelectedParameters:c.selectedParameters,sourceGates:c.gates,amplitudeThresholdPreserved:true,increasedNormalization:qs(selectedLogC)!==c.selectedParameters.logC,normalizationArgument:'All analytic coefficient bounds and the selected contraction constant are uniform for C at least the source threshold. Increasing C decreases the normalized complex amplitude and selects the corresponding unique fixed point; it does not keep the old fixed point unchanged.'},
    analyticInput:{etaCenter:'0',pressureCoefficients:pressureJetProof,pressureProof:'P(eta)=-integral(1+eta^2)^(-2theta)dmu. Odd coefficients vanish. Coefficient 2k has sign (-1)^(k+1); its magnitude is between (k+1)*mu(theta=1 prefix) and (k+1)*mu(total), because 0<=theta<=1 and (2theta)_k/k!<=k+1. Both masses are generated by the actual A.21 source.',
      gSquaredCoefficients:g2Records,gSquaredProof:{diskRadius:qs(radius),zetaSupremum:qs(zsup),twiceNormalizationMargin:qs(exponentMargin),dyadicExponent:amplitudeBits,strictlyPositiveOnRealAxis:true,zeroLowerEndpointMeans:'Enclosure only; g^2 is never declared mathematically zero.',inequality:'margin>=B and exp(-B)<=2^(-B) for integer B>=0; Cauchy coefficient bound divides by diskRadius^m.'}},
    recurrence:{equations:['B.12','B.14','B.15'],internalEtaDegree:M,exportedEtaDegree:etaDegree,radialDegree:N,allDisplayedRoundedOperationsDirected:true,certifiedDependencyWedge:'For radial coefficient n, all eta orders m with m+n<=M are retained; each radial step consumes at most one eta derivative. Exported m<=etaDegree is inside that wedge.',phi:packedPhi,u:packedU},
    evaluations,arithmetic:{kind:'DIRECTED_FIXED_DYADIC_INTERVALS',bits,operations,binary64UsedForProof:false},
    gates:{samePressureAndAxisParameters:true,newFinitePrefixBoundToSourceRecurrence:true,existingV54Float64ArrayIdentity:false,roundingIncluded:true,radialInfiniteTailIncluded:true,etaDomainForDisplayedJets:'eta=0 only',wholeEtaAnalyticPremiseBundleKernelChecked:false,fullProfileCertified:false,formalPass:false},
    proofBoundary:'The interval arithmetic and finite triangular recurrence are executable. The infinite-sequence inclusion uses the source bound certificate and its published coefficient-space existence/uniqueness theorem references. The generated analytic premise bundle has not been proved in Lean. These intervals do not certify v54 logP=0 gluing or close the global N3-03 criterion.'};
}
