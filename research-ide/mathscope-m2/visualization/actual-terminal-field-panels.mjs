/** Read-only exact tables for the ORIGINAL complete terminal F and its jets.
 * A displayed certificate is source data, never a new private source token.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {scalarText,sampleIndices} from './observations.mjs';

const ROOT='result.results',KIND='ns.actual-terminal-field-scaled-enclosure';
const IDS=['F','R','Z','T','RR','RZ','RT','ZZ','ZT','TT'];
const read=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);

function panel(data,id,title,description,path,columns,rows,options){
  const maximum=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):200,
    selected=sampleIndices(rows.length,maximum),table={title,columns,rows:selected.map(i=>rows[i].cells.map(cell=>cell[0])),
      sourcePaths:selected.map(i=>rows[i].path),cellSourcePaths:selected.map(i=>rows[i].cells.map(cell=>cell[1])),
      totalRows:rows.length,truncated:selected.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',
      exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}},
    axisMetadata=[
      {label:'F 도함수 또는 오차 항목',type:'CATEGORICAL_SOURCE_FIELD',unit:'1',scale:'linear',transform:'stored source row order',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path},
      {label:'정확한 구간·양의 인자·상태',type:'SOURCE_INTERVAL_OR_BOUND',unit:'1',scale:'linear',transform:'exact source values to text',physicalDimension:0,dataDimension:1,sourceField:ROOT+'.'+path}
    ],
    details=['request','sourceBinding','graph','numerics.bounds','numerics.errorBudget','numerics.arithmetic',
      'numerics.step.proof','numerics.heatMoments.errorBudget','proof.witness','proof.exactField','proof.derivativeFormulas'];
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata,color:null,table,relatedTables:[],
    details:details.filter(key=>read(data,key)!==undefined).map(key=>({title:key,value:read(data,key),sourcePath:ROOT+'.'+key})),
    chart:{kind:'COMPARISON_TABLE',columns,rows:table.rows.map(row=>row.map(scalarText)),sourcePaths:table.sourcePaths,cellSourcePaths:table.cellSourcePaths,displayTransform:'EXACT_SOURCE_VALUES_TO_TEXT'},
    scene:{points:[],lines:[],arrows:[],axes:[]},
    observation:{kind:'ACTUAL_PARAMETER_SCALED_TERMINAL_FIELD_JET_INTERVALS',sourceProfileId:data.sourceBinding.sourceProfile,
      parameterExpressionSHA256:data.sourceBinding.parameterExpressionSHA256,sourceDimension:3,displayDimension:2,physicalDimension:0,
      coordinateTypes:axisMetadata.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,
      numericalCompleteTerminalFAndNineSlowJetsEnclosed:true,originalPositiveHRetained:true,originalPositiveAmplitudeRetained:true,
      rawAbsoluteRationalEnclosures:true,rawRelativePrecisionClaimed:false,wholeDomainFNumericallyEnclosed:false,
      wholePulseNumericalDerivativesEnclosed:false,wholeCovarianceNumericallyEnclosed:false,
      positiveWeightsOfExercisedMemberCertified:false,globalPhysicalResidualCertified:false,flatErrorCertified:false,
      wholeM2Complete:false,m3MayStart:false,kernelProofVerifiedByThisView:false},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:rows.length},
    lostInformation:['원래 완성된 F의 지정점 X=Xb·exp(-1/4), η=0, s=1에서 계산한 값과 R/Z/T 미분입니다. 원래 step·heat·slow 배율을 모두 포함합니다.',
      '0이 아닌 각 값은 표시된 계수와 정확한 양의 인자의 곱입니다. Z·RZ·ZT 행의 인자 0은 지정점의 정확한 영 도함수를 표시합니다. B와 h를 0 또는 1로 치환하지 않습니다. 비영 행의 절대 구간 끝점 0은 경계이며, 원래 값이 0이라는 뜻이 아닙니다.',
      'Z·RZ·ZT는 지정점의 정확한 0입니다. ZZ는 원래 implicit chart의 곡률을 포함합니다. 전체 정의역과 pulse·공분산·가중치의 수치 구간은 이 표의 범위 밖입니다.',
      '행 수를 줄여도 전체 JSON의 정확한 값은 보존됩니다. source path가 없는 항목명은 표시용입니다.']};
}

export function actualTerminalFieldPanels(job,options={}){
  if(job?.request?.kind!==KIND||options.currentEditorMatches===false)return [];
  if(options.currentRequest!==undefined){try{if(canonicalStringify(options.currentRequest)!==canonicalStringify(job.request))return [];}catch{return [];}}
  const data=job?.result?.results,n=data?.numerics;
  if(job.status!=='COMPLETED'||job.result?.status!=='COMPLETED'||data?.status!=='COMPLETED'||
    data?.schema!=='MathScope.ActualTerminalFieldScaledEnclosureCertificate/1'||data.pass!==true||
    !Array.isArray(data.checks)||!data.checks.length||!data.checks.every(c=>c.pass===true)||!data.sourceBinding||!data.graph||
    data.scope?.actualCompleteTerminalFAndNineSlowJetsBound!==true||data.scope?.exactOriginalPositiveAmplitudeRetained!==true||data.scope?.m3MayStart!==false||
    n?.schema!=='MathScope.ActualTerminalFieldScaledJetNumerics/1'||!Array.isArray(n.rows)||n.rows.length!==IDS.length||
    n.errorBudget?.eachCompleteCoefficientWidthChecked!==true||n.errorBudget?.allArithmeticAndElementaryTailsIncluded!==true||n.errorBudget?.originalPositiveFactorsRetained!==true||
    n.arithmetic?.kind!=='DIRECTED_BIGINT_DYADIC_INTERVAL'||n.arithmetic.binary64UsedForDecisions!==false||
    n.heatMoments?.pass!==true||!n.heatMoments.coefficients||!n.step?.proof)return [];
  if(n.rows.some((row,i)=>row.id!==IDS[i]||!row.coefficient||typeof row.coefficient.lower!=='string'||typeof row.coefficient.upper!=='string'||
    typeof row.coefficientWidth!=='string'||typeof row.exactPositiveFactor!=='string'||row.sourceFactorSetToZero!==false||
    !['POSITIVE','NEGATIVE','ZERO'].includes(row.sign)||!(row.factorStrictUpperPowerOfTwo===null||Number.isSafeInteger(row.factorStrictUpperPowerOfTwo))||
    typeof row.rawAbsoluteEnclosure?.lower!=='string'||typeof row.rawAbsoluteEnclosure?.upper!=='string'))return [];
  const fieldRows=fields=>n.rows.map((row,i)=>({path:ROOT+'.numerics.rows.'+i,
    cells:fields.map(field=>[read(row,field),ROOT+'.numerics.rows.'+i+'.'+field])})),
    errorFields=[
      ['F·도함수 각각의 계수 허용 폭','numerics.errorBudget.tolerance'],
      ['heat 계수 허용 폭 · F 허용 폭 / 2²⁰','numerics.errorBudget.heatCoefficientTolerance'],
      ['heat moment 허용 폭 · heat 허용 폭 / 64','numerics.heatMoments.request.tolerance'],
      ['외향 산술 정밀도 · bits','numerics.arithmetic.bits'],
      ['step 지수함수 · Taylor 차수','numerics.step.proof.taylorDegree'],
      ['step 지수함수 · 축소한 양의 입력','numerics.step.proof.reducedArgument'],
      ['step 지수함수 · 양의 Taylor 잔여항 상한','numerics.step.proof.positiveTaylorRemainderUpper'],
      ['heat moment · 유한 항수','numerics.heatMoments.terms']
    ];
  for(const id of ['D0','D1','D2']){
    const row=n.heatMoments.coefficients[id];if(row?.id!==id||row.pass!==true)return [];
    for(const [label,key]of [['잔여항 절댓값 상한','remainderAbsoluteUpper'],['산술·입력 구간 폭','arithmeticAndParameterWidth'],['전체 구간 폭','totalWidth']]){
      if(typeof row[key]!=='string')return [];
      errorFields.push([id+' · '+label,'numerics.heatMoments.coefficients.'+id+'.'+key]);
    }
  }
  if(errorFields.some(([,path])=>!['string','number'].includes(typeof read(data,path))))return [];
  const errorRows=errorFields.map(([label,path])=>({path:ROOT+'.'+path,cells:[[label,null],[read(data,path),ROOT+'.'+path]]})),
    scopeRows=Object.entries(data.scope).map(([name,value])=>({path:ROOT+'.scope.'+name,cells:[[name,null],[value,ROOT+'.scope.'+name]]})),
    make=(id,title,description,path,columns,rows)=>panel(data,id,title,description,path,columns,rows,options);
  return [
    make('terminal-field-coefficient-intervals','terminal F · 전체 계수의 엄밀 구간',
      '완성된 F와 아홉 slow 도함수의 계수입니다. 각 행의 실제 값은 다음 표에 있는 원래 인자와 이 계수의 곱입니다.',
      'numerics.rows',['성분','계수 하한','계수 상한','계수 구간 폭'],fieldRows(['id','coefficient.lower','coefficient.upper','coefficientWidth'])),
    make('terminal-field-positive-scales','terminal F · 양의 인자와 원래 값의 구간',
      '상한 지수 k는 원래 양의 인자가 2ᵏ보다 작다는 뜻입니다. 비영 행에서 원래 값의 구간 끝점 0은 엄밀한 경계이며, 원래 인자와 값은 보존됩니다.',
      'numerics.rows',['성분','원래 인자','엄격한 2의 거듭제곱 상한','부호','원래 값 하한','원래 값 상한'],
      fieldRows(['id','exactPositiveFactor','factorStrictUpperPowerOfTwo','sign','rawAbsoluteEnclosure.lower','rawAbsoluteEnclosure.upper'])),
    make('terminal-field-error-budget','terminal F · 오차와 정밀도',
      '전체 계수 허용 폭은 2^{−(bits−48)} 이상이어야 합니다. heat에는 그 허용 폭의 2⁻²⁰을 배정합니다. step의 Taylor 상한은 축소 입력에 적용되며, 이후 제곱과 역수는 외향 반올림합니다. heat의 전체 적분 잔여항과 산술·입력 구간 오차도 보존합니다.',
      'numerics',['오차·정밀도 항목','원본 값'],errorRows),
    make('terminal-field-completion-scope','terminal F · 검증 범위',
      '원래 완성된 F의 지정점 값과 1차·2차 도함수 구간입니다. 전체 정의역, pulse·공분산·가중치의 수치 계산 및 M2 전체 완료 상태는 이 결과로 확대하지 않습니다.',
      'scope',['항목','원본 상태'],scopeRows)
  ];
}
