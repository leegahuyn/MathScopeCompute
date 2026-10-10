/** Read-only tables of exact first-variation expressions; no numerical sampling. */
import {sampleIndices} from './observations.mjs';

const ROOT='result.results';
const stringify=x=>typeof x==='string'?x:JSON.stringify(x);
function table(title,columns,records,options){
  const count=Number.isSafeInteger(options.maxRows)&&options.maxRows>0?Math.min(options.maxRows,1000):200;
  const selected=sampleIndices(records.length,count);
  return {title,columns,rows:selected.map(i=>records[i].cells.map(c=>c[0])),sourcePaths:selected.map(i=>records[i].path),cellSourcePaths:selected.map(i=>records[i].cells.map(c=>c[1])),totalRows:records.length,truncated:selected.length<records.length,exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
}
function records(values,key,fields){return values.map((r,i)=>{const path=ROOT+'.'+key+'['+i+']';return {path,cells:fields.map(k=>[r[k],path+'.'+k])};});}
function properties(value,key){return Object.keys(value).map(k=>{const path=ROOT+'.'+key+'.'+k;return {path,cells:[[k,null],[value[k],path]]};});}
function panel(id,title,description,sourceField,t,d,relatedTables=[]){
  const axes=[{label:'원본 항목',type:'CATEGORICAL_SOURCE_FIELD',sourceField,unit:'1',scale:'linear',transform:'stored row order',dataDimension:1,physicalDimension:0},{label:'정확한 source 식',type:'EXACT_SOURCE_EXPRESSION',sourceField,unit:'1',scale:'linear',transform:'expression text; no numeric field evaluation',dataDimension:1,physicalDimension:0}];
  return {id,title,description,kind:'TABLE',sourceRoot:ROOT,axisMetadata:axes,color:null,
    chart:{kind:'COMPARISON_TABLE',columns:t.columns,rows:t.rows.map(r=>r.map(stringify)),sourcePaths:t.sourcePaths,cellSourcePaths:t.cellSourcePaths,displayTransform:'EXACT_SOURCE_EXPRESSION_TO_TEXT'},
    scene:{points:[],lines:[],arrows:[],axes:[]},table:t,relatedTables,
    details:[{title:'재구성 가능한 source 프로그램과 해시',value:d.graph,sourcePath:ROOT+'.graph'},{title:'현재 연결 이후 남은 수학적 작업',value:d.nextDependency,sourcePath:ROOT+'.nextDependency'}],
    observation:{kind:'ACTUAL_SOURCE_FIRST_SLOW_PULSE_VARIATION',sourceProfileId:d.sourceProfile,parameterExpressionSHA256:d.parameterExpressionSHA256,sourceDimension:2,displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,exactExpressionIdsArePhysicalValues:false,numericalSensitivityQuadrature:false,firstSlowDerivativeOnly:true,globalOriginalCriteriaComplete:false,fullNavierStokesSolutionOrRegularityClaim:false,fullSameProfileN5:false},
    lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:t.totalRows},
    lostInformation:['표의 rootId는 원본 식의 식별자입니다. 도함수의 수치값이나 물리 좌표로 표시하지 않습니다.','유한 Volterra 합에는 양의 나머지 상계가 남습니다. 전체 source 그래프는 표시한 compiler 입력으로 재구성하고 해시로 대조합니다.','1차 slow 미분의 연결 범위입니다. 공분산 가중치의 미분, 2차 slow 미분, 실제 전체 curl 및 전역 flat-error는 별도 조건입니다.']};
}
export function actualSensitivityPanels(job,options={}){
  const d=job?.result?.results;
  if(options.currentEditorMatches===false||job?.request?.kind!=='ns.actual-pulse-sensitivity'||d?.schema!=='MathScope.ActualPulseSensitivityCertificate/1'||d.pass!==true)return [];
  if([job.status,job.result.status].some(s=>!['COMPLETED','PARTIAL'].includes(s)))return [];
  const derivatives=table('두 부호 family · 실제 1차 도함수와 생략항',['부호','성분','slow 좌표','정확한 도함수','표시 유한 합','절대 tail','tail 공식'],records(d.derivativeRows,'derivativeRows',['sign','component','coordinate','derivative','finiteApproximation','absoluteTail','tailFormula']),options);
  const equations=table('실제 원본 ODE와 변분식',['부호','좌표','원래 ODE','변분 ODE','M의 root','∂M의 root','∂M의 source 상계','초기조건의 전체 미분식'],records(d.equationRows,'equationRows',['sign','coordinate','originalODE','variationODE','matrixRoots','matrixDerivativeRoots','matrixDerivativeNorm','variationInitialFormula']),options);
  const endpoints=table('실제 초기·중간·끝점의 합성 미분',['부호','끝점','pulse 시간 식','시간의 slow 미분','세 성분의 합성 미분'],records(d.endpointRows,'endpointRows',['sign','name','time','timeDerivative','amplitudeDerivative']),options);
  const scope=table('현재 실제 구성 범위',['항목','상태'],properties(d.scope,'scope'),options);
  const checks=table('현재 실행의 source 검사',['검사','통과','검사 의미'],records(d.checks,'checks',['id','pass','meaning']),options);
  return [
    panel('main','실제 pulse · 1차 '+d.request.slowCoordinate+' 미분','원래 두 source pulse의 t=P B w를 직접 미분한 정확한 식입니다. 실제 ∂M 항을 포함한 4성분 Volterra 계와 유한 합의 비영 tail를 함께 보존합니다.',ROOT+'.derivativeRows',derivatives,d,[table('수렴 계와 유한 표시 범위',['항목','값'],properties(d.convergence,'convergence'),options)]),
    panel('sensitivity-equations','실제 M · ∂M · 변분 초기조건','sᵥ=M s+(∂ₐM)w를 실제 source 식에서 구성합니다. 원래 초기조건과 움직이는 시작점의 항을 유지하고, 요청한 좌표에 대해 고정된 항만 정확히 0으로 계산합니다.',ROOT+'.equationRows',equations,d),
    panel('sensitivity-endpoints','초기·중간·끝점 · 전체 chain rule','정규화된 w의 초기값과 실제 t의 초기 프레임을 구분합니다. 합성 끝점의 ∂ₐt+tᵥbₐ를 계산하며, R 미분에서 실제 초기 프레임의 비영 기여를 남깁니다.',ROOT+'.endpointRows',endpoints,d),
    panel('sensitivity-scope','실행 범위 · source 조건 · 남은 연결','고정 label에서 R/Z/T 중 하나의 1차 미분을 구성합니다. 이번 미분식의 유효 범위와 공분산 양성·고차 미분·전체 잔차의 별도 조건을 확인하세요.',ROOT+'.scope',scope,d,[checks,table('고정 label과 실제 source 영역',['항목','값'],properties(d.domain,'domain'),options)])
  ];
}
