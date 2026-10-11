/** Fresh numerical coefficients paired with a build-pinned, separately
 * executed original-source proof. Serialized user results are never inputs
 * to this module. The large original graph is not reconstructed here.
 */
import {INSTALLED_PHYSICAL_CENTER_EVIDENCE,INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256} from './actual-physical-center-installed-evidence.mjs';
import {recomputePhysicalCenterRuntimeNumerics,physicalCenterRuntimeNumericalRequest} from './actual-physical-center-runtime-numerics.mjs';
import {physicalCenterNumericalJetConditioning} from './actual-physical-center-jet-conditioning.mjs';
import {recomputePhysicalCenterPositiveScales} from './actual-physical-center-positive-scale-kernel.mjs';
import {recomputePhysicalCenterUnscaledDerivativeBounds} from './actual-physical-center-unscaled-numerics.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {readRational,qcompare,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const AUTHENTICATION='PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE';
const allPassed=rows=>Array.isArray(rows)&&rows.length>0&&rows.every(row=>row.pass===true);

async function installedSourceEvidence(){
  const evidence=structuredClone(INSTALLED_PHYSICAL_CENTER_EVIDENCE),contract=sourceExponentContract();
  if(await sha256(evidence)!==INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256||
    evidence.schema!=='MathScope.InstalledPhysicalCenterSourceEvidence/1'||
    evidence.authentication!==AUTHENTICATION||evidence.sourceBinding.sourceProfile!==SOURCE_PROFILE_ID||
    evidence.sourceBinding.parameterExpressionSHA256!==contract.parameterExpressionSHA256||
    !contract.positive||!contract.notNumericallyReplaced||evidence.sourceProcess.exitCode!==0||
    evidence.sourceProcess.timeout!==false||evidence.sourceProcess.complete!==true||
    !allPassed(evidence.sourceChecks)||!allPassed(evidence.numericalSourceChecks)||!allPassed(evidence.boundChecks)||
    !evidence.initialImportManifest?.sha256||!evidence.lateImportManifest?.sha256||
    evidence.sourceScope.actualOriginalCoupledVariations!==true||
    evidence.sourceScope.actualSpatialCovariantHessianNumerics!==true||
    evidence.sourceScope.angularMixedAndFrameConnectionsIncluded!==true||
    evidence.sourceScope.hReplacedByZero!==false||evidence.sourceScope.remainingSelectorAndPaletteScalesNumericallyClosed!==true||
    evidence.positiveSelectorScaleEvidence?.pass!==true||!allPassed(evidence.positiveSelectorScaleEvidence.checks)||
    evidence.positiveSelectorScaleEvidence.rowScales.length!==270||
    evidence.positiveSelectorScaleEvidence.scope.all270ActualPositiveDerivativeScalesNumericallyEnclosed!==true||
    evidence.rows.length!==270||new Set(evidence.rows.map(row=>row.rowKey)).size!==270||
    evidence.rows.some(row=>row.bodyDerivativeBinding!==true||
      !['originalDerivative','positiveExactScale','coefficient'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0)))
    fail('INVALID_SOURCE_CONSTRUCTION','The installed original-source proof, complete270-row map or its executed process evidence does not match this build.');
  return evidence;
}

export async function encloseInstalledPhysicalCenterNumerics(input={},context={}){
  const request=physicalCenterRuntimeNumericalRequest(input),evidence=await installedSourceEvidence();
  context.checkCancelled?.();
  const numerics=await recomputePhysicalCenterRuntimeNumerics(request,context),
    conditioning=physicalCenterNumericalJetConditioning(numerics.values,request.precisionBits),
    positiveScaleNumerics=recomputePhysicalCenterPositiveScales(numerics.positiveProfile,numerics.targetCoefficient,evidence.targetPositiveScalePremises,request),
    originalRows=new Map(evidence.rows.map(row=>[row.rowKey,row])),rowBindings=[];
  for(const row of numerics.rows){
    const original=originalRows.get(row.rowKey);
    if(!original||original.quantity!==row.quantity||original.component!==row.component||original.derivative!==row.derivative||
      original.order!==row.order||original.sign!==row.sign||
      qcompare(readRational(row.positiveErrorRadius),readRational(original.positiveErrorRadius))<0)
      fail('INVALID_SOURCE_CONSTRUCTION','A newly computed row or its positive error budget differs from its executed original-source proof: '+row.rowKey);
    rowBindings.push({...original,evidence:AUTHENTICATION,coefficientRecomputed:true});
  }
  const unscaledDerivatives=recomputePhysicalCenterUnscaledDerivativeBounds(numerics.rows,rowBindings,
    evidence.positiveSelectorScaleEvidence.rowScales,request,context);
  const checks=[
    {id:'installed-original-source-certificate-and-profile-hashes-match',pass:true},
    {id:'original-source-process-completed-with-all-eight-checks',pass:evidence.sourceChecks.length===8&&allPassed(evidence.sourceChecks)},
    {id:'original-full-source-error-premises-were-separately-executed',pass:allPassed(evidence.boundChecks)},
    {id:'all270-current-coefficients-match-original-derivative-and-positive-scale-identities',pass:rowBindings.length===270&&numerics.rows.length===270},
    {id:'every-numerical-prerequisite-and-requested-width-is-recomputed',pass:numerics.pass&&allPassed(numerics.checks)&&
      numerics.arithmetic.everyNumericalPrerequisiteRecomputed&&numerics.precisionAllocation.everyFinalEndpointWidthChecked},
    {id:'new-value-intervals-recheck-original-inverse-conditioning',pass:conditioning.pass&&allPassed(conditioning.checks)},
    {id:'all-twenty-two-positive-profile-and-target-scale-endpoints-are-recomputed',pass:positiveScaleNumerics.pass&&allPassed(positiveScaleNumerics.checks)},
    {id:'all270-original-scale-intervals-and-fresh-unscaled-products-are-checked',pass:unscaledDerivatives.pass&&
      unscaledDerivatives.rows.length===270&&allPassed(unscaledDerivatives.checks)},
    {id:'positive-h-scales-and-analytic-remainders-are-retained',pass:numerics.scope.originalPositiveHReplacedByZero===false&&
      numerics.scope.positiveAnalyticRemaindersRetained&&rowBindings.every(row=>row.bodyDerivativeBinding)},
    {id:'external-source-evidence-and-current-numerical-execution-are-explicit',pass:numerics.sourceAuthenticated===false&&
      numerics.scope.runtimeReconstructedFullSourceGraph===false&&conditioning.sourceAuthenticated===false&&
      unscaledDerivatives.sourceAuthenticated===false&&unscaledDerivatives.arithmetic.productsRecomputed===true}
  ];
  if(!allPassed(checks))fail('INVALID_SOURCE_CONSTRUCTION','The installed original-source proof and fresh numerical calculation did not satisfy all obligations.');
  const sourceEvidence={authentication:AUTHENTICATION,installedEvidenceSHA256:INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256,
      originalNumericalCertificate:evidence.numericalCertificate,sourceProcess:evidence.sourceProcess,sourceDiagnostics:evidence.sourceDiagnostics,
      sourceRun:evidence.sourceRun,initialImportManifest:evidence.initialImportManifest,lateImportManifest:evidence.lateImportManifest,
      sourceChecks:evidence.sourceChecks,boundChecks:evidence.boundChecks,
      numericalAlgorithmManifest:evidence.numericalAlgorithmManifest,
      originalSourceGraphReconstructedForThisJob:false,serializedUserEvidenceAccepted:false,
      originalSelectorScaleEndpoints:AUTHENTICATION,unscaledDerivativeProductsRecomputed:true,
      interpretation:'The installed artifact records a separately observed execution of the complete original physical source, all270 derivative-error bindings, and closed positive selector-scale endpoints. This job recomputes the coefficient numerical premises and inverse conditioning from its precision controls, checks the installed scale widths, and freshly multiplies each coefficient interval by its original positive scale interval. It does not create or restore the private original graph token.'},
    sourceBinding={...evidence.sourceBinding,authentication:AUTHENTICATION,sourceReconstructedInThisRuntime:false,
      originalPointAndBandPinned:true,originalPositiveNormalizersPinned:true,callerPointMatrixOrDerivativeAccepted:false},
    graph={...evidence.graph,role:'SEPARATELY_EXECUTED_ORIGINAL_PHYSICAL_SOURCE_GRAPH',
      installedEvidenceSHA256:INSTALLED_PHYSICAL_CENTER_EVIDENCE_SHA256,
      freshNumericalSHA256:await sha256({request,numerics,conditioning,positiveScaleNumerics,unscaledDerivatives,rowBindings})},
    scope={sameOriginalPhysicalPoint:true,originalSourceEvidenceExternallyExecuted:true,
      sourceAuthentication:AUTHENTICATION,runtimeReconstructedFullSourceGraph:false,privateSourceTokenCreated:false,
      freshNumericalRecomputation:true,freshInverseConditioningChecked:true,
      actualSlowFastMixedCovarianceWeightDerivativeNumerics:true,
      actualFullPhysicalCurlFirstAndSecondDerivativeNumerics:true,actualSpatialCovariantHessianNumerics:true,
      angularMixedAndFrameConnectionsIncluded:true,physicalDirections:['r','z','t','theta'],
      pulseDerivativeRows:228,physicalDerivativeRows:42,positiveAnalyticRemaindersRetained:true,
      originalPositiveHRetained:true,originalPositiveScalesRetained:true,
      rawUnscaledRelativeAccuracyClaimed:false,allSourceLabelsNumericallyCovered:false,
      remainingSelectorAndPaletteScalesNumericallyClosed:true,originalSelectorScaleEndpointsExternallyExecuted:true,
      freshUnscaledDerivativeIntervalProducts:true,all270PositiveScaleWidthsChecked:true,
      individualEtaBetaPrecisionMet:false,individualTPrecisionMet:false,globalResidualNumericallyEnclosed:false,
      wholeGNUMComplete:false,userRequestedM2Complete:false,newLeanKernelProof:false,M3Started:false},
    result={schema:'MathScope.InstalledPhysicalCenterNumericalCertificate/1',status:'COMPLETED',pass:true,request,
      sourceBinding,sourceEvidence,graph,numerics,conditioning,positiveScaleNumerics,unscaledDerivatives,
      positiveSelectorScaleEvidence:structuredClone(evidence.positiveSelectorScaleEvidence),rowBindings,roots:structuredClone(evidence.roots),checks,scope,
      replayPolicy:'RECOMPUTE_FROM_ORIGINAL_INPUT_WITH_SAME_INSTALLED_SOURCE_EVIDENCE_AND_ARITHMETIC_BUILD'};
  context.checkCancelled?.();return result;
}
