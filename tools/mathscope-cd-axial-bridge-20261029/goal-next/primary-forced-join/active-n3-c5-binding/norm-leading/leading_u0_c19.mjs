// Reconstruct original finite leading U0 norm. No FTC norm or numerical quadrature.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [source,out,witnessPath='work/goal-next/continuation34/hosted-43296617887-n3/primary-c5-native.json',geometryPath='work/goal-next/whole-k-prefix/whole-k-exterior-cell.json']=process.argv.slice(2);assert.ok(source&&out);
const root=resolve(source,'research-ide/mathscope-m2/navier/actual-leading-all-order-jets.mjs');
const sourceHash=createHash('sha256').update(await readFile(root)).digest('hex');
assert.equal(sourceHash,'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d');
const wbytes=await readFile(witnessPath),gbytes=await readFile(geometryPath);
assert.equal(createHash('sha256').update(wbytes).digest('hex'),'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad');
assert.equal(createHash('sha256').update(gbytes).digest('hex'),'254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b');
const witness=JSON.parse(wbytes),geometry=JSON.parse(gbytes);
assert.equal(witness.status,'VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS');
assert.equal(witness.normRoot,18310069);assert.equal(witness.originalBackgroundC8.roots.Cslow_8,14220475);
assert.equal(witness.source.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
assert.ok(geometry.geometry.radialProof.includes('4*Xb<=Rstar^2'));
const profile=await import(pathToFileURL(resolve(source,'research-ide/mathscope-m2/navier/source-profile-data.mjs')).href);
assert.deepEqual(profile.PINNED_N3.parametersExactExpressions.K,{power:[{ref:'Pstar'},2]});
const mod=await import(pathToFileURL(root).href),data=mod.actualLeadingAllOrderJets({radialOrder:9,etaOrder:9});
assert.equal(data.pass,true);assert.ok(data.checks.every(x=>x.pass));
assert.equal(data.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
assert.deepEqual(data.bounds.U0.domain,{X:['0','infinity'],eta:['-1','1'],exactZeroAfter:'Xv'});
assert.equal(data.boundConvention.includes('mixed derivative'),true);
const graph=data.normProgram.nodes, U=data.normProgram.roots.U0, used=new Set(), stack=[U];
while(stack.length){const i=stack.pop();if(used.has(i))continue;used.add(i);const n=graph[i];
 if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum'].includes(n.op))stack.push(...n.args);
 else if(n.op==='integer_power')stack.push(n.args[0]);
 else assert.ok(['rational','source_parameter'].includes(n.op),`unexpected norm dependency ${n.op}#${i}`);
}
const result={schema:'MathScope.N7.OriginalLeadingU0C9Eta9FTCUpper/1',status:'CONDITIONAL_SOURCE_BOUND_EXACT_POSITIVE_EXPRESSION',
 sourceHash,sourceParameterSHA256:data.parameterExpressionSHA256,sourceFunctionIdentity:data.sourceFunctionIdentity,
 evidence:{nativeWitnessSHA256:'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad',nativeK:18310069,nativeCslow8:14220475,
  geometrySHA256:'254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b',geometryPremise:'4*Xb<=Rstar^2',
  sourceParameterK:'Pstar^2; distinct from native norm K#18310069'},
 request:{radialOrder:9,etaOrder:9},leadingU0Root:U,
 normGraph:{nodeCount:graph.length,sha256:createHash('sha256').update(JSON.stringify(graph)).digest('hex'),closureCount:used.size,
  closure:Object.fromEntries([...used].sort((a,b)=>a-b).map(i=>[i,graph[i]]))},
 upperExpression:'3 * (1 + C12EnvelopeR^2/2) * (1 + U0_norm_root)',
 expressionMeaning:'Exact symbolic common upper enclosure for all 45 complete four-face original FTC norms of partial_X^r partial_eta^e U0 with r+e<=8 on [Xa/2,2 Xb] x [-1,1], using the separately source-bound inequality 4 Xb <= C12EnvelopeR^2.',
 checks:data.checks,scope:'Leading U0 FTC leaf family only. No numerical endpoint, no F0/positive-order/target FTC bounds, no same-private-family live join, no complete K enclosure.',release:'HOLD'};
await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,U0:U,graph:result.normGraph.sha256,nodes:graph.length,closure:used.size,sourceHash},null,2));
