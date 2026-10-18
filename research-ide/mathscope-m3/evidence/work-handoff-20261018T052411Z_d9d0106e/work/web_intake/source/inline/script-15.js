
(() => {
  'use strict';
  const $=s=>document.querySelector(s),foundation=()=>window.MathScopeV031Foundation;
  const readinessTimeoutMs=10000,retryIntervalMs=100;
  let selectedFailure=null,initialized=false,disposed=false,retryTimer=null,readyDeadline=0;
  function clearRetry(){if(retryTimer!==null){clearTimeout(retryTimer);retryTimer=null;}}
  function setWaiting(message,unavailable=false){
    for(const selector of ['#v031RecordFailure','#v031FailureContracts','#v031FailureKind']){const control=$(selector);if(control)control.disabled=true;}
    const status=$('#v031FailureFeedback');if(status){status.setAttribute('role',unavailable?'alert':'status');status.setAttribute('aria-live',unavailable?'assertive':'polite');status.textContent=message;}
  }
  function refresh(){
    const api=foundation(),selector=$('#v031FailureHistory');if(!api||!selector)return;
    const records=api.getSession()?.failureRecords||[];
    selector.replaceChildren();for(const record of [...records].reverse()){const option=document.createElement('option');option.value=record.id;option.textContent=record.kind+' · '+record.createdAt+' · '+record.id;selector.append(option);}
    if(records.some(r=>r.id===selectedFailure))selector.value=selectedFailure;
    const record=records.find(r=>r.id===selector.value);selectedFailure=record?.id||null;
    $('#v031FailureDetail').textContent=record?JSON.stringify(record,null,2):'No recorded failures in this session. This does not certify that every failure mode was tested.';
    $('#v031FailureCount').textContent=records.length+' recorded failures / limitations · no mathematical claim authority';
  }
  function init(){
    if(initialized||disposed)return false;
    const api=foundation(),kind=$('#v031FailureKind');
    if(!api||typeof api.getSession!=='function'||typeof api.recordFailure!=='function'||typeof api.runFailureSelfTests!=='function'||!api.failureKinds||!kind)return false;
    if(['#v031RecordFailure','#v031FailureContracts','#v031FailureHistory','#v031FailureFeedback','#v031FailureCause','#v031FailureInput','#v031FailureDetail','#v031FailureCount'].some(selector=>!$(selector)))return false;
    initialized=true;clearRetry();kind.replaceChildren();
    for(const [value,label] of Object.entries(api.failureKinds)){const option=document.createElement('option');option.value=value;option.textContent=label;kind.append(option);}
    $('#v031RecordFailure').addEventListener('click',()=>{
      const status=$('#v031FailureFeedback');
      try{
        const cause=$('#v031FailureCause').value.trim();if(!cause)throw Error('Describe the observed failure or limitation first');
        const inputSpec=JSON.parse($('#v031FailureInput').value||'{}');if(!inputSpec||typeof inputSpec!=='object')throw Error('Input must be a JSON object or array');
        const s=api.getSession(),record=api.recordFailure(kind.value,{cause,inputSpec,sessionId:s.id,sessionRevision:s.sessionRevision,stage:'Stage8 failure log',operation:'user-reported-observation',executionScope:'USER_REPORTED',provenance:{activeObjectRef:s.activeObjectRef,observationSource:'user'}});
        selectedFailure=record.id;refresh();status.textContent='Recorded '+record.kind+' as a scoped observation. It is not mathematical evidence or proof.';
      }catch(error){status.textContent='Failure record not added: '+error.message;}
    });
    $('#v031FailureHistory').addEventListener('change',e=>{selectedFailure=e.target.value;refresh()});
    $('#v031FailureContracts').addEventListener('click',()=>{const result=api.runFailureSelfTests();$('#v031FailureFeedback').textContent=(result.pass?'PASS':'FAIL')+' · '+result.tests.filter(t=>t.pass).length+'/'+result.tests.length+' failure record contracts. This checks preservation and authority, not every numerical failure trigger.';});
    for(const selector of ['#v031RecordFailure','#v031FailureContracts','#v031FailureKind'])$(selector).disabled=false;
    const status=$('#v031FailureFeedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='Failure tools ready. Record an observed condition or test the failure record contracts.';
    window.MathScopeFailureUI={refresh};window.addEventListener('mathscope:failure-recorded',refresh);refresh();return true;
  }
  function attemptReady(){
    retryTimer=null;if(disposed||initialized)return;
    if(init())return;
    if(performance.now()>=readyDeadline){setWaiting('Failure tools unavailable: the research session service did not initialize within 10 seconds. Reload this page to retry.',true);return;}
    retryTimer=setTimeout(attemptReady,retryIntervalMs);
  }
  function beginReadiness(){
    if(disposed||initialized)return;clearRetry();readyDeadline=performance.now()+readinessTimeoutMs;
    setWaiting('Waiting for the research session service to initialize…');attemptReady();
  }
  window.addEventListener('pagehide',()=>{disposed=true;clearRetry();});
  window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;beginReadiness();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',beginReadiness,{once:true});else beginReadiness();
})();

