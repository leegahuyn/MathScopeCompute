/** Reproduce observed N8 mathematics while retaining each run's own scope.
 * A historical source digest is evidence to compare, never replay authority.
 * This module is a packaging/verification tool, not a Navier source model.
 */
const fail=message=>{throw new Error(message);};
const clone=value=>JSON.parse(JSON.stringify(value));
const operations=new Set(['galerkin','source-near-terminal-record','source-core-refinement']);

export function unpackN8Observation(value){
  const record=value?.record??(value?.schema==='MathScope.M3.ExtendedExecution/1'?value:null);
  const result=record?.result??value?.result;
  const request=record?.request??(result?{kind:'navier',input:result.input}:null);
  const resultDigest=record?.resultDigest??value?.audit?.resultDigest;
  const sourceManifest=record?.sourceBinding?.manifestSHA256??value?.audit?.sourceManifest;
  if(request?.kind!=='navier'||result?.package!=='N8'||!operations.has(result.operation)||
      request.input?.operation!==result.operation||!result.results||!/^[0-9a-f]{64}$/.test(resultDigest??'')||
      !/^[0-9a-f]{64}$/.test(sourceManifest??''))fail('Use an actual supported N8 run or exported execution record.');
  if(record&&(record.formalProofIssued!==false||record.wholeM3Complete!==false||
      record.serializedAuthority!=='UNTRUSTED_REQUIRES_REEXECUTION'))fail('An imported record cannot supply proof or milestone authority.');
  return {format:record?'EXPORTED_EXECUTION_RECORD':'OBSERVED_WEBMCP_RUN_RESPONSE',record,result,request,
    resultDigest,sourceManifest,camera:record?.presentation?.payload?.view?.camera??value?.audit?.camera??null,
    view:record?.presentation?.payload?.view??null,importedAuthorityAdopted:false};
}

export function n8MathematicalPayload(result){
  if(result?.package!=='N8'||!operations.has(result.operation))fail('Unsupported N8 mathematical comparison.');
  const observations=result.observations??{};
  // runHash, implementation pins, progress and claim records belong to the
  // separately checked provenance. Every value in the actual calculation
  // and every sampled field/path/energy value remains in this comparison.
  const observed=result.operation==='galerkin'
    ?Object.fromEntries(['samples','paths','flow','energy'].map(key=>[key,observations[key]]))
    :observations;
  return clone({operation:result.operation,input:result.input,results:result.results,observations:observed});
}

export function compareN8Mathematics(actual,expected,{absoluteTolerance=0,relativeTolerance=0,maxNodes=1500000}={}){
  if(!Number.isFinite(absoluteTolerance)||absoluteTolerance<0||absoluteTolerance>1e-8||
      !Number.isFinite(relativeTolerance)||relativeTolerance<0||relativeTolerance>1e-8||
      !Number.isSafeInteger(maxNodes)||maxNodes<1||maxNodes>3000000)fail('Declare a finite, explicit reproduction tolerance and comparison budget.');
  let nodes=0,numbers=0,exactValues=0,maxAbsoluteDifference=0,maxNormalizedDifference=0,totalMismatches=0;
  const mismatches=[],bad=(path,reason,a,b)=>{totalMismatches++;if(mismatches.length<16)mismatches.push({path,reason,actual:a,expected:b});};
  const walk=(a,b,path)=>{
    if(++nodes>maxNodes)fail('N8 reproduction comparison exhausted its explicit traversal budget.');
    if(typeof a!==typeof b){bad(path,'TYPE_CHANGED',typeof a,typeof b);return;}
    if(typeof b==='number'){
      numbers++;if(!Number.isFinite(a)||!Number.isFinite(b)){bad(path,'NONFINITE_VALUE',String(a),String(b));return;}
      const error=Math.abs(a-b),scale=absoluteTolerance+relativeTolerance*Math.max(Math.abs(a),Math.abs(b));
      maxAbsoluteDifference=Math.max(maxAbsoluteDifference,error);
      maxNormalizedDifference=Math.max(maxNormalizedDifference,scale?error/scale:error?Infinity:0);
      if((Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a!==b)||error>scale)bad(path,'OUTSIDE_DECLARED_TOLERANCE',a,b);
      return;
    }
    if(a===null||b===null||typeof b!=='object'){exactValues++;if(a!==b)bad(path,'EXACT_VALUE_CHANGED',a,b);return;}
    if(Array.isArray(a)!==Array.isArray(b)){bad(path,'CONTAINER_CHANGED',Array.isArray(a),Array.isArray(b));return;}
    const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
    if(JSON.stringify(ak)!==JSON.stringify(bk)){bad(path,'FIELDS_OR_ARRAY_LENGTH_CHANGED',ak.length,bk.length);return;}
    for(const key of bk)walk(a[key],b[key],path+'/'+key);
  };
  walk(actual,expected,'');
  return {schema:'MathScope.N8.MathematicalReproductionComparison/1',absoluteTolerance,relativeTolerance,
    comparedNodes:nodes,numericValues:numbers,exactValues,maxAbsoluteDifference,
    maxNormalizedDifference:Number.isFinite(maxNormalizedDifference)?maxNormalizedDifference:'UNBOUNDED_EXACT_MISMATCH',
    totalMismatches,mismatches,pass:totalMismatches===0,metadataComparedSeparately:true,
    sameModelRequired:true,continuumErrorBoundIssued:false,importedAuthorityAdopted:false};
}

export function n8RunCategories(observation){
  const {result,request,camera,sourceManifest}=observation,r=result.results;
  const common={edition:{site:'v0.3.1',engine:result.version,operation:result.operation},
    source:{manifestSHA256:sourceManifest,resultDigest:observation.resultDigest,
      bindingPath:observation.record?'record.sourceBinding':'audit.sourceManifest'},
    camera:{state:clone(camera),role:'DISPLAY_ONLY',mathematicalSourceChanged:false},
    exactInput:clone(request)};
  if(result.operation==='galerkin'){
    const energy=result.observations?.energy;
    if(r.branch!=='GENERIC_FOURIER_GALERKIN'||energy?.originalPaperWholeSpaceEnergy!==false||
        energy.global?.scope!=='FULL_PERIODIC_BOX'||energy.core?.scope!=='SELECTED_BOX_SUBREGION'||
        r.precision?.rigorousErrorEnclosure!==false||r.evidence?.paperReconstruction!==false)
      fail('A finite periodic run must retain its own energy, precision and source scope.');
    return {...common,role:'SELECTED_RUN',model:'EXECUTED_FINITE_PERIODIC_FOURIER_GALERKIN',
      constants:clone(r.input),basis:clone(r.domain),domain:{...clone(r.domain),bounds:clone(energy.global.bounds)},
      timeSchedule:{lastResolvedTime:r.lastResolvedTime,acceptedSteps:r.acceptedSteps,rejectedSteps:r.rejectedSteps,
        completeStepsPath:'record.result.results.steps',completeStatesPath:'record.result.results.stateHistory',
        storedTimes:r.stateHistory.frames.map(row=>row.time),discardedFrames:r.stateHistory.discardedFrames},
      quadrature:{global:clone(energy.global.independentMidpoint),globalParsevalDifference:energy.global.parsevalDifference,
        coreCoarse:clone(energy.core.coarse),coreFine:clone(energy.core.fine),coreDifference:energy.core.refinementDifference},
      truncations:{cutoff:r.input.cutoff,modes:r.modes.length,completeModeListPath:'record.result.results.modes',
        completeCoefficientPaths:['record.result.results.initial','record.result.results.final','record.result.results.stateHistory.frames'],
        omittedOriginalSourceTermsReplacedByZero:false},precision:clone(r.precision),
      tails:{scope:'FINITE_MODEL_ONLY',statement:energy.tail,certifiedContinuumTail:false},
      residual:{kind:'DISCRETE_STEP_DEFECT_AND_FINITE_DIVERGENCE_CHECKS',historyPath:'record.result.results.history',stepsPath:'record.result.results.steps',
        maximumLocalStepError:Math.max(...r.steps.map(row=>row.localError)),
        maximumNormalizedEnergyDefect:Math.max(...r.steps.map(row=>row.normalizedEnergyDefect)),
        maximumNormalizedDivergence:Math.max(...r.history.map(row=>row.normalizedDivergence)),originalLocalizedSourceResidual:false},
      energy:{global:clone(energy.global),core:clone(energy.core),unit:energy.unit,rowsPath:'record.result.observations.energy.rows',
        originalPaperWholeSpaceEnergy:false},claimScope:'Reproduction of this executed finite model only; N7 whole-K energy and N8 all-scale adaptation remain separate obligations.'};
  }
  if(result.operation==='source-near-terminal-record'){
    const c=r.certificate;
    if(!c?.formulaProgram||!c.rows?.length||r.freshSourceConstructorExecuted!==false||r.completeN6!==false)
      fail('The near-terminal observation must retain its authentic recorded source and unresolved full field.');
    return {...common,role:'ORIGINAL_SOURCE_FIXTURE',model:'ORIGINAL_FINAL_LOCALIZED_CORE_RESTRICTION',
      constants:{sourceNodeIds:clone(c.constants),nodeIdsAreNotValues:true,completeProgramPath:'result.results.certificate.formulaProgram',
        sourceBinding:clone(c.sourceBinding)},basis:{coordinates:'cylindrical (r,theta,z)',components:['radial','azimuthal','axial']},
      domain:{point:clone(c.point),localizationBinding:clone(c.localizationBinding),coreIdentity:clone(r.coreRestrictionEvidence.coreIdentity)},
      timeSchedule:{primary:'s=-log(tau)',sampleDefinition:c.tail.sampleDefinition,depths:c.rows.map(row=>row.depth),
        completeRowsPath:'result.results.certificate.rows',decimalSamplePath:'result.results.certificate.decimalSamples',lastResolvedTau:clone(r.lastResolvedTau)},
      quadrature:{kind:'ANALYTIC_POINT_ENCLOSURES',spatialIntegralExecuted:false},
      truncations:{leading:clone(c.leading.definitions),completeTail:clone(c.tail),omittedTailSetToZero:false},
      precision:{request:clone(c.request),exactIntervalsRetained:true,physicalTimeRoundedToBinary64:false},tails:clone(c.tail),
      residual:{status:'NOT_EVALUATED_BY_THIS_POINT_OBSERVATION',originalResidualDeclaredZero:false},
      energy:{status:'NOT_A_SPATIAL_ENERGY_INTEGRAL',finitePeriodicEnergySubstituted:false},
      claimScope:'This fixture reproduces authentic source component enclosures and the current core-support proof. The heavy original constructor is a separate CI gate.'};
  }
  return {...common,role:'ORIGINAL_SOURCE_FIXTURE',model:'ORIGINAL_CORE_INDEPENDENT_REFINEMENT',
    constants:{source:clone(r.source),baseline:clone(r.baseline)},basis:{kind:'ORIGINAL_CORE_COEFFICIENT_EXPANSION'},
    domain:{scope:clone(r.scope),wholePhysicalField:false},timeSchedule:{request:clone(r.request),lastResolvedTau:clone(r.lastResolvedTau)},
    quadrature:{kind:'RECORDED_INDEPENDENT_CORE_GRID_COMPARISONS',completeFamiliesPath:'record.result.results.families'},
    truncations:clone(r.adaptationAxes),precision:{request:clone(r.request),exactRationalIntervals:true},
    tails:{completeFamiliesPath:'record.result.results.families',remainingSourceObligations:clone(r.remainingSourceObligations)},
    residual:{status:'NO_FULL_PHYSICAL_RESIDUAL_FROM_THIS_CORE_COMPARISON'},
    energy:{status:'NO_SPATIAL_ENERGY_INTEGRAL_FROM_THIS_CORE_COMPARISON',finitePeriodicEnergySubstituted:false},
    claimScope:'Independent core comparisons do not close original N8-05 annular, axial, pulse and active-cutoff requirements.'};
}
