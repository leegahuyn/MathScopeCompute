/** Pure view adapter for stored or fresh finite SU2 study observations.
 * It never reruns chains, changes measurements, fits a new model or issues a proof.
 */
const finite=Number.isFinite;
const number=x=>finite(x)?String(Number(x.toPrecision(7))):'미해결';
const sameHashes=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((h,i)=>h===b[i]);
const INTERVAL='오차 막대는 whole-configuration block bootstrap의 95% percentile 통계 구간이다. 정상성에 조건부이며 계통오차 전체나 엄밀한 신뢰구간을 뜻하지 않는다.';

function withInterval(point,uncertainty){
 if(uncertainty&&finite(uncertainty.lower)&&finite(uncertainty.upper)&&uncertainty.lower<=uncertainty.upper){
  point.lower=uncertainty.lower;point.upper=uncertainty.upper;
 }else point.intervalUnavailable=true;
 point.uncertaintyStatus=uncertainty?.status??'INTERVAL_UNAVAILABLE';
 return point;
}

function sourceFor(result,row){
 return result.calibration.find(s=>s.id===row.id)??result.calibration.find(s=>s.beta===row.beta&&sameHashes(s.chainHashes,row.chainHashes)&&s.lattice.Ns===row.Ns&&s.lattice.Nt===row.Nt)??null;
}

function scopeNotes(result){
 const notes=[result.newExecution===false?'저장된 실제 실행의 표시다. 이번 열람은 archive/행 digest를 검증하며 새 Markov chain을 실행하지 않는다.':'이번 결과의 명시된 설정으로 실제 새 chain을 실행했다.',INTERVAL,
  '전체 continuum Yang–Mills와 uniform positive gap은 OPEN_CONTINUUM이다. 양의 채널 질량이나 유한 모형 gap은 continuum 하한이 아니다.'];
 for(const ref of result.scaleStudy?.references??[]){
  const a=ref.analysis,replicas=a?.diagnostics?.replicas??[],bad=replicas.filter(d=>d.status!=='FINITE_SAMPLE_DIAGNOSTICS_ACCEPTABLE');
  if(bad.length)notes.push(`β=${ref.model.beta} 독립 척도: replica ESS=[${replicas.map(d=>number(d.effectiveSampleSize)).join(', ')}], 최소16 기준. ${bad.map(d=>d.status).join(', ')} 상태를 유지한다.`);
  if(finite(a?.discretizationComparison?.cloverMinusPlaquetteT0))notes.push(`β=${ref.model.beta}: t₀(clover)=${number(a.t0OverA2)}, t₀(plaquette)=${number(a.alternatePlaquetteCrossing?.value)}, 차이=${number(a.discretizationComparison.cloverMinusPlaquetteT0)}. 큰 격자 척도 정의 차이는 작은 flow step 오차로 제거되지 않는다.`);
 }
 for(const prior of result.priorAttempts??[])notes.push(`${prior.jobId}: ${prior.channelMass?.status??prior.primaryFitStatus}; 유효 bootstrap ${prior.channelMass?.uncertainty?.valid??'미정'}/${prior.channelMass?.uncertainty?.total??'미정'}. ${prior.relationship}`);
 return notes;
}

function panel(result,id,label,xLabel,yLabel,series,notes=[],assumptions=[],missing=[]){
 return {id,label,xLabel,yLabel,series,notes:[...scopeNotes(result),...notes],assumptions,missing,
  status:series.some(s=>s.points.length)?'OBSERVATIONS_AVAILABLE':'NO_RESOLVED_POINTS',
  originalSourceHash:result.sourceHash??null,newNumericalExecution:false,
  viewOnly:true,continuumPositiveLowerBound:null};
}

function connectedPanel(result){
 const missing=[],series=result.calibration.map(row=>{
  const points=[];
  for(const p of row.correlator?.rows??[]){
   const value=p.matrix?.[0]?.[0],uncertainty=row.channel?.operatorChannels?.[0]?.correlator?.find(c=>c.lag===p.lag)?.uncertainty;
   if(!finite(p.time)||!finite(value)){missing.push({rowId:row.id,lag:p.lag,reason:!finite(p.time)?'REFERENCE_TIME_UNRESOLVED':'NONFINITE_CORRELATOR'});continue;}
   points.push(withInterval({x:p.time,y:value,lag:p.lag,rowId:row.id,sourceHash:row.sourceHash,chainHashes:[...row.chainHashes]},uncertainty));
  }
  return {label:`${row.id} · 목표 Δ=${row.targetDelta} · C₀₀ · ESTIMATED`,kind:'OBSERVED',connect:true,points};
 });
 return panel(result,'connected-c00','관측 채널 C₀₀의 실제 시간 의존성','Euclidean time / √t₀','connected C₀₀ · 격자 관측량 단위',series,
  ['음의 C도 같은 선형 축의 실제 값으로 유지한다. log/abs/clip 변환은 하지 않는다.',
   '이 패널은 time-local 공간 plaquette의 C₀₀이다. 질량의 primary fit은 별도로 기록된 operator와 fit window를 사용하므로 C₀₀ 곡선에 그 fit을 덮어씌우지 않는다.',
   '유한 주기 시간의 connected C는 thermal mean을 제거한 추정이다. 전체 진공 직교 벡터와 C_D의 t−1 spectral identity, finite-T 잔여 전이는 각 채널 자료에 별도로 남는다.'],
  ['gap_global ≤ E_channel ≤ m_eff는 양의 vacuum-projected zero-temperature spectral measure에서만 적용한다.'],missing);
}

function flowPanel(result){
 const missing=[],series=[];
 for(const ref of result.scaleStudy?.references??[]){
  const points=[];for(const p of ref.analysis?.curve??[]){
   if(!finite(p.t)||!finite(p.t2E)){missing.push({referenceId:ref.id,time:p.t,reason:'NONFINITE_FLOW_OBSERVATION'});continue;}
   points.push(withInterval({x:p.t,y:p.t2E,referenceId:ref.id,sourceHash:ref.sourceHash},p.uncertainty));
  }
  series.push({label:`${ref.id} · β=${ref.model.beta} · clover · ESTIMATED`,kind:'OBSERVED',connect:true,points});
 }
 const notes=['SU(2)의 정의는 t₀²〈E_clover(t₀)〉=0.1이다. 아래 값은 target 질량과 분리한 실제 scale chain의 평균과 구간이다.',
  '각 시간의 구간은 점별 통계 구간이며 전체 곡선의 동시 coverage를 보장하는 band가 아니다.',
  '가로축은 각 격자의 표준 Wilson flow t/a²다. 기존 Y6 flow 규약과 혼동하지 않으며, 곡선을 목표 Δ에 맞추어 재조정하지 않는다.',
  ...(result.scaleStudy?.references??[]).map(r=>`${r.id}: t₀/a²=${number(r.analysis.t0OverA2)}, 통계 구간 [${number(r.analysis.t0Uncertainty?.lower)}, ${number(r.analysis.t0Uncertainty?.upper)}], source=${r.sourceHash}.`)];
 return {...panel(result,'independent-t0','독립 척도 crossing의 측정과 불확실성','표준 flow time t/a²','t²〈E_clover(t)〉',series,notes,
  ['c=0.1, full continuous SU2; local linear crossing interpolation와 기록된 step halving을 사용한다.'],missing),
  referenceLines:[{axis:'y',value:.1,label:'정의 c=0.1 · 관측값 아님'}]};
}

function massPoints(result,rows,xField,missing){
 const points=[];
 for(const row of rows){
  const source=sourceFor(result,row),x=xField==='a2'?row.a*row.a:row[xField];
  if(!finite(row.a)||!finite(x)||!finite(row.mass)){missing.push({rowId:row.id,reason:!finite(row.mass)?'CHANNEL_MASS_UNRESOLVED':'REFERENCE_COORDINATE_UNRESOLVED',mass:row.mass??null});continue;}
  if(!source)throw new Error('Study view row has no actual source: '+row.id);
  if(source.channelMass.value!==row.mass)throw new Error('Study comparison mass differs from its original row: '+row.id);
  points.push(withInterval({x,y:row.mass,rowId:row.id,sourceRowId:source.id,sourceHash:source.sourceHash,chainHashes:[...source.chainHashes],
   a:row.a,L:row.L,T:row.T,massStatus:source.channelMass.status},row.uncertainty));
 }
 return points.sort((a,b)=>a.x-b.x);
}

function spacingPanel(result){
 const limits=result.limitComparison,rows=limits?.spacing?.rows??[],fit=limits?.spacing?.extrapolation,missing=[],points=massPoints(result,rows,'a2',missing),series=[{label:'실제 유한 격자 m√t₀ · ESTIMATED',kind:'OBSERVED',connect:false,points}],notes=[];
 if(fit?.status==='CONDITIONAL_FINITE_DATA_A2_FIT'){
  if(!finite(fit.intercept)||!finite(fit.slope)||!Array.isArray(fit.window)||fit.window.length<3||!Array.isArray(fit.data))throw new Error('Stored conditional fit lacks its parameters or source window.');
  for(const id of fit.window){
   const measured=rows.find(r=>r.id===id),stored=fit.data.find(r=>r.id===id);
   if(!measured||!stored||measured.mass!==stored.mass||measured.a!==stored.a||!finite(measured.mass))throw new Error('Stored fit window does not refer to the displayed actual data.');
  }
  const xmax=Math.max(...fit.data.map(p=>p.a*p.a));
  if(!finite(xmax)||xmax<=0)throw new Error('Stored a² fit has no finite observed range.');
  series.push({label:'기록된 조건부 O(a²) fit · continuum gap 하한 아님',kind:'CONDITIONAL_FIT',connect:true,lineStyle:'dashed',dataOrigin:'PREDICTIONS_FROM_RECORDED_FIT_PARAMETERS',
   points:[0,xmax].map(x=>({x,y:fit.intercept+fit.slope*x,prediction:true,sourceWindow:[...fit.window]}))});
  notes.push(`새 fit을 수행하지 않는다. 저장된 c₀=${number(fit.intercept)}, c₁=${number(fit.slope)}, window=[${fit.window.join(', ')}]에서 점선 예측을 계산한다. x=0은 관측된 격자가 아니다.`);
  notes.push(`기록된 절편의 통계 표준오차=${number(fit.interceptStandardError)}. 이 수치는 격자계통·finite L/T·overlap 전체를 포함한 오차나 양의 하한이 아니다.`);
 }else notes.push(`외삽 ${fit?.status??'UNAVAILABLE'}: ${fit?.reason??'정당화된 조건부 fit이 없으므로 선을 생성하지 않는다.'}`);
 const matching=limits?.matching;
 if(matching)notes.push(`기준 L/√t₀=${matching.referenceL}, T/√t₀=${matching.referenceT}, 지정 허용편차=${matching.matchingRelativeTolerance}. 실제 각 행의 편차: ${(matching.rows??[]).map(r=>`${r.id}: L=${number(r.relativeLDeviation)}, T=${number(r.relativeTDeviation)}`).join('; ')}.`);
 notes.push('측정 범위의 a/√t₀도 함께 기록한다. 이 유한 데이터만으로 asymptotic scaling 영역이나 continuum limit의 존재가 확립되지 않는다.');
 return panel(result,'spacing-a2','고정 기준 길이에서 a 변화와 조건부 외삽','a²/t₀','m√t₀ · 추정 채널 질량',series,notes,[...(fit?.assumptions??[]),'모든 점과 구간은 실제 source row에 연결되며 표시용 fit은 그 데이터를 대체하지 않는다.'],missing);
}

function extentPanel(result,axis){
 const key=axis==='L'?'spatial':'temporal',comparison=result.limitComparison?.[key],rows=comparison?.rows??[],missing=[],points=massPoints(result,rows,axis,missing),differences=result.limitComparison?.measuredExtentDifferences?.[key]??[];
 const notes=[`${comparison?.status??'INSUFFICIENT_DISTINCT_MODELS'}: β·독립 reference와 ${axis==='L'?'T':'L'}를 고정한 실제 ${axis} 비교다.`,
  ...(result.limitComparison?.baselineReuse?[`base ${result.limitComparison.baselineReuse.id}는 a/L/T 비교에 쓰이는 같은 측정이다. 여러 독립 chain으로 중복 집계하지 않는다.`]:[]),
  ...differences.map(d=>`${d.id}−${d.baseId}: 중심차=${number(d.difference)}, 공통 scale bootstrap 유효${d.validBootstrapPairs}/${d.requiredBootstrapPairs}회(후자는 요구치), ${d.status}; 차이 구간=${d.interval?d.interval.map(number).join(' … '):'미해결(null)'}. 계통오차 상한이 아니다.`),
  axis==='T'?'finite-T/cosh는 잔여 excited-to-excited thermal 전이를 숨기지 않는다. 더 큰 T 두 점이 영온도 도달이나 global gap을 증명하지 않는다.':'두 실제 L 값이 무한부피 수렴을 증명하지 않는다. reference 자체의 유한 부피와 operator overlap은 별도 의무다.'];
 return panel(result,axis==='L'?'spatial-L':'temporal-T',axis==='L'?'동일 a와 T에서 공간 크기 비교':'동일 a와 L에서 시간 크기 비교',`${axis}/√t₀`,'m√t₀ · 추정 채널 질량',
  [{label:`실제 ${axis} sweep · ESTIMATED`,kind:'OBSERVED',connect:false,points}],notes,
  [axis==='L'?'동일 β·reference scale·Nt를 사용한다.':'동일 β·reference scale·Ns를 사용한다.','무한 L/T 외삽 모형을 임의로 fit하지 않는다.'],missing);
}

export function buildGaugeStudyPanels(result){
 if(result?.kind!=='ensemble-study')return [];
 if(!Array.isArray(result.calibration)||!result.scaleStudy||!result.limitComparison)throw new Error('A complete source-bound ensemble-study result is required.');
 return [connectedPanel(result),flowPanel(result),spacingPanel(result),extentPanel(result,'L'),extentPanel(result,'T')];
}
