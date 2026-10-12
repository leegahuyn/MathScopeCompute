/** Views of retained actual-global-source results. No source computation or job binding occurs here. */
import {sampleIndices} from './observations.mjs';

const ROOT='result.results';
const COLORS=['#76e2cd','#ffd282','#99b8ff'];
const QUANTITIES=[['U_over_E','U₀/E₀'],['M_over_XE','M₀/(X E₀)'],['V_over_XE','V₀/(X E₀)']];
const array=x=>Array.isArray(x)?x:[];
const limit=(x,fallback,max)=>Number.isSafeInteger(x)&&x>0?Math.min(x,max):fallback;
const finite=Number.isFinite;
const validInterval=x=>Array.isArray(x)&&x.length===2&&x.every(finite)&&x[0]<=x[1];
const midpoint=x=>x[0]/2+x[1]/2;
const cell=(value,sourcePath=null)=>({value,sourcePath});
const row=(sourcePath,...cells)=>({sourcePath,cells});
const safe=x=>typeof x==='number'&&!finite(x)?'미표시: '+String(x):x===undefined?'미확정':Array.isArray(x)?x.map(safe):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,safe(v)])):x;
const axis=(label,type,sourceField,transform='identity')=>({label,type,sourceField,unit:'1',scale:'linear',transform,dataDimension:1,physicalDimension:0});

function sourceTable(title,columns,records,options={}){
  const ix=sampleIndices(records.length,limit(options.maxRows,200,1000));
  return {title,columns,rows:ix.map(i=>records[i].cells.map(c=>safe(c.value))),sourcePaths:ix.map(i=>records[i].sourcePath),cellSourcePaths:ix.map(i=>records[i].cells.map(c=>c.sourcePath)),totalRows:records.length,truncated:ix.length<records.length,selection:'DETERMINISTIC_STORED_ROW_ORDER',exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
}

function propertyRows(object,path,fields){
  return fields.filter(([key])=>object&&Object.hasOwn(object,key)).map(([key,label])=>row(path+'.'+key,cell(label),cell(object[key],path+'.'+key)));
}

function propertyTable(title,object,path,fields,options){
  return sourceTable(title,['원본 항목','값·정확한 식·현재 상태'],propertyRows(object,path,fields),options);
}

function common(id,title,description,axes,kind,d){
  return {id,title,description,sourceRoot:ROOT,axisMetadata:axes,color:null,relatedTables:[],details:[],lostInformation:[],observation:{kind,sourceProfileId:d.profileId,parameterExpressionSHA256:d.parameterExpressionSHA256,sourceDimension:axes.length,sourceDimensionMeaning:'TYPED_STORED_SOURCE_ATTRIBUTES',displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,sourceScope:'ACTUAL_SAME_N3_OUTER_SOURCE_AND_REDUCED_FUNCTIONAL_CONSTRUCTION',globalOriginalCriteriaComplete:false}};
}

function expressionText(value){
  if(value===null)return 'null';
  if(typeof value!=='object')return String(value);
  if(Array.isArray(value))return '['+value.map(expressionText).join(', ')+']';
  if('ref'in value)return value.ref;
  if('integer'in value)return String(value.integer);
  if('rational'in value)return String(value.rational);
  if(value.product)return value.product.map(x=>'('+expressionText(x)+')').join(' × ');
  if(value.sum)return value.sum.map(expressionText).join(' + ');
  if(value.quotient)return '('+expressionText(value.quotient[0])+')/('+expressionText(value.quotient[1])+')';
  if(value.power)return '('+expressionText(value.power[0])+')^('+expressionText(value.power[1])+')';
  for(const key of ['exp','sqrt','ceil','log'])if(key in value)return key+'('+expressionText(value[key])+')';
  return JSON.stringify(safe(value));
}

function tablePanel(id,title,description,table,sourceField,kind,d){
  const axes=[axis('원본 항목','CATEGORICAL_SOURCE_FIELD',sourceField),axis('정확한 식·구간·판정','EXACT_SOURCE_EXPRESSION',sourceField,'Stored expressions and states; node IDs are not evaluated field values')];
  return {...common(id,title,description,axes,kind,d),kind:'TABLE',chart:{kind:'COMPARISON_TABLE',columns:[...table.columns],rows:table.rows.map(r=>r.map(expressionText)),sourcePaths:[...table.sourcePaths],cellSourcePaths:table.cellSourcePaths.map(r=>[...r]),displayTransform:'EXACT_SOURCE_VALUE_TO_TEXT; FULL_VALUES_RETAINED_IN_TABLE'},scene:{points:[],lines:[],arrows:[],axes:[]},table,lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:table.totalRows},lostInformation:['Canvas의 긴 식은 화면 폭에 맞게 축약됩니다. 전체 식·유리수·실행 상태는 아래 정확표와 원본 JSON에 보존됩니다.']};
}

function outerObservationPanel(d,options){
  const o=d.outerObservations,op=ROOT+'.outerObservations',rows=array(o.rows),records=[];
  const groups=QUANTITIES.map(([id,label],k)=>({id,label,color:COLORS[k],connect:false,points:[]}));
  rows.forEach((r,i)=>array(r.values).forEach((v,j)=>{
    const group=groups.find(g=>g.id===v.id);if(!group)return;
    const rp=op+'.rows['+i+']',vp=rp+'.values['+j+']';
    records.push(row(vp,cell(r.xiExact,rp+'.xiExact'),cell(r.eta,rp+'.eta'),cell(v.quantity,vp+'.quantity'),cell(v.interval?.[0],vp+'.interval[0]'),cell(v.interval?.[1],vp+'.interval[1]'),cell(r.XExpression,rp+'.XExpression'),cell(r.sourceRegion,rp+'.sourceRegion')));
    if(!finite(r.xi)||!validInterval(v.interval))return;
    const y=midpoint(v.interval);if(!finite(y))return;
    group.points.push({x:r.xi,y,lower:v.interval[0],upper:v.interval[1],midpoint:y,value:v.interval,sourceValue:v.interval,interval:[...v.interval],sourceIndex:i,componentIndex:j,sourcePath:vp+'.interval',xSourcePath:rp+'.xi',sourceEtaPath:rp+'.eta',sourceRadiusPath:rp+'.XExactExpression',label:group.label+' · ξ='+r.xiExact+' · ['+v.interval[0]+', '+v.interval[1]+']',displayTransform:'MIDPOINT_OF_STORED_OUTWARD_INTERVAL; ENDPOINTS_RETAINED'});
  }));
  const valid=groups.reduce((n,g)=>n+g.points.length,0),selected=new Set(sampleIndices(valid,limit(options.maxPoints,4000,6000)));
  let ordinal=0;
  const series=groups.map(g=>({...g,points:g.points.filter(()=>selected.has(ordinal++))})).filter(g=>g.points.length);
  const points=series.flatMap(g=>g.points.map(p=>({...p,pos:[p.x,p.y,0],color:g.color})));
  const axes=[axis('ξ = λ log(X/Xp)','NORMALIZED_LOG_RADIAL_COORDINATE',op+'.rows[*].xi','Stored xi; exact X=Xp*exp(xi/lambda) retained'),axis('원본 비율 · 구간 중심','NORMALIZED_ACTUAL_OUTER_FIELD_INTERVAL',op+'.rows[*].values[*].interval','Midpoint of stored outward interval; endpoints retained in the exact table')];
  const panel={...common('main','실제 N3 바깥 pulse · 세 비율의 관측','같은 원본 profile의 바깥 main pulse에서 U₀/E₀, M₀/(X E₀), V₀/(X E₀)의 실제 구간 중심을 표시합니다. 기본 입력은 ξ 다섯 지점의 15개 관측입니다. 각 구간의 하한·상한과 물리 X의 정확식은 표에 보존합니다. 서로 다른 정규화 비율이며 원시 속도나 전체 전역 적분값을 표시한 것이 아닙니다.',axes,'ACTUAL_N0_OUTER_NORMALIZED_FIELD_INTERVALS',d),kind:'SERIES',chart:{kind:'SERIES',series,xLabel:axes[0].label,yLabel:axes[1].label},scene:{points,lines:[],arrows:[],axes:[axes[0].label,axes[1].label,'display plane']},table:sourceTable('실제 바깥 관측 · 하한·상한·양의 원본 X',['ξ 정확값','η','원본 비율','구간 하한','구간 상한','실제 X 정확식','원본 구간'],records,options),lod:{originalPoints:records.length,displayedPoints:points.length,invalidCoordinates:records.length-valid,changesComputation:false,method:'DETERMINISTIC_STORED_MARK_ORDER',fullSourceRetained:true}};
  panel.observation={...panel.observation,fixedEta:o.input?.eta,fixedEtaSourcePath:op+'.input.eta',rawPhysicalFieldValueDisplayed:false,physicalXConvertedToBinary64:false,intervalEndpointsRetained:true,intervalBarsDrawn:false,interpolationBetweenSourcePoints:false,globalIntegralsEvaluated:false};
  panel.relatedTables.push(propertyTable('비율의 정확한 정의',o.definitions,op+'.definitions',Object.keys(o.definitions||{}).map(k=>[k,k]),options),propertyTable('관측점의 근거와 전역 계산의 현재 범위',o,op,[['supportBinding','원래 I1 복구 이후 장과의 일치'],['scope','실제 관측·미완료 전역 적분의 범위'],['receipt','진폭 구간의 원본 receipt']],options));
  panel.details.push({title:'실제 양의 X 및 잔여항의 source 정의',value:o.errorDerivation,sourcePath:op+'.errorDerivation'},{title:'원본 profile 결속',value:o.sources,sourcePath:op+'.sources'},{title:'전체 배경장 모멘트에 남은 구성',value:d.remaining,sourcePath:ROOT+'.remaining'});
  panel.lostInformation.push('점은 저장된 구간의 표시 중심이며 정확값이 아닙니다. 연결선·보간값은 만들지 않으며 전체 구간 끝점은 표와 JSON에 남습니다.','가로축 ξ는 정규화한 로그 좌표입니다. 매우 큰 실제 양의 X를 0이나 임의의 Float64 값으로 대체하지 않습니다.','기본 15개 관측으로 미계산한 내부 구간, 전역 적분, 다음 차수 배경장 또는 pulse 성장 인증을 복원할 수 없습니다.');
  return panel;
}

function reducedMomentsPanel(d,options){
  const r=d.reduction,p=ROOT+'.reduction';
  const records=array(r.regularIntegrands).map((v,i)=>{const path=p+'.regularIntegrands['+i+']';return row(path,cell(v.id,path+'.id'),cell(v,path));});
  records.push(...propertyRows(r,p,[['axisBoundary','실제 축 경계 V₀,X(0,η)']]));
  records.push(...propertyRows(r.functionals,p+'.functionals',[['P','P = ∫ Ω₀/(2X) dX'],['F','F = ∫ Ω₀/2 dX']]));
  const panel=tablePanel('reduced-moments','전역 Ω 모멘트 · 여섯 정규 적분과 실제 축 경계','V₀=Xv로 치환하여 축에서 특이하지 않은 여섯 적분을 얻었습니다. 실제 축 경계 V₀,X(0,η)는 구간으로 계산했고 η=0에서는 정확히 −4입니다. 여섯 전역 적분의 값은 아직 미계산이며 actualSourceValuesEvaluated=false로 유지합니다. pressure debt는 −P, flux debt는 +F입니다.',sourceTable('미계산한 전역 적분의 정확한 정의 · 계산된 축 경계',['원본 대상','정확한 식·구간·현재 실행 상태'],records,options),p,'ACTUAL_OMEGA_REDUCTION_AND_AXIS_BOUNDARY',d);
  panel.observation={...panel.observation,sixActualGlobalIntegralsEvaluated:r.scope?.sixActualGlobalIntegralsEvaluated,actualAxisBoundaryEvaluated:r.scope?.actualAxisBoundaryEvaluated,actualIposInverseApplied:false,missingIntegralValuesReplacedByZero:false};
  panel.relatedTables.push(propertyTable('축 regularity와 환원에 필요한 실제 입력',r,p,[['radialAverage','실제 누적 평균의 정의'],['normalizedRadial','v=V₀/X의 정규 식'],['coefficients','원본 h·A·D·d·L'],['hypotheses','전체 support·η 미분 차수'],['executableOperators','정확 연산자와 아직 필요한 실제 입력'],['arbitraryFixedSubinterval','고정 부분구간의 두 경계항'],['scope','원래 N4 완료 상태']],options),propertyTable('다섯 원래 모멘트로 대체할 수 없는 이유',d.negativeControl,ROOT+'.negativeControl',[['scope','대조군의 범위'],['invalidShortcutRejected','반례가 차단하는 잘못된 단축'],['distinctFlux','서로 다른 flux'],['distinctPressure','서로 다른 pressure']],options));
  panel.details.push({title:'원문에서 도출한 부분적분',value:r.derivation,sourcePath:p+'.derivation'},{title:'원본 식의 출처',value:r.sources,sourcePath:p+'.sources'},{title:'실제 전체 모멘트 복구 목표',value:d.target,sourcePath:ROOT+'.target'});
  return panel;
}

function remainderPanel(d,options){
  const r=d.modulationRemainder,p=ROOT+'.modulationRemainder';
  const records=[...propertyRows(r.uniformFinalBound,p+'.uniformFinalBound',[['P','P의 실제 C.12/I1 차이 상계'],['F','F의 실제 C.12/I1 차이 상계'],['exactUpper','공통 절대오차 상계 · 정확한 유리수'],['displayEnclosure','절대오차 상계의 표시 enclosure'],['etaDomain','이 값 상계가 적용되는 η 구간'],['etaDerivativeOrders','인증한 함수값의 η 미분 차수']]),...propertyRows(r,p,[['sameActualNRetained','원본 N 보존'],['R','원본 R 정의'],['N','원본 N 정의'],['RExact','원본 R의 정확한 의존식'],['NExact','원본 N의 정확한 의존식']])];
  const panel=tablePanel('modulation-remainder','원래 C.12·I1 복구 · 두 함수값의 실제 오차 상계','원래 주파수 N과 I1 복구를 유지한 채 최종 P,F와 pre-C12 P,F 사이의 절대오차를 2⁻²⁶⁰ 이하로 감쌉니다. pre-C12의 전역 적분값 자체는 아직 필요합니다. 이 값 상계를 η 도함수 전체, radial shear 또는 N5 phase·성장 인증으로 적용하지 않습니다.',sourceTable('실제 N을 유지한 두 Ω 함수값의 나머지',['원본 항목','정확한 상계·구간·인증 차수'],records,options),p,'ACTUAL_C12_OMEGA_VALUE_REMAINDER',d);
  panel.observation={...panel.observation,absoluteRemainderOnly:true,etaDerivativeOrders:r.uniformFinalBound?.etaDerivativeOrders,functionalEtaDerivativeFamilyCertified:r.scope?.functionalEtaDerivativeFamilyCertified,N5PhaseOrGrowthCertificate:r.scope?.N5PhaseOrGrowthCertificate,preC12ValuesStillRequired:r.scope?.preC12ActualOmegaValuesStillNeeded};
  panel.relatedTables.push(propertyTable('실제 perturbation 지지와 다음 차수의 남은 조건',r,p,[['sourceDifferences','같은 원본의 C.12 및 I1 차이'],['estimates','부분적분 후 각 항의 실제 상계'],['arithmeticChecks','R,N의 정확 부등식 검사'],['missingForNextOrder','η 도함수 계열에 필요한 추가 경계'],['scope','인증 범위와 미완료 상태']],options));
  panel.details.push({title:'원본 C.12/I1 계약의 출처',value:r.source,sourcePath:p+'.source'});
  return panel;
}

function outerProgramPanel(d,options){
  const r=d.outerProgram,p=ROOT+'.outerProgram',keys=['U','M','V','U_eta1','U_eta2','M_eta1','M_eta2','V_eta1','V_eta2','Omega0','amplitude','mConst','meanPressureDebt','meanFluxDebt','pulsePressureDebt','pulseFluxDebt','outerPressureDebt','outerFluxDebt','Xp','Xv'];
  const records=keys.filter(k=>Number.isSafeInteger(r.roots?.[k])&&r.nodes?.[r.roots[k]]).map(k=>{const i=r.roots[k],np=p+'.nodes['+i+']';return row(np,cell(k),cell(i,p+'.roots.'+k),cell(r.nodes[i],np));});
  const panel=tablePanel('outer-program','같은 원본의 바깥 U₀·M₀ · 연산 그래프와 전체 support','실제 바깥 구간의 U₀,M₀,V₀, η 도함수와 모멘트 적분을 원소 연산·구적·명시적 root의 의존 그래프로 구성했습니다. 아래 숫자는 AST 노드 번호이며 장의 수치값이 아닙니다. 바깥 적분 전체와 내부 pre-C12 적분을 수치 구간으로 계산한 결과는 아직 없습니다.',sourceTable('원본 바깥 함수와 적분의 실제 프로그램 root',['원본 대상','AST 노드 번호','원본 연산·의존 노드'],records,options),p,'ACTUAL_OUTER_SOURCE_FUNCTION_PROGRAM',d);
  panel.observation={...panel.observation,programNodeIDsAreFieldValues:false,outerTailDefinitionCompiled:r.scope?.completeActualOuterTailFunctionDefinitionCompiled,outerTailIntegralsNumericallyEvaluated:r.scope?.outerTailIntegralsNumericallyEvaluated,completeActualGlobalU0Compiled:r.scope?.completeActualGlobalU0Compiled};
  panel.relatedTables.push(propertyTable('원래 바깥 함수의 좌표·근·support',r,p,[['coordinate','프로그램 좌표'],['support','전체 axial support와 I1 이후의 실제 일치'],['equations','원본의 명시적 root와 선형 복구식'],['energyNormalization','짝을 이루는 A.2 reference 에너지 정규화'],['interpretation','실행 가능한 정의와 현재 evaluator의 구별'],['scope','정의·미분·적분의 실제 실행 범위']],options),propertyTable('전역 목표와 남은 실제 계산',d,ROOT,[['target','두 전역 Ω debt와 원래 Ipos inverse의 목표'],['remaining','아직 필요한 함수 조립·적분·미분 계열'],['scope','원문 N4-03/04/05 완료 상태'],['verification','현재 검증 범위']],options));
  panel.details.push({title:'원본 outer 단계의 연산 graph',value:r.stages,sourcePath:p+'.stages'},{title:'원본 outer 구성의 식 번호',value:r.sourceEquations,sourcePath:p+'.sourceEquations'});
  panel.lostInformation.push('표는 선택한 root 노드와 그 의존 ID를 보여 줍니다. 전체 노드·매개변수의 정확식은 원본 결과 JSON에 있습니다. ID의 간격·크기는 물리적 의미를 갖지 않습니다.');
  return panel;
}

/** The parent adapter supplies fresh editor/session/hash binding and merges the selected panel. */
export function actualGlobalPanels(job,options={}){
  if(!job?.result||options.currentEditorMatches===false)return [];
  if([job.status,job.result.status].some(s=>s!==undefined&&!['COMPLETED','PARTIAL'].includes(s)))return [];
  const d=job.result.results;
  if(job.request?.kind!=='ns.actual-global-source'||d?.schema!=='MathScope.ActualGlobalSourceConstruction/1')return [];
  if(!d.outerObservations||!d.reduction||!d.outerProgram||!d.modulationRemainder)return [];
  return [outerObservationPanel(d,options),reducedMomentsPanel(d,options),remainderPanel(d,options),outerProgramPanel(d,options)];
}
