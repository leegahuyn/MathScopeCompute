import {makeVisualization,numericValue,sampleIndices} from './observations.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const axis=(label,type,sourceField,unit='1')=>({label,type,sourceField,unit,scale:'linear',transform:'identity',dataDimension:1,physicalDimension:0});
const extent=values=>{let a=Infinity,b=-Infinity;for(const x of values){const n=numericValue(x);if(Number.isFinite(n)){a=Math.min(a,n);b=Math.max(b,n);}}return a===Infinity?null:[a,b];};
function prefixPaths(value,prefix){
  if(typeof value==='string')return value.startsWith('result.')?prefix+value.slice(6):value;
  if(Array.isArray(value))return value.map(x=>prefixPaths(x,prefix));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,prefixPaths(v,prefix)]));
  return value;
}
function childView(job,child,prefix,options){
  const request={kind:child.kind,input:child.input||{}};
  // Parent request binding is checked before entering this child adapter. The
  // editor contains the paired request, not this internal source request.
  const {currentRequest,...childOptions}=options;
  const view=prefixPaths(makeVisualization({...job,status:child.result.status||'COMPLETED',request,result:child.result},childOptions),prefix);
  view.binding={...view.binding,kind:job.request.kind,sourceKind:child.kind,inputHash:job.inputHash,resultHash:job.resultHash,sourceHash:job.result.sourceHash,modelHash:child.modelHash||view.binding.modelHash,sampleHash:child.sampleHash||view.binding.sampleHash,observationHash:child.observationHash||view.binding.observationHash};
  const mode=job.request.input?.mode,meanings={ASSUMED_BOUND:'Δ는 스펙트럼 하한 가정으로만 쓰며 고전 장의 생성식에 들어가지 않습니다. 따라서 장과 물리 상관함수는 두 패널에서 같습니다.',UNITS:'동일한 물리 장을 각 Δ의 단위로 재표현합니다. 표시 좌표의 변화는 단위 변환이며, 색은 공통 물리 밀도 단위입니다.',EFFECTIVE_MODEL:'ρ(Δ)를 쓰는 고전 장과 E_j(Δ)=Δ+offset_j인 유한 스펙트럼 모형을 각각 명시해 재계산했습니다. 두 모형 사이의 양자적 유도를 가정하지 않습니다.',ENSEMBLE_ESTIMATE:'β=Δ라는 명시적 유한 Gibbs 규칙으로 서로 다른 실제 표본을 생성합니다. 상관함수의 lag는 Monte Carlo 반복 횟수이며 물리 시간이나 측정된 질량 간극이 아닙니다.'};if(meanings[mode])view.description+=' · '+meanings[mode];
  view.details.push({title:'이 관측의 계산 규칙과 원본 상태',value:{sourcePath:prefix,status:child.result.status,rule:child.correlatorRule||null,sourceMeaning:child.result.stateMeaning||null,scope:child.result.scope||null,blockers:child.result.blockers||child.result.scopeBlockers||[]}});
  return view;
}

/** Paired observations use one job and retain independent model/sample/observation identities. */
export function makeObservationPair(job,options={}){
  const pairs=job?.result?.pairs;if(!pairs||options.currentEditorMatches===false)return null;
  const index=options.panel&&options.panel!=='main'?pairs.findIndex(p=>p.id===options.panel):0;
  if(index<0)return null;
  const p=pairs[index],base=makeVisualization(job,options);
  if(base.state!=='READY')return null;
  if(p.state){
    const v={...base,state:p.state,kind:'STATE',title:p.label+' · '+p.state,description:p.reason,scene:{points:[],lines:[],arrows:[],axes:[]},chart:null,axisMetadata:[],color:null,lod:{originalPoints:0,displayedPoints:0,changesComputation:false},table:{title:'정의역과 정밀도 상태',columns:['τ','상태','이유'],rows:[[p.tau,p.state,p.reason]],sourcePaths:[`result.pairs[${index}]`],totalRows:1,truncated:false},details:[{title:'상태를 반환한 원본 프레임',value:p}]};
    return {id:p.id,label:p.label,state:p.state,left:v,right:clone(v),shared:{camera:true,colorRange:null},sourcePath:`result.pairs[${index}]`};
  }
  const colorMode=options.colorMode==='AUTO'?'AUTO':'FIXED';
  const colorPairs=colorMode==='FIXED'?pairs.filter(x=>x.left):[p];
  const colorRange=extent(colorPairs.flatMap(x=>[x.left,x.right]).flatMap(x=>(x.result.visualization?.points||[]).map(v=>v.value)));
  let bounds;
  if(p.shareBounds){const positions=[p.left,p.right].flatMap(x=>(x.result.visualization?.points||[]).map(v=>v.pos));bounds=[0,1,2].map(i=>extent(positions.map(x=>x[i]))||[-1,1]);}
  const views=['left','right'].map(side=>childView(job,p[side],`result.pairs[${index}].${side}.result`,{...options,colorRange,bounds}));
  for(const v of views){if(v.color)v.color.mode=colorMode==='FIXED'?'FIXED_ACROSS_ALL_FRAMES':'AUTO_PER_PAIR_SHARED';v.details.push({title:'비교 관측의 계약',value:{frame:p.id,tau:p.tau??null,sourcePath:`result.pairs[${index}]`,sameCamera:true,sharedBounds:!!p.shareBounds,colorMode,magnification:p.magnification||null}});}
  return {id:p.id,label:p.label,state:'READY',left:views[0],right:views[1],shared:{camera:true,bounds:bounds||null,colorRange,colorMode},sourcePath:`result.pairs[${index}]`};
}

function matrixPanel(id,title,m,sourceField,rowBasis=[],columnBasis=[]){
  if(!m||!Number.isSafeInteger(m.rows)||!Number.isSafeInteger(m.cols)||m.rows*m.cols>24000)return null;
  if(m.rows*m.cols===0){const rows=[[m.cols,m.rows,'정확한 0 사상 · 생성자 없음']];return {id,title,kind:'TABLE',description:'차원 0인 모듈의 사상입니다. 계산된 공행렬을 미계산이나 빈 화면과 구별합니다.',chart:{kind:'COMPARISON_TABLE',columns:['출발 모듈 rank','도착 모듈 rank','사상'],rows},axisMetadata:[axis('모듈의 rank','MODULE_RANK',sourceField)],scene:{points:[],lines:[],arrows:[],axes:[]},table:{title,columns:['출발 모듈 rank','도착 모듈 rank','사상'],rows,sourcePaths:[sourceField],totalRows:1,truncated:false},color:null,lod:{originalPoints:0,displayedPoints:0,changesComputation:false}};}
  const values=Array.from({length:m.rows},()=>Array(m.cols).fill('0')),paths=Array.from({length:m.rows},()=>Array(m.cols).fill(sourceField));
  for(const [k,e]of(m.entries||[]).entries()){values[e[0]][e[1]]=e[2];paths[e[0]][e[1]]=`${sourceField}.entries[${k}][2]`;}
  const label=(b,i)=>typeof b==='string'?b:b?.id||'b'+i,rowLabels=Array.from({length:m.rows},(_,i)=>label(rowBasis[i],i)),columnLabels=Array.from({length:m.cols},(_,i)=>label(columnBasis[i],i));
  const all=values.flatMap((r,i)=>r.map((v,j)=>[rowLabels[i],columnLabels[j],v])),allPaths=paths.flat(),ix=sampleIndices(all.length,200);
  return {id,title,kind:'MATRIX',description:'정수 희소행렬의 정확한 계수입니다. 생략된 항은 구조적 0입니다. 행·열은 기저의 범주이며 거리축이 아닙니다.',chart:{kind:'MATRIX',values,rowLabels,columnLabels,sourceField,sourcePaths:paths},axisMetadata:[axis('열 기저','BASIS_INDEX',sourceField),axis('행 기저','BASIS_INDEX',sourceField),axis('정확한 정수 계수','EXACT_INTEGER',sourceField)],scene:{points:values.flatMap((r,i)=>r.map((v,j)=>({pos:[j,i,0],value:v,sourcePath:paths[i][j]}))),lines:[],arrows:[],axes:['열 기저','행 기저','display plane']},table:{title,columns:['행 기저','열 기저','정확한 계수'],rows:ix.map(i=>all[i]),sourcePaths:ix.map(i=>allPaths[i]),totalRows:all.length,truncated:all.length>ix.length},color:null,lod:{originalPoints:all.length,displayedPoints:all.length,changesComputation:false}};
}
export function observationPanels(job){
  const r=job?.result;if(!r)return [];
  const out=(r.pairs||[]).map(p=>({id:p.id,title:p.label+(p.state?' · '+p.state:' · 나란히 비교')}));
  if(r.states?.every(s=>Array.isArray(s.correlator))){
    const monteCarlo=r.states[0].correlatorAxis==='MONTE_CARLO_LAG',xField=monteCarlo?'lag':'time',yField=monteCarlo?'value':'correlation';
    const series=r.states.map((s,k)=>({label:'Δ='+s.delta,color:k?'#ffd282':'#76e2cd',dash:k?[5,3]:[],points:s.correlator.map((p,i)=>({x:p[xField],y:p[yField],sourcePath:`result.states[${k}].correlator[${i}].${yField}`}))}));
    const x=axis(monteCarlo?'알고리즘 sweep lag':'스펙트럼 시간 t',monteCarlo?'MONTE_CARLO_LAG':'SPECTRAL_TIME',`result.states[*].correlator[*].${xField}`,monteCarlo?'sweeps':'declared hbar/E'),y=axis(monteCarlo?'Wilson 작용 자기상관':'C(t)',monteCarlo?'EMPIRICAL_CORRELATION':'SPECTRAL_CORRELATOR',`result.states[*].correlator[*].${yField}`);
    out.push({id:'correlator',title:'Δ별 상관함수 · 같은 모형 규칙',kind:'SERIES',description:r.states.map(s=>'Δ='+s.delta+': '+s.correlatorRule).join('\n'),chart:{kind:'SERIES',series,xLabel:x.label,yLabel:y.label},axisMetadata:[x,y],scene:{points:series.flatMap(s=>s.points.map(p=>({...p,pos:[p.x,p.y,0],value:p.y}))),lines:[],arrows:[],axes:[x.label,y.label,'display plane']},table:{title:'상관함수 원본 값',columns:['Δ',x.label,y.label],rows:r.states.flatMap(s=>s.correlator.map(p=>[s.delta,p[xField],p[yField]])),sourcePaths:series.flatMap(s=>s.points.map(p=>p.sourcePath)),totalRows:series.reduce((n,s)=>n+s.points.length,0),truncated:false},color:null});
  }
  const d=r.results,c=d?.complex;
  if(c?.basis){
    for(const [k,m]of(c.differentials||[]).entries())out.push(matrixPanel('d-'+k,'d : C'+k+' → C'+(k+1),m,`result.results.complex.differentials[${k}]`,c.basis[k+1],c.basis[k]));
    for(const [k,m]of(d.frobenius?.maps||[]).entries())out.push(matrixPanel('f-'+k,'Frobenius : C'+k,m,`result.results.frobenius.maps[${k}]`,d.frobenius.target?.basis?.[k]||c.basis[k],c.basis[k]));
    for(const [k,m]of(d.change?.B||[]).entries())out.push(matrixPanel('basis-'+k,'기저 변환 B : C'+k,m,`result.results.change.B[${k}]`,d.source.complex.basis[k],c.basis[k]));
    for(const [k,m]of(d.filtration?.inclusion||[]).entries())out.push(matrixPanel('filtration-'+k,'Hodge inclusion : F¹ C'+k,m,`result.results.filtration.inclusion[${k}]`,c.basis[k],d.filtration.basis?.[k]));
    for(const [k,m]of(d.retraction?.i||[]).entries())out.push(matrixPanel('kernel-'+k,'비교 i : H'+k+' → C'+k+' · cohomology 대표',m,`result.results.retraction.i[${k}]`,c.basis[k],d.retraction.K?.basis?.[k]));
    for(const [k,m]of(d.retraction?.r||[]).entries())out.push(matrixPanel('comparison-r-'+k,'비교 r : C'+k+' → H'+k,m,`result.results.retraction.r[${k}]`,d.retraction.K?.basis?.[k],c.basis[k]));
    for(const [k,m]of(d.retraction?.h||[]).entries())out.push(matrixPanel('comparison-h-'+k,'Homotopy h : C'+k+' → C'+(k-1),m,`result.results.retraction.h[${k}]`,c.basis[k-1],c.basis[k]));
  }
  return out.filter(Boolean);
}
