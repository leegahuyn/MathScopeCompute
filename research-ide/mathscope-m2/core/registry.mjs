import * as Arithmetic from '../arithmetic/index.mjs';
import * as Gauge from '../gauge/index.mjs';
import * as Navier from '../navier/index.mjs';
import * as Observatory from '../observatory/index.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

export const M2_VERSION='0.3.8';
export const LIMITS=Object.freeze({maxMillis:60000,maxBytes:8*1024*1024,maxItems:250000,maxOperations:50000000,maxJobs:128,maxConcurrent:1,maxInputBytes:262144});
const DOMAINS=Object.freeze({arithmetic:Arithmetic,gauge:Gauge,ns:Navier,observation:Observatory});
export const clone=x=>JSON.parse(canonicalStringify(x));
export const bytes=x=>new TextEncoder().encode(typeof x==='string'?x:canonicalStringify(x)).length;
export function normalizeRequest(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['kind','input','precision','budget'].includes(k)))throw Error('Expected a bounded M2 request {kind,input,precision,budget}.');
  if(typeof value.kind!=='string'||value.kind.length>100||!DOMAINS[value.kind.split('.')[0]])throw Error('Unsupported M2 mathematical domain.');
  for(const k of ['input','precision','budget'])if(value[k]!==undefined&&(!value[k]||typeof value[k]!=='object'||Array.isArray(value[k])))throw Error(k+' must be an object.');
  const r=clone({kind:value.kind,input:value.input||{},precision:value.precision||{},budget:{maxMillis:30000,maxBytes:8*1024*1024,maxItems:250000,maxOperations:50000000,...value.budget}});
  if(Object.keys(r.budget).some(k=>!['maxMillis','maxBytes','maxItems','maxOperations'].includes(k)))throw Error('Unknown M2 resource budget.');
  for(const k of Object.keys(r.budget))if(!Number.isSafeInteger(r.budget[k])||r.budget[k]<1||r.budget[k]>LIMITS[k])throw Error(k+' exceeds the installed budget.');
  if(r.budget.maxBytes<32768||bytes(r)>LIMITS.maxInputBytes)throw Error('Input/result byte budget is invalid.');
  return r;
}
export async function validateDomainRequest(value){
  try{const r=normalizeRequest(value),m=DOMAINS[r.kind.split('.')[0]],v=m.validateRequest?await m.validateRequest(r):await m.validate(r.kind,r.input);
    if(v===false||v?.ok===false||v?.valid===false)return {ok:false,code:v?.code||v?.status||'INVALID_INPUT',errors:v?.errors||[v?.message||'Domain contract rejected.']};
    return {ok:true,request:r};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
export async function listExamples(){const out=[];for(const [domain,m] of Object.entries(DOMAINS))for(const e of await m.getExamples())out.push({id:e.id,label:e.label,domain,request:normalizeRequest(e.request||e)});return out;}
export async function listCapabilities(){const domains={};for(const [d,m] of Object.entries(DOMAINS))domains[d]=await m.getCapabilities();return clone({version:M2_VERSION,limits:LIMITS,domains,evidencePolicy:'SCOPED_FINITE_RESULTS; NO AUTOMATIC THEOREM OR FORMAL PASS',execution:'STATIC_BOUNDED_WORKER',server:false});}
export async function executeDomain(value,context={}){
  const r=normalizeRequest(value),valid=await validateDomainRequest(r);if(!valid.ok)return {kind:r.kind,status:['UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(valid.code)?valid.code:'FAILED',evidenceGrade:'UNKNOWN',checks:[],blockers:valid.errors,contractReport:valid};
  const m=DOMAINS[r.kind.split('.')[0]];context.checkCancelled?.();
  const hooks={...context,budget:r.budget,precision:r.precision,isCancelled:()=>{context.checkCancelled?.();return false;},progress:x=>context.onCheckpoint?.(x)};
  const result=await (m.runJob?m.runJob(clone(r),hooks):m.run(r.kind,clone(r.input),hooks));context.checkCancelled?.();
  const owned=clone(result);if(bytes(owned)>r.budget.maxBytes)throw Object.assign(Error('Result exceeds maxBytes.'),{code:'BUDGET_EXCEEDED'});return owned;
}
export async function requestHash(request){return sha256(normalizeRequest(request));}
