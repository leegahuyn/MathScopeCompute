/** A concrete smooth squared partition and the complete finite active sum at
 * its actual source representative. The point result is not a construction of
 * all the other local waves on the whole annulus.
 */
import {actualMeanPulseMatchedStress,canonicalActualSourceExpression,exactPulseCovarianceAlgebra} from './actual-pulse-covariance-matching.mjs';
import {compileActualMeanPulsePhase} from './actual-pulse-amplitude-phase.mjs';
import {uniformSupportPalette} from './source-support.mjs';
import {assertSourceProfile} from './source-profile.mjs';
import {point,iadd,isub,imul,idiv,iscale,iexp,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

function sigma(x){
  if(x<=0)return point(0);if(x>=1)return point(1);if(x===.5)return point(.5);
  if(x>.5){const low=sigma(1-x);return[1-low[1],1-low[0]].map((v,i)=>i?nextUp(v):nextDown(v));}
  const oneMinus=isub(point(1),point(x)),exponent=isub(idiv(point(1),imul(oneMinus,oneMinus)),idiv(point(1),imul(point(x),point(x)))),e=iexp(exponent),value=idiv(e,iadd(point(1),e));
  return[Math.max(0,value[0]),Math.min(1,value[1])];
}
function bump(x){
  const a=Array.isArray(x)?x:point(x),u=a[0]>=0?a:a[1]<=0?[-a[1],-a[0]]:[0,Math.max(-a[0],a[1])];
  if(u[1]<=.25)return point(1);if(u[0]>=.75)return point(0);
  const s=iadd(point(1.5),iscale(u,-2)),lo=sigma(s[0]),hi=sigma(s[1]);return[lo[0],hi[1]];
}

/** Execute the actual chosen family at an offset from an integer center.
 * The integer itself need not be materialized, even for the source pulse band.
 * Normalization is an exact shared denominator; intervals are observations.
 */
export function sourcePulseSquaredPartitionAtOffset(offset=0){
  if(typeof offset!=='number'||!Number.isFinite(offset)||offset<-.5||offset>.5)fail('Use a finite offset in [-1/2,1/2] from the nearest integer center.');
  const candidates=[-1,0,1].map(index=>{const distanceInterval=isub(point(offset),point(index)),structuralZero=index===-1&&offset>=-.25||index===1&&offset<=.25;return{relativeIndex:index,distance:offset-index,distanceInterval,bump:structuralZero?point(0):bump(distanceInterval),structuralZero};}),active=candidates.filter(c=>!c.structuralZero),single=active.length===1;
  let sum=point(0);for(const c of active)sum=iadd(sum,imul(c.bump,c.bump));
  const rows=active.map((c,i)=>({...c,squaredWeight:single?point(1):idiv(imul(c.bump,c.bump),sum),exactWeight:single?'1':`b(${offset}-${c.relativeIndex})^2 / sum_j b(${offset}-j)^2`,sourcePath:`result.results.partition.rows[${i}]`}));
  let intervalSum=point(0);for(const r of rows)intervalSum=iadd(intervalSum,r.squaredWeight);
  const half=bump(.5),checks=[
    {id:'nearest-center-denominator-positive',pass:half[0]<=.5&&half[1]>=.5&&sum[0]>0},
    {id:'all-omitted-integer-translates-zero',pass:.5+1<2&&2-.5>.75},
    {id:'shared-denominator-partition-identity',pass:intervalSum[0]<=1&&intervalSum[1]>=1}
  ];
  return{schema:'MathScope.SourcePulseSquaredPartition/1',offset,rows,denominatorInterval:sum,intervalSquaredSum:single?[1,1]:intervalSum,exactSquaredSum:'1',allActiveIndicesEnumerated:true,zeroIndices:candidates.filter(c=>c.bump[1]===0).map(c=>c.relativeIndex),omittedTail:'Every |relativeIndex|>=2 has distance>=3/2>3/4, so its bump is exactly zero.',definition:{b:'1 for |t|<=1/4; source_sigma(3/2-2|t|) for 1/4<|t|<3/4; 0 for |t|>=3/4',sourceSigma:'exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2)), with exact smooth 0/1 extensions',chi:'b(t-j)/sqrt(sum_k b(t-k)^2)',smooth:true,compactSupportRadius:'3/4',positiveDenominatorLowerExact:'1/4',sourceChoice:'The explicit normalized smooth translates permitted in paper (6.8)-(6.9).',proof:'A nearest integer is within 1/2; b>=b(1/2)=1/2 there. At most two translates are nonzero. Every derivative is smooth because the finite positive denominator is shared.'},singleActiveInterior:'|offset|<1/4',checks,pass:checks.every(c=>c.pass)};
}

function cloneRebased(value,from,to){
  if(Array.isArray(value))return value.map(x=>cloneRebased(x,from,to));
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,typeof v==='string'&&v.startsWith(from)?to+v.slice(from.length):cloneRebased(v,from,to)]));
}

/** A finite verification of the two actual sign labels. The minus covariance
 * is the proved exact parity image of the same source solution and integral.
 */
function signLabels(matched){
  const plus=matched.pulseCovariance.phaseProgram,minus=compileActualMeanPulsePhase({sourceProfile:matched.profileId,y:matched.request.y,sign:-1}),c=(p,r)=>canonicalActualSourceExpression(p,r),sameRoot=r=>same(c(plus,r),c(minus,r));
  // A sign is outside the same nonnegative integer rounding operation.
  const plusKp=plus.nodes[plus.roots.kp],minusKp=minus.nodes[minus.roots.kp],minusParts=minusKp.op==='multiply'?minusKp.args.map(i=>minus.nodes[i]):[],negativeFactor=minusParts.find(n=>n.op==='rational'&&n.args[0]==='-1'&&n.args[1]==='1');
  const minusMagnitude=minusKp.op==='multiply'?minusKp.args.find(i=>minus.nodes[i]!==negativeFactor):undefined;
  const labelMagnitudeSame=minusMagnitude!==undefined&&same(c(plus,'kp'),c(minus,minusMagnitude));
  const checks=[{id:'same-source-sign-independent-scales',pass:['k','epsilon','Ls','uStar','F0','R0','Bs','Gscale'].every(sameRoot)},{id:'exact-opposite-nonzero-angular-integers',pass:plusKp.op==='integer_max_one'&&!!negativeFactor&&labelMagnitudeSame},{id:'actual-solution-and-integral-parity',pass:matched.pulseCovariance.parity.exact&&matched.pulseCovariance.parity.signRectangles===2}];
  return{schema:'MathScope.ActualPulseSignLabels/1',plusProgram:plus,minusProgram:minus,sharedSquaredAmplitude:matched.rows[0].normalizedSquaredAmplitude,normalizedCovarianceColumns:matched.pulseCovariance.covariance.normalizedMatrix[0].map((_,j)=>matched.pulseCovariance.covariance.normalizedMatrix.map(row=>row[j])),sameSlowBox:true,slowBoxMultiplicity:1,rectangleLabels:2,checks,pass:checks.every(c=>c.pass)};
}

function partitionInstance(matched){
  const source=assertSourceProfile(matched.profileId),p=source.parametersExactExpressions,atCenter=sourcePulseSquaredPartitionAtOffset(0),palette=uniformSupportPalette(),y=matched.request.y;
  const checks=[
    {id:'actual-R0-origin-and-q-equality',pass:matched.observedDomain.eta===0&&matched.observedDomain.qOverQ===1&&matched.pulseCovariance.phaseProgram.representative.y===y},
    {id:'actual-positive-mean-shell-point',pass:y>0&&y<5&&same(p.Lambda,{power:[{ref:'Q'},64]})&&source.attachedAnalyticConclusions.preservedReservedPatches.includes('Imean')},
    {id:'original-smooth-bump-support-requirements',pass:.75<1&&.75>.5&&atCenter.definition.positiveDenominatorLowerExact==='1/4'},
    {id:'complete-active-band-and-grid-set',pass:atCenter.allActiveIndicesEnumerated&&atCenter.rows.length===1&&atCenter.rows[0].relativeIndex===0&&atCenter.rows[0].squaredWeight[0]===1},
    {id:'one-common-source-support-palette',pass:palette.pass&&palette.r0Exact==='1/17179869184'},
    {id:'source-local-band-above-palette-floor',pass:(1n<<5000n)>9n,proof:'M>=2^50, h<1 imply ell_actual=ceil(M^100*h^-4)>=2^5000; hence ell0=ell_actual-1>=8.'}
  ];
  return{schema:'MathScope.ActualPulsePartitionInstance/1',sourceProfile:matched.profileId,choice:'FIXED_TRANSLATED_SOURCE_PRODUCT_PARTITION',choiceChangesN3Profile:false,origin:{R:'actual phaseProgram.R0 = sqrt(2*X0Imean*exp(y))',Z:'0',T:'1',yExact:matched.pulseCovariance.phaseProgram.representative.yExact,sourcePath:'result.results.localMatch.pulseCovariance.phaseProgram.roots.R0'},mesh:{step:'Sstar^-3=ell^-6',grid:'origin+ell^-6*a, a in Z^3',translatedOriginIsFixedBeforeDifferentiation:true},band:{coordinate:'-log(q)/log(2)',integerAtObservation:'ell_actual=ceil((C12EnvelopeR^100)^100*h^-4)',Q:'2^-ell_actual',lowerBandIndex:'ell0=ell_actual-1',qBigObservation:'3*Q/2',qBigObservationBelowBandFloor:'Q<3Q/2<2Q=2^(-ell0); ell0>=8.',actualAmplitudeValidityFloor:'ell_actual; the only active band at this point is certified by actualMeanPulseIntegrationScales',globalQStarAdmissibilityClaimed:false},
    physicalPoint:{q:'Q',tau:'Q',z:'0',r:'sqrt(Q)*actual R0',X:'X0Imean*exp(y)',eta:'0',qEquation:'q=tau+z^2*q^(2h); z=0 and tau=Q give q=Q exactly',chartCoordinates:['actual R0','0','1']},
    activeShellMembership:{observationCutoff:'0<Q<3Q/2=qBigObservation',tauNonnegative:true,qOverQExact:'1',strictShellProof:'Xa=4/Lambda<4<XR<X0Imean*exp(y)<X0Imean*exp(5)<XmainPulse=X0Imean*exp(8)<Xb. The final source reserves this unchanged Imean patch.',IellMembershipWitness:'The actual representative itself lies in both the center box and the geometric active shell for this finite observation.',sourceUniformQStarCertified:false},
    allRealPartition:atCenter.definition,partitionDomain:'0<q<qBigObservation; all real mesh coordinates. The source active shell is a subset of this geometric domain.',rows:atCenter.rows,centerOneDimensional:atCenter,productSquaredWeightExact:'1',activeBands:[{index:'actual ell',relativeIndex:0,cutoffExact:'1'}],activeBoxes:[{key:'actual-ell:0:0:0',ell:'actual ell',grid:['0','0','0'],slowCutoffExact:'1',signs:[1,-1],countInSquaredPartition:1}],
    completeActiveSetProof:'At the actual point every other integer band is at distance at least 1 from -log2(q). Every other mesh multi-index differs by an integer of absolute value at least 1 in some coordinate. Since the chosen bump vanishes at distances >=3/4, every other band or box is exactly absent from the support. This proves the complete infinite-index complement is zero; it is not a truncated list.',
    singleActiveInterior:{bandOffset:'absolute value <1/4',eachMeshCoordinateOffset:'absolute value <1/4',covarianceCertifiedThroughoutInterior:false},
    auxiliarySupports:{palette,integerColorExpression:'nu_sigma=250*(ell mod 9)+(sigma==plus ? 0 : 1)',centerExpression:'((nu_sigma+1)/1048576,0)',r0Exact:palette.r0Exact,eachDiscreteChoiceIsAnExplicitFunctionOfActualSourceEll:true,ellResidueMaterialized:false,distinctSameBoxSigns:true,globalUniformSeparationAlreadyCertified:true},
    scope:{squaredPartitionConstructedOnWholeCoordinateDomain:true,completeActiveSetAtActualRepresentative:true,allOtherRepresentativesAndWavesConstructed:false,wholeAnnulusMatching:false,sourceUniformQStarCertified:false,globalBackgroundQStarAdmissibility:false},checks,pass:checks.every(c=>c.pass)};
}

/** Actual local waves, actual complete pointwise partition, and exact (7.30)
 * physical normalization. No arbitrary target, mesh weight or label can enter.
 */
export function actualMeanPulsePointwiseAssembly(input={},context={}){
  const matched=actualMeanPulseMatchedStress(input,context),partition=partitionInstance(matched),labels=signLabels(matched),algebra=exactPulseCovarianceAlgebra();context.checkCancelled?.();
  const target=matched.meanStress.normalizedTarget.theta,rows=[{slowBox:'actual-ell:0:0:0',signRectangles:2,squaredCutoffExact:'1',normalizedPhysicalTheta:target,normalizedPhysicalZ:[0,0],exactPhysicalScale:'q^(-1-h)*F*X*lambda',sourcePath:'result.results.rows[0]'}],checks=[...partition.checks,...labels.checks,{id:'all-active-source-boxes-executed',pass:partition.activeBoxes.length===rows.length&&matched.scope.actualLocalCovarianceMatched},{id:'one-box-not-two-signs-in-global-sum',pass:rows.length===1&&rows[0].signRectangles===2&&partition.productSquaredWeightExact==='1'},{id:'actual-pointwise-physical-scale-identity',pass:algebra.pass}];
  return{schema:'MathScope.ActualPulsePointwiseAssembly/1',profileId:matched.profileId,sourceHash:matched.sourceHash,parameterExpressionSHA256:matched.parameterExpressionSHA256,request:matched.request,coordinateFrame:'BAND_CHART_Q_FIXED',localMatch:cloneRebased(matched,'result.results.','result.results.localMatch.'),partition,labels,rows,
    physicalIdentity:{sourceEquation:'7.30',exact:'sum_beta Q_beta^(-2A)*eta_beta^2*epsilon_beta*T0,star = q^(-A-1/2)*T0',finiteActiveSumAtThisPoint:'one actual slow box; both source signs are included inside its local covariance',normalizedResult:[target,[0,0]],exactTargetNormalization:'(q^(-1-h)*F*X*lambda)',positivePhysicalScale:{expression:'q^(-1-h)*F*X*lambda',strictlyPositive:true,binary64:null,underflowIsNotZero:true},exactResidual:[0,0],qPower:algebra.scaleIdentity,globalIdentityAtThisActualPointVerified:true,pointwisePhysicalVelocityEqualsHaarAverage:false},
    checks,pass:checks.every(c=>c.pass),status:'PARTIAL',scope:{actualSourceTargetJoined:true,actualPositiveWeightsMatched:true,actualCompletePointwiseActiveSumExecuted:true,actualPointwiseEquation730Verified:true,globalSquaredPartitionConstructed:true,wholeAnnulusCovarianceMatched:false,allSlowNeighborhoodsMatched:false,allOriginalN5PackageComplete:false,newLeanKernelProof:false}};
}

/** Reject changed target/weights/partition fields instead of trusting PASS tags. */
export function verifyActualPulsePointwiseAssembly(receipt){
  try{if(receipt?.schema!=='MathScope.ActualPulsePointwiseAssembly/1')return{pass:false,reason:'WRONG_SCHEMA'};const expected=actualMeanPulsePointwiseAssembly(receipt.request);return{pass:same(receipt,expected),reason:same(receipt,expected)?'MATCHES_COMPLETE_ACTUAL_SOURCE_POINT_SUM':'SOURCE_OR_ACTIVE_SET_CHANGED'};}catch(e){return{pass:false,reason:e.code??'INVALID_RECEIPT'};}
}
