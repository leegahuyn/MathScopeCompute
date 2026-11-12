/** Verify lookup layering and compare both real fork constructors. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,output]=process.argv.slice(2);
assert(runtime && output);
const load=(scope,file)=>import(pathToFileURL(resolve(runtime,'research-ide',scope,'navier',file)).href);
const [
  {ActualConvergentExpressions},
  {ActualInductionExpressions},
  {GlobalSourceExpressions},
  {compactOwnedLookup,forkOwnedLookup,canForkOwnedLookup},
  {captureNodes,captureRawNodes},
]=await Promise.all([
  load('mathscope-m2','actual-continuation-exact-functions.mjs'),
  load('mathscope-m2','actual-residual-order-induction-expressions.mjs'),
  load('mathscope-m3','source-global-expressions.mjs'),
  load('mathscope-m2','mathscope-owned-lookup.mjs'),
  load('mathscope-m2','mathscope-large-seal.mjs'),
]);
const key=(op,...args)=>JSON.stringify([op,args]);
const prefix=new Map([[key('add',0,1),0],[key('multiply',0,1),1]]);
const parent=compactOwnedLookup(prefix,2);
const fork=forkOwnedLookup(parent,2);
assert.deepEqual([...fork],[...prefix]);
parent.set(key('add',1,2),2);
assert.equal(fork.has(key('add',1,2)),false);
assert.equal(fork.size,2);
fork.set(key('multiply',1,2),2);
fork.set(key('add',1,2),3);
assert.equal(parent.get(key('multiply',1,2)),undefined);
assert.equal(parent.get(key('add',1,2)),2);
assert.equal(fork.get(key('add',1,2)),3);
assert.deepEqual([...new Map(fork).values()],[0,1,2,3]);
assert.deepEqual([...fork.values()],[0,1,2,3]);
assert.throws(()=>parent.set(key('add',0,1),5),/captured/);
assert.throws(()=>parent.delete(key('add',0,1)),/captured/);
assert.throws(()=>fork.set(key('add',3,4),5),/Nonconsecutive/);
assert.throws(()=>fork.set(key('add',0,1),4),/replace/);
assert.throws(()=>compactOwnedLookup(new Map([['x',1]]),1),/node-ID order/);

const native=new ActualConvergentExpressions(), x=native.fresh('owned_fork_x'), y=native.fresh('owned_fork_y');
const fx=native.mul(x,native.exp(native.mul(x,y)));
const f=native.integral(fx,x,native.zero,y);
const originalPrefix=native.nodes.length, source={x,y,fx,f};
const constructors={m2:ActualInductionExpressions,m3:GlobalSourceExpressions};
function run(Constructor,base) {
  const G=new Constructor(base,{maxNodes:500_000,maxDerivativeOrder:128});
  const z=G.fresh('owned_fork_z');
  const roots=[G.derivative(source.f,source.y),G.substitute(source.f,source.y,source.x),
    G.derivative(source.fx,source.x),G.add(z,source.fx)];
  return {G,roots};
}
const ordinary=Object.fromEntries(Object.entries(constructors).map(([name,C])=>[name,run(C,native)]));
native.lookup=compactOwnedLookup(native.lookup,native.nodes.length);
const results={};
for(const [name,C] of Object.entries(constructors)){
  const {G,roots}=run(C,native),reference=ordinary[name];
  assert(canForkOwnedLookup(G.lookup));
  assert.strictEqual(G.nodes[0],native.nodes[0]);
  assert.deepEqual(roots,reference.roots);
  assert.deepEqual(G.nodes,reference.G.nodes);
  assert.deepEqual(G.captureFunctionDefinitions(),reference.G.captureFunctionDefinitions());
  assert.deepEqual([...G.lookup],[...reference.G.lookup]);
  results[name]={nodes:G.nodes.length,roots,graphSHA256:createHash('sha256')
    .update(JSON.stringify(G.nodes)).digest('hex')};
}
assert.equal(native.nodes.length,originalPrefix);
const snap=captureNodes(native.nodes), sameSnap=captureNodes(native.nodes);
assert.strictEqual(snap.detached(),sameSnap.detached());
const child=snap.fork();
const raw=captureRawNodes(native.nodes);
const original=native.nodes[0];
native.nodes[0]={args:[...original.args],op:original.op};
assert(snap.verify(native.nodes));
assert.equal(raw.verify(native.nodes),false);
native.nodes[0]={...original,args:['999','1']};
assert.equal(snap.verify(native.nodes),false);
assert(snap.verify(child));
native.nodes[0]=original;
assert(raw.verify(native.nodes));
native.fresh('only_parent_append');
assert(snap.verify(native.nodes));
assert.equal(snap.verify(native.nodes,true),false);
assert.equal(child.length,originalPrefix);
const result={status:'VERIFIED_ORIGINAL_FORK_CONSTRUCTOR_AND_INTERN_PARITY',originalPrefix,results,
  controls:['parent append hidden','independent child ID','captured parent key mutation','wrong new ID',
    'raw key reordering','source record value mutation','append captured prefix'],release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('PASS original M2/M3 native fork constructor and intern equality');
