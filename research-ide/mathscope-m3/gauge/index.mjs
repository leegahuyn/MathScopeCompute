/** Browser-safe M3 gauge entry point. M1/M2 and P7 remain unmodified. */
import {runFieldFamily,inspectFieldSelection,discreteScalarObservation} from './field-family.mjs';
import {runFiniteSpectrum,finiteTransferCertificate,effectiveMass,gevp,convertLatticeMass} from './spectral.mjs';
import {runEnsembleFamily,connectedCorrelators} from './ensemble-family.mjs';
import {runLatticeObservation,inspectLatticeSelection} from './lattice-observation.mjs';
import {runWilsonFlow} from './wilson-flow.mjs';
import {runScaleStudy} from './scale-study.mjs';
import {loadStudyRecord} from './study-record.mjs';
import {runProofAudit,auditProofSources,registerAssumptions,projectionCounterexample,projectionClaimContract,revisionImpact} from './proof.mjs';
import {VERSION,MODES,REFERENCES,CONTINUUM_OBLIGATIONS,check,known,sha256,canonical,jsonSafe,runtimeContext} from './contracts.mjs';
import {GAUGE_CRITERIA_PROGRESS} from './progress-data.mjs';
export {inspectFieldSelection,inspectLatticeSelection,discreteScalarObservation,effectiveMass,gevp,convertLatticeMass,finiteTransferCertificate,connectedCorrelators,auditProofSources,registerAssumptions,projectionCounterexample,projectionClaimContract,revisionImpact};
export const KINDS=['field-family','finite-spectrum','finite-transfer','ensemble-family','proof-audit','lattice-observation','wilson-flow','ensemble-study'];
export async function runGaugeM3(request={},context={}){
 const {kind='field-family',...input}=request;check(KINDS.includes(kind),'M3_GAUGE_KIND','Choose an implemented field, spectral, ensemble, independent scale study, lattice-observation, Wilson-flow or proof-audit operation.');
 const runtime=runtimeContext(context);runtime.checkCancelled();
 const data=kind==='field-family'?await runFieldFamily(input,runtime):kind==='finite-spectrum'?await runFiniteSpectrum(input):kind==='finite-transfer'?await finiteTransferCertificate(input):kind==='ensemble-family'?await runEnsembleFamily(input,runtime):kind==='ensemble-study'?('recordId' in input?await loadStudyRecord(input):await runScaleStudy(input,runtime)):kind==='lattice-observation'?await runLatticeObservation(input,runtime):kind==='wilson-flow'?await runWilsonFlow(input,runtime):await runProofAudit(input);
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
 return {status:expectedHash===actualHash?'MATCH':'MISMATCH',expectedHash,actualHash,actual,newExecution:actual.newExecution!==false,sourceAuditReexecuted:actual.archiveAudit?.sourceAuditReexecuted===true,proofAuthority:'A replay is a numerical/source comparison. Formal authority remains tied to the fixed kernel audit and its exact assumptions.'};
}
export function getChecklist(){return structuredClone(GAUGE_CRITERIA_PROGRESS);}
export function getCapabilities(){return {version:VERSION,kinds:KINDS,deltaModes:MODES,fieldGroups:'Inherited actual M1 compact matrix adapters (including SU3 and G2)',newEnsembleAdapter:'SU2 defining representation; finite periodic temporal correlator',independentScaleStudy:'New full continuous SU2 heatbath/overrelaxation chains, standard-normalized Wilson flow t0 with c=0.1, separate scale and time-local operator chains, raw/connected/full-zero-energy-difference correlators, GEVP, bootstrap cosh fits and matched finite a/L/T comparison in sqrt(t0) units. No physical-unit anchor is invented. recordId:su2-production-v1 opens a byte-checked archive of actual production runs with newExecution:false.',latticeObservations:'Actual saved links: discrete slice, at-weighted marginal, temporal average and configuration mean; original-link/F selection',wilsonFlow:'Nonstationary full-metric SU2/SU3/G2 finite Wilson gradient flow, step refinement and complete-trajectory gauge covariance; no continuum error certificate',formalScope:'Exact finite rational geometric semigroup and full-vacuum transfer checks; exact inherited M1 algebra freshly compiled; legacy Core10 recompiled; prior real scaffold audit preserved by source hash; new pinned Mathlib CI proves finite Real exponential/logarithmic envelopes and complete-vacuum ratio bounds, separately from edited browser inputs.',continuumObligations:CONTINUUM_OBLIGATIONS,checklist:getChecklist()};}
export function getExamples(){return [
 {id:'y5-effective-su3',label:'Y5 · SU(3) · 실제 Δ별 4D 장과 스펙트럼',request:{kind:'field-family',mode:'EXPLICIT_EFFECTIVE_MODEL',deltas:[1,2],epsilon:.08,sampleCount:5,extent:2,slice:0,observation:'SLICE'}},
 {id:'y5-assumed-bound',label:'Y5 · 가정만 변경 · 원본 보존',request:{kind:'field-family',mode:'DECLARED_LOWER_BOUND',deltas:[1,2],epsilon:0,sampleCount:5,extent:2}},
 {id:'y5-units',label:'Y5 · 단위 변경 · 같은 물리장',request:{kind:'field-family',mode:'UNITS_RESCALING',deltas:[1,2],epsilon:0,sampleCount:5,extent:2}},
 {id:'y6-g2-slice',label:'Y6 · G2 · 실제 7×7 장의 절단',request:{kind:'field-family',group:{family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'},deltas:[1,2],sampleCount:3,extent:1,observation:'SLICE'}},
 {id:'y6-bpst-marginal',label:'Y6 · BPST 시간방향 적분·tail',request:{kind:'field-family',deltas:[1,2],sampleCount:3,extent:1,observation:'MARGINAL',window:[-4,4],panels:32}},
 {id:'y5-finite-spectrum',label:'Y5 · 상관행렬·GEVP·질량',request:{kind:'finite-spectrum',delta:1,offsets:[0,1,2],weights:[1,.35,.15],at:.25,timeCount:25}},
 {id:'y5-new-chains',label:'Y5 · 타깃별 새 SU(2) chain과 상관함수',request:{kind:'ensemble-family',calibration:[{delta:1,beta:.4},{delta:2,beta:.8}],sampler:{samples:96,burnIn:32},bootstrap:{replicates:64,binSize:8}}},
 {id:'y7-exact-transfer',label:'Y7 · 정확 유리수 전달모형 인증',request:{kind:'finite-transfer',diagonal:['1','1/2','1/4','1/8'],vacuumIndices:[0],ratioUpper:'1/2',at:'1',modelId:'m3-four-state-diagonal-transfer',cutoff:'Complete finite C^4 model; no uncut lattice or continuum claim'}},
 {id:'y7-proof-audit',label:'Y7 · 실제 Lean audit·투영 반례·열린 의무',request:{kind:'proof-audit'}},
 {id:'y6-lattice-slice',label:'Y6 · 실제 link 원본 · 격자 x4 절단',request:{kind:'lattice-observation',observation:'SLICE',timeIndex:1,quantity:'actionDensity'}},
 {id:'y6-lattice-marginal-mean',label:'Y6 · 두 실제 원본 · x4 적분과 표본평균',request:{kind:'lattice-observation',observation:'ENSEMBLE_MEAN',baseObservation:'MARGINAL',quantity:'actionDensity',sources:[{label:'원본 A',initial:{kind:'SEEDED_EXPONENTIAL',seed:'m3-view-config-a'}},{label:'원본 B',initial:{kind:'SEEDED_EXPONENTIAL',seed:'m3-view-config-b'}}]}},
 {id:'y6-wilson-flow-su2',label:'Y6 · SU(2) 실제 비정상 Wilson flow',request:{kind:'wilson-flow',flowTime:.02,steps:16,observation:'SLICE',timeIndex:1,quantity:'actionDensity'}},
 {id:'y6-wilson-flow-g2',label:'Y6 · G2 전체 기저 Wilson flow',request:{kind:'wilson-flow',source:{label:'실제 G2 link 원본',group:{family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'},lattice:{Ns:2,Nt:2,as:.5,at:.5,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'ell0',origin:[0,0,0,0]}},flowTime:.005,steps:4}},
 {id:'y5-independent-t0',label:'Y5 · 독립 t₀ 척도 · 새 실제 SU(2) chain',request:{kind:'ensemble-study',scaleSampler:{samples:8,burnIn:32},channelSampler:{samples:128,burnIn:32},flow:{maxTime:.8,step:.04},bootstrap:{replicates:32,scaleBlock:2,channelBlock:8}}},
 {id:'y5-matched-reference-study',label:'Y5 · 실측 척도에 맞춘 세 격자 · 짧은 실행',request:{kind:'ensemble-study',seed:'m3-matched-browser-study-v1',references:[{id:'s216',beta:2.16,Ns:5,Nt:10},{id:'s230',beta:2.3,Ns:6,Nt:12},{id:'s240',beta:2.4,Ns:8,Nt:16}],models:[{id:'a216',role:'A_SWEEP',targetDelta:1.25,beta:2.16,Ns:5,Nt:10,referenceScaleId:'s216'},{id:'a230',role:'A_SWEEP',targetDelta:1.25,beta:2.3,Ns:6,Nt:12,referenceScaleId:'s230'},{id:'a240',role:'A_SWEEP',targetDelta:1.25,beta:2.4,Ns:8,Nt:16,referenceScaleId:'s240'}],scaleSampler:{samples:8,burnIn:16},channelSampler:{samples:64,burnIn:16},flow:{maxTime:1.28,step:.08},bootstrap:{replicates:32,scaleBlock:2,channelBlock:8},operators:{smearSteps:[0,2,4],alpha:.5},matching:{referenceL:8,referenceT:16,matchingRelativeTolerance:.1}}},
 {id:'y5-production-reference-record',label:'Y5 · 실제 장시간 8개 실행 기록 · 출처 검증',request:{kind:'ensemble-study',recordId:'su2-production-v1'}}
];}
