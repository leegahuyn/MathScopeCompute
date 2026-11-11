/** Source-bound application of Lemma 9.7 and Proposition 9.9 to the exact
 * N7 cutoff domain. This establishes a permissible common domain from the
 * INITIAL fixed-source estimates. It does not construct the missing final
 * N6 velocity, potentials, pressure or correction sequence.
 */
import {assertActualSourceLocalization,actualSourceLocalizationCertificate} from './source-localization.mjs';
import {assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {sourceExponentContract} from '../../mathscope-m2/navier/source-profile.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {sourceMeanMomentBridge} from './source-mean-map.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const metadata=x=>({schema:x.schema,sourceBinding:x.sourceBinding,constants:x.constants,initialPrerequisites:x.initialPrerequisites,
  fixedMeanMap:x.fixedMeanMap,domainProof:x.domainProof,cutoffConclusions:x.cutoffConclusions,checks:x.checks,scope:x.scope});

export async function attachActualSourceLocalizationDomain(localization){
  assertActualSourceLocalization(localization);const {G,inner}=localization,{family}=inner;
  assertActualCommonAdmissibleFamily(family);
  const originalCount=G.nodes.length,originalPrefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    certificate=await actualSourceLocalizationCertificate(localization),q=(n,d=1)=>G.q(n,d),
    {threshold,primitiveProof:primitive,inverse,positivity}=family.uniformCovariance,
    {Bnorm,E,Renv,h,r0,Tg}=family.constants,lambda=G.parameter('lambda'),
    ellMinimum=family.constants.ellMinimum,ell0=family.constants.ell0,commonQStar=family.constants.qStar,
    qBig=localization.constants.qStar,meanMap=sourceMeanMomentBridge({sourceProfile:family.request.sourceProfile,panels:128,derivativeOrder:3}),
    exponent=sourceExponentContract(),log2=G.log(q(2)),
    commonLog=G.neg(G.mul(G.add(ellMinimum,q(4)),log2)),qBigLog=G.neg(G.mul(G.add(ell0,q(4)),log2)),
    ratioExponent=G.sub(G.add(ell0,q(4)),G.add(ellMinimum,q(4))),
    tauRatio=q(1,32),supportRatio=G.mul(q(4),G.add(tauRatio,tauRatio)),strictSupportGap=G.sub(q(1,2),supportRatio),
    meanSupportUpper=G.add(q(1),q(4,5),G.mul(q(2),G.log(q(11,10)))),
    meanSupportRationalUpper=q(2),meanPatchUpper=q(5),fixedAxialGap=G.sub(G.one,G.exp(G.neg(G.mul(q(2,5),lambda)))),
    equal=(a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b)).pass,
    condition=key=>threshold.conditions.find(row=>row.id===key),
    prescribedConditions=threshold.recipe.selection.conditions,
    initialPrerequisites=[
      {id:'fixed-original-background-and-common-selector',source:'actual-common-admissible-family.mjs',
        authenticatedFamilyGraph:copy(localization.sourceBinding.common6FamilyGraph),
        sourceRoots:copy(family.uniformCovariance.sourceC2Roots),proof:primitive.C2,
        sameSourceOnly:true,callerProvidedBoundsAccepted:false},
      {id:'fixed-pulse-and-noncharacteristic-estimates',source:'actual-common-admissible-family.mjs thresholdFromOriginal / primitiveProof',
        thresholdConditions:copy(threshold.conditions),Bnorm,E,
        actualFrameErrorUpper:'Bnorm^256/S',normalLower:'|n_Phi|>=|n_tangent|>=Bnorm^-2>0',
        normalProof:primitive.normal,frameProof:primitive.frame,propagatorProof:primitive.logarithmicNorm,
        allLabelsProof:primitive.allLabels,entireOriginalPressureTermRetained:true,
        allHarmonics:'Lemma9.7 p111 and (7.18): a harmonic propagator is the fundamental propagator times a forward damping factor of magnitude at most one.'},
      {id:'fixed-primary-covariance-and-signed-denominators',source:'actual-common-admissible-family.mjs uniformCovariance',
        inverse:copy(inverse),positivity:copy(positivity),
        signedDivision:'The original 2*sqrt(y_sigma) from (7.31); positive on the radial interior, with the inherited regular Gaussian endpoint factors.',
        laterSignedUpdatesDoNotChangePrimaryDenominator:true},
      {id:'fixed-original-supported-mean-inverse',source:'source-mean-map.mjs sourceMeanMomentBridge',
        sourceProfile:meanMap.source.profile,parameterExpressionSHA256:meanMap.source.parameterExpressionSHA256,
        meanSupportUpper,meanSupportRationalUpper,meanPatchUpper,
        supportProof:'log(11/10)<1/10 implies1+4/5+2log(11/10)<2<5. The five original profiles and their potential hull lie in Imean.',
        fixedPositiveLambda:lambda,fixedAxialGap,lambdaProof:'lambda=exp(-1000*T)>0, so1-exp(-2*lambda/5)>0; it is never computed as zero by binary64 subtraction.',
        originalPowerLaw:copy(meanMap.exactSource),positiveMoments:copy(meanMap.moments),
        angularInverse:copy(meanMap.angular),axialInverse:copy(meanMap.axial),
        fixedOrderSmoothness:copy(meanMap.smoothness),
        sourceMapActuallyExecuted:meanMap.pass&&meanMap.source.actualImportedSourceExecuted},
      {id:'remaining-mean-and-pressure-maps-are-fixed-linear-maps',source:'Lemma9.7 p112; Lemma8.6; Lemma8.7',
        proof:'Pressure, the zero-average temporal inverse, and the modified radial integrals use the fixed source coordinates and coefficients. Lemma9.7 states that arbitrary-size sources are allowed on this same domain. Stage-dependent derivative bounds enter constants, not a smaller q threshold.',
        sourceTheoremApplication:true,newImplementationOfAllTheseMapsClaimed:false}
    ],checks=[
      {id:'same-unchanged-private-localization-and-common6-family',pass:assertActualSourceLocalization(localization)&&assertActualCommonAdmissibleFamily(family)&&same(certificate.sourceBinding,localization.sourceBinding)},
      {id:'original-positive-parameters-and-same-fixed-mean-source',pass:exponent.positive&&exponent.upperBoundExact==='2^-4096'&&same(exponent.hExact,G.source.parametersExactExpressions.h)&&
        meanMap.source.parameterExpressionSHA256===family.sourceBinding.parameterExpressionSHA256&&meanMap.source.profile===family.request.sourceProfile&&
        same(meanMap.exactSource.h,G.source.parametersExactExpressions.h)&&same(meanMap.exactSource.lambda,G.source.parametersExactExpressions.lambda)},
      {id:'every-original-concentration-condition-is-retained',pass:prescribedConditions.length>0&&threshold.conditions.length===prescribedConditions.length+2&&
        prescribedConditions.every((row,j)=>threshold.conditions[j].id===row.id&&threshold.conditions[j].representativeRemovedByIntervalRule===true&&threshold.conditions[j].lower===threshold.range.ranges[j][1])},
      {id:'original-primitive-boundary-and-frequency-thresholds',pass:condition('actual-moving-frame-source-primitives')?.lower===G.pow(Bnorm,512)&&
        condition('actual-flat-boundary-direction-neighbourhood')?.lower===G.pow(Renv,1024)&&E===G.pow(Bnorm,256)&&
        threshold.frequencyMinimum===G.pow(G.div(q(64),h),2)&&threshold.Sminimum===G.maximum(...threshold.conditions.map(row=>row.lower))&&
        ellMinimum===G.ceiling(G.maximum(q(8),threshold.Sminimum,threshold.frequencyMinimum))},
      {id:'fixed-original-pulse-coefficients-and-nonzero-frame-premises',pass:threshold.input.operatorError===E&&threshold.input.dampingError===E&&
        threshold.input.unitFrameError===E&&threshold.input.slopeError===E&&threshold.input.lengthRatioLower===G.mul(q(2),r0)&&
        threshold.input.lengthRatioUpper===G.mul(q(2),r0,Tg)&&threshold.audits.power.pass&&threshold.audits.concentration.pass&&threshold.audits.cone.pass&&threshold.audits.projection.pass&&
        threshold.direction.pass&&threshold.direction.scope.actualClosedAnnulusDirectionModulusDerived&&
        typeof primitive.normal==='string'&&typeof primitive.frame==='string'&&typeof primitive.logarithmicNorm==='string'&&typeof primitive.allLabels==='string'},
      {id:'original-positive-covariance-and-fixed-signed-inverse',pass:inverse.determinantSign==='NEGATIVE'&&same(inverse.normalizedDeterminantBounds,['15/8','17/8'])&&
        inverse.determinantScaleLower!==G.zero&&positivity.weightOverZetaLower!==G.zero&&positivity.openRadialInteriorRequiredForStrictPositivity===true},
      {id:'fixed-source-mean-profiles-and-inverses-actually-executed',pass:meanMap.pass&&meanMap.checks.every(row=>row.pass)&&meanMap.source.actualImportedSourceExecuted&&
        meanMap.exactSource.lambdaPositive&&meanMap.profiles.dExact==='1/5'&&meanMap.profiles.potentialHullIncluded&&meanMap.profiles.smoothZeroExtension&&
        meanMap.moments.intervals.every(interval=>interval[0]>0)&&meanMap.axial.thetaInterval[0]>0&&meanMap.smoothness.fixedLambdaConstantsAllowed},
      {id:'qbig-is-exactly-a-sixty-fourth-of-the-sufficient-common-domain',pass:commonQStar===G.exp(commonLog)&&qBig===G.exp(qBigLog)&&
        ell0===G.add(ellMinimum,q(6))&&equal(ratioExponent,q(6))},
      {id:'same-qbig-in-time-and-space-cutoff',pass:localization.constants.qStar===qBig&&localization.constants.tau0===G.mul(qBig,tauRatio)&&
        localization.constants.z0===G.exp(G.mul(localization.constants.D,G.log(localization.constants.tau0)))&&localization.constants.r0===G.one},
      {id:'exact-support-quarter-is-strictly-below-domain-half',pass:supportRatio===q(1,4)&&strictSupportGap===q(1,4)&&equal(supportRatio,G.mul(q(8),tauRatio))},
      {id:'whole-cutoff-zero-extension-and-fixed-plateau-are-executed',pass:localization.operator.undefinedLocalFieldsMultipliedByZero===false&&
        localization.operator.multiplicationBeforeCurl&&localization.domain.compactK.independentOfTime&&localization.domain.unitPlateau.spatialNeighborhoodFixed&&
        localization.domain.initialZeroInterval.positiveLength&&localization.scope.actualOriginalSourceCutoffConstructed&&localization.scope.actualCartesianCutoffDerivativesConstructed},
      {id:'unchanged-source-prefix-and-source-function-definitions',pass:canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix&&G.functionDefinitionsUnchanged(definitions)&&assertActualSourceLocalization(localization)}
    ];
  if(checks.some(row=>!row.pass))fail('The fixed-source domain bridge is missing a prerequisite: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const result={G,localization,schema:'MathScope.N7.ActualSourceLocalizationDomain/1',sourceBinding:copy(localization.sourceBinding),
    constants:{commonQStar,qBig,ellMinimum,ell0,ratioExponent,domainRatio:'1/64',tauRatio,supportRatio,strictSupportGap,meanSupportUpper,meanSupportRationalUpper,meanPatchUpper,fixedAxialGap},
    initialPrerequisites,fixedMeanMap:meanMap,
    domainProof:{sourcePages:[111,112,114,117,118],references:['Lemma9.7','Proposition9.9','Proposition10.1'],
      choice:'Choose qbig=qBig=2^(-(ell0+4)), a permitted smaller domain inside the explicitly sufficient common6 threshold.',
      finalDomainIdentification:'Proposition9.9 p114 applies its summation lemma with qStar=qbig and shrinks the earlier local thresholds to this common value.',
      whyLaterStageConstantsDoNotShrinkIt:'Lemma9.7 p112 fixes all inverse coefficients and denominators at the primary construction. Later inputs may be arbitrary size; finite derivative losses change constants only.',
      sourceTheoremAppliedToExecutedInitialPremises:true,newLeanKernelProof:false,
      unknownHistoricalGammaValueUsed:false,finalFieldExistenceUsedToInventAThreshold:false,
      finalCorrectionSequenceExecuted:false},
    cutoffConclusions:{support:'q<=qBig/4<qBig/2',initialZeroInterval:copy(localization.domain.initialZeroInterval),
      compactK:copy(localization.domain.compactK),unitPlateau:copy(localization.domain.unitPlateau),
      inference:'The exact localization operator and zero extension give these support/zero/plateau conclusions without evaluating its final source field operands.',
      actualNonzeroFinalN6FieldValuesComputed:false},checks,
    scope:{sourceBoundCommonDomainChoiceJustified:true,originalCutoffDomainPrerequisitesEstablished:true,
      sourceTheoremApplicationExplicit:true,fullN6FinalPotentialsConstructed:false,nonzeroLocalizedVelocityConstructed:false,
      wholeLocalizedForceConstructed:false,wholeKEnergyNearTerminalComputed:false,criterionAssessmentEdited:false,wholeM3Complete:false}};
  seals.set(result,{G,localization,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(metadata(result))});
  return result;
}

export function assertActualSourceLocalizationDomain(result){
  const seal=seals.get(result);
  if(!seal||seal.G!==result.G||seal.localization!==result.localization||canonicalStringify(metadata(result))!==seal.metadata||
    canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged source-bound domain bridge; omitted premises and copied records are not source authority.');
  assertActualSourceLocalization(seal.localization);return true;
}

export async function actualSourceLocalizationDomainCertificate(result){
  assertActualSourceLocalizationDomain(result);return {...copy(metadata(result)),graph:{constructedNodeCount:seals.get(result).count,
    domainMetadataSHA256:await sha256(canonicalStringify(metadata(result)))},
    verification:{status:'ACTUAL_SOURCE_LOCALIZATION_DOMAIN_PREMISES_EXECUTED',checksPass:result.checks.every(row=>row.pass),
      externalSourceLemma9_7Applied:true,finalN6FieldNumericallyConstructed:false,newLeanExecuted:false}};
}
