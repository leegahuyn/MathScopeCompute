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
  return {id,title,description,sourceRoot:ROOT,axisMetadata:axes,color:null,relatedTables:[],details:[],lostInformation:[],observation:{kind:observationKind,sourceProfileId:d.profileId,sourceDimension:axes.length,sourceDimensionMeaning:'TYPED_STORED_SOURCE_ATTRIBUTES',displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,sourceScope:'ACTUAL_SAME_N3_RESTRICTED_CONSTRUCTION',globalOriginalCriteriaComplete:false}};
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

/** Parent makeM2Visualization supplies current editor/job/hash state before merging one panel. */
export function actualSourcePanels(job,options={}){
  if(!job?.result||options.currentEditorMatches===false)return [];
  if([job.status,job.result.status].some(s=>['FAILED','UNSUPPORTED','CANCELLED','BUDGET_EXCEEDED','PRECISION_REQUIRED'].includes(s)))return [];
  const d=job.result.results,kind=job.request?.kind;
  if(kind==='ns.actual-background'&&d?.schema==='MathScope.ActualBackgroundConstruction/1')return backgroundPanels(d,options);
  if(kind==='ns.actual-picard-acceptance'&&d?.schema==='MathScope.ActualFixedOrderPicardAcceptance/1')return picardAcceptancePanels(d,options);
  if(kind==='ns.actual-pulse-amplitude'&&d?.schema==='MathScope.ActualMeanPulseAmplitude/1')return pulseAmplitudePanels(d,options);
  if(kind==='ns.actual-continuation'&&d?.schema==='MathScope.ActualContinuationConstruction/1')return continuationPanels(d,options);
  if(kind==='ns.actual-mean-pulse'&&d?.schema==='MathScope.ActualMeanPatchPulseConstruction/1')return pulsePanels(d,options);
  return [];
}
