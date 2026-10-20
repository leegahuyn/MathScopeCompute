/** Actual two-sign covariance for a distinct admissible whole-annulus
 * background. The positive first correction is kept. Only the proven
 * b_n-cutoff zero tail is omitted on the selected complete dyadic band.
 * No terminal-only leading-field substitution is made here.
 */
import {prepareActualAdmissibleAnnulusBackground,assertActualAdmissibleAnnulusBackground,actualAdmissibleAnnulusBackgroundCertificateFromProgram} from './actual-admissible-annulus-background.mjs';
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {actualLeadingTargetOnSensitivityGraph} from './actual-covariance-sensitivity.mjs';
import {covarianceConcentrationRecipe} from './actual-covariance-concentration.mjs';
import {annulusCovarianceAlgebraAudit} from './actual-annulus-covariance-kernel.mjs';
import {clearDisposableThirdJetCaches,disposableThirdJetCacheCopy} from './actual-third-jet-ftc.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const binding=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,coordinates:p.coordinates,chart:p.chart,fields:p.fields,leadingFields:p.leadingFields,
  frozen:p.frozen,constants:p.constants,geometry:p.geometry,cutoffs:p.cutoffs,families:p.families,target:p.target,quantitative:p.quantitative,
  bounds:p.bounds,selection:p.selection,proof:p.proof,decision:p.decision,checks:p.checks,roots:p.roots,algebra:p.algebra});
const requestOf=(input={})=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='sourceProfile'))
    fail('INVALID_INPUT','Only the original source profile is accepted; no background, scale, norm, H entry or positivity claim can be supplied.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);return{sourceProfile};
};

/** Exact structural independence, also for the inherited zero branches of
 * a frozen rounded label. This changes neither a source body nor a
 * nonconstant branch. Parameter derivatives of Volterra limits still need
 * their actual variational system and are not fabricated here.
 */
export class ActualAnnulusCovarianceExpressions extends ActualCovarianceExpressions{
  derivative(id,variable){if(!this.dependsOn(id,variable))return this.zero;return super.derivative(id,variable);}
}

function originalCutoffs(G,v,Ls,r0){
  const q=(n,d=1)=>G.q(n,d),xi=G.fresh('annulus_covariance_transverse_xi'),abs=G.sqrt(G.pow(G.div(xi,r0),2)),
    chi=G.choose(abs,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),abs))),G.zero),
    transverseMass=G.integral(G.pow(chi,2),xi,G.neg(r0),r0),
    psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))));
  return{xi,chi,transverseMass,psi,transverseMassBounds:[G.div(r0,q(2)),G.mul(q(2),r0)],
    longitudinalSupport:['Ls/5','4Ls/5'],longitudinalPlateau:['Ls/4','3Ls/4'],transverseMassNormalizedToOne:false};
}

function actualPrimitiveDerivation(source){
  return {
    sourceInputs:{actualC2Roots:structuredClone(source.transfer.newC2Roots),actualCutoffEnlargement:source.transfer.proofKind,
      actualFiniteBlockOrders:[1,2],actualN1RemainsInBothPulseFields:true,sourceThreshold:source.selection.sourceThreshold,
      actualLeadingDirection:structuredClone(source.sourceThreshold.direction.bounds)},
    scope:'The same original actual coefficient family, every source-only b_n>=c_n doubling continuation, all integer ell>=ellMinimum, and one original slow box. The selected H roots below exercise one complete band of that family.',
    normalizedTransfer:'For every q>0 the enlarged cutoff family is locally finite. The exact Euler-scale identity and b_n>=c_n preserve the actual n1/n2 C2 finite block and each original all-n diagonal bound. Thus the SAME constants control F,G and completed-leading slow C2 error O(q^(2h)).',
    chartPath:'Use the straight path in [1/2,2]x[Xa/2,2Xb]x[-1,1] and its slow image. Subtraction of the two implicit s equations gives |Delta s|<=2(|Delta T|+4|Delta Z|); X and eta endpoint changes and chart path length are bounded by the source B. No convexity of the slow image is assumed.',
    sourceJetDifference:'The fixed leading source C2 and completed-leading C2 bounds, same-box distance<=4/S^3, S^2*(epsilon+epsilon^2+k^-1)<=1 and B>=2^128 give |F-F0|,|F_R-F_R0|,|G_R-G_R0|<=B^5/S^3. The actual n1 term is bounded, not deleted.',
    frozenCancellation:'pTilde*F_R0+pz*G_R0=beta dot(Rrep*F_R0,G_R0)=-sign*Bs*u/Ls by the exact leading N,K definitions.',
    rounding:'p*k is the nearest nonzero integer with signed fallback in the zero cell; |p-pTilde|<=1/k. Only representative/source quantities enter the rounding, so every slow or pulse derivative of this label is zero.',
    radialNormal:'n_r=sign*Bs*(u/2+u*v/Ls)-v[(p-pTilde)F_R0+p(F_R-F_R0)+pz(G_R-G_R0)]. With Ls<=B*S, the error is <=B^12/S.',
    tangentNormal:'n_theta=p/R and n_z=pz-epsilon*v*(pF_Z+pzG_Z). Keep the original O(1/Ls) designed tilt, rounding, radial coordinate difference and entire epsilon*v term. Their total difference from Bs*K is <=B^12/S.',
    movingNormal:'n_prime=(-phaseSpeed_R,0,-epsilon*phaseSpeed_Z); the same cancellation and scale inequalities give |n_prime|<=B^12/S.',
    denominators:'Original leading source: F0>Renv^-10, |Ntheta|>Renv^-14, |g0|>Renv^-20, Renv^-6<|c0|<Renv^10, Renv^-31<lambda0<Renv^83. epsilon*k^2<=4 and u=2Renv^10 give Bs>Renv^-40>B^-1. S>=B^512 makes |n_tan-Bs*K|<=Bs/2 and hence |n_tan|>=B^-2. No finite H inversion is used to prove these primitive bounds.',
    referenceProjection:'At nref=Bs*(sref,K), retain the full original cylindrical K0. Its n-prime-free projection in Uref=[e_r-sref*K,N] is [[0,2F0*Ntheta/(1+sref^2)],[-(gabs+2F0*Ntheta),0]]. The separate exact generic projection check proves this identity for every relevant unit frame.',
    referenceDiagonalization:'The actual lambda0 sqrt radicand and c0=lambda0/(2F0*Ntheta) make J=[[1,1],[c0*sqrt(1+sref^2),-c0*sqrt(1+sref^2)]] diagonalize that reference to (+lambda,-lambda). Actual n-prime and B-prime stay in E_actual.',
    actualFrameError:'The executed FramePowerLedger applies ordinary products, reciprocals with the preceding source lower bounds, square roots and v derivatives to the retained actual Aphi,B,Bleft,Bprime. Its calculated exponents are each <256. Therefore |E_actual_ij|, |d-dref|, |N_a-N|, |K_a-K| and |s_a-sref| are bounded by B^256/S.',
    damping:'epsilon*k^2*Bs^2=lambda0/(1+u^2)^(3/2); therefore damping at the reference normal is exactly dref, and the actual normal difference gives the retained damping error.',
    unconditionalNorm:'Before smallness is used, nonzero p*k and R<=B give 1/|n_tan|<=kB. The finite actual products and derivatives give ||wMatrix||_infinity<=B^40*(1+k)^3*(1+Ls)^2, dominated by the retained B^256*(1+k)^8*(1+Ls)^8.',
    targetDirection:'The same actual full leading stress Tbar=s^(-A-1/2)*T0 and its closed-annulus unit-direction modulus are used. S>=Renv^1024 gives frozen target ratio variation<=kappa/16 inside the same box, including limiting directions at the two flat edges. Weight positivity below is claimed only where Xa<X<Xb and Tbar is nonzero.',
    allBandQualification:'This is a written source-bound universal estimate for the explicitly defined locally finite enlarged source family. A finite selected-band execution is not a materialization of every band, a choice of all original physical cutoff clauses, or a decision of the original unspecified Gamma.'
  };
}

export function prepareActualAdmissibleAnnulusCovariance(input={},context={}){
  const request=requestOf(input),source=prepareActualAdmissibleAnnulusBackground({sourceProfile:request.sourceProfile,derivativeOrder:2},context);
  return attachActualAdmissibleAnnulusCovariance(source,context);
}

export function attachActualAdmissibleAnnulusCovariance(source,context={}){
  assertActualAdmissibleAnnulusBackground(source);context.checkCancelled?.();
  if(source.request.derivativeOrder!==2||!source.scope.actualN1TermNotDropped||!source.transfer.c2ConstantsUnchanged)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the private complete annulus source with actual n1 and C2 transfer.');
  const cacheRecord=clearDisposableThirdJetCaches(source.G);assertActualAdmissibleAnnulusBackground(source);
  context.onProgress?.({stage:'annulus-covariance-source-caches-cleared',nodeCount:source.G.nodes.length,memoizedEntriesDiscarded:cacheRecord.rows.reduce((n,r)=>n+r.entries,0)});
  const G=new ActualAnnulusCovarianceExpressions(disposableThirdJetCacheCopy(source.G),{maxNodes:3000000,maxDerivativeOrder:128,checkCancelled:context.checkCancelled}),
    sourceNodeCount=source.G.nodes.length,request=requestOf({sourceProfile:source.request.sourceProfile}),q=(n,d=1)=>G.q(n,d),pow=(x,a)=>G.exp(G.mul(a,G.log(x))),{dot,mul}=covarianceMatrixAlgebra(G),
    {h,Renv,kappa,u,Bnorm,E,r0,Tg}=source.sourceThreshold.constants,{A,D}=G.core,
    {R,Z,T}=source.slow.coordinates,v=G.fresh('actual_annulus_pulse_v'),theta=G.fresh('actual_annulus_angle'),
    Xrep=G.fresh('actual_annulus_representative_X'),etaRep=G.fresh('actual_annulus_representative_eta'),sRep=G.fresh('actual_annulus_representative_s'),
    fields=structuredClone(source.slow.fields),leadingFields=structuredClone(source.slow.leadingFields),slowVariables=[R,Z,T],
    Rrep=G.sqrt(G.mul(q(2),sRep,Xrep)),Zrep=G.mul(pow(sRep,D),etaRep),Trep=G.mul(sRep,G.sub(G.one,G.pow(etaRep,2))),atRep=body=>G.simultaneousSubstitute(body,slowVariables,[Rrep,Zrep,Trep]),
    F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R)),
    g0=[G.mul(Rrep,FR0),GR0],gabs=G.sqrt(dot(g0,g0)),N=g0.map(x=>G.div(x,gabs)),K=[G.neg(N[1]),N[0]],
    growthRadicand=G.neg(G.mul(q(2),F0,N[0],G.add(gabs,G.mul(q(2),F0,N[0])))),lambda0=G.sqrt(growthRadicand),c0=G.div(lambda0,G.mul(q(2),F0,N[0])),
    frozen={F0,FR0,GR0,g0,gabs,N,K,lambda0,c0,growthRadicand,Rrep,Zrep,Trep,orderZero:true},
    {ell,Q,S,epsilon}=source.selection,k=G.ceiling(G.inv(G.sqrt(epsilon))),log2=G.log(q(2)),
    paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,h),ell,log2),G.mul(q(2),G.log(ell))),G.log(Tg)),paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient))),
    ci=G.mul(pow(Tg,paletteIndex),pow(Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci),
    Bs=G.sqrt(G.div(lambda0,G.mul(epsilon,G.pow(k,2),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3)))),
    cutoffs=originalCutoffs(G,v,Ls,r0),Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),haarFactor=G.mul(q(1,2),Dgeom,ci,cutoffs.transverseMass),
    matrixNorm=G.mul(G.pow(Bnorm,256),G.pow(G.add(G.one,k),8),G.pow(G.add(G.one,Ls),8)),
    constants={h,A,D,Renv,kappa,u,Bnorm,E,matrixNorm},geometry={ell,Q,S,epsilon,k,Tg,r0,paletteQuotient,paletteIndex,ci,Ls,Bs,Dgeom,haarFactor,
      lengthRatioBounds:[G.mul(q(2),r0),G.mul(q(2),r0,Tg)],angularAverage:q(1,2),
      rectangleBasis:[[G.one,G.sub(G.one,G.sqrt(q(2)))],[G.sub(G.sqrt(q(2)),G.one),G.one]],
      normalizedHaarNoExtraIntegerCoverMultiplicity:true},
    recipe=covarianceConcentrationRecipe(G,{...source.sourceThreshold.input,absoluteC0:G.neg(c0)}),
    parameters=[R,Z,T,Xrep,etaRep,sRep],families=[];
  for(const sign of [1,-1]){
    const beta=K.map((x,j)=>G.mul(Bs,G.sub(x,G.div(G.mul(q(sign),u,N[j]),G.mul(Ls,gabs))))),pTilde=G.mul(Rrep,beta[0]),pz=beta[1],scaledP=G.mul(k,pTilde),
      rounded=G.neg(G.ceiling(G.neg(G.add(scaledP,q(1,2))))),fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one),roundedInteger=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),
      p=G.div(roundedInteger,k),x0=G.mul(q(sign,2),Bs,u),phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G)),
      HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T),
      frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign}),
      time=G.fresh('annulus_covariance_reference_log_P'),logP=G.integral(G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,time),time,G.div(Ls,q(2)),v),P=G.exp(logP),
      system=G.defineCovarianceVolterra({name:'ActualAdmissibleWholeAnnulusPulse_'+(sign===1?'plus':'minus'),variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls}),
      w=[0,1].map(j=>G.covarianceValue(system,j,v,parameters)),z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x])).map(row=>row[0]),
      Htheta=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[1]),v,G.zero,Ls)),Hz=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[2]),v,G.zero,Ls)),
      mass=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(t[0],2)),v,G.zero,Ls)),Ac=G.mul(G.neg(c0),G.sqrt(G.add(G.one,G.pow(u,2))));
    families.push({sign,carrier:{beta,pTilde,p,pz,x0,roundedInteger,roundingErrorUpper:G.inv(k),nonzeroAngularInteger:true},
      phase:G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed)),phaseSpeed,phaseDerivatives:{R:HR,Z:HZ,T:HT},
      frame,logP,P,system,w,z,t,initial:{w:[G.one,G.zero],z:[G.substitute(P,v,G.zero),G.zero],finitePartialSumUsed:false},
      covariance:{theta:Htheta,z:Hz,mass,normalizedRows:[G.neg(G.div(G.add(G.mul(N[0],Htheta),G.mul(N[1],Hz)),G.mul(Ac,mass))),G.div(G.add(G.mul(K[0],Htheta),G.mul(K[1],Hz)),G.mul(u,mass))]}});
  }
  context.onProgress?.({stage:'annulus-actual-two-sign-Volterra-and-H',nodeCount:G.nodes.length});
  const raw=actualLeadingTargetOnSensitivityGraph(G,{background:source.background,chart:source.slow.chart,constants}),components=raw.components,
    H=[families.map(f=>f.covariance.theta),families.map(f=>f.covariance.z)],determinant=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0])),
    adjugate=[[H[1][1],G.neg(H[0][1])],[G.neg(H[1][0]),H[0][0]]],weights=adjugate.map(row=>G.div(dot(row,components),determinant)),
    Hy=H.map(row=>dot(row,weights)),inverseChecks=Hy.map((v,j)=>sourceGraphRationalIdentity(G,G.sub(v,components[j]),{atomicNodes:[...H.flat(),...components]})),
    Ac=G.mul(G.neg(c0),G.sqrt(G.add(G.one,G.pow(u,2)))),targetN=dot(N,components),targetK=dot(K,components),targetScale=G.neg(G.div(targetN,Ac)),
    C=[families.map(f=>f.covariance.normalizedRows[0]),families.map(f=>f.covariance.normalizedRows[1])],detC=G.sub(G.mul(C[0][0],C[1][1]),G.mul(C[0][1],C[1][0])),
    massLower=G.mul(haarFactor,recipe.mass.massLowerCoefficient,G.sqrt(Ls)),massUpper=G.mul(haarFactor,G.pow(recipe.cone.amplitudeUpper,2),Ls),
    absoluteDeterminantLower=G.mul(q(15,8),Ac,u,...families.map(f=>f.covariance.mass)),uniformAbsoluteDeterminantLower=G.mul(q(15,8),Ac,u,G.pow(massLower,2)),
    weightLower=families.map(f=>G.div(G.mul(kappa,targetScale),G.mul(q(64),f.covariance.mass))),weightUpper=families.map(f=>G.div(G.mul(q(2),targetScale),f.covariance.mass)),
    lowerWithoutH=G.div(G.mul(kappa,targetScale),G.mul(q(64),massUpper)),upperWithoutH=G.div(G.mul(q(2),targetScale),massLower),
    target={raw,H,determinant,adjugate,components,weights,squareRootWeights:weights.map(y=>G.sqrt(y)),Hy,inverseChecks,targetScale,
      targetDirectionRatio:G.div(G.mul(Ac,targetK),G.mul(u,G.neg(targetN))),normalizedWeights:weights.map((y,j)=>G.div(G.mul(families[j].covariance.mass,y),targetScale))},
    quantitative={Ac,C,detC,maximumColumnError:G.div(kappa,q(128)),normalizedDeterminantBounds:[q(15,8),q(17,8)],normalizedWeightBounds:[G.div(kappa,q(64)),q(2)],
      massLower,massUpper,absoluteDeterminantLower,uniformAbsoluteDeterminantLower,signedDeterminantUpper:G.neg(absoluteDeterminantLower),
      weightLower,weightUpper,weightLowerWithoutH:lowerWithoutH,weightUpperWithoutH:upperWithoutH,squareRootLowerWithoutH:G.sqrt(lowerWithoutH),squareRootUpperWithoutH:G.sqrt(upperWithoutH),numericalIntegralEvaluation:false},
    algebra=annulusCovarianceAlgebraAudit(),primitive=actualPrimitiveDerivation(source),
    bounds={primitive,operatorPowerAudit:source.sourceThreshold.matrixAudit,concentrationScalarAudit:source.sourceThreshold.concentrationAudit,
      inverseConeAudit:source.sourceThreshold.inverseAudit,sourceDirection:source.sourceThreshold.direction,recipe,
      errorConstants:{operator:E,damping:E,unitFrame:E,slope:E},sourceOnlyCommonConditions:source.sourceThreshold.conditions,
      commonEllMinimum:source.selection.sourceEllMinimum,commonQStar:source.selection.sourceQStar,
      actualSelectedOperatorBodyBound:true,writtenUniversalEnlargedSourceNormArgument:true,allBandsLiteralGraphsMaterialized:false},
    selection={ell,Q,S,epsilon,b1:source.roots.b1,b2:source.roots.b2,sourceEllMinimum:source.selection.sourceEllMinimum,sourceQStar:source.selection.sourceQStar,
      entireBandSourceQStarRatioUpper:q(1,128),actualOneActiveOrderBand:true,backgroundIsDistinctFromCanonical:true,
      exactBackgroundSource:'actual-admissible-annulus-background.mjs',originalPhysicalAllOrderSelectorComplete:false,unknownOriginalGammaMembership:'NOT_EVALUATED'},
    coordinates={R,Z,T,theta,v,Xrep,etaRep,sRep},chart={...structuredClone(source.slow.chart),
      slowPointDomain:'Image of [1/2,2]x[Xa/2,2Xb]x[-1,1].',representativeDomain:'Xrep in[Xa,Xb], etaRep in[-1,1], sRep in[1/2,2].',
      covarianceDomain:'Same original slow box with Euclidean distance<=4/S^3; both signs are columns of that box.',
      positiveWeightDomain:'Intersect the slow point with Xa<X<Xb; all nonzero stress positions in this open annulus.',
      smoothSquareRootDomain:'Interior eta/positive-time slow chart for fixed labels; eta endpoints use only original inward continuous jets. Flat radial extensions are separate.'};
  const witnessX=q(110),witnessR=G.sqrt(G.mul(q(2),witnessX)),at=body=>G.simultaneousSubstitute(body,parameters,[witnessR,G.zero,G.one,witnessX,G.zero,G.one]),
    witness={X:witnessX,R:witnessR,Z:G.zero,T:G.one,Xrep:witnessX,etaRep:G.zero,sRep:G.one,q:Q,
      H:H.map(row=>row.map(at)),weights:weights.map(at),target:components.map(at),actualF:at(fields.F),leadingF:at(leadingFields.F),
      activeOrderOneRetainedInFormula:true,coefficientNonzeroNumericallyAsserted:false,
      proof:'Original Xi=110 lies between Xa and Xb. Choose a slow box containing this point and the point as its permitted representative. Both slow and representative points then coincide; no unproved lattice-center constraint is imposed.',
      explicitLatticeIndexMaterialized:false};
  const familyChecks=families.flatMap(f=>{
    const system=G.covarianceSystems[f.system],n=[G.sub(f.carrier.x0,G.mul(v,f.phaseDerivatives.R)),G.div(f.carrier.p,R),G.sub(f.carrier.pz,G.mul(epsilon,v,f.phaseDerivatives.Z))],
      nPrime=[G.neg(f.phaseDerivatives.R),G.zero,G.neg(G.mul(epsilon,f.phaseDerivatives.Z))],
      sourceK=[[G.zero,G.neg(G.mul(q(2),fields.F)),G.zero],[G.add(G.mul(q(2),fields.F),G.mul(R,G.derivative(fields.F,R))),G.zero,G.zero],[G.derivative(fields.G,R),G.zero,G.zero]],
      pressure=[0,1,2].map(j=>G.sub(G.add(...sourceK.map((row,i)=>G.mul(n[i],row[j]))),nPrime[j])),
      Aphi=sourceK.map((row,i)=>row.map((v,j)=>G.add(G.neg(v),G.div(G.mul(n[i],pressure[j]),dot(n,n))))),
      frozenLabels=[f.carrier.p,f.carrier.pz,f.carrier.x0];
    return[
      {id:'actual-completed-fields-in-phase-'+f.sign,pass:f.phaseSpeed===G.add(G.mul(f.carrier.p,fields.F),G.mul(f.carrier.pz,fields.G))&&fields.F!==leadingFields.F&&fields.G!==leadingFields.G},
      {id:'actual-moving-normal-and-pressure-'+f.sign,pass:same(f.frame.n,n)&&same(f.frame.nPrime,nPrime)&&same(f.frame.principalK,sourceK)&&same(f.frame.Aphi,Aphi)},
      {id:'actual-basis-v-derivative-'+f.sign,pass:same(f.frame.BPrime,f.frame.B.map(row=>row.map(x=>G.derivative(x,v))))},
      {id:'actual-fixed-zero-initial-Volterra-'+f.sign,pass:same(system.matrix,f.frame.wMatrix)&&same(system.initial,[G.one,G.zero])&&system.length===Ls&&system.normUpper===matrixNorm&&system.variable===v&&same(system.parameters,parameters)},
      {id:'actual-two-H-and-positive-mass-integrands-'+f.sign,pass:[1,2].every((j,i)=>H[i][families.indexOf(f)]===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),f.t[0],f.t[j]),v,G.zero,Ls)))&&f.covariance.mass===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(f.t[0],2)),v,G.zero,Ls))},
      {id:'actual-rounded-labels-are-slow-and-time-independent-'+f.sign,pass:frozenLabels.every(x=>[R,Z,T,v].every(v=>!G.freeCoordinates(x).has(v)&&G.derivative(x,v)===G.zero))}
    ];
  });
  const checks=[
    {id:'private-actual-whole-annulus-background',pass:source.scope.actualWholeAnnulusOneActiveOrderBandConstructed&&source.scope.actualN1TermNotDropped&&source.transfer.c2ConstantsUnchanged},
    {id:'source-node-prefix-copied-exactly',pass:same(G.nodes.slice(0,sourceNodeCount),source.G.nodes.slice(0,sourceNodeCount))},
    {id:'actual-slow-leading-and-completed-fields-retained',pass:same(fields,source.slow.fields)&&same(leadingFields,source.slow.leadingFields)&&source.slow.multipliers.F!==G.one},
    {id:'actual-positive-h-not-replaced',pass:h===G.parameter('h')&&sourceExponentContract().positive&&sourceExponentContract().notNumericallyReplaced},
    {id:'source-uniform-B-and-E-exactly-retained',pass:Bnorm===source.selection.sourceThreshold.constants.Bnorm&&E===G.pow(Bnorm,256)&&G.freeCoordinates(Bnorm).size===0},
    {id:'actual-leading-reference-sqrt-relations',pass:G.nodes[gabs].op==='sqrt_positive'&&G.nodes[gabs].args[0]===dot(g0,g0)&&G.nodes[lambda0].op==='sqrt_positive'&&G.nodes[lambda0].args[0]===growthRadicand&&c0===G.div(lambda0,G.mul(q(2),F0,N[0]))},
    {id:'actual-selected-source-dyadic-membership',pass:ell===source.selection.ell&&Q===source.selection.Q&&source.band.sourceQStarRatioUpper===q(1,128)&&source.selection.arithmetic.pass},
    {id:'original-palette-and-length-ratios',pass:same(geometry.lengthRatioBounds,[recipe.input.lengthRatioLower,recipe.input.lengthRatioUpper])&&Ls===G.div(G.mul(q(2),r0),ci)},
    {id:'actual-representative-recipe-under-source-uniform-selector',pass:recipe.selection.conditions.every((r,j)=>r.lower===G.substitute(source.sourceThreshold.recipe.selection.conditions[j].lower,source.sourceThreshold.input.absoluteC0,G.neg(c0)))},
    {id:'actual-operator-error-power-and-concentration-lemmas',pass:bounds.operatorPowerAudit.pass&&bounds.concentrationScalarAudit.pass&&bounds.inverseConeAudit.pass&&bounds.sourceDirection.pass&&algebra.pass},
    {id:'actual-full-leading-target-pressure-and-both-shears',pass:raw.F===source.background.prepared.records[0].global.F&&raw.M===source.background.prepared.bootstrap.finalM&&raw.Pi===G.add(G.core.P0,raw.Cp)&&raw.bothShearTermsRetained&&raw.chartFactor===G.exp(G.mul(G.neg(G.add(A,q(1,2))),G.log(chart.s)))},
    {id:'exact-actual-two-row-inverse',pass:inverseChecks.every(x=>x.pass)},
    {id:'all-witness-slow-and-representative-coordinates-substituted',pass:[...witness.H.flat(),...witness.weights,...witness.target,witness.actualF,witness.leadingF].every(x=>G.freeCoordinates(x).size===0)},
    ...familyChecks
  ];
  if(!checks.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual whole-annulus covariance binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const proof={kind:'SOURCE_BOUND_ANALYTIC_POSITIVITY_FOR_ACTUAL_COMPLETED_ANNULUS_PULSE',
    sourceTransfer:primitive,
    band:'The authenticated b1,b2 selection gives ell>=ellMinimum+12 and q<=qStar/128 throughout the selected physical band. S>=every source condition and S^2*(epsilon+epsilon^2+k^-1)<1 follow with original h>0.',
    palette:'For m=floor(((1+h)*ell*log2-2logell)/logTg), 1/(Tg*S)<ci<=1/S. Hence 2r0<=Ls/S<2r0*Tg for the actual source palette.',
    exactSolutions:'Each w is the exact Volterra limit of its retained actual moving-frame matrix, initial (1,0), and finite source matrix norm. The actual t=B*(P*w), pressure and n-prime/B-prime are preserved.',
    radialMass:'The source error bounds and Riccati cone give z_plus>0, |z_minus/z_plus|<=coneK/S<=1/2, and x=t_r>0. The original psi plateau and Gaussian curvature imply the displayed positive massLower; P<=1 implies massUpper.',
    columns:'The actual frame bounds and the continuous Gaussian absolute-moment estimate give |C-Cideal|_max<=kappa/128, Cideal=[[1,1],[-1,1]]. No finite pulse sample or asymptotic limit is substituted for its integral.',
    determinant:'The exact cone polynomial certificate gives 15/8<det C<17/8; det H=-Ac*u*mass_plus*mass_minus*det C<0. Thus the actual inverse denominators on the full declared annulus domain do not vanish.',
    positiveWeights:'For Xa<X<Xb, the unchanged full leading target and the source same-box direction modulus give targetScale=-(N dot Tbar)/Ac>0 and kappa/64<=mass_sign*y_sign/targetScale<=2. Both actual y_sign and their positive square roots satisfy the displayed bounds.',
    interiorSmoothness:'For fixed band and frozen labels, the actual finite coefficient body is smooth on the open slow chart; its compact-interval Volterra solution, H and full target have every finite slow derivative. Nonzero determinant and positive y imply smooth positive square roots in the interior. No derivative of a rounded label is included.',
    universalNormScope:primitive.allBandQualification,
    remaining:'Radial flat zero-extensions, coherent all-n original physical cutoff selection, every-band literal covariance roots and final paper Gamma remain separate. Eta endpoints use the original inward heat jets, not negative-time extension.'},
    decision={actualCompletedN1BackgroundRetained:true,actualNewWholeAnnulusTwoSignHConstructed:true,actualWholeSelectedBandBelowSourceQStar:true,
      actualDeterminantSign:'NEGATIVE',actualDeterminantNonzeroOnDeclaredAnnulusDomain:true,actualInverseWeightSigns:['POSITIVE','POSITIVE'],
      actualPositiveWeightsOnOpenWholeAnnulus:true,actualPositiveSmoothSquareRootsInOpenFixedLabelChart:true,
      actualSourceUniformC2AndOperatorNormArgumentWritten:true,allBandsLiteralCovarianceGraphsConstructed:false,allSourceBoxIndicesMaterialized:false,
      originalAllOrderPhysicalCutoffSelectionComplete:false,innerFlatSquareRootExtensionCertified:false,outerFlatExtensionForThisNewBackgroundCertified:false,
      numericalWholeHEnclosure:false,unknownOriginalGammaMembership:'NOT_EVALUATED',wholeGPOSComplete:false,
      wholePhysicalResidualAndFlatErrorComplete:false,newAnalyticLeanKernelProof:false,m3MayStart:false},
    sourceBinding={sourceProfile:request.sourceProfile,parameterExpressionSHA256:source.sourceBinding.parameterExpressionSHA256,
      backgroundCompiler:source.program.compiler,backgroundPrefixNodeCount:sourceNodeCount,backgroundDefinition:'Distinct enlarged b_n with actual n1 on its whole selected annulus band; canonical c_n and original coefficients are unchanged.',
      operatorDefinition:'Original palette, frozen leading reference, actual completed F/G phase and moving frame, pressure, exact Volterra limits and both Haar covariance columns.',
      targetDefinition:'Actual full leading source moments, original pressure datum and both shear terms; no supplied target vector.',
      functionCacheOnlyDiscarded:true,sourceBodyOrDefinitionChanged:false,originalEllOneOperatorReused:false,terminalOnlySupportReductionUsed:false},
    roots={Q,ell,S,epsilon,k,ci,Ls,Bs,sourceNorm:Bnorm,sourceEllMinimum:selection.sourceEllMinimum,sourceQStar:selection.sourceQStar,H,determinant,weights,squareRootWeights:target.squareRootWeights,
      actualCompletedF:fields.F,actualCompletedG:fields.G,actualLeadingF:leadingFields.F,actualLeadingG:leadingFields.G,massLower,massUpper,uniformAbsoluteDeterminantLower,weightLowerWithoutH:lowerWithoutH,weightUpperWithoutH:upperWithoutH,witness},
    result={G,source,request,sourceBinding,coordinates,chart,fields,leadingFields,frozen,constants,geometry,cutoffs,families,target,quantitative,bounds,selection,proof,decision,checks,roots,algebra},
    packed=G.pack(roots,{schema:'MathScope.ActualAdmissibleAnnulusCovarianceProgram/1',compiler:'actual-admissible-annulus-covariance.mjs:prepareActualAdmissibleAnnulusCovariance',compilerInput:request,
      sourceBinding,coordinates,chart,fields,leadingFields,frozen,constants,geometry,cutoffs,families,target,quantitative,bounds,selection,proof,decision,checks,algebra}),{nodes,...rest}=packed;
  result.program={...structuredClone(rest),nodes:nodes.slice()};
  seals.set(result,{G,source,program:result.program,programNodes:result.program.nodes,metadata:metadata(result.program),serialized:canonicalStringify(result.program),
    count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,covariance:JSON.stringify(G.covarianceSystems),binding:binding(result)});
  return result;
}

export function assertActualAdmissibleAnnulusCovariance(p){
  const s=seals.get(p);if(!s||p.G!==s.G||p.source!==s.source||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||
    binding(p)!==s.binding||JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(p.G.nodes.slice(0,s.count))!==s.nodes||!p.G.functionDefinitionsUnchanged(s.definitions)||
    JSON.stringify(p.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the privately constructed unchanged actual annulus pulse and fixed compiler prefix; altered fields, norms, H or conclusions are not certificates.');
  assertActualAdmissibleAnnulusBackground(s.source);return true;
}

export async function actualAdmissibleAnnulusCovarianceCertificateFromProgram(p,context={}){
  assertActualAdmissibleAnnulusCovariance(p);const s=seals.get(p),background=await actualAdmissibleAnnulusBackgroundCertificateFromProgram(p.source,context);context.checkCancelled?.();
  return {schema:'MathScope.ActualAdmissibleAnnulusCovarianceCertificate/1',status:'ACTUAL_SOURCE_BOUND_WHOLE_ANNULUS_POSITIVITY_ON_SELECTED_BAND',pass:true,
    request:p.request,sourceBinding:p.sourceBinding,background:{graph:background.graph,scope:background.scope},
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).length,compiler:p.program.compiler,fixedCompilerPrefix:true,laterAppendsExcluded:true,graphIncluded:false},
    selection:p.selection,domain:p.chart,decision:p.decision,quantitative:p.quantitative,proof:p.proof,checks:p.checks,algebra:p.algebra,
    sourceBounds:{primitive:p.bounds.primitive,powerAudit:p.bounds.operatorPowerAudit,conditions:p.bounds.sourceOnlyCommonConditions,recipe:p.bounds.recipe},
    actualInverseChecks:p.target.inverseChecks,roots:p.roots,
    scope:'Actual completed-background two-sign H with written source-bound det<0 and positive inverse/sqrt weights for the selected complete band and every same-box pair in the whole open annulus. Source C2/operator norm theorem is uniform for the enlarged family; all-band literal graphs, radial flat extensions, final physical selector/Gamma, numeric whole H, analytic Lean and M3 are not completed here.'};
}
