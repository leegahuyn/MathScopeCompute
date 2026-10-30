import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createM4ProofJob,classifyM4ProofReuse,DEFAULT_M4_PROOF_INPUT as defaults} from './research-ide/mathscope-m4/proof-jobs.mjs';

// This exercises the exact source producer and reuse guard; it does not claim
// UI integration or a current kernel execution. All observations are bounded.
const base=await createM4ProofJob();
assert.equal(base.kernelPass,false);
const conditions={
 G:{G:'SU2'},delta:{delta:'D2'},p:{p:3},precision:{precision:32},
 coefficientFormula:{coefficientFormula:'[3,-3,5,7]'},coefficientField:{coefficientField:'Fp'},
 coefficients:{coefficients:['3','-3','5','7']},assumptions:{assumptions:[{id:'H.COMPLETE',statement:'supplied completeness'}]}
};
const rows=[];
for(const [name,patch] of Object.entries(conditions)){
 const current=await createM4ProofJob({...defaults,...patch});
 const digest=createHash('sha256').update(current.sources[0].content).digest('hex');
 assert.equal(digest,current.sources[0].sha256);
 assert.notEqual(current.jobId,base.jobId);assert.notEqual(digest,base.sources[0].sha256);
 const reuse=await classifyM4ProofReuse(current,{...base,status:'PASS',kernelPass:true});
 assert.equal(reuse.state,'STALE_SOURCE_OR_PARAMETERS');assert.equal(reuse.kernelPass,false);
 // Remove namespace and comments to see whether generated theorem body changes.
 const theorem=x=>x.sources[0].content.split('\n').find(line=>line.startsWith('theorem '));
 rows.push({name,jobId:current.jobId,sourceSha256:digest,reuse:reuse.state,kernelPass:reuse.kernelPass,theoremBodyChanged:theorem(current)!==theorem(base)});
}
const altered=JSON.parse(JSON.stringify(base));altered.sources[0].content+=' ';
const tamper=await classifyM4ProofReuse(altered,{...base,status:'PASS',kernelPass:true});
assert.equal(tamper.state,'INVALID_CURRENT_JOB');assert.equal(tamper.kernelPass,false);
const same=await classifyM4ProofReuse(base,{...base,status:'PASS',kernelPass:true});
assert.equal(same.state,'BINDING_MATCH_KERNEL_RECHECK_REQUIRED');assert.equal(same.kernelPass,false);
const result={criterion:'I3-05',commit:'9595b4de5a1065b694d225c0ad2a14d5aa4435a9',baseline:{jobId:base.jobId,sha256:base.sources[0].sha256},freshGeneratedJobs:rows,oneCharacterTamper:tamper,sameBindingForgedPass:same,
 findings:'Eight actual generator calls change job and source hash, reject prior PASS; only changed coefficient values affect theorem body. G, delta, p, precision, formula, field, assumptions affect metadata or namespace but do not instantiate different mathematics. No UI action or current Lean kernel execution performed.',status:'PARTIAL; no acceptance promotion'};
writeFileSync(new URL('./generated-jobs-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
