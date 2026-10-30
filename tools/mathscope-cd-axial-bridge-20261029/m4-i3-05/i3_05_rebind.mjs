import {getShippedProofBundle} from './research-ide/mathscope-m0/proof.mjs';
import {verifyPinnedKernelArtifacts} from './research-ide/mathscope-m4/acceptance.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const originalRepo=process.env.MATHSCOPE_ORIGINAL_REPO || 'C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute';
const commit=process.env.MATHSCOPE_ORIGINAL_COMMIT || '9595b4de5a1065b694d225c0ad2a14d5aa4435a9';
const output=process.env.MATHSCOPE_I305_OUTPUT || path.join(path.dirname(fileURLToPath(import.meta.url)), 'i3_05_rebind_result.json');
const read=path=>execFileSync('git',['show',`${commit}:${path}`],{cwd:originalRepo,maxBuffer:16*1024*1024});
const b=getShippedProofBundle('m0-finite-d2');
const baseline=await verifyPinnedKernelArtifacts(b.jobSpec,b,read);
assert.equal(baseline.verified,true,baseline.reason);
const clone=x=>JSON.parse(JSON.stringify(x));
const cases={
  'one_character_source': j=>{j.sourceFiles[0].content+='\n';},
  'coefficient_expression': j=>{j.sourceFiles[0].content=j.sourceFiles[0].content.replace('v.c - v.a','v.c + v.a');},
  'assumption_added': j=>{j.assumptions.push({id:'test-assumption',statement:'True'});},
  'truncation_D': j=>{j.context.truncationD=2;},
  'group_G_context': j=>{j.context.group='SU2';},
  'prime_p_context': j=>{j.context.p=3;},
  'precision_context': j=>{j.context.precision=64;},
};
const results=[];
for(const [name,change] of Object.entries(cases)){
  const job=clone(b.jobSpec);change(job);
  const v=await verifyPinnedKernelArtifacts(job,b,read);
  results.push({name,verified:v.verified,code:v.code,reason:v.reason});
  assert.equal(v.verified,false,name);
  assert.equal(v.code,'STALE',name);
}
const sourceFiles=['research-ide/mathscope-m0/proof.mjs','research-ide/mathscope-m0/lean/shipped-proof-data.mjs','research-ide/mathscope-m4/criteria.mjs','research-ide/mathscope-m4/acceptance.mjs'];
const hashes=Object.fromEntries(sourceFiles.map(p=>[p,createHash('sha256').update(read(p)).digest('hex')]));
const out={criterion:'I3-05',sourceCommit:commit,target:b.jobSpec.target,
 baseline:{verified:baseline.verified,code:baseline.code,currentKernelExecuted:baseline.receipt.currentKernelExecuted,grantsM4CriterionAcceptance:baseline.receipt.grantsM4CriterionAcceptance},
 mutationCases:results,sourceHashes:hashes,
 scope:'Rebinding guard on one historical shipped finite proof only. Context-field changes are metadata mutations, not actual UI producer or fresh ProofJobs. Does not prove new-job generation or every G, Delta, p, precision, coefficient, assumption workflow. No criterion promotion.',
 status:'PARTIAL'};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
