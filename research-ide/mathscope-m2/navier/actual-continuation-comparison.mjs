/** Actual B.26/B.34/B.8 axial comparison, with its nonzero remainder.
 *
 * The comparator is the literal A.2 profile. It is not substituted for the
 * nonlinear source: the actual root/debt and finite-frequency bounds below
 * are retained in every resulting interval. Only Omega functional VALUES
 * use this reduction; no phase, shear, or higher-order source is certified.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {actualModulationOmegaRemainder} from './actual-global-source-moments.mjs';
import {directedArithmetic,fail,rational as q,qadd,qsub,qmul,qdiv,qcompare,qtext,readRational} from './actual-continuation-arithmetic.mjs';

const POW=n=>q(1,1n<<BigInt(n)),DELTA=POW(2048);
export const ACTUAL_CONTINUATION_COMPARISON_SOURCES=Object.freeze({
  continuation:{path:'research-ide/mathscope-m1/navier/followup-20261010-same-datum-axis/CONTINUATION_AND_NEW_DEBT.md',sha256:'b2b4dfc3f1223e3a5e2bb09043dc649d48d2cda16813d6c719f7d47f6b0214e2',sections:[1,4,8,9]},
  reference:{path:'research-ide/mathscope-m1/navier/followup-20261010-same-datum-axis/REFERENCE_DERIVATIVE_BOUNDS.md',sha256:'c4f47c6a156052a007a55992345faa47c7c47cb5606a46bff693f0b69d5054d9',sections:[6,7]},
  sourceEnvelope:{path:'research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/one-profile-0001/inputs/27-GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',sha256:'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b',sections:[3,4]},
  weightedReduction:{path:'research-ide/mathscope-m2/navier/research/WEIGHTED_OMEGA_REDUCTION_KO.md',sha256:'fbc37d4784a1137da7a481b74f070cc94df41f6ba64ac9d54d399d40aaada4b6',sections:[1,2,5]},
});

/** Exact rational coefficient audit for the fixed comparison proof. */
function coefficientAudit(){
  const h=q(1,1024),inverseL=qdiv(q(1),qsub(q(1),qmul(q(2),h))),A=qadd(q(1,2),h),D=q(1,2),Le=qmul(q(4),h);
  const numeratorDifference=q(4),numeratorEtaDifference=q(9);
  const v=qmul(numeratorDifference,inverseL),ve=qadd(qmul(numeratorEtaDifference,inverseL),qmul(qmul(numeratorDifference,Le),qmul(inverseL,inverseL)));
  const v0=qmul(qadd(q(4),qmul(q(8),h)),inverseL),v0e=qadd(qmul(qmul(q(16),qadd(q(1),h)),inverseL),qmul(qmul(qadd(q(4),qmul(q(8),h)),Le),qmul(inverseL,inverseL)));
  // The secondary product estimates only use these integer enclosures.
  const uv=q(4*5+5+5),uve=q(4*5+4*16+17+5+5+16),v2=q(2*5*5+25);
  const p=qadd(qadd(qmul(qmul(q(1,2),inverseL),qadd(qadd(qmul(D,q(16)),q(256)),qmul(qmul(q(2),A),q(40)))),q(32)),q(2));
  const f=qadd(qmul(qmul(q(1,2),inverseL),qadd(qadd(qmul(D,q(8)),q(5,2)),qadd(q(128),qmul(D,q(40))))),q(16));
  const candidates={deltaV:[v,5],deltaVEta:[ve,16],referenceV:[v0,5],referenceVEta:[v0e,17],deltaUV:[uv,40],deltaUVEta:[uve,256],deltaVSquared:[v2,128],normalizedPressure:[p,256],normalizedFlux:[f,256]};
  const rows=Object.entries(candidates).map(([id,[value,upper]])=>({id,derivedCoefficient:qtext(value),chosenIntegerUpper:upper,verified:qcompare(value,q(upper))<0}));
  const b8Leibniz=q(2*9*(1+2*2+8),1000000); // two disjoint supports, conservatively counted twice
  rows.push({id:'actualB8UCorrection',derivedCoefficient:qtext(b8Leibniz),chosenIntegerUpper:1,verified:qcompare(b8Leibniz,q(1))<0});
  if(rows.some(x=>!x.verified))fail('INTERNAL_VALIDATION','The exact comparison coefficient audit failed.');
  return rows;
}

export function actualContinuationOmegaComparison(input={}){
  for(const key of Object.keys(input))if(key!=='sourceProfile')fail('INVALID_INPUT','Unknown actual source comparison input '+key);
  const source=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID),c12=actualModulationOmegaRemainder({profileId:source.id??SOURCE_PROFILE_ID}),audit=coefficientAudit(),innerError=qmul(q(256),DELTA),c12Error=POW(260),total=qadd(innerError,c12Error);
  return {
    schema:'MathScope.ActualContinuationOmegaComparison/1',profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:source.parameterExpressionSHA256,status:'PARTIAL',
    comparator:{definition:'Literal A.2 axial U/M with the same outer main-pulse amplitude and the exact M/J correction.',sourceParametersReplaced:false,nonlinearProfileReplacedByComparator:false,actualEFieldsNeedNotAgreeInsidePatch:true,reasonECanBeEliminatedHere:'The exact regular Omega functional identity depends on U, M, their eta jets through order two, and the retained axis boundary.'},
    actualInnerBound:{etaDomain:['-1','1'],ordinaryEtaOrders:[0,1,2],beforeModulation:true,sourceBound:'||U_actual_preC12-U_A2||_C_eta^2 <= 2*j0+Pstar*muMoment < 2^-16000 < delta=2^-2048',deltaExact:qtext(DELTA),derivation:[
      'The actual nonlinear core differs from Ustar=4eta+j0 by Q^-58 in C_eta^3; B.22 and B.26 add at most Q^-58+Q^-200. The resulting bound is smaller than j0, including all eta orders through two.',
      'B.34 keeps U=Gi. The eta-independent restoration on -8<log(X/XR)<-7 preserves the same bound and then makes U=4eta exactly.',
      'For the actual unique B.8 root, |z_j^(m)|<10^-6 for m<=4. Each bump is sigma prime at its affine argument, without an inverse-width amplitude normalization. |sigma prime|<=9. With |f|<=1, |f prime|<=2, |f second|<=8, the ordinary eta product rule bounds the two U bumps by 234*10^-6*Pstar*muMoment < Pstar*muMoment.',
      'j0=exp(-32008*T), Pstar*muMoment=exp(-16002*T), T>1, and e>2 imply 2*j0+Pstar*muMoment<3*2^-16002<2^-16000. Every source parameter remains strictly positive.'
    ],actualRootCoefficients:{uniformEnclosures:Array.from({length:5},(_,j)=>({coefficient:j,etaOrders:[0,1,2],interval:['-1/1000000','1/1000000']})),sameSourceIncomingDebtProofRequired:true,actualIncomingDebtProof:ACTUAL_CONTINUATION_COMPARISON_SOURCES.reference,rootValuesNumericallySolved:false,notArbitrarySuppliedRootBounds:true}},
    supportAndMass:{differenceSupport:'0<=X<=ell=XR*exp(-5)',differenceExactlyZeroAfterPatch:true,primitiveDifference:'Delta M(X,eta)=integral_0^X Delta U(s,eta) ds',primitiveVanishingReason:'The actual B.8 equations restore M exactly among the five accumulated moments. Equal U alone would not imply this.',primitiveDifferenceExactlyZeroAfterPatch:true,primitiveEtaDerivativesExactlyZeroAfterPatch:[0,1,2],averageBound:'|partial_eta^m Delta(M/X)|<=delta for m=0,1,2, by averaging; at X=0 use the regular limit.',laterHeatCorrection:'The heat compensation changes E only and leaves U and M unchanged.',allTailFieldsSameAfterI1:true},
    regularQuantities:{v:'V/X=(2eta U-2D eta M/X-d (M/X)_eta)/L',pointwiseDifferenceBounds:{v:'5*delta',vEta:'16*delta',Uv:'40*delta',UvEta:'256*delta',vSquared:'128*delta'},integrationMeasures:{pressure:'integral_0^ell 1 dX=ell<XR',flux:'integral_0^ell X dX=ell^2/2<XR^2/2'},axisBoundary:{actual:'[2A eta(4eta+j0)-4d]/L',comparator:'[8A eta^2-4d]/L',difference:'2A eta*j0/L',absoluteDifferenceUpper:'2*j0',atEtaZeroDifferenceExact:'0',omitted:false}},
    weightedRemainder:{preC12:{POverXR:qtext(innerError),FOverXR2:qtext(innerError),exactForm:'256*delta',uniformEtaDomain:['-1','1'],etaDerivativeOrders:[0]},final:{POverXR:qtext(total),FOverXR2:qtext(total),exactForm:'2^-2040+2^-260',c12NormalizationReason:'XR>1, so its absolute bounds remain upper bounds after division by XR or XR^2.',etaDerivativeOrders:[0]},targetEnclosures:{P:'P_final/XR in P_A2/XR + [-r,r]',F:'F_final/XR^2 in F_A2/XR^2 + [-r,r]',r:qtext(total)},centersNumericallyEvaluated:false,remainderIsRelativeError:false},
    arithmeticChecks:audit,finiteFrequencyRemainder:c12,sourceBindings:{assembly:source.inputs.assembly,specification:source.inputs.specification,proofs:ACTUAL_CONTINUATION_COMPARISON_SOURCES},
    scope:{sameSourceAxialComparisonProved:true,actualB26B34B8RemainderRetained:true,exactB8MMatchingUsed:true,completeGlobalOmegaComparisonEnclosure:true,fullA2IntegralCentersNumericallyEnclosed:false,fullGlobalOmegaMomentValuesAvailable:false,etaDerivativeFamilyOfMomentRemainderCertified:false,actualEContinuationAndB8PointRootsEvaluated:false,N5RadialShearOrPhaseCertificate:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}
  };
}

/** A whole PHYSICAL inner cell of the actual U/M/V, including the C.12 error.
 * This is a bound of the constructed field, not a finite difference or a
 * declaration that U equals 4eta. An eta point is requested; X is a cell.
 */
export function evaluateActualAxialContinuationCell(input={}){
  for(const key of Object.keys(input))if(!['sourceProfile','eta','XInterval','bits'].includes(key))fail('INVALID_INPUT','Unknown actual axial continuation input '+key);
  const source=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID),eta=readRational(input.eta??'1/4',4096),raw=input.XInterval??['1','100'];
  if(qcompare(eta,q(-1))<0||qcompare(eta,q(1))>0||!Array.isArray(raw)||raw.length!==2)fail('INVALID_INPUT','Expected eta in [-1,1] and two exact physical radial endpoints.');
  const [left,right]=raw.map(x=>readRational(x,4096));if(qcompare(left,q(0))<0||qcompare(right,q(110))>0||qcompare(left,right)>0)fail('INVALID_INPUT','The physical source cell requires 0<=Xleft<=Xright<=110.');
  const A=directedArithmetic(input.bits??192),e=A.point(eta),h=A.small(4096),L=A.sub(A.one(),A.mul(A.point(2),A.mul(h,A.mul(e,e)))),D=A.sub(A.point(q(1,2)),h),AA=A.add(A.point(q(1,2)),h),d=A.sub(A.one(),A.mul(e,e));
  // C12: ||Delta U||_C_eta^2, ||Delta M||_C_eta^2 <= R^22/N < R^-28.
  // On its support X>=R^-1, so ||Delta(M/X)|| <= R^-27 <= 2^-351.
  // Outside that support these differences are exactly zero.
  const error=qadd(DELTA,POW(351)),U=[A.widen(A.mul(A.point(4),e),error),A.widen(A.point(4),error),A.widen(A.zero(),error)],average=U.map(x=>[...x]);
  const n=A.sub(A.sub(A.mul(A.point(2),A.mul(e,U[0])),A.mul(A.point(2),A.mul(D,A.mul(e,average[0])))),A.mul(d,average[1]));
  const ne=A.sub(A.add(A.mul(A.point(2),A.add(U[0],A.mul(e,U[1]))),A.mul(A.point(2),A.mul(e,average[1]))),A.add(A.mul(A.point(2),A.mul(D,A.add(average[0],A.mul(e,average[1])))),A.mul(d,average[2])));
  const le=A.neg(A.mul(A.point(4),A.mul(h,e))),v=A.div(n,L),ve=A.div(A.sub(A.mul(ne,L),A.mul(n,le)),A.mul(L,L)),X=[A.point(left)[0],A.point(right)[1]];
  return {
    schema:'MathScope.ActualAxialContinuationCell/1',profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:source.parameterExpressionSHA256,status:'PARTIAL',request:{eta:qtext(eta),XInterval:[qtext(left),qtext(right)],bits:A.bits},
    rows:[...U.map((x,m)=>({id:'U',etaDerivativeOrder:m,actualInterval:A.pack(x)})),...average.map((x,m)=>({id:'MOverX',etaDerivativeOrder:m,actualInterval:A.pack(x)})),{id:'VOverX',etaDerivativeOrder:0,actualInterval:A.pack(v)},{id:'VOverX',etaDerivativeOrder:1,actualInterval:A.pack(ve)},{id:'M',etaDerivativeOrder:0,actualInterval:A.pack(A.mul(X,average[0]))},{id:'V',etaDerivativeOrder:0,actualInterval:A.pack(A.mul(X,v))}],
    error:{uniformJetRadius:qtext(error),exactExpression:'2^-2048+2^-351',includesActualB26B34B8:true,includesActualC12AndI1Repair:true,etaOrders:[0,1,2],proof:'C12 has R>=8192, N>R^50 and x_->=R^-1 on its difference support. Thus the primitive-average perturbation is <R^-27<=2^-351; it is exactly zero outside J.'},
    domain:{physicalXCell:['0','110'],allCellPointsEnclosed:true,physicalRadiusUsesSourceX:true,etaPointOnly:true},
    sourceBindings:{assembly:source.inputs.assembly,proofs:ACTUAL_CONTINUATION_COMPARISON_SOURCES,c12:actualModulationOmegaRemainder().source},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
    scope:{actualWholeAxialContinuationCellEnclosed:true,actualUEquals4Eta:false,actualAngularEEnclosed:false,fullGlobalMomentValuesEvaluated:false,radialDerivativesEnclosed:false,originalN404Complete:false,originalN405Complete:false,N5ShearOrPhaseCertificate:false,newLeanKernelProof:false}
  };
}
