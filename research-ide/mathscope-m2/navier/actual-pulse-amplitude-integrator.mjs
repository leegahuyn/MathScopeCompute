/** Validated actual Imean homogeneous amplitude, with its original left datum. */
import {point,iadd,isub,imul,idiv,iscale,ipower,ilog,iexp} from '../../mathscope-m1/navier/numerics.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {actualLeftGrowingDatum} from './actual-pulse-construction.mjs';
import {evaluateActualMeanPatchJet} from './actual-pulse-meanpatch.mjs';
import {actualMeanPulseIntegrationScales,compileActualMeanPulsePhase} from './actual-pulse-amplitude-phase.mjs';

const bad=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const positive=z=>[Math.max(0,z[0]),z[1]],square=z=>positive(imul(z,z)),sqrt=z=>ipower(z,.5);
const midpoint=z=>z[0]/2+z[1]/2;
function valid(z,name,positiveLower=false){if(!Array.isArray(z)||z.length!==2||!z.every(Number.isFinite)||z[0]>z[1]||positiveLower&&z[0]<=0)bad('Invalid '+name+' interval.');}

/** Constant-potential comparison transfer for V''=(G^2+H)V, divided by exp(G*step).
 * This is a mathematical operator; only the caller's source binding can certify a source instance.
 */
export function encloseLiouvilleTransfer({potential,step,inverseGrowth}){
  valid(potential,'potential');valid(step,'step',true);valid(inverseGrowth,'inverse growth');
  if(potential[0]<0||inverseGrowth[0]<0||inverseGrowth[1]<=0)bad('Positive growth and a nonnegative potential are required.');
  const ratio=sqrt(iadd(point(1),imul(potential,square(inverseGrowth)))),shift=idiv(imul(potential,inverseGrowth),iadd(ratio,point(1))),factor=iexp(imul(shift,step));
  let decay;
  if(inverseGrowth[0]>0)decay=positive(iexp(iscale(idiv(imul(ratio,step),inverseGrowth),-2)));
  else {const exponent=idiv(iscale(point(step[0]),-2),point(inverseGrowth[1]));decay=[0,iexp(exponent)[1]];}
  const diagonal=iscale(imul(factor,iadd(point(1),decay)),.5),off=iscale(imul(factor,isub(point(1),decay)),.5);
  const matrix=[[diagonal,idiv(off,ratio)],[imul(off,ratio),diagonal]];
  if(matrix.flat().some(z=>z[0]<0))bad('The cooperative comparison transfer must remain entrywise nonnegative.');
  return {matrix,scaledGrowthFactor:factor,decayingModeFactor:decay,kappaOverGrowth:ratio,sourceInstanceCertified:false,comparisonPrinciple:'Positive Volterra kernels bound the variable potential by its cellwise infimum and supremum.'};
}

const matvec=(a,x)=>a.map(row=>row.reduce((s,v,j)=>iadd(s,imul(v,x[j])),point(0)));

export function actualMeanPulseAmplitude(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))bad('The actual amplitude request must be an object.');
  const allowed=['sourceProfile','y','sign','steps'];for(const key of Object.keys(input))if(!allowed.includes(key))bad('Unknown actual amplitude input: '+key);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,y=input.y??2.5,sign=input.sign??1,steps=input.steps??64;
  assertSourceProfile(sourceProfile);
  if(!Number.isFinite(y)||y<.25||y>4.75||![1,-1].includes(sign))bad('Use an actual Imean representative y in [1/4,19/4] and sign +1 or -1.');
  if(!Number.isSafeInteger(steps)||steps<8||steps>256||(steps&(steps-1)))bad('Use 8,16,32,64,128 or 256 exact dyadic pulse cells.');
  context.checkCancelled?.();
  const sourceScales=actualMeanPulseIntegrationScales();if(!sourceScales.pass)bad('Actual source integration scale proof failed.');
  const program=compileActualMeanPulsePhase({sourceProfile,y,sign}),field=evaluateActualMeanPatchJet({sourceProfile,y,eta:0,s:1,order:3}),reference=actualLeftGrowingDatum({samples:steps});
  const tiny=2**-1000,delta=[0,tiny],q=sign===1?[0,tiny]:[-tiny,0],rounding=[-tiny,tiny],slope=iadd(point(1),rounding),t2=iadd(point(1),square(q)),t=sqrt(t2),delta2=square(delta),delta2t2=positive(imul(delta2,t2)),inverseGrowth=[0,tiny],sqrtLambda=[0,tiny],lambda=square(sqrtLambda),phaseFactor=iexp([-tiny,tiny]);
  const shifted=a=>iadd(point(.5),imul(slope,isub(a,point(.5)))),D=a=>iadd(square(shifted(a)),delta2t2),Dref=a=>iadd(square(a),delta2),D0=D(point(.5)),refD0=Dref(point(.5)),rootD0=sqrt(D0),t0=point(.5),beta=a=>idiv(imul(slope,shifted(a)),sqrt(D(a))),Hden=ipower(iadd(point(1),delta2),1.5);
  // Divide by the integer 3 inside the outward arithmetic; do not interpret a
  // rounded binary64 value of 1/3 as the exact coefficient in (7.12).
  reference.rows.forEach((row,index)=>{
    const a=point(.5+index/steps),rootA=sqrt(Dref(a)),rootOne=sqrt(iadd(point(1),delta2)),polynomial=idiv(iadd(imul(isub(a,point(1)),delta2),idiv(isub(imul(square(a),a),point(1)),point(3))),Hden);
    row.normalizedLogPInterval=2*index===steps?point(0):isub(ilog(idiv(iadd(a,rootA),iadd(point(1),rootOne))),polynomial);
  });
  reference.initial.logP0CoefficientInterval=reference.rows[0].normalizedLogPInterval;
  const liouville=a=>idiv(ilog(idiv(iadd(shifted(a),sqrt(D(a))),iadd(point(.5),rootD0))),slope);
  const Vinitial=imul(ipower(D0,.25),sqrt(refD0));
  let state=[point(1),iadd(idiv(rootD0,imul(t,sqrt(refD0))),iscale(imul(beta(t0),inverseGrowth),.5))];
  const cells=[],rows=[];
  function observe(index){
    const pulseFraction=index/steps,a=point(.5+pulseFraction),d=D(a),prefactorX=imul(t,imul(Vinitial,ipower(d,-.75))),prefactorY=imul(Vinitial,ipower(d,-.25)),adjustedDerivative=isub(state[1],iscale(imul(imul(beta(a),inverseGrowth),state[0]),.5));
    const radial=index===0?point(1):imul(phaseFactor,imul(prefactorX,adjustedDerivative)),movingN=index===0?sqrt(refD0):imul(phaseFactor,imul(prefactorY,state[0]));
    if(radial[0]<=0||movingN[0]<=0)bad('Validated original growing solution lost its positive cone.');
    // Distinct exact ratios share one deliberately weak numerical bound; they
    // are not identified as equal source values.
    const qOverSqrtLambda=sign===1?[0,tiny]:[-tiny,0],qSqrtLambda=sign===1?[0,tiny]:[-tiny,0],
      thetaOverSqrtLambdaUStarP=isub(idiv(movingN,t),imul(idiv(iscale(imul(shifted(a),qOverSqrtLambda),sign),t2),radial)),
      zOverUStarP=iadd(imul(idiv(iscale(shifted(a),sign),t2),radial),imul(idiv(qSqrtLambda,t),movingN)),
      uniformVector=[imul(delta,radial),imul(sqrtLambda,thetaOverSqrtLambdaUStarP),zOverUStarP],energy=uniformVector.reduce((z,c)=>iadd(z,square(c)),point(0)),
      energyDerivativeOverGrowth=iscale(isub(imul(iadd(point(1),lambda),imul(radial,thetaOverSqrtLambdaUStarP)),imul(idiv(d,Hden),energy)),2),
      logRatio=ilog(radial),actualNormalizedLogRadial=iadd(reference.rows[index].normalizedLogPInterval,imul(inverseGrowth,logRatio)),actualNormalizedLogNorm=iadd(reference.rows[index].normalizedLogPInterval,iadd(iscale(imul(inverseGrowth,ilog(energy)),.5),[0,tiny]));
    const normalOverBsUStar=[iscale(shifted(a),sign),imul(q,delta),iscale(delta,-1)],orthogonality=normalOverBsUStar.reduce((z,n,j)=>iadd(z,imul(n,uniformVector[j])),point(0));
    rows.push({index,pulseFraction,pulseFractionExact:index+'/'+steps,a:midpoint(a),liouvilleCoordinateInterval:liouville(a),radialOverP:radial,minusMovingNOverSqrtLambdaUStarP:movingN,thetaOverSqrtLambdaUStarP,zOverUStarP,vectorOverUStarP:uniformVector,normalOverBsUStar,orthogonalityResidualInterval:orthogonality,energyOverP2UStar2:energy,energyDerivativeOverGScaleP2UStar2:energyDerivativeOverGrowth,logRadialOverP:logRatio,referenceNormalizedLogP:reference.rows[index].normalizedLogPInterval,actualNormalizedLogRadial,actualNormalizedLogNorm,actualAmplitude:{strictlyPositiveRadial:true,P:{expression:'exp(Gscale*f(a,1/u_star))',positive:true,underflowIsNotZero:true},radialMultiplierInterval:radial,unitMidpointAmplitudeImposed:false},scaledLiouvilleState:state.map(z=>[...z]),sourcePath:`result.results.rows[${index}]`});
  }
  observe(0);
  for(let index=0;index<steps;index++){
    context.checkCancelled?.();const a0=.5+index/steps,a1=.5+(index+1)/steps,intervalA=[a0,a1],step=idiv(ilog(idiv(iadd(shifted(point(a1)),sqrt(D(point(a1)))),iadd(shifted(point(a0)),sqrt(D(point(a0)))))),slope),potential=iscale(imul(square(slope),iadd(point(1),idiv(delta2t2,D(intervalA)))),.25);
    const transfer=encloseLiouvilleTransfer({potential,step,inverseGrowth});state=matvec(transfer.matrix,state);
    if(state.some(z=>z[0]<=0))bad('Cellwise comparison requires positive Liouville data.');
    cells.push({index,aInterval:intervalA,liouvilleStep:step,potentialInterval:potential,scaledTransfer:transfer.matrix,scaledGrowthFactor:transfer.scaledGrowthFactor,decayingModeFactor:transfer.decayingModeFactor,postState:state.map(z=>[...z]),sourcePotential:'(1+theta)^2/4*(1+(t/u_star)^2/D)',wholeCellPotentialEnclosed:true,sourcePath:`result.results.cells[${index}]`});
    observe(index+1);
  }
  const checks=[
    {id:'actual-source-scale-proof',pass:sourceScales.pass},
    {id:'every-cell-cooperative-comparison',pass:cells.every(c=>c.wholeCellPotentialEnclosed&&c.scaledTransfer.flat().every(z=>z[0]>=0))},
    {id:'original-left-growing-data',pass:rows[0].radialOverP[0]===1&&rows[0].radialOverP[1]===1&&reference.initial.midpointUnitSeedUsed===false},
    {id:'reference-midpoint-normalization',pass:reference.rows[steps/2].normalizedLogPInterval.every(x=>x===0)},
    {id:'actual-midpoint-not-reference',pass:rows[steps/2].radialOverP[1]<.36&&rows[steps/2].radialOverP[0]>.34},
    {id:'transverse-source-amplitudes',pass:rows.every(r=>r.orthogonalityResidualInterval[0]<=0&&r.orthogonalityResidualInterval[1]>=0)},
    {id:'positive-actual-energy',pass:rows.every(r=>r.energyOverP2UStar2[0]>0)},
    {id:'both-end-normalized-gaussian-decay',pass:rows[0].actualNormalizedLogNorm[1]<-.06&&rows.at(-1).actualNormalizedLogNorm[1]<-.06}
  ];
  return {schema:'MathScope.ActualMeanPulseAmplitude/1',profileId:sourceProfile,sourceHash:PINNED_N3.inputs.assembly.sha256,request:{y,sign,steps},coordinateFrame:'BAND_CHART_Q_FIXED',restoredQuantitiesArePhysicalCartesian:false,sourceScales,phaseProgram:program,actualMeanField:field,
    reduction:{sourceEquation:'(7.5)-(7.8), homogeneous m=1, fixed actual eta=0 Imean representative',coordinates:{a:'1/2+v/Ls',qAngular:'p/(R0*Bs)',theta:'(2+2*lambda)*F0*Ls*qAngular/(sign*u_star)-1',t:'sqrt(1+qAngular^2)',D:'aTilde^2+(t/u_star)^2',Gscale:'lambda0*Ls/u_star',liouville:'d zeta/d a = D^-1/2'},actualSystem:['x_a=-(D_a/D)*x+Gscale*t*ybar/D-Gscale*D*x/(1+u_star^-2)^(3/2)','ybar_a=Gscale*x/t-Gscale*D*ybar/(1+u_star^-2)^(3/2)'],scalarEquation:'After removing the exact common damping, (D*Y_a)_a=Gscale^2*Y.',liouvilleEquation:'V_zetazeta=(Gscale^2+(1+theta)^2/4*(1+(t/u_star)^2/D))*V; V=D^1/4*Y.',movingNormalTermRetained:true,movingFrameDerivativeRetained:true,dampingRetained:true,roundingEffectOnGrowthIntegralRetained:'absolute log correction < 2^-1000; sourceScales supplies the stronger carrier proof'},
    initial:{...reference.initial,problem:'HOMOGENEOUS_M1_GROWING_SOLUTION',sourceCoefficient:0,zeroDatumSourcedInverse:false},rows,cells,
    energy:{identity:'d_v |t|^2 = -2*t dot K*t - 2*d*|t|^2',normalizedIdentity:'(d_a |t|^2)/(Gscale*P^2*u_star^2)=2*((1+lambda)*X*Theta-(D/(1+u_star^-2)^(3/2))*E)',sourcePressureOrthogonalExactly:true,normalPressureTermRetainedInProgram:true,principalPressureCancellation:'t_prime+K*t+d*t+i*k*n*pi=0 with pi=i*(n^T*K-(n_prime)^T)*t/(k*|n|^2); the independent test also reconstructs t_prime from B_prime*z+B*z_prime in (7.17).'},
    gaussian:{wholeInterval:true,proofUsesSampling:false,normalizedLogNormUpper:'-(a-1)^2/4+2^-1000',cutoffCollar:'|v/Ls-1/2|>=1/5 implies log|t|/Gscale<=-1/200',cooperativeContinuousStateBound:'1/2 <= exp(-Gscale*zeta)*(V,V_zeta/Gscale)/V(0) <= 2',basisAndSourceUStarFactorRetained:true},
    arithmetic:{kind:'OUTWARD_FLOAT64_WITH_SOURCE_EXACT_POSITIVE_SCALES',method:'CELLWISE_POSITIVE_VOLTERRA_COMPARISON',cells:steps,elementaryFunctions:'Bounded Taylor/atanh series with outward operations.',actualCarrierRoundedToFiniteInteger:false,actualHomogeneousSolutionEnclosed:true,sourceReferenceUsedAsActualAmplitude:false},
    checks,pass:checks.every(c=>c.pass),status:'PARTIAL',scope:{actualHomogeneousAmplitudeEnclosed:true,actualFullPulseInterval:true,certifiedRepresentativeEta:0,certifiedRepresentativeY:[.25,4.75],otherProfileOrToyHUsed:false,generalForcingInverseComplete:false,allSlowDerivativeGaussianBoundsCertified:false,wholeAnnulusPulseCertified:false,actualT0CovarianceMatched:false,fullPhysicalResidualEvaluated:false,allOriginalN5PackageComplete:false,newLeanKernelProof:false}};
}
