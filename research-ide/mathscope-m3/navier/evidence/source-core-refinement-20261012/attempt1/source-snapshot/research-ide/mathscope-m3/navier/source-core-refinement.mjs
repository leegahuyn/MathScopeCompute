/** Independent point-grid, comparison-degree and arithmetic refinements of
 * the original inner leading profile. These are fresh directed evaluations
 * of the same nonlinear core. They do not replace a missing N6 final field,
 * assert a uniform interpolation bound, or refine the annular pulse spectrum.
 */
import {evaluateActualCorePoint} from '../../mathscope-m2/navier/actual-core-evaluator.mjs';
import {SOURCE_PROFILE_ID} from '../../mathscope-m2/navier/source-profile.mjs';
import {rational,readRational,qcompare,qsub,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const copy=value=>structuredClone(value),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const SOURCE_PARAMETER_SHA='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';
const sortedDistinct=(value,min,max,name)=>{
  if(!Array.isArray(value)||!value.length||value.length>8||new Set(value).size!==value.length
      ||value.some(x=>!Number.isSafeInteger(x)||x<min||x>max))
    fail('INVALID_INPUT',name+' must contain 1..8 distinct integers in '+min+'..'+max+'.');
  return [...value].sort((a,b)=>a-b);
};
const width=interval=>qsub(readRational(interval.upper),readRational(interval.lower));
const overlap=(a,b)=>qcompare(readRational(a.lower),readRational(b.upper))<=0&&qcompare(readRational(b.lower),readRational(a.upper))<=0;

export function validateSourceCoreRefinement(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)
      ||Object.keys(input).some(key=>!['gridLevels','degrees','precisionBits','baseGrid','baseDegree','baseBits'].includes(key)))
    fail('INVALID_INPUT','Only independent grid, comparison degree and directed arithmetic controls are accepted. Original constants and source values cannot be replaced.');
  const gridLevels=sortedDistinct(input.gridLevels??[1,2,4],1,16,'gridLevels'),
    degrees=sortedDistinct(input.degrees??[32,48,64],32,64,'degrees'),
    precisionBits=sortedDistinct(input.precisionBits??[128,192,256],128,512,'precisionBits'),
    baseGrid=input.baseGrid??2,baseDegree=input.baseDegree??32,baseBits=input.baseBits??256;
  if(!Number.isSafeInteger(baseGrid)||baseGrid<1||baseGrid>16||!Number.isSafeInteger(baseDegree)||baseDegree<32||baseDegree>64
      ||!Number.isSafeInteger(baseBits)||baseBits<128||baseBits>512)
    fail('INVALID_INPUT','The fixed controls must stay within grid 1..16, degree 32..64 and bits 128..512.');
  if(gridLevels.some(n=>n&(n-1))||baseGrid&(baseGrid-1))
    fail('INVALID_INPUT','Nested spatial grids use powers of two.');
  const maximumEvaluations=gridLevels.reduce((a,n)=>a+n+1,0)+(degrees.length+precisionBits.length)*(baseGrid+1);
  if(maximumEvaluations>160)fail('RESOURCE_LIMIT','This independent refinement plan exceeds 160 original core evaluations.');
  return {gridLevels,degrees,precisionBits,baseGrid,baseDegree,baseBits,maximumEvaluations};
}

function compactCore(core){
  const phi=core.phi.rows[0],axial=core.axial.actualValues[0],etaDerivative=core.axial.actualValues[1],averageEta=etaDerivative.averageU,
    radial={lower:qtext(qsub(rational(0),readRational(averageEta.upper))),upper:qtext(qsub(rational(0),readRational(averageEta.lower)))};
  if(core.sourceBindings.parameterExpressionSHA256!==SOURCE_PARAMETER_SHA||core.request.eta.kind!=='J_SCALED'
      ||core.request.eta.value!=='0'||core.domain.sourcePosition!=='ACTUAL_UNMODIFIED_CORE'
      ||axial.normalization!=='DIVIDE_BY_POSITIVE_J0'||etaDerivative.normalization!=='ORDINARY_ETA_DERIVATIVE'
      ||core.scope.positiveBanachErrorRetained!==true||core.scope.actualPressureAnalyticErrorRetained!==true)
    fail('INVALID_SOURCE_CONSTRUCTION','The fresh refinement left the original inner core or changed a normalization.');
  return {request:copy(core.request),sourceBinding:copy(core.sourceBindings),
    quantities:{radialAverageDerivative:{quantity:'-partial_eta averageU(Y/Lambda,0)',interval:radial},
      azimuthalCore:{quantity:'Phi(Y,0)',interval:copy(phi.actualNonlinearInterval)},
      axialOverJ0:{quantity:'U(Y/Lambda,0)/j0',interval:copy(axial.U)}},
    comparison:{polynomial:copy(phi.comparisonPolynomial),radialCauchyTailUpper:phi.comparisonRadialCauchyTailUpper,
      positiveNonlinearErrorUpper:phi.positiveNonlinearErrorUpper},
    pressureAndAxial:copy(core.axial),arithmetic:copy(core.arithmetic),
    sourceDomain:{X:core.coordinates.XExact,Y:core.request.Y,eta:'0',annularRegionEntered:false},
    nonlinearComparisonErrorsRetained:true,pressureAnalyticErrorsRetained:true,
    exactNonlinearRecurrenceNumericallyExecuted:core.axial.scope.exactNonlinearRecurrenceNumericallyExecuted,
    entireFinalVelocityEvaluated:false};
}

/** Every variant changes exactly one named control. Common grid nodes are
 * compared as exact intervals; agreement alone is never a tail certificate.
 */
export async function evaluateSourceCoreRefinement(input={},context={}){
  const request=validateSourceCoreRefinement(input),cache=new Map();
  function run(grid,degree,bits){
    const samples=[];
    for(let i=0;i<=grid;i++){
      context.checkCancelled?.();const Y=qtext(rational(2*grid+i,grid)),key=Y+':'+degree+':'+bits;
      if(!cache.has(key))cache.set(key,compactCore(evaluateActualCorePoint({sourceProfile:SOURCE_PROFILE_ID,Y,
        eta:{kind:'J_SCALED',value:'0'},radialOrder:0,etaOrder:1,bits,degree},context)));
      samples.push(copy(cache.get(key)));
    }
    return {controls:{grid,degree,bits},samples};
  }
  const baseline=run(request.baseGrid,request.baseDegree,request.baseBits),plans=[
    ['spatialGrid',request.gridLevels,'grid'],['comparisonDegree',request.degrees,'degree'],['arithmeticBits',request.precisionBits,'bits']
  ],families=[];
  for(const [axis,levels,control]of plans){
    const variants=[];
    for(const level of levels){
      const controls={...baseline.controls,[control]:level},variant=run(controls.grid,controls.degree,controls.bits),comparisons=[];
      for(const current of variant.samples){
        const original=baseline.samples.find(row=>row.request.Y===current.request.Y);if(!original)continue;
        for(const [quantity,value]of Object.entries(current.quantities)){
          const prior=original.quantities[quantity];comparisons.push({Y:current.request.Y,quantity,
            intervalsOverlap:overlap(prior.interval,value.interval),baselineWidth:qtext(width(prior.interval)),
            currentWidth:qtext(width(value.interval)),widthReduction:qtext(qsub(width(prior.interval),width(value.interval))),
            samePhysicalCoordinate:true});
        }
      }
      if(comparisons.some(row=>!row.intervalsOverlap))fail('SOURCE_REFINEMENT_INCONSISTENT','Independent rigorous intervals for the same original point do not intersect.');
      variants.push({level,...variant,comparisons,onlyChangedControl:control,
        verifiedUnchangedControls:Object.keys(controls).filter(key=>key!==control).every(key=>controls[key]===baseline.controls[key])});
    }
    families.push({axis,levels,variants,status:'FRESH_DIRECTED_ORIGINAL_CORE_EVALUATIONS',
      acceptedScope:axis==='spatialGrid'?'Pointwise samples on nested Y grids; no uniform between-point or annular pulse resolution is asserted.'
        :'Same original point values with the other discretization controls fixed; positive source errors are retained.'});
  }
  const result={schema:'MathScope.N8.ActualCoreRefinement/1',status:'CORE_REFINEMENTS_EXECUTED_FINAL_FIELD_PENDING',request,
    freshCoreComparisonsExecuted:true,freshSourceConstructorExecuted:false,
    source:{profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:SOURCE_PARAMETER_SHA,
      domain:{Y:['2','3'],X:'Y/Lambda',eta:'0'},sameOriginalConstants:true},baseline,families,
    execution:{uniqueCoreEvaluations:cache.size,maximumEvaluations:request.maximumEvaluations,
      binary64UsedForDecisions:false,newPrivateCommonFamilyConstructed:false},
    adaptationAxes:{spatialGrid:{status:'POINTWISE_CORE_GRID_REFINED',uniformInterpolationError:null,axialGridRefined:false,pulseWidthResolved:false},
      fourierCutoff:{status:'UNRESOLVED_FOR_FINAL_ANNULAR_SOURCE',executed:false,
        reason:'The full updated angular/auxiliary source coefficients and certified omitted-mode tail are not supplied by this inner leading-profile evaluator.'},
      coefficientSeries:{status:'COMPARISON_SERIES_REFINED_WITH_POSITIVE_NONLINEAR_ERROR',actualNonlinearRecurrenceRecomputed:false},
      arithmeticPrecision:{status:'DIRECTED_BIGINT_DYADIC_REFINED',precisionIsIndependentOfGridAndSeries:true}},
    lastResolvedTau:null,remainingSourceObligations:['Attach the same finalized N6/N7 field and annular-support identification.',
      'Resolve axial and pulse scales, every active cutoff and the omitted original angular/auxiliary spectrum.',
      'Provide uniform spatial interpolation and complete source-series tail bounds for the reconstructed field.'],
    scope:{originalN804CriterionComplete:false,originalN805CriterionComplete:false,wholeN8ReconstructionComputed:false,
      fullN6FinalFieldConstructed:false,newLeanKernelProof:false,wholeM3Complete:false}};
  return {...result,resultSHA256:await sha256(canonicalStringify(result))};
}

/** The table consumes its exact rational endpoints directly. No spatial
 * field samples or interpolated curves are manufactured from refinement
 * controls, and an executed inner-core comparison does not complete N8.
 */
export function sourceCoreRefinementObservations(result){
  if(result?.schema!=='MathScope.N8.ActualCoreRefinement/1'||result.freshCoreComparisonsExecuted!==true
      ||result.freshSourceConstructorExecuted!==false||result.source?.parameterExpressionSHA256!==SOURCE_PARAMETER_SHA
      ||result.scope?.fullN6FinalFieldConstructed!==false||result.scope?.originalN805CriterionComplete!==false
      ||result.families?.length!==3)
    fail('INVALID_SOURCE_REFINEMENT','Expected fresh original inner-core refinements with the unresolved final-field scope retained.');
  const sourceFiles=[
    {path:'research-ide/mathscope-m2/navier/actual-core-evaluator.mjs',sha256:'670952e4d28f1f6f81830e90a784192de3b387fc097db2576f9fd5716dc6d2a9',bytes:13582,
      role:'Fresh original core evaluator called by each unique (Y, comparison degree, arithmetic bits) evaluation.'},
    {path:'research-ide/mathscope-m2/navier/tests/actual-core-evaluator.test.mjs',sha256:'18f0266cd8d9c531f48b211da9e786c17dfaac59e8c61defd728c8ff14f4c7d2',bytes:7103,
      role:'Evaluator source contract tests; identified here without claiming that this runtime operation executes the test suite.'}
  ];
  return {kind:'SOURCE_CORE_INDEPENDENT_REFINEMENT_INTERVALS',samples:[],curves:[],
    contract:{physicalCoordinate:'X=Y/Lambda, eta=0; Y in [2,3]',
      numericalControls:['nested Y point grid','comparison series degree','directed arithmetic bits'],
      intervalRepresentation:'EXACT_RATIONAL_ENDPOINTS_WITH_POSITIVE_NONLINEAR_AND_PRESSURE_ERRORS',
      quantityRepresentation:'ORIGINAL_INNER_LEADING_COEFFICIENTS_ONLY',
      comparisonMeaning:'Only the named numerical control changes in each family. Common physical points are compared by exact interval intersection and width.',
      midpointUsed:false,interpolatedFieldGenerated:false,spatialSamplesGenerated:false,
      freshCoreComparisonsExecuted:true,freshSourceConstructorExecuted:false,sourceFiles,
      sourceParameterExpressionSHA256:SOURCE_PARAMETER_SHA,resultSHA256:result.resultSHA256},
    claims:[{id:'N8-O-source-core-independent-refinement',observable:'Three original inner leading coefficients evaluated with independent numerical controls',
      equations:['-partial_eta averageU(Y/Lambda,0)','Phi(Y,0)','U(Y/Lambda,0)/j0'],
      sourceProfile:copy(result.source),sourceFiles:copy(sourceFiles),
      refinementContractTest:{path:'research-ide/mathscope-m3/navier/tests/source-core-refinement.test.mjs',newTestSuiteExecuted:false},
      execution:copy(result.execution),positiveSourceErrorsRetained:true,
      exactNonlinearRecurrenceNumericallyExecuted:false,uniformSpatialInterpolationCertified:false,
      omittedFourierTailCertified:false,fullPhysicalVelocityEvaluated:false,
      limitations:copy(result.adaptationAxes),remainingSourceObligations:copy(result.remainingSourceObligations),
      lastResolvedTau:null,leanTheorem:null,newLeanExecuted:false,
      scope:'FRESH_POINTWISE_ORIGINAL_CORE_REFINEMENTS_WITH_FINAL_N6_N7_FIELD_PENDING',
      completeN6:false,completeN8:false,wholeM3Complete:false}]};
}
