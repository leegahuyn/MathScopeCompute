/** Directed coefficients for the SAME original, newly inverted physical
 * point. Actual bodies, comparison slopes, target bounds and full-time
 * error estimates are separately authenticated before rows are joined.
 * This attachment does not evaluate the remaining selector scale tower.
 */
import {assertActualPhysicalCenterFiniteJetBodies} from './actual-physical-center-jet-bodies.mjs';
import {assertActualPhysicalCenterSlowSlopeEnclosure} from './actual-physical-center-slow-slope-enclosure.mjs';
import {assertActualPhysicalCenterTargetEnclosure} from './actual-physical-center-target-enclosure.mjs';
import {bindActualPhysicalCenterFullJetSourceBounds} from './actual-physical-center-jet-source-enclosure-bounds.mjs';
import {enclosePhysicalCenterJetCoefficients} from './actual-physical-center-slow-slope-kernel.mjs';
import {enclosePhysicalCompleteCurlJetCoefficients} from './actual-physical-center-full-curl-jet-kernel.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qsub,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),rowKey=r=>[r.quantity,r.sign??'physical',r.component,r.derivative].join(':'),
  data=r=>canonicalStringify({request:r.request,sourceBinding:r.sourceBinding,sourceBounds:r.sourceBounds,roots:r.roots,rows:r.rows,
    numerics:r.numerics,checks:r.checks,proof:r.proof,scope:r.scope});
function controlsOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance'].includes(k)))
    fail('INVALID_INPUT','Only directed precision and an exact positive tolerance accompany the three private source attachments.');
  const request={precisionBits:input.precisionBits??192,tolerance:input.tolerance??'1/1000000000000'};
  directedArithmetic(request.precisionBits);
  if(typeof request.tolerance!=='string'||qcompare(readRational(request.tolerance),Q(0))<=0||qcompare(readRational(request.tolerance),Q(1,100))>0)
    fail('INVALID_INPUT','Use an exact positive coefficient interval width at most1/100.');
  return request;
}

export function attachActualPhysicalCenterFullJetEnclosure(bodies,slopes,target,input={},context={}){
  const request=controlsOf(input);
  assertActualPhysicalCenterFiniteJetBodies(bodies);
  assertActualPhysicalCenterSlowSlopeEnclosure(slopes);
  assertActualPhysicalCenterTargetEnclosure(target);
  const p=bodies.physicalCenter,G=bodies.G;
  if(slopes.physicalCenter!==p||target.p!==p||slopes.G!==p.G||target.G!==p.G)
    fail('INVALID_SOURCE_CONSTRUCTION','All actual values, comparison slopes, target and derivative bodies must share the identical private physical point.');
  const sourceBounds=bindActualPhysicalCenterFullJetSourceBounds(bodies,slopes,target,context);
  if(!sourceBounds.pass||sourceBounds.sourceAuthenticated!==true||!sourceBounds.checks?.length||sourceBounds.checks.some(x=>!x.pass))
    fail('INVALID_SOURCE_CONSTRUCTION','The complete original matrix/field/target/phase error premises must be proved on this new physical point.');
  const pulse=enclosePhysicalCenterJetCoefficients({...request,mu:slopes.numerics.mu,nu:slopes.numerics.nu,values:p.numerics.values},context),
    physical=enclosePhysicalCompleteCurlJetCoefficients({...request,velocityCoefficients:p.numerics.values.weightedCylindrical[0]}),
    pulseMap=new Map(pulse.rows.map(r=>[rowKey(r),r])),physicalRows=physical.rows.map(r=>({...r,quantity:'physicalCurl',derivative:r.direction??r.directions.join('')})),
    physicalMap=new Map(physicalRows.map(r=>[rowKey(r),r])),rows=[];
  if(pulseMap.size!==228||physicalMap.size!==42||bodies.rows.length!==228||bodies.physical.rows.length!==42)
    fail('INVALID_SOURCE_CONSTRUCTION','The complete source package requires228 pulse/weight rows and42 physical differential rows.');
  for(const body of [...bodies.rows,...bodies.physical.rows]){
    const physicalRow=body.quantity==='physicalCurl',numeric=(physicalRow?physicalMap:pulseMap).get(rowKey(body));
    if(!numeric)fail('INVALID_SOURCE_CONSTRUCTION','A directed coefficient has no matching original derivative: '+rowKey(body));
    const interval=structuredClone(physicalRow?numeric.coefficient:numeric.interval),radius=physicalRow?physical.positiveRemainder:pulse.errorBudget.positiveRadius,
      width=qsub(readRational(interval.upper),readRational(interval.lower));
    if(G.freeCoordinates(body.coefficient).size||G.freeCoordinates(body.positiveExactScale).size||!body.bodyDerivativeBinding||
      qcompare(width,readRational(request.tolerance))>0||qcompare(readRational(radius),Q(0))<=0)
      fail('INVALID_SOURCE_CONSTRUCTION','A numerical row lost its fixed original derivative, positive scale, positive error or requested width.');
    rows.push({...body,rowKey:rowKey(body),directedInterval:interval,width:numeric.width,tolerance:request.tolerance,toleranceMet:true,
      positiveErrorRadius:radius,sourceNumericalPremisesBound:true,
      numericalGroup:physicalRow?'physicalCurl':numeric.group,
      derivativeMeaning:physicalRow?'Components of the original physical covariant derivative or Hessian in the original orthonormal cylindrical frame, including mixed time derivatives.':
        'Original slow/fast derivative at the new physical representative; D_R=Rsharp*partial_R with Rsharp frozen after the original differentiation.'});
  }
  const checks=[
    {id:'same-original-new-physical-point-for-all-four-private-inputs',pass:slopes.physicalCenter===p&&target.p===p&&bodies.physicalCenter===p},
    {id:'source-authenticated-complete-finite-jet-error-premises',pass:sourceBounds.pass&&sourceBounds.sourceAuthenticated&&sourceBounds.checks.every(x=>x.pass)},
    {id:'all-228-pulse-weight-and42-full-physical-derivatives-are-paired',pass:rows.length===270&&new Set(rows.map(r=>r.rowKey)).size===270&&rows.every(r=>r.sourceNumericalPremisesBound&&r.bodyDerivativeBinding)},
    {id:'all-directed-intervals-retain-positive-errors-and-requested-width',pass:pulse.pass&&physical.pass&&rows.every(r=>r.toleranceMet&&qcompare(readRational(r.positiveErrorRadius),Q(0))>0)},
    {id:'full-angular-covariant-hessian-and-original-sine-derivatives-retained',pass:['rtheta','ztheta','ttheta','thetatheta'].every(d=>rows.filter(r=>r.quantity==='physicalCurl'&&r.derivative===d).length===3)&&physical.coefficientCurlDerivativeDiscarded===false},
    {id:'old-point-actual-jet-values-are-not-transplanted',pass:pulse.errorBudget.oldPointRowsTransplanted===false&&slopes.scope.oldPointActualJetsTransferred===false&&bodies.scope.oldPointSpecificDerivativeValuesTransplanted===false},
  ];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The source-bound physical derivative numerical attachment is incomplete.');
  const roots={positiveSourceScales:bodies.roots.scales,sourceDerivativeValues:rows.map(r=>r.physicalValue??r.normalizedDirectionDerivative),
      sourceNormalizedCoefficients:rows.map(r=>r.coefficient),positiveExactRowScales:rows.map(r=>r.positiveExactScale),
      originalSourceMu:slopes.roots.mu,originalSourceNu:slopes.roots.nu,originalTargetTau:target.source.roots.tau},
    sourceBinding={sourceProfile:p.sourceBinding.sourceProfile,parameterExpressionSHA256:p.sourceBinding.parameterExpressionSHA256,
      originalPhysicalPoint:p.point.inverse,originalBand:p.band.geometry.ell,
      compiler:'Same private new physical point -> independently generated original variations and complete physical covariant jets -> source-bound full-time and finite-jet estimates -> directed coefficient intervals',
      sourceAuthenticated:true,callerPointMatrixOrDerivativeAccepted:false,oldActualPointValueTransplanted:false},
    numerics={pulse,physical,comparisonSlopes:slopes.numerics,targetCoefficient:target.numerics.coefficient,positiveTargetScales:target.numerics.rows},
    proof={sourcePremises:sourceBounds.proof??sourceBounds,
      values:'Each directed row pairs the exact source derivative identifier and its positive frozen normalizer with the separately bounded coefficient. The original matrix, inverse weights, moving frame, phase and cutoffs are differentiated before evaluation.',
      comparison:'The slopes are functionals of the new original full field. Their anchor transfer moves only the comparison coefficients. The actual two coupled Volterra systems and their first/second variations are newly generated at the new representative; no old actual solution jet is transferred.',
      physical:'The real full curl is differentiated before phase zero is substituted. Both derivatives of the coefficient-curl sine remainder remain. Covariant angular mixed derivatives and the angular-angular Hessian retain the vector and direction-frame connections.',
      precision:'The requested width is for the displayed scaled coefficient, using outward BigInt interval arithmetic with strictly positive analytic remainder reserves. The original positive scale remains attached as an exact source expression.',
      remaining:'Closed numerical endpoints for the original selector/palette/physical coordinate scales require their separate source arithmetic trace and bound. This attachment alone does not close G-NUM or start M3.'},
    scope={sameActualPhysicalCenter:true,actualOriginalCoupledVariations:true,actualSlowFastMixedCovarianceWeightDerivativeNumerics:true,
      actualFullPhysicalCurlFirstAndSecondDerivativeNumerics:true,actualSpatialCovariantHessianNumerics:true,angularMixedAndFrameConnectionsIncluded:true,
      physicalDirections:['r','z','t','theta'],pulseDerivativeRows:228,physicalDerivativeRows:42,
      positiveAnalyticRemaindersRetained:true,remainingSelectorAndPaletteScalesNumericallyClosed:false,
      rawUnscaledRelativeAccuracyClaimed:false,allSourceLabelsNumericallyCovered:false,globalResidualNumericallyEnclosed:false,
      oldPointActualJetTransplanted:false,hReplacedByZero:false,wholeGNUMComplete:false,userRequestedM2Complete:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,M3Started:false},
    result={G,p,bodies,slopes,target,request,sourceBinding,sourceBounds,roots,rows,numerics,checks,proof,scope};
  result.program=G.pack(roots,{schema:'MathScope.ActualPhysicalCenterFullJetEnclosureProgram/1',...JSON.parse(data(result))});
  seals.set(result,{G,p,bodies,slopes,target,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    covarianceCount:G.covarianceSystems.length,covariance:canonicalStringify(G.covarianceSystems),data:data(result),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'actual-physical-center-all-270-numerical-derivatives-sealed',nodeCount:G.nodes.length,rows:rows.length});return result;
}

export function assertActualPhysicalCenterFullJetEnclosure(result){
  const s=seals.get(result);
  if(!s||result.G!==s.G||result.p!==s.p||result.bodies!==s.bodies||result.slopes!==s.slopes||result.target!==s.target||
    data(result)!==s.data||canonicalStringify(result.program)!==s.program||canonicalStringify(s.G.nodes.slice(0,s.count))!==s.nodes||
    !s.G.functionDefinitionsUnchanged(s.definitions)||canonicalStringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private physical derivative numerical attachment. Copied receipts or changed intervals cannot authenticate a source.');
  assertActualPhysicalCenterFiniteJetBodies(s.bodies);assertActualPhysicalCenterSlowSlopeEnclosure(s.slopes);assertActualPhysicalCenterTargetEnclosure(s.target);return true;
}
export async function actualPhysicalCenterFullJetEnclosureCertificate(result){
  assertActualPhysicalCenterFullJetEnclosure(result);const s=seals.get(result);
  return {schema:'MathScope.ActualPhysicalCenterFullJetEnclosureCertificate/1',...JSON.parse(s.data),pass:true,
    graph:{sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length,fixedCompilerPrefix:true}};
}
