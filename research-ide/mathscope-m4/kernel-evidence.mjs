import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getShippedProofBundle,listShippedProofs} from '../mathscope-m0/proof.mjs';
import {requirePinnedKernelEnvironment,requirePinnedDependencyManifest,auditExactTargetLog,intendedNegativeControl,OFFICIAL_LEAN_LINUX_ARCHIVE} from './tools/pinned-kernel-contract.mjs';
import {validateArtifactPath} from './acceptance.mjs';
import {createM4ProofJob} from './proof-jobs.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const authority=new WeakSet();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const anchors=freeze({
 '38394604031':{receipt:'8ff837a9fc2699579b6f34a4ab31125f5bd00774115b2610fc3e7545671290fe',readback:'f6adce62982bfd8402849f2feb9ffddec40898f993198417ffc111973d174a2b',archive:'aeef510fad9eb804e4eac082e4bd6660a3423c06c12bdcc9fd16ecc934aaa284',sourceCommit:'f1206131fb87c929d89b5fcc8edf248e66692ac0',headSha:'f1206131fb87c929d89b5fcc8edf248e66692ac0'},
 '38394614544':{receipt:'48a1fa692d03b9fb15e0941f0d1199ff41ffab5dd9a56c3b6d16c99fc800d4d5',readback:'a63cc290759528b41af91cfac5b3ec53f61efd9b6967e973d8cf894183662359',archive:'3c998162032d99e137a16ec03bbe771150c70d9aaa729184c47b3e18ea687c1f',sourceCommit:'ef7a21f39b5caf5caa88588fcd8340316208df6b',headSha:'f1206131fb87c929d89b5fcc8edf248e66692ac0'},
});
export const CORE_RUN=Object.freeze({directory:'research-ide/mathscope-m4/evidence/core-kernel-20261014-attempt2',receiptSha256:'fdec6e1b3538c21e929614d60e64a8a062da22564e07a4dcb63597a3b6f2e027'});
export const isVerifiedM4KernelReadback=x=>Boolean(x&&authority.has(x));
export function assessM4KernelGrade(readback,targetName,requestedGrade){
 if(!isVerifiedM4KernelReadback(readback))return {accepted:false,status:'RAW_KERNEL_REBINDING_REQUIRED'};
 const target=readback.targets.find(t=>t.target===targetName);
 if(!target)return {accepted:false,status:'EXACT_TARGET_REQUIRED'};
 const custom=target.axioms.filter(a=>!['propext','Classical.choice','Quot.sound'].includes(a));
 if(requestedGrade==='UNCONDITIONAL_FORMAL'&&custom.length)return {accepted:false,status:'UNCONDITIONAL_CLOSURE_USER_AXIOM_REJECTED',userAxioms:custom};
 if(requestedGrade==='EXACT_FINITE'&&/\.(?:Analytic|Comparison|Conditional)\./.test(targetName))return {accepted:false,status:'NONFINITE_TARGET_SCOPE'};
 if(!['UNCONDITIONAL_FORMAL','CONDITIONAL_FORMAL','EXACT_FINITE'].includes(requestedGrade))return {accepted:false,status:'INVALID_GRADE'};
 return {accepted:true,status:'EXACT_TARGET_GRADE_BOUND',target:targetName,requestedGrade,axioms:target.axioms,userAxioms:custom,scope:target.scope||target.targetType,closesResearchGate:false};
}
const disk=p=>readFile(new URL(p.replaceAll('\\','/'),new URL('../../',import.meta.url)));
const currentGit=p=>execFileSync('git',['show',`HEAD:${validateArtifactPath(p)}`],{cwd:root,maxBuffer:4000000});
async function checked(read,path,expected){validateArtifactPath(path);const bytes=await read(path);if(sha(bytes)!==expected)throw new Error('ARTIFACT_HASH_MISMATCH:'+path);return bytes;}
const parse=b=>JSON.parse(b.toString('utf8'));
function types(log){return [...log.matchAll(/'(MathScope\.[^']+)' (?:does not depend on any axioms|depends on axioms:\s*\[([^\]]*)\])/g)].map(m=>({target:m[1],targetType:log.slice(log.lastIndexOf(m[1],m.index-1),m.index).trim(),axioms:(m[2]||'').split(',').map(x=>x.trim()).filter(Boolean).sort()}));}
function result(value){freeze(value);authority.add(value);return value;}

/** Exact reviewed hosted success, rebound to raw archive/log/source/olean bytes.
 * This confirms the dated run; it never claims a kernel executed on readback. */
export async function verifyHostedKernelReplay(runId,{readArtifact=disk,readCurrentSource=currentGit}={}) {
 try {
  if(!Object.hasOwn(anchors,runId))throw new Error('UNREVIEWED_RUN');const pin=anchors[runId];
  const base=`research-ide/mathscope-m4/evidence/hosted-success/run${runId}`;
  const provenance=parse(await checked(readArtifact,base+'/github-readback.json',pin.readback));
  await checked(readArtifact,base+'/archive.zip',pin.archive);
  const r=parse(await checked(readArtifact,base+'/replay/receipt.json',pin.receipt));
  if(provenance.conclusion!=='success'||provenance.status!=='completed'||provenance.headSha!==pin.headSha||r.sourceCommit!==pin.sourceCommit||provenance.artifact.digest!==`sha256:${pin.archive}`)throw new Error('HOSTED_PROVENANCE_MISMATCH');
  if(r.exitCode!==0||!r.actualKernelExecuted||!r.allPinnedTargetsVerified||r.grantsM4FinalAcceptance||r.archiveSha256!==OFFICIAL_LEAN_LINUX_ARCHIVE.sha256)throw new Error('HOSTED_KERNEL_SUCCESS_REQUIRED');
  const bundles=listShippedProofs().map(x=>getShippedProofBundle(x.id));
  requirePinnedKernelEnvironment(r.actualEnvironment,bundles[0].jobSpec.environment);
  const mathlibBytes=await checked(readArtifact,base+'/replay/mathlib-lake-manifest.json',r.actualEnvironment.mathlibLakeManifestSha256);
  const projectBytes=await checked(readArtifact,base+'/replay/project-lake-manifest.json',r.actualEnvironment.projectLakeManifestSha256);
  requirePinnedDependencyManifest(parse(projectBytes),parse(mathlibBytes),r.actualEnvironment.mathlibCommit);
  for(const source of r.sources){const path=['lakefile.lean','lean-toolchain'].includes(source.path)?source.path:'sources/'+source.path;await checked(readArtifact,base+'/replay/'+path,source.sha256);if(sha(await readCurrentSource('research-ide/mathscope-m0/lean/'+source.path))!==source.sha256)throw new Error('CURRENT_SOURCE_STALE:'+source.path);}
  const logs=new Map();
  for(const e of r.executions){const log=(await checked(readArtifact,base+'/replay/'+e.logPath,e.logSha256)).toString('utf8');logs.set(e.name,log);if(e.compiledArtifact)await checked(readArtifact,base+'/replay/'+e.compiledArtifact.path,e.compiledArtifact.sha256);if(e.name.startsWith('compile-')&&(e.exitCode!==0||e.warnings.length||/sorryAx|warning:/.test(log)))throw new Error('KERNEL_AUDIT_FAILED:'+e.name);}
  const targets=bundles.map(b=>auditExactTargetLog(logs.get('compile-'+b.audit.target.split('.')[2].toLowerCase()),b));
  for(const c of r.negativeControls)if(!intendedNegativeControl(c.name,c.exitCode,logs.get('negative-'+c.name.toLowerCase())))throw new Error('NEGATIVE_REASON_MISMATCH');
  return result({verified:true,status:'DATED_HOSTED_KERNEL_BYTES_VERIFIED',runId,runUrl:provenance.runUrl,headSha:pin.headSha,sourceCommit:pin.sourceCommit,executedAt:r.finishedAt,environment:r.actualEnvironment,targets,negativeControls:r.negativeControls,elapsedMilliseconds:r.elapsedMilliseconds,currentKernelExecuted:false,grantsM4FinalAcceptance:false,receiptSha256:pin.receipt});
 }catch(e){return {verified:false,status:String(e.message),grantsM4FinalAcceptance:false};}
}

export async function verifyCoreKernelReplay({readArtifact=disk,readCurrentSource=disk}={}) {
 try {
  const base=CORE_RUN.directory;const r=parse(await checked(readArtifact,base+'/receipt.json',CORE_RUN.receiptSha256));
  if(r.exitCode!==0||r.status!=='NEW_CORE_FINITE_AND_UNIFORM_LIMIT_KERNEL_VERIFIED'||r.usesMathlib||r.mathlibCommit!==null)throw new Error('CORE_KERNEL_SUCCESS_REQUIRED');
  const targets=[];let userAxiomSeen=false;
  const generated=await createM4ProofJob(r.generatedProofJob.parameters);
  if(generated.bindingDigest!==r.generatedProofJob.bindingDigest)throw new Error('GENERATED_JOB_STALE');
  for(const s of r.sources){await checked(readArtifact,base+'/sources/'+s.path,s.sha256);if(s.path.startsWith('MathScope/')){const prefix=s.path.includes('/M4/')?'mathscope-m4':'mathscope-m0';const current=s.path==='MathScope/M4/Generated.lean'?Buffer.from(generated.sources[0].content):prefix==='mathscope-m0'?await currentGit('research-ide/'+prefix+'/lean/'+s.path):await readCurrentSource('research-ide/'+prefix+'/lean/'+s.path);if(sha(current)!==s.sha256)throw new Error('CURRENT_SOURCE_STALE:'+s.path);}}
  for(const e of r.executions){const log=(await checked(readArtifact,base+'/'+e.logPath,e.logSha256)).toString('utf8');if(e.name.startsWith('compile-')){if(e.exitCode!==0||e.warnings.length||/sorryAx|warning:/.test(log))throw new Error('CORE_COMPILE_AUDIT');const file=e.args.at(-1).replace(/^sources\//,'').replace('.lean','.olean');await checked(readArtifact,base+'/compiled/'+file,e.compiledSha256);for(const t of types(log)){const userAxioms=t.axioms.filter(a=>!['propext','Classical.choice','Quot.sound'].includes(a));if(userAxioms.length&&!t.target.startsWith('MathScope.M4.Conditional.'))throw new Error('UNCONDITIONAL_USER_AXIOM');if(userAxioms.length)userAxiomSeen=true;targets.push({...t,userAxioms,grade:userAxioms.length?'USER_AXIOM_CONDITIONAL':/\.(Analytic|Comparison)\./.test(t.target)?'CONDITIONAL_FORMAL':'EXACT_FINITE'});}}}
  for(const c of r.negativeControls){const e=r.executions.find(e=>e.name===c.name);const log=(await readArtifact(base+'/'+e.logPath)).toString('utf8');if(c.exitCode!==1||e.exitCode!==1||!c.rejectedForExpectedReason||!log.includes(c.name==='NegativeFalse'?'rfl':'decide')||/unknown module prefix|object file .*does not exist/.test(log))throw new Error('CORE_NEGATIVE_REASON_MISMATCH');}
  if(!userAxiomSeen||targets.length!==14||!targets.some(t=>t.target===generated.target))throw new Error('CORE_TARGET_AUDIT_INCOMPLETE');
  return result({verified:true,status:'NEW_CORE_KERNEL_BYTES_VERIFIED',executedAt:r.finishedAt,environment:r.environment,mathlibCommit:null,targets,negativeControls:r.negativeControls,generatedProofJob:{...generated,kernelPass:true,status:'EXACT_GENERATED_FIXTURE_KERNEL_VERIFIED',scope:r.generatedProofJob.scope},currentKernelExecuted:false,grantsM4FinalAcceptance:false,receiptSha256:CORE_RUN.receiptSha256});
 }catch(e){return {verified:false,status:String(e.message),grantsM4FinalAcceptance:false};}
}
