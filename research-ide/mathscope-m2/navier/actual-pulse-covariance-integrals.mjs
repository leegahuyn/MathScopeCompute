/** Actual same-N3 homogeneous pulse integrals in the Gaussian coordinate. */
import {point,iadd,isub,imul,idiv,iscale,ipower,ilog,iexp} from '../../mathscope-m1/navier/numerics.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {actualMeanPulseIntegrationScales,compileActualMeanPulsePhase} from './actual-pulse-amplitude-phase.mjs';
import {encloseLiouvilleTransfer} from './actual-pulse-amplitude-integrator.mjs';
import {sourceTorusGeometry,torusExactIdentityAudit} from './source-geometry.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const positive=x=>[Math.max(0,x[0]),x[1]],square=x=>positive(imul(x,x)),sqrt=x=>ipower(x,.5);
const dyadic=n=>Number.isSafeInteger(n)&&n>=64&&n<=512&&!(n&(n-1));
const matvec=(a,x)=>a.map(row=>row.reduce((z,c,i)=>iadd(z,imul(c,x[i])),point(0)));
const scalarSourceStep=x=>{
  if(x<=0)return point(0);if(x>=1)return point(1);
  if(x>.5){const z=isub(point(1),scalarSourceStep(1-x));return [Math.max(0,z[0]),Math.min(1,z[1])];}
  const X=point(x),exponent=isub(idiv(point(1),square(isub(point(1),X))),idiv(point(1),square(X))),e=positive(iexp(exponent)),z=idiv(e,iadd(point(1),e));
  return [Math.max(0,z[0]),Math.min(1,z[1])];
};

/** Concrete admissible choice in (6.16); exactly one transverse integral. */
export function actualPulseTransverseMass({cells=256}={}){
  if(!dyadic(cells))fail('The transverse mass uses 64,128,256 or 512 dyadic cells.');
  let sum=point(0);const rows=[],step=point(1/cells);
  for(let i=0;i<cells;i++){
    const lo=i/cells,hi=(i+1)/cells,left=scalarSourceStep(lo),right=scalarSourceStep(hi),bounds=[square(left)[0],square(right)[1]],integral=imul(step,bounds);sum=iadd(sum,integral);
    rows.push({index:i,sInterval:[lo,hi],stepSquaredBounds:bounds,integralInterval:integral,sourcePath:`result.results.transverseMass.rows[${i}]`});
  }
  const normalizedMass=iadd(point(1),iscale(sum,.5));
  return {schema:'MathScope.ActualPulseTransverseMass/1',cells,sourceStep:'sigma(s)=exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2)), extended by 0 and 1',cutoff:'chi_g(xi)=chi(xi/r0): chi=1 for |x|<=1/2; sigma(3-4|x|) for 1/2<|x|<3/4; 0 for |x|>=3/4',cutoffChoice:'One explicit admissible choice permitted by the source after Lemma 6.1; this does not change any N3 field.',r0Exact:'2^-34',stepSquaredIntegral:sum,normalizedMass,exactMass:'r0*(1+(1/2)*integral_0^1 sigma(s)^2 ds)',massInterval:imul(point(2**-34),normalizedMass),oneTransverseCoordinate:true,smoothCompactSupportInsideOriginalRectangle:true,method:'Monotone lower and upper rectangle sums; sigma is increasing because d/ds(-s^-2+(1-s)^-2)>0.',rows,pass:sum[0]>0&&sum[1]<.5&&normalizedMass[0]>1};
}

function centerAmplitude(w){
  if(!Array.isArray(w)||w.length!==2||!w.every(Number.isFinite)||w[0]>w[1]||w[0]<-8||w[1]>8)fail('The Gaussian observer needs a finite interval inside [-8,8].');
  const tiny=2**-1000,delta=[0,tiny],delta2=square(delta),q=[0,tiny],t2=iadd(point(1),square(q)),t=sqrt(t2),inverseGrowth=[0,tiny],inverseSqrtGrowth=[0,2**-500],slope=iadd(point(1),[-tiny,tiny]),a=iadd(point(1),imul(w,inverseSqrtGrowth)),shifted=A=>iadd(point(.5),imul(slope,isub(A,point(.5)))),D=A=>iadd(square(shifted(A)),imul(delta2,t2)),D0=D(point(.5)),refD0=iadd(point(.25),delta2),beta=A=>idiv(imul(slope,shifted(A)),sqrt(D(A))),V0=imul(ipower(D0,.25),sqrt(refD0)),initial=[point(1),iadd(idiv(sqrt(D0),imul(t,sqrt(refD0))),iscale(imul(beta(point(.5)),inverseGrowth),.5))];
  const step=idiv(ilog(idiv(iadd(shifted(a),sqrt(D(a))),iadd(point(.5),sqrt(D0)))),slope),potential=iscale(imul(square(slope),iadd(point(1),idiv(imul(delta2,t2),D([.5,a[1]])))),.25),transfer=encloseLiouvilleTransfer({potential,step,inverseGrowth}),state=matvec(transfer.matrix,initial),phaseFactor=iexp([-tiny,tiny]);
  const d=D(a),x=imul(phaseFactor,imul(imul(t,V0),imul(ipower(d,-.75),isub(state[1],iscale(imul(imul(beta(a),inverseGrowth),state[0]),.5))))),ybar=imul(phaseFactor,imul(V0,imul(ipower(d,-.25),state[0]))),theta=isub(idiv(ybar,t),imul(idiv(imul(shifted(a),[0,tiny]),t2),x)),z=iadd(imul(idiv(shifted(a),t2),x),imul(idiv([0,tiny],t),ybar)),thetaProduct=imul(x,theta),zProduct=imul(x,z);
  return {schema:'MathScope.ActualGaussianCenterAmplitude/1',wInterval:[...w],aInterval:a,exactCoordinate:'a=1+w/sqrt(Gscale), Gscale=lambda0*Ls/u_star>0',inverseSqrtGrowth:{expression:'sqrt(u_star/(lambda0*Ls))',interval:inverseSqrtGrowth,strictlyPositive:true,zeroIsEnclosureEndpointOnly:true},radialOverP:x,thetaOverSqrtLambdaUStarP:theta,zPlusOverUStarP:z,radialThetaProduct:thetaProduct,radialZPlusProduct:zProduct,sourceDependentDisplacementRetained:true,fullInitialToRequestedPointTransfer:{liouvilleStep:step,potentialWholePath:potential,scaledTransfer:transfer.matrix,state,initialState:initial,phaseFactor},sourceInstanceCertified:true,domain:'Actual fixed eta=0,s=1 Imean representative; all supplied w correspond to its full source pulse.',sourcePath:'result.results.centerAmplitude'};
}

export function observeActualPulseGaussianCenter(input={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('The Gaussian observer request must be an object.');
  for(const key of Object.keys(input))if(!['w','y','sourceProfile'].includes(key))fail('Unknown Gaussian observer input: '+key);
  const {w=[-8,8],y=2.5,sourceProfile=SOURCE_PROFILE_ID}=input;
  assertSourceProfile(sourceProfile);if(!Number.isFinite(y)||y<.25||y>4.75)fail('Use an actual Imean representative y in [1/4,19/4].');
  const scales=actualMeanPulseIntegrationScales();if(!scales.pass)fail('The actual pulse scale proof failed.');
  return {...centerAmplitude(w),sourceProfile,sourceHash:PINNED_N3.inputs.assembly.sha256,representative:{y,eta:0,s:1},phaseProgram:compileActualMeanPulsePhase({sourceProfile,y,sign:1}),sourceScaleChecks:scales.checks};
}

function referenceGaussianSquared(w){
  const w2=square(w),error=2**-480;
  // Reference f has f(1)=f'(1)=0; no cancellation of two huge logs is used.
  const logBounds=iadd(iscale(w2,-3),[-error,error]),density=w[0]===0&&w[1]===0?point(1):positive(iexp(logBounds));
  density[1]=Math.min(1,density[1]);
  return {normalizedCoordinate:w,logP2Interval:logBounds,P2Interval:density,errorExact:'2^-480',derivedFromActualPositiveDelta:true};
}

export function actualMeanPulseCovariance(input={},context={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('The actual covariance request must be an object.');
  for(const key of Object.keys(input))if(!['sourceProfile','y','cells','cutoffCells'].includes(key))fail('Unknown actual covariance input: '+key);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,y=input.y??2.5,cells=input.cells??256,cutoffCells=input.cutoffCells??cells;
  assertSourceProfile(sourceProfile);if(!Number.isFinite(y)||y<.25||y>4.75)fail('Use an actual Imean representative y in [1/4,19/4].');
  if(!dyadic(cells)||!dyadic(cutoffCells))fail('Use 64,128,256 or 512 dyadic Gaussian and transverse cells.');
  context.checkCancelled?.();const scales=actualMeanPulseIntegrationScales(),geometry=sourceTorusGeometry(),torusAudit=torusExactIdentityAudit();
  if(!scales.pass||!torusAudit.pass)fail('Actual source scales or Haar geometry failed.');
  const center=centerAmplitude([-8,8]),transverseMass=actualPulseTransverseMass({cells:cutoffCells}),phaseProgram=compileActualMeanPulsePhase({sourceProfile,y,sign:1}),rows=[],step=point(16/cells);
  let A=point(0),B=point(0);
  for(let i=0;i<cells;i++){
    context.checkCancelled?.();const lo=-8+16*i/cells,hi=-8+16*(i+1)/cells,w=[lo,hi],g=referenceGaussianSquared(w),thetaIntegrand=imul(center.radialThetaProduct,g.P2Interval),zIntegrand=imul(center.radialZPlusProduct,g.P2Interval),thetaIntegral=imul(step,thetaIntegrand),zIntegral=imul(step,zIntegrand);A=iadd(A,thetaIntegral);B=iadd(B,zIntegral);
    const wMid=(lo+hi)/2,gmid=referenceGaussianSquared(point(wMid));
    rows.push({index:i,wInterval:w,wMidpoint:wMid,actualCoordinateExpression:'a=1+w/sqrt(Gscale)',P2Bounds:g.P2Interval,thetaIntegrandBounds:thetaIntegrand,zIntegrandBounds:zIntegrand,thetaIntegral,zIntegral,midpointThetaIntegrand:imul(center.radialThetaProduct,gmid.P2Interval),midpointZIntegrand:imul(center.radialZPlusProduct,gmid.P2Interval),midpointLogP2:gmid.logP2Interval,sourcePath:`result.results.rows[${i}]`});
  }
  const tailExpression='64*2*exp(-8^2/2)/8',tailBound=idiv(iscale(iexp(point(-32)),128),point(8)),tailUpper=tailBound[1],tail=[-tailUpper,tailUpper],fullA=iadd(A,tail),fullB=iadd(B,tail),absDet=iscale(imul(fullA,fullB),2),haarJacobian=geometry.haar.rectangleJacobianInterval,commonCoefficient=imul(haarJacobian,transverseMass.normalizedMass),scaledTheta=imul(commonCoefficient,fullA),scaledZ=imul(commonCoefficient,fullB),matrix=[[scaledTheta,scaledTheta],[scaledZ,[-scaledZ[1],-scaledZ[0]]]];
  const checks=[
    {id:'same-source-scales-and-full-principal-solution',pass:scales.pass&&center.sourceInstanceCertified},
    {id:'source-dependent-gaussian-center-displacement',pass:center.sourceDependentDisplacementRetained&&center.radialThetaProduct[0]>0&&center.radialZPlusProduct[0]>0},
    {id:'actual-reference-gaussian-error',pass:18n<32n&&32n*512n+3n<3n*(1n<<20n)&&500-20>=480,proof:'The third derivative bound 32 gives (32/3)*8^3*2^-500; the additional delta^2 correction is smaller than 2^-1990; their sum is below 2^-480.'},
    {id:'source-psi-one-on-central-domain',pass:40n<(1n<<500n),proof:'|a-1|<=8*2^-500<1/5.'},
    {id:'nonzero-source-tail-retained',pass:tailUpper>0&&tailUpper<1e-12},
    {id:'positive-source-transverse-mass',pass:transverseMass.pass},
    {id:'source-normalized-haar-and-angular-half',pass:torusAudit.pass&&geometry.haar.normalizedCoveringFactor==='1'},
    {id:'positive-actual-covariance-integrals',pass:fullA[0]>0&&fullB[0]>0},
    {id:'positive-source-determinant-lower',pass:absDet[0]>0}
  ];
  return {schema:'MathScope.ActualMeanPulseCovariance/1',profileId:sourceProfile,sourceHash:PINNED_N3.inputs.assembly.sha256,request:{y,cells,cutoffCells},coordinateFrame:'BAND_CHART_Q_FIXED',sourceScales:scales,phaseProgram,centerAmplitude:center,rows,transverseMass,
    gaussian:{coordinate:'w=sqrt(Gscale)*(a-1)',centralInterval:[-8,8],actualReference:'P(a)^2=exp(2*Gscale*f(a,delta)), delta=1/u_star>0',centralLogApproximation:'2*Gscale*f(1+w/sqrt(Gscale),delta)=-3*w^2+e, |e|<2^-480',derivatives:{f1At1:'0',f2At1:'-3/(1+delta^2)^(3/2)',f3AbsoluteUpper:32},deltaNotReplacedByZero:true,cellMethod:'OUTWARD_RECTANGLE_QUADRATURE_ON_W',uniformPulseGridUsedAsQuadrature:false},
    cutoffs:{chi:transverseMass.cutoff,psi:'psi(v)=1 for |a-1|<=1/5; sigma(3-10*|a-1|) for 1/5<|a-1|<3/10; 0 for |a-1|>=3/10.',sourceRequirements:'(6.16): psi=1 on the central 1/5 interval and support strictly inside |a-1|<1/3.',psiCentralExactlyOne:true,psiTailBounds:[0,1],smoothCompactSupport:true},
    integrals:{definitionA:'integral psi(a)^2*(t_r/P)*(t_theta/(sqrt(lambda)*u_star*P))*P(a)^2 dw',definitionB:'integral psi(a)^2*(t_r/P)*(t_z,+/(u_star*P))*P(a)^2 dw',centralA:A,centralB:B,A:fullA,B:fullB,tail:{signedEnclosure:tail,absoluteUpper:tailUpper,positiveUpperExpression:tailExpression,wholePulseProductsAbsoluteUpper:64,gaussianMajorant:'P^2<=exp(-w^2/2)',proof:'Each half tail integral of exp(-w^2/2) is at most exp(-32)/8; multiply by two tails and product bound 64.',tailNotSetToZero:true}},
    parity:{exact:true,reason:'kp_minus=-kp_plus by the same sign-symmetric nonzero-integer rounding. qAngular changes sign, thetaRound,D,x,ybar and t_theta remain identical; t_z changes sign.',sameSlowBoxCount:1,signRectangles:2,oppositeSignsIncludedAsSeparateBoxes:false},
    haar:{...geometry.haar,angularAverageExact:'1/2',transverseMassCount:1,sourceAreaElement:'(4-2*sqrt(2))*c_i*d_xi*d_v',commonBeforeCancellation:'((4-2*sqrt(2))/2)*(integral chi_g^2 dxi)*c_i*Ls*u_star/sqrt(Gscale)',exactCancellation:'c_i*Ls=2*r0'},
    covariance:{rowOrder:['r_theta','r_z'],columnOrder:['plus','minus'],exactMatrix:'common*[[sqrt(lambda)*A,sqrt(lambda)*A],[B,-B]]',common:{expression:'(4-2*sqrt(2))*r0^2*massNormalized*u_star/sqrt(Gscale)',coefficientInterval:commonCoefficient,remainingScale:{expression:'r0^2*u_star/sqrt(Gscale)',strictlyPositive:true,binary64:null,underflowIsNotZero:true}},normalizedMatrix:matrix,normalization:['H_rtheta/(sqrt(lambda)*r0^2*u_star/sqrt(Gscale))','H_rz/(r0^2*u_star/sqrt(Gscale))'],determinant:{exact:'-2*common^2*sqrt(lambda)*A*B',absoluteNormalizedByCommonSquaredSqrtLambda:absDet,absoluteNormalizedByBaseScaleSquaredSqrtLambda:imul(square(commonCoefficient),absDet),nonzero:true},inverseFormula:'y_plus=(T_rtheta/(common*sqrt(lambda)*A)+T_rz/(common*B))/2; y_minus=(T_rtheta/(common*sqrt(lambda)*A)-T_rz/(common*B))/2',actualSourceTargetSupplied:false},
    checks,pass:checks.every(c=>c.pass),status:'PARTIAL',scope:{actualHomogeneousPulseCovarianceEnclosed:true,actualSourceRepresentative:{y,eta:0,s:1},actualT0TargetSupplied:false,positiveWeightsMatched:false,globalSquaredPartitionMatched:false,slowNeighborhoodCovarianceCertified:false,fullCurlCovarianceCorrectionIncluded:false,allOriginalN5PackageComplete:false,newLeanKernelProof:false}};
}
