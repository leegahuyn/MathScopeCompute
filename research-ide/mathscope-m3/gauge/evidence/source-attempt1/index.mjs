/** Browser-safe M3 gauge entry point. M1/M2 and P7 remain unmodified. */
import {runFieldFamily,inspectFieldSelection,discreteScalarObservation} from './field-family.mjs';
import {runFiniteSpectrum,finiteTransferCertificate,effectiveMass,gevp} from './spectral.mjs';
import {runEnsembleFamily,connectedCorrelators} from './ensemble-family.mjs';
import {runProofAudit,auditProofSources,registerAssumptions,projectionCounterexample,projectionClaimContract,revisionImpact} from './proof.mjs';
import {VERSION,MODES,REFERENCES,CONTINUUM_OBLIGATIONS,check,known,sha256,canonical,jsonSafe,runtimeContext} from './contracts.mjs';
export {inspectFieldSelection,discreteScalarObservation,effectiveMass,gevp,finiteTransferCertificate,connectedCorrelators,auditProofSources,registerAssumptions,projectionCounterexample,projectionClaimContract,revisionImpact};
export const KINDS=['field-family','finite-spectrum','finite-transfer','ensemble-family','proof-audit'];
export async function runGaugeM3(request={},context={}){
 const {kind='field-family',...input}=request;check(KINDS.includes(kind),'M3_GAUGE_KIND','Choose field-family, finite-spectrum, finite-transfer, ensemble-family or proof-audit.');
 const runtime=runtimeContext(context);runtime.checkCancelled();
 const data=kind==='field-family'?await runFieldFamily(input,runtime):kind==='finite-spectrum'?await runFiniteSpectrum(input):kind==='finite-transfer'?await finiteTransferCertificate(input):kind==='ensemble-family'?await runEnsembleFamily(input,runtime):await runProofAudit(input);
 runtime.checkCancelled();return jsonSafe({schema:'MathScope.M3.GaugeResult/1',version:VERSION,request:structuredClone(request),...data,kind,references:REFERENCES,proofBoundary:{finite:'The model and exact kernel scope are explicitly listed per result.',conditional:'Every reconstruction, existence and full-spectrum premise remains visible.',numerical:'Float64 fields and correlated finite-chain estimates do not issue new kernel certificates.',continuum:'OPEN_CONTINUUM',clayProblemSolved:false}});
}
export async function exportGaugeSession(result,scene={}){
 check(result?.schema==='MathScope.M3.GaugeResult/1'&&result.version===VERSION,'SESSION_RESULT','Export a complete current M3 gauge result.');known(scene,['camera','selectedState','selectedPoint'],'scene');
 const payload={version:VERSION,request:result.request,result,scene:structuredClone(scene)};return {schema:'MathScope.M3.GaugeSession/1',payload,payloadHash:await sha256(payload),proofAuthority:'REPLAY_AND_PINNED_SOURCE_AUDIT_REQUIRED'};
}
export async function importGaugeSession(bundle){
 check(bundle?.schema==='MathScope.M3.GaugeSession/1'&&bundle.payload?.version===VERSION,'SESSION_VERSION','The imported session version is unsupported.');check(await sha256(bundle.payload)===bundle.payloadHash,'SESSION_HASH_MISMATCH','The imported data, sources or scene were modified.');
 check(bundle.payload.result?.schema==='MathScope.M3.GaugeResult/1'&&canonical(bundle.payload.request)===canonical(bundle.payload.result.request),'SESSION_SOURCE_MISMATCH','The imported request and result refer to different source inputs.');
 return {status:'IMPORTED_UNVERIFIED_REPLAY_REQUIRED',request:structuredClone(bundle.payload.request),scene:structuredClone(bundle.payload.scene),result:structuredClone(bundle.payload.result),payloadHash:bundle.payloadHash,proofVerified:false};
}
export async function replayGaugeSession(bundle,context={}){
 const imported=await importGaugeSession(bundle),actual=await runGaugeM3(imported.request,context),expectedHash=await sha256(imported.result),actualHash=await sha256(actual);
 return {status:expectedHash===actualHash?'MATCH':'MISMATCH',expectedHash,actualHash,actual,newExecution:true,proofAuthority:'A replay is a numerical/source comparison. Formal authority remains tied to the fixed kernel audit and its exact assumptions.'};
}
const TITLES={Y5:['Δ 모드와 변경 효과','실제로 변하는 유효 4D 장족','명시적 유효 스펙트럼','단위 변환과 dilation','타깃별 새 양자 격자 chain','상관함수와 유효질량','GEVP와 전체 비진공 ratio','한계 순서와 다중 오차'],Y6:['원본·표현·근거 연결','x4 절단','적분·평균 구별','불변 기본 채널','Flow와 원래 4D loop','Δ별 공통 척도 비교','투영 반례와 Lean 계약','재현·접근성·stale'],Y7:['기존 Core10과 사용자 공리','정확 대수의 kernel 인증','유한 spectral certificate','가정의 출처와 충돌 검사','투영 뒤 조건부 계약','OS 재구성 의무','OPEN CONTINUUM 관리','hash·회귀·증거 묶음']};
export function getChecklist(){return Object.entries(TITLES).flatMap(([p,titles])=>titles.map((title,i)=>({id:`${p}-${String(i+1).padStart(2,'0')}`,title,status:'IMPLEMENTED_REVIEW_PENDING',originalSource:`Blueprint pages ${p==='Y5'?'45–46':p==='Y6'?'47–48':'49–50'}`,scope:p==='Y7'?'Finite and conditional checkpoints; the continuum research obligations remain OPEN.':'Per-operation bounds and supported model adapters remain explicit.'})));}
export function getCapabilities(){return {version:VERSION,kinds:KINDS,deltaModes:MODES,fieldGroups:'Inherited actual M1 compact matrix adapters (including SU3 and G2)',newEnsembleAdapter:'SU2 defining representation; finite periodic temporal correlator',formalScope:'Exact finite rational geometric semigroup and full-vacuum transfer checks; exact inherited M1 algebra freshly compiled; legacy Core10 recompiled; prior real scaffold audit preserved by source hash.',continuumObligations:CONTINUUM_OBLIGATIONS,checklist:getChecklist()};}
export function getExamples(){return [
 {id:'y5-effective-su3',label:'Y5 · SU(3) · 실제 Δ별 4D 장과 스펙트럼',request:{kind:'field-family',mode:'EXPLICIT_EFFECTIVE_MODEL',deltas:[1,2],epsilon:.08,sampleCount:5,extent:2,slice:0,observation:'SLICE'}},
 {id:'y5-assumed-bound',label:'Y5 · 가정만 변경 · 원본 보존',request:{kind:'field-family',mode:'DECLARED_LOWER_BOUND',deltas:[1,2],epsilon:0,sampleCount:5,extent:2}},
 {id:'y5-units',label:'Y5 · 단위 변경 · 같은 물리장',request:{kind:'field-family',mode:'UNITS_RESCALING',deltas:[1,2],epsilon:0,sampleCount:5,extent:2}},
 {id:'y6-g2-slice',label:'Y6 · G2 · 실제 7×7 장의 절단',request:{kind:'field-family',group:{family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'},deltas:[1,2],sampleCount:3,extent:1,observation:'SLICE'}},
 {id:'y6-bpst-marginal',label:'Y6 · BPST 시간방향 적분·tail',request:{kind:'field-family',deltas:[1,2],sampleCount:3,extent:1,observation:'MARGINAL',window:[-4,4],panels:32}},
 {id:'y5-finite-spectrum',label:'Y5 · 상관행렬·GEVP·질량',request:{kind:'finite-spectrum',delta:1,offsets:[0,1,2],weights:[1,.35,.15],at:.25,timeCount:25}},
 {id:'y5-new-chains',label:'Y5 · 타깃별 새 SU(2) chain과 상관함수',request:{kind:'ensemble-family',calibration:[{delta:1,beta:.4},{delta:2,beta:.8}],sampler:{samples:96,burnIn:32},bootstrap:{replicates:64,binSize:8}}},
 {id:'y7-exact-transfer',label:'Y7 · 정확 유리수 전달모형 인증',request:{kind:'finite-transfer',diagonal:['1','1/2','1/4','1/8'],vacuumIndices:[0],ratioUpper:'1/2',at:'1',modelId:'m3-four-state-diagonal-transfer',cutoff:'Complete finite C^4 model; no uncut lattice or continuum claim'}},
 {id:'y7-proof-audit',label:'Y7 · 실제 Lean audit·투영 반례·열린 의무',request:{kind:'proof-audit'}}
];}
