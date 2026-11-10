(() => {
  'use strict';
  const root = document.getElementById('ms-r1-lab');
  if (!root || root.dataset.ready) return;
  const data = JSON.parse(document.getElementById('ms-r1-data').textContent);
  const q = key => root.querySelector('[data-r1="' + key + '"]');
  const make = (tag, value) => { const n = document.createElement(tag); if (value !== undefined) n.textContent = String(value); return n; };
  const catalog = data.catalog.fixtures;
  const factories = { M1: () => window.MathScopeResearchM1.createReleaseEngine(), M2: () => window.MathScopeResearchM2.createReleaseEngine() };
  let selected = catalog[0].id, last = null, rows = [];
  const normalizers = { M1: request => window.MathScopeResearchM1.normalizeReleaseRequest(request), M2: request => window.MathScopeResearchM2.normalizeReleaseRequest(request) };
  const lab = createReleaseLab({ catalog, factories, normalizers, onChange: refresh });
  function item() { return catalog.find(x => x.id === selected); }
  function say(message) { q('status').textContent = message; }
  function refresh() {
    q('run').disabled = lab.busy(); q('cancel').disabled = !lab.busy();
    const job = last ? lab.jobSummary(last) : null;
    q('export').disabled = !job?.hasResult || job.stale || ['FAILED','CANCELLED','BUDGET_EXCEEDED'].includes(job.state);
    q('replay').disabled = q('export').disabled || lab.busy();
    q('resume').disabled = lab.busy() || !job || !['FAILED','CANCELLED','BUDGET_EXCEEDED'].includes(job.state);
    if (job) { root.dataset.state = job.stale ? 'STALE' : job.state; root.dataset.inputHash = job.inputHash || ''; }
  }
  const numeric = value => typeof value === 'number' ? value : value && typeof value === 'object' && value.kind === 'FLOAT64' ? numeric(value.value) : typeof value === 'string' && /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) ? Number(value) : NaN;
  function sampleRows(result) {
    if (Array.isArray(result.derivatives)) return result.derivatives.map((b, i) => ({ x:i,y:b.midpoint,path:'derivatives['+i+']',value:b,axes:'도함수 차수 / heat H 도함수 · 인증 구간',error:result.certificate }));
    const pointField = result.results?.extensionField?.affinePoints ? 'extensionField' : 'primeField', points = result.results?.[pointField]?.affinePoints;
    if (points) return points.slice(0,64).map((p,i)=>({x:numeric(p.x),y:numeric(p.y),path:'results.'+pointField+'.affinePoints['+i+']',value:p,axes:'유한체 잉여 대표 x / y · 연속 곡선으로 해석하지 않음'}));
    if (Array.isArray(result.results?.cohomology)) return result.results.cohomology.map((p,i)=>({x:numeric(p.degree),y:numeric(p.frobeniusEigenvalue),path:'results.cohomology['+i+']',value:p,axes:'상동 차수 / Frobenius 고유값 · 화면은 Float64, 정확 값은 JSON'})).filter((_,i)=>result.results.cohomology[i].rank>0);
    if (Array.isArray(result.comparison)) return result.comparison.map((p,i)=>({x:numeric(p.delta),y:numeric(p.physicalDensity?.actionDensity??p.physicalDensity),path:'comparison['+i+'].physicalDensity.actionDensity',value:p,axes:'Δ / 지정 probe의 고전적 actionDensity (ell0^-4) · 양자 간극 아님'}));
    if (Array.isArray(result.points) && result.points.length) return result.points.slice(0,64).map((p,i)=>({x:numeric(p.r) || (Array.isArray(p.position)?Math.hypot(...p.position.slice(0,2).map(numeric)):NaN),y:p.speed===undefined?(Array.isArray(p.velocity)?Math.hypot(...p.velocity.map(numeric)):NaN):numeric(p.speed),path:'points['+i+']',value:p,axes:'물리 반경 / 속도 크기 · 전체 K 에너지 아님',error:result.errorBudget}));
    const viz = result.visualization || result.values?.visualization;
    if (viz?.points?.length) return viz.points.slice(0,64).map((p,i)=>({x:numeric(p.pos?.[0]),y:numeric(p.value?.value??p.value),path:'visualization.points['+i+']',value:p,axes:viz.description||'실제 source 표본 · 첫 좌표 / 원래 관측값'}));
    return [];
  }
  function inspect(index) {
    const j = last ? lab.job(last) : null, s = rows[index], boundItem = catalog.find(x=>x.id===j?.fixtureId) || item();
    q('inspect').textContent = JSON.stringify({claimId:boundItem.claimId,formula:boundItem.formula,source:boundItem.source,jobId:j?.id,state:j?.stale?'STALE':j?.state,inputHash:j?.inputHash,sourceWorkerSHA256:j?.workerSHA256,environmentHash:j?.environmentHash,resultHash:j?.resultHash,selectedPath:s?.path??null,rawValue:s?.value??j?.result,error:s?.error??j?.result?.errorBudget??j?.result?.precisionLedger??null,formalPass:false},null,2);
    q('source').href = boundItem.source.url;
  }
  function draw(job) {
    rows = sampleRows(job.result || {}).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    const body=q('rows');body.replaceChildren();const svg=q('chart');svg.replaceChildren();
    q('axes').textContent=rows[0]?.axes || '행렬·인수·계약 결과입니다. 아래 원시 값과 정확한 소스에서 확인하세요.';
    const ns='http://www.w3.org/2000/svg';
    if (!rows.length) { const text=document.createElementNS(ns,'text');text.setAttribute('x','25');text.setAttribute('y','110');text.setAttribute('fill','#355970');text.setAttribute('font-size','15');text.textContent='대수·계약 결과 → 오른쪽 원시 JSON';svg.append(text);inspect(0);return; }
    const xs=rows.map(p=>p.x),ys=rows.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const labels=[`x ${x0.toPrecision(4)} → ${x1.toPrecision(4)}`,`y ${y0.toPrecision(4)} → ${y1.toPrecision(4)}`];
    labels.forEach((value,i)=>{const t=document.createElementNS(ns,'text');t.setAttribute('x','25');t.setAttribute('y',String(213+i*14));t.setAttribute('font-size','11');t.setAttribute('fill','#355970');t.textContent=value;svg.append(t);});
    rows.forEach((p,i)=>{
      const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',String(35+530*(p.x-x0)/(x1-x0||1)));circle.setAttribute('cy',String(190-160*(p.y-y0)/(y1-y0||1)));circle.setAttribute('r','5');circle.setAttribute('fill','#187078');circle.setAttribute('tabindex','0');circle.setAttribute('role','button');circle.setAttribute('aria-label',`표본 ${i+1}: ${p.x}, ${p.y}`);circle.addEventListener('click',()=>inspect(i));circle.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();inspect(i);}});svg.append(circle);
      const tr=make('tr'),button=make('button',String(i+1));button.type='button';button.addEventListener('click',()=>inspect(i));const cell=make('td');cell.append(button);tr.append(cell,make('td',`${p.x.toPrecision(6)}, ${p.y.toPrecision(6)}`),make('td',p.path));body.append(tr);
    });inspect(0);
  }
  function choose(id) {
    selected=id;q('input').value=JSON.stringify(lab.request(id),null,2);last=lab.jobs(id).at(-1)?.id||null;
    if(last)draw(lab.job(last));else{rows=[];q('chart').replaceChildren();q('rows').replaceChildren();q('inspect').textContent=JSON.stringify({claimId:item().claimId,formula:item().formula,source:item().source,request:lab.request(id)},null,2);q('source').href=item().source.url;q('axes').textContent='실행 전 · 표본이 아직 없습니다.';root.dataset.state='READY';root.dataset.inputHash='';}
    const url=new URL(location.href);url.searchParams.set('r1',id);history.replaceState(null,'',url);
    refresh();say(last?'저장된 실행 · '+(lab.job(last).stale?'STALE':lab.job(last).state):item().label+' · 실행 준비');
  }
  for(const ex of catalog){const option=make('option',ex.label);option.value=ex.id;q('fixture').append(option);}
  q('fixture').addEventListener('change',e=>choose(e.target.value));
  const action = fn => async()=>{try{await fn();}catch(e){say('거부 또는 실행 실패: '+e.message);}finally{refresh();}};
  const displayCompleted = j => { if(selected!==j.fixtureId)return false;last=j.id;draw(j);return true; };
  q('run').addEventListener('click',action(async()=>{const id=selected;say('새 Worker에서 실제 계산 중…');const j=await lab.run(id);displayCompleted(j);say(`${catalog.find(x=>x.id===id).label} · ${j.stale?'STALE':j.state} · ${j.elapsedMs.toFixed(0)} ms · 입력 ${j.inputHash?.slice(0,12)} · 유한 실행`);}));
  q('cancel').addEventListener('click',()=>{lab.cancel();say('취소 요청 · 중단 입력과 로그는 보존합니다.');});
  q('resume').addEventListener('click',action(async()=>{const jobId=last;say('중단 당시 입력으로 새 Worker 재실행 중…');const j=await lab.resume(jobId);displayCompleted(j);say((j.stale?'STALE':j.state)+' · 중단 입력 재실행');}));
  q('apply').addEventListener('click',action(async()=>{lab.update(selected,JSON.parse(q('input').value));refresh();if(last)inspect(0);say('입력 변경 적용 · 이 예제의 이전 결과는 STALE · 다른 예제 유지');}));
  q('replay').addEventListener('click',action(async()=>{const jobId=last;say('입력·소스·환경 hash 검사 후 새 Worker 비교 중…');const r=await lab.replay(await lab.exportRecord(jobId));displayCompleted(r.job);say(`독립 재실행 ${r.report.status} · ${r.job.stale?'STALE':'재실행 입력 일치'} · 가져온 증거 권한 없음`);}));
  q('export').addEventListener('click',action(async()=>{const record=await lab.exportRecord(last),url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=make('a');a.href=url;a.download='MathScope-R1-'+selected+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('실행 JSON 저장 · 재현 시 새 계산 필요');}));
  q('import').addEventListener('change',action(async()=>{const f=q('import').files?.[0];if(!f)return;if(f.size>9*1024*1024)throw Error('9 MiB 예산 초과');const beforeSelection=selected,beforeEditor=q('input').value;if(beforeEditor!==JSON.stringify(lab.request(selected),null,2))throw Error('EDITED_INPUT_PRESERVED');const record=JSON.parse(await f.text());say('가져온 실행을 새 Worker에서 재검사 중…');const r=await lab.replay(record);if(selected===beforeSelection&&q('input').value===beforeEditor){q('fixture').value=record.fixtureId;choose(record.fixtureId);displayCompleted(r.job);}say(`가져오기 재계산 ${r.report.status} · ${r.job.stale?'다른 입력: STALE':'가져온 입력 일치'} · FORMAL PASS 없음`);q('import').value='';}));
  for(const r of data.verification?.refinements||[]){
    const tr=make('tr'),detail=make('td'),pick=make('button','원자료·오차 열기');pick.type='button';
    pick.addEventListener('click',()=>{const source=r.rows?.[0]?.source;q('inspect').textContent=JSON.stringify({claimId:'R1-02',state:'SCOPED_VERIFICATION_REPORT',source,refinement:r,formalPass:false},null,2);if(source?.url)q('source').href=source.url;});
    detail.append(make('p',`${r.assessment?.pass?'유한 비교 통과':'판정 확인'} · ${r.boundType||''} · ${r.sourceScope||''}`),pick);
    tr.append(make('td',r.axis),make('td',JSON.stringify(r.values??r.inputs??r.requestChanges??r.levels)),detail);q('refinements').append(tr);
  }
  q('kernel').textContent=JSON.stringify(data.kernel,null,2);
  q('m3-source').textContent=JSON.stringify(data.sourceRefinement,null,2);
  const tailRows=data.sourceRefinement?.table||[];
  for(const row of tailRows){const tr=make('tr'),pick=make('button',`${row.component} / C${row.derivativeOrder}`);pick.type='button';pick.addEventListener('click',()=>{q('m3-source').textContent=JSON.stringify({source:data.sourceRefinement.source,selected:row,scope:'PRE_TEMPORAL_SOURCE_BOUND; ORIGINAL N8-05 PENDING'},null,2);});const td=make('td');td.append(pick);tr.append(td,make('td',`${row.K} · ${row.relativeToK1Exact}`),make('td',row.omittedBoundScalar));q('m3-tail-rows').append(tr);}
  for(const row of tailRows.filter(x=>x.component==='theta'&&x.derivativeOrder===0)){const line=make('p',`K=${row.K} · 정확한 상대 상계 ${row.relativeToK1Exact}`),bar=make('span');bar.style.display='block';bar.style.width=String(100/row.K)+'%';bar.style.minWidth='8px';bar.style.height='9px';bar.style.background='#246b79';line.append(bar);q('m3-tail-chart').append(line);}
  const urlId=new URL(location.href).searchParams.get('r1');if(catalog.some(x=>x.id===urlId)){selected=urlId;q('fixture').value=selected;}choose(selected);root.dataset.ready='true';
  let registration=null;
  async function registerTools(){
    if(typeof document.modelContext?.registerTool!=='function'){root.dataset.webmcp='UNAVAILABLE';return;}
    registration?.abort();registration=new AbortController();
    const reply=x=>({content:[{type:'text',text:JSON.stringify(x)}]});
    const status=()=>({schema:'MathScope.R1.BrowserStatus/1',selectedFixture:selected,busy:lab.busy(),fixtures:catalog.map(x=>({id:x.id,label:x.label,claimId:x.claimId})),jobs:catalog.flatMap(x=>lab.jobSummaries(x.id).map(j=>({id:j.id,fixtureId:j.fixtureId,state:j.stale?'STALE':j.state,inputHash:j.inputHash,resultHash:j.resultHash,workerSHA256:j.workerSHA256}))),wholeM3Complete:false,wholeM4Complete:false});
    const definitions=[
      {name:'mathscope_r1_status',description:'Read the bounded M4 release lab fixtures and actual isolated job hashes. Does not run Lean or grant original-criterion acceptance.',inputSchema:{type:'object',additionalProperties:false,properties:{}},annotations:{readOnlyHint:true},execute:async input=>{if(Object.keys(input||{}).length)throw Error('EMPTY_INPUT_REQUIRED');return reply(status());}},
      {name:'mathscope_r1_run_fixture',description:'Execute one installed small fixture in a fresh dedicated browser Worker, preserving current edited input and other research sessions. Returns actual finite result hashes; no formal or whole-M3/M4 status.',inputSchema:{type:'object',additionalProperties:false,properties:{fixtureId:{type:'string',enum:catalog.map(x=>x.id)}},required:['fixtureId']},execute:async(input,options)=>{
        if(!input||Object.keys(input).some(k=>k!=='fixtureId')||!catalog.some(x=>x.id===input.fixtureId))throw Error('UNKNOWN_FIXTURE');
        if(q('input').value!==JSON.stringify(lab.request(selected),null,2))throw Error('EDITED_INPUT_PRESERVED');
        if(options?.signal?.aborted)throw Error('CANCELLED_BEFORE_START');
        if(lab.busy())throw Error('JOB_ALREADY_RUNNING');
        const abort=()=>lab.cancel();options?.signal?.addEventListener('abort',abort,{once:true});
        try{q('fixture').value=input.fixtureId;choose(input.fixtureId);say('브라우저 도구 · 새 Worker 실제 실행 중…');const j=await lab.run(input.fixtureId);displayCompleted(j);say((j.stale?'STALE':j.state)+' · 브라우저 도구 실제 유한 실행');refresh();return reply({jobId:j.id,state:j.stale?'STALE':j.state,inputHash:j.inputHash,resultHash:j.resultHash,workerSHA256:j.workerSHA256,formalPass:false});}
        finally{options?.signal?.removeEventListener('abort',abort);}
      }},
      {name:'mathscope_r1_select_sample',description:'Select one computed release-lab sample and reveal its raw source value, formula, error and actual job hashes. View selection cannot alter evidence status.',inputSchema:{type:'object',additionalProperties:false,properties:{index:{type:'integer',minimum:0,maximum:63}},required:['index']},annotations:{readOnlyHint:true},execute:async input=>{if(!input||Object.keys(input).some(k=>k!=='index')||!Number.isInteger(input.index)||input.index<0||input.index>=rows.length)throw Error('UNKNOWN_COMPUTED_SAMPLE');inspect(input.index);return reply(JSON.parse(q('inspect').textContent));}}
    ];
    try{for(const d of definitions)await document.modelContext.registerTool(d,{signal:registration.signal});root.dataset.webmcp='REGISTERED';}
    catch(e){registration.abort();root.dataset.webmcp='REGISTRATION_REJECTED';}
  }
  registerTools();window.addEventListener('pagehide',e=>{registration?.abort();if(!e.persisted)lab.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted)registerTools();});
})();
