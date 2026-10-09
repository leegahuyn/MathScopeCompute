/** Bind the bounded compute engine to actual, versioned ResearchSession records. */
import {assertValid,canonicalStringify,sha256} from './contracts.mjs';
import {createNode,addNode,addEdge,referenceOf,verifyResearchM0Namespace} from './session.mjs';
import {isResultFor,verifyResult,computeInputHash} from './compute.mjs';
import {createKernelWorkerSource} from './worker.mjs';

const clone=x=>JSON.parse(canonicalStringify(x));
function fail(message){throw new Error('M0 compute/session binding: '+message);}
function nsOf(value){return value?.schema==='MathScope.ResearchM0/1'?value:value?.researchM0;}
function sameRef(a,b){return a?.id===b?.id&&a?.revision===b?.revision&&a?.hash===b?.hash;}
function uniqueRefs(refs){const out=[];for(const ref of refs)if(!out.some(r=>sameRef(r,ref)))out.push(clone(ref));return out;}
function currentNode(ns,ref){return ns.nodes.find(n=>sameRef(n,ref));}
function requireCurrent(ns,ref,kind){
  const n=currentNode(ns,ref);
  if(!n||n.freshness!=='CURRENT'||(kind&&n.kind!==kind))fail(`Reference ${ref.id} is unresolved, revised, stale, or has the wrong type; refresh it before computing.`);
  return n;
}
async function validateNamespace(ns){const r=await verifyResearchM0Namespace(ns);if(!r.ok)fail(r.errors.join('; '));}
function preparationBody(prepared){const {preparationHash,...body}=prepared;return body;}
function targetContext(request){return {adapter:request.adapter,input:request.input,domain:request.domain,basis:request.basis,scope:request.scope,precision:request.precision,seed:request.seed,assumptionRefs:request.assumptionRefs,sourceRefs:request.sourceRefs};}
function targetStatement(request){return `Declared finite ${request.adapter.id} computational target. Exact context: ${canonicalStringify(targetContext(request))}`;}

/** This does not mutate a session or execute anything. UI save is explicit. */
export async function prepareSessionJob(originalRequest,namespace,capabilities){
  const ns=nsOf(namespace);await validateNamespace(ns);assertValid('ComputeJobSpec',originalRequest);
  const request=clone(originalRequest),adapter=capabilities?.adapters?.find(a=>a.id===request.adapter.id&&a.version===request.adapter.version&&a.status==='AVAILABLE');
  if(!adapter)fail('This adapter/version is not installed and available.');
  const installedHash=await sha256(createKernelWorkerSource());
  const supplied=capabilities.sourceManifest?.find(s=>s.id==='mathscope-m0:static-worker-runtime');
  if(!supplied||supplied.sha256!==installedHash)fail('Worker capability digest does not match the installed fixed source.');
  const sourceId=`m0-source-worker:${installedHash}`;
  const sourcePayload={schema:'MathScope.SourceManifest/1',id:sourceId,revision:`${sourceId}:r1`,entries:[{
    id:'mathscope-m0:static-worker-runtime',kind:'CODE',title:'Installed MathScope bounded worker runtime',uri:'embedded:mathscope-m0/static-worker-runtime',sha256:installedHash,availability:'AVAILABLE',locator:'Fixed local kernel runtime plus exact-value implementation',version:supplied.version||capabilities.moduleVersion,license:null
  }]};
  const sourceNode=await createNode({kind:'SourceManifest',payload:sourcePayload}),plannedNodes=[];
  const existingSource=ns.nodes.find(n=>n.id===sourceNode.id);
  if(existingSource){if(!sameRef(existingSource,sourceNode)||existingSource.freshness!=='CURRENT')fail('Installed source manifest has a conflicting or imported revision; revalidate it in a fresh session.');}
  else plannedNodes.push(sourceNode);
  const workerRef=referenceOf(sourceNode);
  const retained=request.sourceRefs.filter(r=>r.id!=='mathscope-m0:static-worker-runtime'&&r.id!==sourceId);
  for(const ref of retained)requireCurrent(ns,ref,'source');
  request.sourceRefs=uniqueRefs([workerRef,...retained]);

  let model=currentNode(ns,request.modelRef);
  if(model){
    requireCurrent(ns,request.modelRef);
    if(!['object','claim'].includes(model.kind)||model.payload.scope?.kind!=='FINITE')fail('The registered model is not a finite mathematical target for these adapters.');
    request.assumptionRefs=uniqueRefs([...request.assumptionRefs,...(model.payload.assumptionRefs||[])]);
  }else if(ns.nodes.some(n=>n.id===request.modelRef.id))fail('The model ID exists with a different revision/hash; refresh the model reference.');
  for(const ref of request.assumptionRefs)requireCurrent(ns,ref,'assumption');
  if(model){
    if(request.adapter.id==='prime-segment'){
      if(model.payload.schema!=='MathScope.PrimeQuerySpec/1')fail('Prime computation requires a PrimeQuerySpec, not a gauge/PDE/prismatic model.');
      if(model.payload.query.lower!==request.input.lower||model.payload.query.upper!==request.input.upper||canonicalStringify(model.payload.scope)!==canonicalStringify(request.scope))fail('The registered prime target has different bounds/scope; choose or prepare a matching target.');
      if(model.payload.output==='GAPS')fail('The installed prime adapter returns counts and enumeration, not a registered gap target.');
    }else if(model.id!==`m0-target:${request.adapter.id}:${await sha256(targetContext(request))}`||model.payload.schema!=='MathScope.ClaimSpec/1'||model.payload.propositionKind!=='FINITE_RESULT'||model.payload.logicRole!=='OBSERVATION'||model.payload.statement!==targetStatement(request)||canonicalStringify(model.payload.scope)!==canonicalStringify(request.scope)||canonicalStringify(model.payload.sourceRefs)!==canonicalStringify(request.sourceRefs)||canonicalStringify(model.payload.assumptionRefs)!==canonicalStringify(request.assumptionRefs)){
      fail('The registered target does not match this exact finite adapter/input/domain/basis/precision. A prism, gauge field or PDE model cannot be computed by relabeling a finite arithmetic adapter.');
    }
  }
  if(!model){
    const context=targetContext(request);
    const digest=await sha256(context),modelId=`m0-target:${request.adapter.id}:${digest}`;
    const common={id:modelId,revision:`${modelId}:r1`,sourceRefs:request.sourceRefs,assumptionRefs:request.assumptionRefs};
    const payload=request.adapter.id==='prime-segment'?{
      schema:'MathScope.PrimeQuerySpec/1',...common,original:{kind:'PrimeSet',definition:'Natural p >= 2 with exactly two positive divisors.'},
      query:{lower:request.input.lower,upper:request.input.upper,completeness:'BOUNDED_ENUMERATION'},scope:request.scope,output:'COUNT_AND_ENUMERATE'
    }:{
      schema:'MathScope.ClaimSpec/1',...common,statement:targetStatement(request),
      scope:request.scope,propositionKind:'FINITE_RESULT',logicRole:'OBSERVATION',grade:'UNKNOWN'
    };
    model=await createNode({kind:request.adapter.id==='prime-segment'?'PrimeQuerySpec':'ClaimSpec',payload});
    const identical=ns.nodes.find(n=>n.id===model.id);
    if(identical){if(!sameRef(identical,model)||identical.freshness!=='CURRENT')fail('Generated target conflicts with an existing stale/revised node.');model=identical;}
    else plannedNodes.push(model);
    request.modelRef=referenceOf(model);
  }
  assertValid('ComputeJobSpec',request);
  const prepared={schema:'MathScope.PreparedSessionJob/1',request,plannedNodes,baselineHash:ns.baselineHash,namespaceRevision:ns.revision,environmentHash:capabilities.environmentHash,inputHash:await computeInputHash(request)};
  prepared.preparationHash=await sha256(preparationBody(prepared));return prepared;
}

/** Recheck bindings and freshly verify completed values before explicit save. */
export async function saveSessionJob(namespace,prepared,job){
  const ns=nsOf(namespace);await validateNamespace(ns);
  if(prepared?.schema!=='MathScope.PreparedSessionJob/1'||await sha256(preparationBody(prepared))!==prepared.preparationHash)fail('Prepared request was modified.');
  if(prepared.baselineHash!==ns.baselineHash)fail('The session belongs to a different baseline.');
  const request=prepared.request;assertValid('ComputeJobSpec',request);
  if(!job?.result||job.id!==request.id||job.result.jobId!==request.id||job.environmentHash!==prepared.environmentHash)fail('Job/result identity or execution environment does not match the prepared request.');
  if(canonicalStringify(job.request)!==canonicalStringify(request))fail('The completed job belongs to a different request.');
  const integrity=await isResultFor(request,job.result);if(!integrity.ok)fail(integrity.errors.join('; '));
  let state=clone(ns);
  for(const node of prepared.plannedNodes){
    if(await sha256(node.payload)!==node.hash)fail(`Planned payload changed: ${node.id}`);
    const old=state.nodes.find(n=>n.id===node.id);
    if(old){if(!sameRef(old,node)||old.freshness!=='CURRENT')fail(`Planned node ${node.id} was revised; prepare the job again.`);}
    else state=await addNode(state,{id:node.id,kind:node.kind,payload:node.payload,revision:node.revision});
  }
  for(const ref of [...request.sourceRefs,...request.assumptionRefs,request.modelRef])requireCurrent(state,ref);
  const model=requireCurrent(state,request.modelRef);
  for(const ref of model.payload.assumptionRefs||[])requireCurrent(state,ref,'assumption');
  if(job.result.status==='COMPLETED'){
    const verified=await verifyResult(request,job.result);if(!verified.ok)fail(verified.errors.join('; '));
  }
  state=await addNode(state,{kind:'ComputeJobSpec',payload:request});
  const resultId=`result:${job.id}`;
  state=await addNode(state,{id:resultId,kind:'ResultEnvelope',payload:job.result});
  const edgeId=`computes:${job.id}`;
  if(!state.edges.some(e=>e.id===edgeId))state=await addEdge(state,{id:edgeId,type:'COMPUTES',from:job.id,to:resultId});
  return state;
}
