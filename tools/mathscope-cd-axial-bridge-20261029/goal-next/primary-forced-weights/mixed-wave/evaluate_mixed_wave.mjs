import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length,6,'Use GOAL_NEXT ARITHMETIC_RUNTIME MIXED_WAVE_JSON OUT_JSON');
const [, ,goal,runtime,mixedPath,out]=process.argv;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const pin='e6cfd19055479fbcb43dddcd17ae05ddc3fb075eb911620f485dfb7d29c6fe70';
const files={
  wave:[mixedPath,pin],
  lower:[resolve(goal,'whole-k-annular-pressure-lower/lower-covariance-pressure.json'),'5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  fixed:[resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  fullSlow:[resolve(goal,'primary-forced-weights/full-slow-norms/full-slow-norms.json'),'517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'],
  threshold:[resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const helperSHA='4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47';
assert.ok(![...Object.values(files).map(([path])=>path),helper].some(path=>resolve(path)===resolve(out)));
assert.equal(digest(await readFile(helper)),helperSHA,helper);
const {load,sourceArithmetic}=await import(pathToFileURL(helper).href);
const input=Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name,[path,sha]])=>[name,await load(path,sha)])));
const {wave,lower,fixed,fullSlow,threshold}=input;
assert.equal(wave.source.graphSHA256,lower.sourceSHA256);
assert.equal(wave.source.registrySHA256,lower.nativeRegistrySHA256);
assert.equal(fixed.sourceSHA256,lower.sourceSHA256);
assert.equal(fullSlow.status,'VERIFIED_ORIGINAL_FULL_R_Z_T_BOUNDS_ON_THE_FIXED_PHYSICAL_SLAB');
assert.deepEqual(fullSlow.domain.axes,['R','Z','T']);
const background=Object.fromEntries(fullSlow.backgroundC8.flatMap(row=>['F','G'].map(name=>[row.originalDirectionalRoots[name],row[name]])));
const target=Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row=>row.originalDirectionalRoots.map((id,index)=>[id,row.component[index]])));
assert.deepEqual([Object.keys(background).length,Object.keys(target).length],[18,16]);
const external={'hosted-original':fixed.hostedOriginal,'fixed-radial':fixed.fixedRadial,'background-c8':background,'target-c7':target};
const namespaceMap={'archived-original':'hosted-original','archived-background-c8':'background-c8'};
const graph=[...lower.nodes],aliases=[];
for(const [i,node] of wave.nodes.entries()){
  if(node.op==='authenticated_source_norm_root'){
    const [ns,id]=node.args;
    if(ns==='archived-lower-positive'){
      assert.ok(Number.isSafeInteger(id)&&0<=id&&id<lower.nodes.length);
      aliases.push(id);
      continue;
    }
    assert.ok(namespaceMap[ns]);
    graph.push({op:node.op,args:[namespaceMap[ns],id]});
  }else if(node.op==='rational')graph.push(node);
  else{
    const mapID=id=>{
      assert.ok(Number.isSafeInteger(id)&&0<=id&&id<i);
      return aliases[id];
    };
    const args=node.op==='integer_power'?[mapID(node.args[0]),node.args[1]]:node.args.map(mapID);
    graph.push({op:node.op,args});
  }
  aliases.push(graph.length-1);
}
const waveRoots=[...new Set(wave.roots.results.flatMap(row=>[...row.real,...row.imaginary,row.pressure]))].sort((a,b)=>a-b);
const {N,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const parameters=new Map(),visited=new Set();
function visit(id){
  if(visited.has(id))return;
  visited.add(id);
  const {op,args}=graph[id];
  if(op==='authenticated_source_norm_root'){
    const [ns,root]=args,key=args.join('/');
    if(parameters.has(key))return;
    const bounds=external[ns]?.[root];
    assert.ok(bounds,key);
    if(key==='hosted-original/300170'){
      assert.equal(bounds.lower.rational,String(1n<<128n));
      parameters.set(key,N.fromClosed({lower:{exp:{rational:'64'}},upper:bounds.upper}));
    }else parameters.set(key,N.fromClosed(bounds));
    return;
  }
  if(op==='integer_power')visit(args[0]);
  else if(op!=='rational')args.forEach(visit);
}
waveRoots.forEach(root=>visit(aliases[root]));
const nodes=[...visited].sort((a,b)=>a-b).map(id=>{
  const node=graph[id];
  return {id,node:node.op==='authenticated_source_norm_root'?{op:'source_parameter',args:[node.args.join('/')]}:node};
});
const interpreter=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:[]},N,{parameters});
const upperEndpoints={};
for(const root of waveRoots){
  try{
    const interval=N.toClosed(interpreter.value(aliases[root]));
    assert.equal(N.compareEndpoints(interval.upper,{rational:'0'}),1,String(root));
    upperEndpoints[root]=interval.upper;
  }catch(error){
    throw new Error(`Wave bound #${root} failed: ${error.code??error.name}: ${error.message}`,{cause:error});
  }
}
const trace=interpreter.report();
assert.equal(trace.visitedNodes,visited.size);
assert.equal(trace.sourceParametersNumericallyConsumed.length,parameters.size);
const receipt={
  schema:'MathScope.ArchivedPrimaryWeightedMixedWaveNumerical/1',
  status:'VERIFIED_DIRECTED_UPPER_ENDPOINTS_FOR_ARCHIVED_WEIGHTED_WAVE',
  originalGraphSHA256:wave.source.graphSHA256,registrySHA256:wave.source.registrySHA256,
  inputPins:Object.fromEntries(Object.entries(files).map(([name,[,sha]])=>[name,sha])),
  numericalHelperSHA256:helperSHA,domain:fullSlow.domain,
  arithmetic:N.report(),trace,
  appliedBounds:{throughOrder:4,exactOriginalIndexCount:wave.roots.results.length,uniqueUpperRoots:waveRoots.length,
    exponents:wave.epsilonExponents,epsilonDenominator:wave.epsilonDenominator,envelope:wave.envelope,
    rows:wave.roots.results.map(({orders,real,imaginary,pressure,poles})=>({orders,real,imaginary,pressure,poles})),upperEndpoints},
  method:'Same exact old R,Z and newer full R,Z,T root namespaces. For every imported old background or target upper norm the full-slow endpoint is a valid enlargement. Existing dimension factors in the positive graph are retained.',
  scope:'Conditional on the original archived slab and same-label analytic premises of the positive graph. No live private-family, whole-band application, or final-jet increment.',
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,roots:waveRoots.length,visited:visited.size,leaves:parameters.size,SHA256:digest(await readFile(out))}));
