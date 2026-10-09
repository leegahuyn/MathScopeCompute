import {canonicalStringify,sha256} from '../mathscope-m0/contracts.mjs';
import {migrateSession} from '../mathscope-m0/session.mjs';
import {BASELINE} from '../mathscope-m0/baseline-data.mjs';
import {Scene3D,heatColor} from '../mathscope-extension/renderer.mjs';
import {createM1Engine} from './core/engine.mjs';
import {clone,normalizeRequest,validateDomainRequest,listExamples,M1_VERSION} from './core/registry.mjs';
import {prepareM1SessionJob,saveM1SessionJob} from './core/session-binding.mjs';
import {listTheoremReferences,listAnalyticHypotheses,listPinnedAudits,getPinnedAudit,checkPinnedAudit,verifyAdapterFixtures} from './core/theorem-adapters.mjs';
import {registerM1Tools} from './webmcp.mjs';

const scalar=v=>v&&typeof v==='object'&&'value' in v?String(v.value):v;
const numericScalar=v=>typeof v==='number'?v:v?.kind==='FLOAT64'?Number(v.value):NaN;
const pretty=x=>JSON.stringify(x,null,2),TERMINAL=new Set(['COMPLETED','PARTIAL','FAILED','CANCELLED','PRECISION_REQUIRED','UNSUPPORTED','BUDGET_EXCEEDED']);
const DESCRIPTIONS={arithmetic:'무한 소수집합의 유한 질의, p-진 정밀도, 점과 P¹의 실제 Čech–de Rham 복합체 및 Frobenius 비교 모델을 계산합니다.',gauge:'구체적인 군의 행렬·Lie 대수와 4차원 장을 구성합니다. Δ의 역할, 관측 방법, 원본 좌표를 결과에 함께 보관합니다.',ns:'실제 A.21 압력과 연결된 축 상계, 외부 프로파일, 제어 연장, B.34/B.8 내부 접합, C.1 루프 및 C.12 변조·모멘트 복원을 계산합니다. 각 계산의 적용 범위와 전역 인증에 남은 조건을 함께 보관합니다.'};
export async function bootM1(){
  const root=document.getElementById('mathscopeResearchM1');if(!root||root.dataset.mounted==='true')return;
  const $=id=>document.getElementById(id),engine=createM1Engine(),examples=await listExamples(),environment=await engine.environment(),pending=new Map(),scene=new Scene3D($('m1-scene'));
  let selected=null,tab='arithmetic',sequence=0,exportURL=null,registration=null,audit=null,editedFiles=[],auditFile=null,lastAdapters=null;
  const base=()=>{const b=window.MathScopeV031Foundation;if(!b?.getSession||!b?.commitResearchM0)throw Error('Research Session 연결이 준비되지 않았습니다.');return b;};
  const text=(id,value)=>{$(id).textContent=typeof value==='string'?value:pretty(value);};
  const status=(message,error=false)=>{text('m1-status',message);$('m1-status').dataset.error=String(error);};
  function on(id,fn){$(id).addEventListener('click',async()=>{const b=$(id);if(b.dataset.busy==='true')return;b.disabled=true;b.dataset.busy='true';try{await fn();}catch(e){status(e.message,true);}finally{b.dataset.busy='false';b.disabled=false;renderJobs();}});}
  function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}
  function inputRequest(){return normalizeRequest(JSON.parse($('m1-input').value));}
  function currentEditorMatches(j){try{return canonicalStringify(inputRequest())===canonicalStringify(j.request);}catch{return false;}}
  function renderSession(){try{const s=base().getSession();text('m1-session',s.id+' · M0 revision '+(s.researchM0?.revision??'연결 전'));}catch(e){text('m1-session',e.message);}}
  const deltaMeanings={ASSUMED_BOUND:'Δ를 하한으로 가정합니다. 기록한 고전적 장과 물리적 좌표는 이 가정만으로 변하지 않습니다.',UNITS:'표시 좌표·밀도의 단위를 바꿉니다. 물리적 장의 해시로 같은 장인지 확인할 수 있습니다.',CLASSICAL_SCALE:'λ=Δ/Δ₀로 실제 장을 Aλ(x)=λA(c+λ(x-c))로 바꿉니다. 이 가족의 정의는 양자 질량 간극 증명과 별도입니다.',EFFECTIVE_MODEL:'명시적인 모형 선택 ℓ=ℏc/Δ, ρ=κℓ를 이용해 실제 장을 다시 계산합니다. κ는 JSON의 rhoOverEll입니다.'};
  function syncGaugeControls(){let q;try{q=inputRequest();}catch{}const enabled=Boolean(q?.kind.startsWith('gauge.')&&q.input.family);$('m1-gauge-controls').hidden=!enabled;if(!enabled)return;const f=q.input.family;$('m1-delta').value=f.delta;$('m1-delta-mode').value=f.mode;const slice=q.input.observation?.kind==='SLICE';$('m1-slice-control').hidden=!slice;if(slice)$('m1-x4').value=q.input.observation.slice;text('m1-delta-help',deltaMeanings[f.mode]||'역할을 선택하세요.');}
  function loadExample(){const ex=examples.find(e=>e.id===$('m1-example').value);if(!ex)return;$('m1-input').value=pretty(ex.request);text('m1-kind',ex.request.kind);text('m1-validation','예제 입력 준비 · 실행 전 도메인 계약을 검사합니다.');syncGaugeControls();renderResult();renderJobs();}
  function setTab(name,updateHash=true,focus=false){
    if(!['arithmetic','gauge','ns','audit'].includes(name))return;const changed=tab!==name;tab=name;
    for(const b of root.querySelectorAll('[data-m1-tab]')){const active=b.dataset.m1Tab===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus();}
    $('m1-compute-area').hidden=name==='audit';$('m1-audit-area').hidden=name!=='audit';
    if(name!=='audit'){$('m1-compute-area').setAttribute('aria-labelledby','m1-tab-'+name);text('m1-domain-description',DESCRIPTIONS[name]);if(changed||!$('m1-example').options.length){$('m1-example').replaceChildren();for(const e of examples.filter(e=>e.domain===name))option($('m1-example'),e.id,e.label);loadExample();}requestAnimationFrame(()=>scene.draw());}
    if(updateHash&&root.classList.contains('active'))history.replaceState(null,'','#research-objects/'+name);
  }
  for(const b of root.querySelectorAll('[data-m1-tab]')){b.addEventListener('click',()=>setTab(b.dataset.m1Tab));b.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const names=['arithmetic','gauge','ns','audit'],i=names.indexOf(tab);let j;if(e.key==='ArrowRight')j=(i+1)%4;else if(e.key==='ArrowLeft')j=(i+3)%4;else if(e.key==='Home')j=0;else if(e.key==='End')j=3;else return;e.preventDefault();setTab(names[j],true,true);});}
  function renderJobs(){
    const all=engine.listJobs();text('m1-job-count',all.length+' jobs');$('m1-jobs').replaceChildren();
    for(const j of all.slice().reverse()){
      const b=document.createElement('button'),strong=document.createElement('strong'),small=document.createElement('small');b.type='button';strong.textContent=j.request.kind+' · '+j.status;small.textContent=j.id;b.append(strong,small);b.dataset.selected=String(j.id===selected);b.addEventListener('click',()=>{selected=j.id;renderResult();renderJobs();});$('m1-jobs').append(b);
    }
    const j=selected?engine.getJob(selected):null,done=j&&TERMINAL.has(j.status);
    $('m1-cancel').disabled=!j||done;$('m1-save').disabled=!done||!pending.has(j.id)||!currentEditorMatches(j)||$('m1-save').dataset.busy==='true';
    $('m1-replay').disabled=!done||$('m1-replay').dataset.busy==='true';$('m1-export').disabled=!done;
  }
  function renderResult(){
    if(!selected)return;const j=engine.getJob(selected),r=j.result;
    text('m1-result-status',j.status);text('m1-result-json',j);$('m1-color-legend').hidden=true;
    if(!r){text('m1-result-description',j.request.kind+' 계산 중 · '+j.id);$('m1-metrics').replaceChildren();scene.set({points:[],lines:[],arrows:[],axes:['x','y','z']});text('m1-observation','현재 작업의 계산 결과를 기다리고 있습니다.');$('m1-observation-rows').replaceChildren();text('m1-diagnostics',{status:j.status,checkpoint:j.checkpoint});$('m1-blockers').hidden=true;$('m1-delta-comparison').hidden=true;root.dataset.resultStatus=j.status;root.dataset.resultKind=j.request.kind;return;}
    const grade=r.evidenceGrade||r.evidence?.grade||(r.evidence?.calculation==='EXACT_FINITE_OR_EXACT_MODULAR'?'정확 유한 산술':'범위별 결과 참조');
    text('m1-result-description',j.request.kind+' · '+(currentEditorMatches(j)?'현재 입력의 결과':'현재 편집 입력과 다른 실행 기록')+' · '+j.id);
    $('m1-metrics').replaceChildren();
    const checks=Array.isArray(r.checks)?r.checks:[];
    const metrics=[['결과 상태',j.status],['증거 범위',grade],['입력 SHA-256',j.inputHash.slice(0,12)]];
    if(r.results?.intervalCount!==undefined)metrics.push(['유한 구간 소수 개수',r.results.intervalCount]);
    if(r.results?.smith?.cohomology){const h=r.results.smith.cohomology;metrics.push(['H⁰ · H¹ · H² 자유 계수',[h.H0.freeRank,h.H1.freeRank,h.H2.freeRank].join(' · ')]);}
    if(r.group?.id)metrics.push(['구체적인 군',r.group.id]);
    if(r.hashes?.physicalField)metrics.push(['물리적 장 SHA-256',r.hashes.physicalField.slice(0,12)]);
    if(r.bounds?.selfMapDisplacementUpper?.exact)metrics.push(['국소 불변 공 변위 상계',r.bounds.selfMapDisplacementUpper.exact]);
    if(r.bounds?.uniformPhiPositiveLower?.exact)metrics.push(['전체 국소 직사각형 Φ 하계',r.bounds.uniformPhiPositiveLower.exact]);
    if(Array.isArray(r.loops))metrics.push(['모든 위상 간격 인증 · 고정 상태',r.loops.filter(l=>l.phaseCertificate?.pass).length+' / '+r.loops.length]);
    if(r.numericalAudit?.pointwiseFiniteResidualChecksPassed!==undefined)metrics.push(['외부 유한 잔차 검사',r.numericalAudit.pointwiseFiniteResidualChecksPassed?'통과':'추가 검증 필요']);
    if(r.slices?.length)metrics.push(['계산한 η 단면',r.slices.length]);
    if(r.pressureAxisBinding)metrics.push(['압력–축 h 정확 결속',r.pressureAxisBinding.matches?'일치':'불일치']);
    if(r.pressureFamily==='source-outer-A21')metrics.push(['압력의 대상','원문 A.21']);
    if(r.slices?.some(s=>s.sampledCone)){const rows=r.slices.filter(s=>s.sampledCone).map(s=>s.sampledCone);metrics.push(['변조·복원 cone 표본',rows.reduce((n,s)=>n+s.modulatedPassing+s.patchPassing,0)+' / '+rows.reduce((n,s)=>n+s.modulatedTotal+s.patchTotal,0)]);}
    if(Array.isArray(r.etaStencilCorrections)){const c=r.etaStencilCorrections;metrics.push(['실제 다섯 모멘트 수치 일치',c.filter(v=>v.finiteNumericalMomentMatch).length+' / '+c.length]);metrics.push(['최대 정규화 모멘트 잔차',Math.max(...c.map(v=>v.independentScaledResidual)).toExponential(4)]);const d=(r.slices||[]).map(v=>v.diagnostics).filter(Boolean);metrics.push(['접합 뒤 relaxed cone 표본',d.reduce((n,v)=>n+v.relaxedConePassingSamples,0)+' / '+d.reduce((n,v)=>n+v.totalConeSamples,0)]);}
    if(checks.length)metrics.push(['도메인 검사',checks.filter(c=>c.pass===true||c.ok===true||c.status==='PASS').length+' / '+checks.length]);
    for(const [label,value] of metrics){const e=document.createElement('div');e.className='m1-metric';const a=document.createElement('strong'),b=document.createElement('small');a.textContent=String(scalar(value));b.textContent=label;e.append(a,b);$('m1-metrics').append(e);}
    const raw=r.visualization||r.values?.visualization;
    let viz={points:[],lines:[],arrows:[],axes:['x','y','z']};
    if(raw){
      const finite3=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
      viz={...raw,axes:Array.isArray(raw.axes)?raw.axes.map(a=>typeof a==='string'?a:a.label||a.name):['x','y','z'],points:(raw.points||[]).filter(p=>finite3(p.pos)).slice(0,6000),lines:(raw.lines||[]).filter(l=>Array.isArray(l.points)&&l.points.every(finite3)).slice(0,100),arrows:(raw.arrows||[]).filter(a=>finite3(a.pos)&&finite3(a.vector)).slice(0,2000)};
      const values=viz.points.map(p=>numericScalar(p.value)).filter(Number.isFinite),lo=Math.min(...values),hi=Math.max(...values);viz.points=viz.points.map(p=>({...p,color:p.color||(Number.isFinite(numericScalar(p.value))?heatColor((numericScalar(p.value)-lo)/(hi-lo||1)):undefined)}));if(values.length){$('m1-color-legend').hidden=false;const quantity=raw.valueMeaning||(j.request.kind==='ns.source-inner-gluing'?'U · similarity profile':j.request.input.observation?.quantity)||'관측값';text('m1-color-range',quantity+' · 청록 '+Number(lo.toPrecision(7))+' → 주황 '+Number(hi.toPrecision(7))+' · 이 실행의 표시 표본에 대한 선형 색상 범위입니다. 실행 간 비교에는 실제 수치와 단위를 사용하세요.');}
      if(j.request.kind.startsWith('gauge.')||['ns.exterior','ns.benchmark','ns.leading-profile'].includes(j.request.kind))viz.equalScale=true;
      if(viz.arrows.length){const coords=viz.points.map(p=>p.pos).concat(viz.arrows.map(a=>a.pos)),span=Math.max(...[0,1,2].map(i=>Math.max(...coords.map(p=>p[i]))-Math.min(...coords.map(p=>p[i])))),magnitude=Math.max(...viz.arrows.map(a=>Math.hypot(...a.vector))),scale=magnitude?0.18*(span||1)/magnitude:1;viz.arrows=viz.arrows.map(a=>({...a,vector:a.vector.map(v=>v*scale)}));viz.arrowDisplayNote='화살표는 원래 속도에 공통 배율 '+scale.toExponential(3)+'을 적용했습니다. 실제 속도는 전체 JSON에 보존됩니다.';}
    }
    scene.set(viz);text('m1-observation',raw?[raw.description,typeof raw.coordinateMeaning==='string'?raw.coordinateMeaning:pretty(raw.coordinateMeaning||{}),viz.arrowDisplayNote,'보존하지 않는 정보: '+(raw.lostInformation||[]).join(' · ')].filter(Boolean).join('\n'):'이 결과는 수치·계약·검증 자료입니다. 적용 범위와 전체 JSON을 확인하세요.');
    $('m1-observation-rows').replaceChildren();for(let a=0;a<3;a++)text('m1-axis-'+a,viz.axes[a]||'xyz'[a]);
    for(const [i,p] of viz.points.slice(0,100).entries()){const tr=document.createElement('tr');for(const v of [i+1,...p.pos.map(x=>Number(x.toPrecision(7))),p.value==null?'—':scalar(p.value),p.label||'']){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}$('m1-observation-rows').append(tr);}
    text('m1-diagnostics',{checks:r.checks||r.verification||null,certifiedConditions:r.certifiedConditions||r.gates||null,computedConditions:r.computedConditions||null,bounds:r.bounds||null,errorBudget:r.errorBudget||r.errorLedger||r.numericalAudit||null,precision:r.precision||r.precisionLedger||null,scope:r.scopeDescription||r.certificateScope||r.scope||r.model||null,proofBoundary:r.proofBoundary||r.sourceConstructionScope||null,diagnostics:r.diagnostics||null,provenance:r.provenance||r.sourceLedger||null,checkpoint:j.checkpoint});
    const blockers=r.blockers||r.obligations||r.missingConditions||[];$('m1-blockers').hidden=!blockers.length;$('m1-blockers').replaceChildren();
    if(blockers.length){const h=document.createElement('strong');h.textContent='검증이 더 필요한 조건';$('m1-blockers').append(h);for(const b of blockers){const p=document.createElement('p');p.textContent=typeof b==='string'?b:pretty(b);$('m1-blockers').append(p);}}
    const comparisons=Array.isArray(r.comparison)?r.comparison:[];$('m1-delta-comparison').hidden=!comparisons.length;$('m1-delta-rows').replaceChildren();
    for(const c of comparisons){const tr=document.createElement('tr');for(const v of [c.delta,c.rho,c.physicalDensity?.actionDensity??c.physicalDensity,c.displayDensityScale,c.physicalFieldHash?.slice(0,16)]){const td=document.createElement('td');td.textContent=typeof v==='number'?Number(v.toPrecision(8)).toString():v==null?'—':typeof v==='object'?pretty(v):String(v);tr.append(td);}$('m1-delta-rows').append(tr);}
    root.dataset.resultStatus=j.status;root.dataset.resultKind=j.request.kind;
  }
  async function runRequest(value,{signal}={}){
    if(signal?.aborted)return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    const request=normalizeRequest(value),s=base().getSession(),ns=(await migrateSession(s,BASELINE)).researchM0,id='m1-job:'+Date.now().toString(36)+':'+(++sequence);
    const prepared=await prepareM1SessionJob(ns,request,environment,{id});
    if(signal?.aborted)return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    pending.set(id,{prepared,sessionId:s.id});selected=id;
    const job=await engine.submit(request,{id});
    const cancel=()=>engine.cancel(id);signal?.addEventListener('abort',cancel,{once:true});
    void engine.wait(id).then(finished=>{signal?.removeEventListener('abort',cancel);if(selected===id){renderResult();status(finished.request.kind+' · '+finished.status+' · '+(finished.result?.blockers?.length?'추가 검증 조건을 확인하세요.':'계산 기록을 확인하고 세션에 저장할 수 있습니다.'),['FAILED','BUDGET_EXCEEDED'].includes(finished.status));}renderJobs();});
    status('계산 시작 · '+request.kind+' · 입력 '+job.inputHash.slice(0,12));renderJobs();return {ok:true,jobId:id,status:job.status};
  }
  async function saveResult(id){
    const info=pending.get(id);if(!info)throw Error('이 실행의 원본 세션 준비 기록이 없습니다.');
    const api=base(),s=api.getSession();if(s.id!==info.sessionId)throw Error('실행을 시작한 세션과 현재 세션이 다릅니다.');
    const ns=(await migrateSession(s,BASELINE)).researchM0,receipt=await engine.receipt(id),saved=await saveM1SessionJob(ns,info.prepared,receipt,engine);
    await api.commitResearchM0(saved.namespace,{expectedSessionId:s.id,expectedM0Revision:s.researchM0?.revision??null,reason:'M1 '+receipt.request.kind+' finite result'});
    status('저장 완료 · '+saved.modelRef.id+' → '+id+' → '+saved.resultId);renderSession();return {ok:true,resultId:saved.resultId,modelRef:saved.modelRef,m0Revision:saved.namespace.revision,formalPass:false};
  }
  function exportData(name,data){if(exportURL)URL.revokeObjectURL(exportURL);const content=pretty(data);exportURL=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));$('m1-download').href=exportURL;$('m1-download').download=name;$('m1-download').textContent=name;$('m1-export-content').value=content;$('m1-export-panel').hidden=false;$('m1-export-panel').open=true;}
  on('m1-load',loadExample);$('m1-example').addEventListener('change',loadExample);$('m1-input').addEventListener('input',()=>{syncGaugeControls();renderJobs();if(selected&&engine.getJob(selected).result)renderResult();});
  $('m1-delta-mode').addEventListener('change',()=>text('m1-delta-help',deltaMeanings[$('m1-delta-mode').value]));
  on('m1-apply-delta',async()=>{const q=inputRequest();if(!q.kind.startsWith('gauge.')||!q.input.family)throw Error('상태족이 있는 게이지 예제를 먼저 선택하세요.');const delta=$('m1-delta').valueAsNumber,mode=$('m1-delta-mode').value;q.input.family={...q.input.family,delta,mode};if(mode==='EFFECTIVE_MODEL'){q.input.family.rhoOverEll??=1;q.input.family.assumptionId='explicit-effective-rho-gap-choice';}else delete q.input.family.rhoOverEll;if(q.input.observation?.kind==='SLICE')q.input.observation.slice=$('m1-x4').valueAsNumber;$('m1-input').value=pretty(q);syncGaugeControls();return runRequest(q);});
  on('m1-validate',async()=>{const r=await validateDomainRequest(inputRequest());text('m1-validation',r);$('m1-validation').closest('details').open=true;status(r.ok?'입력 계약 통과 · 수학적 가정의 진위는 별도 검사 대상입니다.':'입력 오류를 확인하세요.',!r.ok);});
  on('m1-run',()=>runRequest(inputRequest()));on('m1-cancel',()=>{if(selected)engine.cancel(selected);});on('m1-save',()=>saveResult(selected));
  on('m1-replay',async()=>{status('같은 소스와 입력으로 새 작업을 실행해 재현성을 검사하고 있습니다.');const report=await engine.replay(await engine.exportBundle(selected));text('m1-validation',report);$('m1-validation').closest('details').open=true;status('재현 검사 '+report.status+' · 새 작업 '+report.freshJobId,report.status!=='MATCH');});
  on('m1-export',async()=>{exportData('MathScope-M1-'+selected.replaceAll(':','-')+'.json',await engine.exportBundle(selected));status('실행 기록 전체 JSON을 준비했습니다.');});
  on('m1-copy',async()=>{$('m1-export-content').focus();$('m1-export-content').select();try{await navigator.clipboard.writeText($('m1-export-content').value);status('전체 JSON을 복사했습니다.');}catch{status('전체 JSON을 선택했습니다. Ctrl/Cmd+C로 복사하세요.');}});
  for(const b of root.querySelectorAll('[data-m1-camera]'))b.addEventListener('click',()=>scene.camera(b.dataset.m1Camera));
  const selectInput=document.createElement('button');selectInput.type='button';selectInput.id='m1-job-load-input';selectInput.textContent='선택 실행의 입력 불러오기';$('m1-export').parentElement.append(selectInput);selectInput.addEventListener('click',()=>{if(!selected)return;const j=engine.getJob(selected);setTab(j.request.kind.split('.')[0]);$('m1-input').value=pretty(j.request);text('m1-kind',j.request.kind);syncGaugeControls();renderResult();renderJobs();});
  engine.subscribe(j=>{if(j.id===selected)renderResult();renderJobs();});
  function loadAudit(){
    const id=$('m1-audit-select').value;if(!id){text('m1-lean-result','배포에 포함된 검사 묶음이 없습니다.');return;}
    audit=getPinnedAudit(id);editedFiles=clone(audit.sourceFiles);$('m1-audit-file').replaceChildren();for(const f of editedFiles)option($('m1-audit-file'),f.path,f.path);auditFile=editedFiles.at(-1)?.path;$('m1-audit-file').value=auditFile;showAuditFile();text('m1-lean-result',{status:'NOT_COMPARED',targets:audit.targets,scope:audit.scope,environment:audit.environment});
  }
  function showAuditFile(){auditFile=$('m1-audit-file').value;$('m1-lean-source').value=editedFiles.find(f=>f.path===auditFile)?.content||'';}
  for(const a of listPinnedAudits())option($('m1-audit-select'),a.id,a.label);$('m1-audit-select').addEventListener('change',loadAudit);$('m1-audit-file').addEventListener('change',showAuditFile);
  $('m1-lean-source').addEventListener('input',()=>{const f=editedFiles.find(f=>f.path===auditFile);if(f)f.content=$('m1-lean-source').value;text('m1-lean-result','SOURCE MODIFIED · 새 Lean 커널 검사가 필요합니다.');});
  on('m1-lean-check',async()=>{if(!audit)throw Error('선택한 Lean 검사 묶음이 없습니다.');const r=await checkPinnedAudit(audit.id,editedFiles);text('m1-lean-result',r);status(r.status+' · 브라우저에서는 검사된 소스를 대조합니다.',r.status==='STALE');});on('m1-lean-reset',loadAudit);
  for(const ref of listTheoremReferences()){
    const div=document.createElement('div');div.className='m1-reference';const title=document.createElement('strong');title.textContent=ref.title;const a=document.createElement('a');a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=ref.locator||'원전';const label=document.createElement('small');label.textContent='THEOREM REFERENCE · '+ref.scope;div.append(title,a,label);if(ref.mathematicalContract){const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('pre');s.textContent='정리의 정확한 가정과 결론';p.textContent=pretty({mathematicalContract:ref.mathematicalContract,applicationPolicy:ref.applicationPolicy,leanImport:ref.leanImport,kernelVerified:ref.kernelVerified});d.append(s,p);div.append(d);}$('m1-theorem-references').append(div);
  }
  for(const c of listAnalyticHypotheses()){const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('pre');s.textContent=c.id;p.textContent=pretty(c);d.append(s,p);$('m1-analytic-hypotheses').append(d);}
  const checkAdapters=()=>{lastAdapters=verifyAdapterFixtures();text('m1-adapter-result',lastAdapters);return lastAdapters;};on('m1-adapter-check',()=>{const r=checkAdapters();status('가정·정리 adapter 검사 '+r.passed+'/'+r.total+' · '+(r.pass?'PASS':'FAIL'),!r.pass);});
  const api=Object.freeze({version:M1_VERSION,getStatus:()=>({ok:true,version:M1_VERSION,session:{id:base().getSession().id,m0Revision:base().getSession().researchM0?.revision??null},environment:{hash:environment.hash,workerSha256:environment.workerSha256,execution:environment.execution},examples:examples.map(e=>({id:e.id,label:e.label,kind:e.request.kind})),jobs:engine.listJobs().map(j=>({id:j.id,status:j.status,kind:j.request.kind,inputHash:j.inputHash})),auditCount:listPinnedAudits().length,lastAdapters,formalPass:false}),validateRequest:validateDomainRequest,
    runExample:async(id,options)=>{const e=examples.find(e=>e.id===id);if(!e)throw Error('설치된 예제 ID가 아닙니다.');setTab(e.domain);$('m1-example').value=e.id;loadExample();return runRequest(e.request,options);},getJob:id=>({ok:true,job:engine.getJob(id)}),cancelJob:id=>({ok:true,cancelRequested:engine.cancel(id)}),saveResult,checkAdapters});
  window.MathScopeResearchM1=api;
  async function register(){registration=await registerM1Tools(api);const {dispose,...view}=registration;text('m1-webmcp',view);}
  window.addEventListener('mathscope:session-rendered',renderSession);window.addEventListener('pagehide',e=>{registration?.dispose();if(!e.persisted){engine.dispose();scene.destroy();if(exportURL)URL.revokeObjectURL(exportURL);}});window.addEventListener('pageshow',e=>{if(e.persisted)void register();});
  const nav=document.querySelector('[data-view-target="research-objects"]');nav?.addEventListener('click',e=>{setTab(tab,e.isTrusted);renderSession();});
  for(const b of document.querySelectorAll('[data-view-target]'))b.addEventListener('click',e=>{if(e.isTrusted&&b.dataset.viewTarget!=='research-objects'&&location.hash.startsWith('#research-objects'))history.replaceState(null,'',location.pathname+location.search);});
  function route(){const m=location.hash.match(/^#research-objects(?:\/(arithmetic|gauge|ns|audit))?$/);if(m){nav?.click();setTab(m[1]||'arithmetic',false);}}
  window.addEventListener('hashchange',route);text('m1-runtime',environment.execution==='BROWSER_WEB_WORKER'?'M1 · Browser Worker':'M1 · Local Runtime');text('m1-capabilities',environment);setTab('arithmetic',false);loadAudit();renderSession();renderJobs();root.dataset.mounted='true';root.dataset.version=M1_VERSION;await register();route();status('M1 준비 완료 · 실제 수학 대상을 선택해 계산하세요.');
}
if(typeof document!=='undefined'){const start=()=>void bootM1().catch(e=>{const out=document.getElementById('m1-status');if(out){out.textContent='M1 초기화 오류: '+e.message;out.dataset.error='true';}});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
