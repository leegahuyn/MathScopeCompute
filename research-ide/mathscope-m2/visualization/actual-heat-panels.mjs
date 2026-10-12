/** Read-only views of the original parameter-scaled heat enclosure. */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {scalarText,sampleIndices} from './observations.mjs';

const ROOT='result.results',KIND='ns.actual-heat-scaled-enclosure';
const read=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
function propertyRows(data,path){
  return Object.entries(read(data,path)||{}).map(([name,value])=>({path:ROOT+'.'+path+'.'+name,cells:[[name,null],[value,ROOT+'.'+path+'.'+name]]}));
}
function panel(data,id,title,description,path,columns,rows,options){
  const maximum=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):200;
  const selected=sampleIndices(rows.length,maximum),table={title,columns,rows:selected.map(i=>rows[i].cells.map(cell=>cell[0])),
    sourcePaths:selected.map(i=>rows[i].path),cellSourcePaths:selected.map(i=>rows[i].cells.map(cell=>cell[1])),
    totalRows:rows.length,truncated:selected.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',
    exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
  const axisMetadata=[
    {label:'heat 도함수 또는 오차 항목',type:'CATEGORICAL_SOURCE_FIELD',unit:'1',scale:'linear',transform:'stored source row order',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path},
    {label:'정확한 구간·인자·상태',type:'SOURCE_INTERVAL_OR_BOUND',unit:'1',scale:'linear',transform:'exact source values to text',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path}
  ];
  const detailKeys=['request','sourceBinding','graph','numerics.bounds','numerics.heatFactorEnclosure','numerics.errorBudget','numerics.moments.errorBudget'];
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata,color:null,table,relatedTables:[],
    details:detailKeys.filter(key=>read(data,key)!==undefined).map(key=>({title:key,value:read(data,key),sourcePath:ROOT+'.'+key})),
    chart:{kind:'COMPARISON_TABLE',columns,rows:table.rows.map(row=>row.map(scalarText)),sourcePaths:table.sourcePaths,cellSourcePaths:table.cellSourcePaths,displayTransform:'EXACT_SOURCE_VALUES_TO_TEXT'},
    scene:{points:[],lines:[],arrows:[],axes:[]},
    observation:{kind:'ACTUAL_PARAMETER_SCALED_HEAT_JET_INTERVALS',sourceProfileId:data.sourceBinding.sourceProfile,parameterExpressionSHA256:data.sourceBinding.parameterExpressionSHA256,
      sourceDimension:2,displayDimension:2,physicalDimension:0,coordinateTypes:axisMetadata.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,
      numericalHeatFactorAndNineSlowJetsEnclosed:true,originalPositiveHRetained:true,rawRelativePrecisionClaimed:false,
      numericalSensitivityQuadrature:false,wholePulseNumericalDerivativesEnclosed:false,wholeCovarianceNumericallyEnclosed:false,
      positiveWeightsOfExercisedMemberCertified:false,globalOriginalCriteriaComplete:false,fullSameProfileN5:false,
      globalPhysicalResidualCertified:false,flatErrorCertified:false,kernelProofVerifiedByThisView:false},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:rows.length},
    lostInformation:['이 결과의 H는 스칼라 heat 인자입니다. 공분산 행렬 H와 구별합니다. 지정점은 X=Xb·exp(-1/4), η=0, s=1입니다.',
      '도함수는 정규화 계수와 원래 양의 인자의 곱입니다. h·heat 입력·원래 인자는 정확한 식으로 보존되며, 전체 pulse·가중치·curl의 수치 인증은 별도입니다.',
      '행 수를 줄여도 전체 JSON의 정확한 구간과 원본 식은 보존됩니다. source path가 없는 항목명은 표시용입니다.']};
}

export function actualHeatPanels(job,options={}){
  if(job?.request?.kind!==KIND||options.currentEditorMatches===false)return [];
  if(options.currentRequest!==undefined){try{if(canonicalStringify(options.currentRequest)!==canonicalStringify(job.request))return [];}catch{return [];}}
  const data=job?.result?.results;
  if(job.status!=='COMPLETED'||job.result?.status!=='COMPLETED'||data?.schema!=='MathScope.ActualHeatScaledEnclosureCertificate/1'||data.pass!==true||!Array.isArray(data.checks)||!data.checks.every(c=>c.pass)||!data.sourceBinding||!data.graph||!data.scope||!data.numerics?.errorBudget||!data.numerics?.moments?.coefficients||!Array.isArray(data.numerics.rows)||data.numerics.rows.length!==10)return [];
  if(data.numerics.rows.some(row=>!row.coefficient||typeof row.coefficient.lower!=='string'||typeof row.coefficient.upper!=='string'||typeof row.coefficientWidth!=='string'||typeof row.exactPositiveFactor!=='string'))return [];
  const rows=fields=>data.numerics.rows.map((row,i)=>({path:ROOT+'.numerics.rows.'+i,
    cells:fields.map(field=>[read(row,field),ROOT+'.numerics.rows.'+i+'.'+field])}));
  const errorRows=['D0','D1','D2'].map(id=>{
    const path='numerics.moments.coefficients.'+id,row=read(data,path);
    if(!row||row.pass!==true||typeof row.remainderAbsoluteUpper!=='string'||typeof row.arithmeticAndParameterWidth!=='string'||typeof row.totalWidth!=='string')return null;
    return {path:ROOT+'.'+path,cells:[[row.id,ROOT+'.'+path+'.id'],[data.numerics.moments.terms,ROOT+'.numerics.moments.terms'],
      [row.remainderAbsoluteUpper,ROOT+'.'+path+'.remainderAbsoluteUpper'],[row.arithmeticAndParameterWidth,ROOT+'.'+path+'.arithmeticAndParameterWidth'],[row.totalWidth,ROOT+'.'+path+'.totalWidth']]};
  });
  if(errorRows.some(row=>row===null))return [];
  const make=(id,title,description,path,columns,rows)=>panel(data,id,title,description,path,columns,rows,options);
  return [
    make('heat-coefficient-intervals','heat · 정규화 계수의 엄밀 구간','loss는 1−H를 뜻합니다. 각 도함수는 이 계수와 다음 패널의 양의 인자를 곱한 값입니다. 0인 Z 계열은 정확한 0입니다.','numerics.rows',['성분','계수 하한','계수 상한','구간 폭'],rows(['id','coefficient.lower','coefficient.upper','coefficientWidth'])),
    make('heat-positive-scales','heat · 원래 양의 인자와 부호','h를 0으로 바꾸지 않습니다. 예를 들어 상한 지수가 −6655이면 원래 양의 인자는 2⁻⁶⁶⁵⁵보다 작습니다. ZERO 행에는 비영 인자가 없습니다.','numerics.rows',['성분','원래 인자','엄격한 2의 거듭제곱 상한','부호'],rows(['id','exactPositiveFactor','factorStrictUpperPowerOfTwo','sign'])),
    make('heat-error-budget','heat · 유한 잔여항과 산술 오차','유한 Taylor 잔여항은 전체 Gamma 적분을 포함합니다. 산술 열에는 외향 반올림과 입력 구간 변화가 함께 들어 있습니다. 허용 폭은 정규화 계수마다 적용됩니다.','numerics.moments.coefficients',['계수','유한 항수','잔여항 절댓값 상한','산술·입력 구간 폭','전체 구간 폭'],errorRows),
    make('heat-completion-scope','heat · 완료 범위','원래 heat 인자의 지정점 수치 구간입니다. 전체 leading F, pulse, 공분산, 가중치와 curl의 수치 구간 및 전역 잔차는 후속 범위입니다.','scope',['항목','원본 상태'],propertyRows(data,'scope'))
  ];
}
