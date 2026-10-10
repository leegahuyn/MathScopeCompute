/** Additive views of stored same-N3 construction data. No computation or job binding is changed. */
import {sampleIndices} from './observations.mjs';

const ROOT='result.results';
const COLORS=['#76e2cd','#ffd282','#99b8ff','#ceafff'];
const array=x=>Array.isArray(x)?x:[];
const limit=(x,fallback,max)=>Number.isSafeInteger(x)&&x>0?Math.min(x,max):fallback;
const finite=Number.isFinite;
const midpoint=b=>b[0]/2+b[1]/2;
const validInterval=b=>Array.isArray(b)&&b.length===2&&b.every(finite)&&b[0]<=b[1];
const axis=(label,type,sourceField,transform='identity')=>({label,type,sourceField,unit:'1',scale:'linear',transform,dataDimension:1,physicalDimension:0});
const cell=(value,sourcePath=null)=>({value,sourcePath});
const row=(sourcePath,...cells)=>({sourcePath,cells});
const safe=value=>typeof value==='number'&&!finite(value)?`미표시: ${String(value)}`:value===undefined?'미확정':Array.isArray(value)?value.map(safe):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,safe(v)])):value;

function sourceTable(title,columns,records,options={}){
  const ix=sampleIndices(records.length,limit(options.maxRows,200,1000));
  return {title,columns,rows:ix.map(i=>records[i].cells.map(c=>safe(c.value))),sourcePaths:ix.map(i=>records[i].sourcePath),cellSourcePaths:ix.map(i=>records[i].cells.map(c=>c.sourcePath)),totalRows:records.length,truncated:ix.length<records.length,selection:'DETERMINISTIC_STORED_ROW_ORDER',exactValuesUnabridged:true,cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
}

function propertyTable(title,object,sourcePath,fields,options){
  return sourceTable(title,['원본 항목','값 또는 정확한 식'],fields.map(([key,label])=>row(sourcePath+'.'+key,cell(label),cell(object?.[key],sourcePath+'.'+key))),options);
}

function common(id,title,description,axes,observationKind,d){
  return {id,title,description,sourceRoot:ROOT,axisMetadata:axes,color:null,relatedTables:[],details:[],lostInformation:[],observation:{kind:observationKind,sourceProfileId:d.profileId??d.sourceProfile,sourceDimension:axes.length,sourceDimensionMeaning:'TYPED_STORED_SOURCE_ATTRIBUTES',displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,sourceScope:'ACTUAL_SAME_N3_RESTRICTED_CONSTRUCTION',globalOriginalCriteriaComplete:false}};
}

function intervalMark(record,prefix,index,label){
  const b=record.displayEnclosure;
  if(!validInterval(b))return null;
  const y=finite(record.value)&&record.value>=b[0]&&record.value<=b[1]?record.value:midpoint(b);
  if(!finite(y))return null;
  return {x:index,y,lower:b[0],upper:b[1],midpoint:y,label,sourceIndex:index,sourcePath:prefix+'.normalizedInterval',value:record.normalizedInterval,sourceValue:record.normalizedInterval,displayEnclosure:[...b],displaySourcePath:prefix+'.displayEnclosure',displayTransform:'MIDPOINT_OF_STORED_DIRECTED_DISPLAY_ENCLOSURE'};
}

function intervalPanel(id,title,description,records,axes,kind,d,table,options={}){
  const good=records.filter(Boolean),ix=sampleIndices(good.length,limit(options.maxPoints,4000,6000)),items=ix.map(i=>good[i]);
  return {...common(id,title,description,axes,kind,d),kind:'INTERVALS',chart:{kind:'INTERVALS',items},scene:{points:items.map(p=>({...p,pos:[p.x,p.y,0]})),lines:[],arrows:[],axes:[axes[0].label,axes[1].label,'display plane']},table,lod:{originalPoints:records.length,displayedPoints:items.length,invalidCoordinates:records.length-good.length,changesComputation:false,method:'DIRECTED_INTERVAL_MARKS_IN_STORED_SOURCE_ORDER'},lostInformation:['각 행은 자체 구간 척도를 사용합니다. 성분마다 다른 정규화이며, 행 사이의 길이나 간격은 물리 거리나 성분 크기의 비가 아닙니다.','그래프는 유한 표시 enclosure만 사용합니다. 정확한 유리수 끝점과 양의 기호 배율은 아래 표에 보존합니다.']};
}

/** Missing numerical marks split a connected series instead of bridging a gap. */
function seriesPanel(id,title,description,groups,axes,kind,d,table,options={}){
  const original=groups.reduce((n,s)=>n+s.points.length,0),segments=[];
  for(const s of groups){
    let run=[];
    const flush=()=>{if(run.length)segments.push({...s,points:run});run=[];};
    for(const p of s.points){if(p&&finite(p.x)&&finite(p.y))run.push({...p,value:p.sourceValue??p.value});else flush();}
    flush();
  }
  const valid=segments.reduce((n,s)=>n+s.points.length,0),selected=new Set(sampleIndices(valid,limit(options.maxPoints,4000,6000)));
  let offset=0;
  const series=segments.map(s=>({...s,points:s.points.filter(()=>selected.has(offset++))})).filter(s=>s.points.length);
  const points=series.flatMap(s=>s.points.map(p=>({...p,pos:[p.x,p.y,0],color:s.color,value:p.sourceValue??p.value,label:p.label||s.label})));
  return {...common(id,title,description,axes,kind,d),kind:'SERIES',chart:{kind:'SERIES',series,xLabel:axes[0].label,yLabel:axes[1].label},scene:{points,lines:[],arrows:[],axes:[axes[0].label,axes[1].label,'display plane']},table,lod:{originalPoints:original,displayedPoints:points.length,invalidCoordinates:original-valid,changesComputation:false,method:'DETERMINISTIC_STORED_MARK_ORDER',fullSourceRetained:true},lostInformation:['점은 저장된 원본 행에서 선택합니다. 표시 LOD는 계산 결과를 변경하지 않으며 전체 결과는 JSON에 보존됩니다.']};
}

function expressionText(value){
  if(value===null)return 'null';
  if(typeof value!=='object')return String(value);
  if(Array.isArray(value))return '['+value.map(expressionText).join(', ')+']';
  if('ref'in value)return value.ref;
  if('integer'in value)return String(value.integer);
  if(value.product)return value.product.map(expressionText).map(x=>'('+x+')').join(' × ');
  if(value.sum)return value.sum.map(expressionText).join(' + ');
  if(value.quotient)return '('+expressionText(value.quotient[0])+')/('+expressionText(value.quotient[1])+')';
  if(value.power)return '('+expressionText(value.power[0])+')^('+expressionText(value.power[1])+')';
  for(const key of ['exp','sqrt','ceil','log'])if(key in value)return key+'('+expressionText(value[key])+')';
  if(value.max)return 'max('+value.max.map(expressionText).join(', ')+')';
  return JSON.stringify(safe(value));
}

function tablePanel(id,title,description,table,sourceField,kind,d){
  const axes=[axis('원본 항목','CATEGORICAL_SOURCE_FIELD',sourceField),axis('식 또는 판정','EXACT_SOURCE_EXPRESSION',sourceField,'Exact expression text; no finite numerical evaluation is implied')];
  return {...common(id,title,description,axes,kind,d),kind:'TABLE',chart:{kind:'COMPARISON_TABLE',columns:['원본 항목','식·판정의 간결한 표시'],rows:table.rows.map(r=>[r[0],expressionText(r[1])]),sourcePaths:[...table.sourcePaths]},scene:{points:[],lines:[],arrows:[],axes:[]},table,lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:table.totalRows},lostInformation:['Canvas의 긴 식은 화면 폭에 맞게 축약됩니다. 완전한 식·유리수·판정은 아래 정확표와 JSON에 보존됩니다.']};
}

function backgroundPanels(d,options){
  const a=d.axisObservations,ap=ROOT+'.axisObservations',samples=array(a?.samples);
  const axisTable=sourceTable('실제 n=1 축 도함수 · 정확한 유리수 구간',['성분','정규화된 원본 양','정확 하한','정확 상한','표시 enclosure','복원 식'],samples.map((s,i)=>{const p=ap+'.samples['+i+']';return row(p,cell(s.component,p+'.component'),cell(s.quantity,p+'.quantity'),cell(s.normalizedInterval?.lower,p+'.normalizedInterval.lower'),cell(s.normalizedInterval?.upper,p+'.normalizedInterval.upper'),cell(s.displayEnclosure,p+'.displayEnclosure'),cell(s.restoration,p+'.restoration'));}),options);
  const main=intervalPanel('main','실제 N3 · n=1 축 도함수의 세 구간','X=0, η=0에서 새로 구성한 첫 radial 도함수입니다. 세 성분은 서로 다른 배율로 정규화했으며 연결선 없이 개별 구간으로 표시합니다. 유한한 반경의 장 값은 다음 관측 패널에서 별도로 확인합니다.',samples.map((s,i)=>intervalMark(s,ap+'.samples['+i+']',i,s.component+'′ norm')),[axis('독립 성분 행','CATEGORICAL_COMPONENT',ap+'.samples[*].component'),axis('정규화 도함수의 유한 enclosure','NORMALIZED_AXIS_DERIVATIVE_INTERVAL',ap+'.samples[*].normalizedInterval','Stored directed enclosure; exact rational endpoints retained')],'ACTUAL_N1_AXIS_DERIVATIVE_INTERVALS',d,axisTable,options);
  main.details.push({title:'축 관측의 실제 source 범위',value:a?.scope,sourcePath:ap+'.scope'},{title:'사용한 원본 입력',value:a?.sourceInputs,sourcePath:ap+'.sourceInputs'});

  const b=d.pointEnclosures,bp=ROOT+'.pointEnclosures',ps=array(b?.samples),components=[...new Set(ps.map(s=>s.component))];
  const groups=components.map((component,k)=>({label:component+' / 원본 정규화',color:COLORS[k%COLORS.length],dash:k?[5,3]:[],connect:false,points:ps.map((s,i)=>({s,i})).filter(x=>x.s.component===component).map(({s,i})=>{const p=intervalMark(s,bp+'.samples['+i+']',i,component+' · '+s.XExact);return p&&{...p,x:s.radialIndex,xSourcePath:bp+'.samples['+i+'].radialIndex',sourceRadiusPath:bp+'.samples['+i+'].XExact'};})}));
  const pointTable=sourceTable('15개 실제 양의 반경 · 정규화 차분몫의 정확한 enclosure',['성분','i','양의 X_i 정확식','log X_i 식','정규화된 차분몫','정확 하한','정확 상한','해석적 나머지 상계'],ps.map((s,i)=>{const p=bp+'.samples['+i+']';return row(p,cell(s.component,p+'.component'),cell(s.radialIndex,p+'.radialIndex'),cell(s.XExact,p+'.XExact'),cell(s.XLogExpression,p+'.XLogExpression'),cell(s.quantity,p+'.quantity'),cell(s.normalizedInterval?.lower,p+'.normalizedInterval.lower'),cell(s.normalizedInterval?.upper,p+'.normalizedInterval.upper'),cell(s.analyticRemainderUpperExact,p+'.analyticRemainderUpperExact'));}),options);
  const points=seriesPanel('actual-core-points','실제 N3 · 양의 반경에서의 1차 차분몫','가로축 i는 X_i=i·observationXUnit의 원본 배수이며 물리 반경을 Float64로 표시한 축이 아닙니다. 각 점은 실제 양의 반경에서의 정규화 차분몫 enclosure 중심입니다. locationScaleBits='+b?.locationScaleBits+'이며 bits를 바꾸면 관측 위치 자체가 바뀝니다. 같은 점의 정밀도 정련이나 물리 잔차 감소 검사가 아닙니다.',groups,[axis('양의 원본 반경의 배수 i','CATEGORICAL_SOURCE_RADIUS_INDEX',bp+'.samples[*].radialIndex'),axis('정규화 차분몫 · enclosure 중심','NORMALIZED_ACTUAL_DIFFERENCE_QUOTIENT',bp+'.samples[*].normalizedInterval','Midpoint of the stored directed enclosure, not a raw field value')],'ACTUAL_N1_POSITIVE_RADIUS_DIFFERENCE_QUOTIENTS',d,pointTable,options);
  points.observation={...points.observation,locationScaleBits:b?.locationScaleBits,precisionChangesObservationPoint:true,fixedPointRefinement:false,rawFunctionValueDisplayed:false,positiveRadiusNotReplacedByZero:true};
  points.details.push({title:'양의 반경과 관측 단위의 정확한 정의',value:{domain:b?.domain,derivedExpressions:b?.derivedExpressions},sourcePath:bp},{title:'관측의 인증 범위',value:b?.scope,sourcePath:bp+'.scope'});
  points.lostInformation.push('세 성분의 정규화는 각각 다릅니다. 표시 중심을 원본 장의 정확값이나 미계산 구간의 보간값으로 사용하지 않습니다.');

  const m=d.moments?.imeanOmissionControl,mp=ROOT+'.moments.imeanOmissionControl',ms=array(m?.normalizedContributions);
  const momentTable=sourceTable('원본 Imean에서 실제로 남는 두 모멘트 기여',['모멘트','정규화된 원본 양','정확식','정확 하한','정확 상한','복원 식'],ms.map((s,i)=>{const p=mp+'.normalizedContributions['+i+']';return row(p,cell(s.moment,p+'.moment'),cell(s.quantity,p+'.quantity'),cell(s.exact,p+'.exact'),cell(s.normalizedInterval?.lower,p+'.normalizedInterval.lower'),cell(s.normalizedInterval?.upper,p+'.normalizedInterval.upper'),cell(s.unnormalized,p+'.unnormalized'));}),options);
  const moments=intervalPanel('actual-moment-contributions','실제 Imean · 0이 아닌 두 모멘트 기여','원래 N3의 Imean 구간에서 pressure debt와 flux debt에 실제로 남는 기여입니다. 각각 1−exp(−5), −5/4로 정규화되며 서로 다른 배율을 씁니다. 전체 모멘트 debt나 보정 계수가 완성되었다는 뜻은 아닙니다.',ms.map((s,i)=>intervalMark(s,mp+'.normalizedContributions['+i+']',i,s.moment+' norm')),[axis('독립 모멘트 행','CATEGORICAL_MOMENT_FUNCTIONAL',mp+'.normalizedContributions[*].moment'),axis('정규화된 국소 기여 구간','NORMALIZED_ACTUAL_MOMENT_CONTRIBUTION',mp+'.normalizedContributions[*].normalizedInterval','Stored directed enclosure; normalization differs by row')],'ACTUAL_IMEAN_MOMENT_CONTRIBUTIONS',d,momentTable,options);
  moments.details.push({title:'실제 비영 radial moment와 빠뜨림 대조',value:{sourceFields:m?.sourceFields,exactOmega:m?.exactOmega,exactPressureDerivative:m?.exactPressureDerivative,negativeControl:m?.negativeControl,scope:m?.scope},sourcePath:mp});
  moments.relatedTables.push(propertyTable('전체 모멘트 조립에 남는 입력',d.moments,ROOT+'.moments',[['missingComputationalPrimitives','남은 실제 전역 evaluator·적분'],['scope','원래 N4 완료 판정']],options));

  const p=ROOT+'.majorant',c=d.majorant,constants=Object.entries(c?.derivedConstants||{});
  const majorTable=sourceTable('같은 N3에서 도출한 공통 구간·strip·Picard 상계',['원본 항목','값 또는 정확한 식'],[
    ...constants.map(([k,v])=>row(p+'.derivedConstants.'+k,cell(k),cell(v,p+'.derivedConstants.'+k))),
    row(p+'.commonInterval',cell('commonInterval'),cell(c?.commonInterval,p+'.commonInterval')),
    row(p+'.analyticStrip',cell('analyticStrip'),cell(c?.analyticStrip,p+'.analyticStrip')),
    row(p+'.picard.tailUpperExact',cell('Picard tail upper'),cell(c?.picard?.tailUpperExact,p+'.picard.tailUpperExact')),
    row(p+'.picard.truncationActuallyEvaluated',cell('실제 K개 합 수치 실행'),cell(c?.picard?.truncationActuallyEvaluated,p+'.picard.truncationActuallyEvaluated')),
  ],options);
  const majorant=tablePanel('actual-background-majorant','실제 공통 collar · Picard 상계와 실행 범위','원본의 공통 collar와 η strip을 유지하며 실제 C1과 수렴 tail을 식으로 도출했습니다. 거대한 유한 K를 수치 실행한 결과나 전역 모멘트 보정의 완료로 바꾸지 않습니다.',majorTable,p,'ACTUAL_BACKGROUND_MAJORANT_EXPRESSIONS',d);
  majorant.relatedTables.push(propertyTable('실제 배경장 구성의 현재 범위',c,p,[['scope','같은 profile의 도출·실행 범위'],['certificateType','근거 유형']],options));
  majorant.details.push({title:'C1과 Picard tail을 도출한 원본 단계',value:c?.derivation,sourcePath:p+'.derivation'},{title:'다음 차수에 앞서 남는 실제 구성',value:d.remaining,sourcePath:ROOT+'.remaining'});
  return [main,points,moments,majorant];
}

function jetPanel(d,key,label,id,color,scaleKey,options){
  const j=d.meanPatch,jp=ROOT+'.meanPatch',rs=array(j?.jets),root=jp+'.jets',levels=[['lower',0,'하한'],['midpoint',null,'중심'],['upper',1,'상한']];
  const groups=levels.map(([name,end,legend],k)=>({label:label+' '+legend,color,dash:k===1?[]:[5,3],connect:false,points:rs.map((r,i)=>{const b=r[key];if(!validInterval(b))return null;const y=end===null?midpoint(b):b[end];return {x:i,y,label:label+' · D^('+r.multiIndex.join(',')+') '+legend,sourceIndex:i,sourceValue:b,sourcePath:root+'['+i+'].'+key,sourceMultiIndexPath:root+'['+i+'].multiIndex',displayTransform:end===null?'MIDPOINT_OF_STORED_OUTWARD_INTERVAL':'STORED_OUTWARD_INTERVAL_'+name.toUpperCase(),interval:[...b]};})}));
  const table=sourceTable(label+' · 각 slow 도함수의 원본 구간',['미분 multiindex (rhoR,Z,T)','정규화 하한','정규화 상한','R 도함수의 복원 배율'],rs.map((r,i)=>{const p=root+'['+i+']';return row(p,cell(r.multiIndex,p+'.multiIndex'),cell(r[key]?.[0],p+'.'+key+'[0]'),cell(r[key]?.[1],p+'.'+key+'[1]'),scaleKey?cell(r[scaleKey],p+'.'+scaleKey):cell('G=0 exactly'));}),options);
  const panel=seriesPanel(id,'실제 Imean · '+label+' slow 도함수',label==='G'?'원본 Imean의 G는 정확히 0입니다. 모든 반환된 slow 도함수의 [0,0] 구간을 표시합니다.':'원본 Imean 장을 Q가 고정된 band chart의 일반 좌표 (rhoR,Z,T_chart)에서 미분한 실제 구간입니다. 각 도함수의 하한·중심·상한을 개별 점으로 표시하며 미분 행 사이를 연결하지 않습니다. 양의 복원 배율은 기호식으로 보존합니다.',groups,[axis('저장된 미분 행 순서 · multiindex는 표에 표시','DERIVATIVE_MULTIINDEX_ROW_ORDER',root+'[*].multiIndex','Enumerate stored derivative rows; spacing is not a physical coordinate'),axis(label+' 정규화 도함수 구간','NORMALIZED_ACTUAL_SLOW_DERIVATIVE_INTERVAL',root+'[*].'+key,'Stored outward lower endpoint, midpoint and upper endpoint')],'ACTUAL_MEAN_PATCH_'+label.replace(/[^A-Za-z]/g,'').toUpperCase()+'_JETS',d,table,options);
  panel.observation={...panel.observation,coordinateFrame:j?.coordinateFrame,restoredQuantitiesArePhysicalCartesian:false,slowJetOrder:j?.input?.order,normalizationIsComponentSpecific:true};
  panel.relatedTables.push(propertyTable('실제 관측점 · Q 고정 band chart',j,jp,[['input','y·η·s·미분 차수'],['coordinates','정규화 좌표와 정확한 X/R 식'],['exactScales','원본 장·정규화·복원 식'],['parameterEnclosures','실제 양의 h·lambda의 enclosure']],options));
  panel.details.push({title:'이 관측의 실제 source 범위',value:{coordinateFrame:j?.coordinateFrame,actualSourceRestriction:j?.actualSourceRestriction,globalCertification:j?.globalCertification,actualPulseIntegrated:j?.actualPulseIntegrated,restoredQuantitiesArePhysicalCartesian:j?.restoredQuantitiesArePhysicalCartesian},sourcePath:jp});
  panel.lostInformation.push('한 입력점의 서로 다른 미분량입니다. 행 번호를 따라 이동하는 공간 곡선이나 실제 pulse 진폭의 이력으로 해석하지 않습니다.');
  return panel;
}

function pulsePanels(d,options){
  const panels=[jetPanel(d,'normalizedFInterval','F','main',COLORS[0],'restoreFScale',options),jetPanel(d,'normalizedVInterval','V','actual-slow-v',COLORS[1],'restoreVScale',options),jetPanel(d,'normalizedRadialInterval','b','actual-slow-b',COLORS[2],'restoreRadialScale',options),jetPanel(d,'GInterval','G','actual-slow-g',COLORS[3],null,options)];
  const g=d.growingDatum,gp=ROOT+'.growingDatum',rs=array(g?.rows);
  const groups=[['normalizedLogPInterval','원문 기준 log P',COLORS[0],[]],['normalizedGaussianUpperInterval','기준 Gaussian 상계',COLORS[1],[7,4]]].map(([key,label,color,dash])=>({label,color,dash,connect:true,points:rs.map((r,i)=>{const b=r[key];if(!validInterval(b)||!finite(r.xi))return null;return {x:r.xi,y:midpoint(b),sourceValue:b,sourcePath:gp+'.rows['+i+'].'+key,xSourcePath:gp+'.rows['+i+'].xi',sourceIndex:i,label:label+' · v/L_s='+r.xi,displayTransform:'MIDPOINT_OF_STORED_OUTWARD_INTERVAL',interval:[...b]};})}));
  const table=sourceTable('원문 기준 로그곡선 · 실제 진폭 적분값과 구분',['v/L_s','기준 logP 하한','기준 logP 상한','Gaussian 상계 하한','Gaussian 상계 상한','정규화'],rs.map((r,i)=>{const p=gp+'.rows['+i+']';return row(p,cell(r.xi,p+'.xi'),cell(r.normalizedLogPInterval?.[0],p+'.normalizedLogPInterval[0]'),cell(r.normalizedLogPInterval?.[1],p+'.normalizedLogPInterval[1]'),cell(r.normalizedGaussianUpperInterval?.[0],p+'.normalizedGaussianUpperInterval[0]'),cell(r.normalizedGaussianUpperInterval?.[1],p+'.normalizedGaussianUpperInterval[1]'),cell(r.normalization,p+'.normalization'));}),options);
  const reference=seriesPanel('actual-reference-envelope','원문 왼쪽 datum · 정규화 기준 로그곡선','세로축은 u_star·log(P)/(lambda0·L_s)입니다. 실제 source의 고정 u_star와 원문 왼쪽 초기조건을 사용한 reference envelope이며 projected pulse 진폭을 수치 적분한 결과는 아닙니다. 양의 로그 배율과 초기 P(0)를 0으로 치환하지 않습니다.',groups,[axis('v/L_s','NORMALIZED_PULSE_COORDINATE',gp+'.rows[*].xi'),axis('u_star log(P)/(lambda0 L_s)','NORMALIZED_REFERENCE_LOG_ENVELOPE',gp+'.rows[*].normalizedLogPInterval','Stored normalized logarithmic interval midpoint; not an amplitude')],'NORMALIZED_REFERENCE_LOG_ENVELOPE',d,table,options);
  reference.observation={...reference.observation,referenceOnly:true,actualAmplitudePointValuesEvaluated:false,positiveLogScalePreserved:true};
  reference.relatedTables.push(propertyTable('원문 왼쪽 초기조건과 양의 로그 배율',g,gp,[['initial','v=0의 prescribed datum'],['frozenConeChoice','실제 방향 여유에서 선택한 u_star'],['scaledReferenceFormula','정규화 reference 식']],options));
  reference.lostInformation.push('선은 저장한 기준곡선 표본을 연결합니다. LOD에서 빠진 표본의 극값이나 실제 projected amplitude는 이 그림에서 복원할 수 없습니다.');
  panels.push(reference);

  const pp=ROOT+'.phaseBounds',cp=ROOT+'.growingComparison',ph=d.phaseBounds,co=d.growingComparison;
  const records=[row(pp+'.fixedM',cell('고정 majorant M'),cell(ph?.fixedM,pp+'.fixedM')),row(pp+'.threshold.ellLocalExact',cell('실제 국소 band threshold'),cell(ph?.threshold?.ellLocalExact,pp+'.threshold.ellLocalExact')),...array(ph?.budgets).map((b,i)=>row(pp+'.budgets['+i+']',cell(b.object,pp+'.budgets['+i+'].object'),cell(b.bound,pp+'.budgets['+i+'].bound'))),...['ratioBound','logComparison','actualValueGaussianUpper','actualRadialComparison','cutoffCollar'].map(key=>row(cp+'.'+key,cell(key),cell(co?.[key],cp+'.'+key)))];
  const bounds=tablePanel('actual-pulse-bounds','실제 Imean · 국소 phase와 성장 상계','실제 Imean의 normal, projection, frame 및 moving-frame 항을 모두 보존한 국소 상계입니다. 표의 기호상계는 수치 진폭의 표본이 아닙니다. 전체 annulus의 phase, 모든 slow 도함수 Gaussian, 실제 covariance 완료 판정은 별도로 남습니다.',sourceTable('원본 국소 비교상수와 성장 상계',['원본 항목','실제 상계식'],records,options),pp,'ACTUAL_MEAN_PATCH_LOCAL_PULSE_BOUNDS',d);
  bounds.relatedTables.push(propertyTable('국소 성장 비교의 실제 범위',co,cp,[['actualLocalValueComparisonProved','국소 값 비교'],['actualAmplitudeNumericallyIntegrated','진폭 수치 적분 실행'],['allSlowDerivativeGaussianBoundsCertified','모든 slow 도함수 Gaussian'],['globalN505Certified','원래 N5-05 전역 완료']],options),propertyTable('원래 전역 기준의 상태',d,ROOT,[['scope','전역 완료 판정'],['remaining','남은 실제 구성']],options));
  bounds.details.push({title:'국소 domain과 정확한 부등식 검사',value:{domain:ph?.domain,checks:ph?.checks},sourcePath:pp},{title:'실제 원문 phase의 행렬·비영 radial 항',value:d.phase,sourcePath:ROOT+'.phase'},{title:'원래 전역 기준의 입력과 출처',value:d.prerequisites,sourcePath:ROOT+'.prerequisites'});
  panels.push(bounds);
  return panels;
}

function picardAcceptancePanels(d,options){
  const [main,points,,majorant]=backgroundPanels(d,options);
  main.title='실제 n=1 Picard · 유한 합격과 축 관측';
  main.description='원래 N3 소스의 고정 차수 n=1을 검증한 실행입니다. 공통 collar·strip·C1·tail은 별도 패널에서 확인할 수 있으며, 이 화면의 세 행은 실제 축 도함수 구간입니다.';
  const checks=array(d.verification?.checks),vp=ROOT+'.verification.checks';
  const table=sourceTable('원래 N4-03 · 실행한 합격 검사',['원본 항목','검사 결과'],checks.map((c,i)=>{const p=vp+'['+i+']';return row(p,cell(c.id,p+'.id'),cell(c.pass,p+'.pass'));}),options);
  const certificate=tablePanel('actual-picard-certificate','N4-03 · 원문 기준과 15개 검사','원래 6성분 계, source binding, nilpotent 미분 block, 양의 strip, 공통 collar, finite K와 tail, 실제 관측을 검사합니다. 거대한 K항 수치 합산은 실행하지 않았다는 판정도 검사에 포함합니다.',table,ROOT+'.verification','ACTUAL_FIXED_ORDER_PICARD_ACCEPTANCE',d);
  certificate.relatedTables.push(propertyTable('원래 기준과 정확한 인증 범위',d,ROOT,[['criterion','원래 N4-03 기준'],['acceptance','개별 유한 합격'],['scope','실행한 범위'],['tailProof','finite K와 tail 증명']],options));
  const np=ROOT+'.normalizedSystem';
  const matrixRows=['A0','A1'].flatMap(k=>array(d.normalizedSystem?.[k]).map((r,i)=>{const p=np+'.'+k+'['+i+']';return row(p,cell(k+' row '+(i+1)),cell(r,p));}));
  certificate.relatedTables.push(sourceTable('정확한 6성분 정규화 연산자',['행','저장된 여섯 계수'],matrixRows,options));
  certificate.details.push({title:'실행한 원래 소스의 유한 recurrence',value:d.sourceJetWitness,sourcePath:ROOT+'.sourceJetWitness'},{title:'원본 입력 바이트 결속',value:d.sourceBindings,sourcePath:ROOT+'.sourceBindings'});
  const panels=[main,points,majorant,certificate];
  for(const panel of panels)panel.observation={...panel.observation,finiteCriterion:'N4-03',finiteCriterionComplete:d.acceptance?.status==='PASS',supportedBackgroundOrder:1,numericalKTermSumExecuted:false,globalOriginalCriteriaComplete:false};
  return panels;
}

function amplitudeSeries(d,options,id,title,description,fields,yLabel,kind){
  const rows=array(d.rows),rp=ROOT+'.rows';
  const groups=fields.map(([key,label],k)=>({label,color:COLORS[k%COLORS.length],dash:k?[5,3]:[],connect:true,points:rows.map((r,i)=>{const b=r[key];return validInterval(b)&&finite(r.pulseFraction)?{x:r.pulseFraction,y:midpoint(b),label:label+' · v/Ls='+r.pulseFraction,sourceIndex:i,sourceValue:b,sourcePath:rp+'['+i+'].'+key,xSourcePath:rp+'['+i+'].pulseFraction',interval:[...b],displayTransform:'MIDPOINT_OF_STORED_OUTWARD_INTERVAL'}:null;})}));
  const table=sourceTable(title+' · 보존된 전체 구간',['v/Ls',...fields.map(x=>x[1]+' [하한, 상한]')],rows.map((r,i)=>{const p=rp+'['+i+']';return row(p,cell(r.pulseFractionExact,p+'.pulseFractionExact'),...fields.map(([key])=>cell(r[key],p+'.'+key)));}),options);
  const panel=seriesPanel(id,title,description,groups,[axis('v/Ls · 원래 전체 pulse 구간','NORMALIZED_PULSE_COORDINATE',rp+'[*].pulseFraction'),axis(yLabel,'NORMALIZED_ACTUAL_PULSE_INTERVAL',rp+'[*]','Midpoint of stored source-bound interval; positive exact scales retained')],kind,d,table,options);
  panel.observation={...panel.observation,actualHomogeneousSolution:true,representative:d.request,originalLeftGrowingDatum:true,sourceReferenceUsedAsActualAmplitude:false,finiteCriteria:['N5-04','N5-05'],finiteCriteriaComplete:true,globalOriginalCriteriaComplete:false};
  panel.details.push({title:'원문 초기조건과 homogeneous 문제',value:d.initial,sourcePath:ROOT+'.initial'},{title:'실제 양의 원본 배율',value:d.sourceScales?.exact,sourcePath:ROOT+'.sourceScales.exact'},{title:'실행한 유한 영역',value:d.scope,sourcePath:ROOT+'.scope'});
  return panel;
}

function pulseAmplitudePanels(d,options){
  const main=amplitudeSeries(d,options,'main','실제 성장 펄스 · radial 진폭 / P','원래 왼쪽 성장 초기조건으로 구한 실제 homogeneous 진폭입니다. 양의 비교 전달로 전체 v 구간을 감싸며, 표시 점은 저장된 구간의 중심입니다. P는 기준 envelope이고 실제 진폭과 같지 않습니다. 중점 x/P는 약 0.353553입니다.',[['radialOverP','실제 x/P']],'actual x/P','ACTUAL_HOMOGENEOUS_RADIAL_AMPLITUDE');
  const components=amplitudeSeries(d,options,'actual-amplitude-components','실제 펄스 · 세 성분의 정규화 구간','각 성분은 표에 명시한 서로 다른 양의 원본 배율로 나눴습니다. 실제 tiny scale은 정확식으로 보존되므로 화면상의 성분 크기를 물리 벡터의 비로 읽으면 안 됩니다.',[['radialOverP','radial / P'],['thetaOverSqrtLambdaUStarP','theta / (sqrt(lambda) u* P)'],['zOverUStarP','axial / (u* P)']],'성분별 정규화 진폭','ACTUAL_HOMOGENEOUS_AMPLITUDE_COMPONENTS');
  const log=amplitudeSeries(d,options,'actual-amplitude-log','실제 로그 진폭 · 원문 reference와 양 끝 감소','자연로그를 원래 양의 Gscale로 나눈 값을 표시합니다. 기준 P만 중점에서 1로 정규화됩니다. 실제 진폭의 로그와 reference가 화면에서 겹쳐도 정확 구간은 별도로 보존합니다. underflow는 정확한 영 펄스가 아닙니다.',[['actualNormalizedLogRadial','log(actual radial)/Gscale'],['actualNormalizedLogNorm','log(actual norm)/Gscale'],['referenceNormalizedLogP','log(P)/Gscale']],'log amplitude / Gscale','ACTUAL_HOMOGENEOUS_LOG_AMPLITUDE');
  log.relatedTables.push(propertyTable('연속 구간 Gaussian 상계',d,ROOT,[['gaussian','샘플 사이를 포함한 전체 구간 상계'],['arithmetic','실제 진폭 interval 산술']],options));
  const energy=amplitudeSeries(d,options,'actual-amplitude-energy','실제 펄스 · 에너지와 원래 energy identity','저장된 |t|²/(P²u*²) 구간입니다. 원래 shear 교환·점성 소산·pressure 직교 항을 모두 유지한 (7.22)를 검증합니다. 곡선의 수치 미분으로 항등식을 대신하지 않습니다.',[['energyOverP2UStar2','|t|²/(P²u*²)']],'정규화 실제 에너지','ACTUAL_HOMOGENEOUS_ENERGY');
  energy.relatedTables.push(propertyTable('원래 에너지 항등식',d,ROOT,[['energy','shear·damping energy balance'],['reduction','실제 projected ODE의 환원']],options));
  const erp=ROOT+'.rows';
  energy.relatedTables.push(sourceTable('원래 energy derivative 구간',['v/Ls','(d_a |t|²)/(Gscale P²u*²)'],array(d.rows).map((r,i)=>{const p=erp+'['+i+']';return row(p,cell(r.pulseFractionExact,p+'.pulseFractionExact'),cell(r.energyDerivativeOverGScaleP2UStar2,p+'.energyDerivativeOverGScaleP2UStar2'));}),options));
  const normal=amplitudeSeries(d,options,'actual-amplitude-normal','실제 펄스 · 직교 제약의 수치 enclosure','0을 포함하는 정규화된 n·t의 검증 구간을 보존합니다. 중심선만으로 오차 폭을 판단하지 말고 아래 정확표의 양 끝점을 확인하세요. n·B=0의 원래 대수 항등식은 위상 패널에서 별도로 검사합니다.',[['orthogonalityResidualInterval','정규화 n·t enclosure']],'normal constraint enclosure','ACTUAL_HOMOGENEOUS_NORMAL_CONSTRAINT');
  const originalNormal=normal.chart.series[0];
  normal.chart.series=[originalNormal,...[0,1].map((end,j)=>({...originalNormal,label:end?'직교 구간 상한':'직교 구간 하한',color:COLORS[j+1],dash:[5,3],points:originalNormal.points.map(p=>({...p,y:p.interval[end],sourceValue:p.interval[end],value:p.interval[end],sourcePath:p.sourcePath+'['+end+']',displayTransform:'STORED_OUTWARD_INTERVAL_ENDPOINT'}))}))];
  normal.scene.points=normal.chart.series.flatMap(s=>s.points.map(p=>({...p,pos:[p.x,p.y,0],color:s.color,label:s.label})));
  normal.lod={...normal.lod,originalPoints:normal.scene.points.length,displayedPoints:normal.scene.points.length};
  const pp=ROOT+'.phaseProgram',sp=ROOT+'.sourceScales';
  const sourceRows=[...Object.entries(d.phaseProgram?.operatorCertificates||{}).map(([k,v])=>row(pp+'.operatorCertificates.'+k,cell(k),cell(v,pp+'.operatorCertificates.'+k))),...Object.entries(d.sourceScales?.exact||{}).map(([k,v])=>row(sp+'.exact.'+k,cell(k),cell(v,sp+'.exact.'+k)))];
  const phase=tablePanel('actual-amplitude-phase','실제 위상·편극 · 주파수·frame 하계','원래 Φ,n,K,AΦ,B,B′와 left inverse를 생성한 실행입니다. 인증된 대표점 이웃과 전체 pulse 구간의 denominator·frame·frequency 조건을 확인합니다. 양의 극소 배율 및 이산 carrier는 정확식으로 보존합니다.',sourceTable('실제 위상 조건과 고정 source scale',['원본 항목','정확식 또는 판정'],sourceRows,options),pp,'ACTUAL_SOURCE_PHASE_AND_FRAME_CERTIFICATE',d);
  phase.relatedTables.push(propertyTable('생성식과 인증 영역',d.phaseProgram,pp,[['domain','실제 식의 domain와 인증된 이웃'],['scope','위상 생성의 범위'],['fullPhysicalResidual','원래 pressure·phase defect와 남은 slow residual']],options),propertyTable('완성 배경의 실제 제한',d.sourceScales,sp,[['completedBackgroundRestriction','원전의 정확한 Imean restriction'],['bounds','실제 source-derived 비교 상계'],['checks','실행한 배율 검사']],options));
  phase.details.push({title:'명시적 source expression program',value:d.phaseProgram,sourcePath:pp},{title:'모든 comparison cell의 실제 기록',value:d.cells,sourcePath:ROOT+'.cells'},{title:'실행한 homogeneous 검사',value:d.checks,sourcePath:ROOT+'.checks'});
  return [main,components,log,energy,normal,phase];
}

function continuationIntervals(d,options,id,title,description,rows,path,kind){
  const records=rows.map((r,i)=>{
    const p=r.sourcePath||path+'['+i+']',ip=r.intervalPath||p+'.actualInterval',v=r.actualInterval,b=v?.displayEnclosure;
    return {r,p,ip,mark:validInterval(b)?{x:i,y:midpoint(b),lower:b[0],upper:b[1],midpoint:midpoint(b),label:r.label||r.id+' · eta '+r.etaDerivativeOrder,sourceIndex:i,sourcePath:ip,value:v,sourceValue:v,displayEnclosure:[...b],displaySourcePath:ip+'.displayEnclosure',displayTransform:'MIDPOINT_OF_STORED_DIRECTED_DISPLAY_ENCLOSURE'}:null};
  });
  const table=sourceTable(title+' · 정확한 구간',['항목','정확 하한','정확 상한','표시 enclosure'],records.map(({r,p,ip,mark})=>row(p,cell(r.label||r.quantity||r.id),cell(r.actualInterval?.lower,ip+'.lower'),cell(r.actualInterval?.upper,ip+'.upper'),cell(mark?.displayEnclosure,ip+'.displayEnclosure'))),options);
  return intervalPanel(id,title,description,records.map(x=>x.mark),[axis('독립 적분·성분 행','CATEGORICAL_SOURCE_QUANTITY',path),axis('원본 구간의 유한 enclosure','SOURCE_INTERVAL',path,'Stored directed enclosure; independent row scales')],kind,d,table,options);
}

function continuationPanels(d,options){
  const main=continuationIntervals(d,options,'main','실제 연장 구간 · U, M, V의 10개 구간','요청한 물리 X 구간 전체를 감싸는 실제 장의 enclosure입니다. η는 요청한 한 점에 고정됩니다. B.26/B.34/B.8과 C.12의 양의 오차를 유지하며, U=4η를 정확한 실제 장으로 대신하지 않습니다.',array(d.actualAxialCell?.rows),ROOT+'.actualAxialCell.rows','ACTUAL_AXIAL_CONTINUATION_CELL');
  main.relatedTables.push(propertyTable('실제 물리 구간과 오차',d.actualAxialCell,ROOT+'.actualAxialCell',[['request','정확 입력'],['domain','구간의 인증 범위'],['error','실제 양의 연장·modulation 오차'],['scope','실행한 범위']],options));
  const core=continuationIntervals(d,options,'actual-core-integrals','실제 core · 7개 전체 적분과 η 0–2차','0≤Y≤4의 실제 nonlinear core를 적분한 21개 구간입니다. 각 행의 양은 아래 표에 표시하며 j0 등 서로 다른 배율을 사용합니다. 유한 다항식 적분에 실제 Banach·비교 tail 오차를 더한 결과입니다.',array(d.coreMoments?.rows),ROOT+'.coreMoments.rows','ACTUAL_WHOLE_CORE_INTEGRALS');
  core.relatedTables.push(propertyTable('core 적분의 원래 배율과 실제 tail',d.coreMoments,ROOT+'.coreMoments',[['request','정확한 core 입력'],['restoration','실제 양의 배율과 복원식'],['errors','적분에 남긴 실제 source 오차'],['scope','core 적분의 범위']],options));
  const rp=ROOT+'.reference.regularIntegrals.values';
  const referenceRows=Object.entries(d.reference?.regularIntegrals?.values||{}).map(([id,actualInterval])=>({id,label:id,actualInterval,sourcePath:rp+'.'+id,intervalPath:rp+'.'+id}));
  const reference=continuationIntervals(d,options,'actual-reference-integrals','B.22 reference · 정규 적분 10개','실제 core의 primitive offset과 양의 t1 폭을 유지한 B.22 reference 적분입니다. 이 reference와 실제 shear-reduced 연장 장은 서로 다른 관측이며, 이 10개 값을 전체 실제 Ω debt로 사용하지 않습니다.',referenceRows,rp,'SOURCE_BOUND_B22_REFERENCE_INTEGRALS');
  reference.relatedTables.push(propertyTable('B.22 reference와 실제 장의 구분',d.reference,ROOT+'.reference',[['collar','양의 원래 cutoff 폭'],['domain','reference의 수학 영역과 실행한 구간'],['restoration','primitive 복원식'],['scope','reference 적분의 인증 범위']],options));
  const gp=ROOT+'.globalComparison';
  const comparison=tablePanel('actual-continuation-remainder','실제 전체 Ω · 남은 양의 적분 오차','완전히 전개한 A.2 함수와 실제 최종 소스의 차이를 양의 나머지로 감쌉니다. 정확한 전역 debt의 중심값과 source displacement를 아직 평가하지 않았으므로 이 오차를 0 또는 보정 계수로 사용하지 않습니다.',propertyTable('전체 weighted Ω remainder',d.globalComparison,gp,[['actualInnerBound','실제 inner 비교 상계'],['supportAndMass','원래 support와 mass 복원'],['weightedRemainder','전역 정규화 적분의 양의 remainder'],['scope','전역 적분과 남은 단계']],options),gp,'ACTUAL_GLOBAL_OMEGA_DISPLACEMENT_BOUND',d);
  comparison.relatedTables.push(propertyTable('차수 간 재사용 gate',d,ROOT,[['nextOrderGate','n+1 source 재사용 판정'],['remaining','남은 실제 producer와 복구']],options));
  const ap=ROOT+'.a2Program';
  const program=tablePanel('actual-continuation-program','A.2 원래 함수 · 적분과 근의 명시적 그래프','실제 원본 매개변수·적분 integrand·끝점·도함수·선택된 근으로 전개한 함수 정의입니다. 표의 root 번호는 저장된 expression graph의 시작점입니다. 거대한 지수의 수치 적분을 실행했다는 뜻은 아닙니다.',propertyTable('전개된 A.2 function program',d.a2Program,ap,[['construction','전개한 소스 단계'],['integration','적분 정의'],['roots','원본 field·moment root node'],['operations','사용한 명시적 연산'],['scope','함수 정의와 실제 평가 범위'],['numericalBarrier','남은 scaled 적분']],options),ap,'EXPLICIT_A2_AXIAL_FUNCTION_PROGRAM',d);
  program.details.push({title:'보존된 실제 소스의 모든 expression node',value:d.a2Program?.nodes,sourcePath:ap+'.nodes'});
  return [main,core,reference,comparison,program];
}

function covarianceIntervals(d,options,id,title,description,records,sourceRoot,kind){
  const marks=records.map((r,i)=>validInterval(r.interval)?{x:i,y:midpoint(r.interval),lower:r.interval[0],upper:r.interval[1],midpoint:midpoint(r.interval),label:r.label,sourceIndex:i,sourcePath:r.path,value:r.interval,sourceValue:r.interval,displayEnclosure:[...r.interval],displaySourcePath:r.path,displayTransform:'MIDPOINT_OF_STORED_OUTWARD_INTERVAL'}:null);
  const table=sourceTable(title+' · 원본 구간',['원본 항목','보존한 [하한, 상한]','정규화 또는 배율'],records.map(r=>row(r.path,cell(r.label),cell(r.interval,r.path),cell(r.normalization,r.normalizationPath||null))),options);
  return intervalPanel(id,title,description,marks,[axis('독립 원본 항목','CATEGORICAL_SOURCE_QUANTITY',sourceRoot),axis('성분별 정규화 구간','ACTUAL_SOURCE_INTERVAL',sourceRoot,'Stored normalized coefficient; positive physical scale retained')],kind,d,table,options);
}

function actualCovariancePanels(d,options){
  const mp=ROOT+'.localMatch',m=d.localMatch,cp=mp+'.pulseCovariance',c=m.pulseCovariance,sp=mp+'.meanStress',s=m.meanStress;
  const weights=covarianceIntervals(d,options,'main','실제 두 family · 양의 제곱 진폭','실제 pulse의 공분산과 같은 N3 소스의 열 보상 응력을 연결해 구한 두 양의 weight입니다. 실제 F 식과 요청점도 대조합니다. 세로값은 공통의 양의 물리 배율로 나눈 계수입니다.',array(m.rows).map((r,i)=>({label:r.sign,interval:r.normalizedSquaredAmplitude,path:mp+'.rows['+i+'].normalizedSquaredAmplitude',normalization:r.normalization,normalizationPath:mp+'.rows['+i+'].normalization'})),mp+'.rows','ACTUAL_POSITIVE_COVARIANCE_WEIGHTS');
  weights.relatedTables.push(propertyTable('원래 물리 배율과 실제 inverse',m.weights,mp+'.weights',[['sourceScale','양의 원본 배율'],['waveFormula','실제 wave 조립식'],['exactEquality','두 sign의 정확 weight 일치']],options),propertyTable('실제 source 결속 검사',m.bindings,mp+'.bindings',[['checks','재계산·같은 F·대표점·cone'],['sourceFCanonical','F의 정확식 비교'],['dataReplayExecuted','원본 receipt 재실행']],options));

  const integrals=covarianceIntervals(d,options,'actual-covariance-integrals','실제 공분산 · A, B와 양의 tail','중앙 Gaussian 좌표에서 실제 homogeneous solution의 곱을 적분하고, 전체 pulse의 생략 영역을 양의 tail 상계로 더했습니다. Gaussian 극한 적분값을 실제 source 값으로 대체하지 않습니다.',['A','B'].map(key=>({label:key,interval:c.integrals[key],path:cp+'.integrals.'+key,normalization:c.integrals['definition'+key],normalizationPath:cp+'.integrals.definition'+key})),cp+'.integrals','ACTUAL_FULL_PULSE_COVARIANCE_INTEGRALS');
  integrals.relatedTables.push(propertyTable('중앙 적분·전체 tail',c.integrals,cp+'.integrals',[['centralA','중앙 A'],['centralB','중앙 B'],['tail','양의 전체 tail enclosure']],options),propertyTable('실제 Gaussian 변수와 오차',c,cp,[['gaussian','실제 양의 delta와 변수'],['cutoffs','실제 χ·ψ 정의와 support']],options));

  const matrix=covarianceIntervals(d,options,'actual-covariance-matrix','실제 Hcov · 두 성분과 두 sign','실제 Hcov의 네 성분을 행별 물리 배율로 정규화했습니다. angular 성분의 양의 sqrt(lambda)는 별도 정확식으로 보존합니다. 두 axial 성분은 실제 sign 대칭으로 부호가 반대입니다.',array(c.covariance.normalizedMatrix).flatMap((r,i)=>r.map((interval,j)=>({label:c.covariance.rowOrder[i]+' / '+c.covariance.columnOrder[j],interval,path:cp+'.covariance.normalizedMatrix['+i+']['+j+']',normalization:c.covariance.normalization[i],normalizationPath:cp+'.covariance.normalization['+i+']'}))),cp+'.covariance.normalizedMatrix','ACTUAL_SOURCE_COVARIANCE_MATRIX');
  matrix.relatedTables.push(propertyTable('행렬의 실제 배율과 비영 determinant',c.covariance,cp+'.covariance',[['exactMatrix','원래 Hcov'],['common','공통 물리 배율'],['determinant','정확 determinant와 양의 하계'],['inverseFormula','두 성분의 역행렬']],options),propertyTable('Haar와 angular 평균',c,cp,[['haar','angular 1/2·Haar Jacobian'],['parity','같은 box의 두 sign']],options));

  const rp=cp+'.rows',densityRows=array(c.rows),densityFields=[['midpointThetaIntegrand','실제 radial × angular'],['midpointZIntegrand','실제 radial × axial +']];
  const densityGroups=densityFields.map(([key,label],j)=>({label,color:COLORS[j],dash:j?[5,3]:[],connect:true,points:densityRows.map((r,i)=>validInterval(r[key])?{x:r.wMidpoint,y:midpoint(r[key]),sourceIndex:i,label,sourceValue:r[key],sourcePath:rp+'['+i+'].'+key,xSourcePath:rp+'['+i+'].wMidpoint',displayTransform:'MIDPOINT_OF_STORED_ACTUAL_INTEGRAND_INTERVAL',interval:[...r[key]]}:null)}));
  const densityTable=sourceTable('실제 적분 cell · 전체 구간과 관측점',['w cell','w 중점','angular cell 구간','axial cell 구간','angular 중점 구간','axial 중점 구간'],densityRows.map((r,i)=>{const p=rp+'['+i+']';return row(p,...['wInterval','wMidpoint','thetaIntegrandBounds','zIntegrandBounds','midpointThetaIntegrand','midpointZIntegrand'].map(k=>cell(r[k],p+'.'+k)));}),options);
  const density=seriesPanel('actual-covariance-density','실제 pulse 곱 · Gaussian 좌표 적분','w=sqrt(Gscale)(a−1)에서 보존한 실제 진폭 곱의 중점 구간입니다. 선은 cell 중점의 관측이며, 실제 적분은 표에 보존한 모든 cell의 상·하한과 별도 양의 tail을 사용합니다.',densityGroups,[axis('w · 정규화 Gaussian 좌표','NORMALIZED_GAUSSIAN_COORDINATE',rp+'[*].wMidpoint'),axis('실제 진폭 곱의 정규화 integrand','NORMALIZED_ACTUAL_PULSE_PRODUCT',rp+'[*]','Midpoint of stored outward product enclosure')],'ACTUAL_SOURCE_COVARIANCE_INTEGRAND',d,densityTable,options);
  density.details.push({title:'원래 left datum부터의 전체 양의 전달',value:c.centerAmplitude,sourcePath:cp+'.centerAmplitude'});

  const stress=covarianceIntervals(d,options,'actual-covariance-target','실제 T0,* · 열 보상과 두 응력 성분','같은 원본의 완전한 moment restoration과 열 보상 적분으로 얻은 응력입니다. angular 열 보상은 엄밀히 양수입니다. η=0의 axial 값 0은 복구된 함수와 heat parity에서 얻은 정확한 값입니다.',array(s.rows).map((r,i)=>({label:r.component,interval:r.normalizedInterval,path:sp+'.rows['+i+'].normalizedInterval',normalization:'T0 / (F X lambda)'})),sp+'.rows','ACTUAL_HEAT_PREPARED_SOURCE_TARGET');
  stress.relatedTables.push(propertyTable('정확한 target 구간과 양의 열 보상',s,sp,[['normalizedTarget','정확 유리수 응력 구간'],['bounds','양의 heat lower·upper와 일곱 remainder'],['axialParity','같은 복구 함수의 정확 η parity'],['scope','실행한 target 영역']],options));
  stress.details.push({title:'원래 heat 적분과 target의 명시적 소스 프로그램',value:s.program,sourcePath:sp+'.program'});

  const tp=cp+'.transverseMass',t=c.transverseMass,cutoffRows=array(t.rows);
  const cutoffRecords=cutoffRows.map((r,i)=>{const p=tp+'.rows['+i+']';return row(p,cell(r.sInterval,p+'.sInterval'),cell(r.stepSquaredBounds,p+'.stepSquaredBounds'),cell(r.integralInterval,p+'.integralInterval'));});
  const cutoff=tablePanel('actual-covariance-cutoffs','실제 cutoff · 한 transverse 질량','원문에서 허용한 구체적인 smooth χ를 선택하고, 단조 source step의 제곱을 모든 cell에서 적분했습니다. transverse 적분은 한 번만 들어가며 angular 평균 1/2 및 c_i Ls=2r0를 함께 반영합니다.',propertyTable('실제 transverse cutoff와 전체 질량',t,tp,[['cutoff','구체적인 χ'],['normalizedMass','전체 질량 / r0'],['massInterval','전체 질량의 구간'],['exactMass','정확 적분식'],['oneTransverseCoordinate','transverse 적분 횟수'],['method','실행한 구간 적분']],options),tp,'ACTUAL_SINGLE_TRANSVERSE_CUTOFF_MASS',d);
  cutoff.relatedTables.push(sourceTable('source step² · 모든 적분 cell',['s cell','step² enclosure','cell integral'],cutoffRecords,options));

  const pp=ROOT+'.partition',partition=tablePanel('actual-covariance-partition','실제 활성 합 · 같은 box는 한 번','같은 원본 대표점에 고정한 실제 smooth product partition입니다. 여기서는 유일한 활성 band·slow box를 실행하고, 두 sign은 그 box의 내부 covariance에 포함합니다. 나머지 모든 정수 index가 support 밖임을 정확히 검사합니다.',propertyTable('선택한 실제 partition과 전체 활성 집합',d.partition,pp,[['origin','고정한 실제 원본 중심'],['mesh','원래 양의 mesh'],['physicalPoint','실제 물리 대표점'],['activeBands','활성 band'],['activeBoxes','활성 slow box'],['completeActiveSetProof','생략된 무한 index의 support 증명'],['scope','point 검증과 전영역 경계']],options),pp,'ACTUAL_COMPLETE_POINTWISE_ACTIVE_PARTITION',d);
  partition.relatedTables.push(propertyTable('전체 실수 좌표의 제곱 분할',d.partition,pp,[['allRealPartition','실제 smooth bump와 정규화'],['band','선택한 band와 q cutoff'],['activeShellMembership','실제 shell과 미인증 uniform q*']],options));
  partition.details.push({title:'두 원본 sign의 정확 phase와 검증',value:d.labels,sourcePath:ROOT+'.labels'});

  const identity=tablePanel('actual-covariance-identity','실제 공분산 일치 · 대표점의 (7.30)','같은 source 적분 A,B와 응력으로 역행렬을 풀고 양의 weight를 구했습니다. C(W0)=epsilon T0,*와 이 대표점의 모든 활성 항을 합한 물리 scale 항등식을 검증합니다. 다른 slow box나 전체 annulus 인증은 남아 있습니다.',propertyTable('대표점의 실제 물리 합과 원문 항등식',d.physicalIdentity,ROOT+'.physicalIdentity',[['exact','원래 (7.30)'],['finiteActiveSumAtThisPoint','실행한 모든 활성 항'],['normalizedResult','보존된 실제 응력 결과'],['positivePhysicalScale','양의 원래 물리 배율'],['exactResidual','같은 원본 식의 정확 잔차'],['qPower','epsilon과 q/Q 지수의 정확 소거'],['globalIdentityAtThisActualPointVerified','이 대표점의 원문 항등식']],options),ROOT+'.physicalIdentity','ACTUAL_SOURCE_LOCAL_AND_POINTWISE_COVARIANCE_IDENTITIES',d);
  identity.relatedTables.push(propertyTable('실제 local inverse와 전체 조건',m,mp,[['localIdentity','H y와 원래 stress'],['algebra','정확 Laurent 다항식 검사'],['checks','같은 source·양의 inverse 검사']],options),propertyTable('남은 원문 N5-06 범위',d,ROOT,[['scope','실행된 point와 미완료 전영역']],options));
  const panels=[weights,integrals,matrix,density,stress,cutoff,partition,identity];
  for(const p of panels){p.observation={...p.observation,actualCovarianceIntegral:true,actualSourceTarget:true,actualPositiveInverse:true,actualPointwiseEquation730:true,wholeAnnulusCovarianceMatched:false,sourceUniformQStarCertified:false,globalOriginalCriteriaComplete:false};p.details.push({title:'관측의 실제 요청과 source 범위',value:d.request,sourcePath:ROOT+'.request'});}
  return panels;
}

const rationalDisplay=value=>{
  if(typeof value!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(value))return NaN;
  const [n,den='1']=value.split('/');return Number(n)/Number(den);
};

function actualResidualPanels(d,options){
  const tp=ROOT+'.timeRows',times=array(d.timeRows);
  const timeTable=sourceTable('같은 q와 배경에서 비교한 실제 잔차의 하한·상한',['k','q의 정확식','N=0 norm 하한 ≥','N=1 norm 상한 ≤','norm 비율 상한 ≤','공통 양의 물리 배율'],times.map((r,i)=>{const p=tp+'['+i+']';return row(p,cell(r.k,p+'.k'),cell(r.qExactExpression,p+'.qExactExpression'),cell(r.N0NormLowerExact,p+'.N0NormLowerExact'),cell(r.N1NormUpperExact,p+'.N1NormUpperExact'),cell(r.actualNormRatioUpperExact,p+'.actualNormRatioUpperExact'),cell(r.commonPositivePhysicalScale,p+'.commonPositivePhysicalScale'));}),options);
  const groups=[['N0NormLowerExact','N=0 norm의 하한 ≥',COLORS[0],[]],['N1NormUpperExact','N=1 norm의 상한 ≤',COLORS[1],[6,3]]].map(([key,label,color,dash])=>({label,color,dash,connect:true,points:times.map((r,i)=>{const y=rationalDisplay(r[key]);return y>0&&finite(y)?{x:r.k,y:Math.log2(y),sourceValue:r[key],sourcePath:tp+'['+i+'].'+key,xSourcePath:tp+'['+i+'].k',sourceIndex:i,label:label+' '+r[key]+' · k='+r.k,displayTransform:'LOG2_OF_RETAINED_EXACT_ONE_SIDED_BOUND'}:null;})}));
  const main=seriesPanel('main','같은 배경 · N을 늘렸을 때의 잔차 감소','각 k에서 같은 q_k와 같은 고정 영역의 두 차수를 비교합니다. 녹색은 N=0 실제 norm의 하한, 노란색은 N=1 실제 norm의 상한입니다. 세로축은 공통 양의 배율 q_k^(−3/2)·S를 제거한 bound의 log₂이며 norm의 정확값이 아닙니다. k는 q 선택 지수입니다.',groups,[axis('고정 source q_k의 index k','SOURCE_Q_SELECTION_INDEX',tp+'[*].k'),axis('정규화 norm bound · log₂','LOG2_NORMALIZED_ACTUAL_RESIDUAL_BOUND',tp+'[*]','log2 of the stored exact one-sided bound; physical common scale retained per row')],'ACTUAL_FIXED_DOMAIN_ORDER_RESIDUAL_BOUNDS',d,timeTable,options);
  main.lostInformation.push('N=0은 평가한 실제 witness로 얻은 하한이고 N=1은 고정 영역 전체의 해석적 상한입니다. 선을 실제 norm의 수치 이력으로 읽지 않습니다.','다른 k 사이에는 물리 정규화 배율도 달라집니다. 같은 행 안에서의 N=0/1 비율과 표의 정확 부등식이 감소 판정의 근거입니다.');

  const rp=ROOT+'.pointRows',points=array(d.pointRows),atWitness=points.map((r,i)=>({r,i})).filter(({r})=>r.XMultiplierExact==='1');
  const pointTable=sourceTable('같은 양의 X에서의 실제 PDE 잔차 성분',['N','성분','X/Xunit','실제 X의 정확식','정규화된 원본 양','정확 하한','정확 상한','물리 복원 배율','해석 나머지 상계'],points.map((r,i)=>{const p=rp+'['+i+']';return row(p,cell(r.N,p+'.N'),cell(r.component,p+'.component'),cell(r.XMultiplierExact,p+'.XMultiplierExact'),cell(r.XExactExpression,p+'.XExactExpression'),cell(r.quantity,p+'.quantity'),cell(r.normalizedInterval?.lower,p+'.normalizedInterval.lower'),cell(r.normalizedInterval?.upper,p+'.normalizedInterval.upper'),cell(r.physicalScale,p+'.physicalScale'),cell(r.analyticRemainderUpperExact,p+'.analyticRemainderUpperExact'));}),options);
  const components=intervalPanel('actual-residual-components','실제 잔차 · 고정 양의 X에서의 여섯 성분','X=Xunit, η=0에서 N=0과 N=1의 θ·z·r 잔차를 표시합니다. 정확한 PDE 계수와 무한 Picard 해의 해석적 오차를 함께 보존합니다. 각 행의 물리 배율은 다르며, 이 그림의 행 길이가 N 증가의 잔차 감소를 판정하지 않습니다.',atWitness.map(({r,i},j)=>intervalMark(r,rp+'['+i+']',j,'N='+r.N+' '+r.component)),[axis('차수와 성분의 독립 행','RESIDUAL_ORDER_COMPONENT',rp+'[*].component'),axis('실제 정규화 잔차 enclosure','NORMALIZED_ACTUAL_RESIDUAL_INTERVAL',rp+'[*].normalizedInterval','Stored directed enclosure at one unchanged positive X')],'ACTUAL_FIXED_POSITIVE_POINT_RESIDUAL_COMPONENTS',d,pointTable,options);
  components.details.push({title:'양의 source 좌표·극소 파라미터·해석 오차',value:d.sourceErrorLedger,sourcePath:ROOT+'.sourceErrorLedger'});

  const mp=ROOT+'.refinement.meshes',meshes=array(d.refinement?.meshes);
  const meshTable=sourceTable('같은 영역에서 독립적으로 바꾼 격자',['격자','동일 영역과 witness'],meshes.map((r,i)=>{const p=mp+'['+i+']';return row(p,cell('mesh '+r.mesh),cell(r,p));}),options);
  const mesh=tablePanel('actual-residual-mesh','격자 정련 · 영역과 witness 유지','4·8·16·32개 양의 반경을 같은 영역에 놓습니다. Xunit의 정의와 η 영역, 실제 norm의 해석적 상계는 격자 수와 무관합니다. 유한 표본을 전체 영역 norm의 증명으로 사용하지 않습니다.',meshTable,mp,'ACTUAL_RESIDUAL_FIXED_DOMAIN_MESH_REFINEMENT',d);

  const pp=ROOT+'.refinement.precision',precisions=array(d.refinement?.precision);
  const precisionTable=sourceTable('동일 X와 고정 source 오차에서의 방향성 구간',['산술 bits','N','성분','정확 하한','정확 상한','고정 source 오차 bits'],precisions.flatMap((r,i)=>array(r.values).map((v,j)=>{const p=pp+'['+i+'].values['+j+']';return row(p,cell(r.bits,pp+'['+i+'].bits'),cell(v.N,p+'.N'),cell(v.component,p+'.component'),cell(v.normalizedInterval?.lower,p+'.normalizedInterval.lower'),cell(v.normalizedInterval?.upper,p+'.normalizedInterval.upper'),cell(r.analyticBudgetBits,pp+'['+i+'].analyticBudgetBits'));})),options);
  const precision=tablePanel('actual-residual-precision','산술 정밀도 · 같은 source 오차 바닥','96·128·192 bits와 요청한 bits에서 같은 양의 X의 유리수 구간을 방향성 반올림합니다. source에서 유도한 해석 오차는 160-bit 예산으로 고정됩니다. 산술 정밀도를 올려도 이 오차가 사라지거나 관측 위치가 바뀌지 않습니다.',precisionTable,pp,'ACTUAL_RESIDUAL_FIXED_POINT_ARITHMETIC_REFINEMENT',d);
  precision.chart.rows=precisions.map(r=>['bits '+r.bits,'같은 Xunit · source 오차 bits '+r.analyticBudgetBits+' · '+r.values.length+'개 성분 구간']);
  precision.chart.sourcePaths=precisions.map((_,i)=>pp+'['+i+']');

  const np=ROOT+'.sourceNorms',constants=array(d.sourceNorms?.derivativeConstants),cp=np+'.derivativeConstants';
  const constantsTable=sourceTable('실제 source에서 계산한 C_N,m와 K_m',['도함수 차수','정확 상수·지수 기록'],constants.map((r,i)=>{const p=cp+'['+i+']';return row(p,cell('m='+r.m),cell(r,p));}),options);
  const norms=tablePanel('actual-residual-constants','실제 C_N,m · 차수와 정련에 공통인 K_m','원래 여덟 잔차 계수의 해석적 norm을 합하고 공통 Cauchy 반경·원래 좌표의 chain rule을 적용한 양의 상수식입니다. 표시한 m에서 N=0,1에 공통인 K_m=2+m을 사용합니다. 거대한 상수는 0이나 유한 근삿값으로 대체하지 않습니다.',constantsTable,cp,'ACTUAL_RESIDUAL_COMPUTED_CN_M_AND_K_M',d);
  norms.chart.rows=constants.map(r=>['m='+r.m,'K_m='+r.Km+'; C_N,m='+r.formula]);
  norms.relatedTables.push(propertyTable('실제 Cauchy domain과 상수 도출',d.sourceNorms,np,[['analyticDomain','복소 domain과 고정 실수 compact'],['budgetRules','실행한 연산·미분 예산'],['scope','유한 차수와 실제 source 범위']],options));
  norms.details.push({title:'실제 상수의 정확한 양의 식과 계수별 norm',value:d.sourceNorms?.positiveNormGraph,sourcePath:np+'.positiveNormGraph'});

  const domainTable=propertyTable('정련과 q에 독립인 원래 source 영역',d.domain,ROOT+'.domain',[['id','같은 관측 영역'],['XExact','고정 radial 구간'],['etaExact','원래 η 구간'],['sourceNaturalCoreEnd','원래 수정 전 core 끝'],['CauchyRadius','공통 Cauchy 반경'],['fixedForAllNMeshPrecisionAndQ','N·mesh·bits·q 사이의 영역 고정'],['physicalSpaceChangesWithQByOriginalSimilarityMap','원래 similarity map의 물리 좌표'],['wholeProfile','전체 profile 검증']],options);
  const domain=tablePanel('actual-residual-domain','고정된 core · 원래 배경과의 관계','실제 source의 상수만으로 한 번 정한 매우 작은 양의 core compact입니다. 같은 source에서 차수·정밀도·격자·q를 바꿔도 Xunit과 η 영역을 유지합니다. 원래 좌표식 τ=q(1−η²), z=q^Dη에 따라 각 q의 supremum은 시공간 집합 전체에서 취합니다. 전체 profile 검증 범위는 별도로 남습니다.',domainTable,ROOT+'.domain','ACTUAL_UNCHANGED_CORE_FIXED_RESIDUAL_DOMAIN',d);
  domain.relatedTables.push(propertyTable('고정 양의 반경과 물리 배율의 정확식',d.exactExpressions,ROOT+'.exactExpressions',[['residualXUnit','고정 양의 Xunit'],['residualXMax','고정 radial 끝'],['residualWitnessScale','공통 양의 witness 배율']],options));

  const ap=ROOT+'.axisIdentities',identities=Object.keys(d.axisIdentities||{});
  const algebra=tablePanel('actual-residual-pde','직접 PDE 잔차 · 압력과 비영 항 보존','원문 (5.24)의 잔차에 같은 leading 해와 실제 n=1 계수를 대입했습니다. N=0 radial witness에는 실제 압력이 남고 N=1 axial 잔차의 첫 계수도 양수입니다. 유한 radial 계수 검사와 무한 source 해의 구간 인증을 구별합니다.',propertyTable('실제 source에서 얻은 축 계수 항등식',d.axisIdentities,ap,identities.map(k=>[k,k]),options),ap,'ACTUAL_PDE_RESIDUAL_AND_NONZERO_AXIS_IDENTITIES',d);
  algebra.details.push({title:'직접 잔차의 원문 식·source 결속·유한 계수 경계',value:d.residualProgram,sourcePath:ROOT+'.residualProgram'});

  const panels=[main,components,mesh,precision,norms,domain,algebra];
  for(const p of panels){p.observation={...p.observation,actualSourceResidual:true,actualNormBoundsNotExactNormValues:true,domainFixedAcrossOrderMeshAndPrecision:true,positivePhysicalCoordinatesRetained:true,actualCNmAndKmComputed:true,wholeProfileResidualComplete:false,allOrdersComplete:false};p.details.push({title:'실제 잔차의 요청과 적용 범위',value:{request:d.request,scope:d.scope,acceptanceBoundary:d.acceptanceBoundary},sourcePath:ROOT});}
  return panels;
}

/** Parent makeM2Visualization supplies current editor/job/hash state before merging one panel. */
export function actualSourcePanels(job,options={}){
  if(!job?.result||options.currentEditorMatches===false)return [];
  if([job.status,job.result.status].some(s=>['FAILED','UNSUPPORTED','CANCELLED','BUDGET_EXCEEDED','PRECISION_REQUIRED'].includes(s)))return [];
  const d=job.result.results,kind=job.request?.kind;
  if(kind==='ns.actual-background'&&d?.schema==='MathScope.ActualBackgroundConstruction/1')return backgroundPanels(d,options);
  if(kind==='ns.actual-picard-acceptance'&&d?.schema==='MathScope.ActualFixedOrderPicardAcceptance/1')return picardAcceptancePanels(d,options);
  if(kind==='ns.actual-pulse-amplitude'&&d?.schema==='MathScope.ActualMeanPulseAmplitude/1')return pulseAmplitudePanels(d,options);
  if(kind==='ns.actual-covariance-matching'&&d?.schema==='MathScope.ActualPulsePointwiseAssembly/1')return actualCovariancePanels(d,options);
  if(kind==='ns.actual-residual-order'&&d?.schema==='MathScope.ActualFixedCoreResidualCertificate/1')return actualResidualPanels(d,options);
  if(kind==='ns.actual-continuation'&&d?.schema==='MathScope.ActualContinuationConstruction/1')return continuationPanels(d,options);
  if(kind==='ns.actual-mean-pulse'&&d?.schema==='MathScope.ActualMeanPatchPulseConstruction/1')return pulsePanels(d,options);
  return [];
}
