import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {M2_VERSION,clone} from './registry.mjs';

const SESSION_CHANGED='연구 세션 또는 revision이 변경됐습니다. 같은 세션에서 다시 실행한 뒤 저장하세요.';
const TARGET_CHANGED='저장 대상의 수학 기록이 변경됐습니다. 현재 revision에서 다시 실행한 뒤 저장하세요.';
const TARGET_GROUPS=['objects','representations','claims'];

function expectedOrigin(origin){
  if(!origin||typeof origin.id!=='string'||!origin.id||!Number.isSafeInteger(origin.revision)||origin.revision<0){
    throw Error('실행을 시작한 연구 세션의 id와 정수 revision이 필요합니다.');
  }
  return {id:origin.id,revision:origin.revision};
}

function assertOrigin(session,origin){
  if(!session||session.id!==origin.id||session.sessionRevision!==origin.revision)throw Error(SESSION_CHANGED);
}

function targetState(session,ids){
  return canonicalStringify(Object.fromEntries(TARGET_GROUPS.map((group,i)=>[
    group,(session[group]||[]).find(node=>node.id===ids[i])||null
  ])));
}

function nextRevision(session,group,id){
  const old=session[group]?.find(node=>node.id===id),parentRevision=old?.revision||null;
  const n=parentRevision?.match(/:r(\d+)$/)?.[1];
  if(old&&(!n||!Number.isSafeInteger(Number(n))||Number(n)>=Number.MAX_SAFE_INTEGER)){
    throw Error('기존 저장 대상의 revision 형식이 유효하지 않습니다.');
  }
  return {revision:id+':r'+(Number(n||0)+1),parentRevision};
}

function asText(value,fallback){
  return typeof value==='string'&&value?value:value?canonicalStringify(value):fallback;
}

function assertBuildBinding(session,bundle){
  const binding=bundle.sessionBinding;
  assertOrigin(session,{id:binding.sessionId,revision:binding.expectedRevision});
  if(targetState(session,binding.targetIds)!==binding.targetState)throw Error(TARGET_CHANGED);
}

/**
 * Construct a preview bundle. Foundation.getSession() returns a detached clone;
 * a caller that will persist the result must use commitM2SessionBundle below.
 * A live getter also catches changes while receipt/environment hashes resolve.
 */
export async function buildM2SessionBundle(job,engine,session,origin,getSession=null){
  const expected=expectedOrigin(origin);
  assertOrigin(session,expected);
  if(getSession!==null&&typeof getSession!=='function')throw Error('현재 세션 getter가 필요합니다.');
  if(getSession)assertOrigin(getSession(),expected);
  const snapshot=clone(session),jobIdentity=clone({id:job?.id??null,inputHash:job?.inputHash??null,resultHash:job?.resultHash??null,environmentHash:job?.environmentHash??null});
  if(!jobIdentity.id||!jobIdentity.inputHash||!jobIdentity.resultHash)throw Error('완료된 실제 실행 기록이 필요합니다.');
  const ownedReceipt=await engine.receipt(jobIdentity.id);
  if(!await engine.verifyReceipt(ownedReceipt)||ownedReceipt.id!==jobIdentity.id||ownedReceipt.inputHash!==jobIdentity.inputHash||ownedReceipt.resultHash!==jobIdentity.resultHash){
    throw Error('실제 실행에서 발급된 현재 receipt가 필요합니다.');
  }
  const receipt=clone(ownedReceipt);
  if(!['COMPLETED','PARTIAL'].includes(receipt.status))throw Error('완료 또는 부분 계산 결과만 저장할 수 있습니다.');

  const env=clone(await engine.environment()),{hash:environmentHash,...environmentBody}=env;
  if(!environmentHash||receipt.environmentHash!==environmentHash||jobIdentity.environmentHash!==environmentHash||await sha256(environmentBody)!==environmentHash){
    throw Error('실행 receipt와 현재 worker 환경의 해시가 일치해야 합니다.');
  }
  const r=receipt.result,request=receipt.request;
  if(!r||typeof r!=='object'||typeof request?.kind!=='string'||!request.input){
    throw Error('실행 receipt의 수학 결과 또는 정규화된 입력이 없습니다.');
  }
  const tag=receipt.inputHash.slice(0,20),oid='obj-m2-'+tag,rid='rep-m2-'+tag,cid='claim-m2-'+tag;
  const ids=[oid,rid,cid],domain=request.kind.split('.')[0],now=new Date().toISOString();
  const assumptions=Array.isArray(r.assumptions)?r.assumptions.map(x=>typeof x==='string'?x:canonicalStringify(x)):['Only the explicitly bounded input and installed adapter scope.'];
  const raw=r.visualization||{};
  const object={
    id:oid,type:'FiniteComputationRecord',baseField:'Typed source ring or physical field is recorded in sourceRecord.',
    intrinsicDim:0,ambientDim:0,
    dimensionSemantics:'These dimensions describe a discrete computation record. They do not state the dimension of the mathematical object or its observed space.',
    structures:['M2 finite mathematical computation',domain],domainKind:request.kind,
    sourceRecord:{request:clone(request),object:clone(r.object||{kind:request.kind})},
    ...nextRevision(snapshot,'objects',oid),assumptions,
    provenance:{source:'MathScope M2 static worker',workerSha256:env.workerSha256,environmentHash,inputHash:receipt.inputHash,capturedAt:now},
    hash:await sha256({request,source:env.workerSha256}),freshness:'CURRENT'
  };
  const rep={
    id:rid,sourceObjectRef:oid,
    // The installed v0.3.1 Foundation enum does not accept "custom".
    method:'sampled-finite',displayDim:3,
    mapDefinition:asText(raw.description||raw.coordinateMeaning,'Source-bound finite chart and exact-value table'),
    parameters:{requestHash:receipt.inputHash,sourceDataHash:raw.sourceHash||null,sourceDataRevision:raw.sourceRevision||null,axes:clone(raw.axes||[]),observation:clone(request.input.observation||null),coordinateMeaning:clone(raw.coordinateMeaning||null),cameraAffectsSource:false},
    sampling:{...clone(raw.sampling||{}),mode:'explicit-finite',pointCount:raw.points?.length||0,lineCount:raw.lines?.length||0,plotting:'Binary64 only; exact algebra is retained in the exported result.'},
    injectivityStatus:'UNPROVED',ambiguityRef:null,fidelityVector:{numericalBounds:r.errorBounds||null},
    lostDimensions:Array.isArray(raw.lostInformation)?clone(raw.lostInformation):[asText(raw.lostInformation,'Uncomputed infinite/continuum information is not recovered.')],
    inverseStatus:'UNAVAILABLE',
    provenance:{resultHash:receipt.resultHash,sourceDataHash:raw.sourceHash||null,workerSha256:env.workerSha256,capturedAt:now},
    ...nextRevision(snapshot,'representations',rid),freshness:'CURRENT',stale:false
  };
  const scope=clone(r.scope||r.contract||'Only this finite executed request; no general theorem is established.');
  const claim={
    id:cid,type:'ClaimSpec',statement:'The saved finite M2 run has the attached input, numerical/exact finite diagnostics and declared scope.',
    scope,assumptions,dependsOn:[oid,rid],status:receipt.status==='COMPLETED'?'SUPPORTED':'OPEN',freshness:'CURRENT',
    ...nextRevision(snapshot,'claims',cid)
  };
  const evidence={
    id:'ev-m2-'+await sha256(receipt.id),type:'EvidenceRecord',grade:'NUMERICAL INDICATOR',claimRef:cid,
    method:request.kind+' / static bounded worker',inputsHash:receipt.inputHash,environmentHash,
    resultHash:receipt.resultHash,mathematicalHash:receipt.mathematicalHash,sourceHash:env.workerSha256,
    residuals:clone(r.diagnostics||r.checks||null),errorBounds:clone(r.errorBounds||null),assumptions,scope,
    generatedAt:now,adapterVersion:M2_VERSION,upstreamRevisions:[object.revision,rep.revision,claim.revision],
    freshness:'CURRENT',supportsCurrent:true,stale:false,
    originalCalculationGrade:r.evidenceGrade||r.evidence?.grade||'SCOPED_FINITE',formalPass:false
  };
  const bundle={
    bundleId:'m2-'+receipt.id,objects:[object],representations:[rep],claims:[claim],evidence:[evidence],
    sessionBinding:{sessionId:expected.id,expectedRevision:expected.revision,targetIds:ids,targetState:targetState(snapshot,ids),commitPolicy:'LIVE_SESSION_CHECK_THEN_SYNCHRONOUS_FOUNDATION_COMMIT'},
    researchRuns:[{
      id:receipt.id,stage:'M2',status:receipt.status,sourceRecord:{request:clone(request)},
      nodeRefs:[oid,rid,cid,evidence.id],inputHash:receipt.inputHash,resultHash:receipt.resultHash,mathematicalHash:receipt.mathematicalHash,
      environmentHash,workerSha256:env.workerSha256,scope,
      rawResultPolicy:'Download the complete hash-bound replay JSON; serialized evidence is untrusted until recomputed.'
    }]
  };
  if(getSession)assertBuildBinding(getSession(),bundle);
  return bundle;
}

/** Save only to the current origin, with no asynchronous gap before Foundation's commit. */
export async function commitM2SessionBundle(job,engine,foundation,origin,reason='M2 finite worker result'){
  if(typeof foundation?.getSession!=='function'||typeof foundation?.commitTypedBundle!=='function'){
    throw Error('현재 ResearchSession의 Foundation 저장 API가 필요합니다.');
  }
  const expected=expectedOrigin(origin),getSession=()=>foundation.getSession();
  const bundle=await buildM2SessionBundle(job,engine,getSession(),expected,getSession);
  // Keep this check and the following synchronous Foundation call in one turn.
  assertBuildBinding(getSession(),bundle);
  const saved=foundation.commitTypedBundle(bundle,reason);
  return {
    sessionId:saved.id,sessionRevision:saved.sessionRevision,bundleId:bundle.bundleId,
    objectIds:bundle.objects.map(x=>x.id),representationIds:bundle.representations.map(x=>x.id),claimIds:bundle.claims.map(x=>x.id),
    evidenceIds:bundle.evidence.map(x=>x.id),runIds:bundle.researchRuns.map(x=>x.id),session:saved
  };
}
