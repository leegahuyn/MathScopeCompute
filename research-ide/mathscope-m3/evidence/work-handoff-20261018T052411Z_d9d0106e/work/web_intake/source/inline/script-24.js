
/* Connect the bounded P7 workspace to one display-only 3D scene. */
(()=>{
  'use strict';
  const host=document.getElementById('m3-p7-visualization');
  const models=window.MathScopeP7VisualModels,renderer=window.MathScopeP7Visualization,workspace=window.MathScopeP7Workspace;
  if(!host||!models||!renderer||!workspace)return;
  const $=id=>document.getElementById('p7v-'+id);
  let archive;
  try{archive=JSON.parse(document.getElementById('p7-visual-seeds').textContent);if(!Array.isArray(archive.records))throw Error('invalid archive');}
  catch(error){$('source-state').textContent='저장 예제를 읽지 못했습니다. 현재 서버 계산 결과를 기다립니다.';archive={records:[]};}
  const kinds={
    'P7-01':['p7.special_function','p7.zeta_em','p7.elliptic_local','p7.elliptic_analytic','p7.elliptic_arithmetic','p7.elliptic_complex'],
    'P7-02':['p7.special_function','p7.zeta_em','p7.euler_product','p7.elliptic_complex','p7.taylor_remainder'],
    'P7-03':['p7.zeta_zeros','p7.explicit_formula'],
    'P7-04':['p7.explicit_formula'], 'P7-05':['p7.operator_audit'],
    'P7-06':['p7.elliptic_analytic','p7.modular_symbols'], 'P7-07':['p7.elliptic_local','p7.elliptic_arithmetic']
  };
  const validCriterion=id=>/^P7-0[1-8]$/.test(id||'');
  const stable=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(stable).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}';
  const criterionFromURL=()=>{const id=new URL(location.href).searchParams.get('p7');return validCriterion(id)?id:'P7-01';};
  const relevant=record=>!kinds[criterion]||kinds[criterion].includes(record.request?.kind);
  const curve=record=>record.request?.input?.model||record.request?.input?.curve||record.result?.curve||record.result?.model?.label||null;
  let criterion=criterionFromURL(),snapshot=workspace.snapshot(),lastRecord,model=null,records=[],choices=[],lastCapabilities,renderRevision=-1;
  const view=renderer.mount(host,{onSelect:id=>selectCriterion(id,true)});
  function currentRecords(){
    const current=snapshot.capabilities?.sourceBinding&&snapshot.record?.execution?.status==='COMPLETED'&&stable(snapshot.capabilities.sourceBinding)===stable(snapshot.record.sourceBinding)?snapshot.record:null;
    const saved=archive.records.filter(r=>!current||r.request.kind!==current.request.kind||curve(r)!==curve(current));
    return current?[...saved,{...current,visualSource:{mode:'CURRENT_SERVER_RESULT',current:true,title:'현재 입력 · 서버에서 새로 계산'}}]:saved;
  }
  function updateOriginal(){
    const chosen=choices[Number($('run-source').value)];
    const url=chosen?.visualSource?.archiveURL||chosen?.visualArchive?.archiveReference;
    const safe=typeof url==='string'&&url.startsWith('https://github.com/leegahuyn/MathScopeCompute/blob/');
    $('original-record').hidden=!safe;
    if(safe)$('original-record').href=url;else $('original-record').removeAttribute('href');
  }
  function refreshChoices(){
    const prior=$('run-source').value;choices=records.filter(relevant);$('run-source').replaceChildren();
    choices.forEach((r,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(r.visualSource?.current?'현재 결과 · ':'저장 예제 · ')+(r.visualSource?.title||r.request.kind);$('run-source').append(option);});
    $('run-source').value=/^\d+$/.test(prior)&&Number(prior)<choices.length?prior:choices.length?'0':'';
    updateOriginal();
  }
  function sourceState(){
    const selected=records.filter(relevant),live=selected.filter(r=>r.visualSource?.current).length,saved=selected.length-live;
    const criteria=snapshot.capabilities?.progress?.criteria||snapshot.capabilities?.criteria;
    const exactInventory=Array.isArray(criteria)&&criteria.length===8&&new Set(criteria.map(c=>c.id)).size===8&&criteria.every(c=>/^P7-0[1-8]$/.test(c.id));
    host.querySelector('.p7v-boundary').textContent=exactInventory?'P7 원문 기준 '+criteria.filter(c=>c.originalCriterionComplete===true).length+'/8 수용 · 각 결과의 범위 확인':'P7 원문 기준 확인 중';
    $('source-state').textContent=(live?'현재 입력의 서버 계산 '+live+'개':'현재 입력의 새 계산 결과 없음')+' · 저장된 실행 예제 '+saved+'개. 저장 예제는 현재 서버에서 재검증한 결과가 아닙니다.'+(snapshot.busy?' 서버 작업 중입니다.':!snapshot.capabilities?' 서버 연결 확인이 필요합니다.':'');
    $('load-request').disabled=snapshot.busy||!snapshot.capabilities||!choices.length;
  }
  function draw(){
    records=currentRecords();
    try{model=models.build({criterion,records,capabilities:snapshot.capabilities||archive.capabilities});view.setModel(model);}
    catch(error){model=null;view.clear('표시 데이터를 연결하지 못했습니다. 기존 실행 결과와 원본 기록은 보존됩니다.');}
    refreshChoices();sourceState();
  }
  function selectCriterion(id,writeURL=false){
    if(!validCriterion(id))return;
    criterion=id;
    if(writeURL){const url=new URL(location.href);url.searchParams.set('p7',id);url.hash='research-m3';history.replaceState(null,'',url);}
    view.setCriterion(id);draw();
  }
  function receive(event){
    snapshot=event.detail;
    if(snapshot.record!==lastRecord||snapshot.capabilities!==lastCapabilities||snapshot.revision!==renderRevision){lastRecord=snapshot.record;lastCapabilities=snapshot.capabilities;renderRevision=snapshot.revision;draw();}
    else sourceState();
  }
  $('run-source').addEventListener('change',updateOriginal);
  $('load-request').addEventListener('click',()=>{
    const chosen=choices[Number($('run-source').value)];if(!chosen)return;
    const result=workspace.loadRequest(chosen.request);
    $('load-status').textContent=result.ok?'계산 입력을 불러왔습니다. 아래의 새 계산 실행을 누르세요.':result.status==='UNSAVED_INPUT_PRESERVED'?'편집 중인 입력을 보존했습니다. 기존 입력 영역에서 사용할 예제를 선택하거나 편집한 입력을 먼저 실행하세요.':result.status==='BUSY'?'서버 작업이 끝난 뒤 다시 불러오세요.':result.message||'입력을 불러오지 못했습니다.';
  });
  window.addEventListener('mathscope:p7-state',receive);
  window.addEventListener('popstate',()=>selectCriterion(criterionFromURL()));
  window.MathScopeP7VisualController=Object.freeze({
    audit:()=>({criterion,modelStatus:model?.status||null,recordCount:records.filter(relevant).length,currentResults:records.filter(r=>relevant(r)&&r.visualSource?.current).length,archivedExamples:records.filter(r=>relevant(r)&&!r.visualSource?.current).length,renderer:view.audit(),proofStatusPromoted:false,wholeP7Complete:false,wholeM3Complete:false}),
    selectCriterion:id=>selectCriterion(id,true)
  });
  selectCriterion(criterion);
})();

