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

/** Parent makeM2Visualization supplies current editor/job/hash state before merging one panel. */
export function actualSourcePanels(job,options={}){
  if(!job?.result||options.currentEditorMatches===false)return [];
  if([job.status,job.result.status].some(s=>['FAILED','UNSUPPORTED','CANCELLED','BUDGET_EXCEEDED','PRECISION_REQUIRED'].includes(s)))return [];
  const d=job.result.results,kind=job.request?.kind;
  if(kind==='ns.actual-background'&&d?.schema==='MathScope.ActualBackgroundConstruction/1')return backgroundPanels(d,options);
  if(kind==='ns.actual-mean-pulse'&&d?.schema==='MathScope.ActualMeanPatchPulseConstruction/1')return pulsePanels(d,options);
  return [];
}
