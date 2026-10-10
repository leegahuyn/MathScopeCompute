import {makeVisualization,sampleIndices,numericValue} from './observations.mjs';
import {observationPanels,makeObservationPair} from './observation-panels.mjs';
import {actualSourcePanels} from './actual-source-panels.mjs';
import {actualCorePanels} from './actual-core-panels.mjs';
import {actualGlobalPanels} from './actual-global-panels.mjs';
export {makeObservationPair};

const axis=(label,type,sourceField,unit='1')=>({label,type,sourceField,unit,scale:'linear',transform:'identity',dataDimension:1,physicalDimension:0});
const numeric=n=>Number.isFinite(numericValue(n));
function exactTable(t,path){
  const columns=t.columns||Object.keys(t.rows?.[0]||{}),all=t.rows||[],ix=sampleIndices(all.length,200);
  return {title:t.title||'원본 계산표',columns:columns.map(x=>typeof x==='string'?{label:x,sourceField:path+'.'+x}:x),rows:ix.map(i=>Array.isArray(all[i])?all[i]:columns.map(c=>all[i][typeof c==='string'?c:c.key||c.label]??'—')),sourcePaths:ix.map(i=>`${path}.rows[${i}]`),totalRows:all.length,truncated:all.length>200};
}
function chartPanel(id,title,series,x,y,description='원본 실행의 유한 수치만 표시합니다.'){
  const rows=series.flatMap(s=>s.points.map(p=>[s.label,p.x,p.y,p.phase||'—']));
  const points=series.flatMap(s=>s.points.filter(p=>numeric(p.x)&&numeric(p.y)).map(p=>({...p,pos:[numericValue(p.x),numericValue(p.y),0],value:p.sourceValue??p.y,sourcePath:p.sourcePath,label:p.label||s.label,color:s.color})));
  return {id,title,kind:'SERIES',description,chart:{kind:'SERIES',series,xLabel:x.label,yLabel:y.label},axisMetadata:[x,y],scene:{points,lines:[],arrows:[],axes:[x.label,y.label,'display plane']},table:{title,columns:['계열',x.label,y.label,'phase'],rows,sourcePaths:series.flatMap(s=>s.points.map(p=>p.sourcePath||s.sourceField||'')),totalRows:rows.length,truncated:false},color:null,lod:{originalPoints:rows.length,displayedPoints:points.length,invalidCoordinates:rows.length-points.length,changesComputation:false,method:'ALL_FINITE_STORED_SERIES_POINTS'}};
}
const replicaColors=['#76e2cd','#ffd282','#99b8ff','#f69fa5','#ceafff'];
const rooted=path=>path?.startsWith('result.')?path:'result.'+(path||'');
const limit=(value,fallback,maximum)=>Number.isSafeInteger(value)&&value>0?Math.min(value,maximum):fallback;
const fmt=value=>numeric(value)?String(Number(numericValue(value).toPrecision(5))):'미확정';
function statisticsSummary(s){
  if(!s)return '유효 표본 수 미확정';
  const ci=s.confidenceInterval95;
  return `N=${s.count}, ESS=${fmt(s.effectiveSampleSize)}, τ_int=${fmt(s.integratedAutocorrelationTime)}, `+(ci?`95% 근사 구간 [${fmt(ci.lower)}, ${fmt(ci.upper)}] (정상성 가정)`:'95% 구간 미산정 · '+s.status);
}
function replicaSummary(r,observable='plaquette'){
  return (r.replicas||[]).map(x=>`replica ${x.replicaIndex} (${x.start}): ${statisticsSummary(x.statistics?.[observable])}`).join(' / ');
}
function limitedTable(title,columns,rows,sourcePaths,options={}){
  const ix=sampleIndices(rows.length,limit(options.maxRows,200,1000));
  return {title,columns,rows:ix.map(i=>rows[i]),sourcePaths:ix.map(i=>sourcePaths[i]),totalRows:rows.length,truncated:ix.length<rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS'};
}
function dataObservation(kind,axes,extra={}){
  return {kind,sourceDimension:axes.length,sourceDimensionMeaning:'TYPED_SOURCE_ATTRIBUTES',displayDimension:2,physicalDimension:0,coordinateTypes:axes.map(a=>a.type),nonInjective:true,reconstructionAllowed:false,...extra};
}

function gaugeHistoryPanel(job,c,chartIndex,options={}){
  const r=job.result,rows=[],paths=[],groups=[];
  c.series.forEach((s,replicaIndex)=>{
    const replica=r.replicas?.[replicaIndex],retained=new Set((replica?.samples||[]).map(x=>x.sweep));
    const points=s.points.map((p,j)=>{
      const sourcePath=s.sourceField?rooted(s.sourceField.replace('[*]',`[${j}]`)):`result.charts[${chartIndex}].series[${replicaIndex}].points[${j}]`;
      const retention=p.phase==='BURN_IN'?'EXCLUDED_BURN_IN':retained.has(p.x)?'RETAINED':'NOT_RETAINED_BY_THINNING';
      rows.push([s.label,p.x,p.y,p.phase||'UNDECLARED',retention]);paths.push(sourcePath);
      return {...p,x:numericValue(p.x),y:numericValue(p.y),sourceValue:p.y,sourcePath,sourceIndex:j,retention,label:`${s.label} · sweep ${p.x} · ${p.phase} · ${retention} · ${fmt(p.y)}`};
    });
    for(const phase of [...new Set(points.map(p=>p.phase))]){
      const burnIn=phase==='BURN_IN';
      groups.push({label:`R${replicaIndex} ${burnIn?'burn-in':'measurement'}`,replicaIndex,phase,color:replicaColors[replicaIndex%replicaColors.length],dash:burnIn?[6,4]:[],points:points.filter(p=>p.phase===phase)});
    }
  });
  const perGroup=Math.max(1,Math.floor(limit(options.maxPoints,4000,6000)/Math.max(1,groups.length))),series=groups.map(s=>({...s,points:sampleIndices(s.points.length,perGroup).map(i=>s.points[i])}));
  const x=axis(c.x?.label||'Monte Carlo sweep',c.x?.type||'ALGORITHM_ITERATION','result.replicas[*].history[*].sweep',c.x?.unit||'sweeps'),field=c.series[0]?.sourceField?.split('.').at(-1)||'value',y=axis(c.y?.label||'value',c.y?.type||'OBSERVABLE',`result.replicas[*].history[*].${field}`,c.y?.unit||'1');
  const description='색은 replica, 점선은 burn-in, 실선은 측정 구간입니다. sweep은 알고리즘 반복 횟수입니다. 표의 RETAINED 행으로 통계를 계산하며 N은 보관 표본 수, ESS는 자기상관 보정 유효 표본 수입니다. '+replicaSummary(r,field==='action'?'action':'plaquette')+' · 유한 이력으로 평형이나 위상 섹터 혼합을 인증하지 않습니다.';
  const panel=chartPanel(c.id,c.title,series,x,y,description);
  panel.table=limitedTable(c.title,['replica','sweep',y.label,'phase','통계 보관 여부'],rows,paths,options);
  panel.sourceHash=c.sourceHash||r.historyHash||job.mathematicalHash||job.resultHash;
  panel.observationHash=c.observationHash||null;
  panel.observation=dataObservation(c.observation?.kind||'MONTE_CARLO_SWEEP_HISTORY',[x,y],{...c.observation,underlyingPhysicalDimension:4});
  panel.lod={originalPoints:rows.length,displayedPoints:panel.scene.points.length,changesComputation:false,method:'UNIFORM_SOURCE_INDEX_WITH_ENDPOINTS_WITHIN_EACH_REPLICA_AND_PHASE',sourceHistoryStored:true};
  panel.lostInformation=['표시 LOD는 각 replica·phase의 실제 행을 선택합니다. 생략된 행의 극값은 선에서 복원할 수 없으며 전체 이력은 JSON에 보존됩니다.','측정 구간과 통계 보관 표본은 thinning 설정에 따라 다릅니다.'];
  return panel;
}

function gaugeMainView(job,base,options={}){
  const r=job.result,raw=r.visualization||{},kind=job.request.kind;
  if(kind==='gauge.volume-refinement')return {...base,...gaugeVolumePanel(job,false,options),lostInformation:raw.lostInformation||[]};
  if(kind==='gauge.sampler-reference'){
    const history=r.history||[],ix=sampleIndices(history.length,limit(options.maxPoints,4000,6000));
    const x=axis('보관 표본 index','ALGORITHM_ITERATION','result.history[*].sample','index'),y=axis('Re Tr(U)/2','OBSERVABLE','result.history[*].normalizedTrace','dimensionless');
    const series=[{label:'실제 one-link 보관 표본',dash:[],points:ix.map(i=>({x:numericValue(history[i].sample),y:numericValue(history[i].normalizedTrace),sourcePath:`result.history[${i}].normalizedTrace`,sourceIndex:i,label:`sample ${history[i].sample}: ${fmt(history[i].normalizedTrace)}`}))}];
    const panel=chartPanel('main','SU(2) one-link · 실제 보관 표본',series,x,y,'가로축은 알고리즘 표본 index, 세로축은 계산한 normalized trace입니다. '+statisticsSummary(r.statistics)+'. 독립 Haar 적분의 평균과 비교한 오차='+fmt(r.comparison?.meanError)+'. LOD는 저장된 행을 선택하며 생략된 진동을 복원하지 않습니다.');
    panel.table=limitedTable('전체 one-link 보관 표본',['sample index','Re Tr(U)/2','action'],history.map(p=>[p.sample,p.normalizedTrace,p.action]),history.map((_,i)=>`result.history[${i}]`),options);
    panel.observation=dataObservation(raw.observation?.kind||'RETAINED_ONE_LINK_CHAIN',[x,y],raw.observation);
    panel.lod={originalPoints:history.length,displayedPoints:ix.length,changesComputation:false,method:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS',sourceHistoryStored:true};
    return {...base,...panel,lostInformation:raw.lostInformation||[]};
  }
  if(kind==='gauge.lattice-refinement'){
    const levels=r.levels||[],x={...axis('격자 간격 a','PHYSICAL_LENGTH','result.levels[*].spacing',r.fieldSpec?.units?.length||'source length'),physicalDimension:1},y={...axis('곡률 절대 오차','NUMERIC_ERROR','result.levels[*].curvatureAbsoluteError',(r.fieldSpec?.units?.length||'source length')+'^-2'),physicalDimension:-2};
    const panel=chartPanel('main','동일 물리점에서의 실제 곡률 오차', [{label:'곡률 오차',dash:[],points:levels.map((p,i)=>({x:numericValue(p.spacing),y:numericValue(p.curvatureAbsoluteError),sourcePath:`result.levels[${i}].curvatureAbsoluteError`,sourceIndex:i}))}],x,y,'가로축은 격자 간격, 세로축은 독립 해석 곡률과의 수치 오차입니다. 동일한 4차원 물리점에서 계산한 국소 정련 검사입니다. 고정 부피의 에너지·실수 Q 적분과 오차는 별도 volume-refinement 예제에서 확인합니다.');
    panel.table=limitedTable('정련 단계의 원본 오차',['level','a','ρ/a','곡률 절대 오차','곡률 정규화 오차','midpoint 정련 차이','trapezoidal 차이'],levels.map(p=>[p.level,p.spacing,p.rhoOverA,p.curvatureAbsoluteError,p.curvatureRelativeError,p.midpointRefinementDifference,p.trapezoidalDifference]),levels.map((_,i)=>`result.levels[${i}]`),options);
    panel.observation=dataObservation(raw.observation?.kind||'LOCAL_CURVATURE_REFINEMENT',[x,y],{...raw.observation,underlyingPhysicalDimension:4});
    panel.lod={originalPoints:levels.length,displayedPoints:levels.length,changesComputation:false};
    return {...base,...panel,lostInformation:raw.lostInformation||[]};
  }
  if(!['gauge.lattice','gauge.ensemble'].includes(kind)||!r.measurements?.sites)return base;
  const contract=raw.observation||{},quantity=contract.quantity||raw.valueMeaning,timeIndex=contract.timeIndex,stride=contract.stride||1;
  const source=r.measurements.sites,bySite=new Map(source.map((p,i)=>[p.site,i]));
  const chosen=source.map((p,i)=>({p,i})).filter(({p})=>p.index4[3]===timeIndex&&p.index4.slice(0,3).every(n=>n%stride===0));
  const table=limitedTable('물리 x4 단면 · 원본 좌표와 값',['site','격자 index (n1,n2,n3,n4)','x1','x2','x3','x4 (Euclidean time)',quantity,'곡률 스텐실'],chosen.map(({p})=>[p.site,p.index4,...p.coordinate4,p[quantity],p.completeCurvatureStencil?'COMPLETE':'INCOMPLETE']),chosen.map(({i})=>`result.measurements.sites[${i}]`),options);
  const axisMetadata=[0,1,2].map(i=>({...axis('x'+(i+1),'PHYSICAL_SPACE_COORDINATE',`result.measurements.sites[*].coordinate4[${i}]`,raw.axes?.[i]?.unit||'source length'),physicalDimension:1}));
  const scene={...base.scene,points:base.scene.points.map(p=>({...p,sourcePath:`result.measurements.sites[${bySite.get(p.sourceIndex)}].${quantity}`}))};
  const x4=chosen[0]?.p.coordinate4[3],replica=r.replicas?.at(-1),description=`x4=${fmt(x4)} ${axisMetadata[0].unit}에 고정한 실제 3차원 공간 단면입니다. x4는 Euclidean time입니다. 표에는 네 물리 좌표와 경계 스텐실 상태를 보존합니다.`+(replica?` 화면의 구성은 마지막 replica ${replica.replicaIndex} (${replica.start})의 최종 저장 상태입니다. ${replicaSummary(r)}`:'');
  const view={...base,scene,table,axisMetadata,title:`${quantity} · x4=${fmt(x4)} 단면`,description,observation:{...base.observation,...contract,sourceDimension:4,displayDimension:3,physicalDimension:3,coordinateTypes:axisMetadata.map(a=>a.type),sourceCoordinateTypes:['PHYSICAL_SPACE_COORDINATE','PHYSICAL_SPACE_COORDINATE','PHYSICAL_SPACE_COORDINATE','EUCLIDEAN_TIME'],fixedCoordinate:{sourceField:'result.measurements.sites[*].coordinate4[3]',type:'EUCLIDEAN_TIME',value:x4??null,unit:axisMetadata[0].unit},nonInjective:true,reconstructionAllowed:false}};
  if(raw.emptyState){view.emptyState={status:'NO_COMPLETE_STENCIL',sourceMessage:raw.emptyState};view.kind='TABLE';view.title='선택 단면의 곡률 스텐실이 불완전합니다';view.description+=` ${quantity} 계산에 필요한 경계 이웃이 없어 값을 미확정으로 보존했습니다. actionDensity 관측이나 충분한 격자·경계 조건으로 다시 계산할 수 있습니다.`;view.chart={kind:'COMPARISON_TABLE',columns:table.columns,rows:table.rows};}
  return view;
}

function gaugeVolumePanel(job,energy=false,options={}){
  const r=job.result,levels=r.levels||[],key=energy?'energyIntegral':'realCharge',referenceKey=energy?'energy':'charge',errorKey=energy?'energyError':'chargeError',ref=r.reference?.[referenceKey],title=energy?'고정 부피 · 에너지 적분 정련':'고정 부피 · 실수 Q 적분 정련';
  const unit=r.model?.units||r.fieldSpec?.units?.length||'source length',x={...axis('공간 격자 간격 a_s','PHYSICAL_LENGTH','result.levels[*].spatialSpacing',unit),physicalDimension:1},y=axis(energy?'∫ energy density':'실수 Q','SCALAR_INTEGRAL',`result.levels[*].${key}`,'dimensionless');
  const series=[{label:energy?'격자 에너지':'격자 Q',points:levels.map((p,i)=>({x:numericValue(p.spatialSpacing),y:numericValue(p[key]),sourcePath:`result.levels[${i}].${key}`}))}];
  for(const side of ['lower','upper']){const value=ref?.[side]??ref?.interval?.[side==='lower'?0:1];if(numeric(value))series.push({label:'연속 참조 '+(side==='lower'?'하한':'상한'),dash:[5,4],points:levels.map(p=>({x:numericValue(p.spatialSpacing),y:numericValue(value),sourcePath:`result.reference.${referenceKey}.${ref?.[side]!==undefined?side:'interval['+(side==='lower'?0:1)+']'}`}))});}
  const panel=chartPanel(energy?'volume-energy':'main',title,series,x,y,'동일한 유한 4D 물리 상자에서 실제 링크·cell을 다시 계산합니다. 곡률 이산화, 링크 수송, 좌표 반올림과 적분 구적 오차를 분리합니다. 여기의 Q는 유한 상자의 실수 적분이며 전역 정수 위상수 인증이 아닙니다.');
  panel.table=limitedTable(title,['축별 cell 수','a_s','a_t',y.label,'절대 오차 하한','절대 오차 상한','인증 상계'],levels.map(p=>[p.cellsPerCoordinate,p.spatialSpacing,p.temporalSpacing,p[key],p[errorKey]?.lower,p[errorKey]?.upper,p.certificate?.[energy?'energyErrorUpper':'chargeErrorUpper']]),levels.map((_,i)=>`result.levels[${i}]`),options);
  panel.observation=dataObservation('FINITE_VOLUME_REFINEMENT',[x,y],{underlyingPhysicalDimension:4,quantity:key,referenceField:`result.reference.${referenceKey}`,nonInjective:true,reconstructionAllowed:false});
  panel.lod={originalPoints:panel.scene.points.length,displayedPoints:panel.scene.points.length,changesComputation:false};return panel;
}

function sourceCorePanel(job,options={}){
  const r=job.result,wrapped=r?.results?.actualCoreOverlap,core=wrapped||(r?.results?.schema==='MathScope.SourceCoreDyadicOverlap/1'?r.results:null);if(!core?.samples?.length)return null;
  const root=wrapped?'result.results.actualCoreOverlap':'result.results',series=[0,1].map(j=>({label:'chart ℓ='+core.samples[0].chartPair[j].ell,dash:j?[6,4]:[],points:core.samples.map((p,i)=>{const b=p.chartPair[j].restoredNormalizedInterval;return {x:p.YDisplay,y:b[0]+(b[1]-b[0])/2,sourceValue:b,sourcePath:`${root}.samples[${i}].chartPair[${j}].restoredNormalizedInterval`,label:`Y=${p.sourceY} · ℓ=${p.chartPair[j].ell} · Φ ∈ [${b[0]}, ${b[1]}]`};})}));
  const x=axis('원본 Y = ΛX','NORMALIZED_SOURCE_COORDINATE',root+'.samples[*].sourceY','1'),y={...axis('복원된 Φ 구간의 표시 중심','NORMALIZED_FIELD_INTERVAL',root+'.samples[*].chartPair[*].restoredNormalizedInterval','1'),transform:'midpoint of stored outward interval; exact bounds retained in table'};
  const p=chartPanel('source-core-overlap','실제 N3 코어 · 두 chart의 동일 물리량',series,x,y,'기존에 인증된 η=0 코어의 실제 Φ 구간을 두 dyadic chart에서 복원합니다. 두 선은 같은 표본의 관측이며, 일반 slow box의 전체 장을 의미하지 않습니다. 작은 양의 물리 반경과 속도는 기호식으로 보존하고 0으로 바꾸지 않습니다.');
  const rows=[],paths=[];core.samples.forEach((s,i)=>s.chartPair.forEach((c,j)=>{rows.push([s.sourceY,c.ell,c.QExact,c.TExact,s.sourcePhiInterval.lower,s.sourcePhiInterval.upper,...c.restoredNormalizedInterval,s.physicalPoint.r.exact,s.physicalSwirl.exactExpression]);paths.push(`${root}.samples[${i}]`);}));
  p.table=limitedTable('원본 exact Φ · 두 chart 복원 · 물리량 기호식',['Y','ℓ','Q exact','T exact','원본 Φ 하한','원본 Φ 상한','복원 하한','복원 상한','물리 반경 r','물리 uθ'],rows,paths,options);
  p.observation=dataObservation('PINNED_SOURCE_CORE_OVERLAP',[x,y],{underlyingPhysicalDimension:3,sourceProfile:core.sourceProfile,etaExact:'0',receipt:core.provenance?.acceptedCore,samePhysicalQuantity:'u_theta',wholeProfileFieldEvaluator:false,nonInjective:true,reconstructionAllowed:false});
  p.lostInformation=['표시는 정규화된 Φ의 구간 중심입니다. 정확한 유리수 구간과 물리량 기호식은 표와 JSON에 있습니다.','η=0의 인증된 다섯 코어 표본이며 모든 pulse label의 slow field를 평가한 결과가 아닙니다.'];return p;
}

function cutoffPotentialPanel(job,options={}){
  const d=job.result.results?.localPotentialSum;if(!d?.summands?.length)return null;
  const root='result.results.localPotentialSum',x=axis('입력 potential 차수 j','COEFFICIENT_ORDER',root+'.summands[*].order'),y={...axis('χ(a_j q) C_j · 구간 중심','VECTOR_COMPONENT_INTERVAL',root+'.summands[*].cutoffPotentialValue'),transform:'midpoint of stored outward interval; interval bounds retained in table'};
  const series=[0,1,2].map(k=>({label:'potential 성분 '+k,color:replicaColors[k],points:d.summands.map((s,i)=>{const v=s.cutoffPotentialValue[k];return {x:s.order,y:v[0]+(v[1]-v[0])/2,sourceValue:v,sourcePath:`${root}.summands[${i}].cutoffPotentialValue[${k}]`};})}));
  const p=chartPanel('cutoff-potential-sum','Cutoff를 적용한 실제 입력 potential 합',series,x,y,'입력으로 제공한 각 potential에 C∞ cutoff를 곱한 실제 결과입니다. '+(d.activity.prefixComplete?'이 compact q 구간에서는 모든 생략된 고차 cutoff가 0임을 확인했습니다.':'현재 prefix 이후에도 활성 항이 있을 수 있어 전체 국소 합을 미확정으로 유지합니다.')+' 입력 potential은 연산자 검증용 자료이며 실제 N3 고차 계수 인증은 별도입니다.');
  p.table=limitedTable('각 차수의 cutoff와 세 성분 구간',['차수','cutoff 영역','χ 구간','성분 0 구간','성분 1 구간','성분 2 구간'],d.summands.map(s=>[s.order,s.cutoff.region,s.cutoff.interval,...s.cutoffPotentialValue]),d.summands.map((_,i)=>`${root}.summands[${i}]`),options);
  p.relatedTables=[{title:'완전한 국소 합과 cutoff 없는 유한 절단',columns:['구분','성분 0 구간','성분 1 구간','성분 2 구간'],rows:[[d.localSum?'LOCAL_SUM_COMPLETE':'LOCAL_SUM_UNRESOLVED',...(d.localSum?.value||['미확정','미확정','미확정'])],['UNCUT_FINITE_PREFIX',...d.uncutFiniteFormalTruncation.value]],sourcePaths:[root+'.localSum',root+'.uncutFiniteFormalTruncation'],totalRows:2,truncated:false}];
  p.observation=dataObservation('SUPPLIED_CUTOFF_POTENTIAL_SUM',[x,y],{sourceInstanceCertified:false,completeOnCompact:d.activity.prefixComplete});p.details=[{title:'활성 차수의 완전성 근거',value:d.activity},{title:'상수의 출처와 원본 적용 조건',value:job.result.results.constantLedger}];return p;
}

function cutoffResidualPanel(job,options={}){
  const d=job.result.results?.cutoffRemainder;if(!d?.rows?.length)return null;
  const root='result.results.cutoffRemainder',x=axis('도함수 차수 k','DERIVATIVE_ORDER',root+'.rows[*].derivativeOrder'),y=axis('복소 잔여항 성분의 절댓값 상계','INTERVAL_ABSOLUTE_BOUND',root+'.rows[*].componentAbsUpper');
  const series=[0,1,2].map(k=>({label:'잔여항 성분 '+k,color:replicaColors[k],points:d.rows.map((r,i)=>({x:r.derivativeOrder,y:r.componentAbsUpper[k],sourcePath:`${root}.rows[${i}].componentAbsUpper[${k}]`}))}));
  const p=chartPanel('cutoff-residual','(1−ψ) f + ψ′ t · 전체 복소 잔여항',series,x,y,'제공된 local jet에 모든 Leibniz 항을 적용한 실제 구간 계산입니다. forcing 항과 cutoff 미분 항을 각각 보존합니다. 별도의 log tail 그래프는 선언된 Gaussian 상계의 조건부 결과이며, 이 local jet과 같은 dyadic pulse의 비교 인증을 뜻하지 않습니다.');
  const rows=[],paths=[];d.rows.forEach((r,i)=>r.residual.forEach((v,k)=>{rows.push([r.derivativeOrder,k,r.forcingTail[k].re,r.forcingTail[k].im,r.cutoffDerivativeTail[k].re,r.cutoffDerivativeTail[k].im,v.re,v.im,r.componentAbsUpper[k]]);paths.push(`${root}.rows[${i}]`);}));
  p.table=limitedTable('forcing · cutoff 미분 · 합의 정확한 구간',['도함수 차수','성분','forcing Re','forcing Im','ψ′t Re','ψ′t Im','합 Re','합 Im','절댓값 상계'],rows,paths,options);p.observation=dataObservation('SUPPLIED_LOCAL_CUTOFF_RESIDUAL',[x,y],{sourceInstanceCertified:false,dyadicFamilyBinding:d.dyadicFamilyBinding,residualVsEnvelopeComparisonPerformed:false});p.details=[{title:'입력 jet과 전체 미분 공식',value:{inputJet:d.inputJet,derivativeFormula:d.derivativeFormula,allTermsRetained:d.allTermsRetained}},{title:'독립적으로 선언된 envelope의 적용 조건',value:job.result.results.envelopeLedger}];return p;
}

function pulseCurlPanel(job,options={}){
  const d=job.result.results;if(job.request.kind!=='ns.pulse-curl'||!d?.samples?.length)return null;
  const x=axis('검증 표본의 R','SLOW_RADIAL_COORDINATE','result.results.samples[*].R'),y=axis('복소 벡터 norm','VECTOR_NORM','result.results.samples');
  const series=[['tNorm','주 진폭 ||t_m||'],['remainderNorm','잔여항 ||r_m||'],['fullNorm','전체 ||t_m+r_m||']].map(([key,label],k)=>({label,color:replicaColors[k],dash:k===1?[5,3]:[],points:d.samples.map((r,i)=>({x:r.R,y:r[key],sourcePath:`result.results.samples[${i}].${key}`}))}));
  const p=chartPanel('pulse-curl-components','Pulse curl · 주 진폭과 전체 잔여항',series,x,y,'같은 검증용 smooth coefficient에서 C_m과 r_m을 모두 계산한 결과입니다. 물리 Q 배율과 mixed auxiliary 도함수, 원통 좌표의 1/R 항을 유지합니다. 실제 N3 pulse ODE 해를 계산한 표본은 아닙니다.');
  p.table=limitedTable('주항 · 잔여항 · 전체 covariance',['R','||t_m||','||r_m||','||t_m+r_m||','전체 covariance','잔여항 생략 covariance'],d.samples.map(s=>[s.R,s.tNorm,s.remainderNorm,s.fullNorm,s.fullCovariance,s.withoutRemainderCovariance]),d.samples.map((_,i)=>`result.results.samples[${i}]`),options);p.observation=dataObservation('GENERIC_PULSE_CURL_OPERATOR',[x,y],{underlyingPhysicalDimension:3,globalN3PulseEvaluated:false});p.details=[{title:'정확 항등식과 독립 Cartesian 대조',value:{exact:d.exact,convergence:d.convergence,checks:d.checks}}];return p;
}

export function listM2Panels(job,options={}){
  const r=job?.result;if(!r)return [];
  const actual=[...actualCorePanels(job,options),...actualGlobalPanels(job,options),...actualSourcePanels(job,options)];if(actual.length)return actual;
  const extra=observationPanels(job),out=r.pairs?.length?extra:[{id:'main',title:'원본 관측'},...extra];
  if(job.request.kind==='gauge.volume-refinement')out.push(gaugeVolumePanel(job,true,options));
  const corePanel=sourceCorePanel(job,options);if(corePanel)out.push(corePanel);
  for(const panel of [cutoffPotentialPanel(job,options),cutoffResidualPanel(job,options),pulseCurlPanel(job,options)])if(panel)out.push(panel);
  for(const [i,p] of (r.visualization?.panels||[]).entries()){
    const path=`result.visualization.panels[${i}]`;
    if(p.kind==='NEWTON_POLYGON')out.push(chartPanel('newton','Newton 다각형 · p-adic valuation',[{label:'계수 valuation',connect:false,points:p.points.map((v,j)=>({x:v.degree,y:v.valuation,sourcePath:`${path}.points[${j}]`}))},{label:'lower hull',points:p.lines.map((v,j)=>({x:v.degree,y:v.valuation,sourcePath:`${path}.lines[${j}]`}))}],axis('다항식 계수 차수','POLYNOMIAL_DEGREE',path+'.points.degree'),axis('v_p(계수)','PADIC_VALUATION',path+'.points.valuation'),'정확한 계수 valuation의 lower hull입니다. 근의 p-adic slope와 복소수의 각도는 별개입니다.'));
    if(p.kind==='HODGE_DEGREES')out.push(chartPanel('hodge','Hodge degree · H¹의 두 성분',[{label:'Hodge degree',connect:false,points:p.values.map((v,j)=>({x:j,y:v,sourcePath:`${path}.values[${j}]`}))}],axis('H¹ 성분','CATEGORICAL',path+'.values'),axis('Hodge degree','COHOMOLOGICAL_DEGREE',path+'.values'),'H¹의 두 Hodge 성분을 표시합니다. 화면 간격은 p-adic 거리가 아닙니다.'));
    if(p.kind==='COMPLEX_EIGENVALUES')out.push(chartPanel('complex','Frobenius 고유값 · 복소 평면',[{label:'complex eigenvalue',connect:false,points:p.values.map((v,j)=>({x:v[0],y:v[1],sourcePath:`${path}.values[${j}]`}))}],axis('실수부','COMPLEX_REAL_COMPONENT',path+'.values[0]'),axis('허수부','COMPLEX_IMAGINARY_COMPONENT',path+'.values[1]'),'Float64로 계산한 복소 근의 표시입니다. 이 각도로 p-adic valuation을 계산하지 않습니다.'));
  }
  for(const [i,c] of (r.charts||[]).entries()){
    if(job.request.kind==='gauge.ensemble'){out.push(gaugeHistoryPanel(job,c,i,options));continue;}
    out.push(chartPanel(c.id||'chart-'+i,c.title,c.series.map((s,si)=>({...s,points:s.points.map((p,j)=>({...p,sourcePath:s.sourceField?rooted(s.sourceField.replace('[*]',`[${j}]`)):`result.charts[${i}].series[${si}].points[${j}]`}))})),axis(c.x?.label||'index',c.x?.type||'DATA_ATTRIBUTE',`result.charts[${i}].x`,c.x?.unit||'1'),axis(c.y?.label||'value',c.y?.type||'OBSERVABLE',`result.charts[${i}].y`,c.y?.unit||'1'),'같은 실행에서 보관한 전체 이력입니다.'));
  }
  if(job.request.kind==='ns.pulse-ode')out.push(chartPanel('log-amplitude','Pulse · log 진폭',[{label:'log ||t||',points:r.results.samples.map((x,i)=>({x:x.v,y:x.logAmplitude,sourcePath:`result.results.samples[${i}].logAmplitude`}))}],axis('v','PULSE_COORDINATE','result.results.samples.v'),{...axis('log ||t||','LOG_AMPLITUDE','result.results.samples.logAmplitude'),transform:'natural logarithm stored by solver'},'중간점 정규화와 log 진폭을 함께 보관합니다. 기계 underflow를 정확한 0으로 표시하지 않습니다.'));
  if(job.request.kind==='ns.pulse-tail')out.push(chartPanel('tail-bound','Pulse tail · 고정 차수의 log 상계',[{label:'outward log upper',points:r.results.rows.map((x,i)=>({x:x.ell,y:x.logBound[1],sourcePath:`result.results.rows[${i}].logBound[1]`}))}],axis('dyadic ℓ','DYADIC_BAND_INDEX','result.results.rows.ell'),{...axis('log(tail/qᴺ)','LOG_BOUND','result.results.rows.logBound'),transform:'outward interval log upper'},'선택한 상수와 고정 N의 상계를 표시합니다. 원본 ODE에서 그 상수를 유도하는 단계는 별도로 남아 있습니다.'));
  return out;
}
export function makeM2Visualization(job,options={}){
  let view=makeVisualization(job,options);
  if(view.state!=='READY')return view;
  const r=job.result,raw=r.visualization||{};
  const pair=makeObservationPair(job,options);if(pair)return pair.left;
  view.binding={...view.binding,sourceHash:r.sourceHash||raw.sourceHash||r.provenance?.sourceHash||view.binding.sourceHash,modelHash:r.modelHash||view.binding.modelHash,sampleHash:r.sampleHash||view.binding.sampleHash||null,ensembleHash:r.ensembleHash||null,observationHash:raw.observationHash||view.binding.observationHash||null,observationHashScope:'SOURCE_OBSERVATION_CONTRACT; PANEL_ID_AND_DISPLAY_TRANSFORMS_ARE_SEPARATE',panelId:options.panel||'main'};
  if(job.request.kind.startsWith('gauge.'))view=gaugeMainView(job,view,options);
  if(job.request.kind==='ns.source-core-charts'&&(!options.panel||options.panel==='main')){const corePanel=sourceCorePanel(job,options);if(corePanel)view={...view,...corePanel,id:'main'};}
  const panels=listM2Panels(job,options),panel=panels.find(x=>x.id===(options.panel||'main')&&(x.id!=='main'||['ns.actual-core-evaluation','ns.actual-global-source','ns.actual-continuation','ns.actual-background','ns.actual-picard-acceptance','ns.actual-moment-restoration','ns.actual-pulse-amplitude','ns.actual-covariance-matching','ns.actual-uniform-covariance','ns.actual-residual-order','ns.actual-mean-pulse'].includes(job.request.kind)));
  if(panel?.table){view={...view,...panel};const t=view.table,ix=sampleIndices(t.rows.length,limit(options.maxRows,200,1000));view.table={...t,rows:ix.map(i=>t.rows[i]),sourcePaths:ix.map(i=>t.sourcePaths[i]),truncated:t.truncated||t.rows.length>ix.length};if(job.request.kind==='gauge.ensemble')view.binding={...view.binding,sourceHash:panel.sourceHash,historyHash:r.historyHash||null,configurationHash:r.sourceHash,observationHash:panel.observationHash,observationHashScope:'HISTORY_OBSERVATION_CONTRACT; DISPLAY_LOD_EXCLUDED'};}
  view.relatedTables=[...(view.relatedTables||[]),...(r.tables||[]).map((t,i)=>exactTable(t,`result.tables[${i}]`))];
  if(r.results?.rows?.length&&!r.tables?.length){const first=r.results.rows[0];if(typeof first==='object'&&!Array.isArray(first))view.relatedTables.push(exactTable({title:'구성 요소의 원본 기록',columns:Object.keys(first),rows:r.results.rows},'result.results'));}
  view.details=[...(view.details||[]),{title:'계산된 범위와 남은 원문 조건',value:{scope:r.scope||r.proofBoundary||r.results?.scope||null,blockers:r.blockers||[],remaining:r.remaining||r.scopeBlockers||r.results?.remainingObligations||null}},{title:'모형 · 표본 · 관측의 결속',value:view.binding}];
  if(r.observationContract){view.observation={...view.observation,...r.observationContract};view.details.push({title:'4D 관측·경로·끝점 계약',value:r.observationContract});}
  if(r.results?.moduleLedger)view.details.push({title:'kernel/image 생성자와 완전성',value:r.results.moduleLedger});
  if(r.results?.complex)view.details.push({title:'복합체 · 미분 · 비교',value:r.results.complex});
  if(r.results?.baseChangeMaps)view.details.push({title:'서로 다른 base-change map',value:r.results.baseChangeMaps});
  if(r.replicas)view.details.push({title:'Replica별 ESS · 자기상관 · 표준오차',value:r.replicas.map(x=>({replica:x.replicaIndex,start:x.start,acceptance:x.acceptance,statistics:x.statistics,topology:x.topologyDiagnostic}))});
  return view;
}
