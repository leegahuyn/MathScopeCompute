import {executeDomain} from './registry.mjs';
let cancelled=false;
self.onmessage=async event=>{
  if(event.data?.type==='cancel'){cancelled=true;return;}
  if(event.data?.type!=='start')return;
  cancelled=false;
  const started=performance.now(),request=event.data.request;
  const checkCancelled=()=>{
    if(cancelled)throw Object.assign(Error('Job cancelled.'),{code:'CANCELLED'});
    if(performance.now()-started>request.budget.maxMillis)throw Object.assign(Error('Elapsed time budget reached.'),{code:'BUDGET_EXCEEDED'});
  };
  try {
    const result=await executeDomain(request,{checkCancelled,onCheckpoint:checkpoint=>{checkCancelled();self.postMessage({type:'checkpoint',checkpoint});}});
    checkCancelled();self.postMessage({type:'result',result});
  } catch(error) {
    const code=['RESOURCE_LIMIT','TIMEOUT'].includes(error.code)?'BUDGET_EXCEEDED':error.code;
    self.postMessage({type:'result',result:{status:['CANCELLED','BUDGET_EXCEEDED','UNSUPPORTED','PRECISION_REQUIRED'].includes(code)?code:'FAILED',evidenceGrade:'UNKNOWN',message:String(error.message),blockers:[String(error.message)]}});
  }
};
