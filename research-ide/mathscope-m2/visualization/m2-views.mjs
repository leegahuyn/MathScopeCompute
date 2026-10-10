import {makeVisualization,sampleIndices,numericValue} from './observations.mjs';

const axis=(label,type,sourceField,unit='1')=>({label,type,sourceField,unit,scale:'linear',transform:'identity',physicalDimension:0});
const numeric=n=>Number.isFinite(numericValue(n));
function exactTable(t,path){
  const columns=t.columns||Object.keys(t.rows?.[0]||{}),all=t.rows||[],ix=sampleIndices(all.length,200);
  return {title:t.title||'원본 계산표',columns:columns.map(x=>typeof x==='string'?{label:x,sourceField:path+'.'+x}:x),rows:ix.map(i=>Array.isArray(all[i])?all[i]:columns.map(c=>all[i][typeof c==='string'?c:c.key||c.label]??'—')),sourcePaths:ix.map(i=>`${path}.rows[${i}]`),totalRows:all.length,truncated:all.length>200};
}
function chartPanel(id,title,series,x,y,description='원본 실행의 유한 수치만 표시합니다.'){
  const rows=series.flatMap(s=>s.points.map(p=>[s.label,p.x,p.y,p.phase||'—']));
  return {id,title,kind:'SERIES',description,chart:{kind:'SERIES',series,xLabel:x.label,yLabel:y.label},axisMetadata:[x,y],scene:{points:series.flatMap(s=>s.points.filter(p=>numeric(p.x)&&numeric(p.y)).map(p=>({...p,pos:[numericValue(p.x),numericValue(p.y),0],value:p.sourceValue??p.y,sourcePath:p.sourcePath,label:p.label||s.label,color:s.color}))),lines:[],arrows:[],axes:[x.label,y.label,'display plane']},table:{title,columns:['계열',x.label,y.label,'phase'],rows,sourcePaths:series.flatMap(s=>s.points.map(p=>p.sourcePath||s.sourceField||'')),totalRows:rows.length,truncated:false},color:null};
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
    const panel=chartPanel('main','동일 물리점에서의 실제 곡률 오차', [{label:'곡률 오차',dash:[],points:levels.map((p,i)=>({x:numericValue(p.spacing),y:numericValue(p.curvatureAbsoluteError),sourcePath:`result.levels[${i}].curvatureAbsoluteError`,sourceIndex:i}))}],x,y,'가로축은 격자 간격, 세로축은 독립 해석 곡률과의 수치 오차입니다. 동일한 4차원 물리점에서 계산한 국소 정련 검사이며 전체 부피의 연속체 오차 인증은 아직 없습니다.');
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

export function listM2Panels(job,options={}){
  const r=job?.result;if(!r)return [];
  const out=[{id:'main',title:'원본 관측'}];
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
  view.binding={...view.binding,sourceHash:r.sourceHash||raw.sourceHash||r.provenance?.sourceHash||view.binding.sourceHash,modelHash:r.modelHash||view.binding.modelHash,sampleHash:r.sampleHash||view.binding.sampleHash||null,ensembleHash:r.ensembleHash||null,observationHash:raw.observationHash||view.binding.observationHash||null};
  if(job.request.kind.startsWith('gauge.'))view=gaugeMainView(job,view,options);
  const panels=listM2Panels(job,options),panel=panels.find(x=>x.id===options.panel&&x.id!=='main');
  if(panel){view={...view,...panel};const t=view.table,ix=sampleIndices(t.rows.length,limit(options.maxRows,200,1000));view.table={...t,rows:ix.map(i=>t.rows[i]),sourcePaths:ix.map(i=>t.sourcePaths[i]),truncated:t.truncated||t.rows.length>ix.length};if(job.request.kind==='gauge.ensemble')view.binding={...view.binding,sourceHash:panel.sourceHash,historyHash:r.historyHash||null,configurationHash:r.sourceHash,observationHash:panel.observationHash,observationHashScope:'HISTORY_OBSERVATION_CONTRACT; DISPLAY_LOD_EXCLUDED'};}
  view.relatedTables=[...(view.relatedTables||[]),...(r.tables||[]).map((t,i)=>exactTable(t,`result.tables[${i}]`))];
  if(r.results?.rows?.length&&!r.tables?.length){const first=r.results.rows[0];if(typeof first==='object'&&!Array.isArray(first))view.relatedTables.push(exactTable({title:'구성 요소의 원본 기록',columns:Object.keys(first),rows:r.results.rows},'result.results'));}
  view.details=[...(view.details||[]),{title:'계산된 범위와 남은 원문 조건',value:{scope:r.scope||r.proofBoundary||r.results?.scope||null,blockers:r.blockers||[],remaining:r.scopeBlockers||r.results?.remainingObligations||null}},{title:'모형 · 표본 · 관측의 결속',value:view.binding}];
  if(r.results?.complex)view.details.push({title:'복합체 · 미분 · 비교',value:r.results.complex});
  if(r.results?.baseChangeMaps)view.details.push({title:'서로 다른 base-change map',value:r.results.baseChangeMaps});
  if(r.replicas)view.details.push({title:'Replica별 ESS · 자기상관 · 표준오차',value:r.replicas.map(x=>({replica:x.replicaIndex,start:x.start,acceptance:x.acceptance,statistics:x.statistics,topology:x.topologyDiagnostic}))});
  return view;
}
