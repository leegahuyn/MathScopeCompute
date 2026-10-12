/* MathScope M3/P7. Browser renders server evidence; it issues no proof authority. */
(()=>{
  'use strict';
  const ROOT=document.getElementById('mathscopeResearchM3');if(!ROOT||ROOT.dataset.initialized)return;ROOT.dataset.initialized='true';
  const SERVICE='https://mathscope-compute.onrender.com',MAX_BYTES=32*1024*1024,MAX_INPUT_BYTES=64*1024;
  const $=id=>document.getElementById('m3-'+id),pretty=v=>JSON.stringify(v,null,2);
  const set=(id,value)=>{$(id).textContent=typeof value==='string'?value:pretty(value);};
  const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
  let capabilities=null,record=null,pendingRecord=null,pendingJSON=null,busy=false,revision=0,importRevision=0,downloadURL=null,editorDirty=false,registration=null;
  function status(message,error=false){set('status',message);$('status').dataset.error=String(error);}
  function controls(){
    for(const id of ['run','check','load','input','example'])$(id).disabled=busy||!capabilities;
    for(const id of ['import','import-file','import-text','reconnect'])$(id).disabled=busy;
    $('replay').disabled=busy||!record||record.execution.status!=='COMPLETED';
    $('export').disabled=busy||!record;
    $('import-replay').disabled=busy||!pendingRecord||!capabilities;
    $('import-input').disabled=busy||!pendingRecord||!capabilities;
    ROOT.setAttribute('aria-busy',String(busy));
    window.dispatchEvent(new CustomEvent('mathscope:p7-state',{detail:{revision,busy,capabilities,record}}));
  }
  function clearResult(message='입력이 바뀌었습니다. 새 계산을 실행하세요.'){
    revision++;record=null;$('result-content').hidden=true;$('download-panel').hidden=true;
    set('result-status','NOT_RUN');set('result-description',message);set('replay-status','');
    if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;}controls();
  }
  function readRequest(text=$('input').value){
    if(new TextEncoder().encode(text).length>MAX_INPUT_BYTES)throw Error('실행 입력이 64 KiB 상한을 넘었습니다.');
    const value=JSON.parse(text);
    if(!value||Array.isArray(value)||Object.keys(value).sort().join(',')!=='input,kind'||!value.input||typeof value.input!=='object'||Array.isArray(value.input)||!capabilities?.kinds.includes(value.kind))throw Error('지원되는 kind와 객체 input만 있는 요청이 필요합니다.');
    return value;
  }
  async function api(path,body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),110000);
    try{
      const response=await fetch(SERVICE+'/v1/p7/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body),signal:controller.signal,credentials:'omit'});
      const value=await response.json();if(!response.ok)throw Error(typeof value.detail==='string'?value.detail:pretty(value.detail||value));return value;
    }catch(error){if(error.name==='AbortError')throw Error('응답 대기 시간이 끝났습니다. 서버 실행이 종료되었다고 단정할 수 없습니다. 환경을 확인한 뒤 다시 시도하세요.');throw error;}finally{clearTimeout(timer);}
  }
  function safeEnvelope(value){
    if(!value||value.schema!=='MathScope.M3.P7Execution/1'||!value.request||!value.execution||!value.sourceBinding||value.serializedAuthority!=='UNTRUSTED_REQUIRES_REEXECUTION'||value.formalLeanProofIssued!==false||value.wholeP7Complete!==false||value.wholeM3Complete!==false)throw Error('P7 실행 기록의 범위·증명 권한 형식이 올바르지 않습니다.');
    return value;
  }
  function cellText(value){return value===undefined?'—':typeof value==='string'?value:pretty(value);}
  function table(title,headers,rows){
    const section=document.createElement('section');section.className='m3-data';const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
    const wrapper=document.createElement('div');wrapper.className='m1-table-wrap';const table=document.createElement('table'),head=document.createElement('thead'),body=document.createElement('tbody'),tr=document.createElement('tr');
    for(const label of headers){const th=document.createElement('th');th.scope='col';th.textContent=label;tr.append(th);}head.append(tr);
    for(const row of rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.className='m3-exact';td.textContent=cellText(value);tr.append(td);}body.append(tr);}
    table.append(head,body);wrapper.append(table);section.append(wrapper);$('results').append(section);
  }
  function dyadic(value){return value&&typeof value==='object'&&'mantissa'in value&&'exponent'in value?value.mantissa+' × 2^('+value.exponent+')':cellText(value);}
  function interval(value){if(!value)return '—';if(value.lower!==undefined&&value.upper!==undefined)return '['+dyadic(value.lower)+', '+dyadic(value.upper)+']';return cellText(value);}
  function render(value,request){
    safeEnvelope(value);
    if(stable(value.request)!==stable(request))throw Error('서버 결과가 제출한 입력과 다릅니다. 결과 연결을 거부했습니다.');
    if(capabilities.sourceBinding&&stable(value.sourceBinding)!==stable(capabilities.sourceBinding))throw Error('확인한 서버 소스가 실행 중 바뀌었습니다. 환경을 다시 확인하세요.');
    record=value;const r=value.result||{};$('result-content').hidden=false;
    const resultState=r.status||(r.toleranceMet===true?'TOLERANCE_MET':r.toleranceMet===false?'WIDTH_UNRESOLVED':'SCOPED_RESULT');
    set('result-status',value.execution.status+(value.result?' / '+resultState:''));
    set('result-description',value.execution.status==='COMPLETED'?'아래 값은 방금 서버에서 실행한 이 입력의 결과입니다. 구간·가정·적용 범위를 함께 확인하세요.':'실행이 완료되지 않았습니다. 실행 상태와 원인을 기록하며 수학적 결론을 발급하지 않습니다.');
    $('metrics').replaceChildren();
    for(const [label,item]of [['실행',value.execution.status],['계산 범위',value.request.kind],['실행 시간',Number.isFinite(value.execution.elapsedSeconds)?value.execution.elapsedSeconds.toFixed(3)+' s':'—']]){const div=document.createElement('div');div.className='m1-metric';const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=item;small.textContent=label;div.append(strong,small);$('metrics').append(div);}
    $('results').replaceChildren();
    if(Array.isArray(r.derivatives))table('특수함수와 미분 · 정확한 외향 구간',['차수','실수 구간','허수 구간','최대 성분 폭'],r.derivatives.map(x=>[x.order,interval(x.ball?.real),interval(x.ball?.imag),dyadic(x.ball?.maxComponentWidth)]));
    if(r.positiveZeroCount!==undefined)table('유한 높이 영점 계수',['높이','양의 영점 개수','상태'],[[value.request.input.height,r.positiveZeroCount,r.status]]);
    if(r.hardyRoots)table('Hardy Z 분리 구간 · 원본 기록',['항목','정확한 데이터'],Object.entries(r.hardyRoots).slice(0,100).map(([k,v])=>[k,v]));
    if(Array.isArray(r.localRows))table('타원곡선 · 소수별 국소 인자',['행','정확한 데이터'],r.localRows.map((x,i)=>[x.p??x.prime??i,x]));
    if(r.global)table('전역 국소 데이터',['항목','값'],Object.entries(r.global));
    if(r.dirichletCoefficients)table('Dirichlet 계수 · 유한 데이터',['항목','값'],Object.entries(r.dirichletCoefficients));
    if(r.values)table('타원곡선 중심값과 1차 미분 · 외향 구간',['함수','정확한 구간','폭','요청 오차폭 충족'],Object.entries(r.values).map(([name,b])=>[name,interval(b),dyadic(b.width),b.toleranceMet]));
    if(r.analyticRank)table('해석적 랭크 · 가정과 범위',['항목','값'],Object.entries(r.analyticRank));
    if(r.psiEnclosure)table('명시적 공식 · 독립 소수측 비교',['항목','정확한 구간 또는 값'],[['영점측 ψ(x) 보장 구간',interval(r.psiEnclosure)],['영점측 구간 폭',dyadic(r.psiEnclosure.width)],['소수측 정확식',r.primeSide?.exactExpression],['소수측 구간',interval(r.primeSide?.value)],['소수측이 영점측 구간에 포함됨',r.primeSide?.containedInZeroSideBand]]);
    if(r.remainderCertificate)table('유한 변위 Taylor · 다항식과 나머지',['항목','정확한 구간 또는 값'],[['결과 실수부',interval(r.value?.real)],['결과 허수부',interval(r.value?.imag)],['나머지 공식',r.remainderCertificate.formula],['나머지 절대 상계',interval(r.remainderCertificate.absoluteUpperBound)]]);
    if(r.reference)table('연산자 기준 예제 · 정의역과 적용 범위',['항목','값'],Object.entries(r.reference));
    if(r.finiteValidation)table('유한 연산자 계약 · 검사 결과',['항목','값'],Object.entries(r.finiteValidation.checks||{}));
    if(Array.isArray(r.negativeControls))table('연산자 반증 대조군',['변형','거부됨','실패한 검사'],r.negativeControls.map(x=>[x.id,x.rejected,x.failedChecks]));
    if(Array.isArray(r.unresolvedRHBridges))table('남은 RH 연구 조건',['조건','상태','증명 실행'],r.unresolvedRHBridges.map(x=>[x.id,x.status,x.proofExecuted]));
    const known=['derivatives','positiveZeroCount','hardyRoots','localRows','global','dirichletCoefficients','backend','computationSha256','scope','errorAccounting','mathematicalDependencies','theoremDependencies','primarySources'];
    if(!r.derivatives&&!r.localRows&&!r.values&&!r.psiEnclosure&&!r.remainderCertificate&&!r.unresolvedRHBridges&&r.positiveZeroCount===undefined)table('계산값 · 서버의 원본 필드',['항목','값'],Object.entries(r).filter(([k])=>!known.includes(k)));
    set('scope',{resultStatus:resultState,toleranceMet:r.toleranceMet,passMeaning:r.passMeaning,researchStatus:r.researchStatus,candidateDefinition:r.candidateDefinition,scope:r.scope,errorAccounting:r.errorAccounting,errorBudget:r.errorBudget,normalization:r.normalization,endpointConvention:r.endpointConvention,tailCertificate:r.tailCertificate,remainderCertificate:r.remainderCertificate,domainCertificate:r.domainCertificate,analyticDependencies:r.analyticDependencies,mathematicalDependencies:r.mathematicalDependencies,theoremDependencies:r.theoremDependencies,primarySources:r.primarySources,resultFailure:r.failure,executionFailure:value.execution.failure,wholeP7Complete:false,wholeM3Complete:false,formalLeanProofIssued:false});
    set('provenance',{inputSHA256:value.inputSHA256,mathematicalSHA256:value.mathematicalSHA256,recordSHA256:value.recordSHA256,sourceBinding:value.sourceBinding,environment:value.environment,environmentSHA256:value.environmentSHA256,predecessor:value.predecessor,execution:value.execution});
    const json=pretty(value);set('result-json',json.length>160000?json.slice(0,160000)+'\n…':json);set('json-note',json.length>160000?'표시는 처음 160,000자로 제한합니다. 내보내기에는 전체 원본을 포함합니다.':'전체 원본을 표시하고 있습니다.');controls();
  }
  async function run(replayRecord=null,rawReplay=null){
    if(busy)return {ok:false,status:'BUSY'};let request;
    try{request=replayRecord?readRequest(JSON.stringify(safeEnvelope(replayRecord).request)):readRequest();}catch(error){status(error.message,true);return {ok:false,status:'INVALID_REQUEST',message:error.message};}
    clearResult('새 계산을 실행하고 있습니다.');const expectedRevision=revision;busy=true;controls();status(replayRecord?'저장 기록 검사와 서버 재계산 중…':'서버에서 새 계산 중…');
    try{
      const response=await api(replayRecord?'replay':'run',replayRecord?(rawReplay||replayRecord):$('input').value);
      if(revision!==expectedRevision){status('실행 중 입력이 바뀌어 반환 결과를 현재 입력에 연결하지 않았습니다.');return {ok:false,status:'STALE'};}
      const value=replayRecord?response.fresh:response;
      if(replayRecord&&(response.schema!=='MathScope.M3.P7Replay/1'||response.importedProofStatusAdopted!==false))throw Error('서버 재현 응답 형식이 올바르지 않습니다.');
      render(value,request);
      if(replayRecord)set('replay-status',response.status==='MATCH'?'MATCH · 같은 소스·환경에서 새 계산한 결과 해시가 일치합니다.':'MISMATCH_OR_UNRESOLVED · 새 계산이 이전 결과를 재현하지 못했습니다.');
      status(replayRecord?'재현 검사: '+response.status:'새 계산: '+value.execution.status);
      return {ok:true,status:replayRecord?response.status:value.execution.status,resultStatus:value.result?.status,inputSHA256:value.inputSHA256,recordSHA256:value.recordSHA256,mathematicalSHA256:value.mathematicalSHA256,wholeP7Complete:false,wholeM3Complete:false};
    }catch(error){clearResult('결과를 연결하지 못했습니다. 입력과 서버 상태를 확인하세요.');status(error.message,true);return {ok:false,status:'FAILED',message:String(error.message).slice(0,900)};}finally{busy=false;controls();}
  }
  function loadExample(){const example=capabilities?.examples?.find(x=>x.id===$('example').value);if(!example)return;clearResult();$('input').value=pretty(example.request);editorDirty=false;status('실행 예제를 불러왔습니다. 새 계산을 실행하세요.');}
  function renderProgress(){
    $('progress').replaceChildren();const criteria=capabilities.progress?.criteria||capabilities.criteria;
    if(Array.isArray(criteria)){for(const c of criteria){const row=document.createElement('div');row.className='m3-progress-row';for(const value of [c.id,c.status,(c.remaining||[]).join(' · ')]){const span=document.createElement('span');span.textContent=value;row.append(span);}$('progress').append(row);}}
    else{const p=document.createElement('p');p.className='m1-muted';p.textContent='서버 상태: '+(capabilities.status||'IN_PROGRESS')+' · P7 전체 완료: false · M3 전체 완료: false';$('progress').append(p);}
  }
  async function connect(){
    if(busy)return;busy=true;controls();status('서버 지원 범위와 소스 고정값을 확인하고 있습니다.');
    try{
      const value=await api('capabilities');if(!Array.isArray(value.kinds)||!Array.isArray(value.examples)||value.wholeP7Complete!==false)throw Error('P7 지원 범위 응답을 확인할 수 없습니다.');
      if((capabilities&&stable(capabilities.sourceBinding)!==stable(value.sourceBinding))||(record&&stable(record.sourceBinding)!==stable(value.sourceBinding)))clearResult('서버 소스가 바뀌었습니다. 새 계산을 실행하세요.');capabilities=value;
      set('runtime','P7 연결됨 · '+value.kinds.length+'개 계산 종류');set('capabilities',value);set('limits','동시 실행 1개 · 최대 90초 · 메모리 384 MiB. 서버 자원 상한에 도달하면 미해결 상태를 보존합니다.');
      $('example').replaceChildren();for(const e of value.examples){const option=document.createElement('option');option.value=e.id;option.textContent=e.title||e.id;$('example').append(option);}
      if(!$('input').value)loadExample();renderProgress();status('P7 준비 완료 · 입력·결과·재현 기록을 연결할 수 있습니다.');
    }catch(error){capabilities=null;set('runtime','P7 연결 확인 필요');status('P7 서버 연결: '+error.message,true);}finally{busy=false;controls();}
  }
  function stageImport(text){
    if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('가져오기 파일이 32 MiB 상한을 넘었습니다.');
    pendingRecord=safeEnvelope(JSON.parse(text));pendingJSON=text;set('import-status','기록 형식을 읽었습니다. 아직 해시 검증이나 재계산을 하지 않았습니다. 서버 검사 후 비교를 실행하세요.');controls();
  }
  $('input').addEventListener('input',()=>{editorDirty=true;clearResult();});$('load').addEventListener('click',loadExample);$('run').addEventListener('click',()=>run());$('reconnect').addEventListener('click',connect);
  $('check').addEventListener('click',()=>{try{readRequest();status('요청 형식이 올바릅니다. 수학적 정의역·정밀도 검사는 서버 실행 시 확인합니다.');}catch(error){status(error.message,true);}});
  $('replay').addEventListener('click',()=>{const previous=record;run(previous);});
  $('import').addEventListener('click',()=>{importRevision++;pendingRecord=null;pendingJSON=null;try{stageImport($('import-text').value);}catch(error){set('import-status',error.message);controls();}});
  $('import-text').addEventListener('input',()=>{importRevision++;pendingRecord=null;pendingJSON=null;set('import-status','붙여넣은 내용이 바뀌었습니다. 기록 읽기를 실행하세요.');controls();});
  $('import-file').addEventListener('change',async()=>{const expectedImport=++importRevision;pendingRecord=null;pendingJSON=null;controls();try{const file=$('import-file').files[0];if(!file)return;if(file.size>MAX_BYTES)throw Error('파일이 32 MiB 상한을 넘었습니다.');const text=await file.text();if(importRevision!==expectedImport)return;$('import-text').value=text.length<=160000?text:'';$('import-text').placeholder=text.length>160000?'큰 파일을 읽었습니다. 전체 원본은 재현 검사에 그대로 전달합니다.':'';stageImport(text);}catch(error){if(importRevision===expectedImport){set('import-status',error.message);controls();}}});
  $('import-replay').addEventListener('click',async()=>{if(!pendingRecord)return;const value=pendingRecord;$('input').value=pretty(value.request);editorDirty=false;const outcome=await run(value,pendingJSON);set('import-status',outcome.ok?'서버에서 검사하고 새로 계산했습니다. 비교 결과: '+outcome.status+' · 가져온 기록의 증명 권한을 채택하지 않습니다.':'기록 검사 또는 새 계산을 완료하지 못했습니다. '+(outcome.message||outcome.status));});
  $('import-input').addEventListener('click',()=>{try{const request=readRequest(JSON.stringify(pendingRecord.request));clearResult();$('input').value=pretty(request);status('저장 기록의 입력만 불러왔습니다. 현재 서버에서 새 계산을 실행하세요.');}catch(error){set('import-status',error.message);}});
  $('export').addEventListener('click',()=>{if(!record)return;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([pretty(record)+'\n'],{type:'application/json'}));$('download').href=downloadURL;$('download').download='mathscope-p7-'+record.request.kind.replaceAll('.','-')+'-'+record.inputSHA256.slice(0,12)+'.json';$('download-panel').hidden=false;$('download-panel').open=true;$('download').click();});
  function route(){if(!location.hash.startsWith('#research-m3')||location.hash.startsWith('#research-m3-p8'))return;for(const view of document.querySelectorAll('.view[data-view]'))view.classList.toggle('active',view===ROOT);for(const button of document.querySelectorAll('[data-view-target]'))button.classList.toggle('active',button.dataset.viewTarget==='research-m3');}
  async function registerTools(){
    registration?.abort();registration=new AbortController();
    if(typeof document.modelContext?.registerTool!=='function'){set('webmcp','P7 브라우저 도구 미지원 · 위의 일반 화면으로 실행할 수 있습니다.');return;}
    const empty={type:'object',properties:{},additionalProperties:false};
    const wrap=(keys,fn)=>async(input={},options={})=>{try{
      if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!keys.includes(key))||keys.some(key=>!Object.hasOwn(input,key)))return {ok:false,status:'INVALID_INPUT'};
      if(options.signal?.aborted)return {ok:false,status:'NOT_STARTED'};
      return await fn(input);
    }catch(error){return {ok:false,status:'FAILED',message:String(error.message).slice(0,900)};}};
    const make=(name,description,schema,readOnlyHint,keys,fn)=>({name:'mathscope.research_m3.'+name,description,inputSchema:schema,annotations:{readOnlyHint,untrustedContentHint:true},execute:wrap(keys,fn)});
    const tools=[
      make('status','Read P7 server capabilities, installed example identifiers and current execution summary. No request is submitted and no proof status is issued.',empty,true,[],()=>({ok:true,busy,editorHasUnsavedEdits:editorDirty,capabilities,current:record?{request:record.request,execution:record.execution,recordSHA256:record.recordSHA256,mathematicalSHA256:record.mathematicalSHA256}:null,wholeP7Complete:false,wholeM3Complete:false})),
      make('run_example','Load a named installed P7 example and execute it on the bounded compute server. Refuses to replace edited input or overlap a running job. Displays actual server output without issuing a proof.',{type:'object',properties:{exampleId:{type:'string',minLength:1,maxLength:160}},required:['exampleId'],additionalProperties:false},false,['exampleId'],async({exampleId})=>{
        if(typeof exampleId!=='string'||exampleId.length<1||exampleId.length>160)return {ok:false,status:'INVALID_INPUT'};
        if(busy||editorDirty)return {ok:false,status:busy?'BUSY':'UNSAVED_INPUT_PRESERVED'};
        if(!capabilities?.examples.some(e=>e.id===exampleId))return {ok:false,status:'UNKNOWN_EXAMPLE'};
        $('example').value=exampleId;loadExample();history.replaceState(null,'','#research-m3');route();return run();
      }),
      make('replay_current','Recompute the current completed P7 result on the server and compare source, environment, predecessor and mathematical hashes. No imported proof authority is adopted.',empty,false,[],()=>{if(!record||record.execution.status!=='COMPLETED')return {ok:false,status:'NO_COMPLETED_RECORD'};return run(record);}),
      make('export_record','Read the current server execution envelope up to 280,000 characters. Larger results remain available through the visible JSON download. This does not create proof authority.',empty,true,[],()=>{if(!record)return {ok:false,status:'NO_RECORD'};const json=pretty(record);return json.length<=280000?{ok:true,json}:{ok:false,status:'USE_VISIBLE_DOWNLOAD',characters:json.length};})
    ];
    try{for(const tool of tools)await document.modelContext.registerTool(tool,{signal:registration.signal});set('webmcp','P7 브라우저 도구 4개 등록 · 상태 / 예제 실행 / 재현 / 기록 읽기');}catch(error){registration.abort();set('webmcp','P7 브라우저 도구 등록 실패 · 일반 실행 화면은 사용할 수 있습니다.');}
  }
  window.MathScopeP7Workspace=Object.freeze({
    snapshot:()=>({revision,busy,capabilities,record}),
    loadRequest(request){
      if(busy)return {ok:false,status:'BUSY'};
      if(editorDirty)return {ok:false,status:'UNSAVED_INPUT_PRESERVED'};
      try{const value=readRequest(JSON.stringify(request));clearResult();$('input').value=pretty(value);editorDirty=false;status('3D 예제의 입력을 불러왔습니다. 새 계산 실행을 누르면 현재 서버에서 계산합니다.');$('input').focus();return {ok:true};}
      catch(error){return {ok:false,status:'INVALID_REQUEST',message:String(error.message)};}
    }
  });
  document.querySelector('[data-view-target="research-m3"]')?.addEventListener('click',()=>{history.replaceState(null,'','#research-m3');route();});window.addEventListener('hashchange',route);window.addEventListener('DOMContentLoaded',route);window.addEventListener('pagehide',()=>registration?.abort());window.addEventListener('pageshow',event=>{if(event.persisted)registerTools();});route();connect();registerTools();
})();
