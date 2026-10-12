/** Exact tables for independently varied controls on the original inner core. */
const copy=value=>JSON.parse(JSON.stringify(value));
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_REFINEMENT_VIEW'});};
const rational=/^-?\d+(?:\/[1-9]\d*)?$/;
const labels={spatialGrid:'Y 격자 분할',comparisonDegree:'비교 급수 차수',arithmeticBits:'구간 계산 bits'};
const quantities=['radialAverageDerivative','azimuthalCore','axialOverJ0'];

function source(result){
  if(result?.package!=='N8'||result.operation!=='source-core-refinement')return null;
  const r=result.results;
  if(r?.schema!=='MathScope.N8.ActualCoreRefinement/1'||r.freshCoreComparisonsExecuted!==true
      ||r.execution?.binary64UsedForDecisions!==false||r.scope?.wholeN8ReconstructionComputed!==false
      ||r.adaptationAxes?.fourierCutoff?.executed!==false
      ||r.adaptationAxes?.spatialGrid?.uniformInterpolationError!==null)
    fail('The exact inner-core refinement and its unresolved source bounds are required.');
  if(result.observations?.samples?.length||result.observations?.curves?.length)
    fail('The exact source Y grid is not a set of Cartesian flow samples or physical times.');
  if(!Array.isArray(r.families)||r.families.length!==3||new Set(r.families.map(f=>f.axis)).size!==3)
    fail('Every independent control family is required.');
  for(const family of r.families){
    if(!Object.hasOwn(labels,family.axis)||!family.variants?.length)fail('Unknown source refinement axis.');
    for(const variant of family.variants){
      if(variant.verifiedUnchangedControls!==true||variant.comparisons.some(c=>c.intervalsOverlap!==true||c.samePhysicalCoordinate!==true))
        fail('Only one control may change and common physical coordinates must agree.');
      for(const sample of variant.samples){
        if(sample.nonlinearComparisonErrorsRetained!==true||sample.pressureAnalyticErrorsRetained!==true
            ||sample.entireFinalVelocityEvaluated!==false||sample.sourceDomain.eta!=='0'
            ||!rational.test(sample.sourceDomain.Y))fail('The original core or its positive errors changed.');
        for(const key of quantities){const interval=sample.quantities[key]?.interval;
          if(!interval||!rational.test(interval.lower)||!rational.test(interval.upper))fail('An exact rational interval is missing.');
        }
      }
    }
  }
  return r;
}

export function buildSourceRefinementPanel(result){
  const r=source(result);if(!r)return null;
  const rows=[];
  for(const family of r.families)for(const variant of family.variants)variant.samples.forEach((sample,index)=>{
    rows.push({id:family.axis+':'+variant.level+':'+index,axis:family.axis,label:labels[family.axis],
      level:variant.level,controls:copy(variant.controls),Y:sample.sourceDomain.Y,X:sample.sourceDomain.X,
      quantities:copy(sample.quantities),comparisons:copy(variant.comparisons.filter(row=>row.Y===sample.request.Y)),
      sourcePath:'result.results.families['+r.families.indexOf(family)+'].variants['+family.variants.indexOf(variant)+'].samples['+index+']'});
  });
  return {id:'N8-original-core-refinement',label:'같은 원문 내부장 · 독립 격자·차수·정밀도 비교',rows,
    axes:r.families.map(f=>({axis:f.axis,label:labels[f.axis],levels:copy(f.levels),scope:f.acceptedScope??f.variants[0]?.acceptedScope})),
    baseline:copy(r.baseline.controls),uniqueCoreEvaluations:r.execution.uniqueCoreEvaluations,
    resultSHA256:r.resultSHA256,freshCoreComparisonsExecuted:true,physicalSpaceSamplesGenerated:false,
    notes:['각 비교에서는 한 가지 설정만 바꿉니다. 같은 Y 좌표의 구간이 겹치는지 정확한 유리수로 검사합니다.',
      '모든 값은 양의 비선형 오차와 압력의 해석 오차를 포함합니다. 표에는 실제 하한과 상한을 그대로 표시합니다.',
      'Y∈[2,3], X=Y/Λ, η=0의 내부장 평가입니다. 공간 점 사이의 균일 오차, 환형 pulse와 전체 Fourier 꼬리는 아직 해결되지 않았습니다.',
      '비교 구간의 일치는 최종 N6/N7 장의 재구성이나 전체 N8 기준의 완료를 뜻하지 않습니다.']};
}

export function sourceRefinementSummary(result){
  const r=source(result);if(!r)return null;
  return {schema:'MathScope.N8.CoreRefinementDisplaySummary/1',source:copy(r.source),request:copy(r.request),
    baseline:copy(r.baseline.controls),execution:copy(r.execution),adaptationAxes:copy(r.adaptationAxes),
    lastResolvedTau:r.lastResolvedTau,remainingSourceObligations:copy(r.remainingSourceObligations),scope:copy(r.scope),
    resultSHA256:r.resultSHA256,freshCoreComparisonsExecuted:true,
    fullExactSamplesExportPath:'result.results.families',allOriginalSamplesRetainedInExport:true};
}

export function sourceRefinementSelection(result,id){
  const panel=buildSourceRefinementPanel(result),row=panel?.rows.find(row=>row.id===id);
  if(!row)fail('Choose a source row from the current refinement.');
  return {schema:'MathScope.N8.CoreRefinementSelection/1',...copy(row),source:copy(result.results.source),
    resultSHA256:result.results.resultSHA256,runHash:result.runHash,
    exactIntervalsRoundedToBinary64:false,sourceChangedBySelection:false,
    selectionPersistence:'PAGE_LOCAL_ONLY; every original row is retained in every export',
    completeN8:false,fullN6FinalFieldConstructed:false};
}
