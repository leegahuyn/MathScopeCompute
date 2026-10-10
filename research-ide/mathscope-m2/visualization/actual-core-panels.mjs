/** Views of the actual leading-core point; all values come from the stored result. */
import {sampleIndices} from './observations.mjs';

const ROOT='result.results',COLORS=['#76e2cd','#ffd282','#99b8ff','#ceafff'];
const limit=(v,f,max)=>Number.isSafeInteger(v)&&v>0?Math.min(v,max):f;
const valid=b=>Array.isArray(b)&&b.length===2&&b.every(Number.isFinite)&&b[0]<=b[1];
const axis=(label,type,sourceField,transform='identity')=>({label,type,sourceField,unit:'1',scale:'linear',transform,dataDimension:1,physicalDimension:0});
const safe=x=>typeof x==='number'&&!Number.isFinite(x)?'미표시: '+String(x):x===undefined?'미확정':Array.isArray(x)?x.map(safe):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,safe(v)])):x;
const cell=(value,path=null)=>({value,path});
const row=(path,...cells)=>({path,cells});

function table(title,columns,records,options={}){
  const ix=sampleIndices(records.length,limit(options.maxRows,200,1000));
  return {title,columns,rows:ix.map(i=>records[i].cells.map(c=>safe(c.value))),sourcePaths:ix.map(i=>records[i].path),cellSourcePaths:ix.map(i=>records[i].cells.map(c=>c.path)),totalRows:records.length,truncated:ix.length<records.length,exactValuesUnabridged:true,selection:'DETERMINISTIC_STORED_ROW_ORDER',cellLayout:{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}};
}
function properties(title,data,root,fields,options){
  return table(title,['원본 항목','값·식·인증 범위'],fields.map(([key,label])=>row(root+'.'+key,cell(label),cell(data[key],root+'.'+key))),options);
}
function common(id,title,description,d,axes){
  return {id,title,description,sourceRoot:ROOT,axisMetadata:axes,color:null,relatedTables:[],details:[],lostInformation:[],observation:{kind:'ACTUAL_NONLINEAR_CORE_POINT',sourceProfileId:d.profileId,sourceDimension:axes.length,sourceDimensionMeaning:'STORED_DERIVATIVES_AT_ONE_EXACT_SOURCE_POINT',displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,globalOriginalCriteriaComplete:false,actualNonlinearErrorRetained:true,physicalCollarEvaluated:false}};
}
function mark(enclosure,path,index,label,color){
  const b=enclosure?.displayEnclosure;if(!valid(b))return null;
  const y=b[0]/2+b[1]/2;if(!Number.isFinite(y))return null;
  return {x:index,y,midpoint:y,lower:b[0],upper:b[1],label,color,sourceIndex:index,value:enclosure,sourceValue:enclosure,sourcePath:path,displayEnclosure:[...b],displaySourcePath:path+'.displayEnclosure',displayTransform:'MIDPOINT_OF_STORED_OUTWARD_DISPLAY_ENCLOSURE'};
}
function intervals(id,title,description,d,records,axes,exactTable,options){
  const good=records.filter(Boolean),ix=sampleIndices(good.length,limit(options.maxPoints,4000,6000)),items=ix.map(i=>good[i]);
  return {...common(id,title,description,d,axes),kind:'INTERVALS',chart:{kind:'INTERVALS',items},scene:{points:items.map(p=>({...p,pos:[p.x,p.y,0]})),lines:[],arrows:[],axes:[axes[0].label,axes[1].label,'display plane']},table:exactTable,lod:{originalPoints:records.length,displayedPoints:items.length,invalidCoordinates:records.length-good.length,changesComputation:false,method:'STORED_DIRECTED_INTERVALS',fullSourceRetained:true},lostInformation:['서로 다른 미분량을 개별 구간으로 표시합니다. 행 간 간격은 공간 거리나 시간 간격이 아닙니다.','표시 구간은 화면용 Float64 enclosure이며, 정확한 유리수 끝점과 양의 분석적 오차는 표와 JSON에 보존됩니다.']};
}

function phiPanel(d,options){
  const root=ROOT+'.phi.rows',rs=d.phi.rows;
  const t=table('실제 Φ · 정규화 혼합 도함수의 정확 구간',['Y 미분 차수','η 미분 차수','정규화된 원본 양','실제 하한','실제 상한','비교 다항식 구간','비교 급수 나머지 상계','실제 비선형 오차 상계','Φ의 X·η 미분 환산 배율'],rs.map((r,i)=>{const p=root+'['+i+']';return row(p,cell(r.YDerivativeOrder,p+'.YDerivativeOrder'),cell(r.normalizedEtaDerivativeOrder,p+'.normalizedEtaDerivativeOrder'),cell(r.quantity,p+'.quantity'),cell(r.actualNonlinearInterval.lower,p+'.actualNonlinearInterval.lower'),cell(r.actualNonlinearInterval.upper,p+'.actualNonlinearInterval.upper'),cell(r.comparisonPolynomial,p+'.comparisonPolynomial'),cell(r.comparisonRadialCauchyTailUpper,p+'.comparisonRadialCauchyTailUpper'),cell(r.positiveNonlinearErrorUpper,p+'.positiveNonlinearErrorUpper'),cell(r.restorePhysicalXDerivativeScale,p+'.restorePhysicalXDerivativeScale'));}),options);
  const p=intervals('main','실제 비선형 Φ · 입력점의 혼합 도함수','요청한 정확한 Y와 η에서 비교 급수를 다시 계산하고, 비교 급수 나머지와 실제 비선형 해의 오차를 모두 더한 구간입니다. η 미분은 j0^m 배율을 곱한 값이며 Y 미분은 물리 X 미분과 구분합니다.',d,rs.map((r,i)=>mark(r.actualNonlinearInterval,root+'['+i+'].actualNonlinearInterval',i,'∂Y^'+r.YDerivativeOrder+' · j0^'+r.normalizedEtaDerivativeOrder+' ∂η^'+r.normalizedEtaDerivativeOrder,COLORS[r.YDerivativeOrder%COLORS.length])),[axis('저장된 혼합 미분 행','DERIVATIVE_MULTIINDEX_ROW_ORDER',root+'[*].quantity','Stored mixed-derivative row index; not a physical coordinate'),axis('정규화된 실제 Φ 미분 구간','NORMALIZED_NONLINEAR_DERIVATIVE_INTERVAL',root+'[*].actualNonlinearInterval','Midpoint of directed display enclosure; exact interval retained')],t,options);
  p.relatedTables.push(properties('정확한 입력점과 실제 해의 정의역',d,ROOT,[['request','Y·η chart·차수·정밀도'],['coordinates','정확한 X·η 및 양의 배율'],['domain','원래 core와 자연 연장의 구분']],options));
  p.details.push({title:'비교용 복소 원판의 범위',value:d.phi.comparisonCircle,sourcePath:ROOT+'.phi.comparisonCircle'});
  return p;
}

function axialCorrectionPanel(d,options){
  const root=ROOT+'.axial.rows',rs=d.axial.rows,keys=[['uOverK','u/K'],['averageUCorrectionOverK','평균 u/K']];
  const t=table('실제 축방향 보정 · ordinary η 미분',['η 미분 차수','u/K 정확 하한','u/K 정확 상한','평균 u/K 정확 하한','평균 u/K 정확 상한','양의 비선형 오차 상계'],rs.map((r,i)=>{const p=root+'['+i+']';return row(p,cell(r.etaDerivativeOrder,p+'.etaDerivativeOrder'),cell(r.uOverK.lower,p+'.uOverK.lower'),cell(r.uOverK.upper,p+'.uOverK.upper'),cell(r.averageUCorrectionOverK.lower,p+'.averageUCorrectionOverK.lower'),cell(r.averageUCorrectionOverK.upper,p+'.averageUCorrectionOverK.upper'),cell(r.positiveNonlinearErrorUpper,p+'.positiveNonlinearErrorUpper'));}),options);
  const p=intervals('actual-core-axial-corrections','실제 u/K · 누적 평균의 η 도함수','실제 압력의 해석적 오차와 비선형 오차를 보존한 축방향 보정입니다. 이 패널의 η 미분은 ordinary 미분이며, Φ 패널의 j0^m 정규화와 다릅니다.',d,rs.flatMap((r,i)=>keys.map(([key,label],j)=>mark(r[key],root+'['+i+'].'+key,i*2+j,label+' · ∂η^'+r.etaDerivativeOrder,COLORS[j]))),[axis('보정량·η 도함수 행','COMPONENT_DERIVATIVE_ROW_ORDER',root+'[*].etaDerivativeOrder','2*stored derivative-row index + component index'),axis('K로 나눈 실제 보정 구간','NORMALIZED_AXIAL_CORRECTION_INTERVAL',root+'[*].uOverK','Stored outward display enclosure midpoint')],t,options);
  p.axisMetadata[1].sourceFields=keys.map(([key])=>root+'[*].'+key);
  p.relatedTables.push(properties('실제 U·M·V의 복원 관계',d.axial,ROOT+'.axial',[['reconstruction','양의 복원 배율과 M·V 관계'],['scope','점별 축방향 계산의 범위']],options));
  return p;
}

function axialValuePanel(d,options){
  const root=ROOT+'.axial.actualValues',rs=d.axial.actualValues,keys=[['U','U'],['averageU','평균 U']];
  const t=table('실제 U와 누적 평균 · 각 행의 배율',['η 미분 차수','정규화','U 정확 하한','U 정확 상한','평균 U 정확 하한','평균 U 정확 상한','양의 보정 배율'],rs.map((r,i)=>{const p=root+'['+i+']';return row(p,cell(r.etaDerivativeOrder,p+'.etaDerivativeOrder'),cell(r.normalization,p+'.normalization'),cell(r.U.lower,p+'.U.lower'),cell(r.U.upper,p+'.U.upper'),cell(r.averageU.lower,p+'.averageU.lower'),cell(r.averageU.upper,p+'.averageU.upper'),cell(r.positiveCorrectionScale,p+'.positiveCorrectionScale'));}),options);
  const p=intervals('actual-core-axial-values','실제 U · 누적 평균과 배율','선택한 η chart의 원본 U와 평균 U입니다. RHO_SCALED·J_SCALED chart의 0차 값만 j0로 나누며, DIRECT_RATIONAL chart와 1·2차 η 미분은 ordinary 배율입니다. 미소한 양의 보정 배율은 정확한 0으로 바꾸지 않습니다.',d,rs.flatMap((r,i)=>keys.map(([key,label],j)=>mark(r[key],root+'['+i+'].'+key,i*2+j,label+' · ∂η^'+r.etaDerivativeOrder,COLORS[j]))),[axis('장·η 도함수 행','COMPONENT_DERIVATIVE_ROW_ORDER',root+'[*].etaDerivativeOrder','2*stored derivative-row index + component index'),axis('행별 배율의 실제 U 구간','ROW_NORMALIZED_ACTUAL_AXIAL_FIELD',root+'[*].U','Stored outward display enclosure midpoint; each row retains its normalization')],t,options);
  p.axisMetadata[1].sourceFields=keys.map(([key])=>root+'[*].'+key);
  p.observation.normalizationIsRowSpecific=true;
  return p;
}

function pressurePanel(d,options){
  const pressure=d.axial.pressure,root=ROOT+'.axial.pressure.derivatives',rs=pressure.derivatives;
  const t=table('실제 A.21 압력 · P/K 구간',['ordinary η 미분 차수','정확 하한','정확 상한','추가한 해석적 오차 상계'],rs.map((r,i)=>{const p=root+'['+i+']';return row(p,cell(r.order,p+'.order'),cell(r.interval.lower,p+'.interval.lower'),cell(r.interval.upper,p+'.interval.upper'),cell(r.analyticErrorUpper,p+'.analyticErrorUpper'));}),options);
  const p=intervals('actual-core-pressure','실제 A.21 압력 · 정규화 도함수','P/K의 비교식에 실제 A.21 적분과의 해석적 오차를 더하고, η 미분의 Cauchy 손실을 유지한 구간입니다. 표에는 각 ordinary η 미분 차수와 그 오차를 함께 보존합니다.',d,rs.map((r,i)=>mark(r.interval,root+'['+i+'].interval',i,'∂η^'+r.order+' (P/K)',COLORS[i%COLORS.length])),[axis('ordinary η 미분 차수','DERIVATIVE_ORDER',root+'[*].order'),axis('실제 P/K 도함수 구간','NORMALIZED_ACTUAL_PRESSURE_INTERVAL',root+'[*].interval','Midpoint of outward display enclosure')],t,options);
  p.relatedTables.push(properties('압력 비교식과 실제 적분의 구분',pressure,ROOT+'.axial.pressure',[['model','비교식과 추가 오차'],['cPInterval','원래 압력 상수 구간'],['sourceApproximationIsActualPressure','비교식을 실제 압력과 동일시'],['actualPressureErrorRetained','실제 압력 오차 보존']],options));
  return p;
}

function scopePanel(d,options){
  const t=properties('실제 계산 범위와 원본 입력',d,ROOT,[['request','현재 정확 입력'],['coordinates','원본 좌표와 양의 배율'],['arithmetic','실행한 구간 산술'],['domain','원래 core·자연 연장·cutoff 적용'],['scope','실제 결과의 인증 범위'],['sourceBindings','고정 원본과 증거 해시']],options);
  const axes=[axis('원본 항목','CATEGORICAL_SOURCE_FIELD',ROOT+'.scope'),axis('정확 계약','SOURCE_CONTRACT',ROOT+'.scope','Exact contract text')];
  return {...common('actual-core-scope','실제 비선형 core · 입력·산술·인증 범위','같은 원본의 점별 구간 계산입니다. Y≤4는 원래 수정 전 core이며 4<Y≤4.1은 B.26 입력을 위한 자연 연장입니다. 물리 cutoff collar, 전역 모멘트 적분 및 고차 보정을 완료했다는 판정은 포함하지 않습니다.',d,axes),kind:'TABLE',chart:{kind:'COMPARISON_TABLE',columns:t.columns,rows:t.rows.map(r=>[r[0],JSON.stringify(r[1])]),sourcePaths:[...t.sourcePaths]},scene:{points:[],lines:[],arrows:[],axes:[]},table:t,lod:{originalPoints:0,displayedPoints:0,invalidCoordinates:0,changesComputation:false,method:'EXACT_SOURCE_TABLE',sourceTableRows:t.totalRows},lostInformation:['Canvas의 긴 계약은 화면 폭에 따라 축약됩니다. 전체 계약과 정확한 유리수는 아래 표와 JSON에 보존됩니다.']};
}

export function actualCorePanels(job,options={}){
  if(!job?.result||options.currentEditorMatches===false||job.request?.kind!=='ns.actual-core-evaluation')return [];
  if([job.status,job.result.status].some(s=>['FAILED','UNSUPPORTED','CANCELLED','BUDGET_EXCEEDED','PRECISION_REQUIRED'].includes(s)))return [];
  const d=job.result.results;if(d?.schema!=='MathScope.ActualNonlinearCorePoint/1')return [];
  return [phiPanel(d,options),axialCorrectionPanel(d,options),axialValuePanel(d,options),pressurePanel(d,options),scopePanel(d,options)];
}
