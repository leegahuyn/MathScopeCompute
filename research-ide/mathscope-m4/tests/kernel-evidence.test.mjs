import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyHostedKernelReplay,verifyCoreKernelReplay,isVerifiedM4KernelReadback,assessM4KernelGrade,CORE_RUN} from '../kernel-evidence.mjs';
import {buildFormalClaims,M4_OPEN_RESEARCH} from '../formal-claims.mjs';
import {createM4ProofJob,classifyM4ProofReuse,DEFAULT_M4_PROOF_INPUT} from '../proof-jobs.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const read=p=>readFile(new URL(p,new URL('../../../',import.meta.url)));
const git=p=>execFileSync('git',['show','HEAD:'+p],{cwd:root,maxBuffer:4000000});
test('two successful hosted runs rebind source, raw logs, compiled artifacts and exact Linux/mathlib pins',async()=>{
 for(const id of ['38394604031','38394614544']){const r=await verifyHostedKernelReplay(id);assert.equal(r.verified,true,r.status);assert.equal(r.targets.length,5);assert.equal(r.currentKernelExecuted,false);assert.equal(r.environment.leanCommit,'5045d0056413266e57c625dcd7c365b10e377c52');assert.equal(r.negativeControls.every(x=>x.exitCode===1&&x.rejectedForExpectedReason),true);assert.equal(isVerifiedM4KernelReadback(r),true);assert.equal(isVerifiedM4KernelReadback(JSON.parse(JSON.stringify(r))),false);}
});
test('forged receipt PASS, source hash, theorem type, axioms and archived compiler logs cannot inherit hosted authority',async()=>{
 for(const suffix of ['receipt.json','compile-finite.log','compile-analytic.log','compile-conditional.log','sources/MathScope/M0/Finite.lean','compiled/MathScope/M0/Finite.olean']){const p='research-ide/mathscope-m4/evidence/hosted-success/run38394604031/replay/'+suffix;const r=await verifyHostedKernelReplay('38394604031',{readArtifact:async path=>path===p?Buffer.from('FORGED PASS target: False axioms: []'):read(path)});assert.equal(r.verified,false);assert.match(r.status,/ARTIFACT_HASH_MISMATCH/);}
 assert.equal((await verifyHostedKernelReplay('38394604031')).verified,true,'negative attacks preserve original valid evidence');
});
test('changing a current source by one character prevents reuse of hosted PASS',async()=>{
 const r=await verifyHostedKernelReplay('38394604031',{readCurrentSource:p=>{const b=git(p);return p.endsWith('/Finite.lean')?Buffer.concat([b,Buffer.from(' ')]):b;}});assert.equal(r.verified,false);assert.match(r.status,/CURRENT_SOURCE_STALE/);
});
test('fresh core run has exact finite targets, a genuine axiom-free uniform-limit theorem and explicit user axiom isolation',async()=>{
 const r=await verifyCoreKernelReplay();assert.equal(r.verified,true,r.status);assert.equal(r.targets.length,14);const u=r.targets.find(t=>t.target.endsWith('uniform_limit_uniformly_continuous'));assert.deepEqual(u.axioms,[]);assert.match(u.targetType,/hUniform.*UniformConverges/s);assert.match(u.targetType,/∀ \(n : Nat\)/);const a=r.targets.find(t=>t.target.endsWith('assumed_cauchy_limit'));assert.deepEqual(a.userAxioms,['MathScope.M4.Conditional.assumedComplete']);assert.equal(a.grade,'USER_AXIOM_CONDITIONAL');assert.equal(r.negativeControls.every(x=>x.exitCode===1),true);assert.equal(r.mathlibCommit,null);assert.equal(r.generatedProofJob.kernelPass,true);
 for(const name of ['Finite','Analytic','Comparison']){const source=(await read('research-ide/mathscope-m4/lean/MathScope/M4/'+name+'.lean')).toString();assert.doesNotMatch(source,/^import .*\.(?:Open|Conditional)$/m);}
});
test('core byte or current source mutations are rejected and do not overwrite evidence',async()=>{
 const b=CORE_RUN.directory;for(const p of [b+'/receipt.json',b+'/compile-MathScope-M4-Analytic.log',b+'/sources/MathScope/M4/Finite.lean']){const r=await verifyCoreKernelReplay({readArtifact:async path=>path===p?Buffer.from('FORGED PASS'):read(path)});assert.equal(r.verified,false);assert.match(r.status,/ARTIFACT_HASH_MISMATCH/);}
 const r=await verifyCoreKernelReplay({readCurrentSource:async p=>Buffer.concat([await read(p),Buffer.from(' ')] )});assert.equal(r.verified,false);assert.match(r.status,/CURRENT_SOURCE_STALE/);assert.equal((await verifyCoreKernelReplay()).verified,true);
});
test('student and expert share eleven exact claim IDs, conditions and scope without promoting research open claims',async()=>{
 const r=await verifyCoreKernelReplay();const claims=buildFormalClaims(r);assert.equal(claims.length,11);for(const c of claims){assert.equal(c.student.claimId,c.expert.claimId);assert.equal(c.student.scope,c.expert.scope);assert.deepEqual(c.student.assumptionIds,c.expert.assumptionIds);assert.ok(c.expert.targetType);assert.equal(c.grantsOriginalCriterionAcceptance,false);}assert.throws(()=>buildFormalClaims(JSON.parse(JSON.stringify(r))),/raw kernel evidence/);assert.ok(M4_OPEN_RESEARCH.includes('BSD_UNIVERSAL'));assert.ok(M4_OPEN_RESEARCH.includes('GENERAL_G_CONTINUUM_QUANTUM_YM'));
});
test('unconditional build grade rejects actual kernel user-axiom dependency closure',async()=>{
 const r=await verifyCoreKernelReplay();const t=r.targets.find(t=>t.target.endsWith('assumed_cauchy_limit'));
 const bad=assessM4KernelGrade(r,t.target,'UNCONDITIONAL_FORMAL');assert.equal(bad.accepted,false);assert.equal(bad.status,'UNCONDITIONAL_CLOSURE_USER_AXIOM_REJECTED');assert.deepEqual(bad.userAxioms,['MathScope.M4.Conditional.assumedComplete']);
 const conditional=assessM4KernelGrade(r,t.target,'CONDITIONAL_FORMAL');assert.equal(conditional.accepted,true);assert.equal(conditional.closesResearchGate,false);assert.equal(assessM4KernelGrade(JSON.parse(JSON.stringify(r)),t.target,'UNCONDITIONAL_FORMAL').accepted,false);
});
test('G, delta, p, precision, coefficient formula, field and assumptions each generate a new source and ProofJob',async()=>{
 const base=await createM4ProofJob();for(const patch of [{G:'SU2'},{delta:'D2'},{p:3},{precision:32},{coefficientFormula:'[3,-3,5,7]'},{coefficientField:'Fp'},{coefficients:['3','-3','5','7']},{assumptions:[{id:'H.COMPLETE',statement:'supplied completeness'}]}]){const job=await createM4ProofJob({...DEFAULT_M4_PROOF_INPUT,...patch});assert.notEqual(job.jobId,base.jobId);assert.notEqual(job.sources[0].sha256,base.sources[0].sha256);assert.equal((await classifyM4ProofReuse(job,{...base,status:'PASS',kernelPass:true})).state,'STALE_SOURCE_OR_PARAMETERS');}assert.equal((await classifyM4ProofReuse(base,{...base,status:'PASS',kernelPass:true})).kernelPass,false);
});
test('one character generated-source mutation and source-injection inputs cannot reuse a prior check',async()=>{
 const job=await createM4ProofJob();const mutated=JSON.parse(JSON.stringify(job));mutated.sources[0].content+=' ';assert.equal((await classifyM4ProofReuse(mutated,job)).state,'INVALID_CURRENT_JOB');await assert.rejects(()=>createM4ProofJob({...DEFAULT_M4_PROOF_INPUT,coefficients:['0); axiom falsehood : False','0','0','0']}),/integer strings/);await assert.rejects(()=>createM4ProofJob({...DEFAULT_M4_PROOF_INPUT,coefficientFormula:'x\naxiom falsehood : False'}),/Invalid input/);
});
