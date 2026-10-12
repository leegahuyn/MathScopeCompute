/** Consistency checks for packaged CI observations. These never rerun a proof. */
import {assertJSON,sha256,canonicalJSON,cloneJSON,shape,freeze} from './common.mjs';
const HASH=/^[a-f0-9]{64}$/;
const same=(a,b)=>a!==undefined&&b!==undefined&&canonicalJSON(a)===canonicalJSON(b);
const need=(condition,message)=>{if(!condition)throw Error(message);};
const boundary={freshExecution:false,formalLeanProofIssued:false,wholeP8Complete:false,wholeM3Complete:false,certificateIssued:false};
function ci(value){shape(value,['repository','commit','runId','url','artifactId','artifactSHA256'],[],'recorded CI');need(value.repository==='leegahuyn/MathScopeCompute'&&/^[a-f0-9]{40}$/.test(value.commit)&&typeof value.runId==='string'&&/^[1-9][0-9]*$/.test(value.runId)&&value.url===`https://github.com/${value.repository}/actions/runs/${value.runId}`,'Invalid recorded CI identity.');need(Number.isSafeInteger(value.artifactId)&&value.artifactId>0&&HASH.test(value.artifactSHA256),'Invalid artifact identity.');}
function sources(rows,current,prefix,expected){need(Array.isArray(rows)&&rows.length>0,'Empty recorded sources.');const ids=new Set();for(const row of rows){shape(row,['path','sha256'],[],'recorded source');need(typeof row.path==='string'&&!ids.has(row.path)&&HASH.test(row.sha256),'Invalid recorded source.');ids.add(row.path);need(current.files.some(x=>x.path===prefix+row.path&&x.sha256===row.sha256),'Recorded source is stale: '+row.path);}need(same([...ids].sort(),[...expected].sort()),'Recorded source membership is incomplete or changed.');}
function flags(value,keys){for(const key of keys)need(value?.[key]===false,'Unsupported authority or completion: '+key);}
function timestamp(value){const n=typeof value==='string'?Date.parse(value):NaN;need(Number.isFinite(n),'Invalid process timestamp.');return n;}
const EDGES=[['zero-box','finite-height-record'],['finite-height-record','zero-coverage-comparison'],['zero-coverage-comparison','conditional-rh-review'],['rank-upper','rank-bound-record'],['rank-bound-record','curve-rank-equality'],['curve-rank-equality','bsd-review']];
const CONDITIONAL_SOURCES=['lean/conditional/ConditionalTarget.lean','lean/conditional/Audit.lean','tools/audit_conditional_lean.py','tools/audit_lean.py','lean/pins.json','lean/lean-toolchain','lean/lakefile.lean'];
const PARI_SOURCES=['p7/pari_runtime/pyproject.toml','p7/pari_runtime/setup.py','p7/pari_runtime/MANIFEST.in','p7/pari_runtime/src/mathscope_p7_pari/__init__.py','p7/pari_runtime/src/mathscope_p7_pari/build.py'];
function receipt(value,audit){
  need(value?.schema==='MathScope.M3.P7Execution/1'&&value.serializedAuthority==='UNTRUSTED_REQUIRES_REEXECUTION','Invalid compact P7 receipt.');flags(value,['formalLeanProofIssued','wholeP7Complete','wholeM3Complete']);
  for(const key of ['recordSHA256','mathematicalSHA256','inputSHA256','environmentSHA256','sourceBindingSHA256','predecessorSHA256'])need(HASH.test(value[key]),'Invalid P7 receipt hash.');
  const e=value.execution;need(e?.status==='COMPLETED'&&e.observedExitCode===0&&e.timedOut===false&&e.failure===null&&e.stderr==='','A P7 child did not complete cleanly.');
  need(e.maxSeconds===audit.maxSecondsPerChild&&e.memoryLimitMiB===audit.memoryLimitMiB,'P7 child resource request differs.');
  need(same(e.observedChildResourceLimits,{addressSpaceBytes:[e.memoryLimitMiB*1024**2,e.memoryLimitMiB*1024**2],cpuSeconds:[e.maxSeconds,e.maxSeconds+1]}),'Actual P7 resource limits differ.');
  need(e.observedChildEnvironmentSHA256===value.environmentSHA256,'Actual child environment differs.');
  need(Number.isFinite(e.elapsedSeconds)&&e.elapsedSeconds>=0&&e.elapsedSeconds<=e.maxSeconds+1,'Invalid child duration.');
  const start=timestamp(e.startedAt),finish=timestamp(e.finishedAt);need(start<=finish&&start>=timestamp(audit.startedAt)&&finish<=timestamp(audit.finishedAt),'Child execution is outside the audit interval.');
}
function dependency(row){
  const d=row.downstream;need(d?.scope==='DECLARED_AUDIT_DEPENDENCY_FIXTURE'&&d.direction==='PREREQUISITE_TO_DEPENDENT'&&d.changedNode===row.id&&same(d.edges,EDGES.map(([from,to])=>({from,to}))),'Mutation dependency graph changed.');
  const affected=new Set([row.id]);for(let n=0;n<EDGES.length;n++)for(const [a,b] of EDGES)if(affected.has(a))affected.add(b);
  need(same(d.revokedNodeIds,[...affected].sort()),'Incomplete downstream revocation.');
  const nodes=[...new Set([...EDGES.flat(),'unrelated-observation'])].sort();need(same(d.badges,nodes.map(id=>({id,status:affected.has(id)?'REVOKED':'UNCHANGED_UNVERIFIED_METADATA',proofAuthority:false}))),'A downstream badge retained or invented authority.');flags(d,['wholeApplicationGraphAudited','certificateIssued']);
}
function rational(value){need(typeof value==='string'&&value.length<=256&&/^-?\d+(?:\/[1-9]\d*)?$/.test(value),'Invalid exact endpoint.');const [n,d='1']=value.split('/');return [BigInt(n),BigInt(d)];}
function translated(a,b){const [an,ad]=rational(a),[bn,bd]=rational(b);return bn*ad===(an+ad)*bd;}
async function p7Details(data,current){
  const r=data.report,rankDeletion=r.schema==='MathScope.M3.P8.P7MutationAudit/2';need((rankDeletion||r.schema==='MathScope.M3.P8.P7MutationAudit/1')&&r.criterion==='P8-06','Wrong P7 audit schema.');flags(r,['originalP8CriterionComplete','certificateIssued']);
  const body={...r};delete body.reportSHA256;need(HASH.test(r.reportSHA256)&&await sha256(body)===r.reportSHA256,'P7 report digest differs.');
  shape(data.process,['schema','pytestExitCode','commit','runId'],[],'test process');need(data.process.schema==='MathScope.P8.TestProcessReceipt/1','Wrong process schema.');
  const h=r.testHarness;need(h?.sourceFile==='tests/test_p8_p7_mutations.py'&&h.auditStatus==='PASS'&&h.testProcessStatus==='NOT_YET_OBSERVED_AT_CLASS_TEARDOWN'&&h.testProcessExitCode===null&&h.allTestsPassed===null&&h.requiresIndependentCIProcessReceipt===true&&h.failureIsNotConvertedToSuccess===true,'The pre-exit hook has claimed test-process success.');
  need(current.files.some(x=>x.path==='mathscope-m3/'+h.sourceFile&&x.sha256===h.sourceSHA256),'P7 test source is stale.');
  const e=r.execution;need(Number.isInteger(e.maxSecondsPerChild)&&e.maxSecondsPerChild>=1&&e.maxSecondsPerChild<=300&&Number.isInteger(e.memoryLimitMiB)&&e.memoryLimitMiB>=128&&e.memoryLimitMiB<=4096&&timestamp(e.startedAt)<=timestamp(e.finishedAt),'Invalid audit resources.');
  const sourceHash=await sha256(r.sourceBinding),seen=new Set();let predecessor=null;
  for(const row of r.cases){
    const p=row.positiveControl,n=row.negativeControl;need(p.importedProofStatusAdopted===false&&n.unresolvedCountsAsRejection===false&&n.allPresentComputationHashesResealed===true&&n.mathematicalAndRecordHashesResealed===true&&row.originalRecordUnchanged===true,'Incomplete replay controls.');
    need(same(row.bindingPreserved,Object.fromEntries(['request','inputSHA256','sourceBinding','environment','environmentSHA256','predecessor'].map(k=>[k,true]))),'Missing replay binding.');
    need(row.request?.kind===(row.id==='zero-box'?'p7.zeta_zeros':rankDeletion?'p7.elliptic_arithmetic':'p7.elliptic_local'),'Wrong request kind.');
    if(row.id==='zero-box')need(row.request.input?.height==='20'&&row.request.input.precisionBits===128,'Wrong finite height/precision.');else need(row.request.input?.model==='37a1','Wrong rank fixture.');
    const inputHash=await sha256(row.request),receipts=[row.baseline,p.fresh,n.fresh,n.forged];
    for(const item of receipts){receipt(item,e);need(item.inputSHA256===inputHash&&item.sourceBindingSHA256===sourceHash&&item.environmentSHA256===row.baseline.environmentSHA256&&item.predecessorSHA256===row.baseline.predecessorSHA256,'Actual input/source/backend/predecessor binding differs.');}
    for(const item of receipts.slice(0,3)){need(!seen.has(item.recordSHA256),'Fresh child receipt reused.');seen.add(item.recordSHA256);}
    predecessor??=row.baseline.predecessorSHA256;need(predecessor===row.baseline.predecessorSHA256,'The cases use different predecessor gates.');
    need(p.fresh.mathematicalSHA256===row.baseline.mathematicalSHA256&&n.fresh.mathematicalSHA256===row.baseline.mathematicalSHA256&&n.forged.mathematicalSHA256!==row.baseline.mathematicalSHA256&&n.forged.recordSHA256!==row.baseline.recordSHA256,'The negative replay did not distinguish changed mathematics.');
    const axes=row.id==='zero-box'||rankDeletion?['source','precision','input']:['source','input'];need(Array.isArray(row.bindingRejectionControls)&&same(row.bindingRejectionControls.map(x=>x.axis),axes),'Missing source/input/precision rejection controls.');
    for(const c of row.bindingRejectionControls)need(c.status==='REJECTED'&&c.stage==='P7_VALIDATE_RECORD_BEFORE_REPLAY'&&c.outerAndMathematicalHashesResealed===true&&c.originalInputHashPreserved===true&&c.proofStatusAdopted===false&&typeof c.reason==='string'&&c.reason.length>0,'Invalid binding rejection control.');
    flags(row,['certificateIssued']);flags(row.mathematicalScope,['globalRHProved','globalBSDProved']);
    if(rankDeletion)need(row.mathematicalScope.rankUpperBoundComputed===(row.id==='rank-upper')&&row.mathematicalScope.rankUpperBoundStatus===(row.id==='rank-upper'?'CERTIFIED_ARITHMETIC_UPPER':'NOT_APPLICABLE'),'The actual arithmetic bound scope differs.');
    else {flags(row.mathematicalScope,['rankUpperBoundComputed']);need(row.mathematicalScope.rankUpperBoundStatus==='OPEN','Legacy open rank scope changed.');}
    need(row.mathematicalScope.mutationDetection==='FRESH_P7_RESULT_COMPARISON'&&row.mathematicalScope.finiteHeightOnly===(row.id==='zero-box'),'P7 mathematical scope was promoted.');
    const changes=n.mutations;
    if(row.id==='zero-box'){need(changes?.length===1&&changes[0].fieldPath==='result.hardyRoots[0]','Missing box mutation.');const {before,after}=changes[0];need(translated(before.lower,after.lower)&&translated(before.upper,after.upper)&&before.bracketWidth===after.bracketWidth,'Box translation or width changed.');}
    else if(rankDeletion){
      need(changes?.length===1&&changes[0].fieldPath==='result.arithmeticRank.rankUpperCertificate'&&changes[0].operation==='DELETE_VALID_CERTIFICATE'&&changes[0].after===null&&same(changes[0].rankIntervalPreserved,{lowerBound:1,upperBound:1,exactRank:1}),'Missing deletion of an actual valid rank upper certificate.');
      const c=changes[0].before;need(c?.schema==='MathScope.M3.P7.ArithmeticRankUpperCertificate/1'&&c.status==='CERTIFIED_ARITHMETIC_UPPER'&&c.upperBound===1&&c.twoSelmerRank===1&&c.rationalTwoTorsionRank===0&&c.casselsPairingRank===0&&c.freshProcessExecuted===true,'The removed prerequisite was not a valid arithmetic rank bound.');
      flags(c,['databaseLookupUsed','analyticRankUsed','BSDOrParityConjectureAssumed','formalLeanProofIssued']);
      for(const key of ['modelHash','originalModelHash','certificateSHA256','pariReceiptSHA256','executionScriptSHA256','executionStdoutSHA256'])need(HASH.test(c[key]),'Missing removed rank certificate binding.');
      need(c.modelHash===c.originalModelHash&&c.backend?.version==='2.19.0'&&c.backend.sourceArchiveSHA256==='f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d'&&HASH.test(c.backend.binarySHA256)&&HASH.test(c.backend.buildProvenanceSHA256)&&c.backend.databasesUsed===false&&c.backend.observedVersionMatchesBuild===true,'Wrong arithmetic runtime or model binding.');
      need(c.exactTwoCovers?.length===1&&c.coverMapChecks?.length===1&&c.coverMapChecks[0].exactRationalMapIdentityChecked===true&&HASH.test(c.coverMapChecks[0].coverSHA256)&&await sha256(c.exactTwoCovers[0])===c.coverMapChecks[0].coverSHA256,'Incomplete checked 2-cover map.');
      const certificateBody={...c};delete certificateBody.certificateSHA256;need(await sha256(certificateBody)===c.certificateSHA256,'Removed rank certificate digest differs.');
    }else {need(changes?.length===2&&changes[0].fieldPath==='result.arithmeticRank'&&changes[1].fieldPath==='result.scope.arithmeticRankUpperBoundComputed','Missing rank mutation.');const {before,after}=changes[0];need(before.lowerBound===1&&before.upperBound===null&&before.exactRank===null&&before.descentPerformed===false&&before.selmerBoundComputed===false&&after.upperBound===1&&after.exactRank===1&&after.descentPerformed===true&&after.selmerBoundComputed===true&&same(after.upperBoundCertificate,{kind:'FORGED_SELMER_UPPER_BOUND',bound:1,verified:true})&&changes[1].before===false&&changes[1].after===true,'Missing open baseline or forged rank certificate.');}
    dependency(row);
  }
}
function literalConditional(r){
  const axiom='MathScope.P8.Conditional.assumedTarget',target='MathScope.P8.Conditional.conditional_target';need(r?.status==='CONDITIONAL_SOURCE_CHECKED_AND_REMOVAL_REJECTED'&&r.proofGrade==='CONDITIONAL_ON_TARGET'&&r.independentTargetProved===false&&r.unconditionalFiniteAudit===false,'Conditional boundary missing.');
  need(r.targets?.length===2&&r.targets[0].name===axiom&&r.targets[1].name===target,'Missing conditional consumers.');
  for(const t of r.targets)need(typeof t.type==='string'&&t.type.startsWith(t.name+' :')&&same(t.axioms,{all:[axiom],standard:[],custom:[axiom]}),'Conditional type/axioms differ.');
  need(r.targets[0].type.slice((axiom+' :').length)===r.targets[1].type.slice((target+' :').length),'Assumption is not the literal target.');
  need(same(r.axiomLedger,{target,assumption:axiom,sameLiteralProposition:true,customAxioms:[axiom],standardAxioms:[],status:'CONDITIONAL_ON_TARGET'}),'Conditional ledger mismatch.');
}
function leanCommand(row,success,suffix){need(Array.isArray(row?.command)&&row.command.slice(0,3).join(' ')==='lake env lean'&&row.command.some(x=>typeof x==='string'&&x.endsWith(suffix))&&Number.isInteger(row.exitCode)&&(success?row.exitCode===0:row.exitCode>0)&&Number.isFinite(row.seconds)&&row.seconds>=0&&HASH.test(row.logSha256)&&typeof row.logFile==='string','Invalid recorded Lean command.');}
export async function validateRecordedChecks(data,current,expected){
  if(data===null||data===undefined)return freeze({status:'NOT_RECORDED',ok:false,...boundary});
  try{
    assertJSON(data,4*1024*1024);assertJSON(current,4*1024*1024);
    data=cloneJSON(data);current=cloneJSON(current); // Snapshot before the first await.
    shape(data,['kind','ci','report'],['process'],'recorded package');
    need(HASH.test(expected)&&await sha256(data)===expected,'Packaged CI observation digest mismatch.');ci(data.ci);
    need(Array.isArray(current.files)&&current.files.length>0,'Missing current sources.');const currentPaths=new Set();
    for(const row of current.files){need(typeof row.path==='string'&&/^[A-Za-z0-9_.\-/]+$/.test(row.path)&&!row.path.startsWith('/')&&!row.path.split('/').some(p=>p==='..'||p==='')&&!currentPaths.has(row.path)&&HASH.test(row.sha256),'Invalid or duplicate current source.');currentPaths.add(row.path);}
    const r=data.report;need(r?.serializedAuthority==='UNTRUSTED_REQUIRES_REEXECUTION','Serialized observations must remain untrusted.');
    for(const key of ['wholeP8Complete','wholeM3Complete','formalLeanProofIssued'])need(r[key]===false,'Recorded observation exceeds its scope.');
    if(data.kind==='P7_MUTATIONS'){
      need(r.status==='PASS'&&r.cases?.length===2&&same(r.cases.map(x=>x.id),['zero-box','rank-upper']),'Expected both actual P7 mutation controls.');
      need(data.process.pytestExitCode===0&&data.process.commit===data.ci.commit&&String(data.process.runId)===String(data.ci.runId),'Independent test process failed or belongs to another run.');
      const rankDeletion=r.schema==='MathScope.M3.P8.P7MutationAudit/2';
      const expectedP7=current.files.map(x=>x.path).filter(p=>p==='mathscope-m3/cli.py'||/^mathscope-m3\/p7\/[^/]+\.py$/.test(p)||(rankDeletion&&PARI_SOURCES.some(source=>p==='mathscope-m3/'+source))).map(p=>p.slice('mathscope-m3/'.length));
      need(expectedP7.includes('cli.py')&&expectedP7.includes('p7/zero_certificate.py')&&expectedP7.includes('p7/elliptic_local.py')&&r.sourceBinding?.version===(rankDeletion?'0.3.0':'0.2.0'),'Missing current P7 source core/version.');
      if(rankDeletion)need(PARI_SOURCES.every(path=>expectedP7.includes(path))&&['p7/elliptic_arithmetic.py','p7/pari_backend.py','p7/height_certificate.py','p7/period_certificate.py'].every(path=>expectedP7.includes(path)),'Missing pinned arithmetic runtime/source membership.');
      sources(r.sourceBinding?.files,current,'mathscope-m3/',expectedP7);
      need(current.files.some(x=>x.path==='mathscope-m3/p8/tools/audit_p7_mutations.py'&&x.sha256===r.auditSourceSHA256),'P7 mutation audit source is stale.');
      need(r.execution.freshP7ChildExecutions===6&&r.arithmeticRankUpperBoundComputed===rankDeletion&&(!rankDeletion||r.validRankUpperCertificateDeletionExecuted===true)&&r.globalRHProved===false&&r.globalBSDProved===false,'Incorrect P7 replay count or scope.');
      for(const row of r.cases){need(row.status==='PASS'&&row.positiveControl.status==='MATCH'&&row.positiveControl.passed===true&&row.negativeControl.status==='MISMATCH_OR_UNRESOLVED'&&row.negativeControl.passed===true,'P7 control did not pass.');need(row.negativeControl.freshCompletedRequired===true&&row.negativeControl.structuralValidationPassedBeforeReplay===true&&row.negativeControl.importedProofStatusAdopted===false&&Object.values(row.bindingPreserved).every(x=>x===true),'Incomplete fresh P7 replay or changed binding.');}
      await p7Details(data,current);
    }else if(data.kind==='CONDITIONAL_LEAN'){
      need(r.status==='CONDITIONAL_SOURCE_CHECKED_AND_REMOVAL_REJECTED'&&r.proofGrade==='CONDITIONAL_ON_TARGET'&&r.independentTargetProved===false&&r.unconditionalFiniteAudit===false,'Conditional proof boundary missing.');
      need(r.schema==='MathScope.M3.P8.ConditionalLeanAudit/1','Wrong conditional schema.');literalConditional(r);
      sources(r.sourceFiles,current,'mathscope-m3/p8/',CONDITIONAL_SOURCES);
      need(await sha256(r.sourceFiles)===r.sourceManifestSha256,'Conditional source manifest differs.');
      const axiom='MathScope.P8.Conditional.assumedTarget',target='MathScope.P8.Conditional.conditional_target';
      need(r.targets?.length===2&&r.targets[0].name===axiom&&r.targets[1].name===target,'Missing conditional consumers.');
      for(const t of r.targets){need(same(t.axioms,{all:[axiom],standard:[],custom:[axiom]})&&await sha256(t.type)===t.typeSha256,'Conditional type or actual custom axiom changed.');}
      need(r.axiomLedger.status==='CONDITIONAL_ON_TARGET'&&r.axiomLedger.sameLiteralProposition===true&&r.axiomLedger.assumption===axiom,'Conditional assumption ledger mismatch.');
      need(r.removal.sourceRegenerated===true&&r.removal.rejected===true&&r.removal.expectedRejected===true&&r.removal.commandResult.exitCode>0&&r.build.exitCode===0&&r.consumerAudit.exitCode===0,'The axiom removal was not freshly rejected.');
      leanCommand(r.build,true,'conditional/ConditionalTarget.lean');leanCommand(r.consumerAudit,true,'conditional/Audit.lean');leanCommand(r.removal.commandResult,false,'RemovedAssumption.lean');
      need(r.build.command.includes('--root=conditional')&&r.consumerAudit.command.includes('--root=conditional')&&HASH.test(r.positiveOleanSha256)&&r.removal.sourceFile==='RemovedAssumption.lean'&&HASH.test(r.removal.sourceSha256)&&r.removal.expectedDiagnostic==='Unknown identifier assumedTarget','Missing conditional build/removal provenance.');
      const pins=current.files.find(x=>x.path==='mathscope-m3/p8/lean/pins.json');need(pins&&r.environment.leanCommit==='5045d0056413266e57c625dcd7c365b10e377c52'&&r.environment.mathlibCommit==='d13f23b723b8a846827a245b89c10fc7d3f11612'&&r.environment.kernelModified===false&&r.environment.runtimeModified===false,'Conditional environment differs.');
      for(const key of ['leanBinarySha256','runtimeLibrarySha256','importClosureSha256'])need(HASH.test(r.environment[key]),'Missing conditional runtime fingerprint.');
      need(typeof r.environment.leanVersion==='string'&&/version\s+4\.34\.1(?:\D|$)/.test(r.environment.leanVersion)&&r.environment.leanVersion.includes(r.environment.leanCommit.slice(0,12))&&Number.isSafeInteger(r.environment.importedModuleCount)&&r.environment.importedModuleCount>0,'Conditional version/closure differs.');timestamp(r.checkedAt);
    }else throw Error('Unsupported recorded check.');
    return freeze({status:'RECORDED_CI_SOURCE_MATCH',ok:true,ci:data.ci,report:r,process:data.process??null,verificationScope:'Packaged digest, source membership and consistency of recorded process observations only.',archiveBytesVerifiedInBrowser:false,rawP7RecordHashesRecomputed:false,...boundary});
  }catch(error){return freeze({status:'RECORDED_CI_REJECTED',ok:false,issues:[String(error.message)],...boundary});}
}
export function conditionalLedger(report){
  assertJSON(report);report=cloneJSON(report);literalConditional(report);
  const claimId='claim:conditional-ci',propositionId='P8.CONDITIONAL.LITERAL_GOAL',a=report.targets[0],t=report.targets[1],id='assumption:conditional-ci';
  return {schema:'MathScope.M3.P8.AssumptionLedger/1',target:{claimId,declaration:t.name,propositionId,type:t.type},entries:[{id,revision:'1',kind:'USER_AXIOM',declaration:a.name,propositionId,statement:a.type,sourceRefs:[]}],dependencyGraph:{direction:'CLAIM_TO_PREREQUISITE',nodes:[{id:claimId,kind:'theorem',statement:t.type,propositionId,declaration:t.name},{id,kind:'user_axiom',statement:a.type,propositionId,declaration:a.name}],edges:[{from:claimId,to:id,type:'DEPENDS_ON'}]}};
}
