/** Same-source B.22 reference: executed core moments, a quantified positive-width collar, and exact constant-tail integrals. */
import {prepareActualCoreMoments} from './actual-continuation-moments.mjs';
import {fail,rational as q,qadd,qsub,qmul,qdiv,qpow,qcompare,qtext,readRational,factorial} from './actual-continuation-arithmetic.mjs';

const SOURCE_PROOFS={
  reference:{path:'research-ide/mathscope-m1/navier/followup-20261010-same-datum-axis/REFERENCE_DERIVATIVE_BOUNDS.md',sha256:'c4f47c6a156052a007a55992345faa47c7c47cb5606a46bff693f0b69d5054d9',sections:[2,6]},
  continuation:{path:'research-ide/mathscope-m1/navier/followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md',sha256:'b2b4dfc3f1223e3a5e2bb09043dc649d48d2cda16813d6c719f7d47f6b0214e2',sections:[1,2,6]},
};
const RAW_ERROR=q(1,1n<<2048n);

/** Scalar implications of the PINNED hierarchy, not an arbitrary norm supplied by a caller. */
export function actualB22CollarBudget(){
  const factorial40=factorial(40),sourceQMinimum=1n<<260n,exponent=260*(120*10000-2000);
  return {
    schema:'MathScope.ActualB22CollarBudget/1',sourceDefinition:'t1=CSelected^-120, Lambda=Q^64, CSelected=(1+Q^300)^10*exp(Q^200)',
    exactReferenceCutoff:'Yc=4*exp(2*t1)',positiveWidthRetained:true,widthReplacedByZero:false,
    bound:'Every displayed normalized endpoint jet and appended Y-integral differs from its Y=4 core datum by less than t1*Q^2000 < 2^-2048.',
    normalizedObjects:['Rr=Fr/g and its eta derivatives through order two','ur/K=(Ur-Ustar)*Lambda/K and its eta derivatives through order two','integrals phi, y*phi, phi^2, y*phi^2, u/K, (u/K)^2, y*(u/K)*phi through the appended collar'],
    YcEnclosure:['4','4+2^-2048'],absoluteErrorUpper:qtext(RAW_ERROR),
    derivation:['On [4,4 exp(2t1)], the actual coefficient estimate and reciprocal/logarithm jets give at most Q^31 before the fixed smooth cutoff.','The source B.22 defining integral has length at most 2t1. Its eta derivatives are integrated directly; no t1^-1 loss is inserted.','Bell and Leibniz expansions through eta order two, including the products in all seven appended integrals and Y<=4.1, are bounded by t1*Q^2000.','CSelected>Q^10000 follows from exp(Q^200)>=Q^8000/40! and (1+Q^300)^10>Q^3000, using 40!<Q.','Thus t1*Q^2000 < Q^(-1198000) <= 2^(-311480000) < 2^-2048. The bound widens the actual positive-width integral; it does not set t1 to zero.'],
    arithmeticChecks:{factorial40:qtext(q(factorial40)),factorial40BelowTwo260:factorial40<sourceQMinimum,CExponentAfterFactorialLoss:10999,CExponentUsed:10000,negativeDyadicExponent:exponent,strictlyBelowRequestedError:exponent>2048},
    sources:SOURCE_PROOFS,
    scope:{actualReferenceCutoffEnclosed:true,cutoffIntegrandSampled:false,nonzeroWidthRemainderRetained:true,referenceIsActualB26Field:false}
  };
}

function allowedInput(input){
  for(const key of Object.keys(input))if(!['sourceProfile','eta','etaOrder','bits','degree','X','XInterval'].includes(key))fail('INVALID_INPUT','Unknown actual B.22 reference input '+key);
  if(input.X!==undefined&&input.XInterval!==undefined)fail('INVALID_INPUT','Choose X or XInterval, not both.');
  const raw=input.XInterval??[input.X??'100',input.X??'100'];
  if(!Array.isArray(raw)||raw.length!==2)fail('INVALID_INPUT','XInterval needs two exact endpoints.');
  const endpoints=raw.map(x=>readRational(x,4096));
  if(qcompare(endpoints[0],q(1,1024))<0||qcompare(endpoints[1],q(110))>0||qcompare(endpoints[0],endpoints[1])>0)fail('INVALID_INPUT','The executable constant-reference window is 1/1024<=Xleft<=Xright<=110.');
  return endpoints;
}

const unpackDerivative=(A,p,m)=>A.div(A.unpack(p),A.point(factorial(m)));
const packJet=(A,j)=>j.map((v,m)=>({etaDerivativeOrder:m,interval:A.pack(A.mul(v,A.point(factorial(m))))}));

/** This is the reference used inside B.26, not the physical shear-reduced continuation. */
export function evaluateActualB22Reference(input={},context={}){
  const [left,right]=allowedInput(input),prepared=prepareActualCoreMoments({sourceProfile:input.sourceProfile,eta:input.eta,etaOrder:input.etaOrder??2,bits:input.bits,degree:input.degree,Y:'4'},context);
  const {result:core,A,J,coordinate,integrals,order,end}=prepared,budget=actualB22CollarBudget(),X=[A.point(left)[0],A.point(right)[1]],Yc=A.widen(A.point(4),RAW_ERROR);Yc[0]=A.point(4)[0];
  const widened=Object.fromEntries(Object.entries(integrals).map(([key,v])=>[key,v.map((x,m)=>A.widen(x,qdiv(RAW_ERROR,q(factorial(m)))))]));
  const R=end.phi.rows.map((r,m)=>A.widen(unpackDerivative(A,r.actualNonlinearInterval,m),qdiv(RAW_ERROR,q(factorial(m)))));
  const uR=end.axial.rows.map((r,m)=>{let s=A.one();for(let k=0;k<m;k++)s=A.mul(s,coordinate.j);return A.widen(A.mul(unpackDerivative(A,r.uOverK,m),s),qdiv(RAW_ERROR,q(factorial(m))));});
  const Ustar=coordinate.Ustar,eps=coordinate.KOverLambda,U=J.add(Ustar,J.scale(uR,eps)),coreM=J.add(J.scale(Ustar,Yc),J.scale(widened.uOverK,eps));
  const coreUPhi=J.add(J.mul(Ustar,widened.yPhi),J.scale(widened.yUOverKPhi,eps)),coreU2=J.add(J.add(J.scale(J.mul(Ustar,Ustar),Yc),J.scale(J.mul(Ustar,widened.uOverK),A.mul(A.point(2),eps))),J.scale(widened.uOverKSquared,A.mul(eps,eps)));
  const rho=A.div(coordinate.inverseLambda,X),rho2=A.mul(rho,rho),Yc2=A.mul(Yc,Yc),R2=J.mul(R,R),U2=J.mul(U,U);
  const average=J.add(U,J.scale(J.sub(coreM,J.scale(U,Yc)),rho));
  const iCoeff=J.add(R,J.scale(J.sub(J.scale(widened.yPhi,2),J.scale(R,Yc2)),rho2));
  const up=J.mul(U,R),jCoeff=J.add(up,J.scale(J.sub(J.scale(coreUPhi,2),J.scale(up,Yc2)),rho2));
  const sAxial=J.add(U2,J.scale(J.sub(coreU2,J.scale(U2,Yc)),rho));
  const sAngular=J.add(J.scale(R2,A.point(q(1,2))),J.scale(J.sub(widened.yPhiSquared,J.scale(R2,A.mul(Yc2,A.point(q(1,2))))),rho2));
  const cp=J.add(R2,J.scale(J.sub(widened.phiSquared,J.scale(R2,Yc)),rho));

  // Ordinary eta jets needed by the regular Omega integrands. The primitive
  // of u is evaluated by its actual radial-average enclosure, not finite
  // differences of source samples or division by an underflowed j0.
  const eta=coordinate.eta[0],j=coordinate.j,h=A.small(4096),D=A.sub(A.point(q(1,2)),h),aa=A.add(A.point(q(1,2)),h),d=A.sub(A.one(),A.mul(eta,eta)),L=A.sub(A.one(),A.mul(A.point(2),A.mul(h,A.mul(eta,eta))));
  const ordinary=end.axial.rows.map((r,m)=>{
    const star=m===0?A.add(A.mul(A.point(4),eta),j):A.point(m===1?4:0);
    const ru=A.widen(A.unpack(r.uOverK),RAW_ERROR),ur=A.add(star,A.mul(eps,ru));
    const coreM0=A.widen(A.mul(A.point(4),A.add(star,A.mul(eps,A.unpack(r.averageUCorrectionOverK)))),RAW_ERROR),B=A.sub(coreM0,A.mul(Yc,ur));
    return {star,U:ur,B,average:A.add(ur,A.mul(rho,B))};
  });
  const vData=order===2?(()=>{
    const U=ordinary[0].U,U1=ordinary[1].U,U2=ordinary[2].U,B=ordinary[0].B,B1=ordinary[1].B,B2=ordinary[2].B;
    const aNum=A.sub(A.mul(A.mul(A.point(2),aa),A.mul(eta,U)),A.mul(d,U1));
    const bNum=A.neg(A.add(A.mul(A.mul(A.point(2),D),A.mul(eta,B)),A.mul(d,B1)));
    const aNumEta=A.add(A.mul(A.mul(A.point(2),aa),A.add(U,A.mul(eta,U1))),A.sub(A.mul(A.mul(A.point(2),eta),U1),A.mul(d,U2)));
    const bNumEta=A.neg(A.add(A.mul(A.mul(A.point(2),D),A.add(B,A.mul(eta,B1))),A.sub(A.mul(d,B2),A.mul(A.mul(A.point(2),eta),B1))));
    const Le=A.neg(A.mul(A.point(4),A.mul(h,eta))),a=A.div(aNum,L),b=A.mul(coordinate.inverseLambda,A.div(bNum,L));
    const ae=A.div(A.sub(A.mul(aNumEta,L),A.mul(aNum,Le)),A.mul(L,L)),be=A.mul(coordinate.inverseLambda,A.div(A.sub(A.mul(bNumEta,L),A.mul(bNum,Le)),A.mul(L,L)));
    return {a,b,ae,be,v:A.add(a,A.div(b,X)),vEta:A.add(ae,A.div(be,X))};
  })():null;
  const physical={X:A.pack(X),EOverG:A.pack(A.mul(A.sqrt(A.mul(A.point(2),X)),R[0])),U:packJet(A,U),MOverX:packJet(A,average),IOverGX2:packJet(A,iCoeff),JOverGX2:packJet(A,jCoeff),SAxialIntegralOverX:packJet(A,sAxial),SAngularIntegralOverG2X2:packJet(A,sAngular),CpOverG2X:packJet(A,cp)};
  const ordinaryValues=ordinary.map((r,m)=>({etaDerivativeOrder:m,U:A.pack(r.U),averageU:A.pack(r.average),primitiveOffsetB:A.pack(r.B)}));
  const regularValues=vData?{v:A.pack(vData.v),vEta:A.pack(vData.vEta),U:A.pack(ordinary[0].U),Ueta:A.pack(ordinary[1].U),coefficientA:A.pack(vData.a),coefficientB:A.pack(vData.b),coefficientAEta:A.pack(vData.ae),coefficientBEta:A.pack(vData.be),form:'v(X,eta)=a(eta)+b(eta)/X; U is exactly constant after the B.22 cutoff'}:null;
  const exactIntegrals=vData?integrateReferenceRegular(A,{left,right,U:ordinary[0].U,Ueta:ordinary[1].U,...vData}):null;
  return {
    schema:'MathScope.ActualB22ReferenceCell/1',profileId:core.profileId,parameterExpressionSHA256:core.parameterExpressionSHA256,status:'PARTIAL',request:{...core.request,XInterval:[qtext(left),qtext(right)]},
    coreMoments:core,collar:budget,referenceEndpoint:{YcExact:'4*exp(2*t1)',Yc:A.pack(Yc),normalizedFOverG:packJet(A,R),normalizedAxialCorrectionOverK:packJet(A,uR)},values:physical,ordinaryEtaValues:ordinaryValues,regularValues,regularIntegrals:exactIntegrals,
    restoration:{F:'g*Rr',E:'sqrt(2X)*g*Rr',M:'X * MOverX',I:'g*X^2 * IOverGX2',J:'g*X^2 * JOverGX2',S:'X*SAxialIntegralOverX-g^2*X^2*SAngularIntegralOverG2X2',Cp:'g^2*X*CpOverG2X',derivativeConvention:'The values arrays differentiate the normalized coefficients in w=(eta-eta0)/j0. ordinaryEtaValues and regularValues use ordinary eta derivatives, without j scaling.',gStillExactPositiveExpression:true},
    domain:{mathematicalReference:['4*exp(2*t1)/Lambda','110'],executedPhysicalWindow:['1/1024','110'],entireRequestedXCellEnclosed:true,etaIsFixedRequestedSourceParameter:true,unmodifiedOriginalCoreUsed:true,B22ReferenceNotB26ActualField:true},
    sourceBindings:{...core.sourceBindings,proofs:SOURCE_PROOFS},arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    scope:{actualB22ReferenceAndMomentsEnclosed:true,actualPositiveCutoffWidthKept:true,referenceRegularIntegralsEnclosed:!!exactIntegrals,referenceIntegralIsGlobalActualOmegaDebt:false,gPrimitiveNumericallyEvaluated:false,actualB26ShearReductionIntegrated:false,actualB34ShiftIntegrated:false,actualB8IncomingDebtEvaluated:false,fullGlobalOmegaMomentsClosed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}
  };
}

/** Closed elementary primitives of the REFERENCE regular integrands, with all offset/log terms. */
export function integrateReferenceRegular(A,{left,right,U,Ueta,a,b,ae,be}){
  const dx=A.point(qsub(right,left)),x2=A.point(qdiv(qsub(qpow(right,2),qpow(left,2)),q(2))),log=A.logRational(qdiv(right,left)),inv=A.point(qsub(qdiv(q(1),left),qdiv(q(1),right)));
  const jm=A.add(A.mul(a,dx),A.mul(b,log)),j0=A.add(A.mul(a,x2),A.mul(b,dx)),jme=A.add(A.mul(ae,dx),A.mul(be,log)),j0e=A.add(A.mul(ae,x2),A.mul(be,dx));
  const hm=A.mul(U,jm),h0=A.mul(U,j0),hme=A.add(A.mul(Ueta,jm),A.mul(U,jme)),h0e=A.add(A.mul(Ueta,j0),A.mul(U,j0e));
  const a2=A.mul(a,a),b2=A.mul(b,b),twoab=A.mul(A.point(2),A.mul(a,b));
  const km=A.add(A.add(A.mul(a2,dx),A.mul(twoab,log)),A.mul(b2,inv)),k1=A.add(A.add(A.mul(a2,x2),A.mul(twoab,dx)),A.mul(b2,log));
  return {domain:[qtext(left),qtext(right)],values:Object.fromEntries(Object.entries({Jminus1:jm,Jzero:j0,Jminus1Eta:jme,JzeroEta:j0e,Hminus1:hm,Hzero:h0,Hminus1Eta:hme,HzeroEta:h0e,Kminus2:km,Kminus1:k1}).map(([k,v])=>[k,A.pack(v)])),method:'EXACT_CONSTANT_REFERENCE_U_AND_a_plus_b_over_X_PRIMITIVES',logarithmInterval:A.pack(log),source:'Same B.22 reference and the actual core primitive offset; not the shear-reduced physical continuation.',momentPrimitiveOffsetRetained:true,intervalsAreGlobalActualDebts:false};
}
