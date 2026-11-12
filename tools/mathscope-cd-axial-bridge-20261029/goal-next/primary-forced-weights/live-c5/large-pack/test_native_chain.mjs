/** Differential check of the original same-family path at a small order. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [mode,runtime,output]=process.argv.slice(2);
assert(['original','bounded'].includes(mode) && runtime && output);
const load=(scope,file)=>import(pathToFileURL(resolve(runtime,'research-ide',scope,file)).href);
const m2=file=>load('mathscope-m2/navier',file);
const m3=file=>load('mathscope-m3/navier',file);
const [
  {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily},
  {assertActualCommonTargetWeightedNorms},
  {attachGlobalSourceBand,assertGlobalSourceBand},
  {attachGlobalFixedRepresentative,assertGlobalFixedRepresentative},
  {attachGlobalCurrentState,assertGlobalCurrentState},
  {attachGlobalPrimaryClassOperator,assertGlobalPrimaryClassOperator},
  {canonicalStringify},
]=await Promise.all([
  m2('actual-common-admissible-family.mjs'),m2('actual-common-target-weighted-norms.mjs'),
  m3('source-global-band.mjs'),m3('source-global-representative.mjs'),
  m3('source-global-current.mjs'),m3('source-primary-class-majorants.mjs'),
  load('mathscope-m0','contracts.mjs'),
]);
const context={onProgress(row) {
  if (row.stage?.includes('sealed')) console.log(row.stage,row.nodeCount);
}};
let installed=0, owned;
if (mode==='bounded') {
  owned=await m2('mathscope-owned-lookup.mjs');
  context.compactNormCaches=graph=>{
    assert.equal(installed++,0);
    graph.lookup=owned.compactOwnedLookup(graph.lookup,graph.nodes.length);
    graph.derivatives=owned.compactDerivativesFromLegacy(graph.derivatives);
  };
}
const digest=text=>createHash('sha256').update(text).digest('hex');
function graphIdentity(graph) {
  const hash=createHash('sha256');
  for (const node of graph.nodes) hash.update(JSON.stringify(node)+'\n');
  return {nodes:graph.nodes.length,rawNodeSHA256:hash.digest('hex'),
    registrySHA256:digest(canonicalStringify(graph.captureFunctionDefinitions()))};
}
const attestations={};
function stage(name,make,verify,roots) {
  console.log(name);
  const value=make();
  assert.equal(verify(value),true);
  attestations[name]={...graphIdentity(value.G),roots:roots(value),checks:value.checks?.map(({id,pass})=>[id,pass])??[]};
  return value;
}
const family=stage('family',()=>prepareActualCommonAdmissibleFamily({
  throughOrder:2,derivativeOrder:3,maxNodes:3_500_000,maxProfileJets:60_000,maxJetRequests:600_000,
},context),assertActualCommonAdmissibleFamily,x=>x.roots);
const band=stage('band',()=>attachGlobalSourceBand(family,{coefficientOrder:1,maxNodes:3_500_000},context),
  assertGlobalSourceBand,x=>x.roots);
const representative=stage('representative',()=>attachGlobalFixedRepresentative(band,context),
  assertGlobalFixedRepresentative,x=>x.roots??x.selection??null);
const current=stage('current',()=>attachGlobalCurrentState(representative,context),
  assertGlobalCurrentState,x=>x.roots);
const target=stage('target',()=>family.constructTargetWeightedNorms({
  derivativeOrder:2,maxNodes:3_500_000,maxJetRequests:600_000,
},context),assertActualCommonTargetWeightedNorms,x=>x.roots);
const primary=stage('primary',()=>attachGlobalPrimaryClassOperator(current,target,{order:0,maxWork:200_000},context),
  assertGlobalPrimaryClassOperator,x=>({K:x.bounds.K,rows:x.bounds.rows}));
assert.strictEqual(current.band.family,family);
assert.strictEqual(target.family,family);
assert.strictEqual(primary.current,current);
assert.strictEqual(primary.target,target);
if (mode==='bounded') {
  assert.equal(installed,1);
  assert(owned.canForkOwnedLookup(target.G.lookup));
  assert(owned.canForkOwnedLookup(band.G.lookup));
  assert.strictEqual(target.G.nodes[0],family.G.nodes[0]);
  assert.strictEqual(band.G.nodes[0],family.G.nodes[0]);
}
const originalNode=family.G.nodes[0];
family.G.nodes[0]={...originalNode,args:['2','1']};
assert.throws(()=>assertActualCommonAdmissibleFamily(family),{code:'INVALID_SOURCE_CONSTRUCTION'});
family.G.nodes[0]=originalNode;
const originalProgram=family.program.nodes;
const changed=originalProgram.slice();
changed[0]={...changed[0],args:['2','1']};
family.program.nodes=changed;
assert.throws(()=>assertActualCommonAdmissibleFamily(family),{code:'INVALID_SOURCE_CONSTRUCTION'});
family.program.nodes=originalProgram;
assert.equal(assertActualCommonAdmissibleFamily(family),true);
const result={status:'VERIFIED_NATIVE_LOW_ORDER_SAME_FAMILY_CHAIN',mode,attestations,
  installedOwnedLookup:installed,graphMutationRejected:true,programMutationRejected:true,
  scope:'Original fixed N1 source family with C3 background, C2 weighted target and Primary order zero.',release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n');
