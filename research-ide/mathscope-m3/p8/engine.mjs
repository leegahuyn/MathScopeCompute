import {runJob as runM2} from '../../mathscope-m2/arithmetic/index.mjs';
import {OBJECT_KINDS,ARITHMETIC_MODES,PROOF_METHODS,assertJSON,shape,cloneJSON,freeze,sha256,canonicalJSON,validateObjectEvidence,bindP8Claim,verifyP8Binding} from './contracts.mjs';
import {auditAssumptionLedger,prepareAssumptionRemoval} from './assumptions.mjs';
import {buildM2ComparisonDiagram,validateComparisonDiagram,invalidateComparisonAfterAssumptionChange} from './comparison.mjs';
import {makeFiniteCertificate,validateFiniteCertificate,exportLeanCertificate} from './finite-certificates.mjs';
import {compareFiniteCandidates} from './candidate-search.mjs';
import {getP8Examples} from './examples.mjs';
import {exportReviewPackets} from './review-packets.mjs';
import {runMutationAudit} from './mutation-audit.mjs';
import {validateRecordedLean} from './lean-registry.mjs';
import {validateRecordedChecks,conditionalLedger} from './recorded-checks.mjs';
import {buildTheoremBacklog} from './theorem-backlog.mjs';

const VERSION='0.1.0-p8';
const KINDS=['p8.object_contract','p8.visual_structure','p8.comparison','p8.finite_certificate','p8.assumption_audit','p8.candidate_compare','p8.mutation_audit','p8.review_packets'];
const SCOPE=Object.freeze({wholeP8Complete:false,wholeM3Complete:false,proofStatusPromoted:false,universalConjectureSolved:false,importedProofStatusAdopted:false});
const MAX_INPUT=262144,MAX_RECORD=33554432;
const same=(a,b)=>canonicalJSON(a)===canonicalJSON(b);
const errorInfo=e=>({code:e?.code||'P8_EXECUTION_ERROR',message:String(e?.message||e)});
const empty=input=>shape(input,[],[],'empty input');

export async function createP8Engine(build) {
  assertJSON(build,8*1024*1024);build=cloneJSON(build);
  shape(build,['schema','sourceBinding','reviewSnapshot','leanEvidence','leanContract'],['recordedChecks','expectedChecks'],'P8 build');
  if(build.schema!=='MathScope.M3.P8.Build/1')throw Error('Unsupported P8 build.');
  const source=build.sourceBinding;
  if(source.schema!=='MathScope.M3.P8.SourceBinding/1'||!Array.isArray(source.files)||source.files.length===0||source.manifestSHA256!==await sha256(source.files))throw Error('Source manifest does not match the bundled build.');
  for(const row of source.files)if(!/^[a-f0-9]{64}$/.test(row.sha256)||typeof row.path!=='string'||!Number.isSafeInteger(row.bytes))throw Error('Invalid source file binding.');
  const frozenSource=freeze(cloneJSON(source));
  const leanRegistry=await validateRecordedLean(build.leanEvidence,frozenSource,build.leanContract);
  const recordedP7Mutations=await validateRecordedChecks(build.recordedChecks?.p7Mutations,frozenSource,build.expectedChecks?.p7Mutations);
  const recordedConditionalAudit=await validateRecordedChecks(build.recordedChecks?.conditionalLean,frozenSource,build.expectedChecks?.conditionalLean);
  const examples=await getP8Examples();
  const compiledLedger=recordedConditionalAudit.ok?conditionalLedger(recordedConditionalAudit.report):null;
  if(compiledLedger)examples.push({id:'p8-conditional-ci',title:'실제 Lean 조건부 목표 · 가정 제거 거절 기록',criterion:'P8-05',request:{kind:'p8.assumption_audit',input:{ledger:compiledLedger,removeAssumptionId:'assumption:conditional-ci'}}});
  const packets=()=>exportReviewPackets(build.reviewSnapshot,frozenSource);
  async function leanStatus(certificate,generated) {
    const evidence=build.leanEvidence;
    const inputSHA256=await sha256(certificate.input),generatedSourceSHA256=await sha256(generated);
    const status={status:'NOT_COMPILED_FOR_THIS_INPUT',freshKernelExecuted:false,formalLeanProofIssued:false,inputSHA256,generatedSourceSHA256,scope:'Only the exact compiled finite consumer types; no geometric or infinite comparison.',recordedAudit:null};
    if(evidence?.status==='RECORDED_CI_AUDIT'&&same(evidence.input,certificate.input)&&evidence.generatedSourceSHA256===generatedSourceSHA256){
      const audit=evidence.audit;
      if(!leanRegistry.ok){status.status='RECORDED_AUDIT_REJECTED';status.issues=leanRegistry.issues;}
      else {status.status='RECORDED_KERNEL_CHECK_MATCH';status.registry=leanRegistry;status.recordedAudit={auditSHA256:await sha256(audit),ci:evidence.ci,environment:audit.environment,targets:audit.targets,negativeControls:audit.negativeControls,sourceManifestSha256:audit.sourceManifestSha256};}
    }
    return status;
  }
  async function dispatch(request) {
    const input=request.input;
    switch(request.kind){
      case 'p8.object_contract': {
        shape(input,['claim'],['bindingRequest','currentBinding'],'object contract input');
        const result={claim:cloneJSON(input.claim),validation:validateObjectEvidence(input.claim)};
        if(input.bindingRequest){result.binding=await bindP8Claim(input.bindingRequest);if(!same(result.binding.claim,input.claim))throw Error('The bound claim differs from the displayed claim.');result.bindingValidation=await verifyP8Binding(result.binding,input.currentBinding);}
        result.status=result.validation.ok?'STRUCTURE_VALIDATED_NO_PROOF_AUTHORITY':'REJECTED';return result;
      }
      case 'p8.visual_structure': {
        shape(input,['view','m2Request'],[],'structure input');
        if(!['degree-basis-valuation','hodge-newton','prime-degree-frobenius','refinement-tower'].includes(input.view))throw Error('Unsupported coordinate contract.');
        return {status:'FRESH_INHERITED_M2_EXECUTION',view:input.view,inheritedM2:await runM2(input.m2Request),visualizationAuthority:'NONE',accuracy:'EXACT_FINITE_WITH_DECLARED_EXTERNAL_COMPARISONS'};
      }
      case 'p8.comparison': {
        shape(input,['route'],['removeAssumptionId'],'comparison input');
        const diagram=await buildM2ComparisonDiagram(input.route),validation=await validateComparisonDiagram(diagram);
        const result={status:validation.status,diagram,validation};
        if(input.removeAssumptionId){result.invalidation=invalidateComparisonAfterAssumptionChange(diagram,input.removeAssumptionId);const altered=cloneJSON(diagram);altered.assumptions=altered.assumptions.filter(x=>x.id!==input.removeAssumptionId);result.replayAfterRemoval=await validateComparisonDiagram(altered);}
        return result;
      }
      case 'p8.finite_certificate': {
        const certificate=makeFiniteCertificate(input),generated=exportLeanCertificate(certificate),lean=await leanStatus(certificate,generated);
        return {status:'EXACT_FINITE_RECOMPUTED',accuracy:'EXACT',certificate,validation:validateFiniteCertificate(certificate),leanSource:generated,lean,theoremBacklog:buildTheoremBacklog(lean)};
      }
      case 'p8.assumption_audit': {
        shape(input,['ledger'],['kernelAudit','removeAssumptionId'],'assumption input');
        const audit=auditAssumptionLedger(input.ledger,{kernelAudit:input.kernelAudit}),result={...audit,ledger:cloneJSON(input.ledger),importedProofStatusAdopted:false};
        if(input.removeAssumptionId)result.removal=prepareAssumptionRemoval(input.ledger,input.removeAssumptionId);
        if(compiledLedger&&same(input.ledger,compiledLedger))result.recordedConditionalAudit=recordedConditionalAudit;
        return result;
      }
      case 'p8.candidate_compare':return compareFiniteCandidates(input);
      case 'p8.mutation_audit':empty(input);return {...await runMutationAudit(),recordedP7Mutations};
      case 'p8.review_packets':empty(input);return packets();
      default:throw Error('Unsupported P8 operation.');
    }
  }
  function normalize(value) {
    assertJSON(value,MAX_INPUT);shape(value,['kind','input'],[],'P8 request');
    if(!KINDS.includes(value.kind))throw Error('Unsupported P8 operation.');
    if(!value.input||typeof value.input!=='object'||Array.isArray(value.input))throw Error('P8 input must be an object.');
    return cloneJSON(value);
  }
  async function run(value) {
    const request=normalize(value),startedAt=new Date().toISOString(),start=performance.now();
    const body={schema:'MathScope.M3.P8.Execution/1',request,inputSHA256:await sha256(request),sourceBinding:frozenSource,result:null,resultSHA256:null,execution:{status:'FAILED',engineVersion:VERSION,startedAt},scope:SCOPE};
    try{body.result=await dispatch(request);assertJSON(body.result,24*1024*1024);body.execution.status='COMPLETED';}catch(e){body.error=errorInfo(e);}
    body.execution.elapsedMilliseconds=Math.round(performance.now()-start);body.resultSHA256=await sha256(body.result);
    body.recordSHA256=await sha256(body);assertJSON(body,MAX_RECORD);return freeze(body);
  }
  async function replay(raw) {
    assertJSON(raw,MAX_RECORD);raw=cloneJSON(raw);
    shape(raw,['schema','request','inputSHA256','sourceBinding','result','resultSHA256','execution','scope','recordSHA256'],['error'],'P8 record');
    if(raw.schema!=='MathScope.M3.P8.Execution/1'||!same(raw.scope,SCOPE))throw Error('Unsupported record or imported authority escalation.');
    shape(raw.execution,['status','engineVersion','startedAt','elapsedMilliseconds'],[],'execution metadata');
    if(!['COMPLETED','FAILED'].includes(raw.execution.status)||typeof raw.execution.engineVersion!=='string'||typeof raw.execution.startedAt!=='string'||!Number.isSafeInteger(raw.execution.elapsedMilliseconds)||raw.execution.elapsedMilliseconds<0)throw Error('Malformed execution metadata.');
    if(raw.execution.status==='FAILED'){shape(raw.error,['code','message'],[],'execution error');if(raw.result!==null)throw Error('A failed run cannot issue a mathematical result.');}
    else if(raw.error!==undefined)throw Error('A completed record cannot contain a failure error.');
    const unsigned=cloneJSON(raw);delete unsigned.recordSHA256;
    if(raw.recordSHA256!==await sha256(unsigned)||raw.inputSHA256!==await sha256(raw.request)||raw.resultSHA256!==await sha256(raw.result))throw Error('Imported record integrity mismatch.');
    const fresh=await run(raw.request),checks={source:same(raw.sourceBinding,frozenSource),input:raw.inputSHA256===fresh.inputSHA256,result:raw.resultSHA256===fresh.resultSHA256,successfulExecution:raw.execution.status==='COMPLETED'&&fresh.execution.status==='COMPLETED'};
    return freeze({schema:'MathScope.M3.P8.Replay/1',status:Object.values(checks).every(Boolean)?'MATCH':'MISMATCH_OR_UNRESOLVED',checks,fresh,importedProofStatusAdopted:false});
  }
  return Object.freeze({capabilities:()=>cloneJSON({schema:'MathScope.M3.P8.Capabilities/1',version:VERSION,kinds:KINDS,objectKinds:OBJECT_KINDS,arithmeticModes:ARITHMETIC_MODES,proofMethods:PROOF_METHODS,examples,sourceBinding:frozenSource,limits:{requestBytes:MAX_INPUT,recordBytes:MAX_RECORD,workerMilliseconds:90000,concurrentRuns:1},progress:{status:'IN_PROGRESS',criteria:build.reviewSnapshot.p8.criteria,...SCOPE}}),run,replay,exportReviewPackets:packets});
}
