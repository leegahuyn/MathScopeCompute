/**
 * Read-only presentation adapter for M1/M2 computation receipts.
 * No calculation/proof state is mutated. Exact cells are retained independently
 * of the finite binary64 coordinates used by the display renderer.
 */
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

export const VISUALIZATION_VERSION = '2.0.0';
const TERMINAL_FAILURE = new Set(['FAILED','CANCELLED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']);
const COPY = value => value === undefined ? null : JSON.parse(JSON.stringify(value));
const isFiniteNumber = v => typeof v === 'number' && Number.isFinite(v);
const minmax = values => { let lo=Infinity,hi=-Infinity; for(const v of values)if(Number.isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}return lo===Infinity?null:[lo,hi]; };
const point3 = v => Array.isArray(v) && v.length===3 && v.every(Number.isFinite);
const cap = (v,fallback,maximum) => Number.isSafeInteger(v)&&v>0?Math.min(v,maximum):fallback;

/** Explicit scalar admission; a p-adic residue is never silently a real scalar. */
export function numericValue(value) {
  if(isFiniteNumber(value))return value;
  if(typeof value==='bigint')return Number.isFinite(Number(value))?Number(value):NaN;
  if(typeof value==='string'){
    const s=value.trim();
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)){
      const n=Number(s);return Number.isFinite(n)&&(n!==0||!/[1-9]/.test(s.split(/[eE]/)[0]))?n:NaN;
    }
    if(/^[+-]?\d+\/[+-]?\d+$/.test(s)){
      const [a,b]=s.split('/').map(Number),n=a/b;
      return Number.isFinite(a)&&Number.isFinite(b)&&b!==0&&Number.isFinite(n)&&(n!==0||a===0)?n:NaN;
    }
    return NaN;
  }
  if(!value||Array.isArray(value)||typeof value!=='object')return NaN;
  if(['FLOAT64','EXACT_INTEGER','INTEGER','RATIONAL','EXACT_RATIONAL','REAL'].includes(value.kind)&&'value' in value)return numericValue(value.value);
  if(['RATIONAL','EXACT_RATIONAL'].includes(value.kind))return numericValue(String(value.numerator??value.n)+'/'+String(value.denominator??value.d));
  if(value.type==='real-ball'&&'midpoint' in value)return numericValue(value.midpoint);
  // Exact interval certificates use {exact:'a/b', approximate:...} scalars.
  if(typeof value.exact==='string')return numericValue(value.exact);
  return NaN;
}

/** Full exact/typed value for a table cell; no toPrecision and no unsafe integer cast. */
export function scalarText(value) {
  if(value===undefined||value===null)return '—';
  if(typeof value==='string'||typeof value==='number'||typeof value==='bigint')return String(value);
  if(typeof value==='boolean')return value?'true':'false';
  if(Array.isArray(value))return '['+value.map(scalarText).join(', ')+']';
  if(value.kind==='FLOAT64')return String(value.value)+' [Float64]';
  if(['EXACT_INTEGER','INTEGER','REAL'].includes(value.kind)&&'value' in value)return scalarText(value.value);
  if(['RATIONAL','EXACT_RATIONAL'].includes(value.kind))return 'value' in value?scalarText(value.value):String(value.numerator??value.n)+'/'+String(value.denominator??value.d);
  if(value.kind==='PADIC_BALL')return value.residue+' + O('+value.p+'^'+value.digits+')';
  if(value.type==='real-ball')return '['+scalarText(value.lower)+', '+scalarText(value.upper)+']';
  if(typeof value.exact==='string')return value.exact;
  return JSON.stringify(value);
}

export function sampleIndices(length,limit) {
  if(length<=0)return [];
  limit=cap(limit,4000,24000);
  if(length<=limit)return Array.from({length},(_,i)=>i);
  if(limit===1)return [0];
  return Array.from({length:limit},(_,i)=>Math.floor(i*(length-1)/(limit-1)));
}
const sample = (list,n) => sampleIndices(list.length,n).map(i=>list[i]);
const axis = (label,type,sourceField,extra={}) => ({label,type,unit:'1',sourceField,scale:'linear',transform:'identity',dataDimension:1,physicalDimension:null,...extra});
const col = (label,sourceField,type='EXACT_OR_TYPED') => ({label,sourceField,type});
function table(columns,rows,sourcePaths,title='정확한 관측값') {return {title,columns:columns.map(c=>typeof c==='string'?col(c,c):c),rows:rows.map(r=>r.map(scalarText)),sourcePaths:sourcePaths||rows.map(()=>null),totalRows:rows.length,truncated:false};}
const emptyScene = () => ({points:[],lines:[],arrows:[],axes:['','','']});
function sceneFromChart(chart) {
  const points=[],lines=[];
  if(chart.kind==='SERIES')for(const s of chart.series||[]){const ps=(s.points||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));for(const p of ps)points.push({pos:[p.x,p.y,0],value:p.y,label:p.label||s.label,sourcePath:p.sourcePath,color:s.color});if(s.connect!==false&&ps.length>1)lines.push({points:ps.map(p=>[p.x,p.y,0]),label:s.label,color:s.color});}
  if(chart.kind==='MATRIX')for(let i=0;i<chart.values.length;i++)for(let j=0;j<chart.values[i].length;j++){const v=numericValue(chart.values[i][j]);if(Number.isFinite(v))points.push({pos:[j,i,0],value:v,label:`${chart.rowLabels[i]}, ${chart.columnLabels[j]}: ${scalarText(chart.values[i][j])}`,sourcePath:`${chart.sourceField}[${i}][${j}]`});}
  if(chart.kind==='INTERVALS')for(const [i,p]of chart.items.entries()){if(Number.isFinite(p.midpoint))points.push({pos:[i,p.midpoint,0],value:p.midpoint,label:p.label,sourcePath:p.sourcePath});if(Number.isFinite(p.lower)&&Number.isFinite(p.upper))lines.push({points:[[i,p.lower,0],[i,p.upper,0]],label:p.label});}
  if(chart.kind==='NETWORK'){const byId=new Map(chart.nodes.map(n=>[n.id,n]));for(const n of chart.nodes)points.push({pos:[n.x,n.y,0],label:n.label,sourcePath:n.sourcePath});for(const e of chart.edges){const a=byId.get(e.from),b=byId.get(e.to);if(a&&b)lines.push({points:[[a.x,a.y,0],[b.x,b.y,0]],label:e.label||''});}}
  if(chart.kind==='CHECKS')for(const [i,p]of chart.items.entries())points.push({pos:[i,p.pass===true?1:p.pass===false?0:.5,0],label:p.label+' · '+p.status,value:p.pass===true?1:p.pass===false?0:.5,sourcePath:p.sourcePath});
  return {points,lines,arrows:[],axes:[chart.xLabel||'',chart.yLabel||'','도식 배치']};
}

function matrixView(values,rowLabels,columnLabels,sourceField,title,meaning) {
  const rows=values.flatMap((r,i)=>r.map((v,j)=>[rowLabels[i],columnLabels[j],v]));
  const paths=values.flatMap((r,i)=>r.map((_,j)=>`${sourceField}[${i}][${j}]`));
  return {kind:'MATRIX',title,description:meaning,chart:{kind:'MATRIX',values:COPY(values),rowLabels,columnLabels,sourceField,xLabel:'열 · '+(columnLabels[0]?.startsWith('α')?'simple root':'basis'),yLabel:'행 · '+(rowLabels[0]?.startsWith('α')?'simple coroot':'basis')},axisMetadata:[axis('열','CATEGORICAL',sourceField),axis('행','CATEGORICAL',sourceField),axis('계수','EXACT_RATIONAL',sourceField)],table:table(['행','열','정확한 계수'],rows,paths),lostInformation:['행·열의 간격은 군 다양체의 거리나 근의 유클리드 각도가 아닙니다.']};
}

function arithmeticCertificate(r) {
  const data=r.results||{},cert=data.certificate;
  if(!cert)return null;
  const nodes=[],edges=[],rows=[],paths=[],depthCount=new Map();
  const visit=(c,depth,parent,path,exponent)=>{
    if(nodes.length>=256)return;
    const id=path,y=depthCount.get(depth)||0;depthCount.set(depth,y+1);
    nodes.push({id,x:depth,y,label:'n='+c.n,sourcePath:path});
    rows.push([c.n,c.scheme,c.witness??c.base??'—',exponent??'—',parent?nodes.find(n=>n.id===parent)?.label:'root']);paths.push(path);
    if(parent)edges.push({from:parent,to:id,label:'因子 ^'+exponent});
    for(const [i,f]of (c.factors||[]).entries())if(f.certificate)visit(f.certificate,depth+1,id,path+`.factors[${i}].certificate`,f.exponent);
  };
  visit(cert,0,null,'result.results.certificate',null);
  return {kind:'NETWORK',title:'Lucas–Pratt 소수 인증 의존 그래프',description:'노드는 증명서에 등장한 정확한 정수이며, 선은 n−1의 소인수 인증 의존성을 표시합니다. 큰 정수는 문자열 그대로 보존합니다.',chart:{kind:'NETWORK',nodes,edges,xLabel:'인증 의존 깊이',yLabel:'동일 깊이의 인증 노드'},axisMetadata:[axis('인증 의존 깊이','CATEGORICAL','certificate.factors'),axis('노드 배치','CATEGORICAL','certificate.n')],table:table(['정확한 n','인증 방식','witness / base','소인수 지수','상위 인증'],rows,paths),lostInformation:['노드 사이 거리는 정수 차이나 소수 분포를 나타내지 않습니다.','화면은 정확한 인증 계산의 결과 표시이며 새 Lean 커널 증명을 만들지 않습니다.']};
}

function padicView(r) {
  const d=r.results||{},op=d.operation;
  if(d.value?.kind==='PADIC_BALL'){
    const ball=d.value,p=BigInt(ball.p),N=ball.digits;let residue=BigInt(ball.residue);const points=[],rows=[];
    for(let i=0;i<N;i++){const digit=residue%p;residue/=p;const n=Number(digit);if(Number.isFinite(n))points.push({x:i,y:n,label:`a_${i}=${digit}`,sourcePath:`result.results.value:digit[${i}]`});rows.push([i,digit,p.toString()+'^'+i,ball.residue,ball.digits]);}
    return {kind:'SERIES',title:'p-adic 유한 정밀도 자리 관측',description:`${scalarText(ball)} · 계수 a_k는 Σ a_k p^k의 정확한 유한 자리입니다. ${d.precision?.formula||''}`,chart:{kind:'SERIES',series:[{label:'p-adic digit a_k',connect:false,points}],xLabel:'자리 지수 k',yLabel:'정확한 자리 계수 a_k',xInteger:true},axisMetadata:[axis('자리 지수 k','PADIC_DIGIT_INDEX','result.results.value.digits'),axis('자리 계수 a_k','INTEGER_DIGIT','result.results.value.residue')],table:table(['자리 k','정확한 a_k','자리 가중치','원본 residue','확정 자리수 N'],rows,rows.map((_,i)=>`result.results.value:digit[${i}]`)),details:[{title:'정밀도·guard digit 계약',value:d.precision},{title:'guard digit 반례',value:d.guardDigitCounterexample}],lostInformation:['막대 높이와 화면 거리는 p-adic 거리 또는 p-adic 절댓값이 아닙니다.','N 이후의 자리는 미확정이며 0이라고 표시하지 않습니다.']};
  }
  if(op==='module'&&d.certificate){
    const m=d.certificate.diagonal,v=Array.from({length:m.rows},()=>Array(m.cols).fill('0'));for(const[i,j,x]of m.entries)v[i][j]=x;
    const view=matrixView(v,v.map((_,i)=>'codomain '+i),Array.from({length:m.cols},(_,i)=>'domain '+i),'result.results.certificate.diagonal','유한환 Smith 대각 표현',`계수환 Z/${d.certificate.ring.modulus}. 비가역 p 인자의 정수 계수를 보존합니다.`);
    view.details=[{title:'kernel · image · cokernel',value:d.module},{title:'정확한 basis 변환 U · V',value:{U:d.certificate.U,V:d.certificate.V}},{title:'독립 검사',value:d.verification}];return view;
  }
  if(op==='derivedReduction'&&d.derivedBaseChange){
    const rows=Object.keys(d.derivedBaseChange.cohomology).map(k=>[k,d.source.cohomology[k],d.ordinaryCohomologyTensor[k],d.derivedBaseChange.cohomology[k]]);
    return {kind:'TABLE',title:'Derived base change의 Tor 비교',description:d.reason,chart:{kind:'COMPARISON_TABLE',columns:['차수','원본 cohomology','ordinary tensor','derived base change'],rows:rows.map(r=>r.map(scalarText))},axisMetadata:[axis('cohomology 차수','COHOMOLOGICAL_DEGREE','result.results.derivedBaseChange.cohomology')],table:table(['차수','원본 cohomology','ordinary tensor','derived base change'],rows,rows.map(r=>'result.results.derivedBaseChange.cohomology.'+r[0])),details:[{title:'자유 복합체와 유한환 인증',value:{source:d.source,derived:d.derivedBaseChange,finiteModule:d.finiteModule}}],lostInformation:['문자열 모듈의 차이를 비교합니다. 벡터 공간 차원이나 근접성을 임의로 만들어 표시하지 않습니다.']};
  }
  return null;
}

function groupView(r){
  const g=r.group,d=g?.rootDatum;if(!d?.cartan)return null;
  const view=matrixView(d.cartan,d.cartan.map((_,i)=>'α'+(i+1)+'∨'),d.cartan.map((_,i)=>'α'+(i+1)),'result.group.rootDatum.cartan',g.id+' · 정확한 Cartan 행렬',d.cartanConvention+' · 군 차원 '+g.dimension+', rank '+g.rank+'. 군의 공간 좌표로 해석하지 않습니다.');
  view.details=[{title:'정확한 전체 근 자료',value:d},{title:'행렬 기저 · bracket · Gram',value:{basis:r.exactAlgebra.basis,structureConstants:r.exactAlgebra.structureConstants,gram:r.exactAlgebra.gram}},{title:'Chevalley 비교 기저',value:r.exactAlgebra.chevalley},{title:'정확한 군·대수 검사',value:r.verification}];
  view.relatedTables=[table(['root index','simple-root 좌표','character 좌표','cocharacter 좌표','|α|²'],(d.roots||[]).map((x,i)=>[i,x.simple,x.character,x.cocharacter,x.lengthSquared]),(d.roots||[]).map((_,i)=>`result.group.rootDatum.roots[${i}]`),'정확한 근 좌표')];return view;
}

function spectralView(r){
  const s=r.spectral;if(!s?.samples)return null;
  return {kind:'SERIES',title:'유한 Hamiltonian의 상관함수와 상계',description:`유한 차원 ${s.model.dimension}, gap=${s.gap}, 관측 채널 mass=${s.channelMass}. t는 이 유한 모형의 semigroup 매개변수이며 고전적 4D 장의 x4와 구별됩니다.`,chart:{kind:'SERIES',series:[{label:'C(t)',points:s.samples.map((p,i)=>({x:p.time,y:p.correlation,sourcePath:`result.spectral.samples[${i}].correlation`}))},{label:'명시한 gap 상계',dash:[6,4],points:s.samples.map((p,i)=>({x:p.time,y:p.upperBound,sourcePath:`result.spectral.samples[${i}].upperBound`}))}],xLabel:'spectral time t',yLabel:'C(t) / upper bound'},axisMetadata:[axis('spectral time t','SPECTRAL_TIME','result.spectral.samples.time',{unit:'model time'}),axis('상관함수','SPECTRAL_CORRELATION','result.spectral.samples.correlation')],table:table(['t','C(t)','명시한 gap 상계','위반 잔차'],s.samples.map(p=>[p.time,p.correlation,p.upperBound,p.boundResidual]),s.samples.map((_,i)=>`result.spectral.samples[${i}]`)),details:[{title:'정확히 지정한 유한 모형',value:s.model},{title:'모형의 가정',value:s.assumptions}],lostInformation:['유한 스펙트럼 모형은 양자 Yang–Mills 이론의 존재나 연속체 질량 간극 증명이 아닙니다.']};
}

function nsCoordinates(r){
  if(!r.forward?.position)return null;
  const p=r.forward.position,f=r.forward,inv=r.inverse;
  return {kind:'SPATIAL_3D',title:'Similarity 입력에 대응하는 실제 공간점',description:`같은 τ=${r.input.tau}, ν=${r.input.viscosity}에서 계산한 정방향 좌표와 역변환입니다. 1개 입력점의 계산이므로 주변 장을 생성하지 않습니다.`,scene:{points:[{pos:p.map(numericValue),sourcePosition:COPY(p),label:`X=${f.X}, η=${f.eta}, θ=${f.theta}`,sourcePath:'result.forward.position',radius:6}],lines:[],arrows:[],axes:['physical x','physical y','physical z'],equalScale:true},axisMetadata:['x','y','z'].map((x,i)=>axis('physical '+x,'PHYSICAL_CARTESIAN',`result.forward.position[${i}]`,{unit:'source length',physicalDimension:1})),table:table(['변수','정방향 원본','역변환','왕복 오차'],[['X',f.X,inv.X,r.roundtrip?.X],['η',f.eta,inv.eta,r.roundtrip?.eta],['θ',f.theta,inv.theta,'—'],['physical x',p[0],'—','—'],['physical y',p[1],'—','—'],['physical z',p[2],'—','—'],['τ',r.input.tau,r.input.tau,'—'],['q',f.q,inv.q,inv.rootResidual]],['result.forward.X','result.forward.eta','result.forward.theta','result.forward.position[0]','result.forward.position[1]','result.forward.position[2]','result.input.tau','result.inverse.rootResidual']),details:[{title:'좌표변환·미분 검사',value:r.checks}],lostInformation:['한 점의 정역 좌표 검사이며 완성된 blowup 프로파일이나 τ=0 극한의 증거가 아닙니다.']};
}

function nsHeat(r){
  if(!r.derivatives)return null;
  const items=r.derivatives.map((v,i)=>({label:`H${i?"′".repeat(i):''}(Z)`,lower:numericValue(v.lower),upper:numericValue(v.upper),midpoint:numericValue(v.midpoint),sourcePath:`result.derivatives[${i}]`}));
  return {kind:'INTERVALS',title:'Heat 함수와 도함수의 인증 구간',description:`고정 입력 Z=${r.Z}, h=${r.h}. 각 행에 서로 다른 도함수 구간을 표시합니다. 작은 구간 폭은 아래 정확 수치표에서 확인할 수 있습니다.`,chart:{kind:'INTERVALS',items,xLabel:'인증 구간',yLabel:'도함수 차수',independentRanges:true},axisMetadata:[axis('도함수 차수','DERIVATIVE_ORDER','result.derivatives'),axis('구간 값','REAL_INTERVAL','result.derivatives',{unit:'source normalization'})],table:table(['도함수','하계','midpoint (근사)','상계','반경'],r.derivatives.map((v,i)=>[i,v.lower,v.midpoint,v.upper,v.radius]),r.derivatives.map((_,i)=>`result.derivatives[${i}]`)),details:[{title:'구간 적분 오차 예산',value:r.certificate},{title:'유한 Taylor 계산과 발산 경계',value:r.finiteTaylor},{title:'ODE 잔차 구간',value:r.odeEnclosure}],lostInformation:['서로 다른 도함수의 구간 확대율은 행마다 다릅니다. 구간 사이의 시각적 길이를 크기 비교에 사용하지 않습니다.','유한 Taylor의 표시값을 수렴하는 무한 급수로 해석하지 않습니다.']};
}

function nsMoments(r){
  if(!r.profileSamples)return null;
  return {kind:'SERIES',title:'5모멘트 복원에서 계산한 프로파일',description:'직접 반환한 x, E, U 표본을 표시합니다. 수치 모멘트 일치는 연속 구간 Newton 인증과 별도입니다.',chart:{kind:'SERIES',series:['E','U'].map(k=>({label:k,points:r.profileSamples.map((p,i)=>({x:numericValue(p.x),y:numericValue(p[k]),sourcePath:`result.profileSamples[${i}].${k}`}))})),xLabel:'profile x',yLabel:'E / U'},axisMetadata:[axis('profile x','SIMILARITY_RADIUS','result.profileSamples.x'),axis('E / U','PROFILE_COMPONENT','result.profileSamples')],table:table(['x','E','U'],r.profileSamples.map(p=>[p.x,p.E,p.U]),r.profileSamples.map((_,i)=>`result.profileSamples[${i}]`)),relatedTables:[table(['모멘트','목표 차이','독립 재적분 잔차'],r.momentOrder.map((m,i)=>[m,r.targetDiscrepancy[i],r.residual[i]]),r.momentOrder.map((_,i)=>`result.residual[${i}]`),'모멘트 목표와 수치 잔차')],details:[{title:'Newton 수치 이력·acceptance',value:{history:r.history,acceptance:r.acceptance,intervalNewtonCertified:r.intervalNewtonCertified}}],lostInformation:['표본 사이와 전체 η에 대한 균일 인증은 이 그래프로 추가되지 않습니다.']};
}

function nsCone(r){
  const s=r.modulation?.samples;if(!s)return null;
  return {kind:'SERIES',title:'C.12 변조 연산의 실제 유한 표본',description:r.modulation.scope,chart:{kind:'SERIES',series:[{label:'E_N',points:s.map((p,i)=>({x:p.X,y:p.EN,sourcePath:`result.modulation.samples[${i}].EN`}))},{label:'U_N',points:s.map((p,i)=>({x:p.X,y:p.UN,sourcePath:`result.modulation.samples[${i}].UN`}))}],xLabel:'similarity X',yLabel:'E_N / U_N'},axisMetadata:[axis('X','SIMILARITY_RADIUS','result.modulation.samples.X'),axis('E_N / U_N','PROFILE_COMPONENT','result.modulation.samples')],table:table(['X','E_N','U_N','값 변화','radial derivative 변화'],s.map(p=>[p.X,p.EN,p.UN,p.valueChange,p.radialDerivativeChange]),s.map((_,i)=>`result.modulation.samples[${i}]`)),details:[{title:'전체 매개변수 상자에 대한 별도 구간 검사',value:r.wholeParameterBox},{title:'명시한 변조',value:{formula:r.modulation.formula,N:r.modulation.N,amplitude:r.modulation.amplitude}}],lostInformation:['표본의 변조 연산을 C.1 admissible loop 또는 완성된 전체 프로파일로 승격하지 않습니다.']};
}

function nsProvenance(r){
  const entries=r.map?.claimGraph;if(!entries)return null;
  const nodes=entries.map((x,i)=>({id:x.id,x:0,y:i,label:x.id+' · '+x.references.join(', '),sourcePath:`result.map.claimGraph[${i}]`}));
  return {kind:'NETWORK',title:'원문 구성 단계와 정리 의존성',description:'연결선은 원문에서 추출한 정리 의존성입니다. 문서 매핑 및 부분 커널 검사의 범위를 전체 증명 완료와 구별합니다.',chart:{kind:'NETWORK',nodes,edges:entries.flatMap(x=>x.dependsOn.map(p=>({from:p,to:x.id}))),xLabel:'정리 의존성',yLabel:'구성 단계'},axisMetadata:[axis('구성 단계','CATEGORICAL','result.map.claimGraph')],table:table(['단계','원문 구성','의존성','정리 참조','전체 원문 커널 확인'],entries.map(x=>[x.id,x.label,x.dependsOn,x.references,r.fullSourceProofLocallyVerified]),entries.map((_,i)=>`result.map.claimGraph[${i}]`)),details:[{title:'원본과 환경 결속',value:r.lock},{title:'검증 계약',value:r.analyticContracts}],lostInformation:['의존 그래프에 표시된 노드가 모두 구현되거나 Lean으로 검증되었다는 뜻이 아닙니다.']};
}

function checksView(r){
  if(!Array.isArray(r.checks)||!r.checks.length)return null;
  return {kind:'CHECKS',title:'실행한 독립 검사와 음성 대조군',description:`${r.passed??r.checks.filter(c=>c.pass===true).length} / ${r.total??r.checks.length} 검사. 음성 대조군의 PASS는 의도한 오류를 검출했다는 뜻입니다.`,chart:{kind:'CHECKS',items:r.checks.map((c,i)=>({label:c.name||c.id||'check '+i,pass:c.pass===true||c.ok===true||c.status==='PASS'?true:c.pass===false||c.ok===false?false:null,status:c.negativeControl?'NEGATIVE CONTROL':c.status||String(c.pass??c.ok??'UNSPECIFIED'),sourcePath:`result.checks[${i}]`}))},axisMetadata:[axis('검사 이름','CATEGORICAL','result.checks.name'),axis('검사 상태','CATEGORICAL','result.checks.pass')],table:table(['검사','pass','음성 대조군','오차 / 관측값','허용값'],r.checks.map(c=>[c.name||c.id,c.pass??c.ok??c.status,c.negativeControl??false,c.error??c.normalizedError??c.value??'—',c.tolerance??'—']),r.checks.map((_,i)=>`result.checks[${i}]`)),lostInformation:['유한 검사들의 PASS를 전체 PDE 해나 무한 영역 증명으로 해석하지 않습니다.']};
}

function complexView(r,raw){
  const d=r.results;if(!d?.complex)return null;
  const groups=d.complex.basis||[],dims=d.complex.dims||groups.map(b=>b.length);
  const inherited=raw?.points?.length?null:{kind:'SERIES',title:'점의 finite-perfect 복합체',description:'C⁰의 한 생성자와 해당 Frobenius를 표시합니다. cochain 차수와 공간 좌표는 다릅니다.',chart:{kind:'SERIES',series:[{label:'chain group rank',connect:false,points:dims.map((v,i)=>({x:i,y:v,sourcePath:`result.results.complex.dims[${i}]`}))}],xLabel:'cohomological degree k',yLabel:'chain group rank',xInteger:true},axisMetadata:[axis('k','COHOMOLOGICAL_DEGREE','result.results.complex.dims'),axis('rank Cᵏ','MODULE_RANK','result.results.complex.dims')],table:table(['cochain degree','basis index','정확한 basis','Frobenius'],groups.flatMap((b,k)=>b.map((v,i)=>[k,i,v,d.frobenius?.cohomology?.find(x=>x.degree===k)?.multiplier??'—'])),groups.flatMap((b,k)=>b.map((_,i)=>`result.results.complex.basis[${k}][${i}]`))),lostInformation:['표시상 간격은 p-adic 거리나 위상적 인접성이 아닙니다.']};
  const details=[{title:'chain groups · differential',value:d.complex},{title:'kernel/image와 cohomology',value:d.smith||d.cohomology},{title:'Frobenius chain maps',value:d.frobenius},{title:'filtration · inclusion',value:d.filtration},{title:'comparison maps · 가정',value:d.comparison?.arrows},{title:'strong deformation retraction',value:d.retraction}].filter(x=>x.value!==undefined);
  return inherited?{...inherited,details}:{details};
}

/** Selected source basis column, preserving exact coefficients and target basis IDs. */
export function traceBasis(job,degree,index){
  const d=job?.result?.results,c=d?.complex;
  if(!Number.isSafeInteger(degree)||!Number.isSafeInteger(index)||degree<0||index<0||!c?.basis?.[degree]||index>=c.basis[degree].length)return {ok:false,status:'INVALID_BASIS'};
  const outgoing=(matrix,targetBasis,sourceField)=>!matrix?[]:(matrix.entries||[]).filter(([,j])=>j===index).map(([i,,value])=>({targetIndex:i,target:targetBasis?.[i]??i,coefficient:value,sourceField}));
  const basis=c.basis[degree][index];
  return {ok:true,inputHash:job.inputHash??null,jobId:job.id,basis: COPY(basis),degree,index,differential:outgoing(c.differentials?.[degree],c.basis[degree+1],`result.results.complex.differentials[${degree}]`),frobenius:outgoing(d.frobenius?.maps?.[degree],d.frobenius?.target?.basis?.[degree]||c.basis[degree],`result.results.frobenius.maps[${degree}]`),filtrationMembership:d.filtration?.basis?.[degree]?.some(b=>typeof b==='object'&&typeof basis==='object'?b.id===basis.id:canonicalStringify(b)===canonicalStringify(basis))??null,computedInvariants:COPY(d.smith?.cohomology||d.cohomology||null),invariantSource:'EXISTING_COMPUTATION_RESULT',comparison:COPY(d.comparison?.arrows||[])};
}

/** Exact coverage tiles; never represents an uncomputed interval as zero primes. */
export function primeTiles(job,{a,b}={}) {
  const d=job?.result?.results;if(!Array.isArray(d?.segments))return {status:'UNAVAILABLE',tiles:[]};
  const tiles=d.segments.map((s,i)=>({a:s.a,b:s.b,status:'COMPUTED_EXACT',primeCount:s.primes?.length??s.count??null,hash:s.hash,sourceField:`result.results.segments[${i}]`}));
  const start=a===undefined?null:BigInt(a),end=b===undefined?null:BigInt(b),out=[];
  if(start!==null&&end!==null&&end<start)throw Error('Prime viewport end precedes start.');
  let cursor=start;
  for(const t of tiles){const ta=BigInt(t.a),tb=BigInt(t.b);if(start!==null&&tb<start||end!==null&&ta>end)continue;const lo=start!==null&&ta<start?start:ta,hi=end!==null&&tb>end?end:tb;if(cursor!==null&&lo>cursor)out.push({a:String(cursor),b:String(lo-1n),status:'UNCOMPUTED',primeCount:null});out.push({...t,visibleA:String(lo),visibleB:String(hi)});cursor=hi+1n;}
  if(end!==null&&cursor!==null&&cursor<=end)out.push({a:String(cursor),b:String(end),status:'UNCOMPUTED',primeCount:null});
  return {status:'EXACT_FINITE_COVERAGE',definition:d.domain?.definition||'P = {p ∈ Z : p ≥ 2 and p has exactly two positive divisors}',tiles:out.length?out:tiles,sourceHash:d.rawHash,intervalCount:d.intervalCount,boundaryRule:'closed disjoint tiles; next a = previous b + 1'};
}

function rawView(job,raw,options){
  const r=job.result,kind=job.request?.kind||r.kind||'',maxPoints=cap(options.maxPoints,4000,6000),maxLineVertices=cap(options.maxLineVertices,12000,24000),invalid=[];
  const convert=(p,path)=>{if(!Array.isArray(p)||p.length!==3){invalid.push(path);return null;}const v=p.map(numericValue);if(!point3(v)){invalid.push(path);return null;}return v;};
  let points=(raw.points||[]).map((p,i)=>{const pos=convert(p.pos,`visualization.points[${i}].pos`);return pos?{...COPY(p),pos,sourcePosition:COPY(p.pos),sourceIndex:p.sourceIndex??i,sourcePath:`result.visualization.points[${i}]`}:null;}).filter(Boolean);
  const originalPoints=points.length;points=sample(points,maxPoints);
  const lines=[];let remaining=maxLineVertices;
  for(const[i,l]of (raw.lines||[]).entries()){
    if(remaining<2)break;
    // Split at invalid vertices. Filtering vertices alone would invent a join.
    let run=[];const flush=()=>{if(run.length>1&&remaining>=2){const ps=sample(run,Math.min(remaining,Math.max(2,Math.floor(maxLineVertices/Math.max(1,raw.lines.length)))));remaining-=ps.length;lines.push({...COPY(l),points:ps.map(x=>x.pos),sourcePositions:ps.map(x=>x.source),sourcePath:`result.visualization.lines[${i}]`});}run=[];};
    for(const[j,p]of(l.points||[]).entries()){const pos=convert(p,`visualization.lines[${i}].points[${j}]`);if(pos)run.push({pos,source:COPY(p)});else flush();}flush();
  }
  let arrows=(raw.arrows||[]).map((a,i)=>{const pos=convert(a.pos,`visualization.arrows[${i}].pos`),vector=convert(a.vector,`visualization.arrows[${i}].vector`);return pos&&vector?{...COPY(a),pos,vector,sourceVector:COPY(a.vector),sourcePath:`result.visualization.arrows[${i}]`}:null;}).filter(Boolean);const originalArrows=arrows.length;arrows=sample(arrows,Math.min(1200,maxPoints));
  let arrowDisplayScale=1;
  if(arrows.length){const coords=points.map(p=>p.pos).concat(arrows.map(a=>a.pos)),ranges=[0,1,2].map(i=>minmax(coords.map(p=>p[i]))),span=Math.max(...ranges.filter(Boolean).map(b=>b[1]-b[0])),magnitude=Math.max(...arrows.map(a=>Math.hypot(...a.vector)));if(Number.isFinite(magnitude)&&magnitude>0)arrowDisplayScale=.18*(span||1)/magnitude;arrows=arrows.map(a=>({...a,vector:a.vector.map(v=>v*arrowDisplayScale)}));}
  const axes=[0,1,2].map(i=>{const a=raw.axes?.[i];return typeof a==='string'?a:a?.label||a?.name||'axis '+i;});
  const physicalGaugeKinds=['gauge.field','gauge.family','gauge.holonomy','gauge.lattice','gauge.ensemble'];
  const legacyPhysical=physicalGaugeKinds.includes(kind)||['ns.exterior','ns.benchmark','ns.leading-profile'].includes(kind);
  const axisMetadata=axes.map((label,i)=>{
    const declared=typeof raw.axes?.[i]==='object'?raw.axes[i]:{},log=/log/i.test(label),unit=declared.unit|| (legacyPhysical?'declared source length':'1');
    let type=declared.type||declared.kind||(legacyPhysical?'PHYSICAL_CARTESIAN':/index|degree|weight|prime|p$|정수|속성|간격/i.test(label)?'DATA_ATTRIBUTE':'PROFILE_COORDINATE');
    if(type==='PHYSICAL')type=/time|시간/i.test(unit)||/tau|τ|time|^t$|1-t/i.test(label)?'PHYSICAL_TIME':'PHYSICAL_COORDINATE';
    const dimension=declared.physicalDimension??(/^PHYSICAL_(CARTESIAN|CARTESIAN_COORDINATE|SPACE_COORDINATE|COORDINATE|LENGTH|TIME)$/.test(type)?1:0);
    return axis(label,type,`result.visualization.points[*].pos[${i}]`,{unit,scale:log?'stored-log':'linear',transform:log?'log coordinates supplied by computation':'identity',...declared,type,physicalDimension:dimension,coordinateRole:type,dataDimension:declared.dataDimension??1});
  });
  // A mathematical domain name cannot turn sample indices, curvature errors,
  // cohomological degrees, or a mixed (r,z,tau) chart into 3D spatial coordinates.
  const spatialAxis=a=>['PHYSICAL_CARTESIAN','PHYSICAL_SPACE_COORDINATE','PHYSICAL_COORDINATE','PHYSICAL_CARTESIAN_COORDINATE'].includes(a.type);
  const physical=axisMetadata.every(spatialAxis)&&new Set(axisMetadata.map(a=>a.unit)).size===1;
  const values=points.map(p=>numericValue(p.value)).filter(Number.isFinite),range=options.colorRange&&options.colorRange.length===2&&options.colorRange.every(Number.isFinite)&&options.colorRange[0]<=options.colorRange[1]?options.colorRange.slice():minmax(values);
  const tableRows=points.map(p=>[p.sourceIndex,...p.sourcePosition,p.value,p.label||'']);
  const rows=tableRows.length?tableRows:arrows.map((a,i)=>[i,...a.pos,a.sourceVector,'vector']);
  return {kind:physical?'SPATIAL_3D':'RELATION_3D',title:raw.description||kind,description:typeof raw.coordinateMeaning==='string'?raw.coordinateMeaning:JSON.stringify(raw.coordinateMeaning||{}),scene:{points,lines,arrows,axes,equalScale:physical,bounds:options.bounds||raw.bounds},axisMetadata,color:{quantity:raw.valueMeaning||job.request?.input?.observation?.quantity||'관측값',unit:raw.valueUnits||'declared by source',range,mode:options.colorRange?'FIXED':'AUTO'},table:table([col('원본 표본 index','sourceIndex'),...axisMetadata.map(a=>col(a.label,a.sourceField,a.type)),col('원본 값','value'),col('표본 설명','label')],rows,(points.length?points:arrows).map(p=>p.sourcePath)),lostInformation:[...(raw.lostInformation||[]),...(arrowDisplayScale!==1?[`표시 화살표는 원본 벡터에 공통 배율 ${arrowDisplayScale}을 적용했습니다. 수치표/원본 sourceVector는 배율을 적용하지 않았습니다.`]:[])],lod:{originalPoints,displayedPoints:points.length,originalArrows,displayedArrows:arrows.length,lineVertexBudget:maxLineVertices,invalidCoordinates:invalid.length,invalidPaths:invalid.slice(0,20),method:'DETERMINISTIC_UNIFORM_SOURCE_INDEX_WITH_ENDPOINTS',changesComputation:false},observation:{kind:r.observation?.kind||raw.observation?.kind||(kind==='gauge.holonomy'?'WILSON_PATH':null),sourceDimension:raw.sourceDimension??(physicalGaugeKinds.includes(kind)?4:physical?3:null),displayDimension:raw.displayDimension??3,physicalDimension:physical?3:0,coordinateTypes:axisMetadata.map(a=>a.type),nonInjective:raw.sourceDimension>raw.displayDimension||physicalGaugeKinds.includes(kind),reconstructionAllowed:false,endpointConvention:r.holonomy?{closed:r.holonomy.closed,observable:r.holonomy.gaugeInvariantObservable,gauge:job.request?.input?.gauge,sourcePath:job.request?.input?.path}:null},details:[]};
}

function fallbackTable(r){
  const d=r.results||r,rows=[],paths=[];
  const skip=new Set(['references','sources','provenance','executionMetrics','sourceLedger','integrityPayload','visualization','request']);
  const walk=(v,path,depth)=>{if(rows.length>=160)return;if(v===null||typeof v!=='object'){rows.push([path,scalarText(v)]);paths.push(path);return;}if(depth>=3||Array.isArray(v)&&v.length>16){rows.push([path,scalarText(v)]);paths.push(path);return;}for(const[k,x]of Object.entries(v))if(!skip.has(k))walk(x,path+(Array.isArray(v)?'['+k+']':'.'+k),depth+1);};
  walk(d,r.results?'result.results':'result',0);
  return {kind:'TABLE',title:'정확한 결과와 계약 자료',description:'이 결과에 정의된 공간 관측이 없어, 반환된 계산·검증 항목을 원본 필드에 연결하여 표시합니다.',chart:{kind:'COMPARISON_TABLE',columns:['원본 필드','값'],rows:rows.map(x=>x.map(scalarText))},axisMetadata:[axis('결과 항목','CATEGORICAL','result')],table:table(['원본 필드','정확한 값 / 계약'],rows,paths),lostInformation:['정의되지 않은 공간 좌표나 물리 모형을 생성하지 않습니다.']};
}

/** Build only from this job's result. Mismatching editor state blanks old marks. */
export function makeVisualization(job,options={}) {
  const r=job?.result,request=job?.request,kind=request?.kind||r?.kind||'none';
  let editorMatches=options.currentEditorMatches!==false;
  if(options.currentRequest!==undefined)try{editorMatches=canonicalStringify(options.currentRequest)===canonicalStringify(request);}catch{editorMatches=false;}
  const binding={jobId:job?.id??null,kind,inputHash:job?.inputHash??null,resultHash:job?.resultHash??r?.resultHash??null,sourceHash:r?.sourceHash??r?.visualization?.sourceHash??r?.values?.visualization?.sourceHash??r?.results?.rawHash??r?.hashes?.physicalField??r?.parameterHash??r?.sourceLedger?.attachmentSha256??r?.group?.exactDataSha256??job?.inputHash??null,modelHash:r?.modelHash??r?.hashes?.physicalField??r?.results?.modelHash??r?.group?.exactDataSha256??null,sampleHash:options.observationIdentity?.sampleHash??r?.sampleHash??null,observationHash:options.observationIdentity?.observationHash??r?.visualization?.observationHash??r?.values?.visualization?.observationHash??null,displayTransformHash:r?.hashes?.display??null,currentEditorMatches:editorMatches,calculationStatus:job?.status??r?.status??'NOT_RUN',representationRevision:cap(options.representationRevision,1,Number.MAX_SAFE_INTEGER),formalPass:false};
  const base={schema:'MathScope.SourceBoundVisualization/1',version:VISUALIZATION_VERSION,binding,scene:emptyScene(),chart:null,table:table(['상태','설명'],[]),axisMetadata:[],details:[],relatedTables:[],lostInformation:[],color:null,lod:{originalPoints:0,displayedPoints:0,changesComputation:false}};
  if(!editorMatches)return {...base,state:'INPUT_CHANGED',kind:'STATE',title:'입력이 변경되었습니다',description:'선택한 실행 기록은 이전 입력의 결과입니다. 현재 입력을 실행하거나, 작업 목록에서 기록을 선택해 해당 입력을 복원하세요.',table:table(['실행','입력 SHA-256','상태'],[[binding.jobId,binding.inputHash,'현재 입력과 불일치']])};
  if(!r)return {...base,state:job?'WAITING':'NOT_RUN',kind:'STATE',title:job?'현재 계산을 기다리고 있습니다':'예제를 선택하고 실행하세요',description:'현재 입력에 연결된 계산 결과가 준비되면 관측과 수치표를 표시합니다.'};
  if(TERMINAL_FAILURE.has(job?.status)||TERMINAL_FAILURE.has(r.status))return {...base,state:job?.status||r.status,kind:'STATE',title:job?.status||r.status,description:r.message||r.reason||scalarText(r.blockers||r.contractReport||'이 입력에는 표시 가능한 계산 결과가 없습니다.'),table:table(['결과 상태','계산에서 반환한 이유'],[[job?.status||r.status,r.message||r.reason||r.blockers||r.contractReport||'not available']])};
  const raw=r.visualization||r.values?.visualization;
  let view;
  if(kind==='arithmetic.primeCertificate')view=arithmeticCertificate(r);
  else if(kind==='arithmetic.padic')view=padicView(r);
  else if(kind==='gauge.group')view=groupView(r);
  else if(kind==='gauge.spectral')view=spectralView(r);
  else if(kind==='ns.coordinates')view=nsCoordinates(r);
  else if(kind==='ns.heat')view=nsHeat(r);
  else if(kind==='ns.moments')view=nsMoments(r);
  else if(kind==='ns.cone')view=nsCone(r);
  else if(kind==='ns.provenance')view=nsProvenance(r);
  else if(kind==='ns.validate')view=checksView(r);
  if(!view&&raw&&((raw.points?.length||0)+(raw.lines?.length||0)+(raw.arrows?.length||0)>0))view=rawView(job,raw,options);
  if(kind==='arithmetic.point'||kind==='arithmetic.p1'){const complex=complexView(r,raw);if(complex)view=view?{...view,details:[...(view.details||[]),...complex.details]}:complex;}
  view=view||fallbackTable(r);
  if(!view.scene)view.scene=view.chart?sceneFromChart(view.chart):emptyScene();
  const maxRows=cap(options.maxRows,200,1000),t=view.table;
  if(t&&t.rows.length>maxRows){const idx=sampleIndices(t.rows.length,maxRows);view.table={...t,rows:idx.map(i=>t.rows[i]),sourcePaths:idx.map(i=>t.sourcePaths[i]),truncated:true,totalRows:t.rows.length,selection:'DETERMINISTIC_SOURCE_INDEX_WITH_ENDPOINTS'};}
  if(kind==='arithmetic.primes'&&r.results?.segments){const tiles=primeTiles(job,options.primeViewport||{});view.primeAtlas=tiles;view.relatedTables=[...(view.relatedTables||[]),table(['tile a','tile b','계산 상태','정확한 소수 개수','tile hash'],tiles.tiles.map(t=>[t.a,t.b,t.status,t.primeCount,t.hash]),tiles.tiles.map(t=>t.sourceField),'계산한 소수 타일')];}
  if(!view.scene.points.length&&!view.scene.lines.length&&!view.scene.arrows.length&&view.kind!=='TABLE'&&view.kind!=='STATE'){
    view={...view,kind:'TABLE',chart:{kind:'COMPARISON_TABLE',columns:view.table?.columns.map(c=>c.label)||[],rows:view.table?.rows||[]},description:view.description+' · 유한 표시좌표가 없어 정확 수치표로 표시합니다.'};
  }
  return {...base,...view,state:'READY',binding};
}

/** Shared limits for two already-computed observations; does not generate a state. */
export function compareVisualizations(leftJob,rightJob,options={}){
  const left=makeVisualization(leftJob,options),right=makeVisualization(rightJob,options);
  if(left.state!=='READY'||right.state!=='READY')return {ok:false,status:'NOT_READY',left,right};
  if(left.binding.kind!==right.binding.kind||JSON.stringify(left.axisMetadata.map(a=>[a.type,a.unit,a.transform]))!==JSON.stringify(right.axisMetadata.map(a=>[a.type,a.unit,a.transform])))return {ok:false,status:'INCOMPATIBLE_OBSERVATIONS',left,right};
  const contract=j=>({result:j.result?.observation||null,visualization:(j.result?.visualization||j.result?.values?.visualization)?.observation||null});
  if(canonicalStringify(contract(leftJob))!==canonicalStringify(contract(rightJob)))return {ok:false,status:'OBSERVATION_CONTRACT_DIFFERS',left,right};
  const pos=[...left.scene.points,...right.scene.points].map(p=>p.pos),bounds=[0,1,2].map(i=>minmax(pos.map(p=>p[i]))||[-1,1]);
  for(const b of bounds)if(b[0]===b[1]){b[0]-=.5;b[1]+=.5;}
  const colorRange=minmax([...(left.color?.range||[]),...(right.color?.range||[])]);
  const views=[makeVisualization(leftJob,{...options,bounds,colorRange}),makeVisualization(rightJob,{...options,bounds,colorRange})];
  return {ok:true,status:'COMPARABLE',left:views[0],right:views[1],shared:{bounds,colorRange,cameraOnly:true},physicalFieldUnchanged:left.binding.modelHash!==null&&left.binding.modelHash===right.binding.modelHash,description:leftJob.request?.input?.family?.mode==='ASSUMED_BOUND'?'Δ는 하한 가정입니다. 실제 장과 관측 생성 규칙이 같으면 physical-field hash가 같습니다.':'두 실행의 원본 모형·관측·수치표를 각각 유지합니다.'};
}

/** Distinct SHA-256 identities: physical/model rule, source samples, observation. */
export async function sealObservationIdentity(job){
  const r=job?.result;if(!r)return {status:'NO_RESULT',sampleHash:null,observationHash:null};
  const samples=r.sourceSamples??(r.replicas?r.replicas.map(x=>({replicaIndex:x.replicaIndex,history:x.history??null,samples:x.samples??null})):null)??r.measurements?.sites??r.levels??r.history??r.spectral?.samples??r.profileSamples??r.modulation?.samples??r.points??null;
  const observation=r.visualization??r.values?.visualization??r.spectral?.samples??r.profileSamples??null;
  return {status:'SEALED',jobId:job.id,inputHash:job.inputHash,modelHash:r.modelHash??r.hashes?.physicalField??r.results?.modelHash??r.group?.exactDataSha256??null,sampleHash:samples?await sha256(samples):null,observationHash:observation?await sha256(observation):null,displayTransformHash:r.hashes?.display??null,policy:'EXACT_SOURCE_ARRAYS; MODEL_RULE_AND_SAMPLES_ARE_DISTINCT; DISPLAY_LOD_EXCLUDED'};
}
