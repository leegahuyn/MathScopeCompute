import {createM4ProofJob, classifyM4ProofReuse, DEFAULT_M4_PROOF_INPUT} from './research-ide/mathscope-m4/proof-jobs.mjs';

const clone = x => JSON.parse(JSON.stringify(x));

/** Prototype for an app controller; generated source does not grant kernel PASS. */
export function createProofSession({initial=DEFAULT_M4_PROOF_INPUT, make=createM4ProofJob}={}) {
  let revision=0, params=clone(initial), active=null, state='UNINITIALIZED';
  const events=[];
  function snapshot(){return clone({revision,params,active,state,events});}
  async function update(patch={}) {
    const next=clone({...params,...patch});
    const thisRevision=++revision;
    params=next; active=null; state='GENERATING';
    events.push({revision:thisRevision,event:'INVALIDATED_PREVIOUS',kernelPass:false});
    try {
      const job=await make(next);
      if(thisRevision!==revision) {
        events.push({revision:thisRevision,event:'SUPERSEDED',jobId:job.jobId,kernelPass:false});
        return {revision:thisRevision,state:'SUPERSEDED',jobId:job.jobId,kernelPass:false};
      }
      active=job; state='KERNEL_PENDING';
      events.push({revision:thisRevision,event:'GENERATED',jobId:job.jobId,kernelPass:false});
      return {revision:thisRevision,state,jobId:job.jobId,kernelPass:false};
    } catch(error) {
      if(thisRevision===revision) {state='GENERATION_ERROR';active=null;}
      events.push({revision:thisRevision,event:'REJECTED',reason:String(error.message),kernelPass:false});
      throw error;
    }
  }
  async function inspectOldReceipt(old) {
    if(!active) return {state:'NO_ACTIVE_JOB',kernelPass:false};
    const before=revision;
    const checked=await classifyM4ProofReuse(active,old);
    return before===revision ? checked : {state:'SUPERSEDED',kernelPass:false};
  }
  return {update,snapshot,inspectOldReceipt};
}
