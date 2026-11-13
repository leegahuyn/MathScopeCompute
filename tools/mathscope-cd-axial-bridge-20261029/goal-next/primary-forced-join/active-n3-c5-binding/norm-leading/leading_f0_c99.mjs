// Join the original exact active bound with a pinned independently verified exterior C10 receipt.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [source,outerPath,out]=process.argv.slice(2);assert.ok(source&&outerPath&&out);
const sha=(alg,b)=>createHash(alg).update(b).digest('hex');
const outerBytes=await readFile(outerPath);assert.equal(sha('sha256',outerBytes),'a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb');
const outer=JSON.parse(outerBytes), navier=resolve(source,'research-ide/mathscope-m2/navier');
for(const [name,pin] of Object.entries(outer.source.pins)){
 const b=await readFile(resolve(navier,name));const header=Buffer.from(`blob ${b.length}\0`);
 assert.equal(sha('sha1',Buffer.concat([header,b])),pin,name);
}
assert.deepEqual(outer.domain.X,['Xplus=Xv*exp(1)','infinity']);
assert.equal(outer.scope.actualSourceF0ExteriorC10NumericallyBounded,true);
assert.equal(outer.scope.terminalHeatTransitionIncluded,true);
const root=resolve(navier,'actual-leading-all-order-jets.mjs'),module=await import(pathToFileURL(root).href);
const data=module.actualLeadingAllOrderJets({radialOrder:9,etaOrder:9});
assert.equal(data.pass,true);assert.ok(data.checks.every(x=>x.pass));
assert.equal(data.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
assert.deepEqual(data.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
const graph=data.normProgram.nodes,M=data.normProgram.roots.F0active,used=new Set(),stack=[M];
while(stack.length){const i=stack.pop();if(used.has(i))continue;used.add(i);const n=graph[i];
 if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum'].includes(n.op))stack.push(...n.args);
 else if(n.op==='integer_power')stack.push(n.args[0]);
 else assert.ok(['rational','source_parameter'].includes(n.op),`unexpected norm dependency ${n.op}#${i}`);
}
const result={schema:'MathScope.N7.OriginalLeadingF0C10FTCUpper/1',status:'CONDITIONAL_ACTIVE_AND_EXTERIOR_SOURCE_BOUND_EXACT_POSITIVE_EXPRESSION',
 sourceParameterSHA256:data.parameterExpressionSHA256,activeRoot:M,activeDomain:data.bounds.F0active.domain,outerSourceSHA256:sha('sha256',outerBytes),
 matchedOuterSourceBlobs:outer.source.pins,outerBound:outer.physicalBound,outerDomain:outer.domain,
 normGraph:{nodeCount:graph.length,sha256:sha('sha256',JSON.stringify(graph)),closureCount:used.size,closure:Object.fromEntries([...used].sort((a,b)=>a-b).map(i=>[i,graph[i]]))},
 upperExpression:'3 * (1 + C12EnvelopeR^2/2) * (2 + F0active_norm_root)',
 meaning:'Upper bound for all 45 F0 C8 FTC sums: on X<=Xplus use active M; outside use 2^-65343 Xv/X^(r+1)<1, for total derivative order at most 10. Each sqrt(1+u^2)<=2+M.',
 scope:'Same 12 outer source Git blobs and profile, not the same private live-family proof. No numerical endpoint, positive-order/target leaf, full K, or gate promotion.',release:'HOLD'};
await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,M,graph:result.normGraph.sha256,closure:used.size,outerBlobs:Object.keys(outer.source.pins).length}));
