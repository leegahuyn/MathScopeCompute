import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {LIMITS,M2_VERSION,clone,bytes,normalizeRequest,executeDomain,listCapabilities} from './registry.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from './worker-data.mjs';

const TERMINAL=new Set(['COMPLETED','PARTIAL','FAILED','CANCELLED','PRECISION_REQUIRED','UNSUPPORTED','BUDGET_EXCEEDED']);
const resultStatus=result=>TERMINAL.has(result.status)?result.status:result.message||/ERROR|FAILED|INVALID|REJECTED/.test(result.status||'')?'FAILED':result.blockers?.length?'PARTIAL':'FAILED';
function mathematicalBody(result){const {executionMetrics,...body}=result;return body;}
export function createM2Engine(options={}) {
  const jobs=new Map(),queue=[],listeners=new Set(),waiters=new Map(),ownedResults=new WeakSet();
  let disposed=false,active=null,workerURL=null,sequence=0;
  const workerMode=options.workerFactory||(!options.local&&typeof Worker==='function');
  const environmentPromise=(async()=>{
    const workerHash=await sha256(WORKER_SOURCE);if(workerHash!==WORKER_SHA256)throw Error('Installed M2 worker digest mismatch.');
    const environment={schema:'MathScope.M2Environment/1',version:M2_VERSION,workerSha256:workerHash,execution:options.workerFactory?'APPLICATION_WORKER_FACTORY':workerMode?'BROWSER_WEB_WORKER':'EXPLICIT_LOCAL_RUNTIME',server:false,capabilities:await listCapabilities()};
    return {...environment,hash:await sha256(environment)};
  })();
  const publicJob=j=>clone({id:j.id,request:j.request,inputHash:j.inputHash,environmentHash:j.environmentHash,status:j.status,submittedAt:j.submittedAt,finishedAt:j.finishedAt,checkpoint:j.checkpoint,result:j.result,resultHash:j.resultHash,mathematicalHash:j.mathematicalHash,attempt:j.attempt});
  function notify(j){for(const f of listeners)try{f(publicJob(j));}catch{}if(TERMINAL.has(j.status)){for(const r of waiters.get(j.id)||[])r(publicJob(j));waiters.delete(j.id);}}
  async function finish(j,result){
    if(TERMINAL.has(j.status)||j.settling)return;
    j.settling=true;j.status='FINALIZING';let finalStatus;
    try {
      j.result=clone(result);finalStatus=resultStatus(j.result);j.resultHash=await sha256(j.result);j.mathematicalHash=await sha256(mathematicalBody(j.result));
      if(bytes(j.result)>j.request.budget.maxBytes)throw Error('Result exceeds artifact byte budget.');
    } catch(e){j.result={status:'FAILED',evidenceGrade:'UNKNOWN',message:e.message,blockers:[e.message]};finalStatus='FAILED';j.resultHash=await sha256(j.result);j.mathematicalHash=j.resultHash;}
    j.status=finalStatus;j.settling=false;j.finishedAt=new Date().toISOString();j.worker?.terminate();j.worker=null;clearTimeout(j.timer);j.timer=null;notify(j);
  }
  async function run(j){
    j.status='RUNNING';notify(j);
    const stopResult=(status,message)=>({status,evidenceGrade:'UNKNOWN',message,blockers:[message]});
    if(workerMode){
      await new Promise(resolve=>{
        let done=false;
        const end=async result=>{if(done)return;done=true;await finish(j,result);resolve();};
        j.cancel=()=>void end(stopResult('CANCELLED','Calculation stopped; retained checkpoint is diagnostic. Resume recomputes the exact request from the beginning.'));
        try{
          workerURL||=URL.createObjectURL(new Blob([WORKER_SOURCE],{type:'text/javascript'}));
          j.worker=options.workerFactory?options.workerFactory(WORKER_SOURCE):new Worker(workerURL);
          j.worker.onmessage=event=>{
            if(event.data?.type==='checkpoint'){try{const c=clone(event.data.checkpoint);if(bytes(c)<=131072)j.checkpoint=c;notify(j);}catch{}}
            if(event.data?.type==='result')void end(event.data.result);
          };
          j.worker.onerror=e=>void end(stopResult('FAILED','Worker failure: '+String(e.message||'startup/CSP failure')));
          j.timer=setTimeout(()=>void end(stopResult('BUDGET_EXCEEDED','Worker watchdog reached maxMillis.')),j.request.budget.maxMillis+150);
          if(j.cancelRequested)j.cancel();else j.worker.postMessage({type:'start',request:clone(j.request)});
        }catch(e){void end(stopResult('FAILED','Worker could not start: '+e.message));}
      });
    }else{
      const started=Date.now();j.cancelled=Boolean(j.cancelRequested);j.cancel=()=>{j.cancelled=true;};
      try{const result=await executeDomain(j.request,{checkCancelled:()=>{if(j.cancelled)throw Object.assign(Error('Cancelled'),{code:'CANCELLED'});if(Date.now()-started>j.request.budget.maxMillis)throw Object.assign(Error('Time budget exceeded'),{code:'BUDGET_EXCEEDED'});},onCheckpoint:c=>{j.checkpoint=clone(c);notify(j);}});await finish(j,j.cancelled?stopResult('CANCELLED','Cancelled'):result);}catch(e){await finish(j,stopResult(['RESOURCE_LIMIT','TIMEOUT'].includes(e.code)?'BUDGET_EXCEEDED':TERMINAL.has(e.code)?e.code:'FAILED',e.message));}
    }
  }
  async function pump(){if(active||disposed)return;while(queue.length&&!disposed){const j=jobs.get(queue.shift());if(!j||j.status!=='QUEUED')continue;active=j;await run(j);active=null;}}
  async function submit(input,{id,attempt=1}={}){
    if(disposed)throw Error('M2 engine disposed.');
    const request=normalizeRequest(input);id=id||'m2-job:'+Date.now().toString(36)+':'+(++sequence);
    if(!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(id))throw Error('Invalid job ID.');
    if(jobs.has(id)||jobs.size>=LIMITS.maxJobs)throw Error('Duplicate ID or retained job limit. Export completed results before starting a new runtime.');
    const environment=await environmentPromise,inputHash=await sha256(request);
    if(jobs.has(id)||jobs.size>=LIMITS.maxJobs)throw Error('Concurrent job limit.');
    const j={id,request,inputHash,environmentHash:environment.hash,status:'QUEUED',submittedAt:new Date().toISOString(),finishedAt:null,checkpoint:null,result:null,resultHash:null,mathematicalHash:null,attempt};
    jobs.set(id,j);queue.push(id);notify(j);void pump();return publicJob(j);
  }
  function lookup(id){const j=jobs.get(id);if(!j)throw Error('Unknown M2 job.');return j;}
  function cancel(id){const j=lookup(id);if(TERMINAL.has(j.status)||j.settling)return false;j.cancelRequested=true;if(j.status==='QUEUED')void finish(j,{status:'CANCELLED',evidenceGrade:'UNKNOWN',message:'Cancelled before start.'});else j.cancel?.();return true;}
  async function wait(id){const j=lookup(id);if(TERMINAL.has(j.status))return publicJob(j);return new Promise(resolve=>{const list=waiters.get(id)||[];list.push(resolve);waiters.set(id,list);});}
  async function exportBundle(id){const j=lookup(id);if(!TERMINAL.has(j.status))throw Error('Wait for a terminal state.');const body={schema:'MathScope.M2ReplayBundle/1',request:clone(j.request),inputHash:j.inputHash,environment:await environmentPromise,result:clone(j.result),resultHash:j.resultHash,mathematicalHash:j.mathematicalHash,semanticHashPolicy:'EXCLUDES_TOP_LEVEL_EXECUTION_METRICS_ONLY',checkpoint:j.checkpoint,resumePolicy:'RECOMPUTE_FROM_ORIGINAL_INPUT',trust:'UNTRUSTED_WHEN_SERIALIZED'};return {...body,bundleHash:await sha256(body)};}
  async function replay(bundle){
    if(bytes(bundle)>LIMITS.maxBytes+1048576)throw Error('Replay bundle exceeds the import byte limit.');
    bundle=clone(bundle);const {bundleHash,...body}=bundle;
    if(body.schema!=='MathScope.M2ReplayBundle/1'||await sha256(body)!==bundleHash)throw Error('Replay bundle digest mismatch.');
    if(await sha256(normalizeRequest(body.request))!==body.inputHash||await sha256(body.result)!==body.resultHash)throw Error('Replay input/result digest mismatch.');
    if(body.semanticHashPolicy!=='EXCLUDES_TOP_LEVEL_EXECUTION_METRICS_ONLY'||await sha256(mathematicalBody(body.result))!==body.mathematicalHash)throw Error('Replay mathematical result digest mismatch.');
    const env=await environmentPromise,{hash:importedEnvironmentHash,...importedEnvironment}=body.environment||{};if(importedEnvironmentHash!==env.hash||body.environment?.workerSha256!==env.workerSha256||await sha256(importedEnvironment)!==importedEnvironmentHash)throw Error('Replay requires the same installed source and environment.');
    const j=await submit(body.request),fresh=await wait(j.id);return {status:fresh.mathematicalHash===body.mathematicalHash?'MATCH':'MISMATCH',originalHash:body.mathematicalHash,freshHash:fresh.mathematicalHash,artifactBytesMatch:fresh.resultHash===body.resultHash,semanticHashPolicy:body.semanticHashPolicy,freshJobId:fresh.id,sourceVerified:true,importedEvidenceTrusted:false};
  }
  async function receipt(id){const j=lookup(id);if(!TERMINAL.has(j.status))throw Error('Job still running.');const record=publicJob(j);ownedResults.add(record);return Object.freeze(record);}
  async function verifyReceipt(record){if(!ownedResults.has(record))return false;const j=lookup(record.id);return canonicalStringify(record)===canonicalStringify(publicJob(j));}
  return Object.freeze({submit,wait,cancel,getJob:id=>publicJob(lookup(id)),listJobs:()=>[...jobs.values()].map(publicJob),listSummaries:()=>[...jobs.values()].map(j=>({id:j.id,kind:j.request.kind,status:j.status,inputHash:j.inputHash,resultHash:j.resultHash,submittedAt:j.submittedAt})),environment:()=>environmentPromise,exportBundle,replay,receipt,verifyReceipt,
    resume:async id=>{const j=lookup(id);if(!['CANCELLED','BUDGET_EXCEEDED','FAILED'].includes(j.status))throw Error('Only interrupted jobs can restart.');return submit(j.request,{attempt:j.attempt+1});},
    subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);},
    dispose:()=>{disposed=true;for(const j of jobs.values())if(!TERMINAL.has(j.status))cancel(j.id);if(workerURL)URL.revokeObjectURL(workerURL);listeners.clear();}
  });
}
