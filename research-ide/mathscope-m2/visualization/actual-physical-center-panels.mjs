/** Source-linked tables for fresh directed arithmetic using a pinned,
 * separately executed original physical-source certificate. A view never
 * creates a private source token or proves a new mathematical statement.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {scalarText,sampleIndices} from './observations.mjs';

const KIND='ns.actual-physical-center-certified-numerics',ROOT='result.results',
  read=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
const titles={weighted:'가중 pulse · slow·fast·혼합 도함수',raw:'원래 pulse와 두 진폭 · slow 도함수',
  covariance:'공분산 H와 역가중치 y · 도함수',physical:'전체 curl · 물리 도함수와 Hessian'};
function makePanel(data,{id,title,description,columns,rows,sourcePath,details=[],numericalValueOrigin='FRESH_NUMERICAL_RECOMPUTATION'},options){
  const max=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):300,
    selected=sampleIndices(rows.length,max),table={title,columns,rows:selected.map(i=>rows[i].cells.map(c=>c.value)),
      sourcePaths:selected.map(i=>rows[i].path),cellSourcePaths:selected.map(i=>rows[i].cells.map(c=>c.source)),totalRows:rows.length,
      truncated:selected.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',exactValuesUnabridged:true,
      cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}},
    axisMetadata=[{label:'원래 물리점의 계산량',type:'CATEGORICAL_SOURCE_FIELD',unit:'1',scale:'linear',transform:'stored source row order',
      physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+sourcePath},
      {label:'외향 수치 구간과 양의 배율',type:'SOURCE_INTERVAL_OR_BOUND',unit:'1',scale:'linear',transform:'exact source values to text',
        physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+sourcePath}];
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata,color:null,table,relatedTables:[],
    details:[...details,'request','sourceBinding','sourceEvidence','scope'].filter(key=>read(data,key)!==undefined)
      .map(key=>({title:key,value:read(data,key),sourcePath:ROOT+'.'+key})),
    chart:{kind:'COMPARISON_TABLE',columns,rows:table.rows.map(row=>row.map(scalarText)),sourcePaths:table.sourcePaths,cellSourcePaths:table.cellSourcePaths,
      displayTransform:'EXACT_SOURCE_VALUES_TO_TEXT'},scene:{points:[],lines:[],arrows:[],axes:[]},
    observation:{kind:'ACTUAL_PHYSICAL_CENTER_FRESH_CERTIFIED_COEFFICIENT_TABLES',sourceProfileId:data.sourceBinding.sourceProfile,
      parameterExpressionSHA256:data.sourceBinding.parameterExpressionSHA256,sourceDimension:4,displayDimension:2,physicalDimension:0,
      coordinateTypes:axisMetadata.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,
      originalSourceEvidence:'PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE',numericalValueOrigin,
      freshNumericalRecomputation:['FRESH_NUMERICAL_RECOMPUTATION','FRESH_INTERVAL_PRODUCTS_WITH_PINNED_SCALES'].includes(numericalValueOrigin),
      runtimeReconstructedFullSourceGraph:false,originalPositiveHRetained:true,originalPositiveScalesRetained:true,
      sourceDerivativeRows:270,angularVectorAndDirectionConnectionsRetained:true,
      rawUnscaledRelativeAccuracyClaimed:false,allLabelsNumericallyCovered:false,kernelProofVerifiedByThisView:false},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:rows.length},
    lostInformation:['각 도함수는 동일한 원래 허용 band의 새 물리점에서 계산합니다. 화면의 수치 계수에 각 행의 원래 양의 배율을 곱하면 해당 정규화 규칙의 실제 도함수입니다.',
      '원래 R/Z/T 미분을 먼저 한 뒤 R 방향에 고정한 R# 배율을 적용합니다. 물리 Hessian은 원통 기저의 회전과 각도 방향 자체의 회전항도 포함합니다.',
      '원본 전체 식의 별도 실행 기록과 현재 Worker의 수치 구간 재계산을 구분합니다. 현재 화면을 만들 때 전체 원본 graph를 다시 구성했다고 표시하지 않습니다.',
      '같은 band의 모든 label 또는 전역 잔차를 수치 표본으로 계산한 결과는 아닙니다. 계수의 구간 폭과 원래 값의 상대오차는 서로 다른 정확도 기준입니다.',
      '행 수를 줄여도 전체 결과 JSON은 보존됩니다. 항목명처럼 원본 경로가 없는 셀은 표시용입니다.']};
}

export function actualPhysicalCenterPanels(job,options={}){
  if(job?.request?.kind!==KIND||options.currentEditorMatches===false)return [];
  if(options.currentRequest!==undefined){try{if(canonicalStringify(options.currentRequest)!==canonicalStringify(job.request))return [];}catch{return [];}}
  const data=job?.result?.results,n=data?.numerics;
  if(job.status!=='COMPLETED'||job.result?.status!=='COMPLETED'||data?.status!=='COMPLETED'||
    data?.schema!=='MathScope.InstalledPhysicalCenterNumericalCertificate/1'||data.pass!==true||
    !data.sourceBinding||!data.sourceEvidence||!data.graph||!Array.isArray(data.checks)||!data.checks.length||data.checks.some(c=>c.pass!==true)||
    data.sourceEvidence.authentication!=='PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE'||data.scope?.runtimeReconstructedFullSourceGraph!==false||
    data.scope?.freshNumericalRecomputation!==true||!Array.isArray(n?.rows)||n.rows.length!==270||n.pass!==true)return [];
  if(n.rows.some(r=>typeof r.rowKey!=='string'||typeof r.quantity!=='string'||typeof r.derivative!=='string'||!Number.isInteger(r.component)||
    typeof r.directedInterval?.lower!=='string'||typeof r.directedInterval?.upper!=='string'||typeof r.width!=='string'||
    typeof r.scaleDescription!=='string'||typeof r.positiveErrorRadius!=='string'||r.toleranceMet!==true)||new Set(n.rows.map(r=>r.rowKey)).size!==270)return [];
  const cell=(value,source)=>({value,source}),at=(path,value)=>cell(value,ROOT+'.'+path),
    groups={weighted:r=>r.quantity==='weightedPulse',raw:r=>['pulse','a','wMinus'].includes(r.quantity),
      covariance:r=>['H','y'].includes(r.quantity),physical:r=>r.quantity==='physicalCurl'},
    counts={weighted:84,raw:90,covariance:54,physical:42},panels=[];
  for(const [group,predicate]of Object.entries(groups)){
    const rows=n.rows.flatMap((row,i)=>{
      if(!predicate(row))return [];
      const path='numerics.rows.'+i;
      return [{path:ROOT+'.'+path,cells:[at(path+'.rowKey',row.rowKey),at(path+'.directedInterval.lower',row.directedInterval.lower),
        at(path+'.directedInterval.upper',row.directedInterval.upper),at(path+'.width',row.width),
        at(path+'.scaleDescription',row.scaleDescription),at(path+'.positiveErrorRadius',row.positiveErrorRadius)]}];
    });
    if(rows.length!==counts[group])return [];
    panels.push(makePanel(data,{id:'physical-center-'+group,title:titles[group],sourcePath:'numerics.rows',
      description:group==='physical'?'r·z·t·θ 방향의 1차 12개와 대칭 2차 30개입니다. θ가 섞인 2차 미분에는 벡터 기저와 방향 기저의 보정항을 모두 포함합니다.':
        '원래 공분산 역원·양의 제곱근·움직이는 진폭을 함께 미분한 결과입니다. 비교식에서 0인 항도 실제 도함수는 양의 오차를 포함한 구간으로 표시합니다.',
      columns:['원본 도함수','계수 하한','계수 상한','계수 구간 폭','원래 양의 배율','해석학적 오차 반경'],rows},options));
  }
  if(Array.isArray(data.positiveScaleNumerics?.rows)&&data.positiveScaleNumerics.rows.length){
    const rows=data.positiveScaleNumerics.rows.map((row,i)=>{const path='positiveScaleNumerics.rows.'+i;
      return {path:ROOT+'.'+path,cells:['name','interval.lower','interval.upper','interval.coordinateDefinition','logCoordinateInterval.lower','logCoordinateInterval.upper','logCoordinateWidth'].map(key=>at(path+'.'+key,read(row,key)))};});
    if(rows.every(r=>r.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{id:'physical-center-positive-scales',
      title:'원래 양의 배율 · 닫힌 수치 구간',sourcePath:'positiveScaleNumerics.rows',
      description:'매우 크거나 작은 원래 인자를 exp가 중첩된 닫힌 수치 끝점으로 표시합니다. 폭은 명시된 반복 로그 좌표의 폭이며 원래 값의 상대오차가 아닙니다.',
      columns:['양의 인자','원래 값 하한','원래 값 상한','폭을 재는 로그 좌표','좌표 하한','좌표 상한','좌표 폭'],rows},options));
  }
  const storedScales=data.positiveSelectorScaleEvidence;
  if(storedScales?.pass===true&&Array.isArray(storedScales.rows)&&Array.isArray(storedScales.absoluteValues)){
    const precise=storedScales.rows.flatMap((row,i)=>{
      if(row.name.startsWith('finiteDerivativeScale_')||row.name.startsWith('absolute_')||row.individualPrecisionMet!==true)return [];
      const path='positiveSelectorScaleEvidence.rows.'+i;
      return [{path:ROOT+'.'+path,cells:['name','interval.lower','interval.upper','coordinateDefinition','coordinate.lower','coordinate.upper','logCoordinateWidth']
        .map(key=>at(path+'.'+key,read(row,key)))}];
    });
    if(precise.length&&precise.every(row=>row.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{
      id:'physical-center-selector-scales',title:'원래 band·palette·물리 배율',sourcePath:'positiveSelectorScaleEvidence.rows',
      numericalValueOrigin:'PINNED_EXECUTED_SOURCE_VALUES',
      description:'같은 원본 실행에서 검증해 고정한 선택식과 기하 배율의 구간입니다. 반복 로그 좌표와 그 폭을 함께 표시하며, 원래 cutoff 선택식을 변경하지 않습니다.',
      columns:['원래 인자','하한','상한','폭을 재는 좌표','좌표 하한','좌표 상한','좌표 폭'],rows:precise},options));
    const coarse=storedScales.rows.flatMap((row,i)=>{
      if(row.individualPrecisionMet!==false)return [];
      const path='positiveSelectorScaleEvidence.rows.'+i;
      return [{path:ROOT+'.'+path,cells:['name','interval.lower','interval.upper','coarseReason','individualPrecisionMet']
        .map(key=>at(path+'.'+key,read(row,key)))}];
    });
    if(coarse.length&&coarse.every(row=>row.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{
      id:'physical-center-coarse-point-factors',title:'물리점의 보조 인자 · 보장 범위',sourcePath:'positiveSelectorScaleEvidence.rows',
      numericalValueOrigin:'PINNED_EXECUTED_SOURCE_VALUES',
      description:'T와 slow cutoff는 아래 양의 구간으로 보장됩니다. 각 인자 자체가 요청한 정밀도를 만족한다는 표시는 하지 않으며, 최종 물리 배율의 별도 좌표 폭을 검사합니다.',
      columns:['보조 인자','하한','상한','이 구간의 의미','개별 요청 정밀도 충족'],rows:coarse},options));
    const absolute=storedScales.absoluteValues.map((row,i)=>{
      const path='positiveSelectorScaleEvidence.absoluteValues.'+i;
      return {path:ROOT+'.'+path,cells:['name','interval.lower','interval.upper','coordinateOf','coordinateDefinition','logCoordinateWidth']
        .map(key=>at(path+'.'+key,read(row,key)))};
    });
    if(absolute.length&&absolute.every(row=>row.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{
      id:'physical-center-absolute-values',title:'공분산·가중치·pulse의 실제 값 구간',sourcePath:'positiveSelectorScaleEvidence.absoluteValues',
      numericalValueOrigin:'PINNED_EXECUTED_SOURCE_VALUES',
      description:'동일한 원래 물리점의 원본 실행에서 검증해 고정한 전체 H, 역가중치, 제곱근 가중치와 pulse 값입니다. 음수 값은 원래 부호를 보존하고, 폭을 재는 절댓값 좌표를 명시합니다.',
      columns:['실제 계산량','하한','상한','좌표의 대상','폭을 재는 좌표','좌표 폭'],rows:absolute},options));
  }
  if(data.unscaledDerivatives?.pass===true&&Array.isArray(data.unscaledDerivatives.rows)&&data.unscaledDerivatives.rows.length===270){
    const rows=data.unscaledDerivatives.rows.map((row,i)=>{
      const path='unscaledDerivatives.rows.'+i;
      return {path:ROOT+'.'+path,cells:['rowKey','derivativeInterpretation','normalizedRadialPower','rawDerivativeInterval.lower','rawDerivativeInterval.upper','positiveScaleInterval.lower','positiveScaleInterval.upper']
        .map(key=>at(path+'.'+key,read(row,key)))};
    });
    if(rows.every(row=>row.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{
      id:'physical-center-unscaled-derivatives',title:'270개 원본 도함수 · 배율을 적용한 구간',sourcePath:'unscaledDerivatives.rows',
      numericalValueOrigin:'FRESH_INTERVAL_PRODUCTS_WITH_PINNED_SCALES',
      description:'이번 계수 구간과 검증된 양의 배율 구간을 외향 곱셈합니다. Pulse의 R 포함 행은 원래 규칙의 R# 거듭제곱을 유지한 정규화 미분이며, 전체 curl 행은 실제 물리 미분입니다. 각 행의 의미와 R# 지수를 표시하고 0을 가로지르는 부호 불확실성도 보존합니다.',
      columns:['원본 도함수','원본 미분의 의미','남아 있는 R# 지수','도함수 하한','도함수 상한','양의 배율 하한','양의 배율 상한'],rows,details:['unscaledDerivatives.checks']},options));
  }
  if(data.coupledModeValues?.pass===true&&Array.isArray(data.coupledModeValues.rows)&&data.coupledModeValues.rows.length===4){
    const rows=data.coupledModeValues.rows.map((row,i)=>{
      const path='coupledModeValues.rows.'+i;
      return {path:ROOT+'.'+path,cells:['rowKey','sourceRoot','directedInterval.lower','directedInterval.upper','width','normalization']
        .map(key=>at(path+'.'+key,read(row,key)))};
    });
    if(rows.every(row=>row.cells.every(c=>c.value!==undefined)))panels.push(makePanel(data,{
      id:'physical-center-coupled-mode-values',title:'두 진폭의 원래 값 · 양·음 부호 가족',sourcePath:'coupledModeValues.rows',
      description:'새 물리점의 slow 좌표·대표점에서 각 원래 결합계를 v=Ls/2로 평가한 wPlus와 wMinus 값입니다. 선택한 물리점에서는 양의 가족 rectangle이 활성화되며, 음의 가족의 합성 fast 좌표가 그 중앙이라고 주장하지 않습니다. wMinus는 원본의 양의 경계 2^(-97793)를 외향 반올림합니다. Ac·u·R# 인자가 없는 원래 값이며 정확한 0이라고 표시하지 않습니다.',
      columns:['원래 진폭 값','원본 식 ID','값 하한','값 상한','절대 구간 폭','정규화'],rows,details:['negativeModeValues.proof','sourceEvidence.negativeModeValuePremises']},options));
  }
  const scopeRows=Object.entries(data.scope).map(([key,value])=>({path:ROOT+'.scope.'+key,cells:[cell(key,null),at('scope.'+key,value)]}));
  panels.push(makePanel(data,{id:'physical-center-evidence',title:'원본 검증과 이번 수치 실행',sourcePath:'scope',
    numericalValueOrigin:'SOURCE_AND_CURRENT_RUN_EVIDENCE',
    description:'별도로 실행해 고정한 원본 증거와 이번에 다시 계산한 수치 구간의 범위를 함께 표시합니다. 저장한 파일의 결과를 현재의 새 원본 실행으로 세지 않습니다.',
    columns:['검증 항목','원본 상태'],rows:scopeRows,details:['sourceEvidence','numerics.checks']},options));
  return panels;
}
