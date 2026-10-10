import {canonicalStringify} from '../mathscope-m0/contracts.mjs';
import {createM2Engine} from './core/engine.mjs';
import {M2_VERSION,LIMITS,normalizeRequest,validateDomainRequest,listExamples} from './core/registry.mjs';
import {commitM2SessionBundle} from './core/session-binding.mjs';
import {parseReplayText,IMPORT_TEXT_MAX_BYTES} from './core/replay-import.mjs';
import {evidenceURL,M2_SOURCE_BRANCH} from './core/evidence-links.mjs';
import {SourceBoundScene,renderObservationTable,renderObservationDetails} from './visualization/renderer.mjs';
import {numericValue,traceBasis} from './visualization/observations.mjs';
import {makeM2Visualization,listM2Panels,makeObservationPair} from './visualization/m2-views.mjs';
import {installM1ResearchControls} from './visualization/m1-controls.mjs';
import {CHECKLIST,ARCHIVE} from './evidence/checklist-data.mjs';
import {registerM2Tools} from './webmcp.mjs';

const pretty=v=>JSON.stringify(v,null,2),TERMINAL=new Set(['COMPLETED','PARTIAL','FAILED','CANCELLED','BUDGET_EXCEEDED','UNSUPPORTED','PRECISION_REQUIRED']);
const DESCRIPTIONS={observation:'네 가지 Δ 모드, 4D 단면·적분·조건부 평균·Wilson 경로, 동일 τ의 물리/유사 좌표 및 정확한 복합체 기저 변환을 비교합니다.',arithmetic:'Pⁿ의 cohomology와 국소 zeta, 타원곡선의 유한체 점계수·Newton slope, 형식 q와 BK 비교, 유한 Witt 연산·perfectoid tower를 계산합니다.',gauge:'실제 군 행렬로 4차원 격자 링크·Wilson 작용을 만들고, 고전 장의 이산화와 유한 앙상블의 통계 진단을 계산합니다.',ns:'원문의 차수별 convolution, 축소 cutoff, potential의 curl, dyadic chart 및 projected pulse ODE·covariance·log tail을 계산합니다.'};
const BOUNDARIES={observation:'각 화면은 실제 계산 기록과 모형·표본·관측 해시에 연결됩니다. 모형 가정과 원본 계산의 검증 상태를 유지합니다. τ=0이나 정밀도 부족은 그림 대신 상태로 표시합니다.',arithmetic:'유한환·다항식·MW Frobenius·q-PD nerve·tilt/Witt와 표준 AΩ 비교를 계산합니다. 각 외부 정리의 가정과 실제 입력을 연결하며, 임의 perfectoid·일반 E∞·새 Lean 증명의 인증 범위는 별도로 유지합니다.',gauge:'유한 격자와 명시한 확률 모형의 계산입니다. 짧은 chain의 통계 진단은 평형·위상 혼합을 보증하지 않으며, 연속체 이론·질량 간극은 별도 과제입니다.',ns:'N3의 실제 원본 프로파일·기호식·구간 근거를 사용합니다. 양의 차수 해와 모멘트 보정, 그 해에서 유도하는 잔차 상수, 실제 pulse의 전역 Gaussian 인증에 남은 조건을 각 실행과 원문 기준에 표시합니다.'};

export async function bootM2(){
  const root=document.getElementById('mathscopeResearchM2');if(!root||root.dataset.mounted==='true')return;
  const $=id=>document.getElementById(id),engine=createM2Engine(),examples=await listExamples(),environment=await engine.environment(),scene=new SourceBoundScene($('m2-scene')),pairScene=new SourceBoundScene($('m2-pair-scene')),origins=new Map(),saved=new Set();
  let selected=null,domain='arithmetic',lastComputeDomain='arithmetic',registration=null,exportURL=null,panelsFor=null,currentView=null,currentPair=null,basisFor=null,synchronizing=false,submissionSequence=0,presentationRevision=0,importReadSequence=0,importBusy=false;
  const sync=(target,camera)=>{if(synchronizing)return;synchronizing=true;target.setCamera(camera);synchronizing=false;};
  scene.onCameraChange(camera=>{if(currentPair)sync(pairScene,camera);requestAnimationFrame(renderRendererMetrics);});pairScene.onCameraChange(camera=>{if(currentPair)sync(scene,camera);requestAnimationFrame(renderRendererMetrics);});
  const foundation=()=>{const f=window.MathScopeV031Foundation;if(!f?.getSession||!f?.commitTypedBundle)throw Error('Research Session 연결이 준비되지 않았습니다.');return f;};
  const text=(id,v)=>{$(id).textContent=typeof v==='string'?v:pretty(v);};
  const status=(v,error=false)=>{text('m2-status',v);$('m2-status').dataset.error=String(error);};
  const option=(el,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o);};
  const request=()=>normalizeRequest(JSON.parse($('m2-input').value));
  const matches=j=>{try{return canonicalStringify(request())===canonicalStringify(j.request);}catch{return false;}};
  const origin=()=>{const s=foundation().getSession();return {id:s.id,revision:s.sessionRevision};};
  function clearValidation(){text('m2-validation','현재 입력의 검사·재현 결과는 아직 없습니다.');$('m2-validation-panel').open=false;}
  function syncExample(req){const key=canonicalStringify(req),ex=examples.find(e=>canonicalStringify(e.request)===key),el=$('m2-example');if(!ex&&![...el.options].some(o=>o.value==='__custom__'))option(el,'__custom__','사용자 입력 · 실행 기록');el.value=ex?.id||'__custom__';}
  function renderSession(){try{const s=foundation().getSession();text('m2-session',s.id+' · session revision '+s.sessionRevision);}catch(e){text('m2-session',e.message);}}
  function on(id,fn){$(id).addEventListener('click',async()=>{const b=$(id);if(b.dataset.busy==='true')return;b.dataset.busy='true';b.disabled=true;try{await fn();}catch(e){status(e.message,true);}finally{b.dataset.busy='false';b.disabled=false;renderJobs();}});}
  function metric(label,value){const d=document.createElement('div'),a=document.createElement('strong'),b=document.createElement('small');d.className='m1-metric';a.textContent=String(value??'—');b.textContent=label;d.append(a,b);$('m2-metrics').append(d);}
  function setDomain(name,updateHash=true,focus=false){
    if(!['arithmetic','gauge','ns','observation','checklist'].includes(name))return;
    const changed=name!=='checklist'&&lastComputeDomain!==name;if(domain!==name)presentationRevision++;domain=name;
    for(const b of root.querySelectorAll('[data-m2-tab]')){const yes=b.dataset.m2Tab===name;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;if(yes&&focus)b.focus();}
    $('m2-compute-area').hidden=name==='checklist';$('m2-checklist-area').hidden=name!=='checklist';
    if(name!=='checklist'){lastComputeDomain=name;$('m2-compute-area').setAttribute('aria-labelledby','m2-tab-'+name);text('m2-domain-description',DESCRIPTIONS[name]);text('m2-domain-boundary',BOUNDARIES[name]);if(changed||!$('m2-example').options.length){$('m2-example').replaceChildren();for(const e of examples.filter(e=>e.domain===name))option($('m2-example'),e.id,e.label);loadExample();}requestAnimationFrame(()=>scene.draw());}
    if(updateHash&&root.classList.contains('active'))history.replaceState(null,'','#research-m2/'+name);
  }
  function loadExample(){const ex=examples.find(e=>e.id===$('m2-example').value);if(!ex)return;presentationRevision++;selected=null;panelsFor=null;$('m2-input').value=pretty(ex.request);text('m2-kind',ex.request.kind);clearValidation();renderResult();renderJobs();status('예제 입력 준비 · '+ex.request.kind);}
  function selectJob(id){const j=engine.getJob(id);presentationRevision++;if(!root.classList.contains('active'))document.querySelector('[data-view-target="research-m2"]')?.click();setDomain(j.request.kind.split('.')[0]);selected=id;$('m2-input').value=pretty(j.request);text('m2-kind',j.request.kind);syncExample(j.request);clearValidation();panelsFor=null;renderResult();renderJobs();status(j.request.kind+' · '+j.status+' · 선택한 실행 기록');return {ok:true,jobId:id,status:j.status,visualization:visualStatus()};}
  function renderJobs(){
    const jobs=engine.listSummaries();text('m2-job-count',jobs.length+' / '+LIMITS.maxJobs+' jobs');$('m2-jobs').replaceChildren();
    for(const j of jobs.slice().reverse()){const b=document.createElement('button'),s=document.createElement('strong'),small=document.createElement('small');b.type='button';s.textContent=j.kind+' · '+j.status;small.textContent=j.id+(saved.has(j.id)?' · 세션 저장됨':'');b.append(s,small);b.dataset.selected=String(j.id===selected);b.addEventListener('click',()=>selectJob(j.id));$('m2-jobs').append(b);}
    const j=jobs.find(x=>x.id===selected),done=j&&TERMINAL.has(j.status),canSave=j&&['COMPLETED','PARTIAL'].includes(j.status)&&origins.has(j.id)&&!saved.has(j.id);
    $('m2-cancel').disabled=!j||done;$('m2-save').disabled=!canSave||currentView?.binding.currentEditorMatches===false||$('m2-save').dataset.busy==='true';$('m2-replay').disabled=!done||$('m2-replay').dataset.busy==='true';$('m2-export').disabled=!done;
  }
  function renderRendererMetrics(){const m=scene.getMetrics(),value=m.p95Milliseconds;const method=m.renderer.startsWith('WEBGL')?'WebGL 가속':'CPU Canvas2D';text('m2-render-status',method+(m.webgl?.state==='UNAVAILABLE'?' · 이 브라우저에서는 CPU 대체 표시':'')+(value===null?'':' · 최근 그리기 지연 p95 '+value.toFixed(1)+' ms / 목표 100 ms')+' · 정확한 원본 값은 표에 유지합니다.');}
  function visualStatus(){if(!currentView)return null;const v=currentView;return {state:v.state,kind:v.kind,title:v.title,binding:v.binding,tableRows:v.table.rows.length,totalRows:v.table.totalRows,points:v.scene.points.length,lines:v.scene.lines.length,arrows:v.scene.arrows.length,lod:v.lod,renderer:scene.getMetrics(),panel:$('m2-observation-select').value,pair:currentPair?{id:currentPair.id,state:currentPair.state,shared:currentPair.shared,left:currentPair.left.binding,right:currentPair.right.binding,rightPoints:currentPair.right.scene.points.length,rightTableRows:currentPair.right.table.rows.length,leftCamera:scene.getCamera(),rightCamera:pairScene.getCamera(),rightRenderer:pairScene.getMetrics()}:null};}
  function renderResult(){
    const j=selected?engine.getJob(selected):null,r=j?.result,editorMatches=j?matches(j):true;
    if(panelsFor!==j?.id+(r?'result':'pending')){const options=listM2Panels(j);$('m2-observation-select').replaceChildren();for(const p of options.length?options:[{id:'main',title:'원본 관측'}])option($('m2-observation-select'),p.id,p.title);panelsFor=j?.id+(r?'result':'pending');}
    const viewOptions={currentEditorMatches:editorMatches,maxPoints:Number($('m2-lod').value),maxRows:200,panel:$('m2-observation-select').value,colorMode:$('m2-color-mode').value};currentPair=makeObservationPair(j,viewOptions);const v=currentPair?.left||makeM2Visualization(j,viewOptions);currentView=v;
    $('m2-pair-scenes').dataset.paired=String(!!currentPair);$('m2-right-surface').hidden=!currentPair;$('m2-left-label').hidden=!currentPair;$('m2-pair-table').hidden=!currentPair;scene.setVisualization(v);
    if(currentPair){const isBlowup=j.request.kind==='observation.blowup-pair';text('m2-left-label',currentPair.label+' · '+(isBlowup?'물리 좌표 · 고정 시야':'왼쪽 Δ='+r.states?.[0]?.delta));text('m2-right-label',isBlowup?'같은 τ · 유사 좌표':'오른쪽 Δ='+r.states?.[1]?.delta);pairScene.setVisualization(currentPair.right);pairScene.setCamera(scene.getCamera());renderObservationTable($('m2-pair-table-head'),$('m2-pair-table-body'),currentPair.right);}else pairScene.set({points:[],lines:[],arrows:[],axes:[]});
    root.dataset.resultStatus=j?.status||'NOT_RUN';root.dataset.resultKind=j?.request.kind||'';root.dataset.visualizationState=v.state;
    text('m2-result-status',v.state==='READY'?(j?.status||'NOT_RUN'):v.state);text('m2-result-description',j?j.request.kind+' · '+(editorMatches?'현재 입력의 실행':'이전 입력의 실행 기록')+' · '+j.id:'현재 입력의 계산을 실행하세요.');
    $('m2-metrics').replaceChildren();
    if(j){metric('실행 상태',j.status);metric('입력 SHA-256',j.inputHash.slice(0,12));if(r){const checks=r.checks||[];metric('유한 독립 검사',checks.filter(c=>c.pass===true||c.ok===true||c.status==='PASS').length+' / '+checks.length);if(r.results?.extensionField)metric('유한체 점계수',r.results.extensionField.count);if(r.results?.aP!==undefined)metric('aₚ',r.results.aP);if(r.measurements?.action!==undefined){const action=numericValue(r.measurements.action);metric('Wilson 작용 S',Number.isFinite(action)?Number(action.toPrecision(7)):'미확정');}if(r.statistics?.effectiveSampleSize!==undefined)metric('유효 표본 수',r.statistics.effectiveSampleSize===null?'미확정':Math.floor(r.statistics.effectiveSampleSize));if(r.replicas)metric('독립 replica',r.replicas.length);}}
    renderObservationTable($('m2-table-head'),$('m2-table-body'),v);renderObservationDetails($('m2-observation-details'),v);$('m2-observation-details').classList.add('m2-source-details');
    text('m2-observation',[v.title,v.description,v.axisMetadata.map(a=>a.label+' ['+a.type+'; '+a.unit+']').join(' · '),v.lod.originalPoints>v.lod.displayedPoints?'화면 '+v.lod.displayedPoints+' / 원본 '+v.lod.originalPoints+'개 · 전체 구간 LOD':null,...v.lostInformation].filter(Boolean).join('\n'));
    renderRendererMetrics();
    text('m2-color-range',v.color?.range?v.color.quantity+' · '+v.color.unit+' · '+v.color.range[0]+' → '+v.color.range[1]+' · '+v.color.mode:'값은 표·레이블·서로 다른 점과 선 모양으로 함께 제공합니다.');
    const bases=editorMatches?r?.results?.complex?.basis:null;$('m2-basis-controls').hidden=!Array.isArray(bases);if(Array.isArray(bases)&&basisFor!==j.id){basisFor=j.id;$('m2-basis-component').replaceChildren();for(const[k,list]of bases.entries())for(const[i,b]of list.entries())option($('m2-basis-component'),k+':'+i,'C'+k+' · '+i+' · '+(typeof b==='string'?b:b.id||JSON.stringify(b)));$('m2-basis-mode').value=j.request.input.basis||'ORIGINAL';traceSelectedBasis();}
    const blockers=[...(r?.blockers||[]),...(r?.scopeBlockers||[]),...(Array.isArray(r?.remaining)?r.remaining:[])];$('m2-blockers').hidden=!blockers.length;$('m2-blockers').replaceChildren();if(blockers.length){const title=document.createElement('strong');title.textContent='이 결과에 남은 조건';$('m2-blockers').append(title);for(const b of blockers){const p=document.createElement('p');p.textContent=typeof b==='string'?b:pretty(b);$('m2-blockers').append(p);}}
    text('m2-diagnostics',r?{checks:r.checks||[],diagnostics:r.diagnostics||r.results?.diagnostics||null,scope:r.scope||r.proofBoundary||r.results?.scope||null,precisionLedger:r.precisionLedger||null,sourceLedger:r.sourceLedger||r.provenance||r.manifest||null}:{status:j?.status||'NOT_RUN',checkpoint:j?.checkpoint||null});text('m2-result-json',j||{});
  }
  function traceSelectedBasis(){if(!selected)return;const[k,i]=$('m2-basis-component').value.split(':').map(Number);text('m2-basis-trace',traceBasis(engine.getJob(selected),k,i));}
  async function runRequest(value,options={}){
    const callSequence=++submissionSequence,initialPresentation=presentationRevision,req=normalizeRequest(value),captured=origin(),valid=await validateDomainRequest(req);
    if(!valid.ok){if(callSequence===submissionSequence&&presentationRevision===initialPresentation){text('m2-validation',valid);$('m2-validation-panel').open=true;}throw Error('입력 계약: '+pretty(valid.errors));}
    if(options.signal?.aborted)return {ok:false,code:'CANCELLED'};
    let submittedPresentation=null;
    if(callSequence===submissionSequence&&presentationRevision===initialPresentation){if(!root.classList.contains('active'))document.querySelector('[data-view-target="research-m2"]')?.click();setDomain(req.kind.split('.')[0]);$('m2-input').value=pretty(req);text('m2-kind',req.kind);syncExample(req);clearValidation();submittedPresentation=++presentationRevision;}
    const j=await engine.submit(req);origins.set(j.id,captured);
    if(options.signal){const abort=()=>engine.cancel(j.id);if(options.signal.aborted)abort();else{options.signal.addEventListener('abort',abort,{once:true});void engine.wait(j.id).then(()=>options.signal.removeEventListener('abort',abort));}}
    let stillCurrent=false;try{stillCurrent=submittedPresentation!==null&&presentationRevision===submittedPresentation&&callSequence===submissionSequence&&canonicalStringify(request())===canonicalStringify(req);}catch{}
    if(stillCurrent){presentationRevision++;selected=j.id;panelsFor=null;renderResult();status(req.kind+' 실행 중 · '+j.id);}renderJobs();return {ok:true,jobId:j.id,status:engine.getJob(j.id).status,inputHash:j.inputHash,selected:stillCurrent};
  }
  async function saveResult(id){const j=engine.getJob(id),captured=origins.get(id);if(!captured)throw Error('이 실행의 세션 출처를 확인할 수 없습니다. 다시 실행하세요.');if(saved.has(id))return {ok:true,alreadySaved:true,jobId:id};if(id===selected&&!matches(j))throw Error('현재 입력이 달라졌습니다. 실행 기록을 선택해 원래 입력을 복원하세요.');const report=await commitM2SessionBundle(j,engine,foundation(),captured);saved.add(id);renderSession();renderJobs();status('현재 세션에 유한 계산 기록을 저장했습니다 · '+id);const {session,...summary}=report;return {ok:true,jobId:id,report:summary,formalPass:false};}
  async function replayJob(id){const captured=origin(),initialPresentation=presentationRevision,report=await engine.replay(await engine.exportBundle(id));origins.set(report.freshJobId,captured);const present=initialPresentation===presentationRevision;if(present){selectJob(report.freshJobId);text('m2-validation',report);$('m2-validation-panel').open=true;}else renderJobs();status('동일 소스 재현 검사 · '+report.status+(present?'':' · 새 결과는 실행 목록에 보관했습니다.'),report.status!=='MATCH');return {ok:true,...report,selected:present};}
  function importReport(report,message,error=false){text('m2-import-report',report);$('m2-import-report-panel').hidden=false;$('m2-import-report-panel').open=true;text('m2-import-status',message);$('m2-import-status').dataset.error=String(error);}
  async function inspectImport(raw){const inspected=await engine.inspectBundle(parseReplayText(raw));return {ok:true,...inspected.summary};}
  async function importBundle(raw,options={}){
    const mode=options.mode||'REPLAY';
    if(!['REPLAY','INPUT_ONLY'].includes(mode))throw Error('가져오기 방식은 REPLAY 또는 INPUT_ONLY여야 합니다.');
    if(importBusy)throw Object.assign(Error('진행 중인 가져오기가 끝난 뒤 다시 시도하세요.'),{code:'IMPORT_BUSY'});
    if(options.signal?.aborted)return {ok:false,code:'CANCELLED',state:'NOT_STARTED'};
    importBusy=true;
    const callSequence=++submissionSequence,initialPresentation=presentationRevision,contentTicket=importReadSequence;
    let submittedPresentation=null,freshId=null,captured;
    const sourceCurrent=()=>{try{const current=origin();return callSequence===submissionSequence&&contentTicket===importReadSequence&&captured?.id===current.id&&captured?.revision===current.revision;}catch{return false;}};
    const initialCurrent=()=>sourceCurrent()&&initialPresentation===presentationRevision;
    try{
      captured=origin();
      const inspected=await engine.inspectBundle(parseReplayText(raw));
      if(options.signal?.aborted)return {ok:false,code:'CANCELLED',state:'NOT_STARTED'};
      if(!initialCurrent())return {ok:false,code:'INPUT_CHANGED',state:'NOT_STARTED'};
      const valid=await validateDomainRequest(inspected.request);if(!valid.ok)throw Error('가져온 입력 계약: '+pretty(valid.errors));
      if(options.signal?.aborted)return {ok:false,code:'CANCELLED',state:'NOT_STARTED'};
      if(!initialCurrent())return {ok:false,code:'INPUT_CHANGED',state:'NOT_STARTED'};
      if(mode==='INPUT_ONLY'){
        if(!root.classList.contains('active'))document.querySelector('[data-view-target="research-m2"]')?.click();
        setDomain(inspected.request.kind.split('.')[0]);selected=null;panelsFor=null;presentationRevision++;
        $('m2-input').value=pretty(inspected.request);text('m2-kind',inspected.request.kind);syncExample(inspected.request);clearValidation();renderResult();renderJobs();
        const report={ok:true,status:'INPUT_LOADED',inspection:inspected.summary,newJobSubmitted:false,importedResultAdopted:false,automaticEvidenceSave:false};
        importReport(report,'원래 입력을 불러왔습니다. 계산 실행을 누르면 현재 환경에서 새 결과를 만듭니다.');status('가져온 입력 준비 · 새 계산을 실행하세요.');return report;
      }
      if(!inspected.summary.sameEnvironment)throw Object.assign(Error('파일의 버전 또는 실행 환경이 현재와 다릅니다. 입력만 불러온 뒤 새로 실행하세요.'),{code:'IMPORT_ENVIRONMENT_MISMATCH',inspection:inspected.summary});
      importReport(inspected.summary,'기록의 해시가 일치합니다. 원래 입력을 새로 계산해 비교하고 있습니다.');
      const report=await engine.replay(inspected.bundle,{signal:options.signal,shouldDispatch:initialCurrent,onSubmitted:j=>{
        freshId=j.id;origins.set(j.id,captured);
        if(initialCurrent()){selectJob(j.id);submittedPresentation=presentationRevision;}
        renderJobs();
      }});
      const present=sourceCurrent()&&submittedPresentation===presentationRevision&&selected===freshId;
      if(present){renderResult();text('m2-validation',report);$('m2-validation-panel').open=true;}
      renderJobs();
      const result={ok:true,...report,selected:present,inspection:inspected.summary,automaticEvidenceSave:false};
      if(sourceCurrent())importReport(result,'가져오기 재계산 · '+report.status+(present?' · 새 실행의 원본 입력과 관측을 복원했습니다.':' · 새 결과는 실행 기록에 보관했습니다.'),report.status!=='MATCH');
      if(present)status('가져온 실행 기록 재현 · '+report.status,report.status!=='MATCH');
      return result;
    }catch(e){if(sourceCurrent())importReport({ok:false,code:e.code||'IMPORT_FAILED',message:e.message,inspection:e.inspection||null},e.message,true);throw e;}
    finally{importBusy=false;}
  }
  async function runExampleSuite(ids,options={}){
    if(!Array.isArray(ids)||ids.length<1||ids.length>12||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!examples.some(e=>e.id===id)))throw Error('서로 다른 설치 예제 ID 1–12개가 필요합니다.');
    if(engine.listSummaries().length+ids.length>LIMITS.maxJobs)throw Error('예제 묶음을 보관할 실행 공간이 부족합니다. 현재 기록을 내보낸 뒤 새 런타임에서 실행하세요.');
    const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,50000),runs=[];
    options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
    try{for(const id of ids){
      if(controller.signal.aborted)break;
      const e=examples.find(x=>x.id===id),submitted=await runRequest(e.request,{signal:controller.signal});if(!submitted.jobId)break;
      const job=await engine.wait(submitted.jobId),panels=[];
      if(selected!==job.id||!matches(job)){runs.push({exampleId:id,jobId:job.id,status:job.status,display:'USER_INPUT_CHANGED'});break;}
      const originalPanel=$('m2-observation-select').value;
      for(const p of listM2Panels(job)){
        if(controller.signal.aborted)break;
        $('m2-observation-select').value=p.id;renderResult();
        const v=currentView,shown=visualStatus();
        panels.push({id:p.id,state:v.state,kind:v.kind,tableRows:v.table.rows.length,points:v.scene.points.length,finiteCoordinates:v.scene.points.every(x=>x.pos.every(Number.isFinite)),inputBound:v.binding.inputHash===job.inputHash,sourceHash:v.binding.sourceHash,renderer:shown.renderer,pair:shown.pair?{state:shown.pair.state,rightPoints:shown.pair.rightPoints,rightTableRows:shown.pair.rightTableRows,shared:shown.pair.shared}:null});
      }
      $('m2-observation-select').value=originalPanel;renderResult();
      runs.push({exampleId:id,jobId:job.id,status:job.status,inputHash:job.inputHash,mathematicalHash:job.mathematicalHash,resultHash:job.resultHash,sourceHash:job.result?.sourceHash||null,checks:job.result?.checks||[],panels,rendered:panels.length>0&&panels.every(p=>p.tableRows>0&&p.finiteCoordinates&&p.inputBound)});
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(selected!==job.id||!matches(job))break;
    }}finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
    return {ok:true,scope:'INSTALLED_EXAMPLES_AND_VISIBLE_PANELS',requested:ids,completed:runs.length,cancelled:controller.signal.aborted,runs,environment:{hash:environment.hash,workerSha256:environment.workerSha256,execution:environment.execution},automaticEvidenceSave:false,formalPass:false};
  }
  function exportData(name,data){if(exportURL)URL.revokeObjectURL(exportURL);const content=pretty(data);exportURL=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));$('m2-download').href=exportURL;$('m2-download').download=name;$('m2-download').textContent=name;$('m2-export-content').value=content;$('m2-export-panel').hidden=false;$('m2-export-panel').open=true;}
  function renderChecklist(){
    const p=$('m2-checklist-package').value,filter=$('m2-checklist-filter').value;$('m2-checklist').replaceChildren();
    for(const c of CHECKLIST.filter(c=>(p==='all'||c.id.startsWith(p+'-'))&&(filter==='all'||c.status===filter))){
      const d=document.createElement('details'),s=document.createElement('summary'),badge=document.createElement('span'),title=document.createElement('strong'),original=document.createElement('p'),scope=document.createElement('p'),test=document.createElement('p');d.className='m2-check-item';d.dataset.state=c.status;d.dataset.criterionId=c.id;badge.className='m1-tag';badge.textContent=c.status;title.textContent=c.id+' · '+c.title;s.append(badge,title);original.className='m2-criterion';original.textContent=c.criteria;scope.className='m1-muted';scope.textContent='현재 구현: '+c.implementedScope;test.className='m1-muted';test.textContent='설계도 p.'+c.sourcePage+' · '+(c.testStatus||'원문 조건별 추가 검증 진행');d.append(s,original,scope,test);
      if(c.acceptanceScope){const acceptance=document.createElement('p');acceptance.className='m1-muted';acceptance.textContent='통과 범위: '+c.acceptanceScope;d.append(acceptance);}
      for(const obligation of c.remainingObligations||[]){const p=document.createElement('p');p.className='m1-muted';p.textContent='남은 조건: '+obligation;d.append(p);}
      const links=document.createElement('div');links.className='m2-evidence-links';
      for(const path of c.evidencePaths||[]){const href=evidenceURL(path);if(!href)continue;const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=path.split('/').pop();a.title=path;links.append(a);}
      if(links.childElementCount){const label=document.createElement('p');label.className='m1-muted';label.textContent='검증 근거 · 원본 소스';d.append(label,links);}
      $('m2-checklist').append(d);
    }
  }
  const counts=CHECKLIST.reduce((a,c)=>(a[c.status]++,a),{PASS:0,PARTIAL:0,OPEN:0});for(const [key,label] of [['PASS','명시한 구현·검증 범위 통과'],['PARTIAL','부분 구현 · 추가 검증'],['OPEN','미구현 · 연구 진행']]){const d=document.createElement('div');d.className='m1-metric';const a=document.createElement('strong'),b=document.createElement('small');a.textContent=String(counts[key]||0);b.textContent=label;d.append(a,b);$('m2-checklist-summary').append(d);}
  for(const b of root.querySelectorAll('[data-m2-tab]')){b.addEventListener('click',()=>setDomain(b.dataset.m2Tab));b.addEventListener('keydown',e=>{const names=['arithmetic','gauge','ns','observation','checklist'],i=names.indexOf(domain);let j;if(e.key==='ArrowRight')j=(i+1)%5;else if(e.key==='ArrowLeft')j=(i+4)%5;else if(e.key==='Home')j=0;else if(e.key==='End')j=4;else return;e.preventDefault();setDomain(names[j],true,true);});}
  on('m2-load',loadExample);$('m2-example').addEventListener('change',loadExample);$('m2-input').addEventListener('input',()=>{presentationRevision++;clearValidation();renderResult();renderJobs();});$('m2-observation-select').addEventListener('change',renderResult);$('m2-lod').addEventListener('change',renderResult);$('m2-color-mode').addEventListener('change',renderResult);$('m2-render-mode').addEventListener('change',()=>{scene.setRenderMode($('m2-render-mode').value);pairScene.setRenderMode($('m2-render-mode').value);renderRendererMetrics();});$('m2-basis-component').addEventListener('change',traceSelectedBasis);
  on('m2-basis-run',()=>{const q=request();if(q.kind!=='observation.complex-basis')throw Error('관측·비교의 정수 기저 교체 예제를 선택하세요.');q.input.basis=$('m2-basis-mode').value;return runRequest(q);});
  on('m2-validate',async()=>{const initialPresentation=presentationRevision,v=await validateDomainRequest(request());if(presentationRevision!==initialPresentation)return;text('m2-validation',v);$('m2-validation-panel').open=true;status(v.ok?'입력 계약 통과 · 개별 수학적 검사는 실행 결과에서 확인하세요.':'입력 계약을 확인하세요.',!v.ok);});on('m2-run',()=>runRequest(request()));on('m2-cancel',()=>{if(selected)engine.cancel(selected);});on('m2-save',()=>saveResult(selected));on('m2-replay',()=>replayJob(selected));on('m2-export',async()=>{exportData('MathScope-M2-'+selected.replaceAll(':','-')+'.json',await engine.exportBundle(selected));status('입력·전체 결과·소스 해시를 포함한 JSON을 준비했습니다.');});
  on('m2-copy',async()=>{$('m2-export-content').focus();$('m2-export-content').select();try{await navigator.clipboard.writeText($('m2-export-content').value);status('전체 실행 JSON을 복사했습니다.');}catch{status('전체 JSON을 선택했습니다. Ctrl/Cmd+C로 복사하세요.');}});
  $('m2-import-content').addEventListener('input',()=>{importReadSequence++;$('m2-import-report-panel').hidden=true;text('m2-import-status','내용이 변경되었습니다. 파일 검사를 실행하세요.');});
  $('m2-import-file').addEventListener('change',async()=>{const ticket=++importReadSequence,file=$('m2-import-file').files?.[0];if(!file)return;$('m2-import-content').value='';$('m2-import-report-panel').hidden=true;text('m2-import-report','');text('m2-import-status','파일을 읽는 중입니다.');try{if(file.size>IMPORT_TEXT_MAX_BYTES)throw Error('가져오기 파일은 32 MiB 이하여야 합니다.');const raw=await file.text();if(ticket!==importReadSequence)return;$('m2-import-content').value=raw;const report=await inspectImport(raw);if(ticket!==importReadSequence)return;importReport(report,file.name+' · '+(report.sameEnvironment?'같은 환경 · 재계산 비교 가능':'다른 환경 · 입력만 불러오기 가능'));}catch(e){if(ticket===importReadSequence)importReport({ok:false,code:e.code||'IMPORT_FAILED',message:e.message},e.message,true);}});
  on('m2-import-inspect',async()=>{const ticket=importReadSequence,report=await inspectImport($('m2-import-content').value);if(ticket===importReadSequence)importReport(report,report.sameEnvironment?'파일 해시와 실행 환경을 확인했습니다. 재계산 비교를 시작할 수 있습니다.':'파일 해시는 일치하고 실행 환경은 다릅니다. 입력만 불러와 새로 실행할 수 있습니다.');});
  on('m2-import-replay',()=>importBundle($('m2-import-content').value));
  on('m2-import-input',()=>importBundle($('m2-import-content').value,{mode:'INPUT_ONLY'}));
  for(const b of root.querySelectorAll('[data-m2-camera]'))b.addEventListener('click',()=>scene.camera(b.dataset.m2Camera));$('m2-checklist-package').addEventListener('change',renderChecklist);$('m2-checklist-filter').addEventListener('change',renderChecklist);
  engine.subscribe(j=>{if(j.id===selected){renderResult();if(TERMINAL.has(j.status))status(j.request.kind+' · '+j.status+' · 유한 검사와 남은 조건을 결과에서 확인하세요.',['FAILED','BUDGET_EXCEEDED'].includes(j.status));}renderJobs();});
  const api=Object.freeze({version:M2_VERSION,getStatus:()=>({ok:true,version:M2_VERSION,examples:examples.map(e=>({id:e.id,label:e.label,kind:e.request.kind,domain:e.domain})),jobs:engine.listSummaries(),checklist:{total:CHECKLIST.length,counts,fullM2Complete:counts.PASS===64,completionScope:'ORIGINAL_64_ACCEPTANCE_CRITERIA_WITH_RECORDED_SCOPES'},source:{repository:'leegahuyn/MathScopeCompute',branch:M2_SOURCE_BRANCH},transfer:{importBusy,maxTextBytes:IMPORT_TEXT_MAX_BYTES,modes:['REPLAY','INPUT_ONLY'],automaticEvidenceSave:false},environment:{hash:environment.hash,workerSha256:environment.workerSha256,execution:environment.execution},visualization:visualStatus(),session:origin(),formalPass:false}),validateRequest:validateDomainRequest,runRequest,runExampleSuite,runExample:async(id,options)=>{const e=examples.find(e=>e.id===id);if(!e)throw Error('설치된 예제 ID가 아닙니다.');setDomain(e.domain);$('m2-example').value=e.id;return runRequest(e.request,options);},getJob:id=>({ok:true,job:engine.getJob(id)}),selectJob,cancelJob:id=>({ok:true,cancelRequested:engine.cancel(id)}),saveResult,replayJob,exportBundle:id=>engine.exportBundle(id),inspectImport,importBundle,renderingAudit:()=>({ok:true,left:scene.renderingAudit(),right:currentPair?pairScene.renderingAudit():null,visualization:visualStatus()})});
  window.MathScopeResearchM2=api;
  async function register(){registration=await registerM2Tools(api);const {dispose,...state}=registration;text('m2-webmcp',state);}
  const nav=document.querySelector('[data-view-target="research-m2"]');nav?.addEventListener('click',e=>{setDomain(domain,e.isTrusted);renderSession();requestAnimationFrame(()=>scene.draw());});
  for(const b of document.querySelectorAll('[data-view-target]'))b.addEventListener('click',e=>{if(e.isTrusted&&b.dataset.viewTarget!=='research-m2'&&location.hash.startsWith('#research-m2'))history.replaceState(null,'',location.pathname+location.search);});
  function route(){const m=location.hash.match(/^#research-m2(?:\/(arithmetic|gauge|ns|observation|checklist))?$/);if(m){nav?.click();setDomain(m[1]||'arithmetic',false);}}
  window.addEventListener('hashchange',route);window.addEventListener('mathscope:session-rendered',renderSession);window.addEventListener('pagehide',e=>{registration?.dispose();if(!e.persisted){engine.dispose();scene.destroy();pairScene.destroy();if(exportURL)URL.revokeObjectURL(exportURL);}});window.addEventListener('pageshow',e=>{if(e.persisted)void register();});
  text('m2-runtime','M2 '+M2_VERSION+' · '+(environment.execution==='BROWSER_WEB_WORKER'?'Browser Worker':'Local Runtime'));text('m2-environment',environment);text('m2-m1-archive',ARCHIVE);renderChecklist();setDomain('arithmetic',false);renderSession();renderJobs();root.dataset.mounted='true';root.dataset.version=M2_VERSION;installM1ResearchControls();await register();route();status('M2 준비 완료 · '+examples.length+'개 실행 예제와 원문 64개 기준을 확인할 수 있습니다.');
}
if(typeof document!=='undefined'){const start=()=>void bootM2().catch(e=>{const out=document.getElementById('m2-status');if(out){out.textContent='M2 초기화 오류: '+e.message;out.dataset.error='true';}});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
