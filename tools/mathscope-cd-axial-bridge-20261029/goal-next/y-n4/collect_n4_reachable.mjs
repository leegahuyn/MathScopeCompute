/** Typed structural traversal of the original N=2 current/pressure graph.
 * Synthetic empty coupled layer adds no definitions and must never be used
 * as evidence of a complete coupled/Forced registry. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import readline from 'node:readline';import {createGunzip} from 'node:zlib';
import {exactOriginalSourceNodeChildren as children} from '../../goal-20261111/y/exact_original_node_children.mjs';
import {loadOriginalExtendedNativeRegistry as load,nativeSemanticDefinitionEdges as defs} from '../../goal-20261111/y/original_native_semantic_definitions.mjs';
const [dir,out]=process.argv.slice(2);assert.ok(dir&&out);
const N=7358162,hash='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd',regHash='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad';
const H=x=>createHash('sha256').update(x).digest('hex');const registryBytes=fs.readFileSync(path.join(dir,'original-source-functions.json'));assert.equal(H(registryBytes),regHash);
const original=JSON.parse(registryBytes),synthetic={base:original,counts:[0,0,0,0,0],definitions:'[[],[],[],[],[]]'},registry=load(synthetic);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'original-source-export-manifest.json')));assert.equal(manifest.node_stream_sha256,hash);assert.equal(manifest.node_count,N);assert.equal(manifest.function_registry_capture_kind,'RAW_BASE_ONLY');
const roots=manifest.original_root_ids;assert.deepEqual(roots,[4608335,4608349,4608355,4608391,4608374,4608389,4599023,4587664,4599550,4582068,4582117,4582180,4582258,4582351]);
const offsets=new Uint32Array(N+1),edges=new Uint32Array(40000000),native=new Map(),unresolved=new Map(),natural=[];let count=0,ec=0;
const digest=createHash('sha256');const gz=fs.createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip());gz.on('data',x=>digest.update(x));let first=true;
for await(const line of readline.createInterface({input:gz,crlfDelay:Infinity})){
 const node=JSON.parse(line);if(first){assert.equal(node.node_count,N);first=false;continue;}
 assert.ok(count<N);offsets[count]=ec;const ch=children(node);for(const id of ch){assert.ok(id<count);assert.ok(ec<edges.length);edges[ec++]=id;}
 if(node.op==='actual_natural_series')natural.push({id:count,component:node.args[0],y:node.args[1],eta:node.args[2],radialOrder:node.args[3],etaOrder:node.args[4]});
 else if(node.op.startsWith('actual_')||node.op.startsWith('m3_')){
  try{const d=defs(node,registry);if(d?.resolved)native.set(count,d.bodyRoots);else if(d)unresolved.set(count,{op:node.op,detail:d.blocker??'unresolved'});else unresolved.set(count,{op:node.op,detail:'no typed definition rule'});}
  catch(e){unresolved.set(count,{op:node.op,detail:String(e.message)});}
 }
 count++;
}
offsets[N]=ec;assert.equal(count,N);assert.equal(digest.digest('hex'),hash);
const reached=new Uint8Array(N),queue=[],entries=new Set();function push(i){assert.ok(Number.isSafeInteger(i)&&i>=0&&i<N);if(!reached[i]){reached[i]=1;queue.push(i);}}
roots.forEach(push);for(let j=0;j<queue.length;j++){const i=queue[j];for(let k=offsets[i];k<offsets[i+1];k++)push(edges[k]);for(const b of native.get(i)??[]){entries.add(b);push(b);}}
const calls=natural.filter(c=>reached[c.id]),missing=[...unresolved].filter(([i])=>reached[i]).map(([id,x])=>({id,...x}));
const groups={};for(const c of calls){const k=String(c.y);(groups[k]??=[]).push(c.id);}
let second=0;const nodes=[];const sourceBodies=[...native].filter(([i])=>reached[i]);const d2=createHash('sha256');const g2=fs.createReadStream(path.join(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip());g2.on('data',x=>d2.update(x));first=true;
for await(const line of readline.createInterface({input:g2,crlfDelay:Infinity})){if(first){first=false;continue;}if(reached[second])nodes.push([second,JSON.parse(line)]);second++;}
assert.equal(second,N);assert.equal(d2.digest('hex'),hash);
const result={schema:'MathScope.Y.N4.CurrentPressure.TypedReachability/1',graphSHA256:hash,registrySHA256:regHash,roots,scope:'N4 raw-base current/pressure and selector roots only; synthetic empty coupled registry, not a Forced/FiveMap export; static over-approximation including inactive branches.',nativeRegistryCounts:registry.counts,covarianceProvenance:registry.covarianceProvenance,visitedNodes:queue.length,nativeDefinitionEntries:entries.size,rawNaturalNodes:natural.length,reachedNaturalCalls:calls.length,groups,unresolvedReachedNative:missing,calls,nodes,sourceBodies};
fs.writeFileSync(out,JSON.stringify(result));console.log(JSON.stringify({visitedNodes:queue.length,nativeDefinitionEntries:entries.size,rawNaturalNodes:natural.length,reachedNaturalCalls:calls.length,distinctYArguments:Object.keys(groups).length,unresolved:missing.length,scope:result.scope}));
