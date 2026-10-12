/** Independent all-order conservative stress identities.  The exponent nu
 * remains an indeterminate; no n=1 or n=2 sample proves the identities.
 * The source adapter separately binds the actual full fields and supports.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {originalConservativePairAndWeightIdentities} from './actual-global-conservative-moments-kernel.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function freeCommutingJets(G,X,eta){
  const roots=new Map(),indices=new Map(),caches=[new Map(),new Map()];
  function jet(name,x=0,e=0){const key=[name,x,e].join(':');if(roots.has(key))return roots.get(key);
    const id=G.fresh('conservative_total_'+key);roots.set(key,id);indices.set(id,{name,x,e});return id;}
  function diff(id,direction){
    if(indices.has(id)){const r=indices.get(id);return jet(r.name,r.x+(direction===0?1:0),r.e+(direction===1?1:0));}
    if(id===X)return direction===0?G.one:G.zero;
    if(id===eta)return direction===1?G.one:G.zero;
    const cache=caches[direction];if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let v;
    const D=x=>diff(x,direction);
    if(['coordinate','rational','source_parameter'].includes(op))v=G.zero;
    else if(op==='add')v=G.add(...args.map(D));
    else if(op==='multiply')v=G.add(...args.map((x,j)=>G.mul(D(x),...args.filter((_,i)=>i!==j))));
    else if(op==='inverse')v=G.neg(G.mul(G.pow(args[0],-2),D(args[0])));
    else if(op==='integer_power')v=G.mul(G.q(args[1]),G.pow(args[0],args[1]-1),D(args[0]));
    else fail('UNSUPPORTED','Only genuine rational differential polynomials enter the conservative total kernel.');
    cache.set(id,v);return v;
  }
  return {jet,dx:x=>diff(x,0),de:x=>diff(x,1)};
}

export function originalPositiveConservativeTotalIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),{A,D,d,L,eta}=G.core,
    h=G.parameter('h'),X=G.fresh('conservative_total_X'),nu=G.fresh('conservative_total_nu'),mu=G.sub(nu,G.mul(q(2),h)),
    {jet,dx,de}=freeCommutingJets(G,X,eta),F=jet('F'),U=jet('U'),P=jet('UF_sum'),Q=jet('UU_sum'),Pi=jet('Pi'),
    Fprev=jet('F_previous'),Uprev=jet('U_previous'),VF=jet('vF_sum'),VU=jet('vU_sum'),
    b=G.neg(G.add(A,q(1,2))),c=G.neg(A),
    T=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(X,dx(f)),G.mul(D,eta,de(f))),L),
    Z=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,dx(f)))),G.mul(d,de(f))),L),
    Tb=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,de(f))),L),
    Zb=(a,f)=>G.div(G.add(G.mul(q(2),a,eta,f),G.mul(d,de(f))),L),
    BT=(w,f)=>G.div(G.mul(q(w),G.pow(X,w),f),L),
    BZ=(w,f)=>G.neg(G.div(G.mul(q(2*w),eta,G.pow(X,w),f),L)),
    thetaCurrent=G.add(b,nu),thetaTransport=G.add(b,c,nu),thetaLowerInner=G.add(b,mu),thetaLowerOuter=G.sub(thetaLowerInner,D),
    zCurrent=G.add(c,nu),zTransport=G.add(G.mul(q(2),c),nu),zLowerInner=G.add(c,mu),zLowerOuter=G.sub(zLowerInner,D),
    lowerTheta=Z(thetaLowerOuter,Z(thetaLowerInner,Fprev)),lowerZ=Z(zLowerOuter,Z(zLowerInner,Uprev)),
    thetaDensity=G.add(G.mul(q(2),X,T(thetaCurrent,F)),dx(G.mul(q(2),G.pow(X,2),VF)),G.mul(q(2),X,Z(thetaTransport,P)),
      G.mul(q(-4),X,G.add(G.mul(X,dx(dx(F))),G.mul(q(2),dx(F)))),G.neg(G.mul(q(2),X,lowerTheta))),
    axialDensity=G.add(T(zCurrent,U),dx(G.mul(X,VU)),Z(zTransport,G.add(Q,Pi)),
      G.mul(q(-2),G.add(G.mul(X,dx(dx(U))),dx(U))),G.neg(lowerZ)),
    thetaTimeExponent=G.add(G.sub(G.one,h),nu),thetaFluxExponent=G.add(q(1,2),G.mul(q(-2),h),nu),
    lowerThetaMomentExponent=G.add(G.sub(G.one,h),mu),axialTimeExponent=G.add(D,nu),axialFluxExponent=mu,
    lowerAxialInnerExponent=G.add(D,mu),lowerAxialOuterExponent=mu,
    thetaMomentExpression=G.sub(G.add(Tb(thetaTimeExponent,G.mul(q(2),X,F)),Zb(thetaFluxExponent,G.mul(q(2),X,P))),
      Zb(thetaFluxExponent,Zb(lowerThetaMomentExponent,G.mul(q(2),X,Fprev)))),
    fifthDensity=G.sub(Q,G.mul(X,dx(Pi))),
    axialMomentExpression=G.sub(G.add(Tb(axialTimeExponent,U),Zb(axialFluxExponent,fifthDensity)),
      Zb(lowerAxialOuterExponent,Zb(lowerAxialInnerExponent,Uprev))),
    thetaBoundary=G.add(BT(2,F),G.mul(q(2),G.pow(X,2),VF),BZ(2,P),G.mul(q(-4),G.pow(X,2),dx(F)),
      G.neg(BZ(2,Z(thetaLowerInner,Fprev))),G.neg(Zb(thetaFluxExponent,BZ(2,Fprev)))),
    axialBoundary=G.add(BT(1,U),G.mul(X,VU),BZ(1,G.add(Q,Pi)),Zb(axialFluxExponent,G.mul(X,Pi)),G.mul(q(-2),X,dx(U)),
      G.neg(BZ(1,Z(zLowerInner,Uprev))),G.neg(Zb(lowerAxialOuterExponent,BZ(1,Uprev)))),
    verify=root=>sourceGraphRationalIdentity(G,root,{maxTerms:100000}),
    exponentDifferences={thetaTime:G.sub(G.add(thetaCurrent,q(2)),thetaTimeExponent),thetaFlux:G.sub(G.add(thetaTransport,q(2)),thetaFluxExponent),
      lowerThetaInner:G.sub(G.add(thetaLowerInner,q(2)),lowerThetaMomentExponent),lowerThetaOuter:G.sub(G.add(thetaLowerOuter,q(2)),thetaFluxExponent),
      axialTime:G.sub(G.add(zCurrent,G.one),axialTimeExponent),axialFlux:G.sub(G.add(zTransport,G.one),axialFluxExponent),
      lowerAxialInner:G.sub(G.add(zLowerInner,G.one),lowerAxialInnerExponent),lowerAxialOuter:G.sub(G.add(zLowerOuter,G.one),lowerAxialOuterExponent)},
    checks={thetaDensity:verify(G.sub(thetaDensity,G.add(thetaMomentExpression,dx(thetaBoundary)))),
      axialDensity:verify(G.sub(axialDensity,G.add(axialMomentExpression,dx(axialBoundary)))),
      ...Object.fromEntries(Object.entries(exponentDifferences).map(([k,v])=>[k,verify(v)]))},
    negative={discardedPressureBoundary:verify(G.sub(axialDensity,G.add(axialMomentExpression,dx(G.sub(axialBoundary,Zb(axialFluxExponent,G.mul(X,Pi))))))),
      wrongPressureMomentSign:verify(G.sub(axialDensity,G.add(G.add(axialMomentExpression,Zb(axialFluxExponent,G.mul(q(2),X,dx(Pi)))),dx(axialBoundary)))),
      missingAngularRadialWeight:verify(G.sub(thetaDensity,G.add(Tb(thetaTimeExponent,F),G.sub(thetaMomentExpression,Tb(thetaTimeExponent,G.mul(q(2),X,F))),dx(thetaBoundary)))),
      omittedPreviousViscosity:verify(G.sub(G.add(thetaDensity,G.mul(q(2),X,lowerTheta)),G.add(thetaMomentExpression,dx(thetaBoundary))))},
    pair=originalConservativePairAndWeightIdentities();
  if(!pair.pass||!Object.values(checks).every(c=>c.pass)||Object.values(negative).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','The indeterminate-order conservative totals or a boundary negative control failed.');
  return {schema:'MathScope.OriginalPositiveConservativeTotalIdentity/1',pass:true,checks,negativeControls:negative,pair,
    orderParameter:'nu is indeterminate; mu=nu-2h. Apply nu=2*n*h for any positive integer n.',
    theta:'Integral 2X*rawTheta = Tbar_(1-h+nu)m_n2 + Zbar_(1/2-2h+nu)m_n4 - Zbar_(1/2-2h+nu)Zbar_(1-h+mu)m_(n-1)2, after the AUTHENTICATED radial boundaries and continuity defects vanish.',
    axial:'Integral rawZ = Tbar_(D+nu)m_n1 + Zbar_mu m_n5 - Zbar_mu Zbar_(D+mu)m_(n-1)1, after the AUTHENTICATED radial boundaries and continuity defects vanish.',
    originalContinuityDefectsRetainedByPairKernel:true,radialBoundariesKeptInExecutedIdentity:true,
    pressureMoment:'m_n5=integral(sum Ui*Uj-X*Pi_nX); the separate boundary is [X*Pi_n], with its positive sign retained before zero extension.',
    n1LeadingAngularQualification:'For n=1 the lower moment means the actual convergent physical subtracted moment (5.19). Do not apply an unrenormalized improper integral or presume its isolated boundary vanishes.',
    sourceFieldsOrMomentsAssumed:false,actualWholeIntegralsAuthenticated:false,newLeanKernelProof:false};
}

/** The total moment is deliberately kept arbitrary. Vanishing is a
 * source theorem required AFTER this identity, not a definition here.
 */
export function originalSignedStressSplitIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),X=G.fresh('signed_stress_X'),
    partial=G.fresh('signed_stress_partial'),whole=G.fresh('signed_stress_whole'),density=G.fresh('signed_stress_density'),
    radius=G.fresh('signed_stress_positive_radius'),den=G.mul(q(2),X),
    forwardTheta=G.neg(G.div(partial,den)),backwardTheta=G.div(G.sub(whole,partial),den),
    forwardZ=G.neg(G.div(partial,radius)),backwardZ=G.div(G.sub(whole,partial),radius),
    verify=root=>sourceGraphRationalIdentity(G,root,{maxTerms:100000}),
    checks={thetaSplit:verify(G.sub(G.sub(backwardTheta,forwardTheta),G.div(whole,den))),
      axialSplit:verify(G.sub(G.sub(backwardZ,forwardZ),G.div(whole,radius))),
      thetaFTCWeight:verify(G.add(G.div(G.neg(density),den),G.div(density,den))),
      axialFTCWeight:verify(G.add(G.neg(density),density))},
    negative={unprovedWholeTheta:verify(G.sub(backwardTheta,forwardTheta)),unprovedWholeZ:verify(G.sub(backwardZ,forwardZ)),
      wrongBackwardThetaSign:verify(G.sub(G.sub(G.neg(backwardTheta),forwardTheta),G.div(whole,den))),
      missingAngularTwo:verify(G.add(G.div(G.neg(density),X),G.div(density,den)))};
  if(!Object.values(checks).every(c=>c.pass)||Object.values(negative).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','The signed stress total or its negative control was lost.');
  return {schema:'MathScope.OriginalSignedStressSplitIdentity/1',pass:true,checks,negativeControls:negative,
    identity:'backward-forward=(actual whole density integral)/denominator; theta denominator=2X, axial denominator=sqrt(2X).',
    consequence:'Only an independently proved ZERO whole integral identifies the original signed forward and backward primitives.',
    endpointRule:'A C-infinity density vanishing on a neighbourhood of each exterior and with zero whole integral gives equal fixed jets of the original forward/zero/backward extensions.',
    noDivisionAtAxis:'The active interval starts at the original strictly positive Xminus. The stress is literally zero on a whole axis neighbourhood.',
    sourceTotalMomentAuthenticated:false,newLeanKernelProof:false};
}
