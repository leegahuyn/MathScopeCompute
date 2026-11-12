import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {canonicalEmit,canonicalHash,canonicalClone,makeSnapshot,captureNodePrefix,compareNodePrefixes} from './large_pack.mjs';
import {pinRuntime} from '../compact-lookup/pin_runtime.mjs';

const [runtime]=process.argv.slice(2);assert(runtime);
await pinRuntime(runtime);
const {canonicalStringify}=await import(pathToFileURL(resolve(runtime,'research-ide/mathscope-m0/contracts.mjs')).href);
const emitted=x=>{let out='';canonicalEmit(x,s=>out+=s);return out};
const samples=[null,true,false,0,-0,1.5,'한글\ud800\n',[],{},
  {'10':'ten','2':'two','01':'zero-one',a:{z:[-0,'한글'],a:'text'}},
  {kind:'FLOAT64',value:1e20}, {kind:'STATISTICAL_ESTIMATE',estimate:[1e20,-0],interval:[-1e20,1e20]},
  [{b:3,a:1},[-0,1.25],{'4294967294':'x','4294967295':'y','3':'z'}]];
for(const x of samples){
  assert.equal(emitted(x),canonicalStringify(x));
  assert.equal(canonicalStringify(canonicalClone(x)),canonicalStringify(x));
  const a=canonicalHash(x);assert.equal(a.sha256,createHash('sha256').update(canonicalStringify(x)).digest('hex'));
  assert.equal(a.bytes,Buffer.byteLength(canonicalStringify(x)));
}
let state=0x12345678;
const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state};
function fuzz(depth){
  if(depth===0)return [null,true,false,-0,rand()%1000,'key'+rand()][rand()%6];
  if(rand()%2)return Array.from({length:rand()%5},()=>fuzz(depth-1));
  const x={};for(let i=0,n=rand()%5;i<n;i++)x[['a','12','2','00','k'+rand()][rand()%5]]=fuzz(depth-1);return x;
}
for(let i=0;i<4000;i++){const x=fuzz(4);assert.equal(emitted(x),canonicalStringify(x));}
const cycle={};cycle.self=cycle;const sparse=[];sparse[1]=1;
for(const x of [NaN,Infinity,1n,undefined,2**53,cycle,sparse,new Date(),JSON.parse('{"__proto__":1}')]){
  assert.throws(()=>canonicalStringify(x));assert.throws(()=>canonicalEmit(x,()=>{}));assert.throws(()=>canonicalClone(x));
}
const accessor={get x(){return 1}};assert.equal(canonicalStringify(accessor),'{"x":1}');assert.throws(()=>canonicalEmit(accessor,()=>{}));
const base={nodes:[{op:'rational',args:['0','1']},{op:'test',args:[-0,{b:2,a:1}]}],meta:{z:3,a:[2,1]}};
const original=canonicalStringify(base), snap=makeSnapshot(base,canonicalStringify);
assert.equal(canonicalStringify(snap.program),original);assert(snap.verify(base.nodes,snap.program));
assert.notEqual(snap.program.nodes,base.nodes);assert(Object.isFrozen(base.nodes[0]));assert(Object.isFrozen(base.nodes[0].args));
assert.throws(()=>{base.nodes[0].op='mutated'});
assert.equal(Object.is(snap.program.nodes[1].args[0],-0),false);
base.nodes.push({op:'new',args:[]});assert(snap.verify(base.nodes,snap.program));
// Canonically equal replacement remains accepted, like the original seal.
base.nodes[0]={args:['0','1'],op:'rational'};assert(snap.verify(base.nodes,snap.program));
base.nodes[0].args[0]='9';assert.equal(snap.verify(base.nodes,snap.program),false);
base.nodes[0]={op:'rational',args:['0','1']};assert(snap.verify(base.nodes,snap.program));
assert.throws(()=>{snap.program.nodes[0]={op:'rational',args:['9','1']}});
snap.program.nodes=[{op:'rational',args:['9','1']},snap.program.nodes[1]];assert.equal(snap.verify(base.nodes,snap.program),false);
snap.program.nodes=[{op:'rational',args:['0','1']},snap.program.nodes[1]];assert(snap.verify(base.nodes,snap.program));
snap.program.meta.z=99;assert.equal(snap.verify(base.nodes,snap.program),false);
const shallow=Object.freeze({op:'x',args:[1]});const s2=makeSnapshot({nodes:[shallow]},canonicalStringify);
assert(Object.isFrozen(shallow.args));assert.throws(()=>{shallow.args[0]=2});assert(s2.verify([shallow],s2.program));
const r=[{op:'p',args:[-0]}],rs=captureNodePrefix(r,JSON.stringify);
assert(rs.verify([{op:'p',args:[0]}]));assert.equal(rs.verify([{args:[0],op:'p'}]),false);
assert(compareNodePrefixes([{args:[0],op:'p'}],[{op:'p',args:[0]}],1,canonicalStringify));
assert.equal(compareNodePrefixes([{op:'p',args:[1]}],[{op:'p',args:[0]}],1,canonicalStringify),false);
console.log(JSON.stringify({status:'PASS_CANONICAL_STREAM_CLONE_SNAPSHOT_AND_MUTATION_CONTROLS',
  cases:samples.length,deterministicFuzz:4000,invalidControls:9,accessorExplicitlyRejected:true,
  nodeReplacementControls:true,appendOnlyPrefix:true,mutationDetection:true,scope:'Prototype only; no original source issuer has been modified.',release:'HOLD'}));
