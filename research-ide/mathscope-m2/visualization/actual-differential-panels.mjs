/** Read-only exact-expression tables for source covariance, slow jets and curl.
 * Expression roots are identifiers. This adapter never evaluates them as values
 * or places them on numerical or physical axes.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {sampleIndices,scalarText} from './observations.mjs';

const ROOT='result.results';
const readable=new Set(['COMPLETED','PARTIAL']);
const owns=(value,key)=>value!==null&&typeof value==='object'&&Object.hasOwn(value,key);

function eligible(job,options,kind,schema,arrays){
  if(options.currentEditorMatches===false||job?.request?.kind!==kind)return null;
  if(options.currentRequest!==undefined){
    try{if(canonicalStringify(options.currentRequest)!==canonicalStringify(job.request))return null;}catch{return null;}
  }
  const d=job?.result?.results;
  if(!readable.has(job.status)||!readable.has(job.result.status)||d?.schema!==schema||d.pass!==true)return null;
  if(d.status!==undefined&&!readable.has(d.status))return null;
  if(!d.scope||!d.domain||!d.graph||arrays.some(key=>!Array.isArray(d[key])))return null;
  return d;
}

function records(values,key,fields){
  return values.map((value,i)=>{
    const path=ROOT+'.'+key+'['+i+']';
    return {path,cells:fields.map(field=>owns(value,field)?[value[field],path+'.'+field]:[null,null])};
  });
}
function properties(value,key){
  return Object.entries(value||{}).map(([field,item])=>{
    const path=ROOT+'.'+key+'.'+field;
    return {path,cells:[[field,null],[item,path]]};
  });
}
function table(title,columns,rows,options){
  const count=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):200;
  const selected=sampleIndices(rows.length,count);
  return {title,columns,rows:selected.map(i=>rows[i].cells.map(cell=>cell[0])),
    sourcePaths:selected.map(i=>rows[i].path),cellSourcePaths:selected.map(i=>rows[i].cells.map(cell=>cell[1])),
    totalRows:rows.length,truncated:selected.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',
    exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
}
const propertyTable=(title,d,key,options)=>table(title,['항목','원본 값 또는 조건'],properties(d[key],key),options);
const sourceRows=(title,d,key,columns,fields,options)=>table(title,columns,records(d[key],key,fields),options);

function panel(id,title,description,key,t,d,kind,relatedTables=[],extra={}){
  const sourceField=ROOT+'.'+key;
  const axes=[
    {label:'원본 항목',type:'CATEGORICAL_SOURCE_FIELD',sourceField,unit:'1',scale:'linear',transform:'stored row order',dataDimension:1,physicalDimension:0},
    {label:'정확한 source 식과 조건',type:'EXACT_SOURCE_EXPRESSION',sourceField,unit:'1',scale:'linear',transform:'expression text; no numerical evaluation',dataDimension:1,physicalDimension:0}
  ];
  const details=[['재구성 가능한 원본 식과 해시','graph'],['계산 결과의 해석 범위','interpretation'],['현재 연결 이후 남은 수학적 작업','nextDependency']]
    .filter(([,field])=>owns(d,field)).map(([heading,field])=>({title:heading,value:d[field],sourcePath:ROOT+'.'+field}));
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata:axes,color:null,
    chart:{kind:'COMPARISON_TABLE',columns:t.columns,rows:t.rows.map(row=>row.map(scalarText)),sourcePaths:t.sourcePaths,cellSourcePaths:t.cellSourcePaths,displayTransform:'EXACT_SOURCE_EXPRESSION_TO_TEXT'},
    scene:{points:[],lines:[],arrows:[],axes:[]},table:t,relatedTables,details,
    observation:{kind,sourceProfileId:d.sourceProfile,parameterExpressionSHA256:d.parameterExpressionSHA256,
      sourceDimension:2,sourceDimensionMeaning:'EXACT_EXPRESSION_RECORD_ATTRIBUTES',displayDimension:2,physicalDimension:0,
      coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,
      exactExpressionIdsArePhysicalValues:false,numericalSensitivityQuadrature:false,fullGraphDuplicatedInReceipt:false,
      globalOriginalCriteriaComplete:false,fullNavierStokesSolutionOrRegularityClaim:false,fullSameProfileN5:false,
      globalPhysicalResidualCertified:false,flatErrorCertified:false,kernelProofVerifiedByThisView:false,...extra},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:t.totalRows},
    lostInformation:[
      '표의 rootId와 식 번호는 원본 식의 식별자입니다. 수치 도함수나 물리 좌표로 변환하지 않습니다.',
      '표시 행 수를 줄여도 전체 실행 결과와 식은 보존됩니다. 원본 compiler 입력과 그래프 해시로 같은 식을 재구성할 수 있습니다.',
      '표의 개별 계산 검사는 해당 source 식과 명시된 정의역에 적용됩니다. 전역 물리 잔차·flat-error와 전체 해의 성질은 별도 조건입니다.'
    ]};
}

export function actualCovarianceSensitivityPanels(job,options={}){
  const d=eligible(job,options,'ns.actual-covariance-sensitivity','MathScope.ActualCovarianceSensitivityCertificate/1',['integralRows','tailRows','checks']);
  if(!d||!d.inverse||!d.target)return [];
  const kind='ACTUAL_SOURCE_FIRST_COVARIANCE_VARIATION';
  const extra={firstSlowDerivativeOnly:true,inverseDerivativeConditionalOnNonzeroDeterminant:true,
    positiveWeightsOfExercisedMemberCertified:d.scope.positiveWeightsOfExercisedMemberCertified===true,
    squareRootWeightsConstructed:d.inverse.squareRootsConstructed===true,actualNumericalWholeHQuadrature:false};
  const make=(id,title,description,key,t,related=[])=>panel(id,title,description,key,t,d,kind,related,extra);
  const integrals=sourceRows('두 부호 · theta/z 공분산과 mass의 실제 미분',d,'integralRows',
    ['부호','성분','원래 적분 식','정확한 미분 식','표시 유한 합의 미분','절대 tail 식','미분 하한 식','미분 상한 식'],
    ['sign','component','originalRoot','derivativeRoot','finiteDerivativeRoot','absoluteErrorRoot','lowerRoot','upperRoot'],options);
  const geometry=sourceRows('원래 Haar·cutoff와 끝점 미분의 검증',d,'integralRows',
    ['부호','성분','원래 Haar 식','원래 cutoff 식','양 끝점의 미분','곱 미분 검사','적분 끝점 검사'],
    ['sign','component','originalHaarRoot','originalCutoffRoot','endpointDerivatives','productCheck','leibnizCheck'],options);
  const tails=sourceRows('원본에서 유도한 비영 공분산 미분 tail',d,'tailRows',
    ['부호','절대 tail 식','거친 절대 상계 식','보존한 ∫ψ²P² 식','tail 공식','수렴 조건'],
    ['sign','absoluteError','coarseAbsoluteError','envelopeSquaredIntegral','formula','convergence'],options);
  const norms=sourceRows('tail에 쓰인 원래 source 노름과 유도 근거',d,'tailRows',
    ['부호','기저 노름 식','기저 미분 노름 식','전체 변분 벡터 상계 식','factorial tail 식','행렬 노름 식','초기값 노름 식','구간 길이 식','곱 오차 근거','P 상계 근거'],
    ['sign','basisNorm','basisDerivativeNorm','wholeAugmentedNorm','factorialTail','augmentedMatrixNorm','augmentedInitialNorm','length','productProof','envelopeProof'],options);
  const checks=sourceRows('현재 source 공분산 미분 검사',d,'checks',['검사','통과'],['id','pass'],options);
  return [
    make('main','실제 공분산 · '+(d.request?.slowCoordinate||'slow')+' 1차 미분','원래 두 부호의 theta/z 공분산과 mass 적분을 미분한 식입니다. Haar·cutoff·끝점 항을 직접 계산하고, 유한 합의 비영 오차 상계를 보존합니다.','integralRows',integrals,[geometry]),
    make('covariance-sensitivity-inverse','실제 H와 전체 target · 역행렬 미분','yₐ=H⁻¹(Tₐ−Hₐy)를 원래 H와 전체 target에서 구성합니다. det(H)≠0인 정의역에서의 식이며, 이번 ℓ=1 가중치의 양성이나 제곱근을 인증하지 않습니다.','inverse',propertyTable('역행렬 미분의 원본 식과 조건',d,'inverse',options),[propertyTable('원래 압력과 두 shear 항을 유지한 target',d,'target',options)]),
    make('covariance-sensitivity-tail','공분산 미분 · 원본에서 유도한 수렴 오차','∫ψ²P²를 유지한 절대 오차 식과 source 노름을 함께 표시합니다. 고정 source·유한 band에서 factorial tail이 0으로 수렴하며, 전체 적분의 수치 구적은 별도입니다.','tailRows',tails,[norms]),
    make('covariance-sensitivity-checks','공분산 미분 · source 검사','원래 적분과의 일치, 곱·끝점 미분, 전체 target, Hₐy 항과 조건부 정의역을 검사한 현재 결과입니다.','checks',checks),
    make('covariance-sensitivity-scope','공분산 미분 · 적용 범위와 가역성 조건','계산한 미분과 수렴식의 범위, 인증된 source band 조건과 이번 ℓ=1 실행의 상태를 원본 그대로 표시합니다.','scope',propertyTable('현재 구성 범위',d,'scope',options),[propertyTable('원본 source와 조건부 역행렬의 정의역',d,'domain',options)])
  ];
}

export function actualPulseJetPanels(job,options={}){
  const d=eligible(job,options,'ns.actual-pulse-jet','MathScope.ActualPulseJetCertificate/1',['derivativeRows','equationRows','endpointRows','checks']);
  if(!d||!d.convergence)return [];
  const kind='ACTUAL_SOURCE_ALL_RZT_SLOW_PULSE_JET';
  const extra={firstSlowDerivativeOnly:false,slowDirections:d.convergence.directions,
    slowDerivativeOrders:d.convergence.slowDerivativeOrders,secondSlowDerivativeSupported:d.scope.secondSlowDerivativeSupported===true,
    mixedSlowDerivativeSupported:d.scope.mixedSlowDerivativeSupported===true,
    sourceGlobalC3Bound:d.scope.sourceGlobalC3Bound===true,numericalWholeSourceEvaluation:false};
  const make=(id,title,description,key,t,related=[])=>panel(id,title,description,key,t,d,kind,related,extra);
  const derivatives=sourceRows('두 부호 · R/Z/T 1차·2차·혼합 미분',d,'derivativeRows',
    ['부호','성분','미분 방향','방향별 차수','총 차수','정확한 도함수','표시 유한 합','절대 tail','tail 공식','유한 합이 정확해인가'],
    ['sign','component','coordinate','orders','derivativeOrder','derivative','finiteApproximation','absoluteTail','tailFormula','finiteApproximationIsExact'],options);
  const equations=sourceRows('원래 ODE와 모든 slow 변분식',d,'equationRows',
    ['부호','방향','확장 차원','원래 ODE','1차 변분식','2차 변분식','M 식','M의 1차 미분 식','M의 2차 미분 식','M의 pulse 시간 미분 식','끝점 미분 공식','source 미분 검사 행 수'],
    ['sign','directions','augmentedDimension','originalODE','variationODE','secondVariationODE','matrixRoots','matrixFirstRoots','matrixSecondRoots','matrixTimeRoots','endpointFormula','sourceJetAuditRowCount'],options);
  const norms=sourceRows('원본 초기값과 source 의존 FTC 노름',d,'equationRows',
    ['부호','원래 초기값 식','M 노름 식','M의 1차 미분 노름 식','M의 2차 미분 노름 식','노름의 원본 유도식'],
    ['sign','originalInitial','matrixNorm','matrixFirstNorms','matrixSecondNorms','sourceOfNorm'],options);
  const endpoints=sourceRows('초기·중간·끝점의 모든 합성 미분',d,'endpointRows',
    ['부호','끝점','pulse 시간 식','미분 방향','방향별 차수','총 차수','세 진폭 성분의 합성 미분','절대 tail 식','합성 끝점 미분 포함'],
    ['sign','name','time','coordinate','orders','derivativeOrder','amplitudeDerivative','absoluteTail','composedEndpointDifferentiated'],options);
  const checks=sourceRows('현재 source jet 검사',d,'checks',['검사','통과'],['id','pass'],options);
  return [
    make('main','실제 pulse · R/Z/T 1차·2차·혼합 미분','원래 두 source pulse의 모든 R/Z/T 1차 및 2차 미분을 정확한 식으로 표시합니다. 각 유한 합과 비영 절대 tail을 함께 보존합니다.','derivativeRows',derivatives,[propertyTable('미분 계의 수렴식과 표시 항 수',d,'convergence',options)]),
    make('pulse-jet-equations','실제 M · 1차·2차 변분 계','원래 행렬의 1차·2차·시간 미분과 각 방향의 변분식, 움직이는 끝점의 미분 공식을 표시합니다. 원래 초기값과 source 의존 FTC 노름의 식도 함께 보존합니다.','equationRows',equations,[norms]),
    make('pulse-jet-endpoints','실제 pulse 끝점 · 전체 합성 미분','초기·중간·끝점에서 세 진폭 성분의 1차·2차·혼합 합성 미분을 유지합니다. 끝점 시간과 방향별 차수는 해당 원본 행에 연결됩니다.','endpointRows',endpoints),
    make('pulse-jet-scope','전체 R/Z/T jet · 적용 범위와 남은 조건','계산한 미분, source 의존 노름과 수렴식의 범위를 확인합니다. 공분산 양성과 전역 C³ 상계·물리 잔차·flat-error는 각각의 source 조건이 필요합니다.','scope',propertyTable('현재 source jet 구성 범위',d,'scope',options),[checks,propertyTable('고정 label과 실제 source 영역',d,'domain',options)])
  ];
}

/** The curl certificate carries its own positivity domain; never infer it from
 * a successful algebraic check or from an exercised low band.
 */
export function actualFullCurlPanels(job,options={}){
  const d=eligible(job,options,'ns.actual-full-curl','MathScope.ActualFullCurlCertificate/1',['curlRows','divergenceRows','checks']);
  if(!d)return [];
  const kind='ACTUAL_SOURCE_CONDITIONAL_FULL_CURL';
  const make=(id,title,description,key,t,related=[])=>panel(id,title,description,key,t,d,kind,related,
    {positiveWeightDomainIsConditional:true,oneFixedSlowBoxOnly:true,actualGlobalSlowPartitionGluingComplete:false,
      exercisedBandPositiveWeightsCertified:d.scope.exercisedBandPositiveWeightsCertified===true,
      conditionalZeroIsUnconditionalValue:false,globalPhysicalResidualCertified:false,flatErrorCertified:false});
  const curls=sourceRows('두 부호 · potential과 전체 curl',d,'curlRows',
    ['부호','성분','potential 식','leading 식','curl 나머지 식','전체 curl 복소 계수 식'],
    ['sign','component','potential','leading','curlRemainder','fullCoefficient'],options);
  const weights=sourceRows('원래 공분산 가중치와 cutoff 미분',d,'curlRows',
    ['부호','성분','가중치 식','가중치 R 미분','가중치 Z 미분','transverse cutoff 미분'],
    ['sign','component','weight','weightR','weightZ','transverseCutoffDerivative'],options);
  const divergence=sourceRows('정의역 조건 아래의 전체 curl 발산',d,'divergenceRows',
    ['부호','실수부 식','허수부 식','정의역 조건 아래 값','적용 정리','정리의 전제','이번 band의 조건 인증'],
    ['sign','realExpression','imaginaryExpression','conditionalValue','theorem','premises','domainMembershipCertified'],options);
  const checks=sourceRows('현재 전체 curl 검사',d,'checks',['검사','통과'],['id','pass'],options);
  const sourceGeometry=owns(d,'geometry')?[propertyTable('원래 물리 미분 연산자와 고정된 label',d,'geometry',options)]:[];
  const convergence=owns(d,'convergence')?[propertyTable('보존한 정확 source 극한과 수치 평가 범위',d,'convergence',options)]:[];
  return [
    make('main','실제 pulse · 한 slow box의 조건부 전체 curl','하나의 고정 band·slow box에서 원래 potential의 leading 항과 curl 나머지를 포함한 전체 계수를 표시합니다. 이 구성은 원본에 명시된 가중치 양성·가역성 정의역에 적용됩니다.','curlRows',curls,[weights,...sourceGeometry]),
    make('full-curl-divergence','실제 전체 curl · 조건부 발산 검사','표의 0은 양의 가중치 정의역과 정리의 전제 아래에서만 성립합니다. 이번 ℓ=1의 정의역 포함 여부는 별도로 남으며, 한 box의 항등식을 전역 물리 잔차의 통과로 확대하지 않습니다.','divergenceRows',divergence,[checks]),
    make('full-curl-scope','전체 curl · 조건부 정의역과 남은 전역 연결','가중치 양성 조건과 한 slow box의 curl 구성 범위를 확인합니다. 모든 label의 조립, 전역 물리 잔차와 flat-error에 대한 결론은 별도 원본 검증이 필요합니다.','scope',propertyTable('현재 curl 구성 범위',d,'scope',options),[propertyTable('원본 가중치 양성과 가역성의 정의역',d,'domain',options),...convergence])
  ];
}

export function actualDifferentialPanels(job,options={}){
  if(job?.request?.kind==='ns.actual-covariance-sensitivity')return actualCovarianceSensitivityPanels(job,options);
  if(job?.request?.kind==='ns.actual-pulse-jet')return actualPulseJetPanels(job,options);
  if(job?.request?.kind==='ns.actual-full-curl')return actualFullCurlPanels(job,options);
  return [];
}
