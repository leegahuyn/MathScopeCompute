import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateRecordedLean} from '../lean-registry.mjs';
import {sha256,cloneJSON} from '../common.mjs';

// Synthetic receipts exercise consistency only; they are never execution evidence.
async function fixture(){
  const base=new URL('../',import.meta.url),pins=JSON.parse(await fs.readFile(new URL('lean/pins.json',base),'utf8'));
  const negativeNames=['NegativePointCount','NegativeTrace','NegativeResidue','NegativeEuler','NegativeContraction','NegativeDifferential','NegativePrecision','NegativeFalse'];
  const names=['inherited_d_squared','inherited_unit_contraction','inherited_precision_reduction','trace_cayley_hamilton','matrix_trace_recurrence','residue_625_unique','finite_euler_regrouping','Generated.point_count_certificate','Generated.prime_and_smooth_fixture','Generated.trace_matrix_certificate','Generated.reconstruction_certificate','Generated.finite_euler_certificate'];
  const targets=names.map(name=>({name:'MathScope.P8.'+name,propositionId:'P8.FINITE.'+name,scope:'FINITE_FIXTURE',sourceFile:'lean/MathScope/P8/'+(name.startsWith('Generated.')?'Generated':'Finite')+'.lean'}));
  const paths=['lean/Audit.lean','lean/lakefile.lean','lean/lean-toolchain','lean/pins.json','lean/finite-input.json','lean/MathScope/M1/Arithmetic/Algebra.lean','lean/MathScope/M1/Arithmetic/Precision.lean','lean/MathScope/P8/Finite.lean','lean/MathScope/P8/Generated.lean','finite-certificates.mjs','tools/generate_finite.mjs','tools/audit_lean.py',...negativeNames.map(x=>'lean/'+x+'.lean')].sort();
  const sourceFiles=[],files=[];
  for(const path of paths){const text=await fs.readFile(new URL(path,base),'utf8'),digest=await sha256(text);sourceFiles.push({path,sha256:digest});files.push({path:'mathscope-m3/p8/'+path,bytes:Buffer.byteLength(text),sha256:digest});}
  const sourceHash=path=>sourceFiles.find(x=>x.path===path).sha256;
  const h='1'.repeat(64),input={prime:'5',traceLength:7},ci={repository:'leegahuyn/MathScopeCompute',commit:'2'.repeat(40),runId:'12345',url:'https://github.com/leegahuyn/MathScopeCompute/actions/runs/12345'};
  const audit={schema:'MathScope.M3.P8.LeanAudit/1',status:'KERNEL_CHECKED_FINITE_SCOPES',serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',absenceOfSorry:true,customAxioms:[],wholeP8Complete:false,wholeM3Complete:false,globalRHProved:false,globalBSDProved:false,sourceFiles,sourceManifestSha256:await sha256(sourceFiles),inputManifestSha256:sourceHash('lean/finite-input.json'),consumerManifest:targets,consumerManifestSha256:await sha256(targets),targets:await Promise.all(targets.map(async t=>({...t,type:t.name+' : True',typeSha256:await sha256(t.name+' : True'),sourceSha256:sourceHash(t.sourceFile),axioms:{all:[],standard:[],custom:[]}}))),negativeControls:negativeNames.map(name=>({name,expectedRejected:true,rejected:true,exitCode:1,sourceSha256:sourceHash('lean/'+name+'.lean'),logFile:name+'.log',logSha256:h})),builds:['MathScope.M1.Arithmetic.Algebra','MathScope.M1.Arithmetic.Precision','MathScope.P8.Finite','MathScope.P8.Generated'].map(module=>({module,exitCode:0,sourceSha256:sourceHash('lean/'+module.replaceAll('.','/')+'.lean'),oleanSha256:h,logSha256:h})),consumerAudit:{exitCode:0,logSha256:h},environment:{leanVersion:`Lean (version ${pins.leanVersion}, commit ${pins.leanCommit})`,leanCommit:pins.leanCommit,mathlibCommit:pins.mathlibCommit,leanBinarySha256:h,runtimeLibrarySha256:h,lakeManifestSha256:h,importClosureSha256:h,importedModuleCount:100,kernelModified:false,runtimeModified:false}};
  const evidence={status:'RECORDED_CI_AUDIT',input,generatedSourceSHA256:sourceHash('lean/MathScope/P8/Generated.lean'),ci,audit};
  const expected={schema:'MathScope.M3.P8.ExpectedLeanContract/1',sourceFiles,targets,pins,negativeNames,input,inputManifestSha256:audit.inputManifestSha256,generatedSourceSHA256:evidence.generatedSourceSHA256,ci,auditSHA256:await sha256(audit)};
  const source={schema:'MathScope.M3.P8.SourceBinding/1',files,manifestSHA256:await sha256(files)};
  return cloneJSON({evidence,expected,source});
}
test('matching static receipt consistency never issues fresh kernel authority',async()=>{
  const {evidence,expected,source}=await fixture(),r=await validateRecordedLean(evidence,source,expected);
  assert.equal(r.ok,true,JSON.stringify(r.issues));assert.equal(r.status,'RECORDED_AUDIT_CONTRACT_MATCH');
  for(const key of ['freshKernelExecuted','formalLeanProofIssued','certificateIssued','wholeP8Complete','wholeM3Complete'])assert.equal(r[key],false);
});
test('the original vacuous source/target forgery is rejected even if its artifact digest is rehashed',async()=>{
  const f=await fixture();Object.assign(f.evidence.audit,{targets:[{}],sourceFiles:[],negativeControls:[],environment:{},sourceManifestSha256:'invented'});f.expected.auditSHA256=await sha256(f.evidence.audit);
  assert.equal((await validateRecordedLean(f.evidence,f.source,f.expected)).ok,false);
});
test('omitted/duplicate targets, axioms, scope and negatives fail beyond an updated audit hash',async()=>{
  const mutations=[a=>a.targets.pop(),a=>a.targets[1]=a.targets[0],a=>a.targets[0].type='False',a=>a.targets[0].axioms={all:['sorryAx'],standard:[],custom:['sorryAx']},a=>a.targets[0].axioms={all:['Classical.choice'],standard:[],custom:[]},a=>a.consumerManifest.pop(),a=>a.negativeControls.pop(),a=>a.negativeControls[0].exitCode=0,a=>a.builds[0].exitCode=1,a=>a.environment.kernelModified=true,a=>a.environment.leanCommit='3'.repeat(40),a=>a.wholeP8Complete=true,a=>a.serializedAuthority='TRUSTED',a=>a.inputManifestSha256='4'.repeat(64)];
  for(const mutation of mutations){const f=await fixture();mutation(f.evidence.audit);f.expected.auditSHA256=await sha256(f.evidence.audit);assert.equal((await validateRecordedLean(f.evidence,f.source,f.expected)).ok,false);}
});
test('source changes, omitted producer sources, input, generated file and CI mutations fail',async()=>{
  for(const mutate of [f=>f.evidence.ci.commit='5'.repeat(40),f=>f.evidence.ci.url='https://example.com/run',f=>f.evidence.input.prime='7',f=>f.evidence.generatedSourceSHA256='6'.repeat(64),f=>f.evidence.audit.sourceFiles.pop()]){const f=await fixture();mutate(f);assert.equal((await validateRecordedLean(f.evidence,f.source,f.expected)).ok,false);}
  const f=await fixture();f.source.files[0].sha256='7'.repeat(64);f.source.manifestSHA256=await sha256(f.source.files);const r=await validateRecordedLean(f.evidence,f.source,f.expected);assert.equal(r.ok,false);assert.equal(r.status,'RECORDED_AUDIT_SOURCE_STALE');
});
test('unrecorded build is explicit and null trusted contract cannot accept claimed evidence',async()=>{
  const f=await fixture();assert.equal((await validateRecordedLean({status:'NOT_YET_RECORDED'},f.source,null)).status,'NO_RECORDED_AUDIT');
  assert.equal((await validateRecordedLean(f.evidence,f.source,null)).ok,false);
});
