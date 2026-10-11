/** Read-only views of actual cutoff intervals and source-domain decisions. */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {scalarText,sampleIndices} from './observations.mjs';

const ROOT='result.results',readable=new Set(['COMPLETED','PARTIAL']);
const at=(value,path)=>path.split('.').reduce((v,k)=>v?.[k],value);
function eligible(job,options,kind,schema){
  if(job?.request?.kind!==kind||options.currentEditorMatches===false)return null;
  if(options.currentRequest!==undefined){try{if(canonicalStringify(options.currentRequest)!==canonicalStringify(job.request))return null;}catch{return null;}}
  const d=job?.result?.results;
  return readable.has(job.status)&&readable.has(job.result?.status)&&d?.schema===schema&&d.pass===true&&Array.isArray(d.checks)?d:null;
}
function propertyRows(d,path){
  return Object.entries(at(d,path)||{}).map(([key,value])=>({path:ROOT+'.'+path+'.'+key,cells:[[key,null],[value,ROOT+'.'+path+'.'+key]]}));
}
function panel(d,id,title,description,path,columns,rows,options,kind){
  const maximum=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):200;
  const selected=sampleIndices(rows.length,maximum),table={title,columns,rows:selected.map(i=>rows[i].cells.map(c=>c[0])),
    sourcePaths:selected.map(i=>rows[i].path),cellSourcePaths:selected.map(i=>rows[i].cells.map(c=>c[1])),
    totalRows:rows.length,truncated:selected.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',
    exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
  const axisMetadata=[
    {label:'원본 항목',type:'CATEGORICAL_SOURCE_FIELD',unit:'1',scale:'linear',transform:'stored source row order',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path},
    {label:'유리수 구간 또는 판정',type:'SOURCE_INTERVAL_OR_DOMAIN_DECISION',unit:'1',scale:'linear',transform:'exact source values to text',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path}
  ];
  const details=['sourceProgram','bindingProgram','graph','interpretation'].filter(k=>Object.hasOwn(d,k)).map(k=>({title:k,value:d[k],sourcePath:ROOT+'.'+k}));
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata,color:null,table,relatedTables:[],details,
    chart:{kind:'COMPARISON_TABLE',columns,rows:table.rows.map(r=>r.map(scalarText)),sourcePaths:table.sourcePaths,cellSourcePaths:table.cellSourcePaths,displayTransform:'EXACT_SOURCE_VALUES_TO_TEXT'},
    scene:{points:[],lines:[],arrows:[],axes:[]},
    observation:{kind,sourceProfileId:d.sourceProfile??d.sourceBinding?.sourceProfile,parameterExpressionSHA256:d.parameterExpressionSHA256??d.sourceBinding?.parameterExpressionSHA256,
      sourceDimension:2,displayDimension:2,physicalDimension:0,coordinateTypes:axisMetadata.map(x=>x.type),nonInjective:true,reconstructionAllowed:false,
      numericalCutoffFactorsEnclosed:kind==='ACTUAL_CUTOFF_MASS_INTERVALS',numericalSensitivityQuadrature:false,
      positiveWeightsOfExercisedMemberCertified:false,globalOriginalCriteriaComplete:false,fullSameProfileN5:false,
      globalPhysicalResidualCertified:false,flatErrorCertified:false,kernelProofVerifiedByThisView:false},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:rows.length},
    lostInformation:['구간과 판정은 각 행이 가리키는 원래 계산 범위에 적용됩니다. 전체 공분산·pulse 수치 도함수·물리 잔차의 완료 여부는 별도로 유지됩니다.',
      '표시 행을 줄여도 저장된 원본 결과는 보존됩니다. 첫 열의 항목 이름은 표시용이며 값 셀은 원본 경로에 연결됩니다.']};
}

export function actualCutoffMassPanels(job,options={}){
  const d=eligible(job,options,'ns.actual-cutoff-masses','MathScope.ActualCutoffMassEnclosure/1');
  if(!d?.values||!d.sigmaIntegral?.errorBudget||!d.sourceProgram||!d.bindingProgram||!d.scope)return [];
  const spec=[['정규화 횡방향 질량','values.normalizedTransverseMass'],['횡방향 질량','values.transverseMass'],
    ['정규화 종방향 제곱 질량','values.normalizedLongitudinalSquareMass'],['원래 pulse 길이 Ls','values.longitudinalSquareMass.scaleEnclosure'],
    ['전체 종방향 제곱 질량','values.longitudinalSquareMass.absoluteEnclosure']];
  const rows=spec.filter(([,path])=>at(d,path)?.lower!==undefined&&at(d,path)?.upper!==undefined).map(([name,path])=>({path:ROOT+'.'+path,
    cells:[[name,null],[at(d,path).lower,ROOT+'.'+path+'.lower'],[at(d,path).upper,ROOT+'.'+path+'.upper']]}));
  const make=(id,title,description,path,columns,rows)=>panel(d,id,title,description,path,columns,rows,options,'ACTUAL_CUTOFF_MASS_INTERVALS');
  return [
    make('cutoff-mass-values','원래 cutoff 적분 · 엄밀한 수치 구간','원래 χ와 ψ의 적분 인자, 양수 h를 유지한 pulse 길이, 전체 종방향 질량을 정확한 유리수 구간으로 표시합니다.','values',['계산량','하한','상한'],rows),
    make('cutoff-mass-errors','cutoff 적분 · 구적과 반올림 오차','요청한 허용오차는 정규화 σ² 적분의 구간 폭에 적용됩니다. Taylor 잔여항, 끝점과 반올림 기여를 원본대로 확인합니다.','sigmaIntegral.errorBudget',['오차 항목','원본 값'],propertyRows(d,'sigmaIntegral.errorBudget')),
    make('cutoff-mass-scope','cutoff 수치 계산 · 완료 범위','두 cutoff 인자의 구간과 고정 label에서의 미분을 계산했습니다. 전체 H, 가중치, pulse 도함수, curl의 수치 구간에는 각각 추가 검증이 필요합니다.','scope',['항목','원본 상태'],propertyRows(d,'scope'))
  ];
}

export function actualBandAdmissibilityPanels(job,options={}){
  const d=eligible(job,options,'ns.actual-band-admissibility','MathScope.ActualCovarianceBandAdmissibilityCertificate/1');
  if(!d?.decision||!d.proof||!d.graph||!d.sourceBinding)return [];
  const make=(id,title,description,path)=>panel(d,id,title,description,path,['항목','원본 판정 또는 근거'],propertyRows(d,path),options,'ACTUAL_SOURCE_BAND_ADMISSIBILITY');
  return [
    make('band-admissibility-decision','표시 band · 양성 정리 적용 범위','실제 소스의 ell_min과 q_*를 비교한 판정입니다. 적용 범위 밖이라는 결론과 행렬식·가중치의 부호를 구별합니다.','decision'),
    make('band-admissibility-proof','band 판정 · 양수 h와 원래 cutoff 근거','h를 0으로 놓지 않고, 원래 임계값과 c₁의 하한으로 판정합니다. 다른 band의 source 그래프를 모두 실행했다는 뜻은 아닙니다.','proof')
  ];
}

export function actualContinuationPanels(job,options={}){
  if(job?.request?.kind==='ns.actual-cutoff-masses')return actualCutoffMassPanels(job,options);
  if(job?.request?.kind==='ns.actual-band-admissibility')return actualBandAdmissibilityPanels(job,options);
  return [];
}
