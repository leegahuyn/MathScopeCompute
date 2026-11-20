/** Read the authenticated original C132 stream with actual typed native edges. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {pathToFileURL} from 'node:url';
import {createGunzip} from 'node:zlib';

const [artifactDir, readerDir, priorReport, out, expanded]=process.argv.slice(2);
assert.ok(artifactDir && readerDir && priorReport && out, 'artifact, exact-reader directory, prior N3 report and output required');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function pinned(file, expected) {
  const bytes=fs.readFileSync(file);
  assert.equal(digest(bytes),expected,file);
  return bytes;
}
const pins={
  childReader:'9550f01d644c23a95a06f3bd21fc33501aa93a8506ff8f3c2382671e1b732a7c',
  nativeReader:'35251a920f9a97c79fc7d462583d10c59e4bc32ed305cadf1d01e03de8cf947b',
  manifest:'04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2',
  candidate:'b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e',
  registry:'62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce',
  stream:'7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2',
  priorN3:'de72c8e11e00208055d1b5851220978592b6341e46588e70be3910f092e8fc1e'
};
const types=path.join(readerDir,'exact_original_node_children.mjs');
const definitions=path.join(readerDir,'original_native_semantic_definitions.mjs');
pinned(types,pins.childReader);
pinned(definitions,pins.nativeReader);
const {exactOriginalSourceNodeChildren: children}=await import(pathToFileURL(types).href);
const {loadOriginalExtendedNativeRegistry: load,nativeSemanticDefinitionEdges: definitionEdges}=await import(pathToFileURL(definitions).href);
const graph=path.join(artifactDir,'active-n3-repeat-forced-source');
const manifest=JSON.parse(pinned(path.join(graph,'original-source-export-manifest.json'),pins.manifest));
const candidate=JSON.parse(pinned(path.join(artifactDir,'active-n3-repeat-forced-candidate.json'),pins.candidate));
const registry=load(JSON.parse(pinned(path.join(graph,'original-source-functions.json'),pins.registry)));
const prior=JSON.parse(pinned(priorReport,pins.priorN3));
const N=22380596;
assert.equal(manifest.node_count,N);
assert.equal(manifest.node_stream_sha256,pins.stream);
assert.equal(manifest.definitions_sha256,pins.registry);
assert.equal(manifest.function_registry_capture_kind,'EXTENDED_COUPLED_FACADE');
assert.deepEqual(registry.counts.coupled,[2269,29,2,60,0]);
assert.deepEqual(manifest.original_root_ids,candidate.rootIds);
assert.equal(candidate.rootIds.length,1444);
assert.deepEqual(candidate.precedingConservativeResidual,[22153560,22153562,22153564]);
assert.equal(candidate.preRepeatNodeCount,22155584);
assert.equal(candidate.systems.length,40);

// Stream the original nodes into compact typed adjacency. Primitive AST
// children precede their parents; native definition edges may revisit roots.
const stride=2**20;
const offsets=new Uint32Array(N+1),chunks=[];
let edges=0;
function pushEdge(node) {
  assert.ok(Number.isSafeInteger(node)&&node>=0&&node<N,'node id outside original stream');
  const i=(edges/stride)|0;
  if(i===chunks.length)chunks.push(new Uint32Array(stride));
  chunks[i][edges++&(stride-1)]=node;
}
function edgeAt(i){return chunks[(i/stride)|0][i&(stride-1)];}
const naturals=[], natives=[], unresolved=[];
const nativeCache=new Map();
const hist={};
const stream=fs.createReadStream(path.join(graph,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
const streamHash=createHash('sha256');
let byteLength=0;
stream.on('data',bytes=>{streamHash.update(bytes);byteLength+=bytes.length;});
let i=-1;
for await (const line of readline.createInterface({input:stream,crlfDelay:Infinity})) {
  if(i===-1){
    assert.equal(JSON.parse(line).node_count,N);
    i=0;
    continue;
  }
  const node=JSON.parse(line);
  hist[node.op]=(hist[node.op]??0)+1;
  offsets[i]=edges;
  for(const child of children(node)) {
    assert.ok(child<i,`AST edge ${i}->${child} is not causal`);
    pushEdge(child);
  }
  if(node.op==='actual_natural_series'){
    const [component,y,eta,k,m]=node.args;
    naturals.push({id:i,component,y,eta,k,m});
  } else if(node.op.startsWith('actual_')||node.op.startsWith('m3_')) {
    const owner=node.args[0];
    const key=`${node.op}:${owner}`;
    let d=nativeCache.get(key);
    if(d===undefined) {
      d=definitionEdges(node,registry);
      nativeCache.set(key,d);
    }
    if(d?.resolved) for(const root of d.bodyRoots)pushEdge(root);
    else unresolved.push({i,op:node.op,owner,detail:d?.blocker??'no typed definition rule'});
    if(node.op==='m3_forced_pulse_partial' || node.op==='m3_coupled_indexed_partial' ||
        node.op==='m3_coupled_expression_partial' || node.op==='m3_coupled_inverse_partial' ||
        node.op==='actual_background_even_profile' || node.op==='actual_background_picard' ||
        node.op==='actual_monotone_root') natives.push([i,node.op,owner]);
  }
  i++;
}
offsets[i]=edges;
assert.equal(i,N);
assert.equal(byteLength,manifest.node_stream_uncompressed_bytes);
assert.equal(streamHash.digest('hex'),pins.stream);
assert.deepEqual(hist,manifest.operation_histogram);
assert.equal(naturals.length,3268);

const visited=new Uint8Array(N),queue=new Uint32Array(N);
let length;
function mark(roots,flag){
  length=0;
  function visit(node){
    if(visited[node]&flag)return;
    visited[node]|=flag;
    queue[length++]=node;
  }
  for(const root of roots)visit(root);
  for(let j=0;j<length;j++){
    const node=queue[j];
    for(let k=offsets[node];k<offsets[node+1];k++)visit(edgeAt(k));
  }
  const nativeByOp={}, ownersByOp={};
  for(const [n,op,owner] of natives) if(visited[n]&flag){
    nativeByOp[op]=(nativeByOp[op]??0)+1;
    (ownersByOp[op]??=new Set()).add(owner);
  }
  return {nodes:length,roots:roots.length,
    naturalCalls:naturals.filter(({id})=>visited[id]&flag).length,
    unresolved:unresolved.filter(({i})=>visited[i]&flag),
    nativeApplications:nativeByOp,
    nativeOwners:Object.fromEntries(Object.entries(ownersByOp).map(([op,owners])=>[op,[...owners].sort()]))};
}
const before=mark(candidate.precedingConservativeResidual,1);
const after=mark(candidate.rootIds,2);
assert.equal(before.unresolved.length,0);
assert.equal(after.unresolved.length,0);
assert.ok(after.nodes>=before.nodes);
const calls=naturals.filter(({id})=>visited[id]&2).map(c=>({...c,inPrecedingResidual:!!(visited[c.id]&1)}));
assert.equal(after.naturalCalls,calls.length);
assert.equal(prior.certifiedRangeCount,582);
assert.equal(prior.openRangeCount,0);
const priorCalls=new Map(prior.newly.map(x=>[x.id,x]));
const previouslyKnown=calls.filter(c=>{
  const p=priorCalls.get(c.id);
  return p && p.component===c.component && p.y===c.y && p.eta===c.eta && p.k===c.k && p.m===c.m;
}).length;
assert.equal(previouslyKnown,calls.length);
const groups={};
for(const call of calls)(groups[call.y]??=[]).push(call.id);
const result={schema:'MathScope.Y.ActiveN3.LiteralCallReachability/1',status:'VERIFIED_FIXED_ACTIVE_LITERAL_REACH_NATIVE_RANGE_TRANSPORT_OPEN',
  pins,graphNodes:N,nativeRegistryCounts:registry.counts,covarianceProvenance:registry.covarianceProvenance,
  rawNaturalNodes:naturals.length,totalTypedEdges:edges,
  before,after,distinctYArgumentRoots:Object.keys(groups).length,groups,calls,
  appendedNaturalCalls:calls.filter(c=>c.id>=candidate.preRepeatNodeCount).map(c=>c.id),
  newToRootReach:calls.filter(c=>!c.inPrecedingResidual).map(c=>c.id),
  exactTypedDescriptorMatchesInRawOnlyN3:previouslyKnown,
  scope:'All 1444 exact manifest roots, both sides of all branches, typed original owner definition bodies, no call-frame range or derivative materialization claim.',
  finalJets:0,release:'HOLD'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
if(expanded) {
  const read=fs.createReadStream(path.join(graph,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
  const verify=createHash('sha256');
  read.on('data',bytes=>verify.update(bytes));
  let id=-1;
  const nodes=[],sourceBodies=[];
  for await (const line of readline.createInterface({input:read,crlfDelay:Infinity})){
    if(id>=0 && (visited[id]&2)){
      const n=JSON.parse(line);
      nodes.push([id,n]);
      const native=nativeCache.get(`${n.op}:${n.args[0]}`);
      if(native?.resolved)sourceBodies.push([id,native.bodyRoots]);
    }
    id++;
  }
  assert.equal(id,N);
  assert.equal(nodes.length,after.nodes);
  assert.equal(verify.digest('hex'),pins.stream);
  fs.writeFileSync(expanded,JSON.stringify({roots:candidate.rootIds,nodes,sourceBodies,calls,graphSHA256:pins.stream,registrySHA256:pins.registry}));
}
console.log(JSON.stringify({nodes:after.nodes,before:before.naturalCalls,after:after.naturalCalls,
  distinctYArgumentRoots:result.distinctYArgumentRoots,append:result.appendedNaturalCalls.length,
  newToRootReach:result.newToRootReach.length},null,2));
