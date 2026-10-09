import * as Arithmetic from '../arithmetic/index.mjs';
import * as Gauge from '../gauge/index.mjs';
import * as Navier from '../navier/index.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

export const M1_VERSION = '1.2.0';
export const LIMITS = Object.freeze({maxMillis:60000,maxBytes:8*1024*1024,maxItems:1000000,maxOperations:50000000,maxJobs:32,maxConcurrent:1,maxInputBytes:262144,maxIntegers:8388608,maxPoints:16384,maxMilliseconds:60000,maxSamples:5000,maxEvaluations:50000,maxMatrixDimension:8});
const DOMAINS = Object.freeze({arithmetic:Arithmetic,gauge:Gauge,ns:Navier});
export const clone = x=>JSON.parse(canonicalStringify(x));
export const bytes = x=>new TextEncoder().encode(typeof x==='string'?x:canonicalStringify(x)).length;
export function normalizeRequest(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('A domain request object is required.');
  if(Object.keys(value).some(k=>!['kind','input','precision','budget'].includes(k)))throw Error('Unknown domain request field.');
  if(typeof value.kind!=='string'||value.kind.length>100||!DOMAINS[value.kind.split('.')[0]])throw Error('Unsupported mathematical domain.');
  for(const key of ['input','precision','budget'])if(value[key]!==undefined&&(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key])))throw Error(key+' must be a JSON object.');
  const request=clone({kind:value.kind,input:value.input||{},precision:value.precision||{},budget:{maxMillis:30000,maxBytes:8*1024*1024,maxItems:250000,maxOperations:50000000,...value.budget}});
  if(Array.isArray(request.input)||Array.isArray(request.precision))throw Error('Input and precision must be objects.');
  if(Object.keys(request.budget).some(k=>!['maxMillis','maxBytes','maxItems','maxOperations','maxIntegers','maxPoints','maxMilliseconds','maxSamples','maxEvaluations','maxMatrixDimension'].includes(k)))throw Error('Unknown resource budget.');
  for(const k of ['maxMillis','maxBytes','maxItems','maxOperations'])if(!Number.isSafeInteger(request.budget[k])||request.budget[k]<1||request.budget[k]>LIMITS[k])throw Error(k+' exceeds the installed bounded runtime.');
  for(const k of ['maxIntegers','maxPoints','maxMilliseconds','maxSamples','maxEvaluations','maxMatrixDimension'])if(request.budget[k]!==undefined&&(!Number.isSafeInteger(request.budget[k])||request.budget[k]<1||request.budget[k]>LIMITS[k]))throw Error(k+' exceeds the domain budget cap.');
  if(request.budget.maxMilliseconds!==undefined)request.budget.maxMillis=Math.min(request.budget.maxMillis,request.budget.maxMilliseconds);
  if(request.kind.startsWith('ns.'))request.budget.maxMilliseconds=request.budget.maxMillis;
  if(request.budget.maxBytes<32768)throw Error('The result budget must allow at least 32 KiB of provenance.');
  if(bytes(request)>LIMITS.maxInputBytes)throw Error('Domain input exceeds 256 KiB.');
  return request;
}
export async function validateDomainRequest(input) {
  let request;try{request=normalizeRequest(input);}catch(e){return {ok:false,errors:[e.message]};}
  const module=DOMAINS[request.kind.split('.')[0]];
  try {
    if(module.validateRequest){const report=await module.validateRequest(clone(request));if(report===false)return {ok:false,errors:['Domain contract rejected.']};if(report?.ok===false||report?.valid===false)return {...report,ok:false,code:report.code||report.status||report.errors?.[0]?.code||'INVALID_INPUT'};}
    return {ok:true,request};
  }catch(e){return {ok:false,errors:[e.message],code:e.code||'INVALID_INPUT'};}
}
export async function listCapabilities() {
  const result={};for(const [key,module] of Object.entries(DOMAINS))result[key]=await module.getCapabilities();
  return clone({version:M1_VERSION,limits:LIMITS,domains:result,evidencePolicy:'FINITE_DOMAIN_RESULTS_DO_NOT_ISSUE_FORMAL_PASS',execution:'STATIC_BOUNDED_WORKER',server:false});
}
export async function listExamples() {
  const result=[];
  for(const [domain,module] of Object.entries(DOMAINS))for(const example of await module.getExamples()){
    const request=normalizeRequest(example.request||example);
    result.push({id:example.id||request.kind,label:example.label||request.kind,domain,request});
  }
  return result;
}
export async function executeDomain(input,context={}) {
  const request=normalizeRequest(input),module=DOMAINS[request.kind.split('.')[0]],report=await validateDomainRequest(request);
  if(!report.ok)return {status:['UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED','CANCELLED'].includes(report.code)?report.code:'FAILED',evidenceGrade:'UNKNOWN',checks:[],blockers:report.errors||[report.message||'Domain contract rejected'],contractReport:report};
  context.checkCancelled?.();
  const result=await module.runJob(clone(request),{...context,isCancelled:()=>{context.checkCancelled?.();return false;},progress:value=>context.onCheckpoint?.(value)});
  context.checkCancelled?.();
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Domain adapter must return a JSON result.');
  const owned=clone(result);
  if(bytes(owned)>request.budget.maxBytes)throw Object.assign(Error('The mathematical result exceeds maxBytes.'),{code:'BUDGET_EXCEEDED'});
  return owned;
}
export async function requestHash(request){return sha256(normalizeRequest(request));}
