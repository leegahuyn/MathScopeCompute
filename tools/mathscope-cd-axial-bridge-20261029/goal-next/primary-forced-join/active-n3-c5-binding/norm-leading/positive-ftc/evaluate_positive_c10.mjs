import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [runtime,helper,thresholdPath,historicalPath,packetPath,out]=process.argv.slice(2);assert.ok(runtime&&helper&&thresholdPath&&historicalPath&&packetPath&&out);
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=[[helper,'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47'],[thresholdPath,'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],[historicalPath,'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'],[packetPath,'7e1fdbc5e4e6aa43da32c2ba98cd7b29ed178fbea0eb3160c767941f586b3fed']];
const contents=await Promise.all(pins.map(async([f,h])=>{const b=await readFile(f);assert.equal(sha(b),h,f);return b}));
const threshold=JSON.parse(contents[1]),historic=JSON.parse(contents[2]),packet=JSON.parse(contents[3]);
assert.deepEqual(packet.originalDefinitions,historic.definitions);assert.deepEqual(packet.trace.nonArithmeticBoundaries.map(x=>x.id),[239,257,275]);
const {sourceArithmetic}=await import(pathToFileURL(resolve(helper)).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const parameters=evaluateClosedArithmeticDefinitions(packet.originalDefinitions,N,{names:packet.trace.sourceParameters}).values;
const boundaries=new Map(packet.trace.nonArithmeticBoundaries.map(x=>[x.id,N.fromClosed(historic.boundaryIntervals[x.id])]));
const interpreter=tracedArithmeticEvaluator(packet.trace,N,{parameters,boundaries,maxNodeVisits:500000});
const endpoints={};console.log(JSON.stringify({phase:'parameters',names:parameters.size,roots:packet.roots}));
for(const [name,id] of Object.entries(packet.roots)){
 const interval=N.toClosed(interpreter.value(id));endpoints[name]={lower:{rational:'0'},upper:interval.upper};
 const progress={schema:'MathScope.N7.PositiveProfileC10FTCUpperProgress/1',status:'DIRECTED_PARTIAL_PROFILE_UPPERS',endpoints,sourcePacketSHA256:sha(contents[3]),arithmetic:N.report(),scope:'Selected positive F/U profile FTC upper bounds; source analytic premises and live private-family match remain required.'};
 await writeFile(out+'.'+name+'.partial.json',JSON.stringify(progress,null,2)+'\n');console.log(JSON.stringify({phase:'profile',name,operations:N.report().operations}));
}
const receipt={schema:'MathScope.N7.PositiveProfileC10FTCUpper/1',status:'DIRECTED_SIX_POSITIVE_PROFILE_FTC_UPPERS',sourcePacketSHA256:sha(contents[3]),sourceProfile:packet.sourceProfile,
 roots:packet.roots,endpoints,oldBoundaryIDs:[239,257,275],arithmetic:N.report(),trace:interpreter.report(),
 scope:'45 C8 FTC sums per selected source field/order. Bound derived from source C10 profile norms and original analytic premises. Does not join the same private live family, bound weighted target leaves or full K, or run numerical FTC quadrature.',release:'HOLD'};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,operations:receipt.arithmetic.operations}));
